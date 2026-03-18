 ![Version Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgugacarbo%2Fswing-gui-builder%2Frefs%2Fheads%2Fmain%2Fpackage.json&query=%24.version&suffix=-beta&style=flat&label=version&cacheSeconds=3600) ![GitHub License](https://img.shields.io/github/license/gugacarbo/swing-gui-builder) ![Visual Studio Marketplace Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/gugacarbo.swing-gui-builder)

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/gugacarbo/swing-gui-builder/test.yml?branch=main&label=Tests)](https://gugacarbo.github.io/swing-gui-builder/) [![Coverage Total](./media/coverage-badges/total.svg)](https://gugacarbo.github.io/swing-gui-builder/) [![Tests Ext](./media/coverage-badges/extension.svg)](https://gugacarbo.github.io/swing-gui-builder/) [![Tests Webview](./media/coverage-badges/webview.svg)](https://gugacarbo.github.io/swing-gui-builder/)

# IN DEVELOPMENT - Vibe Code Experiment

# Swing GUI Builder






A visual drag-and-drop GUI builder for Java Swing in VS Code. Design your Swing interfaces visually and generate clean Java source code — no manual layout math required.

## Features

- **Component Palette** — drag Button, Label, TextField, PasswordField, and TextArea onto the canvas
- **Visual Canvas** — position and resize components with drag-and-drop; zoom (Ctrl+scroll) and pan (middle-click drag)
- **Properties Panel** — edit text, colors, fonts, sizes, variable names, and positioning per component
- **Java Code Generation** — generates a JFrame with absolute positioning, custom component classes for styled components, and event listener stubs
- **Configuration System** — project-level `.swingbuilder.json` and VS Code settings for default styles
- **Undo/Redo** — full history with Ctrl+Z / Ctrl+Shift+Z (up to 50 actions)
- **Save & Load** — persist canvas state to `.swingbuilder-layout.json` and restore it later

## Requirements

- **VS Code** 1.85 or later
- **Java JDK** (for compiling the generated Java code)

## Installation

### From VSIX

1. Download the `.vsix` file
2. In VS Code, open the Command Palette (`Ctrl+Shift+P`)
3. Run **Extensions: Install from VSIX…** and select the file

### From Marketplace

Search for **Swing GUI Builder** in the VS Code Extensions view (`Ctrl+Shift+X`) and click **Install**.

## Quick Start

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **Swing GUI Builder: New Window** to open the builder canvas
3. Drag components from the palette on the left onto the canvas
4. Select a component to edit its properties in the right panel (text, colors, font, position, variable name)
5. Run **Swing GUI Builder: Generate** to produce Java source files in your workspace

## Available Commands

| Command                                  | Description                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `Swing GUI Builder: New Window`          | Creates a new builder canvas in a webview panel                  |
| `Swing GUI Builder: Generate`            | Generates Java source files from the current canvas layout       |
| `Swing GUI Builder: Save`                | Saves the canvas state to a `.swingbuilder-layout.json` file     |
| `Swing GUI Builder: Open`                | Loads a previously saved canvas from `.swingbuilder-layout.json` |
| `Swing GUI Builder: Init Project Config` | Creates a `.swingbuilder.json` template in the workspace root    |

## Configuration

### Project Config (`.swingbuilder.json`)

Run **Init Project Config** to generate a `.swingbuilder.json` file in your workspace root. This file lets you configure:

- `outputDirectory` — where generated Java files are written (default: `swing/components/`)
- `defaultBackgroundColor` — default background color for new components
- `defaultTextColor` — default text color for new components
- `defaultFontFamily` — default font family (e.g. `"Arial"`)
- `defaultFontSize` — default font size in points

The schema is automatically validated by VS Code when the file is open.

### VS Code Settings

You can also configure defaults through VS Code settings (`Ctrl+,`). All settings are under the `swingGuiBuilder` namespace:

| Setting                                  | Type   | Default             | Description                                       |
| ---------------------------------------- | ------ | ------------------- | ------------------------------------------------- |
| `swingGuiBuilder.defaultBackgroundColor` | string | `#FFFFFF`           | Default background color for new components       |
| `swingGuiBuilder.defaultTextColor`       | string | `#000000`           | Default text color for new components             |
| `swingGuiBuilder.defaultFontFamily`      | string | `Arial`             | Default font family for new components            |
| `swingGuiBuilder.defaultFontSize`        | number | `12`                | Default font size for new components              |
| `swingGuiBuilder.outputDirectory`        | string | `swing/components/` | Default output directory for generated Java files |

Per-component overrides are available for each supported component type (e.g. `swingGuiBuilder.components.Button.defaultBackgroundColor`).

## Supported Components

| Component         | Java Class       | Description                      |
| ----------------- | ---------------- | -------------------------------- |
| **Button**        | `JButton`        | Clickable button with text label |
| **Label**         | `JLabel`         | Static text display              |
| **TextField**     | `JTextField`     | Single-line text input           |
| **PasswordField** | `JPasswordField` | Masked text input for passwords  |
| **TextArea**      | `JTextArea`      | Multi-line text input            |

## Generated Code

When you run **Generate**, the extension produces:

1. **A main JFrame class** — sets up the window with absolute positioning (`null` layout), instantiates and places all components at the coordinates you defined on the canvas.
2. **Custom component classes** — if a component has non-default styling (colors, fonts), a separate class extending the base Swing component is generated with the styling applied.
3. **Event listener stubs** — empty listener methods are generated for interactive components so you can fill in your application logic.

All generated files are placed in the configured output directory.

## Development (React + Vite Webview)

The webview UI is implemented as a React + Vite app in `webview-app/` and built into `out/webview/`.

### Install dependencies

```bash
pnpm install
```

### Webview development workflow

1. Start the frontend dev server:

   ```bash
   pnpm --dir webview-app dev
   ```

2. Build production webview assets consumed by the extension:

   ```bash
   pnpm --dir webview-app build
   ```

3. Compile extension sources:

   ```bash
   pnpm run compile
   ```

### Build and validation commands

```bash
pnpm run typecheck
pnpm run build
pnpm run compile
```

## Testing

Run tests from the repository root:

```bash
pnpm run typecheck
pnpm test
pnpm --dir webview-app test
pnpm --workspace-concurrency=1 --filter . --filter ./shared --filter ./webview-app --if-present test:coverage
```

Coverage artifacts are generated in `coverage/` (extension) and `webview-app/coverage/`.

## License

[MIT](LICENSE)
