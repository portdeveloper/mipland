"use client";

import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const GITHUB_BASE =
  "https://github.com/portdeveloper/mipland/blob/master/benchmarks/src/mip8";

const COLLECTIONS = [
  {
    id: "bitmap",
    metadataWords: 0,
    code: `Mip8DenseBitmap.layout(CLAIMS)
    .set(claimId);`,
    source: "Mip8DenseBitmap.sol",
  },
  {
    id: "vector",
    metadataWords: 1,
    code: `Mip8Uint256Vector.layout(SCORES)
    .pushMany(values);`,
    source: "Mip8Uint256Vector.sol",
  },
  {
    id: "ring",
    metadataWords: 2,
    code: `Mip8RingBuffer.layout(ORDERS)
    .push(orderId);`,
    source: "Mip8RingBuffer.sol",
  },
  {
    id: "keyedPage",
    metadataWords: 0,
    code: `Mip8KeyedPage.layout(ACCOUNTS, user)
    .set(BALANCE_FIELD, balance);`,
    source: "Mip8KeyedPage.sol",
  },
  {
    id: "slab",
    metadataWords: 2,
    code: `uint256 orderIndex = Mip8Slab
    .layout(ORDERS).insert(orderId);`,
    source: "Mip8Slab.sol",
  },
  {
    id: "uint64Vector",
    metadataWords: 1,
    code: `Mip8Uint64Vector.layout(PRICES)
    .pushMany(observations);`,
    source: "Mip8Uint64Vector.sol",
  },
  {
    id: "smallBlob",
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
  const { t } = useLanguage();
  const item = (id: string, field: string) =>
    t(`mip8.collections.items.${id}.${field}`);

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip8.collections.title")}
        </h2>

        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip8.collections.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip8.collections.note")}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {COLLECTIONS.map((collection) => (
            <article
              key={collection.id}
              className="rounded-2xl border border-solution-accent-light bg-surface-elevated p-5 sm:p-6 flex flex-col"
            >
              <div className="mb-5">
                <h3 className="text-xl font-semibold tracking-tight mb-1.5">
                  {item(collection.id, "title")}
                </h3>
                <p className="font-mono text-sm text-solution-accent">
                  {item(collection.id, "metric")}
                </p>
              </div>

              <div className="rounded-xl border border-border-soft bg-solution-bg p-3 mb-4">
                <PageLayout
                  metadataWords={collection.metadataWords}
                  label={item(collection.id, "layout")}
                />
                <div className="flex items-center justify-between gap-3 mt-2.5">
                  <span className="font-mono text-[10px] text-text-tertiary">
                    slot 0
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {t("mip8.collections.onePage")}
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    slot 127
                  </span>
                </div>
              </div>

              <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
                {item(collection.id, "description")}
              </p>
              <p className="text-xs text-text-tertiary leading-relaxed mb-5">
                <span className="font-semibold text-text-secondary">
                  {t("mip8.collections.goodFor")}
                </span>{" "}
                {item(collection.id, "uses")}
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
                {t("mip8.collections.viewSource")}
                <ArrowIcon />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface-elevated px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-text-secondary font-light leading-relaxed max-w-2xl">
            {t("mip8.collections.footer")}
          </p>
          <a
            href={`${GITHUB_BASE}/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 font-mono text-xs text-text-primary hover:text-solution-accent transition-colors w-fit"
          >
            {t("mip8.collections.readDocs")}
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
