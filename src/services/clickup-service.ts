import BaseService from './base-service';

export default class ClickupService extends BaseService {
  async getUser() {
    const { user } = await this.doGet('/v2/user');
    return user;
  }
}
