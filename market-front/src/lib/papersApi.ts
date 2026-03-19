import { api } from "@/lib/api";

export type PaperSearchResult = {
  id: string;
  title: string;
  year: number | null;
  citedByCount: number;
  doi: string | null;
  abstractText: string;
  authors: string[];
};

export type PaperSearchResponse = {
  results: PaperSearchResult[];
  totalCount: number;
  page: number;
  size: number;
};

export type GraphNode = {
  id: string;
  title: string;
  year: number | null;
  citations: number;
  doi: string | null;
  seed: boolean;
  firstAuthor?: string | null;
};

export type GraphLink = { source: string; target: string };

export type PaperGraphResponse = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export function searchPapers(q: string, page = 0, size = 25): Promise<PaperSearchResponse> {
  return api<PaperSearchResponse>("/papers/search", {
    params: { q, page: String(page), size: String(size) },
  });
}

export function fetchPaperGraph(workId: string): Promise<PaperGraphResponse> {
  const id = workId.startsWith("W") ? workId : `W${workId}`;
  return api<PaperGraphResponse>(`/papers/graph/${id}`);
}
