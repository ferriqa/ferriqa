import type {
  MediaFile,
  MediaApiResponse,
  MediaListResponse,
} from "../components/media/types.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Get all media files with pagination
 */
export async function getMedia(
  page = 1,
  limit = 24,
  search?: string,
  type?: string,
): Promise<MediaListResponse> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (type && type !== "all") params.set("type", type);

    const response = await fetch(`${API_BASE_URL}/media?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch media",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
      meta: {
        total: data.pagination?.total || 0,
        page,
        limit,
        totalPages: data.pagination?.pages || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch media",
    };
  }
}

/**
 * Get a single media file by ID
 */
export async function getMediaById(id: number): Promise<MediaApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/media/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch media",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch media",
    };
  }
}

/**
 * Upload a media file
 */
export async function uploadMedia(
  file: File,
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percentage: number;
  }) => void,
): Promise<MediaApiResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            data,
          });
        } else {
          let errorMessage = "Upload failed";
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || errorMessage;
          } catch {
            // Use default error message
          }
          resolve({
            success: false,
            error: errorMessage,
          });
        }
      });

      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "Upload failed - network error",
        });
      });

      xhr.open("POST", `${API_BASE_URL}/media`);
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple media files
 */
export async function uploadMultipleMedia(
  files: File[],
  onProgress?: (
    fileIndex: number,
    progress: { loaded: number; total: number; percentage: number },
  ) => void,
): Promise<{
  success: boolean;
  results: MediaApiResponse[];
  errors: string[];
}> {
  const results: MediaApiResponse[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadMedia(files[i], (progress) => {
      if (onProgress) {
        onProgress(i, progress);
      }
    });

    results.push(result);
    if (!result.success) {
      errors.push(`Failed to upload ${files[i].name}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Delete a media file
 */
export async function deleteMedia(id: number): Promise<MediaApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete media",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
    };
  }
}

/**
 * Delete multiple media files
 */
export async function deleteMultipleMedia(
  ids: number[],
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const id of ids) {
    const result = await deleteMedia(id);
    if (result.success) {
      deleted++;
    } else {
      errors.push(`Failed to delete media ${id}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
  id: number,
  metadata: Partial<Pick<MediaFile, "alt" | "caption">>,
): Promise<MediaApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update media",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update media",
    };
  }
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File | MediaFile): boolean {
  if (file instanceof File) {
    return file.type.startsWith("image/");
  }
  return file.mimeType.startsWith("image/");
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File | MediaFile): boolean {
  if (file instanceof File) {
    return file.type.startsWith("video/");
  }
  return file.mimeType.startsWith("video/");
}

/**
 * Check if a file is an audio file
 */
export function isAudioFile(file: File | MediaFile): boolean {
  if (file instanceof File) {
    return file.type.startsWith("audio/");
  }
  return file.mimeType.startsWith("audio/");
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "powerpoint";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive";
  return "file";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
