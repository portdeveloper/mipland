"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Monad mainnet
const MONAD_CHAIN_ID_HEX = "0x8f"; // 143
const MONAD_PARAMS = {
  chainId: MONAD_CHAIN_ID_HEX,
  chainName: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://rpc.monad.xyz"],
  blockExplorerUrls: ["https://monadscan.com"],
};

// Canonical Permit2 (same address across chains, confirmed deployed on Monad)
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
// Monad USDC (6 decimals) from the canonical token list
const USDC = "0x754704Bc059F8C67012fEd69BC8A327a5aafb603";
// A live Monad swap router, used as the demo spender so the render looks real.
// The signature is generated locally and never broadcast, so this is inert.
const DEMO_SPENDER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getEthereum(): Eth | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eth }).ethereum ?? null;
}

function buildPermitSingle(spender: string) {
  const expiration = 1782864000; // illustrative; signature only, never broadcast
  const sigDeadline = 1782864000;
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" },
      ],
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" },
      ],
    },
    primaryType: "PermitSingle",
    domain: { name: "Permit2", chainId: 143, verifyingContract: PERMIT2 },
    message: {
      details: { token: USDC, amount: "1000000000", expiration, nonce: 0 },
      spender, // connected account: harmless even if broadcast
      sigDeadline,
    },
  };
}

type Status = "idle" | "working" | "signed" | "error";

export default function ClearSigningPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [account, setAccount] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  async function runDemo() {
    const eth = getEthereum();
    if (!eth) {
      setStatus("error");
      setMessage(
        "No EVM wallet detected. Install MetaMask (or another browser wallet) and try again.",
      );
      return;
    }
    try {
      setStatus("working");
      setSignature(null);

      setMessage("Requesting account access…");
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      const from = accounts?.[0];
      if (!from) throw new Error("No account returned by the wallet.");
      setAccount(from);

      setMessage("Switching to Monad mainnet…");
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_CHAIN_ID_HEX }],
        });
      } catch (switchErr: unknown) {
        if ((switchErr as { code?: number })?.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [MONAD_PARAMS],
          });
        } else {
          throw switchErr;
        }
      }

      setMessage("Open your wallet and review the request…");
      const typedData = buildPermitSingle(DEMO_SPENDER);
      const sig = (await eth.request({
        method: "eth_signTypedData_v4",
        params: [from, JSON.stringify(typedData)],
      })) as string;

      setSignature(sig);
      setStatus("signed");
      setMessage(
        "Signed. What did your wallet show, raw hex or a readable summary? That readable view is Clear Signing.",
      );
    } catch (err: unknown) {
      setStatus("error");
      const m = (err as { message?: string })?.message ?? String(err);
      setMessage(m.includes("User rejected") ? "Request cancelled." : m);
    }
  }

  return (
    <main className="text-text-primary">
      {/* Hero */}
      <section className="px-6 pt-28 pb-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-solution-accent">
            ERC-7730
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
            Clear Signing on Monad
          </h1>
          <p className="mt-5 text-lg text-text-secondary">
            Your wallet should tell you what you are signing in plain language,
            not a wall of hex. Clear Signing (ERC-7730) does exactly that, and it
            works on Monad today. Trigger a real signature on Monad mainnet below
            and see it for yourself.
          </p>
        </div>
      </section>

      {/* Why it matters */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">Why this matters</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">
                Blind signing drains wallets
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Most phishing losses start with a user approving a malicious
                transaction or token permit they could not read. Hex hides the
                spender and the amount.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">You verify the real action</p>
              <p className="mt-2 text-sm text-text-secondary">
                Clear Signing shows the actual intent: who you are approving,
                which token, how much, on which network, before you sign. No
                trust in the dApp UI required.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">Trust for a new chain</p>
              <p className="mt-2 text-sm text-text-secondary">
                For Monad it means day-one signing safety on par with Ethereum
                mainnet. Lower the odds users get drained, raise the odds they
                transact with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section className="px-6 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border-2 border-solution-accent-light bg-surface-elevated p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-solution-accent">
              Try it live
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              This signs a Permit2 token-approval message on Monad. It is a
              signature only: it is generated locally in your browser and never
              broadcast, no gas is spent, and no funds move.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={runDemo} disabled={status === "working"}>
                {status === "working"
                  ? "Check your wallet…"
                  : "Sign a Permit2 approval on Monad"}
              </Button>
              {account && (
                <span className="font-mono text-xs text-text-tertiary">
                  {account.slice(0, 6)}…{account.slice(-4)}
                </span>
              )}
            </div>

            {message && (
              <p
                className={
                  "mt-4 text-sm " +
                  (status === "error"
                    ? "text-problem-accent-strong"
                    : "text-text-secondary")
                }
              >
                {message}
              </p>
            )}

            {signature && (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text-secondary">
                {signature.slice(0, 42)}…
              </pre>
            )}

            <p className="mt-6 text-xs text-text-tertiary">
              If your wallet shows a readable summary (Approve USDC, spender,
              amount, Monad), Clear Signing is rendering on Monad. If it shows
              generic typed data, the descriptor is not ingested for chain 143
              yet.
            </p>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">Hex versus readable</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-problem-accent-light bg-surface-elevated p-5">
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-problem-accent-strong">
                Before: blind signing
              </p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-problem-accent-light bg-surface p-3 font-mono text-xs text-text-secondary">
                0x095ea7b3000000000000000000000000fe9c9ca3eed0fb3e6a5c0bf42ad6f1a0d1c7b2a40000000000000000000000000000000000000000000000000000000003b9aca00
              </pre>
              <p className="mt-3 text-sm text-text-secondary">
                Sign and hope. You cannot see the spender or the amount.
              </p>
            </div>
            <div className="rounded-2xl border border-solution-accent-light bg-surface-elevated p-5">
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-solution-accent">
                After: clear signing
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">Action</dt>
                  <dd className="font-medium">Approve USDC</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">Spender</dt>
                  <dd className="font-medium">Uniswap Router</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">Amount</dt>
                  <dd className="font-medium">1,000 USDC</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">Network</dt>
                  <dd className="font-medium">Monad</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-text-secondary">
                See exactly what you authorize, then sign.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why a live demo */}
      <section className="px-6 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">Why a live demo</h2>
          <p className="mt-3 text-text-secondary">
            Existing preview tools only render against Ethereum mainnet, so they
            cannot show what signing looks like on Monad. This page signs against
            Monad directly in your own wallet, the only way to see the real
            render on chain 143.
          </p>
        </div>
      </section>

      {/* For builders */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">For builders</h2>
          <p className="mt-3 text-text-secondary">
            Make your Monad contract clear-signable: publish an ERC-7730
            descriptor and open a PR to the registry.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a
                className="text-solution-accent underline"
                href="https://eips.ethereum.org/EIPS/eip-7730"
              >
                ERC-7730 specification
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://github.com/ethereum/clear-signing-erc7730-registry"
              >
                Clear Signing registry
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://github.com/ethereum/clear-signing-erc7730-registry/pull/2611"
              >
                Permit2 on Monad (PR #2611)
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://docs.monad.xyz/developer-essentials/network-information"
              >
                Monad network info (chainId 143)
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
