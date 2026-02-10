import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 👈 This is the key line for Docker
};

export default nextConfig;