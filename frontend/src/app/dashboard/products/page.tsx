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

  const openUpgradeWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً Masar Tech، أرغب في ترقية باقة متجري (${storeName}) إلى باقة Pro لإضافة منتجات غير محدودة وتفعيل مميزات المتجر المتقدمة.`
    );
    window.open(`https://wa.me/${platformConfig.supportWhatsApp}?text=${text}`, '_blank');
  };

  const openCreateModal = () => {
    if (planType === 'Free' && products.length >= 15) {
      Swal.fire({
        icon: 'warning',
        title: 'وصلت للحد الأقصى (15 منتج) 🔒',
        html: `
          <div class="text-right text-xs space-y-2 text-slate-600 leading-relaxed">
            <p>أنت حالياً على <b>الباقة المجانية</b> والتي تتيح إضافة حتى 15 منتج كحد أقصى.</p>
            <p>لإضافة عدد غير محدود من المنتجات وتفعيل Meta Pixel، قم بترقية متجرك لباقة <b>Pro</b> بسعر 149 ج.م فقط شهرياً!</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ترقية الباقة الآن عبر واتساب',
        cancelButtonText: 'لاحقاً',
        confirmButtonColor: '#059669',
      }).then((res) => {
        if (res.isConfirmed) {
          openUpgradeWhatsApp();
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
                منتجاتك: {products.length} / 15 (الباقة المجانية)
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>منتجات غير محدودة ({planType})</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            أضف منتجاتك وارفع صورها مباشرة، وحدد المقاسات والألوان، وتحكم في توفرها بضغطة زر واحدة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {planType === 'Free' && products.length >= 12 && (
            <button
              onClick={openUpgradeWhatsApp}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>ترقية لمنتجات غير محدودة</span>
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
      {planType === 'Free' && products.length >= 14 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              لقد استخدمت <b>{products.length} من أصل 15 منتجاً</b> متاحاً في باقتك المجانية. ترقية متجرك تمنحك منتجات غير محدودة فوراً!
            </span>
          </div>
          <button
            onClick={openUpgradeWhatsApp}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap self-start sm:self-auto"
          >
            ترقية متجري الآن
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: سنيكرز رياضي مريح"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم / التصنيف</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- بدون قسم --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Image Upload & URL */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">صورة المنتج</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="رابط الصورة أو ارفعها..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:border-emerald-500"
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
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center gap-1 border border-slate-200 whitespace-nowrap"
                      title="رفع صورة من جهازك"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>رفع</span>
                    </button>
                  </div>
                  {formImageUrl && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <img
                        src={formImageUrl}
                        alt="Product Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                      />
                      <span className="text-[10px] text-slate-400">معاينة الصورة الحالية</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع الحالي (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCompareAtPrice}
                    onChange={(e) => setFormCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 550"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المنتج ومميزاته</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="خامة القماش، المقاسات، طريقة الغسيل، الاستخدام..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Variants Builder */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>متغيرات المنتج (المقاسات، الألوان، النكهات...)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariantGroup}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg"
                  >
                    + إضافة خاصية
                  </button>
                </div>

                {variantGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
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
                          className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
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
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantGroup(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg"
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
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="availCheck" className="font-bold text-slate-700 select-none">
                  المنتج متوفر وجاهز للطلب الآن في المتجر
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
