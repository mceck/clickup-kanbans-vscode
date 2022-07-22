import { writable, type Writable } from 'svelte/store';
import type { Space } from '../interfaces/clickup';
export interface SpacesTree {
  spaces: Space[];
}
export const spacesTree: Writable<SpacesTree> = writable<SpacesTree>({
  spaces: [],
});
