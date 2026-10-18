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
  vodafoneCashNumber?: string | null;
  instaPayAddress?: string | null;
  planType: string;
  averageRating?: number;
  totalReviews?: number;
  reviews?: StoreReview[];
  categories: Category[];
  products: Product[];
}

export interface StoreReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved?: boolean;
  createdAt: string;
}

export interface MerchantReview {
  id: string;
  storeId: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface MerchantReviewsResponse {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  averageRating: number;
  reviews: MerchantReview[];
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
  paymentMethod?: string;
  couponCode?: string;
  items: OrderItemRequest[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: number;
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  deliveryFee: number;
  totalAmount: number;
  whatsAppRedirectUrl: string;
  formattedMessage: string;
}

export interface StoreCoupon {
  id: string;
  storeId: string;
  code: string;
  discountType: 'Percentage' | 'FixedAmount' | string;
  discountValue: number;
  expiryDate?: string | null;
  usageLimit?: number | null;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApplyCouponResponse {
  isValid: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  newSubtotal: number;
  message: string;
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
    vodafoneCashNumber?: string | null;
    instaPayAddress?: string | null;
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
    paymentMethod?: string;
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

export interface DailySalesDataPoint {
  date: string;
  formattedDate: string;
  revenue: number;
  ordersCount: number;
}

export interface TopProductAnalytics {
  productId: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  unitsSold: number;
  totalRevenue: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface MerchantAnalyticsResponse {
  totalRevenue: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  totalProductsCount: number;
  totalViews: number;
  thisMonthRevenue: number;
  thisMonthOrdersCount: number;
  lastMonthRevenue: number;
  growthPercentage: number;
  currency: string;
  dailySales: DailySalesDataPoint[];
  topProducts: TopProductAnalytics[];
  paymentMethodsBreakdown: PaymentMethodStat[];
}

export interface AdminLoginResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

export interface AdminStoreSummary {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  whatsAppNumber: string;
  slug: string;
  publicCode: string;
  subdomain: string;
  businessCategory: string;
  city: string;
  planType: string;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  productsCount: number;
  totalRevenue: number;
  viewCount: number;
}

export interface AdminPlatformStats {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalReviews: number;
  totalViews: number;
  recentStores: AdminStoreSummary[];
  topStores: AdminStoreSummary[];
}

export interface ToggleStoreStatusResponse {
  id: string;
  isActive: boolean;
  message: string;
}

export interface AdminForgotPasswordResponse {
  message: string;
  resetToken: string;
  expiresInMinutes: number;
}

