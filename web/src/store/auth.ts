import { writable } from 'svelte/store';
import type { User } from '../interfaces/clickup';
import clickupService from '../services/clickup-service';

export const user = writable<User | null>(null);
export const loggedIn = writable<boolean>(true);

export const login = async () => {
  const { data: usr, ok } = await clickupService.getUser();
  user.set(usr);
  loggedIn.set(ok);
  return ok;
};
