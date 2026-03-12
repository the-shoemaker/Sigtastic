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

  const findEditorFacade = () => {
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

    for (const facade of candidates) {
      if (getFacadeSelection(facade).length > 0) {
        return facade;
      }
    }

    return candidates[0] || null;
  };

  const resolveShape = (entry) => {
    if (!entry) {
      return null;
    }
    if (entry.shape && (typeof entry.shape === "object" || typeof entry.shape === "function")) {
      return entry.shape;
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

  const searchForShapeRefs = (targetId) => {
    if (!targetId) {
      return [];
    }

    const roots = [];
    for (const key of Object.getOwnPropertyNames(window)) {
      let value;
      try {
        value = window[key];
      } catch {
        continue;
      }
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
          objectId,
          keys: Object.getOwnPropertyNames(value).slice(0, 20),
          hasSetProperty: typeof value.setProperty === "function",
          hasGetProperty: typeof value.getProperty === "function",
          hasGetStencil: typeof value.getStencil === "function",
          stencilId: getStencilId(value),
        });
      }

      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(value).slice(0, 18);
      } catch {}

      for (const key of keys) {
        let nested;
        try {
          nested = value[key];
        } catch {
          continue;
        }
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

  const getPointerSelectedShape = () => {
    const targetId = getPointerShapeId();
    if (!targetId) {
      return null;
    }

    const matches = searchForShapeRefs(targetId);
    const bestMatch = matches.find((match) => match.hasSetProperty || match.hasGetStencil) || matches[0];
    if (!bestMatch) {
      return null;
    }

    let value = window;
    const pathParts = bestMatch.path.replace(/^window\./, "").split(".");
    for (const part of pathParts) {
      if (!part) continue;
      try {
        value = value[part];
      } catch {
        return null;
      }
    }

    return value || null;
  };

  const isTaskLikeShape = (shape) => {
    const stencil = getStencilId(shape).toLowerCase();
    return stencil.includes("task") || stencil.includes("activity");
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
    return text === "task type" || text.startsWith("task type") || text.includes("task type ");
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
    const labelNode = getTaskTypeTextCandidates()[0] || null;
    if (!labelNode) {
      return null;
    }

    const row =
      labelNode.closest("tr") ||
      labelNode.closest(".x-grid3-row") ||
      labelNode.closest(".x-grid-panel") ||
      labelNode.parentElement;
    if (!row) {
      return null;
    }

    const cells = row.querySelectorAll("td, .x-grid3-cell");
    const valueCell =
      cells.length > 1
        ? cells[1]
        : labelNode.closest("td")?.nextElementSibling || row.querySelector("input, .x-form-field-wrap");

    return {
      labelNode,
      row,
      valueCell: valueCell || row,
    };
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
    const rowIndex = (() => {
      const row = rowParts.row;
      if (!(row instanceof Element)) {
        return -1;
      }
      const parent = row.parentElement;
      if (!parent) {
        return -1;
      }
      return Array.from(parent.children).filter((child) => child.tagName === row.tagName).indexOf(row);
    })();

    const gridComponent = getExtComponents().find((component) => {
      const element = getExtComponentElement(component);
      if (!element || !element.contains(rowParts.row)) {
        return false;
      }

      return (
        typeof component.startEditing === "function" ||
        typeof component.stopEditing === "function" ||
        typeof component.getView === "function"
      );
    }) || null;

    if (gridComponent && rowIndex >= 0) {
      try {
        if (typeof gridComponent.startEditing === "function") {
          gridComponent.startEditing(rowIndex, 1);
          await delay(50);
        }
      } catch {}

      try {
        if (typeof gridComponent.getSelectionModel === "function") {
          const selectionModel = gridComponent.getSelectionModel();
          if (selectionModel && typeof selectionModel.select === "function") {
            selectionModel.select(rowIndex, 1);
            await delay(20);
          }
        }
      } catch {}

      const activeElement = document.activeElement instanceof Element ? document.activeElement : null;
      if (
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName) &&
        isVisibleElement(activeElement)
      ) {
        return activeElement;
      }

      const afterGridEdit = getVisibleEditorFields();
      const addedGridField = afterGridEdit.find((field) => !before.has(field));
      if (addedGridField) {
        return addedGridField;
      }
    }

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
        isVisibleElement(activeElement)
      ) {
        return activeElement;
      }

      const after = getVisibleEditorFields();
      const added = after.find((field) => !before.has(field));
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
      return attachedToRow || haystack.includes("task type");
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

  const applyTaskTypeActionDom = async (taskType) => {
    const targetLabel = getTaskTypeOptionLabel(taskType);
    const extComponent = findTaskTypeExtComponent();
    if (extComponent && setExtComboValue(extComponent, targetLabel)) {
      await delay(20);
      return { ok: true };
    }

    const rowParts = findTaskTypeRowElements();
    if (!rowParts) {
      return { ok: false, error: "Task type row not found" };
    }

    const editorField = await activateTaskTypeEditor(rowParts);
    const activeComponent = editorField instanceof Element ? getExtCmp(editorField.id || "") : null;

    if (editorField && (await commitEditorField(editorField, activeComponent, targetLabel))) {
      await delay(40);
      return { ok: true };
    }

    const localTrigger =
      rowParts.row.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']") ||
      rowParts.valueCell.querySelector(".x-form-arrow-trigger, .x-form-trigger, [class*='trigger']") ||
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
    for (const shape of selectedShapes) {
      try {
        if (typeof shape.refresh === "function") {
          shape.refresh();
        }
      } catch {}
    }

    try {
      const canvas = facade && typeof facade.getCanvas === "function" ? facade.getCanvas() : null;
      if (canvas && typeof canvas.update === "function") {
        canvas.update();
      }
    } catch {}

    try {
      if (facade && typeof facade.updateSelection === "function") {
        facade.updateSelection();
      }
    } catch {}

    try {
      const cfg = window.ORYX && window.ORYX.CONFIG;
      if (
        cfg &&
        cfg.EVENT_SELECTION_CHANGED &&
        facade &&
        typeof facade.raiseEvent === "function"
      ) {
        facade.raiseEvent({
          type: cfg.EVENT_SELECTION_CHANGED,
          elements: getFacadeSelection(facade),
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
      };
    }
    const firstShape = selectedShapes[0] || null;
    const isTask = firstShape ? isTaskLikeShape(firstShape) : domTaskContext;
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

    if (!taskType && isTask) {
      taskType = readTaskTypeFromDom();
    }

    return {
      hasSelection: selectedShapes.length > 0 || pointerSelection || domTaskContext,
      selectedCount: selectedShapes.length > 0 ? selectedShapes.length : pointerSelection || domTaskContext ? 1 : 0,
      isTask,
      taskType,
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

  const applyTaskTypeAction = async (taskType) => {
    const normalizedType = normalizeTaskType(taskType);
    if (!normalizedType || !TASK_TYPE_VALUES[normalizedType]) {
      return { ok: false, error: "Unsupported task type" };
    }

    const facade = findEditorFacade();
    const selectedShapesFromFacade = facade ? getSelectedShapes(facade) : [];
    const pointerShape = selectedShapesFromFacade.length === 0 ? getPointerSelectedShape() : null;
    const selectedShapes = selectedShapesFromFacade.length > 0
      ? selectedShapesFromFacade
      : pointerShape
        ? [pointerShape]
        : [];
    const pointerSelection = hasPointerSelection();
    const domTaskContext = isDomTaskContext();

    if (selectedShapes.length === 0 && !pointerSelection && !domTaskContext) {
      return { ok: false, error: "No element selected" };
    }

    const taskShapes = selectedShapes.filter(isTaskLikeShape);
    if (taskShapes.length === 0 && !domTaskContext) {
      return { ok: false, error: "Selected element is not a task" };
    }

    let changed = false;
    for (const shape of taskShapes) {
      for (const key of TASK_TYPE_KEYS) {
        for (const value of TASK_TYPE_VALUES[normalizedType]) {
          changed = setShapeProperty(shape, key, value) || changed;
        }
      }
    }

    if (changed && facade) {
      refreshEditor(facade, selectedShapes);
      return { ok: true };
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

  });
})();
