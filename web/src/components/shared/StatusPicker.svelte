<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher, onMount } from 'svelte';
  import { t } from '../../store/i18n';

  interface Props {
    selected: string[];
  }

  let { selected = $bindable() }: Props = $props();

  const dispatch = createEventDispatcher();
  let value = $state('');

  run(() => {
    value = selected.join(', ');
  });

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
    placeholder={$t('global.statuses-info')}
    onblur={addStates}
    oninput={onChange}
  />
</div>
