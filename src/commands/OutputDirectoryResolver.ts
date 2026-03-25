import * as path from "node:path";
import type * as vscode from "vscode";
import type { JavaProjectStructure } from "../utils/JavaProjectDetector";

/** Default output directory when no configuration is set */
export const DEFAULT_OUTPUT_DIRECTORY = "swing/components/";

/**
 * Configuration needed to resolve the output directory
 */
export interface OutputDirectoryConfig {
  /** Configured output directory from settings */
  configuredDir: string;
  /** Detected Java project structure (optional) */
  projectStructure?: JavaProjectStructure;
  /** Default output directory constant */
  defaultDir: string;
}

/**
 * Result of resolving the output directory
 */
export interface ResolvedOutputDirectory {
  /** Relative output directory path */
  outputDir: string;
  /** Whether the user cancelled the operation */
  cancelled: false;
}

/**
 * Result when user cancels the operation
 */
export interface CancelledResult {
  cancelled: true;
}

export type OutputDirectoryResult = ResolvedOutputDirectory | CancelledResult;

/**
 * Dependencies for VS Code UI interactions
 */
export interface VSCodeUIInteractions {
  showInputBox: (options: { prompt: string; value: string }) => Thenable<string | undefined>;
  showOpenDialog: (options: {
    canSelectFolders: boolean;
    canSelectFiles: boolean;
    canSelectMany: boolean;
    openLabel: string;
    defaultUri?: vscode.Uri;
  }) => Thenable<readonly { fsPath: string }[] | undefined>;
}

/**
 * Context for resolving output directory
 */
export interface OutputDirectoryContext {
  /** Path to workspace root */
  workspaceRoot: string;
  /** URI object for workspace root (VS Code Uri compatible) */
  workspaceUri: vscode.Uri;
  /** UI interaction functions */
  ui: VSCodeUIInteractions;
}

/**
 * Calculates the default output directory based on configuration and project structure.
 * Pure function - no side effects.
 */
export function calculateDefaultOutputDirectory(config: OutputDirectoryConfig): string {
  return config.configuredDir !== config.defaultDir
    ? config.configuredDir
    : (config.projectStructure?.suggestedOutputFolder ?? config.configuredDir);
}

/**
 * Determines if folder picker should be shown instead of input box.
 * Pure function - no side effects.
 */
export function shouldShowFolderPicker(
  projectStructure: JavaProjectStructure | undefined,
  configuredDir: string,
  defaultDir: string,
): boolean {
  return !projectStructure && configuredDir === defaultDir;
}

/**
 * Resolves relative path from workspace root to selected path.
 * Pure function - no side effects.
 */
export function resolveRelativePath(workspaceRoot: string, selectedPath: string): string {
  return path.relative(workspaceRoot, selectedPath);
}

/**
 * Handles the folder picker flow for selecting output directory.
 */
async function handleFolderPicker(ctx: OutputDirectoryContext): Promise<string | undefined> {
  const pickerResult = await ctx.ui.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: "Select output folder for Java files",
    defaultUri: ctx.workspaceUri,
  });

  if (!pickerResult || pickerResult.length === 0) {
    return undefined;
  }

  return resolveRelativePath(ctx.workspaceRoot, pickerResult[0].fsPath);
}

/**
 * Handles the input box flow for entering output directory.
 */
async function handleInputBox(
  ctx: OutputDirectoryContext,
  defaultDir: string,
): Promise<string | undefined> {
  return ctx.ui.showInputBox({
    prompt: "Output directory for generated Java files (relative to workspace)",
    value: defaultDir,
  });
}

/**
 * Main function to resolve the output directory.
 * Orchestrates the UI flow and returns the resolved path.
 */
export async function resolveOutputDirectoryWithUI(
  config: OutputDirectoryConfig,
  ctx: OutputDirectoryContext,
): Promise<OutputDirectoryResult> {
  const defaultDir = calculateDefaultOutputDirectory(config);
  const useFolderPicker = shouldShowFolderPicker(
    config.projectStructure,
    config.configuredDir,
    config.defaultDir,
  );

  let outputDir: string | undefined;

  if (useFolderPicker) {
    outputDir = await handleFolderPicker(ctx);
  } else {
    outputDir = await handleInputBox(ctx, defaultDir);
  }

  if (!outputDir) {
    return { cancelled: true };
  }

  return { outputDir, cancelled: false };
}
