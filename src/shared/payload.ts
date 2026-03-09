const START_X = 180;
const START_Y = 180;
const COL_GAP = 260;
const ROW_GAP = 190;

type UnknownRecord = Record<string, unknown>;

export type TaskVariant =
  | "default"
  | "user"
  | "service"
  | "manual"
  | "script"
  | "send"
  | "receive"
  | "business-rule"
  | "call-activity"
  | "automatic";

export type ContextBadgeKind =
  | "content"
  | "multi-element"
  | "timer"
  | "message"
  | "conditional"
  | "link"
  | "multiple"
  | "loop"
  | "mi-parallel"
  | "mi-sequential"
  | "adhoc"
  | "non-interrupting"
  | "transaction";

export type TypeBadgeKind = Exclude<TaskVariant, "default">;

export type PrimaryShapeInfo = {
  stencilId: string;
  hasContent: boolean;
  contentText: string;
  taskVariant: TaskVariant;
  typeName: string;
  properties: UnknownRecord | null;
};

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const getStencilId = (shape: unknown): string => {
  if (!isRecord(shape) || !isRecord(shape.stencil) || typeof shape.stencil.id !== "string") {
    return "";
  }

  return shape.stencil.id;
};

const isEdgeStencil = (stencilId: string): boolean => {
  const normalized = stencilId.toLowerCase();
  return (
    normalized.includes("flow") ||
    normalized.includes("association") ||
    normalized.includes("connection") ||
    normalized.includes("link")
  );
};

const getChildShapeArray = (payload: unknown): unknown[] => {
  if (!isRecord(payload) || !Array.isArray(payload.childShapes)) {
    return [];
  }

  return payload.childShapes;
};

const collectAllShapes = (shapes: unknown[]): UnknownRecord[] => {
  const results: UnknownRecord[] = [];
  const stack = [...shapes];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!isRecord(current)) {
      continue;
    }

    results.push(current);

    if (Array.isArray(current.childShapes)) {
      for (const child of current.childShapes) {
        stack.push(child);
      }
    }
  }

  return results;
};

const clone = <T>(value: T): T => structuredClone(value);

const collectResourceIds = (shapes: UnknownRecord[]): Set<string> => {
  const ids = new Set<string>();
  for (const shape of shapes) {
    if (typeof shape.resourceId === "string" && shape.resourceId.trim()) {
      ids.add(shape.resourceId);
    }
  }

  return ids;
};

const createIdMap = (ids: Set<string>): Map<string, string> => {
  const map = new Map<string, string>();
  for (const id of ids) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    map.set(id, `sid-${suffix}`);
  }

  return map;
};

const rewriteReferences = (value: unknown, idMap: Map<string, string>): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteReferences(item, idMap));
  }

  if (!isRecord(value)) {
    return value;
  }

  const output: UnknownRecord = {};

  for (const [key, raw] of Object.entries(value)) {
    if (key === "resourceId" && typeof raw === "string" && idMap.has(raw)) {
      output[key] = idMap.get(raw) as string;
      continue;
    }

    output[key] = rewriteReferences(raw, idMap);
  }

  return output;
};

const applyDefaultTopLevelPlacement = (payload: UnknownRecord): void => {
  if (!Array.isArray(payload.childShapes)) {
    return;
  }

  let nodeIndex = 0;

  for (const candidate of payload.childShapes) {
    if (!isRecord(candidate)) {
      continue;
    }

    const stencilId = getStencilId(candidate);
    if (isEdgeStencil(stencilId)) {
      continue;
    }

    if (!isRecord(candidate.bounds)) {
      continue;
    }

    const bounds = candidate.bounds;
    if (!isRecord(bounds.upperLeft) || !isRecord(bounds.lowerRight)) {
      continue;
    }

    const upperLeft = bounds.upperLeft;
    const lowerRight = bounds.lowerRight;
    const width =
      typeof lowerRight.x === "number" && typeof upperLeft.x === "number"
        ? Math.max(40, lowerRight.x - upperLeft.x)
        : 120;
    const height =
      typeof lowerRight.y === "number" && typeof upperLeft.y === "number"
        ? Math.max(40, lowerRight.y - upperLeft.y)
        : 80;

    const x = START_X + (nodeIndex % 3) * COL_GAP;
    const y = START_Y + Math.floor(nodeIndex / 3) * ROW_GAP;

    bounds.upperLeft = { x, y };
    bounds.lowerRight = { x: x + width, y: y + height };

    nodeIndex += 1;
  }
};

