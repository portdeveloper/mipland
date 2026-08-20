"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

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

// Resolved from our ERC-7730 registry descriptor for Wrapped MON via
//   uvx erc7730 calldata --chain-id 143 registry/monad/calldata-wmon.json
// WMON is a plain wrapper, so wallets do not decode these calls natively.
// Every action name and field label below comes from the descriptor.
const REGISTRY_RENDER: {
  selector: string;
  action: string;
  actionGloss: string;
  fields: [string, string, string][];
}[] = [
  {
    selector: "0xd0e30db0",
    action: "Wrap MON",
    actionGloss: "wrap",
    fields: [["Amount", "10 MON", "amount"]],
  },
  {
    selector: "0x2e1a7d4d",
    action: "Unwrap WMON",
    actionGloss: "unwrap",
    fields: [["Amount", "10 WMON", "amount"]],
  },
  {
    selector: "0x095ea7b3",
    action: "Approve WMON",
    actionGloss: "approve",
    fields: [
      ["Spender", "0x1b81…eB14", "spender"],
      ["Amount", "1 WMON", "amount"],
    ],
  },
  {
    selector: "0xa9059cbb",
    action: "Send WMON",
    actionGloss: "send",
    fields: [
      ["To", "0x7547…b603", "to"],
      ["Amount", "5 WMON", "amount"],
    ],
  },
  {
    selector: "0x23b872dd",
    action: "Transfer WMON",
    actionGloss: "transfer",
    fields: [
      ["From", "0x1b81…eB14", "from"],
      ["To", "0x7547…b603", "to"],
      ["Amount", "5 WMON", "amount"],
    ],
  },
];

// Wrapped MON is a plain wrapper, so no wallet decodes its calls natively. The
// litmus test below sends a real deposit() ("Wrap MON") so you can watch whether
// your wallet, or a Ledger connected through it, clear-signs it from the
// registry or falls back to raw hex.
const WMON = "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A";
const WMON_DEPOSIT = "0xd0e30db0"; // deposit()
const WRAP_VALUE_HEX = "0x38d7ea4c68000"; // 0.001 MON, shown only on the review screen

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
      details: { token: USDC, amount: "1000000", expiration, nonce: 0 }, // 1 USDC (6 decimals)
      spender, // connected account: harmless even if broadcast
      sigDeadline,
    },
  };
}

type Status = "idle" | "working" | "signed" | "error";
type Feedback = { key: string } | { raw: string };

