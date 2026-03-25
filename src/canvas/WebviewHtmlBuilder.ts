import * as fs from "node:fs";
import * as vscode from "vscode";

/**
 * Interface for webview context needed by WebviewHtmlBuilder.
 * Allows injecting test doubles for unit testing.
 */
export interface WebviewContext {
  asWebviewUri(uri: vscode.Uri): vscode.Uri;
  readonly cspSource: string;
}

/**
 * Handles HTML generation for VS Code webviews.
 * Encapsulates CSP, nonce, and resource URI rewriting logic.
 */
export class WebviewHtmlBuilder {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly webviewContext: WebviewContext,
  ) {}

  /**
   * Generates the complete HTML for the webview panel.
   * Reads the bundled index.html and rewrites URIs for webview compatibility.
   */
  public getHtmlForWebview(): string {
    const webviewRoot = vscode.Uri.joinPath(this.extensionUri, "out", "webview");
    const indexHtmlUri = vscode.Uri.joinPath(webviewRoot, "index.html");
    const nonce = getNonce();

    try {
      const bundledHtml = fs.readFileSync(indexHtmlUri.fsPath, "utf8");
      return this.rewriteBundledHtml(bundledHtml, webviewRoot, nonce);
    } catch (error) {
      const details = error instanceof Error ? error.message : "Unknown error";
      return this.getMissingBuildHtml(details, nonce);
    }
  }

  /**
   * Rewrites bundled HTML for VS Code webview compatibility.
   * - Converts local resource paths to webview-compatible URIs
   * - Adds nonces to script and style tags
   * - Injects Content Security Policy
   */
  public rewriteBundledHtml(html: string, webviewRoot: vscode.Uri, nonce: string): string {
    const csp = this.getContentSecurityPolicy(nonce);
    const htmlWithLocalUris = html.replace(
      /\b(src|href)="([^"]+)"/g,
      (match, attribute, resourcePath: string) => {
        if (!this.isLocalResourcePath(resourcePath)) {
          return match;
        }

        const resourceUri = this.toWebviewResourceUri(webviewRoot, resourcePath);
        return `${attribute}="${resourceUri}"`;
      },
    );

    const htmlWithNonces = htmlWithLocalUris
      .replace(/<script\b(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
      .replace(/<style\b(?![^>]*\bnonce=)([^>]*)>/gi, `<style nonce="${nonce}"$1>`);

    if (/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/i.test(htmlWithNonces)) {
      return htmlWithNonces.replace(
        /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/i,
        `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
      );
    }

    return htmlWithNonces.replace(
      /<head>/i,
      `<head>
  <meta http-equiv="Content-Security-Policy" content="${csp}">`,
    );
  }

  /**
   * Gets the Content Security Policy for the webview.
   */
  public getContentSecurityPolicy(nonce: string): string {
    const { cspSource } = this.webviewContext;
    return [
      "default-src 'none'",
      `img-src ${cspSource} data:`,
      `font-src ${cspSource}`,
      `style-src ${cspSource} 'nonce-${nonce}'`,
      `script-src ${cspSource} 'nonce-${nonce}'`,
    ].join("; ");
  }

  /**
   * Checks if a resource path is a local/relative path that needs rewriting.
   */
  public isLocalResourcePath(resourcePath: string): boolean {
    return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(resourcePath);
  }

  /**
   * Converts a local resource path to a webview-compatible URI.
   */
  public toWebviewResourceUri(webviewRoot: vscode.Uri, resourcePath: string): string {
    const pathMatch = resourcePath.match(/^([^?#]+)(.*)$/);
    const cleanPath = (pathMatch?.[1] ?? resourcePath).replace(/^\.?\//, "");
    const suffix = pathMatch?.[2] ?? "";
    const resourceUri = this.webviewContext.asWebviewUri(
      vscode.Uri.joinPath(webviewRoot, ...cleanPath.split("/").filter(Boolean)),
    );
    return `${resourceUri}${suffix}`;
  }

  /**
   * Generates fallback HTML when the bundled webview build is not found.
   */
  public getMissingBuildHtml(details: string, nonce: string): string {
    const safeDetails = escapeHtml(details);
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${this.getContentSecurityPolicy(nonce)}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Swing GUI Builder</title>
  <style nonce="${nonce}">
    body { font-family: sans-serif; padding: 16px; color: #cccccc; background: #1e1e1e; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <h2>Webview build not found</h2>
  <p>Run <code>pnpm run build:webview</code> and reopen the panel.</p>
  <p>Details: <code>${safeDetails}</code></p>
</body>
</html>`;
  }
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates a random nonce for CSP.
 */
export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
