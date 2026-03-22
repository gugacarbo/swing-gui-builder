import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  readFileSync: vi.fn(),
  postMessage: vi.fn().mockResolvedValue(true),
  panelReveal: vi.fn(),
  panelDispose: vi.fn(),
  createWebviewPanel: vi.fn(),
  onDidDispose: vi.fn((_callback, _thisArg, disposables) => {
    if (disposables) disposables.push({ dispose: vi.fn() } as unknown as { dispose: () => void });
  }),
  onDidReceiveMessage: vi.fn((_callback, _thisArg, disposables) => {
    if (disposables) disposables.push({ dispose: vi.fn() } as unknown as { dispose: () => void });
  }),
  asWebviewUri: vi.fn((uri: { fsPath: string }) => `webview-uri:${uri.fsPath}`),
  cspSource: "https://test-webview-source",
  executeCommand: vi.fn().mockResolvedValue(undefined),
  activeTextEditor: undefined as { viewColumn: number } | undefined,
}));

vi.mock("../../src/config/ConfigReader", () => ({
  getConfig: mocks.getConfig,
}));

vi.mock("node:fs", () => ({
  readFileSync: mocks.readFileSync,
}));

vi.mock("vscode", () => ({
  Uri: {
    joinPath: (baseUri: { fsPath: string }, ...paths: string[]) => ({
      fsPath: path.join(baseUri.fsPath, ...paths),
    }),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  window: {
    get activeTextEditor() {
      return mocks.activeTextEditor;
    },
    set activeTextEditor(value) {
      mocks.activeTextEditor = value;
    },
    createWebviewPanel: (...args: unknown[]) => mocks.createWebviewPanel(...args),
  },
  commands: {
    executeCommand: mocks.executeCommand,
  },
}));

// Convenience aliases for tests
const mockPostMessage = mocks.postMessage;
const mockPanelReveal = mocks.panelReveal;
const mockPanelDispose = mocks.panelDispose;
const mockOnDidDispose = mocks.onDidDispose;
const mockOnDidReceiveMessage = mocks.onDidReceiveMessage;
const mockAsWebviewUri = mocks.asWebviewUri;
const mockCspSource = mocks.cspSource;
const mockExecuteCommand = mocks.executeCommand;

describe("CanvasPanel", () => {
  let CanvasPanel: typeof import("../../src/canvas/CanvasPanel").CanvasPanel;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.postMessage.mockResolvedValue(true);
    mocks.panelReveal.mockReturnValue(undefined);
    mocks.panelDispose.mockReturnValue(undefined);
    mocks.onDidDispose.mockImplementation((_callback, _thisArg, disposables) => {
      if (disposables) disposables.push({ dispose: vi.fn() } as unknown as { dispose: () => void });
    });
    mocks.onDidReceiveMessage.mockImplementation((_callback, _thisArg, disposables) => {
      if (disposables) disposables.push({ dispose: vi.fn() } as unknown as { dispose: () => void });
    });
    mocks.asWebviewUri.mockImplementation((uri: { fsPath: string }) => `webview-uri:${uri.fsPath}`);
    mocks.cspSource = "https://test-webview-source";
    mocks.executeCommand.mockResolvedValue(undefined);
    mocks.readFileSync.mockReset();
    mocks.activeTextEditor = undefined;

    mocks.createWebviewPanel.mockImplementation(() => ({
      webview: {
        postMessage: mocks.postMessage,
        onDidReceiveMessage: mocks.onDidReceiveMessage,
        asWebviewUri: mocks.asWebviewUri,
        cspSource: mocks.cspSource,
        html: "",
      },
      reveal: mocks.panelReveal,
      dispose: mocks.panelDispose,
      onDidDispose: mocks.onDidDispose,
    }));

    mocks.getConfig.mockReturnValue({
      defaultBackgroundColor: "#FFFFFF",
      defaultTextColor: "#000000",
      defaultFontFamily: "Arial",
      defaultFontSize: 12,
      components: {},
    });

    // Provide default HTML for most tests
    mocks.readFileSync.mockReturnValue(`
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <script src="assets/index.js"></script>
      </body>
      </html>
    `);

    // Reset the module to clear static state
    vi.resetModules();

    // Import fresh
    const module = await import("../../src/canvas/CanvasPanel");
    CanvasPanel = module.CanvasPanel;
  });

  afterEach(() => {
    // Clean up any static state
    if (CanvasPanel.currentPanel) {
      CanvasPanel.currentPanel = undefined;
    }
  });

  describe("createOrShow", () => {
    it("creates a new panel when none exists", () => {
      const extensionUri = { fsPath: "/extension" };

      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      expect(mocks.createWebviewPanel).toHaveBeenCalledWith(
        "swingGuiBuilder",
        "Swing GUI Builder - TestWindow",
        1, // ViewColumn.One when no active editor
        expect.objectContaining({
          enableScripts: true,
          retainContextWhenHidden: true,
        }),
      );
      expect(CanvasPanel.currentPanel).toBeDefined();
    });

    it("uses active editor view column when available", async () => {
      // Set up active editor
      mocks.activeTextEditor = { viewColumn: 2 };

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      expect(mocks.createWebviewPanel).toHaveBeenCalledWith(
        "swingGuiBuilder",
        expect.any(String),
        2, // ViewColumn from active editor
        expect.any(Object),
      );

      // Reset
      mocks.activeTextEditor = undefined;
    });

    it("reveals existing panel instead of creating new one", () => {
      const extensionUri = { fsPath: "/extension" };

      // Create first panel
      CanvasPanel.createOrShow(extensionUri, "FirstWindow");
      const firstPanelCallCount = mocks.createWebviewPanel.mock.calls.length;

      // Try to create again
      CanvasPanel.createOrShow(extensionUri, "SecondWindow");

      // Should not have created a new panel
      expect(mocks.createWebviewPanel).toHaveBeenCalledTimes(firstPanelCallCount);
      expect(mockPanelReveal).toHaveBeenCalled();
    });
  });

  describe("getCanvasState", () => {
    it("returns default state after creation", () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "MyFrame");

      const state = CanvasPanel.currentPanel?.getCanvasState();

      expect(state).toEqual({
        className: "MyFrame",
        frameTitle: "MyFrame",
        frameWidth: 800,
        frameHeight: 600,
        components: [],
      });
    });
  });

  describe("loadState", () => {
    it("updates canvas state and posts message to webview", () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const newState: CanvasState = {
        className: "LoadedWindow",
        frameTitle: "Loaded Frame",
        frameWidth: 1024,
        frameHeight: 768,
        components: [
          {
            id: "btn1",
            type: "Button",
            properties: { text: "Click Me" },
            x: 10,
            y: 20,
            width: 100,
            height: 30,
          },
        ],
      };

      CanvasPanel.currentPanel?.loadState(newState);

      expect(CanvasPanel.currentPanel?.getCanvasState()).toEqual(newState);
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "loadState",
          state: newState,
        }),
      );
    });

    it("sends config defaults after loading state", () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const newState: CanvasState = {
        className: "LoadedWindow",
        frameTitle: "Loaded Frame",
        frameWidth: 1024,
        frameHeight: 768,
        components: [],
      };

      mockPostMessage.mockClear();
      CanvasPanel.currentPanel?.loadState(newState);

      // Should send both loadState and configDefaults
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "loadState",
        }),
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "configDefaults",
        }),
      );
    });
  });

  describe("postPreviewCode", () => {
    it("posts preview code files to webview", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const files = [
        { fileName: "Main.java", content: "public class Main {}" },
        { fileName: "Helper.java", content: "public class Helper {}" },
      ];

      await CanvasPanel.currentPanel?.postPreviewCode(files);

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "previewCodeResponse",
        files,
      });
    });
  });

  describe("handleMessage", () => {
    it("handles stateChanged message", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      // Get the message handler that was registered
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];

      const newState: CanvasState = {
        className: "UpdatedWindow",
        frameTitle: "Updated",
        frameWidth: 500,
        frameHeight: 400,
        components: [],
      };

      messageHandler({ type: "stateChanged", state: newState });

      expect(CanvasPanel.currentPanel?.getCanvasState()).toEqual(newState);
    });

    it("ignores stateChanged message without state", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const originalState = CanvasPanel.currentPanel?.getCanvasState();
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];

      messageHandler({ type: "stateChanged" });

      expect(CanvasPanel.currentPanel?.getCanvasState()).toEqual(originalState);
    });

    it("handles toolbarCommand message", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];

      messageHandler({ type: "toolbarCommand", command: "save" });

      expect(mockExecuteCommand).toHaveBeenCalledWith("swingGuiBuilder.save");
    });

    it("ignores toolbarCommand message without command", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];

      messageHandler({ type: "toolbarCommand" });

      expect(mockExecuteCommand).not.toHaveBeenCalled();
    });

    it("ignores unknown message types", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const originalState = CanvasPanel.currentPanel?.getCanvasState();
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];

      messageHandler({ type: "unknownType", someData: "value" });

      expect(CanvasPanel.currentPanel?.getCanvasState()).toEqual(originalState);
    });
  });

  describe("dispose", () => {
    it("clears currentPanel static reference", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      expect(CanvasPanel.currentPanel).toBeDefined();

      // Get the dispose handler
      const disposeHandler = mockOnDidDispose.mock.calls[0][0];
      disposeHandler();

      expect(CanvasPanel.currentPanel).toBeUndefined();
    });

    it("disposes panel and all disposables", async () => {
      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const disposeHandler = mockOnDidDispose.mock.calls[0][0];
      disposeHandler();

      expect(mockPanelDispose).toHaveBeenCalled();
    });
  });

  describe("webview HTML generation", () => {
    it("generates HTML with bundled file when available", () => {
      mocks.readFileSync.mockReturnValue(`
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
          <script src="assets/index.js"></script>
          <link rel="stylesheet" href="assets/index.css">
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      // Get the panel that was created
      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // The HTML should have been set
      expect(panel.webview.html).toContain("Content-Security-Policy");
    });

    it("generates error HTML when bundle file not found", () => {
      mocks.readFileSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain("Webview build not found");
      expect(panel.webview.html).toContain("ENOENT: no such file");
    });

    it("escapes error details in error HTML", () => {
      mocks.readFileSync.mockImplementation(() => {
        throw new Error('<script>alert("xss")</script>');
      });

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // Should be escaped
      expect(panel.webview.html).toContain("&lt;script&gt;");
      expect(panel.webview.html).not.toContain("<script>alert");
    });

    it("handles unknown non-Error errors", () => {
      mocks.readFileSync.mockImplementation(() => {
        throw "string error";
      });

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain("Unknown error");
    });
  });

  describe("HTML rewriting", () => {
    it("rewrites local script src paths", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script src="assets/index.js"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('src="webview-uri:');
    });

    it("rewrites local href paths", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <link rel="stylesheet" href="styles/main.css">
        </head>
        <body></body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('href="webview-uri:');
    });

    it("does not rewrite absolute URLs", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <link rel="stylesheet" href="https://cdn.example.com/style.css">
        </head>
        <body>
          <script src="http://example.com/script.js"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('href="https://cdn.example.com/style.css"');
      expect(panel.webview.html).toContain('src="http://example.com/script.js"');
    });

    it("does not rewrite protocol-relative URLs", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <link rel="stylesheet" href="//cdn.example.com/style.css">
        </head>
        <body></body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('href="//cdn.example.com/style.css"');
    });

    it("does not rewrite hash URLs", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <body>
          <a href="#section">Link</a>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('href="#section"');
    });

    it("adds nonces to script tags without nonces", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script>console.log("test");</script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toMatch(/<script nonce="[a-zA-Z0-9]+"/);
    });

    it("adds nonces to style tags without nonces", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <style>body { margin: 0; }</style>
        </head>
        <body></body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toMatch(/<style nonce="[a-zA-Z0-9]+"/);
    });

    it("does not add nonce to script tags that already have one", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script nonce="existing-nonce">console.log("test");</script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // Should still have only one nonce attribute
      const scriptMatch = panel.webview.html.match(/<script[^>]*nonce[^>]*>/);
      expect(scriptMatch?.[0].match(/nonce=/g)?.length).toBe(1);
    });

    it("replaces existing CSP meta tag", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src *">
        </head>
        <body></body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain(mockCspSource);
      expect(panel.webview.html).not.toContain("default-src *");
    });

    it("adds CSP meta tag to head when not present", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head>
          <title>Test</title>
        </head>
        <body></body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain('http-equiv="Content-Security-Policy"');
    });

    it("handles paths with query strings", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script src="assets/index.js?v=123"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain("?v=123");
    });

    it("handles paths with hash fragments", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script src="assets/index.js#hash"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      expect(panel.webview.html).toContain("#hash");
    });

    it("handles paths with ./ prefix", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script src="./assets/index.js"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // Should rewrite the path (./ prefix removed)
      expect(mockAsWebviewUri).toHaveBeenCalled();
    });

    it("handles empty path gracefully", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <script src="x"></script>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // Should still generate valid HTML
      expect(panel.webview.html).toContain("<html>");
    });

    it("handles path starting with query string", () => {
      mocks.readFileSync.mockReturnValue(`
        <html>
        <head></head>
        <body>
          <a href="?param=value">Link</a>
        </body>
        </html>
      `);

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      const panel = mocks.createWebviewPanel.mock.results[0].value;

      // Should still generate valid HTML without crashing
      expect(panel.webview.html).toContain("<html>");
    });
  });

  describe("config defaults", () => {
    it("sends config defaults on creation", () => {
      mocks.getConfig.mockReturnValue({
        defaultBackgroundColor: "#FF0000",
        defaultTextColor: "#00FF00",
        defaultFontFamily: "Courier",
        defaultFontSize: 14,
        components: {
          Button: { backgroundColor: "#CCCCCC" },
        },
      });

      const extensionUri = { fsPath: "/extension" };
      CanvasPanel.createOrShow(extensionUri, "TestWindow");

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "configDefaults",
          config: expect.objectContaining({
            defaultBackgroundColor: "#FF0000",
            defaultTextColor: "#00FF00",
            defaultFontFamily: "Courier",
            defaultFontSize: 14,
          }),
        }),
      );
    });
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", async () => {
    // Access the internal escapeHtml function through the error HTML path
    mocks.readFileSync.mockImplementation(() => {
      throw new Error('<>&"\'');
    });

    // Set up webview panel mock for this test
    const testPanel = {
      webview: {
        postMessage: mocks.postMessage,
        onDidReceiveMessage: mocks.onDidReceiveMessage,
        asWebviewUri: mocks.asWebviewUri,
        cspSource: mocks.cspSource,
        html: "",
      },
      reveal: mocks.panelReveal,
      dispose: mocks.panelDispose,
      onDidDispose: mocks.onDidDispose,
    };
    mocks.createWebviewPanel.mockReturnValue(testPanel);

    // Reset module to get fresh import
    vi.resetModules();
    const { CanvasPanel } = await import("../../src/canvas/CanvasPanel");
    const extensionUri = { fsPath: "/extension" };
    CanvasPanel.createOrShow(extensionUri, "TestWindow");

    expect(testPanel.webview.html).toContain("&lt;");
    expect(testPanel.webview.html).toContain("&gt;");
    expect(testPanel.webview.html).toContain("&amp;");
    expect(testPanel.webview.html).toContain("&quot;");
    expect(testPanel.webview.html).toContain("&#39;");
  });
});

describe("getNonce", () => {
  it("generates a 32-character nonce", async () => {
    mocks.readFileSync.mockReturnValue('<html><head></head><body><script>test</script></body></html>');

    // Set up webview panel mock for this test
    const testPanel = {
      webview: {
        postMessage: mocks.postMessage,
        onDidReceiveMessage: mocks.onDidReceiveMessage,
        asWebviewUri: mocks.asWebviewUri,
        cspSource: mocks.cspSource,
        html: "",
      },
      reveal: mocks.panelReveal,
      dispose: mocks.panelDispose,
      onDidDispose: mocks.onDidDispose,
    };
    mocks.createWebviewPanel.mockReturnValue(testPanel);

    // Reset module to get fresh import
    vi.resetModules();
    const { CanvasPanel } = await import("../../src/canvas/CanvasPanel");
    const extensionUri = { fsPath: "/extension" };
    CanvasPanel.createOrShow(extensionUri, "TestWindow");

    // Extract nonce from HTML
    const nonceMatch = testPanel.webview.html.match(/nonce="([a-zA-Z0-9]+)"/);
    expect(nonceMatch).toBeTruthy();
    expect(nonceMatch?.[1].length).toBe(32);
  });
});
