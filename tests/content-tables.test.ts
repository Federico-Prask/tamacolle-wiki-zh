/**
 * 内容页表格结构完整性
 *
 * 对应缺陷 D2：`neta-isho.md` 的角色别服装表曾经表头写 8 列、数据行 12 列，
 * 渲染出来整张表是错位的，而且肉眼看「有个表」就容易放过。
 * 这里对所有 .md 内容页做机械校验，让同类问题不可能再溜过去。
 *
 * 另外守护 D1：服装表等「原 wiki 用头像单元格」的表必须真的含 [char:] 引用，
 * 且不能出现未知角色键。
 */

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/markdown/index'

const CONTENT_DIR = 'src/content'

function stripFrontmatter(src: string): string {
  return src.replace(/^---[\s\S]*?\n---\n/, '')
}

/**
 * 把 Markdown 里连续的 | 开头行切成若干张表。
 *
 * 必须跳过围栏代码块：模板页（tpl-*）和语法说明页会在 ``` 里展示
 * 表格的原始写法，那些 | 行是示例文本而非真表格，
 * 早期版本没跳过，导致 tpl-genchijin.md 被误报为 D6。
 */
function extractTables(md: string): string[][] {
  const tables: string[][] = []
  let cur: string[] = []
  let inFence = false
  const flush = () => {
    if (cur.length) tables.push(cur)
    cur = []
  }
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      flush()
      continue
    }
    if (inFence) continue
    if (line.trimStart().startsWith('|')) {
      cur.push(line.trim())
    } else if (cur.length) {
      flush()
    }
  }
  flush()
  return tables.filter((t) => t.length >= 2)
}

function cellCount(row: string): number {
  return row.replace(/^\||\|$/g, '').split('|').length
}

const files = fs
  .readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({
    name: f,
    md: stripFrontmatter(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')),
  }))

/**
 * 缺陷 D6 已于批次 10 全站清零。
 *
 * 曾有 24 个文件、266 张表、约 3112 个单元格因表头列数不足被 GFM 截断，
 * 在页面上完全不显示。现清单为空，全站强制校验：
 * 任何新增的截断表都会直接让测试失败。
 */
const KNOWN_BROKEN: string[] = JSON.parse(
  fs.readFileSync('tests/known-broken-tables.json', 'utf8'),
)

function hasTruncatedTable(md: string): boolean {
  return extractTables(md).some((rows) => {
    const head = cellCount(rows[0])
    return rows.some((r) => cellCount(r) > head)
  })
}

describe('内容页表格列数一致（缺陷 D2 / D6 的回归测试）', () => {
  it('D6 清单已清空，不得回退', () => {
    expect(KNOWN_BROKEN).toEqual([])
  })

  it('全站没有表头被截断的页面', () => {
    const broken = files.filter((f) => hasTruncatedTable(f.md)).map((f) => f.name)
    expect(broken, '这些页面的表头列数不足，单元格会被静默吞掉').toEqual([])
  })

  it('每张表的所有行列数相同', () => {
    const bad: string[] = []
    for (const { name, md } of files) {
      extractTables(md).forEach((rows, i) => {
        const counts = new Set(rows.map(cellCount))
        if (counts.size !== 1) {
          bad.push(`${name} 第 ${i + 1} 张表：列数 ${[...counts].join('/')}`)
        }
      })
    }
    expect(bad).toEqual([])
  })

  it('表头下方必须紧跟分隔行', () => {
    // dex-ayakashi / dex-kunidama 是纯图标网格，没有表头，属于有意为之
    const GRID_PAGES = ['dex-ayakashi.md', 'dex-kunidama.md']
    const bad: string[] = []
    for (const { name, md } of files) {
      if (GRID_PAGES.includes(name)) continue
      extractTables(md).forEach((rows, i) => {
        if (!/^\|[\s:|-]+\|$/.test(rows[1])) {
          bad.push(`${name} 第 ${i + 1} 张表：第二行不是分隔行 → ${rows[1].slice(0, 40)}`)
        }
      })
    }
    expect(bad).toEqual([])
  })
})

