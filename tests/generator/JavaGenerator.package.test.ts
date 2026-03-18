import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles, generatePreviewJavaFiles } from "../../src/generator/JavaGenerator";

type ComponentOverrides = Partial<Omit<ComponentModel, "id" | "type" | "variableName">> & {
  id: string;
  type: ComponentModel["type"];
  variableName: string;
};

function createComponent(overrides: ComponentOverrides): ComponentModel {
  const { id, type, variableName, ...rest } = overrides;

  return {
    id,
    type,
    variableName,
    x: 0,
    y: 0,
    width: 120,
    height: 30,
    text: "",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...rest,
  };
}

function createPackageState(): CanvasState {
  return {
    className: "PackageFrame",
    frameWidth: 960,
    frameHeight: 720,
    components: [
      createComponent({
        id: "customButton",
        type: "Button",
        variableName: "customButton",
        text: "Save",
        backgroundColor: "#336699",
      }),
      createComponent({
        id: "statusLabel",
        type: "Label",
        variableName: "statusLabel",
        text: "Ready",
      }),
    ],
  };
}

describe("JavaGenerator package propagation", () => {
  it("propagates an inferred package to generated and preview files", () => {
    const packageName = "com.example.generated.ui";
    const state = createPackageState();
    const generatedFiles = generateJavaFiles(state, packageName);
    const previewFiles = generatePreviewJavaFiles(state, packageName);

    expect(generatedFiles.length).toBeGreaterThan(1);
    expect(generatedFiles.every((file) => file.content.startsWith(`package ${packageName};`))).toBe(
      true,
    );
    expect(previewFiles.every((file) => file.content.startsWith(`package ${packageName};`))).toBe(
      true,
    );
  });

  it("does not emit package declaration when package is missing or empty", () => {
    const state = createPackageState();
    const withoutPackage = generateJavaFiles(state);
    const withEmptyPackage = generateJavaFiles(state, "");

    expect(withoutPackage.every((file) => !file.content.startsWith("package "))).toBe(true);
    expect(withEmptyPackage.every((file) => !file.content.startsWith("package "))).toBe(true);
  });
});
