/**
 * [char:slug] 角色引用语法
 *
 * 这个扩展存在的理由是缺陷 D1：原 wiki 的大量表格在单元格里放的是
 * 「角色头像 + 名字 + 链接」，而本站早期翻译只留下了纯文字。
 * 因此这里除了正常路径，重点守住三件事：
 *   - 71 个角色全部能查到，且头像文件真的存在于 public/
 *   - 未知键要降级成可见的提示，而不是静默丢失或抛错
 *   - 能在表格单元格里正常工作（这是它的主要使用场景）
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderInline, renderMarkdown } from '../src/markdown/index'
import { charTable, lookupChar } from '../src/markdown/chars'

const ROOT = resolve(__dirname, '..')

describe('[char:] 角色引用', () => {
  it('渲染出头像、名字与站内链接', () => {
    const html = renderInline('[char:iga]')
    expect(html).toContain('href="#/page/iga"')
    expect(html).toContain('src="/images/chars/iga_icon.png"')
    expect(html).toContain('伊贺')
    expect(html).toContain('loading="lazy"')
  })

  it('[char:slug|] 只输出头像，不输出名字', () => {
    const html = renderInline('[char:iga|]')
    expect(html).toContain('tc-charref-icon')
    expect(html).not.toContain('tc-charref-name')
  })

  it('[char:slug|自定义名] 使用自定义显示名', () => {
    const html = renderInline('[char:iga|伊賀]')
    expect(html).toContain('>伊賀<')
    // 链接仍指向正确的角色页
    expect(html).toContain('href="#/page/iga"')
  })

  it('可以用日文原名或中文名当键', () => {
    expect(lookupChar('伊賀')?.slug).toBe('iga')
    expect(lookupChar('伊贺')?.slug).toBe('iga')
    expect(lookupChar('  伊賀  ')?.slug).toBe('iga')
  })

  it('未知键降级为带提示的文字，不抛错也不静默丢失', () => {
    const html = renderInline('[char:nosuchchar]')
    expect(html).toContain('tc-charref-unknown')
    expect(html).toContain('nosuchchar')
    expect(html).not.toContain('<img')
  })

  it('未知键中的 HTML 会被转义', () => {
    const html = renderInline('[char:<script>x</script>]')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('在表格单元格中可用，且一格内可放多个', () => {
    const html = renderMarkdown('| 武器 | 地魂 |\n| --- | --- |\n| 短刀 | [char:iga] [char:wakasa] |')
    expect(html).toContain('href="#/page/iga"')
    expect(html).toContain('href="#/page/wakasa"')
    expect((html.match(/tc-charref-icon/g) || []).length).toBe(2)
  })

  it('不影响普通的 Markdown 链接语法', () => {
    const html = renderInline('[普通链接](#/page/item)')
    expect(html).toContain('href="#/page/item"')
    expect(html).not.toContain('tc-charref')
  })

  it('形似但不合法的写法原样保留', () => {
    expect(renderInline('[char:]')).not.toContain('tc-charref')
  })
})

describe('角色引用表的完整性', () => {
  const slugs = Object.keys(charTable)

  it('覆盖 manifest 里全部 72 个角色', () => {
    // 71 原有 + B（七番，本轮发现原 wiki 有此角色页而本站缺失）
    expect(slugs.length).toBe(72)
  })

  it('每个角色的头像文件都真实存在', () => {
    const missing = slugs.filter((s) => !existsSync(resolve(ROOT, 'public' + charTable[s].icon)))
    expect(missing).toEqual([])
  })

  it('中文名不带罗马字括注', () => {
    const withRomaji = slugs.filter((s) => charTable[s].zh.includes('（'))
    expect(withRomaji).toEqual([])
  })

  it('每个角色都能被自己的 slug / 日文名 / 中文名查到', () => {
    for (const s of slugs) {
      const ref = charTable[s]
      expect(lookupChar(s)?.slug).toBe(s)
      expect(lookupChar(ref.ja)?.slug).toBe(s)
      expect(lookupChar(ref.zh)?.slug).toBe(s)
    }
  })
})
