import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3', 'sharp'],
};

export default config;
