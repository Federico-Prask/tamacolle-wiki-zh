import { manifest, categories } from './manifest'
import { charBySlug } from './characters'
import type { Page } from './types'

// —— 内容页：src/content/*.md（frontmatter + markdown 正文）——
const mdModules = import.meta.glob('../content/*.md', { query: '?raw', import: 'default', eager: true })

interface FrontMatter {
  [key: string]: string
}

// 极简 frontmatter 解析（仅支持 "key: value" 简单标量）
function parseFrontmatter(raw: string): { meta: FrontMatter; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: raw }
  const meta: FrontMatter = {}
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key) meta[key] = val
  }
  return { meta, body: m[2] }
}

export const pages: Record<string, Page> = {}

// 1) 内容页（markdown 文件）
for (const path in mdModules) {
  const { meta, body } = parseFrontmatter(mdModules[path] as string)
  const id = meta.id
  if (id) {
    pages[id] = {
      id,
      body,
      title: meta.title || '',
      ja: meta.ja || '',
      source: meta.source || '',
    }
  }
}

// 2) 角色页（结构化 JSON，由 scripts/build_chars.py 生成）
const pageModules = import.meta.glob('./pages/*.json', { eager: true })
for (const path in pageModules) {
  const mod = pageModules[path] as { default?: unknown } | unknown
  const data = (mod && typeof mod === 'object' && 'default' in mod ? (mod as { default: unknown }).default : mod) as Page
  if (data && typeof data === 'object' && data.id) pages[data.id] = data
}

export { manifest, categories, charBySlug }
