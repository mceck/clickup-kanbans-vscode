import { writable, type Writable } from 'svelte/store';
import type { User } from '../interfaces/clickup';

export interface UserList {
  users: User[];
}
export const userList: Writable<UserList> = writable<UserList>({
  users: [],
});

export const user: Writable<User> = writable<User>({} as any);
