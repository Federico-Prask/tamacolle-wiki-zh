/**
 * 魂これ Wiki · 自定义 Markdown 语法扩展
 * ============================================
 * 全部实现为 marked 的自定义扩展（extension），
 * 因此原有 113 个 .md 内容页无需任何改写即可继续工作。
 *
 * 行内语法
 * --------
 *   [color:red]文字[/color]       语义色名或 #rrggbb，自动适配深/浅色主题
 *   [bg:gold]文字[/bg]            背景高亮（马克笔）
 *   [ruby:かな]漢字[/ruby]        振假名（ruby 注音）
 *   [spoiler]剧透内容[/spoiler]   涂黑，悬停/点击显形
 *   [kbd]Ctrl[/kbd]               按键样式
 *   [char:iga]                    角色引用：头像 + 名字 + 站内链接
 *   [char:iga|]                   同上，但只要头像
 *   [char:iga|伊賀]               同上，自定义显示名
 *
 * 块级语法
 * --------
 *   :::info / :::warn / :::note / :::quote-ja
 *   正文
 *   :::
 *
 * 表格合并（在标准 GFM 表格内直接使用）
 * ------------------------------------
 *   [^]  本格并入「上」一格
 *   [v]  本格并入「下」一格
 *   [<]  本格并入「左」一格
 *   [>]  本格并入「右」一格
 *   合并组的内容取自组内唯一的非标记格；组必须构成矩形。
 */

import type { MarkedExtension, Tokens, TokenizerThis, RendererThis } from 'marked'
import { resolveColor, resolveBgColor } from './colors'
import { lookupChar } from './chars'

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 找到与起始标签配对的结束标签位置（支持同名标签嵌套） */
function findClosing(src: string, openRe: RegExp, closeTag: string, from: number): number {
  let depth = 1
  let i = from
  const open = new RegExp(openRe.source, 'gi')
  while (i < src.length) {
    const nextClose = src.indexOf(closeTag, i)
    if (nextClose === -1) return -1
    open.lastIndex = i
    const m = open.exec(src)
    if (m && m.index < nextClose) {
      depth++
      i = m.index + m[0].length
      continue
    }
    depth--
    if (depth === 0) return nextClose
    i = nextClose + closeTag.length
  }
  return -1
}

/* ------------------------------------------------------------------ *
 * 行内：[color:x] / [bg:x]
 * ------------------------------------------------------------------ */

interface ColorToken extends Tokens.Generic {
  type: 'tcColor'
  css: string
  prop: 'color' | 'background'
  tokens: Tokens.Generic[]
}

function makeWrapExtension(
  name: string,
  tag: string,
  prop: 'color' | 'background',
  resolve: (v: string) => string | null,
): MarkedExtension['extensions'] {
  const openRe = new RegExp(`\\[${tag}:([^\\]\\s]+)\\]`, 'i')
  const closeTag = `[/${tag}]`
  return [
    {
      name,
      level: 'inline',
      start(src: string) {
        const i = src.search(new RegExp(`\\[${tag}:`, 'i'))
        return i < 0 ? undefined : i
      },
      tokenizer(this: TokenizerThis, src: string) {
        const m = openRe.exec(src)
        if (!m || m.index !== 0) return undefined
        const bodyStart = m[0].length
        const end = findClosing(src, openRe, closeTag, bodyStart)
        if (end === -1) return undefined
        const css = resolve(m[1])
        if (!css) return undefined // 不认识的颜色 → 原样当普通文本
        const inner = src.slice(bodyStart, end)
        return {
          type: name,
          raw: src.slice(0, end + closeTag.length),
          css,
          prop,
          tokens: this.lexer.inlineTokens(inner),
        } as ColorToken
      },
      renderer(this: RendererThis, token: Tokens.Generic) {
        const t = token as ColorToken
        const inner = this.parser.parseInline(t.tokens as never)
        const cls = t.prop === 'color' ? 'tc-color' : 'tc-bg'
        const style =
          t.prop === 'color'
            ? `color:${t.css}`
            : `background:${t.css}`
        return `<span class="${cls}" style="${escapeHtml(style)}">${inner}</span>`
      },
    },
  ]
}

/* ------------------------------------------------------------------ *
 * 行内：[ruby:かな]漢字[/ruby]
 * ------------------------------------------------------------------ */

