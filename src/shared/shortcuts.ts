export type ShortcutContext = "global" | "overlay" | "quick-menu";
export type ShortcutPlatform = "default" | "mac" | "windows" | "linux" | "cros";
export type QuickMenuNumberModifier = "auto" | "alt" | "ctrl" | "command";
export type ResolvedQuickMenuNumberModifier = "Alt" | "Ctrl" | "Command";
export type ShortcutActionId =
  | "toggle-overlay"
  | "save-favorite"
  | "toggle-quick-menu"
  | "overlay-navigate-left"
  | "overlay-navigate-right"
  | "overlay-navigate-up"
  | "overlay-navigate-down"
  | "overlay-insert-selected"
  | "overlay-delete-selected"
  | "overlay-move-up"
  | "overlay-move-down";

export type ShortcutBinding = Record<ShortcutPlatform, string>;

export type ShortcutDefinition = {
  id: ShortcutActionId;
  title: string;
  description: string;
  context: ShortcutContext;
  defaultBinding: ShortcutBinding;
  allowBareKey: boolean;
  bareKeyWhitelist?: string[];
};

type ShortcutDescriptor = {
  alt: boolean;
  ctrl: boolean;
  command: boolean;
  shift: boolean;
  key: string;
};

type ShortcutParseSuccess = {
  ok: true;
  shortcut: string;
  descriptor: ShortcutDescriptor;
};

type ShortcutParseFailure = {
  ok: false;
  reason: string;
};

export type ShortcutParseResult = ShortcutParseSuccess | ShortcutParseFailure;

const PLATFORM_ORDER: ShortcutPlatform[] = ["default", "mac", "windows", "linux", "cros"];
const MODIFIER_ORDER = ["Command", "Ctrl", "Alt", "Shift"] as const;

const makePlatformBinding = (shortcut: string): ShortcutBinding => ({
  default: shortcut,
  mac: shortcut,
  windows: shortcut,
  linux: shortcut,
  cros: shortcut,
});

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: "toggle-overlay",
    title: "Open Component Panel",
    description: "Show or hide the saved component overlay in Signavio.",
    context: "global",
    defaultBinding: makePlatformBinding("Alt+Shift+D"),
    allowBareKey: false,
  },
  {
    id: "save-favorite",
    title: "Save Latest Copy",
    description: "Save the latest copied Signavio snippet as a favorite.",
    context: "global",
    defaultBinding: makePlatformBinding("Alt+Shift+S"),
    allowBareKey: false,
  },
  {
    id: "toggle-quick-menu",
    title: "Open Quick Type Menu",
    description: "Open the task type quick menu for the current Signavio selection.",
    context: "global",
    defaultBinding: makePlatformBinding("Alt+Shift+E"),
    allowBareKey: false,
  },
  {
    id: "overlay-navigate-left",
    title: "Move Selection Left",
    description: "Move the selection left in the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("ArrowLeft"),
    allowBareKey: true,
    bareKeyWhitelist: ["ArrowLeft"],
  },
  {
    id: "overlay-navigate-right",
    title: "Move Selection Right",
    description: "Move the selection right in the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("ArrowRight"),
    allowBareKey: true,
    bareKeyWhitelist: ["ArrowRight"],
  },
  {
    id: "overlay-navigate-up",
    title: "Move Selection Up",
    description: "Move the selection up in the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("ArrowUp"),
    allowBareKey: true,
    bareKeyWhitelist: ["ArrowUp"],
  },
  {
    id: "overlay-navigate-down",
    title: "Move Selection Down",
    description: "Move the selection down in the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("ArrowDown"),
    allowBareKey: true,
    bareKeyWhitelist: ["ArrowDown"],
  },
  {
    id: "overlay-insert-selected",
    title: "Insert Selected Favorite",
    description: "Insert the highlighted favorite from the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("Enter"),
    allowBareKey: true,
    bareKeyWhitelist: ["Enter"],
  },
  {
    id: "overlay-delete-selected",
    title: "Delete Selected Favorite",
    description: "Delete the highlighted favorite from the component overlay.",
    context: "overlay",
    defaultBinding: makePlatformBinding("Alt+Delete"),
    allowBareKey: false,
  },
  {
    id: "overlay-move-up",
    title: "Move Favorite Up",
    description: "Move the highlighted favorite earlier in the overlay list.",
    context: "overlay",
    defaultBinding: makePlatformBinding("Alt+ArrowUp"),
    allowBareKey: false,
  },
  {
    id: "overlay-move-down",
    title: "Move Favorite Down",
    description: "Move the highlighted favorite later in the overlay list.",
    context: "overlay",
    defaultBinding: makePlatformBinding("Alt+ArrowDown"),
    allowBareKey: false,
  },
];

