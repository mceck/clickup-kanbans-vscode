import * as vscode from 'vscode';
import ClickupService from './services/clickup-service';

export default class MessageService {
  clickupService = new ClickupService();

  async onVsMessage(webview: vscode.Webview, data: any) {
    switch (data.type) {
      case 'onInfo': {
        if (!data.value) {
          return;
        }
        vscode.window.showInformationMessage(data.value);
        break;
      }
      case 'onError': {
        if (!data.value) {
          return;
        }
        vscode.window.showErrorMessage(data.value);
        break;
      }
      case 'getUser': {
        const result = await this.clickupService.getUser();
        webview.postMessage({
          ...result,
          nonce: data.nonce,
        });
        break;
      }
    }
  }
}
