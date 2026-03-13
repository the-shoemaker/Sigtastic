import {
  addFavorite,
  deleteFavorite,
  getFavorites,
  getLatestCapture,
  moveFavorite,
  setLatestCapture,
} from "../src/shared/storage";
import {
  buildClipboardWriteRequest,
  isClipboardWriteResultMessage,
  CONTENT_SOURCE as CLIPBOARD_CONTENT_SOURCE,
  type ClipboardWriteResultMessage,
} from "../src/content/signavio-clipboard";
import { FavoritesOverlay } from "../src/content/overlay";
import { QuickTypeMenu } from "../src/content/quick-menu";
import {
  formatShortcutForDisplay,
  getPlatformFromBrowserOs,
  getShortcutBindingForPlatform,
  getShortcutDefinition,
  matchesShortcut,
  resolveQuickMenuNumberModifier,
  type ShortcutActionId,
  type ShortcutPlatform,
} from "../src/shared/shortcuts";
import {
  getDefaultSettings,
  getSettings,
  normalizeSettings,
  SETTINGS_STORAGE_KEY,
  type SigtasticSettings,
} from "../src/shared/settings";
import type {
  ClipboardCapture,
  ContentMessage,
  EditorSelectionInfo,
  TaskTypeOption,
} from "../src/shared/types";
import { getPrimaryShapeInfo, getSuggestedFavoriteName } from "../src/shared/payload";

const MESSAGE_SOURCE = "sigtastic-hook";
let overlay: FavoritesOverlay | null = null;
let quickMenu: QuickTypeMenu | null = null;
let quickMenuBootstrapComplete = false;
let currentPlatform: ShortcutPlatform = "default";
let currentSettings: SigtasticSettings = getDefaultSettings();
const recentGlobalShortcutDispatches = new Map<ShortcutActionId, number>();

const pendingClipboardWrites = new Map<
  string,
  {
    resolve: () => void;
    reject: (reason?: unknown) => void;
    timer: number;
  }
>();

const pendingEditorRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    timer: number;
  }
>();
const lastKnownTaskTypes = new Map<string, TaskTypeOption>();

const toast = (() => {
  let node: HTMLDivElement | null = null;
  let timer: number | null = null;

  return (message: string) => {
    if (!node) {
      node = document.createElement("div");
      node.style.position = "fixed";
      node.style.right = "20px";
      node.style.bottom = "20px";
      node.style.zIndex = "2147483647";
      node.style.padding = "10px 14px";
      node.style.background = "rgba(31, 31, 31, 0.92)";
      node.style.color = "#f3f3f3";
      node.style.border = "1px solid rgba(255, 255, 255, 0.2)";
      node.style.borderRadius = "12px";
      node.style.fontFamily = "system-ui, sans-serif";
      node.style.fontSize = "13px";
      node.style.boxShadow = "0 8px 28px rgba(0, 0, 0, 0.35)";
      node.style.backdropFilter = "blur(3px)";
      document.body.appendChild(node);
    }

    node.textContent = message;
    node.style.opacity = "1";

    if (timer) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      if (node) {
        node.style.opacity = "0";
      }
    }, 2500);
  };
})();

const getPasteShortcutLabel = (): string => {
  return currentPlatform === "mac" ? "Command+V" : "Ctrl+V";
};

const getShortcutValue = (actionId: ShortcutActionId): string => {
  return getShortcutBindingForPlatform(currentSettings.shortcuts[actionId], currentPlatform);
};

const getShortcutLabel = (actionId: ShortcutActionId): string => {
  return formatShortcutForDisplay(getShortcutValue(actionId), currentPlatform);
};

