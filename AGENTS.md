# AGENTS Notes — Signavio BPKeys

Updated: 2026-03-06

## Purpose

This file records odd/tricky implementation details for future agents.

## Current Architecture

- Framework: WXT
- Entrypoints:
  - `entrypoints/background.ts`
  - `entrypoints/content.ts`
- Page-context hook:
  - `public/clipboard-hook.js`
- Overlay UI and interactions:
  - `src/content/overlay.ts`
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

## Keyboard Model

- Overlay has explicit mode state:
  - `search` mode: text entry + delete edits search only
  - `list` mode: navigation/actions on favorites
- Shortcuts in list mode:
  - `Option+Delete` or `Option+Backspace`: delete
  - `Option+Up/Down`: reorder
- On delete, selection moves left neighbor first (or next available if first item deleted)
- Insert flow:
  - On `Enter`, extension writes payload to `/p/clipboard`; user pastes manually with `Cmd/Ctrl+V`.
- Save flow:
  - On `Option+Shift+S`, extension uses latest captured payload (no synthetic keyboard copy).

## UI Notes

- Top search/header fixed; only component area scrolls.
- Panel compact, darker, transparent, thin light border.
- Panel and backdrop blur were reduced for readability of the underlying model.
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
  - `npm run build` (Firefox)
- Manual Signavio checks still required for each major model type and after restarts.

## Handoff Checklist

1. Re-test persisted favorites after browser restart
2. If `/p/clipboard` 401 reappears, compare latest successful native copy request headers/body with extension write request
3. Extend icon mapping when encountering unknown stencil ids in real models