describe('角色引用（缺陷 D1 的回归测试）', () => {
  it('全站没有未知的 [char:] 键', () => {
    const bad: string[] = []
    for (const { name, md } of files) {
      if (!md.includes('[char:')) continue
      const html = renderMarkdown(md)
      for (const m of html.matchAll(/title="未知角色引用：([^"]*)"/g)) {
        bad.push(`${name}: ${m[1]}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('服装表使用头像单元格而非纯文字', () => {
    const md = files.find((f) => f.name === 'neta-isho.md')!.md
    // 51 地魂 + 11 六原 + 环境对应表里的重复引用
    expect((md.match(/\[char:/g) || []).length).toBeGreaterThan(80)
  })
})

describe('服装表内容完整性', () => {
  const md = files.find((f) => f.name === 'neta-isho.md')!.md
  const tables = extractTables(md)

  it('角色别服装表覆盖全部 51 名地魂，含 12 列', () => {
    const t = tables.find((rows) => rows.length > 40)!
    expect(cellCount(t[0])).toBe(12)
    expect(t.length - 2).toBe(51)
  })

  it('六原表覆盖 11 名职员，含 13 列（多一列毛巾）', () => {
    const t = tables.find((rows) => rows.length === 13)!
    expect(cellCount(t[0])).toBe(13)
    expect(t.length - 2).toBe(11)
  })

  it('保留了原 wiki 的合计行', () => {
    expect(md).toContain('71400')
    expect(md).toContain('5000')
  })

  it('包含原 wiki 全部 10 种服装类别', () => {
    for (const k of ['きぐぱ', '春夏服', '秋冬服', '晴服', '泳装', '情人节', '浴衣', '兜裆布', '圣诞', '专用']) {
      expect(md, `缺少服装列：${k}`).toContain(k)
    }
  })
})

describe('小趣闻系列内容完整性（批次 01）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('neta.md 的「きぐぱ履歴」是完整表格，而非一句话概述', () => {
    const md = get('neta.md')
    // 2022-10 起每月一名，共 47 条
    expect((md.match(/\[char:/g) || []).length).toBe(47)
    for (const y of ['2022 年', '2023 年', '2024 年', '2025 年', '2026 年']) {
      expect(md, `缺少年份表：${y}`).toContain(y)
    }
  })

  it('neta.md 保留原页全部四个小趣闻分节', () => {
    const md = get('neta.md')
    for (const h of ['### 御座所相关', '### 角色相关', '### 战斗相关', '### 其他相关']) {
      expect(md, `缺少分节：${h}`).toContain(h)
    }
  })

  it('neta-cutin.md 含 51 名地魂的 Cut-in 图与技名', () => {
    const md = get('neta-cutin.md')
    expect((md.match(/img class="cutin"/g) || []).length).toBe(51)
    // 两张表各 51 行 → 102 处角色引用
    expect((md.match(/\[char:/g) || []).length).toBe(102)
    // 曾经缺失的两名
    expect(md).toContain('郷戒')
    expect(md).toContain('緋色咲')
  })

  it('Cut-in 图片文件都真实存在', () => {
    const md = get('neta-cutin.md')
    const missing = [...md.matchAll(/src="(\/images\/cutin\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((p) => !fs.existsSync('public' + p))
    expect(missing).toEqual([])
  })
})

describe('印章集（批次 01）', () => {
  const md = files.find((f) => f.name === 'neta-hanko.md')!.md

  it('印章图片文件都真实存在（原本 49 张引用全部指向不存在的文件）', () => {
    const refs = [...md.matchAll(/src="(\/images\/seal\/[^"]+)"/g)].map((m) => m[1])
    expect(refs.length).toBe(50)
    expect(refs.filter((p) => !fs.existsSync('public' + p))).toEqual([])
  })

  it('按番号网格排列，且每名地魂都有条目', () => {
    expect(md).toContain('**一番**')
    expect(md).toContain('**七十六番**')
    // 51 名地魂：50 张印章 + 萨摩（原 wiki 尚无印章）
    expect((md.match(/\[char:/g) || []).length).toBe(51)
  })

  it('图注是角色名而非罗马字 slug', () => {
    expect(md).not.toMatch(/<figcaption>[a-z]+<\/figcaption>/)
  })
})

describe('噬魂集（批次 01）', () => {
  const md = files.find((f) => f.name === 'neta-kuu.md')!.md

  it('还原原页的 11 个分类小节（原本 68 张图无分类平铺）', () => {
    for (const h of [
      '球型（ボール型）', '史莱姆型（スライム型）', '摩罗神型（マーラ様型）',
      '兽型（ケモノ型）', '动物型（ドウブツ型）', '人型（ヒト型）',
      '幽灵型（ユウレイ型）', '现象型（ゲンショウ型）', '合体型（ガッタイ型）',
      '力士型（リキシ型）', '现地人（現地人）',
    ]) {
      expect(md, `缺少分节：${h}`).toContain(h)
    }
  })

  it('图片按原始文件名组织，且全部存在', () => {
    const refs = [...md.matchAll(/src="(\/images\/kuu\/[^"]+)"/g)].map((m) => m[1])
    expect(refs.length).toBe(68)
    expect(refs.filter((p) => !fs.existsSync('public' + p))).toEqual([])
    // 不能再出现无意义的 kuu_N 命名
    expect(md).not.toMatch(/kuu_\d+\.jpg/)
  })

  it('保留原页「名称均为暂定」的免责说明', () => {
    expect(md).toContain('（暂定）')
    expect(md).toContain('作中并未出现敌人的名称')
  })
})

describe('资料·其他（批次 02）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('人气 100 / 今日 100 说明的是页面访问计数，不是角色人气', () => {
    for (const n of ['ranking.md', 'today100.md']) {
      const md = get(n)
      expect(md, `${n} 应说明是页面浏览量`).toContain('参照次数')
      expect(md, `${n} 应澄清与角色人气无关`).toContain('与角色人气投票无关')
    }
  })

  it('本站自建页不冒充原 wiki 页面', () => {
    const md = get('wiki-syntax.md')
    // 原 wiki 并不存在「本Wiki拡張記法」这一页，不能挂假的日文原名
    expect(md).not.toContain('本Wiki拡張記法')
    expect(md).toContain('原 Wiki 没有对应页面')
  })

  it('妖怪帮助页的加入时期用表格一一对应活动与角色', () => {
    const md = get('help-ayakashi.md')
    // 剧情 5 + 情人节 1 + 夏日祭 3 + 泳装 1 = 10
    expect((md.match(/\[char:/g) || []).length).toBe(10)
    // 曾经把活动名与角色名拆成两条互不对应的列表
    expect(md).toContain('| [char:zashikiwarashi] |')
    expect(md).toContain('雪消之丘')
  })

  it('模板页保留可复制的骨架，而非仅一句描述', () => {
    const md = get('tpl-genchijin.md')
    expect(md).toContain('```')
    expect(md).toContain('資料室説明')
  })
})

describe('基本情报（批次 03）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('掉落表已脱离 D6：表头用合并语法，列数一致', () => {
    const md = get('drop-table.md')
    // 每个「战斗」横跨前列/后列两栏，用 [<] 向左合并
    expect(md).toContain('[<]')
    // 表头不再残留未翻译的日文
    expect(md).not.toContain('敵配置とドロップ')
    for (const rows of extractTables(md)) {
      expect(new Set(rows.map(cellCount)).size, `列数不一致：${rows[0].slice(0, 40)}`).toBe(1)
    }
  })

  it('掉落表的说明文字不再被挤进标题里', () => {
    const md = get('drop-table.md')
    for (const line of md.split('\n')) {
      if (!line.startsWith('###')) continue
      expect(line.length, `标题过长，说明被挤进标题：${line.slice(0, 50)}`).toBeLessThan(40)
    }
  })

  it('抽卡出货率表的 5 行各带物品图标', () => {
    const md = get('gacha.md')
    // 表内图标用 <img class="gacha-icon">：地魂 + 小/中/大/稀有大魂守 = 5 行
    const icons = [...md.matchAll(/<img class="gacha-icon" src="([^"]+)"/g)].map((m) => m[1])
    expect(icons.length).toBe(5)
    expect(icons.filter((p) => !fs.existsSync('public' + p))).toEqual([])
  })

  it('gacha 页引用的全部图片都存在（含 Markdown ![]() 语法的 3 张）', () => {
    const md = get('gacha.md')
    const all = [
      ...[...md.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]),
      ...[...md.matchAll(/!\[[^\]]*\]\((\/images\/[^)]+)\)/g)].map((m) => m[1]),
    ]
    expect(all.length).toBe(8)
    expect(all.filter((p) => !fs.existsSync('public' + p))).toEqual([])
  })
})

