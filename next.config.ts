import type { NextConfig } from 'next';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const config: NextConfig = {
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3', 'sharp'],
};

export default config;
