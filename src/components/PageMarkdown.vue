<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown, renderProse } from '../markdown'

const props = withDefaults(
  defineProps<{
    /** Markdown 源文本 */
    markdown?: string
    /**
     * prose 模式：单换行也断行。
     * 用于脚本产出的翻译正文（motifZh / triviaZh 等），
     * 它们以单换行分段，不开 breaks 会被挤成一整段。
     */
    prose?: boolean
  }>(),
  { markdown: '', prose: false },
)

const html = computed(() =>
  props.prose ? renderProse(props.markdown) : renderMarkdown(props.markdown),
)
</script>

<template>
  <div class="md" v-html="html"></div>
</template>
