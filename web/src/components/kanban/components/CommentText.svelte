<script lang="ts">
  import type { Comment, CommentDetail } from '../../../interfaces/clickup';
  import { t } from '../../../store/i18n';
  import Icon from '../../commons/Icon.svelte';

  interface Props {
    comment: Comment;
    [key: string]: any;
  }

  let props: Props = $props();
  let showPreviews = $state(false);

  function isLink(detail: CommentDetail) {
    return (
      ['frame', 'attachment', 'task_mention'].includes(detail.type!) ||
      detail.attributes?.link
    );
  }

  function getLink(detail: CommentDetail) {
    if (detail.type === 'frame') {
      return detail.frame!.url;
    } else if (detail.type === 'attachment') {
      return detail.attachment!.url;
    } else if (detail.type === 'task_mention') {
      const taskId = detail.task_mention?.task_id || detail.text;
      return `https://app.clickup.com/t/${taskId}`;
    }
    return detail.attributes?.link ?? '#';
  }

  function isImage(attachment?: any) {
    return ['image/svg+xml', 'image/png', 'image/jpg'].includes(
      attachment?.mimetype
    );
  }

  function getText(detail: CommentDetail) {
    if (detail.type === 'task_mention') {
      return `Task: ${detail.text}`;
    }
    return detail.text;
  }
  let previews = props.$derived(
    props.comment.comment.filter((e) => isImage(e.attachment))
  );
</script>

<div {...props}>
  {#each props.comment.comment as detail}
    {#if isLink(detail)}
      <a class="link block" href={getLink(detail)}>{getText(detail)}</a>
    {:else if detail.type === 'tag'}
      <span class="link text-sm">{detail.text}</span>
    {:else}
      <span class="text-sm">{detail.text}</span>
    {/if}
  {/each}
  {#if previews.length}
    <div
      class="cursor-pointer text-sm w-full my-2 text-gray-500 flex items-center"
      onclick={() => (showPreviews = !showPreviews)}
    >
      <span>{$t('kanban.attachments-preview')}</span>
      <Icon class="w-4 ml-2 {showPreviews && 'rotate-180'}" name="chevron" />
    </div>
  {/if}
  {#if showPreviews}
    {#each previews as detail}
      <img
        class="min-w-6 max-w-full max-h-20 my-3 mr-3 inline"
        src={detail.attachment.url_w_query ?? detail.attachment.url}
        alt={detail.text}
      />
    {/each}
  {/if}
</div>
