import {
  buildConfigExport,
  importConfig,
  parseConfigImport,
} from "../shared/config-transfer";
import {
  SHORTCUT_DEFINITIONS,
  formatShortcutForDisplay,
  getPlatformFromBrowserOs,
  getPlatformLabel,
  getShortcutBindingForPlatform,
  getShortcutConflictIds,
  getShortcutDefinition,
  getShortcutPlatforms,
  isShortcutConfirmKey,
  isShortcutResetKey,
  shortcutFromKeyboardEvent,
  type QuickMenuNumberModifier,
  type ShortcutActionId,
  type ShortcutPlatform,
} from "../shared/shortcuts";
import {
  getDefaultSettings,
  getSettings,
  setSettings,
  type SigtasticSettings,
} from "../shared/settings";
import { getFavorites } from "../shared/storage";

type SettingsViewId = "general" | "shortcuts" | "docs";

type ShortcutCaptureState = {
  actionId: ShortcutActionId;
  pendingShortcut: string | null;
  error: string | null;
};

type DocsBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; code: string; language: string }
  | { type: "heading"; text: string };

type DocsSection = {
  id: string;
  title: string;
  blocks: DocsBlock[];
};

const navLinks = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-view-target]"));
const viewEls = Array.from(document.querySelectorAll<HTMLElement>("[data-view]"));
const blurToggle = document.querySelector<HTMLInputElement>("#blur-toggle");
const exportButton = document.querySelector<HTMLButtonElement>("#export-button");
const importButton = document.querySelector<HTMLButtonElement>("#import-button");
const importInput = document.querySelector<HTMLInputElement>("#import-input");
const quickMenuNumberModifierSelect = document.querySelector<HTMLSelectElement>("#quick-menu-number-modifier");
const favoritesCountEl = document.querySelector<HTMLElement>("#favorites-count");
const platformPillEl = document.querySelector<HTMLElement>("#platform-pill");
const configStatusEl = document.querySelector<HTMLElement>("#config-status");
const platformTabsEl = document.querySelector<HTMLElement>("#platform-tabs");
const shortcutGroupsEl = document.querySelector<HTMLElement>("#shortcut-groups");
const docsTocEl = document.querySelector<HTMLElement>("#docs-toc");
const docsContentEl = document.querySelector<HTMLElement>("#docs-content");

if (
  !blurToggle ||
  !exportButton ||
  !importButton ||
  !importInput ||
  !quickMenuNumberModifierSelect ||
  !favoritesCountEl ||
  !platformPillEl ||
  !configStatusEl ||
  !platformTabsEl ||
  !shortcutGroupsEl ||
  !docsTocEl ||
  !docsContentEl
) {
  throw new Error("Settings page failed to initialize.");
}

const VIEW_IDS: SettingsViewId[] = ["general", "shortcuts", "docs"];

const state = {
  activeView: "general" as SettingsViewId,
  settings: getDefaultSettings(),
  favoritesCount: 0,
  selectedPlatform: "default" as ShortcutPlatform,
  capture: null as ShortcutCaptureState | null,
  docsSections: [] as DocsSection[],
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
};

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";
};

const getPasteShortcutLabel = (): string => {
  return state.selectedPlatform === "mac" ? "Command + V" : "Ctrl + V";
};

const getShortcutValue = (actionId: ShortcutActionId): string => {
  return getShortcutBindingForPlatform(state.settings.shortcuts[actionId], state.selectedPlatform);
};

const getShortcutLabel = (actionId: ShortcutActionId, shortcut?: string): string => {
  return formatShortcutForDisplay(shortcut ?? getShortcutValue(actionId), state.selectedPlatform);
};

const setConfigStatus = (message: string, tone: "neutral" | "success" | "error" = "neutral"): void => {
  configStatusEl.textContent = message;
  configStatusEl.classList.toggle("is-success", tone === "success");
  configStatusEl.classList.toggle("is-error", tone === "error");
};

const blurActiveShortcutInput = (): void => {
  if (
    document.activeElement instanceof HTMLInputElement &&
    document.activeElement.classList.contains("shortcut-input")
  ) {
    document.activeElement.blur();
  }
};

const cloneSettings = (): SigtasticSettings => {
  return structuredClone(state.settings);
};

