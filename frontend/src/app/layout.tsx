import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import MetaPixel from '@/components/MetaPixel';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'WatsStore | منصة إنشاء متاجر وكتالوجات الواتساب في مصر',
    template: '%s | WatsStore',
  },
  description: 'أنشئ متجرك الإلكتروني ومنيو منتجاتك في دقيقتين واستقبل طلبات العملاء مباشرة ومفلترة على الواتساب مع دعم كامل لتحسين محركات البحث وسيو المحافظات المصرية.',
  keywords: ['متجر واتساب', 'منيو واتساب مصر', 'كتالوج واتساب', 'واتس ستور', 'WatsStore', 'تجارة إلكترونية مصر', 'سيو محلي مصر'],
  authors: [{ name: 'WatsStore Platform' }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformPixelId = process.env.NEXT_PUBLIC_PLATFORM_META_PIXEL_ID;

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-cairo">
        {/* Dual Meta Pixel: Platform SaaS Owner Pixel */}
        {platformPixelId && <MetaPixel pixelId={platformPixelId} />}
        {children}
      </body>
    </html>
  );
}
