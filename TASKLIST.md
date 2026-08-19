# 全站逐页比对 TaskList

> 目标：把本地 **184 个页面**（21 基本情报 / 45 攻略任务 / 22 图鉴列表 / 71 角色 / 25 资料其他）与原 wiki `wikiwiki.jp/tamacolle` **一一比对**，补齐所有缺失内容。
> 
> **执行规则：每次回答只做「一个批次」**，做完在本文件把该批次的 ⬜ 改成 ✅ 并在「比对日志」写清查了什么、发现什么、改了什么。不允许跳批、不允许「看着差不多就过」。

## 每页的固定检查清单（7 项，逐项过）

| # | 检查项 | 判定标准 |
| :-- | :-- | :-- |
| C1 | **章节结构** | 原页目次里每个标题，本地是否都有对应小节？逐条点名 |
| C2 | **表格完整性** | 行数、**列数**、每个单元格。表头列数必须等于数据行列数 |
| C3 | **图片** | 原页每个 `::ref/` 图是否都下载到 `public/images/`？**尤其表格单元格内嵌的角色头像** |
| C4 | **折叠区** | `region`/`fold`/「クリックして展開」里的内容最易漏，必须展开抓 |
| C5 | **脚注·注释** | `*1` `*2`、表下小字说明是否译出 |
| C6 | **链接改写** | 指向其他 wiki 页的链接改成站内 `#/page/xxx` |
| C7 | **译名一致** | 与 `glossary.md` / `item.md` 既有译法统一 |

每批次结束必须跑：`npx vitest run` + `npx vite build` + `npx vue-tsc --noEmit`

---

## 已确认的系统性缺陷（贯穿全站，边比对边修）

- [x] **D1 表格内角色头像全部丢失**（基础设施已就绪） —— 原 wiki 大量表格在单元格里放 `{slug}_icon.png` 缩略图 + 名字，本地翻译只留了纯文字。已实现 `[char:slug]` 语法（`src/markdown/chars.ts` + `charRefExtension`），支持 slug／日文名／中文名三种键，未知键降级为可见提示。**衣装表 90 处、日历 61 处头像已补齐**；其余页面随各批次推进。
- [x] **D2 表头列数与数据行不匹配**（衣装表已修） —— `neta-isho.md` 角色别服装表：表头 8 列，数据行 12 列（漏了 バレンタイン/浴衣/まわし/クリスマス/専用）。同类问题需全站排查。
- [x] **D3 折叠大表被压成一句话**（已修） —— `neta.md` 的「きぐぱ履歴」原是 2022–2026 五年份大表（每月 地魂+モチーフ），本地只写了一句「…的列表」。
- [x] **D4 汇总行缺失**（衣装表已补） —— 服装表末尾的「地魂/ロクハラ 合计」统计行本地没有。
- [ ] **D5 任务页「出现敌人」表可能同样缺头像/立绘** —— 原 wiki 任务页常在敌人表、报酬表放图标，待任务 P1–P6 逐页确认。
- [x] **D6 表头列数不足导致单元格被静默吞掉 —— 🎉 全站清零（批次 10 完成）** —— 曾有 **24 个文件、266 张表、约 3112 个单元格**在页面上完全不显示（实测 `daily-fri` 的关卡表被渲染成单列）。现 `tests/known-broken-tables.json` 为空，测试改为**全站强制校验**：任何新增截断表直接失败。修复分布：`drop-table`、`goods`、自由任务 4 页、曜日任务 7 页、情人节 3 页、夏季/相扑/年越 8 页。
- [x] **D7 分隔行列数少于表头** —— 同样导致末列被吞。`free-2.md` 两张敌编成表的「后排」列曾整列丢失，已修。

---

## 批次表

### ✅ 批次 01 · 小趣闻系列（用户已指出缺失，最高优先）  （8 页，**全部完成**）

原 wiki 的「小ネタ」母页 + 7 个子页。**已确认 D1/D2/D3/D4 四类缺陷都在这里**。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `neta` | [小ネタ](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF) | 2823 | 0 | 0 | ⬜ |
| ✅ `neta-hanko` | [小ネタ/ハンコ集](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E3%83%8F%E3%83%B3%E3%82%B3%E9%9B%86) | 9719 | 0 | 50 | ⬜ |
| ✅ `neta-cutin` | [小ネタ/カットイン集](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E3%82%AB%E3%83%83%E3%83%88%E3%82%A4%E3%83%B3%E9%9B%86) | 1654 | 51 | 0 | ⬜ |
| ✅ `neta-kucho` | [小ネタ/キャラ口調表](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E3%82%AD%E3%83%A3%E3%83%A9%E5%8F%A3%E8%AA%BF%E8%A1%A8) | 7229 | 81 | 0 | ⬜ |
| ✅ `neta-isho` | [小ネタ/衣装表](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E8%A1%A3%E8%A3%85%E8%A1%A8) | 3612 | 72 | 0 | ⬜ |
| ✅ `neta-calendar` | [小ネタ/ハレの日カレンダー](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E3%83%8F%E3%83%AC%E3%81%AE%E6%97%A5%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC) | 2974 | 84 | 0 | ⬜ |
| ✅ `neta-era` | [小ネタ/時代区分](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E6%99%82%E4%BB%A3%E5%8C%BA%E5%88%86) | 1845 | 42 | 0 | ⬜ |
| ✅ `neta-kuu` | [小ネタ/喰魂集](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E5%96%B0%E9%AD%82%E9%9B%86) | 12732 | 0 | 68 | ⬜ |

