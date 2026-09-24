import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Keep linting available via the lint script, but do not make existing
    // repository-wide lint debt prevent production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
