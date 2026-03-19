import { vi } from "vitest";

// Mock vscode globally for all tests
vi.mock("vscode", () => ({
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  Uri: {
    joinPath: (...args: string[]) => ({ fsPath: args.join("/") }),
  },
  workspace: {
    workspaceFolders: [],
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    }),
    fs: {
      createDirectory: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockRejectedValue(new Error("File not found")),
      readFile: vi.fn().mockRejectedValue(new Error("File not found")),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  },
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showInputBox: vi.fn(),
    showOpenDialog: vi.fn(),
    activeTextEditor: undefined,
  },
}));
