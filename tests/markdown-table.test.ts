/**
 * 合并单元格表格：[^] 上 / [v] 下 / [<] 左 / [>] 右
 *
 * 这是整套自定义语法里最容易出错的部分，历史上踩过两个坑：
 *   1. 续行的 td 数量变少，CSS 的 :nth-child 会错位
 *      → 渲染器必须输出真实列号 tc-col-N
 *   2. colIndex 若只按本行累加，会忽略上方 rowspan 占据的格子
 *      → 必须用占位网格推进列号
 * 这两点都在下面有专门的回归用例。
 */

import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/markdown/index'

/** 取出所有 <tr>，方便逐行断言 */
function rows(html: string): string[] {
  return html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []
}

/** 取某行里每个单元格的 class 中的列号 */
function colsOf(row: string): string[] {
  return (row.match(/tc-col-[\w-]+/g) ?? []).filter((c) => c !== 'tc-col-last')
}

const T = (...lines: string[]) => lines.join('\n')

describe('四个方向的合并', () => {
  it('[^] 向上合并成 rowspan', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| 甲 | x |', '| [^] | y |'),
    )
    expect(html).toContain('rowspan="2"')
    expect(html).toContain('甲')
  })

  it('[v] 向下合并（内容写在下面那格）', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| [v] | x |', '| 内容在下 | y |'),
    )
    expect(html).toContain('rowspan="2"')
    expect(html).toContain('内容在下')
  })

  it('[<] 向左合并成 colspan', () => {
    const html = renderMarkdown(
      T('| A | B | C |', '| - | - | - |', '| 跨三列 | [<] | [<] |'),
    )
    expect(html).toContain('colspan="3"')
  })

  it('[>] 向右合并（内容写在右边那格）', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| [>] | 内容在右 |'),
    )
    expect(html).toContain('colspan="2"')
    expect(html).toContain('内容在右')
  })

  it('二维块：同时产生 rowspan 与 colspan', () => {
    const html = renderMarkdown(
      T('| A | B | C |', '| - | - | - |', '| 大块 | [<] | x |', '| [^] | [^] | y |'),
    )
    expect(html).toMatch(/rowspan="2"[^>]*colspan="2"|colspan="2"[^>]*rowspan="2"/)
  })

  it('连锁合并：多个 [^] 一路并到顶', () => {
    const html = renderMarkdown(
      T('| A |', '| - |', '| 顶 |', '| [^] |', '| [^] |', '| [^] |'),
    )
    expect(html).toContain('rowspan="4"')
  })
})

describe('容错：写错也不能丢内容', () => {
  it('L 形（非矩形）合并组降级为普通单元格', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| 内容 | [<] |', '| [^] | z |'),
    )
    // 关键：内容不能消失
    expect(html).toContain('内容')
    expect(html).toContain('z')
  })

  it('指向表格外的合并标记不会崩溃', () => {
    const html = renderMarkdown(T('| A | B |', '| - | - |', '| [^] | [<] |'))
    expect(html).toContain('<table')
  })

  it('循环引用（互指）能终止', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| [>] | [<] |'),
    )
    expect(html).toContain('<table')
  })
})

describe('与标准 GFM 的边界', () => {
  it('不含合并标记的表格仍走 marked 原生解析（保证既有内容页不受影响）', () => {
    const html = renderMarkdown(T('| A | B |', '| - | - |', '| 1 | 2 |'))
    expect(html).not.toContain('tc-table')
    expect(html).toContain('<table>')
  })

  it('含合并标记时才接管', () => {
    const html = renderMarkdown(T('| A | B |', '| - | - |', '| 甲 | x |', '| [^] | y |'))
    expect(html).toContain('tc-table')
  })

  it('对齐语法保留', () => {
    const html = renderMarkdown(
      T('| A | B |', '| :-- | --: |', '| 甲 | x |', '| [^] | y |'),
    )
    expect(html).toContain('text-align:left')
    expect(html).toContain('text-align:right')
  })

  it('单元格内 <br> 与转义竖线', () => {
    const html = renderMarkdown(
      T('| A | B |', '| - | - |', '| 甲 | 一\\|二<br>三 |', '| [^] | y |'),
    )
    expect(html).toContain('一|二')
    expect(html).toContain('<br>')
  })

  it('无表头表格（以分隔行开头）', () => {
    const html = renderMarkdown(T('| :-- | :-- |', '| 甲 | 乙 |', '| [^] | 丙 |'))
    expect(html).toContain('tc-table')
    expect(html).not.toContain('<thead>')
  })
})

describe('列号必须准确（CSS 靠它定位标签列）', () => {
  it('每行恰好一个 tc-col-last', () => {
    const html = renderMarkdown(
      T(
        '| 分类 | 场景 | 台词 |',
        '| :-- | :-- | :-- |',
        '| 普通 | 触摸 | セリフ1 |',
        '| [^] | [^] | セリフ2 |',
        '| [^] | 庄园 | セリフ3 |',
      ),
    )
    for (const r of rows(html)) {
      const n = (r.match(/tc-col-last/g) ?? []).length
      expect(n).toBe(1)
    }
  })

  it('回归：续行要跳过被 rowspan 占据的列', () => {
    // 第 2 行只有 2 个 td，但它们实际位于第 1、2 列（第 0 列被上方 rowspan 占了）
    const html = renderMarkdown(
      T(
        '| 分类 | 场景 | 子场景 | 台词 |',
        '| :-- | :-- | :-- | :-- |',
        '| 普通 | 标题 | [<] | 魂これ |',
        '| [^] | 开始 | [<] | 台词2 |',
      ),
    )
    const r = rows(html)
    // 表头 + 2 行
    expect(r.length).toBe(3)
    // 第二个数据行：首格应是 tc-col-1（不是 tc-col-0）
    expect(colsOf(r[2])[0]).toBe('tc-col-1')
  })

  it('列号随 colspan 正确跳跃', () => {
    const html = renderMarkdown(
      T('| A | B | C |', '| - | - | - |', '| 跨两列 | [<] | 尾 |', '| x | y | z |'),
    )
    const r = rows(html)
    const cols = colsOf(r[1])
    expect(cols[0]).toBe('tc-col-0')
    // 跨了 0、1 两列，所以下一格是 2
    expect(cols[1]).toBe('tc-col-2')
  })
})

describe('外层容器', () => {
  it('包一层 wrap 以便窄屏横向滚动', () => {
    const html = renderMarkdown(T('| A |', '| - |', '| 甲 |', '| [^] |'))
    expect(html).toContain('tc-table-wrap')
  })
})
