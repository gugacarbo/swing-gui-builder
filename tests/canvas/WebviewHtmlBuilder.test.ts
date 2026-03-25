import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  escapeHtml,
  getNonce,
  type WebviewContext,
  WebviewHtmlBuilder,
} from "../../src/canvas/WebviewHtmlBuilder";

const mocks = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  asWebviewUri: vi.fn((uri: { fsPath: string }) => `webview-uri:${uri.fsPath}`),
  cspSource: "https://test-webview-source",
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
}));

function createMockWebviewContext(): WebviewContext {
  return {
    asWebviewUri: mocks.asWebviewUri,
    cspSource: mocks.cspSource,
  };
}

describe("WebviewHtmlBuilder", () => {
  let builder: WebviewHtmlBuilder;
  const mockExtensionUri = { fsPath: "/extension/root" };
  let mockWebviewContext: WebviewContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.asWebviewUri.mockImplementation((uri: { fsPath: string }) => `webview-uri:${uri.fsPath}`);
    mocks.cspSource = "https://test-webview-source";
    mockWebviewContext = createMockWebviewContext();
    builder = new WebviewHtmlBuilder(mockExtensionUri as never, mockWebviewContext);
  });

  describe("getHtmlForWebview", () => {
    it("should return rewritten HTML when bundled file exists", () => {
      const bundledHtml = '<!DOCTYPE html><html><head></head><body><script src="main.js"></script></body></html>';
      mocks.readFileSync.mockReturnValue(bundledHtml);

      const result = builder.getHtmlForWebview();

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("nonce=");
      expect(result).toContain("Content-Security-Policy");
    });

    it("should return fallback HTML when bundled file is missing", () => {
      mocks.readFileSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      const result = builder.getHtmlForWebview();

      expect(result).toContain("Webview build not found");
      expect(result).toContain("ENOENT: no such file");
    });

    it("should handle unknown error types", () => {
      mocks.readFileSync.mockImplementation(() => {
        throw "string error";
      });

      const result = builder.getHtmlForWebview();

      expect(result).toContain("Unknown error");
    });
  });

  describe("rewriteBundledHtml", () => {
    it("should rewrite local src attributes", () => {
      const html = '<script src="assets/main.js"></script>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('src="webview-uri:');
    });

    it("should rewrite local href attributes", () => {
      const html = '<link href="styles/main.css" rel="stylesheet">';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('href="webview-uri:');
    });

    it("should not rewrite absolute URLs", () => {
      const html = '<script src="https://example.com/script.js"></script>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('src="https://example.com/script.js"');
    });

    it("should not rewrite protocol-relative URLs", () => {
      const html = '<script src="//example.com/script.js"></script>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('src="//example.com/script.js"');
    });

    it("should not rewrite hash URLs", () => {
      const html = '<a href="#section">Link</a>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('href="#section"');
    });

    it("should add nonce to script tags without existing nonce", () => {
      const html = "<script>console.log('test');</script>";
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('<script nonce="test-nonce"');
    });

    it("should not add nonce to script tags with existing nonce", () => {
      const html = '<script nonce="existing">console.log("test");</script>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('nonce="existing"');
      expect(result).not.toContain('nonce="test-nonce"');
    });

    it("should add nonce to style tags without existing nonce", () => {
      const html = "<style>body { color: red; }</style>";
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('<style nonce="test-nonce"');
    });

    it("should replace existing CSP meta tag", () => {
      const html = '<html><head><meta http-equiv="Content-Security-Policy" content="default-src *"></head></html>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain("default-src 'none'");
      expect(result).not.toContain("default-src *");
    });

    it("should inject CSP meta tag into head when not present", () => {
      const html = "<html><head></head><body></body></html>";
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain('<meta http-equiv="Content-Security-Policy"');
    });

    it("should preserve query strings and hashes in resource paths", () => {
      const html = '<script src="main.js?v=123#hash"></script>';
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.rewriteBundledHtml(html, webviewRoot, "test-nonce");

      expect(result).toContain("?v=123#hash");
    });
  });

  describe("getContentSecurityPolicy", () => {
    it("should return correct CSP directives", () => {
      const csp = builder.getContentSecurityPolicy("test-nonce");

      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("img-src https://test-webview-source data:");
      expect(csp).toContain("font-src https://test-webview-source");
      expect(csp).toContain("style-src https://test-webview-source 'nonce-test-nonce'");
      expect(csp).toContain("script-src https://test-webview-source 'nonce-test-nonce'");
    });
  });

  describe("isLocalResourcePath", () => {
    it("should return true for relative paths", () => {
      expect(builder.isLocalResourcePath("assets/main.js")).toBe(true);
      expect(builder.isLocalResourcePath("./styles.css")).toBe(true);
      expect(builder.isLocalResourcePath("../parent/file.js")).toBe(true);
    });

    it("should return false for absolute URLs", () => {
      expect(builder.isLocalResourcePath("https://example.com/script.js")).toBe(false);
      expect(builder.isLocalResourcePath("http://example.com/script.js")).toBe(false);
    });

    it("should return false for protocol-relative URLs", () => {
      expect(builder.isLocalResourcePath("//example.com/script.js")).toBe(false);
    });

    it("should return false for hash URLs", () => {
      expect(builder.isLocalResourcePath("#section")).toBe(false);
    });

    it("should return false for data URLs", () => {
      expect(builder.isLocalResourcePath("data:image/png;base64,abc")).toBe(false);
    });
  });

  describe("toWebviewResourceUri", () => {
    it("should convert relative path to webview URI", () => {
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.toWebviewResourceUri(webviewRoot, "assets/main.js");

      expect(result).toContain("webview-uri:");
      expect(result).toContain("assets/main.js");
    });

    it("should strip leading ./ from paths", () => {
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.toWebviewResourceUri(webviewRoot, "./main.js");

      expect(mocks.asWebviewUri).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining("main.js") }),
      );
    });

    it("should preserve query strings", () => {
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.toWebviewResourceUri(webviewRoot, "main.js?v=123");

      expect(result).toContain("?v=123");
    });

    it("should preserve hash fragments", () => {
      const webviewRoot = { fsPath: "/extension/root/out/webview" } as never;

      const result = builder.toWebviewResourceUri(webviewRoot, "main.js#hash");

      expect(result).toContain("#hash");
    });
  });

  describe("getMissingBuildHtml", () => {
    it("should return fallback HTML with error details", () => {
      const html = builder.getMissingBuildHtml("File not found", "test-nonce");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Webview build not found");
      expect(html).toContain("pnpm run build:webview");
      expect(html).toContain("File not found");
    });

    it("should include CSP in fallback HTML", () => {
      const html = builder.getMissingBuildHtml("Error", "test-nonce");

      expect(html).toContain("Content-Security-Policy");
    });

    it("should escape HTML in error details", () => {
      const html = builder.getMissingBuildHtml("<script>alert('xss')</script>", "test-nonce");

      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });
});

describe("escapeHtml", () => {
  it("should escape & character", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("should escape < character", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("should escape > character", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it("should escape all special characters together", () => {
    expect(escapeHtml('<div class="test">&</div>')).toBe("&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;");
  });

  it("should return empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should not modify safe strings", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("getNonce", () => {
  it("should return a 32-character string", () => {
    const nonce = getNonce();
    expect(nonce).toHaveLength(32);
  });

  it("should only contain alphanumeric characters", () => {
    const nonce = getNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("should generate different nonces on multiple calls", () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(getNonce());
    }
    // With 32 random alphanumeric chars, collisions should be extremely rare
    expect(nonces.size).toBe(100);
  });
});
