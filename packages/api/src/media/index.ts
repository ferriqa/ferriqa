/**
 * @ferriqa/api - Media Service Initialization
 */

import { mediaConfig } from "../config/media.ts";
import { db } from "../db.ts";
import { LocalStorageAdapter } from "./local-storage.ts";
import { MediaService } from "./service.ts";
// import { S3StorageAdapter } from './s3-storage'; // Future

import { globalStorageRegistry } from "./registry.ts";

function createMediaService() {
  // Register local storage by default
  const localStorage = new LocalStorageAdapter(
    mediaConfig.local.path,
    mediaConfig.local.publicUrl,
  );
  globalStorageRegistry.register(localStorage);
  globalStorageRegistry.setDefaultType("local");

  if (mediaConfig.defaultStorage === "s3") {
    // S3 will be registered via plugin in the future
    // For now, we keep the default as local
    console.warn(
      "S3 storage requested but not yet implemented. Falling back to local.",
    );
  }

  return new MediaService(db, globalStorageRegistry);
}

export const mediaService = createMediaService();
export * from "./service.ts";
export * from "./storage.ts";
export * from "./local-storage.ts";
export * from "./registry.ts";
