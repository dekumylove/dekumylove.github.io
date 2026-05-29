import zh from '../i18n/zh.json';
import en from '../i18n/en.json';

export type Locale = 'zh' | 'en';
type Dict = Record<string, unknown>;

const dictionaries: Record<Locale, Dict> = { zh, en };

export function useTranslations(locale: string | undefined) {
  const l: Locale = locale === 'en' ? 'en' : 'zh';
  const dict = dictionaries[l];

  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = dict;
    for (const k of keys) {
      if (typeof value !== 'object' || value === null) {
        console.warn(`[i18n] Missing key: "${key}" for ${l}`);
        return key;
      }
      value = (value as Dict)[k];
    }
    if (typeof value !== 'string') {
      console.warn(`[i18n] Non-string value for key: "${key}" in ${l}`);
      return key;
    }
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
    }
    return value;
  };
}
