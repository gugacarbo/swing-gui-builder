import { describe, expect, it } from "vitest";
import { parsedToCanvasState, swingTypeToComponentType } from "../../src/parser/toCanvasState";
import type { ParsedJavaFile } from "../../src/parser/types";

function createParsedJavaFile(overrides: Partial<ParsedJavaFile> = {}): ParsedJavaFile {
  return {
    classInfo: {
      className: "MainWindow",
      isGuiClass: true,
      ...overrides.classInfo,
    },
    symbolTable: {},
    components: [],
    parentChildRelationships: [],
    methodCalls: [],
    ...overrides,
  };
}

describe("toCanvasState", () => {
  describe("swingTypeToComponentType", () => {
    it.each([
      ["JButton", "Button"],
      ["javax.swing.JLabel", "Label"],
      ["JPanel", "Panel"],
      ["JTextField", "TextField"],
      ["JCheckBox", "CheckBox"],
      ["JComboBox<String>", "ComboBox"],
      ["JToolBar", "ToolBar"],
    ] as const)("maps %s to %s", (swingType, componentType) => {
      expect(swingTypeToComponentType(swingType)).toBe(componentType);
    });
  });

  it("extracts frame title and dimensions from constructor method calls", () => {
    const parsed = createParsedJavaFile({
      classInfo: {
        className: "EditorFrame",
        extendsClass: "JFrame",
        isGuiClass: true,
      },
      methodCalls: [
        {
          methodName: "setTitle",
          receiverKind: "this",
          arguments: ['"Editor"'],
          line: 12,
        },
        {
          methodName: "setSize",
          receiverKind: "this",
          arguments: ["1024", "768"],
          line: 13,
        },
      ],
    });

    const state = parsedToCanvasState(parsed);

    expect(state.frameTitle).toBe("Editor");
    expect(state.frameWidth).toBe(1024);
    expect(state.frameHeight).toBe(768);
  });

  it("extracts frame dimensions from class-level frame variable calls", () => {
    const parsed = createParsedJavaFile({
      classInfo: {
        className: "DashboardFrame",
        isGuiClass: true,
      },
      symbolTable: {
        frame: "JFrame",
      },
      methodCalls: [
        {
          methodName: "setTitle",
          receiverKind: "variable",
          receiverVariableName: "frame",
          arguments: ['"Dashboard"'],
          line: 12,
        },
        {
          methodName: "setBounds",
          receiverKind: "variable",
          receiverVariableName: "frame",
          arguments: ["0", "0", "920", "640"],
          line: 13,
        },
      ],
    });

    const state = parsedToCanvasState(parsed);

    expect(state.frameTitle).toBe("Dashboard");
    expect(state.frameWidth).toBe(920);
    expect(state.frameHeight).toBe(640);
  });

  it("preserves variable names as component ids and handles nested panel children", () => {
    const parsed = createParsedJavaFile({
      classInfo: {
        className: "EditorFrame",
        extendsClass: "JFrame",
        isGuiClass: true,
      },
      components: [
        {
          variableName: "mainPanel",
          type: "JPanel",
          properties: {
            bounds: { x: 20, y: 30, width: 500, height: 300 },
            text: "",
          },
          childVariableNames: ["saveButton", "titleLabel"],
        },
        {
          variableName: "saveButton",
          type: "JButton",
          properties: {
            bounds: { x: 40, y: 90, width: 120, height: 32 },
            text: "Save",
          },
          parentVariableName: "mainPanel",
          childVariableNames: [],
        },
        {
          variableName: "titleLabel",
          type: "JLabel",
          properties: {
            bounds: { x: 80, y: 120, width: 200, height: 24 },
            text: "Title",
          },
          parentVariableName: "mainPanel",
          childVariableNames: [],
        },
      ],
      parentChildRelationships: [
        { parentVariableName: "mainPanel", childVariableName: "saveButton" },
        { parentVariableName: "mainPanel", childVariableName: "titleLabel" },
      ],
      methodCalls: [
        {
          methodName: "setText",
          receiverKind: "variable",
          receiverVariableName: "saveButton",
          arguments: ['"Save changes"'],
          line: 17,
        },
      ],
    });

    const state = parsedToCanvasState(parsed);
    const mainPanel = state.components.find((component) => component.id === "mainPanel");
    const saveButton = state.components.find((component) => component.id === "saveButton");
    const titleLabel = state.components.find((component) => component.id === "titleLabel");

    expect(state.className).toBe("EditorFrame");
    expect(state.components).toHaveLength(3);

    expect(mainPanel).toMatchObject({
      id: "mainPanel",
      variableName: "mainPanel",
      type: "Panel",
      children: ["saveButton", "titleLabel"],
    });

    expect(saveButton).toMatchObject({
      id: "saveButton",
      variableName: "saveButton",
      type: "Button",
      text: "Save changes",
      parentId: "mainPanel",
      parentOffset: { x: 20, y: 60 },
    });

    expect(titleLabel).toMatchObject({
      id: "titleLabel",
      variableName: "titleLabel",
      type: "Label",
      text: "Title",
      parentId: "mainPanel",
      parentOffset: { x: 60, y: 90 },
    });
  });
});
