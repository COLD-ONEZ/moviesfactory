// src/lib/services/filenameParser.ts
import type { ParsedFilename, Quality, Language } from "@/types";

const QUALITIES: Quality[] = ["4K", "2160p", "1080p", "720p", "480p"];
const LANGUAGES: Language[] = [
  "Multi Audio",
  "Malayalam",
  "Kannada",
  "Telugu",
  "English",
  "Tamil",
  "Hindi",
];

// Regex for series detection: S01E01 or S1E1 patterns
const SERIES_REGEX = /[Ss](\d{1,2})[Ee](\d{1,2})/;

// Year pattern
const YEAR_REGEX = /\b(19\d{2}|20\d{2})\b/;

// Quality patterns
const QUALITY_PATTERNS: Record<Quality, RegExp> = {
  "4K": /\b(4[Kk]|UHD|uhd)\b/,
  "2160p": /\b2160p\b/i,
  "1080p": /\b1080p\b/i,
  "720p": /\b720p\b/i,
  "480p": /\b480p\b/i,
};

// Language patterns
const LANGUAGE_PATTERNS: Record<Language, RegExp> = {
  "Multi Audio": /\b(multi[\s._-]?audio|dual[\s._-]?audio|multi)\b/i,
  Malayalam: /\b(malayalam|mal)\b/i,
  Kannada: /\b(kannada|kan)\b/i,
  Telugu: /\b(telugu|tel)\b/i,
  English: /\b(english|eng)\b/i,
  Tamil: /\b(tamil|tam)\b/i,
  Hindi: /\b(hindi|hin)\b/i,
};

// Extensions to strip
const EXT_REGEX = /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v)$/i;

export function parseFilename(filename: string): ParsedFilename {
  // Remove extension
  const clean = filename.replace(EXT_REGEX, "");

  // Check if series
  const seriesMatch = clean.match(SERIES_REGEX);
  const isSeries = !!seriesMatch;

  // Detect quality
  let quality: Quality | undefined;
  for (const q of QUALITIES) {
    if (QUALITY_PATTERNS[q].test(clean)) {
      quality = q;
      break;
    }
  }

  // Detect language
  let language: Language | undefined;
  for (const lang of LANGUAGES) {
    if (LANGUAGE_PATTERNS[lang].test(clean)) {
      language = lang;
      break;
    }
  }

  // Detect year
  const yearMatch = clean.match(YEAR_REGEX);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  // Extract title
  let title = clean;

  if (isSeries && seriesMatch) {
    // Everything before S01E01
    const seriesIdx = clean.search(SERIES_REGEX);
    title = clean.substring(0, seriesIdx);
  } else {
    // For movies: remove year and everything after
    if (yearMatch) {
      const yearIdx = clean.indexOf(yearMatch[0]);
      title = clean.substring(0, yearIdx);
    }
  }

  // Clean up title: replace dots/underscores/hyphens with spaces
  title = title
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize words
  title = title
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    type: isSeries ? "series" : "movie",
    title,
    year,
    season: seriesMatch ? parseInt(seriesMatch[1]) : undefined,
    episode: seriesMatch ? parseInt(seriesMatch[2]) : undefined,
    quality,
    language: language ?? "English",
  };
}

export function generateSlug(title: string, year?: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return year ? `${base}-${year}` : base;
}
