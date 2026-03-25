import * as path from "node:path";
import * as vscode from "vscode";
import type { CanvasState } from "@/components/ComponentModel";
import { getConfig } from "@/config/ConfigReader";
import { WebviewHtmlBuilder } from "./WebviewHtmlBuilder";

export interface PreviewCodeFile {
  fileName: string;
  content: string;
}

interface RoundTripStatusMessage {
  type: "roundTripStatus";
  hasPreservedCode: boolean;
  sourceFilePath?: string;
  sourceFileName?: string;
}

export class CanvasPanel {
  public static currentPanel: CanvasPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly htmlBuilder: WebviewHtmlBuilder;
  private className: string;
  private sourceFilePath: string | undefined;
  private hasPreservedCode = false;
  private canvasState: CanvasState;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, className: string) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    const webviewRoot = vscode.Uri.joinPath(extensionUri, "out", "webview");

    if (CanvasPanel.currentPanel) {
      CanvasPanel.currentPanel.panel.reveal(column);
      CanvasPanel.currentPanel.className = className;
      CanvasPanel.currentPanel.updatePanelTitle();
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
    this.htmlBuilder = new WebviewHtmlBuilder(extensionUri, panel.webview);
    this.className = className;
    this.canvasState = {
      className,
      frameTitle: className,
      frameWidth: 800,
      frameHeight: 600,
      components: [],
      hasPreservedCode: false,
    };

    this.update();
    this.sendConfigDefaults();
    this.sendRoundTripStatus();

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
          this.className = message.state.className;
          const sourceFilePath = message.state.sourceFilePath ?? this.sourceFilePath;
          const hasPreservedCode = message.state.hasPreservedCode ?? this.hasPreservedCode;
          this.canvasState = {
            ...message.state,
            sourceFilePath,
            hasPreservedCode,
          };
          this.sourceFilePath = sourceFilePath;
          this.hasPreservedCode = hasPreservedCode;
          this.updatePanelTitle();
          this.sendRoundTripStatus();
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

  public setSourceFile(filePath: string) {
    this.sourceFilePath = filePath;
    this.hasPreservedCode = true;
    this.canvasState = {
      ...this.canvasState,
      sourceFilePath: filePath,
      hasPreservedCode: true,
    };
    this.updatePanelTitle();
    this.sendRoundTripStatus();
  }

  public getSourceFile(): string | undefined {
    return this.sourceFilePath;
  }

  public setRoundTripStatus(hasPreservedCode: boolean) {
    this.hasPreservedCode = hasPreservedCode;
    this.canvasState = {
      ...this.canvasState,
      hasPreservedCode,
    };
    this.sendRoundTripStatus();
  }

  public hasRoundTripPreservedCode(): boolean {
    return this.hasPreservedCode;
  }

  public loadState(state: CanvasState) {
    const sourceFilePath = state.sourceFilePath ?? this.sourceFilePath;
    const hasPreservedCode = state.hasPreservedCode ?? this.hasPreservedCode;

    this.className = state.className;
    this.sourceFilePath = sourceFilePath;
    this.hasPreservedCode = hasPreservedCode;
    this.canvasState = {
      ...state,
      sourceFilePath,
      hasPreservedCode,
    };

    this.updatePanelTitle();
    this.panel.webview.postMessage({ type: "loadState", state: this.canvasState });
    this.sendRoundTripStatus();
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

  private sendRoundTripStatus() {
    const message: RoundTripStatusMessage = {
      type: "roundTripStatus",
      hasPreservedCode: this.hasPreservedCode,
      sourceFilePath: this.sourceFilePath,
      sourceFileName: this.sourceFilePath ? path.basename(this.sourceFilePath) : undefined,
    };
    this.panel.webview.postMessage(message);
  }

  private updatePanelTitle() {
    const sourceFileName = this.sourceFilePath ? path.basename(this.sourceFilePath) : undefined;
    this.panel.title = sourceFileName
      ? `Swing GUI Builder - ${this.className} · ${sourceFileName}`
      : `Swing GUI Builder - ${this.className}`;
  }

  private update() {
    this.panel.webview.html = this.htmlBuilder.getHtmlForWebview();
  }

  private dispose() {
    CanvasPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