const rubyExtension: NonNullable<MarkedExtension['extensions']>[number] = {
  name: 'tcRuby',
  level: 'inline',
  start(src: string) {
    const i = src.indexOf('[ruby:')
    return i < 0 ? undefined : i
  },
  tokenizer(this: TokenizerThis, src: string) {
    const openRe = /\[ruby:([^\]]+)\]/i
    const m = openRe.exec(src)
    if (!m || m.index !== 0) return undefined
    const bodyStart = m[0].length
    const end = findClosing(src, openRe, '[/ruby]', bodyStart)
    if (end === -1) return undefined
    return {
      type: 'tcRuby',
      raw: src.slice(0, end + 7),
      reading: m[1],
      tokens: this.lexer.inlineTokens(src.slice(bodyStart, end)),
    } as Tokens.Generic
  },
  renderer(this: RendererThis, token: Tokens.Generic) {
    const inner = this.parser.parseInline(token.tokens as never)
    return `<ruby class="tc-ruby">${inner}<rp>(</rp><rt>${escapeHtml(
      String(token.reading),
    )}</rt><rp>)</rp></ruby>`
  },
}

/* ------------------------------------------------------------------ *
 * 行内：[spoiler] / [kbd]
 * ------------------------------------------------------------------ */

function makeSimpleTagExtension(
  name: string,
  tag: string,
  render: (inner: string) => string,
): NonNullable<MarkedExtension['extensions']>[number] {
  const openRe = new RegExp(`\\[${tag}\\]`, 'i')
  const closeTag = `[/${tag}]`
  return {
    name,
    level: 'inline',
    start(src: string) {
      const i = src.search(new RegExp(`\\[${tag}\\]`, 'i'))
      return i < 0 ? undefined : i
    },
    tokenizer(this: TokenizerThis, src: string) {
      const m = openRe.exec(src)
      if (!m || m.index !== 0) return undefined
      const bodyStart = m[0].length
      const end = findClosing(src, openRe, closeTag, bodyStart)
      if (end === -1) return undefined
      return {
        type: name,
        raw: src.slice(0, end + closeTag.length),
        tokens: this.lexer.inlineTokens(src.slice(bodyStart, end)),
      } as Tokens.Generic
    },
    renderer(this: RendererThis, token: Tokens.Generic) {
      return render(this.parser.parseInline(token.tokens as never))
    },
  }
}

/* ------------------------------------------------------------------ *
 * 行内：[char:slug] —— 角色引用（头像 + 名字 + 站内链接）
 *
 * 原 wiki 的表格单元格里放的是头像图 + 名字 + 指向角色页的链接，
 * 例如 衣装表、速度表、ハレの日カレンダー。本扩展提供等价写法：
 *
 *   [char:iga]          头像 + 「伊贺」+ 链接（默认，纵向排列）
 *   [char:iga|]         仅头像，不显示名字
 *   [char:iga|伊賀]     自定义显示名（用于原文保留日文名的场合）
 *   [char:伊賀]         也可直接用日文原名或中文名当键
 *
 * 查不到的键会降级成纯文字（外加一个 title 提示），不会炸掉整页。
 * ------------------------------------------------------------------ */

const charRefExtension: NonNullable<MarkedExtension['extensions']>[number] = {
  name: 'tcCharRef',
  level: 'inline',
  start(src: string) {
    const i = src.indexOf('[char:')
    return i < 0 ? undefined : i
  },
  tokenizer(this: TokenizerThis, src: string) {
    const m = /^\[char:([^\]|]+)(?:\|([^\]]*))?\]/.exec(src)
    if (!m) return undefined
    return {
      type: 'tcCharRef',
      raw: m[0],
      key: m[1].trim(),
      // undefined = 用默认名；'' = 显式要求不显示名字
      label: m[2] === undefined ? undefined : m[2].trim(),
    } as Tokens.Generic
  },
  renderer(token: Tokens.Generic) {
    const key = String(token.key)
    const ref = lookupChar(key)
    if (!ref) {
      // 未知角色：保留文字，标注出来便于排查，而不是静默丢失
      return `<span class="tc-charref tc-charref-unknown" title="未知角色引用：${escapeHtml(
        key,
      )}">${escapeHtml(key)}</span>`
    }
    const label = token.label === undefined ? ref.zh : String(token.label)
    const name = label ? `<span class="tc-charref-name">${escapeHtml(label)}</span>` : ''
    const alt = escapeHtml(label || ref.zh)
    return (
      `<a class="tc-charref" href="#/page/${ref.slug}" title="${escapeHtml(ref.zh)}（${escapeHtml(
        ref.ja,
      )}）">` +
      `<img class="tc-charref-icon" src="${ref.icon}" alt="${alt}" loading="lazy" />` +
      name +
      `</a>`
    )
  },
}

