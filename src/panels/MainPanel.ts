import * as vscode from 'vscode';
import { FullscreenPanel } from './FullscreenPanel';

export class MainPanel extends FullscreenPanel {
  public static createOrShow(extensionUri: vscode.Uri) {
    return FullscreenPanel.createOrShow(extensionUri, 'kanban.js');
  }
}
