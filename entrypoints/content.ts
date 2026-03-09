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
import type { ClipboardCapture, ContentMessage } from "../src/shared/types";
import { getPrimaryShapeInfo, getSuggestedFavoriteName } from "../src/shared/payload";

const MESSAGE_SOURCE = "signavio-bpkeys-hook";
let overlay: FavoritesOverlay | null = null;
const pendingClipboardWrites = new Map<
  string,
  {
    resolve: () => void;
    reject: (reason?: unknown) => void;
    timer: number;
  }
>();

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

const injectClipboardHook = () => {
  if (document.getElementById("bpkeys-clipboard-hook")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "bpkeys-clipboard-hook";
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
        toast(`Loaded favorite: ${favorite.name}. Press Cmd/Ctrl+V to paste.`);
      } catch (error) {
        console.error("[BPKeys] Failed to write favorite payload", error);
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
  });

  return overlay;
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
  const favorites = await getFavorites();
  const instance = ensureOverlay();
  instance.toggle(favorites);
};

const handleBackgroundMessage = async (message: ContentMessage) => {
  if (message.type === "BPKEYS_SAVE_FAVORITE") {
    await handleSaveFavorite();
    return;
  }

  if (message.type === "BPKEYS_TOGGLE_OVERLAY") {
    await handleToggleOverlay();
  }
};

export default defineContentScript({
  matches: ["*://*.signavio.com/*"],
  runAt: "document_idle",
  main() {
    injectClipboardHook();

    void (async () => {
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
      }
    });

    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }

      return handleBackgroundMessage(message as ContentMessage);
    });
  },
});