export default function ClearSigningPage() {
  const { locale, t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [account, setAccount] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<Feedback | null>(null);
  const [testStatus, setTestStatus] = useState<Status>("idle");
  const [testMessage, setTestMessage] = useState<Feedback | null>(null);

  const feedbackText = (feedback: Feedback) =>
    "key" in feedback
      ? t(feedback.key)
      : `${t("clearSigning.status.providerError")} ${feedback.raw}`;

  async function runDemo() {
    const eth = getEthereum();
    if (!eth) {
      setStatus("error");
      setMessage({ key: "clearSigning.status.noWallet" });
      return;
    }
    try {
      setStatus("working");
      setSignature(null);

      setMessage({ key: "clearSigning.status.requestingAccount" });
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      const from = accounts?.[0];
      if (!from) {
        setStatus("error");
        setMessage({ key: "clearSigning.status.noAccount" });
        return;
      }
      setAccount(from);

      setMessage({ key: "clearSigning.status.switchingNetwork" });
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

      setMessage({ key: "clearSigning.status.reviewRequest" });
      const typedData = buildPermitSingle(DEMO_SPENDER);
      const sig = (await eth.request({
        method: "eth_signTypedData_v4",
        params: [from, JSON.stringify(typedData)],
      })) as string;

      setSignature(sig);
      setStatus("signed");
      setMessage({ key: "clearSigning.status.signed" });
    } catch (err: unknown) {
      setStatus("error");
      const e = err as { code?: number; message?: string };
      const m = e?.message ?? String(err);
      setMessage(
        e?.code === 4001 || m.includes("User rejected")
          ? { key: "clearSigning.status.requestCancelled" }
          : { raw: m },
      );
    }
  }

  async function runWalletTest() {
    const eth = getEthereum();
    if (!eth) {
      setTestStatus("error");
      setTestMessage({ key: "clearSigning.status.testNoWallet" });
      return;
    }
    try {
      setTestStatus("working");
      setTestMessage({ key: "clearSigning.status.requestingAccount" });
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      const from = accounts?.[0];
      if (!from) {
        setTestStatus("error");
        setTestMessage({ key: "clearSigning.status.noAccount" });
        return;
      }
      setAccount(from);

      setTestMessage({ key: "clearSigning.status.switchingNetwork" });
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

      setTestMessage({ key: "clearSigning.status.testReview" });
      await eth.request({
        method: "eth_sendTransaction",
        params: [{ from, to: WMON, value: WRAP_VALUE_HEX, data: WMON_DEPOSIT }],
      });

      setTestStatus("signed");
      setTestMessage({ key: "clearSigning.status.testApproved" });
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      const rejected =
        e?.code === 4001 || (e?.message ?? "").includes("User rejected");
      if (rejected) {
        setTestStatus("signed");
        setTestMessage({ key: "clearSigning.status.testRejected" });
      } else {
        setTestStatus("error");
        setTestMessage({ raw: e?.message ?? String(err) });
      }
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
            {t("clearSigning.hero.title")}
          </h1>
          <p className="mt-5 text-lg text-text-secondary">
            {t("clearSigning.hero.description")}
          </p>
        </div>
      </section>

      {/* Why it matters */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">
            {t("clearSigning.why.title")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">
                {t("clearSigning.why.blindTitle")}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {t("clearSigning.why.blindDescription")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">
                {t("clearSigning.why.verifyTitle")}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {t("clearSigning.why.verifyDescription")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-semibold">
                {t("clearSigning.why.trustTitle")}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {t("clearSigning.why.trustDescription")}
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
              {t("clearSigning.demo.title")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {t("clearSigning.demo.description")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={runDemo} disabled={status === "working"}>
                {status === "working"
                  ? t("clearSigning.demo.checkWallet")
                  : t("clearSigning.demo.signApproval")}
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
                {feedbackText(message)}
              </p>
            )}

            {signature && (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text-secondary">
                {signature.slice(0, 42)}…
              </pre>
            )}

            <p className="mt-6 text-xs text-text-tertiary">
              {t("clearSigning.demo.note")}
            </p>
          </div>
        </div>
      </section>

      {/* Registry render proof: WMON (non-native) */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-solution-accent">
            {t("clearSigning.registry.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {t("clearSigning.registry.title")}
          </h2>
          <p className="mt-3 text-text-secondary">
            {t("clearSigning.registry.introBeforeDeposit")}{" "}
            <code className="font-mono text-sm">deposit()</code>{" "}
            {t("clearSigning.registry.introOr")}{" "}
            <code className="font-mono text-sm">withdraw()</code>
            {locale === "en" && " "}
            {t("clearSigning.registry.introAfterWithdraw")}{" "}
            <code className="font-mono text-sm">
              erc7730 calldata --chain-id 143
            </code>
            {locale === "en" && " "}
            {t("clearSigning.registry.introAfterCommand")}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {REGISTRY_RENDER.map((r) => (
              <div
                key={r.selector}
                className="rounded-2xl border border-solution-accent-light bg-surface-elevated p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm font-semibold text-solution-accent">
                    {r.action}
                    {locale === "zh" && (
                      <span className="ml-1 font-normal text-text-tertiary">
                        （{t(`clearSigning.registry.actions.${r.actionGloss}`)}）
                      </span>
                    )}
                  </p>
                  <code className="shrink-0 font-mono text-xs text-text-tertiary">
                    {r.selector}
                  </code>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  {r.fields.map(([label, value, gloss]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-text-tertiary">
                        {label}
                        {locale === "zh" && (
                          <span>
                            （{t(`clearSigning.registry.fields.${gloss}`)}）
                          </span>
                        )}
                      </dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-tertiary">
                      Network
                      {locale === "zh" && (
                        <span>
                          （{t("clearSigning.registry.fields.network")}）
                        </span>
                      )}
                    </dt>
                    <dd className="text-right font-medium">Monad</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-text-tertiary">
            {t("clearSigning.registry.fieldNoteBeforeCommand")}{" "}
            <code className="font-mono">
              uvx erc7730 calldata --chain-id 143 calldata-wmon.json
            </code>
            {t("clearSigning.registry.fieldNoteAfterCommand")}
          </p>

          {/* Live litmus test: trigger a non-native render */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
            <p className="text-sm font-semibold">
              {t("clearSigning.registry.gotLedger")}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {t("clearSigning.registry.ledgerBeforeWrap")}
              {locale === "en" && " "}
              <span className="font-medium text-text-primary">Wrap MON</span>
              {locale === "en" && " "}
              {t("clearSigning.registry.ledgerAfterWrap")}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={runWalletTest}
                disabled={testStatus === "working"}
              >
                {testStatus === "working"
                  ? t("clearSigning.demo.checkWallet")
                  : t("clearSigning.registry.reviewWrap")}
              </Button>
              {account && (
                <span className="font-mono text-xs text-text-tertiary">
                  {account.slice(0, 6)}…{account.slice(-4)}
                </span>
              )}
            </div>

            {testMessage && (
              <p
                className={
                  "mt-4 text-sm " +
                  (testStatus === "error"
                    ? "text-problem-accent-strong"
                    : "text-text-secondary")
                }
              >
                {feedbackText(testMessage)}
              </p>
            )}

            <p className="mt-4 text-xs text-text-tertiary">
              {t("clearSigning.registry.screenshotNote")}
            </p>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="px-6 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">
            {t("clearSigning.comparison.title")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-problem-accent-light bg-surface-elevated p-5">
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-problem-accent-strong">
                {t("clearSigning.comparison.before")}
              </p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-problem-accent-light bg-surface p-3 font-mono text-xs text-text-secondary">
                0x095ea7b3000000000000000000000000fe9c9ca3eed0fb3e6a5c0bf42ad6f1a0d1c7b2a40000000000000000000000000000000000000000000000000000000003b9aca00
              </pre>
              <p className="mt-3 text-sm text-text-secondary">
                {t("clearSigning.comparison.beforeDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-solution-accent-light bg-surface-elevated p-5">
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-solution-accent">
                {t("clearSigning.comparison.after")}
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">
                    {t("clearSigning.comparison.action")}
                  </dt>
                  <dd className="font-medium">
                    {t("clearSigning.comparison.approveUsdc")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">
                    {t("clearSigning.registry.fields.spender")}
                  </dt>
                  <dd className="font-medium">
                    {t("clearSigning.comparison.uniswapRouter")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">
                    {t("clearSigning.registry.fields.amount")}
                  </dt>
                  <dd className="font-medium">1 USDC</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">
                    {t("clearSigning.registry.fields.network")}
                  </dt>
                  <dd className="font-medium">Monad</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-text-secondary">
                {t("clearSigning.comparison.afterDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why a live demo */}
      <section className="px-6 py-16 bg-surface-alt">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">
            {t("clearSigning.liveDemo.title")}
          </h2>
          <p className="mt-3 text-text-secondary">
            {t("clearSigning.liveDemo.description")}
          </p>
        </div>
      </section>

      {/* For builders */}
      <section className="px-6 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">
            {t("clearSigning.builders.title")}
          </h2>
          <p className="mt-3 text-text-secondary">
            {t("clearSigning.builders.description")}
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a
                className="text-solution-accent underline"
                href="https://eips.ethereum.org/EIPS/eip-7730"
              >
                {t("clearSigning.builders.spec")}
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://github.com/ethereum/clear-signing-erc7730-registry"
              >
                {t("clearSigning.builders.registry")}
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://github.com/ethereum/clear-signing-erc7730-registry/pull/2611"
              >
                {t("clearSigning.builders.permit2")}
              </a>
            </li>
            <li>
              <a
                className="text-solution-accent underline"
                href="https://docs.monad.xyz/developer-essentials/network-information"
              >
                {t("clearSigning.builders.networkInfo")}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