describe('周边情报（批次 04）', () => {
  const md = files.find((f) => f.name === 'goods.md')!.md

  it('已脱离 D6：17 张表列数全部一致', () => {
    const tables = extractTables(md)
    expect(tables.length).toBe(17)
    for (const rows of tables) {
      expect(new Set(rows.map(cellCount)).size, `列数不一致：${rows[0].slice(0, 40)}`).toBe(1)
    }
  })

  it('活动名列没有在修表时被误删', () => {
    // 这几个活动名曾因我的批量脚本左移一列而整列丢失
    for (const ev of ['けもケット13', 'けもケット14', 'けもケット15', 'ブースト！3', '新春けもケット10']) {
      expect(md, `活动名丢失：${ev}`).toContain(ev)
    }
  })

  it('表头不含 [^]（表头没有上一行可合并）', () => {
    for (const rows of extractTables(md)) {
      expect(rows[0]).not.toContain('[^]')
    }
  })

  it('地魂阵容用头像引用，且无未知角色', () => {
    expect((md.match(/\[char:/g) || []).length).toBeGreaterThan(70)
    const html = renderMarkdown(md)
    expect([...html.matchAll(/title="未知角色引用：([^"]*)"/g)].map((m) => m[1])).toEqual([])
  })
})

describe('主线剧情（批次 05）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('索引页补回原页「概要」的重读与 BOSS 机制说明', () => {
    const md = get('main-story.md')
    expect(md).toContain('战斗只会发生一次')
    expect(md).toContain('累积伤害直到削完 BOSS 的 HP')
  })

  it('索引页的各话标题带原页的副题', () => {
    const md = get('main-story.md')
    for (const t of ['启程之旅 甲州街道', '传递心愿 讃岐街道', '强者们的雪路 北陆道']) {
      expect(md, `话数标题不完整：${t}`).toContain(t)
    }
  })

  it('三话的登场人物用头像引用而非纯文字链接', () => {
    const expected: Record<string, number> = { 'main-1.md': 3, 'main-2.md': 4, 'main-3.md': 4 }
    for (const [name, n] of Object.entries(expected)) {
      const md = get(name)
      expect((md.match(/\[char:/g) || []).length, name).toBe(n)
      expect(md, `${name} 仍有纯文字角色链接`).not.toMatch(/\| \[[^\]]+\]\(#\/page\/(shinano|sanuki|echizen)\)/)
    }
  })

  it('主线页引用的图片都存在', () => {
    for (const name of ['main-1.md', 'main-2.md', 'main-3.md']) {
      const md = get(name)
      const imgs = [...md.matchAll(/(?:src="|!\[[^\]]*\]\()(\/images\/[^")]+)/g)].map((m) => m[1])
      expect(imgs.filter((p) => !fs.existsSync('public' + p)), name).toEqual([])
    }
  })
})

