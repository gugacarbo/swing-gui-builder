import * as path from "node:path";
import type { JavaProjectStructure } from "./JavaProjectDetector";

export const DEFAULT_OUTPUT_DIRECTORY = "swing/components/";

export function resolveOutputDirectory(
  configuredDir: string,
  projectStructure?: JavaProjectStructure,
): string {
  return configuredDir !== DEFAULT_OUTPUT_DIRECTORY
    ? configuredDir
    : (projectStructure?.suggestedOutputFolder ?? configuredDir);
}

export function inferJavaPackage(
  outputDir: string,
  projectStructure?: JavaProjectStructure,
): string | undefined {
  if (!projectStructure) {
    return undefined;
  }

  const normalizedSourceRoot = projectStructure.sourceRoot.replace(/[/\\]/g, path.sep);
  const normalizedOutputDir = outputDir.replace(/[/\\]/g, path.sep);
  const relativePath = path.relative(normalizedSourceRoot, normalizedOutputDir);

  if (relativePath && !relativePath.startsWith("..") && relativePath !== "") {
    return relativePath.replace(/[/\\]/g, ".");
  }

  return undefined;
}
