import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type CmsFields = Record<string, string>;

export const cmsPages = [
  {
    label: 'Home Page',
    key: 'home',
    fields: {
      heroEyebrow: 'Mindful Movement for Every Body',
      heroImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1800&h=1100&fit=crop&auto=format',
      heroTitle: 'Find stillness within the flow.',
      heroDescription: 'SHAKTHI YOGA offers thoughtfully sequenced yoga classes — group and private — for every body and every stage of practice.',
      featuresEyebrow: 'Why Shakthi',
      featuresTitle: 'Yoga with intention, community at the center.',
      classesEyebrow: 'Join us',
      classesTitle: 'Upcoming Classes',
      testimonialsEyebrow: 'Student Stories',
      testimonialsTitle: 'Words from our community',
    },
  },
  {
    label: 'About Us',
    key: 'about',
    fields: {
      heroEyebrow: 'Our Story',
      storyImageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
      heroTitle: 'Rooted in tradition. Designed for modern life.',
      storyTitle: 'The meaning of Shakthi',
      storyParagraphOne: 'In yogic philosophy, Shakthi is the quality of balance, harmony, and light. It is the state of mind we strive for when we step onto the mat—a place where clarity meets calm.',
      storyParagraphTwo: 'Founded in 2014 by Saranya (Raji), SHAKTHI YOGA began as a small community gathering. Our goal was simple: to create a sanctuary where people could disconnect from the noise and reconnect with themselves.',
      storyParagraphThree: 'Today, SHAKTHI YOGA is a global virtual community offering intention-driven classes that honor ancient traditions while embracing modern life.',
      teamEyebrow: 'Meet the Team',
      teamTitle: 'Expert guides for your journey',
      contactEyebrow: 'Get in touch',
      contactTitle: 'We’d love to hear from you',
    },
  },
  {
    label: 'Pricing',
    key: 'pricing',
    fields: {
      heroEyebrow: 'Flexible Pricing',
      heroTitle: 'Class Passes',
      heroDescription: 'Choose the perfect pass for your yoga journey. No hidden fees, no lock-ins — just practice.',
      footerNote: 'Secure checkout · Cancel anytime · No hidden fees',
    },
  },
  {
    label: 'Contact & Global',
    key: 'contact',
    fields: {
      studioName: 'SHAKTHI YOGA',
      logoImageUrl: '/logo.png',
      studioDescription: 'A sanctuary for mindful movement. We offer in-person and online yoga classes for every level.',
      location: 'Pleasanton, CA',
      locationLabel: 'Private Studio · Pleasanton, CA',
      mapUrl: 'https://share.google/3dY6zIadXlKrMekTu',
      phone: '+1 804 972 6951',
      email: 'raji.saran2010@gmail.com',
      instagramUrl: 'https://www.instagram.com/',
      facebookUrl: 'https://www.facebook.com/',
      youtubeUrl: 'https://www.youtube.com/',
      ctaTitle: 'Your practice begins with one step.',
      ctaDescription: 'Join SHAKTHI YOGA today and begin your mindful movement journey.',
      newsletterDescription: 'Monthly reflections, class updates, and workshop announcements.',
      authImageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop',
    },
  },
] as const;

export type CmsPageKey = (typeof cmsPages)[number]['key'];

export const CMS_PREVIEW_STORAGE_PREFIX = 'shakthi_cms_preview_';

export function getCmsPage(key: CmsPageKey) {
  return cmsPages.find(page => page.key === key)!;
}

export function parseCmsContent(content: unknown, defaults: CmsFields): CmsFields {
  if (typeof content !== 'string') return defaults;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
    const safeEntries = Object.entries(parsed).filter(([key, value]) => {
      if (!Object.hasOwn(defaults, key) || typeof value !== 'string' || !value.trim()) return false;
      if (key.endsWith('Url')) {
        if (/imageUrl$/i.test(key) && value.startsWith('/')) return true;
        try { return new URL(value).protocol === 'https:'; } catch { return false; }
      }
      if (key === 'email') return /^\S+@\S+\.\S+$/.test(value);
      return true;
    });
    return { ...defaults, ...Object.fromEntries(safeEntries) };
  } catch {
    return defaults;
  }
}

export function useCmsPage(key: CmsPageKey): CmsFields {
  const defaults = getCmsPage(key).fields as CmsFields;
  const [content, setContent] = useState<CmsFields>(defaults);

  useEffect(() => {
    let cancelled = false;
    const previewKey = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cmsPreview') : null;
    if (previewKey === key) {
      try {
        const draft = window.localStorage.getItem(`${CMS_PREVIEW_STORAGE_PREFIX}${key}`);
        if (draft) {
          queueMicrotask(() => {
            if (!cancelled) setContent(parseCmsContent(draft, defaults));
          });
          return () => { cancelled = true; };
        }
      } catch {
        // Continue with published content if browser storage is unavailable.
      }
    }
    apiGet<{ content: string | null }>(`/site-content/${key}`)
      .then(result => {
        if (!cancelled) setContent(parseCmsContent(result.content, defaults));
      })
      .catch(() => {
        // Static defaults keep public pages usable during an API outage.
      });
    return () => { cancelled = true; };
  }, [key, defaults]);

  return content;
}
