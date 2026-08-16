<script setup lang="ts">
import { computed } from 'vue'
import { pages } from '../data/index'
import type { CharacterData } from '../data/types'

const props = defineProps({
  mode: { type: String, required: true }, // numbered | region | weapon | ayakashi | rokuhara
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
  if (m === 'weapon') {
    const map: Record<string, DexChar[]> = {}
    kunidama.value.forEach((c) => {
      const w = (c.kv && Object.fromEntries(c.kv)['武器种']) || '未确认'
      ;(map[w] ||= []).push(c)
    })
    const keys = [...WEAPON_ORDER, ...Object.keys(map).filter((k) => !WEAPON_ORDER.includes(k))]
    return keys.filter((k) => map[k]).map((k) => ({ title: k, rows: chunks(map[k]) }))
  }
  return []
})

function iconOf(c: DexChar): string {
  return '/images/chars/' + c.slug + '_icon.jpg'
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
