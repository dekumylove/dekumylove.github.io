import { useState, useEffect } from 'preact/hooks';

export default function AcademicFilter({ years, translations }) {
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('year');

  useEffect(() => {
    const items = document.querySelectorAll('.paper-item');
    let visible = Array.from(items);

    // Filter by year
    if (selectedYear) {
      visible = visible.filter(
        (el) => el.dataset.year === selectedYear
      );
    }

    // Sort
    const sorted = [...visible].sort((a, b) => {
      if (sortBy === 'citations') {
        return (Number(b.dataset.citations) || 0) - (Number(a.dataset.citations) || 0);
      }
      return (Number(b.dataset.year) || 0) - (Number(a.dataset.year) || 0);
    });

    // Update DOM order and visibility
    const container = document.querySelector('.paper-list');
    if (!container) return;

    items.forEach((el) => (el.style.display = 'none'));
    sorted.forEach((el) => {
      el.style.display = '';
      container.appendChild(el);
    });
  }, [selectedYear, sortBy]);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {translations.filterYear}
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">{translations.allYears}</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {translations.sortBy}
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="year">{translations.sortYear}</option>
          <option value="citations">{translations.sortCitations}</option>
        </select>
      </div>
    </div>
  );
}
