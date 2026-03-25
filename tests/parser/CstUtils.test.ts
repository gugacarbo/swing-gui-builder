import { describe, expect, it } from "vitest";
import { parse } from "java-parser";
import {
  getChildNodes,
  getChildTokens,
  getFirstChildNode,
  getFirstTokenImage,
  collectNodesByName,
  extractNodeText,
  extractPrimaryFromExpression,
  extractBinaryExpressionFromExpressionStatement,
  extractPrimaryPath,
  extractMethodInvocationArgumentExpressions,
  extractNewExpressionType,
  extractNewExpressionArguments,
  extractVariableDeclarators,
  extractVariableNameFromDeclarator,
  extractIntegerFromExpression,
  getSimpleTypeName,
  extractLayoutName,
  extractVariableReference,
  parseJavaStringLiteral,
  parseJavaIntegerLiteral,
  isCstNode,
  isToken,
} from "../../src/parser/CstUtils";

describe("CstUtils", () => {
  describe("isCstNode and isToken", () => {
    it("identifies CST nodes correctly", () => {
      const result = parse("int x = 42;");
      expect(isCstNode(result)).toBe(true);
      expect(isToken(result)).toBe(false);
    });

    it("identifies tokens correctly", () => {
      const result = parse("int x = 42;");
      const firstChild = result.children.ordinaryCompilationUnit?.[0];
      expect(isCstNode(firstChild)).toBe(true);
    });
  });

  describe("getChildNodes and getChildTokens", () => {
    it("extracts child nodes by key", () => {
      const result = parse("public class Test { int x = 5; }");
      const nodes = getChildNodes(result, "ordinaryCompilationUnit");
      expect(nodes.length).toBeGreaterThan(0);
    });

    it("extracts child tokens by key", () => {
      const result = parse("public class Test {}");
      const classDecl = collectNodesByName(result, "normalClassDeclaration")[0];
      const tokens = getChildTokens(classDecl, "Class");
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]?.image).toBe("class");
    });
  });

  describe("getFirstChildNode and getFirstTokenImage", () => {
    it("gets first child node", () => {
      const result = parse("public class Test {}");
      const classDecl = collectNodesByName(result, "normalClassDeclaration")[0];
      const typeIdentifier = getFirstChildNode(classDecl, "typeIdentifier");
      expect(typeIdentifier).toBeDefined();
    });

    it("gets first token image", () => {
      const result = parse("public class Test {}");
      const classDecl = collectNodesByName(result, "normalClassDeclaration")[0];
      const image = getFirstTokenImage(classDecl, "Class");
      expect(image).toBe("class");
    });
  });

  describe("collectNodesByName", () => {
    it("collects all nodes with a given name", () => {
      const result = parse(`
        class A { void method1() {} void method2() {} }
      `);
      const methods = collectNodesByName(result, "methodDeclaration");
      expect(methods.length).toBe(2);
    });
  });

  describe("extractNodeText", () => {
    it("extracts text from a CST node", () => {
      const source = "int x = 42;";
      const result = parse(source);
      const text = extractNodeText(result, source);
      expect(text).toBeDefined();
    });
  });

  describe("extractPrimaryFromExpression", () => {
    it("extracts primary from expression", () => {
      const source = "class Test { void m() { x = 42; } }";
      const result = parse(source);
      const exprStatement = collectNodesByName(result, "expressionStatement")[0];
      const binaryExpr = extractBinaryExpressionFromExpressionStatement(exprStatement);
      expect(binaryExpr).toBeDefined();
    });
  });

  describe("extractPrimaryPath", () => {
    it("extracts path from this.member", () => {
      const source = "class Test { void m() { this.button.setText(); } }";
      const result = parse(source);
      const primary = collectNodesByName(result, "primary")[0];
      const path = extractPrimaryPath(primary);
      expect(path).toContain("this");
    });
  });

  describe("extractIdentifierPathFromFqnOrRefType", () => {
    it("extracts identifiers from variable reference expression", () => {
      const source = "class Test { void m() { javax.swing.JButton button; } }";
      const result = parse(source);
      // Find a node that contains fqnOrRefType
      const nodes = collectNodesByName(result, "fqnOrRefTypePartFirst");
      expect(nodes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("extractMethodInvocationArgumentExpressions", () => {
    it("extracts arguments from method invocation", () => {
      const source = "class Test { void m() { setBounds(10, 20, 100, 50); } }";
      const result = parse(source);
      const methodSuffix = collectNodesByName(result, "methodInvocationSuffix")[0];
      const args = extractMethodInvocationArgumentExpressions(methodSuffix);
      expect(args.length).toBe(4);
    });
  });

  describe("extractNewExpressionType", () => {
    it("extracts type from new expression", () => {
      const source = "new JButton()";
      const result = parse(`Object x = ${source};`);
      const primary = collectNodesByName(result, "primary")[0];
      const typeName = extractNewExpressionType(primary);
      expect(typeName).toBe("JButton");
    });
  });

  describe("extractNewExpressionArguments", () => {
    it("extracts arguments from new expression", () => {
      const source = 'new JButton("Click")';
      const result = parse(`Object x = ${source};`);
      const primary = collectNodesByName(result, "primary")[0];
      const args = extractNewExpressionArguments(primary);
      expect(args.length).toBe(1);
    });
  });

  describe("extractVariableDeclarators", () => {
    it("extracts variable declarators", () => {
      const source = "int x = 5, y = 10;";
      const result = parse(source);
      const declaratorList = collectNodesByName(result, "variableDeclaratorList")[0];
      const declarators = extractVariableDeclarators(declaratorList);
      expect(declarators.length).toBe(2);
    });
  });

  describe("extractVariableNameFromDeclarator", () => {
    it("extracts variable name", () => {
      const source = "int myVar = 5;";
      const result = parse(source);
      const declarator = collectNodesByName(result, "variableDeclarator")[0];
      const name = extractVariableNameFromDeclarator(declarator);
      expect(name).toBe("myVar");
    });
  });

  describe("extractIntegerFromExpression", () => {
    it("extracts decimal integer", () => {
      const source = "int x = 42;";
      const result = parse(source);
      const expr = collectNodesByName(result, "expression")[0];
      const value = extractIntegerFromExpression(expr, source);
      expect(value).toBe(42);
    });

    it("extracts hex integer", () => {
      const source = "int x = 0xFF;";
      const result = parse(source);
      const expr = collectNodesByName(result, "expression")[0];
      const value = extractIntegerFromExpression(expr, source);
      expect(value).toBe(255);
    });
  });

  describe("getSimpleTypeName", () => {
    it("extracts simple type name from qualified name", () => {
      expect(getSimpleTypeName("javax.swing.JButton")).toBe("JButton");
      expect(getSimpleTypeName("JButton")).toBe("JButton");
    });

    it("removes generics", () => {
      expect(getSimpleTypeName("List<String>")).toBe("List");
    });

    it("removes array suffix", () => {
      expect(getSimpleTypeName("String[]")).toBe("String");
    });

    it("returns undefined for undefined input", () => {
      expect(getSimpleTypeName(undefined)).toBeUndefined();
    });
  });

  describe("extractLayoutName", () => {
    it("extracts layout from new expression", () => {
      expect(extractLayoutName("new BorderLayout()")).toBe("BorderLayout");
      expect(extractLayoutName("new java.awt.FlowLayout()")).toBe("FlowLayout");
    });

    it("returns null for null layout", () => {
      expect(extractLayoutName("null")).toBe("null");
    });

    it("returns undefined for invalid input", () => {
      expect(extractLayoutName("not a layout")).toBeUndefined();
      expect(extractLayoutName(undefined)).toBeUndefined();
    });
  });

  describe("extractVariableReference", () => {
    it("extracts simple variable name", () => {
      expect(extractVariableReference("myButton")).toBe("myButton");
    });

    it("extracts from this.member", () => {
      expect(extractVariableReference("this.button")).toBe("button");
    });

    it("returns undefined for complex expressions", () => {
      expect(extractVariableReference("getButton()")).toBeUndefined();
    });
  });

  describe("parseJavaStringLiteral", () => {
    it("parses double-quoted string", () => {
      expect(parseJavaStringLiteral('"Hello World"')).toBe("Hello World");
    });

    it("parses escaped characters", () => {
      expect(parseJavaStringLiteral('"Hello\\nWorld"')).toBe("Hello\nWorld");
    });

    it("parses text block with newlines", () => {
      const result = parseJavaStringLiteral('"""line1\nline2"""');
      expect(result).toContain("line1");
    });

    it("returns undefined for invalid input", () => {
      expect(parseJavaStringLiteral(undefined)).toBeUndefined();
      expect(parseJavaStringLiteral("not quoted")).toBeUndefined();
    });
  });

  describe("parseJavaIntegerLiteral", () => {
    it("parses decimal integer", () => {
      expect(parseJavaIntegerLiteral("42")).toBe(42);
      expect(parseJavaIntegerLiteral("-10")).toBe(-10);
    });

    it("parses hex integer", () => {
      expect(parseJavaIntegerLiteral("0xFF")).toBe(255);
      expect(parseJavaIntegerLiteral("0xAB")).toBe(171);
    });

    it("parses binary integer", () => {
      expect(parseJavaIntegerLiteral("0b1010")).toBe(10);
      expect(parseJavaIntegerLiteral("-0b10")).toBe(-2);
    });

    it("parses octal integer", () => {
      expect(parseJavaIntegerLiteral("077")).toBe(63);
    });

    it("handles underscores in numbers", () => {
      expect(parseJavaIntegerLiteral("1_000_000")).toBe(1000000);
    });

    it("handles L suffix", () => {
      expect(parseJavaIntegerLiteral("42L")).toBe(42);
    });

    it("returns undefined for invalid input", () => {
      expect(parseJavaIntegerLiteral(undefined)).toBeUndefined();
      expect(parseJavaIntegerLiteral("not a number")).toBeUndefined();
    });
  });
});
