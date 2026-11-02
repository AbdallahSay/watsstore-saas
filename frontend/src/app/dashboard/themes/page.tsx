'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  commerceApi,
  CommerceSettings,
  merchantToken,
  ShippingZone,
} from '@/lib/commerce-api';
import {
  STORE_THEMES,
  StoreThemeId,
  STORE_THEME_IDS,
  THEME_CATEGORIES,
  BusinessCategoryKey,
  ThemeCustomization,
  parseThemeCustomization,
  parseStoreTheme,
} from '@/lib/store-themes';
import { Store } from '@/types';
import { api } from '@/lib/api';
import CommerceStorefront from '@/components/commerce/CommerceStorefront';
import {
  Sparkles,
  Smartphone,
  Monitor,
  Search,
  Check,
  RotateCcw,
  UploadCloud,
  Save,
  Palette,
  Truck,
  CreditCard,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Sliders,
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'افتراضي القالب', value: '' },
  { name: 'زمردي', value: '#059669' },
  { name: 'نيلي فاخر', value: '#4f46e5' },
  { name: 'برتقالي نيون', value: '#fb5b16' },
  { name: 'ذهبي ملكي', value: '#d4af37' },
  { name: 'ياقوتي حاد', value: '#e11d48' },
  { name: 'وردي ناعم', value: '#c07a72' },
  { name: 'سيان تقني', value: '#00d2ff' },
  { name: 'فحمي داكن', value: '#18181b' },
];

