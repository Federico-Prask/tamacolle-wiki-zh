<script setup>
import { computed } from 'vue'
import { manifest, categories, byCategory } from '../data/manifest.js'
import { pages } from '../data/index.js'

const home = computed(() => pages['home'] || null)

// 首页各分类精选链接
const picks = computed(() =>
  Object.fromEntries(
    categories.map((c) => [c.id, byCategory[c.id].filter((m) => m.kind !== 'char').slice(0, 10)])
  )
)

</script>

<template>
  <div>
    <div v-if="home" class="paper">
      <PageMarkdown :markdown="home.body" />
    </div>

    <div v-else class="paper">
      <div class="page-head">
        <span class="page-kicker">TAMA COLLECTION</span>
        <h2 class="page-title">魂これ（地魂收藏）中文 Wiki</h2>
        <p class="page-ja">『魂これ　やまとまほろば 地魂（くにたま）これくしょん』</p>
      </div>
      <p>
        《魂これ 大和真秀场 地魂收藏》是由「にじたま（虹玉）」开发的、可在浏览器上游玩的养成同人游戏。
        玩家将与日本旧国拟人化的「地魂男儿」们交流、育成、强化，一同推进故事。
      </p>
      <div class="notice info">
        本站为玩家自发制作的中文翻译镜像，页面内容译自
        <a href="https://wikiwiki.jp/tamacolle/" target="_blank" rel="noopener">原文 Wiki</a>。
        请使用左侧目录浏览。
      </div>

      <div class="home-grid" style="margin-top: 18px">
        <div class="home-card" v-for="c in categories" :key="c.id">
          <h3>{{ c.zh }}</h3>
          <ul>
            <li v-for="m in picks[c.id]" :key="m.slug">
              <RouterLink :to="'/page/' + m.slug">{{ m.zh }}</RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageMarkdown from '../components/PageMarkdown.vue'
export default { components: { PageMarkdown } }
</script>
