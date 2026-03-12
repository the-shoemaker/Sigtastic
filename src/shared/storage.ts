import type { ClipboardCapture, Favorite } from "./types";
import { preparePayloadForFavoriteStorage } from "./payload";

const FAVORITES_KEY = "favorites";
const FAVORITES_BACKUPS_KEY = "favoritesBackups";
const LAST_CAPTURE_KEY = "lastCapture";
const FAVORITES_MIRROR_KEY = "bpkeys.favorites.mirror.v1";
const MAX_FAVORITES_BACKUPS = 6;

type StorageShape = {
  favorites?: Favorite[];
  favoritesBackups?: FavoriteBackup[];
  lastCapture?: ClipboardCapture;
};

type FavoriteBackup = {
  savedAt: number;
  favorites: Favorite[];
};

const clone = <T>(value: T): T => structuredClone(value);

const normalizeName = (value: string): string => {
  return value.trim().replace(/\s+/g, " ");
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const makeUniqueFavoriteName = (proposedName: string, favorites: Favorite[]): string => {
  const cleaned = normalizeName(proposedName);
  if (!cleaned) {
    return "Favorite";
  }

  const hasExactDuplicate = favorites.some(
    (favorite) => normalizeName(favorite.name).toLowerCase() === cleaned.toLowerCase(),
  );
  if (!hasExactDuplicate) {
    return cleaned;
  }

  const baseMatch = cleaned.match(/^(.*?)(?:\s+(\d+))?$/);
  const base = normalizeName(baseMatch?.[1] ?? cleaned);
  const suffixPattern = new RegExp(`^${escapeRegExp(base)}(?:\\s+(\\d+))?$`, "i");
  const usedNumbers = new Set<number>();

  for (const favorite of favorites) {
    const normalized = normalizeName(favorite.name);
    const match = normalized.match(suffixPattern);
    if (!match) {
      continue;
    }

    if (match[1]) {
      usedNumbers.add(Number(match[1]));
    }
  }

  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `${base} ${nextNumber}`;
};

const sortFavorites = (favorites: Favorite[]): Favorite[] => {
  return [...favorites].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.createdAt - b.createdAt;
  });
};

const normalizeFavorites = (favorites: Favorite[]): Favorite[] => {
  return sortFavorites(favorites).map((favorite, index) => ({
    ...favorite,
    order: index,
  }));
};

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

const parseFavoritesArray = (value: unknown): Favorite[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isFavorite).map((favorite) => clone(favorite));
};

const parseFavoriteBackups = (value: unknown): FavoriteBackup[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Partial<FavoriteBackup>;
      if (typeof candidate.savedAt !== "number") {
        return null;
      }

      const favorites = parseFavoritesArray(candidate.favorites);
      if (favorites.length === 0) {
        return null;
      }

      return {
        savedAt: candidate.savedAt,
        favorites,
      } satisfies FavoriteBackup;
    })
    .filter((entry): entry is FavoriteBackup => Boolean(entry))
    .sort((left, right) => right.savedAt - left.savedAt);
};

const getMirrorStorage = (): Storage | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {}

  return null;
};

const readMirroredFavorites = (): Favorite[] => {
  const storage = getMirrorStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(FAVORITES_MIRROR_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { favorites?: unknown };
    return parseFavoritesArray(parsed?.favorites);
  } catch {
    return [];
  }
};

const writeMirroredFavorites = (favorites: Favorite[]): void => {
  const storage = getMirrorStorage();
  if (!storage) {
    return;
  }

  try {
    if (favorites.length === 0) {
      storage.removeItem(FAVORITES_MIRROR_KEY);
      return;
    }

    storage.setItem(
      FAVORITES_MIRROR_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        favorites,
      }),
    );
  } catch {
    // Ignore mirror write failures; primary storage remains the source of truth.
  }
};

const readFavoriteSources = async (): Promise<{
  primary: Favorite[];
  backups: FavoriteBackup[];
  mirrored: Favorite[];
}> => {
  const data = (await browser.storage.local.get([FAVORITES_KEY, FAVORITES_BACKUPS_KEY])) as StorageShape;
  return {
    primary: parseFavoritesArray(data.favorites),
    backups: parseFavoriteBackups(data.favoritesBackups),
    mirrored: readMirroredFavorites(),
  };
};

const chooseBestFavoriteRecovery = (sources: {
  primary: Favorite[];
  backups: FavoriteBackup[];
  mirrored: Favorite[];
}): Favorite[] => {
  if (sources.primary.length > 0) {
    return sources.primary;
  }

  if (sources.backups.length > 0) {
    return sources.backups[0]!.favorites;
  }

  if (sources.mirrored.length > 0) {
    return sources.mirrored;
  }

  return [];
};

