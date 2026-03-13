import { defineConfig } from "wxt";
import { SHORTCUT_DEFINITIONS } from "./src/shared/shortcuts";

const commands = Object.fromEntries(
  SHORTCUT_DEFINITIONS.filter((definition) => definition.context === "global").map((definition) => [
    definition.id,
    {
      description: definition.title,
    },
  ]),
);

export default defineConfig({
  srcDir: ".",
  modules: [],
  manifest: {
    name: "Sigtastic",
    description: "Quickly insert favorite Signavio BPMN snippets from a keyboard-first overlay.",
    permissions: ["storage", "tabs", "activeTab"],
    action: {
      default_title: "Open Sigtastic Settings",
    },
    host_permissions: ["*://*.signavio.com/*"],
    browser_specific_settings: {
      gecko: {
        id: "sigtastic@example.local",
      },
    },
    commands,
    web_accessible_resources: [
      {
        matches: ["*://*.signavio.com/*"],
        resources: ["clipboard-hook.js"],
      },
    ],
  },
});