export const SHORTCUT_DEFINITION_BY_ID = new Map(
  SHORTCUT_DEFINITIONS.map((definition) => [definition.id, definition]),
);

const MODIFIER_LABELS: Record<typeof MODIFIER_ORDER[number], Record<ShortcutPlatform, string>> = {
  Command: {
    default: "Command",
    mac: "Command",
    windows: "Command",
    linux: "Command",
    cros: "Command",
  },
  Ctrl: {
    default: "Ctrl",
    mac: "Control",
    windows: "Ctrl",
    linux: "Ctrl",
    cros: "Ctrl",
  },
  Alt: {
    default: "Alt",
    mac: "Option",
    windows: "Alt",
    linux: "Alt",
    cros: "Alt",
  },
  Shift: {
    default: "Shift",
    mac: "Shift",
    windows: "Shift",
    linux: "Shift",
    cros: "Shift",
  },
};

const MODIFIER_ALIASES: Record<string, keyof typeof MODIFIER_LABELS> = {
  alt: "Alt",
  option: "Alt",
  opt: "Alt",
  ctrl: "Ctrl",
  control: "Ctrl",
  ctl: "Ctrl",
  command: "Command",
  cmd: "Command",
  meta: "Command",
  super: "Command",
  macctrl: "Ctrl",
  shift: "Shift",
};

const KEY_ALIASES: Record<string, string> = {
  arrowup: "ArrowUp",
  up: "ArrowUp",
  arrowdown: "ArrowDown",
  down: "ArrowDown",
  arrowleft: "ArrowLeft",
  left: "ArrowLeft",
  arrowright: "ArrowRight",
  right: "ArrowRight",
  enter: "Enter",
  return: "Enter",
  space: "Space",
  spacebar: "Space",
  tab: "Tab",
  delete: "Delete",
  del: "Delete",
  backspace: "Delete",
  esc: "Escape",
  escape: "Escape",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
  insert: "Insert",
  ins: "Insert",
  comma: "Comma",
  ",": "Comma",
  period: "Period",
  ".": "Period",
  slash: "Slash",
  "/": "Slash",
  semicolon: "Semicolon",
  ";": "Semicolon",
  quote: "Quote",
  "'": "Quote",
  backquote: "Backquote",
  "`": "Backquote",
  minus: "Minus",
  "-": "Minus",
  equal: "Equal",
  "=": "Equal",
  bracketleft: "BracketLeft",
  "[": "BracketLeft",
  bracketright: "BracketRight",
  "]": "BracketRight",
  backslash: "Backslash",
  "\\": "Backslash",
};

const DISPLAY_KEY_LABELS: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  PageUp: "Page Up",
  PageDown: "Page Down",
  Delete: "Delete",
  Space: "Space",
  Quote: "'",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Semicolon: ";",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
};

const MODIFIER_KEYS = new Set([
  "Alt",
  "AltGraph",
  "Control",
  "Meta",
  "Shift",
]);

const ESCAPE_KEY = "Escape";
const PLATFORM_LABELS: Record<ShortcutPlatform, string> = {
  default: "Fallback",
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
  cros: "ChromeOS",
};

export function getPlatformLabel(platform: ShortcutPlatform): string {
  return PLATFORM_LABELS[platform];
}

export function getQuickMenuModifierLabel(
  modifier: ResolvedQuickMenuNumberModifier,
  platform: ShortcutPlatform,
): string {
  if (modifier === "Alt") {
    return MODIFIER_LABELS.Alt[platform];
  }
  if (modifier === "Ctrl") {
    return MODIFIER_LABELS.Ctrl[platform];
  }
  return MODIFIER_LABELS.Command[platform];
}

