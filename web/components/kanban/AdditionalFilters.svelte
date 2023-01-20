<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PageFilters } from '../../interfaces/clickup';
  import Icon from '../commons/Icon.svelte';
  import StatusPicker from '../commons/StatusPicker.svelte';
  import TagPicker from '../commons/TagPicker.svelte';

  export let viewMode: boolean;
  export let filters: PageFilters;

  let collapsed = true;

  const dispatch = createEventDispatcher();

  function onChange() {
    dispatch('change', filters);
  }
</script>

<div class="w-full text-gray-400 {$$props.class}">
  <div
    class="mt-2 flex float-left items-center cursor-pointer"
    on:click={() => (collapsed = !collapsed)}
  >
    <small class="text-gray-400">More filters...</small>
    <Icon
      name="chevron"
      class={`ml-2 w-4 transform ${!collapsed && 'rotate-180'}`}
    />
  </div>
  <div
    class="overflow-hidden w-full transition-all pt-2 {collapsed
      ? 'h-0'
      : 'h-44'}"
  >
    {#if !viewMode}
      <div class="flex justify-end items-center mt-1">
        <input
          type="checkbox"
          class="mr-1"
          id="inpt-subtasks"
          bind:checked={filters.subtasks}
          on:change={onChange}
        />
        <label for="inpt-subtasks" class="text-sm">subtasks</label>
        <input
          type="checkbox"
          class="mr-1 ml-3"
          id="inpt-closed"
          bind:checked={filters.include_closed}
          on:change={onChange}
        />
        <label for="inpt-closed" class="text-sm">closed</label>
      </div>
    {/if}
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">Tags:</small>
      <TagPicker bind:selected={filters.tags} on:change={onChange} />
    </div>
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">Statuses:</small>
      <StatusPicker bind:selected={filters.statuses} on:change={onChange} />
    </div>
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">From:</small>
      <input
        type="date"
        bind:value={filters.due_date_gt}
        on:change={onChange}
      />
      <small class="ml-2">to:</small>
      <input
        type="date"
        class="ml-2"
        bind:value={filters.due_date_lt}
        on:change={onChange}
      />
    </div>
  </div>
</div>
