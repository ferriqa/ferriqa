/**
 * @ferriqa/api - Media Service
 */

import { extname } from "node:path";
import { mediaConfig } from "../config/media.ts";
import { StorageRegistry } from "./registry.ts";

// Minimal DatabaseAdapter interface to avoid importing from testing
interface DatabaseAdapter {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }>;
}

export interface Media {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size: number;
  url: string;
  storage_type: string;
  metadata?: string; // JSON string
  created_by?: string;
  created_at: number;
}

export class MediaService {
  constructor(
    private db: DatabaseAdapter,
    private storageRegistry: StorageRegistry,
  ) {}

  async upload(
    file: File,
    userId?: string,
    storageType?: string,
  ): Promise<Media> {
    // Resolve storage adapter
    const storage = storageType
      ? this.storageRegistry.get(storageType)
      : this.storageRegistry.getDefault();

    if (!storage) {
      throw new Error(
        `Storage adapter${storageType ? ` for type "${storageType}"` : ""} not found`,
      );
    }

    // Validate
    this.validateFile(file);

    // Generate unique path
    const ext = extname(file.name);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const date = new Date();
    const path = `${date.getFullYear()}/${date.getMonth() + 1}/${uniqueName}`;

    // Upload to storage
    const uploadResult = await storage.upload(file, path);

    // Extract metadata (placeholder for future implementation)
    const metadata: Record<string, unknown> = {};

    // Create media object
    const mediaData = {
      id: crypto.randomUUID(),
      filename: file.name,
      storage_path: uploadResult.path,
      mime_type: uploadResult.mimeType,
      size: uploadResult.size,
      url: uploadResult.url,
      storage_type: storage.type,
      metadata: JSON.stringify(metadata),
      created_by: userId,
      created_at: Date.now(),
    };

    // Save to database
    await this.db.execute(
      `INSERT INTO media (id, filename, storage_path, mime_type, size, url, storage_type, metadata, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mediaData.id,
        mediaData.filename,
        mediaData.storage_path,
        mediaData.mime_type,
        mediaData.size,
        mediaData.url,
        mediaData.storage_type,
        mediaData.metadata,
        mediaData.created_by,
        mediaData.created_at,
      ],
    );

    return mediaData;
  }

  async delete(mediaId: string): Promise<void> {
    const result = await this.db.query<Media>(
      "SELECT * FROM media WHERE id = ?",
      [mediaId],
    );

    if (!result.rows.length) {
      throw new Error("Media not found");
    }

    const media = result.rows[0];

    // Delete from storage
    const storage = this.storageRegistry.get(media.storage_type);
    if (!storage) {
      throw new Error(
        `Storage adapter for type "${media.storage_type}" not found. Cannot delete file to ensure consistency.`,
      );
    }

    await storage.delete(media.storage_path);

    // Delete from database
    await this.db.execute("DELETE FROM media WHERE id = ?", [mediaId]);
  }

  async getById(mediaId: string): Promise<Media | null> {
    const result = await this.db.query<Media>(
      "SELECT * FROM media WHERE id = ?",
      [mediaId],
    );

    return result.rows[0] || null;
  }

  async list(
    page = 1,
    limit = 25,
  ): Promise<{ data: Media[]; pagination: { total: number; pages: number } }> {
    const offset = (page - 1) * limit;

    const result = await this.db.query<Media>(
      "SELECT * FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );

    const countResult = await this.db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM media",
    );
    const total = countResult.rows[0]?.count || 0;

    return {
      data: result.rows,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  validateFile(file: File): void {
    const config = mediaConfig.limits;

    if (file.size > config.maxFileSize) {
      throw new Error(`File size exceeds limit of ${config.maxFileSize} bytes`);
    }

    // Check mime type
    // Simple wildcard support: image/*
    const isAllowed = config.allowedMimeTypes.some((pattern: string) => {
      if (pattern.endsWith("/*")) {
        const typePrefix = pattern.replace("/*", "/");
        return file.type.startsWith(typePrefix);
      }
      return file.type === pattern;
    });

    if (!isAllowed) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }
}
