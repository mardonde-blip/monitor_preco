/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  serverExternalPackages: ['pg']
}

module.exports = nextConfig