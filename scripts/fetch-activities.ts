/**
 * Activity data fetch script.
 * Run by GitHub Actions cron job (weekly) to populate src/data/activities.json.
 *
 * For now, this is a scaffold. It will be extended with real API integrations
 * (Eventbrite, SerpAPI, etc.) once API keys are configured.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface RawActivity {
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  city: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  price_min: number | null;
  price_max: number | null;
  source_url: string;
  source: string;
  tags: string[];
}

interface FetcherResult {
  activities: RawActivity[];
  source: string;
  errors: string[];
}

function ok(activities: RawActivity[], source = 'unknown'): FetcherResult {
  return { activities, source, errors: [] };
}

function fail(source: string, error: string): FetcherResult {
  return { activities: [], source, errors: [error] };
}

async function fetchFromEventbrite(city: { id: string; lat: number; lng: number }): Promise<FetcherResult> {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) return fail('eventbrite', 'No API key configured');

  try {
    const url = new URL('https://www.eventbriteapi.com/v3/events/search/');
    url.searchParams.set('location.latitude', String(city.lat));
    url.searchParams.set('location.longitude', String(city.lng));
    url.searchParams.set('location.within', '50km');
    url.searchParams.set('sort_by', 'date');
    url.searchParams.set('expand', 'venue,image');
    url.searchParams.set('token', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return fail('eventbrite', `HTTP ${res.status}`);

    const body = await res.json();
    const activities: RawActivity[] = (body.events ?? []).map((e: any) => ({
      title: e.name?.text ?? '',
      description: e.description?.text ?? '',
      image_url: e.logo?.url ?? null,
      category: 'entertainment',
      city: city.id,
      start_time: e.start?.utc ?? null,
      end_time: e.end?.utc ?? null,
      location: e.venue?.address?.localized_address_display ?? '',
      price_min: null,
      price_max: null,
      source_url: e.url ?? '',
      source: 'eventbrite',
      tags: [],
    }));

    return ok(activities, 'eventbrite');
  } catch (e: any) {
    return fail('eventbrite', e.message);
  }
}

async function searchFallback(city: { id: string; name_zh: string }): Promise<FetcherResult> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return fail('search', 'No API key configured');

  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('q', `${city.name_zh} 周末 情侣 活动`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('engine', 'google');
    url.searchParams.set('hl', 'zh-CN');
    url.searchParams.set('gl', 'cn');
    url.searchParams.set('num', '10');

    const res = await fetch(url.toString());
    if (!res.ok) return fail('search', `HTTP ${res.status}`);

    const body = await res.json();
    const activities: RawActivity[] = (body.organic_results ?? []).map((r: any) => ({
      title: r.title ?? '',
      description: r.snippet ?? '',
      image_url: r.thumbnail ?? null,
      category: 'entertainment',
      city: city.id,
      start_time: null,
      end_time: null,
      location: city.name_zh,
      price_min: null,
      price_max: null,
      source_url: r.link ?? '',
      source: 'search',
      tags: [],
    }));

    return ok(activities, 'search');
  } catch (e: any) {
    return fail('search', e.message);
  }
}

function deduplicate(activities: RawActivity[]): RawActivity[] {
  const seen = new Set<string>();
  return activities.filter((a) => {
    const key = `${a.title}|${a.city}|${a.start_time ?? ''}`.toLowerCase().replace(/[^a-z0-9|]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const cities = [
    { id: 'beijing', name_zh: '北京', name_en: 'Beijing', lat: 39.9042, lng: 116.4074 },
  ];

  const allActivities: RawActivity[] = [];
  const errors: string[] = [];

  for (const city of cities) {
    const results = await Promise.allSettled([
      fetchFromEventbrite(city),
      searchFallback(city),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allActivities.push(...result.value.activities);
        errors.push(...result.value.errors);
      } else {
        errors.push(result.reason?.message ?? 'Unknown error');
      }
    }
  }

  const deduped = deduplicate(allActivities);
  const trimmed = deduped.slice(0, 200);

  // Only write if we got new data
  if (trimmed.length > 0) {
    const dataPath = join(process.cwd(), 'src', 'data', 'activities.json');
    writeFileSync(dataPath, JSON.stringify(trimmed, null, 2));
    console.log(`[fetch] Wrote ${trimmed.length} activities to activities.json`);
  } else {
    console.log('[fetch] No activities found, keeping existing data');
  }

  if (errors.length > 0) {
    console.warn('[fetch] Errors:', errors);
  }
}

main().catch((e) => {
  console.error('[fetch] Fatal error:', e);
  process.exit(1);
});
