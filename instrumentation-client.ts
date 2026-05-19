import { initBotId } from "botid/client/core";
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});

initBotId({
  protect: [{ path: "/api/chat", method: "POST" }],
});
