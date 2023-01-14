import * as vscode from 'vscode';
import { SelectOption } from '../utils/interfaces';
import clickupService from './clickup-service';

class LoginService {
  async login(token: string) {
    if (!token) {
      throw new Error('token missing');
    }
    await this.setToken(token);
    await this.setTeamId();
    return clickupService.getUser();
  }

  async setToken(token: string) {
    const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
    if (token) {
      await config.update('token', token, true);
      vscode.window.showInformationMessage('token updated');
    }
  }

  async setTeamId() {
    const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
    const teams = await clickupService.getTeams();
    let teamId: any;
    if (teams.length === 0) {
      return;
    } else if (teams.length === 1) {
      teamId = teams[0]?.id;
    } else {
      const selectOptions: SelectOption[] = teams.map((t: any) => ({
        id: t.id,
        label: t.name,
        description: t.id,
      }));
      const r = await vscode.window.showQuickPick(selectOptions);
      teamId = r?.id;
    }
    if (teamId) {
      await config.update('teamId', teamId, true);
      vscode.window.showInformationMessage('teamId updated');
    }
  }
}

export default new LoginService();
