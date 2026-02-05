/**
 * @ferriqa/api - Local Storage Adapter
 */

import { mkdir, unlink, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { StorageAdapter, UploadResult } from "./storage.ts";

export class LocalStorageAdapter implements StorageAdapter {
  type = "local";
  private basePath: string;
  private publicUrl: string;

  constructor(basePath: string, publicUrl: string) {
    this.basePath = basePath;
    this.publicUrl = publicUrl;
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    const fullPath = join(this.basePath, path);

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });

    // Write file
    const buffer = await file.arrayBuffer();
    await writeFile(fullPath, Buffer.from(buffer));

    return {
      path,
      url: `${this.publicUrl}/${path}`,
      size: file.size,
      mimeType: file.type,
    };
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.basePath, path);
    try {
      await unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.basePath, path);
    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(path: string): string {
    return `${this.publicUrl}/${path}`;
  }
}
