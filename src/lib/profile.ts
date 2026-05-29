import profile from '../data/profile.json';

export interface Profile {
  name_zh: string;
  name_en: string;
  title_zh: string;
  title_en: string;
  bio_zh: string;
  bio_en: string;
  avatar: string;
  social: {
    github: string;
    scholar: string;
    email: string;
    twitter: string;
    linkedin: string;
  };
  scholar_author_id: string;
}

export function getProfile(): Profile {
  return profile as Profile;
}

export function getProfileField<K extends keyof Profile>(field: K): Profile[K] {
  return (profile as Profile)[field];
}

export function getLocalized(locale: string | undefined, zhField: string, enField: string): string {
  return locale === 'en' ? enField : zhField;
}
