import type { InputOptions, WorkspaceConfig } from '../interfaces/clickup';
import type { SpacesTree } from '../store/spaces-tree';
import * as uuid from 'uuid';

export interface ClickupServiceResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

class ClickupService {
  private sendMessage(
    obj: any,
    timeout = 10000
  ): Promise<ClickupServiceResponse> {
    return new Promise((res, err) => {
      const nonce = uuid.v4();
      const fn = ({ data }) => {
        if (data.nonce === nonce) {
          clearTimeout(stop);
          window.removeEventListener('message', fn);
          if (!data.ok) {
            this.showToast('error', data.error);
          }
          res(data);
        }
      };
      const stop = setTimeout(() => {
        window.removeEventListener('message', fn);
        err('timeout');
      }, timeout);
      const message = { ...obj, nonce };
      window.addEventListener('message', fn);
      webVscode.postMessage(message);
    });
  }

  getUser() {
    return this.sendMessage({ type: 'getUser' });
  }

  getTask(taskId: string, params?: any) {
    return this.sendMessage({ type: 'getTask', taskId, ...params });
  }

  getTasks(listId: string, params?: any) {
    return this.sendMessage({ type: 'getTasks', listId, ...params });
  }

  findTasks(params?: any) {
    return this.sendMessage({ type: 'findTasks', ...params });
  }

  getSpaces() {
    return this.sendMessage({ type: 'getSpaces' });
  }

  getFolders(spaceId: string) {
    return this.sendMessage({ type: 'getFolders', spaceId });
  }

  getFolderlessLists(spaceId: string) {
    return this.sendMessage({ type: 'getFolderlessLists', spaceId });
  }

  getList(listId: string) {
    return this.sendMessage({ type: 'getList', listId });
  }

  getAllUsers() {
    return this.sendMessage({ type: 'getAllUsers' });
  }

  getTimeTracked(taskId: string, params?: any) {
    return this.sendMessage({ type: 'getTimeTracked', taskId, ...params });
  }

  updateTimeTracked(taskId: string, intervalId: string, track: any) {
    return this.sendMessage({
      type: 'updateTimeTracked',
      taskId,
      intervalId,
      ...track,
    });
  }

  findTimeTrack(params: any) {
    return this.sendMessage({
      type: 'findTimeTrack',
      ...params,
    });
  }

  createTimeTrack(taskId: string, track: any) {
    return this.sendMessage({ type: 'createTimeTrack', taskId, ...track });
  }

  deleteTimeTracked(taskId: string, intervalId: string) {
    return this.sendMessage({
      type: 'deleteTimeTracked',
      taskId,
      intervalId,
    });
  }

  getViewTasks(viewId: string) {
    return this.sendMessage({ type: 'getViewTasks', viewId });
  }

  getListViews(listId: string) {
    return this.sendMessage({ type: 'getListViews', listId });
  }

  updateTask(taskId: string, task: any) {
    return this.sendMessage({ type: 'updateTask', taskId, ...task });
  }

  async saveConfig(
    config: WorkspaceConfig,
    configName: string = 'vs-config',
    global: boolean = true
  ) {
    const ret = await this.sendMessage({
      type: 'saveConfig',
      global,
      configName,
      ...config,
    });
    return ret;
  }

  getConfig(configName: string = 'vs-config') {
    return this.sendMessage({
      type: 'getConfig',
      configName,
    });
  }

  showToast(scope: 'info' | 'error', message: string) {
    return this.sendMessage({ type: 'showToast', scope, message }, 90000);
  }

  showStatusMessage(message: string, delay?: number) {
    return this.sendMessage(
      { type: 'showStatusMessage', message, delay },
      90000
    );
  }

  showInput(options: InputOptions) {
    return this.sendMessage({ type: 'showInput', options }, 90000);
  }

  showSelect(options: InputOptions) {
    return this.sendMessage({ type: 'showSelect', options }, 90000);
  }

  async getAllLists() {
    const spacesTree: SpacesTree = { spaces: [] };
    const { data: spaces } = await this.getSpaces();
    const promises: Promise<any>[] = [];
    spaces.forEach((space) => {
      promises.push(this.getFolders(space.id));
      promises.push(this.getFolderlessLists(space.id));
      spacesTree.spaces.push(space);
    });
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
      if (!results[i].ok) {
        throw new Error(results[i].error);
      }
      const res = results[i].data;
      const space = spacesTree.spaces.find((s) => s?.id === res[0]?.space.id);
      if (!space) {
        continue;
      }
      if (i % 2 === 0) {
        // folders
        space.folders = res;
      } else {
        // folderless lists
        space.lists = res;
      }
    }
    return spacesTree;
  }

  login(token: string) {
    return this.sendMessage({ type: 'login', token });
  }

  getTaskComments(taskId: string, params?: any) {
    return this.sendMessage({ type: 'getTaskComments', taskId, ...params });
  }

  createTaskComment(taskId: string, comment: any) {
    return this.sendMessage({ type: 'getTaskComment', taskId, ...comment });
  }

  gitCheckout(customId: string) {
    return this.sendMessage({ type: 'gitCheckout', customId }, 90000);
  }

  getCache(key: string) {
    return this.sendMessage({ type: 'getCache', key });
  }

  setCache(key: string, value: any) {
    return this.sendMessage({ type: 'setCache', key, value });
  }
}

export default new ClickupService();
