"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useInView } from "./useInView";
import type { Mip8ScheduleStatus } from "@/lib/mip8-watch";

type WatchStatus = Mip8ScheduleStatus | "unavailable";

interface NetworkResult {
  id: "mainnet" | "testnet";
  name: string;
  chainId: number;
  blockNumber: number | null;
  contiguousGas: number | null;
  scatteredGas: number | null;
  status: WatchStatus;
}

interface WatchResponse {
  checkedAt: string;
  networks: NetworkResult[];
}

const STATUS_COPY: Record<
  WatchStatus,
  { summary: string; detail: string }
> = {
  active: {
    summary: "page warming is live",
    detail: "Observed the MIP-8 schedule: one cold page load warms the seven adjacent slots.",
  },
  inactive: {
    summary: "the probe did not observe page warming",
    detail: "This RPC did not return the activated MIP-8 schedule. Check the endpoint and block height.",
  },
  unknown: {
    summary: "the schedule is unrecognized",
    detail: "The measured costs do not match either known schedule.",
  },
  unavailable: {
    summary: "the RPC is unavailable",
    detail: "The latest probe failed. The other network may still be current.",
  },
};

function formatGas(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function NetworkCard({ network }: { network: NetworkResult }) {
  const copy = STATUS_COPY[network.status];
  const contiguousValueColor =
    network.status === "active"
      ? "text-solution-accent"
      : network.status === "inactive"
        ? "text-problem-accent-strong"
        : "text-text-tertiary";

  return (
    <article className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
      <div className="p-5 border-b border-border-soft">
        <h3 className="text-xl font-semibold">{network.name}</h3>
      </div>

      <div className="p-5">
        <table className="w-full table-fixed text-left">
          <caption className="sr-only">
            MIP-8 protocol gas costs compared with the latest {network.name} probe
          </caption>
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              <th scope="col" className="w-1/2 pb-3 font-normal">Pattern</th>
              <th scope="col" className="pb-3 text-right font-normal">Protocol gas</th>
              <th scope="col" className="pb-3 text-right font-normal">Observed gas</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm tabular-nums">
            <tr className="border-t border-border-soft">
              <th scope="row" className="py-4 pr-2 font-normal text-text-secondary">
                8 contiguous reads
              </th>
              <td className="py-4 text-right text-text-tertiary">≈ 8,800</td>
              <td
                className={`py-4 text-right font-semibold ${contiguousValueColor}`}
              >
                {formatGas(network.contiguousGas)}
              </td>
            </tr>
            <tr className="border-t border-border-soft">
              <th scope="row" className="py-4 pr-2 font-normal text-text-secondary">
                8 scattered reads
              </th>
              <td className="py-4 text-right text-text-tertiary">≈ 64,800</td>
              <td className="py-4 text-right font-semibold text-text-primary">
                {formatGas(network.scatteredGas)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-1 border-t border-border-soft pt-4">
          <p className="text-sm text-text-secondary leading-relaxed">{copy.detail}</p>
          <p className="mt-3 font-mono text-[11px] text-text-tertiary">
            {network.blockNumber === null
              ? "No block returned"
              : `Checked at block ${network.blockNumber.toLocaleString()}`}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Mip8WatchSection() {
  const { ref, isVisible } = useInView(0.1);
  const [data, setData] = useState<WatchResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/mip8-watch");
      if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
      setData((await response.json()) as WatchResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return (
    <section id="mip8-watch" ref={ref} className="px-6 py-20 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              MIP-8 is live
            </h2>
            <p className="text-text-secondary font-light leading-relaxed">
              Monad mainnet activated MIP-8 with MONAD_TEN on September 2, 2026
              at 14:30 UTC. This read-only check verifies the active gas schedule
              on mainnet and testnet without sending a transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {refreshing ? "Checking…" : "Check now"}
          </button>
        </div>

        <div aria-busy={refreshing && !data}>
          {!data && !error && (
            <div className="grid gap-5 md:grid-cols-2">
              {["Mainnet", "Testnet"].map((name) => (
                <div
                  key={name}
                  className="h-72 animate-pulse rounded-xl border border-border bg-surface-elevated p-5"
                >
                  <p className="font-mono text-xs text-text-tertiary">Checking {name}…</p>
                </div>
              ))}
            </div>
          )}

          {data && (
            <>
              <p className="sr-only" aria-live="polite">
                MIP-8 Watch updated. {data.networks
                  .map((network) => `${network.name}: ${STATUS_COPY[network.status].summary}`)
                  .join(". ")}
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {data.networks.map((network) => (
                  <NetworkCard key={network.id} network={network} />
                ))}
              </div>
              <p className="mt-5 text-center font-mono text-[11px] text-text-tertiary">
                Last checked {new Date(data.checkedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </p>
              {error && (
                <p className="mt-2 text-center text-xs text-problem-accent-strong">
                  Latest refresh failed; showing the last successful result.
                </p>
              )}
            </>
          )}

          {!data && error && (
            <div className="rounded-xl border border-border bg-surface-elevated p-6 text-text-secondary">
              The watcher could not reach the status endpoint. Try again in a moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
