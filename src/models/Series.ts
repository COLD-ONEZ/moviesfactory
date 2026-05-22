// src/models/Series.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Episode ─────────────────────────────────────────────────────────────────
export interface IEpisode extends Document {
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
  files: mongoose.Types.ObjectId[];
}

const EpisodeSchema = new Schema<IEpisode>({
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  overview: String,
  stillPath: String,
  airDate: String,
  runtime: Number,
  files: [{ type: Schema.Types.ObjectId, ref: "File" }],
});

// ─── Season ──────────────────────────────────────────────────────────────────
export interface ISeason extends Document {
  seasonNumber: number;
  title: string;
  overview?: string;
  posterPath?: string;
  airDate?: string;
  episodes: IEpisode[];
}

const SeasonSchema = new Schema<ISeason>({
  seasonNumber: { type: Number, required: true },
  title: { type: String, default: "" },
  overview: String,
  posterPath: String,
  airDate: String,
  episodes: [EpisodeSchema],
});

// ─── Series ──────────────────────────────────────────────────────────────────
export interface ISeries extends Document {
  tmdbId?: number;
  tvmazeId?: number;
  title: string;
  originalTitle?: string;
  slug: string;
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
  seasons: ISeason[];
  isFeatured: boolean;
  featuredOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema = new Schema<ISeries>(
  {
    tmdbId: { type: Number, sparse: true, index: true },
    tvmazeId: { type: Number, sparse: true, index: true },
    title: { type: String, required: true, index: true },
    originalTitle: String,
    slug: { type: String, required: true, unique: true, index: true },
    year: { type: Number, required: true },
    overview: { type: String, default: "" },
    posterPath: String,
    backdropPath: String,
    genres: [{ type: String }],
    runtime: Number,
    rating: { type: Number, default: 0 },
    language: String,
    tagline: String,
    status: { type: String, default: "Returning Series" },
    seasons: [SeasonSchema],
    isFeatured: { type: Boolean, default: false },
    featuredOrder: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SeriesSchema.index({ title: "text", overview: "text" });
SeriesSchema.index({ rating: -1 });
SeriesSchema.index({ createdAt: -1 });
SeriesSchema.index({ isFeatured: 1, featuredOrder: 1 });

const SeriesModel: Model<ISeries> =
  mongoose.models.Series || mongoose.model<ISeries>("Series", SeriesSchema);

export default SeriesModel;
