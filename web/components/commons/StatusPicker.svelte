<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let selected: string[];

  const dispatch = createEventDispatcher();
  let value = '';

  $: {
    value = selected.join(', ');
  }

  function addStates() {
    selected = value ? value.split(',').map((e) => e.trim()) : [];
    dispatch('change', value);
  }

  function onChange(e: any) {
    value = e.target.value;
  }
</script>

<div class="w-full">
  <input
    {value}
    placeholder="in progress, done, ..."
    on:blur={addStates}
    on:input={onChange}
  />
</div>
