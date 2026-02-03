import type { Context, Next } from "hono";
import type { Role } from "../auth/permissions.ts";
import {
  filterFieldsByPermission,
  filterBlueprintFieldsByPermission,
} from "../auth/field-permissions.ts";

export function filterFieldLevels(responseKey: string = "data") {
  return async (c: Context, next: Next) => {
    await next();

    const response = c.res;
    const userRole = c.get("userRole") as Role | undefined;

    if (!userRole || response.status !== 200) {
      return;
    }

    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();
      const data = body[responseKey];

      if (!data) {
        return;
      }

      let filteredData;

      if (Array.isArray(data)) {
        filteredData = data.map((item) => {
          if (item.blueprint) {
            return filterFieldsByPermission(item, item.blueprint, userRole);
          }
          return item;
        });
      } else if (data.blueprint) {
        filteredData = filterFieldsByPermission(data, data.blueprint, userRole);
      } else {
        return;
      }

      const newBody = { ...body, [responseKey]: filteredData };
      c.res = new Response(JSON.stringify(newBody), {
        status: response.status,
        headers: response.headers,
      });
    } catch {}
  };
}

export function filterBlueprintFieldLevels(responseKey: string = "data") {
  return async (c: Context, next: Next) => {
    await next();

    const response = c.res;
    const userRole = c.get("userRole") as Role | undefined;

    if (!userRole || response.status !== 200) {
      return;
    }

    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();
      const data = body[responseKey];

      if (!data) {
        return;
      }

      let filteredData;

      if (Array.isArray(data)) {
        filteredData = data.map((blueprint) =>
          filterBlueprintFieldsByPermission(blueprint, userRole),
        );
      } else {
        filteredData = filterBlueprintFieldsByPermission(data, userRole);
      }

      const newBody = { ...body, [responseKey]: filteredData };
      c.res = new Response(JSON.stringify(newBody), {
        status: response.status,
        headers: response.headers,
      });
    } catch {}
  };
}
