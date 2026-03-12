import type { ContentMessage } from "../src/shared/types";

const COMMAND_TO_MESSAGE: Record<string, ContentMessage["type"]> = {
  "toggle-overlay": "BPKEYS_TOGGLE_OVERLAY",
  "save-favorite": "BPKEYS_SAVE_FAVORITE",
  "toggle-quick-menu": "BPKEYS_TOGGLE_QUICK_MENU",
};

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

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
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
      console.warn("[BPKeys] Unable to dispatch command to tab", error);
    }
  });
});
