import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['d3', 'd3-array', 'd3-shape', 'd3-scale', 'd3-selection'],
};

export default nextConfig;
