import * as vscode from 'vscode';
import { FullscreenPanel } from './FullscreenPanel';

export class MainPanel extends FullscreenPanel {
  public static createOrShow(extensionUri: vscode.Uri) {
    return super.createOrShow(
      extensionUri,
      'Clickup Kanban',
      'kanban.js',
      'kanban.css',
      'kanban'
    );
  }
}
