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
   │ rate-limit (Upstash)       │ cache_control: ephemeral on system message
   │
src/components/MipChat.tsx ──► useChat({ api: "/api/chat" })
   (mounted globally in src/app/layout.tsx)

src/app/admin/chat/page.tsx ──► Server Action ──► Vercel REST API ──► Edge Config
   (gated by Deployment Protection — no auth code in repo)
```

## Locked-in decisions

- **Knowledge source:** local markdown in `content/mips/` (one file per MIP +
  `glossary.md` + `_overview.md`); authored/edited in this repo.
- **Corpus scale:** small — stuff everything into the system prompt each
  request. No RAG. Re-evaluate past ~30k tokens.
- **Reply control:** runtime-editable from `/admin/chat`, backed by Vercel Edge
  Config under the key `chat`.
- **Admin auth:** Vercel Deployment Protection on `/admin/*`. No middleware,
  no auth code.
- **Default model:** `anthropic/claude-sonnet-4-6`. Switchable to Haiku via
  Edge Config without a deploy.
- **UI primitives:** shadcn (manually initialized — `globals.css` keeps the
  existing MIP palette, shadcn tokens appended alongside) + AI Elements
  (`conversation`, `message`, `prompt-input`).

## Cost controls (baked in)

- **Prompt caching** on the system message (instructions + knowledge bundle
  combined). `providerOptions.anthropic.cacheControl: { type: 'ephemeral' }` —
  drops repeat-input cost to ~10% of normal. 5 min TTL, refreshed on hit.
- **`maxTokens` cap** on responses (default 600).
- **Per-IP rate limit** in `route.ts` via `@upstash/ratelimit` (10 req/min
  token bucket). No-op when Upstash env vars are absent.
- **Admin-tunable model** — flip Sonnet → Haiku in Edge Config for ~1/3 cost.

## Cost controls (deferred until real traffic)

- **Vercel BotID** on `/api/chat` — block scrapers/headless bots at the edge.
- **Keyword pre-filter** if `content/mips/` grows past ~30k tokens — match
  the question against MIP titles/summaries before injecting files.

## Back-of-envelope cost

Sonnet 4.6, 20k-token knowledge bundle, 250 questions/day:

| Setup                             | Per question | Per month |
| --------------------------------- | ------------ | --------- |
| No caching                        | ~$0.07       | ~$510     |
| With caching                      | ~$0.015      | ~$110     |
| With caching + Haiku fallback     | ~$0.005      | ~$35      |
