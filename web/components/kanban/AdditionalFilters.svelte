<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../commons/Icon.svelte';
  import TagPicker from '../commons/TagPicker.svelte';

  export let filters;

  let collapsed = true;

  const dispatch = createEventDispatcher();

  function onChange() {
    dispatch('change', filters);
  }
</script>

<div class="w-full">
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
    class="overflow-hidden w-full transition-all"
    class:h-0={collapsed}
    class:h-24={!collapsed}
  >
    <div class="flex items-center mt-1">
      <small class="w-10 flex-none">Tags:</small>
      <TagPicker bind:selected={filters.tags} on:change={onChange} />
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
        placeholder="To"
        bind:value={filters.due_date_lt}
        on:change={onChange}
      />
    </div>
  </div>
</div>
