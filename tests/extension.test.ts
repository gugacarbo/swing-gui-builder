import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    dispose: vi.fn(),
  })),
  subscriptions: [] as unknown[],
  registerCommand: vi.fn((_commandId: string, _callback: () => void) => ({
    dispose: vi.fn(),
  })),
  registerNewWindowCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerGenerateCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerPreviewCodeCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerSaveCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerOpenCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerOpenFromJavaCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerRestoreFromBackupCommand: vi.fn(() => ({ dispose: vi.fn() })),
  registerInitConfigCommand: vi.fn(() => ({ dispose: vi.fn() })),
}));

vi.mock("vscode", () => ({
  window: {
    createOutputChannel: mocks.createOutputChannel,
  },
  commands: {
    registerCommand: mocks.registerCommand,
  },
}));

vi.mock("../src/commands/newWindowCommand", () => ({
  registerNewWindowCommand: mocks.registerNewWindowCommand,
}));

vi.mock("../src/commands/generateCommand", () => ({
  registerGenerateCommand: mocks.registerGenerateCommand,
}));

vi.mock("../src/commands/previewCodeCommand", () => ({
  registerPreviewCodeCommand: mocks.registerPreviewCodeCommand,
}));

vi.mock("../src/commands/saveCommand", () => ({
  registerSaveCommand: mocks.registerSaveCommand,
}));

vi.mock("../src/commands/openCommand", () => ({
  registerOpenCommand: mocks.registerOpenCommand,
}));

vi.mock("../src/commands/openFromJavaCommand", () => ({
  registerOpenFromJavaCommand: mocks.registerOpenFromJavaCommand,
}));

vi.mock("../src/commands/restoreFromBackupCommand", () => ({
  registerRestoreFromBackupCommand: mocks.registerRestoreFromBackupCommand,
}));

vi.mock("../src/commands/initConfigCommand", () => ({
  registerInitConfigCommand: mocks.registerInitConfigCommand,
}));

describe("extension", () => {
  let extension: typeof import("../src/extension");

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscriptions = [];

    // Reset modules to get fresh imports
    vi.resetModules();

    // Re-import after resetting modules
    return import("../src/extension").then((mod) => {
      extension = mod;
    });
  });

  describe("activate", () => {
    it("creates output channel with correct name", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.createOutputChannel).toHaveBeenCalledWith("Swing GUI Builder");
    });

    it("registers newWindowCommand with context", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerNewWindowCommand).toHaveBeenCalledWith(context);
    });

    it("registers generateCommand with output channel", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerGenerateCommand).toHaveBeenCalled();
      const outputChannel = mocks.registerGenerateCommand.mock.calls[0][0];
      expect(outputChannel).toBeDefined();
      expect(outputChannel.appendLine).toBeDefined();
    });

    it("registers previewCodeCommand", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerPreviewCodeCommand).toHaveBeenCalled();
    });

    it("registers saveCommand", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerSaveCommand).toHaveBeenCalled();
    });

    it("registers openCommand with context and output channel", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerOpenCommand).toHaveBeenCalledWith(context, expect.anything());
    });

    it("registers initConfigCommand", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerInitConfigCommand).toHaveBeenCalled();
    });

    it("registers openFromJavaCommand with context and output channel", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerOpenFromJavaCommand).toHaveBeenCalledWith(context, expect.anything());
    });

    it("registers restoreFromBackupCommand with output channel", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      expect(mocks.registerRestoreFromBackupCommand).toHaveBeenCalledWith(expect.anything());
    });

    it("adds all command disposables to context subscriptions", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      extension.activate(context);

      // Should have 8 commands registered
      expect(mocks.subscriptions.length).toBe(8);
    });

    it("returns nothing (void)", () => {
      const context = {
        subscriptions: mocks.subscriptions,
        extensionUri: { fsPath: "/test/extension" },
      } as unknown as Parameters<typeof extension.activate>[0];

      const result = extension.activate(context);

      expect(result).toBeUndefined();
    });
  });

  describe("deactivate", () => {
    it("is a function", () => {
      expect(typeof extension.deactivate).toBe("function");
    });

    it("can be called without errors", () => {
      expect(() => extension.deactivate()).not.toThrow();
    });

    it("returns nothing (void)", () => {
      const result = extension.deactivate();
      expect(result).toBeUndefined();
    });
  });
});
