export interface Paper {
  paperId: string;
  title: string;
  authors: Array<{ name: string }>;
  year: number | null;
  venue: string | null;
  citationCount: number;
  externalIds: {
    DOI?: string;
    ArXiv?: string;
    DBLP?: string;
  };
  url: string;
}

interface S2Response {
  data: Array<{
    paperId: string;
    title: string;
    authors: Array<{ name: string }>;
    year: number | null;
    venue: string;
    citationCount: number;
    externalIds: {
      DOI?: string;
      ArXiv?: string;
      DBLP?: string;
    };
  }>;
  next?: number;
}

export async function fetchPapers(authorId: string): Promise<Paper[]> {
  const allPapers: Paper[] = [];
  let offset = 0;
  const limit = 500;

  try {
    while (true) {
      const url = new URL(
        `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers`
      );
      url.searchParams.set(
        'fields',
        'title,authors,year,venue,citationCount,externalIds'
      );
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`Semantic Scholar API error: ${response.status}`);
        break;
      }

      const json: S2Response = await response.json();

      for (const item of json.data) {
        const paper: Paper = {
          paperId: item.paperId,
          title: item.title ?? 'Untitled',
          authors: item.authors ?? [],
          year: item.year ?? null,
          venue: item.venue ?? null,
          citationCount: item.citationCount ?? 0,
          externalIds: item.externalIds ?? {},
          url: item.externalIds?.DOI
            ? `https://doi.org/${item.externalIds.DOI}`
            : item.externalIds?.ArXiv
              ? `https://arxiv.org/abs/${item.externalIds.ArXiv}`
              : `https://www.semanticscholar.org/paper/${item.paperId}`,
        };
        allPapers.push(paper);
      }

      if (json.next) {
        offset = json.next;
      } else {
        break;
      }
    }
  } catch (e) {
    console.error('Failed to fetch papers:', e);
  }

  return allPapers
    .filter((p) => p.year != null)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}
