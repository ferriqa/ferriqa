/**
 * Slug Manager
 *
 * URL-friendly unique identifier management
 * Based on roadmap 2.1 - Slug Management
 */

// Minimal DatabaseAdapter interface for slug checking
// Full DatabaseAdapter comes from @ferriqa/adapters-db
export interface SlugDatabaseAdapter {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface SlugManagerOptions {
  /** Maximum slug length */
  maxLength?: number;
  /** Separator for counter (e.g., "hello-world-2") */
  separator?: string;
  /** Preserve case (default: false - lowercase) */
  preserveCase?: boolean;
  /** Custom transliteration map for special characters */
  transliteration?: Record<string, string>;
}

export class SlugManager {
  private options: Required<SlugManagerOptions>;

  constructor(
    private db: SlugDatabaseAdapter,
    options: SlugManagerOptions = {},
  ) {
    this.options = {
      maxLength: 100,
      separator: "-",
      preserveCase: false,
      transliteration: {},
      ...options,
    };
  }

  /**
   * Generate a unique slug for content
   * @param blueprintId - Blueprint ID
   * @param source - Source text to slugify
   * @param contentId - Current content ID (for updates, to exclude self from uniqueness check)
   * @returns Unique slug
   */
  async generate(
    blueprintId: string,
    source: string,
    contentId?: string,
  ): Promise<string> {
    let slug = this.slugify(source);

    // Check uniqueness and append counter if needed
    let counter = 0;
    let uniqueSlug = slug;

    while (await this.exists(blueprintId, uniqueSlug, contentId)) {
      counter++;
      uniqueSlug = `${slug}${this.options.separator}${counter}`;

      // Ensure we don't exceed max length
      if (uniqueSlug.length > this.options.maxLength) {
        const maxBaseLength =
          this.options.maxLength -
          this.options.separator.length -
          counter.toString().length;
        slug = slug.slice(0, maxBaseLength);
        uniqueSlug = `${slug}${this.options.separator}${counter}`;
      }
    }

    return uniqueSlug;
  }

