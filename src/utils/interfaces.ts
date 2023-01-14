import { QuickPickItem } from 'vscode';

export interface SelectOption extends QuickPickItem {
  id: string;
}
