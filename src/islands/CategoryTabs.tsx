import { CATEGORIES } from '../lib/activities';

interface Props {
  active: string | null;
  onChange: (category: string | null) => void;
  translations: Record<string, string>;
}

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  outdoor: '🏔️',
  crafts: '🎨',
  performances: '🎭',
  food: '🍽️',
  travel: '✈️',
  entertainment: '🎮',
};

export default function CategoryTabs({ active, onChange, translations }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          active === null
            ? 'bg-[var(--accent)] text-white shadow-md'
            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[var(--accent)]'
        }`}
      >
        {translations.allCategories}
      </button>
      {CATEGORIES.map((cat) => {
        const label = translations[cat] || cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              active === cat
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[var(--accent)]'
            }`}
          >
            {CATEGORY_ICONS[cat]} {label}
          </button>
        );
      })}
    </div>
  );
}
