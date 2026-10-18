'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, Product, CartItem } from '@/types';
import StoreNavbar from '@/components/StoreNavbar';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import CartDrawer from '@/components/CartDrawer';
import { pixel } from '@/lib/pixel';
import { 
  Search, 
  MapPin, 
  Phone, 
  Tag, 
  ShoppingBag, 
  Sparkles, 
  Store as StoreIcon,
  CheckCircle2,
  AlertTriangle
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
              {store.addressDetails && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
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
    </div>
  );
}
