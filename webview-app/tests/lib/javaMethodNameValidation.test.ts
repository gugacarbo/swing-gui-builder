import { describe, expect, it } from "vitest";

const JAVA_RESERVED_WORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "true",
  "false",
  "null",
]);

function isValidJavaMethodName(name: string): boolean {
  if (!name || name.length === 0) return false;
  const firstChar = name[0];
  if (
    !(
      (firstChar >= "a" && firstChar <= "z") ||
      (firstChar >= "A" && firstChar <= "Z") ||
      firstChar === "_" ||
      firstChar === "$"
    )
  ) {
    return false;
  }
  for (let i = 1; i < name.length; i++) {
    const c = name[i];
    if (
      !(
        (c >= "a" && c <= "z") ||
        (c >= "A" && c <= "Z") ||
        (c >= "0" && c <= "9") ||
        c === "_" ||
        c === "$"
      )
    ) {
      return false;
    }
  }
  if (JAVA_RESERVED_WORDS.has(name)) {
    return false;
  }
  return true;
}

describe("isValidJavaMethodName", () => {
  it("returns true for valid method names", () => {
    expect(isValidJavaMethodName("handleClick")).toBe(true);
    expect(isValidJavaMethodName("onAction")).toBe(true);
    expect(isValidJavaMethodName("processData")).toBe(true);
    expect(isValidJavaMethodName("_privateMethod")).toBe(true);
    expect(isValidJavaMethodName("$specialMethod")).toBe(true);
    expect(isValidJavaMethodName("a")).toBe(true);
    expect(isValidJavaMethodName("Z")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isValidJavaMethodName("")).toBe(false);
  });

  it("returns false for names starting with a digit", () => {
    expect(isValidJavaMethodName("1method")).toBe(false);
    expect(isValidJavaMethodName("0")).toBe(false);
  });

  it("returns false for names with invalid characters", () => {
    expect(isValidJavaMethodName("my-method")).toBe(false);
    expect(isValidJavaMethodName("my method")).toBe(false);
    expect(isValidJavaMethodName("my.method")).toBe(false);
    expect(isValidJavaMethodName("my+method")).toBe(false);
  });

  it("returns false for Java reserved words", () => {
    expect(isValidJavaMethodName("class")).toBe(false);
    expect(isValidJavaMethodName("int")).toBe(false);
    expect(isValidJavaMethodName("void")).toBe(false);
    expect(isValidJavaMethodName("return")).toBe(false);
    expect(isValidJavaMethodName("if")).toBe(false);
    expect(isValidJavaMethodName("else")).toBe(false);
    expect(isValidJavaMethodName("true")).toBe(false);
    expect(isValidJavaMethodName("false")).toBe(false);
    expect(isValidJavaMethodName("null")).toBe(false);
  });

  it("returns true for names with digits in the middle", () => {
    expect(isValidJavaMethodName("handle2Click")).toBe(true);
    expect(isValidJavaMethodName("method1")).toBe(true);
  });

  it("returns true for names with underscores and dollar signs", () => {
    expect(isValidJavaMethodName("my_method")).toBe(true);
    expect(isValidJavaMethodName("my$method")).toBe(true);
    expect(isValidJavaMethodName("__private__")).toBe(true);
  });
});