/* ------------------------------------------------------------------ *
 * 块级：::: 容器
 * ------------------------------------------------------------------ */

const CONTAINER_CLASS: Record<string, string> = {
  info: 'notice info',
  warn: 'notice warn',
  warning: 'notice warn',
  note: 'notice',
  tip: 'notice info',
  danger: 'notice warn',
  ja: 'tc-ja-block',
  spoiler: 'tc-spoiler-block',
}

const containerExtension: NonNullable<MarkedExtension['extensions']>[number] = {
  name: 'tcContainer',
  level: 'block',
  start(src: string) {
    const i = src.indexOf('\n:::')
    return i < 0 ? undefined : i + 1
  },
  tokenizer(this: TokenizerThis, src: string) {
    const m = /^:::[ \t]*([a-zA-Z-]+)[ \t]*(.*)\n([\s\S]*?)(?:\n:::[ \t]*(?:\n|$)|$)/.exec(src)
    if (!m) return undefined
    const kind = m[1].toLowerCase()
    if (!(kind in CONTAINER_CLASS)) return undefined
    return {
      type: 'tcContainer',
      raw: m[0],
      kind,
      title: m[2].trim(),
      tokens: this.lexer.blockTokens(m[3], []),
    } as Tokens.Generic
  },
  renderer(this: RendererThis, token: Tokens.Generic) {
    const body = this.parser.parse(token.tokens as never)
    const cls = CONTAINER_CLASS[String(token.kind)] || 'notice'
    const title = String(token.title || '')
    const head = title ? `<div class="tc-container-title">${escapeHtml(title)}</div>` : ''
    return `<div class="${cls} tc-container">${head}${body}</div>`
  },
}

/* ------------------------------------------------------------------ *
 * 块级：可合并单元格的表格
 * ------------------------------------------------------------------ */

type Align = 'left' | 'center' | 'right' | null
type Dir = 'up' | 'down' | 'left' | 'right'

const MERGE_MARK: Record<string, Dir> = {
  '[^]': 'up',
  '[v]': 'down',
  '[<]': 'left',
  '[>]': 'right',
  // 全角括号容错（中文输入法常见）
  '［^］': 'up',
  '［v］': 'down',
  '［<］': 'left',
  '［>］': 'right',
}

interface RawCell {
  text: string
  merge: Dir | null
}

interface RenderCell {
  text: string
  tokens: Tokens.Generic[]
  rowspan: number
  colspan: number
  th: boolean
}

interface MergeTableToken extends Tokens.Generic {
  type: 'tcTable'
  header: RenderCell[][]
  body: RenderCell[][]
  align: Align[]
}

const DELIM_RE = /^ {0,3}\|?[ \t]*:?-{1,}:?[ \t]*(\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/

function isDelimiterRow(line: string): boolean {
  return DELIM_RE.test(line) && line.includes('-')
}

/** 按未转义的 | 切分一行 */
function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1)
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '\\' && s[i + 1] === '|') {
      cur += '|'
      i++
      continue
    }
    if (ch === '|') {
      cells.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  cells.push(cur)
  return cells.map((c) => c.trim())
}

function parseCell(text: string): RawCell {
  const key = text.trim().toLowerCase()
  const merge =
    MERGE_MARK[key] ?? MERGE_MARK[text.trim()] ?? null
  return { text: merge ? '' : text, merge }
}

function parseAlign(line: string): Align[] {
  return splitRow(line).map((c) => {
    const l = c.startsWith(':')
    const r = c.endsWith(':')
    if (l && r) return 'center'
    if (r) return 'right'
    if (l) return 'left'
    return null
  })
}

/**
 * 把带合并标记的网格解析为渲染用网格。
 * 算法：每个格子沿标记方向找到最终「宿主」坐标（并查集式路径跟随），
 * 同宿主的格子取包围盒 → 左上角为锚点，宽高即 colspan / rowspan。
 * 若包围盒不是完整矩形（写错了），则退化为不合并，保证不吞内容。
 */
