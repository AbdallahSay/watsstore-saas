import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'متجر إلكتروني عبر WatsStore';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { storeSlug: string } }) {
  const storeSlug = params?.storeSlug || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://watsstore.runasp.net/api';

  let storeName = decodeURIComponent(storeSlug).replace(/-/g, ' ');
  let category = 'متجر معتمد';
  let city = 'مصر';
  let logoUrl = '';

  try {
    const res = await fetch(`${apiUrl}/public/stores/${encodeURIComponent(storeSlug)}`, {
      next: { revalidate: 120 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.storeName) storeName = data.storeName;
      if (data?.businessCategory) category = data.businessCategory;
      if (data?.city) city = data.city;
      if (data?.logoUrl) logoUrl = data.logoUrl;
    }
  } catch {
    // Fallback gracefully
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Glow decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%)',
          }}
        />

        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Masar Tech Official Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.18)',
              border: '1.5px solid rgba(16, 185, 129, 0.5)',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#34D399',
              }}
            >
              متجر إلكتروني عبر Masar Tech
            </span>
          </div>

          {/* Category & City Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 22px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              fontSize: '20px',
              color: '#CBD5E1',
              fontWeight: 600,
            }}
          >
            {category} • {city}
          </div>
        </div>

        {/* Center Content: Store Brand & Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '36px',
            margin: 'auto 0',
          }}
        >
          {/* Logo or Fallback Avatar */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '32px',
                objectFit: 'cover',
                border: '4px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              }}
            />
          ) : (
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '32px',
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '68px',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.35)',
              }}
            >
              🛍️
            </div>
          )}

          {/* Store Name & Details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '850px',
            }}
          >
            <div
              style={{
                fontSize: '54px',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {storeName}
            </div>
            <div
              style={{
                fontSize: '26px',
                color: '#A7F3D0',
                fontWeight: 500,
              }}
            >
              الكتالوج الرسمي • تصفح المنتجات واطلب مباشرة عبر الواتساب
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            width: '100%',
          }}
        >
          {/* WhatsApp Order Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#25D366',
              padding: '12px 28px',
              borderRadius: '18px',
              color: '#064E3B',
              fontWeight: 800,
              fontSize: '22px',
              boxShadow: '0 10px 25px rgba(37, 211, 102, 0.35)',
            }}
          >
            <span>💬</span>
            <span>طلب فوري ومباشر عبر WhatsApp</span>
          </div>

          {/* WatsStore Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#E2E8F0',
            }}
          >
            <span>WatsStore</span>
            <span style={{ color: '#10B981' }}>⚡</span>
            <span style={{ fontSize: '18px', color: '#94A3B8', fontWeight: 500 }}>
              by Masar Tech
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
