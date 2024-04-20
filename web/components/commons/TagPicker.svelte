<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { t } from '../../store/i18n';

  export let selected: string[];

  const dispatch = createEventDispatcher();
  let value = '';

  $: {
    value = selected.join(', ');
  }

  function addTag() {
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
    placeholder={$t('global.tags-info')}
    on:blur={addTag}
    on:input={onChange}
  />
</div>
