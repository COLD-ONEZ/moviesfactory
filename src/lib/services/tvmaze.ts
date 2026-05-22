// src/lib/services/tvmaze.ts

const BASE = "https://api.tvmaze.com";

export interface TVMazeShow {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number;
  rating: { average: number };
  image: { medium: string; original: string } | null;
  summary: string;
  premiered: string;
}

export interface TVMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  runtime: number;
  airdate: string;
  image: { medium: string; original: string } | null;
  summary: string;
}

async function tvmazeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function searchSeriesTVMaze(title: string): Promise<TVMazeShow | null> {
  const data = await tvmazeFetch<{ score: number; show: TVMazeShow }[]>(
    `/search/shows?q=${encodeURIComponent(title)}`
  );
  if (!data?.length) return null;
  return data[0].show;
}

export async function getShowEpisodes(tvmazeId: number): Promise<TVMazeEpisode[]> {
  const data = await tvmazeFetch<TVMazeEpisode[]>(`/shows/${tvmazeId}/episodes`);
  return data ?? [];
}

export async function getEpisode(
  tvmazeId: number,
  season: number,
  episode: number
): Promise<TVMazeEpisode | null> {
  return tvmazeFetch<TVMazeEpisode>(
    `/shows/${tvmazeId}/episodebynumber?season=${season}&number=${episode}`
  );
}
