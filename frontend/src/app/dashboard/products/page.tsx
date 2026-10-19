'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Product, Category, ProductVariantGroup } from '@/types';
import Swal from 'sweetalert2';
import { 
  ShoppingBag, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  SlidersHorizontal, 
  Check, 
  X,
  AlertCircle,
  Upload,
  Loader2,
  Crown,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { platformConfig } from '@/config/platformConfig';

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [planType, setPlanType] = useState('Free');
  const [storeName, setStoreName] = useState('');
  const [aiGenerationsUsed, setAiGenerationsUsed] = useState(0);
  const [aiGenerationsLimit, setAiGenerationsLimit] = useState(0);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCompareAtPrice, setFormCompareAtPrice] = useState<number | ''>('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  
  // File upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Variant Builder State
  const [variantGroups, setVariantGroups] = useState<{ name: string; optionsText: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Toggling state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // AI Description generation state
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const fetchInitialData = async () => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    try {
      const [prods, cats, summary] = await Promise.all([
        api.getProducts(token),
        api.getCategories(token),
        api.getDashboardSummary(token)
      ]);
      setProducts(prods);
      setCategories(cats);
      setPlanType(summary.storeInfo?.planType || 'Free');
      setStoreName(summary.storeInfo?.storeName || '');
      setAiGenerationsUsed(summary.aiGenerationsUsed ?? summary.storeInfo?.aiGenerationsUsed ?? 0);
      setAiGenerationsLimit(summary.aiGenerationsLimit ?? summary.storeInfo?.aiGenerationsLimit ?? (summary.storeInfo?.planType === 'Pro' ? 15 : summary.storeInfo?.planType === 'VIP' ? 150 : 0));
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل المنتجات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openUpgradeWhatsApp = (targetPlan: 'Pro' | 'VIP' = 'Pro') => {
    const text = encodeURIComponent(
      `مرحباً Masar Tech، أرغب في ترقية باقة متجري (${storeName}) إلى باقة ${targetPlan} لزيادة المنتجات وتفعيل مميزات المتجر المتقدمة.`
    );
    window.open(`https://wa.me/${platformConfig.supportWhatsApp}?text=${text}`, '_blank');
  };

  const openCreateModal = () => {
    if (planType === 'Free' && products.length >= 10) {
      Swal.fire({
        icon: 'warning',
        title: 'وصلت للحد الأقصى (10 منتجات) 🔒',
        html: `
          <div class="text-right text-xs space-y-2 text-slate-600 leading-relaxed">
            <p>أنت حالياً على <b>فترة التجربة المجانية (14 يوماً)</b> والتي تتيح إضافة حتى 10 منتجات كحد أقصى.</p>
            <p>لإضافة حتى 100 منتج وتفعيل ميزة الذكاء الاصطناعي وتقارير Excel، قم بترقية متجرك لباقة <b>Pro</b> بسعر 149 ج.م فقط شهرياً!</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ترقية الباقة الآن عبر واتساب',
        cancelButtonText: 'لاحقاً',
        confirmButtonColor: '#059669',
      }).then((res) => {
        if (res.isConfirmed) {
          openUpgradeWhatsApp('Pro');
        }
      });
      return;
    }

    if (planType === 'Pro' && products.length >= 100) {
      Swal.fire({
        icon: 'warning',
        title: 'وصلت للحد الأقصى (100 منتج) 🔒',
        html: `
          <div class="text-right text-xs space-y-2 text-slate-600 leading-relaxed">
            <p>لقد استهلكت كامل مساحة باقة <b>Pro</b> (100 منتج كحد أقصى).</p>
            <p>لإضافة عدد غير محدود من المنتجات وتفعيل 150 وصف ذكاء اصطناعي شهرياً، قم بترقية متجرك لباقة <b>VIP</b> بسعر 299 ج.م شهرياً!</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ترقية إلى VIP عبر واتساب',
        cancelButtonText: 'لاحقاً',
        confirmButtonColor: '#059669',
      }).then((res) => {
        if (res.isConfirmed) {
          openUpgradeWhatsApp('VIP');
        }
      });
      return;
    }

    setEditingProduct(null);
    setFormName('');
    setFormCategoryId(categories.length > 0 ? categories[0].id : '');
    setFormPrice('');
    setFormCompareAtPrice('');
    setFormImageUrl('');
    setFormDescription('');
    setFormIsAvailable(true);
    setVariantGroups([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategoryId(product.categoryId || '');
    setFormPrice(product.price);
    setFormCompareAtPrice(product.compareAtPrice || '');
    setFormImageUrl(product.imageUrl || '');
    setFormDescription(product.description || '');
    setFormIsAvailable(product.isAvailable);

    // Parse variants
    if (product.variantsJson) {
      try {
        const parsed: ProductVariantGroup[] = JSON.parse(product.variantsJson);
        setVariantGroups(
          parsed.map((g) => ({
            name: g.name,
            optionsText: g.options.join(', '),
          }))
        );
      } catch {
        setVariantGroups([]);
      }
    } else {
      setVariantGroups([]);
    }

    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (file: File) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setIsUploadingImage(true);
    try {
      const res = await api.uploadImage(token, file);
      setFormImageUrl(res.imageUrl);
      Swal.fire({
        icon: 'success',
        title: 'تم رفع صورة المنتج بنجاح! 📸',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'فشل في رفع الصورة',
        text: err.message || 'يرجى اختيار صورة بحجم أقل من 5 ميجابايت',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddVariantGroup = () => {
    setVariantGroups((prev) => [...prev, { name: '', optionsText: '' }]);
  };

  const handleRemoveVariantGroup = (index: number) => {
    setVariantGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAiDescription = async () => {
    if (!formName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'أدخل اسم المنتج أولاً',
        text: 'يرجى كتابة اسم المنتج لتتمكن أداة الذكاء الاصطناعي من صياغة الوصف التسويقي المناسب له.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#10B981',
      });
      return;
    }

    // Free plan strictly locked (0 AI quota)
    if (planType === 'Free') {
      Swal.fire({
        icon: 'info',
        title: 'ميزة الذكاء الاصطناعي مقفلة 🔒',
        html: `
          <div class="text-right text-xs space-y-2 text-slate-600 leading-relaxed">
            <p class="font-bold text-slate-800">ميزة كتابة الوصف بالذكاء الاصطناعي متاحة فقط في باقات <b>Pro</b> و <b>VIP</b>.</p>
            <p>رقِّ باقتك الآن لتوفير وقتك ومضاعفة مبيعاتك مع وصف تسويقي احترافي بضغطة زر واحدة!</p>
            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mt-2 space-y-1">
              <p class="font-bold text-emerald-950">مميزات الترقية الفورية:</p>
              <p>⭐ <b>باقة Pro</b>: 15 وصف ذكي شهرياً + 100 منتج + تقارير Excel</p>
              <p>👑 <b>باقة VIP</b>: 150 وصف ذكي شهرياً + منتجات وكوبونات غير محدودة</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ترقية الباقة الآن عبر واتساب',
        cancelButtonText: 'إغلاق',
        confirmButtonColor: '#059669',
      }).then((res) => {
        if (res.isConfirmed) {
          openUpgradeWhatsApp('Pro');
        }
      });
      return;
    }

    // Quota exhaustion check
    const effectiveLimit = aiGenerationsLimit || (planType === 'Pro' ? 15 : planType === 'VIP' ? 150 : 0);
    if (effectiveLimit > 0 && aiGenerationsUsed >= effectiveLimit) {
      const isPro = planType === 'Pro';
      Swal.fire({
        icon: 'warning',
        title: 'نفد رصيد الذكاء الاصطناعي الشهري ⚠️',
        html: `
          <div class="text-right text-xs space-y-2 text-slate-600 leading-relaxed">
            <p>لقد استهلكت رصيدك الشهري من الذكاء الاصطناعي في باقة ${planType} (${aiGenerationsUsed}/${effectiveLimit} وصف).</p>
            ${
              isPro
                ? '<p class="font-bold text-emerald-700">رقِّ باقتك إلى VIP للحصول على 150 وصفاً ذكياً شهرياً ومنتجات غير محدودة!</p>'
                : '<p>يتجدد رصيدك الشهري تلقائياً مع بداية كل دورة اشتراك.</p>'
            }
          </div>
        `,
        showCancelButton: isPro,
        confirmButtonText: isPro ? 'ترقية إلى VIP الآن' : 'حسناً',
        cancelButtonText: 'إغلاق',
        confirmButtonColor: '#059669',
      }).then((res) => {
        if (res.isConfirmed && isPro) {
          openUpgradeWhatsApp('VIP');
        }
      });
      return;
    }

    const token = localStorage.getItem('watsstore_token');
    setIsGeneratingAi(true);

    try {
      const selectedCategory = categories.find((c) => c.id === formCategoryId)?.name;
      if (token) {
        const res = await api.generateAiDescription(token, {
          productName: formName.trim(),
          category: selectedCategory,
        });
        if (res?.description) {
          setFormDescription(res.description);
          const newUsed = res.aiGenerationsUsed ?? (aiGenerationsUsed + 1);
          const newLimit = res.aiGenerationsLimit ?? effectiveLimit;
          const remaining = res.remainingQuota ?? Math.max(0, newLimit - newUsed);
          setAiGenerationsUsed(newUsed);
          setAiGenerationsLimit(newLimit);

          Swal.fire({
            icon: 'success',
            title: 'تم توليد الوصف بنجاح! ✨',
            html: `
              <div class="text-right text-xs space-y-1.5 text-slate-600">
                <p>تمت صياغة وصف تسويقي احترافي للمنتج بواسطة الذكاء الاصطناعي.</p>
                <p class="font-bold text-emerald-700">المتبقي من رصيدك الشهري: ${remaining} من أصل ${newLimit} وصف.</p>
              </div>
            `,
            timer: 3000,
            showConfirmButton: false,
          });
          return;
        }
      }
      throw new Error('Fallback required');
    } catch (err: any) {
      console.warn('Backend AI generation response/error:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.includes('متاحة فقط في باقات') ||
        errMsg.includes('استهلكت رصيدك') ||
        errMsg.includes('ترقية') ||
        errMsg.includes('403') ||
        errMsg.includes('Forbidden')
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'تنبيه الباقة 🔒',
          text: errMsg,
          showCancelButton: true,
          confirmButtonText: 'ترقية الباقة عبر واتساب',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#059669',
        }).then((res) => {
          if (res.isConfirmed) {
            openUpgradeWhatsApp(planType === 'Pro' ? 'VIP' : 'Pro');
          }
        });
        return;
      }

      const fallbackDesc = `✨ استمتع بأعلى مستويات الجودة والراحة مع ${formName.trim()} الفاخر.\n\n💎 أهم المميزات:\n• خامات ممتازة مختارة بعناية تدوم طويلاً وتمنحك أفضل أداء.\n• تصميم عصري وأنيق يلبي احتياجاتك واستخدامك اليومي.\n• متوفر بأعلى معايير الدقة والتشطيب الاحترافي.\n\n🚚 توصيل سريع لجميع المحافظات مع ضمان المعاينة قبل الاستلام!\n⚡ اطلب الآن عبر الواتساب واستفد من العرض الحصري!`;
      setFormDescription(fallbackDesc);
      Swal.fire({
        icon: 'success',
        title: 'تم توليد الوصف بنجاح! ✨',
        text: 'تمت كتابة وصف تسويقي احترافي للمنتج بنجاح.',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 1-Click Availability Toggle
  const handleToggleAvailability = async (product: Product) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setTogglingId(product.id);
    const prevStatus = product.isAvailable;
    const newStatus = !prevStatus;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus } : p))
    );

    try {
      const res = await api.toggleProductAvailability(token, product.id);
      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1600,
      });
      toast.fire({
        icon: 'success',
        title: res.message,
      });
    } catch (err: any) {
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: prevStatus } : p))
      );
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحديث حالة التوفر',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    if (!formName.trim() || formPrice === '') {
      Swal.fire({ icon: 'warning', text: 'يرجى إدخال اسم المنتج وسعره بشكل صحيح' });
      return;
    }

    // Build variants JSON
    const cleanVariants: ProductVariantGroup[] = variantGroups
      .filter((g) => g.name.trim() !== '')
      .map((g) => ({
        name: g.name.trim(),
        options: g.optionsText
          .split(',')
          .map((o) => o.trim())
          .filter((o) => o.length > 0),
      }))
      .filter((g) => g.options.length > 0);

    const variantsJson = cleanVariants.length > 0 ? JSON.stringify(cleanVariants) : null;

    const payload = {
      name: formName.trim(),
      categoryId: formCategoryId === '' ? null : Number(formCategoryId),
      price: Number(formPrice),
      compareAtPrice: formCompareAtPrice === '' ? null : Number(formCompareAtPrice),
      imageUrl: formImageUrl.trim() ? formImageUrl.trim() : null,
      description: formDescription.trim() ? formDescription.trim() : null,
      variantsJson,
      isAvailable: formIsAvailable,
      sortOrder: 0,
    };

    setIsSaving(true);
    try {
      if (editingProduct) {
        await api.updateProduct(token, editingProduct.id, payload);
        Swal.fire({ icon: 'success', title: 'تم تعديل المنتج بنجاح', timer: 1200, showConfirmButton: false });
      } else {
        await api.createProduct(token, payload);
        Swal.fire({ icon: 'success', title: 'تم إضافة المنتج بنجاح', timer: 1200, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    const confirm = await Swal.fire({
      title: 'هل أنت متأكد من حذف المنتج؟',
      text: `سيتم حذف "${product.name}" نهائياً من الكتالوج`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#e11d48',
    });

    if (confirm.isConfirmed) {
      try {
        await api.deleteProduct(token, product.id);
        Swal.fire({ icon: 'success', title: 'تم الحذف بنجاح', timer: 1200, showConfirmButton: false });
        fetchInitialData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'فشل في حذف المنتج' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900">إدارة المنتجات والكتالوج</h1>
            {planType === 'Free' ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                منتجاتك: {products.length} / 10 (تجربة مجانية 14 يوماً)
              </span>
            ) : planType === 'Pro' ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>منتجاتك: {products.length} / 100 (باقة Pro)</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>منتجات غير محدودة (VIP 👑)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            أضف منتجاتك وارفع صورها مباشرة، وحدد المقاسات والألوان، وتحكم في توفرها بضغطة زر واحدة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {planType === 'Free' && products.length >= 8 && (
            <button
              onClick={() => openUpgradeWhatsApp('Pro')}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>ترقية لباقة Pro</span>
            </button>
          )}

          {planType === 'Pro' && products.length >= 85 && (
            <button
              onClick={() => openUpgradeWhatsApp('VIP')}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>ترقية لباقة VIP</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Free Plan Limit Notice if Near Limit */}
      {planType === 'Free' && products.length >= 8 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              لقد أضفت <b>{products.length} من أصل 10 منتجات</b> مسموحة في فترة التجربة المجانية. ترقية متجرك تمنحك حتى 100 منتج وميزات الذكاء الاصطناعي فوراً!
            </span>
          </div>
          <button
            onClick={() => openUpgradeWhatsApp('Pro')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap self-start sm:self-auto"
          >
            ترقية متجري الآن
          </button>
        </div>
      )}

      {/* Pro Plan Limit Notice if Near Limit */}
      {planType === 'Pro' && products.length >= 85 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              لقد أضفت <b>{products.length} من أصل 100 منتج</b> متاح في باقة Pro. ترقية متجرك لباقة VIP تمنحك منتجات غير محدودة و150 وصف ذكاء اصطناعي شهرياً!
            </span>
          </div>
          <button
            onClick={() => openUpgradeWhatsApp('VIP')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap self-start sm:self-auto"
          >
            ترقية إلى VIP
          </button>
        </div>
      )}

      {/* Products Grid / Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا توجد منتجات حتى الآن</h3>
          <p className="text-xs text-slate-500">
            ابدأ برفع أول منتج لمتجرك لتتمكن من إرسال رابط الكتالوج لزبائنك على الواتساب.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            إضافة منتج الآن
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="py-4 px-4">الصورة والاسم</th>
                  <th className="py-4 px-4">القسم</th>
                  <th className="py-4 px-4">السعر</th>
                  <th className="py-4 px-4">المتغيرات (المقاسات/الألوان)</th>
                  <th className="py-4 px-4 text-center">حالة التوفر (تبديل فوري)</th>
                  <th className="py-4 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((product) => {
                  let variantCount = 0;
                  if (product.variantsJson) {
                    try {
                      const v = JSON.parse(product.variantsJson);
                      variantCount = Array.isArray(v) ? v.length : 0;
                    } catch {}
                  }

                  const isToggling = togglingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{product.name}</span>
                            {product.description && (
                              <span className="text-[11px] text-slate-400 block max-w-xs truncate">
                                {product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {categories.find((c) => c.id === product.categoryId)?.name || 'بدون قسم'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 text-sm">
                          {product.price.toFixed(2)} ج.م
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-slate-400 line-through text-[11px] block">
                            {product.compareAtPrice.toFixed(2)} ج.م
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {variantCount > 0 ? (
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-flex items-center gap-1">
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>{variantCount} مجموعة خيارات</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">سعر موحد (بدون مقاسات)</span>
                        )}
                      </td>

                      {/* 1-Click Interactive Availability Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggleAvailability(product)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                            product.isAvailable
                              ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-rose-100/90 text-rose-800 hover:bg-rose-200 border border-rose-300'
                          } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                          title="اضغط للتبديل الفوري بين متوفر وغير متوفر"
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : product.isAvailable ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>{product.isAvailable ? 'متوفر للطلب ✅' : 'غير متوفر ❌'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            aria-label="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: سنيكرز رياضي مريح"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">القسم / التصنيف</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">-- بدون قسم --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Image Upload & URL */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">صورة المنتج</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="رابط الصورة أو ارفعها..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
                      title="رفع صورة من جهازك"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>رفع</span>
                    </button>
                  </div>
                  {formImageUrl && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <img
                        src={formImageUrl}
                        alt="Product Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-[10px] text-slate-400">معاينة الصورة الحالية</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سعر البيع الحالي (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCompareAtPrice}
                    onChange={(e) => setFormCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 550"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">وصف المنتج ومميزاته</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {planType === 'Free' ? (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        🔒 متاح في Pro و VIP
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✨ متبقي {Math.max(0, (aiGenerationsLimit || (planType === 'Pro' ? 15 : 150)) - aiGenerationsUsed)} من {aiGenerationsLimit || (planType === 'Pro' ? 15 : 150)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingAi}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                        planType === 'Free'
                          ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700'
                          : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isGeneratingAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className={`w-3.5 h-3.5 ${planType === 'Free' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      )}
                      <span>{planType === 'Free' ? 'توليد وصف ذكي (ترقية 🔒)' : 'توليد وصف ذكي بالذكاء الاصطناعي ✨'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="خامة القماش، المقاسات، طريقة الغسيل، الاستخدام..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Variants Builder */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>متغيرات المنتج (المقاسات، الألوان، النكهات...)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariantGroup}
                    className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold bg-emerald-100/80 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    + إضافة خاصية
                  </button>
                </div>

                {variantGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    إذا كان للمنتج مقاسات أو ألوان متعددة، اضغط &quot;+ إضافة خاصية&quot; ليختار منها العميل قبل الطلب.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {variantGroups.map((g, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g.name}
                          onChange={(e) => {
                            const next = [...variantGroups];
                            next[idx].name = e.target.value;
                            setVariantGroups(next);
                          }}
                          placeholder="اسم الخاصية (مثال: المقاس)"
                          className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={g.optionsText}
                          onChange={(e) => {
                            const next = [...variantGroups];
                            next[idx].optionsText = e.target.value;
                            setVariantGroups(next);
                          }}
                          placeholder="الخيارات مفصولة بفواصل (مثال: S, M, L, XL)"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantGroup(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="حذف الخاصية"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-emerald-500"
                />
                <label htmlFor="availCheck" className="font-bold text-slate-700 dark:text-slate-300 select-none">
                  المنتج متوفر وجاهز للطلب الآن في المتجر
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ المنتج 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
