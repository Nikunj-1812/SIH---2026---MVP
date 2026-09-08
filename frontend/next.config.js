/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gen.pollinations.ai',
      },
    ],
  },
};

module.exports = nextConfig;