describe('支线剧情（批次 06）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('索引页补回原页「概要」的重读机制说明', () => {
    const md = get('side-story.md')
    expect(md).toContain('战斗只会发生一次')
    expect(md).toContain('妖怪')
  })

  it('索引页按实装顺排列并保留「与游戏内排列不同」的警告', () => {
    const md = get('side-story.md')
    expect(md).toContain('与游戏内的排列不同')
    // 零卷目（β 版复刻）排在三卷目之后，是原页的实装顺
    const zero = md.indexOf('零卷目')
    const third = md.indexOf('三卷目')
    const fourth = md.indexOf('四卷目')
    expect(third).toBeLessThan(zero)
    expect(zero).toBeLessThan(fourth)
  })

  it('索引页补回恒常化的相扑活动 3 条', () => {
    const md = get('side-story.md')
    for (const y of ['2023', '2024', '2025']) {
      expect(md, `缺相扑 ${y}`).toContain(`大相扑大会 ${y}`)
    }
  })

  it('六篇支线的登场人物都用头像引用', () => {
    const expected: Record<string, number> = {
      'side-kazeni.md': 2, 'side-ichikiyakou.md': 2, 'side-yukige.md': 3,
      'side-25ji.md': 3, 'side-shitei.md': 3, 'side-mugen.md': 12,
    }
    for (const [name, n] of Object.entries(expected)) {
      expect((get(name).match(/\[char:/g) || []).length, name).toBe(n)
    }
  })
})

