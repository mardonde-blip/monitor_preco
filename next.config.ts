import type { NextConfig } from "next";
import path from "path";

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
    // Garantir alias '@' -> 'src' para resolver imports '@/...'
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ['@']: path.resolve(__dirname, 'src'),
    };
    return config;
  }
};

export default nextConfig;
