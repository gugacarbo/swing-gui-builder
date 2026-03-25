import type { CstElement, CstNode, IToken } from "java-parser";

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasName(value: unknown): value is { name: unknown } {
  return isObject(value) && "name" in value;
}

function hasChildren(value: unknown): value is { children: unknown } {
  return isObject(value) && "children" in value;
}

function hasImage(value: unknown): value is { image: unknown } {
  return isObject(value) && "image" in value;
}

export function isCstNode(element: unknown): element is CstNode {
  return hasName(element) && hasChildren(element) && typeof element.name === "string";
}

export function isToken(element: unknown): element is IToken {
  return hasImage(element) && typeof element.image === "string";
}

function getChildrenDictionary(
  node: CstNode | undefined,
): Record<string, CstElement[] | undefined> | undefined {
  if (!node) {
    return undefined;
  }

  return node.children as Record<string, CstElement[] | undefined>;
}

function getChildElements(node: CstNode | undefined, key: string): CstElement[] {
  return getChildrenDictionary(node)?.[key] ?? [];
}

export function getChildNodes(node: CstNode | undefined, key: string): CstNode[] {
  const childNodes: CstNode[] = [];
  for (const element of getChildElements(node, key)) {
    if (isCstNode(element)) {
      childNodes.push(element as CstNode);
    }
  }
  return childNodes;
}

export function getFirstChildNode(node: CstNode | undefined, key: string): CstNode | undefined {
  return getChildNodes(node, key)[0];
}

export function getChildTokens(node: CstNode | undefined, key: string): IToken[] {
  return getChildElements(node, key).filter(isToken);
}

export function getFirstTokenImage(node: CstNode | undefined, key: string): string | undefined {
  return getChildTokens(node, key)[0]?.image;
}

export function collectNodesByName(root: CstNode, nodeName: string): CstNode[] {
  const matches: CstNode[] = [];
  const stack: CstNode[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.name === nodeName) {
      matches.push(current);
    }

    const childrenDictionary = getChildrenDictionary(current);
    if (!childrenDictionary) {
      continue;
    }

    for (const children of Object.values(childrenDictionary)) {
      if (!children) {
        continue;
      }

      for (const child of children) {
        if (isCstNode(child)) {
          stack.push(child);
        }
      }
    }
  }

  return matches.sort((left, right) => left.location.startOffset - right.location.startOffset);
}

export function extractIntegerFromExpression(
  expression: CstNode | undefined,
  source: string,
): number | undefined {
  const primary = extractPrimaryFromExpression(expression);
  const primaryPrefix = getFirstChildNode(primary, "primaryPrefix");
  const literal = getFirstChildNode(primaryPrefix, "literal");
  const integerLiteral = getFirstChildNode(literal, "integerLiteral");

  const rawLiteral =
    getFirstTokenImage(integerLiteral, "DecimalLiteral") ??
    getFirstTokenImage(integerLiteral, "HexLiteral") ??
    getFirstTokenImage(integerLiteral, "OctalLiteral") ??
    getFirstTokenImage(integerLiteral, "BinaryLiteral");

  if (rawLiteral) {
    return parseJavaIntegerLiteral(rawLiteral);
  }

  return parseJavaIntegerLiteral(extractNodeText(expression, source));
}

export function extractIdentifierPathFromFqnOrRefType(fqnOrRefType: CstNode | undefined): string[] {
  if (!fqnOrRefType) {
    return [];
  }

  const identifiers: string[] = [];

  const firstPart = getFirstChildNode(fqnOrRefType, "fqnOrRefTypePartFirst");
  const firstCommon = getFirstChildNode(firstPart, "fqnOrRefTypePartCommon");
  const firstIdentifier = getFirstTokenImage(firstCommon, "Identifier");
  if (firstIdentifier) {
    identifiers.push(firstIdentifier);
  }

  for (const restPart of getChildNodes(fqnOrRefType, "fqnOrRefTypePartRest")) {
    const common = getFirstChildNode(restPart, "fqnOrRefTypePartCommon");
    const identifier = getFirstTokenImage(common, "Identifier");
    if (identifier) {
      identifiers.push(identifier);
    }
  }

  return identifiers;
}

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

export function extractVariableDeclarators(variableDeclaratorList: CstNode | undefined): CstNode[] {
  return getChildNodes(variableDeclaratorList, "variableDeclarator");
}

export function extractVariableNameFromDeclarator(
  variableDeclarator: CstNode | undefined,
): string | undefined {
  const variableDeclaratorId = getFirstChildNode(variableDeclarator, "variableDeclaratorId");
  return getFirstTokenImage(variableDeclaratorId, "Identifier");
}

export function getSimpleTypeName(typeName: string | undefined): string | undefined {
  if (!typeName) {
    return undefined;
  }

  const withoutGenerics = typeName.replace(/<.*>/g, "");
  const withoutArray = withoutGenerics.replace(/\[\]$/g, "");
  const parts = withoutArray.split(".");
  return parts[parts.length - 1];
}

export function isGuiType(typeName: string | undefined): boolean {
  const simpleTypeName = getSimpleTypeName(typeName);
  return Boolean(simpleTypeName && GUI_TYPES.has(simpleTypeName));
}

export function isGuiRootType(typeName: string | undefined): boolean {
  const simpleTypeName = getSimpleTypeName(typeName);
  return Boolean(simpleTypeName && GUI_ROOT_TYPES.has(simpleTypeName));
}

