import type { Metadata } from "next";

import { getChatConfig } from "@/lib/ai/config";
import ChatConfigForm from "./ChatConfigForm";

export const metadata: Metadata = {
  title: "Chat config",
  robots: { index: false, follow: false },
};

// Always render fresh so an admin sees the latest config after saves and
// out-of-band edits.
export const dynamic = "force-dynamic";

function hasWriteCredentials(): boolean {
  return Boolean(
    process.env.VERCEL_API_TOKEN &&
      (process.env.EDGE_CONFIG_ID || process.env.EDGE_CONFIG),
  );
}

export default async function AdminChatPage() {
  const config = await getChatConfig();
  const writeReady = hasWriteCredentials();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Chat config</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Edits the runtime config stored in Vercel Edge Config under the{" "}
          <code>chat</code> key. Changes take effect on the next request to{" "}
          <code>/api/chat</code>.
        </p>
      </header>
      <ChatConfigForm initial={config} writeReady={writeReady} />
    </main>
  );
}
