import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ['d3', 'd3-array', 'd3-shape', 'd3-scale', 'd3-selection'],
  turbopack: { root: projectRoot },
};

export default nextConfig;
