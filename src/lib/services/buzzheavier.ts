// src/lib/services/buzzheavier.ts
import type { BuzzHeavierFile } from "@/types";

const API_KEY = process.env.BUZZHEAVIER_API_KEY;
const BASE = "https://buzzheavier.com/api/v1";

interface BuzzHeavierApiFile {
  id: string;
  name: string;
  size: number;
  download_url: string;
  created_at: string;
  folder_id: string;
}

interface BuzzHeavierApiResponse {
  files: BuzzHeavierApiFile[];
  next_cursor?: string;
}

async function bzhFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn("[BuzzHeavier] No API key configured");
    return null;
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[BuzzHeavier] ${res.status} ${await res.text()}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error("[BuzzHeavier] fetch error:", err);
    return null;
  }
}

/**
 * List all files in a BuzzHeavier folder (handles pagination).
 */
export async function listFolderFiles(folderId: string): Promise<BuzzHeavierFile[]> {
  const files: BuzzHeavierFile[] = [];
  let cursor: string | undefined;

  do {
    const path = cursor
      ? `/folders/${folderId}/files?cursor=${cursor}`
      : `/folders/${folderId}/files`;

    const data = await bzhFetch<BuzzHeavierApiResponse>(path);
    if (!data) break;

    data.files.forEach((f) =>
      files.push({
        id: f.id,
        name: f.name,
        size: f.size,
        url: f.download_url,
        createdAt: f.created_at,
        folderId: f.folder_id,
      })
    );

    cursor = data.next_cursor;
  } while (cursor);

  return files;
}

/**
 * Get download URL for a specific file.
 */
export async function getFileDownloadUrl(fileId: string): Promise<string | null> {
  const data = await bzhFetch<{ download_url: string }>(`/files/${fileId}`);
  return data?.download_url ?? null;
}

/**
 * Get a list of all configured folder IDs from env.
 * Supports comma-separated BUZZHEAVIER_FOLDER_ID.
 */
export function getConfiguredFolderIds(): string[] {
  const raw = process.env.BUZZHEAVIER_FOLDER_ID ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
