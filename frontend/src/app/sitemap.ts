import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

// Never promote known QA fixture storefronts into search results.
// This is intentionally conservative: ambiguous merchant slugs require manual review.
const QA_SLUG_PATTERNS = [
  /^متجر-التدقيق-/u,
  /^متجر-التاجر-[أب](?:-|$)/u,
  /^متجر-إي-تو-إي-/u,
  /^متجر-التجربة-الذكية-/u,
  /^hardened-store-/i,
  /^متجر-[أبج]-\d/u,
  /^ععععع$/u,
];

export function isEligibleSitemapSlug(slug: string): boolean {
  return Boolean(slug?.trim()) && !QA_SLUG_PATTERNS.some((pattern) => pattern.test(slug.trim()));
}

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
      data.slugs.filter(isEligibleSitemapSlug).forEach((slug) => {
        routes.push({
          url: `${baseUrl}/s/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.85,
        });
      });
    }

    // Directory facet/query combinations aren't standalone editorial landing pages.
    // Publish them only after uniqueness, canonical, and content quality audits.
  } catch (error) {
    // Backend unavailable: keep only reliable, static platform URLs.
    console.warn('Sitemap storefront data unavailable; serving base routes only', error);
  }

  return routes;
}