export function getShortcutDefinition(id: ShortcutActionId): ShortcutDefinition {
  const definition = SHORTCUT_DEFINITION_BY_ID.get(id);
  if (!definition) {
    throw new Error(`Unknown shortcut definition: ${id}`);
  }

  return definition;
}

export function getDefaultShortcutBindings(): Record<ShortcutActionId, ShortcutBinding> {
  return SHORTCUT_DEFINITIONS.reduce(
    (accumulator, definition) => {
      accumulator[definition.id] = { ...definition.defaultBinding };
      return accumulator;
    },
    {} as Record<ShortcutActionId, ShortcutBinding>,
  );
}

export function getShortcutPlatforms(): ShortcutPlatform[] {
  return [...PLATFORM_ORDER];
}

function canonicalizeKeyToken(rawToken: string): string | null {
  const token = rawToken.trim();
  if (!token) {
    return null;
  }

  if (/^[A-Za-z]$/.test(token)) {
    return token.toUpperCase();
  }

  if (/^[0-9]$/.test(token)) {
    return token;
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/i.test(token)) {
    return token.toUpperCase();
  }

  const normalized = token.replace(/\s+/g, "").toLowerCase();
  return KEY_ALIASES[normalized] ?? null;
}

function descriptorToShortcut(descriptor: ShortcutDescriptor): string {
  const parts: string[] = [];

  if (descriptor.command) {
    parts.push("Command");
  }
  if (descriptor.ctrl) {
    parts.push("Ctrl");
  }
  if (descriptor.alt) {
    parts.push("Alt");
  }
  if (descriptor.shift) {
    parts.push("Shift");
  }

  parts.push(descriptor.key);
  return parts.join("+");
}

type ParseOptions = {
  definition: ShortcutDefinition;
  platform: ShortcutPlatform;
};

export function parseShortcut(rawValue: string, options: ParseOptions): ShortcutParseResult {
  const value = rawValue.trim();
  if (!value) {
    return {
      ok: false,
      reason: "Enter a shortcut first.",
    };
  }

  const parts = value
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      ok: false,
      reason: "Enter a shortcut first.",
    };
  }

  const descriptor: ShortcutDescriptor = {
    alt: false,
    ctrl: false,
    command: false,
    shift: false,
    key: "",
  };

  for (const rawPart of parts) {
    const normalizedPart = rawPart.replace(/\s+/g, "").toLowerCase();
    const modifier = MODIFIER_ALIASES[normalizedPart];
    if (modifier) {
      if (modifier === "Alt") descriptor.alt = true;
      if (modifier === "Ctrl") descriptor.ctrl = true;
      if (modifier === "Command") descriptor.command = true;
      if (modifier === "Shift") descriptor.shift = true;
      continue;
    }

    const key = canonicalizeKeyToken(rawPart);
    if (!key) {
      return {
        ok: false,
        reason: `"${rawPart}" is not a supported shortcut key.`,
      };
    }

    if (descriptor.key) {
      return {
        ok: false,
        reason: "Use only one non-modifier key per shortcut.",
      };
    }

    descriptor.key = key;
  }

  if (!descriptor.key) {
    return {
      ok: false,
      reason: "Add a non-modifier key to finish the shortcut.",
    };
  }

  const hasPrimaryModifier = descriptor.alt || descriptor.ctrl || descriptor.command;
  if (!options.definition.allowBareKey && !hasPrimaryModifier) {
    return {
      ok: false,
      reason: "Add Alt/Option, Ctrl, or Command so the shortcut does not trigger accidentally.",
    };
  }

  if (
    options.definition.allowBareKey &&
    !hasPrimaryModifier &&
    options.definition.bareKeyWhitelist &&
    !options.definition.bareKeyWhitelist.includes(descriptor.key)
  ) {
    return {
      ok: false,
      reason: `Only ${options.definition.bareKeyWhitelist.join(" or ")} can be used without modifiers here.`,
    };
  }

  if (descriptor.key === ESCAPE_KEY) {
    return {
      ok: false,
      reason: "Escape is reserved for closing and confirming shortcut capture.",
    };
  }

  if (
    options.platform !== "mac" &&
    descriptor.command
  ) {
    return {
      ok: false,
      reason: "Command shortcuts only work on macOS.",
    };
  }

  if (options.platform !== "mac" && descriptor.alt && descriptor.ctrl) {
    return {
      ok: false,
      reason: "Alt+Ctrl is blocked because many Windows and Linux keyboards use it for AltGr.",
    };
  }

  return {
    ok: true,
    shortcut: descriptorToShortcut(descriptor),
    descriptor,
  };
}

