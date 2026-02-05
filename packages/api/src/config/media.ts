/**
 * @ferriqa/api - Media Configuration
 */

export interface MediaConfig {
  defaultStorage: "local" | "s3";
  local: {
    path: string;
    publicUrl: string;
  };
  s3: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    publicUrl?: string; // CDN URL
  };
  limits: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
  };
}

export const mediaConfig: MediaConfig = {
  defaultStorage: (process.env.MEDIA_STORAGE as "local" | "s3") || "local",
  local: {
    path: process.env.MEDIA_LOCAL_PATH || "./uploads",
    publicUrl: process.env.MEDIA_PUBLIC_URL || "/uploads",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    publicUrl: process.env.S3_PUBLIC_URL,
  },
  limits: {
    maxFileSize: parseInt(process.env.MEDIA_MAX_SIZE || "10485760", 10), // 10MB default
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ],
  },
};
