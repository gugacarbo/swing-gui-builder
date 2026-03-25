import type { DetectedGuiRegion, GuiRegionReason, MergeResult } from "./JavaFileMerger";
import type { MergeStrategy } from "./MergeStrategy";

/**
 * Rules for detecting GUI-related code lines.
 */
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

/**
 * Classify a single line as a specific GUI region type.
 */
function classifyGuiLine(line: string): GuiRegionReason | null {
  for (const rule of GUI_RULES) {
    if (rule.pattern.test(line)) {
      return rule.reason;
    }
  }
  return null;
}

/**
 * Check if a line is blank or a comment.
 */
function isBlankOrComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*")
  );
}

/**
 * Get the byte offset for the start of a specific line number.
 */
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

/**
 * Extract a range of lines from content.
 */
function extractLineRange(content: string, startLine: number, endLine: number): string {
  const startOffset = lineStartOffset(content, startLine);
  const endOffset = lineStartOffset(content, endLine + 1);
  return content.slice(startOffset, endOffset);
}

/**
 * Detect GUI code regions in Java content using heuristics.
 * Groups consecutive GUI-related lines into regions.
 */
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

/**
 * Merge strategy that uses heuristic detection to identify GUI code regions
 * and replace them with generated content.
 *
 * This strategy is used when markers are not present in the file.
 * It detects GUI-related code patterns and replaces corresponding regions.
 */
export class HeuristicMergeStrategy implements MergeStrategy {
  readonly name = "heuristic";

  /**
   * This strategy can always attempt to merge (it's the fallback).
   */
  canMerge(_content: string): boolean {
    return true;
  }

  /**
   * Merge generated content into original content using heuristic detection.
   * Pairs GUI regions between original and generated content for replacement.
   */
  merge(originalContent: string, generatedContent: string): MergeResult {
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
}
