'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Root Global Crash Error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '90%',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '24px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Emergency Badge */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px',
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 12px',
              color: '#ffffff',
            }}
          >
            تعذر تحميل المنصة
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            واجه المتصفح خطأ غير متوقع أثناء تهيئة النظام. يرجى الضغط على زر إعادة التحميل للمحاولة مرة أخرى.
          </p>

          {error.digest && (
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                backgroundColor: '#1f2937',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#6b7280',
                marginBottom: '24px',
                wordBreak: 'break-all',
              }}
            >
              Digest: {error.digest}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            >
              محاولة إعادة التحميل (Try Again)
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
            >
              العودة إلى الصفحة الرئيسية
            </button>
          </div>

          <div
            style={{
              marginTop: '28px',
              fontSize: '11px',
              color: '#4b5563',
              borderTop: '1px solid #1f2937',
              paddingTop: '16px',
            }}
          >
            WatsStore System Recovery Environment
          </div>
        </div>
      </body>
    </html>
  );
}
