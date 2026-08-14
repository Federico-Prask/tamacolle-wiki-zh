import { manifest, categories } from './manifest.js'
import { charBySlug } from './characters.js'

// 由各页面 JSON 组成的内容库
const pageModules = import.meta.glob('./pages/*.json', { eager: true })
export const pages = {}
for (const path in pageModules) {
  const data = pageModules[path].default || pageModules[path]
  pages[data.id] = data
}

export { manifest, categories, charBySlug }
