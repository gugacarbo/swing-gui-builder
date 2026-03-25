import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JavaProjectStructure } from "../../src/utils/JavaProjectDetector";
import {
  calculateDefaultOutputDirectory,
  DEFAULT_OUTPUT_DIRECTORY,
  resolveOutputDirectoryWithUI,
  resolveRelativePath,
  shouldShowFolderPicker,
  type OutputDirectoryConfig,
  type OutputDirectoryContext,
} from "../../src/commands/OutputDirectoryResolver";

describe("OutputDirectoryResolver", () => {
  describe("DEFAULT_OUTPUT_DIRECTORY constant", () => {
    it("should have the expected default value", () => {
      expect(DEFAULT_OUTPUT_DIRECTORY).toBe("swing/components/");
    });
  });

  describe("calculateDefaultOutputDirectory", () => {
    it("should return configured dir when it differs from default", () => {
      const config: OutputDirectoryConfig = {
        configuredDir: "src/main/java/components",
        projectStructure: undefined,
        defaultDir: DEFAULT_OUTPUT_DIRECTORY,
      };

      const result = calculateDefaultOutputDirectory(config);
      expect(result).toBe("src/main/java/components");
    });

    it("should return configured dir when it differs from default, even with project structure", () => {
      const projectStructure: JavaProjectStructure = {
        type: "maven-gradle",
        sourceRoot: "src/main/java",
        suggestedOutputFolder: "src/main/java/com/example",
      };

      const config: OutputDirectoryConfig = {
        configuredDir: "custom/path",
        projectStructure,
        defaultDir: DEFAULT_OUTPUT_DIRECTORY,
      };

      const result = calculateDefaultOutputDirectory(config);
      expect(result).toBe("custom/path");
    });

    it("should return suggested output folder from project structure when configured dir is default", () => {
      const projectStructure: JavaProjectStructure = {
        type: "maven-gradle",
        sourceRoot: "src/main/java",
        suggestedOutputFolder: "src/main/java/com/example",
      };

      const config: OutputDirectoryConfig = {
        configuredDir: DEFAULT_OUTPUT_DIRECTORY,
        projectStructure,
        defaultDir: DEFAULT_OUTPUT_DIRECTORY,
      };

      const result = calculateDefaultOutputDirectory(config);
      expect(result).toBe("src/main/java/com/example");
    });

    it("should return default dir when no project structure and configured dir is default", () => {
      const config: OutputDirectoryConfig = {
        configuredDir: DEFAULT_OUTPUT_DIRECTORY,
        projectStructure: undefined,
        defaultDir: DEFAULT_OUTPUT_DIRECTORY,
      };

      const result = calculateDefaultOutputDirectory(config);
      expect(result).toBe(DEFAULT_OUTPUT_DIRECTORY);
    });

    it("should return default dir when project structure has no suggested folder", () => {
      const config: OutputDirectoryConfig = {
        configuredDir: DEFAULT_OUTPUT_DIRECTORY,
        projectStructure: {
          type: "maven-gradle",
          sourceRoot: "src/main/java",
          suggestedOutputFolder: DEFAULT_OUTPUT_DIRECTORY,
        },
        defaultDir: DEFAULT_OUTPUT_DIRECTORY,
      };

      const result = calculateDefaultOutputDirectory(config);
      expect(result).toBe(DEFAULT_OUTPUT_DIRECTORY);
    });
  });

  describe("shouldShowFolderPicker", () => {
    it("should return true when no project structure and configured dir is default", () => {
      const result = shouldShowFolderPicker(undefined, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OUTPUT_DIRECTORY);
      expect(result).toBe(true);
    });

    it("should return false when project structure exists", () => {
      const projectStructure: JavaProjectStructure = {
        type: "maven-gradle",
        sourceRoot: "src/main/java",
        suggestedOutputFolder: "src/main/java/components",
      };

      const result = shouldShowFolderPicker(projectStructure, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OUTPUT_DIRECTORY);
      expect(result).toBe(false);
    });

    it("should return false when configured dir differs from default", () => {
      const result = shouldShowFolderPicker(undefined, "custom/path", DEFAULT_OUTPUT_DIRECTORY);
      expect(result).toBe(false);
    });

    it("should return false when both project structure exists and configured dir differs", () => {
      const projectStructure: JavaProjectStructure = {
        type: "plain-src",
        sourceRoot: "src",
        suggestedOutputFolder: "src/components",
      };

      const result = shouldShowFolderPicker(projectStructure, "custom/path", DEFAULT_OUTPUT_DIRECTORY);
      expect(result).toBe(false);
    });
  });

  describe("resolveRelativePath", () => {
    it("should return relative path from workspace to selected path", () => {
      const workspaceRoot = "/home/user/project";
      const selectedPath = "/home/user/project/src/main/java";

      const result = resolveRelativePath(workspaceRoot, selectedPath);
      expect(result).toBe("src/main/java");
    });

    it("should handle nested paths", () => {
      const workspaceRoot = "/home/user/project";
      const selectedPath = "/home/user/project/src/main/java/com/example/ui";

      const result = resolveRelativePath(workspaceRoot, selectedPath);
      expect(result).toBe("src/main/java/com/example/ui");
    });

    it("should return empty string when paths are equal", () => {
      const workspaceRoot = "/home/user/project";
      const selectedPath = "/home/user/project";

      const result = resolveRelativePath(workspaceRoot, selectedPath);
      expect(result).toBe("");
    });

    it("should handle Windows-style paths", () => {
      const workspaceRoot = "C:\\Users\\user\\project";
      const selectedPath = "C:\\Users\\user\\project\\src\\components";

      const result = resolveRelativePath(workspaceRoot, selectedPath);
      // path.relative normalizes separators based on platform
      expect(result).toContain("src");
    });
  });

  describe("resolveOutputDirectoryWithUI", () => {
    const mockContext: OutputDirectoryContext = {
      workspaceRoot: "/home/user/project",
      workspaceUri: { fsPath: "/home/user/project" },
      ui: {
        showInputBox: vi.fn(),
        showOpenDialog: vi.fn(),
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe("input box flow (when folder picker is not shown)", () => {
      it("should return outputDir from input box when user enters a value", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: "custom/path",
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showInputBox).mockResolvedValue("src/main/java");

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(false);
        if (!result.cancelled) {
          expect(result.outputDir).toBe("src/main/java");
        }
        expect(mockContext.ui.showInputBox).toHaveBeenCalledWith({
          prompt: "Output directory for generated Java files (relative to workspace)",
          value: "custom/path",
        });
        expect(mockContext.ui.showOpenDialog).not.toHaveBeenCalled();
      });

      it("should return cancelled when user dismisses input box", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: "custom/path",
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showInputBox).mockResolvedValue(undefined);

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(true);
      });

      it("should use suggested output folder as default value", async () => {
        const projectStructure: JavaProjectStructure = {
          type: "maven-gradle",
          sourceRoot: "src/main/java",
          suggestedOutputFolder: "src/main/java/com/example",
        };

        const config: OutputDirectoryConfig = {
          configuredDir: DEFAULT_OUTPUT_DIRECTORY,
          projectStructure,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showInputBox).mockResolvedValue("src/main/java/com/example");

        await resolveOutputDirectoryWithUI(config, mockContext);

        expect(mockContext.ui.showInputBox).toHaveBeenCalledWith({
          prompt: "Output directory for generated Java files (relative to workspace)",
          value: "src/main/java/com/example",
        });
      });
    });

    describe("folder picker flow (when no project structure and default config)", () => {
      it("should show folder picker when no project structure and default config", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: DEFAULT_OUTPUT_DIRECTORY,
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showOpenDialog).mockResolvedValue([
          { fsPath: "/home/user/project/src/components" },
        ]);

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(false);
        if (!result.cancelled) {
          expect(result.outputDir).toBe("src/components");
        }
        expect(mockContext.ui.showOpenDialog).toHaveBeenCalledWith({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          openLabel: "Select output folder for Java files",
          defaultUri: mockContext.workspaceUri,
        });
        expect(mockContext.ui.showInputBox).not.toHaveBeenCalled();
      });

      it("should return cancelled when user dismisses folder picker", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: DEFAULT_OUTPUT_DIRECTORY,
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showOpenDialog).mockResolvedValue(undefined);

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(true);
      });

      it("should return cancelled when user dismisses folder picker with empty array", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: DEFAULT_OUTPUT_DIRECTORY,
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showOpenDialog).mockResolvedValue([]);

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(true);
      });

      it("should calculate relative path from selected folder", async () => {
        const config: OutputDirectoryConfig = {
          configuredDir: DEFAULT_OUTPUT_DIRECTORY,
          projectStructure: undefined,
          defaultDir: DEFAULT_OUTPUT_DIRECTORY,
        };

        vi.mocked(mockContext.ui.showOpenDialog).mockResolvedValue([
          { fsPath: "/home/user/project/src/main/java/com/example/ui" },
        ]);

        const result = await resolveOutputDirectoryWithUI(config, mockContext);

        expect(result.cancelled).toBe(false);
        if (!result.cancelled) {
          expect(result.outputDir).toBe("src/main/java/com/example/ui");
        }
      });
    });
  });
});
