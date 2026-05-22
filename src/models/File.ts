// src/models/File.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFile extends Document {
  buzzHeavierFileId: string;
  buzzHeavierFolderId: string;
  originalFilename: string;
  downloadUrl: string;
  quality: string;
  language: string;
  fileSize: number;
  contentType: "movie" | "series";
  contentId?: mongoose.Types.ObjectId;
  episodeId?: mongoose.Types.ObjectId;
  seasonId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    buzzHeavierFileId: { type: String, required: true, unique: true, index: true },
    buzzHeavierFolderId: { type: String, required: true, index: true },
    originalFilename: { type: String, required: true },
    downloadUrl: { type: String, required: true },
    quality: {
      type: String,
      enum: ["480p", "720p", "1080p", "2160p", "4K"],
      required: true,
    },
    language: {
      type: String,
      enum: ["English", "Hindi", "Tamil", "Malayalam", "Telugu", "Kannada", "Multi Audio"],
      required: true,
    },
    fileSize: { type: Number, default: 0 },
    contentType: { type: String, enum: ["movie", "series"], required: true },
    contentId: { type: Schema.Types.ObjectId, index: true },
    episodeId: { type: Schema.Types.ObjectId, index: true },
    seasonId: { type: Schema.Types.ObjectId, index: true },
  },
  { timestamps: true }
);

const FileModel: Model<IFile> =
  mongoose.models.File || mongoose.model<IFile>("File", FileSchema);

export default FileModel;
