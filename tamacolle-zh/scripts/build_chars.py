#!/usr/bin/env python3
"""raw_data/*.json → src/data/pages/*.json（中文角色页：术语翻译 + 完整结构化数据）"""
import os, re, json

RAW = os.path.join(os.path.dirname(__file__), "..", "raw_data")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "pages")
os.makedirs(OUT, exist_ok=True)

# 资料室说明 中文翻译（人工翻译）
DESC_ZH = json.load(open(os.path.join(os.path.dirname(__file__), 'desc_zh.json'), encoding='utf-8'))

# 角色中文名（覆盖字典；旧国名默认沿用汉字）
NAME_ZH = {
    "山城": "山城", "大和": "大和", "河内": "河内", "和泉": "和泉",
    "伊賀": "伊贺", "志摩": "志摩", "尾張": "尾张", "三河": "三河",
    "遠江": "远江", "駿河": "骏河", "伊豆": "伊豆", "甲斐": "甲斐",
    "相模": "相模", "武蔵": "武藏", "下総": "下总", "上総": "上总",
    "安房": "安房", "常陸": "常陆", "信濃": "信浓", "下野": "下野",
    "陸奥": "陆奥", "近江": "近江", "越前": "越前", "越後": "越后",
    "能登": "能登", "加賀": "加贺", "若狭": "若狭", "丹波": "丹波",
    "但馬": "但马", "因幡": "因幡", "石見": "石见", "隠岐": "隐岐",
    "播磨": "播磨", "備前": "备前", "備中": "备中", "備後": "备后",
    "周防": "周防", "長門": "长门", "紀伊": "纪伊", "阿波": "阿波",
    "讃岐": "讃岐", "伊予": "伊予", "土佐": "土佐", "筑前": "筑前",
    "筑後": "筑后", "肥前": "肥前", "豊後": "丰后", "日向": "日向",
    "薩摩": "萨摩", "大隅": "大隅", "壱岐": "壹岐",
    # 妖怪
    "座敷わらし": "座敷童子", "夜行さん": "夜行先生", "鵺": "鵺",
    "火車": "火车", "悉平太郎": "悉平太郎", "あかなめ": "垢尝",
    "青行燈": "青行灯", "ナモミハギ": "南无剥", "白布": "白布",
    "烏天狗": "乌鸦天狗", "富良野アルクトス": "富良野·阿克托斯",
    "雲龍院りく": "云龙院·陆", "小豆洗い": "洗红豆",
    # 六原职员
    "犬童夏人": "犬童夏人", "猪森茂就": "猪森茂就", "猫乃屋壮一": "猫乃屋壮一",
    "椋虎鉄丸": "椋虎铁丸", "赤熊百太": "赤熊百太", "羽鳥悠飛": "羽鸟悠飞",
    "相馬聯": "相马联",
}

TYPE_OF = {
    "山城":"kunidama","大和":"kunidama","河内":"kunidama","和泉":"kunidama","伊賀":"kunidama",
    "志摩":"kunidama","尾張":"kunidama","三河":"kunidama","遠江":"kunidama","駿河":"kunidama",
    "伊豆":"kunidama","甲斐":"kunidama","相模":"kunidama","武蔵":"kunidama","下総":"kunidama",
    "上総":"kunidama","安房":"kunidama","常陸":"kunidama","信濃":"kunidama","下野":"kunidama",
    "陸奥":"kunidama","近江":"kunidama","越前":"kunidama","越後":"kunidama","能登":"kunidama",
    "加賀":"kunidama","若狭":"kunidama","丹波":"kunidama","但馬":"kunidama","因幡":"kunidama",
    "石見":"kunidama","隠岐":"kunidama","播磨":"kunidama","備前":"kunidama","備中":"kunidama",
    "備後":"kunidama","周防":"kunidama","長門":"kunidama","紀伊":"kunidama","阿波":"kunidama",
    "讃岐":"kunidama","伊予":"kunidama","土佐":"kunidama","筑前":"kunidama","筑後":"kunidama",
    "肥前":"kunidama","豊後":"kunidama","日向":"kunidama","薩摩":"kunidama","大隅":"kunidama","壱岐":"kunidama",
    "座敷わらし":"ayakashi","夜行さん":"ayakashi","鵺":"ayakashi","火車":"ayakashi",
    "悉平太郎":"ayakashi","あかなめ":"ayakashi","青行燈":"ayakashi","ナモミハギ":"ayakashi",
    "白布":"ayakashi","烏天狗":"ayakashi","富良野アルクトス":"ayakashi","雲龍院りく":"ayakashi",
    "小豆洗い":"ayakashi",
    "犬童夏人":"rokuhara","猪森茂就":"rokuhara","猫乃屋壮一":"rokuhara","椋虎鉄丸":"rokuhara",
    "赤熊百太":"rokuhara","羽鳥悠飛":"rokuhara","相馬聯":"rokuhara",
}

