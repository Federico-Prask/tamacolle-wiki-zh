<script setup>
import { ref, watch } from 'vue'
import { categories, byCategory } from '../data/manifest.js'
import { charBySlug } from '../data/characters.js'
import { useRoute } from 'vue-router'

const route = useRoute()

// —— 折叠状态 ——
// 分类是否展开（默认只展开「基本情报」）
const openCats = ref({ about: true, quest: false, dex: false, misc: false })
// 分组是否展开（未记录时按默认规则）
const openGroups = ref({})

function toggleCat(id) {
  openCats.value[id] = !openCats.value[id]
}
function toggleGroup(key) {
  const cur = isGroupOpen(key)
  openGroups.value[key] = !cur
}

// —— 分组结构 ——
const QUEST_GROUPS = [
  ['main', '主线剧情'],
  ['side', '支线剧情'],
  ['free', '自由任务'],
  ['daily', '每日任务'],
  ['makuma', '幕间'],
  ['short', '短篇故事'],
]
const DEX_GROUPS = [
  { key: 'index', title: '列表与索引' },
  { key: 'kunidama', title: '地魂男儿 · 旧国拟人' },
  { key: 'ayakashi', title: '妖怪 · あやかし' },
  { key: 'rokuhara', title: '六原职员 · 其他' },
]

function catGroups(catId) {
  const items = byCategory[catId] || []
  if (catId === 'quest') {
    const out = []
    const used = new Set()
    for (const [prefix, title] of QUEST_GROUPS) {
      const g = items.filter((m) => m.slug === prefix || m.slug.startsWith(prefix + '-'))
      g.forEach((m) => used.add(m.slug))
      if (g.length) out.push({ key: catId + '-' + prefix, title, items: g })
    }
    const rest = items.filter((m) => !used.has(m.slug))
    if (rest.length) out.push({ key: catId + '-rest', title: '其他', items: rest })
    return out
  }
  if (catId === 'dex') {
    const out = []
    for (const g of DEX_GROUPS) {
      const list = items.filter((m) => {
        if (g.key === 'index') return m.kind === 'list'
        const t = charBySlug[m.slug] && charBySlug[m.slug].type
        return m.kind === 'char' && t === g.key
      })
      if (list.length) out.push({ key: catId + '-' + g.key, title: g.title, items: list })
    }
    const used = new Set(out.flatMap((g) => g.items.map((i) => i.slug)))
    const rest = items.filter((m) => !used.has(m.slug))
    if (rest.length) out.push({ key: catId + '-rest', title: '其他', items: rest })
    return out
  }
  return [{ key: catId, title: null, items }]
}

// 大分组（角色列表）默认收起，其余默认展开
function groupDefaultOpen(key) {
  return !['dex-kunidama', 'dex-ayakashi', 'dex-rokuhara', 'dex-rest'].includes(key)
}
function isGroupOpen(key) {
  return openGroups.value[key] !== undefined ? openGroups.value[key] : groupDefaultOpen(key)
}

// 路由变化时自动展开当前页所属的分类与分组
function reveal(id) {
  if (!id) return
  for (const c of categories) {
    for (const g of catGroups(c.id)) {
      if (g.items.some((m) => m.slug === id)) {
        openCats.value[c.id] = true
        openGroups.value[g.key] = true
      }
    }
  }
}
watch(() => route.params.id, reveal, { immediate: true })
</script>

<template>
  <div class="side-nav">
    <div class="side-card">
      <p class="side-title">目录 <span class="side-hint">点击分类可折叠</span></p>

      <RouterLink class="tree-link home-link" :class="{ active: route.path === '/' }" to="/">⌂ 首页 · FrontPage</RouterLink>

      <div v-for="c in categories" :key="c.id" class="cat">
        <!-- 分类头（可折叠） -->
        <button class="cat-head" type="button" @click="toggleCat(c.id)">
          <span class="cat-arrow" :class="{ open: openCats[c.id] }">▸</span>
          <span class="cat-name">
            {{ c.zh }}
            <span class="cat-ja">{{ c.ja }}</span>
          </span>
          <span class="cat-count">{{ byCategory[c.id].length }}</span>
        </button>

        <div class="fold" :class="{ open: openCats[c.id] }">
          <div class="fold-inner">
            <template v-for="g in catGroups(c.id)" :key="g.key">
              <!-- 分组头（可折叠，仅当有分组标题时） -->
              <button
                v-if="g.title"
                class="grp-head"
                type="button"
                @click="toggleGroup(g.key)"
              >
                <span class="grp-arrow" :class="{ open: isGroupOpen(g.key) }">▸</span>
                <span class="grp-name">{{ g.title }}</span>
                <span class="grp-count">{{ g.items.length }}</span>
              </button>

              <div class="fold" :class="{ open: !g.title || isGroupOpen(g.key) }">
                <div class="fold-inner">
                  <RouterLink
                    v-for="m in g.items"
                    :key="m.slug"
                    class="tree-link"
                    :class="{ active: route.params.id === m.slug, lv2: !!g.title }"
                    :to="'/page/' + m.slug"
                  >{{ m.zh }}</RouterLink>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