const getConflictMessage = (
  settings: SigtasticSettings,
  platform: ShortcutPlatform,
  actionId: ShortcutActionId,
): string | null => {
  const duplicateIds = getShortcutConflictIds(settings.shortcuts, platform, actionId);
  if (duplicateIds.length === 0) {
    return null;
  }

  const labels = duplicateIds.map((id) => getShortcutDefinition(id).title).join(", ");
  return `Conflicts with ${labels}.`;
};

const getImportConflictMessage = (settings: SigtasticSettings): string | null => {
  for (const platform of getShortcutPlatforms()) {
    for (const definition of SHORTCUT_DEFINITIONS) {
      const message = getConflictMessage(settings, platform, definition.id);
      if (message) {
        return `${getPlatformLabel(platform)}: ${message}`;
      }
    }
  }

  return null;
};

const setActiveView = (nextView: SettingsViewId, options?: { updateHash?: boolean }): void => {
  state.activeView = nextView;
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.viewTarget === nextView);
  });
  viewEls.forEach((view) => {
    const active = view.dataset.view === nextView;
    view.classList.toggle("is-active", active);
    view.hidden = !active;
  });

  if (options?.updateHash !== false) {
    history.replaceState(null, "", `#${nextView}`);
  }
};

const getViewFromHash = (): SettingsViewId => {
  const hash = window.location.hash.replace(/^#/, "");
  return VIEW_IDS.includes(hash as SettingsViewId) ? (hash as SettingsViewId) : "general";
};

const resolveDocsTokens = (text: string): string => {
  return text
    .replace(/\{\{shortcut:([a-z-]+)\}\}/g, (_, rawActionId: string) => {
      const actionId = rawActionId as ShortcutActionId;
      try {
        return `\u0000shortcut:${getShortcutLabel(actionId)}\u0000`;
      } catch {
        return rawActionId;
      }
    })
    .replace(/\{\{paste\}\}/g, `\u0000shortcut:${getPasteShortcutLabel()}\u0000`);
};

const renderInlineText = (text: string): string => {
  let rendered = escapeHtml(resolveDocsTokens(text));
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  rendered = rendered.replace(
    /\u0000shortcut:([^\u0000]+)\u0000/g,
    '<kbd class="shortcut-chip">$1</kbd>',
  );
  return rendered;
};

const parseDocsMarkdown = (markdown: string): DocsSection[] => {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const sections: DocsSection[] = [];
  let currentSection: DocsSection | null = null;
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushParagraph = (): void => {
    if (!currentSection || paragraphLines.length === 0) {
      paragraphLines = [];
      return;
    }

    currentSection.blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" ").trim(),
    });
    paragraphLines = [];
  };

  const flushList = (): void => {
    if (!currentSection || listItems.length === 0) {
      listItems = [];
      return;
    }

    currentSection.blocks.push({
      type: "list",
      items: [...listItems],
    });
    listItems = [];
  };

  const flushCode = (): void => {
    if (!currentSection || codeLines.length === 0) {
      codeLines = [];
      codeLanguage = "";
      return;
    }

    currentSection.blocks.push({
      type: "code",
      code: codeLines.join("\n"),
      language: codeLanguage,
    });
    codeLines = [];
    codeLanguage = "";
  };

  const ensureSection = (): DocsSection => {
    if (currentSection) {
      return currentSection;
    }

    currentSection = {
      id: "overview",
      title: "Overview",
      blocks: [],
    };
    sections.push(currentSection);
    return currentSection;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      currentSection = {
        id: slugify(line.slice(3)),
        title: line.slice(3).trim(),
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("# ")) {
      ensureSection();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      ensureSection().blocks.push({
        type: "heading",
        text: line.slice(4).trim(),
      });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      ensureSection();
      listItems.push(line.slice(2).trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    ensureSection();
    paragraphLines.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();

  return sections;
};

const renderGeneral = (): void => {
  blurToggle.checked = state.settings.appearance.overlayBackdropBlur;
  favoritesCountEl.textContent = String(state.favoritesCount);
};

const renderPlatformTabs = (): void => {
  platformTabsEl.replaceChildren();
  platformPillEl.textContent = getPlatformLabel(state.selectedPlatform);

  for (const platform of getShortcutPlatforms()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "platform-tab";
    button.textContent = getPlatformLabel(platform);
    button.classList.toggle("is-active", platform === state.selectedPlatform);
    button.addEventListener("click", () => {
      state.selectedPlatform = platform;
      state.capture = null;
      render();
    });
    platformTabsEl.appendChild(button);
  }
};

const renderQuickMenuModifier = (): void => {
  quickMenuNumberModifierSelect.value = state.settings.quickMenu.numberShortcutModifier;
};

const saveSettings = async (nextSettings: SigtasticSettings): Promise<void> => {
  const conflictMessage = getImportConflictMessage(nextSettings);
  if (conflictMessage) {
    throw new Error(conflictMessage);
  }

  state.settings = await setSettings(nextSettings);
  render();
};

const resetShortcutToDefault = async (actionId: ShortcutActionId): Promise<void> => {
  const defaults = getDefaultSettings();
  const nextSettings = cloneSettings();
  nextSettings.shortcuts[actionId][state.selectedPlatform] =
    defaults.shortcuts[actionId][state.selectedPlatform];
  blurActiveShortcutInput();
  state.capture = null;
  await saveSettings(nextSettings);
  setConfigStatus(`Reset ${getShortcutDefinition(actionId).title}.`, "success");
};

const commitCapturedShortcut = async (actionId: ShortcutActionId, shortcut: string): Promise<void> => {
  const nextSettings = cloneSettings();
  nextSettings.shortcuts[actionId][state.selectedPlatform] = shortcut;
  blurActiveShortcutInput();
  state.capture = null;
  await saveSettings(nextSettings);
  setConfigStatus(`Updated ${getShortcutDefinition(actionId).title}.`, "success");
};

const renderShortcutGroups = (focusActionId?: ShortcutActionId): void => {
  shortcutGroupsEl.replaceChildren();
  const groups = [
    {
      title: "Global",
      description: "These work while a Signavio editor tab is active.",
      definitions: SHORTCUT_DEFINITIONS.filter((definition) => definition.context === "global"),
    },
    {
      title: "Panel",
      description: "These only apply while the Sigtastic overlay is open.",
      definitions: SHORTCUT_DEFINITIONS.filter((definition) => definition.context === "overlay"),
    },
  ];

  for (const groupConfig of groups) {
    const group = document.createElement("section");
    group.className = "shortcut-group";

    const header = document.createElement("div");
    header.className = "shortcut-group-header";
    header.innerHTML = `
      <h2>${escapeHtml(groupConfig.title)}</h2>
      <p>${escapeHtml(groupConfig.description)}</p>
    `;

    const list = document.createElement("div");
    list.className = "shortcut-list";

    for (const definition of groupConfig.definitions) {
      const isCapturing = state.capture?.actionId === definition.id;
      const draftShortcut = isCapturing ? state.capture?.pendingShortcut ?? undefined : undefined;
      const conflictMessage = getConflictMessage(state.settings, state.selectedPlatform, definition.id);

      const item = document.createElement("div");
      item.className = "shortcut-item";
      item.classList.toggle("is-capturing", isCapturing);
      item.classList.toggle("is-conflict", Boolean((isCapturing && state.capture?.error) || conflictMessage));

      const copy = document.createElement("div");
      copy.className = "shortcut-copy";
      copy.innerHTML = `
        <h3 class="shortcut-title">${escapeHtml(definition.title)}</h3>
        <p class="shortcut-description">${escapeHtml(definition.description)}</p>
      `;

      const controls = document.createElement("div");
      controls.className = "shortcut-controls";

      const inputRow = document.createElement("div");
      inputRow.className = "shortcut-input-row";

      const input = document.createElement("input");
      input.type = "text";
      input.readOnly = true;
      input.className = "shortcut-input";
      input.dataset.actionId = definition.id;
      input.value = getShortcutLabel(definition.id, draftShortcut);
      input.setAttribute("aria-label", `${definition.title} shortcut`);
      input.addEventListener("focus", () => {
        if (state.capture?.actionId === definition.id) {
          return;
        }

        state.capture = {
          actionId: definition.id,
          pendingShortcut: null,
          error: null,
        };
        renderShortcutGroups(definition.id);
      });
      input.addEventListener("click", () => {
        input.focus();
      });
      input.addEventListener("blur", () => {
        window.setTimeout(() => {
          const activeActionId =
            document.activeElement instanceof HTMLInputElement
              ? document.activeElement.dataset.actionId
              : null;
          if (state.capture?.actionId === definition.id && activeActionId !== definition.id) {
            state.capture = null;
            renderShortcutGroups();
          }
        }, 0);
      });
      input.addEventListener("keydown", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!state.capture || state.capture.actionId !== definition.id) {
          state.capture = {
            actionId: definition.id,
            pendingShortcut: null,
            error: null,
          };
        }

        if (isShortcutResetKey(event)) {
          void resetShortcutToDefault(definition.id).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            setConfigStatus(message, "error");
          });
          return;
        }

        if (isShortcutConfirmKey(event)) {
          if (!state.capture?.pendingShortcut) {
            state.capture = null;
            renderShortcutGroups();
            return;
          }

          void commitCapturedShortcut(definition.id, state.capture.pendingShortcut).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            setConfigStatus(message, "error");
          });
          return;
        }

        const captureResult = shortcutFromKeyboardEvent(event, {
          definition,
          platform: state.selectedPlatform,
        });
        if (!captureResult) {
          return;
        }

        if (!captureResult.ok) {
          state.capture = {
            actionId: definition.id,
            pendingShortcut: null,
            error: captureResult.reason,
          };
          renderShortcutGroups(definition.id);
          return;
        }

        const draftSettings = cloneSettings();
        draftSettings.shortcuts[definition.id][state.selectedPlatform] = captureResult.shortcut;
        const draftConflict = getConflictMessage(draftSettings, state.selectedPlatform, definition.id);

        state.capture = {
          actionId: definition.id,
          pendingShortcut: captureResult.shortcut,
          error: draftConflict,
        };
        renderShortcutGroups(definition.id);
      });

      const resetButton = document.createElement("button");
      resetButton.type = "button";
      resetButton.className = "shortcut-reset";
      resetButton.textContent = "Reset";
      resetButton.addEventListener("click", () => {
        void resetShortcutToDefault(definition.id).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setConfigStatus(message, "error");
        });
      });

      const status = document.createElement("div");
      status.className = "shortcut-status";
      if (isCapturing) {
        status.textContent =
          state.capture?.error ??
          (state.capture?.pendingShortcut
            ? "Press Esc to save this shortcut."
            : "Press the new shortcut now.");
        status.classList.toggle("is-error", Boolean(state.capture?.error));
      } else if (conflictMessage) {
        status.textContent = conflictMessage;
        status.classList.add("is-error");
      } else {
        status.textContent = "No conflicts on this platform.";
        status.classList.add("is-success");
      }

      inputRow.append(input, resetButton);
      controls.append(inputRow, status);
      item.append(copy, controls);
      list.appendChild(item);
    }

    group.append(header, list);
    shortcutGroupsEl.appendChild(group);
  }

  if (focusActionId) {
    window.requestAnimationFrame(() => {
      const input = shortcutGroupsEl.querySelector<HTMLInputElement>(
        `[data-action-id="${focusActionId}"]`,
      );
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }
};

const renderDocs = (): void => {
  docsTocEl.replaceChildren();
  docsContentEl.replaceChildren();

  for (const section of state.docsSections) {
    const tocButton = document.createElement("button");
    tocButton.type = "button";
    tocButton.className = "docs-nav-link";
    tocButton.textContent = section.title;
    tocButton.addEventListener("click", () => {
      document.getElementById(section.id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      docsTocEl.querySelectorAll(".docs-nav-link").forEach((link) => {
        link.classList.remove("is-active");
      });
      tocButton.classList.add("is-active");
    });
    docsTocEl.appendChild(tocButton);

    const block = document.createElement("section");
    block.className = "docs-block";
    block.id = section.id;

    const heading = document.createElement("h2");
    heading.textContent = section.title;
    block.appendChild(heading);

    for (const entry of section.blocks) {
      if (entry.type === "paragraph") {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = renderInlineText(entry.text);
        block.appendChild(paragraph);
        continue;
      }

      if (entry.type === "heading") {
        const subheading = document.createElement("h3");
        subheading.textContent = entry.text;
        block.appendChild(subheading);
        continue;
      }

      if (entry.type === "list") {
        const list = document.createElement("ul");
        for (const itemText of entry.items) {
          const item = document.createElement("li");
          item.innerHTML = renderInlineText(itemText);
          list.appendChild(item);
        }
        block.appendChild(list);
        continue;
      }

      const pre = document.createElement("pre");
      const code = document.createElement("code");
      if (entry.language) {
        code.className = `language-${entry.language}`;
      }
      code.textContent = entry.code;
      pre.appendChild(code);
      block.appendChild(pre);
    }

    docsContentEl.appendChild(block);
  }

  const firstLink = docsTocEl.querySelector<HTMLElement>(".docs-nav-link");
  firstLink?.classList.add("is-active");
};

const render = (): void => {
  setActiveView(state.activeView, { updateHash: false });
  renderGeneral();
  renderPlatformTabs();
  renderQuickMenuModifier();
  renderShortcutGroups();
  renderDocs();
};

const exportConfigToFile = async (): Promise<void> => {
  const payload = await buildConfigExport();
  const fileName = `sigtastic-config-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setConfigStatus(`Exported ${payload.favorites.length} favorites and current settings.`, "success");
};

const importConfigFromFile = async (file: File): Promise<void> => {
  const rawText = await file.text();
  const parsedJson = JSON.parse(rawText) as unknown;
  const preview = parseConfigImport(parsedJson);
  const conflictMessage = getImportConflictMessage(preview.settings);
  if (conflictMessage) {
    throw new Error(`Imported config has shortcut conflicts. ${conflictMessage}`);
  }

  const imported = await importConfig(parsedJson);
  state.settings = imported.settings;
  state.favoritesCount = imported.favorites.length;
  state.capture = null;
  render();
  setConfigStatus(`Imported ${imported.favorites.length} favorites and all saved settings.`, "success");
};

const loadDocs = async (): Promise<void> => {
  const response = await fetch(browser.runtime.getURL("/settings-docs.md"));
  const markdown = await response.text();
  state.docsSections = parseDocsMarkdown(markdown);
};

const init = async (): Promise<void> => {
  const platformInfo = await browser.runtime.getPlatformInfo().catch(() => null);
  state.selectedPlatform = getPlatformFromBrowserOs(platformInfo?.os);
  state.settings = await getSettings();
  state.favoritesCount = (await getFavorites()).length;
  state.activeView = getViewFromHash();
  await loadDocs();
  render();
};

navLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.viewTarget as SettingsViewId | undefined;
    if (!target || !VIEW_IDS.includes(target)) {
      return;
    }

    setActiveView(target);
  });
});

window.addEventListener("hashchange", () => {
  setActiveView(getViewFromHash(), { updateHash: false });
});

blurToggle.addEventListener("change", () => {
  const nextSettings = cloneSettings();
  nextSettings.appearance.overlayBackdropBlur = blurToggle.checked;
  void saveSettings(nextSettings)
    .then(() => {
      setConfigStatus(
        blurToggle.checked ? "Blur around the panel enabled." : "Blur around the panel disabled.",
        "success",
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      blurToggle.checked = state.settings.appearance.overlayBackdropBlur;
      setConfigStatus(message, "error");
    });
});

exportButton.addEventListener("click", () => {
  void exportConfigToFile().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setConfigStatus(message, "error");
  });
});

importButton.addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", () => {
  const file = importInput.files?.[0];
  importInput.value = "";
  if (!file) {
    return;
  }

  void importConfigFromFile(file).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setConfigStatus(message, "error");
  });
});

quickMenuNumberModifierSelect.addEventListener("change", () => {
  const value = quickMenuNumberModifierSelect.value as QuickMenuNumberModifier;
  const nextSettings = cloneSettings();
  nextSettings.quickMenu.numberShortcutModifier = value;
  void saveSettings(nextSettings)
    .then(() => {
      setConfigStatus("Updated quick menu number modifier.", "success");
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      quickMenuNumberModifierSelect.value = state.settings.quickMenu.numberShortcutModifier;
      setConfigStatus(message, "error");
    });
});

void init().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  setConfigStatus(message, "error");
});
