import type { CstNode } from "java-parser";
import { getChildTokens, getFirstChildNode } from "./CstUtils";

// ============================================================================
// GUI Type Constants
// ============================================================================

const GUI_TYPES = new Set([
  "JFrame",
  "JPanel",
  "JButton",
  "JLabel",
  "JTextField",
  "JPasswordField",
  "JTextArea",
  "JCheckBox",
  "JRadioButton",
  "JComboBox",
  "JList",
  "JProgressBar",
  "JSlider",
  "JSpinner",
  "JSeparator",
  "JMenuBar",
  "JMenu",
  "JMenuItem",
  "JToolBar",
  "JScrollPane",
  "JTabbedPane",
  "JDialog",
  "JWindow",
  "Frame",
  "Panel",
  "Button",
  "Label",
  "TextField",
  "TextArea",
  "Checkbox",
  "Choice",
  "List",
]);

const GUI_ROOT_TYPES = new Set([
  "JFrame",
  "JPanel",
  "JDialog",
  "JWindow",
  "Frame",
  "Panel",
  "Applet",
]);

// ============================================================================
// Re-export from CstUtils for convenience
// ============================================================================

export { getSimpleTypeName } from "./CstUtils";

// ============================================================================
// Type Name Utilities
// ============================================================================

export function isGuiType(typeName: string | undefined): boolean {
  const simpleTypeName = getSimpleTypeNameLocal(typeName);
  return Boolean(simpleTypeName && GUI_TYPES.has(simpleTypeName));
}

export function isGuiRootType(typeName: string | undefined): boolean {
  const simpleTypeName = getSimpleTypeNameLocal(typeName);
  return Boolean(simpleTypeName && GUI_ROOT_TYPES.has(simpleTypeName));
}

// Local version to avoid circular import issues
function getSimpleTypeNameLocal(typeName: string | undefined): string | undefined {
  if (!typeName) {
    return undefined;
  }

  const withoutGenerics = typeName.replace(/<.*>/g, "");
  const withoutArray = withoutGenerics.replace(/\[\]$/g, "");
  const parts = withoutArray.split(".");
  return parts[parts.length - 1];
}

// ============================================================================
// Primitive Type Extraction
// ============================================================================

function extractPrimitiveTypeName(unannType: CstNode): string | undefined {
  const primitiveWithDims = getFirstChildNode(
    unannType,
    "unannPrimitiveTypeWithOptionalDimsSuffix",
  );
  const primitiveType = getFirstChildNode(primitiveWithDims, "unannPrimitiveType");

  const primitiveTokenMapping: Array<{ tokenName: string; value: string }> = [
    { tokenName: "Boolean", value: "boolean" },
    { tokenName: "Byte", value: "byte" },
    { tokenName: "Short", value: "short" },
    { tokenName: "Int", value: "int" },
    { tokenName: "Long", value: "long" },
    { tokenName: "Char", value: "char" },
    { tokenName: "Float", value: "float" },
    { tokenName: "Double", value: "double" },
  ];

  for (const token of primitiveTokenMapping) {
    if (getChildTokens(primitiveType, token.tokenName).length > 0) {
      return token.value;
    }
  }

  const numericType = getFirstChildNode(primitiveType, "numericType");
  const integralType = getFirstChildNode(numericType, "integralType");
  const floatingType = getFirstChildNode(numericType, "floatingPointType");

  for (const token of primitiveTokenMapping) {
    if (
      getChildTokens(integralType, token.tokenName).length > 0 ||
      getChildTokens(floatingType, token.tokenName).length > 0
    ) {
      return token.value;
    }
  }

  return undefined;
}

// ============================================================================
// Type Name Extraction from CST
// ============================================================================

export function extractTypeNameFromUnannType(unannType: CstNode | undefined): string | undefined {
  if (!unannType) {
    return undefined;
  }

  const unannReferenceType = getFirstChildNode(unannType, "unannReferenceType");
  const unannClassOrInterfaceType = getFirstChildNode(
    unannReferenceType,
    "unannClassOrInterfaceType",
  );
  const unannClassType = getFirstChildNode(unannClassOrInterfaceType, "unannClassType");

  const identifiers = getChildTokens(unannClassType, "Identifier").map((token) => token.image);
  if (identifiers.length > 0) {
    return identifiers.join(".");
  }

  return extractPrimitiveTypeName(unannType);
}

export function extractTypeNameFromLocalVariableDeclaration(
  localVariableDeclaration: CstNode | undefined,
): string | undefined {
  const localVariableType = getFirstChildNode(localVariableDeclaration, "localVariableType");
  const unannType = getFirstChildNode(localVariableType, "unannType");
  return extractTypeNameFromUnannType(unannType);
}