const persistFavoritesState = async (favorites: Favorite[]): Promise<void> => {
  const normalized = normalizeFavorites(favorites);
  const current = await readFavoriteSources();
  const backups = normalized.length > 0
    ? [
        {
          savedAt: Date.now(),
          favorites: normalized,
        },
        ...current.backups.filter((entry) => JSON.stringify(entry.favorites) !== JSON.stringify(normalized)),
      ].slice(0, MAX_FAVORITES_BACKUPS)
    : current.backups;

  await browser.storage.local.set({
    [FAVORITES_KEY]: normalized,
    [FAVORITES_BACKUPS_KEY]: backups,
  });

  writeMirroredFavorites(normalized);
};

export async function getFavorites(): Promise<Favorite[]> {
  const sources = await readFavoriteSources();
  const recovered = chooseBestFavoriteRecovery(sources);
  const normalized = normalizeFavorites(recovered);

  const needsRestore =
    sources.primary.length === 0 &&
    normalized.length > 0;

  if (needsRestore) {
    await persistFavoritesState(normalized);
  }

  return normalized;
}

export async function setFavorites(
  favorites: Favorite[],
  options?: { allowEmpty?: boolean },
): Promise<Favorite[]> {
  const normalized = favorites.map((favorite, index) => ({
    ...favorite,
    order: index,
  }));

  if (normalized.length === 0 && !options?.allowEmpty) {
    const sources = await readFavoriteSources();
    const recovered = chooseBestFavoriteRecovery(sources);
    return normalizeFavorites(recovered);
  }

  await persistFavoritesState(normalized);
  return normalized;
}

export async function getLatestCapture(): Promise<ClipboardCapture | null> {
  const data = (await browser.storage.local.get(LAST_CAPTURE_KEY)) as StorageShape;
  if (!data.lastCapture) {
    return null;
  }

  return clone(data.lastCapture);
}

export async function setLatestCapture(capture: ClipboardCapture): Promise<void> {
  await browser.storage.local.set({
    [LAST_CAPTURE_KEY]: clone(capture),
  });
}

export async function addFavorite(
  name: string,
  capture: ClipboardCapture,
  options?: {
    displayName?: string;
    displayContent?: string;
    defaultDisplayName?: string;
    defaultDisplayContent?: string;
  },
): Promise<Favorite> {
  const favorites = await getFavorites();
  const now = Date.now();
  const uniqueName = makeUniqueFavoriteName(name, favorites);
  const defaultDisplayName = normalizeName(options?.defaultDisplayName ?? "");
  const defaultDisplayContent = normalizeName(options?.defaultDisplayContent ?? "");
  const nameCandidate =
    (options?.displayName ?? defaultDisplayName) || name || uniqueName;
  const displayName = normalizeName(nameCandidate);
  const displayContent = normalizeName(options?.displayContent ?? defaultDisplayContent);
  const displayNameCustom =
    displayName.length > 0 && defaultDisplayName.length > 0
      ? displayName.toLowerCase() !== defaultDisplayName.toLowerCase()
      : displayName.length > 0;
  const displayContentCustom =
    displayContent.length > 0 && defaultDisplayContent.length > 0
      ? displayContent.toLowerCase() !== defaultDisplayContent.toLowerCase()
      : displayContent.length > 0;
  const favorite: Favorite = {
    id: crypto.randomUUID(),
    name: uniqueName,
    displayName,
    displayNameCustom,
    displayContent,
    displayContentCustom,
    payload: preparePayloadForFavoriteStorage(capture.valueJson),
    namespace: capture.namespace,
    requestTemplate: capture.requestTemplate ? clone(capture.requestTemplate) : undefined,
    order: favorites.length,
    createdAt: now,
    updatedAt: now,
  };

  favorites.unshift(favorite);
  await setFavorites(favorites);
  return favorite;
}

export async function deleteFavorite(id: string): Promise<Favorite[]> {
  const favorites = await getFavorites();
  const filtered = favorites.filter((favorite) => favorite.id !== id);

  if (filtered.length === favorites.length) {
    return favorites;
  }

  return setFavorites(filtered, { allowEmpty: true });
}

export async function moveFavorite(
  id: string,
  direction: "up" | "down",
): Promise<Favorite[]> {
  const favorites = await getFavorites();
  const index = favorites.findIndex((favorite) => favorite.id === id);

  if (index === -1) {
    return favorites;
  }

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= favorites.length) {
    return favorites;
  }

  const reordered = [...favorites];
  const current = reordered[index];
  const destination = reordered[target];
  if (!current || !destination) {
    return favorites;
  }

  reordered[index] = destination;
  reordered[target] = current;
  const now = Date.now();

  reordered[index] = { ...destination, updatedAt: now };
  reordered[target] = { ...current, updatedAt: now };

  return setFavorites(reordered);
}