describe('自由任务（批次 07）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md
  const FIXED = ['free-yukige.md', 'free-25ji.md', 'free-shitei.md', 'free-mugen.md']

  it('四页已脱离 D6：所有表列数一致', () => {
    for (const name of FIXED) {
      for (const rows of extractTables(get(name))) {
        expect(new Set(rows.map(cellCount)).size, `${name}: ${rows[0].slice(0, 40)}`).toBe(1)
      }
    }
  })

  it('修表后源文本的单元格内容一个都没丢', () => {
    for (const name of FIXED) {
      const md = get(name)
      const text = renderMarkdown(md).replace(/<[^>]+>/g, ' ')
      const lost: string[] = []
      for (const line of md.split('\n')) {
        if (!line.trim().startsWith('|')) continue
        for (const c of line.trim().replace(/^\||\|$/g, '').split('|')) {
          const v = c.trim().replace(/<br>/g, ' ').replace(/\*\*/g, '').trim()
          if (!v || v === '[<]' || v === '[^]' || /^[:\-\s]*$/.test(v)) continue
          if (!text.includes(v.split(' ')[0])) lost.push(v.slice(0, 30))
        }
      }
      expect(lost, `${name} 丢失内容`).toEqual([])
    }
  })

  it('战斗表用 [^] 纵向合并第三列（评价S经验值/报酬）', () => {
    expect(get('free-25ji.md')).toContain('[^]')
  })

  it('自由任务页引用的图片都存在', () => {
    for (const name of ['free-1.md', 'free-2.md', 'free-3.md']) {
      const imgs = [...get(name).matchAll(/(?:src="|!\[[^\]]*\]\()(\/images\/[^")]+)/g)].map((m) => m[1])
      expect(imgs.filter((p) => !fs.existsSync('public' + p)), name).toEqual([])
    }
  })
})