const getPrimaryShape = (payload: unknown): UnknownRecord | null => {
  const childShapes = getChildShapeArray(payload).filter(isRecord);
  if (childShapes.length === 0) {
    return null;
  }

  const nonConnector = childShapes.find((shape) => !isEdgeStencil(getStencilId(shape)));
  return nonConnector ?? childShapes[0] ?? null;
};

const getShapeProperties = (shape: UnknownRecord | null): UnknownRecord | null => {
  if (!shape || !isRecord(shape.properties)) {
    return null;
  }

  return shape.properties;
};

const CONTENT_KEYS = [
  "name",
  "title",
  "text",
  "documentation",
  "description",
  "conditionexpression",
  "conditionExpression",
  "condition",
  "taskname",
  "subject",
  "label",
  "caption",
];

const stripMarkup = (value: string): string => {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const TECHNICAL_TOKENS = new Set([
  "task",
  "usertask",
  "manualtask",
  "servicetask",
  "webservice",
  "scripttask",
  "sendtask",
  "receivetask",
  "businessruletask",
  "callactivity",
  "automatic",
  "bpmn",
]);

const normalizeToken = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const isTechnicalContent = (value: string): boolean => {
  const normalized = normalizeToken(value);
  return TECHNICAL_TOKENS.has(normalized);
};

const extractContentText = (properties: UnknownRecord | null): string => {
  if (!properties) {
    return "";
  }

  for (const key of CONTENT_KEYS) {
    const value = properties[key];
    if (typeof value === "string") {
      const cleaned = stripMarkup(value);
      if (cleaned.length > 0 && !isTechnicalContent(cleaned)) {
        return cleaned;
      }
    }
  }

  return "";
};

const getString = (properties: UnknownRecord | null, keys: string[]): string => {
  if (!properties) {
    return "";
  }

  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getBool = (properties: UnknownRecord | null, keys: string[]): boolean | null => {
  if (!properties) {
    return null;
  }

  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1"].includes(normalized)) {
        return true;
      }
      if (["false", "no", "0"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
};

const inferTaskVariant = (stencilIdRaw: string, properties: UnknownRecord | null): TaskVariant => {
  const stencilId = stencilIdRaw.toLowerCase();
  const typeString = getString(properties, ["tasktype", "type", "activitytype", "implementation", "trigger"]).toLowerCase();
  const combined = `${stencilId} ${typeString}`;

  if (combined.includes("callactivity") || combined.includes("call activity")) {
    return "call-activity";
  }
  if (combined.includes("servicetask") || combined.includes("service task") || combined.includes("service") || combined.includes("webservice")) {
    return "service";
  }
  if (combined.includes("usertask") || combined.includes("user task") || combined.includes("user")) {
    return "user";
  }
  if (combined.includes("manualtask") || combined.includes("manual task") || combined.includes("manual")) {
    return "manual";
  }
  if (combined.includes("scripttask") || combined.includes("script task") || combined.includes("script")) {
    return "script";
  }
  if (combined.includes("sendtask") || combined.includes("send task") || combined.includes("send")) {
    return "send";
  }
  if (combined.includes("receivetask") || combined.includes("receive task") || combined.includes("receive")) {
    return "receive";
  }
  if (
    combined.includes("businessruletask") ||
    combined.includes("business rule") ||
    combined.includes("decision")
  ) {
    return "business-rule";
  }
  if (combined.includes("automatic") || combined.includes("auto")) {
    return "automatic";
  }

  return "default";
};

const getEventFlavorName = (aggregate: string): string => {
  if (containsAny(aggregate, ["timer"])) return "Timer";
  if (containsAny(aggregate, ["message"])) return "Message";
  if (containsAny(aggregate, ["signal"])) return "Signal";
  if (containsAny(aggregate, ["conditional"])) return "Conditional";
  if (containsAny(aggregate, ["linkevent", " link "])) return "Link";
  if (containsAny(aggregate, ["multiple"])) return "Multiple";
  if (containsAny(aggregate, ["escalation"])) return "Escalation";
  if (containsAny(aggregate, ["error"])) return "Error";
  if (containsAny(aggregate, ["compensation"])) return "Compensation";
  if (containsAny(aggregate, ["terminate"])) return "Terminate";
  if (containsAny(aggregate, ["cancel"])) return "Cancel";
  return "";
};

const getTypeName = (
  stencilIdRaw: string,
  taskVariant: TaskVariant,
  properties: UnknownRecord | null,
): string => {
  const stencilId = stencilIdRaw.toLowerCase();
  const propertyStrings = Object.values(properties ?? {})
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const aggregate = `${stencilId} ${propertyStrings}`;
  const eventFlavor = getEventFlavorName(aggregate);

  if (stencilId.includes("transaction")) return "Transaction";
  if (stencilId.includes("subprocess")) return "Subprocess";
  if (stencilId.includes("parallelgateway")) return "Parallel Gateway";
  if (stencilId.includes("inclusivegateway")) return "Inclusive Gateway";
  if (stencilId.includes("eventbasedgateway")) return "Event-Based Gateway";
  if (stencilId.includes("complexgateway")) return "Complex Gateway";
  if (stencilId.includes("gateway")) return "Exclusive Gateway";
  if (stencilId.includes("startevent")) {
    return eventFlavor ? `Start ${eventFlavor} Event` : "Start Event";
  }
  if (stencilId.includes("endevent")) {
    return eventFlavor ? `End ${eventFlavor} Event` : "End Event";
  }
  if (stencilId.includes("boundaryevent")) {
    return eventFlavor ? `Boundary ${eventFlavor} Event` : "Boundary Event";
  }
  if (stencilId.includes("intermediate") || stencilId.includes("event")) {
    return eventFlavor ? `Intermediate ${eventFlavor} Event` : "Intermediate Event";
  }
  if (stencilId.includes("messageflow")) return "Message Flow";
  if (stencilId.includes("sequenceflow")) return "Sequence Flow";
  if (stencilId.includes("association")) return "Association";
  if (stencilId.includes("dataobject")) return "Data Object";
  if (stencilId.includes("datastore")) return "Data Store";
  if (stencilId.includes("annotation")) return "Text Annotation";
  if (stencilId.includes("group")) return "Group";
  if (stencilId.includes("pool") || stencilId.includes("lane") || stencilId.includes("participant")) {
    return "Pool/Lane";
  }

  if (stencilId.includes("task") || stencilId.includes("activity") || stencilId.includes("callactivity")) {
    if (taskVariant === "service") return "Service Task";
    if (taskVariant === "user") return "User Task";
    if (taskVariant === "manual") return "Manual Task";
    if (taskVariant === "script") return "Script Task";
    if (taskVariant === "send") return "Send Task";
    if (taskVariant === "receive") return "Receive Task";
    if (taskVariant === "business-rule") return "Business Rule Task";
    if (taskVariant === "call-activity") return "Call Activity";
    if (taskVariant === "automatic") return "Automatic Task";
    return "Task";
  }

  return "Component";
};

const getFirstWords = (text: string, count: number): string => {
  const words = text.match(/[^\s]+/g) ?? [];
  return words.slice(0, count).join(" ").trim();
};

const containsAny = (text: string, needles: string[]): boolean => {
  return needles.some((needle) => text.includes(needle));
};

const uniqueBadges = (badges: ContextBadgeKind[]): ContextBadgeKind[] => {
  const seen = new Set<ContextBadgeKind>();
  const result: ContextBadgeKind[] = [];
  for (const badge of badges) {
    if (!seen.has(badge)) {
      seen.add(badge);
      result.push(badge);
    }
  }
  return result;
};

const getTopLevelNodeCount = (payload: unknown): number => {
  const childShapes = getChildShapeArray(payload).filter(isRecord);
  let count = 0;

  for (const shape of childShapes) {
    if (!isEdgeStencil(getStencilId(shape))) {
      count += 1;
    }
  }

  return count;
};

export function getTopLevelNonEdgeStencils(
  payload: unknown,
  max = 3,
): string[] {
  const childShapes = getChildShapeArray(payload).filter(isRecord);
  const stencils: string[] = [];

  for (const shape of childShapes) {
    const stencilId = getStencilId(shape);
    if (!stencilId || isEdgeStencil(stencilId)) {
      continue;
    }

    stencils.push(stencilId);
    if (stencils.length >= max) {
      break;
    }
  }

  return stencils;
}

export function getPrimaryShapeInfo(payload: unknown): PrimaryShapeInfo {
  const primaryShape = getPrimaryShape(payload);
  const stencilId = getStencilId(primaryShape);
  const properties = getShapeProperties(primaryShape);
  const contentText = extractContentText(properties);
  const hasContent = contentText.length > 0;
  const taskVariant = inferTaskVariant(stencilId, properties);
  const typeName = getTypeName(stencilId, taskVariant, properties);

  return {
    stencilId,
    hasContent,
    contentText,
    taskVariant,
    typeName,
    properties,
  };
}

export function getPrimaryStencilId(payload: unknown): string {
  return getPrimaryShapeInfo(payload).stencilId;
}

export function getContextBadgeKinds(payload: unknown): ContextBadgeKind[] {
  const info = getPrimaryShapeInfo(payload);
  const badges: ContextBadgeKind[] = [];
  const stencil = info.stencilId.toLowerCase();
  const propertyStrings = Object.values(info.properties ?? {})
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const aggregate = `${stencil} ${propertyStrings}`;

  if (info.hasContent) {
    badges.push("content");
  }

  if (getTopLevelNodeCount(payload) > 1) {
    badges.push("multi-element");
  }

  if (containsAny(aggregate, ["timer"])) badges.push("timer");
  if (containsAny(aggregate, ["message"])) badges.push("message");
  if (containsAny(aggregate, ["conditional"])) badges.push("conditional");
  if (containsAny(aggregate, ["linkevent", " link "])) badges.push("link");
  if (containsAny(aggregate, ["multiple"])) badges.push("multiple");

  if (containsAny(aggregate, ["multi", "multiple"])) {
    if (containsAny(aggregate, ["parallel"])) {
      badges.push("mi-parallel");
    }
    if (containsAny(aggregate, ["sequential", "serial"])) {
      badges.push("mi-sequential");
    }
  }

  if (containsAny(aggregate, ["loop"])) badges.push("loop");
  if (containsAny(aggregate, ["adhoc", "ad hoc"])) badges.push("adhoc");
  if (containsAny(aggregate, ["transaction"])) badges.push("transaction");

  const isInterrupting = getBool(info.properties, ["isinterrupting", "interrupting"]);
  if (isInterrupting === false || containsAny(aggregate, ["noninterrupting", "non-interrupting"])) {
    badges.push("non-interrupting");
  }

  return uniqueBadges(badges);
}

export function getTypeBadgeKind(payload: unknown): TypeBadgeKind | null {
  const variant = getPrimaryShapeInfo(payload).taskVariant;
  return variant === "default" ? null : variant;
}

const collectShapeCandidates = (
  value: unknown,
  out: UnknownRecord[],
  visited: WeakSet<object>,
): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectShapeCandidates(item, out, visited);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (typeof value.resourceId === "string" && isRecord(value.stencil) && typeof value.stencil.id === "string") {
    out.push(value);
  }

  for (const nested of Object.values(value)) {
    collectShapeCandidates(nested, out, visited);
  }
};

const hasReferenceToAnyId = (
  value: unknown,
  ids: Set<string>,
  visited: WeakSet<object>,
): boolean => {
  if (typeof value === "string") {
    return ids.has(value);
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasReferenceToAnyId(entry, ids, visited));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (visited.has(value)) {
    return false;
  }
  visited.add(value);

  for (const nested of Object.values(value)) {
    if (hasReferenceToAnyId(nested, ids, visited)) {
      return true;
    }
  }

  return false;
};

const appendLinkedAnnotationsAndConnectors = (payload: UnknownRecord): void => {
  if (!Array.isArray(payload.childShapes) || !isRecord(payload.linked)) {
    return;
  }

  const currentShapes = payload.childShapes.filter(isRecord);
  const existingIds = collectResourceIds(currentShapes);

  const linkedCandidates: UnknownRecord[] = [];
  collectShapeCandidates(payload.linked, linkedCandidates, new WeakSet<object>());

  if (linkedCandidates.length === 0) {
    return;
  }

  const annotationCandidates = linkedCandidates.filter((shape) =>
    getStencilId(shape).toLowerCase().includes("annotation"),
  );
  const annotationIds = new Set<string>();
  for (const shape of annotationCandidates) {
    if (typeof shape.resourceId === "string" && shape.resourceId.trim()) {
      annotationIds.add(shape.resourceId);
    }
  }

  const associationCandidates = linkedCandidates.filter((shape) =>
    getStencilId(shape).toLowerCase().includes("association"),
  );

  const toAppend: UnknownRecord[] = [];
  for (const annotation of annotationCandidates) {
    toAppend.push(annotation);
  }

  for (const association of associationCandidates) {
    const referencesAnnotation = hasReferenceToAnyId(
      association,
      annotationIds,
      new WeakSet<object>(),
    );
    const referencesCopiedShape = hasReferenceToAnyId(
      association,
      existingIds,
      new WeakSet<object>(),
    );

    if (referencesAnnotation || referencesCopiedShape) {
      toAppend.push(association);
    }
  }

  for (const shape of toAppend) {
    if (typeof shape.resourceId !== "string" || !shape.resourceId.trim()) {
      continue;
    }

    if (existingIds.has(shape.resourceId)) {
      continue;
    }

    payload.childShapes.push(clone(shape));
    existingIds.add(shape.resourceId);
  }
};

export function preparePayloadForFavoriteStorage(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.childShapes)) {
    return clone(payload);
  }

  const cloned = clone(payload) as UnknownRecord;
  appendLinkedAnnotationsAndConnectors(cloned);
  return cloned;
}

export function getSuggestedFavoriteName(payload: unknown): string {
  const info = getPrimaryShapeInfo(payload);
  const topLevelNodeCount = getTopLevelNodeCount(payload);
  let baseName = info.typeName || "Favorite snippet";

  if (info.hasContent) {
    const contentPrefix = getFirstWords(info.contentText, 2);
    if (contentPrefix) {
      baseName = `${info.typeName}: ${contentPrefix}`;
    }
  }

  if (topLevelNodeCount > 1) {
    return `${baseName}, more...`;
  }

  return baseName;
}

export function sanitizePayloadForReuse(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.childShapes)) {
    return clone(payload);
  }

  const cloned = preparePayloadForFavoriteStorage(payload) as UnknownRecord;
  const shapes = collectAllShapes(getChildShapeArray(cloned));
  const ids = collectResourceIds(shapes);
  const idMap = createIdMap(ids);

  const rewritten = rewriteReferences(cloned, idMap);
  if (!isRecord(rewritten)) {
    return rewritten;
  }

  // Ensure paste lands predictably in a visible default location.
  rewritten.useOffset = false;

  applyDefaultTopLevelPlacement(rewritten);

  return rewritten;
}
