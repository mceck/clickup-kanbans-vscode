import * as vscode from 'vscode';
import { MainPanel } from './MainPanel';
import ClickupService from './services/clickup-service';
import { SidebarPanel } from './SidebarPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "clickup-kanban" is now active!'
  );
  const sidebarPanel = new SidebarPanel(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'clickup-kanban-sidebar',
      sidebarPanel
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('clickup-kanban.openKanban', () => {
      new ClickupService().getUser().then((u) => {});
      MainPanel.createOrShow(context.extensionUri);
    })
  );

  // context.subscriptions.push(
  //   vscode.commands.registerCommand('clickup-kanban.saveSnippet', async () => {
  //     const { activeTextEditor } = vscode.window;
  //     if (!activeTextEditor) {
  //       vscode.window.showErrorMessage('No active text editor');
  //       return;
  //     }

  //     let text = activeTextEditor.document.getText(activeTextEditor.selection);

  //     if (!text) {
  //       text = activeTextEditor.document.getText();
  //     }

  //     if (!text) {
  //       vscode.window.showErrorMessage('No text selected');
  //       return;
  //     }

  //     await vscode.commands.executeCommand(
  //       'workbench.view.extension.clickup-kanban-sidebar-view'
  //     );

  //     const createNewSnippet = () => {
  //       if (sidebarPanel._view?.visible) {
  //         setTimeout(
  //           () =>
  //             sidebarPanel._view?.webview.postMessage({
  //               type: 'new-snippet',
  //               value: text,
  //             }),
  //           1000
  //         );
  //       } else {
  //         setTimeout(createNewSnippet, 1500);
  //       }
  //     };

  //     createNewSnippet();
  //   })
  // );
}

export function deactivate() {}
