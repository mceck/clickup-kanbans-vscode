<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PageFilters } from '../../interfaces/clickup';
  import AssigneesSelector from '../commons/assignees-selector/AssigneesSelector.svelte';
  import ListSelector from '../commons/list-selector/ListSelector.svelte';
  import AdditionalFilters from './AdditionalFilters.svelte';
  import { t } from '../../store/i18n';

  interface Props {
    filters: PageFilters;
    viewMode: boolean;
    term: string;
  }

  let { filters = $bindable(), viewMode, term = $bindable() }: Props = $props();

  const dispatch = createEventDispatcher();
  function search() {
    dispatch('search');
  }
</script>

<div>
  <div class="flex justify-between w-full mt-3">
    <div class="w-36 sm:w-72 flex-none">
      <AssigneesSelector
        bind:selectedAssignees={filters.selectedAssignees}
        on:add={() => viewMode || search()}
        on:remove={() => viewMode || search()}
      />
    </div>
    <div class="w-36 sm:w-80 flex-none">
      <ListSelector
        bind:selectedLists={filters.selectedLists}
        bind:selectedView={filters.selectedView}
        right
        {viewMode}
        on:selectView={() => search()}
        on:selectList={() => search()}
        on:removeList={() => search()}
      />
    </div>
  </div>

  <div class="relative mt-2">
    <span class="w-36 absolute right-0">
      <input
        class="rounded-2xl search-input border"
        placeholder={$t('global.search')}
        bind:value={term}
      />
    </span>
    <AdditionalFilters
      {viewMode}
      bind:filters
      on:change={() => viewMode || search()}
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
