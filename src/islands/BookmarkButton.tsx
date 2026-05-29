import { useState } from 'preact/hooks';

interface Props {
  bookmark?: 'wantToGo' | 'beenThere';
  onClick: (type: 'wantToGo' | 'beenThere') => void;
  labels: { wantToGo: string; beenThere: string };
}

export default function BookmarkButton({ bookmark, onClick, labels }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (bookmark) {
            onClick(bookmark);
          } else {
            setOpen(!open);
          }
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          bookmark
            ? 'bg-rose-500 text-white shadow-md'
            : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-rose-500 backdrop-blur-sm'
        }`}
        title={bookmark ? labels[bookmark] : ''}
      >
        <svg
          className="w-5 h-5"
          fill={bookmark ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width={bookmark ? '0' : '2'}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {open && !bookmark && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick('wantToGo');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ❤️ {labels.wantToGo}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick('beenThere');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✅ {labels.beenThere}
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        />
      )}
    </div>
  );
}
