import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Only run ESLint on specific directories during builds
    dirs: ["src/app", "src/components", "src/lib", "src/hooks"],
    // Alternatively, you can disable linting during builds if needed
    // ignoreDuringBuilds: true,
  },
};

export default nextConfig;
