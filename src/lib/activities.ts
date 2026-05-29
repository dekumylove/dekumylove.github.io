export type ActivityCategory =
  | 'outdoor'
  | 'crafts'
  | 'performances'
  | 'food'
  | 'travel'
  | 'entertainment';

export interface Activity {
  id: string;
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  image_url: string | null;
  category: ActivityCategory;
  city: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  location_zh?: string;
  price_min: number | null;
  price_max: number | null;
  source_url: string;
  source: string;
  tags: string[];
}

export interface CityConfig {
  id: string;
  name_zh: string;
  name_en: string;
  lat: number;
  lng: number;
}

export const CATEGORIES: ActivityCategory[] = [
  'outdoor',
  'crafts',
  'performances',
  'food',
  'travel',
  'entertainment',
];

export function getLocalizedActivity(activity: Activity, locale: string): {
  title: string;
  description: string;
  location: string;
} {
  const isZh = locale === 'zh';
  return {
    title: (isZh && activity.title_zh) ? activity.title_zh : activity.title,
    description: (isZh && activity.description_zh) ? activity.description_zh : activity.description,
    location: (isZh && activity.location_zh) ? activity.location_zh : activity.location,
  };
}

export function formatPrice(activity: Activity): string {
  if (activity.price_min === null && activity.price_max === null) return '';
  if (activity.price_min === 0 && (activity.price_max === 0 || activity.price_max === null)) return 'free';
  if (activity.price_min !== null && activity.price_max !== null && activity.price_min === activity.price_max) {
    return `${activity.price_min}`;
  }
  const min = activity.price_min !== null ? `${activity.price_min}` : '';
  const max = activity.price_max !== null ? `${activity.price_max}` : '';
  if (min && max) return `${min} - ${max}`;
  if (min) return `${min}+`;
  return `≤${max}`;
}
