import ActivityCard from './ActivityCard.tsx';

interface Props {
  activities: Activity[];
  bookmarks: Record<string, string>;
  onBookmark: (id: string, type: 'wantToGo' | 'beenThere') => void;
  translations: Record<string, string>;
  locale: string;
}

export default function ActivityList({ activities, bookmarks, onBookmark, translations, locale }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          bookmark={bookmarks[activity.id] as 'wantToGo' | 'beenThere' | undefined}
          onBookmark={(type) => onBookmark(activity.id, type)}
          translations={translations}
          locale={locale}
        />
      ))}
    </div>
  );
}
