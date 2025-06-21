import { derived, writable } from 'svelte/store';
import translations from './translations';
import clickupService from '../services/clickup-service';

export const locale = writable('en');
export const dateFormat = writable('YYYY-MM-DD');
export const locales = Object.keys(translations);

function translate(locale: string, key: string, vars: any) {
  if (!key) {
    throw new Error('no key provided to $t()');
  }
  if (!locale) {
    throw new Error(`no translation for key "${key}"`);
  }

  let text: string = (translations as any)[locale][key];

  if (!text) {
    return key;
  }

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

export const loadLocalization = async () => {
  const { data: loc } = await clickupService.getConfig('locale');
  const { data: dateFmt } = await clickupService.getConfig('dateFormat');
  if (loc) {
    locale.set(loc);
  }
  if (dateFmt) {
    dateFormat.set(dateFmt);
  }
};
