import { describe, expect, it } from "vitest";
import {
  detectMarkers,
  getBeginMarker,
  getEndMarker,
  insertMarkers,
  replaceBetweenMarkers,
} from "../../src/merger/MarkerManager";

describe("MarkerManager", () => {
  it("defines marker format as // @swingbuilder:generated:{section} begin/end", () => {
    expect(getBeginMarker("fields")).toBe("// @swingbuilder:generated:fields begin");
    expect(getEndMarker("fields")).toBe("// @swingbuilder:generated:fields end");
    expect(getBeginMarker("constructor")).toBe("// @swingbuilder:generated:constructor begin");
    expect(getEndMarker("constructor")).toBe("// @swingbuilder:generated:constructor end");
    expect(getBeginMarker("methods")).toBe("// @swingbuilder:generated:methods begin");
    expect(getEndMarker("methods")).toBe("// @swingbuilder:generated:methods end");
  });

  it("returns null when a file has no generated markers", () => {
    const content = `public class SampleFrame extends JFrame {
  private JButton saveButton;
}`;

    expect(detectMarkers(content)).toBeNull();
  });

  it("detects fields, constructor and methods sections from existing markers", () => {
    const content = `public class SampleFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton saveButton;
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
  public SampleFrame() {
    setLayout(null);
  }
// @swingbuilder:generated:constructor end

// @swingbuilder:generated:methods begin
  private void onSave() {
    // TODO: implement
  }
// @swingbuilder:generated:methods end
}`;

    const regions = detectMarkers(content);
    expect(regions).not.toBeNull();
    expect(regions?.fields?.content).toBe("  private JButton saveButton;\n");
    expect(regions?.constructor?.content).toBe(
      "  public SampleFrame() {\n    setLayout(null);\n  }\n",
    );
    expect(regions?.methods?.content).toBe(
      "  private void onSave() {\n    // TODO: implement\n  }\n",
    );
  });

  it("inserts marker pairs around generated sections", () => {
    const content = `public class SampleFrame extends JFrame {
  private JButton saveButton;

  public SampleFrame() {
    setLayout(null);
  }

  private void onSave() {
    // TODO: implement
  }
}`;

    const fields = "  private JButton saveButton;\n";
    const constructorSection = "  public SampleFrame() {\n    setLayout(null);\n  }\n";
    const methods = "  private void onSave() {\n    // TODO: implement\n  }\n";

    const fieldsStart = content.indexOf(fields);
    const constructorStart = content.indexOf(constructorSection);
    const methodsStart = content.indexOf(methods);

    const withMarkers = insertMarkers(content, {
      fields: { start: fieldsStart, end: fieldsStart + fields.length },
      constructor: {
        start: constructorStart,
        end: constructorStart + constructorSection.length,
      },
      methods: { start: methodsStart, end: methodsStart + methods.length },
    });

    expect(withMarkers).toContain("// @swingbuilder:generated:fields begin");
    expect(withMarkers).toContain("// @swingbuilder:generated:fields end");
    expect(withMarkers).toContain("// @swingbuilder:generated:constructor begin");
    expect(withMarkers).toContain("// @swingbuilder:generated:constructor end");
    expect(withMarkers).toContain("// @swingbuilder:generated:methods begin");
    expect(withMarkers).toContain("// @swingbuilder:generated:methods end");

    const detected = detectMarkers(withMarkers);
    expect(detected?.fields?.content).toBe(fields);
    expect(detected?.constructor?.content).toBe(constructorSection);
    expect(detected?.methods?.content).toBe(methods);
  });

  it("replaces content between section markers without removing marker lines", () => {
    const original = `public class SampleFrame extends JFrame {
// @swingbuilder:generated:methods begin
  private void onSave() {
    // TODO: implement
  }
// @swingbuilder:generated:methods end
}`;
    const updatedMethods = "  private void onSave() {\n    submitForm();\n  }\n";

    const merged = replaceBetweenMarkers(original, "methods", updatedMethods);
    expect(merged).toContain("// @swingbuilder:generated:methods begin");
    expect(merged).toContain(updatedMethods);
    expect(merged).toContain("// @swingbuilder:generated:methods end");
  });
});
