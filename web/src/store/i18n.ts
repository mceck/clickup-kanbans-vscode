import { derived, writable } from 'svelte/store';
import translations from './translations';

export const locale = writable('en');
export const dateFormat = writable('YYYY-MM-DD');
export const locales = Object.keys(translations);

function translate(locale: string, key: string, vars: any) {
  // Let's throw some errors if we're trying to use keys/locales that don't exist.
  // We could improve this by using Typescript and/or fallback values.
  if (!key) {
    throw new Error('no key provided to $t()');
  }
  if (!locale) {
    throw new Error(`no translation for key "${key}"`);
  }

  // Grab the translation from the translations object.
  let text: string = (translations as any)[locale][key];

  if (!text) {
    return key;
  }

  // Replace any passed in variables in the translation string.
  Object.keys(vars).map((k) => {
    const regex = new RegExp(`{{${k}}}`, 'g');
    text = text.replace(regex, vars[k]);
  });

  return text;
}

export const t = derived(
  locale,
  ($locale) =>
    (key: string, vars = {}) =>
      translate($locale, key, vars)
);