function resolveMerges(grid: RawCell[][], th: boolean, lexer: TokenizerThis['lexer']): RenderCell[][] {
  const rows = grid.length
  if (!rows) return []
  const cols = Math.max(...grid.map((r) => r.length))
  // 补齐成矩形
  for (const r of grid) while (r.length < cols) r.push({ text: '', merge: null })

  const key = (r: number, c: number) => r * cols + c
  const host = new Map<number, number>()

  const step: Record<Dir, [number, number]> = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  }

  function findHost(r: number, c: number, seen = new Set<number>()): number {
    const k = key(r, c)
    if (seen.has(k)) return k // 环 → 就地终止
    seen.add(k)
    const cell = grid[r][c]
    if (!cell.merge) return k
    const [dr, dc] = step[cell.merge]
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return k
    return findHost(nr, nc, seen)
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) host.set(key(r, c), findHost(r, c))
  }

  // 分组
  const groups = new Map<number, number[]>()
  for (const [k, h] of host) {
    const g = groups.get(h)
    if (g) g.push(k)
    else groups.set(h, [k])
  }

  // 计算每个 group 的包围盒并校验矩形
  const spanAt = new Map<number, { rowspan: number; colspan: number }>()
  const covered = new Set<number>()
  for (const [h, members] of groups) {
    const rs = members.map((k) => Math.floor(k / cols))
    const cs = members.map((k) => k % cols)
    const r0 = Math.min(...rs)
    const r1 = Math.max(...rs)
    const c0 = Math.min(...cs)
    const c1 = Math.max(...cs)
    const w = c1 - c0 + 1
    const hgt = r1 - r0 + 1
    const rectangular = members.length === w * hgt
    if (!rectangular) {
      // 写法有误：各自独立成格，避免内容丢失
      continue
    }
    const anchor = key(r0, c0)
    spanAt.set(anchor, { rowspan: hgt, colspan: w })
    // 内容归到锚点：宿主格的文本搬到左上角
    if (anchor !== h) {
      const hr = Math.floor(h / cols)
      const hc = h % cols
      grid[r0][c0] = { text: grid[hr][hc].text, merge: null }
    }
    for (const k of members) if (k !== anchor) covered.add(k)
  }

  const out: RenderCell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: RenderCell[] = []
    for (let c = 0; c < cols; c++) {
      const k = key(r, c)
      if (covered.has(k)) continue
      const span = spanAt.get(k) || { rowspan: 1, colspan: 1 }
      const text = grid[r][c].text
      row.push({
        text,
        tokens: lexer.inlineTokens(text),
        rowspan: span.rowspan,
        colspan: span.colspan,
        th,
      })
    }
    out.push(row)
  }
  return out
}

