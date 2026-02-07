/**
 * @ferriqa/cli - Plugin Marketplace
 *
 * Plugin marketplace integration for discovering and installing plugins
 */

import * as p from "@clack/prompts";
import pc from "picocolors";

/**
 * Plugin information from marketplace
 */
export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  downloads: number;
  rating: number;
  tags: string[];
  dependencies?: string[];
  ferriqaVersion: string;
  publishedAt: string;
  updatedAt: string;
}

/**
 * Marketplace search result
 */
export interface SearchResult {
  plugins: MarketplacePlugin[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Marketplace configuration
 */
interface MarketplaceConfig {
  apiUrl: string;
  cacheDir: string;
  cacheTtl: number; // milliseconds
}

/**
 * Plugin Marketplace Client
 */
export class PluginMarketplace {
  private config: MarketplaceConfig;

  constructor(config?: Partial<MarketplaceConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || "https://marketplace.ferriqa.dev/api/v1",
      cacheDir: config?.cacheDir || ".ferriqa/cache",
      cacheTtl: config?.cacheTtl || 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Search plugins by query
   */
  async search(
    query: string,
    options: {
      page?: number;
      pageSize?: number;
      tags?: string[];
      sort?: "relevance" | "downloads" | "rating" | "updated";
    } = {},
  ): Promise<SearchResult> {
    const { page = 1, pageSize = 20, tags, sort = "relevance" } = options;

    try {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        pageSize: String(pageSize),
        sort,
      });

      if (tags && tags.length > 0) {
        params.set("tags", tags.join(","));
      }

      const response = await fetch(
        `${this.config.apiUrl}/plugins/search?${params}`,
      );

      if (!response.ok) {
        throw new Error(`Marketplace API error: ${response.status}`);
      }

      return await response.json();
    } catch {
      // Fallback to cached results
      return (
        (await this.getCachedSearch(query)) || {
          plugins: [],
          total: 0,
          page,
          pageSize,
        }
      );
    }
  }

  /**
   * Get plugin details by ID
   */
  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/${id}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get featured plugins
   */
  async getFeatured(): Promise<MarketplacePlugin[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/featured`);

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.plugins || [];
    } catch {
      return [];
    }
  }

  /**
   * Get popular tags
   */
  async getTags(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/tags`);

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.tags || [];
    } catch {
      return [];
    }
  }

  /**
   * Download plugin package
   */
  async downloadPlugin(id: string, version?: string): Promise<Uint8Array> {
    const url = version
      ? `${this.config.apiUrl}/plugins/${id}/download/${version}`
      : `${this.config.apiUrl}/plugins/${id}/download`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download plugin: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Get cached search results
   */
  private async getCachedSearch(query: string): Promise<SearchResult | null> {
    try {
      const cacheKey = `search_${query}`;
      const cachePath = `${this.config.cacheDir}/${cacheKey}.json`;

      // @ts-ignore - Bun exists at runtime
      if (typeof Bun !== "undefined") {
        // @ts-ignore
        const file = Bun.file(cachePath);
        if (!(await file.exists())) return null;

        const stat = { mtime: file.lastModified };
        const text = await file.text();
        const cacheFile = JSON.parse(text);

        if (Date.now() - stat.mtime > this.config.cacheTtl) {
          return null;
        }

        return cacheFile;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cache search results
   */
  private cacheSearch(query: string, result: SearchResult): void {
    try {
      const cacheKey = `search_${query}`;
      const cachePath = `${this.config.cacheDir}/${cacheKey}.json`;

      // @ts-ignore
      if (typeof Bun !== "undefined") {
        // @ts-ignore
        Bun.write(cachePath, JSON.stringify(result, null, 2));
      }
    } catch {
      // Ignore cache errors
    }
  }
}

/**
 * Built-in plugin registry (fallback when marketplace is unavailable)
 */
export const BUILTIN_PLUGINS: MarketplacePlugin[] = [
  {
    id: "seo",
    name: "SEO",
    version: "1.0.0",
    description:
      "SEO optimization with meta tags, sitemap generation, and structured data",
    author: "Ferriqa Team",
    license: "MIT",
    homepage: "https://ferriqa.dev/plugins/seo",
    repository: "https://github.com/ferriqa/plugin-seo",
    downloads: 15000,
    rating: 4.8,
    tags: ["seo", "marketing", "metadata"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "localization",
    name: "Localization",
    version: "1.0.0",
    description: "Multi-language content support with translation management",
    author: "Ferriqa Team",
    license: "MIT",
    homepage: "https://ferriqa.dev/plugins/localization",
    repository: "https://github.com/ferriqa/plugin-localization",
    downloads: 12000,
    rating: 4.7,
    tags: ["i18n", "translation", "multilingual"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "analytics",
    name: "Analytics",
    version: "1.0.0",
    description: "Track page views, user behavior, and content performance",
    author: "Ferriqa Team",
    license: "MIT",
    homepage: "https://ferriqa.dev/plugins/analytics",
    repository: "https://github.com/ferriqa/plugin-analytics",
    downloads: 10000,
    rating: 4.6,
    tags: ["analytics", "tracking", "metrics"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "search",
    name: "Search",
    version: "1.0.0",
    description: "Full-text search with FTS5 and fuzzy matching",
    author: "Ferriqa Team",
    license: "MIT",
    homepage: "https://ferriqa.dev/plugins/search",
    repository: "https://github.com/ferriqa/plugin-search",
    downloads: 8500,
    rating: 4.9,
    tags: ["search", "fts", "elastic"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "backup",
    name: "Backup",
    version: "1.0.0",
    description: "Automated backups and restore functionality",
    author: "Ferriqa Team",
    license: "MIT",
    homepage: "https://ferriqa.dev/plugins/backup",
    repository: "https://github.com/ferriqa/plugin-backup",
    downloads: 7000,
    rating: 4.5,
    tags: ["backup", "storage", "s3"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "webp-converter",
    name: "WebP Converter",
    version: "1.0.0",
    description:
      "Automatically convert images to WebP format for better performance",
    author: "Community",
    license: "MIT",
    repository: "https://github.com/ferriqa/plugin-webp-converter",
    downloads: 5000,
    rating: 4.4,
    tags: ["media", "images", "optimization"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "webhook-notifier",
    name: "Webhook Notifier",
    version: "1.0.0",
    description: "Send webhooks to external services on content changes",
    author: "Community",
    license: "MIT",
    repository: "https://github.com/ferriqa/plugin-webhook-notifier",
    downloads: 4500,
    rating: 4.3,
    tags: ["webhooks", "notifications", "integration"],
    ferriqaVersion: ">=1.0.0",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

/**
 * Format plugin info for display
 */
export function formatPluginInfo(plugin: MarketplacePlugin): string {
  const tags = plugin.tags
    .slice(0, 3)
    .map((t) => pc.cyan(`#${t}`))
    .join(" ");
  const rating =
    "★".repeat(Math.floor(plugin.rating)) +
    "☆".repeat(5 - Math.floor(plugin.rating));

  return `
${pc.bold(pc.green(plugin.name))} ${pc.dim(`(${plugin.version})`)}
${pc.dim(plugin.description)}

${pc.bold("Author:")}${plugin.author}
${pc.bold("Rating:")} ${rating} ${pc.dim(`(${plugin.rating})`)}
${pc.bold("Downloads:")} ${pc.yellow(String(plugin.downloads))}
${pc.bold("Tags:")} ${tags}
${pc.dim(`📦 ${plugin.id}`)}
`;
}

/**
 * Search and display plugins
 */
export async function searchPlugins(
  query: string,
  marketplace: PluginMarketplace,
): Promise<void> {
  const spinner = p.spinner();

  spinner.start(pc.dim(`Searching for "${query}"...`));

  const result = await marketplace.search(query);

  spinner.stop(pc.green(`✓ Found ${result.total} plugins`));

  if (result.plugins.length === 0) {
    p.log.info(pc.dim("No plugins found. Try a different search term."));
    return;
  }

  p.log.info("");

  for (const plugin of result.plugins) {
    p.log.info(formatPluginInfo(plugin));
  }

  p.log.info(
    pc.dim(`\nShowing ${result.plugins.length} of ${result.total} results`),
  );
  p.log.info(
    pc.dim(
      "Search with 'ferriqa plugin market search <query>' for more results",
    ),
  );
}
