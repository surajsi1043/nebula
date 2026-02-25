import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this line to handle pdf-parse
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;