/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurações específicas para o servidor
      config.externals.push('pg-native');
    }
    return config;
  },
  // Configurações para deployment no Vercel
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  }
};

module.exports = nextConfig;