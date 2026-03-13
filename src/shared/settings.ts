import {
  getDefaultShortcutBindings,
  normalizeShortcutBindings,
  type QuickMenuNumberModifier,
  type ShortcutActionId,
  type ShortcutBinding,
} from "./shortcuts";

export const SETTINGS_STORAGE_KEY = "settings";
export const SETTINGS_VERSION = 2;
export const AUTO_SAVE_MIN_INTERVAL_MINUTES = 0.1;
export const AUTO_SAVE_MAX_INTERVAL_MINUTES = 120;
export const AUTO_SAVE_DEFAULT_INTERVAL_MINUTES = 5;
export const AUTO_SAVE_INTERVAL_STEP_MINUTES = 0.1;

const clampAutoSaveIntervalMinutes = (value: unknown): number => {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  if (!Number.isFinite(numeric)) {
    return AUTO_SAVE_DEFAULT_INTERVAL_MINUTES;
  }

  const rounded = Math.round(numeric * 100) / 100;

  return Math.min(
    AUTO_SAVE_MAX_INTERVAL_MINUTES,
    Math.max(AUTO_SAVE_MIN_INTERVAL_MINUTES, rounded),
  );
};

export type SigtasticSettings = {
  version: number;
  shortcuts: Record<ShortcutActionId, ShortcutBinding>;
  appearance: {
    overlayBackdropBlur: boolean;
  };
  autoSave: {
    enabled: boolean;
    intervalMinutes: number;
  };
  quickMenu: {
    numberShortcutModifier: QuickMenuNumberModifier;
  };
};

type StorageShape = {
  settings?: unknown;
};

const clone = <T>(value: T): T => structuredClone(value);

export function getDefaultSettings(): SigtasticSettings {
  return {
    version: SETTINGS_VERSION,
    shortcuts: getDefaultShortcutBindings(),
    appearance: {
      overlayBackdropBlur: true,
    },
    autoSave: {
      enabled: false,
      intervalMinutes: AUTO_SAVE_DEFAULT_INTERVAL_MINUTES,
    },
    quickMenu: {
      numberShortcutModifier: "auto",
    },
  };
}

export function normalizeSettings(rawValue: unknown): SigtasticSettings {
  const defaults = getDefaultSettings();
  if (!rawValue || typeof rawValue !== "object") {
    return defaults;
  }

  const candidate = rawValue as Partial<SigtasticSettings> & {
    appearance?: Record<string, unknown>;
  };

  return {
    version: SETTINGS_VERSION,
    shortcuts: normalizeShortcutBindings(candidate.shortcuts),
    appearance: {
      overlayBackdropBlur:
        typeof candidate.appearance?.overlayBackdropBlur === "boolean"
          ? candidate.appearance.overlayBackdropBlur
          : defaults.appearance.overlayBackdropBlur,
    },
    autoSave: {
      enabled:
        typeof candidate.autoSave?.enabled === "boolean"
          ? candidate.autoSave.enabled
          : defaults.autoSave.enabled,
      intervalMinutes: clampAutoSaveIntervalMinutes(candidate.autoSave?.intervalMinutes),
    },
    quickMenu: {
      numberShortcutModifier:
        candidate.quickMenu?.numberShortcutModifier === "alt" ||
        candidate.quickMenu?.numberShortcutModifier === "ctrl" ||
        candidate.quickMenu?.numberShortcutModifier === "command" ||
        candidate.quickMenu?.numberShortcutModifier === "auto"
          ? candidate.quickMenu.numberShortcutModifier
          : defaults.quickMenu.numberShortcutModifier,
    },
  };
}

export async function getSettings(): Promise<SigtasticSettings> {
  const data = (await browser.storage.local.get(SETTINGS_STORAGE_KEY)) as StorageShape;
  const settings = normalizeSettings(data.settings);

  if (JSON.stringify(data.settings) !== JSON.stringify(settings)) {
    await browser.storage.local.set({
      [SETTINGS_STORAGE_KEY]: clone(settings),
    });
  }

  return settings;
}

export async function setSettings(settings: SigtasticSettings): Promise<SigtasticSettings> {
  const normalized = normalizeSettings(settings);
  await browser.storage.local.set({
    [SETTINGS_STORAGE_KEY]: clone(normalized),
  });
  return normalized;
}

export async function updateSettings(
  updater: (current: SigtasticSettings) => SigtasticSettings,
): Promise<SigtasticSettings> {
  const current = await getSettings();
  const next = updater(current);
  return setSettings(next);
}
