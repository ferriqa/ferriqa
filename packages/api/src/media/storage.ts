/**
 * @ferriqa/api - Storage Adapter Interface
 */

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageAdapter {
  type: string;

  upload(file: File, path: string): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): string;
  getSignedUrl?(path: string, expiresInSeconds: number): Promise<string>;
}
