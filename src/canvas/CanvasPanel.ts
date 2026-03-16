import * as fs from "node:fs";
import * as vscode from "vscode";
import type { CanvasState } from "../components/ComponentModel";
import { getConfig } from "../config/ConfigReader";

export interface PreviewCodeFile {
  fileName: string;
  content: string;
}

export class CanvasPanel {
  public static currentPanel: CanvasPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly className: string;
  private canvasState: CanvasState;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, className: string) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    const webviewRoot = vscode.Uri.joinPath(extensionUri, "out", "webview");

    if (CanvasPanel.currentPanel) {
      CanvasPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "swingGuiBuilder",
      `Swing GUI Builder - ${className}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [webviewRoot, vscode.Uri.joinPath(extensionUri, "media")],
        retainContextWhenHidden: true,
      },
    );

    CanvasPanel.currentPanel = new CanvasPanel(panel, extensionUri, className);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, className: string) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.className = className;
    this.canvasState = {
      className,
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    };

    this.update();
    this.sendConfigDefaults();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables,
    );
  }

  private handleMessage(message: { type: string; state?: CanvasState; command?: string }) {
    switch (message.type) {
      case "stateChanged":
        if (message.state) {
          this.canvasState = message.state;
        }
        break;
      case "toolbarCommand":
        if (message.command) {
          vscode.commands.executeCommand(`swingGuiBuilder.${message.command}`);
        }
        break;
    }
  }

  public getCanvasState(): CanvasState {
    return this.canvasState;
  }

  public loadState(state: CanvasState) {
    this.canvasState = state;
    this.panel.webview.postMessage({ type: "loadState", state });
    this.sendConfigDefaults();
  }

  public postPreviewCode(files: readonly PreviewCodeFile[]): Thenable<boolean> {
    return this.panel.webview.postMessage({
      type: "previewCodeResponse",
      files,
    });
  }

  private sendConfigDefaults() {
    const config = getConfig();
    this.panel.webview.postMessage({
      type: "configDefaults",
      config: {
        defaultBackgroundColor: config.defaultBackgroundColor,
        defaultTextColor: config.defaultTextColor,
        defaultFontFamily: config.defaultFontFamily,
        defaultFontSize: config.defaultFontSize,
        components: config.components,
      },
    });
  }

  private update() {
    this.panel.webview.html = this.getHtmlForWebview();
  }

  private dispose() {
    CanvasPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  private getHtmlForWebview(): string {
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

  private rewriteBundledHtml(html: string, webviewRoot: vscode.Uri, nonce: string): string {
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

  private getContentSecurityPolicy(nonce: string): string {
    const { cspSource } = this.panel.webview;
    return [
      "default-src 'none'",
      `img-src ${cspSource} data:`,
      `font-src ${cspSource}`,
      `style-src ${cspSource} 'nonce-${nonce}'`,
      `script-src ${cspSource} 'nonce-${nonce}'`,
    ].join("; ");
  }

  private isLocalResourcePath(resourcePath: string): boolean {
    return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(resourcePath);
  }

  private toWebviewResourceUri(webviewRoot: vscode.Uri, resourcePath: string): string {
    const pathMatch = resourcePath.match(/^([^?#]+)(.*)$/);
    const cleanPath = (pathMatch?.[1] ?? resourcePath).replace(/^\.?\//, "");
    const suffix = pathMatch?.[2] ?? "";
    const resourceUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(webviewRoot, ...cleanPath.split("/").filter(Boolean)),
    );
    return `${resourceUri}${suffix}`;
  }

  private getMissingBuildHtml(details: string, nonce: string): string {
    const safeDetails = escapeHtml(details);
    return `<!DOCTYPE html>
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
