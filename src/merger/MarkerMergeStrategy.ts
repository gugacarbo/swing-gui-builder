import type { MergeResult } from "./JavaFileMerger";
import {
  detectMarkers,
  MARKER_SECTIONS,
  type MarkerSection,
  replaceBetweenMarkers,
} from "./MarkerManager";
import type { MergeStrategy } from "./MergeStrategy";

/**
 * Merge strategy that uses SwingBuilder markers to identify and replace
 * specific sections of generated code while preserving the rest of the file.
 *
 * Markers have the format:
 *   // @swingbuilder:generated:<section> begin
 *   ... generated content ...
 *   // @swingbuilder:generated:<section> end
 */
export class MarkerMergeStrategy implements MergeStrategy {
  readonly name = "marker";

  /**
   * Check if the content contains SwingBuilder markers.
   */
  canMerge(content: string): boolean {
    return detectMarkers(content) !== null;
  }

  /**
   * Merge generated content into original content using markers.
   * Only sections between matching markers are replaced.
   */
  merge(originalContent: string, generatedContent: string): MergeResult {
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
}
