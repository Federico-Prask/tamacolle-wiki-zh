<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { pages } from '../data/index'
import { bySlug } from '../data/manifest'
import PageMarkdown from '../components/PageMarkdown.vue'
import CharListTable from '../components/CharListTable.vue'
import type { CharIllust, CharType } from '../data/types'

const route = useRoute()
const slug = computed(() => String(route.params.id || ''))
const meta = computed(() => bySlug[slug.value] || null)
const page = computed(() => pages[slug.value] || null)
const char = computed(() => (page.value && page.value.char) || null)

const sourceUrl = computed(() => {
  if (!meta.value) return ''
  const enc = encodeURIComponent(meta.value.ja).replace(/%2F/g, '%2F')
  return 'https://wikiwiki.jp/tamacolle/' + enc
})

// —— 图鉴列表模式（原 wiki 的「名称+图片」表格）——
const LIST_MODE: Record<string, string> = {
  'dex-kunidama': 'numbered',
  'dex-kunidama-region': 'region',
  'dex-kunidama-weapon': 'weapon',
  'dex-ayakashi': 'ayakashi',
  rokuhara: 'rokuhara',
}
const listMode = computed(() => LIST_MODE[slug.value] || null)

// —— 折叠控制 ——
const showRaw = ref<Record<string, boolean>>({})

function toggle(key: string): void {
  showRaw.value[key] = !showRaw.value[key]
}
function isOpen(key: string): boolean {
  return !!showRaw.value[key]
}

const TYPE_LABEL: Record<CharType, string> = {
  kunidama: '地魂男儿（旧国拟人）',
  ayakashi: '妖怪（あやかし）',
  rokuhara: '六原职员',
}
function typeLabel(t: string): string {
  return TYPE_LABEL[t as CharType] || t
}

// 关键名片字段（编号/武器/所属/国势/节庆日/实装）
const keyFields = computed<[string, string][]>(() => {
  if (!char.value) return []
  const order = ['武器种', '所属', '国势', '节庆日', '实装', '分类', '擅长地形']
  const map: Record<string, string> = Object.fromEntries(char.value.kv || [])
  const out: [string, string][] = []
  if (char.value.num) out.push(['编号', char.value.num])
  for (const k of order) if (map[k]) out.push([k, map[k]])
  return out
})

// 拔魂技
const skill = computed<{ name: string; effect: string; speed: string } | null>(() => {
  if (!char.value) return null
  const map: Record<string, string> = Object.fromEntries(char.value.kv || [])
  if (!map['拔魂技名']) return null
  return { name: map['拔魂技名'], effect: map['效果'] || '', speed: map['拔魂速度'] || '' }
})

// 立绘按标签分组
interface IllustGroup {
  label: string
  list: CharIllust[]
}
const illustGroups = computed<IllustGroup[]>(() => {
  if (!char.value) return []
  const order: string[] = []
  const map: Record<string, CharIllust[]> = {}
  for (const il of char.value.illusts || []) {
    const key = il.labelZh || il.label || '其他'
    if (!map[key]) {
      map[key] = []
      order.push(key)
    }
    map[key].push(il)
  }
  return order.map((k) => ({ label: k, list: map[k] }))
})

// 羁绊：归一化为「文本」或「表格」两种形态
type BondEntry =
  | { key: string; kind: 'text'; text: string }
  | { key: string; kind: 'tables'; tables: string[][][] }

const bondEntries = computed<BondEntry[]>(() => {
  if (!char.value) return []
  return Object.entries(char.value.bond || {}).map(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'text' in v) {
      return { key: k, kind: 'text' as const, text: String((v as { text: unknown }).text ?? '') }
    }
    return { key: k, kind: 'tables' as const, tables: (v as string[][][]) || [] }
  })
})

// 图片加载失败时隐藏
function hideImg(e: Event): void {
  const el = e.target as HTMLElement | null
  if (el) el.style.display = 'none'
}
function hideFigure(e: Event): void {
  const el = e.target as HTMLElement | null
  if (el && el.parentElement) el.parentElement.style.display = 'none'
}
</script>

