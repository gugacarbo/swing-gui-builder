# Java File Round-Trip - Implementation Plan

## Overview

This plan details the implementation of Java file round-trip editing for Swing GUI Builder, enabling bidirectional synchronization between `.java` files and the visual canvas editor.

---

## Architecture

### Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROUND-TRIP FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OPEN (Java → CanvasState):                                                 │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────────┐   │
│  │ .java    │───▶│ JavaParser  │───▶│ CanvasState   │───▶│ Visual Editor│   │
│  │ file     │    │ (CST→Model) │    │ (normalized)  │    │ (CanvasPanel)│   │
│  └──────────┘    └─────────────┘    └──────────────┘    └───────────────┘   │
│                                                                             │
│  SAVE (CanvasState → Java):                                                 │
│  ┌───────────────┐    ┌─────────────────┐    ┌──────────────────────────┐   │
│  │ Visual Editor │───▶│ JavaGenerator   │───▶│ JavaFileMerger           │   │
│  │ (CanvasState) │    │ (with markers)  │    │ (preserves non-GUI code) │   │
│  └───────────────┘    └─────────────────┘    └──────────────────────────┘   │
│                                                             │               │
│                                                             ▼               │
│                                                    ┌──────────────┐         │
│                                                    │ .java file   │         │
│                                                    │ (preserved)  │         │
│                                                    └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── parser/
│   ├── JavaParser.ts           # Main parser (CST → CanvasState)
│   ├── JavaParserUtils.ts       # Helper utilities for CST traversal
│   └── types.ts                 # Parser-specific types
├── merger/
│   ├── JavaFileMerger.ts        # Merges generated code with preserved code
│   └── MarkerManager.ts         # Handles marker detection/insertion
├── commands/
│   └── openFromJavaCommand.ts   # "Open from Java File" command
└── generator/
    └── JavaGenerator.ts         # Modified to emit markers
```

---

## Phase 1: Foundation - Parser Module

### Step 1.1: Install java-parser dependency

```bash
pnpm add java-parser
pnpm add -D @types/java-parser  # Check if needed
```

### Step 1.2: Create parser types (`src/parser/types.ts`)

```typescript
// Internal types for parsing intermediate representation

export interface ParsedField {
  variableName: string;
  swingType: string;       // JButton, JPanel, etc.
  lineNumber: number;
  initialization?: ParsedInitialization;
}

export interface ParsedInitialization {
  text?: string;
  lineNumber: number;
}

export interface ParsedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  lineNumber: number;
}

export interface ParsedMethodInvocation {
  targetVariable: string;
  methodName: string;
  args: (string | number)[];
  lineNumber: number;
}

export interface ParsedClass {
  className: string;
  packageName?: string;
  extendsClass?: string;
  implementsInterfaces?: string[];
  fields: ParsedField[];
  methodInvocations: ParsedMethodInvocation[];
  annotations: string[];
}

export interface ParsedJavaFile {
  rawContent: string;
  class: ParsedClass;
  allMethodInvocations: ParsedMethodInvocation[];  // Includes in constructors, methods
  setBoundsCalls: Map<string, ParsedBounds>;        // variable → bounds
  componentAdditions: Map<string, string[]>;         // container → [child, ...]
}
```

### Step 1.3: Create `JavaParserUtils.ts`

**Purpose:** Helper functions for CST traversal

Key utilities:
- `findMethodDeclarations(cst)` → finds constructor and methods
- `findFieldDeclarations(cst)` → extracts Swing component fields
- `findMethodInvocations(cst, methodName)` → finds all calls to a method (e.g., `setBounds`)
- `extractStringLiteral(expr)` → extracts string value from expression
- `extractIntegerLiteral(expr)` → extracts integer from literal
- `buildVariableSymbolTable(cst)` → maps variable names to their types

### Step 1.4: Create `JavaParser.ts` (Main Parser)

**Entry point:** `parseJavaFile(javaContent: string): ParsedJavaFile`

**Process:**

1. **Parse** → CST using `java-parser`
2. **Extract Class Info** → name, package, extends, implements
3. **Extract Fields** → identify Swing component fields (JButton, JLabel, etc.)
4. **Extract Method Invocations** → collect all `setBounds`, `add`, `setText`, `setLayout` calls
5. **Build Variable Symbol Table** → map variable names to types (critical for linking `button.setBounds()` to `JButton button`)
6. **Extract Bounds** → for each component, find its `setBounds` call
7. **Return `ParsedJavaFile`**

**Critical Algorithm: Variable Symbol Table**

The hardest part is linking method calls to their target objects:

```typescript
// Input:
// private JButton submitButton = new JButton("Submit");
// ...
// submitButton.setBounds(20, 30, 100, 40);

