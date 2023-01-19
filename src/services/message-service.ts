import * as vscode from 'vscode';
import clickupService from './clickup-service';
import loginService from './login-service';
import taskService from './task-service';

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

  onInfo(query: any) {
    if (!query.value) {
      return;
    }
    vscode.window.showInformationMessage(query.value);
  }

  onError(query: any) {
    if (!query.value) {
      return;
    }
    vscode.window.showErrorMessage(query.value);
  }

  getUser(query: any) {
    const { nonce } = query;
    this.sendResponse(() => clickupService.getUser(), nonce);
  }

  getTask(query: any) {
    const { taskId, nonce, ...params } = query;
    this.sendResponse(() => clickupService.getTask(taskId, params), nonce);
  }

  getTasks(query: any) {
    const { listId, nonce, ...params } = query;
    this.sendResponse(() => clickupService.getTasks(listId, params), nonce);
  }

  findTasks(query: any) {
    const { nonce, ...params } = query;
    this.sendResponse(() => clickupService.findTasks(params), nonce);
  }

  getSpaces(query: any) {
    const { nonce } = query;
    this.sendResponse(() => clickupService.getSpaces(), nonce);
  }

  getFolders(query: any) {
    const { nonce, spaceId } = query;
    this.sendResponse(() => clickupService.getFolders(spaceId), nonce);
  }

  getFolderlessLists(query: any) {
    const { nonce, spaceId } = query;
    this.sendResponse(() => clickupService.getFolderlessLists(spaceId), nonce);
  }

  getList(query: any) {
    const { listId, nonce } = query;
    this.sendResponse(() => clickupService.getList(listId), nonce);
  }

  getAllUsers(query: any) {
    const { nonce } = query;
    this.sendResponse(() => clickupService.getAllUsers(), nonce);
  }

  getTimeTracked(query: any) {
    const { nonce, taskId, ...params } = query;
    this.sendResponse(
      () => clickupService.getTimeTracked(taskId, params),
      nonce
    );
  }

  updateTimeTracked(query: any) {
    const { nonce, taskId, intervalId, ...params } = query;
    this.sendResponse(
      () => clickupService.updateTimeTracked(taskId, intervalId, params),
      nonce
    );
  }

  createTimeTrack(query: any) {
    const { nonce, taskId, ...params } = query;
    this.sendResponse(
      () => clickupService.createTimeTrack(taskId, params),
      nonce
    );
  }

  deleteTimeTracked(query: any) {
    const { nonce, taskId, intervalId } = query;
    this.sendResponse(
      () => clickupService.deleteTimeTracked(taskId, intervalId),
      nonce
    );
  }

  saveConfig(query: any) {
    const { nonce, global, ...configuration } = query;
    this.sendResponse(async () => {
      const config = vscode.workspace.getConfiguration('clickup-kanban.config');
      await config.update('vs-config', configuration, global);
      return configuration;
    }, nonce);
  }

  getConfig(query: any) {
    const { nonce } = query;
    this.sendResponse(async () => {
      const config = vscode.workspace.getConfiguration('clickup-kanban.config');
      return config.get('vs-config');
    }, nonce);
  }
  getViewTasks(query: any) {
    const { nonce, viewId } = query;
    this.sendResponse(() => clickupService.getViewTasks(viewId), nonce);
  }

  getListViews(query: any) {
    const { nonce, listId } = query;
    this.sendResponse(() => clickupService.getListViews(listId), nonce);
  }

  updateTask(query: any) {
    const { nonce, taskId, ...task } = query;
    this.sendResponse(() => clickupService.updateTask(taskId, task), nonce);
  }

  showToast(query: any) {
    const { nonce, message, scope } = query;
    if (scope === 'error') {
      this.sendResponse(() => vscode.window.showErrorMessage(message), nonce);
    } else {
      this.sendResponse(
        () => vscode.window.showInformationMessage(message),
        nonce
      );
    }
  }

  showStatusMessage(query: any) {
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
  }

  findTimeTrack(query: any) {
    const { nonce, ...params } = query;
    this.sendResponse(() => clickupService.findTimeTrack(params), nonce);
  }

  login(query: any) {
    const { nonce, token } = query;
    this.sendResponse(() => loginService.login(token), nonce);
  }

  getTaskComments(query: any) {
    const { nonce, taskId, ...params } = query;
    this.sendResponse(
      () => clickupService.getTaskComments(taskId, params),
      nonce
    );
  }

  showInput(query: any) {
    const { nonce, options } = query;
    this.sendResponse(() => vscode.window.showInputBox(options), nonce);
  }

  showSelect(query: any) {
    const { nonce, options } = query;
    this.sendResponse(() => vscode.window.showQuickPick(options), nonce);
  }

  gitCheckout(query: any) {
    const { nonce, customId } = query;
    this.sendResponse(() => taskService.gitCheckout(customId), nonce);
  }

  onVsMessage(data: any) {
    const { type, ...query } = data;
    if (type in this) {
      (this as any)[type](query);
    } else {
      this.sendResponse(() => Promise.reject('method not found'), query.nonce);
    }
  }
}