<template>
  <article class="paper">
    <div v-if="meta">
      <div class="page-head">
        <span class="page-kicker">{{ char ? typeLabel(char.type) : (listMode ? '角色一览' : (page && page.body ? '中文翻译' : '翻译整理中')) }}</span>
        <h2 class="page-title">{{ char ? char.nameZh : (page && page.title) || meta.zh }}</h2>
        <p class="page-ja" v-if="char">{{ char.name }}（{{ char.kana }}）</p>
        <p class="page-ja" v-else>{{ (page && page.ja) || meta.ja }}</p>
      </div>

      <!-- ============ 图鉴列表（表格） ============ -->
      <CharListTable v-if="listMode" :mode="listMode" />

      <!-- ============ 角色页 ============ -->
      <div v-if="char">
        <!-- 名片 -->
        <div class="char-card">
          <img
            class="portrait"
            :src="'/images/chars/' + slug + '_0.jpg'"
            :alt="char.nameZh"
            loading="lazy"
            @error="hideImg"
          />
          <div class="char-meta">
            <h3 class="char-name">{{ char.nameZh }}</h3>
            <div class="char-kana">{{ char.name }}<template v-if="char.kana">（{{ char.kana }}）</template> · {{ typeLabel(char.type) }}</div>
            <div class="char-fields">
              <div class="f" v-for="[k, v] in keyFields" :key="k">
                <span class="k">{{ k }}</span><span v-html="v"></span>
              </div>
              <div class="f" v-if="char.artist"><span class="k">画师</span><span>{{ char.artist }}</span></div>
              <div class="f" v-if="char.voice"><span class="k">声优</span><span>{{ char.voice }}</span></div>
            </div>
          </div>
        </div>

        <!-- 资料室说明 -->
        <section v-if="char.descZh || char.desc">
          <h2>资料室说明</h2>
          <p style="font-size:15px">{{ char.descZh }}</p>
          <p v-if="char.desc" class="raw-toggle">
            <a href="javascript:;" @click="toggle('desc')">{{ isOpen('desc') ? '▲ 收起原文' : '▼ 查看原文' }}</a>
          </p>
          <blockquote v-if="isOpen('desc') && char.desc" class="ja">{{ char.desc }}</blockquote>
        </section>

        <!-- 属性表 -->
        <section v-if="char.status && char.status.length">
          <h2>初始属性</h2>
          <table class="stat-table">
            <tbody>
              <tr v-for="i in Math.ceil(char.status.length / 4)" :key="i">
                <template v-for="j in 4" :key="j">
                  <template v-if="char.status[(i - 1) * 4 + j - 1]">
                    <th>{{ char.status[(i - 1) * 4 + j - 1][0] }}</th>
                    <td>{{ char.status[(i - 1) * 4 + j - 1][1] }}</td>
                  </template>
                </template>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- 拔魂技 -->
        <section v-if="skill">
          <h2>拔魂技（必杀技）</h2>
          <table class="stat-table">
            <tbody>
              <tr><th>拔魂技名</th><td colspan="3">{{ skill.name }}</td></tr>
              <tr v-if="skill.effect"><th>效果</th><td colspan="3">{{ skill.effect }}</td></tr>
              <tr v-if="skill.speed"><th>拔魂速度</th><td colspan="3">{{ skill.speed }}</td></tr>
            </tbody>
          </table>
        </section>

        <!-- 战法 -->
        <section v-if="char.tactics && char.tactics.length">
          <h2>战法</h2>
          <table>
            <thead><tr><th>战法</th><th>说明</th><th>习得条件</th></tr></thead>
            <tbody>
              <tr v-for="(tc, i) in char.tactics" :key="i">
                <td><strong>{{ tc.nameZh }}</strong><div class="ja small">{{ tc.name }}</div></td>
                <td>{{ tc.descZh }}</td>
                <td>{{ tc.condZh }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- 立绘图库 -->
        <section v-if="char.illusts && char.illusts.length">
          <h2>立绘一览</h2>
          <div v-for="g in illustGroups" :key="g.label" class="illust-block">
            <h3>{{ g.label }}</h3>
            <div class="illust-grid">
              <figure v-for="il in g.list" :key="il.img" class="illust-item">
                <img :src="il.local" :alt="g.label" loading="lazy" @error="hideFigure" />
                <figcaption class="ja small">{{ il.label || '' }}</figcaption>
              </figure>
            </div>
          </div>
          <div v-for="(n, i) in char.illustNotes" :key="'n' + i" class="notice" style="font-size:13px">
            <strong>{{ n.label }}解说：</strong>{{ n.note }}
          </div>
        </section>

        <!-- 羁绊 -->
        <section v-if="char.bond && bondEntries.length">
          <h2>羁绊</h2>
          <div v-for="e in bondEntries" :key="e.key">
            <h3>{{ e.key }}</h3>
            <div v-if="e.kind === 'text'" class="notice">{{ e.text }}</div>
            <template v-else>
              <table v-for="(tbl, ti) in e.tables" :key="ti" class="bond-table">
                <tbody>
                  <tr v-for="(row, ri) in tbl" :key="ri">
                    <th v-for="(c, ci) in row" :key="ci" :class="{ head: ti === 0 }">{{ c }}</th>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>
        </section>

        <!-- 语音台词 -->
        <section v-if="char.voiceText && char.voiceText.length > 10">
          <h2>语音台词</h2>
          <p class="raw-toggle"><a href="javascript:;" @click="toggle('voice')">{{ isOpen('voice') ? '▲ 收起' : '▼ 展开台词（标签已译，台词为原文）' }}</a></p>
          <blockquote v-if="isOpen('voice')" class="ja">{{ char.voiceText }}</blockquote>
        </section>

        <!-- 元ネタ -->
        <section v-if="(char.motifZh || char.motif) && (char.motifZh || char.motif).length > 2">
          <h2>元ネタ · 典故</h2>
          <div v-if="char.motifZh" class="motif-zh">{{ char.motifZh }}</div>
          <p v-if="char.motif" class="raw-toggle"><a href="javascript:;" @click="toggle('motif')">{{ isOpen('motif') ? '▲ 收起原文' : '▼ 展开日文原文' }}</a></p>
          <blockquote v-if="char.motif && isOpen('motif')" class="ja">{{ char.motif }}</blockquote>
        </section>

        <!-- 小ネタ -->
        <section v-if="(char.triviaZh || char.trivia) && (char.triviaZh || char.trivia).length > 2">
          <h2>小知识（小ネタ）</h2>
          <div v-if="char.triviaZh" class="motif-zh">{{ char.triviaZh }}</div>
          <p v-if="char.trivia" class="raw-toggle"><a href="javascript:;" @click="toggle('trivia')">{{ isOpen('trivia') ? '▲ 收起原文' : '▼ 展开日文原文' }}</a></p>
          <blockquote v-if="char.trivia && isOpen('trivia')" class="ja">{{ char.trivia }}</blockquote>
        </section>
      </div>

      <!-- ============ 普通页面 ============ -->
      <PageMarkdown v-else-if="page && page.body && !listMode" :markdown="page.body" />
      <div v-else-if="!listMode" class="notice warn">
        本页面内容正在整理翻译中。可先查看
        <a :href="sourceUrl" target="_blank" rel="noopener">原文页面</a>。
      </div>

      <hr style="margin-top: 28px" />
      <p style="font-size: 12.5px; color: var(--nezumi)">
        原文：<a :href="sourceUrl" target="_blank" rel="noopener">原文链接 ↗</a>　·　翻译仅供参考，游戏内专有名词以官方为准。
      </p>
    </div>
    <div v-else class="notice warn">未找到该页面。</div>
  </article>
</template>
