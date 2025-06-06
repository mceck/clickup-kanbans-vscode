import { writable, type Writable } from 'svelte/store';
import type { Tag } from '../interfaces/clickup';

export interface TagList {
  [spaceId: string]: Tag[];
}
export const tagList: Writable<TagList> = writable<TagList>({});