export default function ThemesMarketplacePage() {
  const [settings, setSettings] = useState<CommerceSettings | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<StoreThemeId | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customization, setCustomization] = useState<ThemeCustomization>({});
  const [activeTab, setActiveTab] = useState<'themes' | 'customizer' | 'checkout' | 'shipping'>('themes');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function load() {
    try {
      const result = await commerceApi<CommerceSettings>('/merchant/commerce/settings', merchantToken());
      // Handle legacy theme alias if present in draft or published
      result.draftTheme = parseStoreTheme(result.draftTheme);
      result.publishedTheme = parseStoreTheme(result.publishedTheme);
      if (result.previousTheme) {
        result.previousTheme = parseStoreTheme(result.previousTheme);
      }
      setSettings(result);

      if (result.customizationJson) {
        setCustomization(parseThemeCustomization(result.customizationJson));
      }

      const storeData = await api.getPublicStore(result.slug);
      setStore(storeData);
      setDirty(false);
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateSettings(changes: Partial<CommerceSettings>) {
    setSettings((s) => (s ? { ...s, ...changes } : s));
    setDirty(true);
  }

  function updateCustomization(changes: Partial<ThemeCustomization>) {
    setCustomization((c) => {
      const next = { ...c, ...changes };
      if (settings) {
        setSettings({ ...settings, customizationJson: JSON.stringify(next) });
      }
      return next;
    });
    setDirty(true);
  }

  async function executeAction(type: 'save' | 'publish' | 'restore') {
    if (!settings) return;
    setBusy(true);
    setMessage(null);
    try {
      if (type === 'save') {
        const payload = {
          ...settings,
          customizationJson: JSON.stringify(customization),
        };
        await commerceApi('/merchant/commerce/settings', merchantToken(), 'PUT', payload);
        setMessage({
          text: 'تم حفظ مسودة القالب وإعدادات المتجر بنجاح. القالب المنشور لم يتغير حتى تضغط «نشر».',
          type: 'success',
        });
      } else {
        await commerceApi(`/merchant/commerce/theme/${type}`, merchantToken(), 'POST');
        setMessage({
          text: type === 'publish' ? 'تم نشر القالب الجديد لجميع زوار المتجر بنجاح!' : 'تمت استعادة القالب السابق بنجاح.',
          type: 'success',
        });
      }
      await load();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function updateShippingZone(index: number, changes: Partial<ShippingZone>) {
    if (settings) {
      updateSettings({
        shippingZones: settings.shippingZones.map((z, i) => (i === index ? { ...z, ...changes } : z)),
      });
    }
  }

  // Filter themes by category and search query
  const filteredThemes = useMemo(() => {
    return Object.values(STORE_THEMES).filter((t) => {
      const matchesCategory = selectedCategory === 'all' || t.primaryCategory === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.nameAr.includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.descriptionAr.includes(q) ||
        t.categoryLabelAr.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">سوق القوالب وتخصيص المتجر</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            اختر من بين 10 تصاميم احترافية متخصصة ومصممة لكل فئة تجارية، ثم عدّل الألوان والخطوط وانشر بضغطة زر.
          </p>
        </div>

        {/* Global Save / Publish Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => executeAction('save')}
            disabled={busy || !dirty}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>حفظ المسودة {dirty && '●'}</span>
          </button>

          <button
            onClick={() => executeAction('publish')}
            disabled={busy || dirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>نشر القالب للجمهور</span>
          </button>

          {settings?.previousTheme && (
            <button
              onClick={() => executeAction('restore')}
              disabled={busy || dirty}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50"
              title="استعادة القالب السابق"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة السابق</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          role="status"
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 -mb-2">
        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-xl min-h-[44px] transition-colors whitespace-nowrap ${
            activeTab === 'themes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>سوق القوالب (10)</span>
        </button>

        <button
          onClick={() => setActiveTab('customizer')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-xl min-h-[44px] transition-colors whitespace-nowrap ${
            activeTab === 'customizer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>التخصيص المرئي والألوان</span>
        </button>

        <button
          onClick={() => setActiveTab('checkout')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-xl min-h-[44px] transition-colors whitespace-nowrap ${
            activeTab === 'checkout'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>بوابات الدفع وإتمام الطلب</span>
        </button>

        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-xl min-h-[44px] transition-colors whitespace-nowrap ${
            activeTab === 'shipping'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>مناطق ورسوم الشحن ({settings?.shippingZones.length || 0})</span>
        </button>
      </div>

      {!settings ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل إعدادات المتجر والقوالب...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: THEME MARKETPLACE */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              {/* Category Pills & Search Bar */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن اسم القالب أو الفئة أو الميزة..."
                      className="w-full min-h-[44px] py-2.5 rtl:pr-10 ltr:pl-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>المنشور: {STORE_THEMES[settings.publishedTheme]?.nameAr}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>المسودة: {STORE_THEMES[settings.draftTheme]?.nameAr}</span>
                    </span>
                  </div>
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {THEME_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as BusinessCategoryKey)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold min-h-[38px] whitespace-nowrap transition-all border ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {cat.labelAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredThemes.map((theme) => {
                  const isPublished = settings.publishedTheme === theme.id;
                  const isDraft = settings.draftTheme === theme.id;

                  return (
                    <article
                      key={theme.id}
                      className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                        isPublished
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : isDraft
                          ? 'border-amber-500 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div>
                        {/* Visual Palette Preview Banner */}
                        <div
                          className="h-32 mb-4 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                          style={{
                            background: theme.sampleColors.bg,
                            color: theme.sampleColors.fg,
                            border: `1px solid ${theme.sampleColors.border}`,
                          }}
                        >
                          <div className="flex items-center justify-between z-10">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{
                                background: theme.sampleColors.accent,
                                color: theme.sampleColors.accentContrast,
                              }}
                            >
                              {theme.categoryLabelAr}
                            </span>
                            <span className="text-xs opacity-60 font-mono">
                              {theme.colorScheme === 'dark' ? 'داكن 🌙' : 'فاتح ☀️'}
                            </span>
                          </div>

                          <div className="z-10">
                            <span
                              className={`text-xl font-bold tracking-tight block ${
                                theme.fontMood === 'editorial'
                                  ? 'font-serif'
                                  : theme.fontMood === 'bold'
                                  ? 'font-black uppercase'
                                  : theme.fontMood === 'tech'
                                  ? 'font-mono'
                                  : ''
                              }`}
                            >
                              {theme.nameAr}
                            </span>
                            <span className="text-[11px] opacity-75">{theme.name}</span>
                          </div>

                          {/* Decorative Accent Swatch */}
                          <div
                            className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-20 blur-md pointer-events-none"
                            style={{ background: theme.sampleColors.accent }}
                          />
                        </div>

                        {/* Title & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{theme.nameAr}</span>
                              <span className="text-xs font-normal text-slate-400">({theme.name})</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {theme.descriptionAr}
                            </p>
                          </div>
                        </div>

                        {/* Status Tags */}
                        <div className="flex items-center gap-2 mt-3">
                          {isPublished && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>القالب المنشور حالياً</span>
                            </span>
                          )}
                          {isDraft && !isPublished && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              المسودة المحددة للحفظ
                            </span>
                          )}
                        </div>

                        {/* Recommended Industries */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <p className="text-[11px] font-bold text-slate-400 mb-2">الأنشطة الموصى بها:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {theme.recommendedForAr.map((rec, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                {rec}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Key Features */}
                        <div className="mt-3">
                          <p className="text-[11px] font-bold text-slate-400 mb-1.5">المميزات التفاعلية:</p>
                          <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                            {theme.featuresAr.map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => setPreviewThemeId(theme.id)}
                          className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Monitor className="w-4 h-4" />
                          <span>معاينة حية</span>
                        </button>

                        <button
                          onClick={() => updateSettings({ draftTheme: theme.id })}
                          disabled={busy || isDraft}
                          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                            isDraft
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {isDraft ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>محدد كمسودة</span>
                            </>
                          ) : (
                            <span>اختيار للمسودة</span>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: NO-CODE VISUAL CUSTOMIZER */}
          {activeTab === 'customizer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      <span>محرر المظهر والهوية</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      خصص هوية المتجر دون الحاجة إلى كتابة سطر كود واحد.
                    </p>
                  </div>

                  {/* Primary Color Picker */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      اللون الأساسي للأزرار والتركيز
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customization.primaryColor || '#059669'}
                        onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                        className="w-11 h-11 p-1 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={customization.primaryColor || ''}
                        placeholder="#059669"
                        onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                        className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    {/* Preset Swatches */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {COLOR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => updateCustomization({ primaryColor: p.value || undefined })}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 hover:border-slate-400 flex items-center gap-1.5 transition-colors"
                        >
                          {p.value && <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.value }} />}
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Preset */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      نمط الخط (Typography)
                    </label>
                    <select
                      value={customization.fontPreset || 'cairo'}
                      onChange={(e) =>
                        updateCustomization({
                          fontPreset: e.target.value as ThemeCustomization['fontPreset'],
                        })
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="cairo">خط كايرو الحديث (Cairo — افتراضي)</option>
                      <option value="amiri">خط أميري الكلاسيكي الفاخر (Amiri Serif)</option>
                      <option value="tajawal">خط تجوال الهندسي المعاصر (Tajawal)</option>
                      <option value="sans">خط النظام العالمي بدون زوائد (Clean Sans)</option>
                      <option value="serif">خط جورجيا الصحفي الراقي (Editorial Serif)</option>
                    </select>
                  </div>

                  {/* Button Shape */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      شكل الأزرار وحواف البطاقات
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'rounded', label: 'مستدير متوازن', shapeClass: 'rounded-xl' },
                        { id: 'pill', label: 'كبسولة دائرية', shapeClass: 'rounded-full' },
                        { id: 'sharp', label: 'حواف حادة', shapeClass: 'rounded-none' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            updateCustomization({
                              buttonShape: item.id as ThemeCustomization['buttonShape'],
                            })
                          }
                          className={`p-2.5 text-xs font-bold border transition-all min-h-[44px] flex items-center justify-center ${
                            (customization.buttonShape || 'rounded') === item.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          } ${item.shapeClass}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid Density */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      كثافة شبكة المنتجات (Desktop Grid)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'standard', label: 'متوازن (3 أعمدة)' },
                        { id: 'compact', label: 'مكثف (4 أعمدة)' },
                        { id: 'spacious', label: 'فسيح (عمودين)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            updateCustomization({
                              gridDensity: item.id as ThemeCustomization['gridDensity'],
                            })
                          }
                          className={`p-2.5 text-xs font-bold rounded-xl border transition-all min-h-[44px] flex items-center justify-center ${
                            (customization.gridDensity || 'standard') === item.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Aspect Ratio */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      أبعاد صور المنتجات (Aspect Ratio)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '4/5', label: '4:5 طولي' },
                        { id: '1/1', label: '1:1 مربع' },
                        { id: '3/4', label: '3:4 عصري' },
                        { id: '16/9', label: '16:9 عرضي' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            updateCustomization({
                              cardAspectRatio: item.id as ThemeCustomization['cardAspectRatio'],
                            })
                          }
                          className={`p-2 text-xs font-bold rounded-xl border transition-all min-h-[44px] flex items-center justify-center ${
                            (customization.cardAspectRatio || '4/5') === item.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Announcement Bar Custom Text */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      نص شريط الإعلان العلوي (مخصص)
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={customization.announcementText || ''}
                      placeholder="مثال: شحن مجاني للطلبات فوق 500 ج.م كود الخصم: WELCOME"
                      onChange={(e) => updateCustomization({ announcementText: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    معاينة حية للمتجر (القالب: {STORE_THEMES[settings.draftTheme]?.nameAr})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewViewport('desktop')}
                      className={`p-2 rounded-lg min-h-[38px] text-xs font-bold flex items-center gap-1.5 border ${
                        previewViewport === 'desktop'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>شاشة كبيرة</span>
                    </button>
                    <button
                      onClick={() => setPreviewViewport('mobile')}
                      className={`p-2 rounded-lg min-h-[38px] text-xs font-bold flex items-center gap-1.5 border ${
                        previewViewport === 'mobile'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>موبايل (375px)</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-950 transition-all ${
                    previewViewport === 'mobile' ? 'max-w-[390px] mx-auto border-4 border-slate-700 rounded-[36px] p-2' : 'w-full'
                  }`}
                >
                  {store && (
                    <div className="max-h-[750px] overflow-y-auto rounded-xl">
                      <CommerceStorefront
                        store={store}
                        preview
                        previewTheme={settings.draftTheme}
                        previewCustomization={customization}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHECKOUT & PAYMENT METHODS */}
          {activeTab === 'checkout' && (
            <div className="max-w-2xl space-y-6">
              <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <span>طريقة إتمام الطلب وتجربة العميل</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    حدد ما إذا كان العميل يتمم الطلب عبر الموقع مباشرة أو يتم تحويله إلى محادثة واتساب.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    وضع إتمام الطلب (Checkout Mode)
                  </label>
                  <select
                    value={settings.checkoutMode}
                    onChange={(e) =>
                      updateSettings({
                        checkoutMode: e.target.value as CommerceSettings['checkoutMode'],
                      })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="online">طلبات الموقع فقط (سلة وحساب إلكتروني كامل)</option>
                    <option value="whatsapp">واتساب فقط (إرسال تفاصيل السلة لواتساب التاجر)</option>
                    <option value="both">الموقع وواتساب معاً (يتيح للعميل حرية الاختيار)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    طرق الدفع المسموح بها في المتجر
                  </label>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={settings.cashOnDelivery}
                        onChange={(e) => updateSettings({ cashOnDelivery: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          الدفع عند الاستلام (Cash on Delivery)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          يدفع العميل نقداً لمندوب الشحن عند تسلّم الطلب.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={settings.instaPay}
                        onChange={(e) => updateSettings({ instaPay: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          إنستاباي (InstaPay)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          يُعرض عنوان إنستاباي المسجل في إعدادات متجرك للعميل للتحويل الفوري.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={settings.mobileWallet}
                        onChange={(e) => updateSettings({ mobileWallet: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          المحفظة الإلكترونية (فودافون كاش / أورنج / وي / إي آند)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          تحويل مباشر على رقم محفظتك مع إرفاق لقطة شاشة للتأكيد.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: SHIPPING ZONES & PICKUP */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-500" />
                      <span>مناطق الشحن المخصصة والاستلام من المتجر</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      خصص رسوم التوصيل والمدة التقديرية لكل محافظة أو منطقة. إذا لم تضف مناطق، تُطبق رسوم التوصيل العامة للمتجر.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      updateSettings({
                        shippingZones: [
                          ...settings.shippingZones,
                          {
                            id: crypto.randomUUID(),
                            governorate: 'القاهرة',
                            name: '',
                            fee: 50,
                            pickup: false,
                            estimate: 'خلال 24-48 ساعة',
                          },
                        ],
                      })
                    }
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px] transition-colors shadow-sm self-start"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منطقة شحن جديدة</span>
                  </button>
                </div>

                {settings.shippingZones.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                    <Truck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-xs text-slate-600 dark:text-slate-300">
                      لم تقم بإضافة مناطق شحن مخصصة بعد
                    </p>
                    <p className="text-[11px] text-slate-400">
                      المتجر يعتمد حالياً على رسوم التوصيل الثابتة المسجلة في الإعدادات ({store?.deliveryFee || 0} ج.م).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.shippingZones.map((zone, index) => (
                      <div
                        key={zone.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
                      >
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المحافظة</label>
                          <input
                            type="text"
                            maxLength={100}
                            value={zone.governorate}
                            onChange={(e) => updateShippingZone(index, { governorate: e.target.value })}
                            placeholder="مثال: القاهرة"
                            className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المنطقة أو الحي</label>
                          <input
                            type="text"
                            maxLength={100}
                            value={zone.name}
                            onChange={(e) => updateShippingZone(index, { name: e.target.value })}
                            placeholder="مثال: التجمع الخامس والرحاب"
                            className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رسوم الشحن (ج.م)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            disabled={zone.pickup}
                            value={zone.fee}
                            onChange={(e) => updateShippingZone(index, { fee: Number(e.target.value) })}
                            className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">موعد التوصيل التقديري</label>
                          <input
                            type="text"
                            maxLength={150}
                            value={zone.estimate || ''}
                            onChange={(e) => updateShippingZone(index, { estimate: e.target.value })}
                            placeholder="مثال: خلال 1-2 يوم عمل"
                            className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={zone.pickup}
                              onChange={(e) =>
                                updateShippingZone(index, {
                                  pickup: e.target.checked,
                                  ...(e.target.checked ? { fee: 0 } : {}),
                                })
                              }
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>استلام من المتجر</span>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              updateSettings({
                                shippingZones: settings.shippingZones.filter((_, i) => i !== index),
                              })
                            }
                            className="p-2.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                            title="حذف المنطقة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* FULL SCREEN LIVE PREVIEW MODAL */}
          {previewThemeId && store && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col animate-fadeIn">
              {/* Modal Topbar */}
              <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm">
                    معاينة حية للقالب: {STORE_THEMES[previewThemeId]?.nameAr} ({STORE_THEMES[previewThemeId]?.name})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                    بيانات متجرك الحقيقية
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setPreviewViewport('desktop')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        previewViewport === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>كمبيوتر</span>
                    </button>
                    <button
                      onClick={() => setPreviewViewport('mobile')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        previewViewport === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>موبايل (375px)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      updateSettings({ draftTheme: previewThemeId });
                      setPreviewThemeId(null);
                      setActiveTab('customizer');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>اختيار هذا القالب للمسودة</span>
                  </button>

                  <button
                    onClick={() => setPreviewThemeId(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-800"
                    aria-label="إغلاق المعاينة"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body with Viewport simulation */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950">
                <div
                  className={`bg-white dark:bg-slate-900 transition-all duration-300 shadow-2xl overflow-y-auto ${
                    previewViewport === 'mobile'
                      ? 'w-[390px] h-[780px] max-h-[90vh] rounded-[44px] border-[10px] border-slate-800 shadow-emerald-950/20'
                      : 'w-full max-w-6xl h-full max-h-[90vh] rounded-2xl border border-slate-800'
                  }`}
                >
                  <CommerceStorefront
                    store={store}
                    preview
                    previewTheme={previewThemeId}
                    previewCustomization={customization}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
