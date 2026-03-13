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
    icons: {
      16: "branding/icon-16.png",
      32: "branding/icon-32.png",
      48: "branding/icon-48.png",
      96: "branding/icon-96.png",
      128: "branding/icon-128.png",
    },
    permissions: ["storage", "tabs", "activeTab"],
    action: {
      default_icon: {
        16: "branding/action-16.png",
        32: "branding/action-32.png",
        64: "branding/action-64.png",
      },
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
