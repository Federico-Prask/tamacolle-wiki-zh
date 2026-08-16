/**
 * 站内搜索
 *
 * 索引在浏览器内从打包数据直接构建（无后端、无额外请求），
 * 这里验证它对真实站点数据能给出合理结果。
 */

import { describe, expect, it } from 'vitest'
import { buildIndex, search } from '../src/search/index'

describe('索引', () => {
  const docs = buildIndex()

  it('覆盖全部页面', () => {
    expect(docs.length).toBeGreaterThanOrEqual(180)
  })

  it('每篇都有标题', () => {
    for (const d of docs) expect(d.title, d.id).toBeTruthy()
  })

  it('角色页把结构化字段并入正文（战法 / 典故等可被搜到）', () => {
    const d = docs.find((x) => x.id === 'chikuzen')
    expect(d).toBeTruthy()
    expect(d!.text).toContain('筑前')
    // 战法名来自 tactics 字段
    expect(d!.text).toMatch(/老实进攻|一心不乱进攻/)
  })

  it('正文已剥离 Markdown 与自定义语法', () => {
    for (const d of docs) {
      expect(d.text, d.id).not.toMatch(/\[\^\]|\[color:|<br>|!\[/)
    }
  })

  it('回归：角色页的 motifZh 等 Markdown 字段也要压平（曾出现 ### 泄漏到摘要）', () => {
    for (const d of docs) {
      expect(d.text, d.id).not.toMatch(/(^|\s)#{1,6}\s/)
    }
  })

  it('重复调用返回同一份缓存', () => {
    expect(buildIndex()).toBe(docs)
  })
})

describe('查询', () => {
  it('空查询返回空', () => {
    expect(search('')).toEqual([])
    expect(search('   ')).toEqual([])
  })

  it('按中文标题命中', () => {
    const r = search('筑前')
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].id).toBe('chikuzen')
  })

  it('按日文原名命中', () => {
    const r = search('遠江')
    expect(r.some((h) => h.id === 'totomi')).toBe(true)
  })

  it('标题命中排在正文命中之前', () => {
    const r = search('道具')
    expect(r.length).toBeGreaterThan(0)
    // 「道具一览」标题里有「道具」，应排首位
    expect(r[0].title).toContain('道具')
  })

  it('多关键词为 AND 语义', () => {
    const both = search('筑前 山笠')
    for (const h of both) {
      const d = buildIndex().find((x) => x.id === h.id)!
      const hay = (d.lcTitle + d.lcJa + d.lcText)
      expect(hay).toContain('筑前')
      expect(hay).toContain('山笠')
    }
  })

  it('无结果时返回空数组而非报错', () => {
    expect(search('zzzz不存在的词zzzz')).toEqual([])
  })

  it('大小写不敏感', () => {
    expect(search('MVP').length).toBe(search('mvp').length)
  })

  it('尊重 limit', () => {
    expect(search('的', 5).length).toBeLessThanOrEqual(5)
  })

  it('结果按分数降序', () => {
    const r = search('魂')
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score)
    }
  })
})

describe('摘要', () => {
  it('高亮关键词', () => {
    const r = search('山笠')
    const withSnippet = r.find((h) => h.snippet)
    expect(withSnippet).toBeTruthy()
    expect(withSnippet!.snippet).toContain('<mark>')
  })

  it('转义 HTML，避免注入', () => {
    // 站内正文若含 < > 必须被转义后再高亮
    for (const h of search('魂', 20)) {
      const stripped = h.snippet.replace(/<\/?mark>/g, '')
      expect(stripped).not.toMatch(/<(?!\/?mark)/)
    }
  })

  it('长度受控', () => {
    for (const h of search('魂', 20)) {
      expect(h.snippet.replace(/<\/?mark>/g, '').length).toBeLessThan(200)
    }
  })
})
