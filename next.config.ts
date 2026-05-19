import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withBotId } from "botid/next/config";
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

export default withBotId(nextConfig);
