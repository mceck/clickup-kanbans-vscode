<script lang="ts">
  import { t } from '../../store/i18n';

  interface Props {
    selected: string[];
    onchange?: (value: string) => void;
  }

  let { selected = $bindable(), onchange }: Props = $props();

  let value = $state(selected.join(', ') || '');

  function addStates() {
    selected = value ? value.split(',').map((e) => e.trim()) : [];
    onchange?.(value);
  }

  function handleChange(e: any) {
    value = e.target.value;
  }
</script>

<div class="w-full">
  <input
    {value}
    placeholder={$t('global.statuses-info')}
    onblur={addStates}
    oninput={handleChange}
  />
</div>
