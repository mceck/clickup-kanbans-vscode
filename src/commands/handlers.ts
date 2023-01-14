import * as vscode from 'vscode';
import { MainPanel } from '../panels/MainPanel';
import ClickupService from '../services/clickup-service';

export default class Commands {
  constructor(private context: vscode.ExtensionContext) {}

  get handlers() {
    /* eslint-disable @typescript-eslint/naming-convention */
    return Object.entries({
      'clickup-kanban.openKanban': () => this.onOpenKanban(),
      'clickup-kanban.setToken': () => this.setToken(),
      'clickup-kanban.setTeamId': () => this.setTeamId(),
    });
  }
  private onOpenKanban() {
    MainPanel.createOrShow(this.context.extensionUri);
  }

  private async setToken() {
    {
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
        const teams = await ClickupService.getTeams();
        await config.update('teamId', teams[0].id, true);
      }
    }
  }

  private async setTeamId() {
    {
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
    }
  }
}