const buildOverlayPreferences = () => ({
  backdropBlurEnabled: currentSettings.appearance.overlayBackdropBlur,
  saveFavoriteShortcutLabel: getShortcutLabel("save-favorite"),
  shortcutPlatform: currentPlatform,
  shortcuts: {
    "overlay-insert-selected": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-insert-selected"], currentPlatform,
    ),
    "overlay-delete-selected": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-delete-selected"], currentPlatform,
    ),
    "overlay-move-up": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-move-up"], currentPlatform,
    ),
    "overlay-move-down": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-move-down"], currentPlatform,
    ),
    "overlay-navigate-left": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-navigate-left"], currentPlatform,
    ),
    "overlay-navigate-right": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-navigate-right"], currentPlatform,
    ),
    "overlay-navigate-up": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-navigate-up"], currentPlatform,
    ),
    "overlay-navigate-down": getShortcutBindingForPlatform(
      currentSettings.shortcuts["overlay-navigate-down"], currentPlatform,
    ),
  },
  shortcutLabels: {
    "overlay-insert-selected": getShortcutLabel("overlay-insert-selected"),
    "overlay-delete-selected": getShortcutLabel("overlay-delete-selected"),
    "overlay-move-up": getShortcutLabel("overlay-move-up"),
    "overlay-move-down": getShortcutLabel("overlay-move-down"),
    "overlay-navigate-left": getShortcutLabel("overlay-navigate-left"),
    "overlay-navigate-right": getShortcutLabel("overlay-navigate-right"),
    "overlay-navigate-up": getShortcutLabel("overlay-navigate-up"),
    "overlay-navigate-down": getShortcutLabel("overlay-navigate-down"),
  },
});

const buildQuickMenuPreferences = () => ({
  shortcutPlatform: currentPlatform,
  resolvedNumberShortcutModifier: resolveQuickMenuNumberModifier(
    getShortcutValue("toggle-quick-menu"),
    currentPlatform,
    currentSettings.quickMenu.numberShortcutModifier,
  ),
});

const syncOverlayPreferences = (): void => {
  overlay?.setPreferences(buildOverlayPreferences());
  quickMenu?.setPreferences(buildQuickMenuPreferences());
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]',
    ),
  );
};

const runGlobalShortcutAction = async (actionId: ShortcutActionId): Promise<void> => {
  if (actionId === "toggle-overlay") {
    await handleToggleOverlay();
    return;
  }

  if (actionId === "save-favorite") {
    await handleSaveFavorite();
    return;
  }

  if (actionId === "toggle-quick-menu") {
    await handleToggleQuickMenu();
  }
};

const dispatchGlobalShortcutAction = (actionId: ShortcutActionId): void => {
  const now = Date.now();
  const previous = recentGlobalShortcutDispatches.get(actionId) ?? 0;
  if (now - previous < 180) {
    return;
  }

  recentGlobalShortcutDispatches.set(actionId, now);
  void runGlobalShortcutAction(actionId);
};

const GLOBAL_SHORTCUT_ACTIONS: ShortcutActionId[] = [
  "toggle-overlay",
  "save-favorite",
  "toggle-quick-menu",
];

