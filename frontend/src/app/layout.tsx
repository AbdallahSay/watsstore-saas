import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import MetaPixel from '@/components/MetaPixel';
import AppProviders from '@/context/AppProviders';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10B981',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app'),
  title: {
    default: 'إنشاء متجر إلكتروني مجانًا لمدة 14 يومًا | WatsStore',
    template: '%s | WatsStore',
  },
  description: 'أنشئ متجرًا إلكترونيًا بتجربة مجانية لمدة 14 يومًا مع WatsStore. اعرض حتى 10 منتجات واستقبل الطلبات عبر واتساب، بدون بطاقة بنكية.',
  authors: [{ name: 'WatsStore Platform' }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'WatsStore | منصة إنشاء متاجر وكتالوجات الواتساب في مصر',
    description: 'أنشئ متجرًا إلكترونيًا بتجربة مجانية لمدة 14 يومًا مع WatsStore. اعرض حتى 10 منتجات واستقبل الطلبات عبر واتساب، بدون بطاقة بنكية.',
    url: '/',
    siteName: 'WatsStore',
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WatsStore | منصة إنشاء متاجر وكتالوجات الواتساب في مصر',
    description: 'أنشئ متجرك الإلكتروني ومنيو منتجاتك في دقيقتين واستقبل طلبات العملاء مباشرة ومفلترة على الواتساب.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformPixelId = process.env.NEXT_PUBLIC_PLATFORM_META_PIXEL_ID;

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('watsstore_theme');
                  var supportDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var lang = localStorage.getItem('watsstore_lang') || 'ar';
                  var dir = lang === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = dir;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo transition-colors duration-200">
        <AppProviders>
          {/* Dual Meta Pixel: Platform SaaS Owner Pixel */}
          {platformPixelId && <MetaPixel pixelId={platformPixelId} />}
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
