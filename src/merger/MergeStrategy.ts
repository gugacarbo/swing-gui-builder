import type { MergeResult } from "./JavaFileMerger";

/**
 * Strategy interface for merging Java file content.
 * Allows different merge approaches to be used interchangeably.
 */
export interface MergeStrategy {
  /**
   * Unique identifier for this merge strategy.
   */
  readonly name: string;

  /**
   * Merge generated content into original content using this strategy.
   * @param originalContent - The original file content
   * @param generatedContent - The newly generated content
   * @returns MergeResult with the merged content and metadata
   */
  merge(originalContent: string, generatedContent: string): MergeResult;

  /**
   * Check if this strategy can handle the given content.
   * @param content - The content to check
   * @returns true if this strategy can merge this content
   */
  canMerge?(content: string): boolean;
}

/**
 * Context passed to merge strategies for additional configuration.
 */
export interface MergeContext {
  /** Whether backups should be created before merging */
  createBackup?: boolean;
  /** Custom file system adapter for testing */
  fileSystem?: {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
  };
}

/**
 * Factory function type for creating merge strategies.
 */
export type MergeStrategyFactory = () => MergeStrategy;

/**
 * Registry type for managing multiple strategies.
 */
export interface MergeStrategyRegistry {
  /** Get the default strategy */
  getDefault(): MergeStrategy;
  /** Get a strategy by name */
  get(name: string): MergeStrategy | undefined;
  /** Register a new strategy */
  register(strategy: MergeStrategy): void;
  /** List all registered strategy names */
  listAll(): string[];
}
