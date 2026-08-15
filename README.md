# 写在前面

> [!IMPORTANT]
> 本项目为氛围编程（Vibe Coding），如果对此表示抗拒的需要注意。

因为个人对于日语的掌握还不太好，而在たまこれ中有很多地道的日本传统习俗，避免自己翻译错，绝大多数翻译工作由AI完成，个人阅读校验。

# 魂これ（地魂男儿）中文 Wiki

将日本同人游戏《魂これ やまとまほろば 地魂これくしょん》的非官方 Wiki（[wikiwiki.jp/tamacolle](https://wikiwiki.jp/tamacolle/)）翻译成中文的站点。

- 图片：原 Wiki 图片经代理下载后保存，本地引用

## 快速开始

```bash
npm install
npm run dev        # 开发预览（默认 http://localhost:5173）
npm run build      # 生产构建到 dist/
npm run preview    # 预览构建产物
npm run typecheck  # TypeScript 类型检查（vue-tsc --noEmit）
```

> 项目已全面 TypeScript 化：源码入口与数据层均为 `.ts`（`src/main.ts`、`src/router/index.ts`、`src/data/*.ts`、`vite.config.ts`），`.vue` 组件使用 `<script setup lang="ts">`。

## 目录结构

```
tamacolle-zh/
├── index.html
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── images/            # 原 Wiki 图片（title、gacha、battle、drop、chars 图标）
├── scripts/
│   ├── download_images.py     # 通过 images.weserv.nl 代理下载图片
│   └── generate_pages.mjs     # 生成长尾页面的内容文件
└── src/
    ├── main.js
    ├── App.vue                # 顶栏 / 导航 / 页脚（和风样式）
    ├── styles/theme.css       # 全部主题样式（和色 + 明朝体）
    ├── router/index.ts
    ├── components/
    │   ├── SideNav.vue        # 左侧目录（按分类）
    │   └── PageMarkdown.vue   # Markdown 渲染正文
    ├── markdown/              # 站内 Markdown 解释器
    │   ├── index.ts           # 渲染入口（renderMarkdown / renderProse / renderInline）
    │   ├── extensions.ts      # 自定义语法：颜色 / 注音 / 剧透 / 提示框 / 合并单元格表格
    │   └── colors.ts          # 语义色板（映射到随主题切换的 CSS 变量）
    ├── views/
    │   ├── HomeView.vue       # 首页
    │   └── PageView.vue       # 内容页（含角色名片卡片）
    └── data/
        ├── types.ts           # 共享类型定义（Page / CharacterData / CharacterSummary …）
        ├── manifest.ts        # 站点导航清单（页面 slug + 日文原名 + 中文译名 + 分类）
        ├── characters.ts      # 角色图鉴数据（地魂男儿 / 妖怪 / 六原职员）
        ├── index.ts           # 页面加载器（md frontmatter 解析 + 角色页 JSON 汇总）
        ├── content/*.md       # 113 个内容页正文（frontmatter + Markdown，可直接编辑）
        └── pages/*.json       # 71 个角色页结构化数据（由 scripts/build_chars.py 生成）
```

## 翻译与内容说明

- **已完整翻译**：首页、游戏系统、抽卡、任务、战斗、掉落、常见问题、前期攻略、等级、道具、庄园、远征、用语集、编队建议、主线/支线/每日/自由任务总览等核心页面。
- **内容页（113 个）**：正文存放于 `src/content/*.md`，frontmatter 记录 `id / title / ja / source`，正文为完整 Markdown 翻译，可直接编辑纠正。
- **角色页（71 个，完整收录原页全部数据）**：
  - 名片：编号 / 武器种 / 所属道 / 国势 / 节庆日 / 实装版本 / 画师 / 声优
  - 初始（或追加）属性表、拔魂技（名称·效果·速度）
  - **资料室说明**：已全文翻译（71 条）
  - **战法表**：名称·说明·习得条件（已翻译）
  - **立绘一览**：全部立绘已下载至 `public/images/chars/`，按「通常/战斗/负伤/特写/入浴毛巾/春夏服/泳装/秋冬服/晴服/兜裆布…」分组
  - **羁绊**：信頼·一 / 信頼·特 棋盘与明细表（术语已翻译）
  - **语音台词**：按原 Wiki 的「分类 / 场景 / 子场景 / 台词」层级还原为合并单元格表格（折叠展开），标签已译、台词保留原文
  - **元ネタ典故 / 小知识**：已全文翻译（`scripts/motif_zh.json`），附日文原文折叠

> 数据来源：角色页数据由脚本从 Web Archive 快照（2026-02 版）+ 实时抓取解析而来；`raw/`（原始 HTML）、`raw_data/`（解析后的结构化日文数据）、`scripts/`（抓取/解析/构建脚本）均在仓库内，可复现与续译。

## 免责声明

本网站为玩家自发制作的非官方中文翻译，与开发运营方「にじたま」无任何关联。游戏名、角色名、图像等权利归原作者与官方所有；翻译仅供参考，以原文为准。

## 扩展语法

正文以 Markdown 书写，并由 `src/markdown/` 下的自定义解释器扩展了几种
原版 Markdown 缺少的写法。完整说明见站内页面「**本站扩展语法**」（`src/content/wiki-syntax.md`）。

| 语法 | 用途 |
| :-- | :-- |
| `[color:red]文字[/color]` | 文字颜色。用**语义色名**时会随深/浅色主题自动换算，也支持 `#rrggbb` |
| `[bg:gold]文字[/bg]` | 背景高亮（`[mark:…]` 同义） |
| `[ruby:かな]漢字[/ruby]` | 振假名注音 |
| `[spoiler]…[/spoiler]` | 剧透遮罩 |
| `[kbd]Esc[/kbd]` | 按键样式 |
| `:::warn 标题` … `:::` | 提示框（`info` / `tip` / `note` / `warn` / `danger` / `ja` / `spoiler`） |
| 表格内 `[^] [v] [<] [>]` | 单元格向 上/下/左/右 合并 |

> 颜色之所以走色名而非硬编码 hex：站点有深浅两套主题，写死的色值在另一套主题下
> 往往对比度不足。色名会映射到 `--c-*` / `--cb-*` CSS 变量，两套主题各有一组取值。

合并单元格要求合并组构成矩形；写成非矩形时解释器会放弃该组合并并按普通单元格输出，
不会丢失内容。不含合并标记的表格仍走标准 GFM 解析，既有内容页行为不变。

### 数据生成脚本

```bash
# 语音纯文本 → 合并单元格表格（新增角色或修正语音时使用）
python3 scripts/build_voice_tables.py voice.txt                        # 输出到 stdout
python3 scripts/build_voice_tables.py voice.txt --into src/data/pages/bizen.json
cat voice.txt | python3 scripts/build_voice_tables.py                  # 也可从管道读入

# motifZh/triviaZh 里独占一行的 **粗体** → ### 标题（支持 --dry-run）
python3 scripts/normalize_motif.py
```

> 角色语音的唯一数据源是 `char.voiceMd`。
> 早期的扁平字段 `char.voiceText` 已在完成转换后删除（原始数据可从 git 历史找回）。
