import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "100.64.101.110",
    "im-057ceda2275143558c9109d980905a68.tail1fa5c0.ts.net",
  ],
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