export function resolveQuickMenuNumberModifier(
  shortcut: string,
  platform: ShortcutPlatform,
  override: QuickMenuNumberModifier,
): ResolvedQuickMenuNumberModifier {
  if (override === "alt") {
    return "Alt";
  }
  if (override === "ctrl") {
    return "Ctrl";
  }
  if (override === "command") {
    return platform === "mac" ? "Command" : "Ctrl";
  }

  const parsed = parseShortcut(shortcut, {
    definition: {
      id: "toggle-quick-menu",
      title: "",
      description: "",
      context: "global",
      defaultBinding: makePlatformBinding("Alt+Shift+E"),
      allowBareKey: true,
    },
    platform,
  });

  if (parsed.ok) {
    if (parsed.descriptor.alt) {
      return "Alt";
    }
    if (parsed.descriptor.ctrl) {
      return "Ctrl";
    }
    if (parsed.descriptor.command) {
      return "Command";
    }
  }

  return platform === "mac" ? "Command" : "Ctrl";
}

export function matchesQuickMenuNumberShortcut(
  event: KeyboardEvent,
  modifier: ResolvedQuickMenuNumberModifier,
  digit: number,
  platform: ShortcutPlatform,
): boolean {
  const keyMatches =
    event.key === String(digit) ||
    event.code === `Digit${digit}` ||
    event.code === `Numpad${digit}`;
  if (!keyMatches) {
    return false;
  }

  const commandActive = platform === "mac" ? event.metaKey : false;
  const ctrlActive = event.ctrlKey;
  const altActive = event.altKey;

  if (modifier === "Alt") {
    return altActive && !ctrlActive && !commandActive;
  }
  if (modifier === "Ctrl") {
    return ctrlActive && !altActive && !commandActive;
  }
  return commandActive && !altActive && !ctrlActive;
}

function normalizeKeyboardEventKey(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) {
    return null;
  }

  if (event.key === " ") {
    return "Space";
  }

  if (event.key.length === 1 && /^[A-Za-z]$/.test(event.key)) {
    return event.key.toUpperCase();
  }

  if (event.key.length === 1 && /^[0-9]$/.test(event.key)) {
    return event.key;
  }

  const fromKey = canonicalizeKeyToken(event.key);
  if (fromKey) {
    return fromKey;
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3);
  }

  if (/^Digit[0-9]$/.test(event.code)) {
    return event.code.slice(5);
  }

  const codeAlias = canonicalizeKeyToken(event.code);
  return codeAlias ?? null;
}

type EventNormalizeOptions = {
  definition: ShortcutDefinition;
  platform: ShortcutPlatform;
};

export function shortcutFromKeyboardEvent(
  event: KeyboardEvent,
  options: EventNormalizeOptions,
): ShortcutParseResult | null {
  if (event.repeat) {
    return null;
  }

  const key = normalizeKeyboardEventKey(event);
  if (!key) {
    return null;
  }

  const descriptor: ShortcutDescriptor = {
    alt: event.altKey,
    ctrl: event.ctrlKey,
    command: options.platform === "mac" ? event.metaKey : false,
    shift: event.shiftKey,
    key,
  };

  return parseShortcut(descriptorToShortcut(descriptor), options);
}