describe('曜日任务（批次 08）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md
  const DAYS = ['daily-mon.md', 'daily-tue.md', 'daily-wed.md', 'daily-thu.md',
                'daily-fri.md', 'daily-sat.md', 'daily-sun.md']

  it('七天已脱离 D6：所有表列数一致', () => {
    for (const name of DAYS) {
      for (const rows of extractTables(get(name))) {
        expect(new Set(rows.map(cellCount)).size, `${name}: ${rows[0].slice(0, 40)}`).toBe(1)
      }
    }
  })

  it('修表后内容零丢失', () => {
    for (const name of DAYS) {
      const md = get(name)
      const text = renderMarkdown(md).replace(/<[^>]+>/g, ' ')
      const lost: string[] = []
      for (const line of md.split('\n')) {
        if (!line.trim().startsWith('|')) continue
        for (const c of line.trim().replace(/^\||\|$/g, '').split('|')) {
          const v = c.trim().replace(/<br>/g, ' ').replace(/\*\*/g, '').trim()
          if (!v || v === '[<]' || v === '[^]' || /^[:\-\s]*$/.test(v)) continue
          if (!text.includes(v.split(' ')[0])) lost.push(v.slice(0, 30))
        }
      }
      expect(lost, `${name} 丢失内容`).toEqual([])
    }
  })

  it('任务情报表的列归属正确（掉落道具跨 2 列，非均分）', () => {
    // 均分会把「包袱布|素材|报酬|经验」错配成 2/1/1/1，正确应为 1/1/1/2
    const md = get('daily-fri.md')
    expect(md).toContain('| 掉落道具 | [<] | 获得报酬 | 经验值')
    expect(md).toMatch(/\| 包袱布 \| [^|]+ \| [^|]+ \| [^|]+ \| \[<\] \|/)
  })

  it('七天的任务地各不相同（防复制粘贴串行）', () => {
    const seen = new Set<string>()
    for (const [i, name] of DAYS.entries()) {
      const m = get(name).match(/\| ([月火水木金土日]曜任务[^|]*) \|/)
      expect(m, `${name} 找不到任务地`).toBeTruthy()
      const place = m![1].trim()
      expect(seen.has(place), `${name} 任务地与其他日重复：${place}`).toBe(false)
      seen.add(place)
    }
    expect(seen.size).toBe(7)
  })
})

describe('幕间 + 短篇索引 + 情人节（批次 09）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md
  const VDAY = ['short-valentine2023.md', 'short-valentine2024.md', 'short-valentine2025.md']

  it('情人节三年已脱离 D6：所有表列数一致', () => {
    for (const name of VDAY) {
      for (const rows of extractTables(get(name))) {
        expect(new Set(rows.map(cellCount)).size, `${name}: ${rows[0].slice(0, 40)}`).toBe(1)
      }
    }
  })

  it('任务情报表的列归属正确（掉落道具跨 2 列）', () => {
    const md = get('short-valentine2024.md')
    expect(md).toContain('| 掉落道具 | [<] | 获得报酬 | 经验值')
  })

  it('2026 年的敌编成还原成表格，不再是散文段落', () => {
    const md = get('short-valentine2026.md')
    // 原本整段敌编成被压成一行文字，现应为独立战斗表
    expect(md).not.toMatch(/\*\*敌编成（甲）\*\*：/)
    expect(extractTables(md).length).toBe(10)
    for (const t of ['一战目', '二战目（上）', '二战目（下）', '三战目']) {
      expect(md, `缺战斗表：${t}`).toContain(`| ${t} |`)
    }
  })

  it('登场人物用头像引用，小标题已译', () => {
    for (const [name, n] of Object.entries({ 'short-valentine2023.md': 3, 'short-valentine2024.md': 7 })) {
      const md = get(name)
      expect((md.match(/\[char:/g) || []).length, name).toBe(n)
      expect(md, `${name} 小标题未译`).not.toContain('## 登場人物')
    }
  })
})

