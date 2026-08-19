---
id: wiki-syntax
title: "本站扩展语法"
ja: "—"
source: ""
---

## 本站扩展语法

:::note
本页是**中文站自建**的说明页，原 Wiki 没有对应页面。
这里记录的是本站 Markdown 解释器额外支持的语法，供本站编辑者参考。
原 Wiki 自身的排版规则请见[排版规则](#/page/format-rule)。
:::

本站正文用 Markdown 书写，并在其上扩展了几种原版 Markdown 没有、
但翻译原 Wiki 时确实需要的写法（文字颜色、注音、合并单元格表格等）。

:::info 说明
所有扩展语法都由站内自己的解释器处理（`src/markdown/`），
不依赖任何外部服务；标准 Markdown 的写法全部照常可用。
:::

## 文字颜色

写法：`[color:色名]文字[/color]`

| 写法 | 效果 |
| :-- | :-- |
| `[color:red]朱色的字[/color]` | [color:red]朱色的字[/color] |
| `[color:kon]藏青的字[/color]` | [color:kon]藏青的字[/color] |
| `[color:gold]金色的字[/color]` | [color:gold]金色的字[/color] |
| `[color:#3366ff]指定色值[/color]` | [color:#3366ff]指定色值[/color] |

**为什么不直接写 `<font color>` 或 hex？**
因为站点有深色 / 浅色两套主题。写死的 `#c03a2b` 在浅色下好看，
到了深色底上就会发闷、对比度不足。所以推荐用**色名**：
色名实际映射到 CSS 变量，深浅两套主题各有一组取值，会自动切换。
`#rrggbb` 也支持，但它是固定值、不随主题变化，仅在你确实需要时使用。

**可用色名**

- 基础：`red` `blue` `green` `gold` `purple` `orange` `pink` `cyan` `gray` `ink`
- 和色：`shu`（朱）`enji`（臙脂）`kon`（紺）`ai`（藍）`kikyo`（桔梗）`yamabuki`（山吹）`matsuba`（松葉）`uguisu`（鶯）`mizuasagi`（水浅葱）`murasaki`（江戸紫）`kin`（金）`nezumi`（鼠）
- 语义：`fire` `water` `wind` `earth` `light` `dark` `rare` `legend` `warn` `info` `ok` `ng`

## 背景高亮

写法：`[bg:色名]文字[/bg]`，`[mark:色名]文字[/mark]` 与之等价。

例：`[bg:gold]重要结论[/bg]` → [bg:gold]重要结论[/bg]，
`[mark:cyan]补充说明[/mark]` → [mark:cyan]补充说明[/mark]。

高亮块的文字始终使用正文色，因此深浅色模式下都保证可读。

## 注音（振假名）

写法：`[ruby:读音]汉字[/ruby]`

例：`[ruby:あかなめ]垢舐[/ruby]` → [ruby:あかなめ]垢舐[/ruby]，
`[ruby:みことのり]詔[/ruby]` → [ruby:みことのり]詔[/ruby]。

## 剧透遮罩与按键

- `[spoiler]真凶是猫[/spoiler]` → [spoiler]真凶是猫[/spoiler]（鼠标悬停或聚焦后显形）
- `[kbd]Esc[/kbd]` → [kbd]Esc[/kbd]

## 提示框

以 `:::` 开启、`:::` 结束，第一行冒号后是类型，其余是可选标题。

```
:::warn 注意
这里是正文，**可以用 Markdown**。
:::
```

可用类型：`info` `tip` `note` `warn` / `warning` `danger` `ja`（日文原文块）`spoiler`。

:::warn 注意
这是 `warn` 提示框的实际效果。
:::

:::info 补充
这是 `info` 提示框的实际效果。
:::

## 表格合并单元格

在普通的 Markdown 表格里，把某一格的内容写成合并标记，
这一格就会并入相邻格：

| 标记 | 含义 |
| :--: | :-- |
| `[^]` | 与**上**一格合并 |
| `[v]` | 与**下**一格合并 |
| `[<]` | 与**左**一格合并 |
| `[>]` | 与**右**一格合并 |

**示例**

```
| 分类 | 场景 | 台词 |
| :-- | :-- | :-- |
| 普通 | 触摸 | セリフ1 |
| [^] | [^] | セリフ2 |
| [^] | 庄园 | セリフ3 |
| 战斗 | [>] | 横跨两列 |
```

渲染结果：

| 分类 | 场景 | 台词 |
| :-- | :-- | :-- |
| 普通 | 触摸 | セリフ1 |
| [^] | [^] | セリフ2 |
| [^] | 庄园 | セリフ3 |
| 战斗 | [>] | 横跨两列 |

**列宽**

表格列宽由内容自适应（`table-layout: auto`），不会被均分。
语音表进一步让标签列收缩到「该列最长标签的宽度」，
剩余宽度全部留给台词列；表格过宽时外层容器横向滚动。

**规则与注意事项**

1. 合并方向可以连锁：连续多个 `[^]` 会一路并到最上面那格。
2. 一个合并组必须构成**矩形**。若写成 L 形等非矩形，
   解释器会放弃该组的合并、按普通单元格输出，**不会吞掉内容**。
3. 单元格内需要换行时写 `<br>`；需要字面竖线时写 `\|`。
4. 不含合并标记的普通表格走标准 GFM 解析，行为完全不变。

## 角色语音表

角色页的「语音台词」原本是一整坨没有层级的纯文本，
现已由 `scripts/build_voice_tables.py` 按原 Wiki 的分类结构
还原成上面这种带合并单元格的表格（分类 / 场景 / 子场景 / 台词）。
某个场景若没有子场景，「场景」会用 `[<]` 横跨到子场景列，避免整列都是占位符。
结果
存放在角色 JSON 的 `char.voiceMd` 字段中。

`char.voiceMd` 就是这份数据的唯一来源，可以直接手工编辑修正。

若要从原 Wiki 复制一整段语音文本重新生成：

```bash
python3 scripts/build_voice_tables.py voice.txt                        # 预览
python3 scripts/build_voice_tables.py voice.txt --into src/data/pages/bizen.json
```
