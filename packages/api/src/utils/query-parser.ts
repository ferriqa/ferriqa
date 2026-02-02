/**
 * Query Parser Utilities
 *
 * Parse query parameters for filtering, sorting, pagination
 * Based on roadmap 3.1 - RESTful Endpoints Implementation
 */

import type { FilterCondition, SortCondition } from "@ferriqa/core";

export interface ParsedQuery {
  filters: FilterCondition[];
  sort?: SortCondition[];
  pagination: {
    page: number;
    limit: number;
  };
  populate?: string[];
  fields?: string[];
}

export function parseFilters(query: Record<string, string>): FilterCondition[] {
  const filters: FilterCondition[] = [];

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^filters\[(.+)\]$/);
    if (match) {
      const field = match[1];

      const operatorMatch = value.match(/^([a-z]+):(.+)$/);
      if (operatorMatch) {
        const [, op, val] = operatorMatch;
        filters.push({
          field,
          operator: op as FilterCondition["operator"],
          value: val,
        });
      } else {
        filters.push({
          field,
          operator: "eq",
          value,
        });
      }
    }
  }

  return filters;
}

export function parseSort(sort: string): SortCondition[] {
  return sort.split(",").map((s) => {
    const [field, direction = "asc"] = s.split(":");
    return { field, direction: direction as "asc" | "desc" };
  });
}

export function parseQuery(query: Record<string, string>): ParsedQuery {
  const { page = "1", limit = "25", sort, populate, fields, ...rest } = query;

  const parsed: ParsedQuery = {
    filters: parseFilters(rest),
    pagination: {
      page: Math.max(1, parseInt(page, 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
    },
  };

  if (sort) {
    parsed.sort = parseSort(sort);
  }

  if (populate) {
    parsed.populate = populate.split(",").map((s) => s.trim());
  }

  if (fields) {
    parsed.fields = fields.split(",").map((s) => s.trim());
  }

  return parsed;
}
