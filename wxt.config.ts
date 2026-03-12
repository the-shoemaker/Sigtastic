import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  modules: [],
  manifest: {
    name: "Signavio BPKeys",
    description: "Quickly insert favorite Signavio BPMN snippets from a keyboard-first overlay.",
    permissions: ["storage", "tabs", "activeTab"],
    host_permissions: ["*://*.signavio.com/*"],
    browser_specific_settings: {
      gecko: {
        id: "signavio-bpkeys@example.local",
      },
    },
    commands: {
      "toggle-overlay": {
        suggested_key: {
          default: "Alt+Shift+D",
          mac: "Alt+Shift+D",
        },
        description: "Open Signavio BPKeys overlay",
      },
      "save-favorite": {
        suggested_key: {
          default: "Alt+Shift+S",
          mac: "Alt+Shift+S",
        },
        description: "Save latest copied snippet as favorite",
      },
      "toggle-quick-menu": {
        suggested_key: {
          default: "Alt+Shift+E",
          mac: "Alt+Shift+E",
        },
        description: "Open Signavio quick task type menu",
      },
    },
    web_accessible_resources: [
      {
        matches: ["*://*.signavio.com/*"],
        resources: ["clipboard-hook.js"],
      },
    ],
  },
});
