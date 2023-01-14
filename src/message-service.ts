import * as vscode from 'vscode';
import ClickupService from './services/clickup-service';

export default class MessageService {
  constructor(private webview: vscode.Webview) {}

  private async sendResponse(fetchData: Function, nonce: string) {
    try {
      const result = await fetchData();
      this.webview.postMessage({
        ok: true,
        data: result,
        nonce,
      });
    } catch (e: any) {
      this.webview.postMessage({
        ok: false,
        error: e?.message || 'generic_error',
        nonce,
      });
    }
  }

  onVsMessage(data: any) {
    const { type, ...query } = data;
    switch (type) {
      case 'onInfo': {
        if (!query.value) {
          return;
        }
        vscode.window.showInformationMessage(query.value);
        break;
      }
      case 'onError': {
        if (!query.value) {
          return;
        }
        vscode.window.showErrorMessage(query.value);
        break;
      }
      case 'getUser': {
        const { nonce } = query;
        this.sendResponse(() => ClickupService.getUser(), nonce);
        break;
      }
      case 'getTasks': {
        const { listId, nonce, ...params } = query;
        this.sendResponse(() => ClickupService.getTasks(listId, params), nonce);
        break;
      }
      case 'findTasks': {
        const { nonce, ...params } = query;
        this.sendResponse(() => ClickupService.findTasks(params), nonce);
        break;
      }
      case 'getSpaces': {
        const { nonce } = query;
        this.sendResponse(() => ClickupService.getSpaces(), nonce);
        break;
      }
      case 'getFolders': {
        const { nonce, spaceId } = query;
        this.sendResponse(() => ClickupService.getFolders(spaceId), nonce);
        break;
      }
      case 'getFolderlessLists': {
        const { nonce, spaceId } = query;
        this.sendResponse(
          () => ClickupService.getFolderlessLists(spaceId),
          nonce
        );
        break;
      }
      case 'getList': {
        const { listId, nonce } = query;
        this.sendResponse(() => ClickupService.getList(listId), nonce);
        break;
      }
      case 'getAllUsers': {
        const { nonce } = query;
        this.sendResponse(() => ClickupService.getAllUsers(), nonce);
        break;
      }
      case 'getTimeTracked': {
        const { nonce, taskId, ...params } = query;
        this.sendResponse(
          () => ClickupService.getTimeTracked(taskId, params),
          nonce
        );
        break;
      }
      case 'updateTimeTracked': {
        const { nonce, taskId, intervalId, ...params } = query;
        this.sendResponse(
          () => ClickupService.updateTimeTracked(taskId, intervalId, params),
          nonce
        );
        break;
      }
      case 'createTimeTrack': {
        const { nonce, taskId, ...params } = query;
        this.sendResponse(
          () => ClickupService.createTimeTrack(taskId, params),
          nonce
        );
        break;
      }
      case 'deleteTimeTracked': {
        const { nonce, taskId, intervalId } = query;
        this.sendResponse(
          () => ClickupService.deleteTimeTracked(taskId, intervalId),
          nonce
        );
        break;
      }
      case 'saveConfig': {
        const { nonce, global, ...configuration } = query;
        this.sendResponse(async () => {
          const config = vscode.workspace.getConfiguration(
            'clickup-kanban.config'
          );
          await config.update('vs-config', configuration, global);
          return configuration;
        }, nonce);
        break;
      }
      case 'getConfig': {
        const { nonce } = query;
        this.sendResponse(async () => {
          const config = vscode.workspace.getConfiguration(
            'clickup-kanban.config'
          );
          return config.get('vs-config');
        }, nonce);
        break;
      }
      case 'getViewTasks': {
        const { nonce, viewId } = query;
        this.sendResponse(() => ClickupService.getViewTasks(viewId), nonce);
        break;
      }
      case 'getListViews': {
        const { nonce, listId } = query;
        this.sendResponse(() => ClickupService.getListViews(listId), nonce);
        break;
      }
      case 'updateTask': {
        const { nonce, taskId, ...task } = query;
        this.sendResponse(() => ClickupService.updateTask(taskId, task), nonce);
        break;
      }
      case 'showToast': {
        const { nonce, message, scope } = query;
        if (scope === 'error') {
          this.sendResponse(
            () => vscode.window.showErrorMessage(message),
            nonce
          );
        } else {
          this.sendResponse(
            () => vscode.window.showInformationMessage(message),
            nonce
          );
        }
        break;
      }
      case 'showStatusMessage': {
        const { nonce, message, delay = 8000 } = query;
        this.sendResponse(
          () =>
            new Promise((r) => {
              const d = vscode.window.setStatusBarMessage(message);
              setTimeout(() => {
                d.dispose();
                r(0);
              }, delay);
            }),
          nonce
        );
        break;
      }
      case 'findTimeTrack': {
        const { nonce, ...params } = query;
        this.sendResponse(() => ClickupService.findTimeTrack(params), nonce);
        break;
      }
      case 'login': {
        const { nonce, token } = query;
        const config = vscode.workspace.getConfiguration('clickup-kanban.auth');
        this.sendResponse(async () => {
          if (!token) {
            throw new Error('token missing');
          }
          await config.update('token', token, true);
          const teams = await ClickupService.getTeams();
          await config.update('teamId', teams[0].id, true);
          return ClickupService.getUser();
        }, nonce);
        break;
      }
    }
  }
}
