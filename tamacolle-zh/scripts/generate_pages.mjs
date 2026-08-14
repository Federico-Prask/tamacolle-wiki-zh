// 为尚未人工翻译的页面生成内容文件（含从角色库构建的图鉴列表页）
import { characters } from '../src/data/characters.js'
import { manifest } from '../src/data/manifest.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '..', 'src', 'data', 'pages')

const kunidama = characters.filter((c) => c.type === 'kunidama')
const ayakashi = characters.filter((c) => c.type === 'ayakashi')
const rokuhara = characters.filter((c) => c.type === 'rokuhara')

const src = (ja) => 'https://wikiwiki.jp/tamacolle/' + encodeURIComponent(ja).replace(/%2F/g, '%2F')

const link = (c) => `[${c.name}](#/page/${c.slug})`

// ============ 图鉴列表页 ============
const kunidamaNumbered = kunidama
  .filter((c) => c.num)
  .sort((a, b) => a.num - b.num)
const numberedTable = (() => {
  const rows = []
  for (let i = 0; i < kunidamaNumbered.length; i += 5) {
    const cells = kunidamaNumbered.slice(i, i + 5).map((c) => {
      const extra = [c.weapon, c.power].filter(Boolean).map((x) => `·${x}`).join('')
      return `${link(c)}${extra}`
    })
    while (cells.length < 5) cells.push('')
    rows.push('| ' + cells.join(' | ') + ' |')
  }
  return rows.join('\n')
})()

const byRegion = {}
for (const c of kunidama) (byRegion[c.region] ||= []).push(c)
const regionSections = Object.entries(byRegion)
  .sort(([a], [b]) => a.localeCompare(b, 'ja'))
  .map(([r, list]) => `### ${r}道\n\n${list.map((c) => `- ${link(c)}${c.weapon ? `（${c.weapon}）` : ''}${c.power ? ` · ${c.power}` : ''}`).join('\n')}`)
  .join('\n\n')

const byWeapon = {}
for (const c of kunidama) {
  const w = c.weapon || '未确认'
  ;(byWeapon[w] ||= []).push(c)
}
const weaponSections = Object.entries(byWeapon)
  .sort(([a], [b]) => a.localeCompare(b, 'ja'))
  .map(([w, list]) => `### ${w}\n\n${list.map((c) => `- ${link(c)}（${c.region}）`).join('\n')}`)
  .join('\n\n')

const ayakashiTable = (() => {
  const list = ayakashi.filter((c) => c.num).sort((a, b) => a.num - b.num)
  const rows = []
  for (let i = 0; i < list.length; i += 5) {
    const cells = list.slice(i, i + 5).map((c) => `${link(c)}`)
    while (cells.length < 5) cells.push('')
    rows.push('| ' + cells.join(' | ') + ' |')
  }
  return rows.join('\n')
})()

