'use client';

import { Store as StoreType } from '../types';
import { ShoppingBag, MapPin, Tag, Store as StoreIcon, Phone } from 'lucide-react';

interface StoreNavbarProps {
  store: StoreType;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export default function StoreNavbar({
  store,
  cartCount,
  cartTotal,
  onOpenCart,
}: StoreNavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Store Brand / Logo */}
        <div className="flex items-center gap-3">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.storeName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div
              style={{ backgroundColor: store.themeColor || '#10B981' }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/10"
            >
              <StoreIcon className="w-6 h-6" />
            </div>
          )}

          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
              {store.storeName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {store.city}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                <Tag className="w-3 h-3 text-slate-400" />
                {store.businessCategory}
              </span>
            </div>
          </div>
        </div>

        {/* Cart Trigger Button */}
        <button
          onClick={onOpenCart}
          style={{ backgroundColor: store.themeColor || '#10B981' }}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white font-bold shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
          aria-label="عرض سلة التسوق"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </div>
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs font-semibold opacity-90">السلة</span>
            <span className="text-sm font-black">
              {cartTotal.toFixed(2)} {store.currency}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
