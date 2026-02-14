import * as runtime from "$lib/paraglide/runtime";

export const i18n = {
  get locale() {
    return runtime.getLocale();
  },
  locales: runtime.locales,
  getLocale: runtime.getLocale,
  setLocale: runtime.setLocale,
  resolveRoute: (path: string, _lang: string) => path,
  route: (pathname: string) => pathname,
};
