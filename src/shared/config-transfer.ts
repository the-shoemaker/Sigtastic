import { getFavorites, setFavorites } from "./storage";
import { getSettings, normalizeSettings, setSettings, type SigtasticSettings } from "./settings";
import type { Favorite } from "./types";

export const CONFIG_EXPORT_VERSION = 1;

export type SigtasticConfigExport = {
  version: number;
  exportedAt: string;
  settings: SigtasticSettings;
  favorites: Favorite[];
};

const clone = <T>(value: T): T => structuredClone(value);

const isFavorite = (value: unknown): value is Favorite => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Favorite>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    "payload" in candidate &&
    typeof candidate.namespace === "string" &&
    typeof candidate.order === "number" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
};

const parseFavorites = (value: unknown): Favorite[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isFavorite).map((favorite) => clone(favorite));
};

export async function buildConfigExport(): Promise<SigtasticConfigExport> {
  const [settings, favorites] = await Promise.all([getSettings(), getFavorites()]);

  return {
    version: CONFIG_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    favorites,
  };
}

export function parseConfigImport(rawValue: unknown): SigtasticConfigExport {
  if (!rawValue || typeof rawValue !== "object") {
    throw new Error("Config file is not a valid object.");
  }

  const candidate = rawValue as Partial<SigtasticConfigExport>;
  const favorites = parseFavorites(candidate.favorites);
  const settings = normalizeSettings(candidate.settings);

  return {
    version:
      typeof candidate.version === "number" && Number.isFinite(candidate.version)
        ? candidate.version
        : CONFIG_EXPORT_VERSION,
    exportedAt:
      typeof candidate.exportedAt === "string" && candidate.exportedAt.trim()
        ? candidate.exportedAt
        : new Date().toISOString(),
    settings,
    favorites,
  };
}

export async function importConfig(rawValue: unknown): Promise<SigtasticConfigExport> {
  const parsed = parseConfigImport(rawValue);
  await Promise.all([
    setSettings(parsed.settings),
    setFavorites(parsed.favorites, { allowEmpty: true }),
  ]);
  return parsed;
}
