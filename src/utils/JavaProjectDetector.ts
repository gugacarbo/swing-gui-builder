import * as fs from "node:fs";
import * as path from "node:path";

export interface JavaProjectStructure {
  type: "maven-gradle" | "plain-src";
  sourceRoot: string;
  suggestedOutputFolder: string;
}

const MAVEN_GRADLE_SOURCE_ROOT = path.join("src", "main", "java");

const MAVEN_GRADLE_BUILD_FILES = ["pom.xml", "build.gradle", "build.gradle.kts"];

export function detectJavaProject(workspaceRoot: string): JavaProjectStructure | undefined {
  if (isMavenGradleProject(workspaceRoot)) {
    return {
      type: "maven-gradle",
      sourceRoot: MAVEN_GRADLE_SOURCE_ROOT,
      suggestedOutputFolder: path.join(MAVEN_GRADLE_SOURCE_ROOT, "components"),
    };
  }

  if (hasPlainSrcFolder(workspaceRoot)) {
    return {
      type: "plain-src",
      sourceRoot: "src",
      suggestedOutputFolder: path.join("src", "components"),
    };
  }

  return undefined;
}

function isMavenGradleProject(workspaceRoot: string): boolean {
  const sourceDir = path.join(workspaceRoot, MAVEN_GRADLE_SOURCE_ROOT);
  if (!fs.existsSync(sourceDir)) {
    return false;
  }

  return MAVEN_GRADLE_BUILD_FILES.some((file) => fs.existsSync(path.join(workspaceRoot, file)));
}

function hasPlainSrcFolder(workspaceRoot: string): boolean {
  const srcDir = path.join(workspaceRoot, "src");
  return fs.existsSync(srcDir);
}
