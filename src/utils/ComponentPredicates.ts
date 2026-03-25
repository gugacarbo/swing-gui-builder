import type { ComponentModel, ComponentType } from "../components/ComponentModel";

/**
 * Returns the string type of a component.
 */
function getComponentType(comp: ComponentModel): string {
  return comp.type as string;
}

/**
 * Type guard for Button components.
 */
export function isButtonComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Button";
}

/**
 * Type guard for TextField components.
 */
export function isTextFieldComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "TextField";
}

/**
 * Type guard for Label components.
 */
export function isLabelComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Label";
}

/**
 * Type guard for ComboBox components.
 */
export function isComboBoxComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "ComboBox";
}

/**
 * Type guard for List components.
 */
export function isListComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "List";
}

/**
 * Type guard for Table components.
 * Note: Table is not currently a supported ComponentType, but included for future extensibility.
 */
export function isTableComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Table";
}

/**
 * Type guard for Tree components.
 * Note: Tree is not currently a supported ComponentType, but included for future extensibility.
 */
export function isTreeComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Tree";
}

/**
 * Type guard for Panel components.
 */
export function isPanelComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Panel";
}

/**
 * Type guard for Menu components.
 */
export function isMenuComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Menu";
}

/**
 * Type guard for MenuItem components.
 */
export function isMenuItemComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "MenuItem";
}

/**
 * Type guard for CheckBox components.
 */
export function isCheckBoxComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "CheckBox";
}

/**
 * Type guard for RadioButton components.
 */
export function isRadioButtonComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "RadioButton";
}

/**
 * Type guard for ScrollPane components.
 * Note: ScrollPane is not currently a supported ComponentType, but included for future extensibility.
 */
export function isScrollPaneComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "ScrollPane";
}

/**
 * Type guard for ToolBar components.
 */
export function isToolBarComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "ToolBar";
}

/**
 * Type guard for MenuBar components.
 */
export function isMenuBarComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "MenuBar";
}

/**
 * Type guard for PasswordField components.
 */
export function isPasswordFieldComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "PasswordField";
}

/**
 * Type guard for TextArea components.
 */
export function isTextAreaComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "TextArea";
}

/**
 * Type guard for ProgressBar components.
 */
export function isProgressBarComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "ProgressBar";
}

/**
 * Type guard for Slider components.
 */
export function isSliderComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Slider";
}

/**
 * Type guard for Spinner components.
 */
export function isSpinnerComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Spinner";
}

/**
 * Type guard for Separator components.
 */
export function isSeparatorComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Separator";
}

/**
 * Type guard for hierarchical menu components (MenuBar, Menu, or MenuItem).
 */
export function isHierarchicalMenuComponent(comp: ComponentModel): boolean {
  return isMenuBarComponent(comp) || isMenuComponent(comp) || isMenuItemComponent(comp);
}

/**
 * Type guard for components that support text constructor (Button, Label, TextField, PasswordField, TextArea, CheckBox, RadioButton).
 */
export function supportsTextConstructor(type: ComponentType): boolean {
  return (
    type === "Button" ||
    type === "Label" ||
    type === "TextField" ||
    type === "PasswordField" ||
    type === "TextArea" ||
    type === "CheckBox" ||
    type === "RadioButton"
  );
}
