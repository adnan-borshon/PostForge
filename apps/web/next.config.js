/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@postforge/types', '@postforge/utils'],
};

module.exports = nextConfig;
