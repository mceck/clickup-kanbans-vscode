import * as vscode from 'vscode';
import MessageService from '../services/message-service';
import * as uuid from 'uuid';
export class FullscreenPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  private static panels = new Map<string, FullscreenPanel>();

  public static readonly viewType = 'swiper';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static get currentPanel() {
    return this.panels.get(this.name);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    title: string,
    js?: string,
    css?: string,
    svelteViewParam?: string
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (this.currentPanel) {
      this.currentPanel.dispose();
      this.panels.delete(this.name);
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      this.viewType,
      title,
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          extensionUri,
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'out', 'compiled'),
        ],
      }
    );

    this.panels.set(
      this.name,
      new FullscreenPanel(
        panel,
        extensionUri,
        this.name,
        js,
        css,
        svelteViewParam
      )
    );
  }

  constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private panelKey: string,
    private js?: string,
    private css?: string,
    private svelteViewParam?: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // // Handle messages from the webview
    const webview = this._panel.webview;
    webview.onDidReceiveMessage((e) =>
      new MessageService(webview).onVsMessage(e)
    );
  }

  public dispose() {
    FullscreenPanel.panels.delete(this.panelKey);

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    let scriptUri;
    if (this.js) {
      scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionUri,
          'web',
          'dist',
          'compiled',
          this.js
        )
      );
    }
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );
    let cssUri;
    if (this.css) {
      cssUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionUri,
          'web',
          'dist',
          'compiled',
          this.css
        )
      );
    }

    // Use a nonce to only allow a specific script to be run.
    const nonce = uuid.v4();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${cssUri || '#'}" rel="stylesheet">
        <script nonce="${nonce}">
        function initVsCode() {
          const vscode = acquireVsCodeApi();
          return vscode;
        }
        const webVscode = initVsCode();
        var __vs_svelte_view = '${this.svelteViewParam ?? ''}';
        </script>
			</head>
      <body>
				<script nonce="${nonce}" src="${scriptUri || '#'}"></script>
			</body>
			</html>`;
  }
}