const onConfiguredShortcutKeyDown = (event: KeyboardEvent): void => {
  const overlayOpen = overlay?.isOpen() ?? false;
  const quickMenuOpen = quickMenu?.isOpen() ?? false;

  if (!overlayOpen && !quickMenuOpen && (event.defaultPrevented || isEditableTarget(event.target))) {
    return;
  }

  for (const actionId of GLOBAL_SHORTCUT_ACTIONS) {
    if (
      !matchesShortcut(
        event,
        getShortcutDefinition(actionId),
        getShortcutValue(actionId),
        currentPlatform,
      )
    ) {
      continue;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dispatchGlobalShortcutAction(actionId);
    return;
  }
};

const applyUpdatedSettings = (nextSettings: SigtasticSettings): void => {
  currentSettings = nextSettings;
  syncOverlayPreferences();
};

const detectPlatform = async (): Promise<ShortcutPlatform> => {
  try {
    const info = await browser.runtime.getPlatformInfo();
    return getPlatformFromBrowserOs(info.os);
  } catch {
    return "default";
  }
};

const showSaveFavoriteModal = (
  defaults: {
    name: string;
    content: string;
  },
): Promise<{ name: string; content: string } | null> =>
  new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = "2147483647";
    host.style.display = "grid";
    host.style.placeItems = "center";

    const scrim = document.createElement("div");
    scrim.style.position = "absolute";
    scrim.style.inset = "0";
    scrim.style.background = "rgba(10, 12, 14, 0.4)";
    scrim.style.backdropFilter = "blur(3px)";

    const panel = document.createElement("div");
    panel.style.position = "relative";
    panel.style.width = "min(720px, calc(100vw - 32px))";
    panel.style.maxWidth = "100%";
    panel.style.maxHeight = "calc(100vh - 32px)";
    panel.style.overflow = "auto";
    panel.style.boxSizing = "border-box";
    panel.style.padding = "16px";
    panel.style.borderRadius = "16px";
    panel.style.background = "rgba(26, 28, 33, 0.92)";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    panel.style.boxShadow = "0 22px 54px rgba(0, 0, 0, 0.62)";
    panel.style.display = "grid";
    panel.style.gap = "12px";
    panel.style.fontFamily = "\"Avenir Next\", \"Segoe UI\", sans-serif";
    panel.addEventListener("click", (event) => event.stopPropagation());

    const title = document.createElement("div");
    title.textContent = "Save Favorite";
    title.style.fontSize = "18px";
    title.style.fontWeight = "700";
    title.style.color = "#f3f3f3";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Name";
    nameLabel.style.fontSize = "12px";
    nameLabel.style.fontWeight = "600";
    nameLabel.style.color = "rgba(243,243,243,0.86)";
    nameLabel.style.display = "grid";
    nameLabel.style.gap = "6px";
    nameLabel.style.minWidth = "0";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = defaults.name;
    nameInput.style.display = "block";
    nameInput.style.width = "100%";
    nameInput.style.maxWidth = "100%";
    nameInput.style.minWidth = "0";
    nameInput.style.boxSizing = "border-box";
    nameInput.style.padding = "9px 11px";
    nameInput.style.borderRadius = "10px";
    nameInput.style.border = "1px solid rgba(255,255,255,0.18)";
    nameInput.style.background = "rgba(255,255,255,0.08)";
    nameInput.style.color = "#ececec";
    nameInput.style.fontSize = "15px";
    nameInput.style.outline = "none";

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Content";
    contentLabel.style.fontSize = "12px";
    contentLabel.style.fontWeight = "600";
    contentLabel.style.color = "rgba(243,243,243,0.86)";
    contentLabel.style.display = "grid";
    contentLabel.style.gap = "6px";
    contentLabel.style.minWidth = "0";

    const contentInput = document.createElement("input");
    contentInput.type = "text";
    contentInput.value = defaults.content;
    contentInput.style.display = "block";
    contentInput.style.width = "100%";
    contentInput.style.maxWidth = "100%";
    contentInput.style.minWidth = "0";
    contentInput.style.boxSizing = "border-box";
    contentInput.style.padding = "9px 11px";
    contentInput.style.borderRadius = "10px";
    contentInput.style.border = "1px solid rgba(255,255,255,0.18)";
    contentInput.style.background = "rgba(255,255,255,0.08)";
    contentInput.style.color = "#ececec";
    contentInput.style.fontSize = "15px";
    contentInput.style.outline = "none";

    nameLabel.append(nameInput);
    contentLabel.append(contentInput);

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "8px";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "8px 12px";
    cancelButton.style.borderRadius = "10px";
    cancelButton.style.border = "1px solid rgba(255,255,255,0.2)";
    cancelButton.style.background = "rgba(255,255,255,0.06)";
    cancelButton.style.color = "#ececec";
    cancelButton.style.cursor = "pointer";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.style.padding = "8px 12px";
    saveButton.style.borderRadius = "10px";
    saveButton.style.border = "1px solid rgba(255,255,255,0.32)";
    saveButton.style.background = "rgba(255,255,255,0.16)";
    saveButton.style.color = "#f6f6f6";
    saveButton.style.fontWeight = "700";
    saveButton.style.cursor = "pointer";

    buttons.append(cancelButton, saveButton);
    panel.append(title, nameLabel, contentLabel, buttons);
    host.append(scrim, panel);
    document.body.append(host);

    const close = (result: { name: string; content: string } | null) => {
      document.removeEventListener("keydown", onKeyDown, true);
      host.remove();
      resolve(result);
    };

    const onSave = () => {
      close({
        name: nameInput.value.trim(),
        content: contentInput.value.trim(),
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onSave();
      }
    };

    scrim.addEventListener("click", () => close(null));
    cancelButton.addEventListener("click", () => close(null));
    saveButton.addEventListener("click", onSave);
    document.addEventListener("keydown", onKeyDown, true);

    window.setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 0);
  });

const isClipboardCapture = (value: unknown): value is ClipboardCapture => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const templateValid =
    !("requestTemplate" in candidate) ||
    candidate.requestTemplate === undefined ||
    (typeof candidate.requestTemplate === "object" && candidate.requestTemplate !== null);

  return (
    typeof candidate.namespace === "string" &&
    typeof candidate.capturedAt === "number" &&
    (candidate.source === "fetch" || candidate.source === "xhr" || candidate.source === "manual") &&
    "valueJson" in candidate &&
    templateValid
  );
};

