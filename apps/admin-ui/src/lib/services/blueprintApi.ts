import type {
  Blueprint,
  BlueprintApiResponse,
  BlueprintListResponse,
} from "../components/blueprint/types.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Create a new blueprint
 */
export async function createBlueprint(
  blueprint: Omit<Blueprint, "id">,
): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blueprint),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create blueprint",
        errors: error.errors,
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
      error:
        error instanceof Error ? error.message : "Failed to create blueprint",
    };
  }
}

/**
 * Update an existing blueprint
 */
export async function updateBlueprint(
  id: string,
  blueprint: Partial<Blueprint>,
): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blueprint),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update blueprint",
        errors: error.errors,
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
      error:
        error instanceof Error ? error.message : "Failed to update blueprint",
    };
  }
}

/**
 * Get a single blueprint by ID
 */
export async function getBlueprint(id: string): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch blueprint",
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
      error:
        error instanceof Error ? error.message : "Failed to fetch blueprint",
    };
  }
}

/**
 * Get all blueprints
 */
export async function getBlueprints(
  page = 1,
  limit = 50,
): Promise<BlueprintListResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/blueprints?page=${page}&limit=${limit}`,
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch blueprints",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.items || data,
      meta: data.meta,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch blueprints",
    };
  }
}

/**
 * Delete a blueprint
 */
export async function deleteBlueprint(
  id: string,
): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete blueprint",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete blueprint",
    };
  }
}

/**
 * Validate a blueprint before saving
 */
export async function validateBlueprint(
  blueprint: Partial<Blueprint>,
): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blueprint),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Blueprint validation failed",
        errors: error.errors,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Blueprint validation failed",
    };
  }
}

/**
 * Duplicate a blueprint
 */
export async function duplicateBlueprint(
  id: string,
  newName?: string,
): Promise<BlueprintApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blueprints/${id}/duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to duplicate blueprint",
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to duplicate blueprint",
    };
  }
}

/**
 * Export blueprint as JSON
 */
export function exportBlueprintAsJSON(blueprint: Blueprint): string {
  return JSON.stringify(blueprint, null, 2);
}

/**
 * Download blueprint as JSON file
 */
export function downloadBlueprintAsJSON(
  blueprint: Blueprint,
  filename?: string,
): void {
  const json = exportBlueprintAsJSON(blueprint);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${blueprint.slug || blueprint.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import blueprint from JSON
 */
export function importBlueprintFromJSON(jsonString: string): Blueprint | null {
  try {
    const blueprint = JSON.parse(jsonString) as Blueprint;
    // Validate basic structure
    if (
      !blueprint.name ||
      !blueprint.slug ||
      !Array.isArray(blueprint.fields)
    ) {
      return null;
    }
    return blueprint;
  } catch {
    return null;
  }
}
