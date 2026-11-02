'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { commerceApi, CommerceSettings, merchantToken } from '@/lib/commerce-api';
import { DashboardSummary } from '@/types';
import { setupProgress, setupStorageKey, restoredSetupStep, storeSettingsPayload } from '@/lib/setup-progress';
import { useLanguage } from '@/context/LanguageContext';
import { platformConfig } from '@/config/platformConfig';
import '@/styles/merchant-setup.css';
export default function SetupPage() {
    const { language } = useLanguage(), en = language === 'en', tr = (ar: string, eng: string) => en ? eng : ar;
    const [summary, setSummary] = useState<DashboardSummary | null>(null), [settings, setSettings] = useState<CommerceSettings | null>(null), [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [copied, setCopied] = useState(false);
    const draftChanged = useRef(false), lock = useRef(false), heading = useRef<HTMLHeadingElement>(null);
    async function load() { setError(''); const token = merchantToken(); const [s, c] = await Promise.all([api.getDashboardSummary(token), commerceApi<CommerceSettings>('/merchant/commerce/settings', token)]); setSummary(s); setSettings(c); return s; }
    useEffect(() => { let live = true; load().then(s => { if (live) {
        try {
            setStep(restoredSetupStep(localStorage.getItem(setupStorageKey(s.storeInfo.id))));
        }
        catch { }
    } }).catch(e => { if (live)
        setError(e.message); }); return () => { live = false; }; }, []);
    async function navigate(next: number) { if (busy || lock.current || !summary)
        return; if (draftChanged.current && !(await save()))
        return; const target = Math.max(0, Math.min(5, next)); setStep(target); setMessage(''); try {
        localStorage.setItem(setupStorageKey(summary.storeInfo.id), String(target));
    }
    catch { } requestAnimationFrame(() => heading.current?.focus()); }
    async function save() { if (!summary || lock.current)
        return false; lock.current = true; setBusy(true); setError(''); setMessage(''); try {
        await api.updateStoreSettings(merchantToken(), storeSettingsPayload(summary.storeInfo));
        const user = localStorage.getItem('watsstore_user');
        if (user) {
            try {
                localStorage.setItem('watsstore_user', JSON.stringify({ ...JSON.parse(user), storeName: summary.storeInfo.storeName, whatsAppNumber: summary.storeInfo.whatsAppNumber }));
            }
            catch { }
        }
        await load();
        draftChanged.current = false;
        setMessage(tr('حُفظت بيانات المتجر. يمكنك المتابعة.', 'Store details saved. You can continue.'));
        return true;
    }
    catch (e) {
        setError((e as Error).message);
        return false;
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    function patch(next: Partial<DashboardSummary['storeInfo']>) { draftChanged.current = true; setSummary(s => s ? { ...s, storeInfo: { ...s.storeInfo, ...next } } : s); }
    async function upload(file: File | undefined) { if (!file || !summary || lock.current)
        return; if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(tr('اختر صورة JPG أو PNG أو WEBP حتى 5 ميجابايت.', 'Choose a JPG, PNG or WEBP image up to 5 MB.'));
        return;
    } lock.current = true; setBusy(true); setError(''); try {
        const result = await api.uploadImage(merchantToken(), file);
        patch({ logoUrl: result.imageUrl });
        setMessage(tr('رُفعت الصورة. اضغط حفظ الشعار لتطبيقها.', 'Image uploaded. Save the logo to apply it.'));
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    const labels = [tr('بيانات المتجر', 'Store information'), tr('الهوية', 'Branding'), tr('أول منتج', 'First product'), tr('الدفع والتوصيل', 'Payment and delivery'), tr('التصميم والمعاينة', 'Design and preview'), tr('النشر والمشاركة', 'Publish and share')];
    const info = summary?.storeInfo, progress = summary && settings ? setupProgress(summary, settings) : [], url = info ? `https://watsstore.vercel.app/s/${encodeURIComponent(info.slug)}` : '';
    async function copy() { try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
    }
    catch {
        setError(tr('تعذر النسخ التلقائي. حدد الرابط وانسخه يدويًا.', 'Copy failed. Select the link and copy it manually.'));
    } }
    return <div className="merchant-setup"><header><p>{tr('خطوة بخطوة، من هاتفك', 'STEP BY STEP, FROM YOUR PHONE')}</p><h1>{tr('جهّز متجرك لاستقبال الطلبات', 'Get your store ready for orders')}</h1><p>{tr('متجرك أُنشئ بالفعل. أكمل إعداده دون إنشاء حساب أو متجر جديد.', 'Your store already exists. Finish setup without creating another account or store.')}</p></header>
 {error && <div role="alert" className="setup-error">{error}</div>}{message && <p role="status" className="setup-feedback">{message}</p>}
 {!info || !settings ? <button disabled={busy} onClick={() => load().catch(e => setError(e.message))}>{error ? tr('إعادة التحميل', 'Reload') : tr('جاري تحميل بيانات المتجر…', 'Loading store details…')}</button> : <>
 <nav aria-label={tr('خطوات تجهيز المتجر', 'Store setup steps')}><ol>{labels.map((label, i) => <li key={label}><button aria-current={step === i ? 'step' : undefined} onClick={() => navigate(i)} disabled={busy}><span aria-hidden="true">{i + 1}</span><span>{label}<small>{progress[i] ? tr('بيانات محفوظة', 'Saved data') : i === 1 ? tr('اختياري', 'Optional') : tr('راجع هذه الخطوة', 'Review this step')}</small></span></button></li>)}</ol></nav>
 <section className="setup-panel" aria-labelledby="setup-step-title"><div className="setup-step-heading"><span>{step + 1} / 6</span><h2 ref={heading} tabIndex={-1} id="setup-step-title">{labels[step]}</h2></div>
 {step === 0 && <form onSubmit={e => { e.preventDefault(); save(); }}><div className="setup-fields">{(['storeName', 'businessCategory', 'city', 'whatsAppNumber', 'seoDescription'] as const).map((key, i) => <label key={key}>{[tr('اسم المتجر', 'Store name'), tr('النشاط', 'Business category'), tr('المدينة', 'City'), tr('رقم واتساب للتواصل', 'WhatsApp contact'), tr('وصف المتجر (اختياري)', 'Store description (optional)')][i]}{key === 'seoDescription' ? <textarea disabled={busy} maxLength={500} value={info[key] || ''} onChange={e => patch({ [key]: e.target.value })}/> : <input disabled={busy} required maxLength={key === 'whatsAppNumber' ? 20 : 100} type={key === 'whatsAppNumber' ? 'tel' : 'text'} autoComplete={key === 'whatsAppNumber' ? 'tel' : 'off'} value={info[key]} onChange={e => patch({ [key]: e.target.value })}/>}</label>)}</div><button disabled={busy} type="submit">{busy ? '…' : tr('حفظ بيانات المتجر', 'Save store details')}</button></form>}
 {step === 1 && <div className="setup-content"><p>{tr('ارفع شعارًا واضحًا. الشعار اختياري ويمكن إضافته لاحقًا.', 'Upload a clear logo. Branding is optional and can be added later.')}</p>{info.logoUrl && <img className="setup-logo" src={info.logoUrl} alt={tr('شعار المتجر', 'Store logo')} width={120} height={120}/>}<label className="setup-upload">{tr('رفع شعار المتجر', 'Upload store logo')}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }}/></label><button disabled={busy} onClick={save}>{busy ? '…' : tr('حفظ الشعار', 'Save logo')}</button><Link href="/dashboard/settings?setup=1">{tr('إعدادات الهوية والغلاف الكاملة', 'Full branding and cover settings')}</Link></div>}
 {step === 2 && <div className="setup-content"><p>{summary!.totalProducts > 0 ? tr('لديك منتجات محفوظة. راجع السعر والصور والاختيارات قبل البيع.', 'You have saved products. Review prices, photos and variants before selling.') : tr('ابدأ بمنتج واحد حقيقي: الاسم، السعر، صورة، والاختيارات إن وجدت.', 'Start with one real product: name, price, a photo and any variants.')}</p><Link className="setup-primary" href="/dashboard/products?setup=1&new=1">{tr('إضافة أول منتج', 'Add first product')}</Link><Link href="/dashboard/categories?setup=1">{tr('إدارة الأقسام', 'Manage categories')}</Link><Link href="/dashboard/inventory">{tr('تحديد المخزون للاختيارات', 'Set variant inventory')}</Link><p>{tr('تستخدم هذه الخطوة محرر المنتجات الحالي، ولا تنشئ منتجات تجريبية تلقائيًا.', 'This step uses your existing product editor and never creates sample products automatically.')}</p></div>}
 {step === 3 && <div className="setup-content"><p>{tr('اختر طريقة الطلب المقصودة. الدفع عبر التحويل يحتاج بيانات حساب صحيحة ومراجعة التاجر؛ لا يعني اختيار الوسيلة أن الدفع تم.', 'Choose your checkout mode. Transfers require valid account details and merchant verification; selecting a method does not mean payment is complete.')}</p><p>{tr('الوضع الحالي: ', 'Current mode: ')}<strong>{settings.checkoutMode === 'whatsapp' ? tr('واتساب فقط', 'WhatsApp only') : settings.checkoutMode === 'online' ? tr('طلبات الموقع', 'Online orders') : tr('الموقع وواتساب', 'Online and WhatsApp')}</strong></p><Link className="setup-primary" href="/dashboard/themes?tab=checkout&setup=1">{tr('ضبط طرق الطلب والدفع', 'Configure checkout and payments')}</Link><Link href="/dashboard/themes?tab=shipping&setup=1">{tr('ضبط مناطق الشحن والاستلام', 'Configure shipping and pickup')}</Link><Link href="/dashboard/settings?setup=1">{tr('حسابات التحويل ورسوم التوصيل العامة', 'Transfer accounts and default delivery fee')}</Link></div>}
 {step === 4 && <div className="setup-content"><p>{tr('اختر تصميمًا وجرّب المعاينة على الهاتف والكمبيوتر. المعاينة لا تغيّر المخزون أو الطلبات أو المتجر المنشور.', 'Choose a design and preview mobile and desktop. Preview does not change stock, orders or your published storefront.')}</p><Link className="setup-primary" href="/dashboard/themes?setup=1">{tr('فتح استوديو التصاميم', 'Open design studio')}</Link><p>{tr('احفظ المسودة أولًا، ثم انشر صراحةً بعد المراجعة.', 'Save a draft first, then explicitly publish after reviewing it.')}</p></div>}
 {step === 5 && <div className="setup-content"><p>{progress[5] ? tr('أكد الخادم وجود عملية نشر محفوظة. راجع المتجر الفعلي قبل مشاركة الرابط.', 'The server confirms a saved publish action. Review the actual storefront before sharing.') : tr('لم يتم التحقق من نشر التصميم في هذه الخدمة. راجع التصميم واحفظه وانشره من الاستوديو قبل الإطلاق.', 'A design publish action has not been verified by this service. Review, save and publish in the studio before launch.')}</p><Link className="setup-primary" href="/dashboard/themes?setup=1">{tr('مراجعة ونشر التصميم', 'Review and publish design')}</Link><a href={url} target="_blank" rel="noreferrer">{tr('فتح المتجر العام', 'Open public storefront')} ↗</a><label>{tr('رابط متجرك', 'Your store link')}<input readOnly dir="ltr" value={url} onFocus={e => e.target.select()}/></label><div className="setup-actions"><button onClick={copy}>{copied ? tr('تم النسخ', 'Copied') : tr('نسخ الرابط', 'Copy link')}</button>{typeof navigator !== 'undefined' && !!navigator.share && <button onClick={() => navigator.share({ title: info.storeName, url }).catch(() => { })}>{tr('مشاركة الرابط', 'Share link')}</button>}</div><p>{tr('اختبر إنشاء الطلبات في بيئة اختبار معزولة فقط. لا تُنشئ طلبات تجريبية على بيانات العملاء.', 'Run test orders only in an isolated test environment. Do not create test transactions against customer data.')}</p></div>}
 <footer className="setup-actions"><button disabled={step === 0 || busy} onClick={() => navigate(step - 1)}>{tr('السابق', 'Back')}</button><button disabled={busy} onClick={() => load().then(() => setMessage(tr('حُدّثت حالة الخطوات من الخادم.', 'Step status refreshed from the server.'))).catch(e => setError(e.message))}>{tr('تحديث الحالة', 'Refresh status')}</button>{step < 5 && <button disabled={busy} onClick={() => navigate(step + 1)}>{tr('التالي', 'Next')}</button>}</footer></section>
 <a className="setup-support" href={`https://wa.me/${platformConfig.supportWhatsApp}`} target="_blank" rel="noreferrer">{tr('تحتاج مساعدة؟ تواصل مع الدعم', 'Need help? Contact support')}</a></>}
 </div>;
}
