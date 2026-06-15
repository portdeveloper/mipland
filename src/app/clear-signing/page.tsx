import type { Metadata } from "next";
import ClearSigningPage from "@/components/clear-signing/ClearSigningPage";

export const metadata: Metadata = {
  title: "Clear Signing on Monad",
  description:
    "See Clear Signing (ERC-7730) render a real Monad transaction in your wallet. Trigger a live MetaMask signature on Monad mainnet and watch the human-readable view, instead of raw hex.",
  openGraph: {
    title: "Clear Signing on Monad | MIP Land",
    description:
      "Trigger a live MetaMask signature on Monad and see the human-readable Clear Signing render. No hex, no blind signing.",
  },
};

export default function Page() {
  return <ClearSigningPage />;
}
