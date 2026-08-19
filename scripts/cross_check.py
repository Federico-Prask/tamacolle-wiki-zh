# -*- coding: utf-8 -*-
"""跨字段交叉校验：查「格式完整但内容属于别人」的错误（D11/D12 同类盲区）。
既有测试只看形式（列数/键数/假名占比），查不出张冠李戴。本脚本比对字段之间的一致性。
"""
import json, glob, io, os, re, urllib.parse
from collections import defaultdict

CH = {}
for p in sorted(glob.glob('src/data/pages/*.json')):
    d = json.load(io.open(p, encoding='utf-8'))
    c = d.get('char')
    if c:
        CH[os.path.basename(p)[:-5]] = (c, d)

issues = defaultdict(list)
def rep(kind, slug, msg):
    issues[kind].append((slug, msg))

# ---------- 1. 立绘/头像的本地路径前缀必须与 slug 一致 ----------
for slug, (c, _) in CH.items():
    for i, il in enumerate(c.get('illusts') or []):
        loc = il.get('local') or ''
        if not loc:
            continue
        base = os.path.basename(loc)
        stem = re.split(r'[_.]', base)[0]
        if stem != slug:
            rep('立绘本地路径前缀≠slug', slug, f'illusts[{i}] {base}')

# ---------- 2. 远程图片 URL 里的 wiki 页面名必须是本人 ----------
for slug, (c, _) in CH.items():
    name = c.get('name') or ''
    urls = [('portrait', c.get('portrait') or '')]
    for i, il in enumerate(c.get('illusts') or []):
        urls.append((f'illusts[{i}]', il.get('img') or ''))
    for tag, u in urls:
        if 'wikiwiki.jp' not in u:
            continue
        m = re.search(r'/tamacolle/([^/]+)/::', u)
        if not m:
            continue
        page = urllib.parse.unquote(m.group(1))
        # 页面名可能是简称（六原用简称），只要与全名有交集即可
        if page not in name and name not in page:
            rep('图片URL页面名≠角色名', slug, f'{tag} URL页={page} 角色={name}')

# ---------- 3. 羁绊素材/内容里出现的「XX的心」「XX的技术」必须是本人 ----------
NAMES = {c.get('name'): s for s, (c, _) in CH.items() if c.get('name')}
for slug, (c, _) in CH.items():
    name = c.get('name') or ''
    bond = c.get('bond') or {}
    txt = json.dumps(bond, ensure_ascii=False)
    for other, oslug in NAMES.items():
        if oslug == slug or len(other) < 2:
            continue
        for pat in (f'{other}の心', f'{other}のHP', f'{other}の力', f'{other}の技術', f'{other}の豊満',
                    f'{other}のLv上限'):
            if pat in txt:
                rep('羁绊里出现他人名字', slug, f'{pat}（本人应为 {name}）')

# ---------- 4. 声优/绘师名：同一人是否有多种写法 ----------
def near(a, b):
    if a == b or len(a) != len(b):
        return False
    return sum(1 for x, y in zip(a, b) if x != y) == 1

for field, label in (('voice', '声优'), ('artist', '绘师')):
    vals = defaultdict(list)
    for slug, (c, _) in CH.items():
        v = (c.get(field) or '').strip()
        if v:
            vals[v].append(slug)
    keys = sorted(vals)
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            if near(keys[i], keys[j]):
                rep(f'{label}名疑似同人不同写法', '-',
                    f'{keys[i]}({",".join(vals[keys[i]])}) vs {keys[j]}({",".join(vals[keys[j]])})')

# ---------- 5. 资料室说明 descZh 与语音表「资料室」台词应指向同一个人 ----------
# 判据用「汉字集合重合度」而非字面相似度：两者是同一段日文的两次独立翻译，
# 措辞必然不同，但涉及的地名/人名/物产用字高度重合。
# 实测正常区间 0.62~1.00；模拟 D11（echizen 装播磨台词）仅 0.15，故阈值取 0.40。
# 六原职员的资料室台词是「是羽鸟哦～」这类短问候，与 desc 不同源，按长度跳过。
def _hz(s):
    return set(re.findall(r'[\u4e00-\u9fff]', s or ''))

for slug, (c, _) in CH.items():
    dz = c.get('descZh') or ''
    row = next((l for l in (c.get('voiceMd') or '').split('\n') if '资料室' in l), '')
    if not dz or not row:
        continue
    cell = row.strip().strip('|').split('|')[-1].strip().replace('<br>', '')
    if len(cell) < 20:
        continue
    a, b = _hz(cell), _hz(dz)
    if not b:
        continue
    ov = len(a & b) / len(b)
    if ov < 0.40:
        rep('资料室台词与descZh不同源（疑似张冠李戴）', slug, f'重合度 {ov:.2f}')

# ---------- 6. kv 的「所属」应与 type 相符 ----------
DO = {'东海道','东山道','北陆道','山阴道','山阳道','南海道','西海道','畿内'}
for slug, (c, _) in CH.items():
    if c.get('type') != 'kunidama':
        continue
    belong = dict(c.get('kv') or []).get('所属', '')
    if belong not in DO:
        rep('地魂所属非八道之一', slug, belong)

# ---------- 7. numInt 与 num（汉数字）应一致 ----------
CN = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9}
def cn2int(s):
    s = s.replace('番', '')
    if not s: return None
    if s == '十': return 10
    if '十' in s:
        a, _, b = s.partition('十')
        return (CN.get(a, 1) if a else 1) * 10 + (CN.get(b, 0) if b else 0)
    return CN.get(s)

for slug, (c, _) in CH.items():
    num, ni = c.get('num'), c.get('numInt')
    if not num or ni is None:
        continue
    got = cn2int(num)
    if got is not None and got != ni:
        rep('num与numInt不一致', slug, f'{num} vs {ni}')

# ---------- 8. 典故/小知识里若提到自己的名字，用字应与 nameZh 一致 ----------
for slug, (c, _) in CH.items():
    nz = c.get('nameZh') or ''
    if len(nz) < 2:
        continue
    body = (c.get('motifZh') or '') + (c.get('triviaZh') or '')
    if not body:
        continue
    # 简繁/异体混用：讃岐vs赞岐 之类
    for a, b in (('讃', '赞'), ('鳥', '鸟'), ('澤', '泽'), ('嶋', '岛')):
        if a in nz and b in body and nz.replace(a, b) in body:
            rep('正文里角色名用字与nameZh不一致', slug, f'{nz} vs {nz.replace(a,b)}')

print('=' * 64)
total = 0
for kind in sorted(issues):
    lst = issues[kind]
    total += len(lst)
    print(f'\n■ {kind}  ({len(lst)} 条)')
    for slug, msg in lst[:20]:
        print(f'   {slug:14s} {msg}')
    if len(lst) > 20:
        print(f'   … 另有 {len(lst)-20} 条')
print('\n' + '=' * 64)
print('合计可疑:', total, '／ 检查角色数:', len(CH))