const createRequestId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isEditorSelectionInfo = (value: unknown): value is EditorSelectionInfo => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.hasSelection === "boolean" &&
    typeof candidate.selectedCount === "number" &&
    typeof candidate.isTask === "boolean" &&
    (candidate.taskType === null || typeof candidate.taskType === "string") &&
    (candidate.shapeId === null || typeof candidate.shapeId === "string")
  );
};

const injectClipboardHook = () => {
  if (document.getElementById("sigtastic-clipboard-hook")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "sigtastic-clipboard-hook";
  script.src = browser.runtime.getURL("clipboard-hook.js");
  script.async = false;
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
};

const resolvePendingWrite = (data: ClipboardWriteResultMessage): void => {
  const pending = pendingClipboardWrites.get(data.requestId);
  if (!pending) {
    return;
  }

  window.clearTimeout(pending.timer);
  pendingClipboardWrites.delete(data.requestId);

  if (data.ok) {
    pending.resolve();
    return;
  }

  pending.reject(new Error(data.error || `Clipboard write failed (${data.status ?? "unknown"})`));
};

const resolvePendingEditorRequest = (
  data: Record<string, unknown>,
  expectedType: "editor-query-result" | "editor-action-result",
): void => {
  if (data.type !== expectedType || typeof data.requestId !== "string") {
    return;
  }

  const pending = pendingEditorRequests.get(data.requestId);
  if (!pending) {
    return;
  }

  window.clearTimeout(pending.timer);
  pendingEditorRequests.delete(data.requestId);

  if (data.ok === false) {
    pending.reject(new Error(typeof data.error === "string" ? data.error : "Editor bridge request failed"));
    return;
  }

  pending.resolve(data.result);
};

const requestEditorQuery = async (): Promise<EditorSelectionInfo> => {
  const requestId = createRequestId("editor-query");
  const result = await new Promise<unknown>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingEditorRequests.delete(requestId);
      reject(new Error("Timed out waiting for editor selection info"));
    }, 20000);

    pendingEditorRequests.set(requestId, { resolve, reject, timer });
    window.postMessage(
      {
        source: CLIPBOARD_CONTENT_SOURCE,
        type: "editor-query-request",
        requestId,
        query: "selection-info",
      },
      window.location.origin,
    );
  });

  if (!isEditorSelectionInfo(result)) {
    throw new Error("Editor selection response was invalid");
  }

  const cachedTaskType =
    result.shapeId && lastKnownTaskTypes.has(result.shapeId)
      ? (lastKnownTaskTypes.get(result.shapeId) ?? null)
      : null;

  if (result.shapeId && result.taskType) {
    lastKnownTaskTypes.set(result.shapeId, result.taskType);
  }

  if (cachedTaskType && result.isTask && (result.taskType === null || result.taskType === "none")) {
    return {
      ...result,
      taskType: cachedTaskType,
    };
  }

  if (result.isTask && result.taskType === null) {
    return {
      ...result,
      taskType: "none",
    };
  }

  return result;
};
const requestTaskTypeApply = async (
  taskType: TaskTypeOption,
  shapeId: string | null,
): Promise<{ ok: boolean; error?: string }> => {
  const requestId = createRequestId("editor-action");
  const result = await new Promise<unknown>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingEditorRequests.delete(requestId);
      reject(new Error("Timed out waiting for task type update"));
    }, 20000);

    pendingEditorRequests.set(requestId, { resolve, reject, timer });
    window.postMessage(
      {
        source: CLIPBOARD_CONTENT_SOURCE,
        type: "editor-action-request",
        requestId,
        action: "set-task-type",
        taskType,
        shapeId,
      },
      window.location.origin,
    );
  });

  if (typeof result !== "object" || result === null || typeof (result as { ok?: unknown }).ok !== "boolean") {
    throw new Error("Editor action response was invalid");
  }

  const typedResult = result as { ok: boolean; error?: string };
  if (typedResult.ok && shapeId) {
    lastKnownTaskTypes.set(shapeId, taskType);
  }

  return typedResult;
};

const requestQuickMenuBootstrap = async (): Promise<{ ok: boolean; error?: string }> => {
  const requestId = createRequestId("editor-action");
  const result = await new Promise<unknown>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingEditorRequests.delete(requestId);
      reject(new Error("Timed out waiting for quick menu bootstrap"));
    }, 20000);

    pendingEditorRequests.set(requestId, { resolve, reject, timer });
    window.postMessage(
      {
        source: CLIPBOARD_CONTENT_SOURCE,
        type: "editor-action-request",
        requestId,
        action: "prime-task-type-context",
      },
      window.location.origin,
    );
  });

  if (typeof result !== "object" || result === null || typeof (result as { ok?: unknown }).ok !== "boolean") {
    throw new Error("Quick menu bootstrap response was invalid");
  }

  return result as { ok: boolean; error?: string };
};

