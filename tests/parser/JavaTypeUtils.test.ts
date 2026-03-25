import { describe, expect, it } from "vitest";
import { parse } from "java-parser";
import { collectNodesByName } from "../../src/parser/CstUtils";
import {
  extractTypeNameFromUnannType,
  extractTypeNameFromLocalVariableDeclaration,
  isGuiType,
  isGuiRootType,
  getSimpleTypeName,
} from "../../src/parser/JavaTypeUtils";

describe("JavaTypeUtils", () => {
  describe("getSimpleTypeName", () => {
    it("extracts simple type name from qualified name", () => {
      expect(getSimpleTypeName("javax.swing.JButton")).toBe("JButton");
      expect(getSimpleTypeName("java.awt.BorderLayout")).toBe("BorderLayout");
      expect(getSimpleTypeName("JButton")).toBe("JButton");
    });

    it("removes generics", () => {
      expect(getSimpleTypeName("List<String>")).toBe("List");
      expect(getSimpleTypeName("Map<String, Integer>")).toBe("Map");
    });

    it("removes array suffix", () => {
      expect(getSimpleTypeName("String[]")).toBe("String");
      expect(getSimpleTypeName("int[]")).toBe("int");
    });

    it("handles qualified names with generics and arrays", () => {
      expect(getSimpleTypeName("java.util.List<String>[]")).toBe("List");
    });

    it("returns undefined for undefined input", () => {
      expect(getSimpleTypeName(undefined)).toBeUndefined();
    });
  });

  describe("isGuiType", () => {
    it("returns true for Swing components", () => {
      expect(isGuiType("JButton")).toBe(true);
      expect(isGuiType("JPanel")).toBe(true);
      expect(isGuiType("JFrame")).toBe(true);
      expect(isGuiType("JLabel")).toBe(true);
      expect(isGuiType("JTextField")).toBe(true);
    });

    it("returns true for AWT components", () => {
      expect(isGuiType("Button")).toBe(true);
      expect(isGuiType("Panel")).toBe(true);
      expect(isGuiType("Frame")).toBe(true);
      expect(isGuiType("Label")).toBe(true);
    });

    it("handles qualified names", () => {
      expect(isGuiType("javax.swing.JButton")).toBe(true);
      expect(isGuiType("java.awt.Button")).toBe(true);
    });

    it("returns false for non-GUI types", () => {
      expect(isGuiType("String")).toBe(false);
      expect(isGuiType("Integer")).toBe(false);
      expect(isGuiType("Object")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isGuiType(undefined)).toBe(false);
    });
  });

  describe("isGuiRootType", () => {
    it("returns true for GUI root types", () => {
      expect(isGuiRootType("JFrame")).toBe(true);
      expect(isGuiRootType("JPanel")).toBe(true);
      expect(isGuiRootType("JDialog")).toBe(true);
      expect(isGuiRootType("Frame")).toBe(true);
      expect(isGuiRootType("Panel")).toBe(true);
    });

    it("returns false for non-root GUI types", () => {
      expect(isGuiRootType("JButton")).toBe(false);
      expect(isGuiRootType("JLabel")).toBe(false);
      expect(isGuiRootType("JTextField")).toBe(false);
    });

    it("returns false for non-GUI types", () => {
      expect(isGuiRootType("String")).toBe(false);
      expect(isGuiRootType("Object")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isGuiRootType(undefined)).toBe(false);
    });
  });

  describe("extractTypeNameFromUnannType", () => {
    it("extracts class type name", () => {
      const source = "class Test { JButton button; }";
      const result = parse(source);
      const unannType = collectNodesByName(result, "unannType")[0];
      const typeName = extractTypeNameFromUnannType(unannType);
      expect(typeName).toBe("JButton");
    });

    it("extracts qualified class type name", () => {
      const source = "class Test { javax.swing.JButton button; }";
      const result = parse(source);
      const unannType = collectNodesByName(result, "unannType")[0];
      const typeName = extractTypeNameFromUnannType(unannType);
      expect(typeName).toBe("javax.swing.JButton");
    });

    it("extracts primitive type name", () => {
      const source = "class Test { int value; }";
      const result = parse(source);
      const unannType = collectNodesByName(result, "unannType")[0];
      const typeName = extractTypeNameFromUnannType(unannType);
      expect(typeName).toBe("int");
    });

    it("extracts boolean type", () => {
      const source = "class Test { boolean flag; }";
      const result = parse(source);
      const unannType = collectNodesByName(result, "unannType")[0];
      const typeName = extractTypeNameFromUnannType(unannType);
      expect(typeName).toBe("boolean");
    });

    it("returns undefined for undefined input", () => {
      expect(extractTypeNameFromUnannType(undefined)).toBeUndefined();
    });
  });

  describe("extractTypeNameFromLocalVariableDeclaration", () => {
    it("extracts type from local variable declaration", () => {
      const source = "class Test { void m() { JButton myButton = new JButton(); } }";
      const result = parse(source);
      const localVarDecl = collectNodesByName(result, "localVariableDeclaration")[0];
      const typeName = extractTypeNameFromLocalVariableDeclaration(localVarDecl);
      expect(typeName).toBe("JButton");
    });

    it("extracts primitive type from local variable declaration", () => {
      const source = "class Test { void m() { int count = 0; } }";
      const result = parse(source);
      const localVarDecl = collectNodesByName(result, "localVariableDeclaration")[0];
      const typeName = extractTypeNameFromLocalVariableDeclaration(localVarDecl);
      expect(typeName).toBe("int");
    });

    it("returns undefined for undefined input", () => {
      expect(extractTypeNameFromLocalVariableDeclaration(undefined)).toBeUndefined();
    });
  });
});
