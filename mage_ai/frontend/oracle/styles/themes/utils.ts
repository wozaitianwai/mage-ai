// @ts-ignore
import Cookies from 'js-cookie';
import ServerCookie from 'next-cookies';

import dark from '@oracle/styles/themes/dark';
import light from '@oracle/styles/themes/light';
import { SHARED_OPTS } from '@api/utils/token';

export const LOCAL_STORAGE_KEY_THEME: 'current_theme' = 'current_theme';
export const THEME_MODE_DARK: number = 0;
export const THEME_MODE_LIGHT: number = 1;

function getThemeModeValue(ctx?: any): number {
  let currentTheme;

  if (ctx) {
    const cookie = ServerCookie(ctx);
    currentTheme = cookie[LOCAL_STORAGE_KEY_THEME];
  } else {
    currentTheme = Cookies.get(LOCAL_STORAGE_KEY_THEME);
  }

  const value = Number(currentTheme);
  if (Number.isFinite(value)) {
    return value;
  }

  return THEME_MODE_DARK;
}

export function getCurrentThemeMode(ctx?: any): 'dark' | 'light' {
  const mode = getThemeModeValue(ctx);
  return mode === THEME_MODE_LIGHT ? 'light' : 'dark';
}

export function getCurrentTheme(ctx?: any) {
  const mode = getThemeModeValue(ctx);
  return mode === THEME_MODE_LIGHT ? light : dark;
}

export function getCurrentInvertedTheme(ctx) {
  const mode = getThemeModeValue(ctx);
  return mode === THEME_MODE_LIGHT ? dark : light;
}

export function setCurrentTheme(theme) {
  // @ts-ignore
  Cookies.set(LOCAL_STORAGE_KEY_THEME, theme, { ...SHARED_OPTS, expires: 9999 });
}

export function toggleTheme() {
  const currentTheme = Cookies.get(LOCAL_STORAGE_KEY_THEME);

  return setCurrentTheme(
    Number(currentTheme) === THEME_MODE_DARK || currentTheme === null
      ? THEME_MODE_LIGHT
      : THEME_MODE_DARK,
  );
}
