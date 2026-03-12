# Codex Implementation Brief – Signavio Quick Task Type Menu

This document describes how to implement a browser-extension-based quick menu for changing BPMN task types in the Signavio editor, based on the reverse engineering results.

Use this as the implementation brief.

---

# Goal

Add a fast UI on top of the Signavio editor that allows changing the selected task's task type without opening or using the native property dropdown.

Target task types:

- None
- Send
- Receive
- Script
- Service
- User
- Manual
- Business Rule

---

# Reverse-Engineered Facts

## Property key

The task type is stored in the BPMN model as:

```
oryx-tasktype
```

## Stored values

The editor writes the visible label values directly, e.g.:

```
None
Send
Receive
Script
Service
User
Manual
Business Rule
```

## Internal write path used by Signavio

Native property panel flow:

```
Property editor
→ dialogClosed
→ grid.onEditComplete(...)
→ afterEdit(...)
→ facade.executeCommands(...)
→ PropertyChangeCommand
→ shape.setProperty("oryx-tasktype", value)
```

## Important conclusion

Task types are **not different stencils**.

They are only a property on the same task shape.

---

# Recommended Implementation Strategy

Implement the feature as an injected runtime helper in the page context.

The extension should:

1. detect the active Signavio editor context
2. get the currently selected shape(s)
3. render a small floating quick menu near the selected task
4. on click, set `oryx-tasktype`
5. refresh the canvas
6. ideally preserve undo/redo by using the command system if accessible

---

# Preferred Write Strategy

## Option A – Best if accessible

Use Signavio's own command/facade system.

Desired behavior:

- preserve undo/redo
- preserve selection
- preserve property window synchronization

## Option B – Acceptable fallback

Direct property mutation:

```javascript
shape.setProperty("oryx-tasktype", "Service")
facade.getCanvas().update()
```

This is acceptable only if testing confirms:

- icon updates correctly
- XML/save output is correct
- no broken internal state

---

# Required Runtime Discovery

The implementation must locate:

1. selected shape(s)
2. a working editor/facade instance
3. the active task shape element in DOM if menu placement should be visual

Possible internal concepts seen during reverse engineering:

- `facade`
- `shapeSelection.shapes`
- `shape.setProperty(...)`
- `facade.getCanvas().update()`
- `facade.executeCommands(...)`

The implementation should be defensive:

- null-check everything
- fail silently if Signavio internals are not found

---

# UI Requirements

## Menu type

Recommended first version:

Floating quick menu near selected task.

## Menu contents

Buttons:

- None
- Send
- Receive
- Script
- Service
- User
- Manual
- Business Rule

## Behavior

- show only when a compatible task is selected
- hide when selection changes
- hide when clicking outside
- do not interfere with editor interactions

---

# Placement Requirements

If positioned relative to the shape:

- place near selected canvas element
- update on zoom/pan if possible
- prevent viewport overflow

Fallback:

- render fixed in a corner if geometry detection fails.

---

# Safe First Version

Implement in phases.

## Phase 1

- inject helper
- detect selected task
- render menu
- directly call

```javascript
shape.setProperty("oryx-tasktype", value)
facade.getCanvas().update()
```

## Phase 2

- switch to command-based updates
- preserve undo/redo
- improve menu positioning

---

# Suggested Runtime API Wrapper

```javascript
function setTaskType({ shape, facade, value }) {

  if (!shape || !facade) return false

  shape.setProperty("oryx-tasktype", value)

  const canvas = facade.getCanvas?.()
  if (canvas?.update) canvas.update()

  return true
}
```

---

# Canonical Values

Use exactly these:

```javascript
const TASK_TYPES = [
  "None",
  "Send",
  "Receive",
  "Script",
  "Service",
  "User",
  "Manual",
  "Business Rule"
]
```

Do not transform casing.

---

# Shape Filtering

Only show menu for shapes supporting the property.

Suggested check:

```javascript
shape?.getStencil?.().property?.("oryx-tasktype") !== undefined
```

---

# Selection Handling

Implement a selection watcher.

Possible sources:

- editor events
- polling fallback

Behavior:

- when selection changes, update menu
- hide menu if selection invalid

---

# Extension Architecture

Recommended structure.

Content Script

Responsible for:

- injecting page-context script
- message relay

Page Script

Responsible for:

- accessing Signavio internals
- getting facade
- modifying shapes

---

# Messaging Bridge

Example communication event:

```javascript
window.dispatchEvent(
  new CustomEvent("nsb-signavio-set-task-type", {
    detail: { value: "Service" }
  })
)
```

---

# Robustness Requirements

- do not assume fixed global variables
- avoid modifying Signavio core prototypes
- avoid breaking keyboard or drag events
- prevent duplicate injection

---

# Debug Logging

Optional debug flag:

```javascript
const DEBUG = false
```

Log:

- selected shape
- applied task type
- facade detection

---

# Testing Checklist

Functional

- selecting task shows menu
- clicking "Service" changes icon
- clicking "Script" changes icon
- clicking "Business Rule" works
- clicking "None" removes marker

Persistence

- save diagram
- reload
- confirm task type persists

Stability

- no duplicate menus
- no drag breakage
- no selection breakage

Undo/Redo

- test if undo works
- if not, upgrade to command-based system

---

# Command Pattern Observed

Native execution pattern:

```javascript
this.facade.executeCommands([
  new PropertyChangeCommand(...)
])
```

Command eventually calls:

```javascript
shape.setProperty(this.key, this.baseValue)
```

Use command stack if safely accessible.

Otherwise use direct property mutation for version 1.

---

# Deliverable

Codex should produce a small helper system containing:

- task type constants
- selection detection
- menu rendering
- `setTaskType()` helper
- safe initialization guard