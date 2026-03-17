import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
} from "./constants";
import { getDefaultProps, getDefaultSize } from "./componentDefaults";
import type { ComponentType } from "../types/canvas";
import { describe, expect, it } from "vitest";

const EXPECTED_LABEL_BY_TYPE: Record<ComponentType, string> = {
  Panel: "Panel",
  Button: "Button",
  Label: "Label",
  TextField: "TextField",
  PasswordField: "PasswordField",
  TextArea: "TextArea",
  CheckBox: "CheckBox",
  RadioButton: "RadioButton",
  ComboBox: "ComboBox",
  List: "List",
  ProgressBar: "ProgressBar",
  Slider: "Slider",
  Spinner: "Spinner",
  Separator: "Separator",
  MenuBar: "MenuBar",
  Menu: "Menu",
  MenuItem: "Menu Item",
  ToolBar: "ToolBar",
};

const EXPECTED_SIZE_BY_TYPE: Record<ComponentType, { width: number; height: number }> = {
  Panel: { width: 200, height: 150 },
  Button: { width: 120, height: 36 },
  Label: { width: 120, height: 28 },
  TextField: { width: 180, height: 36 },
  PasswordField: { width: 180, height: 36 },
  TextArea: { width: 220, height: 96 },
  CheckBox: { width: 120, height: 28 },
  RadioButton: { width: 120, height: 28 },
  ComboBox: { width: 180, height: 36 },
  List: { width: 180, height: 96 },
  ProgressBar: { width: 180, height: 28 },
  Slider: { width: 180, height: 44 },
  Spinner: { width: 120, height: 36 },
  Separator: { width: 180, height: 10 },
  MenuBar: { width: 320, height: 34 },
  Menu: { width: 110, height: 30 },
  MenuItem: { width: 140, height: 28 },
  ToolBar: { width: 280, height: 40 },
};

describe("getDefaultProps", () => {
  it.each(Object.entries(EXPECTED_LABEL_BY_TYPE))("returns defaults for %s", (type, expectedText) => {
    const props = getDefaultProps(type as ComponentType);

    expect(props.text).toBe(expectedText);
    expect(props.backgroundColor).toBe(DEFAULT_BG);
    expect(props.textColor).toBe(DEFAULT_TEXT_COLOR);
    expect(props.fontFamily).toBe(DEFAULT_FONT_FAMILY);
    expect(props.fontSize).toBe(DEFAULT_FONT_SIZE);
    expect(props.eventMethodName).toBe("");
  });

  it("returns a fresh items array for list-like components", () => {
    const comboBoxProps = getDefaultProps("ComboBox");
    const listProps = getDefaultProps("List");

    expect(comboBoxProps.items).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(listProps.items).toEqual(["Item 1", "Item 2", "Item 3"]);

    comboBoxProps.items?.push("Item 4");

    expect(getDefaultProps("ComboBox").items).toEqual(["Item 1", "Item 2", "Item 3"]);
  });

  it("returns component-specific defaults", () => {
    expect(getDefaultProps("CheckBox").selected).toBe(false);
    expect(getDefaultProps("RadioButton").selected).toBe(false);

    expect(getDefaultProps("ProgressBar")).toMatchObject({ value: 50, min: 0, max: 100 });
    expect(getDefaultProps("Slider")).toMatchObject({ value: 50, min: 0, max: 100 });
    expect(getDefaultProps("Spinner")).toMatchObject({ value: 50, min: 0, max: 100 });

    expect(getDefaultProps("Separator").orientation).toBe("horizontal");
    expect(getDefaultProps("ToolBar").position).toBe("top");
  });

  it("throws for invalid/unmapped component type", () => {
    expect(() => getDefaultProps("NotAComponent" as ComponentType)).toThrow();
  });
});

describe("getDefaultSize", () => {
  it.each(Object.entries(EXPECTED_SIZE_BY_TYPE))("returns expected size for %s", (type, expectedSize) => {
    expect(getDefaultSize(type as ComponentType)).toEqual(expectedSize);
  });

  it("returns undefined for invalid/unmapped component type", () => {
    expect(getDefaultSize("NotAComponent" as ComponentType)).toBeUndefined();
  });
});

