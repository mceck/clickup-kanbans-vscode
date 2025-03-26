import BaseService from './base-service';

class ClickupService extends BaseService {
  private async getAllPaginated(path: string, params?: any) {
    let ret: any[] = [];
    let lastPage = false;
    let page = 0;
    const sep = path.includes('?') ? '&' : '?';
    while (!lastPage) {
      const batch = [];
      for (let i = 0; i < 3; i++) {
        batch.push(this.doGet(`${path}${sep}page=${page}`));
        page++;
      }
      const data = await Promise.all(batch);
      lastPage = data.some((d) => d.last_page);
      ret = [...ret, ...data];
    }
    return ret;
  }

  async getUser() {
    const { user } = await this.doGet('/v2/user');
    return user;
  }

  async getTask(taskId: string, params?: any) {
    const task = await this.doGet(
      `/v2/task/${taskId}?${this.toQueryString(params)}`
    );
    return task;
  }

  async getTasks(listId: string, params?: any) {
    const responses = await this.getAllPaginated(
      `/v2/list/${listId}/task?${this.toQueryString(params)}`
    );
    return responses.map((r) => r.tasks).flat();
  }

  async findTasks(params?: any) {
    const responses = await this.getAllPaginated(
      `/v2/team/${this.teamId}/task?${this.toQueryString(params)}`
    );
    return responses.map((r) => r.tasks).flat();
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

  async getTeams() {
    const { teams } = await this.doGet(`/v2/team`);
    return teams;
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

  async updateTimeTracked(taskId: string, intervalId: string, track: any) {
    const resp = await this.doPut(
      `/v2/task/${taskId}/time/${intervalId}`,
      track
    );
    return resp;
  }

  async createTimeTrack(taskId: string, track: any) {
    const resp = await this.doPost(`/v2/task/${taskId}/time`, track);
    return resp;
  }

  async deleteTimeTracked(taskId: string, intervalId: string) {
    const resp = await this.doDelete(`/v2/task/${taskId}/time/${intervalId}`);
    return resp;
  }

  async getViewTasks(viewId: string): Promise<any[]> {
    const responses = await this.getAllPaginated(`/v2/view/${viewId}/task`);
    return responses.map((r) => r.tasks).flat();
  }

  async getListViews(listId: string) {
    const { views } = await this.doGet(`/v2/list/${listId}/view`);
    return views;
  }

  async updateTask(taskId: string, task: any) {
    const result = await this.doPut(`/v2/task/${taskId}`, task);
    return result;
  }

  async findTimeTrack(params: any) {
    const { data } = await this.doGet(
      `/v2/team/${this.teamId}/time_entries?${this.toQueryString(params)}`
    );
    return data;
  }

  async getTaskComments(taskId: string, params?: any) {
    const { comments } = await this.doGet(
      `/v2/task/${taskId}/comment?${this.toQueryString(params)}`
    );
    return comments;
  }

  async createTaskComment(taskId: string, comment: any) {
    return this.doPost(`/v2/task/${taskId}/comment`, comment);
  }

  async getSpaceTags(spaceId: string, params?: any) {
    const { tags } = await this.doGet(
      `/v2/space/${spaceId}/tag?${this.toQueryString(params)}`
    );
    return tags;
  }

  async addTagToTask(taskId: string, tag: string, params?: any) {
    return this.doPost(
      `/v2/task/${taskId}/tag/${tag}?${this.toQueryString(params)}`
    );
  }

  async deleteTagFromTask(taskId: string, tag: string, params?: any) {
    return this.doDelete(
      `/v2/task/${taskId}/tag/${tag}?${this.toQueryString(params)}`
    );
  }
}

export default new ClickupService();
