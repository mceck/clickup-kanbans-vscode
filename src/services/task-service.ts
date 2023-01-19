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
      gitDevAndPull: (dev: string) => `git checkout ${dev} && git pull`,
    };
  }

  async gitCheckout(customId: string) {
    const currentBranch = await exec(this.cmd.gitCurrent);
    if (currentBranch.includes(customId)) {
      vscode.window.showInformationMessage(`Already on ${currentBranch}`);
      return;
    }

    let res = await exec(this.cmd.gitStatus);
    if (res) {
      throw new Error('Stash changes before checkout');
    }

    const branchList = (await exec(this.cmd.gitBranches)).split('\n');
    const existingBranch = branchList.find((b) => b.includes(customId));
    if (existingBranch) {
      // checkout existing branch
      res = await exec(this.cmd.gitCheckout(existingBranch));
      if (res) {
        throw new Error(res);
      }
      vscode.window.showInformationMessage(`Checkout branch ${existingBranch}`);
    } else {
      // create new branch
      // search develop branch in local branches to checkout from there
      let devBranch: any = 'develop';
      if (!branchList.includes(devBranch)) {
        // not found, manually select
        devBranch = (
          await vscode.window.showQuickPick(
            branchList.map((b) => ({
              id: b,
              label: b,
              description: `Checkout from branch ${b}`,
            }))
          )
        )?.id;
      }
      if (!devBranch) {
        return;
      }

      // select gtiflow branch type
      const branchType = await vscode.window.showQuickPick(
        this.gitflowOptions(customId)
      );
      if (!branchType) {
        return;
      }

      // checkout and pull develop
      await exec(this.cmd.gitDevAndPull(devBranch));
      // checkout new branch
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
