# MIP chat widget

Floating chat button on the site, with full control over knowledge and replies.
Code is in place; infra wiring is documented in [`SETUP.md`](./SETUP.md).

## How it works

```
content/mips/*.md
  └─► src/lib/ai/knowledge.ts          (concatenates + memoizes)
                                       │
src/lib/ai/config.ts ──► Edge Config   │
  (DEFAULT_CONFIG fallback)            │
                                       ▼
src/app/api/chat/route.ts ──► streamText(model from config, system = prompt + knowledge)
   ▲                            ▲
   │ rate-limit (in-memory)     │ gateway: { caching: 'auto' }  (provider-correct markers)
   │
src/components/MipChat.tsx ──► useChat({ api: "/api/chat" })
   (mounted globally in src/app/layout.tsx)

src/app/admin/chat/page.tsx ──► Server Action ──► Vercel REST API ──► Edge Config
   (gated by HTTP Basic Auth in src/middleware.ts)
```

## Locked-in decisions

- **Knowledge source:** local markdown in `content/mips/` (one file per MIP +
  `glossary.md` + `_overview.md`); authored/edited in this repo.
- **Corpus scale:** small — stuff everything into the system prompt each
  request. No RAG. Re-evaluate past ~30k tokens.
- **Reply control:** runtime-editable from `/admin/chat`, backed by Vercel Edge
  Config under the key `chat`.
- **Admin auth:** HTTP Basic Auth in `src/middleware.ts`, scoped to
  `/admin/:path*`. Password from `ADMIN_PASSWORD` env. Fails closed in
  production if the env is missing; fails open in dev for local convenience.
  (Vercel's Deployment Protection only supports whole-deployment gating on
  our plan — can't scope to `/admin/*` — hence the small code-level gate.)
- **Default model:** `deepseek/deepseek-v4-pro` with `thinking: { type: 'disabled' }`
  (v4-pro is a reasoning model; we explicitly skip CoT for short factual MIP
  Q&A). Switchable to any Gateway model via Edge Config without a deploy.
- **UI primitives:** shadcn (manually initialized — `globals.css` keeps the
  existing MIP palette, shadcn tokens appended alongside) + AI Elements
  (`conversation`, `message`, `prompt-input`).

## Cost controls (baked in)

- **Prompt caching** via `providerOptions.gateway.caching: 'auto'`. The Gateway
  applies the provider-correct cache mechanism (Anthropic ephemeral markers,
  DeepSeek implicit context cache, etc.) without per-provider plumbing in the
  route. Cached input cost is ~1% of cold input on most providers.
- **`maxTokens` cap** on responses (default 600).
- **Per-IP rate limit** in `route.ts` via an in-memory token bucket (10
  req/min, burst 10). Map-backed, persists across requests on the same Fluid
  Compute instance. Imprecise when Vercel scales out (effective limit is
  `10/min × N_instances`) — swap to a shared store if abuse becomes real.
- **Admin-tunable model** — switch the `model` field in Edge Config to any
  Gateway slug (e.g. `deepseek/deepseek-v4-flash` for ~3x cheaper than v4-pro,
  or back to `anthropic/claude-sonnet-4-6` if quality dips).

## Cost controls (deferred until real traffic)

- **Vercel BotID** on `/api/chat` — block scrapers/headless bots at the edge.
- **Keyword pre-filter** if `content/mips/` grows past ~30k tokens — match
  the question against MIP titles/summaries before injecting files.

## Back-of-envelope cost

20k-token knowledge bundle, ~500-token answers, 250 questions/day (~7.5k/mo).
Gateway pricing as of 2026-05; `input_cache_read` is the cached-input rate.

| Model                          | Per question (cold) | Per question (cache hit) | Per month (mixed) |
| ------------------------------ | ------------------- | ------------------------ | ----------------- |
| `deepseek/deepseek-v4-pro`     | ~$0.0091            | ~$0.0005                 | ~$5–$70           |
| `deepseek/deepseek-v4-flash`   | ~$0.0029            | ~$0.0002                 | ~$2–$22           |
| `anthropic/claude-sonnet-4-6`  | ~$0.07              | ~$0.015                  | ~$110–$510        |

Month range = "every request cold" (top) to "cache hits dominate" (bottom).
Real traffic lands in between depending on how clustered visits are within the
5-min cache TTL.
