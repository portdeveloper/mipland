import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const INDEXABLE_ROUTES = [
  "/",
  "/about",
  "/analyzer",
  "/btx",
  "/clear-signing",
  "/infra",
  "/mip-3",
  "/mip-4",
  "/mip-7",
  "/mip-8",
  "/mip-12",
  "/monad-101",
  "/spam-mev",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((path) => ({ url: absoluteUrl(path) }));
}
