import * as runtime from '$lib/paraglide/runtime.js';

export const i18n = {
  get locale() { return runtime.getLocale(); },
  locales: runtime.locales,
  getLocale: runtime.getLocale,
  setLocale: runtime.setLocale,
  resolveRoute: (path: string, lang: string) => {
    const url = new URL(path, 'http://localhost');
    return runtime.localizeUrl(url, { locale: lang }).pathname;
  },
  route: (pathname: string) => {
    return runtime.deLocalizeUrl(new URL(pathname, 'http://localhost')).pathname;
  }
};