// Need to build:
// {
//   "submitButton": { type: "JButton", declarationLine: 5 },
//   ...
// }

// Then when we see submitButton.setBounds(20, 30, 100, 40), we look up
// the type and know this is a JButton
```

**Visitor Pattern Implementation:**

```typescript
class SwingComponentVisitor extends BaseJavaCstVisitorWithDefaults {
  // Track variable declarations: variableName → { type, declarationLine }
  private symbolTable: Map<string, { type: string; line: number }> = new Map();

  // Track all method invocations for later analysis
  private methodInvocations: ParsedMethodInvocation[] = [];

  // Track setBounds calls: variableName → bounds
  private boundsCalls: Map<string, ParsedBounds> = new Map();

  fieldDeclaration(ctx: any) {
    const fieldType = ctx.typeType?.[0]?.image;  // e.g., "JButton"
    const declarators = ctx.variableDeclarators?.[0]?.children;
    const varName = declarators?.identifier?.[0]?.image;

    if (varName && isSwingType(fieldType)) {
      this.symbolTable.set(varName, { type: fieldType, line: ctx.location?.startLine });
    }
  }

  methodInvocation(ctx: any) {
    const methodName = ctx.identifier?.[0]?.image;
    const primary = ctx.expression?.children?.primary;
    const targetVar = primary?.[0]?.image;  // e.g., "submitButton"

    if (methodName === 'setBounds') {
      const args = extractIntegerArgs(ctx);
      this.boundsCalls.set(targetVar, { x: args[0], y: args[1], w: args[2], h: args[3], line: ctx.location.startLine });
    }

    this.methodInvocations.push({ targetVariable: targetVar, methodName, args: extractArgs(ctx) });
  }
}
```

### Step 1.5: Create `ParsedJavaFile → CanvasState` converter

```typescript
function parsedToCanvasState(parsed: ParsedJavaFile): CanvasState {
  const components: CanvasComponent[] = [];

  for (const field of parsed.class.fields) {
    const bounds = parsed.setBoundsCalls.get(field.variableName);
    const additions = findAdditionsTo(field.variableName, parsed.componentAdditions);

    components.push({
      id: generateId(),
      type: swingTypeToComponentType(field.swingType),
      variableName: field.variableName,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
      width: bounds?.width ?? 100,
      height: bounds?.height ?? 30,
      text: field.initialization?.text ?? "",
      // ... other properties
      children: additions,
    });
  }

  return {
    className: parsed.class.className,
    frameTitle: extractFrameTitle(parsed) ?? parsed.class.className,
    frameWidth: extractFrameSize(parsed).width,
    frameHeight: extractFrameSize(parsed).height,
    components,
  };
}
```

---

## Phase 2: Round-Trip - Marker System

### Step 2.1: Define Marker Format

```java
// @swingbuilder:generated:fields begin
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
// @swingbuilder:generated:constructor end

// @swingbuilder:generated:methods begin
// @swingbuilder:generated:methods end
```

### Step 2.2: Create `MarkerManager.ts`

```typescript
export interface MarkerRegions {
  fields?: { start: number; end: number; content: string };
  constructor?: { start: number; end: number; content: string };
  methodStubs?: { start: number; end: number; content: string };
}

