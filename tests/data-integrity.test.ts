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
  kv?: [string, string][]
  illusts?: { local?: string }[]
  status?: [string, string][]
  triviaZh?: string
  descZh?: string
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

describe('角色 kv 字段完整性（批次 12）', () => {
  const KUNI_KEYS = ['武器种', '所属', '国势', '节庆日', '实装', '擅长地形', '拔魂技巧名', '效果', '拔魂速度']

  it('51 名地魂的 kv 九项齐全（伊予曾缺「武器种」）', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'kunidama') continue
      const kv = Object.fromEntries((c.kv ?? []) as [string, string][])
      const miss = KUNI_KEYS.filter((k) => !(k in kv))
      if (miss.length) bad.push(`${id}: 缺 ${miss.join('/')}`)
    }
    expect(bad).toEqual([])
  })

  it('武器种取值只用原 wiki 出现过的写法', () => {
    // 原 wiki 对同一类存在两种写法：武蔵=砲撃，其余=大砲。按原文保留，不擅自统一数据
    const OK = new Set(['短刀', '刀', '槍', '重装', '弓', '大砲', '砲撃', '術'])
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'kunidama') continue
      const w = Object.fromEntries((c.kv ?? []) as [string, string][])['武器种']
      if (!OK.has(w)) bad.push(`${id}: ${w}`)
    }
    expect(bad).toEqual([])
  })

  it('立绘引用的本地文件都存在', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      for (const il of (c.illusts ?? []) as { local?: string }[]) {
        if (il.local && !fs.existsSync('public' + il.local)) bad.push(`${id}: ${il.local}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('语音表每张的列数一致', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      const rows = (c.voiceMd ?? '').split('\n').filter((r) => r.trim().startsWith('|'))
      if (!rows.length) continue
      const widths = new Set(rows.map((r) => r.trim().replace(/^\||\|$/g, '').split('|').length))
      if (widths.size > 1) bad.push(`${id}: ${[...widths].join('/')}`)
    }
    expect(bad).toEqual([])
  })
})

describe('角色 status 完整性（批次 13）', () => {
  const ST_KEYS = ['HP', '攻击值', '力量', '魂压值', '技巧', '命中', '丰满足', '速度']

  it('51 名地魂的初始能力值八项齐全且顺序一致', () => {
    // 原页把这一项写作「技」或「技術」，早期转换只认「技」，
    // 导致石見・筑前漏了「技巧」（各只有 7 项）
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'kunidama') continue
      const keys = ((c.status ?? []) as [string, string][]).map(([k]) => k)
      if (keys.join(',') !== ST_KEYS.join(',')) bad.push(`${id}: ${keys.join('/')}`)
    }
    expect(bad).toEqual([])
  })

  it('六原职员相馬聯有语音表（曾整块缺失）', () => {
    const soma = chars.find((x) => x.id === 'soma')!
    expect((soma.c.voiceMd ?? '').length).toBeGreaterThan(200)
    expect(soma.c.voiceMd).toContain('资料室')
  })

  it('全站没有原 wiki 的编辑占位提示残留', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      for (const f of ['voiceMd', 'motifZh', 'triviaZh', 'descZh'] as const) {
        const t = (c[f] ?? '') as string
        if (/ここに.*記入|記述してください/.test(t)) bad.push(`${id}.${f}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('译文覆盖与新角色数据（批次 14）', () => {
  it('凡有日文原文的字段都有对应译文', () => {
    // 比「译文字段非空」更准确的判据：原页本来就没写的内容不算漏译
    const bad: string[] = []
    for (const { id, c } of chars) {
      for (const [ja, zh] of [['motif', 'motifZh'], ['trivia', 'triviaZh'], ['desc', 'descZh']] as const) {
        const src = ((c as Record<string, unknown>)[ja] ?? '') as string
        const dst = ((c as Record<string, unknown>)[zh] ?? '') as string
        if (src.trim() && !dst.trim()) bad.push(`${id}.${zh}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('薩摩有语音表（2026/8 新实装，曾整块缺失）', () => {
    const s = chars.find((x) => x.id === 'satsuma')!
    expect((s.c.voiceMd ?? '').length).toBeGreaterThan(500)
    expect(s.c.voiceMd).toContain('切斯托')
  })

  it('六原/妖怪的 kv 非空（アルクトス与 6 名六原职员曾为空）', () => {
    // riku / azukiarai 在原页确实没有属性表（りく为 NPC 式存在、小豆洗い无数据栏），属实
    const NO_KV = ['riku', 'azukiarai']
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type === 'kunidama' || NO_KV.includes(id)) continue
      if (!(c.kv ?? []).length) bad.push(id)
    }
    expect(bad).toEqual([])
  })
})

describe('妖怪与六原职员（批次 15 · 收尾）', () => {
  it('全站语音表统一为四列（分类/场景/子场景/台词）', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      const rows = (c.voiceMd ?? '').split('\n').filter((r) => r.trim().startsWith('|'))
      if (!rows.length) continue
      const w = new Set(rows.map((r) => r.trim().replace(/^\||\|$/g, '').split('|').length))
      if (w.size !== 1 || !w.has(4)) bad.push(`${id}: ${[...w].join('/')}`)
    }
    expect(bad).toEqual([])
  })

  it('夜行先生有语音表与小知识（曾双双缺失）', () => {
    const y = chars.find((x) => x.id === 'yakou-san')!
    expect((y.c.voiceMd ?? '').length).toBeGreaterThan(200)
    expect(y.c.triviaZh).toContain('黑铁')
  })

  it('每个角色都有语音表（原页确无者除外）', () => {
    // 原页「声」一节为空或仅占位的角色
    const NO_VOICE: string[] = []
    const bad = chars.filter((x) => !NO_VOICE.includes(x.id) && !(x.c.voiceMd ?? '').trim())
    expect(bad.map((x) => x.id)).toEqual([])
  })
})
