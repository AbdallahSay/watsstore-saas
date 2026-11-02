'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import '@/styles/merchant-setup.css';
export default function SetupReturn() { const [show, setShow] = useState(false), { language } = useLanguage(), pathname = usePathname(); useEffect(() => { setShow(new URLSearchParams(location.search).get('setup') === '1'); }, [pathname]); return show ? <aside className="setup-return"><span>{language === 'en' ? 'Part of your store setup. Save changes here, then return to the guide.' : 'هذه خطوة من تجهيز متجرك. احفظ التغييرات هنا، ثم ارجع للدليل.'}</span><Link href="/dashboard/setup">{language === 'en' ? 'Return to setup' : 'العودة لدليل التجهيز'} ↗</Link></aside> : null; }
