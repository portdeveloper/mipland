import type { Metadata } from "next";
import InfraContent from "@/components/infra/InfraContent";

export const metadata: Metadata = {
  title: "Infra",
  description:
    "Browse Monad infrastructure tools — try them live, grab the code",
  alternates: { canonical: "/infra" },
  openGraph: {
    title: "Monad Infra",
    description:
      "Browse Monad infrastructure tools — try them live, grab the code",
    url: "/infra",
  },
};

export default function InfraPage() {
  return <InfraContent />;
}
