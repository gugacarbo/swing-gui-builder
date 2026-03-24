# PRD: Java File Round-Trip

## Introduction

Implement bidirectional synchronization between `.java` files and the visual canvas editor. Users can open existing Java GUI files in the visual canvas, edit them visually, and save changes back while preserving all non-GUI code (method bodies, imports, custom logic). The system will auto-detect Swing/AWT components using heuristics rather than relying on pre-existing markers.

---

## Goals

- Open any `.java` file containing Swing/AWT GUI code and display it on the visual canvas
- Auto-detect GUI components (JButton, JLabel, JPanel, JFrame, etc.) and their properties without markers
- Save canvas changes back to `.java` file while preserving all non-GUI code
- Support all standard Swing and AWT components by detecting class inheritance
- Maintain round-trip fidelity: edits on canvas reflect in Java, edits in Java reflect on canvas

---

## User Stories

### US-001: Parse Java file to extract GUI components
**Description:** As a developer, I want the system to automatically detect Swing/AWT GUI components in a Java file so I can open it for visual editing.

**Group:** A

**Acceptance Criteria:**
- [ ] Parse `.java` file content using `java-parser`
- [ ] Detect GUI components by analyzing class inheritance (extends JFrame, JPanel, etc.)
- [ ] Build variable symbol table mapping variable names to their types
- [ ] Extract component properties: bounds (x, y, width, height), text, layout
- [ ] Detect parent-child relationships via `add()` calls
- [ ] Typecheck passes

### US-002: Convert parsed data to CanvasState
**Description:** As a developer, I need the parsed Java data to be converted to CanvasState format so the visual editor can display the GUI.

**Group:** A

**Acceptance Criteria:**
- [ ] Map Swing types to component types (JButton → button, JLabel → label, etc.)
- [ ] Extract frame title and dimensions from constructor or class definition
- [ ] Preserve variable names as component IDs
- [ ] Handle nested components (panels containing other components)
- [ ] Typecheck passes

### US-003: Implement marker-based code preservation system
**Description:** As a developer, I need a marker system to identify which code sections are generated vs. user code so preservation works correctly.

**Group:** A

**Acceptance Criteria:**
- [ ] Define marker format: `// @swingbuilder:generated:{section} begin/end`
- [ ] Implement `MarkerManager` to detect existing markers in files
- [ ] Implement `MarkerManager` to insert markers around generated sections
- [ ] Support sections: `fields`, `constructor`, `methods`
- [ ] Typecheck passes

### US-004: Modify JavaGenerator to emit markers
**Description:** As a developer, I need the code generator to emit markers so round-trip files can be identified and properly merged.

**Group:** B

**Acceptance Criteria:**
- [ ] Wrap field declarations with field markers
- [ ] Wrap constructor body with constructor markers
- [ ] Wrap method stubs with method markers
- [ ] Maintain valid Java syntax with properly nested markers
- [ ] Typecheck passes

### US-005: Implement JavaFileMerger for round-trip save
**Description:** As a user, I want my non-GUI code (method bodies, imports, custom logic) to be preserved when saving so I don't lose my work.

**Group:** B

**Acceptance Criteria:**
- [ ] For files with markers: replace only content between matching markers
- [ ] For files without markers: use heuristic detection to find GUI code regions
- [ ] Preserve all code outside GUI-related statements
- [ ] Create `.bak` backup before overwriting
- [ ] Report which sections were preserved in merge result
- [ ] Typecheck passes

### US-006: Create "Open from Java File" command
**Description:** As a user, I want to open a `.java` file in the canvas editor with a single command so I can start editing visually.

**Group:** B

**Acceptance Criteria:**
- [ ] Register VS Code command `swingGuiBuilder.openFromJava`
- [ ] Show file picker filtered to `.java` files
- [ ] Parse selected file and display on canvas
- [ ] Track source file path for later merging
- [ ] Display success/error in output channel
- [ ] Typecheck passes

### US-007: Extend CanvasPanel to track source file
**Description:** As a developer, I need CanvasPanel to remember which file was opened so the save command can merge correctly.

**Group:** B

**Acceptance Criteria:**
- [ ] Add `sourceFilePath` property to CanvasPanel
- [ ] Add `setSourceFile(path)` method
- [ ] Add `getSourceFile()` method
- [ ] Persist source path during session
- [ ] Typecheck passes

### US-008: Modify generate command for round-trip mode
**Description:** As a user, I want saving to merge with the original file instead of overwriting it so my code is preserved.

**Group:** C

**Acceptance Criteria:**
- [ ] Detect when `sourceFilePath` is set (round-trip mode)
- [ ] Use `JavaFileMerger` instead of file overwrite when in round-trip mode
- [ ] Fall back to normal overwrite for new files
- [ ] Show diff preview option after merge
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add visual indicator for round-trip files
**Description:** As a user, I want to know when I'm editing a file with preserved code so I understand the round-trip status.

**Group:** C

**Acceptance Criteria:**
- [ ] Show badge/indicator in webview when `hasPreservedCode` is true
- [ ] Display source file name in panel title or status
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Add backup and restore system
**Description:** As a user, I want automatic backups before saves so I can recover if something goes wrong.

**Group:** C

**Acceptance Criteria:**
- [ ] Create `.bak` file before any merge operation
- [ ] Implement restore from backup command
- [ ] Offer to restore from backup on parse error
- [ ] Typecheck passes

