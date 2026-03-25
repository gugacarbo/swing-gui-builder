import { describe, expect, it } from "vitest";
import {
  detectGuiCodeRegions,
  type FileSystemAdapter,
  mergeJavaFile,
  mergeWithPreservation,
} from "../../src/merger/JavaFileMerger";

const originalWithMarkers = `package com.example;

import javax.swing.*;
import java.awt.event.ActionEvent;

public class MainFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton oldButton;
// @swingbuilder:generated:fields end

  private final String owner = "dev";

// @swingbuilder:generated:constructor begin
  public MainFrame() {
    setTitle("Old");
    oldButton = new JButton("Old");
  }
// @swingbuilder:generated:constructor end

// @swingbuilder:generated:methods begin
  private void onSave() {
    // old implementation
  }
// @swingbuilder:generated:methods end

  private void userMethod() {
    System.out.println(owner);
  }
}
`;

const generatedWithAllMarkers = `public class MainFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton saveButton;
  private JLabel titleLabel;
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
  public MainFrame() {
    setTitle("Generated");
    saveButton = new JButton("Save");
    titleLabel = new JLabel("Title");
  }
// @swingbuilder:generated:constructor end

// @swingbuilder:generated:methods begin
  private void onSave() {
    submitForm();
  }
// @swingbuilder:generated:methods end
}
`;

