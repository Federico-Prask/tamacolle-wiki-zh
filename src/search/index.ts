/**
 * 站内搜索索引
 *
 * 设计取舍
 * --------
 * 站点是纯静态部署（Cloudflare Pages），没有后端可用。
 * 好在所有页面内容在构建时已经打包进 bundle（src/data/index.ts），
 * 因此索引直接在浏览器里从内存数据建立，不需要额外网络请求、
 * 也不必引入 lunr / fuse 之类的依赖。
 *
 * 中文与日文没有词边界，分词代价高且对本站收益有限，
 * 所以采用「子串匹配 + 字段加权」的策略：
 *   标题命中 > 别名/日文名命中 > 正文命中
 * 再按命中位置微调（越靠前越相关），足以应付 185 个页面的规模。
 */

import { pages } from '../data/index'
import { bySlug, manifest } from '../data/manifest'
import type { Page } from '../data/types'

export interface SearchDoc {
  id: string
  /** 中文标题 */
  title: string
  /** 日文原名 */
  ja: string
  /** 分类（基本情报 / 攻略 / 图鉴 …） */
  cat: string
  /** 供匹配的纯文本正文（已去除 Markdown 标记） */
  text: string
  /** 小写化后的检索字段，避免每次查询重复转换 */
  lcTitle: string
  lcJa: string
  lcText: string
}

export interface SearchHit {
  id: string
  title: string
  ja: string
  cat: string
  score: number
  /** 命中处的上下文片段，用 <mark> 标出关键词 */
  snippet: string
}

/* ------------------------------------------------------------------ *
 * 建索引
 * ------------------------------------------------------------------ */

/** 把 Markdown / 自定义语法压成便于匹配的纯文本 */
function toPlain(md: string): string {
  return (
    md
      // 图片、链接只保留可读文字
      // 注意 alt 里可能含中括号（如 ![[地魂]之心](...)），所以按「最后一个 ]( 」切分
      .replace(/!\[[\s\S]*?\]\([^)]*\)/g, ' ')
      .replace(/\[([^\][]*)\]\([^)]*\)/g, '$1')
      // 自定义行内语法：[color:red]文字[/color] → 文字
      .replace(/\[(?:color|bg|mark|ruby):[^\]]*\]/gi, '')
      .replace(/\[\/(?:color|bg|mark|ruby|spoiler|kbd)\]/gi, '')
      .replace(/\[(?:spoiler|kbd)\]/gi, '')
      // 表格合并标记
      .replace(/\[[\^v<>]\]/g, ' ')
      // 容器围栏
      .replace(/^:::.*$/gm, ' ')
      // HTML 标签
      .replace(/<[^>]+>/g, ' ')
      // 其余 Markdown 记号
      .replace(/[#*`|>_~-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** 角色页的正文散落在多个结构化字段里，拼起来一起检索 */
function charText(p: Page): string {
  const c = p.char
  if (!c) return ''
  // descZh / motifZh / triviaZh 是 Markdown（含 ### 标题等），需先压平
  const parts: string[] = [
    c.nameZh || '',
    c.name || '',
    c.kana || '',
    toPlain(c.descZh || ''),
    toPlain(c.motifZh || ''),
    toPlain(c.triviaZh || ''),
    c.voice || '',
    c.artist || '',
  ]
  for (const [k, v] of c.kv || []) parts.push(`${k} ${v}`)
  for (const t of c.tactics || []) parts.push(`${t.nameZh} ${t.descZh} ${t.condZh}`)
  if (c.voiceMd) parts.push(toPlain(c.voiceMd))
  return parts.filter(Boolean).join(' ')
}

let cachedDocs: SearchDoc[] | null = null

export function buildIndex(): SearchDoc[] {
  if (cachedDocs) return cachedDocs

  const catName: Record<string, string> = {
    about: '基本情报',
    quest: '攻略·任务',
    dex: '图鉴·角色',
    misc: '资料·其他',
  }

  const docs: SearchDoc[] = []
  for (const meta of manifest) {
    const p = pages[meta.slug]
    const title = p?.char?.nameZh || p?.title || meta.zh || meta.slug
    const ja = p?.char?.name || p?.ja || meta.ja || ''
    const text = p ? (p.char ? charText(p) : toPlain(p.body || '')) : ''

    docs.push({
      id: meta.slug,
      title,
      ja,
      cat: catName[meta.cat] || meta.cat,
      text,
      lcTitle: title.toLowerCase(),
      lcJa: ja.toLowerCase(),
      lcText: text.toLowerCase(),
    })
  }
  cachedDocs = docs
  return docs
}

/* ------------------------------------------------------------------ *
 * 查询
 * ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 截取命中处上下文，并高亮全部关键词 */
function makeSnippet(text: string, lcText: string, terms: string[], len = 90): string {
  if (!text) return ''
  // 以第一个命中的词为中心取窗口
  let at = -1
  for (const t of terms) {
    const i = lcText.indexOf(t)
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  if (at === -1) at = 0

  const start = Math.max(0, at - Math.floor(len / 3))
  const end = Math.min(text.length, start + len)
  let seg = text.slice(start, end)
  if (start > 0) seg = '…' + seg
  if (end < text.length) seg = seg + '…'

  // 先转义，再按词插入 <mark>
  let html = escapeHtml(seg)
  for (const t of terms) {
    if (!t) continue
    const re = new RegExp(
      t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi',
    )
    html = html.replace(re, (m) => `<mark>${m}</mark>`)
  }
  return html
}

/**
 * 执行搜索。
 * 多个关键词以空格分隔，需全部命中（AND 语义）。
 */
export function search(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  const docs = buildIndex()
  const hits: SearchHit[] = []

  for (const d of docs) {
    let score = 0
    let matchedAll = true

    for (const t of terms) {
      const inTitle = d.lcTitle.indexOf(t)
      const inJa = d.lcJa.indexOf(t)
      const inText = d.lcText.indexOf(t)

      if (inTitle === -1 && inJa === -1 && inText === -1) {
        matchedAll = false
        break
      }
      // 标题命中权重最高；完全等于标题再加成
      if (inTitle !== -1) {
        score += 100
        if (d.lcTitle === t) score += 60
        if (inTitle === 0) score += 20
      }
      if (inJa !== -1) score += 40
      if (inText !== -1) {
        score += 10
        // 出现次数略微加权，但设上限避免长文霸榜
        const n = d.lcText.split(t).length - 1
        score += Math.min(n, 5)
      }
    }

    if (!matchedAll) continue
    hits.push({
      id: d.id,
      title: d.title,
      ja: d.ja,
      cat: d.cat,
      score,
      snippet: makeSnippet(d.text, d.lcText, terms),
    })
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return hits.slice(0, limit)
}
