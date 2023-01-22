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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __vs_svelte_view: string;
}
