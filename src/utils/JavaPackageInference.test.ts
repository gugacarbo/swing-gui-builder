import { describe, expect, it } from "vitest";
import {
  DEFAULT_OUTPUT_DIRECTORY,
  inferJavaPackage,
  resolveOutputDirectory,
} from "./JavaPackageInference";
import type { JavaProjectStructure } from "./JavaProjectDetector";

const mavenProject: JavaProjectStructure = {
  type: "maven-gradle",
  sourceRoot: "src/main/java",
  suggestedOutputFolder: "src/main/java/components",
};

describe("JavaPackageInference", () => {
  it("keeps configured output directory when it is not default", () => {
    expect(resolveOutputDirectory("src/main/java/custom", mavenProject)).toBe(
      "src/main/java/custom",
    );
  });

  it("uses detected project output when configured directory is default", () => {
    expect(resolveOutputDirectory(DEFAULT_OUTPUT_DIRECTORY, mavenProject)).toBe(
      "src/main/java/components",
    );
  });

  it("infers package from output directory under source root", () => {
    expect(inferJavaPackage("src/main/java/com/example/app", mavenProject)).toBe("com.example.app");
  });

  it("does not infer package when output directory equals source root", () => {
    expect(inferJavaPackage("src/main/java", mavenProject)).toBeUndefined();
  });

  it("does not infer package when output directory is outside source root", () => {
    expect(inferJavaPackage("resources/generated", mavenProject)).toBeUndefined();
  });
});