export function extractNodeText(node: CstNode | undefined, source: string): string | undefined {
  if (!node) {
    return undefined;
  }

  const { startOffset, endOffset } = node.location;
  if (startOffset < 0 || endOffset < startOffset) {
    return undefined;
  }

  return source.slice(startOffset, endOffset + 1).trim();
}

export function extractPrimaryFromExpression(expression: CstNode | undefined): CstNode | undefined {
  const conditionalExpression = getFirstChildNode(expression, "conditionalExpression");
  const binaryExpression = getFirstChildNode(conditionalExpression, "binaryExpression");
  const unaryExpression = getFirstChildNode(binaryExpression, "unaryExpression");
  return getFirstChildNode(unaryExpression, "primary");
}

export function extractBinaryExpressionFromExpressionStatement(
  expressionStatement: CstNode | undefined,
): CstNode | undefined {
  const statementExpression = getFirstChildNode(expressionStatement, "statementExpression");
  const expression = getFirstChildNode(statementExpression, "expression");
  const conditionalExpression = getFirstChildNode(expression, "conditionalExpression");
  return getFirstChildNode(conditionalExpression, "binaryExpression");
}

export function extractPrimaryPath(primary: CstNode | undefined): string[] {
  if (!primary) {
    return [];
  }

  const path: string[] = [];
  const primaryPrefix = getFirstChildNode(primary, "primaryPrefix");

  if (getChildTokens(primaryPrefix, "This").length > 0) {
    path.push("this");
  }

  const fqnOrRefType = getFirstChildNode(primaryPrefix, "fqnOrRefType");
  path.push(...extractIdentifierPathFromFqnOrRefType(fqnOrRefType));

  return path;
}

export function extractMethodInvocationArgumentExpressions(
  methodInvocationSuffix: CstNode | undefined,
): CstNode[] {
  const argumentList = getFirstChildNode(methodInvocationSuffix, "argumentList");
  return getChildNodes(argumentList, "expression");
}

export function parseJavaStringLiteral(rawValue: string | undefined): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed.startsWith('"""') && trimmed.endsWith('"""')) {
    return trimmed.slice(3, -3).trim();
  }

  return undefined;
}

export function parseJavaIntegerLiteral(rawValue: string | undefined): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const withoutCast = rawValue.trim().replace(/^\([^)]+\)\s*/, "");
  const cleaned = withoutCast.replace(/_/g, "").replace(/[lL]$/, "");

  if (/^[-+]?\d+$/.test(cleaned)) {
    return Number.parseInt(cleaned, 10);
  }

  if (/^[-+]?0x[0-9a-f]+$/i.test(cleaned)) {
    return Number.parseInt(cleaned, 16);
  }

  if (/^[-+]?0b[01]+$/i.test(cleaned)) {
    const sign = cleaned.startsWith("-") ? -1 : 1;
    const unsigned = cleaned.replace(/^[-+]?0b/i, "");
    return sign * Number.parseInt(unsigned, 2);
  }

  if (/^[-+]?0[0-7]+$/.test(cleaned) && cleaned.length > 1) {
    return Number.parseInt(cleaned, 8);
  }

  return undefined;
}

export function extractLayoutName(argumentText: string | undefined): string | undefined {
  if (!argumentText) {
    return undefined;
  }

  const trimmed = argumentText.trim();
  if (trimmed === "null") {
    return "null";
  }

  const newExpressionMatch = trimmed.match(/^new\s+([A-Za-z_$][\w$.]*)/);
  if (!newExpressionMatch) {
    return undefined;
  }

  return getSimpleTypeName(newExpressionMatch[1]);
}

export function extractVariableReference(rawExpression: string | undefined): string | undefined {
  if (!rawExpression) {
    return undefined;
  }

  const expression = rawExpression.trim();
  const directIdentifierMatch = expression.match(/^[A-Za-z_$][\w$]*$/);
  if (directIdentifierMatch) {
    return directIdentifierMatch[0];
  }

  const thisMemberMatch = expression.match(/^this\.([A-Za-z_$][\w$]*)$/);
  if (thisMemberMatch) {
    return thisMemberMatch[1];
  }

  return undefined;
}

export function extractNewExpressionType(primary: CstNode | undefined): string | undefined {
  const primaryPrefix = getFirstChildNode(primary, "primaryPrefix");
  const newExpression = getFirstChildNode(primaryPrefix, "newExpression");
  const classInstanceCreation = getFirstChildNode(
    newExpression,
    "unqualifiedClassInstanceCreationExpression",
  );
  const typeToInstantiate = getFirstChildNode(
    classInstanceCreation,
    "classOrInterfaceTypeToInstantiate",
  );
  const identifiers = getChildTokens(typeToInstantiate, "Identifier").map((token) => token.image);
  return identifiers.length > 0 ? identifiers.join(".") : undefined;
}

export function extractNewExpressionArguments(primary: CstNode | undefined): CstNode[] {
  const primaryPrefix = getFirstChildNode(primary, "primaryPrefix");
  const newExpression = getFirstChildNode(primaryPrefix, "newExpression");
  const classInstanceCreation = getFirstChildNode(
    newExpression,
    "unqualifiedClassInstanceCreationExpression",
  );
  const argumentList = getFirstChildNode(classInstanceCreation, "argumentList");
  return getChildNodes(argumentList, "expression");
}
