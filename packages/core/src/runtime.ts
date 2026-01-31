export const isBun = typeof Bun !== "undefined";
export const isDeno = typeof Deno !== "undefined";
export const isNode = !isBun && !isDeno && typeof process !== "undefined";

export function getRuntimeInfo() {
    if (isBun) return { name: "Bun", version: (Bun as any).version };
    if (isDeno) return { name: "Deno", version: (Deno as any).version };
    if (isNode) return { name: "Node.js", version: process.version };
    return { name: "Unknown", version: "0.0.0" };
}