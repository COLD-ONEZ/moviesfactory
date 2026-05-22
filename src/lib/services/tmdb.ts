// src/lib/services/tmdb.ts
import type { TMDBMovie, TMDBSeries } from "@/types";

const BASE = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!KEY) {
    console.warn("[TMDB] No API key configured");
    return null;
  }
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function searchMovieTMDB(title: string, year?: number): Promise<TMDBMovie | null> {
  const params: Record<string, string> = { query: title, include_adult: "false" };
  if (year) params.year = String(year);

  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/movie", params);
  if (!data?.results?.length) return null;

  // Best match: exact title or first result
  const exact = data.results.find(
    (m) => m.title.toLowerCase() === title.toLowerCase()
  );
  return exact ?? data.results[0];
}

export async function searchSeriesTMDB(title: string, year?: number): Promise<TMDBSeries | null> {
  const params: Record<string, string> = { query: title, include_adult: "false" };
  if (year) params.first_air_date_year = String(year);

  const data = await tmdbFetch<{ results: TMDBSeries[] }>("/search/tv", params);
  if (!data?.results?.length) return null;

  const exact = data.results.find(
    (s) => s.name.toLowerCase() === title.toLowerCase()
  );
  return exact ?? data.results[0];
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie | null> {
  return tmdbFetch<TMDBMovie>(`/movie/${tmdbId}`);
}

export async function getSeriesDetails(tmdbId: number): Promise<TMDBSeries | null> {
  return tmdbFetch<TMDBSeries>(`/tv/${tmdbId}`);
}

export async function getTMDBEpisode(
  tmdbId: number,
  season: number,
  episode: number
): Promise<{ name: string; overview: string; still_path: string; air_date: string; runtime: number } | null> {
  return tmdbFetch(`/tv/${tmdbId}/season/${season}/episode/${episode}`);
}

export function tmdbImageUrl(path: string, size: "w500" | "w780" | "original" = "w500"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