---

## Functional Requirements

### FR-1: Java Parsing
- FR-1.1: Use `java-parser` library for CST generation
- FR-1.2: Build symbol table: variableName → { type, declarationLine }
- FR-1.3: Detect all method invocations: target variable, method name, arguments
- FR-1.4: Extract `setBounds(x, y, width, height)` for each component
- FR-1.5: Extract `add(component)` calls to determine parent-child relationships
- FR-1.6: Detect `setText("...")` for text properties
- FR-1.7: Detect `setLayout(null)` or layout manager assignments

### FR-2: Component Detection
- FR-2.1: Detect Swing/AWT components via inheritance analysis
- FR-2.2: Support component types: JFrame, JPanel, JButton, JLabel, JTextField, JTextArea, JCheckBox, JRadioButton, JComboBox, JList, JScrollPane, JTabbedPane, JMenuBar, JMenu, JMenuItem, JToolBar, JDialog, JFileChooser, JColorChooser, JTable, JTree
- FR-2.3: Map Swing type names to Canvas component types
- FR-2.4: Handle component arrays and Lists if applicable

### FR-3: Marker System
- FR-3.1: Marker format: `// @swingbuilder:generated:{section} begin` and `// @swingbuilder:generated:{section} end`
- FR-3.2: Sections: `fields`, `constructor`, `methods`
- FR-3.3: `detectMarkers(content)` returns regions or null
- FR-3.4: `insertMarkers(content, regions)` wraps sections
- FR-3.5: `replaceBetweenMarkers(content, section, newContent)` performs replacement

### FR-4: Code Generation with Markers
- FR-4.1: Generate field declarations between field markers
- FR-4.2: Generate constructor body between constructor markers
- FR-4.3: Generate method stubs between method markers
- FR-4.4: Maintain proper indentation and formatting

### FR-5: File Merging
- FR-5.1: Check for existing markers first
- FR-5.2: If markers exist: replace each section independently
- FR-5.3: If no markers: use heuristic GUI code detection
- FR-5.4: Preserve all code outside GUI-related statements
- FR-5.5: Create `.bak` backup with timestamp
- FR-5.6: Return MergeResult with success status and preserved sections list

### FR-6: Heuristic GUI Detection (for non-marked files)
- FR-6.1: Detect field declarations with Swing types
- FR-6.2: Detect `setBounds(variable, ...)` calls
- FR-6.3: Detect `add(variable)` calls
- FR-6.4: Detect `setLayout(null)` or layout manager calls
- FR-6.5: Detect `new JButton(...)`, `new JPanel()`, etc.

### FR-7: Command Integration
- FR-7.1: Register `swingGuiBuilder.openFromJava` command
- FR-7.2: File picker for `.java` files with `showOpenDialog`
- FR-7.3: Parse, convert, and display in canvas
- FR-7.4: Track source file path in CanvasPanel
- FR-7.5: Use merger on save when source path is set

### FR-8: UI/UX
- FR-8.1: Visual badge for files with preserved code
- FR-8.2: Source file name visible in UI
- FR-8.3: Diff preview option before final save
- FR-8.4: Backup file creation notification

---

## Non-Goals

- No support for editing inner classes separately
- No support for GUI code inside lambda expressions or anonymous classes
- No automatic sync/polling of external file changes
- No merge conflict resolution UI (overwrite is the default)
- No support for Java older than Java 8 syntax

---

## Technical Considerations

### Dependencies
- `java-parser` for Java CST generation
- Existing `JavaGenerator.ts` will be modified to emit markers
- VS Code Extension API for commands and file dialogs

### File Structure
```
src/
├── parser/
│   ├── JavaParser.ts           # Main parser (CST → ParsedJavaFile)
│   ├── JavaParserUtils.ts       # Helper utilities for CST traversal
│   ├── types.ts                 # Parser-specific types
│   └── toCanvasState.ts         # Convert ParsedJavaFile → CanvasState
├── merger/
│   ├── JavaFileMerger.ts        # Merges generated code with preserved code
│   └── MarkerManager.ts         # Handles marker detection/insertion
├── commands/
│   └── openFromJavaCommand.ts   # "Open from Java File" command
└── generator/
    └── JavaGenerator.ts         # Modified to emit markers
```

### Key Algorithm: Variable Symbol Table
Building a symbol table is critical for linking method calls to their target objects:

```
// When we see: submitButton.setBounds(20, 30, 100, 40)
// We need to look up "submitButton" in the symbol table
// to find its type (JButton) and declaration line
```

### Marker Format
```java
// @swingbuilder:generated:fields begin
private JButton submitButton = new JButton("Submit");
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
public MyFrame() {
  submitButton.setBounds(20, 30, 100, 40);
  add(submitButton);
}
// @swingbuilder:generated:constructor end
```

---

## Success Metrics

- Can open a standard Swing JFrame file and display all components on canvas
- Can modify component properties on canvas and save back to Java
- Non-GUI code (imports, other methods, method bodies) preserved after save
- Round-trip is lossless for supported GUI patterns
- Backup files created automatically before any save

---

## Open Questions

- Should we support `GroupLayout` and other complex layout managers?
- How should we handle components created with fluent APIs like `new JButton("text")..setBounds(...)`?
- Should we support Kotlin files or only Java?
- How to handle multi-frame applications (multiple JFrame classes)?
