import {
  getPlatformFromBrowserOs,
  getShortcutBindingForPlatform,
  SHORTCUT_DEFINITIONS,
  type ShortcutActionId,
  type ShortcutPlatform,
} from "../src/shared/shortcuts";
import { getDefaultSettings, getSettings, normalizeSettings, SETTINGS_STORAGE_KEY } from "../src/shared/settings";
import type { ContentMessage } from "../src/shared/types";

const SETTINGS_PAGE_PATH = "settings.html";
const COMMAND_TO_MESSAGE: Record<string, ContentMessage["type"]> = {
  "toggle-overlay": "SIGTASTIC_TOGGLE_OVERLAY",
  "save-favorite": "SIGTASTIC_SAVE_FAVORITE",
  "toggle-quick-menu": "SIGTASTIC_TOGGLE_QUICK_MENU",
};
const GLOBAL_ACTION_IDS: ShortcutActionId[] = SHORTCUT_DEFINITIONS
  .filter((definition) => definition.context === "global")
  .map((definition) => definition.id);

const isSignavioUrl = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname.includes("signavio.com");
  } catch {
    return false;
  }
};

const getActiveSignavioTab = async (): Promise<browser.tabs.Tab | null> => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs.find((candidate) => isSignavioUrl(candidate.url));
  return tab ?? null;
};

const openOrFocusSettingsPage = async (): Promise<void> => {
  const settingsUrl = browser.runtime.getURL(SETTINGS_PAGE_PATH);
  const tabs = await browser.tabs.query({ currentWindow: true });
  const existing = tabs.find((tab) => tab.url?.startsWith(settingsUrl));

  if (existing?.id) {
    await browser.tabs.update(existing.id, { active: true });
    if (typeof existing.windowId === "number") {
      await browser.windows.update(existing.windowId, { focused: true });
    }
    return;
  }

  await browser.tabs.create({ url: settingsUrl });
};

const detectPlatform = async (): Promise<ShortcutPlatform> => {
  try {
    const info = await browser.runtime.getPlatformInfo();
    return getPlatformFromBrowserOs(info.os);
  } catch {
    return "default";
  }
};

const syncCommandShortcuts = async (): Promise<void> => {
  if (!browser.commands?.update) {
    return;
  }

  const platform = await detectPlatform();
  const settings = await getSettings().catch(() => getDefaultSettings());

  await Promise.all(
    GLOBAL_ACTION_IDS.map(async (actionId) => {
      const shortcut = getShortcutBindingForPlatform(settings.shortcuts[actionId], platform);
      try {
        await browser.commands.update({
          name: actionId,
          shortcut,
        });
      } catch (error) {
        console.warn("[Sigtastic] Unable to sync command shortcut", actionId, shortcut, error);
      }
    }),
  );
};

export default defineBackground(() => {
  const toolbarAction = ("action" in browser && browser.action) ? browser.action : browser.browserAction;

  toolbarAction.onClicked.addListener(() => {
    void openOrFocusSettingsPage();
  });

  void syncCommandShortcuts();

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(SETTINGS_STORAGE_KEY in changes)) {
      return;
    }

    const nextSettings = normalizeSettings(changes[SETTINGS_STORAGE_KEY]?.newValue);
    void (async () => {
      if (!browser.commands?.update) {
        return;
      }

      const platform = await detectPlatform();
      await Promise.all(
        GLOBAL_ACTION_IDS.map(async (actionId) => {
          const shortcut = getShortcutBindingForPlatform(nextSettings.shortcuts[actionId], platform);
          try {
            await browser.commands.update({
              name: actionId,
              shortcut,
            });
          } catch (error) {
            console.warn("[Sigtastic] Unable to update command shortcut after settings change", actionId, error);
          }
        }),
      );
    })();
  });

  browser.commands?.onCommand.addListener(async (command) => {
    const messageType = COMMAND_TO_MESSAGE[command];
    if (!messageType) {
      return;
    }

    const tab = await getActiveSignavioTab();
    if (!tab?.id) {
      return;
    }

    try {
      await browser.tabs.sendMessage(tab.id, { type: messageType } satisfies ContentMessage);
    } catch (error) {
      console.warn("[Sigtastic] Unable to dispatch command to tab", error);
    }
  });
});
