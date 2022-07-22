import { writable, type Writable } from 'svelte/store';

export interface Folder {
  id: string;
  name: string;
  orderindex: number;
  hidden: boolean;
  space: Space;
  task_count: string;
  lists?: List[];
}

export interface Status {
  status: string;
  color: string;
  hide_label: boolean;
}

export interface List {
  id: string;
  name: string;
  orderindex: number;
  content: string;
  status: Status;
  task_count?: number;
  due_date?: number;
  start_date?: number;
  folder?: Folder;
  space: Space;
  archived?: boolean;
}

export interface Space {
  id: string;
  name: string;
  folders?: Folder[];
  lists?: List[];
}

export interface SpacesTree {
  spaces: Space[];
}

const spacesTree: Writable<SpacesTree> = writable<SpacesTree>({
  spaces: [],
});

export { spacesTree };
