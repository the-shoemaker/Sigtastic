# Sigtastic Documentation

Here you can learn how to use and configure the many workflow tweaks Sigtastic adds on top of Signavio.

## Getting Started

Sigtastic is built around a keyboard-first Signavio workflow.

- Copy a Signavio element normally.
- Save it with {{shortcut:save-favorite}}.
- Open the component panel with {{shortcut:toggle-overlay}}.
- Insert the selected favorite, then paste it with {{paste}}.

## Shortcuts

### Capture flow

- Click a shortcut field to start capture.
- Press the shortcut you want to use.
- Press `Esc` to save it.
- Press `Delete` or `Backspace` to reset it.

### Platform mappings

Shortcut settings are stored per platform, with separate values for macOS, Windows, Linux, ChromeOS, and a fallback profile.

## Config Files

Exports include:

- saved favorites
- shortcut mappings
- appearance settings
- auto-save settings

Importing a config restores your saved pieces and your setup in one go, which makes it easy to move Sigtastic to another browser profile or machine.

## Auto Save

Sigtastic can run a direct save on a timer while a Signavio editor tab is open.

- Enable Auto Save in Settings.
- Pick the interval in minutes. Decimal values below 1 minute are allowed for testing.
- Each run shows a toast after the save attempt finishes.
- Auto Save uses a direct save request instead of waiting for Signavio's validation confirmation flow.

## Quick Type Menu

Open the quick type menu with {{shortcut:toggle-quick-menu}} to change the type of the currently selected task.

- Hold the chosen number modifier to reveal the numbers.
- Press that modifier together with a number to apply the matching type immediately.
- You can change which modifier is used in Settings if it conflicts with your browser or system setup.
