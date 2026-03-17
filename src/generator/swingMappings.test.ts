import { describe, expect, it } from "vitest";
import type { ComponentModel, ComponentType } from "../components/ComponentModel";
import { getComponentSwingType, getSwingClass } from "./swingMappings";

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
    width: 100,
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

describe("swingMappings", () => {
  describe("getSwingClass", () => {
    it.each([
      ["Panel", "JPanel"],
      ["Button", "JButton"],
      ["TextArea", "JTextArea"],
      ["ComboBox", "JComboBox<String>"],
      ["List", "JList<String>"],
      ["Separator", "JSeparator"],
    ] as const)("maps %s to %s", (componentType, swingClass) => {
      expect(getSwingClass(componentType)).toBe(swingClass);
    });

    it.each(["MenuBar", "Menu", "MenuItem", "ToolBar"] as const)(
      "falls back to JButton for unmapped type %s",
      (componentType) => {
        expect(getSwingClass(componentType)).toBe("JButton");
      },
    );

    it("falls back to JButton for unknown runtime values", () => {
      expect(getSwingClass("UnknownComponent" as ComponentType)).toBe("JButton");
    });
  });

  describe("getComponentSwingType", () => {
    it.each([
      ["MenuBar", "JMenuBar"],
      ["Menu", "JMenu"],
      ["MenuItem", "JMenuItem"],
      ["ToolBar", "JToolBar"],
    ] as const)("maps %s to %s", (componentType, swingClass) => {
      const component = createComponent({
        id: `${componentType}Comp`,
        type: componentType,
        variableName: `${componentType}Comp`,
      });

      expect(getComponentSwingType(component)).toBe(swingClass);
    });

    it("uses getSwingClass mapping for regular components", () => {
      const component = createComponent({
        id: "descriptionField",
        type: "TextArea",
        variableName: "descriptionField",
      });

      expect(getComponentSwingType(component)).toBe("JTextArea");
    });

    it("falls back to JButton for unknown runtime values", () => {
      const component = {
        ...createComponent({
          id: "unknownComp",
          type: "Button",
          variableName: "unknownComp",
        }),
        type: "UnknownComponent" as ComponentModel["type"],
      };

      expect(getComponentSwingType(component)).toBe("JButton");
    });
  });
});
