import type { WorkspaceConfig } from "../interfaces/clickup";
import type { SpacesTree } from "../store/spaces-tree";

export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export interface ClickupServiceResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export default class ClickupService {
  private sendMessage(obj: any): Promise<ClickupServiceResponse> {
    return new Promise((res, err) => {
      const nonce = getNonce();
      const fn = ({ data }) => {
        if (data.nonce === nonce) {
          clearTimeout(stop);
          window.removeEventListener("message", fn);
          res(data);
        }
      };
      const stop = setTimeout(() => {
        window.removeEventListener("message", fn);
        err("timeout");
      }, 10000);
      const message = { ...obj, nonce };
      window.addEventListener("message", fn);
      webVscode.postMessage(message);
    });
  }

  getUser() {
    return this.sendMessage({ type: "getUser" });
  }

  getTasks(listId: string, params?: any) {
    return this.sendMessage({ type: "getTasks", listId, ...params });
  }

  findTasks(params?: any) {
    return this.sendMessage({ type: "findTasks", ...params });
  }

  getSpaces() {
    return this.sendMessage({ type: "getSpaces" });
  }

  getFolders(spaceId: string) {
    return this.sendMessage({ type: "getFolders", spaceId });
  }

  getFolderlessLists(spaceId: string) {
    return this.sendMessage({ type: "getFolderlessLists", spaceId });
  }

  getList(listId: string) {
    return this.sendMessage({ type: "getList", listId });
  }

  getAllUsers() {
    return this.sendMessage({ type: "getAllUsers" });
  }

  getTimeTracked(taskId: string, params?: any) {
    return this.sendMessage({ type: "getTimeTracked", taskId, ...params });
  }

  updateTimeTracked(taskId: string, intervalId: string, track: any) {
    return this.sendMessage({
      type: "updateTimeTracked",
      taskId,
      intervalId,
      ...track,
    });
  }

  createTimeTrack(taskId: string, track: any) {
    return this.sendMessage({ type: "createTimeTrack", taskId, ...track });
  }

  deleteTimeTracked(taskId: string, intervalId: string) {
    return this.sendMessage({
      type: "deleteTimeTracked",
      taskId,
      intervalId,
    });
  }

  getViewTasks(viewId: string) {
    return this.sendMessage({ type: "getViewTasks", viewId });
  }

  getListViews(listId: string) {
    return this.sendMessage({ type: "getListViews", listId });
  }

  updateTask(taskId: string, task: any) {
    return this.sendMessage({ type: "updateTask", taskId, ...task });
  }

  async saveConfig(config: WorkspaceConfig) {
    const ret = await this.sendMessage({ type: "saveConfig", ...config });
    webVscode.setState({ vsConfig: config });
    return ret;
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
}
