/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker/container deployments
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
    ],
  },
  
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Environment variables that are okay to expose
  env: {
    NEXT_PUBLIC_APP_NAME: 'My Cricket Team',
  },
}

module.exports = nextConfig
