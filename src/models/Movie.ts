// src/models/Movie.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMovie extends Document {
  tmdbId?: number;
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
  files: mongoose.Types.ObjectId[];
  isFeatured: boolean;
  featuredOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    tmdbId: { type: Number, sparse: true, index: true },
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
    status: { type: String, default: "Released" },
    files: [{ type: Schema.Types.ObjectId, ref: "File" }],
    isFeatured: { type: Boolean, default: false },
    featuredOrder: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MovieSchema.index({ title: "text", overview: "text" });
MovieSchema.index({ rating: -1 });
MovieSchema.index({ createdAt: -1 });
MovieSchema.index({ isFeatured: 1, featuredOrder: 1 });

const MovieModel: Model<IMovie> =
  mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema);

export default MovieModel;
