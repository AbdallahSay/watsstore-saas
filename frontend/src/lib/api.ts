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
  StorePlanUpdateResponse
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://watsstore.runasp.net/api';

async function handleResponseError(res: Response): Promise<never> {
  // 401 Unauthorized handling: Auto-logout & redirect to login if merchant session expired
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('watsstore_token');
      localStorage.removeItem('watsstore_user');
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/login?session_expired=1';
      }
    }
    throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.');
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

export const api = {
  // Public Store endpoints
  async getPublicStore(slug: string): Promise<Store> {
    return fetchJson<Store>(`${API_BASE_URL}/public/stores/${encodeURIComponent(slug)}`, {
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
    return fetchJson<CreateOrderResponse>(`${API_BASE_URL}/public/stores/${encodeURIComponent(storeSlug)}/orders`, {
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
      `${API_BASE_URL}/public/stores/${encodeURIComponent(storeSlug)}/reviews`,
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
      `${API_BASE_URL}/public/stores/${encodeURIComponent(storeSlug)}/apply-coupon`,
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

  async adminUpdateStorePlan(token: string, storeId: string, plan: string): Promise<StorePlanUpdateResponse> {
    return fetchJson<StorePlanUpdateResponse>(`${API_BASE_URL}/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': token.startsWith('WatsStore_') ? token : '',
      },
      body: JSON.stringify({ plan }),
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

  async generateAiDescription(token: string, data: { productName: string; category?: string; keywords?: string }): Promise<{ description: string; productName: string; status: string }> {
    return fetchJson<{ description: string; productName: string; status: string }>(`${API_BASE_URL}/merchant/ai/generate-description`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};
