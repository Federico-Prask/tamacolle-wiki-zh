/**
 * 角色引用表 —— 供 Markdown 的 [char:slug] 语法使用。
 *
 * 原 wiki 的大量表格（衣装表、速度表、ハレの日カレンダー 等）在单元格里
 * 放的是「角色头像 + 名字 + 链接」而不是纯文字。本表把 manifest 里的
 * 71 个角色页与 public/images/chars/ 下的头像文件对应起来，
 * 使 [char:iga] 这样的写法能渲染出与原 wiki 等价的单元格。
 */

import { manifest } from '../data/manifest'
import iconExt from '../data/icon-ext.json'

export interface CharRef {
  slug: string
  /** 中文名（去掉 manifest 里的罗马字括注） */
  zh: string
  /** 日文原名 */
  ja: string
  /** 头像文件的完整站内路径 */
  icon: string
}

const EXT = iconExt as Record<string, string>

/** '伊贺（Iga）' -> '伊贺'；没有括注时原样返回 */
function stripRomaji(zh: string): string {
  const i = zh.indexOf('（')
  return i > 0 ? zh.slice(0, i) : zh
}

const table: Record<string, CharRef> = {}

for (const p of manifest) {
  if (p.kind !== 'char') continue
  const ext = EXT[p.slug] || 'png'
  table[p.slug] = {
    slug: p.slug,
    zh: stripRomaji(p.zh),
    ja: p.ja,
    icon: `/images/chars/${p.slug}_icon.${ext}`,
  }
}

/** 允许用日文原名或中文名反查，方便从原 wiki 直接搬表 */
const aliases: Record<string, string> = {}
for (const slug in table) {
  aliases[table[slug].ja] = slug
  aliases[table[slug].zh] = slug
}

/** 查角色；支持 slug、日文名、中文名三种键。查不到返回 undefined */
export function lookupChar(key: string): CharRef | undefined {
  const k = key.trim()
  if (!k) return undefined
  return table[k] || table[aliases[k]]
}

export { table as charTable }
