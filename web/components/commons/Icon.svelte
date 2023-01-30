<script lang="ts">
  import addAssignee from '../../assets/add-assignee.svg';
  import board from '../../assets/board.svg';
  import chevron from '../../assets/chevron.svg';
  import clock from '../../assets/clock.svg';
  import cog from '../../assets/cog.svg';
  import copy from '../../assets/copy.svg';
  import clickup from '../../assets/clickup.svg';
  import edit from '../../assets/edit.svg';
  import ellipsis from '../../assets/ellipsis.svg';
  import filter from '../../assets/filter.svg';
  import folderOpen from '../../assets/folder-open.svg';
  import folder from '../../assets/folder.svg';
  import left from '../../assets/left.svg';
  import refresh from '../../assets/refresh.svg';
  import save from '../../assets/save.svg';
  import search from '../../assets/search.svg';
  import trash from '../../assets/trash.svg';
  import expand from '../../assets/expand.svg';
  import collapse from '../../assets/collapse.svg';
  import check from '../../assets/check.svg';
  import git from '../../assets/git.svg';
  import plus from '../../assets/plus.svg';
  import star from '../../assets/star.svg';
  import starEmpty from '../../assets/star-empty.svg';
  import link from '../../assets/link.svg';

  export let name: keyof typeof icons;

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
    'star-empty': starEmpty,
  };
</script>

<svelte:component this={icons[name]} {...$$props} />
