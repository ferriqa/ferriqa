import { browser } from "$app/environment";

export interface AutoSaveOptions {
  key: string;
  debounceMs?: number;
  onSave?: (data: Record<string, unknown>) => void;
  onRestore?: (data: Record<string, unknown>) => void;
}

export function createAutoSave(options: AutoSaveOptions) {
  const { key, debounceMs = 1000, onSave, onRestore } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSavedData: string | null = null;

  function getStorageKey(): string {
    return `ferriqa_autosave_${key}`;
  }

  function save(data: Record<string, unknown>) {
    if (!browser) return;

    const jsonData = JSON.stringify(data);
    if (jsonData === lastSavedData) return;

    try {
      localStorage.setItem(getStorageKey(), jsonData);
      lastSavedData = jsonData;
      onSave?.(data);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }

  function debouncedSave(data: Record<string, unknown>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      save(data);
      timeoutId = null;
    }, debounceMs);
  }

  function load(): Record<string, unknown> | null {
    if (!browser) return null;

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const data = JSON.parse(stored);
        lastSavedData = stored;
        onRestore?.(data);
        return data;
      }
    } catch (error) {
      console.error("Auto-load failed:", error);
    }
    return null;
  }

  function clear() {
    if (!browser) return;

    try {
      localStorage.removeItem(getStorageKey());
      lastSavedData = null;
    } catch (error) {
      console.error("Auto-save clear failed:", error);
    }
  }

  function hasStoredData(): boolean {
    if (!browser) return false;
    return localStorage.getItem(getStorageKey()) !== null;
  }

  return {
    save,
    debouncedSave,
    load,
    clear,
    hasStoredData,
  };
}

export function useAutoSave(options: AutoSaveOptions) {
  const autoSave = createAutoSave(options);

  function save(data: Record<string, unknown>) {
    autoSave.debouncedSave(data);
  }

  function restore() {
    return autoSave.load();
  }

  function clear() {
    autoSave.clear();
  }

  function hasData() {
    return autoSave.hasStoredData();
  }

  return {
    save,
    restore,
    clear,
    hasData,
  };
}
