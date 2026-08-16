import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "How MIP Land turns Monad Improvement Proposals and blockchain research into independent, interactive educational explainers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About MIP Land",
    description:
      "Learn how MIP Land sources, explains, and maintains its interactive guides to Monad Improvement Proposals.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-[70vh] px-6 py-24 sm:py-32">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary mb-4">
          About
        </p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-8">
          Making protocol changes easier to understand
        </h1>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p>
            MIP Land is an independent, community-maintained educational project
            that turns Monad Improvement Proposals and blockchain research into
            interactive, visual explanations.
          </p>
          <p>
            The explainers are designed for developers, validators, researchers,
            and community members who want to understand both what a proposal
            changes and why it matters. Interactive models illustrate the ideas;
            they do not replace the proposal itself.
          </p>
          <p>
            Every MIP explainer links to its published specification. When an
            explainer and a specification differ, treat the specification as the
            authoritative source.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-5 font-mono text-sm">
          <a
            href="https://github.com/monad-crypto/MIPs/tree/main/MIPS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-solution-accent hover:underline underline-offset-4"
          >
            Canonical MIP specifications →
          </a>
          <a
            href="https://x.com/port_dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary hover:underline underline-offset-4"
          >
            Maintained by port →
          </a>
        </div>
      </article>
    </main>
  );
}
