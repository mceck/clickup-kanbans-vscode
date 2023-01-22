import * as vscode from 'vscode';
import { SidebarPanel } from './panels/SidebarPanel';
import Commands from './commands/handlers';
import { CacheProvider } from './providers/cache-provider';

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "clickup-kanban" is now active!'
  );

  CacheProvider.init(context);
  const sidebarPanel = new SidebarPanel(context.extensionUri);
  const commands = new Commands(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'clickup-kanban-sidebar',
      sidebarPanel
    )
  );

  commands.handlers.forEach(([cmd, fn]) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, fn))
  );
}

export function deactivate() {}
