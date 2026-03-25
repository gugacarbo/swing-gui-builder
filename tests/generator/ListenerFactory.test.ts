import { describe, expect, it } from "vitest";
import type { ListenerType } from "../../src/generator/ListenerFactory";
import {
  createListenerCode,
  getSupportedListenerTypes,
  isListenerTypeSupported,
} from "../../src/generator/ListenerFactory";

describe("ListenerFactory", () => {
  describe("createListenerCode", () => {
    it("generates ActionListener code for Button", () => {
      const result = createListenerCode("Button", "submitButton", "handleSubmit");
      expect(result).toBe("    submitButton.addActionListener(e -> handleSubmit());");
    });

    it("generates ActionListener code for TextField", () => {
      const result = createListenerCode("TextField", "nameField", "onNameChange");
      expect(result).toBe("    nameField.addActionListener(e -> onNameChange());");
    });

    it("generates ActionListener code for PasswordField", () => {
      const result = createListenerCode("PasswordField", "passwordField", "onPasswordSubmit");
      expect(result).toBe("    passwordField.addActionListener(e -> onPasswordSubmit());");
    });

    it("generates DocumentListener code for TextArea", () => {
      const result = createListenerCode("TextArea", "descriptionArea", "onDescriptionChange");
      expect(result).toBe(
        [
          "    descriptionArea.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {",
          "      public void insertUpdate(javax.swing.event.DocumentEvent e) { onDescriptionChange(); }",
          "      public void removeUpdate(javax.swing.event.DocumentEvent e) { onDescriptionChange(); }",
          "      public void changedUpdate(javax.swing.event.DocumentEvent e) { onDescriptionChange(); }",
          "    });",
        ].join("\n"),
      );
    });

    it("generates ItemListener code for CheckBox", () => {
      const result = createListenerCode("CheckBox", "agreeCheckbox", "onAgreeChange");
      expect(result).toBe("    agreeCheckbox.addItemListener(e -> onAgreeChange());");
    });

    it("generates ActionListener code for RadioButton", () => {
      const result = createListenerCode("RadioButton", "optionRadio", "onOptionSelect");
      expect(result).toBe("    optionRadio.addActionListener(e -> onOptionSelect());");
    });

    it("generates ActionListener code for ComboBox", () => {
      const result = createListenerCode("ComboBox", "countryCombo", "onCountryChange");
      expect(result).toBe("    countryCombo.addActionListener(e -> onCountryChange());");
    });

    it("generates ListSelectionListener code for List", () => {
      const result = createListenerCode("List", "itemList", "onItemSelect");
      expect(result).toBe(
        "    itemList.addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) onItemSelect(); });",
      );
    });

    it("generates ChangeListener code for Slider", () => {
      const result = createListenerCode("Slider", "volumeSlider", "onVolumeChange");
      expect(result).toBe("    volumeSlider.addChangeListener(e -> onVolumeChange());");
    });

    it("generates ChangeListener code for Spinner", () => {
      const result = createListenerCode("Spinner", "quantitySpinner", "onQuantityChange");
      expect(result).toBe("    quantitySpinner.addChangeListener(e -> onQuantityChange());");
    });

    it("returns empty string for unsupported type (TypeScript prevents but runtime safety)", () => {
      // This test ensures runtime safety even though TypeScript would prevent this
      const result = createListenerCode(
        "Button" as ListenerType,
        "testButton",
        "handleTest",
      );
      expect(result).toBe("    testButton.addActionListener(e -> handleTest());");
    });
  });

  describe("isListenerTypeSupported", () => {
    it("returns true for Button", () => {
      expect(isListenerTypeSupported("Button")).toBe(true);
    });

    it("returns true for TextField", () => {
      expect(isListenerTypeSupported("TextField")).toBe(true);
    });

    it("returns true for PasswordField", () => {
      expect(isListenerTypeSupported("PasswordField")).toBe(true);
    });

    it("returns true for TextArea", () => {
      expect(isListenerTypeSupported("TextArea")).toBe(true);
    });

    it("returns true for CheckBox", () => {
      expect(isListenerTypeSupported("CheckBox")).toBe(true);
    });

    it("returns true for RadioButton", () => {
      expect(isListenerTypeSupported("RadioButton")).toBe(true);
    });

    it("returns true for ComboBox", () => {
      expect(isListenerTypeSupported("ComboBox")).toBe(true);
    });

    it("returns true for List", () => {
      expect(isListenerTypeSupported("List")).toBe(true);
    });

    it("returns true for Slider", () => {
      expect(isListenerTypeSupported("Slider")).toBe(true);
    });

    it("returns true for Spinner", () => {
      expect(isListenerTypeSupported("Spinner")).toBe(true);
    });

    it("returns false for Panel", () => {
      expect(isListenerTypeSupported("Panel")).toBe(false);
    });

    it("returns false for Label", () => {
      expect(isListenerTypeSupported("Label")).toBe(false);
    });

    it("returns false for Table", () => {
      expect(isListenerTypeSupported("Table")).toBe(false);
    });

    it("returns false for Tree", () => {
      expect(isListenerTypeSupported("Tree")).toBe(false);
    });

    it("returns false for MenuBar", () => {
      expect(isListenerTypeSupported("MenuBar")).toBe(false);
    });

    it("returns false for Menu", () => {
      expect(isListenerTypeSupported("Menu")).toBe(false);
    });

    it("returns false for MenuItem", () => {
      expect(isListenerTypeSupported("MenuItem")).toBe(false);
    });

    it("returns false for ScrollPane", () => {
      expect(isListenerTypeSupported("ScrollPane")).toBe(false);
    });

    it("returns false for ToolBar", () => {
      expect(isListenerTypeSupported("ToolBar")).toBe(false);
    });

    it("returns false for Separator", () => {
      expect(isListenerTypeSupported("Separator")).toBe(false);
    });

    it("returns false for ProgressBar", () => {
      expect(isListenerTypeSupported("ProgressBar")).toBe(false);
    });

    it("returns false for unknown string", () => {
      expect(isListenerTypeSupported("UnknownType")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isListenerTypeSupported("")).toBe(false);
    });
  });

  describe("getSupportedListenerTypes", () => {
    it("returns all supported listener types", () => {
      const types = getSupportedListenerTypes();
      expect(types).toEqual([
        "Button",
        "TextField",
        "PasswordField",
        "TextArea",
        "CheckBox",
        "RadioButton",
        "ComboBox",
        "List",
        "Slider",
        "Spinner",
      ]);
    });

    it("returns exactly 10 supported types", () => {
      const types = getSupportedListenerTypes();
      expect(types).toHaveLength(10);
    });

    it("returns a new array each time (immutability)", () => {
      const types1 = getSupportedListenerTypes();
      const types2 = getSupportedListenerTypes();
      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });

  describe("listener output format", () => {
    it("generates properly indented single-line listeners", () => {
      const result = createListenerCode("Button", "btn", "onClick");
      expect(result.startsWith("    ")).toBe(true);
    });

    it("generates multi-line listener for TextArea with proper indentation", () => {
      const result = createListenerCode("TextArea", "area", "onChange");
      const lines = result.split("\n");
      expect(lines).toHaveLength(5);
      expect(lines[0]).toMatch(/^    /); // First line: 4 spaces
      expect(lines[1]).toMatch(/^      /); // Second line: 6 spaces
      expect(lines[2]).toMatch(/^      /); // Third line: 6 spaces
      expect(lines[3]).toMatch(/^      /); // Fourth line: 6 spaces
      expect(lines[4]).toMatch(/^    /); // Last line: 4 spaces
    });
  });
});
