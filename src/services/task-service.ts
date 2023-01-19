import * as vscode from 'vscode';
import { exec as e } from 'child_process';
import { SelectOption } from '../utils/interfaces';

function exec(cmd: string): Promise<string> {
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

class TaskService {
  private get cmd() {
    return {
      gitStatus: 'git status --porcelain',
      gitBranches: "git for-each-ref --format '%(refname:short)' refs/heads/",
      gitCurrent: 'git branch --show-current',
      gitCheckout: (name: string, isNew: boolean = false) =>
        `git checkout ${isNew ? '-b ' : ''}${name}`,
    };
  }

  async gitCheckout(customId: string) {
    let res = await exec(this.cmd.gitCurrent);
    if (res.includes(customId)) {
      vscode.window.showInformationMessage(`Already on ${res}`);
      return;
    }

    res = await exec(this.cmd.gitStatus);
    if (res) {
      throw new Error('Stash changes before checkout');
    }

    res = await exec(this.cmd.gitBranches);
    const existingBranch = res.split('\n').find((b) => b.includes(customId));
    if (existingBranch) {
      res = await exec(this.cmd.gitCheckout(existingBranch));
      if (res) {
        throw new Error(res);
      }
      vscode.window.showInformationMessage(`Checkout branch ${existingBranch}`);
    } else {
      const branchType = await vscode.window.showQuickPick(
        this.gitflowOptions(customId)
      );
      if (!branchType) {
        return;
      }
      const branchName = `${branchType.id}/${customId}`;
      res = await exec(this.cmd.gitCheckout(branchName, true));
      if (res) {
        throw new Error(res);
      }
      vscode.window.showInformationMessage(`Created branch ${branchName}`);
    }
  }

  private gitflowOptions(customId: string): SelectOption[] {
    return [
      {
        id: 'feature',
        label: `feature/${customId}`,
        description: `Create new feature branch`,
      },
      {
        id: 'bugfix',
        label: `bugfix/${customId}`,
        description: `Create new bugfix branch`,
      },
      {
        id: 'hotfix',
        label: `hotfix/${customId}`,
        description: `Create new hotfix branch`,
      },
      {
        id: 'release',
        label: `release/${customId}`,
        description: `Create new release branch`,
      },
    ];
  }
}

export default new TaskService();
