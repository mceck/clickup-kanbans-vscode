<script lang="ts">
  import { run } from 'svelte/legacy';

  import { t } from '../../store/i18n';

  interface Props {
    selected: string[];
    onChange?: (value: string) => void;
  }

  let { selected = $bindable(), onChange: propsOnChange }: Props = $props();

  let value = $state('');

  run(() => {
    value = selected.join(', ');
  });

  function addTag() {
    selected = value ? value.split(',').map((e) => e.trim()) : [];
    propsOnChange?.(value);
  }

  function handleInput(e: any) {
    value = e.target.value;
  }
</script>

<div class="w-full">
  <input
    {value}
    placeholder={$t('global.tags-info')}
    onblur={addTag}
    oninput={handleInput}
  />
</div>
