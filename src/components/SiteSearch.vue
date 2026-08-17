<script setup lang="ts">
/**
 * 站内搜索
 *
 * 展开动画（FLIP）
 * ----------------
 * 顶栏按钮消失的同一位置、同一尺寸处出现一个等价的方框，
 * 随后它一边向左伸长、一边把圆角从 6px 过渡到胶囊。
 *
 * 关键点：全程用「像素级 left / width」定位，不用 translateX(-50%)。
 * 若混用 transform 居中，left 与 transform 同时插值会让右边缘
 * 在动画初期先向右冲出再回收 —— 这正是要避免的。
 * 现在右边缘基本不动，只有左边缘向左延伸。
 *
 * 提示语字数由形变进度驱动（rAF），所以是「框变长 → 字变多」，
 * 而不是遮罩擦除，也不是与宽度无关的固定延迟。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { search, type SearchHit } from '../search/index'

const router = useRouter()

const PLACEHOLDER = '搜索页面、角色、道具、台词…'

const q = ref('')
const open = ref(false)
/** 形变结束后才显示底部提示条 */
const settled = ref(false)
/** 形变进度 0→1，决定提示语已显现到第几个字 */
const progress = ref(0)
const active = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const anchorEl = ref<HTMLElement | null>(null)

/** 起点（顶栏按钮）与终点（居中胶囊）的几何，均为像素 */
const geo = ref({
  fromLeft: 0,
  fromTop: 0,
  fromWidth: 0,
  toLeft: 0,
  toTop: 0,
  toWidth: 0,
})

const hits = computed<SearchHit[]>(() => (q.value.trim() ? search(q.value, 24) : []))
const showGhost = computed(() => open.value && !q.value)

/**
 * 跟随形变进度显现的字数。
 * 前 15% 留给「框刚开始长」，之后字数与宽度同步增长。
 */
const ghostText = computed(() => {
  const t = Math.max(0, (progress.value - 0.15) / 0.85)
  return PLACEHOLDER.slice(0, Math.round(t * PLACEHOLDER.length))
})

watch(q, () => {
  active.value = 0
})

function measure(): void {
  const r = anchorEl.value?.getBoundingClientRect()
  const vw = window.innerWidth
  const toWidth = Math.min(680, vw * 0.92)
  geo.value = {
    fromLeft: r ? r.left : vw - 200,
    fromTop: r ? r.top : 60,
    fromWidth: r ? r.width : 96,
    // 终点用像素表示，避免 transform 参与插值
    toLeft: Math.round((vw - toWidth) / 2),
    toTop: Math.round(window.innerHeight * (vw < 640 ? 0.08 : 0.14)),
    toWidth: Math.round(toWidth),
  }
}

async function openSearch(): Promise<void> {
  if (open.value) return
  measure()
  open.value = true
  settled.value = false
  progress.value = 0
  document.body.style.overflow = 'hidden'
  await nextTick()
  inputEl.value?.focus()

  // 与 CSS 的 0.34s cubic-bezier(.22,1,.36,1) 对齐，让字数与宽度同步
  const DUR = 340
  const t0 = performance.now()
  const ease = (x: number) => 1 - Math.pow(1 - x, 3)
  const step = (now: number) => {
    if (!open.value) return
    const x = Math.min(1, (now - t0) / DUR)
    progress.value = ease(x)
    if (x < 1) requestAnimationFrame(step)
    else settled.value = true
  }
  requestAnimationFrame(step)
}

function close(): void {
  if (!open.value) return
  open.value = false
  settled.value = false
  progress.value = 0
  q.value = ''
  active.value = 0
  document.body.style.overflow = ''
}

function go(hit: SearchHit): void {
  router.push(`/page/${hit.id}`)
  close()
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (!hits.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = (active.value + 1) % hits.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = (active.value - 1 + hits.value.length) % hits.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const h = hits.value[active.value]
    if (h) go(h)
  }
}

function onGlobalKey(e: KeyboardEvent): void {
  const el = e.target as HTMLElement | null
  const typing =
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value ? close() : void openSearch()
  } else if (e.key === '/' && !typing && !open.value) {
    e.preventDefault()
    void openSearch()
  }
}

function onResize(): void {
  if (open.value) measure()
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKey)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKey)
  window.removeEventListener('resize', onResize)
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- 收起态：顶栏按钮。展开时隐藏但保留占位，避免导航抖动 -->
  <button
    ref="anchorEl"
    class="ss-trigger"
    :class="{ hidden: open }"
    type="button"
    aria-label="搜索（按 / 或 Ctrl+K）"
    @click="openSearch"
  >
    <span class="ss-ico" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="M12.8 12.8 L17 17" stroke-linecap="round" />
      </svg>
    </span>
    <span class="ss-label">搜索</span>
    <kbd class="ss-kbd" aria-hidden="true">/</kbd>
  </button>

  <Teleport to="body">
    <Transition name="ss-fade">
      <div v-if="open" class="ss-backdrop" @click="close"></div>
    </Transition>

    <Transition name="ss-morph">
      <div
        v-if="open"
        class="ss-layer"
        :style="{
          '--from-left': geo.fromLeft + 'px',
          '--from-top': geo.fromTop + 'px',
          '--from-width': geo.fromWidth + 'px',
          '--to-left': geo.toLeft + 'px',
          '--to-top': geo.toTop + 'px',
          '--to-width': geo.toWidth + 'px',
        }"
      >
        <div class="ss-bar">
          <span class="ss-ico big" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M12.8 12.8 L17 17" stroke-linecap="round" />
            </svg>
          </span>

          <div class="ss-field">
            <input
              ref="inputEl"
              v-model="q"
              class="ss-input"
              type="text"
              aria-label="站内搜索"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeydown"
            />
            <!-- 提示语：字数跟随框的伸长而增加 -->
            <div v-if="showGhost" class="ss-ghost" aria-hidden="true">{{ ghostText }}</div>
          </div>

          <kbd class="ss-esc" @click="close">Esc</kbd>
        </div>

        <div v-if="q.trim()" class="ss-results" role="listbox">
          <div v-if="!hits.length" class="ss-empty">
            没有找到「{{ q }}」相关的页面
          </div>
          <template v-else>
            <div class="ss-count">{{ hits.length }} 条结果</div>
            <a
              v-for="(h, i) in hits"
              :key="h.id"
              class="ss-item"
              :class="{ active: i === active }"
              role="option"
              :aria-selected="i === active"
              href="javascript:;"
              @click="go(h)"
              @mouseenter="active = i"
            >
              <div class="ss-line">
                <span class="ss-title">{{ h.title }}</span>
                <span v-if="h.ja" class="ss-ja">{{ h.ja }}</span>
                <span class="ss-cat">{{ h.cat }}</span>
              </div>
              <div v-if="h.snippet" class="ss-snippet" v-html="h.snippet"></div>
            </a>
          </template>
        </div>

        <div v-else-if="settled" class="ss-tips">
          <kbd>↑</kbd><kbd>↓</kbd> 选择　<kbd>Enter</kbd> 打开　<kbd>Esc</kbd> 关闭
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
