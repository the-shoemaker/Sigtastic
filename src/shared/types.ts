export type ClipboardSource = "fetch" | "xhr" | "manual";

export type ClipboardRequestTemplate = {
  headers: Record<string, string>;
  params: Array<[string, string]>;
};

export type ClipboardCapture = {
  valueJson: unknown;
  namespace: string;
  capturedAt: number;
  source: ClipboardSource;
  requestTemplate?: ClipboardRequestTemplate;
};

export type Favorite = {
  id: string;
  name: string;
  displayName?: string;
  displayNameCustom?: boolean;
  displayContent?: string;
  displayContentCustom?: boolean;
  payload: unknown;
  namespace: string;
  requestTemplate?: ClipboardRequestTemplate;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type TaskTypeOption =
  | "none"
  | "send"
  | "receive"
  | "script"
  | "service"
  | "user"
  | "manual"
  | "business-rule";

export type RectLike = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type EditorSelectionInfo = {
  hasSelection: boolean;
  selectedCount: number;
  isTask: boolean;
  taskType: TaskTypeOption | null;
  shapeId: string | null;
  anchorRect: RectLike | null;
};

export type ContentMessage =
  | { type: "BPKEYS_TOGGLE_OVERLAY" }
  | { type: "BPKEYS_SAVE_FAVORITE" }
  | { type: "BPKEYS_TOGGLE_QUICK_MENU" };