const mergeTableExtension: NonNullable<MarkedExtension['extensions']>[number] = {
  name: 'tcTable',
  level: 'block',
  start(src: string) {
    const i = src.search(/^ {0,3}\|/m)
    return i < 0 ? undefined : i
  },
  tokenizer(this: TokenizerThis, src: string) {
    const lines = src.split('\n')
    if (!lines.length) return undefined

    let cursor = 0
    let headerLines: string[] = []
    let align: Align[] = []

    if (isDelimiterRow(lines[0]) && lines[0].includes('|')) {
      // 无表头表格：以分隔行开头
      align = parseAlign(lines[0])
      cursor = 1
    } else {
      // 收集表头行（可多行），直到遇到分隔行
      let i = 0
      while (i < lines.length && lines[i].includes('|') && !isDelimiterRow(lines[i])) {
        headerLines.push(lines[i])
        i++
        if (headerLines.length > 4) return undefined
      }
      if (!headerLines.length) return undefined
      if (i >= lines.length || !isDelimiterRow(lines[i])) return undefined
      align = parseAlign(lines[i])
      cursor = i + 1
    }

    const bodyLines: string[] = []
    while (cursor < lines.length) {
      const line = lines[cursor]
      if (!line.trim()) break
      if (!line.includes('|')) break
      bodyLines.push(line)
      cursor++
    }

    const rawLines = [...headerLines]
    if (headerLines.length) rawLines.push(lines[headerLines.length])
    else rawLines.push(lines[0])
    rawLines.push(...bodyLines)
    const raw = rawLines.join('\n')

    const hasMergeMark = /\[[\^v<>]\]|［[\^v<>]］/.test(raw)
    const multiHeader = headerLines.length > 1
    // 没有任何自定义特性时交还给 marked 自带的 GFM 表格（保持既有行为）
    if (!hasMergeMark && !multiHeader && headerLines.length) return undefined

    const header = resolveMerges(
      headerLines.map((l) => splitRow(l).map(parseCell)),
      true,
      this.lexer,
    )
    const body = resolveMerges(
      bodyLines.map((l) => splitRow(l).map(parseCell)),
      false,
      this.lexer,
    )

    return {
      type: 'tcTable',
      raw: raw + (cursor < lines.length ? '\n' : ''),
      header,
      body,
      align,
    } as MergeTableToken
  },
  renderer(this: RendererThis, token: Tokens.Generic) {
    const t = token as MergeTableToken
    // 表格总列数：用于标记「最后一列」
    const ncols = Math.max(
      0,
      ...[...t.header, ...t.body].map((row) =>
        row.reduce((n, c) => n + c.colspan, 0),
      ),
    )
    const cellHtml = (cell: RenderCell, colIndex: number): string => {
      const tag = cell.th ? 'th' : 'td'
      const attrs: string[] = []
      if (cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`)
      if (cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`)
      /*
       * 合并后各行的 td 个数不一致，CSS 的 :nth-child 会错位
       * （续行的第 1 个 td 其实是后面的列），
       * 所以把真实列号写进 class，供样式精确命中。
       */
      const cls = [`tc-col-${colIndex}`]
      if (colIndex + cell.colspan >= ncols) cls.push('tc-col-last')
      attrs.push(`class="${cls.join(' ')}"`)
      const a = t.align[colIndex]
      if (a) attrs.push(`style="text-align:${a}"`)
      const inner = this.parser.parseInline(cell.tokens as never)
      return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${inner}</${tag}>`
    }
    /*
     * 计算每个单元格的真实列号。
     * 不能简单地按本行 td 累加：上面行的 rowspan 会「占住」本行左侧的列，
     * 使本行第 1 个 td 实际落在更靠右的列上。
     * 这里用 occupied 记录被跨行单元格占据的格位，逐列跳过。
     */
    const renderRows = (rows: RenderCell[][]): string => {
      const occupied: number[] = [] // occupied[col] = 还需占据的剩余行数
      return rows
        .map((row) => {
          let col = 0
          const cells = row.map((cell) => {
            while ((occupied[col] || 0) > 0) col++
            const html = cellHtml(cell, col)
            for (let c = col; c < col + cell.colspan; c++) {
              occupied[c] = cell.rowspan
            }
            col += cell.colspan
            return html
          })
          // 本行结束，所有占据计数减 1
          for (let c = 0; c < occupied.length; c++) {
            if (occupied[c] > 0) occupied[c]--
          }
          return `<tr>${cells.join('')}</tr>`
        })
        .join('')
    }

    const thead = t.header.length ? `<thead>${renderRows(t.header)}</thead>` : ''
    const tbody = t.body.length ? `<tbody>${renderRows(t.body)}</tbody>` : ''
    // 外层 wrap 负责窄屏横向滚动，表格自身按内容宽度收缩
    return `<div class="tc-table-wrap"><table class="tc-table">${thead}${tbody}</table></div>\n`
  },
}

/* ------------------------------------------------------------------ *
 * 汇总
 * ------------------------------------------------------------------ */

export const tamacolleExtension: MarkedExtension = {
  extensions: [
    ...(makeWrapExtension('tcColor', 'color', 'color', resolveColor) || []),
    ...(makeWrapExtension('tcBg', 'bg', 'background', resolveBgColor) || []),
    ...(makeWrapExtension('tcMark', 'mark', 'background', resolveBgColor) || []),
    rubyExtension,
    charRefExtension,
    makeSimpleTagExtension(
      'tcSpoiler',
      'spoiler',
      (inner) => `<span class="tc-spoiler" tabindex="0">${inner}</span>`,
    ),
    makeSimpleTagExtension('tcKbd', 'kbd', (inner) => `<kbd class="tc-kbd">${inner}</kbd>`),
    containerExtension,
    mergeTableExtension,
  ],
}
