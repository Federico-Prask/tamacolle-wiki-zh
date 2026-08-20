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
import { charBySlug } from '../src/data/characters'

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

  // D12：六原职员的 kv 曾只有 3 项（缺年龄/生日），且键名中日混用、实装日有误。
  it('六原职员的 kv 五项齐全且键顺序一致', () => {
    const NO_KV = ['riku', 'azukiarai']
    const EXPECT = ['实装日', '所属', '年龄', '生日', '担当曜日']
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'rokuhara' || NO_KV.includes(id)) continue
      const keys = (c.kv ?? []).map(([k]) => k)
      if (JSON.stringify(keys) !== JSON.stringify(EXPECT)) bad.push(`${id}: ${keys.join('/')}`)
    }
    expect(bad).toEqual([])
  })

  it('六原职员的年龄与生日均有值，且无日文键名残留', () => {
    const NO_KV = ['riku', 'azukiarai']
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'rokuhara' || NO_KV.includes(id)) continue
      const kv = Object.fromEntries(c.kv ?? [])
      if (!kv['年龄']) bad.push(`${id}: 缺年龄`)
      if (!kv['生日']) bad.push(`${id}: 缺生日`)
      for (const k of ['年齢', '誕生日', '実装日', '実装']) {
        if (k in kv) bad.push(`${id}: 残留日文键名 ${k}`)
      }
    }
    expect(bad).toEqual([])
  })

  // 回原页逐字核对过的实装日，曾有 3 人写错（inomori/hatori 误作 v1.30、kotetsumaru 误作 v1.53）
  // ===== D14 双数据源一致性（批次 25）=====
  // 项目里有两份角色名单：src/data/pages/*.json（列表页用）与 src/data/characters.ts
  // （侧边栏 SideNav 用）。D9-a 改分类时只改了前者，导致侧边栏六原一直显示 8 人。
  // 这是「同一事实存两处」的典型漂移，必须双向锁死。
  it('characters.ts 与角色 JSON 的 type 完全一致', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      const sum = charBySlug[id]
      if (!sum) {
        bad.push(`${id}: characters.ts 中缺失`)
        continue
      }
      if (sum.type !== c.type) bad.push(`${id}: JSON=${c.type} ≠ characters.ts=${sum.type}`)
    }
    expect(bad).toEqual([])
  })

  it('两份名单的三类人数都是 51 / 11 / 10', () => {
    const countJson = (t: string) => chars.filter((x) => x.c.type === t).length
    const countTs = (t: string) => Object.values(charBySlug).filter((c) => c.type === t).length
    for (const [t, n] of [['kunidama', 51], ['rokuhara', 11], ['ayakashi', 10]] as const) {
      expect({ type: t, json: countJson(t) }).toEqual({ type: t, json: n })
      expect({ type: t, ts: countTs(t) }).toEqual({ type: t, ts: n })
    }
  })

  // ===== D13 跨字段交叉校验（批次 24）=====
  // D11/D12 的教训：既有测试只看形式（列数/键数/假名占比），
  // 一张「别人的、但格式完整」的表能全部通过。以下比对字段之间的一致性。

  it('立绘的本地路径前缀与角色 slug 一致', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      for (const il of c.illusts ?? []) {
        const loc = (il as { local?: string }).local ?? ''
        if (!loc) continue
        const base = loc.split('/').pop() ?? ''
        const stem = base.split(/[_.]/)[0]
        if (stem !== id) bad.push(`${id}: ${base}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('图片 URL 里的 wiki 页面名与角色名相符', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      const urls = [c.portrait ?? '', ...(c.illusts ?? []).map((i) => (i as { img?: string }).img ?? '')]
      for (const u of urls) {
        const m = /\/tamacolle\/([^/]+)\/::/.exec(u)
        if (!m) continue
        const page = decodeURIComponent(m[1])
        const name = c.name ?? ''
        if (!page.includes(name) && !name.includes(page)) bad.push(`${id}: URL页=${page}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('羁绊表里不出现其他角色的名字', () => {
    const names = chars.map((x) => x.c.name).filter((n): n is string => !!n && n.length >= 2)
    const bad: string[] = []
    for (const { id, c } of chars) {
      const txt = JSON.stringify(c.bond ?? {})
      for (const other of names) {
        if (other === c.name) continue
        for (const suf of ['の心', 'のLv上限', 'の技術', 'の豊満']) {
          if (txt.includes(other + suf)) bad.push(`${id}: ${other}${suf}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('num（汉数字）与 numInt 一致', () => {
    const CN: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
    const cn2int = (raw: string): number | null => {
      const t = raw.replace('番', '')
      if (!t) return null
      if (t === '十') return 10
      if (t.includes('十')) {
        const [a, b] = t.split('十')
        return (a ? CN[a] ?? 1 : 1) * 10 + (b ? CN[b] ?? 0 : 0)
      }
      return CN[t] ?? null
    }
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (!c.num || c.numInt == null) continue
      const got = cn2int(c.num)
      if (got != null && got !== c.numInt) bad.push(`${id}: ${c.num} vs ${c.numInt}`)
    }
    expect(bad).toEqual([])
  })

  it('地魂的所属必为五畿七道之一', () => {
    const DO = ['东海道', '东山道', '北陆道', '山阴道', '山阳道', '南海道', '西海道', '畿内']
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'kunidama') continue
      const belong = Object.fromEntries(c.kv ?? [])['所属']
      if (!DO.includes(belong)) bad.push(`${id}: ${belong}`)
    }
    expect(bad).toEqual([])
  })

  // 这条能抓住 D11：模拟 echizen 装播磨台词时重合度仅 0.15，正常区间 0.62~1.00
  it('资料室台词与 descZh 指向同一个人', () => {
    const hz = (s: string) => new Set(s.match(/[\u4e00-\u9fff]/g) ?? [])
    const bad: string[] = []
    for (const { id, c } of chars) {
      const dz = c.descZh ?? ''
      const row = (c.voiceMd ?? '').split('\n').find((l) => l.includes('资料室'))
      if (!dz || !row) continue
      const cell = row.trim().replace(/^\||\|$/g, '').split('|').pop()!.trim().replace(/<br>/g, '')
      if (cell.length < 20) continue // 六原的短问候语与 desc 不同源
      const a = hz(cell)
      const b = hz(dz)
      if (!b.size) continue
      let n = 0
      for (const ch of a) if (b.has(ch)) n++
      const ov = n / b.size
      if (ov < 0.4) bad.push(`${id}: ${ov.toFixed(2)}`)
    }
    expect(bad).toEqual([])
  })

  it('六原职员的实装日与原页一致', () => {
    const EXPECT: Record<string, string> = {
      natsuhito: "v1.01 ('22/11/05)",
      inomori: "v1.01 ('22/11/05)",
      hatori: "v1.01 ('22/11/05)",
      hyakuta: "v1.01 ('22/11/05)",
      nekonoya: "v1.01 ('22/11/05)",
      kotetsumaru: "v1.522 ('25/10/31)",
      soma: "v1.521 ('25/7/29)",
      arctos: "v1.521 ('25/7/29)",
    }
    const bad: string[] = []
    for (const [id, want] of Object.entries(EXPECT)) {
      const c = chars.find((x) => x.id === id)?.c
      const got = Object.fromEntries(c?.kv ?? [])['实装日']
      if (got !== want) bad.push(`${id}: ${got} ≠ ${want}`)
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

describe('角色分类与译文覆盖（用户指出的问题）', () => {
  // 原 wiki「ロクハラ/人員一覧」的 11 人
  const ROKUHARA = ['nekonoya', 'natsuhito', 'inomori', 'hatori', 'hyakuta',
    'riku', 'b', 'azukiarai', 'arctos', 'soma', 'kotetsumaru']

  it('六原职员 11 人分类正确（りく・小豆洗い・アルクトス 曾被误标为妖怪）', () => {
    const wrong = ROKUHARA.filter((s) => chars.find((x) => x.id === s)?.c.type !== 'rokuhara')
    expect(wrong).toEqual([])
    const roku = chars.filter((x) => x.c.type === 'rokuhara').map((x) => x.id).sort()
    expect(roku).toEqual([...ROKUHARA].sort())
  })

  it('三类人数与原页一致：51 地魂 / 11 六原 / 10 妖怪', () => {
    const n = (t: string) => chars.filter((x) => x.c.type === t).length
    expect({ kunidama: n('kunidama'), rokuhara: n('rokuhara'), ayakashi: n('ayakashi') })
      .toEqual({ kunidama: 51, rokuhara: 11, ayakashi: 10 })
  })

  it('アルクトス 有通常与毛巾两张立绘', () => {
    const a = chars.find((x) => x.id === 'arctos')!
    const il = (a.c.illusts ?? []) as { local?: string }[]
    expect(il.length).toBe(2)
    expect(il.every((x) => x.local && fs.existsSync('public' + x.local))).toBe(true)
  })

  it('白布的语音已翻译（曾整表为日文原文）', () => {
    const v = chars.find((x) => x.id === 'shirafu')!.c.voiceMd ?? ''
    expect(v).toContain('时装创作者')
    expect(v).not.toContain('ファッションクリエイター')
  })
})

describe('语音译文覆盖（D10）', () => {
  /** 台词列的假名占比：日文原文通常 >0.35，中译接近 0 */
  function kanaRatio(voiceMd: string): number {
    const cells = voiceMd.split('\n').slice(2)
      .filter((r) => r.trim().startsWith('|'))
      .map((r) => r.trim().replace(/^\||\|$/g, '').split('|').pop()!.trim())
    const txt = cells.join(' ')
    const kana = (txt.match(/[ぁ-んァ-ヶ]/g) ?? []).length
    const cjk = (txt.match(/[\u4e00-\u9fff]/g) ?? []).length
    return kana + cjk === 0 ? 0 : kana / (kana + cjk)
  }

  it('全部妖怪与六原职员的语音已翻译', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type === 'kunidama') continue
      const v = c.voiceMd ?? ''
      if (!v) continue
      const r = kanaRatio(v)
      if (r > 0.35) bad.push(`${id}: ${r.toFixed(2)}`)
    }
    expect(bad).toEqual([])
  })

  // D10 已完成：全站 72 张语音表零未翻译。此断言从「只减不增」升级为「必须为零」。
  it('全站没有未翻译的语音表（D10 已完成）', () => {
    const un = chars
      .filter((x) => kanaRatio(x.c.voiceMd ?? '') > 0.35)
      .map((x) => `${x.id}: ${kanaRatio(x.c.voiceMd ?? '').toFixed(2)}`)
    expect(un).toEqual([])
  })

  // D11：曾发现 echizen 的语音表装的是播磨的台词、izumi 的整表是伊豆的复制品。
  // 两条校验防止「张冠李戴」再次发生。
  it('没有两个角色共用同一张语音表', () => {
    const seen = new Map<string, string>()
    const dup: string[] = []
    for (const { id, c } of chars) {
      const v = (c.voiceMd ?? '').trim()
      if (!v) continue
      const prev = seen.get(v)
      if (prev) dup.push(`${prev} == ${id}`)
      else seen.set(v, id)
    }
    expect(dup).toEqual([])
  })

  it('任意两个角色的台词重叠率都不超过 30%', () => {
    const setOf = (c: (typeof chars)[number]['c']) => {
      const out = new Set<string>()
      for (const line of (c.voiceMd ?? '').split('\n')) {
        if (!line.trim().startsWith('|')) continue
        const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim())
        if (cells.length >= 4 && cells[3] && cells[3] !== '台词' && !/^:?-+:?$/.test(cells[3])) {
          out.add(cells[3])
        }
      }
      return out
    }
    const sets = chars.map((x) => ({ id: x.id, s: setOf(x.c) })).filter((x) => x.s.size >= 5)
    const bad: string[] = []
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const a = sets[i]
        const b = sets[j]
        let n = 0
        for (const t of a.s) if (b.s.has(t)) n++
        const ov = n / Math.min(a.s.size, b.s.size)
        if (ov > 0.3) bad.push(`${a.id} ~ ${b.id}: ${ov.toFixed(2)}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('地魂的资料室台词里必须出现自己的名字', () => {
    const bad: string[] = []
    for (const { id, c } of chars) {
      if (c.type !== 'kunidama') continue
      const row = (c.voiceMd ?? '').split('\n').find((l) => l.includes('资料室'))
      if (!row) {
        bad.push(`${id}: 无资料室行`)
        continue
      }
      const name = c.name ?? ''
      const nameZh = c.nameZh ?? ''
      if (!(name && row.includes(name)) && !(nameZh && row.includes(nameZh))) {
        bad.push(`${id}: 资料室台词里没有「${nameZh || name}」`)
      }
    }
    expect(bad).toEqual([])
  })
})
