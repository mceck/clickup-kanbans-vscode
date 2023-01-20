import * as vscode from 'vscode';
import { exec as e } from 'child_process';

export function exec(cmd: string): Promise<string> {
  return new Promise((res, rej) => {
    try {
      if (!vscode.workspace.workspaceFolders?.length) {
        throw new Error('Open a workspace before executing commands');
      }
      e(
        cmd,
        { cwd: vscode.workspace.workspaceFolders[0].uri.path },
        (err, stdout, stderr) => {
          if (err) {
            throw new Error(stderr);
          }
          res(
            stdout
              ?.split('\n')
              .map((r) => r.trim())
              .join('\n')
          );
        }
      );
    } catch (e) {
      rej(e);
    }
  });
}