# 术语替换（长词优先，顺序敏感）
TERMS = [
    ("魂茶屋店員服", "魂茶屋店员服"), ("通常立ち絵", "通常立绘"), ("戦闘立ち絵", "战斗立绘"),
    ("負傷時", "负伤"), ("カットイン", "特写"), ("入浴タオル", "入浴毛巾"),
    ("春夏服", "春夏服"), ("秋冬服", "秋冬服"), ("水着", "泳装"), ("晴れ着", "晴服"),
    ("まわし", "兜裆布"), ("きぐぱ", "きぐぱ"), ("タオル", "毛巾"),
    ("東海道", "东海道"), ("東山道", "东山道"), ("北陸道", "北陆道"),
    ("山陰道", "山阴道"), ("山陽道", "山阳道"), ("南海道", "南海道"), ("西海道", "西海道"),
    ("畿内", "畿内"), ("大国", "大国"), ("上国", "上国"), ("下国", "下国"), ("中国", "中等国"),
    ("得意地形", "擅长地形"), ("自然", "自然"), ("水辺", "水边"), ("難所", "难所"), ("街", "街"),
    ("武器種", "武器种"), ("所属", "所属"), ("国力", "国势"), ("ハレの日", "节庆日"),
    ("実装", "实装"), ("初期ステータス", "初始属性"), ("追加ステータス", "追加属性"),
    ("追加効果", "追加效果"), ("分類", "分类"), ("付喪神", "付丧神"),
    ("抜魂技名", "拔魂技名"), ("効果", "效果"), ("抜魂の速さ", "拔魂速度"),
    ("速い", "快"), ("遅い", "慢"),
    ("縦１列の敵に攻撃", "攻击纵向一列敌人"), ("縦一列", "纵向一列"),
    ("敵1体に強力な攻撃", "对敌单体强力攻击"), ("敵１体に強力な攻撃", "对敌单体强力攻击"),
    ("いずれかの敵３体に", "对任意 3 体敌人"), ("いずれかの敵に３回攻撃", "对任意敌人攻击 3 次"),
    ("敵１体を中心に", "以敌 1 体为中心"), ("武器と同じ範囲", "与武器同范围"),
    ("敵全体", "敌全体"),
    ("金属性", "金属性"), ("水属性", "水属性"), ("火属性", "火属性"),
    ("木属性", "木属性"), ("土属性", "土属性"),
    ("夜の戦闘で命中率が低下しない", "夜间战斗命中率不下降"),
    ("素直に攻める", "老实进攻"), ("一心不乱に攻める", "一心不乱进攻"),
    ("まえを攻める", "攻击前方"), ("うしろを攻める", "攻击后方"),
    ("みんなで攻める", "大家齐攻"), ("弱いところを攻める", "攻击弱点"),
    ("攻撃可能な敵を狙う", "攻击可攻击的敌人"),
    ("攻撃力が上がるが、ミスをしやすくなる", "攻击力上升，但更容易失误"),
    ("前衛の敵を優先して狙う", "优先攻击前卫敌人"),
    ("後衛の敵を優先して狙う", "优先攻击后卫敌人"),
    ("味方が攻撃した敵を優先して狙う", "优先攻击队友攻击过的敌人"),
    ("弱った敵を優先して狙う", "优先攻击残血敌人"),
    ("初期から習得", "初期习得"),
    ("柔毛", "柔毛"), ("獣脂", "兽脂"), ("雄々しい角", "雄角"), ("春画", "春画"),
    ("栄養丸", "营养丸"), ("記文", "记文"), ("智識", "智识"), ("差し入れ", "慰劳品"),
    ("チョコレートの箱", "巧克力盒"),
    ("東海", "东海"), ("東山", "东山"), ("北陸", "北陆"), ("山陰", "山阴"),
    ("山陽", "山阳"), ("南海", "南海"), ("西海", "西海"),
    ("箇所", "位置"), ("消費魂玉", "消耗魂玉"), ("必要素材", "所需素材"),
    ("特殊絆", "特殊羁绊"), ("Lv上限", "等级上限"), ("信頼・一", "信赖·一"), ("信頼・特", "信赖·特"),
    ("条件", "条件"), ("イベント", "活动"),
    ("資料室説明", "资料室说明"), ("絵", "画师"), ("声", "声优"),
    ("攻撃値", "攻击值"), ("魂圧値", "魂压值"), ("豊満", "丰满足"), ("速さ", "速度"),
    ("命中", "命中"), ("力", "力量"), ("技", "技巧"), ("攻撃", "攻击"), ("HP", "HP"),
]

