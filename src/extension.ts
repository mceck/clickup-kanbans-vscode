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
      MainPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('clickup-kanban.setToken', async () => {
      const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
      const teamId = config.get('teamId');
      const currentToken = config.get('token') as string | undefined;
      const token = await vscode.window.showInputBox({
        placeHolder: 'access token...',
        prompt: 'Set Clickup token',
        value: currentToken,
      });

      if (token) {
        await config.update('token', token, true);
      }

      if ((token || currentToken) && !teamId) {
        const teams = await new ClickupService().getTeams();
        await config.update('teamId', teams[0].id, true);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('clickup-kanban.setTeamId', async () => {
      const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
      const currentTeamId = config.get('teamId');
      const teamId = await vscode.window.showInputBox({
        placeHolder: 'access token...',
        prompt: 'Set Clickup token',
        value: currentTeamId as string,
      });

      if (teamId) {
        await config.update('teamId', teamId, true);
      }
    })
  );
}

export function deactivate() {}
