'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface MetaPixelProps {
  pixelId?: string | null;
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname=usePathname();
  const privateOrderPage=/\/s\/[^/]+\/(?:orders\/|my-orders)/.test(pathname||'');
  useEffect(() => {
    if (!privateOrderPage && pixelId && /^\d{5,20}$/.test(pixelId) && typeof window !== 'undefined' && window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('trackSingle', pixelId, 'PageView');
    }
  }, [pixelId,privateOrderPage]);

  if (privateOrderPage || !pixelId || !/^\d{5,20}$/.test(pixelId)) return null;

  return (
    <>
      <Script
        id={`fb-pixel-${pixelId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('set', 'autoConfig', false, '${pixelId}');
            fbq('init', '${pixelId}');
            fbq('trackSingle', '${pixelId}', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
