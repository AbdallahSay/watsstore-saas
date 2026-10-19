import { 
  Store, 
  StoreDirectoryCard, 
  CreateOrderRequest, 
  CreateOrderResponse, 
  AuthResponse, 
  DashboardSummary,
  Category,
  Product,
  StoreReview,
  MerchantReviewsResponse,
  StoreCoupon,
  ApplyCouponResponse,
  MerchantAnalyticsResponse,
  AdminLoginResponse,
  AdminStoreSummary,
  AdminPlatformStats,
  ToggleStoreStatusResponse,
  AdminForgotPasswordResponse,
  StorePlanUpdateResponse,
  PlatformPricingSettings,
  AllPlansResponse,
  SubscriptionRequestItem,
  MerchantBillingStatus,
  PaymentGatewayItem
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://watsstore.runasp.net/api';

async function handleResponseError(res: Response): Promise<never> {
  // 401 Unauthorized handling: Auto-logout & redirect with strict session isolation
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const isCurrentAdmin = window.location.pathname.startsWith('/admin') || res.url.includes('/api/admin');
      if (isCurrentAdmin) {
        localStorage.removeItem('watsstore_admin_token');
        localStorage.removeItem('watsstore_admin_user');
        if (window.location.pathname !== '/admin/login' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin?session_expired=1';
        }
      } else {
        localStorage.removeItem('watsstore_merchant_token');
        localStorage.removeItem('watsstore_token');
        localStorage.removeItem('watsstore_user');
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login?session_expired=1';
        }
      }
    }
    let authMsg = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.';
    try {
      const errorData = await res.json();
      if (errorData?.message) authMsg = errorData.message;
    } catch {
      // fallback
    }
    throw new Error(authMsg);
  }

  // 403 Forbidden handling: RBAC & Tenant Isolation / Quota limits
  if (res.status === 403) {
    let forbiddenMsg = 'غير مصرح لك بتنفيذ هذه العملية.';
    try {
      const errorData = await res.json();
      if (errorData?.message) forbiddenMsg = errorData.message;
    } catch {
      // fallback
    }
    throw new Error(forbiddenMsg);
  }

  // 429 Too Many Requests handling: Rate limit protection
  if (res.status === 429) {
    let retryAfterMsg = 'لقد تجاوزت الحد المسموح من الطلبات السريعة. يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.';
    try {
      const errorData = await res.json();
      if (errorData?.message) retryAfterMsg = errorData.message;
    } catch {
      // fallback
    }
    throw new Error(retryAfterMsg);
  }

  let errorMsg = `HTTP Error ${res.status}`;
  try {
    const errorData = await res.json();
    errorMsg = errorData.message || JSON.stringify(errorData);
  } catch {
    errorMsg = res.statusText || errorMsg;
  }
  throw new Error(errorMsg);
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Next.js caching or revalidation
      next: options?.next,
      cache: options?.cache,
    });
  } catch {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      throw new Error('انقطع الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.');
    }
    throw new Error('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة لاحقاً.');
  }

  if (!res.ok) {
    await handleResponseError(res);
  }

  return res.json() as Promise<T>;
}

function safeSlug(slug: string): string {
  if (!slug) return '';
  try {
    return encodeURIComponent(decodeURIComponent(slug));
  } catch {
    return encodeURIComponent(slug);
  }
}

