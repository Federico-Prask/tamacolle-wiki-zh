/**
 * 自定义行内语法：颜色 / 高亮 / 注音 / 剧透 / 按键
 *
 * 这些扩展的价值在于「能随主题切换」和「不破坏既有 Markdown」，
 * 所以除了正常路径，重点覆盖：
 *   - 非法输入要安全降级（原样输出，不注入样式）
 *   - 嵌套与标准 Markdown 混用
 *   - HTML 转义（防注入）
 */

import { describe, expect, it } from 'vitest'
import { renderMarkdown, renderInline, renderProse } from '../src/markdown/index'

describe('[color:x] 文字颜色', () => {
  it('语义色名映射到 CSS 变量（这样才能随深浅色主题切换）', () => {
    const html = renderInline('[color:red]朱色[/color]')
    expect(html).toContain('color:var(--c-red)')
    expect(html).toContain('朱色')
  })

  it('和色名同样可用', () => {
    expect(renderInline('[color:kon]藏青[/color]')).toContain('var(--c-kon)')
    expect(renderInline('[color:yamabuki]山吹[/color]')).toContain('var(--c-yamabuki)')
  })

  it('hex 色值原样使用', () => {
    expect(renderInline('[color:#3366ff]自定义[/color]')).toContain('color:#3366ff')
  })

  it('支持 3/4/6/8 位 hex', () => {
    for (const hex of ['#abc', '#abcd', '#aabbcc', '#aabbccdd']) {
      expect(renderInline(`[color:${hex}]x[/color]`)).toContain(`color:${hex}`)
    }
  })

  it('未知色名安全降级为纯文本，不注入 style', () => {
    const html = renderInline('[color:nosuchcolor]文字[/color]')
    expect(html).not.toContain('<span')
    expect(html).toContain('[color:nosuchcolor]')
  })

  it('缺少结束标签时不吞掉后续内容', () => {
    const html = renderInline('[color:red]没有闭合')
    expect(html).toContain('没有闭合')
    expect(html).not.toContain('tc-color')
  })

  it('可与标准 Markdown 嵌套', () => {
    const html = renderInline('[color:red]外层**粗体**[/color]')
    expect(html).toContain('<strong>粗体</strong>')
    expect(html).toContain('var(--c-red)')
  })

  it('同名标签可嵌套', () => {
    const html = renderInline('[color:red]外[color:blue]内[/color]尾[/color]')
    expect(html).toContain('var(--c-red)')
    expect(html).toContain('var(--c-blue)')
    // 内层应闭合在外层之内
    expect(html.indexOf('var(--c-blue)')).toBeGreaterThan(html.indexOf('var(--c-red)'))
  })

  it('色名大小写不敏感', () => {
    expect(renderInline('[color:RED]x[/color]')).toContain('var(--c-red)')
  })
})

describe('[bg:x] / [mark:x] 背景高亮', () => {
    it('映射到背景色变量', () => {
    expect(renderInline('[bg:gold]高亮[/bg]')).toContain('background:var(--cb-gold)')
  })

  it('mark 是 bg 的同义写法', () => {
    expect(renderInline('[mark:cyan]标记[/mark]')).toContain('background:var(--cb-cyan)')
  })
})

describe('[ruby:] 注音', () => {
  it('生成带 rp 回退的 ruby 标签', () => {
    const html = renderInline('[ruby:あかなめ]垢舐[/ruby]')
    expect(html).toContain('<ruby')
    expect(html).toContain('<rt>あかなめ</rt>')
    // rp 让不支持 ruby 的环境显示括号
    expect(html).toContain('<rp>(</rp>')
    expect(html).toContain('垢舐')
  })

  it('读音中的 HTML 特殊字符会被转义', () => {
    expect(renderInline('[ruby:<script>]漢[/ruby]')).toContain('&lt;script&gt;')
  })
})

describe('[spoiler] / [kbd]', () => {
  it('剧透块可聚焦（键盘可访问）', () => {
    const html = renderInline('[spoiler]真凶[/spoiler]')
    expect(html).toContain('tc-spoiler')
    expect(html).toContain('tabindex="0"')
  })

  it('kbd 渲染为语义化标签', () => {
    expect(renderInline('[kbd]Esc[/kbd]')).toContain('<kbd')
  })
})

describe('渲染模式', () => {
  it('prose 模式把单换行视为断行（脚本产出的译文用单换行分段）', () => {
    expect(renderProse('第一行\n第二行')).toContain('<br>')
  })

  it('普通模式遵循标准 Markdown，不把单换行当断行', () => {
    expect(renderMarkdown('第一行\n第二行')).not.toContain('<br>')
  })

  it('renderInline 不产生块级包裹', () => {
    expect(renderInline('文字')).not.toContain('<p>')
  })

  it('空输入返回空字符串', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderInline('')).toBe('')
    expect(renderProse('')).toBe('')
  })
})

describe('::: 容器', () => {
  it('warn 容器带对应样式类', () => {
    const html = renderMarkdown(':::warn 注意\n正文\n:::')
    expect(html).toContain('notice warn')
    expect(html).toContain('注意')
    expect(html).toContain('正文')
  })

  it('容器内的 Markdown 会被解析', () => {
    expect(renderMarkdown(':::info\n**粗体**\n:::')).toContain('<strong>粗体</strong>')
  })

  it('未知类型不被当作容器处理', () => {
    const html = renderMarkdown(':::nosuchtype\n正文\n:::')
    expect(html).not.toContain('tc-container')
  })
})
