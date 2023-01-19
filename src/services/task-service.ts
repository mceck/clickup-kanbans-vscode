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
      gitStash: 'git stash push --include-untracked --quiet',
      gitUnstash: 'git stash apply --quiet',
      gitCheckout: (name: string, isNew: boolean = false) =>
        `git checkout ${isNew ? '-b ' : ''}${name} --quiet`,
      gitDevAndPull: (dev: string) =>
        `git checkout ${dev} --quiet && git pull --quiet`,
    };
  }

  async gitCheckout(customId: string) {
    const currentBranch = await exec(this.cmd.gitCurrent);
    if (currentBranch.includes(customId)) {
      vscode.window.showInformationMessage(`Already on ${currentBranch}`);
      return;
    }

    const stashed = await this.fixGitStatus();

    const branchList = (await exec(this.cmd.gitBranches)).split('\n');
    const existingBranch = branchList.find((b) => b.includes(customId));
    if (existingBranch) {
      // checkout existing branch
      await this.gitCheckoutExisting(existingBranch);
    } else {
      // create new branch
      // search develop branch in local branches to checkout from there
      const devBranch = await this.getDefaultBranch(branchList);
      if (devBranch) {
        // select gitflow branch type feature/bugfix/hotfix...
        const branchType = await vscode.window.showQuickPick(
          this.gitflowOptions(customId)
        );
        if (branchType) {
          // checkout and pull develop
          await this.gitCheckoutPull(devBranch);
          // checkout new branch
          const branchName = `${branchType.id}/${customId}`;
          await this.gitCheckoutNew(branchName);
        }
      }
    }
    if (stashed) {
      await exec(this.cmd.gitUnstash);
    }
    // refresh active terminal
    vscode.window.activeTerminal?.sendText(String.fromCharCode(3));
  }

  private async gitCheckoutNew(branch: string) {
    const res = await exec(this.cmd.gitCheckout(branch, true));
    if (res) {
      throw new Error(res);
    }
    vscode.window.showInformationMessage(`Created branch ${branch}`);
  }

  private async gitCheckoutPull(branch: string) {
    let res = await exec(this.cmd.gitDevAndPull(branch));
    if (res) {
      throw new Error(`Cannot checkout from ${branch}.\n${res}`);
    }
  }

  private async getDefaultBranch(branchList: string[]) {
    if (!branchList.includes('develop')) {
      // not found, manually select
      return (
        await vscode.window.showQuickPick(
          branchList.map((b) => ({
            id: b,
            label: b,
            description: `Checkout from branch ${b}`,
          }))
        )
      )?.id;
    }
    return 'develop';
  }

  private async gitCheckoutExisting(branch: string) {
    const res = await exec(this.cmd.gitCheckout(branch));
    vscode.window.showInformationMessage(res);
  }

  private async fixGitStatus() {
    let res = await exec(this.cmd.gitStatus);
    if (res) {
      if (res.includes('fatal')) {
        throw new Error('Git is not initialized in the current project');
      }
      res = await exec(this.cmd.gitStash);
      if (res) {
        throw new Error('Cannot stash changes, checkout branch manually');
      }
      return true;
    }
    return false;
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