export const api = {
  // Public Store endpoints
  async getPublicStore(slug: string): Promise<Store> {
    return fetchJson<Store>(`${API_BASE_URL}/public/stores/${safeSlug(slug)}`, {
      cache: 'no-store', // Always get fresh store data for SSR
    });
  },

  async resolveQrCode(publicCode: string): Promise<{ canonicalSlug: string; storeName: string }> {
    return fetchJson<{ canonicalSlug: string; storeName: string }>(
      `${API_BASE_URL}/public/stores/qr/${encodeURIComponent(publicCode)}`
    );
  },

  async getDirectory(city?: string, category?: string): Promise<StoreDirectoryCard[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (category) params.append('category', category);
    const queryString = params.toString();
    const url = `${API_BASE_URL}/public/stores/directory${queryString ? `?${queryString}` : ''}`;
    return fetchJson<StoreDirectoryCard[]>(url, { next: { revalidate: 60 } });
  },

  async getSitemapData(): Promise<{ slugs: string[]; cities: string[]; categories: string[] }> {
    return fetchJson<{ slugs: string[]; cities: string[]; categories: string[] }>(
      `${API_BASE_URL}/public/stores/sitemap-data`,
      { next: { revalidate: 3600 } }
    );
  },

  // Orders
  async createWhatsAppOrder(storeSlug: string, orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return fetchJson<CreateOrderResponse>(`${API_BASE_URL}/public/stores/${safeSlug(storeSlug)}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Auth
  async register(data: any): Promise<AuthResponse> {
    return fetchJson<AuthResponse>(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: any): Promise<AuthResponse> {
    return fetchJson<AuthResponse>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Merchant Dashboard
  async getDashboardSummary(token: string): Promise<DashboardSummary> {
    return fetchJson<DashboardSummary>(`${API_BASE_URL}/merchant/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateStoreSettings(token: string, data: any): Promise<any> {
    return fetchJson<any>(`${API_BASE_URL}/merchant/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async getCategories(token: string): Promise<Category[]> {
    return fetchJson<Category[]>(`${API_BASE_URL}/merchant/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createCategory(token: string, data: { name: string; sortOrder: number; isActive: boolean }): Promise<Category> {
    return fetchJson<Category>(`${API_BASE_URL}/merchant/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateCategory(token: string, id: number, data: { name: string; sortOrder: number; isActive: boolean }): Promise<Category> {
    return fetchJson<Category>(`${API_BASE_URL}/merchant/categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(token: string, id: number): Promise<any> {
    return fetchJson<any>(`${API_BASE_URL}/merchant/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getProducts(token: string): Promise<Product[]> {
    return fetchJson<Product[]>(`${API_BASE_URL}/merchant/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createProduct(token: string, data: any): Promise<Product> {
    return fetchJson<Product>(`${API_BASE_URL}/merchant/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateProduct(token: string, id: string, data: any): Promise<Product> {
    return fetchJson<Product>(`${API_BASE_URL}/merchant/products/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(token: string, id: string): Promise<any> {
    return fetchJson<any>(`${API_BASE_URL}/merchant/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async toggleProductAvailability(token: string, productId: string): Promise<{ id: string; isAvailable: boolean; message: string }> {
    return fetchJson<{ id: string; isAvailable: boolean; message: string }>(
      `${API_BASE_URL}/merchant/products/${encodeURIComponent(productId)}/availability`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async uploadImage(token: string, file: File): Promise<{ imageUrl: string; relativeUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/merchant/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch {
      throw new Error('فشل رفع الصورة بسبب مشكلة في الاتصال بالشبكة.');
    }

    if (!res.ok) {
      await handleResponseError(res);
    }

    return res.json();
  },

  async uploadMultipleImages(
    token: string,
    files: File[]
  ): Promise<{ imageUrls: string[]; images: { imageUrl: string; relativeUrl: string; fileName: string; size: number }[]; count: number; message: string }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/merchant/products/upload-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch {
      throw new Error('فشل رفع الصور بسبب مشكلة في الاتصال بالشبكة.');
    }

    if (!res.ok) {
      await handleResponseError(res);
    }

    return res.json();
  },

  async getOrders(token: string, page = 1, pageSize = 50): Promise<{ total: number; page: number; pageSize: number; orders: any[] }> {
    return fetchJson<{ total: number; page: number; pageSize: number; orders: any[] }>(
      `${API_BASE_URL}/merchant/orders?page=${page}&pageSize=${pageSize}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async exportOrdersCsv(token: string): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/merchant/orders/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new Error('فشل تصدير الطلبات بسبب مشكلة في الاتصال بالشبكة.');
    }

    if (!res.ok) {
      await handleResponseError(res);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watsstore-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Customer Reviews
  async submitReview(storeSlug: string, data: { customerName: string; rating: number; comment: string }): Promise<{ message: string; reviewId: string }> {
    return fetchJson<{ message: string; reviewId: string }>(
      `${API_BASE_URL}/public/stores/${safeSlug(storeSlug)}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getMerchantReviews(token: string): Promise<MerchantReviewsResponse> {
    return fetchJson<MerchantReviewsResponse>(`${API_BASE_URL}/merchant/reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async toggleReviewApproval(token: string, reviewId: string, isApproved?: boolean): Promise<{ message: string; isApproved: boolean }> {
    return fetchJson<{ message: string; isApproved: boolean }>(
      `${API_BASE_URL}/merchant/reviews/${reviewId}/approve`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: isApproved !== undefined ? JSON.stringify({ isApproved }) : undefined,
      }
    );
  },

  async deleteReview(token: string, reviewId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE_URL}/merchant/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Promo Codes & Coupons
  async applyCoupon(storeSlug: string, data: { code: string; cartSubtotal: number }): Promise<ApplyCouponResponse> {
    return fetchJson<ApplyCouponResponse>(
      `${API_BASE_URL}/public/stores/${safeSlug(storeSlug)}/apply-coupon`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getMerchantCoupons(token: string): Promise<StoreCoupon[]> {
    return fetchJson<StoreCoupon[]>(`${API_BASE_URL}/merchant/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createMerchantCoupon(token: string, data: any): Promise<StoreCoupon> {
    return fetchJson<StoreCoupon>(`${API_BASE_URL}/merchant/coupons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async toggleCouponStatus(token: string, couponId: string): Promise<{ message: string; isActive: boolean }> {
    return fetchJson<{ message: string; isActive: boolean }>(
      `${API_BASE_URL}/merchant/coupons/${couponId}/toggle`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async deleteMerchantCoupon(token: string, couponId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE_URL}/merchant/coupons/${couponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Analytics & Revenue
  async getMerchantAnalytics(token: string): Promise<MerchantAnalyticsResponse> {
    return fetchJson<MerchantAnalyticsResponse>(`${API_BASE_URL}/merchant/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Super Admin Control Panel
  async adminLogin(data: { email?: string; password?: string; secretKey?: string }): Promise<AdminLoginResponse> {
    return fetchJson<AdminLoginResponse>(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdminPlatformStats(token: string): Promise<AdminPlatformStats> {
    return fetchJson<AdminPlatformStats>(`${API_BASE_URL}/admin/stats`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
    });
  },

  async getAdminStores(token: string, search?: string, status?: string): Promise<AdminStoreSummary[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const qs = params.toString();
    const url = `${API_BASE_URL}/admin/stores${qs ? `?${qs}` : ''}`;
    return fetchJson<AdminStoreSummary[]>(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
    });
  },

  async toggleStoreStatus(token: string, storeId: string): Promise<ToggleStoreStatusResponse> {
    return fetchJson<ToggleStoreStatusResponse>(`${API_BASE_URL}/admin/stores/${storeId}/toggle-status`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
    });
  },

  async deleteStore(token: string, storeId: string): Promise<{ id: string; message: string }> {
    return fetchJson<{ id: string; message: string }>(`${API_BASE_URL}/admin/stores/${storeId}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
    });
  },

  async adminUpdateStorePlan(token: string, storeId: string, plan: string, durationDays?: number): Promise<StorePlanUpdateResponse> {
    return fetchJson<StorePlanUpdateResponse>(`${API_BASE_URL}/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify({ plan, durationDays }),
    });
  },

  async adminExtendTrial(token: string, storeId: string, days: number = 14): Promise<StorePlanUpdateResponse> {
    return fetchJson<StorePlanUpdateResponse>(`${API_BASE_URL}/admin/stores/${storeId}/extend-trial`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify({ days }),
    });
  },

  async adminChangePassword(token: string, data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify(data),
    });
  },

  async adminForgotPassword(email: string): Promise<AdminForgotPasswordResponse> {
    return fetchJson<AdminForgotPasswordResponse>(`${API_BASE_URL}/admin/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async adminResetPassword(data: { email: string; resetToken: string; newPassword: string }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE_URL}/admin/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateAiDescription(token: string, data: { productName: string; category?: string; keywords?: string }): Promise<{ description: string; productName: string; status: string; aiGenerationsUsed?: number; aiGenerationsLimit?: number; remainingQuota?: number }> {
    return fetchJson<{ description: string; productName: string; status: string; aiGenerationsUsed?: number; aiGenerationsLimit?: number; remainingQuota?: number }>(`${API_BASE_URL}/merchant/ai/generate-description`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async getPublicPricing(): Promise<PlatformPricingSettings> {
    return fetchJson<PlatformPricingSettings>(`${API_BASE_URL}/public/pricing`);
  },

  async getAdminPricing(token: string): Promise<PlatformPricingSettings> {
    return fetchJson<PlatformPricingSettings>(`${API_BASE_URL}/admin/pricing`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
    });
  },

  async updateAdminPricing(token: string, data: Partial<PlatformPricingSettings>): Promise<{ message: string; settings: PlatformPricingSettings }> {
    return fetchJson<{ message: string; settings: PlatformPricingSettings }>(`${API_BASE_URL}/admin/pricing`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify(data),
    });
  },

  // Merchant Billing Endpoints
  async getMerchantBillingStatus(token: string): Promise<MerchantBillingStatus> {
    return fetchJson<MerchantBillingStatus>(`${API_BASE_URL}/merchant/billing/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  async getMerchantPaymentGateways(token?: string): Promise<PaymentGatewayItem[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetchJson<any>(`${API_BASE_URL}/merchant/billing/gateways`, { headers });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.gateways)) return res.gateways;
      return [];
    } catch (err) {
      console.warn('Failed to fetch merchant payment gateways:', err);
      return [];
    }
  },

  async submitMerchantUpgradeRequest(token: string, data: { planType: string; billingCycle: string; paymentMethod: string; destinationAccount?: string; senderIdentifier?: string; transactionId: string; notes?: string }): Promise<any> {
    return fetchJson<any>(`${API_BASE_URL}/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async cancelMerchantUpgradeRequest(token: string, id: string): Promise<{ message: string; request: SubscriptionRequestItem }> {
    return fetchJson<{ message: string; request: SubscriptionRequestItem }>(`${API_BASE_URL}/merchant/billing/upgrade-request/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  // Admin Payment Gateways
  async getAdminPaymentGateways(token: string): Promise<PaymentGatewayItem[]> {
    try {
      const res = await fetchJson<any>(`${API_BASE_URL}/admin/payment-gateways`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
        }
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.gateways)) return res.gateways;
      return [];
    } catch (err) {
      console.warn('Failed to fetch admin payment gateways:', err);
      return [];
    }
  },

  async updateAdminPaymentGateways(token: string, gateways: PaymentGatewayItem[]): Promise<{ message: string; gateways: PaymentGatewayItem[] }> {
    return fetchJson<{ message: string; gateways: PaymentGatewayItem[] }>(`${API_BASE_URL}/admin/payment-gateways`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify({ gateways }),
    });
  },

  // Admin Plans & Dynamic Quotas
  async getAdminPlans(token: string): Promise<AllPlansResponse> {
    return fetchJson<AllPlansResponse>(`${API_BASE_URL}/admin/plans`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      }
    });
  },

  async updateAdminPlans(token: string, data: Partial<PlatformPricingSettings>): Promise<{ message: string; settings: PlatformPricingSettings }> {
    return fetchJson<{ message: string; settings: PlatformPricingSettings }>(`${API_BASE_URL}/admin/plans`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify(data),
    });
  },

  // Admin Subscription Requests
  async getAdminPendingSubscriptions(token: string): Promise<SubscriptionRequestItem[]> {
    try {
      const res = await fetchJson<any>(`${API_BASE_URL}/admin/subscriptions/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
        }
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.requests)) return res.requests;
      return [];
    } catch (err) {
      console.warn('Failed to fetch admin pending subscriptions:', err);
      return [];
    }
  },

  async getAdminAllSubscriptions(token: string, status?: string): Promise<SubscriptionRequestItem[]> {
    try {
      const url = status ? `${API_BASE_URL}/admin/subscriptions?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/admin/subscriptions`;
      const res = await fetchJson<any>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
        }
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.subscriptions)) return res.subscriptions;
      return [];
    } catch (err) {
      console.warn('Failed to fetch admin all subscriptions:', err);
      return [];
    }
  },

  async approveAdminSubscription(token: string, id: string): Promise<{ message: string; request: SubscriptionRequestItem }> {
    return fetchJson<{ message: string; request: SubscriptionRequestItem }>(`${API_BASE_URL}/admin/subscriptions/${id}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      }
    });
  },

  async rejectAdminSubscription(token: string, id: string, adminNotes?: string): Promise<{ message: string; request: SubscriptionRequestItem }> {
    return fetchJson<{ message: string; request: SubscriptionRequestItem }>(`${API_BASE_URL}/admin/subscriptions/${id}/reject`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify({ adminNotes })
    });
  },
};
