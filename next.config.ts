import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  async redirects() {
    return [
      { source: "/bte", destination: "/btx", permanent: false },
    ];
  },
};

export default nextConfig;
