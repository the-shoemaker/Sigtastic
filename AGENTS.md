# AGENTS Notes — Sigtastic

Updated: 2026-03-12

## Purpose

This file records odd/tricky implementation details for future agents.

## Current Architecture

- Framework: WXT
- Entrypoints:
  - `entrypoints/background.ts`
  - `entrypoints/content.ts`
  - `entrypoints/settings.html`
- Page-context hook:
  - `public/clipboard-hook.js`
- Overlay UI and interactions:
  - `src/content/overlay.ts`
- Full settings site UI:
  - `src/options/settings-page.ts`
  - `src/options/settings-page.css`
- Shared settings / shortcut source of truth:
  - `src/shared/shortcuts.ts`
  - `src/shared/settings.ts`
  - `src/shared/config-transfer.ts`
- Clipboard messaging helper:
  - `src/content/signavio-clipboard.ts`
- Payload portability logic:
  - `src/shared/payload.ts`
- Shared models/storage:
  - `src/shared/types.ts`, `src/shared/storage.ts`

## Critical Runtime Behavior

- Signavio clipboard uses `POST /p/clipboard` (server-side clipboard model).
- Capture and write should both happen in page context.
- Write path now uses template persistence:
  - Capture stores header template + form param template (excluding `value_json`)
  - Favorites persist template
  - On startup, content script bootstraps template to hook so writes can work after reload without a fresh copy
- Write request strategy:
  - Try raw payload first
  - Retry with sanitized payload on failure
- Auto save runs from the content script on a timer, but the actual model save happens in page context.
  - Current implementation serializes the live editor canvas and `PUT`s it to `/p/model/{id}` directly.
  - This is intended to bypass Signavio's logic-error confirmation flow.
- Toolbar icon now opens the bundled full-page settings site (`settings.html`), not a popup.
- Global Signavio shortcuts are now handled by the content script using shared settings state.
  - There is no browser command fallback path anymore.
  - If shortcuts regress, inspect `entrypoints/content.ts` first, not the manifest.

## Settings / Config Rules

- Shortcut definitions live in `src/shared/shortcuts.ts`.
- This must stay complete:
  - every user-facing shortcut action must be added to `SHORTCUT_DEFINITIONS`
  - overlay-local actions count too, not just global actions
- Shortcut persistence lives in `src/shared/settings.ts`.
- All user-customizable data that should survive export/import must round-trip through `src/shared/config-transfer.ts`.
- If a new customizable feature is added and it is not included in config export/import, that is a bug.
- Auto-save settings live in shared settings and must keep exporting/importing with the rest of config.
- The settings page docs are rendered from `public/settings-docs.md`, so add product explanations there instead of hardcoding them into the page layout.
- Settings UI is view-based (`General`, `Shortcuts`, `Documentation`) via sidebar switching, not a long scrolling one-page layout.

## Keyboard Model

- Overlay has explicit mode state:
  - `search` mode: text entry + delete edits search only
  - `list` mode: navigation/actions on favorites
- Shortcut values are now configurable per platform via Settings.
  - Current platform bindings are resolved from shared settings, not hardcoded strings.
  - `Esc` remains reserved for close/confirm behavior and is intentionally not assignable.
  - Shortcut capture in Settings is:
    - press desired shortcut
    - press `Esc` to confirm
    - press `Delete` / `Backspace` to reset to defaults
- On delete, selection moves left neighbor first (or next available if first item deleted)
- Insert flow:
  - On the configured insert shortcut, extension writes payload to `/p/clipboard`; user pastes manually with `Cmd/Ctrl+V`.
- Save flow:
  - On the configured save shortcut, extension uses latest captured payload (no synthetic keyboard copy).

## UI Notes

- Top search/header fixed; only component area scrolls.
- Panel compact, darker, transparent, thin light border.
- Panel and backdrop blur were reduced for readability of the underlying model.
- Backdrop blur behind the component panel is now user-configurable from Settings (`appearance.overlayBackdropBlur`).
  - Disabled state removes only the surrounding page blur/scrim blur.
  - The panel itself still keeps its local blur treatment.
- Panel layout now uses 5 explicit grid rows (`search`, divider, list, footer-divider, tips) and `minmax(0,1fr)` list row to prevent footer overflow.
- Preview icon system supports multiple BPMN stencil families.
- Main icon now represents only the BPMN element family.
- Top-right badges are chained for context/status (`content`, `multi-element`, message/timer/etc.).
- Task subtype is rendered as a larger centered badge on the icon for quick scanning.
- Full-width bottom text badge on the icon shows the element type (Task/Subprocess/etc).
- Bottom text now shows content only, with `Empty` fallback.
- Warning/error and triangle-style context badges were intentionally removed per UX request.
- For non-rounded shapes preview background is transparent; only shape itself is yellow-filled.
- For rounded task-like previews, secondary yellow card background is removed (dark neutral background only).
- Keep SVG viewBox with margin (`-4 -4 148 112`) to avoid stroke clipping at icon edges.
- Multi-element favorites render up to 3 element icons in overlapped "bubble" composition.
- Bubble composition affects only the main element icon layer; center type badge remains positioned independently.
- Duplicate badge is added when favorites match on visual signature only:
  - type text
  - visual name
  - visual content
  - other (context) badges
- Content label supports up to ~3 lines and fades out at the bottom.
- `Data Store` and `Text Annotation` icon drawings were refined for stronger visual recognition.

