<script lang="ts">
  import type { PageFilters } from '../../../interfaces/clickup';
  import AssigneesSelector from '../assignees-selector/AssigneesSelector.svelte';
  import ListSelector from '../list-selector/ListSelector.svelte';
  import AdditionalFilters from './AdditionalFilters.svelte';
  import { t } from '../../../store/i18n';

  interface Props {
    filters: PageFilters;
    viewMode: boolean;
    term: string;
    onSearch?: () => void;
  }

  let {
    filters = $bindable(),
    viewMode,
    term = $bindable(),
    onSearch,
  }: Props = $props();

  function search() {
    onSearch?.();
  }
</script>

<div>
  <div class="flex justify-between w-full mt-3">
    <div class="max-w-36 sm:w-72 flex-none">
      <AssigneesSelector
        bind:selectedAssignees={filters.selectedAssignees}
        onAdd={() => viewMode || search()}
        onRemove={() => viewMode || search()}
      />
    </div>
    <div class="w-36 sm:w-80 flex-none">
      <ListSelector
        bind:selectedLists={filters.selectedLists}
        bind:selectedView={filters.selectedView}
        right
        {viewMode}
        onSelectView={search}
        onSelectList={search}
        onRemoveList={search}
      />
    </div>
  </div>

  <div class="relative mt-2">
    <span class="w-36 absolute right-0">
      <input
        class="!rounded-full search-input border"
        placeholder={$t('global.search')}
        bind:value={term}
      />
    </span>
    <AdditionalFilters
      class=""
      {viewMode}
      bind:filters
      onChangeFilters={() => viewMode || search()}
    />
  </div>
</div>

<style>
  .search-input {
    padding: 0.25rem 1rem !important;

    background-color: #1e1e1e !important;
    border: 1px solid #404040 !important;
  }
</style>
