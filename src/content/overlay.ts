import {
  getContextBadgeKinds,
  getPrimaryShapeInfo,
  getTopLevelNonEdgeStencils,
  getTypeBadgeKind,
  type ContextBadgeKind,
  type PrimaryShapeInfo,
  type TypeBadgeKind,
} from "../shared/payload";
import type { Favorite } from "../shared/types";

type OverlayActions = {
  onInsert: (favorite: Favorite) => Promise<void>;
  onDelete: (favorite: Favorite) => Promise<void>;
  onMove: (favorite: Favorite, direction: "up" | "down") => Promise<void>;
  onClose: () => void;
};

type InputMode = "search" | "list";
type UiBadgeKind = ContextBadgeKind | "duplicate";

const CARD_MIN_WIDTH = 172;

export class FavoritesOverlay {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private readonly wrapper: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  private readonly listWrap: HTMLDivElement;
  private readonly grid: HTMLDivElement;
  private readonly emptyState: HTMLDivElement;
  private readonly hintText: HTMLDivElement;
  private readonly actions: OverlayActions;

  private favorites: Favorite[] = [];
  private filtered: Favorite[] = [];
  private selectedId: string | null = null;
  private opened = false;
  private query = "";
  private mode: InputMode = "search";
  private cardById = new Map<string, HTMLButtonElement>();
  private typeLabelFitFrame: number | null = null;
  private selectedScrollFrame: number | null = null;

