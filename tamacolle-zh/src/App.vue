<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideNav from './components/SideNav.vue'

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
      </div>
    </footer>
  </div>
</template>


