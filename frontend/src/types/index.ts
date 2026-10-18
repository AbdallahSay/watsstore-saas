export interface ProductVariantGroup {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  categoryId?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  variantsJson?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  isActive?: boolean;
  productCount?: number;
}

export interface Store {
  id: string;
  storeName: string;
  slug: string;
  publicCode: string;
  whatsAppNumber: string;
  businessCategory: string;
  city: string;
  addressDetails?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  themeColor: string;
  currency: string;
  deliveryFee: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaPixelId?: string | null;
  planType: string;
  categories: Category[];
  products: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants: Record<string, string>;
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItemRequest[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  whatsAppRedirectUrl: string;
  formattedMessage: string;
}

export interface AuthResponse {
  token: string;
  storeId: string;
  storeName: string;
  ownerName: string;
  slug: string;
  publicCode: string;
  planType: string;
  email: string;
  whatsAppNumber: string;
  themeColor: string;
  currency: string;
  city: string;
  businessCategory: string;
}

export interface DashboardSummary {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  storeInfo: {
    id: string;
    storeName: string;
    ownerName: string;
    email: string;
    slug: string;
    publicCode: string;
    whatsAppNumber: string;
    businessCategory: string;
    city: string;
    addressDetails?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    themeColor: string;
    currency: string;
    deliveryFee: number;
    seoTitle?: string | null;
    seoDescription?: string | null;
    metaPixelId?: string | null;
    planType: string;
    isActive: boolean;
    createdAt: string;
  };
  recentOrders: {
    id: string;
    orderNumber: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNotes?: string | null;
    itemsJson: string;
    totalAmount: number;
    createdAt: string;
  }[];
}

export interface StoreDirectoryCard {
  storeName: string;
  slug: string;
  publicCode: string;
  businessCategory: string;
  city: string;
  logoUrl?: string | null;
  themeColor: string;
  currency: string;
  deliveryFee: number;
  productCount: number;
}
