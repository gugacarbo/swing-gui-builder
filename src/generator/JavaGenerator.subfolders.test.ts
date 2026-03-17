import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import { generateJavaFiles, getParentFolder } from "./JavaGenerator";

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
  it("uses parentId to infer a parent subfolder for generated custom files", () => {
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
          id: "childButton",
          type: "Button",
          variableName: "childButton",
          parentId: "parentPanel",
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
    const childCustomFile = generatedFiles.find((file) =>
      file.content.includes('super("Child Styled");'),
    );
    const rootCustomFile = generatedFiles.find((file) =>
      file.content.includes('super("Root Styled");'),
    );
    const mainFrameFile = generatedFiles.find((file) => file.fileName === "SubfoldersFrame.java");

    expect(getParentFolder(state.components[1], state.components)).toBe("mainPanel");
    expect(childCustomFile?.subfolder).toBe("mainPanel");
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
});
