/**
 * @ferriqa/core - Plugin Configuration UI Generator
 * Phase 6: Config UI Generation
 */

import { z } from "zod";

export interface ConfigFieldUI {
    name: string;
    type: "text" | "number" | "boolean" | "select" | "textarea" | "json";
    label: string;
    description?: string;
    required: boolean;
    defaultValue?: unknown;
    options?: { label: string; value: unknown }[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

/**
 * Build UI metadata from a Zod schema for plugin configuration
 */
export function buildConfigUI(schema: z.ZodTypeAny): ConfigFieldUI[] {
    const fields: ConfigFieldUI[] = [];

    if (schema instanceof z.ZodObject) {
        for (const [key, value] of Object.entries(schema.shape)) {
            const zodField = value as z.ZodTypeAny;
            const description = zodField.description;
            const isOptional = zodField.isOptional();

            fields.push(parseZodField(key, zodField, isOptional, description));
        }
    }

    return fields;
}

function parseZodField(
    key: string,
    field: z.ZodTypeAny,
    isOptional: boolean,
    description?: string,
): ConfigFieldUI {
    const base: ConfigFieldUI = {
        name: key,
        type: "text",
        label: formatLabel(key),
        description,
        required: !isOptional,
    };

    // Unwrap Optional/Default
    let currentField = field;
    while (currentField instanceof z.ZodOptional || currentField instanceof z.ZodDefault) {
        if (currentField instanceof z.ZodDefault) {
            base.defaultValue = (currentField._def as any).defaultValue();
        }
        currentField = (currentField._def as any).innerType;
    }

    const typeName = (currentField._def as any).typeName;

    if (typeName === "ZodString") {
        base.type = "text";
        return base;
    }

    if (typeName === "ZodNumber") {
        base.type = "number";
        return base;
    }

    if (typeName === "ZodBoolean") {
        base.type = "boolean";
        base.defaultValue = base.defaultValue ?? false;
        return base;
    }

    if (typeName === "ZodEnum") {
        base.type = "select";
        base.options = (currentField._def as any).values.map((v: string) => ({
            label: formatLabel(v),
            value: v,
        }));
        return base;
    }

    if (typeName === "ZodNativeEnum") {
        base.type = "select";
        const values = (currentField._def as any).values;
        base.options = Object.entries(values).map(([k, v]) => ({
            label: formatLabel(k),
            value: v,
        }));
        return base;
    }

    // Fallback to JSON for complex objects
    base.type = "json";
    return base;
}

function formatLabel(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/[_-]/g, " ")
        .trim();
}
