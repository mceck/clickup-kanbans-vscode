/* eslint-disable @typescript-eslint/naming-convention */
import * as _vscode from 'vscode';

interface VsCodePostMessage {
  type: string;
  value: any;
}

declare global {
  const webVscode: {
    postMessage: (VsCodePostMessage) => void;
    getState: () => any;
    setState: (s: any) => void;
  };
  const __vs_svelte_view: 'kanban' | 'timesheet';
  const __vs_svelte_fullscreen: boolean;
}
