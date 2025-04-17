/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