const writeFavoriteToClipboard = async (favorite: {
  payload: unknown;
  namespace: string;
  requestTemplate?: ClipboardCapture["requestTemplate"];
}): Promise<void> => {
  const sendWriteRequest = async (sanitize: boolean): Promise<void> => {
    const request = buildClipboardWriteRequest(
      {
        payload: favorite.payload,
        namespace: favorite.namespace,
        requestTemplate: favorite.requestTemplate,
      },
      { sanitize },
    );

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pendingClipboardWrites.delete(request.requestId);
        reject(new Error("Timed out waiting for page clipboard write result"));
      }, 5000);

      pendingClipboardWrites.set(request.requestId, { resolve, reject, timer });
      window.postMessage(request, window.location.origin);
    });
  };

  try {
    await sendWriteRequest(false);
  } catch (firstError) {
    // Fallback: retry with sanitized payload if raw payload is rejected by server.
    await sendWriteRequest(true).catch((secondError) => {
      throw new Error(
        `Clipboard write failed (raw + sanitized). First: ${String(firstError)}. Second: ${String(secondError)}`,
      );
    });
  }
};


const ensureOverlay = (): FavoritesOverlay => {
  if (overlay) {
    return overlay;
  }

  overlay = new FavoritesOverlay({
    onInsert: async (favorite) => {
      try {
        await writeFavoriteToClipboard(favorite);
        toast(`Loaded favorite: ${favorite.name}. Press ${getPasteShortcutLabel()} to paste.`);
      } catch (error) {
        console.error("[Sigtastic] Failed to write favorite payload", error);
        const message = error instanceof Error ? error.message : String(error);
        toast(`Clipboard write failed: ${message.slice(0, 120)}`);
      }
    },
    onDelete: async (favorite) => {
      const nextFavorites = await deleteFavorite(favorite.id);
      overlay?.refreshFavorites(nextFavorites);
      toast(`Deleted favorite: ${favorite.name}`);
    },
    onMove: async (favorite, direction) => {
      const nextFavorites = await moveFavorite(favorite.id, direction);
      overlay?.refreshFavorites(nextFavorites);
    },
    onClose: () => {
      // Intentionally empty; close state is managed inside overlay.
    },
  }, buildOverlayPreferences());

  return overlay;
};

const getTaskTypeLabel = (taskType: TaskTypeOption): string => {
  const labels: Record<TaskTypeOption, string> = {
    none: "None",
    send: "Send",
    receive: "Receive",
    script: "Script",
    service: "Service",
    user: "User",
    manual: "Manual",
    "business-rule": "Business Rule",
  };

  return labels[taskType];
};

const getQuickMenuSelectionError = (selection: EditorSelectionInfo): string | null => {
  if (!selection.hasSelection) {
    return "Select a task first.";
  }

  if (selection.selectedCount > 1) {
    return "Select a single task for quick type change.";
  }

  if (!selection.isTask) {
    return "Quick type menu works on task elements only.";
  }

  return null;
};

const ensureQuickMenu = (): QuickTypeMenu => {
  if (quickMenu) {
    return quickMenu;
  }

  quickMenu = new QuickTypeMenu({
    onApply: async (taskType) => {
      try {
        const result = await requestTaskTypeApply(taskType, quickMenu?.getShapeId() ?? null);
        if (!result.ok) {
          toast(result.error || "Unable to change task type.");
          return false;
        }

        toast(`Changed task type to ${getTaskTypeLabel(taskType)}.`);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast(`Task type change failed: ${message.slice(0, 120)}`);
        return false;
      }
    },
    onClose: () => {
      // Intentionally empty; close state is managed inside the menu.
    },
  }, buildQuickMenuPreferences());

  return quickMenu;
};

