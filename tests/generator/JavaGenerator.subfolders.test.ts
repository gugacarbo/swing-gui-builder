import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles, getParentFolder } from "../../src/generator/JavaGenerator";

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

describe("JavaGenerator subfolder metadata", () => {
  it("uses the full parent hierarchy path for nested custom components", () => {
    const state: CanvasState = {
      className: "SubfoldersFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [
        createComponent({
          id: "parentPanel",
          type: "Panel",
          variableName: "mainPanel",
        }),
        createComponent({
          id: "childPanel",
          type: "Panel",
          variableName: "childPanel",
          parentId: "parentPanel",
        }),
        createComponent({
          id: "nestedChildButton",
          type: "Button",
          variableName: "nestedChildButton",
          parentId: "childPanel",
          text: "Child Styled",
          backgroundColor: "#336699",
        }),
        createComponent({
          id: "rootButton",
          type: "Button",
          variableName: "rootButton",
          text: "Root Styled",
          backgroundColor: "#996633",
        }),
      ],
    };

    const generatedFiles = generateJavaFiles(state);
    const nestedChildCustomFile = generatedFiles.find((file) =>
      file.content.includes('super("Child Styled");'),
    );
    const rootCustomFile = generatedFiles.find((file) =>
      file.content.includes('super("Root Styled");'),
    );
    const mainFrameFile = generatedFiles.find((file) => file.fileName === "SubfoldersFrame.java");

    expect(getParentFolder(state.components[2], state.components)).toBe("mainPanel/childPanel");
    expect(nestedChildCustomFile?.subfolder).toBe("mainPanel/childPanel");
    expect(rootCustomFile?.subfolder).toBeUndefined();
    expect(mainFrameFile?.subfolder).toBeUndefined();
  });

  it("keeps subfolder undefined when parentId is missing or invalid", () => {
    const orphan = createComponent({
      id: "orphanButton",
      type: "Button",
      variableName: "orphanButton",
      parentId: "missingParent",
      text: "Orphan Styled",
      backgroundColor: "#224466",
    });
    const state: CanvasState = {
      className: "OrphanFrame",
      frameWidth: 700,
      frameHeight: 500,
      components: [orphan],
    };

    const generatedFiles = generateJavaFiles(state);
    const orphanCustomFile = generatedFiles.find((file) =>
      file.content.includes('super("Orphan Styled");'),
    );

    expect(getParentFolder(orphan, state.components)).toBeUndefined();
    expect(orphanCustomFile?.subfolder).toBeUndefined();
  });

  it("keeps flat layout output at the root without special-case handling", () => {
    const state: CanvasState = {
      className: "FlatFrame",
      frameWidth: 640,
      frameHeight: 480,
      components: [
        createComponent({
          id: "flatButtonA",
          type: "Button",
          variableName: "flatButtonA",
          text: "A",
          backgroundColor: "#114488",
        }),
        createComponent({
          id: "flatButtonB",
          type: "Button",
          variableName: "flatButtonB",
          text: "B",
          backgroundColor: "#882211",
        }),
      ],
    };

    const generatedFiles = generateJavaFiles(state);
    const customFiles = generatedFiles.filter((file) => file.fileName.startsWith("CustomButton"));

    expect(customFiles.length).toBe(2);
    expect(customFiles.every((file) => file.subfolder === undefined)).toBe(true);
  });

  it("combines base package with subfolder path in generated files", () => {
    const state: CanvasState = {
      className: "PackageFrame",
      frameWidth: 800,
      frameHeight: 600,
      components: [
        createComponent({
          id: "parentPanel",
          type: "Panel",
          variableName: "parentPanel",
        }),
        createComponent({
          id: "childButton",
          type: "Button",
          variableName: "childButton",
          parentId: "parentPanel",
          text: "Child",
          backgroundColor: "#336699",
        }),
      ],
    };

    const basePackage = "com.example.app";
    const generatedFiles = generateJavaFiles(state, basePackage);

    const mainFrameFile = generatedFiles.find((file) => file.fileName === "PackageFrame.java");
    const childCustomFile = generatedFiles.find((file) => file.content.includes('super("Child");'));

    // Main frame should have base package
    expect(mainFrameFile?.content).toContain("package com.example.app;");
    expect(mainFrameFile?.subfolder).toBeUndefined();

    // Child component should have combined package (base + subfolder)
    expect(childCustomFile?.content).toContain("package com.example.app.parentPanel;");
    expect(childCustomFile?.subfolder).toBe("parentPanel");
  });

  it("uses subfolder as package when no base package is provided", () => {
    const state: CanvasState = {
      className: "NoBasePackageFrame",
      frameWidth: 800,
      frameHeight: 600,
      components: [
        createComponent({
          id: "containerPanel",
          type: "Panel",
          variableName: "containerPanel",
        }),
        createComponent({
          id: "innerButton",
          type: "Button",
          variableName: "innerButton",
          parentId: "containerPanel",
          text: "Inner",
          backgroundColor: "#336699",
        }),
      ],
    };

    const generatedFiles = generateJavaFiles(state); // No base package

    const mainFrameFile = generatedFiles.find(
      (file) => file.fileName === "NoBasePackageFrame.java",
    );
    const innerCustomFile = generatedFiles.find((file) => file.content.includes('super("Inner");'));

    // No package declaration when no base package
    expect(mainFrameFile?.content).not.toContain("package ");

    // Nested component should use subfolder as package
    expect(innerCustomFile?.content).toContain("package containerPanel;");
  });
});
