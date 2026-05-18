# MIP Chat infra setup

The chat widget will run with no infra at all — the AI Gateway call is the only
hard dependency. Everything else degrades gracefully (defaults, no-op rate
limiter). This document walks each piece from minimum-to-talk to fully wired.

## TL;DR — env vars

| Var                          | Where         | Required for                            |
| ---------------------------- | ------------- | --------------------------------------- |
| `AI_GATEWAY_API_KEY`         | local only    | `/api/chat` to reach a model in dev     |
| `EDGE_CONFIG`                | local + prod  | runtime config reads (else: defaults)   |
| `EDGE_CONFIG_ID`             | local + prod  | admin writes (auto-parsed from above)   |
| `VERCEL_API_TOKEN`           | local + prod  | admin saves config from `/admin/chat`   |
| `VERCEL_TEAM_ID`             | local + prod  | only if project lives in a team         |
| `ADMIN_PASSWORD`             | prod only     | HTTP Basic Auth on `/admin/*`           |

Pull whatever you've already set on Vercel down into `.env.local`:

```sh
vercel link
vercel env pull .env.local
```

---

## 1. AI Gateway — the only hard dependency

The route uses plain `"anthropic/claude-sonnet-4-6"` strings, which the AI SDK
routes through the Vercel AI Gateway.

- **In production on Vercel**, auth happens automatically via OIDC. You don't
  set anything. The Gateway is enabled by default on all projects.
- **In local dev**, OIDC isn't available. Mint a Gateway key in the Vercel
  dashboard (Project → AI Gateway → API Keys) and add it to `.env.local`:

  ```sh
  AI_GATEWAY_API_KEY=vck_xxxxxxxxxxxx
  ```

Without one of those, every chat request fails with an auth error. There is no
local fallback for this — it's the actual model call.

---

## 2. Edge Config — runtime config store

This stores the editable `chat` key (system prompt, model, refusal text, etc.).
If unset, the chat uses `DEFAULT_CONFIG` from `src/lib/ai/config.ts` and the
admin page shows a "writes are not wired up" banner.

### Create + link

```sh
# In the Vercel dashboard:
#   Storage → Edge Config → Create.
# Then link it to this project (Project → Settings → Storage → Connect).

# Or via CLI:
vercel link
vercel env pull .env.local   # picks up EDGE_CONFIG automatically once linked
```

After linking, `.env.local` will contain something like:

```
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=yyy
```

The admin save action parses the `ecfg_xxx` ID out of this string, so you
**don't** need to set `EDGE_CONFIG_ID` separately. Set it only if you want to
override the parsed value.

### Seed the `chat` key (optional)

The first time you save from `/admin/chat`, the action upserts the key. You can
seed it manually too:

```sh
curl -X PATCH "https://api.vercel.com/v1/edge-config/$EDGE_CONFIG_ID/items" \
  -H "Authorization: Bearer $VERCEL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"operation":"upsert","key":"chat","value":{"model":"anthropic/claude-sonnet-4-6"}}]}'
```

---

## 3. Vercel API token — for admin writes

The Edge Config SDK is read-only; writes go through the REST API.

1. Vercel → Account Settings → Tokens → Create.
2. Scope it to **this project** (least privilege).
3. Add to `.env.local` and to the Vercel env (Project → Settings → Environment
   Variables) for **Preview + Production**:

   ```sh
   VERCEL_API_TOKEN=...
   # Only if the project lives under a team:
   VERCEL_TEAM_ID=team_xxxxxxxxxx
   ```

Without this, the `/admin/chat` form will validate input but the save fails
with a clear "writes not wired up" message.

---

## 4. Rate limiter (no infra)

`src/lib/ai/ratelimit.ts` is an in-memory token bucket (10 req/min/IP, burst
10). State lives in a `Map` on the module — Fluid Compute reuses function
instances, so the counter persists across requests on the same instance. No
env vars, no external service.

Trade-off: each instance has its own counter, so if Vercel scales out to N
instances under burst, the effective limit is `10/min × N`. At this traffic
level (low, bursty around announcements) that's fine. If abuse becomes real,
swap in a shared store — sign up for Upstash directly at upstash.com (free
tier: 500k commands/month), paste `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` into the project env vars, and revert
`ratelimit.ts` to use `Ratelimit.tokenBucket` from `@upstash/ratelimit`.

The right next defense for a public endpoint is **Vercel BotID** (free, GA
since 2025-06) — it blocks scrapers/headless bots at the edge before they
hit `/api/chat`. Add it before the chat goes public.

---

## 5. Admin auth — HTTP Basic Auth in middleware

`src/middleware.ts` gates `/admin/:path*` with HTTP Basic Auth. It reads
`ADMIN_PASSWORD` from env and prompts the browser with the built-in basic
auth dialog. Username is ignored; password is compared in constant time.

Why not Vercel Deployment Protection? On Hobby/Pro plans, Deployment
Protection only gates the *entire* deployment — there's no per-path scoping.
Gating the whole site would auth-wall the public chat widget itself, so we
do the gate in code instead.

Set the password as a sensitive env var in Vercel:

```sh
vercel env add ADMIN_PASSWORD production --value '<your-password>' --yes
vercel env add ADMIN_PASSWORD preview '' --value '<your-password>' --yes
```

Behavior:

- **Production with `ADMIN_PASSWORD` set** → browser prompts for credentials.
- **Production with `ADMIN_PASSWORD` unset** → middleware fails closed; every
  `/admin/*` request gets a 401. A forgotten env var won't accidentally
  expose the admin.
- **Local dev** → middleware fails open if the env is missing, so
  `localhost:3000/admin/chat` works without setting a password.

Verify in an incognito window:

- `https://<your-prod>/` → loads (public site unaffected)
- `https://<your-prod>/admin/chat` → browser auth prompt → correct password
  lets you in, wrong password loops the prompt

---

## 6. Author the knowledge corpus

`content/mips/*.md` ships with placeholder stubs. Replace the `TODO(author)`
sections with the canonical spec text for each MIP.

The whole directory is concatenated into the system prompt on every request.
Watch the size — at roughly **20k tokens** the cost-per-request math (see
CLAUDE.md → Cost controls) starts to apply. Beyond ~30k tokens, switch to the
keyword pre-filter strategy noted there before adding more files.

A quick estimate:

```sh
# rough token count (1 token ≈ 4 chars)
wc -c content/mips/*.md | tail -1 | awk '{print int($1/4)}'
```

---

## Smoke test

After steps 1–4, with the dev server running:

```sh
pnpm dev
```

1. Open the home page. The "Ask about MIPs" pill should appear bottom-right.
2. Open it, type "What is MIP-3?", press Enter. You should get a streamed
   answer.
3. Visit `/admin/chat`. The form should render with the current config (or
   defaults if Edge Config isn't seeded). Change the system prompt, hit Save,
   confirm "Saved." appears.
4. Send another chat — the new system prompt should take effect on the next
   request (no deploy needed).

If step 2 fails with an auth error, you're missing `AI_GATEWAY_API_KEY`. If it
streams a refusal, the knowledge bundle is empty or doesn't mention the topic.
