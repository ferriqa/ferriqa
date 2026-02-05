/**
 * @ferriqa/api - Media Service Initialization
 */

import { mediaConfig } from "../config/media.ts";
import { db } from "../db.ts";
import { LocalStorageAdapter } from "./local-storage.ts";
import { MediaService } from "./service.ts";
// import { S3StorageAdapter } from './s3-storage'; // Future

function createMediaService() {
  const storageType = mediaConfig.defaultStorage;
  let storage;

  if (storageType === "s3") {
    // storage = new S3StorageAdapter(mediaConfig.s3);
    throw new Error("S3 storage not implemented yet");
  } else {
    storage = new LocalStorageAdapter(
      mediaConfig.local.path,
      mediaConfig.local.publicUrl,
    );
  }

  return new MediaService(db, storage);
}

export const mediaService = createMediaService();
export * from "./service";
export * from "./storage";
export * from "./local-storage";
