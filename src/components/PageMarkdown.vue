<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  markdown: { type: String, default: '' },
})

marked.setOptions({ gfm: true, breaks: false })

const html = computed(() => {
  if (!props.markdown) return ''
  return marked.parse(props.markdown)
})
</script>

<template>
  <div class="md" v-html="html"></div>
</template>
