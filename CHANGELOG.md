# Changelog

All notable changes to the "swing-gui-builder" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.2] - 2026-03-12

### Added

- Send project config defaults (from `.swingbuilder.json` and VS Code settings) to webview on builder open
- Apply config defaults (color, font, size) when dropping components onto canvas
- Java project structure detection (Maven/Gradle, plain `src/`) with suggested output folder
- Package inference from output path relative to Java source root
- Folder picker fallback when project structure is unrecognized
- JSON schema contribution for `.swingbuilder.json` with autocomplete and validation
- Command toolbar in builder UI (New, Open, Save, Generate, Init Config)
- Component deletion via Delete key and properties panel button
- Variable name validation with visual feedback (red border, inline errors, Generate blocked)
- Canvas zoom (Ctrl+scroll, buttons) and pan (middle-click drag)
- Resize handles on selected components (8-point)
- Undo/redo history (Ctrl+Z, Ctrl+Shift+Z/Ctrl+Y, 50 actions max)

### Fixed

- Fixed `hexToRgb` color validation in JavaGenerator to prevent NaN in Color constructors
- Enforced unique generated class names for custom components (CustomButton1, CustomButton2, etc.)
- Enforced unique `variableName` auto-generation for components on the canvas

### Improved

- Replaced silent catch blocks with proper error logging
- Full README with usage documentation, commands reference, and settings
- Complete marketplace metadata (publisher, categories, icon, repository, keywords)

## [0.0.1] - Initial release

- Initial release of Swing GUI Builder for VS Code
