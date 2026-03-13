import {
  getQuickMenuModifierLabel,
  matchesQuickMenuNumberShortcut,
  type ShortcutPlatform,
  type ResolvedQuickMenuNumberModifier,
} from "../shared/shortcuts";
import type { EditorSelectionInfo, TaskTypeOption } from "../shared/types";

type QuickTypeMenuActions = {
  onApply: (taskType: TaskTypeOption) => Promise<boolean>;
  onClose: () => void;
};

type QuickMenuPreferences = {
  shortcutPlatform: ShortcutPlatform;
  resolvedNumberShortcutModifier: ResolvedQuickMenuNumberModifier;
};

type TaskTypeOptionConfig = {
  id: TaskTypeOption;
  label: string;
};

const TASK_TYPE_OPTIONS: TaskTypeOptionConfig[] = [
  { id: "none", label: "None" },
  { id: "send", label: "Send" },
  { id: "receive", label: "Receive" },
  { id: "script", label: "Script" },
  { id: "service", label: "Service" },
  { id: "user", label: "User" },
  { id: "manual", label: "Manual" },
  { id: "business-rule", label: "Business Rule" },
];
const MENU_GUTTER = 6;
const VIEWPORT_PADDING = 10;
const TYPEAHEAD_RESET_MS = 850;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const normalizeSearchText = (value: string): string => {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const getOptionHintNumber = (index: number): string => {
  return String(index + 1);
};

export class QuickTypeMenu {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private readonly wrapper: HTMLDivElement;
  private readonly anchor: HTMLDivElement;
  private readonly panel: HTMLElement;
  private readonly subtitle: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly actions: QuickTypeMenuActions;
  private readonly supportsCssAnchors: boolean;
  private preferences: QuickMenuPreferences;

  private optionButtons = new Map<TaskTypeOption, HTMLButtonElement>();
  private opened = false;
  private applying = false;
  private modifierKeyPressed = false;
  private optionHintsVisible = false;
  private selectedIndex = 0;
  private currentTaskType: TaskTypeOption | null = null;
  private shapeId: string | null = null;
  private anchorRect: EditorSelectionInfo["anchorRect"] = null;
  private typedQuery = "";
  private typedQueryTimer: number | null = null;

  constructor(actions: QuickTypeMenuActions, preferences: QuickMenuPreferences) {
    this.actions = actions;
    this.preferences = preferences;
    // CSS anchor positioning proved visually unstable on this tenant/browser combo,
    // so we keep the anchored geometry model but use the JS-clamped placement path.
    this.supportsCssAnchors = false;

    this.host = document.createElement("div");
    this.host.id = "sigtastic-quick-menu-host";
    this.root = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = this.getStyles();

    this.wrapper = document.createElement("div");
    this.wrapper.className = "sigtastic-quick-wrapper";

    const scrim = document.createElement("div");
    scrim.className = "sigtastic-quick-scrim";
    scrim.addEventListener("pointerdown", () => this.close());

    this.anchor = document.createElement("div");
    this.anchor.className = "sigtastic-quick-anchor";

    this.panel = document.createElement("section");
    this.panel.className = "sigtastic-quick-panel";
    this.panel.addEventListener("pointerdown", (event) => event.stopPropagation());
    this.panel.addEventListener("click", (event) => event.stopPropagation());

    const header = document.createElement("div");
    header.className = "sigtastic-quick-header";

    const title = document.createElement("h2");
    title.className = "sigtastic-quick-title";
    title.textContent = "Change Type";

    this.subtitle = document.createElement("div");
    this.subtitle.className = "sigtastic-quick-subtitle";

    const divider = document.createElement("div");
    divider.className = "sigtastic-quick-divider";

    this.list = document.createElement("div");
    this.list.className = "sigtastic-quick-list";
    this.list.setAttribute("role", "listbox");
    this.list.setAttribute("aria-label", "Task type options");

    header.append(title, this.subtitle);
    this.panel.append(header, divider, this.list);
    this.wrapper.append(scrim, this.anchor, this.panel);
    this.root.append(style, this.wrapper);

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("resize", this.onResize, { passive: true });
    document.documentElement.appendChild(this.host);
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public getShapeId(): string | null {
    return this.shapeId;
  }

  public open(selection: EditorSelectionInfo): void {
    this.opened = true;
    this.optionHintsVisible = this.modifierKeyPressed;
    this.typedQuery = "";
    this.currentTaskType = selection.taskType;
    this.shapeId = selection.shapeId;
    this.anchorRect = selection.anchorRect;
    this.selectedIndex = Math.max(
      0,
      TASK_TYPE_OPTIONS.findIndex((option) => option.id === selection.taskType),
    );
    this.wrapper.classList.add("open");
    this.render();
    this.syncAnchor();
    window.requestAnimationFrame(() => {
      this.syncPosition();
      this.focusSelectedButton();
    });
  }

  public close(): void {
    if (!this.opened) {
      return;
    }

    this.opened = false;
    this.applying = false;
    this.optionHintsVisible = false;
    this.resetTypedQuery();
    this.shapeId = null;
    this.wrapper.classList.remove("open");
    this.panel.style.left = "";
    this.panel.style.top = "";
    delete this.panel.dataset.optionHints;
    this.actions.onClose();
  }

  public setPreferences(preferences: QuickMenuPreferences): void {
    this.preferences = preferences;
    if (this.opened) {
      this.render();
      this.focusSelectedButton();
    }
  }

  private render(): void {
    this.optionButtons.clear();
    this.list.replaceChildren();

    const currentLabel =
      TASK_TYPE_OPTIONS.find((option) => option.id === this.currentTaskType)?.label ?? "Unknown";
    this.subtitle.textContent =
      this.currentTaskType !== null ? `Current: ${currentLabel}` : "Choose a type";

    for (const [index, option] of TASK_TYPE_OPTIONS.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sigtastic-quick-option";
      button.dataset.selected = String(index === this.selectedIndex);
      button.dataset.current = String(option.id === this.currentTaskType);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === this.selectedIndex));
      button.disabled = this.applying;

      button.addEventListener("mouseenter", () => {
        this.selectedIndex = index;
        this.updateSelectedOption();
      });
      button.addEventListener("focus", () => {
        this.selectedIndex = index;
        this.updateSelectedOption();
      });
      button.addEventListener("click", () => {
        void this.applyOption(option.id);
      });

      const icon = document.createElement("span");
      icon.className = "sigtastic-quick-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = this.getTaskTypeIconSvg(option.id);

      const label = document.createElement("span");
      label.className = "sigtastic-quick-label";
      label.textContent = option.label;

      const shortcut = document.createElement("span");
      shortcut.className = "sigtastic-quick-shortcut";
      shortcut.textContent = getOptionHintNumber(index);
      shortcut.setAttribute(
        "title",
        `${getQuickMenuModifierLabel(this.preferences.resolvedNumberShortcutModifier, this.preferences.shortcutPlatform)} + ${getOptionHintNumber(index)}`,
      );
      shortcut.setAttribute("aria-hidden", "true");

      button.append(icon, label);

      if (option.id === this.currentTaskType) {
        const currentBadge = document.createElement("span");
        currentBadge.className = "sigtastic-quick-current";
        currentBadge.textContent = "Current";
        button.append(currentBadge);
      }

      button.append(shortcut);

      this.list.appendChild(button);
      this.optionButtons.set(option.id, button);
    }

    this.updateSelectedOption();
    this.syncOptionHints();
  }

  private updateSelectedOption(): void {
    TASK_TYPE_OPTIONS.forEach((option, index) => {
      const button = this.optionButtons.get(option.id);
      if (!button) {
        return;
      }

      const selected = index === this.selectedIndex;
      button.dataset.selected = String(selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  private syncOptionHints(): void {
    this.panel.dataset.optionHints = String(this.optionHintsVisible);
  }

  private focusSelectedButton(): void {
    const option = TASK_TYPE_OPTIONS[this.selectedIndex];
    const button = option ? this.optionButtons.get(option.id) : null;
    if (!button) {
      return;
    }

    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: "nearest" });
  }

  private async applyOption(taskType: TaskTypeOption): Promise<void> {
    if (this.applying) {
      return;
    }

    this.applying = true;
    this.panel.dataset.applying = "true";
    for (const button of this.optionButtons.values()) {
      button.disabled = true;
    }

    const shouldClose = await this.actions.onApply(taskType).catch(() => false);
    this.applying = false;
    delete this.panel.dataset.applying;

    if (shouldClose) {
      this.close();
      return;
    }

    for (const button of this.optionButtons.values()) {
      button.disabled = false;
    }
    this.focusSelectedButton();
  }

  private moveSelection(delta: number): void {
    const total = TASK_TYPE_OPTIONS.length;
    this.selectedIndex = (this.selectedIndex + delta + total) % total;
    this.updateSelectedOption();
    this.focusSelectedButton();
  }

  private resetTypedQuery(): void {
    if (this.typedQueryTimer !== null) {
      window.clearTimeout(this.typedQueryTimer);
      this.typedQueryTimer = null;
    }
    this.typedQuery = "";
  }

  private scheduleTypedQueryReset(): void {
    if (this.typedQueryTimer !== null) {
      window.clearTimeout(this.typedQueryTimer);
    }

    this.typedQueryTimer = window.setTimeout(() => {
      this.typedQuery = "";
      this.typedQueryTimer = null;
    }, TYPEAHEAD_RESET_MS);
  }

  private getMatchingOptionIndex(query: string): number {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return -1;
    }

    const scored = TASK_TYPE_OPTIONS.map((option, index) => {
      const label = normalizeSearchText(option.label);
      const words = label.split(/\s+/).filter(Boolean);
      const initials = words.map((word) => word[0] || "").join("");
      let score = -1;

      if (label === normalizedQuery) {
        score = 1000;
      } else if (label.startsWith(normalizedQuery)) {
        score = 900 - label.length;
      } else if (words.some((word) => word.startsWith(normalizedQuery))) {
        score = 760 - label.length;
      } else if (initials.startsWith(normalizedQuery)) {
        score = 680 - initials.length;
      } else {
        const indexInLabel = label.indexOf(normalizedQuery);
        if (indexInLabel >= 0) {
          score = 520 - indexInLabel;
        }
      }

      return { index, score };
    })
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score || left.index - right.index);

    return scored[0]?.index ?? -1;
  }

  private handleTypeaheadInput(character: string): boolean {
    const normalizedCharacter = normalizeSearchText(character);
    if (!normalizedCharacter) {
      return false;
    }

    const nextQuery = `${this.typedQuery}${normalizedCharacter}`;
    let nextIndex = this.getMatchingOptionIndex(nextQuery);
    if (nextIndex >= 0) {
      this.typedQuery = nextQuery;
    } else {
      nextIndex = this.getMatchingOptionIndex(normalizedCharacter);
      if (nextIndex < 0) {
        return false;
      }
      this.typedQuery = normalizedCharacter;
    }

    this.scheduleTypedQueryReset();
    this.selectedIndex = nextIndex;
    this.updateSelectedOption();
    this.focusSelectedButton();
    return true;
  }

  private getShortcutOption(event: KeyboardEvent): TaskTypeOption | null {
    for (const [index, option] of TASK_TYPE_OPTIONS.entries()) {
      if (
        matchesQuickMenuNumberShortcut(
          event,
          this.preferences.resolvedNumberShortcutModifier,
          index + 1,
          this.preferences.shortcutPlatform,
        )
      ) {
        return option.id;
      }
    }
    return null;
  }

  private syncAnchor(): void {
    const rect = this.anchorRect;
    if (!rect) {
      this.anchor.style.left = `${window.innerWidth / 2}px`;
      this.anchor.style.top = `${window.innerHeight / 2}px`;
      this.anchor.style.width = "1px";
      this.anchor.style.height = "1px";
      return;
    }

    this.anchor.style.left = `${rect.left}px`;
    this.anchor.style.top = `${rect.top}px`;
    this.anchor.style.width = `${Math.max(1, rect.width)}px`;
    this.anchor.style.height = `${Math.max(1, rect.height)}px`;
  }

  private syncPosition(): void {
    if (!this.opened) {
      return;
    }

    this.syncAnchor();

    if (this.supportsCssAnchors) {
      this.panel.dataset.anchored = "true";
      this.panel.style.left = "";
      this.panel.style.top = "";

      window.requestAnimationFrame(() => {
        if (!this.opened) {
          return;
        }

        const rect = this.panel.getBoundingClientRect();
        const clipped =
          rect.left < VIEWPORT_PADDING ||
          rect.top < VIEWPORT_PADDING ||
          rect.right > window.innerWidth - VIEWPORT_PADDING ||
          rect.bottom > window.innerHeight - VIEWPORT_PADDING;

        if (clipped) {
          this.applyFallbackPosition();
        }
      });
      return;
    }

    this.applyFallbackPosition();
  }

  private applyFallbackPosition(): void {
    this.panel.dataset.anchored = "false";

    const width = this.panel.offsetWidth || 260;
    const height = this.panel.offsetHeight || 320;
    let left = (window.innerWidth - width) / 2;
    let top = (window.innerHeight - height) / 2;

    if (this.anchorRect) {
      const rect = this.anchorRect;
      const roomRight = window.innerWidth - rect.right - MENU_GUTTER;
      const roomLeft = rect.left - MENU_GUTTER;
      const roomBelow = window.innerHeight - rect.bottom - MENU_GUTTER;
      const roomAbove = rect.top - MENU_GUTTER;

      if (roomRight >= width) {
        left = rect.right + MENU_GUTTER;
      } else if (roomLeft >= width) {
        left = rect.left - width - MENU_GUTTER;
      } else {
        left = rect.left + rect.width / 2 - width / 2;
      }

      if (roomBelow >= height) {
        top = rect.top - 4;
      } else if (roomAbove >= height) {
        top = rect.bottom - height + 4;
      } else {
        top = rect.top + rect.height / 2 - height / 2;
      }
    }

    this.panel.style.left = `${clamp(left, VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)}px`;
    this.panel.style.top = `${clamp(top, VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING)}px`;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.isHintModifierKey(event.key)) {
      this.modifierKeyPressed = true;
      if (this.opened) {
        this.optionHintsVisible = true;
        this.syncOptionHints();
      }
    }

    if (!this.opened) {
      return;
    }

    event.stopPropagation();

    const shortcutOption = this.getShortcutOption(event);
    if (shortcutOption) {
      event.preventDefault();
      void this.applyOption(shortcutOption);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.moveSelection(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      this.selectedIndex = 0;
      this.updateSelectedOption();
      this.focusSelectedButton();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      this.selectedIndex = TASK_TYPE_OPTIONS.length - 1;
      this.updateSelectedOption();
      this.focusSelectedButton();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = TASK_TYPE_OPTIONS[this.selectedIndex];
      if (option) {
        void this.applyOption(option.id);
      }
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (this.typedQuery.length > 0) {
        this.typedQuery = this.typedQuery.slice(0, -1);
        this.scheduleTypedQueryReset();
      }
      return;
    }

    if (
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.key.length === 1 &&
      /\S/.test(event.key)
    ) {
      event.preventDefault();
      this.handleTypeaheadInput(event.key);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (this.isHintModifierKey(event.key)) {
      this.modifierKeyPressed = false;
    }

    if (!this.opened) {
      return;
    }

    if (!this.isHintModifierKey(event.key)) {
      return;
    }

    this.optionHintsVisible = false;
    this.syncOptionHints();
  };

  private onWindowBlur = (): void => {
    this.modifierKeyPressed = false;

    if (!this.opened) {
      return;
    }

    this.optionHintsVisible = false;
    this.syncOptionHints();
  };

  private isHintModifierKey(key: string): boolean {
    if (this.preferences.resolvedNumberShortcutModifier === "Alt") {
      return key === "Alt";
    }

    if (this.preferences.resolvedNumberShortcutModifier === "Ctrl") {
      return key === "Control";
    }

    return key === "Meta" || key === "Command";
  }

  private onResize = (): void => {
    if (!this.opened) {
      return;
    }

    this.syncPosition();
  };

  private getTaskTypeIconSvg(taskType: TaskTypeOption): string {
    const icons: Record<TaskTypeOption, string> = {
      none:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="3.2" stroke="currentColor" stroke-width="1.9"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
      send:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="3.8" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M3.8 7.8 L10.3 12.1 L16.8 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="16.8" y1="11.1" x2="21" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M21 11.1 L18.5 9.2 M21 11.1 L18.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
      receive:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="7.2" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M7.2 7.8 L13.7 12.1 L20.2 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="3" y1="11.1" x2="7.2" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M3 11.1 L5.5 9.2 M3 11.1 L5.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
      script:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4.6 H13.7 L18 8.9 V19.4 H6 Z" stroke="currentColor" stroke-width="1.9"/><line x1="8.4" y1="11.5" x2="15.8" y2="11.5" stroke="currentColor" stroke-width="1.7"/><line x1="8.4" y1="15.2" x2="14.3" y2="15.2" stroke="currentColor" stroke-width="1.7"/></svg>',
      service:
        '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6.6" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><line x1="12" y1="2.8" x2="12" y2="5.1" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="18.9" x2="12" y2="21.2" stroke="currentColor" stroke-width="1.8"/><line x1="2.8" y1="12" x2="5.1" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="18.9" y1="12" x2="21.2" y2="12" stroke="currentColor" stroke-width="1.8"/></svg>',
      user:
        '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.3" fill="currentColor"/><path d="M5.2 19.2 C5.2 15.2 8 13 12 13 C16 13 18.8 15.2 18.8 19.2" fill="currentColor"/></svg>',
      manual:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M6.5 19 V11.5 C6.5 10.2 7.4 9.4 8.4 9.4 C9.3 9.4 10.1 10.1 10.1 11.5 V14" stroke="currentColor" stroke-width="1.8"/><path d="M10.1 14 V8.4 C10.1 7.2 10.9 6.4 12 6.4 C13.1 6.4 13.9 7.2 13.9 8.4 V14.2" stroke="currentColor" stroke-width="1.8"/><path d="M13.9 12.4 C14.8 12 15.9 12.6 16.2 13.5 L17.6 18.2" stroke="currentColor" stroke-width="1.8"/></svg>',
      "business-rule":
        '<svg viewBox="0 0 24 24" fill="none"><rect x="4.6" y="5.3" width="14.8" height="13.4" stroke="currentColor" stroke-width="1.9"/><line x1="4.6" y1="10" x2="19.4" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="9.5" y1="5.3" x2="9.5" y2="18.7" stroke="currentColor" stroke-width="1.8"/></svg>',
    };

    return icons[taskType];
  }

  private getStyles(): string {
    return `
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .sigtastic-quick-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483601;
        display: none;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .sigtastic-quick-wrapper.open {
        display: block;
      }

      .sigtastic-quick-scrim {
        position: absolute;
        inset: 0;
        background: transparent;
      }

      .sigtastic-quick-anchor {
        position: fixed;
        visibility: hidden;
        pointer-events: none;
        anchor-name: --sigtastic-quick-anchor;
      }

      .sigtastic-quick-panel {
        position: fixed;
        width: min(280px, calc(100vw - 20px));
        min-height: 346px;
        max-height: min(430px, calc(100vh - 20px));
        padding: 10px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(34, 36, 41, 0.86);
        backdrop-filter: blur(8px) saturate(110%);
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34);
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        gap: 8px;
        color: #f3f3f3;
        overflow: hidden;
      }

      .sigtastic-quick-panel[data-anchored="true"] {
        position-anchor: --sigtastic-quick-anchor;
        top: anchor(top);
        left: anchor(right);
        margin-left: ${MENU_GUTTER}px;
        margin-top: -4px;
      }

      .sigtastic-quick-panel[data-applying="true"] {
        opacity: 0.92;
      }

      .sigtastic-quick-header {
        display: grid;
        gap: 2px;
        padding: 2px 2px 0;
      }

      .sigtastic-quick-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .sigtastic-quick-subtitle {
        font-size: 10px;
        color: rgba(243, 243, 243, 0.64);
      }

      .sigtastic-quick-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.16);
      }

      .sigtastic-quick-list {
        display: grid;
        align-content: start;
        gap: 4px;
        overflow: auto;
      }

      .sigtastic-quick-option {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto minmax(30px, auto);
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 36px;
        padding: 7px 10px;
        border-radius: 10px;
        border: 1px solid transparent;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
      }

      .sigtastic-quick-option:hover,
      .sigtastic-quick-option:focus-visible,
      .sigtastic-quick-option[data-selected="true"] {
        background: rgba(0, 0, 0, 0.18);
        border-color: rgba(255, 255, 255, 0.12);
        outline: none;
      }

      .sigtastic-quick-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.92);
      }

      .sigtastic-quick-icon svg {
        width: 16px;
        height: 16px;
      }

      .sigtastic-quick-label {
        font-size: 12px;
        line-height: 1.15;
        font-weight: 500;
        color: #f6f6f6;
      }

      .sigtastic-quick-current {
        grid-column: 3;
        justify-self: end;
        padding: 3px 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 9px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(243, 243, 243, 0.78);
      }

      .sigtastic-quick-shortcut {
        grid-column: 4;
        justify-self: end;
        min-width: 24px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(243, 243, 243, 0.62);
        opacity: 0;
        transform: translateX(-1px);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      .sigtastic-quick-panel[data-option-hints="true"] .sigtastic-quick-shortcut {
        opacity: 1;
        transform: translateX(0);
      }

      @media (max-width: 720px) {
        .sigtastic-quick-panel {
          width: min(250px, calc(100vw - 12px));
          min-height: 332px;
          max-height: min(390px, calc(100vh - 12px));
          padding: 8px;
          border-radius: 14px;
        }

        .sigtastic-quick-option {
          padding: 6px 8px;
        }
      }
    `;
  }
}
