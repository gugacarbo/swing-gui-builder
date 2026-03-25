/**
 * Listener types supported by the factory.
 * Each type maps to a specific Swing listener interface.
 */
export type ListenerType =
  | "Button"
  | "TextField"
  | "PasswordField"
  | "TextArea"
  | "CheckBox"
  | "RadioButton"
  | "ComboBox"
  | "List"
  | "Slider"
  | "Spinner";

/**
 * Listener code generators mapped by type.
 * Each generator returns the listener registration code for a component.
 */
type ListenerGenerator = (variableName: string, methodName: string) => string;

/**
 * Registry of listener generators by component type.
 * Maps each supported component type to its listener code generator.
 */
const listenerGenerators: Readonly<Record<ListenerType, ListenerGenerator>> = {
  Button: (v, m) => `    ${v}.addActionListener(e -> ${m}());`,
  TextField: (v, m) => `    ${v}.addActionListener(e -> ${m}());`,
  PasswordField: (v, m) => `    ${v}.addActionListener(e -> ${m}());`,
  TextArea: (v, m) =>
    [
      `    ${v}.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {`,
      `      public void insertUpdate(javax.swing.event.DocumentEvent e) { ${m}(); }`,
      `      public void removeUpdate(javax.swing.event.DocumentEvent e) { ${m}(); }`,
      `      public void changedUpdate(javax.swing.event.DocumentEvent e) { ${m}(); }`,
      "    });",
    ].join("\n"),
  CheckBox: (v, m) => `    ${v}.addItemListener(e -> ${m}());`,
  RadioButton: (v, m) => `    ${v}.addActionListener(e -> ${m}());`,
  ComboBox: (v, m) => `    ${v}.addActionListener(e -> ${m}());`,
  List: (v, m) =>
    `    ${v}.addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) ${m}(); });`,
  Slider: (v, m) => `    ${v}.addChangeListener(e -> ${m}());`,
  Spinner: (v, m) => `    ${v}.addChangeListener(e -> ${m}());`,
};

/**
 * Creates listener registration code for the specified listener type.
 * Factory function that replaces the switch statement in getListenerCode.
 *
 * @param type - The listener type (component type that supports events)
 * @param variableName - The Java variable name for the component
 * @param methodName - The event handler method name to call
 * @returns The Java code for listener registration, or empty string if unsupported
 *
 * @example
 * ```typescript
 * const code = createListenerCode("Button", "submitButton", "handleSubmit");
 * // Returns: "    submitButton.addActionListener(e -> handleSubmit());"
 * ```
 */
export function createListenerCode(
  type: ListenerType,
  variableName: string,
  methodName: string,
): string {
  const generator = listenerGenerators[type];
  if (!generator) {
    return "";
  }
  return generator(variableName, methodName);
}

/**
 * Checks if a listener type is supported by this factory.
 * @param type - The type to check
 * @returns true if the type has a listener generator
 */
export function isListenerTypeSupported(type: string): type is ListenerType {
  return type in listenerGenerators;
}

/**
 * Returns all supported listener types.
 * @returns Array of supported types
 */
export function getSupportedListenerTypes(): ListenerType[] {
  return Object.keys(listenerGenerators) as ListenerType[];
}
