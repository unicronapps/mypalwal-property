/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-75e7337751c14e2f927864034f263b93.r2.dev',
      },
    ],
  },
};

module.exports = nextConfig;