const handleSaveFavorite = async () => {
  const latestCapture = await getLatestCapture();
  if (!latestCapture) {
    toast("No copied Signavio snippet found yet.");
    return;
  }

  const shapeInfo = getPrimaryShapeInfo(latestCapture.valueJson);
  const defaults = {
    name: getSuggestedFavoriteName(latestCapture.valueJson),
    content: shapeInfo.contentText,
  };

  const input = await showSaveFavoriteModal(defaults);
  if (!input) {
    return;
  }

  const name = input.name.trim();
  if (!name) {
    toast("Favorite name cannot be empty.");
    return;
  }

  await addFavorite(name, latestCapture, {
    displayName: input.name,
    displayContent: input.content,
    defaultDisplayName: defaults.name,
    defaultDisplayContent: defaults.content,
  });
  if (overlay?.isOpen()) {
    const favorites = await getFavorites();
    overlay.refreshFavorites(favorites);
  }
  toast(`Saved favorite: ${name}`);
};

const handleToggleOverlay = async () => {
  if (quickMenu?.isOpen()) {
    quickMenu.close();
  }

  const favorites = await getFavorites();
  const instance = ensureOverlay();
  instance.toggle(favorites);
};

const handleToggleQuickMenu = async () => {
  if (overlay?.isOpen()) {
    overlay.close();
  }

  const instance = ensureQuickMenu();
  if (instance.isOpen()) {
    instance.close();
    return;
  }

  let selection: EditorSelectionInfo;
  try {
    selection = await requestEditorQuery();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toast(`Unable to inspect selection: ${message.slice(0, 120)}`);
    return;
  }

  const selectionError = getQuickMenuSelectionError(selection);
  if (selectionError) {
    toast(selectionError);
    return;
  }

  if (!quickMenuBootstrapComplete) {
    try {
      const bootstrapResult = await requestQuickMenuBootstrap();
      if (bootstrapResult.ok) {
        quickMenuBootstrapComplete = true;
        selection = await requestEditorQuery();
      } else {
        console.warn("[Sigtastic] Quick menu bootstrap did not complete", bootstrapResult.error);
      }
    } catch (error) {
      console.warn("[Sigtastic] Quick menu bootstrap failed", error);
    }

    const refreshedSelectionError = getQuickMenuSelectionError(selection);
    if (refreshedSelectionError) {
      toast(refreshedSelectionError);
      return;
    }
  }

  instance.open(selection);
};

export default defineContentScript({
  matches: ["*://*.signavio.com/*"],
  runAt: "document_idle",
  main() {
    injectClipboardHook();
    window.addEventListener("keydown", onConfiguredShortcutKeyDown, true);

    void (async () => {
      currentPlatform = await detectPlatform();
      applyUpdatedSettings(await getSettings());

      const latest = await getLatestCapture();
      const templateFromLatest = latest?.requestTemplate;
      const templateFromFavorites = !templateFromLatest
        ? (await getFavorites()).find((favorite) => favorite.requestTemplate)?.requestTemplate
        : undefined;
      const requestTemplate = templateFromLatest ?? templateFromFavorites;

      if (!requestTemplate) {
        return;
      }

      window.postMessage(
        {
          source: CLIPBOARD_CONTENT_SOURCE,
          type: "clipboard-template-bootstrap",
          template: requestTemplate,
        },
        window.location.origin,
      );
    })();

    window.addEventListener("message", async (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as Record<string, unknown> | null;
      if (!data || data.source !== MESSAGE_SOURCE || typeof data.type !== "string") {
        return;
      }

      if (data.type === "clipboard-captured" && isClipboardCapture(data.payload)) {
        await setLatestCapture(data.payload);
        return;
      }

      if (data.type === "clipboard-write-result" && isClipboardWriteResultMessage(data)) {
        resolvePendingWrite(data);
        return;
      }

      if (data.type === "editor-query-result" || data.type === "editor-action-result") {
        resolvePendingEditorRequest(
          data,
          data.type === "editor-query-result" ? "editor-query-result" : "editor-action-result",
        );
      }
    });
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !(SETTINGS_STORAGE_KEY in changes)) {
        return;
      }

      applyUpdatedSettings(normalizeSettings(changes[SETTINGS_STORAGE_KEY]?.newValue));
    });

    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }

      const typedMessage = message as ContentMessage;
      if (typedMessage.type === "SIGTASTIC_SAVE_FAVORITE") {
        dispatchGlobalShortcutAction("save-favorite");
        return;
      }
      if (typedMessage.type === "SIGTASTIC_TOGGLE_OVERLAY") {
        dispatchGlobalShortcutAction("toggle-overlay");
        return;
      }
      if (typedMessage.type === "SIGTASTIC_TOGGLE_QUICK_MENU") {
        dispatchGlobalShortcutAction("toggle-quick-menu");
      }
    });
  },
});
