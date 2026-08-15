/**
 * 语义色板 —— 自定义语法 [color:xxx]…[/color] 使用的颜色名。
 *
 * 关键点：色名不映射到固定 hex，而是映射到 CSS 变量 `--c-<name>`，
 * 由 theme.css 在浅色 / 深色两套主题下分别给值，
 * 这样 Markdown 里写死的颜色也能随主题自动适配对比度。
 */

/** 允许的语义色名（写在 [color:xxx] 里的 xxx） */
export const COLOR_NAMES = [
  // 基础
  'red',
  'blue',
  'green',
  'gold',
  'purple',
  'orange',
  'pink',
  'cyan',
  'gray',
  'ink',
  // 和色别名（与站点主题同名，方便和风文案使用）
  'shu', // 朱
  'enji', // 臙脂
  'kon', // 紺
  'ai', // 藍
  'kikyo', // 桔梗
  'yamabuki', // 山吹
  'matsuba', // 松葉
  'uguisu', // 鶯
  'mizuasagi', // 水浅葱
  'murasaki', // 江戸紫
  'kin', // 金
  'nezumi', // 鼠
  // 游戏语义色（属性 / 稀有度等，便于内容页统一）
  'fire',
  'water',
  'wind',
  'earth',
  'light',
  'dark',
  'rare',
  'legend',
  'warn',
  'info',
  'ok',
  'ng',
] as const

export type ColorName = (typeof COLOR_NAMES)[number]

const COLOR_SET = new Set<string>(COLOR_NAMES)

/** 3/4/6/8 位 hex */
const HEX_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/**
 * 把 [color:xxx] 里的 xxx 解析成一个可安全放进 style 的 CSS 颜色值。
 * - 语义色名 → var(--c-name)，随主题变化
 * - #rrggbb  → 原样使用（作者显式指定，视为「我知道我在做什么」）
 * - 其它     → null（不认识，原样输出文本，不注入样式）
 */
export function resolveColor(raw: string): string | null {
  const v = (raw || '').trim().toLowerCase()
  if (!v) return null
  if (COLOR_SET.has(v)) return `var(--c-${v})`
  if (HEX_RE.test(v)) return v
  return null
}

/** 背景高亮 [mark:xxx] 用的颜色（弱化版，走 --cb-* 变量） */
export function resolveBgColor(raw: string): string | null {
  const v = (raw || '').trim().toLowerCase()
  if (!v) return null
  if (COLOR_SET.has(v)) return `var(--cb-${v})`
  if (HEX_RE.test(v)) return v
  return null
}
