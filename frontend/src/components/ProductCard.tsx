'use client';

import { Product, ProductVariantGroup } from '../types';
import { Plus, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: string;
  themeColor?: string;
  onSelectProduct: (product: Product) => void;
}

export default function ProductCard({
  product,
  currency,
  themeColor = '#10B981',
  onSelectProduct,
}: ProductCardProps) {
  let hasVariants = false;
  if (product.variantsJson) {
    try {
      const parsed: ProductVariantGroup[] = JSON.parse(product.variantsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        hasVariants = true;
      }
    } catch {
      hasVariants = false;
    }
  }

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const isOutOfStock = product.isAvailable === false;

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer ${
        isOutOfStock ? 'opacity-75' : ''
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <ImageIcon className="w-12 h-12" />
            <span className="text-xs mt-1">لا توجد صورة</span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 bg-rose-600/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
            نفد من المخزون
          </span>
        ) : discountPercent ? (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
            خصم {discountPercent}%
          </span>
        ) : null}

        {/* Variants badge */}
        {hasVariants && (
          <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
            <span>خيارات ومقاسات</span>
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {product.price.toFixed(2)} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{currency}</span>
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through -mt-0.5">
                {product.compareAtPrice.toFixed(2)} {currency}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) {
                onSelectProduct(product);
              }
            }}
            style={{ backgroundColor: isOutOfStock ? undefined : themeColor }}
            className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-md transition-all ${
              isOutOfStock 
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60 text-slate-500' 
                : 'hover:scale-105 active:scale-95'
            }`}
            aria-label={isOutOfStock ? 'نفد من المخزون' : 'إضافة للسلة'}
            title={isOutOfStock ? 'المنتج غير متوفر حالياً' : 'إضافة للسلة'}
          >
            {hasVariants ? (
              <SlidersHorizontal className="w-4 h-4" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
