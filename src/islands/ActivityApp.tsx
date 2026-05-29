import { useState, useEffect, useMemo } from 'preact/hooks';
import CitySelector from './CitySelector.tsx';
import CategoryTabs from './CategoryTabs.tsx';
import ActivityList from './ActivityList.tsx';

interface Props {
  activities: Activity[];
  cities: CityConfig[];
  initialCity: string;
  translations: Record<string, string>;
  locale: string;
}

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card bg-white dark:bg-gray-900 p-6 animate-pulse">
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-1" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default function ActivityApp({ activities, cities, initialCity, translations, locale }: Props) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, 'wantToGo' | 'beenThere'>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('activity-bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    } catch { /* localStorage unavailable */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('activity-bookmarks', JSON.stringify(bookmarks));
    } catch { /* quota exceeded */ }
  }, [bookmarks]);

  const handleBookmark = (id: string, type: 'wantToGo' | 'beenThere') => {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[id] === type) {
        delete next[id];
      } else {
        next[id] = type;
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return activities
      .filter((a) => a.city === selectedCity)
      .filter((a) => !activeCategory || a.category === activeCategory);
  }, [activities, selectedCity, activeCategory]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{translations.error}</p>
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-80"
        >
          {translations.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-module">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <CitySelector
            cities={cities}
            selected={selectedCity}
            onChange={(city) => {
              setSelectedCity(city);
              setActiveCategory(null);
            }}
            placeholder={translations.searchCity}
            locale={locale}
          />
        </div>

        <CategoryTabs
          active={activeCategory}
          onChange={setActiveCategory}
          translations={translations}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{translations.noActivities}</p>
          </div>
        ) : (
          <ActivityList
            activities={filtered}
            bookmarks={bookmarks}
            onBookmark={handleBookmark}
            translations={translations}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
