// src/lib/services/syncEngine.ts
import { connectDB } from "@/lib/db/connect";
import { listFolderFiles, getConfiguredFolderIds } from "./buzzheavier";
import { parseFilename, generateSlug } from "./filenameParser";
import { searchMovieTMDB, searchSeriesTMDB, getTMDBEpisode, tmdbImageUrl } from "./tmdb";
import { searchSeriesTVMaze, getEpisode as getTVMazeEpisode } from "./tvmaze";
import FileModel from "@/models/File";
import MovieModel from "@/models/Movie";
import SeriesModel from "@/models/Series";
import { SyncLogModel } from "@/models/Admin";
import type { BuzzHeavierFile } from "@/types";

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v)$/i;

export interface SyncResult {
  filesDetected: number;
  filesAdded: number;
  filesRemoved: number;
  errors: string[];
  duration: number;
}

/**
 * Main sync function. Call this from cron or manual trigger.
 */
export async function runSync(folderIds?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let filesDetected = 0;
  let filesAdded = 0;
  let filesRemoved = 0;

  await connectDB();

  const ids = folderIds ?? getConfiguredFolderIds();
  if (!ids.length) {
    return { filesDetected: 0, filesAdded: 0, filesRemoved: 0, errors: ["No folder IDs configured"], duration: 0 };
  }

  for (const folderId of ids) {
    try {
      const remoteFiles = await listFolderFiles(folderId);
      const videoFiles = remoteFiles.filter((f) => VIDEO_EXTENSIONS.test(f.name));
      filesDetected += videoFiles.length;

      // Build set of current remote file IDs
      const remoteIds = new Set(videoFiles.map((f) => f.id));

      // ── Find deleted files ────────────────────────────────────────────────
      const existingFiles = await FileModel.find({ buzzHeavierFolderId: folderId });
      for (const existing of existingFiles) {
        if (!remoteIds.has(existing.buzzHeavierFileId)) {
          await removeFile(existing.buzzHeavierFileId);
          filesRemoved++;
        }
      }

      // ── Process new files ─────────────────────────────────────────────────
      const existingIds = new Set(existingFiles.map((f) => f.buzzHeavierFileId));
      const newFiles = videoFiles.filter((f) => !existingIds.has(f.id));

      for (const file of newFiles) {
        try {
          await processFile(file, folderId);
          filesAdded++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`[${file.name}] ${msg}`);
          console.error(`[Sync] Error processing ${file.name}:`, err);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[Folder ${folderId}] ${msg}`);
    }
  }

  const duration = Date.now() - start;

  // Save sync log
  for (const folderId of ids) {
    await SyncLogModel.create({
      folderId,
      filesDetected,
      filesAdded,
      filesRemoved,
      errors,
      duration,
    });
  }

  return { filesDetected, filesAdded, filesRemoved, errors, duration };
}

/**
 * Process a single new file.
 */
async function processFile(file: BuzzHeavierFile, folderId: string): Promise<void> {
  const parsed = parseFilename(file.name);

  if (parsed.type === "movie") {
    await processMovieFile(file, folderId, parsed);
  } else {
    await processSeriesFile(file, folderId, parsed);
  }
}

async function processMovieFile(
  file: BuzzHeavierFile,
  folderId: string,
  parsed: ReturnType<typeof parseFilename>
): Promise<void> {
  const slug = generateSlug(parsed.title, parsed.year);

  // Find or create movie
  let movie = await MovieModel.findOne({ slug });

  if (!movie) {
    // Fetch metadata
    const tmdb = await searchMovieTMDB(parsed.title, parsed.year);

    movie = await MovieModel.create({
      tmdbId: tmdb?.id,
      title: tmdb?.title ?? parsed.title,
      originalTitle: tmdb?.original_title,
      slug,
      year: parsed.year ?? (tmdb?.release_date ? parseInt(tmdb.release_date) : new Date().getFullYear()),
      overview: tmdb?.overview ?? "",
      posterPath: tmdb?.poster_path ? tmdbImageUrl(tmdb.poster_path) : undefined,
      backdropPath: tmdb?.backdrop_path ? tmdbImageUrl(tmdb.backdrop_path, "original") : undefined,
      genres: tmdb?.genres?.map((g) => g.name) ?? [],
      runtime: tmdb?.runtime,
      rating: tmdb?.vote_average ?? 0,
      language: tmdb?.original_language,
      tagline: tmdb?.tagline,
      status: tmdb?.status ?? "Released",
    });
  }

  // Create file record
  const fileDoc = await FileModel.create({
    buzzHeavierFileId: file.id,
    buzzHeavierFolderId: folderId,
    originalFilename: file.name,
    downloadUrl: file.url,
    quality: parsed.quality ?? "1080p",
    language: parsed.language ?? "English",
    fileSize: file.size,
    contentType: "movie",
    contentId: movie._id,
  });

  // Link file to movie
  await MovieModel.findByIdAndUpdate(movie._id, {
    $addToSet: { files: fileDoc._id },
  });
}

async function processSeriesFile(
  file: BuzzHeavierFile,
  folderId: string,
  parsed: ReturnType<typeof parseFilename>
): Promise<void> {
  const slug = generateSlug(parsed.title, parsed.year);
  const seasonNum = parsed.season ?? 1;
  const episodeNum = parsed.episode ?? 1;

  // Find or create series
  let series = await SeriesModel.findOne({ slug });

  if (!series) {
    const tmdb = await searchSeriesTMDB(parsed.title, parsed.year);
    const tvmaze = await searchSeriesTVMaze(parsed.title);

    series = await SeriesModel.create({
      tmdbId: tmdb?.id,
      tvmazeId: tvmaze?.id,
      title: tmdb?.name ?? tvmaze?.name ?? parsed.title,
      originalTitle: tmdb?.original_name,
      slug,
      year: parsed.year ?? (tmdb?.first_air_date ? parseInt(tmdb.first_air_date) : new Date().getFullYear()),
      overview: tmdb?.overview ?? tvmaze?.summary?.replace(/<[^>]*>/g, "") ?? "",
      posterPath: tmdb?.poster_path ? tmdbImageUrl(tmdb.poster_path) : tvmaze?.image?.original,
      backdropPath: tmdb?.backdrop_path ? tmdbImageUrl(tmdb.backdrop_path, "original") : undefined,
      genres: tmdb?.genres?.map((g) => g.name) ?? tvmaze?.genres ?? [],
      runtime: tmdb?.episode_run_time?.[0] ?? tvmaze?.runtime,
      rating: tmdb?.vote_average ?? tvmaze?.rating?.average ?? 0,
      language: tmdb?.original_language,
      tagline: tmdb?.tagline,
      status: tmdb?.status ?? tvmaze?.status ?? "Returning Series",
      seasons: [],
    });
  }

  // Ensure season exists
  let season = series.seasons.find((s) => s.seasonNumber === seasonNum);
  if (!season) {
    series.seasons.push({
      seasonNumber: seasonNum,
      title: `Season ${seasonNum}`,
      episodes: [],
    } as never);
    season = series.seasons[series.seasons.length - 1];
  }

  // Fetch episode metadata
  let epTitle = `Episode ${episodeNum}`;
  let epOverview = "";
  let epStill = "";
  let epAirDate = "";

  if (series.tmdbId) {
    const tmdbEp = await getTMDBEpisode(series.tmdbId, seasonNum, episodeNum);
    if (tmdbEp) {
      epTitle = tmdbEp.name ?? epTitle;
      epOverview = tmdbEp.overview ?? "";
      epStill = tmdbEp.still_path ? tmdbImageUrl(tmdbEp.still_path) : "";
      epAirDate = tmdbEp.air_date ?? "";
    }
  } else if (series.tvmazeId) {
    const tvmazeEp = await getTVMazeEpisode(series.tvmazeId, seasonNum, episodeNum);
    if (tvmazeEp) {
      epTitle = tvmazeEp.name ?? epTitle;
      epOverview = tvmazeEp.summary?.replace(/<[^>]*>/g, "") ?? "";
      epStill = tvmazeEp.image?.original ?? "";
      epAirDate = tvmazeEp.airdate ?? "";
    }
  }

  // Ensure episode exists
  let episode = season.episodes.find((e) => e.episodeNumber === episodeNum);
  if (!episode) {
    season.episodes.push({
      episodeNumber: episodeNum,
      title: epTitle,
      overview: epOverview,
      stillPath: epStill,
      airDate: epAirDate,
      files: [],
    } as never);
    episode = season.episodes[season.episodes.length - 1];
  }

  await series.save();

  // Create file record
  const freshSeries = await SeriesModel.findOne({ slug });
  const freshSeason = freshSeries!.seasons.find((s) => s.seasonNumber === seasonNum);
  const freshEpisode = freshSeason!.episodes.find((e) => e.episodeNumber === episodeNum);

  const fileDoc = await FileModel.create({
    buzzHeavierFileId: file.id,
    buzzHeavierFolderId: folderId,
    originalFilename: file.name,
    downloadUrl: file.url,
    quality: parsed.quality ?? "1080p",
    language: parsed.language ?? "English",
    fileSize: file.size,
    contentType: "series",
    contentId: freshSeries!._id,
    seasonId: freshSeason!._id,
    episodeId: freshEpisode!._id,
  });

  // Add file to episode
  await SeriesModel.updateOne(
    {
      slug,
      "seasons.seasonNumber": seasonNum,
      "seasons.episodes.episodeNumber": episodeNum,
    },
    {
      $addToSet: {
        "seasons.$[s].episodes.$[e].files": fileDoc._id,
      },
    },
    {
      arrayFilters: [
        { "s.seasonNumber": seasonNum },
        { "e.episodeNumber": episodeNum },
      ],
    }
  );
}

/**
 * Remove a file and clean up empty parents.
 */
async function removeFile(buzzHeavierFileId: string): Promise<void> {
  const file = await FileModel.findOne({ buzzHeavierFileId });
  if (!file) return;

  if (file.contentType === "movie" && file.contentId) {
    await MovieModel.findByIdAndUpdate(file.contentId, {
      $pull: { files: file._id },
    });
    // Check if movie has no files left
    const movie = await MovieModel.findById(file.contentId);
    if (movie && movie.files.length === 0) {
      await MovieModel.findByIdAndDelete(file.contentId);
    }
  }

  if (file.contentType === "series" && file.contentId && file.seasonId && file.episodeId) {
    // Remove file from episode
    await SeriesModel.updateOne(
      { _id: file.contentId },
      {
        $pull: {
          "seasons.$[s].episodes.$[e].files": file._id,
        },
      },
      {
        arrayFilters: [
          { "s._id": file.seasonId },
          { "e._id": file.episodeId },
        ],
      }
    );

    // Check if series has any files left; cleanup empty episodes/seasons
    await cleanupEmptySeries(String(file.contentId));
  }

  await FileModel.findByIdAndDelete(file._id);
}

async function cleanupEmptySeries(seriesId: string): Promise<void> {
  const series = await SeriesModel.findById(seriesId).populate("seasons.episodes.files");
  if (!series) return;

  let hasAnyFile = false;
  const seasonsToKeep: typeof series.seasons = [];

  for (const season of series.seasons) {
    const episodesToKeep = season.episodes.filter((ep) => {
      const hasFiles = ep.files.length > 0;
      if (hasFiles) hasAnyFile = true;
      return hasFiles;
    });

    if (episodesToKeep.length > 0) {
      season.episodes = episodesToKeep as typeof season.episodes;
      seasonsToKeep.push(season);
    }
  }

  if (!hasAnyFile) {
    await SeriesModel.findByIdAndDelete(seriesId);
  } else {
    series.seasons = seasonsToKeep as typeof series.seasons;
    await series.save();
  }
}