  constructor(actions: OverlayActions) {
    this.actions = actions;

    this.host = document.createElement("div");
    this.host.id = "bpkeys-overlay-host";
    this.root = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = this.getStyles();

    this.wrapper = document.createElement("div");
    this.wrapper.className = "bpkeys-wrapper";
    this.wrapper.tabIndex = -1;

    const scrim = document.createElement("div");
    scrim.className = "bpkeys-scrim";
    scrim.addEventListener("click", () => this.close());

    const panel = document.createElement("section");
    panel.className = "bpkeys-panel";
    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const topRow = document.createElement("div");
    topRow.className = "bpkeys-top-row";

    const searchShell = document.createElement("div");
    searchShell.className = "bpkeys-search-shell";

    const searchIcon = document.createElement("span");
    searchIcon.className = "bpkeys-search-icon";
    searchIcon.setAttribute("aria-hidden", "true");
    searchIcon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.8" stroke="currentColor" stroke-width="1.8"/><path d="M16.1 16.1L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    this.searchInput = document.createElement("input");
    this.searchInput.className = "bpkeys-search";
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search Components";
    this.searchInput.setAttribute("aria-label", "Search components");
    this.searchInput.addEventListener("focus", () => {
      this.mode = "search";
    });
    this.searchInput.addEventListener("pointerdown", () => {
      this.mode = "search";
    });
    this.searchInput.addEventListener("input", () => {
      this.mode = "search";
      this.query = this.searchInput.value.trim().toLowerCase();
      this.applyFilter();
      this.renderGrid();
    });

    searchShell.append(searchIcon, this.searchInput);
    topRow.append(searchShell);

    const divider = document.createElement("div");
    divider.className = "bpkeys-divider";

    const listWrap = document.createElement("div");
    listWrap.className = "bpkeys-list-wrap";
    this.listWrap = listWrap;

    this.grid = document.createElement("div");
    this.grid.className = "bpkeys-grid";

    this.emptyState = document.createElement("div");
    this.emptyState.className = "bpkeys-empty";

    listWrap.append(this.grid, this.emptyState);

    const footerDivider = document.createElement("div");
    footerDivider.className = "bpkeys-footer-divider";

    this.hintText = document.createElement("div");
    this.hintText.className = "bpkeys-hints";
    this.hintText.replaceChildren(
      this.createHintItem("Close", "Esc"),
      this.createHintSeparator(),
      this.createHintItem("Insert", "Enter"),
      this.createHintSeparator(),
      this.createHintItem("Remove", "Option+Delete"),
      this.createHintSeparator(),
      this.createHintItem("Reorder", "Option+Up/Down"),
    );

    panel.append(topRow, divider, listWrap, footerDivider, this.hintText);
    this.wrapper.append(scrim, panel);
    this.root.append(style, this.wrapper);

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("resize", this.onResize, { passive: true });

    document.documentElement.appendChild(this.host);
    this.renderGrid();
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public open(favorites: Favorite[]): void {
    this.opened = true;
    this.wrapper.classList.add("open");
    this.query = "";
    this.mode = "search";
    this.searchInput.value = "";
    this.setFavorites(favorites);
    this.searchInput.focus();
  }

  public close(): void {
    if (!this.opened) {
      return;
    }

    this.opened = false;
    this.wrapper.classList.remove("open");
    this.actions.onClose();
  }

  public toggle(favorites: Favorite[]): void {
    if (this.opened) {
      this.close();
      return;
    }

    this.open(favorites);
  }

  public refreshFavorites(favorites: Favorite[]): void {
    this.setFavorites(favorites);
    this.scheduleSelectedVisibilityScroll();
  }

  private setFavorites(favorites: Favorite[]): void {
    this.favorites = [...favorites].sort((a, b) => a.order - b.order);

    if (!this.selectedId && this.favorites.length > 0) {
      this.selectedId = this.favorites[0]?.id ?? null;
    }

    this.applyFilter();
    this.renderGrid();
  }

  private applyFilter(): void {
    if (!this.query) {
      this.filtered = [...this.favorites];
    } else {
      this.filtered = this.favorites.filter((favorite) => {
        const info = getPrimaryShapeInfo(favorite.payload);
        const displayName = this.getVisualDisplayName(favorite, info);
        const displayContent = this.getVisualDisplayContent(favorite, info);
        const haystack =
          `${favorite.name} ${displayName} ${displayContent} ${info.typeName} ${info.contentText}`.toLowerCase();
        return haystack.includes(this.query);
      });
    }

    if (this.filtered.length === 0) {
      this.selectedId = null;
      return;
    }

    if (
      !this.selectedId ||
      !this.filtered.some((favorite) => favorite.id === this.selectedId)
    ) {
      this.selectedId = this.filtered[0]?.id ?? null;
    }
  }

  private getSelectedFavorite(): Favorite | null {
    if (!this.selectedId) {
      return null;
    }

    return (
      this.filtered.find((favorite) => favorite.id === this.selectedId) ?? null
    );
  }

  private enterSearchMode(append?: string): void {
    this.mode = "search";
    this.searchInput.focus();

    if (append) {
      this.searchInput.value += append;
      this.query = this.searchInput.value.trim().toLowerCase();
      this.applyFilter();
      this.renderGrid();
    }
  }

  private enterListMode(): void {
    this.mode = "list";
    this.searchInput.blur();
    this.wrapper.focus();
  }

  private renderGrid(): void {
    this.cardById.clear();
    this.grid.innerHTML = "";

    const items = this.filtered;
    this.emptyState.style.display = items.length === 0 ? "block" : "none";

    if (this.favorites.length === 0) {
      this.emptyState.textContent =
        "No favorites yet. Copy a shape in Signavio and use Option+Shift+S to save one.";
      this.hintText.style.opacity = "0.75";
      return;
    }

    if (items.length === 0) {
      this.emptyState.textContent = "No favorites match your search.";
      this.hintText.style.opacity = "0.85";
      return;
    }

    this.hintText.style.opacity = "1";
    const duplicateCounts = this.getDuplicateSignatureCounts();

    for (const favorite of items) {
      const card = document.createElement("button");
      card.className = "bpkeys-card";
      card.type = "button";
      card.dataset.favoriteId = favorite.id;
      card.title = favorite.name;
      const shapeInfo = getPrimaryShapeInfo(favorite.payload);
      const contextBadges = getContextBadgeKinds(favorite.payload);
      const typeBadgeKind = getTypeBadgeKind(favorite.payload);
      const displayName = this.getVisualDisplayName(favorite, shapeInfo);
      const displayContent = this.getVisualDisplayContent(favorite, shapeInfo);
      const signature = this.getFavoriteSignature(
        shapeInfo,
        displayName,
        displayContent,
        contextBadges,
      );
      const isDuplicate = (duplicateCounts.get(signature) ?? 0) > 1;

      card.addEventListener("click", () => {
        this.selectedId = favorite.id;
        this.enterListMode();
        this.updateSelectedCardClasses();
      });

      card.addEventListener("dblclick", () => {
        this.close();
        void this.actions.onInsert(favorite);
      });

      const preview = this.createPreview(
        favorite,
        shapeInfo,
        displayName,
        contextBadges,
        typeBadgeKind,
        isDuplicate,
      );

      const label = document.createElement("div");
      label.className = "bpkeys-card-label";
      label.textContent = displayContent;

      card.append(preview, label);
      this.grid.appendChild(card);
      this.cardById.set(favorite.id, card);
    }

    this.updateSelectedCardClasses();
    this.scheduleTypeLabelFit();
  }

  private updateSelectedCardClasses(): void {
    for (const [id, card] of this.cardById.entries()) {
      card.classList.toggle("selected", id === this.selectedId);
    }
  }

  private getVisualDisplayName(
    favorite: Favorite,
    shapeInfo: PrimaryShapeInfo,
  ): string {
    const candidate = favorite.displayName?.trim() || "";
    if (favorite.displayNameCustom && candidate) {
      return candidate;
    }

    return shapeInfo.typeName || "Component";
  }

  private getVisualDisplayContent(
    favorite: Favorite,
    shapeInfo: PrimaryShapeInfo,
  ): string {
    const candidate = favorite.displayContent?.trim() || "";
    if (favorite.displayContentCustom && candidate) {
      return candidate;
    }

    return shapeInfo.hasContent ? shapeInfo.contentText : "Empty";
  }

  private middleEllipsis(value: string, maxChars = 24): string {
    const normalized = value.trim();
    if (normalized.length <= maxChars) {
      return normalized;
    }

    if (maxChars <= 4) {
      return `${normalized.slice(0, 1)}...`;
    }

    const keep = maxChars - 3;
    const left = Math.ceil(keep / 2);
    const right = Math.floor(keep / 2);
    return `${normalized.slice(0, left)}...${normalized.slice(
      normalized.length - right,
    )}`;
  }

  private scheduleTypeLabelFit(): void {
    if (this.typeLabelFitFrame !== null) {
      window.cancelAnimationFrame(this.typeLabelFitFrame);
    }

    this.typeLabelFitFrame = window.requestAnimationFrame(() => {
      this.typeLabelFitFrame = null;
      this.fitTypeLabelsToWidth();
    });
  }

  private scheduleSelectedVisibilityScroll(): void {
    if (this.selectedScrollFrame !== null) {
      window.cancelAnimationFrame(this.selectedScrollFrame);
    }

    this.selectedScrollFrame = window.requestAnimationFrame(() => {
      this.selectedScrollFrame = null;
      this.scrollSelectedCardToTopIfOutOfView();
    });
  }

  private fitTypeLabelsToWidth(): void {
    const labels = this.grid.querySelectorAll<HTMLElement>(".bpkeys-type-inline");

    for (const label of labels) {
      const fullText = label.dataset.fullText?.trim() ?? "";
      if (!fullText) {
        label.textContent = "";
        continue;
      }

      label.textContent = fullText;
      const availableWidth = label.clientWidth;
      if (availableWidth <= 0 || label.scrollWidth <= availableWidth) {
        continue;
      }

      let low = 5;
      let high = fullText.length;
      let best = `${fullText.slice(0, 1)}...`;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = this.middleEllipsis(fullText, mid);
        label.textContent = candidate;

        if (label.scrollWidth <= availableWidth) {
          best = candidate;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      label.textContent = best;
    }
  }

  private getFavoriteSignature(
    shapeInfo: PrimaryShapeInfo,
    displayName: string,
    displayContent: string,
    badges: ContextBadgeKind[],
  ): string {
    return [
      shapeInfo.typeName.toLowerCase(),
      displayName.trim().toLowerCase(),
      displayContent.trim().toLowerCase(),
      [...badges].sort().join(","),
    ].join("::");
  }

  private getDuplicateSignatureCounts(): Map<string, number> {
    const counts = new Map<string, number>();

    for (const favorite of this.favorites) {
      const shapeInfo = getPrimaryShapeInfo(favorite.payload);
      const badges = getContextBadgeKinds(favorite.payload);
      const displayName = this.getVisualDisplayName(favorite, shapeInfo);
      const displayContent = this.getVisualDisplayContent(favorite, shapeInfo);
      const signature = this.getFavoriteSignature(
        shapeInfo,
        displayName,
        displayContent,
        badges,
      );

      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    }

    return counts;
  }

  private createHintItem(action: string, key: string): HTMLSpanElement {
    const item = document.createElement("span");
    item.className = "bpkeys-hint-item";

    const actionText = document.createElement("span");
    actionText.className = "bpkeys-hint-action";
    actionText.textContent = action;

    const keyText = document.createElement("span");
    keyText.className = "bpkeys-hint-key";
    keyText.textContent = key;

    item.append(actionText, keyText);
    return item;
  }

  private createHintSeparator(): HTMLSpanElement {
    const separator = document.createElement("span");
    separator.className = "bpkeys-hint-separator";
    separator.textContent = "|";
    return separator;
  }

  private createPreview(
    favorite: Favorite,
    shapeInfo: PrimaryShapeInfo,
    displayName: string,
    contextBadges: ContextBadgeKind[],
    typeBadgeKind: TypeBadgeKind | null,
    isDuplicate: boolean,
  ): HTMLDivElement {
    const preview = document.createElement("div");
    preview.className = "bpkeys-preview";
    const stencil = shapeInfo.stencilId.toLowerCase();
    const primaryIconKind = this.getIconKind(stencil, shapeInfo);
    const topStencils = getTopLevelNonEdgeStencils(favorite.payload, 3).map(
      (id) => id.toLowerCase(),
    );
    const iconKinds =
      topStencils.length > 0
        ? topStencils.map((id) => this.getIconKind(id))
        : [primaryIconKind];
    const roundedBackground = this.hasRoundedBackground(primaryIconKind);

    if (roundedBackground) {
      preview.classList.add("rounded-bg");
    } else {
      preview.classList.add("shape-only");
    }

    preview.classList.add(shapeInfo.hasContent ? "has-content" : "is-empty");
    if (iconKinds.length > 1) {
      const stack = document.createElement("div");
      stack.className = `bpkeys-preview-stack count-${Math.min(3, iconKinds.length)}`;

      iconKinds.slice(0, 3).forEach((kind, index) => {
        const bubble = document.createElement("div");
        bubble.className = `bpkeys-preview-bubble slot-${index + 1}`;
        bubble.appendChild(
          this.createIconSvgNode(kind, "bpkeys-preview-bubble-svg"),
        );
        stack.appendChild(bubble);
      });

      preview.appendChild(stack);
    } else {
      preview.appendChild(
        this.createIconSvgNode(primaryIconKind, "bpkeys-preview-svg"),
      );
    }

    if (typeBadgeKind) {
      preview.appendChild(this.getTypeBadge(typeBadgeKind));
    }

    const typeLabel = document.createElement("div");
    typeLabel.className = "bpkeys-type-inline";
    typeLabel.dataset.fullText = displayName;
    typeLabel.textContent = displayName;
    typeLabel.setAttribute("title", displayName);
    preview.appendChild(typeLabel);

    const badgeKinds: UiBadgeKind[] = [...contextBadges];
    if (isDuplicate) {
      badgeKinds.push("duplicate");
    }

    if (badgeKinds.length > 0) {
      const badgeRow = document.createElement("div");
      badgeRow.className = "bpkeys-badge-row";

      for (const kind of badgeKinds) {
        badgeRow.appendChild(this.getBadge(kind));
      }

      preview.appendChild(badgeRow);
    }

    return preview;
  }

  private createIconSvgNode(
    iconKind: ReturnType<FavoritesOverlay["getIconKind"]>,
    className: string,
  ): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // Add a small safety margin in the viewBox so stroke outlines do not clip.
    svg.setAttribute("viewBox", "-4 -4 148 112");
    svg.classList.add(className);
    if (iconKind.startsWith("gateway-")) {
      svg.style.height = "75%";
    }
    svg.innerHTML = this.getIconSvg(iconKind);
    return svg;
  }

  private getBadge(kind: UiBadgeKind): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = "bpkeys-badge";

    const icons: Record<UiBadgeKind, string> = {
      content:
        '<text x="12" y="15.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" font-family="Segoe UI, sans-serif">T</text>',
      "multi-element":
        '<line x1="8.5" y1="8.5" x2="15.5" y2="8.5" stroke="currentColor" stroke-width="1.8"/><line x1="8.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><line x1="15.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="12" cy="14.8" r="2.3" fill="currentColor"/>',
      duplicate:
        '<rect x="5.5" y="5.5" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      timer:
        '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" stroke-width="2"/>',
      message:
        '<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8 L12 13 L20 8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      conditional:
        '<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.8"/>',
      link: '<path d="M8 12 C8 9 10 7 13 7 H16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 7 L14 5 M16 7 L14 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 12 C16 15 14 17 11 17 H8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 17 L10 15 M8 17 L10 19" fill="none" stroke="currentColor" stroke-width="2"/>',
      multiple:
        '<circle cx="8" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="16" cy="12" r="2.2" fill="currentColor"/>',
      loop: '<path d="M17 10 A6 6 0 1 0 18 13" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="18,8 21,10 18,12" fill="currentColor"/>',
      "mi-parallel":
        '<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',
      "mi-sequential":
        '<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="9" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="11" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',
      adhoc:
        '<path d="M4 14 C6 10 8 18 10 14 C12 10 14 18 16 14 C18 10 20 18 22 14" fill="none" stroke="currentColor" stroke-width="2"/>',
      "non-interrupting":
        '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.5 2.5"/>',
      transaction:
        '<rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="8" y="8" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    };

    badge.setAttribute("title", kind);
    badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none">${icons[kind]}</svg>`;
    return badge;
  }

  private getTypeBadge(kind: TypeBadgeKind): HTMLDivElement {
    const badge = document.createElement("div");
    badge.className = "bpkeys-type-badge-center";

    const icons: Record<TypeBadgeKind, string> = {
      user: '<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M4.8 20 C4.8 15.4 8 13 12 13 C16 13 19.2 15.4 19.2 20" fill="currentColor"/>',
      service:
        '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.1"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/><line x1="12" y1="3.6" x2="12" y2="6.1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17.9" x2="12" y2="20.4" stroke="currentColor" stroke-width="2"/><line x1="3.6" y1="12" x2="6.1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="17.9" y1="12" x2="20.4" y2="12" stroke="currentColor" stroke-width="2"/>',
      manual:
        '<path d="M6 19 V11 C6 9.6 7 8.8 8.2 8.8 C9.3 8.8 10.2 9.6 10.2 11.1 V14.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.2 14.2 V8 C10.2 6.9 11 6.1 12.1 6.1 C13.2 6.1 14 6.9 14 8 V14.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 12 C15 11.6 16.1 12.3 16.4 13.4 L17.8 18.4" fill="none" stroke="currentColor" stroke-width="2"/>',
      script:
        '<path d="M6 4.6 H13.8 L18 8.8 V19.4 H6 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" stroke-width="1.9"/><line x1="8.5" y1="15.5" x2="14.2" y2="15.5" stroke="currentColor" stroke-width="1.9"/>',
      send: '<rect x="3.8" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 8.1 L10.4 12.5 L17 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="16.8" y1="11.7" x2="22" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="22,11.7 18.9,9.5 18.9,13.9" fill="currentColor"/>',
      receive:
        '<rect x="7" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8.1 L13.6 12.5 L20.2 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="2" y1="11.7" x2="7.2" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="2,11.7 5.1,9.5 5.1,13.9" fill="currentColor"/>',
      "business-rule":
        '<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/><line x1="9.2" y1="5" x2="9.2" y2="19" stroke="currentColor" stroke-width="2"/>',
      "call-activity":
        '<rect x="4" y="6" width="16" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="7" y="9" width="10" height="6" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      automatic:
        '<polygon points="8,4 5,12.5 10,12.5 8.2,20 18.4,9.4 12.8,9.4 14.4,4" fill="currentColor"/>',
    };

    badge.setAttribute("title", kind);
    badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none">${icons[kind]}</svg>`;
    return badge;
  }

  private getIconKind(
    stencil: string,
    shapeInfo?: PrimaryShapeInfo,
  ):
    | "task"
    | "task-user"
    | "task-service"
    | "task-manual"
    | "task-script"
    | "task-send"
    | "task-receive"
    | "task-business-rule"
    | "task-automatic"
    | "subprocess"
    | "call-activity"
    | "transaction"
    | "gateway-exclusive"
    | "gateway-parallel"
    | "gateway-inclusive"
    | "gateway-event"
    | "gateway-complex"
    | "event-start"
    | "event-end"
    | "event-intermediate"
    | "event-boundary"
    | "sequence-flow"
    | "message-flow"
    | "association"
    | "data-object"
    | "data-store"
    | "pool-lane"
    | "annotation"
    | "group"
    | "conversation"
    | "choreography-task"
    | "message"
    | "event-start-timer"
    | "event-start-message"
    | "event-start-signal"
    | "event-start-conditional"
    | "event-start-link"
    | "event-start-multiple"
    | "event-intermediate-timer"
    | "event-intermediate-message"
    | "event-intermediate-signal"
    | "event-intermediate-conditional"
    | "event-intermediate-link"
    | "event-intermediate-multiple"
    | "event-end-message"
    | "event-end-signal"
    | "event-end-error"
    | "event-end-compensation"
    | "event-end-escalation"
    | "event-end-terminate"
    | "event-boundary-timer"
    | "event-boundary-message"
    | "event-boundary-signal"
    | "event-boundary-conditional"
    | "event-boundary-link"
    | "event-boundary-multiple"
    | "event-boundary-compensation"
    | "event-boundary-error"
    | "generic" {
    const propertyStrings = Object.values(shapeInfo?.properties ?? {})
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .toLowerCase();
    const aggregate = `${stencil} ${propertyStrings}`;
    const eventFlavor = this.getEventFlavor(aggregate);

    if (stencil.includes("usertask")) return "task-user";
    if (stencil.includes("servicetask") || stencil.includes("service")) return "task-service";
    if (stencil.includes("manualtask") || stencil.includes("manual")) return "task-manual";
    if (stencil.includes("scripttask") || stencil.includes("script")) return "task-script";
    if (stencil.includes("sendtask")) return "task-send";
    if (stencil.includes("receivetask")) return "task-receive";
    if (stencil.includes("businessruletask") || stencil.includes("decision")) return "task-business-rule";
    if (stencil.includes("automatic")) return "task-automatic";

    if (stencil.includes("transaction")) return "transaction";
    if (stencil.includes("callactivity")) return "call-activity";
    if (stencil.includes("subprocess")) return "subprocess";
    if (stencil.includes("parallelgateway")) return "gateway-parallel";
    if (stencil.includes("inclusivegateway")) return "gateway-inclusive";
    if (stencil.includes("eventbasedgateway")) return "gateway-event";
    if (stencil.includes("complexgateway")) return "gateway-complex";
    if (stencil.includes("gateway")) return "gateway-exclusive";
    if (stencil.includes("boundaryevent")) {
      if (eventFlavor) return `event-boundary-${eventFlavor}` as ReturnType<FavoritesOverlay["getIconKind"]>;
      return "event-boundary";
    }
    if (stencil.includes("startevent")) {
      if (eventFlavor) return `event-start-${eventFlavor}` as ReturnType<FavoritesOverlay["getIconKind"]>;
      return "event-start";
    }
    if (stencil.includes("endevent")) {
      if (eventFlavor) return `event-end-${eventFlavor}` as ReturnType<FavoritesOverlay["getIconKind"]>;
      return "event-end";
    }
    if (stencil.includes("event")) {
      if (eventFlavor) return `event-intermediate-${eventFlavor}` as ReturnType<FavoritesOverlay["getIconKind"]>;
      return "event-intermediate";
    }
    if (stencil.includes("messageflow")) return "message-flow";
    if (stencil.includes("sequenceflow")) return "sequence-flow";
    if (stencil.includes("association")) return "association";
    if (stencil.includes("dataobject")) return "data-object";
    if (stencil.includes("datastore")) return "data-store";
    if (stencil.includes("group")) return "group";
    if (stencil.includes("conversation")) return "conversation";
    if (stencil.includes("choreography")) return "choreography-task";
    if (
      stencil.includes("pool") ||
      stencil.includes("lane") ||
      stencil.includes("participant")
    )
      return "pool-lane";
    if (stencil.includes("annotation")) return "annotation";
    if (stencil.includes("message")) return "message";
    if (
      stencil.includes("task") ||
      stencil.includes("activity") ||
      stencil.includes("callactivity")
    )
      return "task";
    return "generic";
  }

  private getEventFlavor(aggregate: string):
    | "timer"
    | "message"
    | "signal"
    | "conditional"
    | "link"
    | "multiple"
    | "error"
    | "compensation"
    | "escalation"
    | "terminate"
    | "" {
    if (aggregate.includes("timer")) return "timer";
    if (aggregate.includes("message")) return "message";
    if (aggregate.includes("signal")) return "signal";
    if (aggregate.includes("conditional")) return "conditional";
    if (aggregate.includes("linkevent") || aggregate.includes(" link ")) return "link";
    if (aggregate.includes("multiple")) return "multiple";
    if (aggregate.includes("error")) return "error";
    if (aggregate.includes("compensation")) return "compensation";
    if (aggregate.includes("escalation")) return "escalation";
    if (aggregate.includes("terminate")) return "terminate";
    return "";
  }

  private hasRoundedBackground(
    _iconKind: ReturnType<FavoritesOverlay["getIconKind"]>,
  ): boolean {
    return false;
  }

  private getIconSvg(
    iconKind: ReturnType<FavoritesOverlay["getIconKind"]>,
  ): string {
    const taskBase =
      '<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';

    if (iconKind.startsWith("event-start-")) {
      return this.getEventSvg("start", iconKind.replace("event-start-", ""));
    }
    if (iconKind.startsWith("event-intermediate-")) {
      return this.getEventSvg(
        "intermediate",
        iconKind.replace("event-intermediate-", ""),
      );
    }
    if (iconKind.startsWith("event-end-")) {
      return this.getEventSvg("end", iconKind.replace("event-end-", ""));
    }
    if (iconKind.startsWith("event-boundary-")) {
      return this.getEventSvg("boundary", iconKind.replace("event-boundary-", ""));
    }

    switch (iconKind) {
      case "task":
        return taskBase;
      case "task-user":
        return this.getTaskWithGlyph(
          '<circle cx="70" cy="45" r="9" fill="#5f5f5f"/><path d="M52 67 C52 57 60 52 70 52 C80 52 88 57 88 67" fill="#5f5f5f"/>',
        );
      case "task-service":
        return this.getTaskWithGlyph(
          '<circle cx="70" cy="52" r="13" fill="none" stroke="#5f5f5f" stroke-width="2.6"/><circle cx="70" cy="52" r="4" fill="#5f5f5f"/><line x1="70" y1="36" x2="70" y2="40" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="64" x2="70" y2="68" stroke="#5f5f5f" stroke-width="2.2"/><line x1="54" y1="52" x2="58" y2="52" stroke="#5f5f5f" stroke-width="2.2"/><line x1="82" y1="52" x2="86" y2="52" stroke="#5f5f5f" stroke-width="2.2"/>',
        );
      case "task-manual":
        return this.getTaskWithGlyph(
          '<path d="M58 66 V50 C58 48 59.2 46.8 61 46.8 C62.8 46.8 64 48 64 50 V56" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M64 56 V45 C64 42.8 65.4 41.4 67.4 41.4 C69.3 41.4 70.8 42.8 70.8 45 V56.5" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M70.8 54.8 C72.5 53.8 74.8 54.4 75.8 56.2 L79.2 62" fill="none" stroke="#5f5f5f" stroke-width="2.4"/>',
        );
      case "task-script":
        return this.getTaskWithGlyph(
          '<path d="M59 37 H77 L84 44 V67 H59 Z" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><line x1="63" y1="50" x2="80" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><line x1="63" y1="57" x2="78" y2="57" stroke="#5f5f5f" stroke-width="2.2"/>',
        );
      case "task-send":
        return this.getTaskWithGlyph(
          '<rect x="56" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M56 44 L67 51 L78 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="78" y1="50" x2="88" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="88,50 82,46.2 82,53.8" fill="#5f5f5f"/>',
        );
      case "task-receive":
        return this.getTaskWithGlyph(
          '<rect x="62" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M62 44 L73 51 L84 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="52" y1="50" x2="62" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="52,50 58,46.2 58,53.8" fill="#5f5f5f"/>',
        );
      case "task-business-rule":
        return this.getTaskWithGlyph(
          '<rect x="56" y="39" width="28" height="22" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="56" y1="48" x2="84" y2="48" stroke="#5f5f5f" stroke-width="2.2"/><line x1="65" y1="39" x2="65" y2="61" stroke="#5f5f5f" stroke-width="2.2"/>',
        );
      case "task-automatic":
        return this.getTaskWithGlyph(
          '<polygon points="66,36 60,52 68,52 65,67 82,46 74,46 77,36" fill="#5f5f5f"/>',
        );
      case "subprocess":
        return '<rect x="20" y="18" width="100" height="68" rx="15" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="64" y1="74" x2="76" y2="74" stroke="#666" stroke-width="2.4"/><line x1="70" y1="68" x2="70" y2="80" stroke="#666" stroke-width="2.4"/>';
      case "call-activity":
        return '<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#505050" stroke-width="4"/><rect x="22" y="24" width="96" height="56" rx="12" fill="none" stroke="#646464" stroke-width="2"/>';
      case "transaction":
        return '<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="24" y="26" width="92" height="52" rx="10" fill="none" stroke="#666" stroke-width="2.2"/>';
      case "gateway-exclusive":
        return '<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="55" y1="38" x2="85" y2="66" stroke="#636363" stroke-width="3"/><line x1="85" y1="38" x2="55" y2="66" stroke="#636363" stroke-width="3"/>';
      case "gateway-parallel":
        return '<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="33" x2="70" y2="71" stroke="#636363" stroke-width="3.2"/><line x1="51" y1="52" x2="89" y2="52" stroke="#636363" stroke-width="3.2"/>';
      case "gateway-inclusive":
        return '<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="17" fill="none" stroke="#666" stroke-width="3"/>';
      case "gateway-event":
        return '<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="14" fill="none" stroke="#666" stroke-width="2.6"/><polygon points="70,38 76,50 70,64 64,50" fill="#666"/>';
      case "gateway-complex":
        return '<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="32" x2="70" y2="72" stroke="#666" stroke-width="2.6"/><line x1="50" y1="52" x2="90" y2="52" stroke="#666" stroke-width="2.6"/><line x1="55" y1="37" x2="85" y2="67" stroke="#666" stroke-width="2.4"/><line x1="85" y1="37" x2="55" y2="67" stroke="#666" stroke-width="2.4"/>';
      case "event-start":
        return '<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';
      case "event-end":
        return '<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#4d4d4d" stroke-width="5"/>';
      case "event-intermediate":
        return '<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>';
      case "event-boundary":
        return '<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/><circle cx="70" cy="52" r="6" fill="#737373"/>';
      case "sequence-flow":
        return '<line x1="18" y1="52" x2="120" y2="52" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/><polygon points="120,52 102,42 102,62" fill="#5a5a5a"/>';
      case "message-flow":
        return '<line x1="16" y1="52" x2="120" y2="52" stroke="#6a6a6a" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/><polygon points="120,52 103,42 103,62" fill="#6a6a6a"/><rect x="52" y="35" width="34" height="24" rx="2" fill="#f6f4d4" stroke="#666" stroke-width="2"/>';
      case "association":
        return '<line x1="18" y1="52" x2="120" y2="52" stroke="#737373" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>';
      case "data-object":
        return '<path d="M32 18 H90 L108 36 V86 H32 Z" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M90 18 V36 H108" fill="none" stroke="#575757" stroke-width="3"/>';
      case "data-store":
        return '<ellipse cx="70" cy="28" rx="34" ry="11" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M36 28 V76 C36 83 51 88 70 88 C89 88 104 83 104 76 V28" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><ellipse cx="70" cy="28" rx="23" ry="7" fill="none" stroke="#666" stroke-width="1.8"/><path d="M40 48 C40 54 54 58 70 58 C86 58 100 54 100 48" fill="none" stroke="#666" stroke-width="1.8"/>';
      case "pool-lane":
        return '<rect x="16" y="16" width="108" height="72" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="42" y1="16" x2="42" y2="88" stroke="#666" stroke-width="2.6"/><line x1="42" y1="52" x2="124" y2="52" stroke="#666" stroke-width="2.2"/>';
      case "annotation":
        return '<path d="M34 20 H94 L108 34 V84 H34 Z" fill="#f6f4d4" stroke="#666" stroke-width="3"/><path d="M94 20 V34 H108" fill="none" stroke="#666" stroke-width="3"/><line x1="42" y1="44" x2="97" y2="44" stroke="#777" stroke-width="2"/><line x1="42" y1="56" x2="97" y2="56" stroke="#777" stroke-width="2"/><line x1="42" y1="68" x2="85" y2="68" stroke="#777" stroke-width="2"/>';
      case "group":
        return '<rect x="18" y="18" width="104" height="68" rx="10" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="7 6"/>';
      case "conversation":
        return '<polygon points="70,14 116,38 116,66 70,90 24,66 24,38" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';
      case "choreography-task":
        return '<rect x="16" y="18" width="108" height="68" rx="10" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="16" y="18" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/><rect x="16" y="72" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/>';
      case "message":
        return '<rect x="24" y="24" width="92" height="56" rx="8" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M24 28 L70 58 L116 28" fill="none" stroke="#666" stroke-width="2.8"/>';
      case "generic":
      default:
        return taskBase;
    }
  }

  private getTaskWithGlyph(glyph: string): string {
    return `<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>${glyph}`;
  }

  private getEventSvg(
    frame: "start" | "intermediate" | "end" | "boundary",
    flavor: string,
  ): string {
    const outerStroke = frame === "end" ? "5" : "3";
    let frameSvg = `<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="${outerStroke}"/>`;

    if (frame === "intermediate" || frame === "boundary") {
      frameSvg += '<circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>';
    }
    if (frame === "boundary") {
      frameSvg += '<circle cx="70" cy="52" r="31" fill="none" stroke="#575757" stroke-width="2" stroke-dasharray="3.5 2.8"/>';
    }

    return `${frameSvg}${this.getEventFlavorSymbol(flavor)}`;
  }

  private getEventFlavorSymbol(flavor: string): string {
    switch (flavor) {
      case "timer":
        return '<circle cx="70" cy="52" r="12" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="76" y2="55" stroke="#5f5f5f" stroke-width="2.2"/>';
      case "message":
        return '<rect x="58" y="43" width="24" height="18" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M58 45 L70 53 L82 45" fill="none" stroke="#5f5f5f" stroke-width="1.9"/>';
      case "signal":
        return '<path d="M57 57 C60 51 64 49 70 49 C76 49 80 51 83 57" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M60 61 C63 57 66 55.5 70 55.5 C74 55.5 77 57 80 61" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><circle cx="70" cy="64" r="2.3" fill="#5f5f5f"/>';
      case "conditional":
        return '<rect x="58" y="41" width="24" height="22" rx="2.5" fill="none" stroke="#5f5f5f" stroke-width="2.1"/><line x1="62" y1="48" x2="78" y2="48" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="54" x2="78" y2="54" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="60" x2="74" y2="60" stroke="#5f5f5f" stroke-width="2"/>';
      case "link":
        return '<path d="M62 52 C62 49 64 47 67 47 H72" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M72 47 L69.5 44.6 M72 47 L69.5 49.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M78 52 C78 55 76 57 73 57 H68" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M68 57 L70.5 54.6 M68 57 L70.5 59.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/>';
      case "multiple":
        return '<circle cx="64" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="70" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="76" cy="52" r="2.6" fill="#5f5f5f"/>';
      case "error":
        return '<line x1="62" y1="44" x2="78" y2="60" stroke="#5f5f5f" stroke-width="2.5"/><line x1="78" y1="44" x2="62" y2="60" stroke="#5f5f5f" stroke-width="2.5"/>';
      case "compensation":
        return '<polygon points="70,52 78,47 78,57" fill="#5f5f5f"/><polygon points="62,52 70,47 70,57" fill="#5f5f5f"/>';
      case "escalation":
        return '<line x1="70" y1="60" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="70,42 77,49 63,49" fill="#5f5f5f"/>';
      case "terminate":
        return '<rect x="63" y="45" width="14" height="14" fill="#5f5f5f"/>';
      default:
        return "";
    }
  }

  private moveSelectionByKey(key: string): void {
    const currentIndex = this.filtered.findIndex(
      (favorite) => favorite.id === this.selectedId,
    );
    if (currentIndex < 0) {
      return;
    }

    const columns = this.getColumnCount();

    let nextIndex = currentIndex;
    if (key === "ArrowLeft") {
      nextIndex = currentIndex - 1;
    } else if (key === "ArrowRight") {
      nextIndex = currentIndex + 1;
    } else if (key === "ArrowUp") {
      nextIndex = currentIndex - columns;
    } else if (key === "ArrowDown") {
      nextIndex = currentIndex + columns;
    }

    nextIndex = Math.max(0, Math.min(this.filtered.length - 1, nextIndex));
    this.selectedId = this.filtered[nextIndex]?.id ?? this.selectedId;
    this.updateSelectedCardClasses();
    this.scrollSelectedCardToTopIfOutOfView();
  }

  private scrollSelectedCardToTopIfOutOfView(): void {
    if (!this.selectedId) {
      return;
    }

    const selectedCard = this.cardById.get(this.selectedId);
    if (!selectedCard) {
      return;
    }

    const containerRect = this.listWrap.getBoundingClientRect();
    const cardRect = selectedCard.getBoundingClientRect();
    const topPadding = 10;
    const isOutOfView =
      cardRect.top < containerRect.top + topPadding ||
      cardRect.bottom > containerRect.bottom;

    if (!isOutOfView) {
      return;
    }

    const deltaTop = cardRect.top - containerRect.top;
    const nextTop = this.listWrap.scrollTop + deltaTop - topPadding;
    this.listWrap.scrollTo({
      top: Math.max(0, nextTop),
      behavior: "smooth",
    });
  }

  private moveSelectionToLeftNeighborOnDelete(): void {
    const currentIndex = this.filtered.findIndex(
      (favorite) => favorite.id === this.selectedId,
    );
    if (currentIndex < 0) {
      return;
    }

    if (currentIndex > 0) {
      this.selectedId = this.filtered[currentIndex - 1]?.id ?? null;
      return;
    }

    this.selectedId = this.filtered[1]?.id ?? null;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.opened) {
      return;
    }

    // Always block Signavio editor shortcuts while overlay is open.
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    const selected = this.getSelectedFavorite();
    if (event.altKey && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      if (selected) {
        this.enterListMode();
        this.moveSelectionToLeftNeighborOnDelete();
        void this.actions.onDelete(selected);
      }
      return;
    }

    const isArrow = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ].includes(event.key);
    const isPrintable =
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey;