  /**
   * Check if a slug exists for a blueprint
   * @param blueprintId - Blueprint ID
   * @param slug - Slug to check
   * @param excludeContentId - Content ID to exclude (for updates)
   * @returns True if slug exists
   */
  async exists(
    blueprintId: string,
    slug: string,
    excludeContentId?: string,
  ): Promise<boolean> {
    try {
      // Note: This assumes a 'contents' table exists
      // The table schema should be created as part of content storage setup
      //
      // FIX: Made WHERE clause conditional for excludeContentId
      // Review comment #9: "SQL query parameter handling in SlugManager.exists()"
      // Previous approach used COALESCE(?, 0) which is fragile (assumes IDs never start from 0)
      // Now builds query conditionally - only excludes when contentId is provided
      const baseQuery = `SELECT COUNT(*) as count FROM contents 
         WHERE blueprint_id = ? AND slug = ?`;
      const exclusionClause = excludeContentId ? ` AND id != ?` : "";
      const sql = baseQuery + exclusionClause;
      const params = excludeContentId
        ? [blueprintId, slug, excludeContentId]
        : [blueprintId, slug];

      const result = await this.db.query<{ count: number }>(sql, params);

      return result.rows[0]?.count > 0;
    } catch (error) {
      // If table doesn't exist yet, assume slug is available
      if (error instanceof Error && error.message.includes("no such table")) {
        // FIX: Added warning for missing contents table
        // Review comment #4: "SlugManager.exists() Silently Ignores Missing Table"
        // During initial setup or migration, the table might not exist yet
        // This could lead to duplicate slugs if not properly handled
        console.warn(
          `[SlugManager] Contents table does not exist. ` +
            `Skipping slug uniqueness check for "${slug}" in blueprint "${blueprintId}". ` +
            `Ensure database is properly initialized to avoid duplicate slugs.`,
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Convert text to slug format
   * @param text - Source text
   * @returns Slugified text
   */
  slugify(text: string): string {
    if (!text) return "";

    let slug = text;

    // Apply custom transliteration
    for (const [char, replacement] of Object.entries(
      this.options.transliteration,
    )) {
      slug = slug.replace(new RegExp(char, "g"), replacement);
    }

    // Basic slugification
    slug = slug
      .normalize("NFD") // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_]+/g, this.options.separator) // Replace spaces/underscores with separator
      .replace(
        new RegExp(`${this.options.separator}+`, "g"),
        this.options.separator,
      ) // Remove consecutive separators
      .replace(
        new RegExp(
          `^${this.options.separator}+|${this.options.separator}+$`,
          "g",
        ),
        "",
      ); // Trim separators

    if (!this.options.preserveCase) {
      slug = slug.toLowerCase();
    }

    // Truncate to max length
    if (slug.length > this.options.maxLength) {
      slug = slug
        .slice(0, this.options.maxLength)
        .replace(new RegExp(`${this.options.separator}+$`), ""); // Don't end with separator
    }

    return slug;
  }

  /**
   * Validate slug format
   * @param slug - Slug to validate
   * @returns True if valid
   */
  isValid(slug: string): boolean {
    if (!slug) return false;
    if (slug.length > this.options.maxLength) return false;

    // Slug should only contain alphanumeric characters and separators
    const validPattern = this.options.preserveCase
      ? new RegExp(`^[a-zA-Z0-9${this.options.separator}]+$`)
      : new RegExp(`^[a-z0-9${this.options.separator}]+$`);

    return validPattern.test(slug);
  }

  /**
   * Generate slug from multiple source fields
   * @param sources - Source values to combine
   * @returns Combined slug
   */
  generateFromFields(sources: (string | number | undefined)[]): string {
    const validSources = sources
      .filter((s): s is string | number => s !== undefined && s !== null)
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);

    if (validSources.length === 0) return "";

    const combined = validSources.join(this.options.separator);
    return this.slugify(combined);
  }

  /**
   * Reserve a slug (for pre-validation)
   * Note: This is a placeholder for future implementation with a slug reservations table
   * @param blueprintId - Blueprint ID
   * @param slug - Slug to reserve
   * @param contentId - Content ID
   * @param expiresAt - Reservation expiration time
   */
  async reserve(
    blueprintId: string,
    slug: string,
    contentId: string,
    _expiresAt?: Date,
  ): Promise<void> {
    // Placeholder for future implementation
    // Would require a slug_reservations table
    console.log(
      `Reserving slug "${slug}" for blueprint ${blueprintId}, content ${contentId}`,
    );
  }

  /**
   * Release a reserved slug
   * @param blueprintId - Blueprint ID
   * @param slug - Slug to release
   * @param contentId - Content ID
   */
  async release(
    blueprintId: string,
    slug: string,
    contentId: string,
  ): Promise<void> {
    // Placeholder for future implementation
    console.log(
      `Releasing slug "${slug}" for blueprint ${blueprintId}, content ${contentId}`,
    );
  }
}

// Helper function for quick slugification
export function slugify(
  text: string,
  options: { separator?: string; preserveCase?: boolean } = {},
): string {
  // FIX: Added null/undefined guard to prevent TypeError
  // Review comment: "Missing input validation in slugify() helper"
  // If undefined/null is passed, text.normalize() would throw "Cannot read properties of undefined"
  if (!text) return "";

  const separator = options.separator ?? "-";
  let slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, separator)
    .replace(new RegExp(`${separator}+`, "g"), separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

  if (!options.preserveCase) {
    slug = slug.toLowerCase();
  }

  return slug;
}

// Helper function to validate slug format
// NOTE: allowUppercase option is available but not used by Blueprint validation
// Review comment #6: "Unused allowUppercase option"
// Blueprint slugs are always validated as lowercase via validateSlugFormat()
// This option is kept for potential future use cases (e.g., case-sensitive slugs)
export function isValidSlug(
  slug: string,
  options: { allowUppercase?: boolean; maxLength?: number } = {},
): boolean {
  if (!slug) return false;
  if (options.maxLength && slug.length > options.maxLength) return false;

  const pattern = options.allowUppercase ? /^[a-zA-Z0-9-]+$/ : /^[a-z0-9-]+$/;
  return pattern.test(slug);
}
