import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    useTypeScriptCli: false,
  },
};

export default nextConfig;
