import * as vscode from "vscode";
import ClickupService from "./services/clickup-service";

export default class MessageService {
  clickupService = new ClickupService();

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
        error: e?.message || "generic_error",
        nonce,
      });
    }
  }

  onVsMessage(data: any) {
    const { type, ...query } = data;
    switch (type) {
      case "onInfo": {
        if (!query.value) {
          return;
        }
        vscode.window.showInformationMessage(query.value);
        break;
      }
      case "onError": {
        if (!query.value) {
          return;
        }
        vscode.window.showErrorMessage(query.value);
        break;
      }
      case "getUser": {
        const { nonce } = query;
        this.sendResponse(() => this.clickupService.getUser(), nonce);
        break;
      }
      case "getTasks": {
        const { listId, nonce, ...params } = query;
        this.sendResponse(
          () => this.clickupService.getTasks(listId, params),
          nonce
        );
        break;
      }
      case "findTasks": {
        const { nonce, ...params } = query;
        this.sendResponse(() => this.clickupService.findTasks(params), nonce);
        break;
      }
      case "getSpaces": {
        const { nonce } = query;
        this.sendResponse(() => this.clickupService.getSpaces(), nonce);
        break;
      }
      case "getFolders": {
        const { nonce, spaceId } = query;
        this.sendResponse(() => this.clickupService.getFolders(spaceId), nonce);
        break;
      }
      case "getFolderlessLists": {
        const { nonce, spaceId } = query;
        this.sendResponse(
          () => this.clickupService.getFolderlessLists(spaceId),
          nonce
        );
        break;
      }
      case "getList": {
        const { listId, nonce } = query;
        this.sendResponse(() => this.clickupService.getList(listId), nonce);
        break;
      }
      case "getAllUsers": {
        const { nonce } = query;
        this.sendResponse(() => this.clickupService.getAllUsers(), nonce);
        break;
      }
      case "getTimeTracked": {
        const { nonce, taskId, ...params } = query;
        this.sendResponse(
          () => this.clickupService.getTimeTracked(taskId, params),
          nonce
        );
        break;
      }
      case "updateTimeTracked": {
        const { nonce, taskId, intervalId, ...params } = query;
        this.sendResponse(
          () =>
            this.clickupService.updateTimeTracked(taskId, intervalId, params),
          nonce
        );
        break;
      }
      case "createTimeTrack": {
        const { nonce, taskId, ...params } = query;
        this.sendResponse(
          () => this.clickupService.createTimeTrack(taskId, params),
          nonce
        );
        break;
      }
      case "deleteTimeTracked": {
        const { nonce, taskId, intervalId } = query;
        this.sendResponse(
          () => this.clickupService.deleteTimeTracked(taskId, intervalId),
          nonce
        );
        break;
      }
      case "saveConfig": {
        const { nonce, global, ...configuration } = query;
        this.sendResponse(async () => {
          const config = vscode.workspace.getConfiguration(
            "clickup-kanban.config"
          );
          await config.update("vs-config", configuration, global);
          return configuration;
        }, nonce);
        break;
      }
      case "getViewTasks": {
        const { nonce, viewId } = query;
        this.sendResponse(
          () => this.clickupService.getViewTasks(viewId),
          nonce
        );
        break;
      }
      case "getListViews": {
        const { nonce, listId } = query;
        this.sendResponse(
          () => this.clickupService.getListViews(listId),
          nonce
        );
        break;
      }
      case "updateTask": {
        const { nonce, taskId, ...task } = query;
        this.sendResponse(
          () => this.clickupService.updateTask(taskId, task),
          nonce
        );
        break;
      }
      case "showToast": {
        const { nonce, message, scope } = query;
        if (scope === "error") {
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
    }
  }
}
