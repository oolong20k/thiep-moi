import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Be_Vietnam_Pro, Shantell_Sans } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({ subsets: ['vietnamese', 'latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const body = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-body', display: 'swap' });
const voice = Shantell_Sans({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600'], variable: '--font-voice', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')),
  title: 'Thiệp mời tốt nghiệp · Hẹn ngày tốt nghiệp',
  description: 'Tạo thiệp mời tốt nghiệp với sắc pastel thanh xuân vườn trường, chia sẻ bằng một đường link.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#b8cbea' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable} ${voice.variable}`}>
      <body>
        {/* Không có JS thì vẫn đọc được nội dung (Reveal mặc định ẩn). */}
        <noscript>
          <style>{'[data-reveal],.reveal,.reveal-piece{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
