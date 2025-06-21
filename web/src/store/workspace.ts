/* eslint-disable curly */
import { get, writable } from 'svelte/store';
import moment from 'moment';
import type { Space, User } from '../interfaces/clickup';
import clickupService from '../services/clickup-service';

interface SpacesTree {
  spaces: Space[];
}

interface UserList {
  users: User[];
}

export const spacesTree = writable<SpacesTree>({ spaces: [] });
export const userList = writable<UserList>({ users: [] });
export const cacheExpiration = writable<number>(0);
export const initErrors = writable<boolean>(false);

export const loadWorkspaceFromCache = async () => {
  const [s, u, c] = await Promise.all([
    clickupService.getCache('spaces'),
    clickupService.getCache('users'),
    clickupService.getCache('expiration'),
  ]);

  if (s.data) spacesTree.set(s.data);
  if (u.data) userList.set(u.data);
  if (c.data) cacheExpiration.set(c.data);
};

export const refreshWorkspaceData = async () => {
  initErrors.set(false);
  try {
    const [fullTree, usersResp] = await Promise.all([
      clickupService.getAllLists(),
      clickupService.getAllUsers(),
    ]);

    spacesTree.set(fullTree);

    if (usersResp.ok) {
      userList.set({ users: usersResp.data });
    } else {
      throw new Error('Failed to fetch users.');
    }

    // Update cache
    const newExpiration = moment().add(1, 'hour').valueOf();
    cacheExpiration.set(newExpiration);
    await Promise.all([
      clickupService.setCache('spaces', get(spacesTree)),
      clickupService.setCache('users', get(userList)),
      clickupService.setCache('expiration', newExpiration),
    ]);
  } catch (error) {
    console.error(error);
    initErrors.set(true);
  }
};
