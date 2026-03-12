(() => {
  const FLAG = "__bpkeysClipboardHookInstalled";
  if (window[FLAG]) {
    return;
  }

  window[FLAG] = true;

  const MESSAGE_SOURCE = "signavio-bpkeys-hook";
  const CONTENT_SOURCE = "signavio-bpkeys-content";
  const CLIPBOARD_PATH = "/p/clipboard";
  const BPMN_NAMESPACE = "http://b3mn.org/stencilset/bpmn2.0#";

  let lastClipboardHeaders = {};
  let lastClipboardParams = null;
  let lastPointerTarget = null;
  let lastPointerShapeId = "";
  let lastShapePointerTarget = null;
  let lastResolvedShapeObject = null;
  let lastResolvedFacade = null;
  const lastKnownTaskTypes = new Map();

  const nativeFetch = window.fetch.bind(window);
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  const nativeSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  const isClipboardUrl = (inputUrl) => {
    if (!inputUrl) {
      return false;
    }

    try {
      const resolvedUrl = new URL(inputUrl, window.location.origin);
      return resolvedUrl.pathname === CLIPBOARD_PATH;
    } catch {
      return false;
    }
  };

  const asSearchParams = (body) => {
    if (!body) {
      return null;
    }

    if (typeof body === "string") {
      return new URLSearchParams(body);
    }

    if (body instanceof URLSearchParams) {
      return body;
    }

    if (body instanceof FormData) {
      const params = new URLSearchParams();
      for (const [key, value] of body.entries()) {
        if (typeof value === "string") {
          params.append(key, value);
        }
      }
      return params;
    }

    if (Array.isArray(body)) {
      return new URLSearchParams(body);
    }

    return null;
  };

  const safeParseJson = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const summarizeElement = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }

    const attrs = {};
    for (const name of [
      "id",
      "class",
      "data-resource-id",
      "resource-id",
      "data-shape-id",
      "data-element-id",
      "data-node-id",
      "data-id",
      "oryx:id",
      "transform",
      "d",
      "x",
      "y",
      "width",
      "height",
      "cx",
      "cy",
      "r",
    ]) {
      const value = element.getAttribute(name);
      if (value != null && value !== "") {
        attrs[name] = value;
      }
    }

    const ownKeys = [];
    try {
      for (const key of Object.getOwnPropertyNames(element)) {
        if (ownKeys.length >= 25) {
          break;
        }
        ownKeys.push(key);
      }
    } catch {}

    return {
      tag: element.tagName,
      id: element.id || "",
      className: element.className && typeof element.className === "string"
        ? element.className
        : String(element.className || ""),
      text: (element.textContent || "").trim().slice(0, 120),
      attrs,
      ownKeys,
    };
  };

  const isVisibleElement = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || "1") > 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const getElementChain = (element) => {
    const chain = [];
    let current = element instanceof Element ? element : null;

    while (current && chain.length < 8) {
      chain.push(summarizeElement(current));
      current = current.parentElement;
    }

    return chain.filter(Boolean);
  };

  const extractShapeId = (value) => {
    const text = String(value || "");
    const match = text.match(
      /sid-[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/i,
    );
    return match ? match[0] : "";
  };

  const getPointerShapeId = () => {
    if (lastPointerShapeId) {
      return lastPointerShapeId;
    }

    if (!(lastPointerTarget instanceof Element)) {
      return "";
    }

    let current = lastPointerTarget;
    while (current) {
      const rawId = current.id || "";
      const found =
        // Prefer exact group/resource ids before extracting from helper node ids like `...bg_frame`.
        (rawId.startsWith("sid-") && !rawId.includes("bg_frame") ? extractShapeId(rawId) : "") ||
        extractShapeId(current.getAttribute("data-resource-id")) ||
        extractShapeId(current.getAttribute("data-shape-id")) ||
        extractShapeId(current.getAttribute("resource-id")) ||
        extractShapeId(rawId);
      if (found) {
        return found;
      }
      current = current.parentElement;
    }

    return "";
  };

  const extractShapeIdFromEvent = (event) => {
    if (!event || typeof event.composedPath !== "function") {
      return "";
    }

    const path = event.composedPath();
    for (const entry of path) {
      if (!(entry instanceof Element)) {
        continue;
      }

      const found =
        extractShapeId(entry.id || "") ||
        extractShapeId(entry.getAttribute("data-resource-id")) ||
        extractShapeId(entry.getAttribute("data-shape-id")) ||
        extractShapeId(entry.getAttribute("resource-id"));
      if (found) {
        return found;
      }
    }

    return "";
  };

  const normalizeHeaders = (headers) => {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      const output = {};
      for (const [key, value] of headers.entries()) {
        output[key.toLowerCase()] = String(value);
      }
      return output;
    }

    if (Array.isArray(headers)) {
      const output = {};
      for (const entry of headers) {
        if (Array.isArray(entry) && entry.length >= 2) {
          output[String(entry[0]).toLowerCase()] = String(entry[1]);
        }
      }
      return output;
    }

    if (typeof headers === "object") {
      const output = {};
      for (const [key, value] of Object.entries(headers)) {
        if (value != null) {
          output[key.toLowerCase()] = String(value);
        }
      }
      return output;
    }

    return {};
  };

  const pickForwardHeaders = (headers) => {
    const normalized = normalizeHeaders(headers);
    const output = {};

    for (const [name, value] of Object.entries(normalized)) {
      if (
        name === "content-length" ||
        name === "host" ||
        name === "origin" ||
        name === "referer" ||
        name === "cookie" ||
        name.startsWith("sec-") ||
        name.startsWith(":")
      ) {
        continue;
      }

      output[name] = value;
    }

    return output;
  };

  const isVisibleSelector = (selector) => {
    const node = document.querySelector(selector);
    return node instanceof Element && isVisibleElement(node);
  };

  const hasVisibleLoadingUi = () => {
    const selectors = [
      ".x-mask-loading",
      ".x-mask-msg",
      ".x-mask",
      "[aria-busy='true']",
      ".loading",
      ".spinner",
      ".busy",
    ];

    return selectors.some((selector) => isVisibleSelector(selector));
  };

  const cloneSearchParams = (params) => {
    const next = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      next.append(key, value);
    }
    return next;
  };

  const paramsToTemplateEntries = (params) => {
    const entries = [];
    for (const [key, value] of params.entries()) {
      if (key === "value_json") {
        continue;
      }

      entries.push([key, value]);
    }

    return entries;
  };

  const templateEntriesToParams = (entries) => {
    const params = new URLSearchParams();
    if (!Array.isArray(entries)) {
      return params;
    }

    for (const entry of entries) {
      if (Array.isArray(entry) && entry.length >= 2) {
        params.append(String(entry[0]), String(entry[1]));
      }
    }

    return params;
  };

  const getCookieValue = (name) => {
    const all = document.cookie || "";
    const parts = all.split(";");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(`${name}=`)) {
        return decodeURIComponent(trimmed.slice(name.length + 1));
      }
    }

    return "";
  };

  const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"], meta[name="_csrf"]');
    if (meta && typeof meta.content === "string" && meta.content.trim()) {
      return meta.content.trim();
    }

    return (
      getCookieValue("XSRF-TOKEN") ||
      getCookieValue("CSRF-TOKEN") ||
      getCookieValue("_csrf") ||
      ""
    );
  };

  const emitCapture = (valueJsonText, namespace, source, requestTemplate) => {
    if (!valueJsonText) {
      return;
    }

    const valueJson = safeParseJson(valueJsonText);
    if (!valueJson) {
      return;
    }

    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: "clipboard-captured",
        payload: {
          valueJson,
          namespace: namespace || BPMN_NAMESPACE,
          capturedAt: Date.now(),
          source,
          requestTemplate,
        },
      },
      window.location.origin,
    );
  };

  const parseAndEmit = (url, method, body, source, headers) => {
    const normalizedMethod = String(method || "GET").toUpperCase();
    if (normalizedMethod !== "POST" || !isClipboardUrl(url)) {
      return;
    }

    lastClipboardHeaders = pickForwardHeaders(headers);

    const params = asSearchParams(body);
    if (!params) {
      return;
    }

    lastClipboardParams = cloneSearchParams(params);
    emitCapture(params.get("value_json"), params.get("namespace"), source, {
      headers: { ...lastClipboardHeaders },
      params: paramsToTemplateEntries(params),
    });
  };

  const writeClipboard = async (requestId, valueJson, namespace, requestTemplate) => {
    try {
      const templateParams =
        requestTemplate && Array.isArray(requestTemplate.params)
          ? templateEntriesToParams(requestTemplate.params)
          : null;

      const params = templateParams
        ? templateParams
        : lastClipboardParams
          ? cloneSearchParams(lastClipboardParams)
          : new URLSearchParams();

      params.set("value_json", JSON.stringify(valueJson));
      params.set("namespace", namespace || BPMN_NAMESPACE);

      const csrfToken = getCsrfToken();
      const headers = {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        ...(requestTemplate && typeof requestTemplate.headers === "object"
          ? requestTemplate.headers
          : {}),
        ...lastClipboardHeaders,
      };

      if (csrfToken && !headers["x-csrf-token"]) {
        headers["x-csrf-token"] = csrfToken;
      }

      const response = await nativeFetch(new URL(CLIPBOARD_PATH, window.location.origin).toString(), {
        method: "POST",
        credentials: "include",
        headers,
        body: params.toString(),
      });

      let errorText = "";
      if (!response.ok) {
        try {
          errorText = (await response.text()).slice(0, 180);
        } catch {
          errorText = "";
        }
      }

      window.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: "clipboard-write-result",
          requestId,
          ok: response.ok,
          status: response.status,
          error: errorText,
        },
        window.location.origin,
      );
    } catch (error) {
      window.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: "clipboard-write-result",
          requestId,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        window.location.origin,
      );
    }
  };

  const TASK_TYPE_KEYS = [
    "oryx-tasktype",
    "tasktype",
    "oryx_tasktype",
    "oryx-activitytype",
  ];

  const TASK_TYPE_VALUES = {
    none: ["None", "none", "Task", "task", ""],
    send: ["Send", "send", "SendTask"],
    receive: ["Receive", "receive", "ReceiveTask"],
    user: ["User", "user", "UserTask"],
    manual: ["Manual", "manual", "ManualTask"],
    service: ["Service", "service", "ServiceTask"],
    "business-rule": ["Business Rule", "businessrule", "BusinessRuleTask", "BusinessRule"],
    script: ["Script", "script", "ScriptTask"],
  };

  const normalizeTaskType = (value) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");

    if (!normalized) return "none";
    if (normalized.includes("business")) return "business-rule";
    if (normalized.includes("service")) return "service";
    if (normalized.includes("manual")) return "manual";
    if (normalized.includes("script")) return "script";
    if (normalized.includes("receive")) return "receive";
    if (normalized.includes("send")) return "send";
    if (normalized.includes("user")) return "user";
    if (normalized.includes("none") || normalized.includes("default") || normalized === "task") {
      return "none";
    }

    return null;
  };

  const SELECTION_KEYS = [
    "selection",
    "_selection",
    "currentSelection",
    "selectedElements",
    "selectedShapes",
    "elements",
    "shapeSelection",
  ];

  const normalizeCollection = (value) => {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (value instanceof Set) {
      return Array.from(value);
    }
    if (typeof value.toArray === "function") {
      try {
        const arr = value.toArray();
        return Array.isArray(arr) ? arr : [];
      } catch {}
    }
    if (Array.isArray(value.elements)) {
      return value.elements;
    }
    if (Array.isArray(value.shapes)) {
      return value.shapes;
    }
    return [];
  };

  const getFacadeSelection = (facade) => {
    if (!facade) {
      return [];
    }

    try {
      if (typeof facade.getSelection === "function") {
        const selection = normalizeCollection(facade.getSelection());
        if (selection.length > 0) {
          return selection;
        }
      }
    } catch {}

    for (const key of SELECTION_KEYS) {
      try {
        const selection = normalizeCollection(facade[key]);
        if (selection.length > 0) {
          return selection;
        }
      } catch {}
    }

    for (const key of ["facade", "_facade", "pluginFacade", "_pluginFacade"]) {
      try {
        const nested = facade[key];
        if (nested && nested !== facade) {
          const selection = getFacadeSelection(nested);
          if (selection.length > 0) {
            return selection;
          }
        }
      } catch {}
    }

    return [];
  };

  const addFacadeCandidate = (candidate, seen, out) => {
    if (!candidate || (typeof candidate !== "object" && typeof candidate !== "function")) {
      return;
    }
    if (seen.has(candidate)) {
      return;
    }
    seen.add(candidate);

    const hasSelectionGetter = typeof candidate.getSelection === "function";
    const hasSelectionState = SELECTION_KEYS.some((key) => {
      try {
        return candidate[key] != null;
      } catch {
        return false;
      }
    });
    const looksLikeFacade =
      hasSelectionGetter ||
      hasSelectionState ||
      typeof candidate.getCanvas === "function" ||
      typeof candidate.raiseEvent === "function" ||
      typeof candidate.executeCommands === "function";

    if (looksLikeFacade) {
      out.push(candidate);
    }

    for (const key of [
      "facade",
      "_facade",
      "pluginFacade",
      "_pluginFacade",
      "editor",
      "_editor",
      "model",
      "canvas",
      "_canvas",
    ]) {
      try {
        if (candidate[key]) {
          out.push(candidate[key]);
        }
      } catch {}
    }
  };

  const collectFacadeCandidates = (root, seen, out, depth, propertyBudget) => {
    if (!root || depth < 0 || propertyBudget.count <= 0) {
      return;
    }
    addFacadeCandidate(root, seen, out);

    if ((typeof root !== "object" && typeof root !== "function") || seen.has(root) === false) {
      return;
    }

    if (depth === 0) {
      return;
    }

    const keys = [];
    try {
      for (const key of Object.getOwnPropertyNames(root)) {
        if (keys.length >= 18 || propertyBudget.count <= 0) {
          break;
        }
        keys.push(key);
      }
    } catch {
      return;
    }

    for (const key of keys) {
      if (propertyBudget.count <= 0) {
        break;
      }

      let value;
      try {
        value = root[key];
      } catch {
        continue;
      }
      propertyBudget.count -= 1;

      if (!value || (typeof value !== "object" && typeof value !== "function")) {
        continue;
      }
      if (seen.has(value)) {
        continue;
      }

      collectFacadeCandidates(value, seen, out, depth - 1, propertyBudget);
    }
  };

  const scoreFacadeCandidate = (facade) => {
    if (!facade || (typeof facade !== "object" && typeof facade !== "function")) {
      return -1;
    }

    let score = 0;
    const selection = getFacadeSelection(facade);

    if (selection.length > 0) {
      score += 400;
    }
    if (typeof facade.executeCommands === "function") {
      score += 220;
    }
    if (typeof facade.getCanvas === "function") {
      score += 180;
    }
    if (typeof facade.getSelection === "function") {
      score += 120;
    }
    if (typeof facade.raiseEvent === "function") {
      score += 80;
    }
    if (typeof facade.updateSelection === "function") {
      score += 60;
    }

    return score;
  };

  const findEditorFacade = () => {
    if (lastResolvedFacade) {
      return lastResolvedFacade;
    }

    const seen = new Set();
    const candidates = [];
    const propertyBudget = { count: 280 };

    collectFacadeCandidates(window.__ORYX_EDITOR__, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.ORYX && window.ORYX.EDITOR, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(
      window.ORYX && window.ORYX.Editor && window.ORYX.Editor._instance,
      seen,
      candidates,
      2,
      propertyBudget,
    );
    collectFacadeCandidates(window.editor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.signavioEditor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.signavio && window.signavio.editor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.Signavio && window.Signavio.editor, seen, candidates, 2, propertyBudget);

    for (const key of Object.getOwnPropertyNames(window)) {
      if (propertyBudget.count <= 0) {
        break;
      }
      let value;
      try {
        value = window[key];
      } catch {
        continue;
      }
      collectFacadeCandidates(value, seen, candidates, 1, propertyBudget);
    }

    const rankedCandidates = candidates
      .map((candidate) => ({ candidate, score: scoreFacadeCandidate(candidate) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score);

    lastResolvedFacade = rankedCandidates[0]?.candidate || null;
    return lastResolvedFacade;
  };

  const resolveShape = (entry) => {
    if (!entry) {
      return null;
    }

    const directCandidates = [entry];
    for (const key of ["shape", "_shape", "model", "node", "element", "oryxShape"]) {
      try {
        if (entry[key]) {
          directCandidates.push(entry[key]);
        }
      } catch {}
    }

    let bestCandidate = null;
    let bestScore = -1;

    for (const candidate of directCandidates) {
      const resolved = findMatchingShapeObject(candidate, "", 2, new Set(), true);
      if (!resolved) {
        continue;
      }

      const score = scoreShapeCandidate(resolved, "", true);
      if (score > bestScore) {
        bestCandidate = resolved;
        bestScore = score;
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }

    return entry;
  };

  const getSelectedShapes = (facade) => {
    return getFacadeSelection(facade)
      .map(resolveShape)
      .filter((shape) => shape && (typeof shape === "object" || typeof shape === "function"));
  };

  const getStencilId = (shape) => {
    if (!shape) {
      return "";
    }

    try {
      if (typeof shape.getStencil === "function") {
        const stencil = shape.getStencil();
        if (stencil) {
          if (typeof stencil.idWithoutNs === "function") {
            return String(stencil.idWithoutNs() || "");
          }
          if (typeof stencil.id === "function") {
            return String(stencil.id() || "");
          }
          if (typeof stencil.id === "string") {
            return stencil.id;
          }
        }
      }
    } catch {}

    if (shape.stencil && typeof shape.stencil === "object" && typeof shape.stencil.id === "string") {
      return shape.stencil.id;
    }

    return "";
  };

  const getObjectId = (value) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return "";
    }

    try {
      if (typeof value.resourceId === "string") {
        const found = extractShapeId(value.resourceId);
        if (found) return found;
      }
    } catch {}

    try {
      if (typeof value.id === "string") {
        const found = extractShapeId(value.id);
        if (found) return found;
      }
    } catch {}

    try {
      if (typeof value.getId === "function") {
        const found = extractShapeId(value.getId());
        if (found) return found;
      }
    } catch {}

    return "";
  };

  const summarizeBoundObject = (value) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return null;
    }

    let keys = [];
    try {
      keys = Object.getOwnPropertyNames(value).slice(0, 20);
    } catch {}

    return {
      type: typeof value,
      objectId: getObjectId(value),
      stencilId: getStencilId(value),
      hasGetProperty: typeof value.getProperty === "function",
      hasSetProperty: typeof value.setProperty === "function",
      hasGetStencil: typeof value.getStencil === "function",
      hasRefresh: typeof value.refresh === "function",
      keys,
    };
  };

  const summarizeStorageValue = (value) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return value;
    }

    return summarizeBoundObject(value);
  };

  const getSafeOwnPropertyEntries = (value, limit = 18) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return [];
    }

    const out = [];
    let keys = [];
    try {
      keys = Object.getOwnPropertyNames(value).slice(0, limit);
    } catch {
      return out;
    }

    for (const key of keys) {
      let descriptor;
      try {
        descriptor = Object.getOwnPropertyDescriptor(value, key);
      } catch {
        continue;
      }

      if (!descriptor || typeof descriptor.get === "function") {
        continue;
      }

      if (!("value" in descriptor)) {
        continue;
      }

      out.push([key, descriptor.value]);
    }

    return out;
  };

  const isShapeLikeObject = (value) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return false;
    }

    const objectId = getObjectId(value);
    const stencilId = getStencilId(value);
    return Boolean(
      objectId ||
      stencilId ||
      typeof value.setProperty === "function" ||
      typeof value.getProperty === "function" ||
      typeof value.getStencil === "function",
    );
  };

  const getCandidateShapeObjects = (value) => {
    const candidates = [];

    if (isShapeLikeObject(value)) {
      candidates.push(value);
    }

    for (const [key, nested] of getSafeOwnPropertyEntries(value, 24)) {
      if (
        key === "shape" ||
        key === "_shape" ||
        key === "model" ||
        key === "node" ||
        key === "element" ||
        key === "oryxShape"
      ) {
        if (isShapeLikeObject(nested)) {
          candidates.push(nested);
        }
      }
    }

    return candidates;
  };

  const scoreShapeCandidate = (value, targetId = "", preferTaskType = false) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return -1;
    }

    const normalizedId = extractShapeId(targetId);
    const objectId = extractShapeId(getObjectId(value));
    const stencilId = getStencilId(value).toLowerCase();
    const hasTaskTypeProperty = supportsTaskTypeProperty(value);
    const hasSetProperty = typeof value.setProperty === "function";
    const hasGetProperty = typeof value.getProperty === "function";

    if (normalizedId && objectId && objectId !== normalizedId) {
      return -1;
    }

    if (normalizedId && !objectId) {
      return -1;
    }

    let score = 0;

    if (normalizedId && objectId === normalizedId) {
      score += 1000;
    }
    if (hasTaskTypeProperty) {
      score += 240;
    }
    if (preferTaskType && hasTaskTypeProperty) {
      score += 200;
    }
    if (stencilId.includes("task") && !stencilId.includes("subprocess")) {
      score += 120;
    } else if (stencilId.includes("activity")) {
      score += 80;
    }
    if (hasSetProperty) {
      score += 40;
    }
    if (hasGetProperty) {
      score += 25;
    }
    if (objectId) {
      score += 15;
    }
    if (stencilId) {
      score += 10;
    }

    return score;
  };

  const getLikelyNestedShapeValues = (value) => {
    const nested = [];
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return nested;
    }

    for (const key of [
      "shape",
      "_shape",
      "model",
      "node",
      "element",
      "oryxShape",
      "children",
      "childShapes",
      "nodes",
      "shapes",
      "_children",
      "_childShapes",
      "_nodes",
      "_shapes",
      "canvas",
      "_canvas",
    ]) {
      let candidate;
      try {
        candidate = value[key];
      } catch {
        continue;
      }

      if (!candidate) {
        continue;
      }

      if (Array.isArray(candidate)) {
        nested.push(...candidate);
      } else {
        nested.push(candidate);
      }
    }

    for (const methodName of ["getChildShapes", "getChildren", "getChildNodes", "getNodes"]) {
      try {
        if (typeof value[methodName] === "function") {
          const result = value[methodName]();
          if (Array.isArray(result)) {
            nested.push(...result);
          } else if (result) {
            nested.push(...normalizeCollection(result));
          }
        }
      } catch {}
    }

    return nested;
  };

  const findMatchingShapeObject = (
    value,
    targetId,
    depth = 3,
    seen = new Set(),
    preferTaskType = false,
  ) => {
    if (!value || (typeof value !== "object" && typeof value !== "function") || depth < 0) {
      return null;
    }
    if (seen.has(value)) {
      return null;
    }
    seen.add(value);

    const normalizedId = extractShapeId(targetId);
    let bestCandidate = null;
    let bestScore = -1;

    const considerCandidate = (candidate) => {
      if (!candidate || !isShapeLikeObject(candidate)) {
        return;
      }

      const score = scoreShapeCandidate(candidate, normalizedId, preferTaskType);
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    };

    considerCandidate(value);

    for (const candidate of getCandidateShapeObjects(value)) {
      considerCandidate(candidate);
    }

    if (bestCandidate && (normalizedId || bestScore >= 80)) {
      return bestCandidate;
    }

    if (depth === 0) {
      return null;
    }

    for (const nested of getLikelyNestedShapeValues(value)) {
      const found = findMatchingShapeObject(nested, normalizedId, depth - 1, seen, preferTaskType);
      if (found) {
        return found;
      }
    }

    for (const [, nested] of getSafeOwnPropertyEntries(value, 24)) {
      const found = findMatchingShapeObject(nested, normalizedId, depth - 1, seen, preferTaskType);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const resolveShapeFromElementBindings = (targetId) => {
    const normalizedId = extractShapeId(targetId);
    const target = lastShapePointerTarget instanceof Element
      ? lastShapePointerTarget
      : lastPointerTarget instanceof Element
        ? lastPointerTarget
        : null;
    if (!normalizedId || !target) {
      return null;
    }

    const seen = new Set();
    let current = target;
    let depth = 0;

    while (current && depth < 8) {
      const directValues = [
        ...getSafeOwnPropertyEntries(current, 60).map(([, value]) => value),
      ];

      if (
        window.Element &&
        window.Element.Storage &&
        typeof window.Element.Storage.get === "function"
      ) {
        try {
          const raw = window.Element.Storage.get(current);
          if (raw && typeof raw === "object") {
            directValues.push(...Object.values(raw));
          }
        } catch {}
      }

      for (const value of directValues) {
        const candidate = findMatchingShapeObject(value, normalizedId, 3, seen, true);
        if (candidate) {
          const candidateId = getObjectId(candidate);
          if (extractShapeId(candidateId) === normalizedId) {
            return candidate;
          }
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  };

  const resolveNearestShapeFromElementBindings = () => {
    const target = lastShapePointerTarget instanceof Element
      ? lastShapePointerTarget
      : lastPointerTarget instanceof Element
        ? lastPointerTarget
        : null;
    if (!target) {
      return null;
    }

    const seen = new Set();
    let current = target;
    let depth = 0;

    while (current && depth < 8) {
      const directValues = [
        ...getSafeOwnPropertyEntries(current, 60).map(([, value]) => value),
      ];

      if (
        window.Element &&
        window.Element.Storage &&
        typeof window.Element.Storage.get === "function"
      ) {
        try {
          const raw = window.Element.Storage.get(current);
          if (raw && typeof raw === "object") {
            directValues.push(...Object.values(raw));
          }
        } catch {}
      }

      for (const value of directValues) {
        const candidate = findMatchingShapeObject(value, "", 3, seen, true);
        if (candidate) {
          return candidate;
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  };

  const cachePointerShapeBinding = (targetId, targetElement) => {
    const normalizedId = extractShapeId(targetId);
    if (!normalizedId) {
      return null;
    }

    if (
      lastResolvedShapeObject &&
      extractShapeId(getObjectId(lastResolvedShapeObject)) === normalizedId
    ) {
      return lastResolvedShapeObject;
    }

    const previousTarget = lastShapePointerTarget;
    if (targetElement instanceof Element) {
      lastShapePointerTarget = targetElement;
    }

    const resolved =
      resolveShapeFromElementBindings(normalizedId) ||
      findShapeByIdInFacade(findEditorFacade(), normalizedId) ||
      null;

    if (resolved) {
      lastResolvedShapeObject = resolved;
    }

    lastShapePointerTarget = previousTarget;
    return resolved;
  };

  const findShapeByIdInFacade = (facade, targetId) => {
    const normalizedId = extractShapeId(targetId);
    if (!facade || !normalizedId) {
      return null;
    }

    const roots = [];
    roots.push(facade);

    try {
      if (typeof facade.getCanvas === "function") {
        const canvas = facade.getCanvas();
        if (canvas) {
          roots.push(canvas);
        }
      }
    } catch {}

    for (const root of roots) {
      const found = findMatchingShapeObject(root, normalizedId, 6, new Set(), true);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const searchForShapeRefs = (targetId) => {
    if (!targetId) {
      return [];
    }

    const roots = [];
    for (const [key, value] of getSafeOwnPropertyEntries(window, 260)) {
      if (value && (typeof value === "object" || typeof value === "function")) {
        roots.push({ path: `window.${key}`, value });
      }
    }

    const seen = new Set();
    const stack = roots.slice(0, 180);
    const matches = [];
    let budget = 2200;

    while (stack.length > 0 && budget > 0 && matches.length < 12) {
      const current = stack.pop();
      budget -= 1;
      if (!current) {
        continue;
      }

      const value = current.value;
      if (!value || (typeof value !== "object" && typeof value !== "function")) {
        continue;
      }
      if (seen.has(value)) {
        continue;
      }
      seen.add(value);

      const objectId = getObjectId(value);
      if (objectId && objectId === targetId) {
        matches.push({
          path: current.path,
          value,
          objectId,
          keys: Object.getOwnPropertyNames(value).slice(0, 20),
          hasSetProperty: typeof value.setProperty === "function",
          hasGetProperty: typeof value.getProperty === "function",
          hasGetStencil: typeof value.getStencil === "function",
          stencilId: getStencilId(value),
        });
      }

      for (const [key, nested] of getSafeOwnPropertyEntries(value, 18)) {
        if (!nested || (typeof nested !== "object" && typeof nested !== "function")) {
          continue;
        }
        if (seen.has(nested)) {
          continue;
        }
        stack.push({ path: `${current.path}.${key}`, value: nested });
      }
    }

    return matches;
  };

  const resolveShapeById = (targetId) => {
    const normalizedId = extractShapeId(targetId);
    if (!normalizedId) {
      return null;
    }

    if (
      lastResolvedShapeObject &&
      extractShapeId(getObjectId(lastResolvedShapeObject)) === normalizedId
    ) {
      return lastResolvedShapeObject;
    }

    const boundShape = resolveShapeFromElementBindings(normalizedId);
    if (boundShape) {
      lastResolvedShapeObject = boundShape;
      return boundShape;
    }

    const facade = findEditorFacade();
    const facadeShape = findShapeByIdInFacade(facade, normalizedId);
    if (facadeShape) {
      lastResolvedShapeObject = facadeShape;
      return facadeShape;
    }

    const matches = searchForShapeRefs(normalizedId);
    const bestMatch = matches.find((match) => match.hasSetProperty || match.hasGetStencil) || matches[0];
    if (!bestMatch) {
      return null;
    }

    lastResolvedShapeObject = bestMatch.value || null;
    return lastResolvedShapeObject;
  };

  const getPointerSelectedShape = () => {
    const targetId = getPointerShapeId();
    if (targetId) {
      const resolved = resolveShapeById(targetId);
      if (resolved) {
        return resolved;
      }
    }

    return resolveNearestShapeFromElementBindings();
  };

  const getSelectionShapeId = (selectedShapes) => {
    const firstShape = selectedShapes[0] || null;
    const shapeId = firstShape ? getObjectId(firstShape) : "";
    if (shapeId) {
      return shapeId;
    }

    const pointerShapeId = getPointerShapeId();
    return pointerShapeId || null;
  };

  const isTaskLikeShape = (shape) => {
    const stencil = getStencilId(shape).toLowerCase();
    return stencil.includes("task") || stencil.includes("activity");
  };

  const getCachedTaskType = (shapeId) => {
    const normalizedId = extractShapeId(shapeId);
    if (!normalizedId || !lastKnownTaskTypes.has(normalizedId)) {
      return null;
    }

    return normalizeTaskType(lastKnownTaskTypes.get(normalizedId));
  };

  const rememberTaskType = (shapeId, taskTypeValue) => {
    const normalizedId = extractShapeId(shapeId);
    const normalizedTaskType = normalizeTaskType(taskTypeValue);
    if (!normalizedId || !normalizedTaskType) {
      return;
    }

    lastKnownTaskTypes.set(normalizedId, getTaskTypeOptionLabel(normalizedTaskType));
  };

  const getDirectTaskTypeValue = (taskType) => {
    const normalized = normalizeTaskType(taskType);
    if (!normalized || normalized === "none") {
      return "";
    }

    return getTaskTypeOptionLabel(normalized);
  };

  const supportsTaskTypeProperty = (shape) => {
    if (!shape) {
      return false;
    }

    try {
      if (typeof shape.getStencil === "function") {
        const stencil = shape.getStencil();
        if (stencil && typeof stencil.property === "function") {
          const property = stencil.property("oryx-tasktype");
          if (property !== undefined && property !== null) {
            return true;
          }
        }
      }
    } catch {}

    const stencilId = getStencilId(shape).toLowerCase();
    return (stencilId.includes("task") && !stencilId.includes("subprocess")) || stencilId.includes("activity");
  };

  const hasPointerSelection = () => Boolean(getPointerShapeId());

  const getPropertyWindowTitle = () => {
    const titleNode = document.querySelector("#property-window-header-title");
    return titleNode ? (titleNode.textContent || "").trim() : "";
  };

  const getVisibleTextElements = () => {
    return Array.from(document.querySelectorAll("body *")).filter(
      (node) => node instanceof Element && isVisibleElement(node),
    );
  };

  const normalizeVisibleText = (value) => {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const isTaskTypeText = (value) => {
    const text = normalizeVisibleText(value);
    return text === "task type";
  };

  const getTaskTypeTextCandidates = () => {
    const selectors = [
      "#east-panel *",
      "#property-window-header-component ~ * *",
      "#oryx_canvas_htmlContainer ~ * *",
      "body *",
    ];

    const seen = new Set();
    const matches = [];

    for (const selector of selectors) {
      let nodes = [];
      try {
        nodes = Array.from(document.querySelectorAll(selector));
      } catch {
        nodes = [];
      }

      for (const node of nodes) {
        if (!(node instanceof Element) || seen.has(node)) {
          continue;
        }
        seen.add(node);

        const text = node.textContent || "";
        if (!isTaskTypeText(text)) {
          continue;
        }

        matches.push(node);
      }
    }

    return matches.sort((left, right) => {
      const leftLength = normalizeVisibleText(left.textContent || "").length;
      const rightLength = normalizeVisibleText(right.textContent || "").length;
      return leftLength - rightLength;
    });
  };

  const hasVisibleTaskTypeRow = () => {
    return getTaskTypeTextCandidates().some((node) => isVisibleElement(node));
  };

  const isDomTaskContext = () => {
    const title = getPropertyWindowTitle().toLowerCase();
    return title.includes("task") || hasVisibleTaskTypeRow();
  };

  const dispatchMouseClick = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    const options = { bubbles: true, cancelable: true, view: window };
    element.dispatchEvent(new MouseEvent("pointerdown", options));
    element.dispatchEvent(new MouseEvent("mousedown", options));
    element.dispatchEvent(new MouseEvent("mouseup", options));
    element.dispatchEvent(new MouseEvent("click", options));
  };

  const dispatchMouseDoubleClick = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    dispatchMouseClick(element);
    dispatchMouseClick(element);
    element.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
  };

  const dispatchKeyboard = (element, key) => {
    if (!(element instanceof Element)) {
      return;
    }

    const options = { key, bubbles: true, cancelable: true };
    element.dispatchEvent(new KeyboardEvent("keydown", options));
    element.dispatchEvent(new KeyboardEvent("keypress", options));
    element.dispatchEvent(new KeyboardEvent("keyup", options));
  };

  const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const getEditorReadySnapshot = () => {
    const facade = findEditorFacade();
    const canvasVisible =
      isVisibleSelector("#oryx_canvas") ||
      isVisibleSelector("#oryx_canvas_htmlContainer") ||
      isVisibleSelector("svg");
    const toolbarVisible =
      isVisibleSelector(".toolbar") ||
      isVisibleSelector("[class*='toolbar']") ||
      isVisibleSelector("[id*='editor-north']");
    const facadeReady = Boolean(
      facade &&
      typeof facade.getCanvas === "function" &&
      (typeof facade.getSelection === "function" || typeof facade.executeCommands === "function"),
    );
    const extReady = Boolean(window.Ext && window.Ext.ComponentMgr);

    return {
      canvasVisible,
      toolbarVisible,
      facadeReady,
      extReady,
      loadingVisible: hasVisibleLoadingUi(),
    };
  };

  const isEditorReady = () => {
    const snapshot = getEditorReadySnapshot();
    return (
      snapshot.canvasVisible &&
      snapshot.toolbarVisible &&
      snapshot.extReady &&
      snapshot.facadeReady &&
      !snapshot.loadingVisible
    );
  };

  const waitForEditorReady = async (timeoutMs = 15000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (isEditorReady()) {
        return true;
      }

      await delay(150);
    }

    return isEditorReady();
  };

  const getTaskTypeOptionLabel = (taskType) => {
    const normalized = normalizeTaskType(taskType);
    const labels = {
      none: "None",
      send: "Send",
      receive: "Receive",
      user: "User",
      manual: "Manual",
      service: "Service",
      "business-rule": "Business Rule",
      script: "Script",
    };

    return normalized ? labels[normalized] || "None" : "None";
  };

  const findTaskTypeRowElements = () => {
    const candidates = getTaskTypeTextCandidates()
      .map((labelNode) => {
        const row =
          labelNode.closest("tr") ||
          labelNode.closest(".x-grid3-row") ||
          labelNode.closest(".x-grid-panel") ||
          labelNode.parentElement;
        if (!(row instanceof Element) || !isVisibleElement(row)) {
          return null;
        }

        const cells = row.querySelectorAll("td, .x-grid3-cell");
        const valueCell =
          cells.length > 1
            ? cells[1]
            : labelNode.closest("td")?.nextElementSibling || row.querySelector("input, .x-form-field-wrap");
        const panelText = normalizeVisibleText(
          row.closest(".x-panel-body, .x-panel, #east-panel, body")?.textContent || "",
        );
        const rowText = normalizeVisibleText(row.textContent || "");
        const score =
          (panelText.includes("main attributes") ? 100 : 0) +
          (rowText.includes("receive") ||
          rowText.includes("send") ||
          rowText.includes("service") ||
          rowText.includes("manual") ||
          rowText.includes("script") ||
          rowText.includes("business rule") ||
          rowText.includes("user") ||
          rowText.includes("none")
            ? 20
            : 0) -
          rowText.length;

        return {
          labelNode,
          row,
          valueCell: valueCell || row,
          score,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score);

    return candidates[0] || null;
  };

  const findVisibleOptionElement = (label) => {
    const exactLabel = String(label || "").trim().toLowerCase();
    if (!exactLabel) {
      return null;
    }

    return getVisibleTextElements().find((node) => {
      const text = (node.textContent || "").trim().toLowerCase();
      if (!text || text.length > 40) {
        return false;
      }
      return text === exactLabel;
    }) || null;
  };

  const getVisibleEditorFields = () => {
    return Array.from(
      document.querySelectorAll("input, textarea, select, .x-form-field"),
    ).filter((node) => node instanceof Element && isVisibleElement(node));
  };

  const activateTaskTypeEditor = async (rowParts) => {
    const before = new Set(getVisibleEditorFields());
    const targets = [rowParts.valueCell, rowParts.row].filter((node) => node instanceof Element);
    for (const target of targets) {
      target.focus?.();
      dispatchMouseClick(target);
      await delay(20);
      dispatchMouseDoubleClick(target);
      await delay(35);
      dispatchKeyboard(target, "Enter");
      await delay(20);
      dispatchKeyboard(target, "F2");
      await delay(35);

      const activeElement = document.activeElement instanceof Element ? document.activeElement : null;
      if (
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName) &&
        rowParts.row.contains(activeElement) &&
        isVisibleElement(activeElement)
      ) {
        return activeElement;
      }

      const after = getVisibleEditorFields();
      const added = after.find((field) => !before.has(field) && rowParts.row.contains(field));
      if (added) {
        return added;
      }

      const nearby = after.find((field) => rowParts.row.contains(field) || rowParts.valueCell.contains(field));
      if (nearby) {
        return nearby;
      }
    }

    return null;
  };

  const getExtComponents = () => {
    const ext = window.Ext;
    if (!ext || !ext.ComponentMgr || !ext.ComponentMgr.all) {
      return [];
    }

    const collection = ext.ComponentMgr.all;
    const items = [];

    try {
      if (Array.isArray(collection.items)) {
        return collection.items.filter(Boolean);
      }
    } catch {}

    try {
      if (typeof collection.each === "function") {
        collection.each((item) => {
          if (item) {
            items.push(item);
          }
        });
      }
    } catch {}

    return items;
  };

  const getExtCmp = (id) => {
    const ext = window.Ext;
    if (!ext || typeof ext.getCmp !== "function" || !id) {
      return null;
    }

    try {
      return ext.getCmp(id) || null;
    } catch {
      return null;
    }
  };

  const getExtComponentElement = (component) => {
    if (!component) {
      return null;
    }

    const candidates = [
      component.el,
      component.wrap,
      component.container,
      component.getEl && component.getEl(),
    ];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      if (candidate.dom instanceof Element) {
        return candidate.dom;
      }
      if (candidate instanceof Element) {
        return candidate;
      }
    }

    if (component.id) {
      const byId = document.getElementById(component.id);
      if (byId) {
        return byId;
      }
    }

    return null;
  };

  const isEastPanelExpanded = () => {
    const panel = document.getElementById("east-panel");
    if (!(panel instanceof Element) || !isVisibleElement(panel)) {
      return false;
    }

    const rect = panel.getBoundingClientRect();
    return rect.width > 120 && rect.height > 120;
  };

  const findAttributesToggleElement = () => {
    const viewportWidth = window.innerWidth || 0;
    const matches = getVisibleTextElements()
      .filter((node) => {
        const text = normalizeVisibleText(node.textContent || "");
        if (!text) {
          return false;
        }

        const relevant =
          text === "attributes" ||
          text.includes("attributes views variants") ||
          text.includes("attributes") ||
          text.includes("views") ||
          text.includes("variants");
        if (!relevant) {
          return false;
        }

        const rect = node.getBoundingClientRect();
        return rect.right >= viewportWidth - 140;
      })
      .sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        const leftScore =
          (leftRect.right >= viewportWidth - 80 ? 200 : 0) +
          (leftRect.height > leftRect.width ? 80 : 0) -
          leftRect.width;
        const rightScore =
          (rightRect.right >= viewportWidth - 80 ? 200 : 0) +
          (rightRect.height > rightRect.width ? 80 : 0) -
          rightRect.width;
        return rightScore - leftScore;
      });

    for (const node of matches) {
      const clickable =
        node.closest(
          "button, [role='button'], a, .x-btn, .x-tab-strip-text, .x-tab-strip-wrap, .x-panel-header, [class*='tab']",
        ) || node;
      if (clickable instanceof Element && isVisibleElement(clickable)) {
        return clickable;
      }
    }

    return null;
  };

  const findRightRailToggleCandidates = () => {
    if (typeof document.elementsFromPoint !== "function") {
      return [];
    }

    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const xs = [viewportWidth - 8, viewportWidth - 16, viewportWidth - 28, viewportWidth - 42].filter(
      (value) => value > 0,
    );
    const ys = [
      viewportHeight * 0.2,
      viewportHeight * 0.35,
      viewportHeight * 0.5,
      viewportHeight * 0.65,
      viewportHeight * 0.8,
    ].map((value) => Math.max(1, Math.floor(value)));
    const seen = new Set();
    const matches = [];

    for (const x of xs) {
      for (const y of ys) {
        let elements = [];
        try {
          elements = document.elementsFromPoint(x, y);
        } catch {
          elements = [];
        }

        for (const element of elements) {
          if (!(element instanceof Element) || seen.has(element)) {
            continue;
          }
          seen.add(element);

          const clickable =
            element.closest(
              "button, [role='button'], a, .x-btn, .x-tab-strip-text, .x-tab-strip-wrap, .x-panel-header, [class*='tab'], [class*='panel']",
            ) || element;
          if (!(clickable instanceof Element) || !isVisibleElement(clickable)) {
            continue;
          }

          const haystack = [
            clickable.textContent || "",
            clickable.getAttribute("title") || "",
            clickable.getAttribute("aria-label") || "",
            clickable.id || "",
            clickable.className && typeof clickable.className === "string"
              ? clickable.className
              : String(clickable.className || ""),
          ]
            .join(" ")
            .toLowerCase();

          if (
            haystack.includes("attribute") ||
            haystack.includes("variant") ||
            haystack.includes("view") ||
            haystack.includes("east-panel") ||
            clickable.getBoundingClientRect().right >= viewportWidth - 60
          ) {
            matches.push(clickable);
          }
        }
      }
    }

    return matches.filter((candidate, index) => matches.indexOf(candidate) === index);
  };

  const findEastPanelComponentCandidates = () => {
    return getExtComponents()
      .map((component) => {
        const element = getExtComponentElement(component);
        const summary = summarizeExtComponent(component);
        const haystack = [
          summary.id,
          summary.xtype,
          summary.name,
          summary.hiddenName,
          summary.fieldLabel,
          summary.text,
          component.region,
          component.title,
        ]
          .join(" ")
          .toLowerCase();

        let score = 0;
        if (summary.id === "east-panel" || haystack.includes("east-panel")) {
          score += 400;
        }
        if (haystack.includes("attribute")) {
          score += 220;
        }
        if (haystack.includes("property")) {
          score += 200;
        }
        if (haystack.includes("variant") || haystack.includes("view")) {
          score += 60;
        }
        if (String(component.region || "").toLowerCase() === "east") {
          score += 220;
        }
        if (element && element.getBoundingClientRect().right >= (window.innerWidth || 0) - 120) {
          score += 80;
        }

        return {
          component,
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.component);
  };

  const setEastPanelExpanded = async (expanded) => {
    if (isEastPanelExpanded() === expanded) {
      return true;
    }

    const extCandidates = [getExtCmp("east-panel"), ...findEastPanelComponentCandidates()].filter(Boolean);
    for (const panelCmp of extCandidates) {
      try {
        if (expanded && typeof panelCmp.expand === "function") {
          panelCmp.expand();
        } else if (!expanded && typeof panelCmp.collapse === "function") {
          panelCmp.collapse();
        } else if (expanded && typeof panelCmp.show === "function") {
          panelCmp.show();
        } else if (!expanded && typeof panelCmp.hide === "function") {
          panelCmp.hide();
        }
      } catch {}

      await delay(220);
      if (isEastPanelExpanded() === expanded) {
        return true;
      }
    }

    const toggle = findAttributesToggleElement();
    const rightRailToggles = findRightRailToggleCandidates();
    for (const toggleCandidate of [toggle, ...rightRailToggles]) {
      if (!toggleCandidate) {
        continue;
      }

      dispatchMouseClick(toggleCandidate);
      await delay(220);
      if (isEastPanelExpanded() === expanded) {
        break;
      }

      dispatchMouseClick(toggleCandidate);
      await delay(220);
      if (isEastPanelExpanded() === expanded) {
        break;
      }
    }

    return isEastPanelExpanded() === expanded;
  };

  const dispatchPointClick = (x, y) => {
    if (typeof document.elementsFromPoint !== "function") {
      return false;
    }

    let elements = [];
    try {
      elements = document.elementsFromPoint(x, y);
    } catch {
      elements = [];
    }

    for (const element of elements) {
      if (!(element instanceof Element) || !isVisibleElement(element)) {
        continue;
      }

      const options = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
      };

      element.dispatchEvent(new MouseEvent("pointerdown", options));
      element.dispatchEvent(new MouseEvent("mousedown", options));
      element.dispatchEvent(new MouseEvent("mouseup", options));
      element.dispatchEvent(new MouseEvent("click", options));
      return true;
    }

    return false;
  };

  const forceRightRailOpen = async () => {
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const xs = [viewportWidth - 4, viewportWidth - 10, viewportWidth - 18, viewportWidth - 28].filter(
      (value) => value > 0,
    );
    const ys = [
      viewportHeight * 0.18,
      viewportHeight * 0.28,
      viewportHeight * 0.4,
      viewportHeight * 0.52,
      viewportHeight * 0.64,
      viewportHeight * 0.78,
    ].map((value) => Math.max(1, Math.floor(value)));

    for (const x of xs) {
      for (const y of ys) {
        if (!dispatchPointClick(x, y)) {
          continue;
        }

        await delay(160);
        if (isEastPanelExpanded()) {
          return true;
        }

        dispatchPointClick(x, y);
        await delay(160);
        if (isEastPanelExpanded()) {
          return true;
        }
      }
    }

    return isEastPanelExpanded();
  };

  const reselectCurrentShapeOnCanvas = async () => {
    const facade = findEditorFacade();
    const selectedShapes = facade ? getSelectedShapes(facade) : [];
    const shapeId = getSelectionShapeId(selectedShapes) || getPointerShapeId();
    const shapeElement = findShapeAnchorElement(shapeId);
    if (!(shapeElement instanceof Element)) {
      return false;
    }

    shapeElement.focus?.();
    dispatchMouseClick(shapeElement);
    await delay(120);
    dispatchMouseClick(shapeElement);
    await delay(140);
    return true;
  };

  const waitForTaskTypeRow = async (timeoutMs = 1800) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const row = findTaskTypeRowElements();
      if (row) {
        return row;
      }
      await delay(80);
    }

    return null;
  };

  const summarizeExtComponent = (component) => {
    const element = getExtComponentElement(component);
    return {
      id: component && component.id ? String(component.id) : "",
      xtype: component && component.xtype ? String(component.xtype) : "",
      name: component && component.name ? String(component.name) : "",
      hiddenName: component && component.hiddenName ? String(component.hiddenName) : "",
      fieldLabel: component && component.fieldLabel ? String(component.fieldLabel) : "",
      value: component && component.getValue ? String(component.getValue() ?? "") : "",
      rawValue: component && component.getRawValue ? String(component.getRawValue() ?? "") : "",
      visible: element ? isVisibleElement(element) : false,
      text: element ? (element.textContent || "").trim().slice(0, 120) : "",
      tag: element ? element.tagName : "",
    };
  };

  const findTaskTypeExtComponent = () => {
    const labelNode = findTaskTypeRowElements()?.labelNode || null;
    const row = labelNode
      ? labelNode.closest("tr") || labelNode.closest(".x-grid3-row") || labelNode.parentElement
      : null;

    const candidates = getExtComponents().filter((component) => {
      const summary = summarizeExtComponent(component);
      const fieldLabel = normalizeVisibleText(summary.fieldLabel);
      const haystack = [
        summary.id,
        summary.xtype,
        summary.name,
        summary.hiddenName,
        summary.fieldLabel,
        summary.value,
        summary.rawValue,
        summary.text,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack) {
        return false;
      }

      const element = getExtComponentElement(component);
      const attachedToRow = Boolean(row && element && row.contains(element));
      return attachedToRow || fieldLabel === "task type" || haystack.includes("oryx-tasktype");
    });

    return candidates.find((component) => {
      return (
        typeof component.setValue === "function" &&
        (typeof component.expand === "function" ||
          typeof component.onTriggerClick === "function" ||
          typeof component.getStore === "function")
      );
    }) || null;
  };

  const setExtComboValue = (component, label) => {
    if (!component || typeof component.setValue !== "function") {
      return false;
    }

    try {
      component.setValue(label);
      if (typeof component.fireEvent === "function") {
        component.fireEvent("select", component, null, 0);
        component.fireEvent("change", component, label);
      }
      if (typeof component.collapse === "function") {
        component.collapse();
      }
      return true;
    } catch {}

    return false;
  };

  const getExtStoreRecords = (componentOrStore) => {
    const store =
      componentOrStore && typeof componentOrStore.getStore === "function"
        ? componentOrStore.getStore()
        : componentOrStore && componentOrStore.store
          ? componentOrStore.store
          : componentOrStore;

    if (!store) {
      return [];
    }

    try {
      if (typeof store.getRange === "function") {
        const range = store.getRange();
        if (Array.isArray(range) && range.length > 0) {
          return range.filter(Boolean);
        }
      }
    } catch {}

    try {
      if (store.data) {
        if (Array.isArray(store.data.items)) {
          return store.data.items.filter(Boolean);
        }

        if (typeof store.data.each === "function") {
          const items = [];
          store.data.each((item) => {
            if (item) {
              items.push(item);
            }
          });
          if (items.length > 0) {
            return items;
          }
        }
      }
    } catch {}

    try {
      if (Array.isArray(store.items)) {
        return store.items.filter(Boolean);
      }
    } catch {}

    return [];
  };

  const getExtRecordData = (record) => {
    if (!record || typeof record !== "object") {
      return null;
    }

    if (record.data && typeof record.data === "object") {
      return record.data;
    }

    return null;
  };

  const getExtRecordPropId = (record) => {
    const data = getExtRecordData(record);
    const gridProperties =
      (data && data.gridProperties && typeof data.gridProperties === "object" ? data.gridProperties : null) ||
      (record && typeof record.get === "function" ? record.get("gridProperties") : null);

    const propId =
      (gridProperties && gridProperties.propId) ||
      (data && (data.propId || data.propertyId || data.propertyName)) ||
      "";

    return String(propId || "");
  };

  const getExtRecordValue = (record) => {
    const data = getExtRecordData(record);
    const dataValue =
      (data && (data.value ?? data.displayValue ?? data.rawValue ?? data.text)) ||
      "";
    if (dataValue !== "") {
      return String(dataValue);
    }

    if (record && typeof record.get === "function") {
      for (const key of ["value", "displayValue", "rawValue", "text"]) {
        try {
          const value = record.get(key);
          if (value != null && value !== "") {
            return String(value);
          }
        } catch {}
      }
    }

    return "";
  };

  const setExtRecordValue = (record, value) => {
    let changed = false;

    try {
      if (record && typeof record.beginEdit === "function") {
        record.beginEdit();
      }
    } catch {}

    try {
      if (record && typeof record.set === "function") {
        record.set("value", value);
        changed = true;
      }
    } catch {}

    try {
      if (record && record.data && typeof record.data === "object") {
        record.data.value = value;
        changed = true;
      }
    } catch {}

    try {
      if (record && typeof record.endEdit === "function") {
        record.endEdit();
      }
    } catch {}

    try {
      if (record && typeof record.commit === "function") {
        record.commit();
      }
    } catch {}

    return changed;
  };

  const getExtComponentLineage = (component) => {
    const lineage = [];
    const seen = new Set();
    let current = component;
    let depth = 0;

    while (current && depth < 10 && !seen.has(current)) {
      lineage.push(current);
      seen.add(current);

      let next = null;
      for (const key of [
        "ownerCt",
        "ownerContainer",
        "propertyWindow",
        "grid",
        "propertyGrid",
        "editor",
      ]) {
        try {
          if (current[key] && !seen.has(current[key])) {
            next = current[key];
            break;
          }
        } catch {}
      }

      current = next;
      depth += 1;
    }

    return lineage;
  };

  const primeTaskTypePropertyContext = async () => {
    const existingContext = findTaskTypePropertyContext();
    if (existingContext) {
      return true;
    }

    const wasExpanded = isEastPanelExpanded();
    let primed = false;

    for (let attempt = 0; attempt < 3 && !primed; attempt += 1) {
      if (!isEastPanelExpanded()) {
        await setEastPanelExpanded(true);
      }
      if (!isEastPanelExpanded()) {
        await forceRightRailOpen();
      }

      await reselectCurrentShapeOnCanvas();

      const rowBefore = await waitForTaskTypeRow(2500);
      const extComponent = findTaskTypeExtComponent();
      if (extComponent) {
        try {
          if (typeof extComponent.onTriggerClick === "function") {
            extComponent.onTriggerClick();
            await delay(140);
          } else if (typeof extComponent.expand === "function") {
            extComponent.expand();
            await delay(140);
          }
        } catch {}

        try {
          if (typeof extComponent.collapse === "function") {
            extComponent.collapse();
          }
        } catch {}
      }

      const rowParts = rowBefore || (await waitForTaskTypeRow(2500));
      if (rowParts) {
        const target = rowParts.valueCell instanceof Element ? rowParts.valueCell : rowParts.row;
        target.focus?.();
        dispatchMouseClick(target);
        await delay(120);

        const editorField = await activateTaskTypeEditor(rowParts);
        if (editorField instanceof Element) {
          dispatchKeyboard(editorField, "Escape");
          editorField.blur?.();
          await delay(80);
        }
      }

      await delay(120);

      const taskType = readTaskTypeFromDom();
      const shapeId = getSelectionShapeId(getSelectedShapes(findEditorFacade()));
      if (shapeId && taskType) {
        rememberTaskType(shapeId, taskType);
      }

      primed = Boolean(findTaskTypePropertyContext() || taskType);
    }

    if (!wasExpanded && isEastPanelExpanded()) {
      await setEastPanelExpanded(false);
    }

    return primed;
  };

  const findTaskTypePropertyContext = () => {
    const rowParts = findTaskTypeRowElements();
    const row = rowParts?.row || null;
    const candidates = [];

    for (const component of getExtComponents()) {
      const records = getExtStoreRecords(component);
      if (records.length === 0) {
        continue;
      }

      const record = records.find((entry) => getExtRecordPropId(entry) === "oryx-tasktype");
      if (!record) {
        continue;
      }

      const lineage = getExtComponentLineage(component);
      const handler =
        lineage.find((entry) => typeof entry.afterEdit === "function") ||
        null;
      const grid =
        lineage.find((entry) => typeof entry.fireEvent === "function" || typeof entry.getStore === "function") ||
        component;
      const facadeHolder =
        lineage.find((entry) => entry && entry.facade && typeof entry.facade.executeCommands === "function") ||
        lineage.find((entry) => typeof entry.executeCommands === "function") ||
        null;
      const facade =
        facadeHolder && facadeHolder.facade && typeof facadeHolder.facade.executeCommands === "function"
          ? facadeHolder.facade
          : facadeHolder && typeof facadeHolder.executeCommands === "function"
            ? facadeHolder
            : null;
      const element = getExtComponentElement(component);
      const summary = summarizeExtComponent(component);

      let score = 0;
      if (handler) {
        score += 240;
      }
      if (facade) {
        score += 200;
      }
      if (element && isVisibleElement(element)) {
        score += 80;
      }
      if (row && element && row.contains(element)) {
        score += 120;
      }
      if (summary.fieldLabel && normalizeVisibleText(summary.fieldLabel) === "task type") {
        score += 60;
      }
      if (
        [summary.id, summary.xtype, summary.name, summary.hiddenName, summary.text]
          .join(" ")
          .toLowerCase()
          .includes("oryx-tasktype")
      ) {
        score += 90;
      }

      candidates.push({
        score,
        component,
        grid,
        handler,
        facade,
        record,
      });
    }

    candidates.sort((left, right) => right.score - left.score);
    const best = candidates[0] || null;
    if (best?.facade) {
      lastResolvedFacade = best.facade;
    }
    return best;
  };

  const applyTaskTypeViaPropertyContext = (taskTypeLabel) => {
    const context = findTaskTypePropertyContext();
    if (!context) {
      return { ok: false, tried: false, error: "Task type property context not found" };
    }

    const storedValue = taskTypeLabel === "None" ? "" : taskTypeLabel;
    const oldValue = getExtRecordValue(context.record) || readTaskTypeFromDom() || "None";
    const option = {
      grid: context.grid || context.component || null,
      record: context.record,
      field: "value",
      value: storedValue,
      newValue: storedValue,
      displayValue: taskTypeLabel,
      rawValue: taskTypeLabel,
      oldValue,
      originalValue: oldValue,
    };

    let applied = false;

    try {
      if (
        context.grid &&
        context.grid.events &&
        context.grid.events.afteredit &&
        typeof context.grid.fireEvent === "function"
      ) {
        setExtRecordValue(context.record, storedValue);
        context.grid.fireEvent("afteredit", option);
        applied = true;
      }
    } catch {}

    if (!applied) {
      try {
        if (context.handler && typeof context.handler.afterEdit === "function") {
          setExtRecordValue(context.record, storedValue);
          context.handler.afterEdit.call(context.handler, option);
          applied = true;
        }
      } catch {}
    }

    if (!applied) {
      try {
        if (context.facade && typeof context.facade.executeCommands === "function") {
          const selectedShapes = getSelectedShapes(context.facade).filter(
            (shape) => supportsTaskTypeProperty(shape) || isTaskLikeShape(shape),
          );
          if (selectedShapes.length > 0) {
            const oldValues = new Map(
              selectedShapes.map((shape) => [shape, getShapeProperty(shape, "oryx-tasktype")]),
            );
            context.facade.executeCommands([
              {
                execute() {
                  for (const shape of selectedShapes) {
                    setShapeProperty(shape, "oryx-tasktype", storedValue);
                  }
                },
                rollback() {
                  for (const shape of selectedShapes) {
                    setShapeProperty(shape, "oryx-tasktype", oldValues.get(shape) || "");
                  }
                },
              },
            ]);
            refreshEditor(context.facade, selectedShapes);
            applied = true;
          }
        }
      } catch {}
    }

    if (applied) {
      setExtRecordValue(context.record, storedValue);

      if (context.facade) {
        const selectedShapes = getSelectedShapes(context.facade);
        for (const shape of selectedShapes) {
          rememberTaskType(getObjectId(shape), taskTypeLabel);
          if (taskTypeLabel === "None") {
            setShapeProperty(shape, "oryx-tasktype", "");
          }
        }
        refreshEditor(context.facade, selectedShapes);
      }

      try {
        if (context.grid && typeof context.grid.getView === "function") {
          context.grid.getView()?.refresh?.();
        }
      } catch {}

      return { ok: true, tried: true };
    }

    return { ok: false, tried: true, error: "Task type property command failed" };
  };

  const commitEditorField = async (editorField, component, label) => {
    const normalizedLabel = String(label || "");

    if (component) {
      try {
        if (typeof component.setRawValue === "function") {
          component.setRawValue(normalizedLabel);
        }
      } catch {}

      try {
        if (typeof component.setValue === "function") {
          component.setValue(normalizedLabel);
        }
      } catch {}

      try {
        if (typeof component.assertValue === "function") {
          component.assertValue();
        }
      } catch {}

      try {
        if (typeof component.fireEvent === "function") {
          component.fireEvent("change", component, normalizedLabel);
          component.fireEvent("select", component, null, 0);
        }
      } catch {}
    }

    if (editorField instanceof HTMLInputElement || editorField instanceof HTMLTextAreaElement) {
      editorField.focus();
      editorField.value = normalizedLabel;
      editorField.dispatchEvent(new Event("input", { bubbles: true }));
      editorField.dispatchEvent(new Event("change", { bubbles: true }));
      await delay(10);
      dispatchKeyboard(editorField, "ArrowDown");
      await delay(20);
      dispatchKeyboard(editorField, "Enter");
      await delay(20);
      editorField.blur();
      return true;
    }

    if (editorField instanceof HTMLSelectElement) {
      editorField.value = normalizedLabel;
      editorField.dispatchEvent(new Event("input", { bubbles: true }));
      editorField.dispatchEvent(new Event("change", { bubbles: true }));
      await delay(10);
      editorField.blur();
      return true;
    }

    return false;
  };

  const readTaskTypeFromDom = () => {
    const extComponent = findTaskTypeExtComponent();
    if (extComponent) {
      try {
        const extValue =
          (typeof extComponent.getRawValue === "function" && extComponent.getRawValue()) ||
          (typeof extComponent.getValue === "function" && extComponent.getValue()) ||
          "";
        const normalizedExtValue = normalizeTaskType(extValue);
        if (normalizedExtValue) {
          return normalizedExtValue;
        }
      } catch {}
    }

    const rowParts = findTaskTypeRowElements();
    if (!rowParts) {
      return null;
    }

    const rowText = ((rowParts.valueCell && rowParts.valueCell.textContent) || rowParts.row.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!rowText) {
      return null;
    }

    const labels = [
      ["business-rule", "business rule"],
      ["service", "service"],
      ["manual", "manual"],
      ["script", "script"],
      ["receive", "receive"],
      ["send", "send"],
      ["user", "user"],
      ["none", "none"],
    ];

    for (const [taskType, label] of labels) {
      if (rowText.includes(label)) {
        return taskType;
      }
    }

    return null;
  };

  const rectToPlainObject = (rect) => {
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const getElementRect = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }

    const directRect = rectToPlainObject(element.getBoundingClientRect());
    if (directRect) {
      return directRect;
    }

    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    for (const node of element.querySelectorAll("*")) {
      if (!(node instanceof Element)) {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      minTop = Math.min(minTop, rect.top);
      minLeft = Math.min(minLeft, rect.left);
      maxRight = Math.max(maxRight, rect.right);
      maxBottom = Math.max(maxBottom, rect.bottom);
    }

    if (!Number.isFinite(minTop) || !Number.isFinite(minLeft)) {
      return null;
    }

    return {
      top: minTop,
      right: maxRight,
      bottom: maxBottom,
      left: minLeft,
      width: maxRight - minLeft,
      height: maxBottom - minTop,
    };
  };

  const findShapeAnchorElement = (shapeId) => {
    const normalizedId = extractShapeId(shapeId);
    const escape = window.CSS && typeof window.CSS.escape === "function"
      ? window.CSS.escape.bind(window.CSS)
      : (value) => String(value || "");

    const selectorCandidates = normalizedId
      ? [
          `#${escape(normalizedId)}`,
          `[data-resource-id="${escape(normalizedId)}"]`,
          `[resource-id="${escape(normalizedId)}"]`,
          `[data-shape-id="${escape(normalizedId)}"]`,
          `[id^="${escape(normalizedId)}"]`,
        ]
      : [];

    for (const selector of selectorCandidates) {
      let nodes = [];
      try {
        nodes = Array.from(document.querySelectorAll(selector));
      } catch {
        nodes = [];
      }

      for (const node of nodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        const candidate =
          node.closest("g[id], [data-resource-id], [resource-id], [data-shape-id]") || node;
        if (candidate instanceof Element && getElementRect(candidate)) {
          return candidate;
        }
      }
    }

    if (lastPointerTarget instanceof Element) {
      const pointerCandidate =
        lastPointerTarget.closest("g[id], [data-resource-id], [resource-id], [data-shape-id]") ||
        lastPointerTarget;
      if (getElementRect(pointerCandidate)) {
        return pointerCandidate;
      }
    }

    return null;
  };

  const getSelectionAnchorRect = (selectedShapes) => {
    const firstShape = selectedShapes[0] || null;
    const firstShapeId = firstShape ? getObjectId(firstShape) : "";
    const shapeElement = findShapeAnchorElement(firstShapeId || getPointerShapeId());
    if (shapeElement) {
      return getElementRect(shapeElement);
    }

    const taskTypeRow = findTaskTypeRowElements()?.row || null;
    if (taskTypeRow instanceof Element) {
      return getElementRect(taskTypeRow);
    }

    return null;
  };

  const applyTaskTypeActionDom = async (taskType) => {
    const targetLabel = getTaskTypeOptionLabel(taskType);
    const propertyContextResult = applyTaskTypeViaPropertyContext(targetLabel);
    if (propertyContextResult.ok) {
      await delay(20);
      return { ok: true };
    }

    const extComponent = findTaskTypeExtComponent();
    if (extComponent && setExtComboValue(extComponent, targetLabel)) {
      await delay(20);
      return { ok: true };
    }

    const rowParts = findTaskTypeRowElements();
    if (!rowParts) {
      return { ok: false, error: "Task type row not found" };
    }

    const existingTrigger =
      rowParts.row.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']") ||
      rowParts.valueCell.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']");
    if (existingTrigger) {
      dispatchMouseClick(existingTrigger);
      await delay(40);
      const directOption = findVisibleOptionElement(targetLabel);
      if (directOption) {
        dispatchMouseClick(directOption);
        await delay(40);
        return { ok: true };
      }
    }

    const editorField = await activateTaskTypeEditor(rowParts);
    const activeComponent = editorField instanceof Element ? getExtCmp(editorField.id || "") : null;

    const afterActivationContextResult = applyTaskTypeViaPropertyContext(targetLabel);
    if (afterActivationContextResult.ok) {
      if (editorField instanceof Element) {
        dispatchKeyboard(editorField, "Escape");
        editorField.blur?.();
      }
      await delay(20);
      return { ok: true };
    }

    if (editorField && (await commitEditorField(editorField, activeComponent, targetLabel))) {
      await delay(40);
      return { ok: true };
    }

    const localTrigger =
      existingTrigger ||
      (editorField instanceof Element
        ? editorField.parentElement?.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']")
        : null);
    if (localTrigger) {
      dispatchMouseClick(localTrigger);
      await delay(40);
    }

    let option = findVisibleOptionElement(targetLabel);
    if (!option) {
      const comboInput = Array.from(
        document.querySelectorAll("input, textarea"),
      ).find((node) => node instanceof HTMLInputElement && isVisibleElement(node));

      if (comboInput instanceof HTMLInputElement) {
        comboInput.focus();
        comboInput.value = targetLabel;
        comboInput.dispatchEvent(new Event("input", { bubbles: true }));
        comboInput.dispatchEvent(new Event("change", { bubbles: true }));
        comboInput.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
        );
        await delay(40);
      }

      option = findVisibleOptionElement(targetLabel);
    }

    if (!option) {
      return { ok: false, error: `Task type option not found: ${targetLabel}` };
    }

    dispatchMouseClick(option);
    await delay(40);
    return { ok: true };
  };

  const getShapeProperty = (shape, key) => {
    if (!shape || !key) {
      return undefined;
    }

    try {
      if (typeof shape.getProperty === "function") {
        const result = shape.getProperty(key);
        if (result != null && result !== "") {
          return result;
        }
      }
    } catch {}

    try {
      if (shape.properties && typeof shape.properties === "object") {
        if (shape.properties[key] != null && shape.properties[key] !== "") {
          return shape.properties[key];
        }
      }
    } catch {}

    return undefined;
  };

  const setShapeProperty = (shape, key, value) => {
    let changed = false;

    try {
      if (typeof shape.setProperty === "function") {
        shape.setProperty(key, value);
        changed = true;
      }
    } catch {}

    try {
      if (shape.properties && typeof shape.properties === "object") {
        shape.properties[key] = value;
        changed = true;
      }
    } catch {}

    return changed;
  };

  const refreshEditor = (facade, selectedShapes) => {
    const resolvedFacade = facade || lastResolvedFacade;

    for (const shape of selectedShapes) {
      try {
        if (typeof shape.refresh === "function") {
          shape.refresh();
        }
      } catch {}

      try {
        const shapeCanvas =
          (typeof shape.getCanvas === "function" && shape.getCanvas()) ||
          shape.canvas ||
          shape.parent ||
          null;
        if (shapeCanvas && typeof shapeCanvas.update === "function") {
          shapeCanvas.update();
        }
      } catch {}
    }

    try {
      const canvas =
        resolvedFacade && typeof resolvedFacade.getCanvas === "function" ? resolvedFacade.getCanvas() : null;
      if (canvas && typeof canvas.update === "function") {
        canvas.update();
      }
    } catch {}

    try {
      if (resolvedFacade && typeof resolvedFacade.updateSelection === "function") {
        resolvedFacade.updateSelection();
      }
    } catch {}

    try {
      const cfg = window.ORYX && window.ORYX.CONFIG;
      if (
        cfg &&
        cfg.EVENT_SELECTION_CHANGED &&
        resolvedFacade &&
        typeof resolvedFacade.raiseEvent === "function"
      ) {
        resolvedFacade.raiseEvent({
          type: cfg.EVENT_SELECTION_CHANGED,
          elements: getFacadeSelection(resolvedFacade),
        });
      }
    } catch {}
  };

  const querySelectionInfo = () => {
    const facade = findEditorFacade();
    const selectedShapesFromFacade = facade ? getSelectedShapes(facade) : [];
    const pointerShape = selectedShapesFromFacade.length === 0 ? getPointerSelectedShape() : null;
    const pointerSelection = hasPointerSelection();
    const domTaskContext = isDomTaskContext();
    const selectedShapes = selectedShapesFromFacade.length > 0
      ? selectedShapesFromFacade
      : pointerShape
        ? [pointerShape]
        : [];

    if (!facade && selectedShapes.length === 0 && !pointerSelection && !domTaskContext) {
      return {
        hasSelection: false,
        selectedCount: 0,
        isTask: false,
        taskType: null,
        shapeId: null,
        anchorRect: null,
      };
    }
    const firstShape = selectedShapes[0] || null;
    const shapeId = getSelectionShapeId(selectedShapes);
    const cachedTaskType = getCachedTaskType(shapeId);
    const isTask = firstShape ? supportsTaskTypeProperty(firstShape) || isTaskLikeShape(firstShape) : domTaskContext || Boolean(cachedTaskType);
    let taskType = null;

    if (isTask && firstShape) {
      for (const key of TASK_TYPE_KEYS) {
        const raw = getShapeProperty(firstShape, key);
        const normalized = normalizeTaskType(raw);
        if (normalized) {
          taskType = normalized;
          break;
        }
      }
    }

    if (!taskType && cachedTaskType) {
      taskType = cachedTaskType;
    }

    if (!taskType && isTask) {
      taskType = readTaskTypeFromDom();
    }

    if (!taskType && isTask) {
      taskType = "none";
    }

    if (shapeId && taskType) {
      rememberTaskType(shapeId, taskType);
    }

    return {
      hasSelection: selectedShapes.length > 0 || pointerSelection || domTaskContext,
      selectedCount: selectedShapes.length > 0 ? selectedShapes.length : pointerSelection || domTaskContext ? 1 : 0,
      isTask,
      taskType,
      shapeId,
      anchorRect: getSelectionAnchorRect(selectedShapes),
    };
  };

  const querySelectionInfoAsync = async () => {
    return querySelectionInfo();
  };

  const getBootstrapSnapshot = () => {
    const facade = findEditorFacade();
    const selection = facade ? getSelectedShapes(facade) : [];
    const shapeId = getSelectionShapeId(selection);
    const rowParts = findTaskTypeRowElements();
    const extComponent = findTaskTypeExtComponent();
    const propertyContext = findTaskTypePropertyContext();

    return {
      eastPanelExpanded: isEastPanelExpanded(),
      pointerShapeId: getPointerShapeId(),
      selectionShapeId: shapeId,
      currentTaskType: shapeId ? getCachedTaskType(shapeId) : null,
      attributesToggle: summarizeElement(findAttributesToggleElement()),
      rightRailToggles: findRightRailToggleCandidates()
        .slice(0, 6)
        .map((candidate) => summarizeElement(candidate)),
      taskTypeRowFound: Boolean(rowParts),
      taskTypeRow: rowParts
        ? {
            label: summarizeElement(rowParts.labelNode),
            row: summarizeElement(rowParts.row),
            valueCell: summarizeElement(rowParts.valueCell),
          }
        : null,
      taskTypeExtComponent: extComponent ? summarizeExtComponent(extComponent) : null,
      taskTypePropertyContext: propertyContext
        ? {
            grid: summarizeExtComponent(propertyContext.grid),
            component: summarizeExtComponent(propertyContext.component),
            recordPropId: getExtRecordPropId(propertyContext.record),
            recordValue: getExtRecordValue(propertyContext.record),
            hasAfterEdit: Boolean(propertyContext.handler && typeof propertyContext.handler.afterEdit === "function"),
            hasFacade: Boolean(propertyContext.facade),
          }
        : null,
      selectionInfo: querySelectionInfo(),
      editorReady: getEditorReadySnapshot(),
    };
  };

  window.__bpkeysQuickEditDebug = () => {
    const facade = findEditorFacade();
    const selection = facade ? getFacadeSelection(facade) : [];
    const shapes = facade ? getSelectedShapes(facade) : [];
    const firstShape = shapes[0] || null;

    return {
      facadeFound: Boolean(facade),
      facadeKeys: facade ? Object.getOwnPropertyNames(facade).slice(0, 40) : [],
      rawSelectionCount: selection.length,
      selectedShapeCount: shapes.length,
      firstStencilId: firstShape ? getStencilId(firstShape) : "",
      firstTaskType: firstShape
        ? TASK_TYPE_KEYS.map((key) => [key, getShapeProperty(firstShape, key)])
        : [],
    };
  };

  window.__bpkeysQuickEditCandidates = () => {
    const seen = new Set();
    const candidates = [];
    const propertyBudget = { count: 280 };

    collectFacadeCandidates(window.__ORYX_EDITOR__, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.ORYX && window.ORYX.EDITOR, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(
      window.ORYX && window.ORYX.Editor && window.ORYX.Editor._instance,
      seen,
      candidates,
      2,
      propertyBudget,
    );
    collectFacadeCandidates(window.editor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.signavioEditor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.signavio && window.signavio.editor, seen, candidates, 2, propertyBudget);
    collectFacadeCandidates(window.Signavio && window.Signavio.editor, seen, candidates, 2, propertyBudget);

    return candidates.slice(0, 40).map((candidate, index) => {
      const selection = getFacadeSelection(candidate);
      const shapes = selection.map(resolveShape).filter(Boolean);
      return {
        index,
        selectionCount: selection.length,
        selectedShapeCount: shapes.length,
        firstStencilId: shapes[0] ? getStencilId(shapes[0]) : "",
        hasGetSelection: typeof candidate.getSelection === "function",
        hasRaiseEvent: typeof candidate.raiseEvent === "function",
        hasGetCanvas: typeof candidate.getCanvas === "function",
        keys: Object.getOwnPropertyNames(candidate).slice(0, 20),
      };
    });
  };

  window.__bpkeysLastPointerDebug = () => {
    const target = lastPointerTarget instanceof Element ? lastPointerTarget : null;
    if (!target) {
      return {
        hasTarget: false,
      };
    }

    const svgOwner =
      target.closest("svg") ||
      target.closest("g") ||
      target.closest("path") ||
      target.closest("rect") ||
      target.closest("circle");

    return {
      hasTarget: true,
      target: summarizeElement(target),
      closestSvgish: svgOwner instanceof Element ? summarizeElement(svgOwner) : null,
      chain: getElementChain(target),
    };
  };

  window.__bpkeysFindPointerShapeRefs = () => {
    const targetId = getPointerShapeId();
    return {
      targetId,
      matches: searchForShapeRefs(targetId),
    };
  };

  window.__bpkeysPointerBindings = () => {
    const target = lastPointerTarget instanceof Element ? lastPointerTarget : null;
    if (!target) {
      return { hasTarget: false };
    }

    const output = [];
    let current = target;
    let depth = 0;

    while (current && depth < 8) {
      const ownProps = [];
      let names = [];
      try {
        names = Object.getOwnPropertyNames(current).slice(0, 60);
      } catch {}

      for (const name of names) {
        let value;
        try {
          value = current[name];
        } catch {
          continue;
        }

        if (!value || (typeof value !== "object" && typeof value !== "function")) {
          continue;
        }

        const summary = summarizeBoundObject(value);
        if (!summary) {
          continue;
        }

        const interesting =
          summary.objectId ||
          summary.stencilId ||
          summary.hasGetProperty ||
          summary.hasSetProperty ||
          summary.hasGetStencil;

        if (interesting) {
          ownProps.push({
            name,
            summary,
          });
        }
      }

      output.push({
        depth,
        element: summarizeElement(current),
        ownProps,
      });

      current = current.parentElement;
      depth += 1;
    }

    return {
      hasTarget: true,
      targetId: getPointerShapeId(),
      chain: output,
    };
  };

  window.__bpkeysPrototypeStorage = () => {
    const target = lastPointerTarget instanceof Element ? lastPointerTarget : null;
    if (!target) {
      return { hasTarget: false };
    }

    const hasPrototypeStorage =
      window.Element &&
      window.Element.Storage &&
      typeof window.Element.Storage.get === "function";

    const chain = [];
    let current = target;
    let depth = 0;

    while (current && depth < 8) {
      let storageSummary = null;

      if (hasPrototypeStorage) {
        try {
          const raw = window.Element.Storage.get(current);
          if (raw && typeof raw === "object") {
            storageSummary = {};
            for (const [key, value] of Object.entries(raw)) {
              storageSummary[key] = summarizeStorageValue(value);
            }
          }
        } catch {}
      }

      chain.push({
        depth,
        element: summarizeElement(current),
        prototypeUID: current._prototypeUID || null,
        storage: storageSummary,
      });

      current = current.parentElement;
      depth += 1;
    }

    return {
      hasTarget: true,
      hasPrototypeStorage,
      targetId: getPointerShapeId(),
      chain,
    };
  };

  window.__bpkeysVisibleActionables = () => {
    const selectors = [
      "button",
      "[role='button']",
      "[role='menuitem']",
      "[role='option']",
      "[aria-label]",
      "[title]",
      ".toolbar *",
      ".context-pad *",
      ".popupmenu *",
      ".menu *",
    ];

    const seen = new Set();
    const results = [];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        if (!(node instanceof Element) || seen.has(node) || !isVisibleElement(node)) {
          continue;
        }
        seen.add(node);

        const label =
          node.getAttribute("aria-label") ||
          node.getAttribute("title") ||
          (node.textContent || "").trim();

        if (!label) {
          continue;
        }

        results.push({
          selector,
          tag: node.tagName,
          id: node.id || "",
          className:
            node.className && typeof node.className === "string"
              ? node.className
              : String(node.className || ""),
          role: node.getAttribute("role") || "",
          label: label.slice(0, 120),
        });

        if (results.length >= 80) {
          return results;
        }
      }
    }

    return results;
  };

  window.__bpkeysTaskTypeDom = () => {
    const labels = [
      "User Task",
      "Manual Task",
      "Service Task",
      "Send Task",
      "Receive Task",
      "Business Rule Task",
      "Script Task",
      "Task",
      "Duplicate",
    ];

    const results = [];
    const all = document.querySelectorAll("body *");

    for (const node of all) {
      if (!(node instanceof Element) || !isVisibleElement(node)) {
        continue;
      }

      const text = (node.textContent || "").trim();
      if (!text) {
        continue;
      }

      const match = labels.find((label) => text === label || text.includes(label));
      if (!match) {
        continue;
      }

      results.push({
        match,
        tag: node.tagName,
        id: node.id || "",
        className:
          node.className && typeof node.className === "string"
            ? node.className
            : String(node.className || ""),
        role: node.getAttribute("role") || "",
        ariaLabel: node.getAttribute("aria-label") || "",
        title: node.getAttribute("title") || "",
        text: text.slice(0, 120),
      });

      if (results.length >= 80) {
        break;
      }
    }

    return results;
  };

  window.__bpkeysTaskTypeExt = () => {
    return getExtComponents()
      .map((component) => summarizeExtComponent(component))
      .filter((summary) => {
        const haystack = [
          summary.id,
          summary.xtype,
          summary.name,
          summary.hiddenName,
          summary.fieldLabel,
          summary.value,
          summary.rawValue,
          summary.text,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes("task") || haystack.includes("type");
      })
      .slice(0, 80);
  };

  window.__bpkeysTaskTypePropertyContext = () => {
    const context = findTaskTypePropertyContext();
    if (!context) {
      return { found: false };
    }

    return {
      found: true,
      recordPropId: getExtRecordPropId(context.record),
      recordValue: getExtRecordValue(context.record),
      grid: summarizeExtComponent(context.grid),
      component: summarizeExtComponent(context.component),
      handler: context.handler
        ? {
            id: context.handler.id || "",
            xtype: context.handler.xtype || "",
            hasAfterEdit: typeof context.handler.afterEdit === "function",
            hasFacade:
              Boolean(context.handler.facade) ||
              typeof context.handler.executeCommands === "function",
          }
        : null,
      facadeFound: Boolean(context.facade),
    };
  };

  window.__bpkeysBootstrapDebug = async () => {
    const before = getBootstrapSnapshot();
    const primed = await primeTaskTypePropertyContext();
    const after = getBootstrapSnapshot();

    return {
      primed,
      before,
      after,
    };
  };

  window.__bpkeysTaskTypeRowDebug = () => {
    const rowParts = findTaskTypeRowElements();
    const ext = window.Ext;
    const getCmp = ext && typeof ext.getCmp === "function" ? ext.getCmp.bind(ext) : null;

    if (!rowParts) {
      return {
        found: false,
        candidates: getTaskTypeTextCandidates().slice(0, 20).map((node) => ({
          element: summarizeElement(node),
          visible: isVisibleElement(node),
        })),
      };
    }

    const collectElements = (start) => {
      const out = [];
      if (!(start instanceof Element)) {
        return out;
      }

      const nodes = [start, ...start.querySelectorAll("*")];
      for (const node of nodes) {
        if (!(node instanceof Element)) {
          continue;
        }
        const id = node.id || "";
        const cmp = id && getCmp ? getCmp(id) : null;
        out.push({
          tag: node.tagName,
          id,
          className:
            node.className && typeof node.className === "string"
              ? node.className
              : String(node.className || ""),
          text: (node.textContent || "").trim().slice(0, 80),
          title: node.getAttribute("title") || "",
          role: node.getAttribute("role") || "",
          extCmp: cmp
            ? {
                id: cmp.id || "",
                xtype: cmp.xtype || "",
                name: cmp.name || "",
                hiddenName: cmp.hiddenName || "",
                fieldLabel: cmp.fieldLabel || "",
                value:
                  (typeof cmp.getRawValue === "function" && cmp.getRawValue()) ||
                  (typeof cmp.getValue === "function" && cmp.getValue()) ||
                  "",
              }
            : null,
        });
      }

      return out;
    };

    const activeElement = document.activeElement instanceof Element ? document.activeElement : null;
    const focusedCmp =
      activeElement && activeElement.id && getCmp ? getCmp(activeElement.id) : null;

    return {
      found: true,
      title: getPropertyWindowTitle(),
      row: summarizeElement(rowParts.row),
      valueCell: summarizeElement(rowParts.valueCell),
      trigger: summarizeElement(
        rowParts.row.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']"),
      ),
      activeElement: summarizeElement(activeElement),
      focusedCmp: focusedCmp
        ? {
            id: focusedCmp.id || "",
            xtype: focusedCmp.xtype || "",
            name: focusedCmp.name || "",
            hiddenName: focusedCmp.hiddenName || "",
            fieldLabel: focusedCmp.fieldLabel || "",
            value:
              (typeof focusedCmp.getRawValue === "function" && focusedCmp.getRawValue()) ||
              (typeof focusedCmp.getValue === "function" && focusedCmp.getValue()) ||
              "",
          }
        : null,
      rowElements: collectElements(rowParts.row).slice(0, 60),
    };
  };

  const applyTaskTypeAction = async (taskType, preferredShapeId) => {
    const normalizedType = normalizeTaskType(taskType);
    if (!normalizedType || !TASK_TYPE_VALUES[normalizedType]) {
      return { ok: false, error: "Unsupported task type" };
    }

    const facade = findEditorFacade();
    const selectedShapesFromFacade = facade ? getSelectedShapes(facade) : [];
    const preferredShape =
      selectedShapesFromFacade.length === 0 && preferredShapeId
        ? resolveShapeById(preferredShapeId)
        : null;
    const pointerShape =
      selectedShapesFromFacade.length === 0 && !preferredShape ? getPointerSelectedShape() : null;
    const selectedShapes = selectedShapesFromFacade.length > 0
      ? selectedShapesFromFacade
      : preferredShape
        ? [preferredShape]
        : pointerShape
          ? [pointerShape]
        : [];
    const pointerSelection = hasPointerSelection();
    const domTaskContext = isDomTaskContext();

    if (selectedShapes.length === 0 && !pointerSelection && !domTaskContext) {
      return { ok: false, error: "No element selected" };
    }

    const taskShapes = selectedShapes.filter((shape) => supportsTaskTypeProperty(shape) || isTaskLikeShape(shape));
    if (taskShapes.length === 0 && !domTaskContext) {
      return { ok: false, error: "Selected element is not a task" };
    }

    if (taskShapes.length > 0) {
      const targetValue = getDirectTaskTypeValue(normalizedType);
      let changed = false;
      for (const shape of taskShapes) {
        changed = setShapeProperty(shape, "oryx-tasktype", targetValue) || changed;
        rememberTaskType(getObjectId(shape), normalizedType);
      }

      if (changed) {
        refreshEditor(facade, selectedShapes);
        return { ok: true };
      }

      return { ok: false, error: "Direct task update failed" };
    }

    if (!domTaskContext) {
      return { ok: false, error: "Task model not found" };
    }

    return applyTaskTypeActionDom(normalizedType);
  };

  const duplicateSelection = () => {
    const facade = findEditorFacade();
    const selectedShapesFromFacade = facade ? getSelectedShapes(facade) : [];
    const pointerShape = selectedShapesFromFacade.length === 0 ? getPointerSelectedShape() : null;
    if (selectedShapesFromFacade.length === 0 && !pointerShape && !hasPointerSelection()) {
      return { ok: false, error: "No element selected" };
    }

    if (!facade) {
      return { ok: false, error: "Editor facade not found" };
    }

    let executed = false;
    try {
      const cfg = window.ORYX && window.ORYX.CONFIG;
      if (
        cfg &&
        cfg.EVENT_COPY &&
        cfg.EVENT_PASTE &&
        typeof facade.raiseEvent === "function"
      ) {
        facade.raiseEvent({ type: cfg.EVENT_COPY });
        facade.raiseEvent({ type: cfg.EVENT_PASTE });
        executed = true;
      }
    } catch {}

    if (!executed) {
      try {
        if (typeof facade.copy === "function" && typeof facade.paste === "function") {
          facade.copy();
          facade.paste();
          executed = true;
        }
      } catch {}
    }

    if (!executed) {
      return { ok: false, error: "Duplicate action is not available" };
    }

    return { ok: true };
  };

  window.fetch = function patchedFetch(input, init) {
    try {
      const method =
        init?.method ||
        (typeof input === "object" && input && "method" in input ? input.method : "GET");
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : typeof input === "object" && input && "url" in input
              ? input.url
              : "";
      const body =
        init?.body || (typeof input === "object" && input && "body" in input ? input.body : null);
      const headers =
        init?.headers ||
        (typeof input === "object" && input && "headers" in input ? input.headers : undefined);

      parseAndEmit(url, method, body, "fetch", headers);
    } catch {
      // Ignore parse errors and preserve native request behavior.
    }

    return nativeFetch(input, init);
  };

  window.addEventListener(
    "pointerdown",
    (event) => {
      lastPointerTarget = event.target instanceof Element ? event.target : null;
      const shapeId = extractShapeIdFromEvent(event);
      if (shapeId) {
        lastPointerShapeId = shapeId;
        lastShapePointerTarget = event.target instanceof Element ? event.target : null;
        cachePointerShapeBinding(shapeId, lastShapePointerTarget);
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const clickedCanvas =
        Boolean(target?.closest("svg")) ||
        Boolean(target?.closest("#oryx_canvas")) ||
        Boolean(target?.closest("[id*='canvas']"));
      if (clickedCanvas) {
        lastPointerShapeId = "";
        lastShapePointerTarget = null;
        lastResolvedShapeObject = null;
      }
    },
    true,
  );

  XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    this.__bpkeysMethod = method;
    this.__bpkeysUrl = url;
    this.__bpkeysHeaders = {};
    return nativeOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.setRequestHeader = function patchedSetRequestHeader(name, value) {
    if (!this.__bpkeysHeaders) {
      this.__bpkeysHeaders = {};
    }

    this.__bpkeysHeaders[String(name).toLowerCase()] = String(value);
    return nativeSetRequestHeader.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    try {
      parseAndEmit(this.__bpkeysUrl, this.__bpkeysMethod, body, "xhr", this.__bpkeysHeaders);
    } catch {
      // Ignore parse errors and preserve native request behavior.
    }

    return nativeSend.call(this, body);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    const data = event.data;
    if (!data || data.source !== CONTENT_SOURCE || typeof data.type !== "string") {
      return;
    }

    if (data.type === "clipboard-template-bootstrap" && data.template) {
      if (data.template.headers && typeof data.template.headers === "object") {
        lastClipboardHeaders = { ...data.template.headers };
      }

      if (Array.isArray(data.template.params)) {
        lastClipboardParams = templateEntriesToParams(data.template.params);
      }
      return;
    }

    if (
      data.type === "clipboard-write-request" &&
      typeof data.requestId === "string" &&
      data.payload
    ) {
      writeClipboard(
        data.requestId,
        data.payload.valueJson,
        data.payload.namespace,
        data.payload.requestTemplate,
      );
      return;
    }

    if (
      data.type === "editor-query-request" &&
      typeof data.requestId === "string" &&
      data.query === "selection-info"
    ) {
      void Promise.resolve(querySelectionInfoAsync())
        .then((result) => {
          window.postMessage(
            {
              source: MESSAGE_SOURCE,
              type: "editor-query-result",
              requestId: data.requestId,
              ok: true,
              result,
            },
            window.location.origin,
          );
        })
        .catch((error) => {
          window.postMessage(
            {
              source: MESSAGE_SOURCE,
              type: "editor-query-result",
              requestId: data.requestId,
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            window.location.origin,
          );
        });
      return;
    }

    if (
      data.type === "editor-action-request" &&
      typeof data.requestId === "string" &&
      data.action === "set-task-type"
    ) {
      void Promise.resolve(applyTaskTypeAction(data.taskType, data.shapeId))
        .then((result) => {
          window.postMessage(
            {
              source: MESSAGE_SOURCE,
              type: "editor-action-result",
              requestId: data.requestId,
              ok: true,
              result,
            },
            window.location.origin,
          );
        })
        .catch((error) => {
          window.postMessage(
            {
              source: MESSAGE_SOURCE,
              type: "editor-action-result",
              requestId: data.requestId,
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            window.location.origin,
          );
        });
      return;
    }

  });
})();
