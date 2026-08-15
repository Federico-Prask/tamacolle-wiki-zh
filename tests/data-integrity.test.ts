/**
 * 角色数据完整性
 *
 * 这些用例守护的是「内容」而非「代码」——历史上出过的问题：
 *   - ruby 注音导致台词被拆成碎片（阿呆 / 舁 / 燈…）
 *   - 分节标签被吞进台词单元格（tajima 的 Sleep 小节）
 *   - 原 wiki 的编辑占位符混进正文
 *   - 战法缺图标、遠江整页数据缺失
 * 每条都对应一次真实的修复，防止再犯。
 */

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/markdown/index'

const PAGES_DIR = 'src/data/pages'

interface Tactic {
  name: string
  nameZh: string
  icon?: string
}
interface Char {
  type?: string
  nameZh?: string
  tactics?: Tactic[]
  voiceMd?: string
  motifZh?: string
}
interface Page {
  id: string
  ja?: string
  char?: Char | null
}

const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json'))
const pages: Page[] = files.map(
  (f) => JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf8')) as Page,
)
const chars = pages.filter((p) => p.char).map((p) => ({ id: p.id, c: p.char as Char }))
const withVoice = chars.filter(({ c }) => (c.voiceMd ?? '').trim())

describe('基础结构', () => {
  it('每个页面都有 id', () => {
    for (const p of pages) expect(p.id, JSON.stringify(p).slice(0, 80)).toBeTruthy()
  })

  it('JSON 可解析且角色数符合预期', () => {
    expect(chars.length).toBeGreaterThanOrEqual(70)
  })
})

describe('战法', () => {
  const KNOWN = new Set([
    'まえを攻める',
    'うしろを攻める',
    '素直に攻める',
    '一心不乱に攻める',
    'みんなで攻める',
    '弱いところを攻める',
  ])

  it('所有地魂男儿都有战法（遠江曾整页缺失）', () => {
    const missing = chars
      .filter(({ c }) => c.type === 'kunidama' && !(c.tactics ?? []).length)
      .map(({ id }) => id)
    expect(missing).toEqual([])
  })

  it('战法名都在已知集合内（防止抓到脏数据）', () => {
    for (const { id, c } of chars) {
      for (const t of c.tactics ?? []) {
        expect(KNOWN.has(t.name), `${id}: 未知战法 ${t.name}`).toBe(true)
      }
    }
  })

  it('每条战法都有图标且文件真实存在', () => {
    for (const { id, c } of chars) {
      for (const t of c.tactics ?? []) {
        expect(t.icon, `${id}: ${t.name} 缺 icon`).toBeTruthy()
        const fp = path.join('public', t.icon as string)
        expect(fs.existsSync(fp), `${id}: 图标文件不存在 ${t.icon}`).toBe(true)
      }
    }
  })

  it('同一战法名的中文译法全站一致', () => {
    const map = new Map<string, string>()
    for (const { id, c } of chars) {
      for (const t of c.tactics ?? []) {
        const prev = map.get(t.name)
        if (prev) expect(t.nameZh, `${id}: ${t.name} 译名不一致`).toBe(prev)
        else map.set(t.name, t.nameZh)
      }
    }
  })
})

describe('语音表', () => {
  it('都能渲染成合并表格且无残留标记', () => {
    for (const { id, c } of withVoice) {
      const html = renderMarkdown(c.voiceMd as string)
      expect(html, `${id}: 未渲染成表格`).toContain('tc-table')
      expect(html, `${id}: 残留未解析的合并标记`).not.toMatch(/\[\^\]|\[&lt;\]/)
    }
  })

  it('每行恰好一个末列标记（CSS 靠它区分标签列与台词列）', () => {
    for (const { id, c } of withVoice) {
      const html = renderMarkdown(c.voiceMd as string)
      for (const r of html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
        const n = (r.match(/tc-col-last/g) ?? []).length
        expect(n, `${id}: 某行有 ${n} 个 tc-col-last`).toBe(1)
      }
    }
  })

  it('回归：台词不应被 ruby 注音拆开', () => {
    // 特征：纯汉字片段后面紧跟以平假名（送假名）开头的片段
    const kanjiOnly = /^[\u4e00-\u9fff々]{1,6}$/
    const startsKana = /^[\u3040-\u309f]/
    const bad: string[] = []
    for (const { id, c } of withVoice) {
      for (const line of (c.voiceMd as string).split('\n')) {
        const cells = line.trim().replace(/^\||\|$/g, '').split('|')
        if (cells.length < 2) continue
        const parts = cells[cells.length - 1].split('<br>').map((s) => s.trim())
        for (let i = 0; i < parts.length - 1; i++) {
          if (kanjiOnly.test(parts[i]) && startsKana.test(parts[i + 1])) {
            bad.push(`${id}: 「${parts[i]}」+「${parts[i + 1].slice(0, 10)}」`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('回归：分节标签不应混进台词', () => {
    const LEAK = ['おやすみボイス', '敵対峙', 'Enemy', 'ここにボイス内容']
    for (const { id, c } of withVoice) {
      for (const kw of LEAK) {
        expect((c.voiceMd as string).includes(kw), `${id}: 台词里混入「${kw}」`).toBe(false)
      }
    }
  })

  it('表头列数与数据行一致', () => {
    for (const { id, c } of withVoice) {
      const lines = (c.voiceMd as string).split('\n').filter((l) => l.trim())
      const count = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').length
      const head = count(lines[0])
      for (const l of lines.slice(2)) {
        expect(count(l), `${id}: 列数不一致 → ${l.slice(0, 50)}`).toBe(head)
      }
    }
  })
})

describe('译文', () => {
  it('motifZh 用 ### 标题而非独占一行的粗体（最初的 bug）', () => {
    for (const { id, c } of chars) {
      const md = c.motifZh ?? ''
      if (!md) continue
      for (const line of md.split('\n')) {
        expect(/^\s*\*\*[^*\n]+\*\*\s*$/.test(line), `${id}: 仍有裸粗体标题 ${line}`).toBe(
          false,
        )
      }
    }
  })

  it('motifZh 能正常渲染', () => {
    for (const { id, c } of chars) {
      if (!c.motifZh) continue
      expect(() => renderMarkdown(c.motifZh as string), id).not.toThrow()
    }
  })
})
