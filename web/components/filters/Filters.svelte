<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PageFilters } from '../../interfaces/clickup';
  import AssigneesSelector from '../commons/assignees-selector/AssigneesSelector.svelte';
  import ListSelector from '../commons/list-selector/ListSelector.svelte';
  import AdditionalFilters from './AdditionalFilters.svelte';

  export let filters: PageFilters;
  export let viewMode: boolean;
  export let term: string;

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
        placeholder="Search"
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

    background-color: theme('colors.screen') !important;
    border: 1px solid theme('colors.neutral.700') !important;
  }
</style>