describe("JavaFileMerger", () => {
  it("replaces only content between matching markers", () => {
    const result = mergeWithPreservation(originalWithMarkers, generatedWithAllMarkers);

    expect(result.success).toBe(true);
    expect(result.hadMarkers).toBe(true);
    expect(result.replacedSections).toEqual(["fields", "constructor", "methods"]);
    expect(result.preservedSections).toEqual(["outside-markers"]);

    expect(result.mergedContent).toContain("private JButton saveButton;");
    expect(result.mergedContent).toContain("private JLabel titleLabel;");
    expect(result.mergedContent).toContain('setTitle("Generated")');
    expect(result.mergedContent).toContain("submitForm();");

    expect(result.mergedContent).toContain("import java.awt.event.ActionEvent;");
    expect(result.mergedContent).toContain('private final String owner = "dev";');
    expect(result.mergedContent).toContain("private void userMethod() {");
    expect(result.mergedContent).not.toContain("private JButton oldButton;");
  });

  it("reports preserved marker sections that were not replaced", () => {
    const generatedWithPartialMarkers = `public class MainFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton saveButton;
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
  public MainFrame() {
    setTitle("Only Constructor Updated");
  }
// @swingbuilder:generated:constructor end
}
`;

    const result = mergeWithPreservation(originalWithMarkers, generatedWithPartialMarkers);

    expect(result.success).toBe(true);
    expect(result.replacedSections).toEqual(["fields", "constructor"]);
    expect(result.preservedSections).toEqual(["outside-markers", "methods"]);
    expect(result.mergedContent).toContain("Only Constructor Updated");
    expect(result.mergedContent).toContain("// old implementation");
  });

  it("uses heuristic GUI detection when no markers exist and preserves non-GUI code", () => {
    const original = `package com.example;

import javax.swing.*;
import java.awt.BorderLayout;

public class LegacyFrame extends JFrame {
  private String owner = "kept";
  private JButton saveButton;
  private JLabel titleLabel;

  public LegacyFrame() {
    setTitle("Legacy");
    saveButton = new JButton("Save");
    titleLabel = new JLabel("Legacy");
    setLayout(null);
    saveButton.setBounds(10, 10, 120, 30);
    add(saveButton);
    add(titleLabel);
  }

  private void businessRule() {
    System.out.println(owner);
  }
}
`;

    const generated = `package com.example;

import javax.swing.*;
import java.awt.BorderLayout;

public class LegacyFrame extends JFrame {
  private String owner = "generated";
  private JButton saveButton;
  private JLabel titleLabel;

  public LegacyFrame() {
    setTitle("Generated");
    saveButton = new JButton("Send");
    titleLabel = new JLabel("New title");
    setLayout(new BorderLayout());
    add(saveButton);
    add(titleLabel);
  }

  private void businessRule() {
    System.out.println("do not copy this");
  }
}
`;

    const result = mergeWithPreservation(original, generated);

    expect(result.success).toBe(true);
    expect(result.hadMarkers).toBe(false);
    expect(result.replacedSections).toContain("heuristic-region-1");
    expect(result.preservedSections).toContain("outside-gui-regions");
    expect(result.detectedGuiRegions.length).toBeGreaterThan(0);

    expect(result.mergedContent).toContain('private String owner = "kept";');
    expect(result.mergedContent).toContain('setTitle("Generated")');
    expect(result.mergedContent).toContain('saveButton = new JButton("Send");');
    expect(result.mergedContent).toContain("setLayout(new BorderLayout())");
    expect(result.mergedContent).toContain("System.out.println(owner);");
    expect(result.mergedContent).not.toContain("do not copy this");
  });

  it("detects and groups GUI lines into heuristic regions", () => {
    const content = `public class Sample extends JFrame {
  private JButton saveButton;
  // keep this comment attached to GUI area
  saveButton = new JButton("Save");
  doBusinessStuff();
  setLayout(null);
  add(saveButton);
}`;

    const regions = detectGuiCodeRegions(content);

    expect(regions).toHaveLength(2);
    expect(regions[0]).toMatchObject({ startLine: 1, endLine: 3 });
    expect(regions[0].reasons).toEqual(
      expect.arrayContaining(["swing-field", "swing-instantiation"]),
    );
    expect(regions[1]).toMatchObject({ startLine: 5, endLine: 6 });
    expect(regions[1].reasons).toEqual(expect.arrayContaining(["layout-call", "component-call"]));
  });

  it("creates .bak backup before writing merged content", async () => {
    const fixedDate = new Date("2026-03-24T10:20:30.400Z");
    const filePath = "workspace/src/MainFrame.java";
    const files = new Map<string, string>([[filePath, originalWithMarkers]]);
    const writes: Array<{ path: string; content: string }> = [];

    const fileSystem: FileSystemAdapter = {
      async readFile(path): Promise<string> {
        const value = files.get(path);
        if (value === undefined) {
          throw new Error(`File not found: ${path}`);
        }

        return value;
      },
      async writeFile(path, content): Promise<void> {
        writes.push({ path, content });
        files.set(path, content);
      },
    };

    const result = await mergeJavaFile(filePath, generatedWithAllMarkers, {
      fileSystem,
      now: () => fixedDate,
    });

    expect(result.success).toBe(true);
    expect(result.backupPath).toBe("workspace/src/MainFrame.java.2026-03-24T10-20-30-400Z.bak");
    expect(writes).toHaveLength(2);
    expect(writes[0]).toEqual({
      path: "workspace/src/MainFrame.java.2026-03-24T10-20-30-400Z.bak",
      content: originalWithMarkers,
    });
    expect(writes[1].path).toBe(filePath);
    expect(writes[1].content).toContain("submitForm();");
  });

  it("skips writes when merge cannot replace any GUI region", async () => {
    const filePath = "workspace/src/PlainClass.java";
    const original = `public class PlainClass {
  private String value = "keep";

  public void run() {
    System.out.println(value);
  }
}
`;
    const generated = `public class PlainClass {
  private String value = "new";

  public void run() {
    System.out.println("new");
  }
}
`;

    const writes: Array<{ path: string; content: string }> = [];
    const fileSystem: FileSystemAdapter = {
      async readFile(path): Promise<string> {
        if (path === filePath) {
          return original;
        }

        throw new Error(`File not found: ${path}`);
      },
      async writeFile(path, content): Promise<void> {
        writes.push({ path, content });
      },
    };

    const result = await mergeJavaFile(filePath, generated, { fileSystem });

    expect(result.success).toBe(false);
    expect(result.backupPath).toBeUndefined();
    expect(result.preservedSections).toEqual(["entire-file"]);
    expect(writes).toHaveLength(0);
  });
});
