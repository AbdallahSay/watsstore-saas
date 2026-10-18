'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, Product, CartItem, StoreReview } from '@/types';
import StoreNavbar from '@/components/StoreNavbar';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import CartDrawer from '@/components/CartDrawer';
import { pixel } from '@/lib/pixel';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  Search, 
  MapPin, 
  Phone, 
  Tag, 
  ShoppingBag, 
  Sparkles, 
  Store as StoreIcon,
  CheckCircle2,
  AlertTriangle,
  Star,
  ShieldCheck,
  MessageSquare,
  ThumbsUp,
  X,
  Check,
  Send
} from 'lucide-react';

interface StoreCatalogClientProps {
  store: Store;
}

export default function StoreCatalogClient({ store }: StoreCatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<StoreReview[]>(store.reviews || []);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Cart total calculations
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Filter products by category and search
  const filteredProducts = store.products.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' || product.categoryId === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectProduct = (product: Product) => {
    // Fire Meta Pixel ViewContent event
    if (store.metaPixelId) {
      pixel.viewContent(store.metaPixelId, {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'EGP',
      });
    }

    let hasVariants = false;
    if (product.variantsJson) {
      try {
        const parsed = JSON.parse(product.variantsJson);
        if (Array.isArray(parsed) && parsed.length > 0) hasVariants = true;
      } catch {
        hasVariants = false;
      }
    }

    if (hasVariants) {
      setModalProduct(product);
    } else {
      handleAddToCart(product, 1, {});
    }
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedVariants: Record<string, string>
  ) => {
    // Fire Meta Pixel AddToCart event
    if (store.metaPixelId) {
      pixel.addToCart(store.metaPixelId, {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price * quantity,
        currency: 'EGP',
      });
    }

    setCartItems((prev) => {
      // Check if same product with exact same variants exists
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      } else {
        return [...prev, { product, quantity, selectedVariants }];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
    } else {
      setCartItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], quantity };
        return next;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى كتابة اسمك الكريم' });
      return;
    }
    if (!reviewComment.trim()) {
      Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى كتابة نص رأيك وتجربتك' });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await api.submitReview(store.slug, {
        customerName: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setIsReviewModalOpen(false);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);

      Swal.fire({
        icon: 'success',
        title: 'شكراً لتقييمك!',
        text: res.message || 'تم إرسال تقييمك بنجاح وسيظهر في صفحة المتجر بعد مراجعة المتجر.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#10b981',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في إرسال التقييم، يرجى المحاولة لاحقاً',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Store Header Navbar */}
      <StoreNavbar
        store={store}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Store Banner / Cover */}
      {store.coverUrl && (
        <div className="relative w-full h-44 sm:h-64 bg-slate-900 overflow-hidden">
          <img
            src={store.coverUrl}
            alt={store.storeName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Store Profile Info Card */}
      <div className="max-w-6xl mx-auto px-4 w-full -mt-10 sm:-mt-12 relative z-10 mb-8">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-lg bg-white shrink-0"
              />
            ) : (
              <div
                style={{ backgroundColor: store.themeColor }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shrink-0"
              >
                <StoreIcon className="w-8 h-8" />
              </div>
            )}

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {store.storeName}
              </h2>

              {/* Trust Badge & Rating Summary */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <a
                  href="#customer-reviews"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.averageRating ? store.averageRating.toFixed(1) : '5.0'} / 5</span>
                  <span className="text-amber-700 font-normal">
                    ({store.totalReviews ?? (reviews.length || 0)} تقييم)
                  </span>
                </a>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>متجر موثوق</span>
                </div>
              </div>

              {store.addressDetails && (
                <p className="text-xs sm:text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{store.addressDetails}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <a
              href={`https://wa.me/${store.whatsAppNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>مراسلة المتجر مباشرة</span>
            </a>

            <div className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <span>التوصيل:</span>
              <span className="font-bold text-emerald-600">
                {store.deliveryFee > 0 ? `${store.deliveryFee} ${store.currency}` : 'مجاني'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Section */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1 pb-16">
        {/* Search & Categories Navigation */}
        <div className="space-y-4 mb-8">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج بالاسم أو المواصفات..."
              className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Categories Horizontal Tabs */}
          {store.categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                الكل ({store.products.length})
              </button>

              {store.categories.map((cat) => {
                const count = store.products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                      activeCategory === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد منتجات مطابقة للبحث</h3>
            <p className="text-xs text-slate-500">
              جرب تغيير الكلمات المفتاحية أو اختر قسماً آخر.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={store.currency}
                themeColor={store.themeColor}
                onSelectProduct={handleSelectProduct}
              />
            ))}
          </div>
        )}

        {/* Customer Reviews & Trust Badges Section */}
        <section id="customer-reviews" className="mt-16 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </span>
                <h3 className="text-xl font-black text-slate-900">آراء وتجارب العملاء</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  موثوق ومُعتمد
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                تجارب حقيقية وتقييمات معتمدة من مشتري وعملاء متجر {store.storeName}.
              </p>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Star className="w-4 h-4 fill-white text-white" />
              <span>اكتب تقييمك الآن</span>
            </button>
          </div>

          {/* Rating Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-center sm:text-right w-full sm:w-auto">
              <div>
                <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                  <span className="text-4xl font-black text-amber-500">
                    {store.averageRating ? store.averageRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(store.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  بناءً على {store.totalReviews ?? (reviews.length || 0)} تجربة شراء موثقة
                </span>
              </div>

              <div className="h-14 w-px bg-slate-200 hidden sm:block" />

              <div className="space-y-1 text-right text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>تأكيد موثوقية الطلبات والتوصيل السريع</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>شفافية كاملة في الأسعار والمنتجات</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                شاركنا تجربتك مع المتجر
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Star className="w-7 h-7 fill-amber-300" />
              </div>
              <h4 className="text-base font-bold text-slate-800">كن أول من يكتب تقييماً لهذا المتجر!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                هل اشتريت من متجر {store.storeName}؟ شارك رأيك لمساعدة المشترين الآخرين ودعم التاجر.
              </p>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>أضف أول تقييم</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reviews.map((rev) => {
                const dateStr = new Date(rev.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {rev.customerName.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-tight">
                              {rev.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {dateStr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تجربة شراء موثقة</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Cart Bar (Mobile) */}
      {cartCount > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-4 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: store.themeColor }}
            className="w-full py-3.5 px-5 rounded-2xl text-white font-black shadow-2xl flex items-center justify-between animate-bounce"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>عرض السلة ({cartCount})</span>
            </div>
            <span className="text-sm">
              {cartTotal.toFixed(2)} {store.currency}
            </span>
          </button>
        </div>
      )}

      {/* Viral SEO Footer for Free Stores */}
      {store.planType === 'Free' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-3 px-4 text-center text-xs font-bold shadow-inner">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 hover:underline"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ تم إنشاء هذا المتجر مجاناً عبر منصة WatsStore by Masar Tech — أنشئ متجرك في دقيقتين</span>
          </Link>
        </div>
      )}

      {/* Product Variants Modal */}
      <ProductModal
        product={modalProduct}
        currency={store.currency}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        store={store}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute left-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  شاركنا رأيك في {store.storeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رأيك يهمنا ويساعد الآخرين في خوض تجربة شراء ممتازة
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  تقييمك للمتجر والخدمة:
                </label>
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(null)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 hover:scale-125 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 cursor-pointer transition-colors ${
                            star <= (hoverRating ?? reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-black text-amber-800">
                    {(hoverRating ?? reviewRating) === 5 && 'ممتاز جداً ⭐⭐⭐⭐⭐'}
                    {(hoverRating ?? reviewRating) === 4 && 'جيد جداً ⭐⭐⭐⭐'}
                    {(hoverRating ?? reviewRating) === 3 && 'جيد ومقبول ⭐⭐⭐'}
                    {(hoverRating ?? reviewRating) === 2 && 'أقل من المتوقع ⭐⭐'}
                    {(hoverRating ?? reviewRating) === 1 && 'غير راضٍ ⭐'}
                  </span>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسمك الكريم (أو الاسم المستعار) *
                </label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="مثال: أحمد مصطفى أو سارة م."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Comment Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رأيك وتجربتك بالتفصيل *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="شاركنا رأيك في جودة المنتجات، سرعة التوصيل، والتعامل عبر الواتساب..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Moderation Note */}
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  لضمان مصداقية التقييمات وحمايتها من السبام، سيظهر تقييمك في المتجر فور مراجعته واعتماده.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  style={{ backgroundColor: store.themeColor }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال التقييم</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
