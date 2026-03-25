/**
 * @deprecated Import directly from CstUtils or JavaTypeUtils instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export types
export type { CstElement, CstNode, IToken } from "java-parser";
// Re-export all CST utilities
export {
  collectNodesByName,
  extractBinaryExpressionFromExpressionStatement,
  extractIdentifierPathFromFqnOrRefType,
  extractIntegerFromExpression,
  extractLayoutName,
  extractMethodInvocationArgumentExpressions,
  extractNewExpressionArguments,
  extractNewExpressionType,
  extractNodeText,
  extractPrimaryFromExpression,
  extractPrimaryPath,
  extractVariableDeclarators,
  extractVariableNameFromDeclarator,
  extractVariableReference,
  getChildNodes,
  getChildTokens,
  getFirstChildNode,
  getFirstTokenImage,
  getSimpleTypeName,
  isCstNode,
  isToken,
  parseJavaIntegerLiteral,
  parseJavaStringLiteral,
} from "./CstUtils";
// Re-export all Java type utilities
export {
  extractTypeNameFromLocalVariableDeclaration,
  extractTypeNameFromUnannType,
  isGuiRootType,
  isGuiType,
} from "./JavaTypeUtils";
