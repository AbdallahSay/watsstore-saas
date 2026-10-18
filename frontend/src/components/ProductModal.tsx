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

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
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
            <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-emerald-600">
              {product.price.toFixed(2)} {currency}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm font-semibold text-slate-400 line-through">
                {product.compareAtPrice.toFixed(2)} {currency}
              </span>
            )}
          </div>

          {/* Variants Selection */}
          {variantGroups.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {variantGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {group.name}: <span className="text-emerald-600">{selectedVariants[group.name]}</span>
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
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-600/20'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {validationError}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">الكمية:</span>
            <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 font-bold"
                aria-label="إنقاص الكمية"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-slate-900 text-base">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 font-bold"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Submit Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>إضافة إلى السلة ({(product.price * quantity).toFixed(2)} {currency})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
