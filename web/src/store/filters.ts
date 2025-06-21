/* eslint-disable @typescript-eslint/naming-convention */
import { writable, derived, get } from 'svelte/store';
import type { PageFilters, WorkspaceConfig } from '../interfaces/clickup';
import clickupService from '../services/clickup-service';
import { t } from '../store/i18n';

const defaultFilters: PageFilters = {
  name: '',
  default: true,
  selectedLists: [],
  selectedAssignees: [],
  selectedView: null,
  tags: [],
  statuses: [],
  due_date_gt: undefined,
  due_date_lt: undefined,
  subtasks: true,
  include_closed: false,
  allTracking: false,
};

export const mode = writable<'kanban' | 'timesheet'>(
  __vs_svelte_view || 'kanban'
);
export const activeFilters = writable<PageFilters>(defaultFilters);
export const savedFilters = writable<PageFilters[]>([]);
export const viewMode = writable<boolean>(false);
export const ganttMode = writable<boolean>(false);
export const term = writable<string>('');

export const configName = derived(mode, ($mode) =>
  $mode === 'timesheet' ? 'ts-config' : 'vs-config'
);

export const hasFilters = derived(
  activeFilters,
  ($activeFilters) =>
    $activeFilters.selectedAssignees.length ||
    $activeFilters.selectedLists.length ||
    $activeFilters.tags.length ||
    $activeFilters.due_date_gt ||
    $activeFilters.due_date_lt
);

export const initializeFilters = async () => {
  const cfgName = get(configName);
  const { data } = await clickupService.getConfig(cfgName);

  const config: WorkspaceConfig = data ?? { filters: [], ganttMode: false };
  savedFilters.set(config.filters);
  ganttMode.set(config.ganttMode);

  const defFilters = config.filters.find((e) => e.default);
  if (defFilters) {
    activeFilters.set({ ...defaultFilters, ...defFilters });
    if (defFilters.selectedView) {
      viewMode.set(true);
    }
  }
};

export const saveActiveFilter = async (isNew: boolean = false) => {
  let currentFilters = get(activeFilters);
  if (!currentFilters.name) {
    isNew = true;
  }

  if (isNew) {
    const { data } = await clickupService.showInput({
      placeHolder: get(t)('global.configuration-name'),
      prompt: get(t)('global.choose-name'),
      value: '',
    });

    const newName = data.trim();
    if (!newName || get(savedFilters).find((f) => f.name === newName)) {
      clickupService.showToast('error', get(t)('global.invalid-name'));
      return;
    }
    currentFilters.name = newName;
  }

  // Ensure only one default
  const newSavedFilters = get(savedFilters).map((f) => ({
    ...f,
    default: false,
  }));

  const existingIndex = newSavedFilters.findIndex(
    (f) => f.name === currentFilters.name
  );
  if (existingIndex >= 0) {
    newSavedFilters[existingIndex] = { ...currentFilters, default: true };
  } else {
    newSavedFilters.push({ ...currentFilters, default: true });
  }

  const newConfig: WorkspaceConfig = {
    filters: newSavedFilters,
    ganttMode: get(ganttMode),
  };

  const res = await clickupService.saveConfig(
    JSON.parse(JSON.stringify(newConfig)),
    get(configName)
  );
  if (res.ok) {
    savedFilters.set(newConfig.filters);
    activeFilters.set(currentFilters); // Update active filter with new name/status
    clickupService.showToast('info', get(t)('global.configuration-saved'));
  }
};
