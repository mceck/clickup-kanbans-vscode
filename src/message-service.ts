import * as vscode from 'vscode';
import ClickupService from './services/clickup-service';

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
        this.sendResponse(() => this.clickupService.getUser(), nonce);
        break;
      }
      case 'getTasks': {
        const { listId, nonce, ...params } = query;
        this.sendResponse(
          () => this.clickupService.getTasks(listId, params),
          nonce
        );
        break;
      }
      case 'findTasks': {
        const { nonce, ...params } = query;
        this.sendResponse(() => this.clickupService.findTasks(params), nonce);
        break;
      }
      case 'getSpaces': {
        const { nonce } = query;
        this.sendResponse(() => this.clickupService.getSpaces(), nonce);
        break;
      }
      case 'getFolders': {
        const { nonce, spaceId } = query;
        this.sendResponse(() => this.clickupService.getFolders(spaceId), nonce);
        break;
      }
      case 'getFolderlessLists': {
        const { nonce, spaceId } = query;
        this.sendResponse(
          () => this.clickupService.getFolderlessLists(spaceId),
          nonce
        );
        break;
      }
      case 'getList': {
        const { listId, nonce } = query;
        this.sendResponse(() => this.clickupService.getList(listId), nonce);
        break;
      }
    }
  }
}
