import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    '*': [
      './public/uk-universities/*/Bilder_HighRez/**',
      './public/norske-universiteter/*/Bilder_HighRez/**',
    ],
  },
};

export default nextConfig;
