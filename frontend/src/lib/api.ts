import { 
  Store, 
  StoreDirectoryCard, 
  CreateOrderRequest, 
  CreateOrderResponse, 
  AuthResponse, 
  DashboardSummary,
  Category,
  Product
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://watsstore.runasp.net/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    // Next.js caching or revalidation
    next: options?.next,
    cache: options?.cache,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || JSON.stringify(errorData);
    } catch {
      // fallback to status text
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
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
};
