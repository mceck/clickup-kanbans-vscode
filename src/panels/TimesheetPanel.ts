import * as vscode from 'vscode';
import { FullscreenPanel } from './FullscreenPanel';

export class TimesheetPanel extends FullscreenPanel {
  public static createOrShow(extensionUri: vscode.Uri) {
    return super.createOrShow(
      extensionUri,
      'Clickup Timesheet',
      'kanban.js',
      'kanban.css',
      'timesheet'
    );
  }
}