// ============ 各页面自定义正文 ============
const custom = {
  'dex-kunidama': {
    body: `## 地魂男儿 · 编号序\n\n按资料室编号排列的地魂男儿一览（未实装编号留空）。\n\n${numberedTable}\n\n> 完整编号表（含未实装空位）与图标，请参考[原文](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90/%E7%95%AA%E5%8F%B7%E9%A0%86)。\n`,
  },
  'dex-kunidama-region': {
    body: `## 地魂男儿 · 地域别\n\n按五畿七道分类的地魂男儿一览。\n\n${regionSections}\n\n> 排序以资料室为准，完整列表见[原文](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90/%E5%9C%B0%E5%9F%9F%E5%88%A5)。\n`,
  },
  'dex-kunidama-weapon': {
    body: `## 地魂男儿 · 武器种别\n\n按武器种分类的地魂男儿一览（前卫：短刀·刀·枪·重装；后卫：弓·大炮·术）。\n\n${weaponSections}\n\n> 完整列表见[原文](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90/%E6%AD%A6%E5%99%A8%E7%A8%AE%E5%88%A5)。\n`,
  },
  'dex-kunidama-material': {
    body: `## 地魂男儿 · 素材别\n\n按羁绊/升级所需素材分类的地魂男儿一览。\n\n> 各角色羁绊素材的完整对照表，请参考[原文](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90/%E7%B4%A0%E6%9D%90%E5%88%A5)。\n`,
  },
  'dex-kunidama-env': {
    body: `## 地魂男儿 · 擅长环境\n\n地魂男儿各有其擅长的「环境」（自然 / 街 / 水边 / 难所），与任务地形一致时获得能力加成。\n\n> 各角色擅长环境的完整对照表，请参考[原文](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90/%E5%BE%97%E6%84%8F%E7%92%B0%E5%A2%83)。\n`,
  },
  'dex-ayakashi': {
    body: `## 妖怪 · 编号序\n\n按编号排列的妖怪（あやかし）一览。妖怪是装备给地魂的支援角色，可提升属性并赋予「木火土金水」属性。\n\n${ayakashiTable}\n\n> 完整列表见[原文](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%82%84%E3%81%8B%E3%81%97/%E7%95%AA%E5%8F%B7%E9%A0%86)。\n`,
  },
  'dex-ayakashi-attr': {
    body: `## 妖怪 · 属性别\n\n按赋予属性（木·火·土·金·水）分类的妖怪一览。\n\n> 完整属性对照表见[原文](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%82%84%E3%81%8B%E3%81%97/%E5%B1%9E%E6%80%A7%E5%88%A5)。\n`,
  },
  'speed-table': {
    body: `## 速度表\n\n汇总地魂男儿 / 妖怪「速さ」属性的一览表，是战斗行动顺序（速度从高到低）的重要参考。\n\n> 完整速度表见[原文](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF/%E9%80%9F%E3%81%95%E8%A1%A8)。\n`,
  },
  'main-1': {
    body: `## 第一话 · 甲州街道\n\n主线第一话，舞台为甲州街道（山梨·甲斐一带）。\n\n- 本话登场未实装地魂：[甲斐](#/page/kai)（剧情更新结束后实装）。\n- 通关尾声可获纪念品「江户探索」模型。\n\n> 剧情流程与敌方情报请参考[原文](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC/%E7%AC%AC%E4%B8%80%E8%A9%B1)。\n`,
  },
  'main-2': {
    body: `## 第二话 · 讃岐街道\n\n主线第二话，舞台为讃岐街道（香川·四国一带）。\n\n- 本话登场未实装地魂：[土佐](#/page/tosa)（剧情更新结束后实装）。\n- 通关尾声可获纪念品「金刀比罗参拜」模型。\n\n> 剧情流程与敌方情报请参考[原文](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC/%E7%AC%AC%E4%BA%8C%E8%A9%B1)。\n`,
  },
  'main-3': {
    body: `## 第三话 · 北陆道\n\n主线第三话，舞台为北陆道。\n\n- 通关尾声可获纪念品「雪之北陆」模型。\n\n> 剧情流程与敌方情报请参考[原文](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC/%E7%AC%AC%E4%B8%89%E8%A9%B1)。\n`,
  },
  'update-log': {
    body: `## 更新与维护记录\n\n游戏约每周维护一次（多在周六或周日，可能顺延至次日早上；月初可能推至 6 日以后）。\n\n- 新角色约每月 1 个；新剧本约 2 个月一更。\n- 完整的历史更新记录（各版本内容、维护预告）请参考[原文](https://wikiwiki.jp/tamacolle/%E6%9B%B4%E6%96%B0%E3%83%BB%E3%83%A1%E3%83%B3%E3%83%86%E3%83%8A%E3%83%B3%E3%82%B9%E5%B1%A5%E6%AD%B4)。\n`,
  },
  bug: {
    body: `## 已知问题（Bug）\n\n- 已知 Bug 与官方报告方式汇总页。\n- 付费相关问题：充值通常在每周维护时统一反映。\n\n> 各 Bug 的具体现象与应对，请参考[原文](https://wikiwiki.jp/tamacolle/%E3%83%90%E3%82%B0%E3%83%BB%E4%B8%8D%E5%85%B7%E5%90%88)。\n`,
  },
  links: {
    body: `## 链接合集\n\n- にじたま 官方网站：<https://nijitama.app/>\n- にじたま pixivFANBOX：<https://nijitama.fanbox.cc/>\n- 魂これ 官方 X（Twitter）：<https://x.com/tamacolle_staff>\n- 官方 YouTube「魂これちゃんねる」：<https://youtube.com/channel/UC0ISZ3iMtQIw5730kFCWXug>\n\n> 更多社群与粉丝链接见[原文](https://wikiwiki.jp/tamacolle/%E3%83%AA%E3%83%B3%E3%82%AF%E9%9B%86)。\n`,
  },
  goods: {
    body: `## 官方周边情报\n\n由官方发布的周边（グッズ）情报汇总。\n\n> 最新周边与购买方式，请参考[原文](https://wikiwiki.jp/tamacolle/%E5%85%AC%E5%BC%8F%E3%82%B0%E3%83%83%E3%82%BA%E6%83%85%E5%A0%B1)。\n`,
  },
  neta: {
    body: `## 豆知识（小ネタ）\n\n汇集与本作相关的豆知识、梗与玩家整理的趣味内容：\n\n- [印章集](#/page/neta-hanko)\n- [特写（Cut-in）集](#/page/neta-cutin)\n- [角色语气表](#/page/neta-kucho)\n- [服装表](#/page/neta-isho)\n- [节庆日日历](#/page/neta-calendar)\n- [时代划分表](#/page/neta-era)\n- [噬魂集](#/page/neta-kuu)\n- [速度表](#/page/speed-table)\n\n> 详细内容以[原文](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF)为准。\n`,
  },
  ranking: {
    body: `## 人气 100\n\n按人气排名的角色 Top 100 列表。\n\n> 最新排名见[原文](https://wikiwiki.jp/tamacolle/%E4%BA%BA%E6%B0%97100)。\n`,
  },
  today100: {
    body: `## 今日 100\n\n当日的角色人气/活跃排行列表。\n\n> 见[原文](https://wikiwiki.jp/tamacolle/%E4%BB%8A%E6%97%A5100)。\n`,
  },
  'neta-calendar': {
    body: `## 节庆日日历（ハレの日カレンダー）\n\n「ハレの日」相当于各地魂的生日——每个地魂都有对应的纪念日或节日，当天官方会以「晴魂（ハレタマ）」称呼并祝福。\n\n- 例：讃岐 —— 7 月 2 日\n\n> 完整日历见[原文](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF/%E3%83%8F%E3%83%AC%E3%81%AE%E6%97%A5%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC)。\n`,
  },
  'board-chat': {
    body: `## 闲聊板\n\n玩家自由闲聊的公告板（原 Wiki 功能）。\n\n> 中文站未镜像留言功能，请前往[原文闲聊板](https://wikiwiki.jp/tamacolle/%E9%9B%91%E8%AB%87%E6%8E%B2%E7%A4%BA%E6%9D%BF)参与。\n`,
  },
  'board-qa': {
    body: `## 提问板\n\n玩家提问与答疑的公告板。\n\n> 请前往[原文提问板](https://wikiwiki.jp/tamacolle/%E8%B3%AA%E5%95%8F%E6%8E%B2%E7%A4%BA%E6%9D%BF)参与。\n`,
  },
  'board-info': {
    body: `## 情报提供板\n\n玩家提供情报的公告板。\n\n> 请前往[原文情报提供板](https://wikiwiki.jp/tamacolle/%E6%83%85%E5%A0%B1%E6%8F%90%E4%BE%9B%E6%8E%B2%E7%A4%BA%E6%9D%BF)参与。\n`,
  },
  'wiki-opinion': {
    body: `## Wiki 编辑意见交换\n\n关于原 Wiki 编辑的意见交换板。\n\n> 见[原文](https://wikiwiki.jp/tamacolle/wiki%E7%B7%A8%E9%9B%86%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E6%84%8F%E8%A6%8B%E4%BA%A4%E6%8F%9B)。\n`,
  },
  'edit-task': {
    body: `## 编辑任务情报\n\n原 Wiki 的待办编辑任务清单。\n\n> 见[原文](https://wikiwiki.jp/tamacolle/%E7%B7%A8%E9%9B%86%E3%82%BF%E3%82%B9%E3%82%AF%E6%83%85%E5%A0%B1)。\n`,
  },
  'format-rule': {
    body: `## 排版规则\n\n原 Wiki（PukiWiki 系）的文本排版规则说明。\n\n> 见[原文](https://wikiwiki.jp/tamacolle/%E6%95%B4%E5%BD%A2%E3%83%AB%E3%83%BC%E3%83%AB)。\n`,
  },
  'wiki-help': {
    body: `## Wiki 帮助\n\n原 Wiki 的使用帮助。\n\n> 见[原文](https://wikiwiki.jp/tamacolle/%E3%83%98%E3%83%AB%E3%83%97)。\n`,
  },
}

// 默认正文（长尾页面）
const defaultBody = (m) => {
  const srcUrl = src(m.ja)
  return `## ${m.zh}\n\n> 本页面为中文站自动收录页，完整翻译整理中。\n\n- 日文原名：${m.ja}\n- 详细内容请先查看原文 Wiki：\n\n[查看原文页面](${srcUrl})\n`
}

const bySlug = Object.fromEntries(manifest.map((m) => [m.slug, m]))

let created = 0
let skipped = 0
for (const m of manifest) {
  const file = path.join(pagesDir, m.slug + '.json')
  if (fs.existsSync(file)) {
    skipped++
    continue
  }
  const body = custom[m.slug] ? custom[m.slug].body : defaultBody(m)
  const data = { id: m.slug, ja: m.ja, zh: m.zh, cat: m.cat, body }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  created++
}
console.log(`created=${created} skipped=${skipped} total=${manifest.length}`)
