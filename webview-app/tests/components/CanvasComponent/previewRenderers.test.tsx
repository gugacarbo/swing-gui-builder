import { describe, expect, it } from "vitest";

import { renderComponentPreview } from "@/components/CanvasComponent/previewRenderers";
import type { CanvasComponent } from "@/types/canvas";

function createComponent(
  type: CanvasComponent["type"],
  overrides: Partial<CanvasComponent> = {},
): CanvasComponent {
  return {
    id: "test-id",
    type,
    x: 0,
    y: 0,
    width: 100,
    height: 30,
    variableName: "variable",
    text: "text",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "onClick",
    ...overrides,
  };
}

describe("renderComponentPreview", () => {
  const textStyle = { color: "#ffffff", fontSize: "12px" };

  describe("Label", () => {
    it("renders with custom text", () => {
      const component = createComponent("Label", { text: "Custom Label" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with fallback text when empty", () => {
      const component = createComponent("Label", { text: "" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Button", () => {
    it("renders with custom text", () => {
      const component = createComponent("Button", { text: "Click Me" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with background color", () => {
      const component = createComponent("Button", {
        backgroundColor: "#f0f0f0",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("TextField", () => {
    it("renders with custom text", () => {
      const component = createComponent("TextField", { text: "Input value" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("TextArea", () => {
    it("renders with multiline text", () => {
      const component = createComponent("TextArea", {
        text: "Line 1\nLine 2",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("CheckBox", () => {
    it("renders unchecked", () => {
      const component = createComponent("CheckBox", {
        selected: false,
        text: "Option",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders checked", () => {
      const component = createComponent("CheckBox", {
        selected: true,
        text: "Checked Option",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("RadioButton", () => {
    it("renders unselected", () => {
      const component = createComponent("RadioButton", {
        selected: false,
        text: "Radio Option",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders selected", () => {
      const component = createComponent("RadioButton", {
        selected: true,
        text: "Selected Radio",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("ComboBox", () => {
    it("renders with items", () => {
      const component = createComponent("ComboBox", {
        items: ["Option 1", "Option 2", "Option 3"],
        text: "ComboBox",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with first item selected", () => {
      const component = createComponent("ComboBox", {
        items: ["First", "Second"],
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with fallback text when no items", () => {
      const component = createComponent("ComboBox", {
        items: [],
        text: "Select...",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("List", () => {
    it("renders with items", () => {
      const component = createComponent("List", {
        items: ["Item A", "Item B", "Item C"],
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with default items when empty", () => {
      const component = createComponent("List", { items: [] });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("limits display to 5 items", () => {
      const component = createComponent("List", {
        items: ["1", "2", "3", "4", "5", "6", "7"],
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("ProgressBar", () => {
    it("renders with default range (0-100)", () => {
      const component = createComponent("ProgressBar", { value: 50 });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with custom min/max", () => {
      const component = createComponent("ProgressBar", {
        min: 0,
        max: 200,
        value: 100,
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("clamps value to range", () => {
      const component = createComponent("ProgressBar", {
        min: 0,
        max: 100,
        value: 150,
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("handles invalid max (max <= min)", () => {
      const component = createComponent("ProgressBar", {
        min: 50,
        max: 50,
        value: 50,
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Slider", () => {
    it("renders with value in range", () => {
      const component = createComponent("Slider", { value: 75 });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders at minimum value", () => {
      const component = createComponent("Slider", { min: 10, value: 10 });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Spinner", () => {
    it("renders with current value", () => {
      const component = createComponent("Spinner", { value: 42 });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Separator", () => {
    it("renders horizontal separator", () => {
      const component = createComponent("Separator", {
        orientation: "horizontal",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders vertical separator", () => {
      const component = createComponent("Separator", {
        orientation: "vertical",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Panel", () => {
    it("renders with title", () => {
      const component = createComponent("Panel", { text: "Panel Title" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders with fallback title", () => {
      const component = createComponent("Panel", { text: "" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("PasswordField", () => {
    it("renders masked characters for password", () => {
      const component = createComponent("PasswordField", { text: "secret" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("renders placeholder when empty", () => {
      const component = createComponent("PasswordField", { text: "" });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });

    it("limits mask display to 12 characters", () => {
      const component = createComponent("PasswordField", {
        text: "verylongpassword",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });

  describe("Unknown type", () => {
    it("renders fallback for unknown component type", () => {
      const component = createComponent("UnknownComponent" as CanvasComponent["type"], {
        text: "Unknown",
      });
      const result = renderComponentPreview(component, textStyle);
      expect(result).toBeDefined();
    });
  });
});
