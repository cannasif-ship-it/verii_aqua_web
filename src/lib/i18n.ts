import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const i18n = i18next.createInstance();

type TranslationTree = Record<string, unknown>;
type ResourceModule = { default: TranslationTree };
type ResourceLoader = () => Promise<ResourceModule>;
type NamespaceLoaderMap = Record<string, ResourceLoader[]>;
type LanguageNamespaceLoaderMap = Record<string, NamespaceLoaderMap>;
type FeatureLoaderMap = Record<string, LanguageNamespaceLoaderMap>;

const featureModules = import.meta.glob('../features/**/localization/*/*.json');
const sharedModules = import.meta.glob('../shared/localization/*/*.json');

const sharedLoaders: LanguageNamespaceLoaderMap = {};
const featureLoaders: FeatureLoaderMap = {};
const loadedSharedLanguages = new Set<string>();
const loadedFeatureLanguages = new Map<string, Set<string>>();

for (const [path, loader] of Object.entries(sharedModules)) {
  const match = path.match(/\.\.\/shared\/localization\/([a-z-]+)\/(.+)\.json$/);
  if (!match) continue;

  const [, lang, namespace] = match;
  sharedLoaders[lang] ??= {};
  sharedLoaders[lang][namespace] ??= [];
  sharedLoaders[lang][namespace].push(loader as ResourceLoader);
}

for (const [path, loader] of Object.entries(featureModules)) {
  const match =
    path.match(/\.\.\/features\/([^/]+)\/localization\/([a-z-]+)\/(.+)\.json$/) ??
    path.match(/\.\.\/features\/([^/]+)\/.+\/localization\/([a-z-]+)\/(.+)\.json$/);
  if (!match) continue;

  const [, featureKey, lang, namespace] = match;
  featureLoaders[featureKey] ??= {};
  featureLoaders[featureKey][lang] ??= {};
  featureLoaders[featureKey][lang][namespace] ??= [];
  featureLoaders[featureKey][lang][namespace].push(loader as ResourceLoader);
}

const DEFAULT_LANG = 'tr';
const fallbackLng = DEFAULT_LANG;
const supportedLngs = Array.from(
  new Set([...Object.keys(sharedLoaders), ...Object.values(featureLoaders).flatMap((x) => Object.keys(x))]),
);

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

async function mergeLanguageLoaders(lang: string, langLoaders: NamespaceLoaderMap): Promise<void> {
  await Promise.all(
    Object.entries(langLoaders).map(async ([namespace, namespaceLoaders]) => {
      let merged: TranslationTree = {};
      for (const loader of namespaceLoaders) {
        const mod = await loader();
        merged = deepMerge(merged, mod.default);
      }
      i18n.addResourceBundle(lang, namespace, merged, true, true);
    }),
  );
}

async function loadSharedLanguage(lang: string): Promise<void> {
  if (loadedSharedLanguages.has(lang)) return;

  const langLoaders = sharedLoaders[lang];
  if (!langLoaders) return;

  await mergeLanguageLoaders(lang, langLoaders);
  loadedSharedLanguages.add(lang);
}

async function loadFeatureLanguage(featureKey: string, lang: string): Promise<void> {
  const featureLangLoaders = featureLoaders[featureKey]?.[lang];
  if (!featureLangLoaders) return;

  const loadedLanguages = loadedFeatureLanguages.get(featureKey) ?? new Set<string>();
  if (loadedLanguages.has(lang)) return;

  await mergeLanguageLoaders(lang, featureLangLoaders);
  loadedLanguages.add(lang);
  loadedFeatureLanguages.set(featureKey, loadedLanguages);
}

export async function ensureFeatureNamespacesReady(
  featureKeys: string | string[],
  lang = normalizeLang(i18n.resolvedLanguage ?? i18n.language) ?? resolvedLng,
): Promise<void> {
  const keys = Array.isArray(featureKeys) ? featureKeys : [featureKeys];

  await loadSharedLanguage(fallbackLng);
  if (lang !== fallbackLng) {
    await loadSharedLanguage(lang);
  }

  await Promise.all(
    keys.flatMap((featureKey) => [
      loadFeatureLanguage(featureKey, fallbackLng),
      ...(lang !== fallbackLng ? [loadFeatureLanguage(featureKey, lang)] : []),
    ]),
  );
}

export async function loadLanguage(lang: string): Promise<void> {
  const normalizedLang = normalizeLang(lang) ?? fallbackLng;
  await loadSharedLanguage(fallbackLng);
  if (normalizedLang !== fallbackLng) {
    await loadSharedLanguage(normalizedLang);
  }

  await Promise.all(
    Array.from(loadedFeatureLanguages.keys()).map((featureKey) =>
      loadFeatureLanguage(featureKey, normalizedLang),
    ),
  );
}

const initPromise = (async () => {
  const sharedNamespaces = Object.keys(sharedLoaders[fallbackLng] || {});
  const defaultNS = sharedNamespaces.includes('common') ? 'common' : sharedNamespaces[0] ?? 'translation';

  await i18n.use(initReactI18next).init({
    lng: resolvedLng,
    fallbackLng: supportedLngs.includes('en') ? [fallbackLng, 'en'] : fallbackLng,
    supportedLngs,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    ns: sharedNamespaces.length > 0 ? sharedNamespaces : [defaultNS],
    defaultNS,
    resources: {},
    interpolation: { escapeValue: false },
    detection: {
      order: [],
      caches: [],
    },
  });

  await loadSharedLanguage(fallbackLng);
  if (resolvedLng !== fallbackLng) {
    await loadSharedLanguage(resolvedLng);
  }
})();

i18n.on('languageChanged', async (lng) => {
  await loadLanguage(lng);
});

export async function ensureI18nReady(): Promise<void> {
  await initPromise;
}

export default i18n;
