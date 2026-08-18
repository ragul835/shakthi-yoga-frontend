import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SHAKTHI YOGA',
    short_name: 'Shakthi Yoga',
    description: 'Mindful yoga classes for every body and every stage of practice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f5ef',
    theme_color: '#7b5e45',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  };
}
