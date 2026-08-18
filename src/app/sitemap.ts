import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ['/', 'weekly', 1],
    ['/about', 'monthly', 0.8],
    ['/classes', 'daily', 0.9],
    ['/pricing', 'weekly', 0.8],
    ['/contact', 'monthly', 0.7],
    ['/testimonials', 'weekly', 0.7],
    ['/terms', 'yearly', 0.3],
    ['/privacy', 'yearly', 0.3],
  ] as const;

  return routes.map(([path, changeFrequency, priority]) => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency,
    priority,
  }));
}
