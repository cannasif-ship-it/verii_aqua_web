import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const i18n = i18next.createInstance();

type TranslationTree = Record<string, unknown>;
type ResourceModule = { default: TranslationTree };

const featureModules = import.meta.glob('../features/**/localization/*/*.json');
const sharedModules = import.meta.glob('../shared/localization/*/*.json');
const modules = {
  ...sharedModules,
  ...featureModules,
};

type ResourceLoader = () => Promise<ResourceModule>;
type LoaderMap = Record<string, Record<string, ResourceLoader[]>>;
const loaders: LoaderMap = {};

for (const [path, loader] of Object.entries(modules)) {
  const match =
    path.match(/\.\.\/shared\/localization\/([a-z-]+)\/(.+)\.json$/) ??
    path.match(/\.\.\/features\/.+\/localization\/([a-z-]+)\/(.+)\.json$/);
  if (!match) continue;
  const lang = match[1];
  const ns = match[2];
  if (!loaders[lang]) loaders[lang] = {};
  if (!loaders[lang][ns]) loaders[lang][ns] = [];
  loaders[lang][ns].push(loader as ResourceLoader);
}

const DEFAULT_LANG = 'tr';
const fallbackLng = DEFAULT_LANG;
const supportedLngs = Object.keys(loaders);

const normalizeLang = (lng?: string | null): string | undefined => {
  if (!lng) return undefined;
  const lower = lng.toLowerCase();
  const mapped = lower === 'sa' ? 'ar' : lower;
  if (supportedLngs.includes(mapped)) return mapped;
  const base = mapped.split('-')[0];
  if (supportedLngs.includes(base)) return base;
  return mapped;
};

const storedLng = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const initialLng = storedLng ? (normalizeLang(storedLng) ?? DEFAULT_LANG) : DEFAULT_LANG;
const resolvedLng = supportedLngs.includes(initialLng) ? initialLng : DEFAULT_LANG;

export async function loadLanguage(lang: string): Promise<void> {
  const target = normalizeLang(lang) ?? fallbackLng;
  const langLoaders = loaders[target] || {};
  const entries = Object.entries(langLoaders);
  await Promise.all(
    entries.map(async ([ns, nsLoaders]) => {
      let merged: TranslationTree = {};
      for (const loader of nsLoaders) {
        const mod = await loader();
        merged = deepMerge(merged, mod.default);
      }
      i18n.addResourceBundle(target, ns, merged, true, true);
    })
  );
}

function deepMerge(target: TranslationTree, source: TranslationTree): TranslationTree {
  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const current = output[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      output[key] = deepMerge(current, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const initPromise = (async () => {
  const namespaces = Object.keys(loaders[fallbackLng] || {});
  const defaultNS = namespaces.includes('common') ? 'common' : namespaces[0] ?? 'translation';
  await i18n.use(initReactI18next).init({
    lng: resolvedLng,
    fallbackLng: supportedLngs.includes('en') ? [fallbackLng, 'en'] : fallbackLng,
    supportedLngs,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    ns: namespaces.length > 0 ? namespaces : [defaultNS],
    defaultNS,
    resources: {},
    interpolation: { escapeValue: false },
    detection: {
      order: [],
      caches: [],
    },
  });
  await loadLanguage(fallbackLng);
  if (resolvedLng !== fallbackLng) {
    await loadLanguage(resolvedLng);
  }
})();

i18n.on('languageChanged', async (lng) => {
  await loadLanguage(lng);
});

export async function ensureI18nReady(): Promise<void> {
  await initPromise;
}

export default i18n;
