import type { NextConfig } from 'next';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const config: NextConfig = {
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  poweredByHeader: false,
  // Giữ nguyên URL ảnh mẫu đang được lưu trong các thiệp đã duyệt.
  async redirects() {
    return [{ source: '/sample/person.svg', destination: '/sample/graduation-girl-ou.webp', permanent: false }];
  },
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3', 'sharp'],
};

export default config;
