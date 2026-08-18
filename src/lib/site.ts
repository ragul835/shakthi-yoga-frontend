import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const SITE_NAME = 'SHAKTHI YOGA';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: 'website', images: ['/logo.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/logo.png'] },
  };
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