# 声 section 标签翻译（仅用于语音文本）
VOICE_TERMS = [
    ("タイトル", "标题"), ("開始", "开始"), ("タッチ", "触摸"), ("股間", "股间"), ("股関", "股间"),
    ("負傷", "负伤"), ("放置", "放置"), ("荘園", "庄园"), ("ポロリ", "走光"), ("入浴", "入浴"),
    ("湯浴み", "沐浴"), ("購買", "购买"), ("資料室", "资料室"), ("実績", "成就"),
    ("任務", "任务"), ("声聞", "声闻"), ("再声聞", "再次声闻"), ("絆", "羁绊"),
    ("限界突破", "界限突破"), ("個室", "个人房间"), ("入室", "入室"), ("クリスマス", "圣诞"),
    ("通常", "通常"), ("水着", "泳装"), ("晴れ着", "晴服"), ("編成", "编成"),
    ("大魂守", "大魂守"), ("神妖連結", "神妖连结"), ("任務開始", "任务开始"), ("分岐", "分岐"),
    ("お宝発見", "发现宝藏"), ("アクシデント", "意外"), ("戦闘開始", "战斗开始"),
    ("通常攻撃", "普通攻击"), ("抜魂技前", "拔魂技前"), ("反撃", "反击"), ("追撃", "追击"),
    ("残敵一体", "剩敌一人"), ("味方負傷", "队友负伤"), ("抜魂技", "拔魂技"), ("被弾", "中弹"),
    ("浄化", "净化"), ("戦闘", "战斗"),
]
def vt(s):
    for a, b in VOICE_TERMS:
        s = s.replace(a, b)
    return s

def t(s):
    if s is None: return ''
    for a, b in TERMS:
        s = s.replace(a, b)
    # 正则模式
    s = re.sub(r'活動「(.*?)」\s*を開放', r'开放活动「\1」', s)
    s = re.sub(r'(.*?)の技術\+?(\d*)', lambda m: f'{m.group(1)}的技术+{m.group(2)}' if m.group(2) else f'{m.group(1)}的技术', s)
    s = re.sub(r'(.*?)のHP\+?(\d*)', lambda m: f'{m.group(1)}的HP+{m.group(2)}' if m.group(2) else f'{m.group(1)}的HP', s)
    s = re.sub(r'(.*?)の攻撃\+?(\d*)', lambda m: f'{m.group(1)}的攻击+{m.group(2)}' if m.group(2) else f'{m.group(1)}的攻击', s)
    s = re.sub(r'(.*?)のLv上限 \+(\d+)', r'\1的等级上限 +\2', s)
    s = re.sub(r'結んだ絆\s*(\d+)\s*で習得', r'羁绊 \1 时习得', s)
    s = re.sub(r'の心', '之心', s)
    s = re.sub(r'\s*・\s*', '・', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def kanji2int(s):
    """'四十八番' → 48"""
    if not s: return None
    s = s.replace('番', '').strip()
    if not s: return None
    K = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9}
    total = 0; cur = 0
    for ch in s:
        if ch in K:
            cur = K[ch]
        elif ch == '十':
            total += (cur or 1) * 10; cur = 0
        elif ch == '百':
            total += (cur or 1) * 100; cur = 0
        elif ch.isdigit():
            cur = cur * 10 + int(ch)
    total += cur
    return total if total > 0 else None

