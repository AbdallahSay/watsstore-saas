'use client';

import { useState, useEffect } from 'react';
import { Product, ProductVariantGroup } from '../types';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedVariants: Record<string, string>) => void;
}

export default function ProductModal({
  product,
  currency,
  isOpen,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [variantGroups, setVariantGroups] = useState<ProductVariantGroup[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setValidationError(null);
      let groups: ProductVariantGroup[] = [];
      if (product.variantsJson) {
        try {
          groups = JSON.parse(product.variantsJson);
        } catch {
          groups = [];
        }
      }
      setVariantGroups(groups);

      // Default selections (first option of each group)
      const initial: Record<string, string> = {};
      groups.forEach((g) => {
        if (g.options && g.options.length > 0) {
          initial[g.name] = g.options[0];
        }
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  // Lock body scroll when product modal is open
  useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.isAvailable === false;

  const handleConfirm = () => {
    if (isOutOfStock) {
      setValidationError('نعتذر، هذا المنتج غير متوفر حالياً في المخزون');
      return;
    }

    // Validate that all variant groups have a selection
    for (const group of variantGroups) {
      if (!selectedVariants[group.name]) {
        setValidationError(`يرجى تحديد اختيار لـ: ${group.name}`);
        return;
      }
    }

    onAddToCart(product, quantity, selectedVariants);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-sm"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        {product.imageUrl && (
          <div className="relative w-full h-64 bg-slate-100 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                خصم {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
              </span>
            )}
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col gap-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {product.price.toFixed(2)} {currency}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm font-semibold text-slate-400 line-through">
                {product.compareAtPrice.toFixed(2)} {currency}
              </span>
            )}
          </div>

          {/* Out of Stock Notice */}
          {isOutOfStock && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <span>⚠️ هذا المنتج غير متوفر حالياً في المخزون ولا يمكن إضافته للسلة.</span>
            </div>
          )}

          {/* Variants Selection */}
          {variantGroups.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {variantGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {group.name}: <span className="text-emerald-600 dark:text-emerald-400">{selectedVariants[group.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isSelected = selectedVariants[group.name] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [group.name]: option,
                            }));
                            setValidationError(null);
                          }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 border min-h-[44px] ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {validationError && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
              {validationError}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">الكمية:</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 font-bold disabled:opacity-40 active:scale-95 transition-transform"
                aria-label="إنقاص الكمية"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-slate-900 dark:text-white text-base">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 font-bold disabled:opacity-40 active:scale-95 transition-transform"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sticky Add to Cart Submit Button */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-3 pb-safe border-t border-slate-100 dark:border-slate-800 -mx-6 -mb-6 px-6">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleConfirm}
              className={`w-full min-h-[48px] py-3.5 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                isOutOfStock
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>
                {isOutOfStock
                  ? 'المنتج غير متوفر حالياً'
                  : `إضافة إلى السلة (${(product.price * quantity).toFixed(2)} ${currency})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
