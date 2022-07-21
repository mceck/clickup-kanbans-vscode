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
}
