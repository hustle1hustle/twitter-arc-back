/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['rep-arc-demo.s3.amazonaws.com'],
  },
}

module.exports = nextConfig 