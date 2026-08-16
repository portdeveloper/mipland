"use client";

import { useState } from "react";
import { useInView } from "./useInView";

const GITHUB_BASE =
  "https://github.com/portdeveloper/mipland/blob/master/benchmarks/src/mip8";

const COLLECTIONS = [
  {
    id: "bitmap",
    title: "Dense bitmap",
    metric: "32,768 bits per page",
    description:
      "Stores consecutive 256-bit buckets in consecutive slots, avoiding the locality loss of mapping-backed bitmap buckets.",
    uses: "claim flags, permissions, dense IDs, epochs",
    layout: "128 adjacent bitmap words filling one MIP-8 page",
    metadataWords: 0,
    code: `Mip8DenseBitmap.layout(CLAIMS)
    .set(claimId);`,
    source: "Mip8DenseBitmap.sol",
  },
  {
    id: "vector",
    title: "Uint256 vector",
    metric: "127 values in page zero",
    description:
      "Keeps length and the first 127 values together, then fills every following page with 128 sequential values. Includes batch append and range reads.",
    uses: "scores, observations, append-heavy records",
    layout: "one metadata word followed by 127 values in one MIP-8 page",
    metadataWords: 1,
    code: `Mip8Uint256Vector.layout(SCORES)
    .pushMany(values);`,
    source: "Mip8Uint256Vector.sol",
  },
  {
    id: "ring",
    title: "Ring buffer",
    metric: "126 queued values per page",
    description:
      "Fits head, length, and a bounded FIFO into exactly one page, so push, pop, peek, and wraparound stay page-local.",
    uses: "recent prices, rolling observations, bounded work queues",
    layout: "two metadata words followed by 126 queued values in one MIP-8 page",
    metadataWords: 2,
    code: `Mip8RingBuffer.layout(ORDERS)
    .push(orderId);`,
    source: "Mip8RingBuffer.sol",
  },
  {
    id: "keyed-page",
    title: "Keyed page",
    metric: "128 fields per entity",
    description:
      "Derives an independently aligned page from each logical key, keeping one account, market, or position record page-local.",
    uses: "account records, markets, positions, protocol parameters",
    layout: "128 entity fields filling one independently aligned MIP-8 page",
    metadataWords: 0,
    code: `Mip8KeyedPage.layout(ACCOUNTS, user)
    .set(BALANCE_FIELD, balance);`,
    source: "Mip8KeyedPage.sol",
  },
  {
    id: "slab",
    title: "Record slab",
    metric: "126 reusable records per page",
    description:
      "Combines an occupancy bitmap, live count, and fixed record slots. Removed records free their index for the next insertion.",
    uses: "orders, jobs, game entities, bounded allocators",
    layout: "two metadata words followed by 126 reusable records in one MIP-8 page",
    metadataWords: 2,
    code: `uint256 orderIndex = Mip8Slab
    .layout(ORDERS).insert(orderId);`,
    source: "Mip8Slab.sol",
  },
  {
    id: "uint64-vector",
    title: "Packed uint64 vector",
    metric: "508 values in page zero",
    description:
      "Packs four 64-bit values into each word. Later pages hold 512 values while updates preserve every neighboring packed value.",
    uses: "timestamps, counters, compact prices, numeric IDs",
    layout: "one length word followed by 127 words containing 508 packed values",
    metadataWords: 1,
    code: `Mip8Uint64Vector.layout(PRICES)
    .pushMany(observations);`,
    source: "Mip8Uint64Vector.sol",
  },
  {
    id: "small-blob",
    title: "Small blob",
    metric: "4,064 bytes per page",
    description:
      "Stores one bounded bytes value with its length and payload in a single page. Shorter rewrites clear obsolete trailing words.",
    uses: "encoded configs, metadata, proofs, bounded payloads",
    layout: "one length word followed by 127 payload words in one MIP-8 page",
    metadataWords: 1,
    code: `Mip8SmallBlob.layout(CONFIG)
    .write(encodedConfig);`,
    source: "Mip8SmallBlob.sol",
  },
] as const;

const SEARCH_CASES = [
  { gapWords: 1, treeGas: 17_220, flatGas: 16_985 },
  { gapWords: 40, treeGas: 25_059, flatGas: 24_824 },
  { gapWords: 128, treeGas: 51_407, flatGas: 50_512 },
  { gapWords: 200, treeGas: 65_879, flatGas: 64_984 },
  { gapWords: 256, treeGas: 51_407, flatGas: 84_240 },
  { gapWords: 400, treeGas: 54_623, flatGas: 121_184 },
  { gapWords: 600, treeGas: 69_095, flatGas: 169_384 },
] as const;

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 7H12M12 7L7 2M12 7L7 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PageLayout({
  metadataWords,
  label,
}: {
  metadataWords: number;
  label: string;
}) {
  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: 128 }, (_, index) => (
        <span
          key={index}
          className={`aspect-square rounded-[1px] border ${
            index < metadataWords
              ? "bg-text-primary border-text-primary"
              : "bg-solution-cell border-solution-accent-light"
          }`}
        />
      ))}
    </div>
  );
}