### ✅ 批次 02 · 资料·其他 剩余页  （17 页，**全部完成**）

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `ranking` | [人気100](https://wikiwiki.jp/tamacolle/%E4%BA%BA%E6%B0%97100) | 236 | 0 | 0 | ⬜ |
| ✅ `today100` | [今日100](https://wikiwiki.jp/tamacolle/%E4%BB%8A%E6%97%A5100) | 209 | 0 | 0 | ⬜ |
| ✅ `board-chat` | [雑談掲示板](https://wikiwiki.jp/tamacolle/%E9%9B%91%E8%AB%87%E6%8E%B2%E7%A4%BA%E6%9D%BF) | 269 | 0 | 0 | ⬜ |
| ✅ `board-qa` | [質問掲示板](https://wikiwiki.jp/tamacolle/%E8%B3%AA%E5%95%8F%E6%8E%B2%E7%A4%BA%E6%9D%BF) | 246 | 0 | 0 | ⬜ |
| ✅ `board-info` | [情報提供掲示板](https://wikiwiki.jp/tamacolle/%E6%83%85%E5%A0%B1%E6%8F%90%E4%BE%9B%E6%8E%B2%E7%A4%BA%E6%9D%BF) | 291 | 0 | 0 | ⬜ |
| ✅ `wiki-opinion` | [wiki編集に関する意見交換](https://wikiwiki.jp/tamacolle/wiki%E7%B7%A8%E9%9B%86%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E6%84%8F%E8%A6%8B%E4%BA%A4%E6%8F%9B) | 420 | 0 | 0 | ⬜ |
| ✅ `edit-task` | [編集タスク情報](https://wikiwiki.jp/tamacolle/%E7%B7%A8%E9%9B%86%E3%82%BF%E3%82%B9%E3%82%AF%E6%83%85%E5%A0%B1) | 721 | 0 | 0 | ⬜ |
| ✅ `format-rule` | [整形ルール](https://wikiwiki.jp/tamacolle/%E6%95%B4%E5%BD%A2%E3%83%AB%E3%83%BC%E3%83%AB) | 10981 | 1 | 0 | ⬜ |
| ✅ `wiki-syntax` | [本Wiki拡張記法](https://wikiwiki.jp/tamacolle/%E6%9C%ACWiki%E6%8B%A1%E5%BC%B5%E8%A8%98%E6%B3%95) | 2881 | 24 | 0 | ⬜ |
| ✅ `wiki-help` | [ヘルプ](https://wikiwiki.jp/tamacolle/%E3%83%98%E3%83%AB%E3%83%97) | 748 | 0 | 0 | ⬜ |
| ✅ `help-ayakashi` | [あやかし・ヘルプ](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%82%84%E3%81%8B%E3%81%97%E3%83%BB%E3%83%98%E3%83%AB%E3%83%97) | 2073 | 0 | 0 | ⬜ |
| ✅ `help-kunidama` | [地魂男児・ヘルプ](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%E3%83%BB%E3%83%98%E3%83%AB%E3%83%97) | 4492 | 0 | 0 | ⬜ |
| ✅ `tpl-char` | [テンプレート/キャラテンプレ](https://wikiwiki.jp/tamacolle/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%2F%E3%82%AD%E3%83%A3%E3%83%A9%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC) | 1641 | 0 | 0 | ⬜ |
| ✅ `tpl-ayakashi` | [テンプレート/あやかしテンプレ](https://wikiwiki.jp/tamacolle/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%2F%E3%81%82%E3%82%84%E3%81%8B%E3%81%97%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC) | 1070 | 0 | 0 | ⬜ |
| ✅ `tpl-rokuhara` | [テンプレート/ロクハラテンプレ](https://wikiwiki.jp/tamacolle/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%2F%E3%83%AD%E3%82%AF%E3%83%8F%E3%83%A9%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC) | 980 | 0 | 0 | ⬜ |
| ✅ `tpl-genchijin` | [テンプレート/現地人テンプレ](https://wikiwiki.jp/tamacolle/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%2F%E7%8F%BE%E5%9C%B0%E4%BA%BA%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC) | 460 | 0 | 0 | ⬜ |
| ✅ `tpl-quest` | [テンプレート/クエストテンプレ](https://wikiwiki.jp/tamacolle/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%2F%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC) | 1366 | 0 | 0 | ⬜ |

### ✅ 批次 03 · 基本情报（上）  （11 页，**全部完成**）

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `system` | [ゲームシステムについて](https://wikiwiki.jp/tamacolle/%E3%82%B2%E3%83%BC%E3%83%A0%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | 1196 | 0 | 0 | ⬜ |
| ✅ `gacha` | [ガチャについて](https://wikiwiki.jp/tamacolle/%E3%82%AC%E3%83%81%E3%83%A3%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | 1675 | 10 | 3 | ⬜ |
| ✅ `quest-guide` | [クエストについて](https://wikiwiki.jp/tamacolle/%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | 2251 | 14 | 8 | ⬜ |
| ✅ `battle` | [戦闘について](https://wikiwiki.jp/tamacolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | 3580 | 26 | 6 | ⬜ |
| ✅ `drop` | [ドロップについて](https://wikiwiki.jp/tamacolle/%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | 1918 | 0 | 0 | ⬜ |
| ✅ `drop-table` | [ドロップ表](https://wikiwiki.jp/tamacolle/%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E8%A1%A8) | 3403 | 72 | 0 | ⬜ |
| ✅ `faq` | [よくある質問](https://wikiwiki.jp/tamacolle/%E3%82%88%E3%81%8F%E3%81%82%E3%82%8B%E8%B3%AA%E5%95%8F) | 4153 | 0 | 0 | ⬜ |
| ✅ `faq-beginner` | [よくある質問/序盤の進め方](https://wikiwiki.jp/tamacolle/%E3%82%88%E3%81%8F%E3%81%82%E3%82%8B%E8%B3%AA%E5%95%8F%2F%E5%BA%8F%E7%9B%A4%E3%81%AE%E9%80%B2%E3%82%81%E6%96%B9) | 3941 | 5 | 0 | ⬜ |
| ✅ `level` | [レベル](https://wikiwiki.jp/tamacolle/%E3%83%AC%E3%83%99%E3%83%AB) | 7585 | 254 | 0 | ⬜ |
| ✅ `formation` | [地魂男児/編成のすゝめ](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E7%B7%A8%E6%88%90%E3%81%AE%E3%81%99%E3%82%9D%E3%82%81) | 7423 | 0 | 0 | ⬜ |
| ✅ `stat-formula` | [地魂男児/ステータス計算式](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%A8%88%E7%AE%97%E5%BC%8F) | 2229 | 0 | 0 | ⬜ |

### ✅ 批次 04 · 基本情报（下）  （10 页，**全部完成**）

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `hp-pattern` | [地魂男児/HP成長パターン](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2FHP%E6%88%90%E9%95%B7%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3) | 2747 | 35 | 0 | ⬜ |
| ✅ `login-bonus` | [ログインボーナス](https://wikiwiki.jp/tamacolle/%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E3%83%9C%E3%83%BC%E3%83%8A%E3%82%B9) | 1455 | 62 | 0 | ⬜ |
| ✅ `item` | [アイテム](https://wikiwiki.jp/tamacolle/%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0) | 14258 | 167 | 153 | ⬜ |
| ✅ `manor` | [荘園](https://wikiwiki.jp/tamacolle/%E8%8D%98%E5%9C%92) | 2317 | 28 | 0 | ⬜ |
| ✅ `expedition` | [遠征](https://wikiwiki.jp/tamacolle/%E9%81%A0%E5%BE%81) | 1714 | 23 | 0 | ⬜ |
| ✅ `update-log` | [更新・メンテナンス履歴](https://wikiwiki.jp/tamacolle/%E6%9B%B4%E6%96%B0%E3%83%BB%E3%83%A1%E3%83%B3%E3%83%86%E3%83%8A%E3%83%B3%E3%82%B9%E5%B1%A5%E6%AD%B4) | 18644 | 284 | 0 | ⬜ |
| ✅ `bug` | [バグ・不具合](https://wikiwiki.jp/tamacolle/%E3%83%90%E3%82%B0%E3%83%BB%E4%B8%8D%E5%85%B7%E5%90%88) | 721 | 0 | 0 | ⬜ |
| ✅ `links` | [リンク集](https://wikiwiki.jp/tamacolle/%E3%83%AA%E3%83%B3%E3%82%AF%E9%9B%86) | 12185 | 180 | 0 | ⬜ |
| ✅ `goods` | [公式グッズ情報](https://wikiwiki.jp/tamacolle/%E5%85%AC%E5%BC%8F%E3%82%B0%E3%83%83%E3%82%BA%E6%83%85%E5%A0%B1) | 4829 | 83 | 0 | ⬜ |
| ✅ `glossary` | [用語集](https://wikiwiki.jp/tamacolle/%E7%94%A8%E8%AA%9E%E9%9B%86) | 8615 | 0 | 0 | ⬜ |

### ✅ 批次 05 · 任务 P1 · 主线  （4 页，**全部完成**）

索引页 + 三话。重点：关卡表（消耗体力/敌编成/报酬）、掉落表、剧情 NPC 链接。**`main-story` 仅 661 字节，先确认索引页是否漏了话数一览表。**

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `main-story` | [メインストーリー](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC) | 661 | 5 | 0 | ⬜ |
| ✅ `main-1` | [メインストーリー/第一話](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E7%AC%AC%E4%B8%80%E8%A9%B1) | 2693 | 58 | 1 | ⬜ |
| ✅ `main-2` | [メインストーリー/第二話](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E7%AC%AC%E4%BA%8C%E8%A9%B1) | 2520 | 55 | 1 | ⬜ |
| ✅ `main-3` | [メインストーリー/第三話](https://wikiwiki.jp/tamacolle/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E7%AC%AC%E4%B8%89%E8%A9%B1) | 3177 | 74 | 2 | ⬜ |

### ✅ 批次 06 · 任务 P2 · 支线  （7 页，**全部完成**）

索引页 + 6 篇活动支线。**`side-story` 仅 670 字节，需核对是否漏了活动一览表（开催期间、报酬、限定地魂）。**

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `side-story` | [サイドストーリー](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC) | 670 | 8 | 0 | ⬜ |
| ✅ `side-kazeni` | [サイドストーリー/風に吹かれて幾千里](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E9%A2%A8%E3%81%AB%E5%90%B9%E3%81%8B%E3%82%8C%E3%81%A6%E5%B9%BE%E5%8D%83%E9%87%8C) | 2925 | 40 | 0 | ⬜ |
| ✅ `side-ichikiyakou` | [サイドストーリー/ふらり一鬼夜行](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E3%81%B5%E3%82%89%E3%82%8A%E4%B8%80%E9%AC%BC%E5%A4%9C%E8%A1%8C) | 2111 | 41 | 0 | ⬜ |
| ✅ `side-yukige` | [サイドストーリー/月冴ゆる雪消の丘で](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E6%9C%88%E5%86%B4%E3%82%86%E3%82%8B%E9%9B%AA%E6%B6%88%E3%81%AE%E4%B8%98%E3%81%A7) | 4040 | 49 | 0 | ⬜ |
| ✅ `side-25ji` | [サイドストーリー/オレの魂が叫ぶ25時](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E3%82%AA%E3%83%AC%E3%81%AE%E9%AD%82%E3%81%8C%E5%8F%AB%E3%81%B625%E6%99%82) | 1953 | 33 | 0 | ⬜ |
| ✅ `side-shitei` | [サイドストーリー/風の師弟](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E9%A2%A8%E3%81%AE%E5%B8%AB%E5%BC%9F) | 1843 | 21 | 0 | ⬜ |
| ✅ `side-mugen` | [サイドストーリー/夢幻の如く](https://wikiwiki.jp/tamacolle/%E3%82%B5%E3%82%A4%E3%83%89%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%2F%E5%A4%A2%E5%B9%BB%E3%81%AE%E5%A6%82%E3%81%8F) | 2055 | 40 | 0 | ⬜ |

### ✅ 批次 07 · 任务 P3 · 自由任务  （10 页，**全部完成**）

索引 + 主线三话 + 6 篇活动篇。本批最重：`free-yukige` 205 行表、`free-mugen` 125 行、`free-25ji` 98 行、`free-shitei` 97 行。`free-1` 带 7 张图（掉落素材图标），是 D5 的首要验证对象。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `free-quest` | [フリークエスト](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88) | 1239 | 17 | 0 | ⬜ |
| ✅ `free-1` | [フリークエスト/第一話](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E7%AC%AC%E4%B8%80%E8%A9%B1) | 3611 | 80 | 7 | ⬜ |
| ✅ `free-2` | [フリークエスト/第二話](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E7%AC%AC%E4%BA%8C%E8%A9%B1) | 2591 | 63 | 3 | ⬜ |
| ✅ `free-3` | [フリークエスト/第三話](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E7%AC%AC%E4%B8%89%E8%A9%B1) | 1839 | 37 | 3 | ⬜ |
| ✅ `free-kazeni` | [フリークエスト/風に吹かれて幾千里](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E9%A2%A8%E3%81%AB%E5%90%B9%E3%81%8B%E3%82%8C%E3%81%A6%E5%B9%BE%E5%8D%83%E9%87%8C) | 2557 | 54 | 0 | ⬜ |
| ✅ `free-ichikiyakou` | [フリークエスト/ふらり一鬼夜行](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E3%81%B5%E3%82%89%E3%82%8A%E4%B8%80%E9%AC%BC%E5%A4%9C%E8%A1%8C) | 1825 | 38 | 0 | ⬜ |
| ✅ `free-yukige` | [フリークエスト/月冴ゆる雪消の丘で](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E6%9C%88%E5%86%B4%E3%82%86%E3%82%8B%E9%9B%AA%E6%B6%88%E3%81%AE%E4%B8%98%E3%81%A7) | 5147 | 205 | 0 | ⬜ |
| ✅ `free-25ji` | [フリークエスト/オレの魂が叫ぶ25時](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E3%82%AA%E3%83%AC%E3%81%AE%E9%AD%82%E3%81%8C%E5%8F%AB%E3%81%B625%E6%99%82) | 2535 | 98 | 0 | ⬜ |
| ✅ `free-shitei` | [フリークエスト/風の師弟](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E9%A2%A8%E3%81%AE%E5%B8%AB%E5%BC%9F) | 2402 | 97 | 0 | ⬜ |
| ✅ `free-mugen` | [フリークエスト/夢幻の如く](https://wikiwiki.jp/tamacolle/%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E5%A4%A2%E5%B9%BB%E3%81%AE%E5%A6%82%E3%81%8F) | 2957 | 125 | 0 | ⬜ |

### ✅ 批次 08 · 任务 P4 · 曜日任务  （8 页，**全部完成**）

索引 + 七天。七页结构高度相似（周一~周五各 54 行表，周六 45、周日 41），**正因为相似才容易复制粘贴串行**——要逐日核对「素材产出」列与曜日限定敌人，尤其周六/周日行数偏少是否属实。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `daily` | [曜日クエスト](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88) | 1164 | 9 | 0 | ⬜ |
| ✅ `daily-mon` | [曜日クエスト/月曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E6%9C%88%E6%9B%9C%E6%97%A5) | 3215 | 54 | 2 | ⬜ |
| ✅ `daily-tue` | [曜日クエスト/火曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E7%81%AB%E6%9B%9C%E6%97%A5) | 3183 | 54 | 2 | ⬜ |
| ✅ `daily-wed` | [曜日クエスト/水曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E6%B0%B4%E6%9B%9C%E6%97%A5) | 3218 | 54 | 2 | ⬜ |
| ✅ `daily-thu` | [曜日クエスト/木曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E6%9C%A8%E6%9B%9C%E6%97%A5) | 3260 | 54 | 2 | ⬜ |
| ✅ `daily-fri` | [曜日クエスト/金曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E9%87%91%E6%9B%9C%E6%97%A5) | 3133 | 54 | 2 | ⬜ |
| ✅ `daily-sat` | [曜日クエスト/土曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E5%9C%9F%E6%9B%9C%E6%97%A5) | 2830 | 45 | 2 | ⬜ |
| ✅ `daily-sun` | [曜日クエスト/日曜日](https://wikiwiki.jp/tamacolle/%E6%9B%9C%E6%97%A5%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%2F%E6%97%A5%E6%9B%9C%E6%97%A5) | 2825 | 41 | 2 | ⬜ |

### ✅ 批次 09 · 任务 P5 · 幕间 + 短篇索引 + 情人节 4 年  （6 页，**全部完成**）

**`short-valentine2026` 只有 14 行表却 4100 字节**，而 2023–2025 三年各有 126/167/111 行大表——疑似 2026 年的表被写成了散文段落。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `makuma` | [幕間](https://wikiwiki.jp/tamacolle/%E5%B9%95%E9%96%93) | 1101 | 22 | 0 | ⬜ |
| ✅ `short` | [ショートエピソード](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89) | 1272 | 13 | 0 | ⬜ |
| ✅ `short-valentine2026` | [ショートエピソード/セントバレンタインデー2026](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%82%BB%E3%83%B3%E3%83%88%E3%83%90%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%A4%E3%83%B3%E3%83%87%E3%83%BC2026) | 4100 | 14 | 0 | ⬜ |
| ✅ `short-valentine2025` | [ショートエピソード/セントバレンタインデー2025](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%82%BB%E3%83%B3%E3%83%88%E3%83%90%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%A4%E3%83%B3%E3%83%87%E3%83%BC2025) | 5349 | 111 | 0 | ⬜ |
| ✅ `short-valentine2024` | [ショートエピソード/セントバレンタインデー2024](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%82%BB%E3%83%B3%E3%83%88%E3%83%90%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%A4%E3%83%B3%E3%83%87%E3%83%BC2024) | 6631 | 167 | 0 | ⬜ |
| ✅ `short-valentine2023` | [ショートエピソード/セントバレンタインデー2023](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%82%BB%E3%83%B3%E3%83%88%E3%83%90%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%A4%E3%83%B3%E3%83%87%E3%83%BC2023) | 5657 | 126 | 0 | ⬜ |

### ✅ 批次 10 · 任务 P6 · 短篇 · 夏季 / 相扑 / 年越  （10 页，**全部完成**）

**本批最可疑**：`short-sumo2025` 1760 字节且 **表格 0 行**（同系列 2023/2024 各有 291/303 行表）；`short-beach` 仅 586 字节；`short-shouen2026` 4327 字节却只有 14 行表。这三页几乎肯定缺内容。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `short-shouen2026` | [ショートエピソード/荘園の夏、日本の夏2026](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E8%8D%98%E5%9C%92%E3%81%AE%E5%A4%8F%E3%80%81%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%8F2026) | 4327 | 14 | 2 | ⬜ |
| ✅ `short-shouen2025` | [ショートエピソード/荘園の夏、日本の夏2025](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E8%8D%98%E5%9C%92%E3%81%AE%E5%A4%8F%E3%80%81%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%8F2025) | 7241 | 161 | 0 | ⬜ |
| ✅ `short-shouen2024` | [ショートエピソード/荘園の夏、日本の夏2024](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E8%8D%98%E5%9C%92%E3%81%AE%E5%A4%8F%E3%80%81%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%8F2024) | 8086 | 256 | 0 | ⬜ |
| ✅ `short-hyakumonogatari` | [ショートエピソード/夏に恋して百物語](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E5%A4%8F%E3%81%AB%E6%81%8B%E3%81%97%E3%81%A6%E7%99%BE%E7%89%A9%E8%AA%9E) | 3827 | 176 | 0 | ⬜ |
| ✅ `short-beach` | [ショートエピソード/夏の浜辺の調査隊](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E5%A4%8F%E3%81%AE%E6%B5%9C%E8%BE%BA%E3%81%AE%E8%AA%BF%E6%9F%BB%E9%9A%8A) | 586 | 15 | 0 | ⬜ |
| ✅ `short-summerfes2023` | [ショートエピソード/サマーフェス2023](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%82%B5%E3%83%9E%E3%83%BC%E3%83%95%E3%82%A7%E3%82%B92023) | 7229 | 177 | 0 | ⬜ |
| ✅ `short-sumo2025` | [ショートエピソード/どすこい！大相撲大会2025](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%81%A9%E3%81%99%E3%81%93%E3%81%84%EF%BC%81%E5%A4%A7%E7%9B%B8%E6%92%B2%E5%A4%A7%E4%BC%9A2025) | 1760 | 0 | 0 | ⬜ |
| ✅ `short-sumo2024` | [ショートエピソード/どすこい！大相撲大会2024](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%81%A9%E3%81%99%E3%81%93%E3%81%84%EF%BC%81%E5%A4%A7%E7%9B%B8%E6%92%B2%E5%A4%A7%E4%BC%9A2024) | 7706 | 303 | 0 | ⬜ |
| ✅ `short-sumo2023` | [ショートエピソード/どすこい！大相撲大会2023](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E3%81%A9%E3%81%99%E3%81%93%E3%81%84%EF%BC%81%E5%A4%A7%E7%9B%B8%E6%92%B2%E5%A4%A7%E4%BC%9A2023) | 6554 | 291 | 0 | ⬜ |
| ✅ `short-toshikoshi` | [ショートエピソード/年越し23-24](https://wikiwiki.jp/tamacolle/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%A8%E3%83%94%E3%82%BD%E3%83%BC%E3%83%89%2F%E5%B9%B4%E8%B6%8A%E3%81%9723-24) | 5349 | 131 | 0 | ⬜ |

### ✅ 批次 11 · 图鉴列表页（含 4 个 LIST_MODE 分类页）  （22 页，**全部完成**）

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `dex-kunidama` | [地魂男児/番号順](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E7%95%AA%E5%8F%B7%E9%A0%86) | 818 | 4 | 0 | ⬜ |
| ✅ `dex-kunidama-region` | [地魂男児/地域別](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E5%9C%B0%E5%9F%9F%E5%88%A5) | 1797 | 0 | 0 | ⬜ |
| ✅ `dex-kunidama-weapon` | [地魂男児/武器種別](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E6%AD%A6%E5%99%A8%E7%A8%AE%E5%88%A5) | 1766 | 0 | 0 | ⬜ |
| ✅ `dex-kunidama-material` | [地魂男児/素材別](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E7%B4%A0%E6%9D%90%E5%88%A5) | 1474 | 20 | 0 | ⬜ |
| ✅ `dex-kunidama-env` | [地魂男児/得意環境](https://wikiwiki.jp/tamacolle/%E5%9C%B0%E9%AD%82%E7%94%B7%E5%85%90%2F%E5%BE%97%E6%84%8F%E7%92%B0%E5%A2%83) | 486 | 0 | 0 | ⬜ |
| ✅ `dex-ayakashi` | [あやかし/番号順](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%82%84%E3%81%8B%E3%81%97%2F%E7%95%AA%E5%8F%B7%E9%A0%86) | 597 | 2 | 0 | ⬜ |
| ✅ `dex-ayakashi-attr` | [あやかし/属性別](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%82%84%E3%81%8B%E3%81%97%2F%E5%B1%9E%E6%80%A7%E5%88%A5) | 326 | 0 | 0 | ⬜ |
| ✅ `rokuhara` | [ロクハラ](https://wikiwiki.jp/tamacolle/%E3%83%AD%E3%82%AF%E3%83%8F%E3%83%A9) | 566 | 0 | 0 | ⬜ |
| ✅ `genchijin` | [現地人](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA) | 381 | 0 | 0 | ⬜ |
| ✅ `speed-table` | [小ネタ/速さ表](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF%2F%E9%80%9F%E3%81%95%E8%A1%A8) | 1616 | 76 | 0 | ⬜ |
| ✅ `seiyuu` | [声優一覧](https://wikiwiki.jp/tamacolle/%E5%A3%B0%E5%84%AA%E4%B8%80%E8%A6%A7) | 1248 | 54 | 0 | ⬜ |
| ✅ `artists` | [絵師一覧](https://wikiwiki.jp/tamacolle/%E7%B5%B5%E5%B8%AB%E4%B8%80%E8%A6%A7) | 2563 | 129 | 0 | ⬜ |
| ✅ `music` | [楽曲一覧](https://wikiwiki.jp/tamacolle/%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7) | 1087 | 23 | 0 | ⬜ |
| ✅ `genchijin-main1` | [現地人/メイン第一話](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%83%A1%E3%82%A4%E3%83%B3%E7%AC%AC%E4%B8%80%E8%A9%B1) | 1299 | 0 | 0 | ⬜ |
| ✅ `genchijin-main2` | [現地人/メイン第二話](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%83%A1%E3%82%A4%E3%83%B3%E7%AC%AC%E4%BA%8C%E8%A9%B1) | 1473 | 0 | 3 | ⬜ |
| ✅ `genchijin-main3` | [現地人/メイン第三話](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%83%A1%E3%82%A4%E3%83%B3%E7%AC%AC%E4%B8%89%E8%A9%B1) | 1551 | 0 | 3 | ⬜ |
| ✅ `genchijin-kazeni` | [現地人/サイド幾千里](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%82%B5%E3%82%A4%E3%83%89%E5%B9%BE%E5%8D%83%E9%87%8C) | 1460 | 0 | 5 | ⬜ |
| ✅ `genchijin-mugen` | [現地人/サイド夢幻の如く](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%82%B5%E3%82%A4%E3%83%89%E5%A4%A2%E5%B9%BB%E3%81%AE%E5%A6%82%E3%81%8F) | 682 | 0 | 2 | ⬜ |
| ✅ `genchijin-yukige` | [現地人/サイド雪消の丘で](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%82%B5%E3%82%A4%E3%83%89%E9%9B%AA%E6%B6%88%E3%81%AE%E4%B8%98%E3%81%A7) | 1627 | 0 | 2 | ⬜ |
| ✅ `genchijin-shitei` | [現地人/サイド風の師弟](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E3%82%B5%E3%82%A4%E3%83%89%E9%A2%A8%E3%81%AE%E5%B8%AB%E5%BC%9F) | 928 | 0 | 0 | ⬜ |
| ✅ `genchijin-shouen2024` | [現地人/荘園の夏、日本の夏2024](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E8%8D%98%E5%9C%92%E3%81%AE%E5%A4%8F%E3%80%81%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%8F2024) | 843 | 0 | 0 | ⬜ |
| ✅ `genchijin-shouen2025` | [現地人/荘園の夏、日本の夏2025](https://wikiwiki.jp/tamacolle/%E7%8F%BE%E5%9C%B0%E4%BA%BA%2F%E8%8D%98%E5%9C%92%E3%81%AE%E5%A4%8F%E3%80%81%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%8F2025) | 1087 | 0 | 3 | ⬜ |

### ✅ 批次 12 · 角色页 1/4（结构化 JSON）  （18 页，**全部完成**）

角色页无 md，检查 JSON 字段：立绘 / 战法 / 语音表 / 羁绊 / 典故 / 头像 / kv。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `mikawa` | [三河](https://wikiwiki.jp/tamacolle/%E4%B8%89%E6%B2%B3) | 14156 | 0 | 0 | ⬜ |
| ✅ `kazusa` | [上総](https://wikiwiki.jp/tamacolle/%E4%B8%8A%E7%B7%8F) | 13923 | 0 | 0 | ⬜ |
| ✅ `shimousa` | [下総](https://wikiwiki.jp/tamacolle/%E4%B8%8B%E7%B7%8F) | 14101 | 0 | 0 | ⬜ |
| ✅ `shimotsuke` | [下野](https://wikiwiki.jp/tamacolle/%E4%B8%8B%E9%87%8E) | 12220 | 0 | 0 | ⬜ |
| ✅ `tanba` | [丹波](https://wikiwiki.jp/tamacolle/%E4%B8%B9%E6%B3%A2) | 12984 | 0 | 0 | ⬜ |
| ✅ `iyo` | [伊予](https://wikiwiki.jp/tamacolle/%E4%BC%8A%E4%BA%88) | 16105 | 0 | 0 | ⬜ |
| ✅ `izu` | [伊豆](https://wikiwiki.jp/tamacolle/%E4%BC%8A%E8%B1%86) | 14180 | 0 | 0 | ⬜ |
| ✅ `iga` | [伊賀](https://wikiwiki.jp/tamacolle/%E4%BC%8A%E8%B3%80) | 14612 | 0 | 0 | ⬜ |
| ✅ `tajima` | [但馬](https://wikiwiki.jp/tamacolle/%E4%BD%86%E9%A6%AC) | 16609 | 0 | 0 | ⬜ |
| ✅ `shinano` | [信濃](https://wikiwiki.jp/tamacolle/%E4%BF%A1%E6%BF%83) | 15613 | 0 | 0 | ⬜ |
| ✅ `bichu` | [備中](https://wikiwiki.jp/tamacolle/%E5%82%99%E4%B8%AD) | 13529 | 0 | 0 | ⬜ |
| ✅ `bizen` | [備前](https://wikiwiki.jp/tamacolle/%E5%82%99%E5%89%8D) | 13306 | 0 | 0 | ⬜ |
| ✅ `bingo` | [備後](https://wikiwiki.jp/tamacolle/%E5%82%99%E5%BE%8C) | 13743 | 0 | 0 | ⬜ |
| ✅ `kaga` | [加賀](https://wikiwiki.jp/tamacolle/%E5%8A%A0%E8%B3%80) | 13809 | 0 | 0 | ⬜ |
| ✅ `suo` | [周防](https://wikiwiki.jp/tamacolle/%E5%91%A8%E9%98%B2) | 13603 | 0 | 0 | ⬜ |
| ✅ `izumi` | [和泉](https://wikiwiki.jp/tamacolle/%E5%92%8C%E6%B3%89) | 14611 | 0 | 0 | ⬜ |
| ✅ `inaba` | [因幡](https://wikiwiki.jp/tamacolle/%E5%9B%A0%E5%B9%A1) | 14411 | 0 | 0 | ⬜ |
| ✅ `tosa` | [土佐](https://wikiwiki.jp/tamacolle/%E5%9C%9F%E4%BD%90) | 15474 | 0 | 0 | ⬜ |

### ✅ 批次 13 · 角色页 2/4（结构化 JSON）  （18 页，**全部完成**）

角色页无 md，检查 JSON 字段：立绘 / 战法 / 语音表 / 羁绊 / 典故 / 头像 / kv。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `iki` | [壱岐](https://wikiwiki.jp/tamacolle/%E5%A3%B1%E5%B2%90) | 13278 | 0 | 0 | ⬜ |
| ✅ `yamato` | [大和](https://wikiwiki.jp/tamacolle/%E5%A4%A7%E5%92%8C) | 14448 | 0 | 0 | ⬜ |
| ✅ `osumi` | [大隅](https://wikiwiki.jp/tamacolle/%E5%A4%A7%E9%9A%85) | 15115 | 0 | 0 | ⬜ |
| ✅ `awa` | [安房](https://wikiwiki.jp/tamacolle/%E5%AE%89%E6%88%BF) | 13254 | 0 | 0 | ⬜ |
| ✅ `owari` | [尾張](https://wikiwiki.jp/tamacolle/%E5%B0%BE%E5%BC%B5) | 15201 | 0 | 0 | ⬜ |
| ✅ `yamashiro` | [山城](https://wikiwiki.jp/tamacolle/%E5%B1%B1%E5%9F%8E) | 12275 | 0 | 0 | ⬜ |
| ✅ `hitachi` | [常陸](https://wikiwiki.jp/tamacolle/%E5%B8%B8%E9%99%B8) | 16106 | 0 | 0 | ⬜ |
| ✅ `shima` | [志摩](https://wikiwiki.jp/tamacolle/%E5%BF%97%E6%91%A9) | 11944 | 0 | 0 | ⬜ |
| ✅ `harima` | [播磨](https://wikiwiki.jp/tamacolle/%E6%92%AD%E7%A3%A8) | 14743 | 0 | 0 | ⬜ |
| ✅ `hyuga` | [日向](https://wikiwiki.jp/tamacolle/%E6%97%A5%E5%90%91) | 13863 | 0 | 0 | ⬜ |
| ✅ `musashi` | [武蔵](https://wikiwiki.jp/tamacolle/%E6%AD%A6%E8%94%B5) | 18597 | 0 | 0 | ⬜ |
| ✅ `kawachi` | [河内](https://wikiwiki.jp/tamacolle/%E6%B2%B3%E5%86%85) | 15024 | 0 | 0 | ⬜ |
| ✅ `kai` | [甲斐](https://wikiwiki.jp/tamacolle/%E7%94%B2%E6%96%90) | 15226 | 0 | 0 | ⬜ |
| ✅ `sagami` | [相模](https://wikiwiki.jp/tamacolle/%E7%9B%B8%E6%A8%A1) | 14522 | 0 | 0 | ⬜ |
| ✅ `soma` | [相馬](https://wikiwiki.jp/tamacolle/%E7%9B%B8%E9%A6%AC) | 3059 | 0 | 0 | ⬜ |
| ✅ `iwami` | [石見](https://wikiwiki.jp/tamacolle/%E7%9F%B3%E8%A6%8B) | 13463 | 0 | 0 | ⬜ |
| ✅ `chikuzen` | [筑前](https://wikiwiki.jp/tamacolle/%E7%AD%91%E5%89%8D) | 15801 | 0 | 0 | ⬜ |
| ✅ `chikugo` | [筑後](https://wikiwiki.jp/tamacolle/%E7%AD%91%E5%BE%8C) | 13007 | 0 | 0 | ⬜ |

### ✅ 批次 14 · 角色页 3/4（结构化 JSON）  （18 页，**全部完成**）

角色页无 md，检查 JSON 字段：立绘 / 战法 / 语音表 / 羁绊 / 典故 / 头像 / kv。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `kii` | [紀伊](https://wikiwiki.jp/tamacolle/%E7%B4%80%E4%BC%8A) | 15726 | 0 | 0 | ⬜ |
| ✅ `hizen` | [肥前](https://wikiwiki.jp/tamacolle/%E8%82%A5%E5%89%8D) | 14200 | 0 | 0 | ⬜ |
| ✅ `noto` | [能登](https://wikiwiki.jp/tamacolle/%E8%83%BD%E7%99%BB) | 14080 | 0 | 0 | ⬜ |
| ✅ `wakasa` | [若狭](https://wikiwiki.jp/tamacolle/%E8%8B%A5%E7%8B%AD) | 12989 | 0 | 0 | ⬜ |
| ✅ `satsuma` | [薩摩](https://wikiwiki.jp/tamacolle/%E8%96%A9%E6%91%A9) | 5593 | 0 | 0 | ⬜ |
| ✅ `sanuki` | [讃岐](https://wikiwiki.jp/tamacolle/%E8%AE%83%E5%B2%90) | 17520 | 0 | 0 | ⬜ |
| ✅ `bungo` | [豊後](https://wikiwiki.jp/tamacolle/%E8%B1%8A%E5%BE%8C) | 15274 | 0 | 0 | ⬜ |
| ✅ `echizen` | [越前](https://wikiwiki.jp/tamacolle/%E8%B6%8A%E5%89%8D) | 13014 | 0 | 0 | ⬜ |
| ✅ `echigo` | [越後](https://wikiwiki.jp/tamacolle/%E8%B6%8A%E5%BE%8C) | 15992 | 0 | 0 | ⬜ |
| ✅ `omi` | [近江](https://wikiwiki.jp/tamacolle/%E8%BF%91%E6%B1%9F) | 12784 | 0 | 0 | ⬜ |
| ✅ `totomi` | [遠江](https://wikiwiki.jp/tamacolle/%E9%81%A0%E6%B1%9F) | 13843 | 0 | 0 | ⬜ |
| ✅ `nagato` | [長門](https://wikiwiki.jp/tamacolle/%E9%95%B7%E9%96%80) | 13801 | 0 | 0 | ⬜ |
| ✅ `awa2` | [阿波](https://wikiwiki.jp/tamacolle/%E9%98%BF%E6%B3%A2) | 14217 | 0 | 0 | ⬜ |
| ✅ `mutsu` | [陸奥](https://wikiwiki.jp/tamacolle/%E9%99%B8%E5%A5%A5) | 12844 | 0 | 0 | ⬜ |
| ✅ `oki` | [隠岐](https://wikiwiki.jp/tamacolle/%E9%9A%A0%E5%B2%90) | 14409 | 0 | 0 | ⬜ |
| ✅ `suruga` | [駿河](https://wikiwiki.jp/tamacolle/%E9%A7%BF%E6%B2%B3) | 14913 | 0 | 0 | ⬜ |
| ✅ `akaname` | [あかなめ](https://wikiwiki.jp/tamacolle/%E3%81%82%E3%81%8B%E3%81%AA%E3%82%81) | 3212 | 0 | 0 | ⬜ |
| ✅ `arctos` | [アルクトス](https://wikiwiki.jp/tamacolle/%E3%82%A2%E3%83%AB%E3%82%AF%E3%83%88%E3%82%B9) | 2128 | 0 | 0 | ⬜ |

### ✅ 批次 15 · 角色页 4/4（结构化 JSON）  （17 页，**全部完成**）

角色页无 md，检查 JSON 字段：立绘 / 战法 / 语音表 / 羁绊 / 典故 / 头像 / kv。

| 本地 slug | 原 wiki 页名 | 字节 | 表行 | 图 | 状态 |
| :-- | :-- | --: | --: | --: | :-- |
| ✅ `namomihagi` | [ナモミハギ](https://wikiwiki.jp/tamacolle/%E3%83%8A%E3%83%A2%E3%83%9F%E3%83%8F%E3%82%AE) | 3478 | 0 | 0 | ⬜ |
| ✅ `riku` | [りく](https://wikiwiki.jp/tamacolle/%E3%82%8A%E3%81%8F) | 2079 | 0 | 0 | ⬜ |
| ✅ `natsuhito` | [夏人](https://wikiwiki.jp/tamacolle/%E5%A4%8F%E4%BA%BA) | 4282 | 0 | 0 | ⬜ |
| ✅ `yakou-san` | [夜行さん](https://wikiwiki.jp/tamacolle/%E5%A4%9C%E8%A1%8C%E3%81%95%E3%82%93) | 2710 | 0 | 0 | ⬜ |
| ✅ `azukiarai` | [小豆洗い](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E8%B1%86%E6%B4%97%E3%81%84) | 3203 | 0 | 0 | ⬜ |
| ✅ `zashikiwarashi` | [座敷わらし](https://wikiwiki.jp/tamacolle/%E5%BA%A7%E6%95%B7%E3%82%8F%E3%82%89%E3%81%97) | 3965 | 0 | 0 | ⬜ |
| ✅ `shippeitaro` | [悉平太郎](https://wikiwiki.jp/tamacolle/%E6%82%89%E5%B9%B3%E5%A4%AA%E9%83%8E) | 4199 | 0 | 0 | ⬜ |
| ✅ `kasha` | [火車](https://wikiwiki.jp/tamacolle/%E7%81%AB%E8%BB%8A) | 4222 | 0 | 0 | ⬜ |
| ✅ `karasutengu` | [烏天狗](https://wikiwiki.jp/tamacolle/%E7%83%8F%E5%A4%A9%E7%8B%97) | 2443 | 0 | 0 | ⬜ |
| ✅ `aoandon` | [青行燈](https://wikiwiki.jp/tamacolle/%E9%9D%92%E8%A1%8C%E7%87%88) | 3905 | 0 | 0 | ⬜ |
| ✅ `nue` | [鵺](https://wikiwiki.jp/tamacolle/%E9%B5%BA) | 3219 | 0 | 0 | ⬜ |
| ✅ `inomori` | [猪森](https://wikiwiki.jp/tamacolle/%E7%8C%AA%E6%A3%AE) | 2919 | 0 | 0 | ⬜ |
| ✅ `nekonoya` | [猫乃屋](https://wikiwiki.jp/tamacolle/%E7%8C%AB%E4%B9%83%E5%B1%8B) | 4409 | 0 | 0 | ⬜ |
| ✅ `kotetsumaru` | [虎鉄丸](https://wikiwiki.jp/tamacolle/%E8%99%8E%E9%89%84%E4%B8%B8) | 2050 | 0 | 0 | ⬜ |
| ✅ `hyakuta` | [百太](https://wikiwiki.jp/tamacolle/%E7%99%BE%E5%A4%AA) | 3565 | 0 | 0 | ⬜ |
| ✅ `shirafu` | [白布](https://wikiwiki.jp/tamacolle/%E7%99%BD%E5%B8%83) | 3807 | 0 | 0 | ⬜ |
| ✅ `hatori` | [羽鳥](https://wikiwiki.jp/tamacolle/%E7%BE%BD%E9%B3%A5) | 2628 | 0 | 0 | ⬜ |

---

## 进度总览

| 批次 | 名称 | 页数 | 状态 |
| :-- | :-- | --: | :-- |
| 01 | 小趣闻系列 | 8 | ✅ 8/8 |
| 02 | 资料·其他 剩余页 | 17 | ✅ 17/17 |
| 03 | 基本情报（上） | 11 | ✅ 11/11 |
| 04 | 基本情报（下） | 10 | ✅ 10/10 |
| 05 | 任务 P1 · 主线 | 4 | ✅ 4/4 |
| 06 | 任务 P2 · 支线 | 7 | ✅ 7/7 |
| 07 | 任务 P3 · 自由任务 | 10 | ✅ 10/10 |
| 08 | 任务 P4 · 曜日任务 | 8 | ✅ 8/8 |
| 09 | 任务 P5 · 幕间+短篇索引+情人节 | 6 | ✅ 6/6 |
| 10 | 任务 P6 · 短篇 夏季/相扑/年越 | 10 | ✅ 10/10 |
| 11 | 图鉴列表页 | 22 | ✅ 22/22 |
| 12 | 角色页 1/4 | 18 | ✅ 18/18 |
| 13 | 角色页 2/4 | 18 | ✅ 18/18 |
| 14 | 角色页 3/4 | 18 | ✅ 18/18 |
| 15 | 角色页 4/4 | 17 | ✅ 17/17 |
| — | **合计** | **184** | |

---

## 最终状态

**15 个批次、184 个页面全部比对完毕。**

| 项目 | 结果 |
| :-- | :-- |
| 缺陷 D1 表内头像缺失 | ✅ 已建 `[char:]` 语法，全站补齐 |
| 缺陷 D2 表头列数不匹配 | ✅ 已修 |
| 缺陷 D3 折叠大表压成一句话 | ✅ 已修 |
| 缺陷 D4 汇总行缺失 | ✅ 已补 |
| 缺陷 D5 任务页图标 | ✅ 核对完毕 |
| **缺陷 D6 单元格被静默吞掉** | ✅ **24 文件 / 266 表 / ~3112 格，全站清零** |
| 缺陷 D7 分隔行列数不足 | ✅ 已修 |
| 测试 | **71 → 157** |
| 新增图片 | 172 张（Cut-in 51 / 印章 50 / 噬魂 68 / 集合绘 3） |
| 补建角色页 | B（七番，原 wiki 有而本站缺） |

---

## 比对日志

### 2026-08-19
- ✅ 全站「豆知识」→「小趣闻」改名（`faq.md`、`neta*.md` ×8、`manifest.ts`，共 10 个文件）
- ✅ 抓取原 `小ネタ` 母页（6 chunk）与 `衣装表`（7 chunk），确认缺陷 D1–D4
- ✅ 攻略·任务 45 页按原 wiki 页面树切成 **6 个 Part**：主线 4 / 支线 7 / 自由任务 10 / 曜日任务 8 / 幕间+短篇索引+情人节 6 / 短篇夏季·相扑·年越 10
- ✅ **批次 01 启动**：实现 `[char:slug]` 角色引用语法（`src/markdown/chars.ts`、`charRefExtension`、`.tc-charref` 样式），新增 13 项测试
- ✅ **发现并补建缺失角色页 `B`（七番）** —— 原 wiki 有 `wikiwiki.jp/tamacolle/B`，本站 71 个角色里没有。我一度把它误当成 `shirafu`（白布，九番，妖怪），核对后确认是两个不同角色。已抓取头像＋2 张立绘，补 `src/data/pages/b.json`、manifest、icon-ext，角色数 71 → **72**
- ✅ `neta-isho.md` 重建：表头 8 列→**12 列**（补回 情人节/浴衣/兜裆布/圣诞/专用），51 地魂 + 11 六原全部带头像（90 处），补回原 wiki 的**合计行**，环境对应表也改用头像
- ✅ `neta-calendar.md` 重建：原本**每周的日期行全丢失**（只剩第一周表头，导致「伊予」看着像 1/7 实为 1/14），且每月末尾的残缺行把 **赤熊百太、壹岐、相馬** 截断。现 12 个月 × 完整周日期行，61 处头像
- ✅ 修 `free-2.md` 两张敌编成表的分隔行列数（末列「后排」曾整列不显示）
- 🔶 **发现 D6**：全站 24 文件 / 266 表 / ~3112 单元格因表头列数不足而不显示，已建立隔离清单与回归测试
- ✅ `neta.md`（D3 已清）：「きぐぱ履歴」由一句话还原为 **2022–2026 五张年份表、47 条**（月份／地魂头像／动物主题，日文原名附中译）；**TIPS 六节全部按原文补齐**（战斗 2→7 条、CP 3→6 条、属性 2→**13 条**，补回魂守冷温、一刀两断、神妖连结等）；**补回原页整节缺失的「その他関係」**（赠呈品囤货、购物袋兑换码、历代集合绘 3 张图已下载）
- ✅ `neta-cutin.md`：原本整张 Cut-in 表被跳过（只写「请去角色页看」）。新增 `scripts/fetch_cutins.py`，**51 张 Cut-in 全部下载**（2.1 MB，零失败）。拔魂技名表原缺 **萨摩、陆奥** 两名 → 改为从 `char.kv.拔魂技巧名` 直接生成，51 名齐全并补上「效果」列
- ✅ `neta-hanko.md`：**引用的 49 张印章图一张都不存在**（靠 `onerror` 静默隐藏，页面上整片空白，肉眼看不出坏）。新增 `scripts/fetch_seals.py`，按番号逐个试抓，**50 张印章下载完成**（萨摩原 wiki 尚无印章，属实）。页面由罗马字图注的平铺网格改为**原 wiki 的按番号 5 列网格**（一番～七十六番），图注改为角色头像+中文名
- ✅ `neta-era.md` / `neta-kucho.md`：逐项核对 C1–C7，表格列数一致（4 列 / 6 列）、无缺图、章节与原页一致，**无需改动**
- ✅ `neta-kuu.md`：本地 68 张图文件名被压成无意义的 `kuu_0..67`，**分类信息全部丢失**，页面是一片无名图平铺。新增 `scripts/fetch_kuukon.py` 按原文件名重抓，**68 张全部成功**（数量与旧文件完全吻合，反证分类还原无遗漏），还原原页 **11 个分节**（球型/史莱姆型/摩罗神型/兽型/动物型/人型/幽灵型/现象型/合体型 + 限定力士型 + 现地人），区分「战斗图标 40」与「立绘 28」，补回原页「名称均为暂定」等 4 条免责说明。旧 `kuu_*.jpg` 已清理
- 🎉 **批次 01 完成（8/8）**。累计新增 4 个抓取脚本、下载 172 张图（51 Cut-in + 50 印章 + 68 噬魂 + 3 集合绘）、测试 71 → **104**
- ✅ **批次 02 完成（17/17）**
  - `ranking` / `today100`：**误译**。原页是 PukiWiki 的**页面访问计数**插件（Total / Today），本地写成「按人气排名的角色 Top 100」。已改为如实说明是页面浏览量、与角色人气投票无关，并注明静态站不镜像该功能
  - `wiki-syntax`：这页是**我自己建的**本站语法说明，却在 manifest 里挂了假的日文原名「本Wiki拡張記法」—— 原 wiki 查证确认**该页不存在**。已把 `ja` 改为 `—`、加注「本站自建、原 Wiki 无对应页面」，并指向真正的[排版规则](#/page/format-rule)
  - `help-ayakashi`：加入时期原页是**带头像的 5 列对应表**，本地把活动名与角色名拆成了**两条互不对应的列表**（4 个活动名 + 5 个角色名混排，读者无法知道谁对应哪个活动）。已重建为表格，10 处头像
  - `tpl-genchijin`：原页是可复制的模板骨架表，本地压成一句散文。已补回字段表 + 代码块骨架
  - `board-*` ×3 / `wiki-opinion` / `edit-task` / `wiki-help` / `format-rule` / `help-kunidama` / `tpl-char` / `tpl-ayakashi` / `tpl-rokuhara` / `tpl-quest`：逐项核对 C1–C7，**未发现问题，未改动**
  - 🐛 **修了我自己的检测器 bug**：`extractTables` 没跳过围栏代码块，把模板页示例代码里的 `|` 行误判为表格，导致 `tpl-genchijin.md` 被误报成 D6。已修，影响 3 个页面的判定
- ✅ **批次 03 完成（11/11）**
  - `drop-table`：本批最重。四个问题同时存在 —— ①表头 `敵配置とドロップ`、`[未発見]` 等**未翻译**；②每张表的说明文字（周回参考数据、路线分支、验证方针）被**全部挤进 `###` 标题**，最长一行 190 字；③两个「周六副业」小节**标题完全相同**，实为智识表与记文表；④D6 结构问题。已用 `[<]` 合并语法还原原页「每场战斗横跨前列/后列两栏」的嵌套表头，10 张表列数全部一致，说明文字移入引用块，补回原页的记号说明表。**成为 D6 清单上第一个毕业的文件（24 → 23）**
  - `gacha`：出货率表原页每行都有物品图标，本地是纯文字。已下载 5 张（地魂、小/中/大/稀有大魂守，注意它们分散在 `メインストーリー`、`アイテム`、`ガチャについて` 三个不同页面下），并补回「概率仅为大致数值、相加不等于 100%」等说明
  - `system` / `quest-guide` / `battle` / `drop` / `faq` / `faq-beginner` / `level` / `formation` / `stat-formula`：逐项核对 C1–C7。`system` 虽只有 1005 字，但原页本身就只有 3 节且已全部译出，**非缺失**；其余 8 页表格列数一致、图片零缺失，**未发现问题，未改动**
  - 🐛 又修了一处自己的测试 bug：断言把 `<img>` 与 Markdown `![]()` 两种图片语法混为一谈，导致误判
- ✅ **批次 04 完成（10/10）**
  - `goods`：5 张表错位，成因是**角色名单换行续行时丢了首列**（活动名）。用 `[^]` 纵向合并 + `[<]` 横向合并还原，并把 84 处角色名换成头像引用。**D6 清单 23 → 22**
  - ⚠️ **我在修这页时自己弄坏过数据**：批量脚本误给 4 张表的**表头**也加了 `[^]`（表头没有上一行可合并），随后「清理表头」时又整体左移一列，**把活动名整列删掉了**（`けもケット13`、`ブースト！3` 等全部消失）。已回原页逐张重建表 3 / 8 / 9 / 17，并加测试锁住这 5 个活动名不得再丢
  - 另修：`サントラ` 表被我误改成 2 列，实际原页是 3 列（标签 + 曲目前半 + 后半），已改回
  - `hp-pattern` / `login-bonus` / `item` / `manor` / `expedition` / `update-log` / `bug` / `links` / `glossary`：逐项核对 C1–C7，表格列数一致、图片零缺失（`item` 153 张图全在），**未发现问题，未改动**
- ✅ **批次 05 完成（4/4）**
  - `main-story`：索引页原本只有 498 字。原页「概要」里有两条**重要机制说明**被整段丢失 —— ①主线可重读，但**战斗只发生一次**，通关后重读不再战斗；②**例外是 BOSS 战**，可反复挑战累积伤害直到削完 HP。这正是决战任务的核心规则。另外三话标题都缺了副题（原页是「はじまりの旅 甲州街道」而非只有「甲州街道」），已补全为「启程之旅 / 传递心愿 / 强者们的雪路」
  - `main-1` / `main-2` / `main-3`：「登场人物」表原页是**带头像的角色格**（含「初期男児」图标），本地是纯文字链接。已改用 `[char:]`，共 11 处头像，并套上 `:::spoiler` 对应原页的剧透折叠
  - 三话的关卡表、决战表、敌配置表列数均一致，**5 张地图图片零缺失**（`map_boss_m1` 等此前已下载），未发现其他问题
- ✅ **批次 06 完成（7/7）**
  - `side-story`：索引页原本 507 字，问题比 `main-story` 更多。①原页「概要」的**重读机制**（战斗只发生一次）整段缺失；②六篇标题**全部只有副题没有正题**（原页是「しあわせはこぶ小さな旅人 風に吹かれて幾千里」，本地只有「迎风千里」）；③**排序错误** —— 原页按实装顺且明确警告「与游戏内排列不同」，零卷目（β 版复刻·如梦似幻）应排在三卷目之后，本地按游戏内顺序排且丢了这条警告；④**整节缺失**：原页还有「恒常化的限定活动」表（相扑大会 2023/2024/2025 三条）
  - 六篇支线：「登场人物」全是纯文字，其中 `side-yukige`、`side-shitei` **连链接都没有**。已统一改用 `[char:]`，共 **25 处头像**，套 `:::spoiler` 对应原页剧透折叠
  - 各篇的章节流程表、决战表列数一致，图片零缺失，未发现其他问题
- ✅ **批次 07 完成（10/10）** —— 本批是 D6 的主战场
  - 四页在 D6 清单上，实测共 **649 个单元格在页面上完全不显示**：`free-yukige` 264 格、`free-mugen` 161 格、`free-25ji` 124 格、`free-shitei` 100 格
  - 摸清了原 wiki 的两种嵌套表模板：①**任务情报表**（宽 5，成对的「标签行/数值行」列数各不相同）；②**战斗表**（宽 3，`前列|后列|评价S经验值·报酬`，第三列纵向合并所以多数行只有 2 格）
  - 新增 `scripts/fix_quest_tables.py` 做通用转换：任务情报表按列数均分并用 `[<]` 补位（同列数的行自然对齐），战斗表的 2 格行补 `[^]` 与上行合并第三列。**只改结构，不动任何单元格文字**
  - 共修 **66 张表**，四页全部列数一致。写了内容校验：把源文本每个非空单元格拿去渲染结果里找，**四页均为「内容零丢失」**，并固化成测试
  - **D6 清单 22 → 18**
  - `free-quest` / `free-1` / `free-2` / `free-3` / `free-kazeni` / `free-ichikiyakou`：核对 C1–C7，表格列数一致、13 张地图图片零缺失，**未发现问题，未改动**
- ✅ **批次 08 完成（8/8）**
  - 七天的关卡表在 D6 清单上，共 **192 格不显示**（周一~周五各 32 格、周六周日各 16 格）。实测 `daily-fri` 的「任务情報」表被渲染成**单列** —— 舞台/气候/敌倾向/报酬/掉落/经验全部不可见
  - 复用批次 07 的 `scripts/fix_quest_tables.py` 修好列数，但**核查时发现均分产生了语义错位**：原页「掉落道具」跨 2 列（容器+素材）、「获得报酬」1 列、「经验值」跨 2 列，均分却把 4 格行错配成 2/1/1/1。已按标签行的真实分组重排为 1/1/1/2，并把这条断言写进测试
  - 七页均通过「内容零丢失」校验（源文本每个非空单元格都能在渲染结果中找到）
  - **D6 清单 18 → 11**，剩余 11 个全部集中在短篇活动页
  - `daily` 索引页：7 列一致、未被脚本改动。校验器报的 7 条「丢失」是**误报** —— Markdown 链接 `[周一](#/page/daily-mon)` 渲染成 `<a>` 后原文自然匹配不上，已确认非真实问题
  - 新增测试「七天的任务地各不相同」防复制粘贴串行；顺带确认 `daily.md` 里周日担当 **B** 的链接因先前补建角色页而生效
- ✅ **批次 09 完成（6/6）**
  - 情人节 2023/2024/2025 在 D6 清单上，共 **352 格不显示**（2024 年 146 格、2023 年 105 格、2025 年 101 格）。复用 `fix_quest_tables.py` 修好 37 张表，再用批次 08 的语义重排逻辑修正「掉落道具跨 2 列」的列归属
  - **`short-valentine2026` 印证了 TaskList 的预判**：4100 字节却只有 2 张表 —— 甲/乙两套**敌编成被整段压成散文**（「一战目（评价S · 经验值 36）：刀 Lv8、术 Lv6、短刀 Lv10……」全塞在一行里）。已还原成 8 张标准战斗表，该页表数 2 → **10**
  - 登场人物（D1）：2023/2024 的「地魂男児」表是纯文字，已改用 `[char:]` 共 10 处头像；顺带译出 `## 登場人物`、`## ストーリー`、「部隊員として登場しない地魂リスト」等未翻译小标题
  - 六页均通过内容零丢失校验（`short` 索引页的 4 条为 Markdown 链接渲染导致的已知误报，同 `daily`）
  - **D6 清单 11 → 8**
- ✅ **批次 10 完成（10/10）** —— 🎉 **D6 全站清零**
  - 八页在 D6 清单上，共 **1577 格不显示**，是全站最重的一批：`short-sumo2024` 427 格、`short-sumo2023` 395 格、`short-shouen2024` 186 格、`short-hyakumonogatari` 153 格、`short-summerfes2023` 152 格、`short-shouen2025` 144 格、`short-toshikoshi` 120 格、`short-beach` 16 格。修复 137 张表 + 24 张任务情报表语义重排，共 254 张表全部对齐
  - **两处 TaskList 预判全部命中**：
    - `short-sumo2025`（标注「1467 字节且表格 0 行」）—— 三节的**登场地魂全被压成顿号长串**（最长一节 44 人挤在一行），比赛候补也是散文列表。已还原为头像网格，表数 0 → **3**，**76 处头像**
    - `short-beach`（标注「仅 327 字节」）—— 登场人物纯文字 + `## 登場人物`/`## ストーリー`/`限定水着幕間` 等未译。已改 **16 处头像**并译出标题
  - 十页全部通过内容零丢失校验
  - **测试机制升级**：隔离清单清空后，把「只能变短」的宽松校验改为**全站强制校验**，新增截断表会直接失败
- ✅ **批次 11 完成（22/22）**
  - `dex-ayakashi-attr`：**漏了 3 名妖怪**。原页面按木火土金水列了 10 个，但站内共 13 名妖怪 —— **阿克托斯、洗红豆、陆**因没有属性赋予效果被整个漏掉。已改为**从 `char.kv.追加效果` 自动生成**，13 名齐全并新增「无属性赋予」分组，13 处头像
  - `seiyuu`：三个问题。①**表头名不副实** —— 写「声优 | 负责角色 | 备注」，但第 3 列放的其实是第二个角色，原页是 7 列（声优 + 5 角色格 + 備考）；②**丢了原页的備考列**（獣楽座メンバー、Vtuber）；③岡本悠希 担当「肥前 / 伊豆 / **B**」，本地只列两个（B 又漏了）。已改为从 `char.voice` 自动汇总，**38 位声优 / 72 个担当关系**、72 处头像，备考按原页补回
  - 🐛 **修了角色 JSON 里的 3 处声优名错字**：同一个人在不同角色页写法不一致 —— `蒼井ヰ`→`蒼乃ヰ`（若狭）、`天乙淮花`→`天乙准花`（加贺）、`徳留信乃佑`→`徳留慎乃佑`（阿克托斯）。这类错字会让声优表凭空多出人来，已加测试锁死
  - 7 个 `LIST_MODE` 页（`dex-kunidama` 系列 5 个 + `dex-ayakashi` + `rokuhara`）由 Vue 组件渲染，md 仅为外壳，核对无误
  - 其余 13 页（`speed-table`、`artists`、`music`、9 个 `genchijin-*`）逐项过 C1–C7，表格列数一致、图片零缺失，**未发现问题，未改动**
- ✅ **批次 12 完成（18/18）**
  - 建立角色页的机械校验维度：kv 九项 / status / 立绘 / 战法 / 羁绊 / 语音表 / 典故 / 小知识 / 说明译文，一次性扫全部 72 页
  - 🐛 **`iyo` 缺 kv「武器种」** —— 51 名地魂里唯一一个。回原页确认为**弓**，已补。补后 51 名 kv 九项全齐
  - 🐛 **武器种分类会让武藏掉队** —— 全站武器种取值里出现「砲撃」1 个 vs「大砲」3 个。回原页核实：**原 wiki 自己就用了两种写法**（武蔵的资料室写「砲撃」，肥前/讃岐/豊後写「大砲」），不是本地写错。因此**数据按原文如实保留**，改在 `CharListTable.vue` 加 `WEAPON_ALIAS` 归一化 —— 否则「按武器种」分类页上武藏会单独成一组排在正规七类之后
  - 本批 18 页的语音表列数、战法图标、立绘本地文件、编辑占位符残留均无问题
  - **新增 4 条测试，作用于全部 72 个角色页**：kv 九项齐全 / 武器种取值合法 / 立绘文件存在 / 语音表列数一致
- ✅ **批次 13 完成（18/18）**
  - 🐛 **石見・筑前的初始能力值各漏一项** —— 只有 7 项（其余地魂都是 8 项）。原因是原页把这一栏写作**「技術」**而其他角色写「技」，早期转换只认「技」，于是「技巧」整项丢失。回原页取值补入（石見 14、筑前 23），51 名地魂现在全是标准 8 项且键顺序一致
  - 🐛 **六原职员 `soma`（相馬聯）的语音表整块缺失** —— 原页有资料室/触摸/庄园/入浴/沐浴/羁绊共 10 条台词，本地 `voiceMd` 为空。已补齐并译出
  - ✅ **据实核对：`soma` 的典故与小知识确为空** —— 原页该两节是未填写的占位（「元ネタの説明を記述してください」），非本地遗漏，故不补
  - **新增 3 条测试**：地魂 status 八项齐全且顺序一致 / `soma` 语音表非空 / 全站无原 wiki 编辑占位提示残留
- ✅ **批次 14 完成（18/18）**
  - 🐛 **`satsuma`（薩摩）语音表整块缺失** —— 2026/8/14 刚实装的新角色，`voiceMd` 为空。原页已有 27 条实录台词（普通 14 + 战斗 13），已全部补齐译出。**原页仍是占位的部分（个室 5 条、沐浴、限界突破等）我没有编造**
  - 🐛 **`arctos` 与 6 名六原职员的 kv 全空** —— 抽查猫乃屋原页确认确有属性表（实装日/所属/年龄/生日/担当曜日）。已补 7 人。**据实说明：猫乃屋是逐字抓取核实的，其余 5 人只补了能交叉确认的字段（实装日/所属/担当曜日），年龄与生日未编造**
  - 🐛 **修正了我自己的统计口径** —— 先前用「译文字段为空」判漏译，会把「原页本来就没写」误报。改用**「有日文原文却无译文」**为判据后，全站结果为**零漏译**。这条已固化成测试
  - `riku` / `azukiarai` 的 kv 确为空：原页无属性表，属实，测试中显式豁免并注明理由
- ✅ **批次 15 完成（17/17）—— 🎉 全部 15 个批次、184 页比对完毕**
  - 🐛 **`yakou-san`（夜行先生）语音表整块缺失** —— 13 名妖怪里唯一一个。原页有庄园/资料室/声闻 + 战斗共 8 组台词，已补齐；顺带补上原页「小ネタ」的两条（声闻名词一览、搭档无头马「黑铁」的说明）
  - 🐛 **`karasutengu`（乌鸦天狗）语音缺三条且表结构不一致** —— 缺资料室、走光、神妖连结，且是 3 列表（其余都是 4 列）。已补齐并统一为 4 列
  - ✅ 至此**全站 72 张语音表统一为「分类/场景/子场景/台词」四列**，且**每个角色都有语音表，无一例外**
  - `karasutengu` 的典故在原页确为占位（「元ネタの説明を記述してください」），属实不补
