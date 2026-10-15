/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  // کامپایل فقط همان تکه‌هایی از react-hot-toast که استفاده می‌شود
  experimental: { optimizePackageImports: ["react-hot-toast"] },
};
module.exports = nextConfig;
