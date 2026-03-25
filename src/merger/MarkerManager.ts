export const MARKER_SECTIONS = ["fields", "constructor", "methods"] as const;

export type MarkerSection = (typeof MARKER_SECTIONS)[number];
type MarkerBoundary = "begin" | "end";

const MARKER_PREFIX = "@swingbuilder:generated";

export interface MarkerRange {
  start: number;
  end: number;
  contentStart: number;
  contentEnd: number;
  content: string;
}

export type MarkerRegions = Partial<Record<MarkerSection, MarkerRange>>;

export interface MarkerInsertionRange {
  start: number;
  end: number;
}

export type MarkerInsertionRanges = Partial<Record<MarkerSection, MarkerInsertionRange>>;

export function getMarker(section: MarkerSection, boundary: MarkerBoundary): string {
  return `// ${MARKER_PREFIX}:${section} ${boundary}`;
}

export function getBeginMarker(section: MarkerSection): string {
  return getMarker(section, "begin");
}

export function getEndMarker(section: MarkerSection): string {
  return getMarker(section, "end");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectLineEnding(content: string): "\n" | "\r\n" {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function ensureTrailingLineBreak(content: string, lineEnding: "\n" | "\r\n"): string {
  if (content.length === 0) {
    return "";
  }

  if (content.endsWith("\n") || content.endsWith("\r\n")) {
    return content;
  }

  return `${content}${lineEnding}`;
}

function findMarkerRange(content: string, section: MarkerSection): MarkerRange | undefined {
  const begin = escapeRegex(getBeginMarker(section));
  const end = escapeRegex(getEndMarker(section));
  const pattern = new RegExp(
    `(^[\\t ]*${begin}[\\t ]*\\r?\\n)([\\s\\S]*?)(^[\\t ]*${end}[\\t ]*(?:\\r?\\n)?)`,
    "m",
  );
  const match = pattern.exec(content);

  if (!match) {
    return undefined;
  }

  const [fullMatch, beginBlock, sectionContent] = match;
  const start = match.index;
  const contentStart = start + beginBlock.length;
  const contentEnd = contentStart + sectionContent.length;

  return {
    start,
    end: start + fullMatch.length,
    contentStart,
    contentEnd,
    content: sectionContent,
  };
}

function validateInsertionRanges(
  entries: [MarkerSection, MarkerInsertionRange][],
  contentLength: number,
): void {
  let previousEnd = -1;

  for (const [section, range] of [...entries].sort((a, b) => a[1].start - b[1].start)) {
    if (range.start < 0 || range.end < range.start || range.end > contentLength) {
      throw new Error(`Invalid marker insertion range for "${section}".`);
    }

    if (range.start < previousEnd) {
      throw new Error(`Marker insertion ranges overlap around "${section}".`);
    }

    previousEnd = range.end;
  }
}

export function detectMarkers(content: string): MarkerRegions | null {
  const regions: MarkerRegions = {};

  for (const section of MARKER_SECTIONS) {
    const markerRange = findMarkerRange(content, section);
    if (markerRange) {
      regions[section] = markerRange;
    }
  }

  return Object.keys(regions).length > 0 ? regions : null;
}

export function insertMarkers(content: string, ranges: MarkerInsertionRanges): string {
  const entries = Object.entries(ranges) as [MarkerSection, MarkerInsertionRange][];

  if (entries.length === 0) {
    return content;
  }

  validateInsertionRanges(entries, content.length);
  const lineEnding = detectLineEnding(content);
  let updatedContent = content;

  for (const [section, range] of [...entries].sort((a, b) => b[1].start - a[1].start)) {
    const sectionContent = updatedContent.slice(range.start, range.end);
    const wrappedSection = `${getBeginMarker(section)}${lineEnding}${ensureTrailingLineBreak(
      sectionContent,
      lineEnding,
    )}${getEndMarker(section)}`;
    updatedContent = `${updatedContent.slice(0, range.start)}${wrappedSection}${updatedContent.slice(range.end)}`;
  }

  return updatedContent;
}

export function replaceBetweenMarkers(
  content: string,
  section: MarkerSection,
  newContent: string,
): string {
  const region = findMarkerRange(content, section);
  if (!region) {
    return content;
  }

  return `${content.slice(0, region.contentStart)}${newContent}${content.slice(region.contentEnd)}`;
}
