import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'puppeteer-core', '@sparticuz/chromium-min'],
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

export default nextConfig;