export function formatShortcutForDisplay(shortcut: string, platform: ShortcutPlatform): string {
  const parsed = parseShortcut(shortcut, {
    definition: {
      id: "toggle-overlay",
      title: "",
      description: "",
      context: "global",
      defaultBinding: makePlatformBinding("Alt+Shift+D"),
      allowBareKey: true,
    },
    platform,
  });

  if (!parsed.ok) {
    return shortcut;
  }

  const labels: string[] = [];
  const descriptor = parsed.descriptor;

  if (descriptor.command) {
    labels.push(MODIFIER_LABELS.Command[platform]);
  }
  if (descriptor.ctrl) {
    labels.push(MODIFIER_LABELS.Ctrl[platform]);
  }
  if (descriptor.alt) {
    labels.push(MODIFIER_LABELS.Alt[platform]);
  }
  if (descriptor.shift) {
    labels.push(MODIFIER_LABELS.Shift[platform]);
  }

  labels.push(DISPLAY_KEY_LABELS[descriptor.key] ?? descriptor.key);
  return labels.join(" + ");
}

export function getShortcutBindingForPlatform(
  binding: ShortcutBinding,
  platform: ShortcutPlatform,
): string {
  return binding[platform] || binding.default;
}

export function normalizeShortcutBinding(
  definition: ShortcutDefinition,
  rawValue: Partial<Record<ShortcutPlatform, unknown>> | null | undefined,
): ShortcutBinding {
  const defaults = definition.defaultBinding;
  const normalized = {} as ShortcutBinding;

  for (const platform of PLATFORM_ORDER) {
    const fallback =
      platform === "default"
        ? defaults.default
        : typeof rawValue?.[platform] === "string" && rawValue?.[platform]?.trim()
          ? String(rawValue?.[platform]).trim()
          : normalized.default ?? defaults[platform] ?? defaults.default;
    const parsed = parseShortcut(fallback, { definition, platform });
    normalized[platform] = parsed.ok ? parsed.shortcut : defaults[platform];
  }

  return normalized;
}

export function normalizeShortcutBindings(
  rawValue: Partial<Record<ShortcutActionId, Partial<Record<ShortcutPlatform, unknown>>>> | null | undefined,
): Record<ShortcutActionId, ShortcutBinding> {
  const defaults = getDefaultShortcutBindings();
  const normalized = { ...defaults };

  for (const definition of SHORTCUT_DEFINITIONS) {
    normalized[definition.id] = normalizeShortcutBinding(definition, rawValue?.[definition.id]);
  }

  return normalized;
}

export function getShortcutConflictMap(
  bindings: Record<ShortcutActionId, ShortcutBinding>,
  platform: ShortcutPlatform,
  context?: ShortcutContext,
): Map<string, ShortcutActionId[]> {
  const conflicts = new Map<string, ShortcutActionId[]>();

  for (const definition of SHORTCUT_DEFINITIONS) {
    if (context && definition.context !== context) {
      continue;
    }

    const shortcut = getShortcutBindingForPlatform(bindings[definition.id], platform);
    const existing = conflicts.get(shortcut) ?? [];
    existing.push(definition.id);
    conflicts.set(shortcut, existing);
  }

  return conflicts;
}

export function getShortcutConflictIds(
  bindings: Record<ShortcutActionId, ShortcutBinding>,
  platform: ShortcutPlatform,
  actionId: ShortcutActionId,
): ShortcutActionId[] {
  const definition = getShortcutDefinition(actionId);
  const shortcut = getShortcutBindingForPlatform(bindings[actionId], platform);
  const matches = getShortcutConflictMap(bindings, platform, definition.context).get(shortcut) ?? [];
  return matches.filter((id) => id !== actionId);
}

export function matchesShortcut(
  event: KeyboardEvent,
  definition: ShortcutDefinition,
  shortcut: string,
  platform: ShortcutPlatform,
): boolean {
  const result = shortcutFromKeyboardEvent(event, { definition, platform });
  return Boolean(result?.ok && result.shortcut === shortcut);
}

export function isShortcutResetKey(event: KeyboardEvent): boolean {
  return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && (
    event.key === "Delete" ||
    event.key === "Backspace"
  );
}

export function isShortcutConfirmKey(event: KeyboardEvent): boolean {
  return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === ESCAPE_KEY;
}

export function getPlatformFromBrowserOs(os: string | undefined): ShortcutPlatform {
  if (os === "mac") {
    return "mac";
  }
  if (os === "win") {
    return "windows";
  }
  if (os === "linux") {
    return "linux";
  }
  if (os === "cros") {
    return "cros";
  }

  return "default";
}