    if (this.mode === "search") {
      if (event.key === "Delete" || event.key === "Backspace") {
        // Keep delete scoped to search text while typing.
        return;
      }

      if (isArrow || event.key === "Enter") {
        event.preventDefault();
        this.enterListMode();

        if (isArrow) {
          this.moveSelectionByKey(event.key);
          return;
        }

        if (selected) {
          this.close();
          void this.actions.onInsert(selected);
        }
        return;
      }

      // Normal typing in search mode.
      return;
    }

    // List mode
    if (isPrintable) {
      event.preventDefault();
      this.enterSearchMode(event.key);
      return;
    }

    if (!selected) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.close();
      void this.actions.onInsert(selected);
      return;
    }

    if (
      event.altKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? "up" : "down";
      void this.actions.onMove(selected, direction);
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      // Prevent browser navigation or page-level delete actions.
      event.preventDefault();
      return;
    }

    if (!isArrow) {
      return;
    }

    event.preventDefault();
    this.moveSelectionByKey(event.key);
  };

  private onResize = (): void => {
    if (!this.opened) {
      return;
    }
    this.scheduleTypeLabelFit();
  };

  private getColumnCount(): number {
    const width = this.grid.clientWidth;
    if (width <= 0) {
      return 4;
    }

    return Math.max(1, Math.floor(width / CARD_MIN_WIDTH));
  }

  private getStyles(): string {
    return `
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .bpkeys-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483600;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .bpkeys-wrapper.open {
        display: flex;
      }

      .bpkeys-scrim {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 14, 0.2);
        backdrop-filter: blur(3px);
      }

      .bpkeys-panel {
        position: relative;
        width: min(900px, 95vw);
        min-height: min(520px, 74vh);
        max-height: 80vh;
        padding: 20px;
        border-radius: 30px;
        background: rgba(26, 28, 33, 0.78);
        backdrop-filter: blur(8px) saturate(110%);
        box-shadow: 0 22px 54px rgba(0, 0, 0, 0.62);
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto auto;
        gap: 12px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        overflow: hidden;
      }

      .bpkeys-top-row {
        display: flex;
        align-items: center;
      }

      .bpkeys-search-shell {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 11px;
      }

      .bpkeys-search-icon {
        width: 18px;
        height: 18px;
        color: rgba(236, 236, 236, 0.88);
        display: inline-flex;
        flex: 0 0 auto;
      }

      .bpkeys-search-icon svg {
        width: 100%;
        height: 100%;
      }

      .bpkeys-search {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        color: #ececec;
        font-size: 17px;
        font-weight: 500;
        line-height: 1.1;
        letter-spacing: 0.01em;
      }

      .bpkeys-search::placeholder {
        color: rgba(236, 236, 236, 0.88);
      }

      .bpkeys-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .bpkeys-list-wrap {
        overflow-x: hidden;
        overflow-y: auto;
        min-height: 0;
        padding: 10px 2px;
        margin: -12px 0;
      }

      .bpkeys-list-wrap::-webkit-scrollbar {
        width: 8px;
      }

      .bpkeys-list-wrap::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 999px;
      }

      .bpkeys-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 14px;
        align-content: start;
        width: 100%;
        padding: 2px;
      }

      .bpkeys-card {
        border: 1px solid transparent;
        display: grid;
        justify-items: center;
        align-items: start;
        grid-template-rows: auto 1fr;
        height: auto;
        border-radius: 22px;
        background: #383a3fb0;
        color: #ececec;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        outline: none;
        overflow: visible;
      }

      .bpkeys-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 16px -4px rgba(0, 0, 0, 0.4);
      }

      .bpkeys-card.selected {
        background: #474950b0;
        border-color: rgba(236, 236, 236, 0.72);
        box-shadow: 0 0 0 1px rgba(236, 236, 236, 0.18) inset;
      }

      .bpkeys-preview {
        width: 176px;
        height: 108px;
        border-radius: 14px;
        background: #313338;
        border: 1px solid transparent;
        margin-top: 10px;
        margin-bottom: 5px;
        display: grid;
        place-items: center;
        overflow: visible;
        position: relative;
        padding-bottom: 16px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }

      .bpkeys-preview.rounded-bg {
        background: rgba(24, 28, 35, 0.84);
        border-color: rgba(228, 228, 228, 0.18);
      }

      .bpkeys-preview.shape-only {
        border: none;
      }

      .bpkeys-preview.has-content {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      }

      .bpkeys-preview.is-empty {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
      }

      .bpkeys-preview-svg {
        width: 80%;
        height: 100%;
        overflow: visible;
        transform: translateY(-8px);
      }

      .bpkeys-preview-stack {
        position: relative;
        width: 100%;
        height: 100%;
        transform: translateY(-5px);
      }

      .bpkeys-preview-bubble {
        position: absolute;
        border-radius: 12px;
        background: #313338;
        border: 1px solid rgba(241, 241, 241, 0.16);
        box-shadow: 0 7px 14px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }

      .bpkeys-preview-bubble-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

.bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
	width: 69px;
	height: 54px;
	left: calc(50% - 69px);
	top: 33px;
	z-index: 1;
}

      .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
        width: 69px;
        height: 54px;
        left: calc(50% + 3px);
        top: 16px;
        z-index: 2;
      }

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
	width: 52px;
	height: 41px;
	left: 23px;
	top: 41px;
	z-index: 1;
}

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
	width: 52px;
	height: 41px;
	left: 96px;
	top: 46px;
	z-index: 2;
}

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
	width: 52px;
	height: 41px;
	left: 50px;
	top: 14px;
	z-index: 3;
}

      .bpkeys-preview.is-empty .bpkeys-preview-svg {
        opacity: 0.94;
      }

      .bpkeys-type-inline {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #f3f3f3;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-align: center;
        pointer-events: none;
      }

      .bpkeys-type-badge-center {
        position: absolute;
        left: 50%;
        top: 44%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: #f4f4f4;
        background: rgba(20, 25, 33, 0.95);
        border: 1px solid rgba(244, 244, 244, 0.46);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.34);
        pointer-events: none;
      }

      .bpkeys-type-badge-center svg {
        width: 25px;
        height: 25px;
      }

      .bpkeys-badge-row {
        position: absolute;
        top: -6px;
        right: -6px;
        display: flex;
        gap: 4px;
      }

      .bpkeys-badge {
        width: 23px;
        height: 23px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(19, 24, 32, 0.95);
        border: 1px solid rgba(244, 244, 244, 0.46);
        color: #f1f1f1;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.32);
      }

      .bpkeys-badge svg {
        width: 16px;
        height: 16px;
      }

      .bpkeys-card-label {
        padding: 0 10px 8px 10px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(243, 243, 243, 0.88);
        line-height: 1.2;
        text-align: center;
        white-space: normal;
        overflow: hidden;
        max-height: calc(1.2em * 3);
        display: block;
        -webkit-mask-image: linear-gradient( to bottom, rgb(0, 0, 0) 74%, rgba(0, 0, 0, 0) calc(100% - 4px));
        mask-image: linear-gradient( to bottom, rgb(0, 0, 0) 74%, rgba(0, 0, 0, 0) calc(100% - 4px));
        width: 100%;
        align-self: start;
      }

      .bpkeys-empty {
        display: none;
        font-size: 14px;
        color: rgba(243, 243, 243, 0.86);
        padding: 6px 2px;
      }

      .bpkeys-footer-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .bpkeys-hints {
        align-self: end;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        color: rgba(243, 243, 243, 0.84);
        padding-top: 1px;
        min-height: 24px;
        margin: -8px 5px -13px 5px;
      }

      .bpkeys-hint-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .bpkeys-hint-action {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .bpkeys-hint-key {
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        padding: 4px 7px;
        border-radius: 7px;
        background: rgba(176, 182, 192, 0.18);
        border: 1px solid rgba(210, 214, 220, 0.22);
        color: #f2f2f2;
      }

      .bpkeys-hint-separator {
        margin: 0 3px;
        font-size: 12px;
        color: rgba(243, 243, 243, 0.44);
      }

      @media (max-width: 1000px) {
        .bpkeys-panel {
          width: min(900px, calc(100vw - 12px));
          min-height: min(500px, calc(100vh - 12px));
          max-height: calc(100vh - 12px);
          border-radius: 24px;
          padding: 14px;
          gap: 9px;
        }

        .bpkeys-search {
          font-size: 15px;
        }

        .bpkeys-grid {
          grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
          gap: 10px;
        }

        .bpkeys-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 18px;
        }

        .bpkeys-preview {
          width: min(100%, 120px);
          height: 86px;
          border-radius: 14px;
          margin-bottom: 6px;
          padding-bottom: 12px;
        }

        .bpkeys-preview-svg {
          transform: translateY(-4px);
        }

        .bpkeys-preview-stack {
          transform: translateY(-3px);
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
          width: 44px;
          height: 32px;
          left: calc(50% - 45px);
          top: 21px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
          width: 44px;
          height: 32px;
          left: calc(50% + 1px);
          top: 15px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
          width: 38px;
          height: 28px;
          left: 8px;
          top: 28px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
          width: 38px;
          height: 28px;
          left: 56px;
          top: 20px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
          width: 38px;
          height: 28px;
          left: 32px;
          top: 8px;
        }

        .bpkeys-type-badge-center {
          width: 32px;
          height: 32px;
          top: 50%;
        }

        .bpkeys-type-badge-center svg {
          width: 20px;
          height: 20px;
        }

        .bpkeys-type-inline {
          left: 8px;
          right: 8px;
          bottom: 4px;
          font-size: 11px;
        }

        .bpkeys-card-label {
          font-size: 11px;
          padding: 0 8px 8px;
          max-height: calc(1.2em * 3);
        }

        .bpkeys-hints {
          gap: 6px;
          row-gap: 5px;
        }

        .bpkeys-hint-action {
          font-size: 11px;
        }

        .bpkeys-hint-key {
          font-size: 10px;
          padding: 3px 6px;
        }
      }

      @media (max-width: 700px) {
        .bpkeys-panel {
          width: calc(100vw - 10px);
          min-height: min(460px, calc(100vh - 10px));
          max-height: calc(100vh - 10px);
          border-radius: 20px;
          padding: 12px;
          gap: 8px;
        }

        .bpkeys-grid {
          grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
          gap: 8px;
        }

        .bpkeys-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 16px;
        }

        .bpkeys-preview {
          width: min(100%, 112px);
          height: 82px;
          margin-top: 8px;
          margin-bottom: 5px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
          width: 40px;
          height: 30px;
          left: calc(50% - 42px);
          top: 20px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
          width: 40px;
          height: 30px;
          left: calc(50% + 2px);
          top: 14px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
          width: 35px;
          height: 26px;
          left: 8px;
          top: 27px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
          width: 35px;
          height: 26px;
          left: 52px;
          top: 19px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
          width: 35px;
          height: 26px;
          left: 30px;
          top: 8px;
        }

        .bpkeys-type-badge-center {
          width: 30px;
          height: 30px;
          top: 50%;
        }

        .bpkeys-type-badge-center svg {
          width: 18px;
          height: 18px;
        }

        .bpkeys-card-label {
          font-size: 10px;
          padding: 0 7px 7px;
        }

        .bpkeys-hints {
          gap: 5px;
          row-gap: 4px;
        }

        .bpkeys-hint-action {
          font-size: 10px;
        }

        .bpkeys-hint-key {
          font-size: 9px;
          padding: 3px 5px;
        }
      }
    `;
  }
}
