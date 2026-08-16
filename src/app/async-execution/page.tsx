import type { Metadata } from "next";
import AsyncExecutionHeroSection from "@/components/async-execution/AsyncExecutionHeroSection";
import BudgetComparisonSection from "@/components/async-execution/BudgetComparisonSection";
import DelayedRootSection from "@/components/async-execution/DelayedRootSection";
import DeterminismSection from "@/components/async-execution/DeterminismSection";
import DeveloperImplicationsSection from "@/components/async-execution/DeveloperImplicationsSection";
import AsyncExecutionFooterSection from "@/components/async-execution/AsyncExecutionFooterSection";

export const metadata: Metadata = {
  title: "Asynchronous Execution",
  description:
    "An interactive explainer for Monad asynchronous execution: consensus decides transaction order while execution runs in a separate, slightly lagged lane.",
  alternates: { canonical: "/async-execution" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Asynchronous Execution | MIP Land",
    description:
      "Consensus decides transaction order while execution runs in a separate, slightly lagged lane.",
    url: "/async-execution",
  },
};

export default function AsyncExecutionPage() {
  return (
    <main>
      <div className="bg-problem-bg border-b border-problem-cell-hover">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-wider text-problem-accent-strong border border-problem-accent-strong rounded px-2 py-1">
            Deprecated
          </span>
          <p className="text-sm text-text-secondary">
            This page is being reworked and is not live yet. Content may not reflect the current Monad design.
          </p>
        </div>
      </div>
      <AsyncExecutionHeroSection />
      <BudgetComparisonSection />
      <DelayedRootSection />
      <DeterminismSection />
      <DeveloperImplicationsSection />
      <AsyncExecutionFooterSection />
    </main>
  );
}
