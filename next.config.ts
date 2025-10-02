import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pg', 'puppeteer-core', '@sparticuz/chromium-min'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurações específicas para o servidor
      config.externals.push('pg-native');
    }
    return config;
  }
};

export default nextConfig;
