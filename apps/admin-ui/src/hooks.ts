import type { NavigationTarget } from "@sveltejs/kit";

export const reroute = ({ url }: NavigationTarget) => url.pathname;
