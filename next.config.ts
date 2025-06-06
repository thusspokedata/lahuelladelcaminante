import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
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

export default withNextIntl(nextConfig);
