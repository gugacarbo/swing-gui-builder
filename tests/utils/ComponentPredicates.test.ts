import { describe, expect, it } from "vitest";
import type { ComponentModel, ComponentType } from "../../src/components/ComponentModel";
import {
  isButtonComponent,
  isCheckBoxComponent,
  isComboBoxComponent,
  isHierarchicalMenuComponent,
  isLabelComponent,
  isListComponent,
  isMenuBarComponent,
  isMenuComponent,
  isMenuItemComponent,
  isPanelComponent,
  isPasswordFieldComponent,
  isProgressBarComponent,
  isRadioButtonComponent,
  isScrollPaneComponent,
  isSeparatorComponent,
  isSliderComponent,
  isSpinnerComponent,
  isTableComponent,
  isTextAreaComponent,
  isTextFieldComponent,
  isToolBarComponent,
  isTreeComponent,
  supportsTextConstructor,
} from "../../src/utils/ComponentPredicates";

function createMockComponent(type: ComponentType): ComponentModel {
  return {
    id: "test-id",
    type,
    variableName: "testVar",
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
  };
}

describe("ComponentPredicates", () => {
  describe("isButtonComponent", () => {
    it("returns true for Button type", () => {
      expect(isButtonComponent(createMockComponent("Button"))).toBe(true);
    });

    it("returns false for non-Button types", () => {
      expect(isButtonComponent(createMockComponent("Label"))).toBe(false);
      expect(isButtonComponent(createMockComponent("TextField"))).toBe(false);
    });
  });

  describe("isTextFieldComponent", () => {
    it("returns true for TextField type", () => {
      expect(isTextFieldComponent(createMockComponent("TextField"))).toBe(true);
    });

    it("returns false for non-TextField types", () => {
      expect(isTextFieldComponent(createMockComponent("Button"))).toBe(false);
      expect(isTextFieldComponent(createMockComponent("PasswordField"))).toBe(false);
    });
  });

  describe("isLabelComponent", () => {
    it("returns true for Label type", () => {
      expect(isLabelComponent(createMockComponent("Label"))).toBe(true);
    });

    it("returns false for non-Label types", () => {
      expect(isLabelComponent(createMockComponent("Button"))).toBe(false);
      expect(isLabelComponent(createMockComponent("TextField"))).toBe(false);
    });
  });

  describe("isComboBoxComponent", () => {
    it("returns true for ComboBox type", () => {
      expect(isComboBoxComponent(createMockComponent("ComboBox"))).toBe(true);
    });

    it("returns false for non-ComboBox types", () => {
      expect(isComboBoxComponent(createMockComponent("List"))).toBe(false);
      expect(isComboBoxComponent(createMockComponent("Button"))).toBe(false);
    });
  });

  describe("isListComponent", () => {
    it("returns true for List type", () => {
      expect(isListComponent(createMockComponent("List"))).toBe(true);
    });

    it("returns false for non-List types", () => {
      expect(isListComponent(createMockComponent("ComboBox"))).toBe(false);
      expect(isListComponent(createMockComponent("Table"))).toBe(false);
    });
  });

  describe("isTableComponent", () => {
    it("returns true for Table type", () => {
      // Table is not a valid ComponentType, but we test the predicate anyway
      const tableComp = { ...createMockComponent("Panel"), type: "Table" as ComponentType };
      expect(isTableComponent(tableComp)).toBe(true);
    });

    it("returns false for non-Table types", () => {
      expect(isTableComponent(createMockComponent("List"))).toBe(false);
    });
  });

  describe("isTreeComponent", () => {
    it("returns true for Tree type", () => {
      const treeComp = { ...createMockComponent("Panel"), type: "Tree" as ComponentType };
      expect(isTreeComponent(treeComp)).toBe(true);
    });

    it("returns false for non-Tree types", () => {
      expect(isTreeComponent(createMockComponent("List"))).toBe(false);
    });
  });

  describe("isPanelComponent", () => {
    it("returns true for Panel type", () => {
      expect(isPanelComponent(createMockComponent("Panel"))).toBe(true);
    });

    it("returns false for non-Panel types", () => {
      expect(isPanelComponent(createMockComponent("Button"))).toBe(false);
      expect(isPanelComponent(createMockComponent("MenuBar"))).toBe(false);
    });
  });

  describe("isMenuComponent", () => {
    it("returns true for Menu type", () => {
      expect(isMenuComponent(createMockComponent("Menu"))).toBe(true);
    });

    it("returns false for non-Menu types", () => {
      expect(isMenuComponent(createMockComponent("MenuItem"))).toBe(false);
      expect(isMenuComponent(createMockComponent("MenuBar"))).toBe(false);
    });
  });

  describe("isMenuItemComponent", () => {
    it("returns true for MenuItem type", () => {
      expect(isMenuItemComponent(createMockComponent("MenuItem"))).toBe(true);
    });

    it("returns false for non-MenuItem types", () => {
      expect(isMenuItemComponent(createMockComponent("Menu"))).toBe(false);
      expect(isMenuItemComponent(createMockComponent("Button"))).toBe(false);
    });
  });

  describe("isCheckBoxComponent", () => {
    it("returns true for CheckBox type", () => {
      expect(isCheckBoxComponent(createMockComponent("CheckBox"))).toBe(true);
    });

    it("returns false for non-CheckBox types", () => {
      expect(isCheckBoxComponent(createMockComponent("RadioButton"))).toBe(false);
      expect(isCheckBoxComponent(createMockComponent("Button"))).toBe(false);
    });
  });

  describe("isRadioButtonComponent", () => {
    it("returns true for RadioButton type", () => {
      expect(isRadioButtonComponent(createMockComponent("RadioButton"))).toBe(true);
    });

    it("returns false for non-RadioButton types", () => {
      expect(isRadioButtonComponent(createMockComponent("CheckBox"))).toBe(false);
      expect(isRadioButtonComponent(createMockComponent("Button"))).toBe(false);
    });
  });

  describe("isScrollPaneComponent", () => {
    it("returns true for ScrollPane type", () => {
      const scrollComp = { ...createMockComponent("Panel"), type: "ScrollPane" as ComponentType };
      expect(isScrollPaneComponent(scrollComp)).toBe(true);
    });

    it("returns false for non-ScrollPane types", () => {
      expect(isScrollPaneComponent(createMockComponent("Panel"))).toBe(false);
    });
  });

  describe("isToolBarComponent", () => {
    it("returns true for ToolBar type", () => {
      expect(isToolBarComponent(createMockComponent("ToolBar"))).toBe(true);
    });

    it("returns false for non-ToolBar types", () => {
      expect(isToolBarComponent(createMockComponent("MenuBar"))).toBe(false);
      expect(isToolBarComponent(createMockComponent("Button"))).toBe(false);
    });
  });

  describe("isMenuBarComponent", () => {
    it("returns true for MenuBar type", () => {
      expect(isMenuBarComponent(createMockComponent("MenuBar"))).toBe(true);
    });

    it("returns false for non-MenuBar types", () => {
      expect(isMenuBarComponent(createMockComponent("Menu"))).toBe(false);
      expect(isMenuBarComponent(createMockComponent("ToolBar"))).toBe(false);
    });
  });

  describe("isPasswordFieldComponent", () => {
    it("returns true for PasswordField type", () => {
      expect(isPasswordFieldComponent(createMockComponent("PasswordField"))).toBe(true);
    });

    it("returns false for non-PasswordField types", () => {
      expect(isPasswordFieldComponent(createMockComponent("TextField"))).toBe(false);
      expect(isPasswordFieldComponent(createMockComponent("TextArea"))).toBe(false);
    });
  });

  describe("isTextAreaComponent", () => {
    it("returns true for TextArea type", () => {
      expect(isTextAreaComponent(createMockComponent("TextArea"))).toBe(true);
    });

    it("returns false for non-TextArea types", () => {
      expect(isTextAreaComponent(createMockComponent("TextField"))).toBe(false);
      expect(isTextAreaComponent(createMockComponent("PasswordField"))).toBe(false);
    });
  });

  describe("isProgressBarComponent", () => {
    it("returns true for ProgressBar type", () => {
      expect(isProgressBarComponent(createMockComponent("ProgressBar"))).toBe(true);
    });

    it("returns false for non-ProgressBar types", () => {
      expect(isProgressBarComponent(createMockComponent("Slider"))).toBe(false);
      expect(isProgressBarComponent(createMockComponent("Spinner"))).toBe(false);
    });
  });

  describe("isSliderComponent", () => {
    it("returns true for Slider type", () => {
      expect(isSliderComponent(createMockComponent("Slider"))).toBe(true);
    });

    it("returns false for non-Slider types", () => {
      expect(isSliderComponent(createMockComponent("ProgressBar"))).toBe(false);
      expect(isSliderComponent(createMockComponent("Spinner"))).toBe(false);
    });
  });

  describe("isSpinnerComponent", () => {
    it("returns true for Spinner type", () => {
      expect(isSpinnerComponent(createMockComponent("Spinner"))).toBe(true);
    });

    it("returns false for non-Spinner types", () => {
      expect(isSpinnerComponent(createMockComponent("Slider"))).toBe(false);
      expect(isSpinnerComponent(createMockComponent("ProgressBar"))).toBe(false);
    });
  });

  describe("isSeparatorComponent", () => {
    it("returns true for Separator type", () => {
      expect(isSeparatorComponent(createMockComponent("Separator"))).toBe(true);
    });

    it("returns false for non-Separator types", () => {
      expect(isSeparatorComponent(createMockComponent("Button"))).toBe(false);
      expect(isSeparatorComponent(createMockComponent("Panel"))).toBe(false);
    });
  });

  describe("isHierarchicalMenuComponent", () => {
    it("returns true for MenuBar type", () => {
      expect(isHierarchicalMenuComponent(createMockComponent("MenuBar"))).toBe(true);
    });

    it("returns true for Menu type", () => {
      expect(isHierarchicalMenuComponent(createMockComponent("Menu"))).toBe(true);
    });

    it("returns true for MenuItem type", () => {
      expect(isHierarchicalMenuComponent(createMockComponent("MenuItem"))).toBe(true);
    });

    it("returns false for non-hierarchical menu types", () => {
      expect(isHierarchicalMenuComponent(createMockComponent("Button"))).toBe(false);
      expect(isHierarchicalMenuComponent(createMockComponent("ToolBar"))).toBe(false);
      expect(isHierarchicalMenuComponent(createMockComponent("Panel"))).toBe(false);
    });
  });

  describe("supportsTextConstructor", () => {
    it("returns true for types that support text constructor", () => {
      expect(supportsTextConstructor("Button")).toBe(true);
      expect(supportsTextConstructor("Label")).toBe(true);
      expect(supportsTextConstructor("TextField")).toBe(true);
      expect(supportsTextConstructor("PasswordField")).toBe(true);
      expect(supportsTextConstructor("TextArea")).toBe(true);
      expect(supportsTextConstructor("CheckBox")).toBe(true);
      expect(supportsTextConstructor("RadioButton")).toBe(true);
    });

    it("returns false for types that do not support text constructor", () => {
      expect(supportsTextConstructor("Panel")).toBe(false);
      expect(supportsTextConstructor("ComboBox")).toBe(false);
      expect(supportsTextConstructor("List")).toBe(false);
      expect(supportsTextConstructor("MenuBar")).toBe(false);
      expect(supportsTextConstructor("Menu")).toBe(false);
      expect(supportsTextConstructor("MenuItem")).toBe(false);
      expect(supportsTextConstructor("ToolBar")).toBe(false);
      expect(supportsTextConstructor("ProgressBar")).toBe(false);
      expect(supportsTextConstructor("Slider")).toBe(false);
      expect(supportsTextConstructor("Spinner")).toBe(false);
      expect(supportsTextConstructor("Separator")).toBe(false);
    });
  });
});