export function detectMarkers(content: string): MarkerRegions | null {
  // Returns null if no markers found (file not generated by us)
  // Parses and returns the regions
}

export function insertMarkers(content: string, regions: MarkerRegions): string {
  // Inserts marker comments around generated code sections
}

export function replaceBetweenMarkers(
  original: string,
  markerType: string,
  newContent: string
): string {
  // Replaces content between markers with newContent
}
```

### Step 2.3: Modify `JavaGenerator.ts` to emit markers

In `generateMainFrameFile()`, wrap each section:

```typescript
// Before fields
lines.push("// @swingbuilder:generated:fields begin");
for (const comp of state.components) {
  // field declarations
}
lines.push("// @swingbuilder:generated:fields end");

// Before constructor body
lines.push("// @swingbuilder:generated:constructor begin");
lines.push(`  public ${state.className}() {`);
// ... constructor body
lines.push("  }");
lines.push("// @swingbuilder:generated:constructor end");

// Before method stubs
lines.push("// @swingbuilder:generated:methods begin");
for (const stub of methodStubs) {
  lines.push(stub);
}
lines.push("// @swingbuilder:generated:methods end");
```

---

## Phase 3: Merger Module

### Step 3.1: Create `JavaFileMerger.ts`

```typescript
export interface MergeOptions {
  createBackup: boolean;  // Default: true
  backupExtension: string;  // Default: ".bak"
}

export interface MergeResult {
  success: boolean;
  mergedContent: string;
  backupUri?: vscode.Uri;
  hadMarkers: boolean;
  preservedSections: string[];  // List of preserved section names
}

export function mergeWithPreservation(
  originalContent: string,
  generatedSections: GeneratedSections,
  options?: Partial<MergeOptions>
): MergeResult {
  // 1. Check if original has our markers
  // 2. If yes: replace each section between markers with generated
  // 3. If no: detect GUI code and offer to convert
  // 4. Return merged content
}
```

### Step 3.2: Implement section detection for non-marked files

```typescript
function detectGuiSections(content: string): DetectedGuiSection[] {
  // Heuristics for detecting GUI code:
  // - Field declarations with Swing types (JButton, JPanel, etc.)
  // - setBounds calls
  // - add(component) calls
  // - setLayout(null) calls
  // - new JButton(...), new JPanel(), etc.

  // Returns array of { startLine, endLine, type, detectedVariable? }
}
```

---

## Phase 4: Command Integration

### Step 4.1: Create `openFromJavaCommand.ts`

```typescript
export function registerOpenFromJavaCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "swingGuiBuilder.openFromJava",
    async () => {
      // 1. Show file picker for .java files
      const picked = await vscode.window.showOpenDialog({
        filters: { Java: ["java"] },
        canSelectMany: false,
      });

      if (!picked || picked.length === 0) return;

      // 2. Read file content
      const content = (await vscode.workspace.fs.readFile(picked[0])).toString();

      // 3. Parse
      const parsed = parseJavaFile(content);

      // 4. Convert to CanvasState
      const state = parsedToCanvasState(parsed);

      // 5. Show canvas
      CanvasPanel.createOrShow(context.extensionUri, state.className);
      CanvasPanel.currentPanel?.loadState(state);

      // 6. Store original file path for later merging
      CanvasPanel.currentPanel?.setSourceFile(picked[0].fsPath);

      outputChannel.appendLine(`Opened ${picked[0].fsPath} for round-trip editing`);
    }
  );
}
```

### Step 4.2: Extend `CanvasPanel.ts` to track source file

```typescript
// In CanvasPanel.ts
private sourceFilePath?: string;

setSourceFile(path: string) {
  this.sourceFilePath = path;
}

