/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["res.cloudinary.com"], // Add any other domains you use for images
  },
};

module.exports = nextConfig;
