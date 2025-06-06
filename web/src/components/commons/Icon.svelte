<script lang="ts">
  import addAssignee from '../../assets/add-assignee.svelte';
  import board from '../../assets/board.svelte';
  import chevron from '../../assets/chevron.svelte';
  import clock from '../../assets/clock.svelte';
  import cog from '../../assets/cog.svelte';
  import copy from '../../assets/copy.svelte';
  import clickup from '../../assets/clickup.svelte';
  import edit from '../../assets/edit.svelte';
  import ellipsis from '../../assets/ellipsis.svelte';
  import filter from '../../assets/filter.svelte';
  import folderOpen from '../../assets/folder-open.svelte';
  import folder from '../../assets/folder.svelte';
  import left from '../../assets/left.svelte';
  import refresh from '../../assets/refresh.svelte';
  import save from '../../assets/save.svelte';
  import search from '../../assets/search.svelte';
  import trash from '../../assets/trash.svelte';
  import expand from '../../assets/expand.svelte';
  import collapse from '../../assets/collapse.svelte';
  import check from '../../assets/check.svelte';
  import git from '../../assets/git.svelte';
  import plus from '../../assets/plus.svelte';
  import star from '../../assets/star.svelte';
  import starEmpty from '../../assets/star-empty.svelte';
  import link from '../../assets/link.svelte';
  import gantt from '../../assets/gantt.svelte';

  interface Props {
    name: keyof typeof icons;
    [key: string]: any;
  }

  let { name, ...props }: Props = $props();

  const icons = {
    'add-assignee': addAssignee,
    'folder-open': folderOpen,
    clickup,
    board,
    left,
    chevron,
    clock,
    cog,
    copy,
    edit,
    ellipsis,
    filter,
    folder,
    refresh,
    save,
    search,
    trash,
    expand,
    collapse,
    check,
    git,
    plus,
    link,
    star,
    gantt,
    'star-empty': starEmpty,
  };

  const SvelteComponent = $derived(icons[props.name]);
</script>

<span {...props} style="display: inline-flex;">
  <SvelteComponent />
</span>