getSourceFile(): string | undefined {
  return this.sourceFilePath;
}
```

### Step 4.3: Modify `registerGenerateCommand` for round-trip

When saving generated code, if `sourceFilePath` is set, use `JavaFileMerger` instead of plain overwrite:

```typescript
// In generateCommand.ts
const sourceFile = CanvasPanel.currentPanel?.getSourceFile();

if (sourceFile && generatedFiles.length === 1) {
  // Round-trip mode: merge with preservation
  const originalContent = (await vscode.workspace.fs.readFile(
    vscode.Uri.file(sourceFile)
  )).toString();

  const merged = mergeWithPreservation(originalContent, generatedFiles[0].content);
  // Write merged result
} else {
  // Normal mode: overwrite (existing behavior)
  // ...existing code...
}
```

---

## Phase 5: UX Enhancements

### Step 5.1: Visual indicator for preserved files

In the webview, show a badge when editing a file with preserved code:

```typescript
// In canvas webview state
interface CanvasState {
  // ...existing fields
  hasPreservedCode?: boolean;
  sourceFilePath?: string;
}
```

### Step 5.2: Backup system

- Before any overwrite, create `.bak` file
- Offer to restore from backup

### Step 5.3: Diff preview (optional enhancement)

Use VS Code's `diff` command to show before/after:

```typescript
const editedUri = vscode.Uri.joinPath(targetDirUri, file.fileName);
const backupUri = vscode.Uri.joinPath(targetDirUri, backupName);

vscode.commands.executeCommand('vscode.diff', backupUri, editedUri, 'Preview Changes');
```

---

## Implementation Sequence

### Week 1: Parser Foundation
| Step | Task                            | File                          |
| ---- | ------------------------------- | ----------------------------- |
| 1.1  | Install java-parser             | package.json                  |
| 1.2  | Create parser types             | src/parser/types.ts           |
| 1.3  | Create JavaParserUtils          | src/parser/JavaParserUtils.ts |
| 1.4  | Implement JavaParser main class | src/parser/JavaParser.ts      |
| 1.5  | Implement CanvasState converter | src/parser/toCanvasState.ts   |

### Week 2: Marker System
| Step | Task                                 | File                           |
| ---- | ------------------------------------ | ------------------------------ |
| 2.1  | Define marker format                 | (document only)                |
| 2.2  | Implement MarkerManager              | src/merger/MarkerManager.ts    |
| 2.3  | Modify JavaGenerator to emit markers | src/generator/JavaGenerator.ts |

### Week 3: Merger & Integration
| Step | Task                                   | File                                |
| ---- | -------------------------------------- | ----------------------------------- |
| 3.1  | Implement JavaFileMerger               | src/merger/JavaFileMerger.ts        |
| 3.2  | Create openFromJavaCommand             | src/commands/openFromJavaCommand.ts |
| 3.3  | Extend CanvasPanel for source tracking | src/canvas/CanvasPanel.ts           |
| 3.4  | Modify generateCommand for round-trip  | src/commands/generateCommand.ts     |

### Week 4: Testing & Polish
| Step | Task                                     |
| ---- | ---------------------------------------- |
| 4.1  | Write unit tests for JavaParser          |
| 4.2  | Write integration tests for round-trip   |
| 4.3  | Test with real Java files                |
| 4.4  | Add visual indicator for preserved files |

---

## Key Challenges & Mitigations

### Challenge 1: Linking setBounds to Component Variables

**Problem:** `java-parser` CST doesn't track which object a method is called on.

**Solution:** Build a symbol table during traversal:
1. When we see `JButton submitButton`, we record `submitButton → JButton`
2. When we see `submitButton.setBounds(...)`, we look up `submitButton` in the symbol table
3. This tells us `setBounds` is called on a JButton

### Challenge 2: Dynamic Component Creation

**Problem:** Components created in loops or conditionals can't be statically analyzed.

**Solution:** Initial version supports only direct field initialization:
```java
// Supported:
private JButton submitButton = new JButton("Submit");
submitButton.setBounds(20, 30, 100, 40);

