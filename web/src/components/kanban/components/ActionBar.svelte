<script lang="ts">
  
  import type { Task } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';

  import Icon from '../../commons/Icon.svelte';
  import { t } from '../../../store/i18n';

  interface Props {
    task: Task;
    statuses: string[];
    expanded: boolean;
    onNext?: (nextStatus: string) => void;
    onPrev?: (nextStatus: string) => void;
    onCheckout?: () => void;
    onExpand?: (expanded: boolean) => void;
  }

  let { task, statuses, expanded, onNext: propsOnNext, onPrev: propsOnPrev, onCheckout: propsOnCheckout, onExpand: propsOnExpand }: Props = $props();
  let currentStatusIdx = $derived(
    statuses.findIndex((s) => task.status.status === s)
  );
  let canPrev = $derived(currentStatusIdx > 0);
  let canNext = $derived(
    currentStatusIdx < statuses.length - 1 && currentStatusIdx >= 0
  );

  function shiftState(n: number) {
    const idx = currentStatusIdx + n;
    if (!statuses[idx]) {
      clickupService.showToast('error', $t('errors.next-status'));
    }
    return statuses[idx];
  }

  async function actionNext() {
    const nextStatus = shiftState(1);
    propsOnNext?.(nextStatus);
  }

  async function actionPrev() {
    const nextStatus = shiftState(-1);
    propsOnPrev?.(nextStatus);
  }

  function gitCheckout() {
    propsOnCheckout?.();
  }

  function actionExpand() {
    propsOnExpand?.(!expanded);
  }
</script>

<div class="relative">
  <div class="grid grid-cols-5 rounded overflow-hidden">
    <button
      class="flex justify-center items-center"
      title={$t('kanban.previous-status')}
      disabled={!canPrev}
      onclick={actionPrev}><Icon class="h-5" name="left" /></button
    >
    <button
      class="flex justify-center items-center"
      title={$t('kanban.checkout-git')}
      onclick={gitCheckout}><Icon class="h-6" name="git" /></button
    >
    <button
      class="flex justify-center items-center"
      title={$t('kanban.expand')}
      onclick={actionExpand}
      ><Icon class="h-6" name={expanded ? 'collapse' : 'expand'} /></button
    >
    <a href={task.url}
      ><button
        class="flex justify-center items-center !w-full !text-[#cccccc] hover:!text-white"
        title={$t('global.go-to-clickup')}
        ><Icon class="h-6" name="clickup" /></button
      ></a
    >
    <button
      class="flex justify-center items-center"
      title={$t('kanban.next-status')}
      disabled={!canNext}
      onclick={actionNext}
      ><Icon class="h-5 rotate-180 transform" name="left" /></button
    >
  </div>
</div>
