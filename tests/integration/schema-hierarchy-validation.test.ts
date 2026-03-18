import { readFileSync } from "node:fs";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

function loadSchema(): Record<string, unknown> {
  const schemaPath = new URL("../../schemas/swingbuilder.schema.json", import.meta.url);
  return JSON.parse(readFileSync(schemaPath, "utf-8")) as Record<string, unknown>;
}

describe("integration hierarchy schema validation", () => {
  it("accepts hierarchical defaults for supported component types", () => {
    const schema = loadSchema();
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);

    const validHierarchicalConfig = {
      defaultBackgroundColor: "#FFFFFF",
      defaultTextColor: "#000000",
      defaultFontFamily: "Arial",
      defaultFontSize: 12,
      outputDirectory: "swing/components/",
      components: {
        MenuBar: { children: ["fileMenu"] },
        Menu: { parentId: "mainMenuBar", children: ["saveItem"] },
        MenuItem: { parentId: "fileMenu" },
        ToolBar: { position: "top", children: ["saveButton"] },
      },
    };

    expect(validate(validHierarchicalConfig)).toBe(true);
  });

  it("rejects invalid hierarchical definitions", () => {
    const schema = loadSchema();
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);

    const invalidHierarchicalConfig = {
      components: {
        Menu: { children: [1] },
        ToolBar: { position: "center" },
      },
    };

    expect(validate(invalidHierarchicalConfig)).toBe(false);
    const errorPaths = (validate.errors ?? []).map((error) => `${error.instancePath}:${error.keyword}`);
    expect(errorPaths).toContain("/components/Menu/children/0:type");
    expect(errorPaths).toContain("/components/ToolBar/position:enum");
  });
});