describe('短篇 · 夏季/相扑/年越（批次 10）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('sumo2025 的登场地魂还原成头像网格，不再是顿号长串', () => {
    const md = get('short-sumo2025.md')
    expect(md).not.toMatch(/登场地魂[^\n]*：[^\n]*、[^\n]*、[^\n]*、/)
    expect((md.match(/\[char:/g) || []).length).toBe(76)
    expect(extractTables(md).length).toBe(3)
  })

  it('sumo2025 的比赛候补按场次分行', () => {
    const md = get('short-sumo2025.md')
    expect(md).toContain('| 第一场 |')
    expect(md).toContain('| 第二场 |')
  })

  it('beach 的登场人物用头像，小标题已译', () => {
    const md = get('short-beach.md')
    expect((md.match(/\[char:/g) || []).length).toBe(16)
    expect(md).not.toContain('## 登場人物')
    expect(md).not.toContain('## ストーリー')
    expect(md).not.toContain('限定水着幕間')
  })

  it('八页大表修完后内容零丢失', () => {
    const PAGES = ['short-shouen2025.md', 'short-shouen2024.md', 'short-hyakumonogatari.md',
      'short-beach.md', 'short-summerfes2023.md', 'short-sumo2024.md',
      'short-sumo2023.md', 'short-toshikoshi.md']
    for (const name of PAGES) {
      const md = get(name)
      const text = renderMarkdown(md).replace(/<[^>]+>/g, ' ')
      const lost: string[] = []
      for (const line of md.split('\n')) {
        if (!line.trim().startsWith('|')) continue
        for (const c of line.trim().replace(/^\||\|$/g, '').split('|')) {
          const v = c.trim().replace(/<br>/g, ' ').replace(/\*\*/g, '').replace(/<[^>]+>/g, '').trim()
          if (!v || v === '[<]' || v === '[^]' || /^[:\-\s]*$/.test(v) || v.startsWith('[char:')) continue
          if (!text.includes(v.split(' ')[0])) lost.push(v.slice(0, 30))
        }
      }
      expect(lost, `${name} 丢失内容`).toEqual([])
    }
  })
})

describe('图鉴列表页（批次 11）', () => {
  const get = (n: string) => files.find((f) => f.name === n)!.md

  it('妖怪属性别覆盖全部 13 名妖怪（原页面漏了 3 个）', () => {
    const md = get('dex-ayakashi-attr.md')
    expect((md.match(/\[char:/g) || []).length).toBe(13)
    // 这 3 个没有属性赋予效果，曾被整个漏掉
    for (const s of ['arctos', 'azukiarai', 'riku']) {
      expect(md, `缺妖怪：${s}`).toContain(`[char:${s}]`)
    }
    expect(md).toContain('无属性赋予')
  })

  it('声优表覆盖 38 位声优 / 72 个担当关系，且带头像', () => {
    const md = get('seiyuu.md')
    expect((md.match(/\[char:/g) || []).length).toBe(72)
    // 表头不再把角色列错标成「备注」
    expect(md).toContain('| 声优 | 担当角色 |')
    expect(md).not.toMatch(/\| 声优 \| 负责角色 \| 备注 \|/)
  })

  it('声优表保留原页的备考（獣楽座 / Vtuber）', () => {
    const md = get('seiyuu.md')
    expect(md).toContain('獣楽座成员')
    expect(md).toContain('Vtuber')
  })

  it('角色 JSON 的声优名无错字（同一人写法必须一致）', () => {
    const dir = 'src/data/pages'
    const voices = new Set<string>()
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue
      const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).char
      if (c?.voice) voices.add(c.voice.trim())
    }
    // 修复前这三处是同一人的不同错写
    expect(voices.has('蒼井ヰ'), '蒼乃ヰ 被误写为 蒼井ヰ').toBe(false)
    expect(voices.has('天乙淮花'), '天乙准花 被误写为 天乙淮花').toBe(false)
    expect(voices.has('徳留信乃佑'), '徳留慎乃佑 被误写为 徳留信乃佑').toBe(false)
    expect(voices.size).toBe(38)
  })
})
