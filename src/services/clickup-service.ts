import BaseService from "./base-service";

export default class ClickupService extends BaseService {
  async getUser() {
    const { user } = await this.doGet("/v2/user");
    return user;
  }

  async getTasks(listId: string, params?: any) {
    const { tasks } = await this.doGet(
      `/v2/list/${listId}/task?${this.toQueryString(params)}`
    );
    return tasks;
  }

  async findTasks(params?: any) {
    const { tasks } = await this.doGet(
      `/v2/team/${this.teamId}/task?${this.toQueryString(params)}`
    );
    return tasks;
  }

  async getSpaces() {
    const { spaces } = await this.doGet(`/v2/team/${this.teamId}/space`);
    return spaces;
  }

  async getFolders(spaceId: string) {
    const { folders } = await this.doGet(`/v2/space/${spaceId}/folder`);
    return folders;
  }

  async getFolderlessLists(spaceId: string) {
    const { lists } = await this.doGet(`/v2/space/${spaceId}/list`);
    return lists;
  }

  async getList(listId: string) {
    const list = await this.doGet(`/v2/list/${listId}`);
    return list;
  }

  async getAllUsers() {
    const { teams } = await this.doGet(`/v2/team`);
    const team = teams.find((t: any) => t.id === this.teamId);
    return team.members.map((m: any) => m.user);
  }

  async getTimeTracked(taskId: string, params?: any) {
    const { data } = await this.doGet(
      `/v2/task/${taskId}/time?${this.toQueryString(params)}`
    );
    return data;
  }

  async getViewTasks(viewId: string) {
    const { tasks } = await this.doGet(`/v2/view/${viewId}/task`);
    return tasks;
  }

  async getListViews(listId: string) {
    const { views } = await this.doGet(`/v2/list/${listId}/view`);
    return views;
  }

  async updateTask(taskId: string, task: any) {
    const result = await this.doPut(`/v2/task/${taskId}`, task);
    return result;
  }
}
