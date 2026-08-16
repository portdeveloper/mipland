import type { Metadata } from "next";
import Monad101Page from "@/components/monad-101/Monad101Page";

export const metadata: Metadata = {
  title: "Monad 101",
  description:
    "A visual primer for EVM developers on Monad's compatibility surface, MonadBFT, RaptorCast, async and parallel execution, and MonadDB.",
  alternates: { canonical: "/monad-101" },
  openGraph: {
    title: "Monad 101 | MIP Land",
    description:
      "A visual primer on Monad's EVM compatibility, consensus, propagation, execution, and storage architecture.",
    url: "/monad-101",
  },
};

export default function Page() {
  return <Monad101Page />;
}
