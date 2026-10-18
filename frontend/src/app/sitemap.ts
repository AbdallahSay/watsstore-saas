import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

    // Store storefronts
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

    // Programmatic Local SEO city pages
    if (data.cities && data.cities.length > 0) {
      data.cities.forEach((city) => {
        routes.push({
          url: `${baseUrl}/directory?city=${encodeURIComponent(city)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }

    // Programmatic Category pages
    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((category) => {
        routes.push({
          url: `${baseUrl}/directory?category=${encodeURIComponent(category)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
        });
      });
    }
  } catch (error) {
    // If backend is not reached during static generation, return baseline routes
  }

  return routes;
}