## Save Modal

- Save flow uses a custom in-page modal (not `window.prompt`), with two inputs:
  - `Name` (visual label)
  - `Content` (visual content text)
- These fields only affect overlay rendering; paste payload remains exactly the captured snippet data.
- Favorites persist custom flags (`displayNameCustom` / `displayContentCustom`) so defaults can evolve while respecting user custom values.

## Naming / Duplicate Logic

- Visual duplicate badge comparison intentionally uses only:
  - type text
  - visual name
  - visual content
  - context badges
- Type labels use middle-ellipsis truncation for long names (Finder-like, preserving both prefix and suffix).
- Type labels now use strict middle `...` truncation only (no CSS end-ellipsis fallback) to keep suffixes readable.

## Icon Variants

- Added broader variant icon rendering:
  - task subtype variants (`user`, `service`, `manual`, `script`, `send`, `receive`, `business-rule`, `automatic`)
  - event flavor variants across start/intermediate/end/boundary (`timer`, `message`, `signal`, `conditional`, `link`, `multiple`, `error`, `compensation`, `escalation`, `terminate`)
- Compensation/back-arrow glyph coordinates were re-centered for visual balance.
- Center task-type badge returned to true center alignment in preview cards.
- Preview icon background width was increased to give type names more usable horizontal room.
- Save modal inputs now use border-box sizing and responsive panel constraints to prevent right-edge overflow.
- Duplicate badge icon was reverted to stacked-copy style per UX preference.
- Multi-element bubble previews were reduced in size and spaced farther apart (desktop + mobile).
- Type name truncation now fits dynamically to actual available label width (with middle `...`), including on resize.
- Card content text row is now top-aligned (not vertically centered in the label area).
- Multi-element bubbles: 2-item stacks are centered as one staggered group; 3-item stacks keep the existing layout.
- Gateway (diamond) icons now render at `height: 75%` for better proportions.
- Small-screen overflow/layout adjustments are done only in media-query rules (`<=1000px` and `<=700px`).
- Save default name for multi-element snippets now uses: `{first element name}, more...`.
- Arrow-key selection now auto-scrolls the list when out of view: selected card moves to top with 10px padding (smooth scroll).
- Small-screen content clipping fix: media-query card heights are now `auto` with `grid-template-rows: auto auto` to preserve label space.
- Reorder (`Option+Up/Down`) now also triggers the same out-of-view follow-scroll behavior as arrow navigation.
- Added quick-edit shortcut `Option+Shift+E` with keyboard-driven mini menu (arrow navigation + Enter).
- Page hook now exposes editor query/action bridge via `postMessage`:
  - `editor-query-request` / `editor-query-result`
  - `editor-action-request` / `editor-action-result`
- Task type change uses best-effort direct task property mutation (`oryx-tasktype` + fallbacks) and canvas refresh.
- Duplicate action uses best-effort editor hooks (`ORYX.CONFIG.EVENT_COPY` / `EVENT_PASTE`) with `facade.copy`/`facade.paste` fallback.
- Quick-edit selection detection was widened:
  - supports selection from getter or state fields (`selection`, `currentSelection`, etc.)
  - shallow recursive scan through likely facade/editor containers
- Debug helper exposed in page context: `window.__sigtasticQuickEditDebug()`

## Search Behavior

- Overlay filtering now matches:
  - favorite display name
  - inferred element type text
  - extracted payload content text

## Payload Enrichment

- Before favorite save and sanitize, payload is enriched from `value_json.linked` when present:
  - linked `TextAnnotation` shapes are appended to `childShapes` if missing
  - linked `Association` connectors that reference copied/annotation shapes are appended if missing
- This is best-effort and depends on Signavio including related shapes in `linked`.

## Validation Notes

- Local checks passing:
  - `npm run typecheck`
  - `npm run build:firefox`
  - `npm run build:chrome`
- Manual Signavio checks still required for each major model type and after restarts.

## Handoff Checklist

1. Re-test persisted favorites after browser restart
2. If `/p/clipboard` 401 reappears, compare latest successful native copy request headers/body with extension write request
3. Extend icon mapping when encountering unknown stencil ids in real models

## Quick Edit Notes

- `Option+Shift+E` quick edit cannot rely on hidden Signavio/Oryx selection/runtime objects on this tenant.
- Working assumption now:
  - selected BPMN node is tracked from the last pointer target (`sid-*` SVG group/id)
  - task context is inferred from the visible property panel (`#property-window-header-title`, `Task type` row)
  - task type changes should use the visible ExtJS property-row DOM, not hidden model mutation hooks
- `public/clipboard-hook.js` now falls back to DOM-driven task-type changes via `applyTaskTypeActionDom()` and treats pointer/property-panel context as valid selection for quick edit.
- If quick edit regresses again, inspect the live property row/options first with:
  - `window.__sigtasticVisibleActionables()`
  - `window.__sigtasticTaskTypeDom()`

## Quick Edit Status

- The quick type menu is currently active again in the extension runtime.
- Its trigger is now part of the shared shortcut settings catalog instead of being treated as a fixed manifest shortcut.
- If quick edit regresses, validate both sides:
  - the shared shortcut wiring in `src/shared/shortcuts.ts` / `entrypoints/content.ts`
  - the page-context task-type DOM fallback path in `public/clipboard-hook.js`