function BitmapPages({ summarized }: { summarized: boolean }) {
  const label = summarized
    ? "Page Bit Tree: a two-word summary root points to page-aligned bitmap leaves"
    : "Flat bitmap: page-aligned bitmap words have no summary index";

  return (
    <div role="img" aria-label={label} className="min-h-24">
      <div className="h-8 mb-3 flex items-center">
        {summarized ? (
          <div className="w-full flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-tertiary shrink-0">
              root
            </span>
            <div className="h-7 w-28 rounded-md border border-solution-accent bg-solution-cell p-1.5 flex gap-1">
              <span className="h-full flex-1 rounded-sm bg-solution-accent" />
              <span className="h-full flex-1 rounded-sm bg-solution-accent" />
            </div>
            <span className="h-px flex-1 bg-solution-accent-light" />
          </div>
        ) : (
          <p className="font-mono text-[10px] text-text-tertiary">
            no root · scan words directly
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, page) => (
          <div
            key={page}
            className="rounded-md border border-border bg-surface p-1.5"
          >
            <div className="grid grid-cols-4 gap-0.5 mb-1.5">
              {Array.from({ length: 8 }, (_, word) => (
                <span
                  key={word}
                  className={`aspect-square rounded-[1px] ${
                    page === 3 && word === 5
                      ? "bg-solution-accent"
                      : "bg-solution-cell"
                  }`}
                />
              ))}
            </div>
            <p className="font-mono text-[9px] text-text-tertiary text-center">
              page {page}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageBitTreeExperiment() {
  const [caseIndex, setCaseIndex] = useState(4);
  const selected = SEARCH_CASES[caseIndex];
  const maxGas = Math.max(selected.treeGas, selected.flatGas);
  const treeWins = selected.treeGas < selected.flatGas;
  const difference = Math.abs(selected.treeGas - selected.flatGas);
  const gapIds = selected.gapWords * 256;

  return (
    <div className="mt-6 rounded-2xl border border-solution-accent-light bg-surface-elevated overflow-hidden">
      <div className="p-5 sm:p-7 border-b border-border-soft">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
          <div className="max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              When a bitmap outgrows one page
            </h3>
            <p className="text-sm sm:text-base text-text-secondary font-light leading-relaxed">
              Both structures cover the full uint24 ID space. They differ in one
              decision: whether to maintain a two-word summary over the bitmap
              pages.
            </p>
          </div>
          <a
            href={`${GITHUB_BASE}/page-bit-tree`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 font-mono text-xs text-solution-accent hover:text-text-primary transition-colors w-fit"
          >
            View experiment source
            <ArrowIcon />
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="font-semibold mb-1">Flat bitmap</h4>
                <p className="font-mono text-xs text-text-tertiary">
                  1 level · 65,536 words
                </p>
              </div>
              <span className="rounded-full bg-solution-bg px-2.5 py-1 font-mono text-[10px] text-solution-accent">
                cheaper writes
              </span>
            </div>
            <BitmapPages summarized={false} />
            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              Add and remove stay one read and one write, but searches must walk
              across empty words.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="font-semibold mb-1">Page Bit Tree</h4>
                <p className="font-mono text-xs text-text-tertiary">
                  2 levels · 2-word root
                </p>
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 font-mono text-[10px] text-text-secondary">
                skips empty pages
              </span>
            </div>
            <BitmapPages summarized />
            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              The root makes wide jumps cheap, but every write must maintain its
              summary invariant.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
        <div className="p-5 sm:p-7 bg-solution-bg border-b lg:border-b-0 lg:border-r border-solution-accent-light">
          <p className="text-2xl font-semibold tracking-tight mb-3">
            Flat wins or ties every write
          </p>
          <p className="text-sm text-text-secondary font-light leading-relaxed mb-5">
            The largest penalty appears when removing the last ID in a page: the
            tree scans all 128 words to prove the leaf is empty before it may
            clear the summary bit.
          </p>
          <div className="rounded-xl border border-solution-accent-light bg-surface-elevated px-4 py-3">
            <p className="font-mono text-2xl text-solution-accent">−39,552 gas</p>
            <p className="text-xs text-text-tertiary mt-1">
              flat bitmap vs. Page Bit Tree on worst-case removal
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
            <h4 className="text-xl font-semibold tracking-tight">
              The root pays back on wide gaps
            </h4>
            <span className="font-mono text-xs text-text-tertiary">
              measured under MIP-8
            </span>
          </div>

          <label
            htmlFor="page-bit-tree-gap"
            className="block text-sm text-text-secondary mb-2"
          >
            Empty gap: {selected.gapWords.toLocaleString()} words
            <span className="text-text-tertiary">
              {" "}({gapIds.toLocaleString()} IDs)
            </span>
          </label>
          <input
            id="page-bit-tree-gap"
            type="range"
            min={0}
            max={SEARCH_CASES.length - 1}
            step={1}
            value={caseIndex}
            onChange={(event) => setCaseIndex(Number(event.target.value))}
            aria-valuetext={`${selected.gapWords} words, ${gapIds} IDs`}
            className="w-full accent-solution-accent mb-5"
          />

          <div className="space-y-4 mb-5">
            {[
              { label: "Page Bit Tree", gas: selected.treeGas },
              { label: "Flat bitmap", gas: selected.flatGas },
            ].map((result) => (
              <div key={result.label}>
                <div className="flex items-center justify-between gap-3 mb-1.5 font-mono text-xs">
                  <span>{result.label}</span>
                  <span>{result.gas.toLocaleString()} gas</span>
                </div>
                <div className="h-3 rounded-full bg-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      result.gas === Math.min(selected.treeGas, selected.flatGas)
                        ? "bg-solution-accent"
                        : "bg-text-tertiary"
                    }`}
                    style={{ width: `${(result.gas / maxGas) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <output
            htmlFor="page-bit-tree-gap"
            aria-live="polite"
            className="block rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm text-text-secondary"
          >
            <span className="font-semibold text-text-primary">
              {treeWins ? "Page Bit Tree" : "Flat bitmap"} saves{" "}
              {difference.toLocaleString()} gas.
            </span>{" "}
            {treeWins
              ? "The summary skips enough empty pages to repay its lookup cost."
              : "The direct scan is still shorter than the summary lookup."}
          </output>

          <p className="mt-4 text-xs text-text-tertiary leading-relaxed">
            Crossover is about 256 words, or 65,536 IDs. The result depends on
            real gap distribution; an unbounded not-found path still needs a
            summary or a fixed scan budget.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Mip8CollectionsSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          Reference data structures
        </h2>

        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          Reusable Solidity primitives that make MIP-8 page boundaries explicit
          instead of relying on accidental storage alignment.
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          These implementations optimize locality when one call touches several
          related values. A single lookup is not inherently cheaper, and every
          net-new slot still pays state-growth cost.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {COLLECTIONS.map((collection, index) => (
            <article
              key={collection.id}
              className={`rounded-2xl border border-solution-accent-light bg-surface-elevated p-5 sm:p-6 flex flex-col ${
                index < 4 ? "lg:col-span-3" : "lg:col-span-4"
              } ${
                index === COLLECTIONS.length - 1
                  ? "md:col-span-2 md:w-[calc(50%-0.625rem)] md:justify-self-center lg:col-span-4 lg:w-auto lg:justify-self-stretch"
                  : ""
              }`}
            >
              <div className="mb-5">
                <h3 className="text-xl font-semibold tracking-tight mb-1.5">
                  {collection.title}
                </h3>
                <p className="font-mono text-sm text-solution-accent">
                  {collection.metric}
                </p>
              </div>

              <div className="rounded-xl border border-border-soft bg-solution-bg p-3 mb-4">
                <PageLayout
                  metadataWords={collection.metadataWords}
                  label={collection.layout}
                />
                <div className="flex items-center justify-between gap-3 mt-2.5">
                  <span className="font-mono text-[10px] text-text-tertiary">
                    slot 0
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    128 slots · one page
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    slot 127
                  </span>
                </div>
              </div>

              <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
                {collection.description}
              </p>
              <p className="text-xs text-text-tertiary leading-relaxed mb-5">
                <span className="font-semibold text-text-secondary">
                  Good for:
                </span>{" "}
                {collection.uses}
              </p>

              <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto text-text-primary bg-surface rounded-lg border border-border p-3 mb-4">
                <code>{collection.code}</code>
              </pre>

              <a
                href={`${GITHUB_BASE}/${collection.source}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-auto font-mono text-xs text-solution-accent hover:text-text-primary transition-colors w-fit"
              >
                View Solidity source
                <ArrowIcon />
              </a>
            </article>
          ))}
        </div>

        <PageBitTreeExperiment />

        <div className="mt-6 rounded-xl border border-border bg-surface-elevated px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-text-secondary font-light leading-relaxed max-w-2xl">
            Each primitive uses a unique namespaced storage base with its lower
            seven bits cleared, guaranteeing that slot zero begins at a MIP-8
            page boundary.
          </p>
          <a
            href={`${GITHUB_BASE}/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 font-mono text-xs text-text-primary hover:text-solution-accent transition-colors w-fit"
          >
            Read usage docs
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
