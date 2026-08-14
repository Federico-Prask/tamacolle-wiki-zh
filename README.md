# 魂これ（地魂收藏）中文 Wiki · 和风译站

将日本同人游戏《魂これ　やまとまほろば 地魂これくしょん》的非官方 Wiki（[wikiwiki.jp/tamacolle](https://wikiwiki.jp/tamacolle/)）翻译成中文的镜像站点。

- 技术栈：**Vite + Vue 3 + vue-router**（SPA，hash 路由）
- 风格：日式古风配色（和色）＋明朝体（Zen Old Mincho / 宋体）
- 图片：原 Wiki 图片经代理下载后保存于 `public/images`，本地引用

## 快速开始

```bash
npm install
npm run dev      # 开发预览（默认 http://localhost:5173）
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

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
    ├── router/index.js
    ├── components/
    │   ├── SideNav.vue        # 左侧目录（按分类）
    │   └── PageMarkdown.vue   # Markdown 渲染正文
    ├── views/
    │   ├── HomeView.vue       # 首页
    │   └── PageView.vue       # 内容页（含角色名片卡片）
    └── data/
        ├── manifest.js        # 站点导航清单（183 个页面：日文原名 + 中文译名 + 分类）
        ├── characters.js      # 角色图鉴数据（地魂男儿 51 / 妖怪 13 / 六原职员 7）
        └── pages/*.json       # 各页面翻译正文（Markdown）
```

## 翻译与内容说明

- **已完整翻译**：首页、游戏系统、抽卡、任务、战斗、掉落、常见问题、前期攻略、等级、道具、庄园、远征、用语集、编队建议、主线/支线/每日/自由任务总览等核心页面。
- **角色页（71 个，完整收录原页全部数据）**：
  - 名片：编号 / 武器种 / 所属道 / 国势 / 节庆日 / 实装版本 / 画师 / 声优
  - 初始（或追加）属性表、拔魂技（名称·效果·速度）
  - **资料室说明**：已全文翻译（71 条），附原文折叠
  - **战法表**：名称·说明·习得条件（已翻译）
  - **立绘一览**：全部 539 张立绘已下载至 `public/images/chars/`，按「通常/战斗/负伤/特写/入浴毛巾/春夏服/泳装/秋冬服/晴服/兜裆布…」分组
  - **羁绊**：信頼·一 / 信頼·特 棋盘与明细表（术语已翻译）
  - **语音台词**：标签已译、台词保留原文（折叠展开）
  - **元ネタ典故 / 小知识**：保留原文（折叠展开，待续译）
- **长尾页面**（各剧情分话、短篇、公告板、模板等）：自动收录页提供中文标题与原文链接，可继续补充翻译。

> 数据来源：角色页数据由脚本从 Web Archive 快照（2026-02 版）+ 实时抓取解析而来；`raw/`（原始 HTML）、`raw_data/`（解析后的结构化日文数据）、`scripts/`（抓取/解析/构建脚本）均在仓库内，可复现与续译。

## 免责声明

本网站为玩家自发制作的非官方中文翻译，与开发运营方「にじたま」无任何关联。游戏名、角色名、图像等权利归原作者与官方所有；翻译仅供参考，以原文为准。