// Not supported (initial version):
for (int i = 0; i < 3; i++) {
  buttons[i] = new JButton("Button " + i);
}
```

### Challenge 3: Inner Classes

**Problem:** GUI code inside inner classes.

**Solution:** Initial version only handles top-level class. Inner classes are preserved as-is.

### Challenge 4: Non-Absolute Layouts

**Problem:** Files using BorderLayout, GridLayout, etc.

**Solution:** Document limitation clearly. Initial version only supports `setLayout(null)` with absolute positioning.

---

## Testing Strategy

### Unit Tests

```typescript
// tests/parser/JavaParser.test.ts
describe("JavaParser", () => {
  it("should parse simple JFrame with one button", () => {
    const java = `
      public class MainWindow extends JFrame {
        private JButton submitButton;

        public MainWindow() {
          submitButton = new JButton("Submit");
          submitButton.setBounds(20, 30, 100, 40);
          add(submitButton);
          setLayout(null);
        }
      }
    `;

    const result = parseJavaFile(java);
    expect(result.class.className).toBe("MainWindow");
    expect(result.class.fields).toHaveLength(1);
    expect(result.class.fields[0].variableName).toBe("submitButton");
    expect(result.setBoundsCalls.get("submitButton")).toEqual({
      x: 20, y: 30, width: 100, height: 40
    });
  });
});
```

### Round-Trip Integration Tests

```typescript
// tests/integration/roundtrip.test.ts
describe("Round-trip editing", () => {
  it("should preserve business logic when regenerating", async () => {
    const originalJava = `
      public class MainWindow extends JFrame {
        private JButton submitButton;
        private User currentUser;  // Business field - should be preserved

        public MainWindow() {
          submitButton = new JButton("Submit");
          submitButton.setBounds(20, 30, 100, 40);
          setLayout(null);
          loadUserData();  // Business method - should be preserved
        }

        // @swingbuilder:generated:fields begin
        // @swingbuilder:generated:fields end
        // @swingbuilder:generated:constructor begin
        // @swingbuilder:generated:constructor end
      }
    `;

    // ... modify canvas ...
    // ... save ...

    const result = await mergeWithPreservation(originalJava, generated);
    expect(result).toContain("private User currentUser");
    expect(result).toContain("loadUserData()");
  });
});
```

---

## Open Questions (For Stakeholder)

1. **Conflict Resolution:** If user edits code inside markers manually, should we:
   - A) Always overwrite (simpler)
   - B) Offer merge dialog (complex)
   - C) Detect conflict and warn (recommended: A for MVP)

2. **Multiple Classes in One File:** Should we support selecting which class to edit?
   - A) First top-level class only (MVP)
   - B) Show picker dialog
   - C) Support all top-level classes

3. **Inner Classes:** What about GUI in inner classes?
   - A) Ignore inner classes entirely
   - B) Flatten into parent canvas
   - C) Support editing inner class if it's the selected one

4. **Backup Retention:** How many backups to keep?
   - A) One per file (.bak overwritten)
   - B) Keep timestamped backups
   - C) Ask user preference

---

## Success Criteria

- [ ] Can open a SwingBuilder-generated .java file and reconstruct the canvas
- [ ] Can make visual changes and save, preserving business code
- [ ] Can open a non-generated .java file and convert it (with markers)
- [ ] Backup is created before any overwrite
- [ ] All existing tests pass
- [ ] New tests cover round-trip functionality

---

## References

- [java-parser npm](https://www.npmjs.com/package/java-parser)
- [Chevrotain CST Documentation](https://github.com/Chevrotain/chevrotain/blob/master/docs/concrete_syntax_tree.md)
- [NetBeans Matisse Round-Trip](https://platform.netbeans.org/tutorials/nbm-java_knn.html)
