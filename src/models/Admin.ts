// src/models/Admin.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  email: string;
  name: string;
  password: string;
  role: "admin" | "superadmin";
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
  },
  { timestamps: true }
);

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

AdminSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const AdminModel: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default AdminModel;

// ─── SyncLog ──────────────────────────────────────────────────────────────────
export interface ISyncLog extends Document {
  folderId: string;
  filesDetected: number;
  filesAdded: number;
  filesRemoved: number;
  errors: string[];
  duration: number;
  createdAt: Date;
}

const SyncLogSchema = new Schema<ISyncLog>(
  {
    folderId: { type: String, required: true },
    filesDetected: { type: Number, default: 0 },
    filesAdded: { type: Number, default: 0 },
    filesRemoved: { type: Number, default: 0 },
    errors: [String],
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SyncLogModel: Model<ISyncLog> =
  mongoose.models.SyncLog || mongoose.model<ISyncLog>("SyncLog", SyncLogSchema);

// ─── ContentRequest ──────────────────────────────────────────────────────────
export interface IContentRequest extends Document {
  title: string;
  type: "movie" | "series";
  year?: number;
  requestedBy?: string;
  message?: string;
  status: "pending" | "fulfilled" | "rejected";
  createdAt: Date;
}

const ContentRequestSchema = new Schema<IContentRequest>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["movie", "series"], required: true },
    year: Number,
    requestedBy: String,
    message: String,
    status: {
      type: String,
      enum: ["pending", "fulfilled", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const ContentRequestModel: Model<IContentRequest> =
  mongoose.models.ContentRequest ||
  mongoose.model<IContentRequest>("ContentRequest", ContentRequestSchema);
