/**
 * 站点统一的 Markdown 渲染入口。
 *
 * 所有正文（内容页 .md、角色页 motifZh / triviaZh / 语音表等）
 * 都必须走这里，保证自定义语法在任何地方表现一致。
 */

import { Marked } from 'marked'
import { tamacolleExtension } from './extensions'

const marked = new Marked({ gfm: true, breaks: false })
marked.use(tamacolleExtension)

/** 完整块级渲染（含段落、标题、列表、表格） */
export function renderMarkdown(src: string): string {
  if (!src) return ''
  return marked.parse(src) as string
}

/** 仅行内渲染：用于标题、表格单元格等不希望被包成 <p> 的场合 */
export function renderInline(src: string): string {
  if (!src) return ''
  return marked.parseInline(src) as string
}

/**
 * 渲染「翻译正文」这类由脚本产出的文本。
 * 这类文本用单换行分段、且首行常是 **小标题**，
 * 因此开启 breaks 让单换行变 <br>，更贴近原 wiki 观感。
 */
const markedSoft = new Marked({ gfm: true, breaks: true })
markedSoft.use(tamacolleExtension)

export function renderProse(src: string): string {
  if (!src) return ''
  return markedSoft.parse(src) as string
}

export { marked }
