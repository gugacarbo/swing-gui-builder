import { readFile as readFileFromFs, writeFile as writeFileToFs } from "node:fs/promises";
import { HeuristicMergeStrategy } from "./HeuristicMergeStrategy";
import { MarkerMergeStrategy } from "./MarkerMergeStrategy";
import type { MergeStrategy } from "./MergeStrategy";

export type GuiRegionReason =
  | "swing-field"
  | "swing-instantiation"
  | "component-call"
  | "layout-call"
  | "frame-config";

export interface DetectedGuiRegion {
  startLine: number;
  endLine: number;
  reasons: GuiRegionReason[];
}

export interface MergeResult {
  success: boolean;
  mergedContent: string;
  hadMarkers: boolean;
  replacedSections: string[];
  preservedSections: string[];
  detectedGuiRegions: DetectedGuiRegion[];
  backupPath?: string;
  message?: string;
}

export interface FileSystemAdapter {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
}

export interface MergeFileOptions {
  createBackup?: boolean;
  backupExtension?: string;
  includeTimestampInBackupName?: boolean;
  now?: () => Date;
  fileSystem?: FileSystemAdapter;
  /** Optional custom merge strategy */
  strategy?: MergeStrategy;
}

export const DEFAULT_BACKUP_EXTENSION = ".bak";

const defaultFileSystem: FileSystemAdapter = {
  async readFile(filePath: string): Promise<string> {
    return readFileFromFs(filePath, "utf-8");
  },
  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFileToFs(filePath, content, "utf-8");
  },
};

/**
 * Default strategies used by the merger.
 * Marker strategy is preferred when markers are present.
 */
const defaultStrategies: MergeStrategy[] = [
  new MarkerMergeStrategy(),
  new HeuristicMergeStrategy(),
];

/**
 * Select the appropriate strategy for merging content.
 * Tries strategies in order until one can handle the content.
 */
function selectStrategy(
  originalContent: string,
  strategies: MergeStrategy[],
): MergeStrategy | undefined {
  for (const strategy of strategies) {
    if (strategy.canMerge?.(originalContent) ?? true) {
      return strategy;
    }
  }
  return undefined;
}

/**
 * Merge generated content into original content using the best available strategy.
 * Prefers marker-based merging when markers are present.
 */
export function mergeWithPreservation(
  originalContent: string,
  generatedContent: string,
  customStrategies?: MergeStrategy[],
): MergeResult {
  const strategies = customStrategies ?? defaultStrategies;
  const strategy = selectStrategy(originalContent, strategies);

  if (!strategy) {
    return {
      success: false,
      mergedContent: originalContent,
      hadMarkers: false,
      replacedSections: [],
      preservedSections: ["entire-file"],
      detectedGuiRegions: [],
      message: "No suitable merge strategy found.",
    };
  }

  return strategy.merge(originalContent, generatedContent);
}

export function normalizeBackupExtension(extension: string): string {
  return extension.startsWith(".") ? extension : `.${extension}`;
}

function formatBackupTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function buildBackupPath(
  filePath: string,
  backupExtension: string,
  includeTimestamp: boolean,
  now: () => Date,
): string {
  if (!includeTimestamp) {
    return `${filePath}${backupExtension}`;
  }

  const timestamp = formatBackupTimestamp(now());
  return `${filePath}.${timestamp}${backupExtension}`;
}

export function isBackupFileNameForSource(
  sourceFileName: string,
  backupFileName: string,
  backupExtension: string = DEFAULT_BACKUP_EXTENSION,
): boolean {
  const normalizedExtension = normalizeBackupExtension(backupExtension);

  return (
    backupFileName === `${sourceFileName}${normalizedExtension}` ||
    (backupFileName.startsWith(`${sourceFileName}.`) &&
      backupFileName.endsWith(normalizedExtension))
  );
}

export function extractBackupTimestampToken(
  sourceFileName: string,
  backupFileName: string,
  backupExtension: string = DEFAULT_BACKUP_EXTENSION,
): string | undefined {
  const normalizedExtension = normalizeBackupExtension(backupExtension);
  if (backupFileName === `${sourceFileName}${normalizedExtension}`) {
    return undefined;
  }

  if (!isBackupFileNameForSource(sourceFileName, backupFileName, normalizedExtension)) {
    return undefined;
  }

  const start = sourceFileName.length + 1;
  const end = backupFileName.length - normalizedExtension.length;
  const token = backupFileName.slice(start, end);

  return token.length > 0 ? token : undefined;
}

export async function mergeJavaFile(
  filePath: string,
  generatedContent: string,
  options: MergeFileOptions = {},
): Promise<MergeResult> {
  const fileSystem = options.fileSystem ?? defaultFileSystem;
  const originalContent = await fileSystem.readFile(filePath);
  const mergeResult = mergeWithPreservation(originalContent, generatedContent);

  if (!mergeResult.success || mergeResult.mergedContent === originalContent) {
    return mergeResult;
  }

  let backupPath: string | undefined;
  if (options.createBackup !== false) {
    const backupExtension = normalizeBackupExtension(
      options.backupExtension ?? DEFAULT_BACKUP_EXTENSION,
    );
    const includeTimestamp = options.includeTimestampInBackupName ?? true;
    const now = options.now ?? (() => new Date());

    backupPath = buildBackupPath(filePath, backupExtension, includeTimestamp, now);
    await fileSystem.writeFile(backupPath, originalContent);
  }

  await fileSystem.writeFile(filePath, mergeResult.mergedContent);

  return {
    ...mergeResult,
    backupPath,
  };
}

// Re-export for backward compatibility
export { detectGuiCodeRegions, HeuristicMergeStrategy } from "./HeuristicMergeStrategy";
export { MarkerMergeStrategy } from "./MarkerMergeStrategy";
export type {
  MergeContext,
  MergeStrategy,
  MergeStrategyFactory,
  MergeStrategyRegistry,
} from "./MergeStrategy";
