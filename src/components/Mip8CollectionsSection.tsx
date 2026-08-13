"use client";

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

export default function Mip8CollectionsSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Reference data structures
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-problem-accent-light bg-problem-bg text-problem-accent-strong">
            Experimental · unaudited
          </span>
        </div>

        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          Reusable Solidity primitives that make MIP-8 page boundaries explicit
          instead of relying on accidental storage alignment.
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          These implementations optimize locality when one call touches several
          related values. A single lookup is not inherently cheaper, and every
          net-new slot still pays state-growth cost.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {COLLECTIONS.map((collection) => (
            <article
              key={collection.id}
              className="rounded-2xl border border-solution-accent-light bg-surface-elevated p-5 sm:p-6 flex flex-col"
            >
              <div className="mb-5">
                <p className="font-mono text-xs uppercase tracking-wider text-solution-muted mb-2">
                  Page-aware primitive
                </p>
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
