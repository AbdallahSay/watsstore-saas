import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const EGYPT_CITIES = [
  'الفيوم',
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'المنصورة',
  'طنطا',
  'أسيوط',
  'سوهاج',
  'المنيا',
  'بني سويف',
  'الشرقية',
  'القليوبية',
  'بورسعيد',
];

const POPULAR_CATEGORIES = [
  'ملابس وأزياء',
  'مطاعم وأكلات',
  'حلويات ومخبوزات',
  'عطور ومستحضرات تجميل',
  'إكسسوارات وهدايا',
  'أحذية وحقائب',
  'إلكترونيات وموبايل',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app';
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const data = await api.getSitemapData();

    // 1. Store storefronts (/s/[slug])
    if (data.slugs && data.slugs.length > 0) {
      data.slugs.forEach((slug) => {
        routes.push({
          url: `${baseUrl}/s/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.85,
        });
      });
    }

    const citiesToInclude = Array.from(new Set([...(data.cities || []), ...EGYPT_CITIES]));
    const categoriesToInclude = Array.from(new Set([...(data.categories || []), ...POPULAR_CATEGORIES]));

    // 2. City Directory Pages
    citiesToInclude.forEach((city) => {
      routes.push({
        url: `${baseUrl}/directory?city=${encodeURIComponent(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // 3. Category Directory Pages
    categoriesToInclude.forEach((category) => {
      routes.push({
        url: `${baseUrl}/directory?category=${encodeURIComponent(category)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });

    // 4. Programmatic City + Category Pages (/directory/[city]/[category])
    citiesToInclude.forEach((city) => {
      categoriesToInclude.forEach((cat) => {
        routes.push({
          url: `${baseUrl}/directory/${encodeURIComponent(city)}/${encodeURIComponent(cat)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    });
  } catch (error) {
    // If backend is not reached during static build, provide baseline programmatic routes
    EGYPT_CITIES.slice(0, 5).forEach((city) => {
      POPULAR_CATEGORIES.forEach((cat) => {
        routes.push({
          url: `${baseUrl}/directory/${encodeURIComponent(city)}/${encodeURIComponent(cat)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
        });
      });
    });
  }

  return routes;
}
