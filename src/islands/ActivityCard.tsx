import { useState } from 'preact/hooks';
import BookmarkButton from './BookmarkButton.tsx';
import { getLocalizedActivity, formatPrice } from '../lib/activities';

interface Props {
  activity: Activity;
  bookmark?: 'wantToGo' | 'beenThere';
  onBookmark: (type: 'wantToGo' | 'beenThere') => void;
  translations: Record<string, string>;
  locale: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  outdoor: '🏔️',
  crafts: '🎨',
  performances: '🎭',
  food: '🍽️',
  travel: '✈️',
  entertainment: '🎮',
};

export default function ActivityCard({ activity, bookmark, onBookmark, translations, locale }: Props) {
  const [expanded, setExpanded] = useState(false);
  const localized = getLocalizedActivity(activity, locale);
  const price = formatPrice(activity);

  return (
    <div className="card bg-white dark:bg-gray-900 overflow-hidden">
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
        {activity.image_url ? (
          <img
            src={activity.image_url}
            alt={localized.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center text-4xl ${activity.image_url ? 'hidden' : ''}`}>
          {CATEGORY_ICONS[activity.category] || '📌'}
        </div>
        <div className="absolute top-3 right-3">
          <BookmarkButton
            bookmark={bookmark}
            onClick={onBookmark}
            labels={{
              wantToGo: translations.wantToGo || 'Want to go',
              beenThere: translations.beenThere || 'Been there',
            }}
          />
        </div>
        {activity.source && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
            {activity.source}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {localized.title}
        </h3>
        <p className={`text-sm text-gray-500 dark:text-gray-400 ${expanded ? '' : 'line-clamp-2'}`}>
          {localized.description}
        </p>
        {localized.description.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--accent)] mt-1 hover:underline"
          >
            {expanded ? '收起' : '更多'}
          </button>
        )}

        <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{localized.location}</span>
          </div>
          {activity.start_time && (
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{new Date(activity.start_time).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
            </div>
          )}
          {price && price !== 'free' && (
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span className="text-[var(--accent)] font-medium">{price} CNY</span>
            </div>
          )}
          {price === 'free' && (
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
          )}
        </div>

        <a
          href={activity.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {translations.source || 'Source'} →
        </a>
      </div>
    </div>
  );
}
