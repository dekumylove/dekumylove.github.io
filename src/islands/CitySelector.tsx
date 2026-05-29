import { useState, useRef, useEffect } from 'preact/hooks';

interface Props {
  cities: CityConfig[];
  selected: string;
  onChange: (cityId: string) => void;
  placeholder: string;
  locale: string;
}

export default function CitySelector({ cities, selected, onChange, placeholder, locale }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const selectedCity = cities.find((c) => c.id === selected);
  const displayName = locale === 'zh' ? selectedCity?.name_zh : selectedCity?.name_en;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:border-[var(--accent)] transition-colors"
      >
        <span>{displayName || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                onChange(city.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent-light)] dark:hover:bg-gray-800 transition-colors ${
                city.id === selected
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {locale === 'zh' ? city.name_zh : city.name_en}
              {city.id === selected && (
                <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
