import * as vscode from "vscode";
import type { CanvasState } from "../components/ComponentModel";

export class CanvasPanel {
  public static currentPanel: CanvasPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly className: string;
  private canvasState: CanvasState;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, className: string) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

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
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "webview"),
          vscode.Uri.joinPath(extensionUri, "media"),
        ],
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

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables,
    );
  }

  private handleMessage(message: { type: string; state?: CanvasState }) {
    switch (message.type) {
      case "stateChanged":
        if (message.state) {
          this.canvasState = message.state;
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
    const webview = this.panel.webview;
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "webview", "style.css"),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "webview", "main.js"),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Swing GUI Builder - ${this.className}</title>
</head>
<body>
  <div id="app">
    <div id="palette">
      <h3>Components</h3>
      <div class="palette-item" draggable="true" data-type="Button">Button</div>
      <div class="palette-item" draggable="true" data-type="Label">Label</div>
      <div class="palette-item" draggable="true" data-type="TextField">TextField</div>
      <div class="palette-item" draggable="true" data-type="PasswordField">PasswordField</div>
      <div class="palette-item" draggable="true" data-type="TextArea">TextArea</div>
    </div>
    <div id="canvas-container">
      <div id="canvas" style="width: 800px; height: 600px;" data-class-name="${this.className}">
      </div>
    </div>
    <div id="properties-panel">
      <h3>Properties</h3>
      <div id="properties-content">
        <p class="placeholder-text">Select a component to edit its properties</p>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
