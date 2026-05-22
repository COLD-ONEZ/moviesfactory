// src/types/index.ts

export type Quality = "480p" | "720p" | "1080p" | "2160p" | "4K";
export type Language =
  | "English"
  | "Hindi"
  | "Tamil"
  | "Malayalam"
  | "Telugu"
  | "Kannada"
  | "Multi Audio";
export type ContentType = "movie" | "series";

export interface FileEntry {
  _id: string;
  buzzHeavierFileId: string;
  buzzHeavierFolderId: string;
  originalFilename: string;
  downloadUrl: string;
  quality: Quality;
  language: Language;
  fileSize: number; // bytes
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  _id: string;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
  files: FileEntry[];
}

export interface Season {
  _id: string;
  seasonNumber: number;
  title: string;
  overview?: string;
  posterPath?: string;
  airDate?: string;
  episodes: Episode[];
}

export interface Movie {
  _id: string;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  year: number;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  genres: string[];
  runtime?: number;
  rating: number;
  language?: string;
  tagline?: string;
  status: string;
  files: FileEntry[];
  isFeatured: boolean;
  featuredOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  _id: string;
  tmdbId?: number;
  tvmazeId?: number;
  title: string;
  originalTitle?: string;
  year: number;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  genres: string[];
  runtime?: number;
  rating: number;
  language?: string;
  tagline?: string;
  status: string;
  seasons: Season[];
  isFeatured: boolean;
  featuredOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequest {
  _id: string;
  title: string;
  type: ContentType;
  year?: number;
  requestedBy?: string;
  message?: string;
  status: "pending" | "fulfilled" | "rejected";
  createdAt: string;
}

export interface SyncLog {
  _id: string;
  folderId: string;
  filesDetected: number;
  filesAdded: number;
  filesRemoved: number;
  errors: string[];
  duration: number; // ms
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "superadmin";
  createdAt: string;
}

export interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalFiles: number;
  totalRequests: number;
  pendingRequests: number;
  recentSyncs: SyncLog[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParsedFilename {
  type: ContentType;
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  quality?: Quality;
  language?: Language;
}

export interface BuzzHeavierFile {
  id: string;
  name: string;
  size: number;
  url: string;
  createdAt: string;
  folderId: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
  status: string;
  original_language: string;
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  episode_run_time: number[];
  tagline: string;
  status: string;
  original_language: string;
}
