<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideNav from './components/SideNav.vue'
import SiteSearch from './components/SiteSearch.vue'

const route = useRoute()
// 整体侧栏折叠开关
const sideCollapsed = ref(false)
// 深色模式
const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

onMounted(() => {
  theme.value = document.documentElement.getAttribute('data-theme') || 'light'
})

watch(theme, (t) => {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
  try {
    localStorage.setItem('tamacolle-theme', t)
  } catch (e) {}
})
</script>

<template>
  <div class="app">
    <header class="site-header">
      <div class="site-header-inner">
        <div class="seal">魂これ</div>
        <div>
          <h1 class="site-title">
            魂これ やまとまほろば 地魂これくしょん
            <span class="ruby">TAMA COLLECTION</span>
          </h1>
        </div>
        <div class="site-sub">
          日本旧国拟人化育成游戏<br />
          非官方 Wiki 中文翻译版
        </div>
      </div>
      <nav class="nav-strip">
        <div class="nav-inner">
          <button class="menu-toggle" type="button" @click="sideCollapsed = !sideCollapsed">
            <span class="bar"><i></i><i></i><i></i></span>
            <span>{{ sideCollapsed ? '展开目录' : '收起目录' }}</span>
          </button>
          <RouterLink class="nav-link" :class="{ active: route.path === '/' }" to="/">首页</RouterLink>
          <RouterLink class="nav-link" :class="{ active: route.path.startsWith('/page/') }" to="/page/system">基本情报</RouterLink>
          <RouterLink class="nav-link" to="/page/main-story">攻略</RouterLink>
          <RouterLink class="nav-link" to="/page/dex-kunidama">图鉴</RouterLink>
          <RouterLink class="nav-link" to="/page/glossary">用语集</RouterLink>
          <a class="nav-link" href="https://wikiwiki.jp/tamacolle/" target="_blank" rel="noopener">原文Wiki ↗</a>
          <SiteSearch />
          <button class="theme-toggle" type="button" @click="toggleTheme" :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'">
            <span class="theme-ico">{{ theme === 'dark' ? '☀' : '☾' }}</span>
            <span>{{ theme === 'dark' ? '昼' : '夜' }}</span>
          </button>
        </div>
      </nav>
    </header>

    <div class="layout" :class="{ 'side-collapsed': sideCollapsed }">
      <aside class="side">
        <SideNav />
      </aside>
      <main class="main">
        <RouterView />
      </main>
    </div>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="f-brand">魂これ（地魂男儿）中文 Wiki</div>
        <div>
          本网站为玩家自发制作的非官方中文翻译，与开发运营方「にじたま」无任何关联。<br />
          游戏名、角色名、图像等权利均归原作者与官方所有；原文内容出自
          <a href="https://wikiwiki.jp/tamacolle/" target="_blank" rel="noopener" style="color:#d9c58f">魂これ Wiki*（wikiwiki.jp）</a>。<br />
          译文仅供参考，如有出入请以原文为准。
        </div>
        <div class="f-repo">
          <a
            href="https://github.com/Federico-Prask/tamacolle-wiki-zh"
            target="_blank"
            rel="noopener"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01
                1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
                0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68
                0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0
                3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01
                8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>GitHub · Federico-Prask/tamacolle-wiki-zh</span>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>


