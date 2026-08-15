// 全局共享类型定义

export type CharType = 'kunidama' | 'ayakashi' | 'rokuhara'

/** characters.ts 里的角色摘要条目 */
export interface CharacterSummary {
  slug: string
  name: string
  kana: string
  zh: string
  num: number | string
  region: string
  weapon?: string
  power?: string
  hare?: string
  type: CharType
  desc: string
}

/** 角色页 JSON 中的立绘条目 */
export interface CharIllust {
  label?: string
  labelZh?: string
  img?: string
  local?: string
}

/** 战法条目 */
export interface CharTactic {
  name: string
  nameZh: string
  desc: string
  descZh: string
  cond: string
  condZh: string
}

/** 角色页 JSON 中的结构化角色数据（scripts/build_chars.py 生成） */
export interface CharacterData {
  name: string
  nameZh: string
  kana: string
  type: CharType
  num: string
  numInt: number | null
  kv: [string, string][]
  status: [string, string][]
  desc: string
  descZh: string
  voice: string
  /**
   * 语音台词表：「分类 / 场景 / 子场景 / 台词」四列，
   * 使用 [^] [<] 合并单元格语法（见 src/markdown/extensions.ts）。
   * 最初由 scripts/build_voice_tables.py 从扁平的 voiceText 生成，
   * 现已作为唯一数据源直接维护。
   */
  voiceMd?: string
  artist: string
  portrait: string
  illusts: CharIllust[]
  illustNotes: { label: string; note: string }[]
  tactics: CharTactic[]
  bond: Record<string, unknown>
  motif: string
  trivia: string
  motifZh: string
  triviaZh: string
}

/** 站内页面（md 内容页或角色页）统一结构 */
export interface Page {
  id: string
  body: string
  title?: string
  ja?: string
  zh?: string
  cat?: string
  kind?: string
  source?: string
  char?: CharacterData | null
}
