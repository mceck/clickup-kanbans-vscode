import * as vscode from 'vscode';
import { MainPanel } from '../panels/MainPanel';
import clickupService from '../services/clickup-service';
import loginService from '../services/login-service';
import { SelectOption } from '../utils/interfaces';

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
    const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
    const teamId = config.get('teamId');
    const currentToken = config.get('token') as string | undefined;
    const token = await vscode.window.showInputBox({
      placeHolder: 'access token...',
      prompt: 'Set Clickup token',
      value: currentToken,
    });
    if (token) {
      loginService.login(token);
    }
  }

  private setTeamId() {
    return loginService.setTeamId();
  }
}
