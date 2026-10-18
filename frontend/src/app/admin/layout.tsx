import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة الإدارة العليا | WatsStore Super Admin',
  description: 'لوحة التحكم والسيطرة المركزية لمنصة WatsStore SaaS بواسطة Masar Tech',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {children}
    </div>
  );
}
