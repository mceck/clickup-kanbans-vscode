<script lang="ts">
  import moment from 'moment';
  import Icon from '../../shared/Icon.svelte';
  import { toWeek } from '../../utils/formatters';
  import { t } from '../../../store/i18n';

  interface Props {
    trackedWeek: string;
    onChangeWeek?: (newWeekValue?: string) => void;
  }

  let { trackedWeek = $bindable(), onChangeWeek: propsOnChangeWeek }: Props =
    $props();

  function goWeek(add: number) {
    trackedWeek = toWeek(moment(trackedWeek).add(7 * add, 'days'));
    changeWeek();
  }

  const changeWeek = (e?: any) => {
    propsOnChangeWeek?.(e?.target?.value);
  };
</script>

<div class="flex items-center mt-2 mb-4">
  <p>{$t('global.week')}:</p>
  <span class="cursor-pointer" onclick={() => goWeek(-1)}
    ><Icon name="chevron" class="w-6 rotate-90 ml-2" /></span
  >
  <div class="mx-2 w-56">
    <input type="week" bind:value={trackedWeek} onchange={changeWeek} />
  </div>
  <span class="cursor-pointer" onclick={() => goWeek(1)}
    ><Icon name="chevron" class="w-6 -rotate-90" /></span
  >
</div>
