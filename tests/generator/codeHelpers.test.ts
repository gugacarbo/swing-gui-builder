import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  escapeJava,
  hexToRgb,
  isCustomComponent,
  supportsTextConstructor,
} from "../../src/generator/codeHelpers";

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
    backgroundColor: DEFAULT_BG,
    textColor: DEFAULT_TEXT_COLOR,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    eventMethodName: "",
    ...rest,
  };
}

describe("codeHelpers", () => {
  describe("escapeJava", () => {
    it("escapes quotes, backslashes and control characters", () => {
      const input = 'Path "C:\\temp"\nLine2\rTab\tEnd';

      expect(escapeJava(input)).toBe('Path \\"C:\\\\temp\\"\\nLine2\\rTab\\tEnd');
    });

    it("keeps plain text unchanged", () => {
      expect(escapeJava("plain text")).toBe("plain text");
    });
  });

  describe("hexToRgb", () => {
    it("converts a valid hex color to rgb", () => {
      expect(hexToRgb("#1a2B3c")).toEqual({ r: 26, g: 43, b: 60 });
    });

    it("converts short #RGB hex values to rgb", () => {
      expect(hexToRgb("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it.each(["123456", "#12GG12", ""])("returns black for invalid value %s", (value) => {
      expect(hexToRgb(value)).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("supportsTextConstructor", () => {
    it.each([
      "Button",
      "Label",
      "TextField",
      "PasswordField",
      "TextArea",
      "CheckBox",
      "RadioButton",
    ] as const)("returns true for supported type %s", (type) => {
      expect(supportsTextConstructor(type)).toBe(true);
    });

    it.each([
      "Panel",
      "ComboBox",
      "List",
      "ProgressBar",
      "Slider",
      "Spinner",
      "Separator",
      "MenuBar",
      "Menu",
      "MenuItem",
      "ToolBar",
    ] as const)("returns false for unsupported type %s", (type) => {
      expect(supportsTextConstructor(type)).toBe(false);
    });
  });

  describe("isCustomComponent", () => {
    it("returns false for components with default visual properties", () => {
      const component = createComponent({
        id: "defaultButton",
        type: "Button",
        variableName: "defaultButton",
      });

      expect(isCustomComponent(component)).toBe(false);
    });

    it("returns true when any visual property differs from defaults", () => {
      expect(
        isCustomComponent(
          createComponent({
            id: "customBackground",
            type: "Button",
            variableName: "customBackground",
            backgroundColor: "#112233",
          }),
        ),
      ).toBe(true);

      expect(
        isCustomComponent(
          createComponent({
            id: "customTextColor",
            type: "Button",
            variableName: "customTextColor",
            textColor: "#123456",
          }),
        ),
      ).toBe(true);

      expect(
        isCustomComponent(
          createComponent({
            id: "customFontFamily",
            type: "Button",
            variableName: "customFontFamily",
            fontFamily: "Courier New",
          }),
        ),
      ).toBe(true);

      expect(
        isCustomComponent(
          createComponent({
            id: "customFontSize",
            type: "Button",
            variableName: "customFontSize",
            fontSize: 14,
          }),
        ),
      ).toBe(true);
    });

    it.each([
      "MenuBar",
      "Menu",
      "MenuItem",
      "ToolBar",
    ] as const)("returns false for %s even with custom styles", (type) => {
      const component = createComponent({
        id: `${type}Custom`,
        type,
        variableName: `${type}Custom`,
        backgroundColor: "#445566",
        textColor: "#654321",
        fontFamily: "Monaco",
        fontSize: 16,
      });

      expect(isCustomComponent(component)).toBe(false);
    });
  });
});