def build(slug):
    d = json.load(open(os.path.join(RAW, slug + '.json'), encoding='utf-8'))
    name = d.get('name', '')
    # 清理占位符
    motif = d.get('motif', '') or ''
    trivia = d.get('trivia', '') or ''
    for ph in ('記述してください', 'テンプレ', '原文页模板未填写', 'ここに', '添付', '元ネタの説明を', 'ネタ｜'):
        motif = motif.replace(ph, '')
        trivia = trivia.replace(ph, '')
    motif = re.sub(r'[（(]\s*[:：]?\s*[)）]', '', motif).strip()
    if len(motif) < 15: motif = ''
    if len(trivia) < 10: trivia = ''
    d['motif'] = motif
    d['trivia'] = trivia
    # 若解析时未提取到画师/声优，从 raw HTML 正则补充
    if not d.get('artist') or not d.get('voice'):
        rawp = os.path.join(os.path.dirname(__file__), '..', 'raw', slug + '.html')
        if os.path.exists(rawp):
            html = open(rawp, encoding='utf-8', errors='replace').read()
            m = re.search(r'絵[：:]\s*([^\s<]+)', html)
            if m and not d.get('artist'): d['artist'] = m.group(1)
            m = re.search(r'声[：:]\s*([^\s<]+)', html)
            if m and not d.get('voice'): d['voice'] = m.group(1)
    typ = TYPE_OF.get(name, 'kunidama')
    zh = NAME_ZH.get(name, name)
    kv = [(t(k), t(v)) for k, v in d.get('kv', {}).items()]
    status = [(t(k), v) for k, v in d.get('status', {}).items()]
    illusts = []
    for i, il in enumerate(d.get('illusts', [])):
        illusts.append({
            'label': il['label'], 'labelZh': t(il['label']),
            'img': il['img'],
            'local': f"/images/chars/{slug}_{i}.jpg",
        })
    notes = [{'label': t(n['label']), 'note': n['note']} for n in d.get('illust_notes', [])]
    tactics = []
    for r in d.get('tactics', []):
        if len(r) >= 4:
            tactics.append({'name': r[1], 'nameZh': t(r[1]), 'desc': r[2], 'descZh': t(r[2]), 'cond': r[3], 'condZh': t(r[3])})
    bond = {}
    for k, v in d.get('bond', {}).items():
        if isinstance(v, str):
            bond[t(k)] = {'text': t(v)}
        else:
            bond[t(k)] = [[[t(c) for c in row] for row in tbl] for tbl in v]
    char = {
        'name': name, 'nameZh': zh, 'kana': d.get('kana', ''), 'type': typ,
        'num': d.get('num', ''), 'numInt': kanji2int(d.get('num', '')),
        'kv': kv, 'status': status,
        'desc': d.get('desc', ''), 'descZh': DESC_ZH.get(name, ''),
        'voice': vt(d.get('voice_text', '')),
        'artist': d.get('artist', ''), 'voice': d.get('voice', ''),
        'portrait': d.get('portrait', ''),
        'illusts': illusts, 'illustNotes': notes,
        'tactics': tactics, 'bond': bond,
        'motif': d.get('motif', ''), 'trivia': d.get('trivia', ''),
    }
    page = {
        'id': slug, 'ja': name, 'zh': zh, 'cat': 'dex', 'kind': 'char',
        'body': '', 'char': char,
    }
    json.dump(page, open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

n = 0
for fn in sorted(os.listdir(RAW)):
    if fn.endswith('.json') and not fn.startswith('_'):
        build(fn[:-5])
        n += 1
print('built', n, 'character pages')
