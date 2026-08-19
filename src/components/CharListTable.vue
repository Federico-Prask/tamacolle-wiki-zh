<script setup lang="ts">
import { computed } from 'vue'
import { pages } from '../data/index'
import type { CharacterData } from '../data/types'
// slug -> icon 扩展名。原 wiki 的头像多为 png，少数只有 jpg，
// 由 scripts/fetch_char_icons.py 抓取后生成此清单。
import iconExt from '../data/icon-ext.json'

const props = defineProps({
  mode: { type: String, required: true }, // numbered | region | weapon | material | env | ayakashi | rokuhara
})

/** 图鉴列表条目：角色页数据 + slug */
interface DexChar extends CharacterData {
  slug: string
}

interface DexSection {
  title: string | null
  rows: DexChar[][]
}

const all = computed<DexChar[]>(() =>
  Object.entries(pages)
    .filter(([, p]) => p.kind === 'char' && !!p.char)
    .map(([id, p]) => ({ slug: id, ...(p.char as CharacterData) }))
)

const kunidama = computed(() => all.value.filter((c) => c.type === 'kunidama'))
const ayakashi = computed(() => all.value.filter((c) => c.type === 'ayakashi'))
const rokuhara = computed(() => all.value.filter((c) => c.type === 'rokuhara'))

const REGION_ORDER = ['畿内', '東海道', '東山道', '北陸道', '山陰道', '山陽道', '南海道', '西海道']
const WEAPON_ORDER = ['短刀', '刀', '槍', '重装', '弓', '大砲', '術']
/**
 * 原 wiki 对同一武器种存在两种写法：武蔵的资料室写「砲撃」，
 * 肥前・讃岐・豊後写「大砲」。按原文如实保留在角色数据里，
 * 但分类时归一，否则武蔵会单独成一组掉队。
 */
const WEAPON_ALIAS: Record<string, string> = { 砲撃: '大砲' }
/** 擅长环境：与 kv 里的「擅长地形」对应 */
const ENV_ORDER = ['自然', '街', '水边', '难所']
/**
 * 主素材分组。
 * 素材归属不在角色 JSON 里（那是羁绊棋盘的消耗品），
 * 数据源为 src/content/dex-kunidama-material.md 的「该当地魂」列表。
 */
const MATERIAL_GROUPS: { name: string; members: string[] }[] = [
  {
    name: '柔毛',
    members: ['近江', '伊贺', '三河', '讃岐', '因幡', '备前', '长门', '伊豆', '能登', '远江'],
  },
  {
    name: '雄角',
    members: [
      '和泉', '武藏', '安房', '若狭', '越后', '但马', '甲斐', '隐岐',
      '伊予', '土佐', '尾张', '日向', '筑前', '阿波', '周防',
    ],
  },
  {
    name: '营养丸',
    members: ['山城', '大和', '骏河', '信浓', '越前', '播磨', '备中', '筑后', '肥前', '壹岐'],
  },
  {
    name: '兽脂',
    members: ['河内', '志摩', '相模', '上总', '常陆', '下野', '陆奥', '加贺', '丹波', '石见', '备后', '纪伊'],
  },
  {
    name: '大众春画',
    members: ['下总', '若狭', '丰后', '大隅'],
  },
]

/**
 * 副素材分组（原 wiki 的「使用する地魂」）。
 * 与主素材不同，这里的角色会和上面的主素材组重复 ——
 * 一个地魂的羁绊可能同时消耗主素材与若干副素材。
 * 「阴阳丹」「精致木芥子」在原 wiki 上只有图标、尚无名单，故不列出。
 */
const SUB_MATERIAL_GROUPS: { name: string; members: string[] }[] = [
  {
    name: '大众春画',
    members: [
      '河内', '志摩', '上总', '播磨', '丹波', '常陆', '备后', '备中', '石见', '大和',
      '加贺', '大隅', '筑后', '信浓', '相模', '下总', '纪伊', '肥前', '丰后', '越前',
      '骏河', '壹岐',
    ],
  },
  {
    name: '清净潮水',
    members: [
      '武藏', '越后', '讃岐', '因幡', '隐岐', '甲斐', '近江', '伊贺', '土佐', '若狭',
      '但马', '三河', '伊予', '和泉', '安房', '尾张', '备前', '日向', '长门', '伊豆',
      '能登', '筑前', '远江', '阿波', '周防',
    ],
  },
]

