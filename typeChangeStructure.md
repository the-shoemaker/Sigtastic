# Signavio Editor – Task Type Reverse Engineering Notes

This document summarizes the reverse engineering performed on the **SAP Signavio / Oryx BPMN editor** to understand how **Task Type** changes work internally.

Goal:  
Allow an extension (e.g. a quick action menu) to change task types programmatically in the same way the native property panel does.

---

# 1. Important Context

In the Signavio BPMN editor, **Task Types are NOT different stencils**.

They are simply a **property of the generic BPMN task stencil**.

Example task types:

- Send Task
- Receive Task
- Script Task
- Service Task
- User Task
- Manual Task
- Business Rule Task
- None

These appear in the property panel under:

```
Main Attributes → Task Type
```

Signavio documentation confirms that task markers are controlled through **task attributes** rather than separate element types.  [oai_citation:0‡SAP Support Portal](https://userapps.support.sap.com/sap/support/knowledge/en/3242436?utm_source=chatgpt.com)

---

# 2. Property Responsible for Task Type

The property key used by the editor is:

```
oryx-tasktype
```

This was confirmed via breakpoint inspection:

```js
option.record.data.gridProperties.propId
→ "oryx-tasktype"
```

Therefore the task type is stored as a property on the BPMN shape:

```js
shape.setProperty("oryx-tasktype", <TaskType>)
```

---

# 3. Values Written to the Model

The values written are **exactly the visible labels**, not lowercase identifiers.

Examples observed during debugging:

```js
option.value
→ "Business Rule"

option.value
→ "Script"
```

The canonical values include:

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

These correspond to the items defined in the property metadata:

```js
property._jsonProp.items
```

Example item structure:

```js
{
  id: "c2",
  refToView: ["sendTask"],
  title: "Send",
  value: "Send",
  icon: "activity/list/type.send.png"
}
```

Important field:

```
value
```

That value is written to `oryx-tasktype`.

---

# 4. How the Property Window Applies Changes

Changing a property in the UI triggers this flow:

```
Editor field
    ↓
dialogClosed
    ↓
grid.onEditComplete()
    ↓
afterEdit()
    ↓
facade.executeCommands()
    ↓
PropertyChangeCommand
    ↓
shape.setProperty()
```

---

# 5. Entry Point

File:

```
propertyWindow/PropertyWindow/index.js
```

Function:

```js
afterEdit: function(option) {
    const key = option.record.data.gridProperties.propId
}
```

For task type:

```
key = "oryx-tasktype"
```

---

# 6. Command Execution

The property change is executed through the command stack:

```js
this.facade.executeCommands([
  new PropertyChangeCommand(
    key,
    selectedElements,
    oldValues,
    oldFormats,
    newValue,
    newFormat,
    facade,
    option.grid,
    option.record,
    baseValue,
    baseOldValue
  )
])
```

This ensures:

- undo / redo works
- property window updates correctly
- selection stays consistent

---

# 7. PropertyChangeCommand Behavior

File:

```
PropertyChangeCommand.js
```

Constructor:

```js
const PropertyChangeCommand = Command.extend({
  construct: function (
    key,
    selectedElements,
    oldValues,
    oldFormats,
    newValue,
    newFormat,
    facade,
    grid,
    record,
    baseValue,
    baseOldValues
  )
```

Execution:

```js
execute: function () {
  this.selectedElements.forEach((shape) => {
    shape.setProperty(this.key, this.baseValue)
  })
}
```

Rollback:

```js
rollback: function () {
  this.selectedElements.forEach((shape) => {
    shape.setProperty(this.key, this.baseOldValues.get(shape.getId()))
  })
}
```

---

# 8. Minimal Programmatic Change

The absolute minimal way to change the task type:

```js
shape.setProperty("oryx-tasktype", "Service")
facade.getCanvas().update()
```

Example values:

```js
"Send"
"Receive"
"Script"
"Service"
"User"
"Manual"
"Business Rule"
"None"
```

---

# 9. Proper Command-Based Change (Recommended)

To preserve undo/redo behavior:

```js
facade.executeCommands([
  new PropertyChangeCommand(
    "oryx-tasktype",
    shapes,
    oldValues,
    oldFormats,
    "Service",
    undefined,
    facade
  )
])
```

---

# 10. Key Takeaways

### Task types are properties
They are NOT stencil replacements.

```
Task
 + property: oryx-tasktype
```

### UI writes label values

```
"Service"
"Script"
"Send"
```

### Editor uses command stack

```
PropertyChangeCommand
```

### Internal property key

```
oryx-tasktype
```

---

# 11. What an Extension Should Do

A quick action menu or plugin should:

1. Get selected shapes

```js
facade.getSelection()
```

2. Change property

```js
shape.setProperty("oryx-tasktype", "Service")
```

3. Update canvas

```js
facade.getCanvas().update()
```

or use the command system.

---

# 12. Example Quick Menu Handler

```js
function setTaskType(facade, type) {

  const shapes = facade.getSelection()

  shapes.forEach(shape => {
    shape.setProperty("oryx-tasktype", type)
  })

  facade.getCanvas().update()
}
```

Example usage:

```js
setTaskType(facade, "Service")
setTaskType(facade, "Script")
setTaskType(facade, "Send")
```

---

# 13. Verified Runtime Debug Values

During debugging:

```
propId
→ "oryx-tasktype"

option.value
→ "Business Rule"
→ "Script"
```

Therefore:

```
value == label
```

---

# End of Notes