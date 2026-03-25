import { readFile as readFileFromFs, writeFile as writeFileToFs } from "node:fs/promises";
import {
  detectMarkers,
  MARKER_SECTIONS,
  type MarkerSection,
  replaceBetweenMarkers,
} from "./MarkerManager";

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
}

export const DEFAULT_BACKUP_EXTENSION = ".bak";
const GUI_RULES: Array<{ reason: GuiRegionReason; pattern: RegExp }> = [
  {
    reason: "swing-field",
    pattern:
      /^\s*(?:private|protected|public)?\s*(?:static\s+|final\s+)*J[A-Z]\w*\s+\w+(?:\s*=\s*[^;]+)?;/,
  },
  {
    reason: "swing-instantiation",
    pattern: /\bnew\s+J[A-Z]\w*\s*\(/,
  },
  {
    reason: "component-call",
    pattern: /\b(?:this\.)?add\s*\(|\bgetContentPane\(\)\.add\s*\(|\bsetBounds\s*\(/,
  },
  {
    reason: "layout-call",
    pattern:
      /\bsetLayout\s*\(|\bnew\s+(?:BorderLayout|FlowLayout|GridLayout|GridBagLayout|CardLayout)\s*\(/,
  },
  {
    reason: "frame-config",
    pattern:
      /\bsetTitle\s*\(|\bsetSize\s*\(|\bsetDefaultCloseOperation\s*\(|\bsetLocationRelativeTo\s*\(/,
  },
];

const defaultFileSystem: FileSystemAdapter = {
  async readFile(filePath: string): Promise<string> {
    return readFileFromFs(filePath, "utf-8");
  },
  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFileToFs(filePath, content, "utf-8");
  },
};

function classifyGuiLine(line: string): GuiRegionReason | null {
  for (const rule of GUI_RULES) {
    if (rule.pattern.test(line)) {
      return rule.reason;
    }
  }

  return null;
}

function isBlankOrComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*")
  );
}

function lineStartOffset(content: string, lineNumber: number): number {
  if (lineNumber <= 0) {
    return 0;
  }

  let currentLine = 0;
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      currentLine += 1;
      if (currentLine === lineNumber) {
        return index + 1;
      }
    }
  }

  return content.length;
}

function extractLineRange(content: string, startLine: number, endLine: number): string {
  const startOffset = lineStartOffset(content, startLine);
  const endOffset = lineStartOffset(content, endLine + 1);
  return content.slice(startOffset, endOffset);
}

function mergeWithMarkers(originalContent: string, generatedContent: string): MergeResult {
  const originalMarkers = detectMarkers(originalContent);
  if (!originalMarkers) {
    return {
      success: false,
      mergedContent: originalContent,
      hadMarkers: false,
      replacedSections: [],
      preservedSections: ["entire-file"],
      detectedGuiRegions: [],
      message: "Original content does not contain markers.",
    };
  }

  const generatedMarkers = detectMarkers(generatedContent);
  if (!generatedMarkers) {
    const markerSections = MARKER_SECTIONS.filter((section) => Boolean(originalMarkers[section]));
    return {
      success: false,
      mergedContent: originalContent,
      hadMarkers: true,
      replacedSections: [],
      preservedSections: ["outside-markers", ...markerSections],
      detectedGuiRegions: [],
      message: "Generated content does not contain matching markers.",
    };
  }

  let mergedContent = originalContent;
  const replacedSections: MarkerSection[] = [];

  for (const section of MARKER_SECTIONS) {
    const originalSection = originalMarkers[section];
    const generatedSection = generatedMarkers[section];

    if (!originalSection || !generatedSection) {
      continue;
    }

    mergedContent = replaceBetweenMarkers(mergedContent, section, generatedSection.content);
    replacedSections.push(section);
  }

  const replacedSet = new Set(replacedSections);
  const preservedMarkerSections = MARKER_SECTIONS.filter(
    (section) => Boolean(originalMarkers[section]) && !replacedSet.has(section),
  );

  return {
    success: replacedSections.length > 0,
    mergedContent,
    hadMarkers: true,
    replacedSections,
    preservedSections: ["outside-markers", ...preservedMarkerSections],
    detectedGuiRegions: [],
    message:
      replacedSections.length > 0
        ? undefined
        : "No matching marker sections were found to replace.",
  };
}

export function detectGuiCodeRegions(content: string): DetectedGuiRegion[] {
  const lines = content.split(/\r?\n/);
  const guiMatches: Array<{ line: number; reason: GuiRegionReason }> = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const reason = classifyGuiLine(lines[lineIndex]);
    if (reason) {
      guiMatches.push({ line: lineIndex, reason });
    }
  }

  if (guiMatches.length === 0) {
    return [];
  }

  const regions: DetectedGuiRegion[] = [];
  let startLine = guiMatches[0].line;
  let endLine = guiMatches[0].line;
  let previousLine = guiMatches[0].line;
  const reasons = new Set<GuiRegionReason>([guiMatches[0].reason]);

  for (let index = 1; index < guiMatches.length; index += 1) {
    const current = guiMatches[index];
    const linesBetween = lines.slice(previousLine + 1, current.line);
    const shouldJoin = linesBetween.every((line) => isBlankOrComment(line));

    if (shouldJoin) {
      endLine = current.line;
      reasons.add(current.reason);
    } else {
      regions.push({
        startLine,
        endLine,
        reasons: [...reasons],
      });
      startLine = current.line;
      endLine = current.line;
      reasons.clear();
      reasons.add(current.reason);
    }

    previousLine = current.line;
  }

  regions.push({
    startLine,
    endLine,
    reasons: [...reasons],
  });

  return regions;
}

function mergeWithoutMarkers(originalContent: string, generatedContent: string): MergeResult {
  const originalRegions = detectGuiCodeRegions(originalContent);
  const generatedRegions = detectGuiCodeRegions(generatedContent);

  if (originalRegions.length === 0 || generatedRegions.length === 0) {
    return {
      success: false,
      mergedContent: originalContent,
      hadMarkers: false,
      replacedSections: [],
      preservedSections: ["entire-file"],
      detectedGuiRegions: originalRegions,
      message: "Unable to detect GUI regions in one of the files.",
    };
  }

  const pairCount = Math.min(originalRegions.length, generatedRegions.length);
  const replacements: Array<{
    sectionName: string;
    start: number;
    end: number;
    replacement: string;
  }> = [];

  for (let index = 0; index < pairCount; index += 1) {
    const originalRegion = originalRegions[index];
    const generatedRegion = generatedRegions[index];

    replacements.push({
      sectionName: `heuristic-region-${index + 1}`,
      start: lineStartOffset(originalContent, originalRegion.startLine),
      end: lineStartOffset(originalContent, originalRegion.endLine + 1),
      replacement: extractLineRange(
        generatedContent,
        generatedRegion.startLine,
        generatedRegion.endLine,
      ),
    });
  }

  let mergedContent = originalContent;
  for (const replacement of [...replacements].sort((a, b) => b.start - a.start)) {
    mergedContent = `${mergedContent.slice(0, replacement.start)}${replacement.replacement}${mergedContent.slice(replacement.end)}`;
  }

  const preservedSections = ["outside-gui-regions"];
  if (originalRegions.length > pairCount) {
    for (let index = pairCount; index < originalRegions.length; index += 1) {
      preservedSections.push(`unmatched-original-region-${index + 1}`);
    }
  }

  let message: string | undefined;
  if (originalRegions.length !== generatedRegions.length) {
    message =
      `Heuristic merge used ${pairCount} paired region(s). ` +
      `Original regions: ${originalRegions.length}, generated regions: ${generatedRegions.length}.`;
  }

  return {
    success: pairCount > 0,
    mergedContent,
    hadMarkers: false,
    replacedSections: replacements.map((replacement) => replacement.sectionName),
    preservedSections,
    detectedGuiRegions: originalRegions,
    message,
  };
}

export function mergeWithPreservation(
  originalContent: string,
  generatedContent: string,
): MergeResult {
  if (detectMarkers(originalContent)) {
    return mergeWithMarkers(originalContent, generatedContent);
  }

  return mergeWithoutMarkers(originalContent, generatedContent);
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
