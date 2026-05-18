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
| `UPSTASH_REDIS_REST_URL`     | local + prod  | per-IP rate limit (else: no-op)         |
| `UPSTASH_REDIS_REST_TOKEN`   | local + prod  | same                                    |

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

## 4. Upstash Redis — rate limiter

Used by `src/lib/ai/ratelimit.ts` for a 10 req/min/IP token bucket. If env vars
are missing, the limiter is a no-op (every request passes). Fine for dev; not
fine for a public endpoint.

### Install via Marketplace

```
Vercel dashboard → Storage → Marketplace → Upstash Redis → Add Integration.
Pick this project. Auto-injects UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
```

Then `vercel env pull .env.local` again to pick them up locally.

The free tier (10k commands/day) is generous for this traffic shape.

---

## 5. Deployment Protection — gate `/admin/*`

The admin page has **no auth in code**. It relies on Vercel Deployment
Protection to gate the URL.

```
Vercel dashboard → Project → Settings → Deployment Protection →
  Vercel Authentication: enabled for Production
  OR
  Password Protection: set a password (simplest for a single editor)
```

If you want to restrict only `/admin/*` and leave the rest of the site public,
use **Protection Bypass for Automation** + a path-scoped rule. The simplest
single-editor setup is "Password Protection: production only" — visitors get
prompted once at the project's edge before the admin route resolves.

> Verify the gate works *before* setting `VERCEL_API_TOKEN` in production. The
> page would otherwise be live and writable by anyone who guessed the URL.

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