const byNum = (list: DexChar[]): DexChar[] => [...list].sort((a, b) => (a.numInt || 999) - (b.numInt || 999))

function chunks<T>(list: T[], n = 5): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n))
  return out
}

const showNum = computed(() => props.mode === 'numbered' || props.mode === 'ayakashi')

const sections = computed<DexSection[]>(() => {
  const m = props.mode
  if (m === 'numbered') return [{ title: null, rows: chunks(byNum(kunidama.value)) }]
  if (m === 'ayakashi') return [{ title: null, rows: chunks(byNum(ayakashi.value)) }]
  if (m === 'rokuhara') return [{ title: null, rows: chunks(rokuhara.value) }]
  if (m === 'region') {
    const out: DexSection[] = []
    for (const r of REGION_ORDER) {
      const list = kunidama.value.filter((c) => c.kv && Object.fromEntries(c.kv)['所属'] === r)
      if (list.length) out.push({ title: r + '道', rows: chunks(list) })
    }
    return out
  }
  if (m === 'env') {
    const map: Record<string, DexChar[]> = {}
    kunidama.value.forEach((c) => {
      const e = (c.kv && Object.fromEntries(c.kv)['擅长地形']) || '未确认'
      ;(map[e] ||= []).push(c)
    })
    const keys = [...ENV_ORDER, ...Object.keys(map).filter((k) => !ENV_ORDER.includes(k))]
    return keys
      .filter((k) => map[k])
      .map((k) => ({ title: `${k}（${map[k].length} 名）`, rows: chunks(byNum(map[k])) }))
  }
  if (m === 'material') {
    const byName = new Map(kunidama.value.map((c) => [c.nameZh, c]))
    const out: DexSection[] = []
    for (const g of MATERIAL_GROUPS) {
      const list = g.members.map((n) => byName.get(n)).filter((c): c is DexChar => !!c)
      if (list.length) out.push({ title: `主素材：${g.name}（${list.length} 名）`, rows: chunks(list) })
    }
    for (const g of SUB_MATERIAL_GROUPS) {
      const list = g.members.map((n) => byName.get(n)).filter((c): c is DexChar => !!c)
      if (list.length) out.push({ title: `副素材：${g.name}（${list.length} 名）`, rows: chunks(list) })
    }
    return out
  }
  if (m === 'weapon') {
    const map: Record<string, DexChar[]> = {}
    kunidama.value.forEach((c) => {
      const raw = (c.kv && Object.fromEntries(c.kv)['武器种']) || '未确认'
      const w = WEAPON_ALIAS[raw] || raw
      ;(map[w] ||= []).push(c)
    })
    const keys = [...WEAPON_ORDER, ...Object.keys(map).filter((k) => !WEAPON_ORDER.includes(k))]
    return keys.filter((k) => map[k]).map((k) => ({ title: k, rows: chunks(map[k]) }))
  }
  return []
})

function iconOf(c: DexChar): string {
  const ext = (iconExt as Record<string, string>)[c.slug] || 'png'
  return `/images/chars/${c.slug}_icon.${ext}`
}

function hideImg(e: Event): void {
  const el = e.target as HTMLElement | null
  if (el) el.style.visibility = 'hidden'
}
</script>

<template>
  <div class="dex-wrap">
    <div v-for="(sec, si) in sections" :key="si" class="dex-section">
      <h3 v-if="sec.title" class="dex-sec-title">{{ sec.title }}</h3>
      <table class="dex-table">
        <tbody>
          <tr v-for="(row, ri) in sec.rows" :key="ri">
            <td v-for="c in row" :key="c.slug">
              <RouterLink :to="'/page/' + c.slug" class="dex-cell">
                <span v-if="showNum && c.num" class="dex-num">{{ c.num }}</span>
                <img
                  :src="iconOf(c)"
                  :alt="c.nameZh"
                  loading="lazy"
                  @error="hideImg"
                />
                <span class="dex-name">{{ c.nameZh }}</span>
                <span class="dex-kana" v-if="c.kana">{{ c.kana }}</span>
              </RouterLink>
            </td>
            <td v-for="i in (5 - row.length)" :key="'e' + i"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
