<script lang="ts">
  // import { createEventDispatcher } from 'svelte'; // Removed
  import Icon from '../commons/Icon.svelte';
  import StatusPicker from '../commons/StatusPicker.svelte';
  import TagPicker from '../commons/TagPicker.svelte';
  import { t } from '../../store/i18n';

  let {
    viewMode = $bindable(),
    filters = $bindable(),
    class: className,
    onChangeFilters, // Added callback prop
  }: { 
    viewMode?: boolean, 
    filters?: any, 
    class?: string, 
    onChangeFilters?: (filters: any) => void 
  } = $props();

  let collapsed = $state(true);

  // const dispatch = createEventDispatcher(); // Removed

  function onChange() {
    onChangeFilters?.(filters);
  }
</script>

<div class="w-full text-gray-400 {className}">
  <div
    class="mt-2 flex float-left items-center cursor-pointer"
    onclick={() => (collapsed = !collapsed)}
  >
    <small class="text-gray-400">{$t('global.more-filters')}</small>
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
          onchange={onChange}
        />
        <label for="inpt-subtasks" class="text-sm"
          >{$t('global.subtasks')}</label
        >
        <input
          type="checkbox"
          class="mr-1 ml-3"
          id="inpt-closed"
          bind:checked={filters.include_closed}
          onchange={onChange}
        />
        <label for="inpt-closed" class="text-sm">{$t('global.closed')}</label>
      </div>
    {/if}
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">{$t('global.tags')}:</small>
      <TagPicker bind:selected={filters.tags} onChange={onChange} />
      {#if viewMode}
          <input
            class="ml-2 w-14!"
            placeholder={$t('global.follow')}
            bind:value={filters.follow}
            onchange={onChange}
          />
      {/if}
    </div>
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">{$t('global.statuses')}:</small>
      <StatusPicker bind:selected={filters.statuses} on:change={onChange} />
    </div>
    <div class="flex items-center mt-2">
      <small class="w-10 flex-none">{$t('global.from')}:</small>
      <input type="date" bind:value={filters.due_date_gt} onchange={onChange} />
      <small class="ml-2">{$t('global.to')}:</small>
      <input
        type="date"
        class="ml-2"
        bind:value={filters.due_date_lt}
        onchange={onChange}
      />
    </div>
  </div>
</div>
