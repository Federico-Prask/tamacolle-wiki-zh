#!/usr/bin/env python3
"""下载并生成图片集页面（印章集、噬魂集）"""
import re, os, json, io, urllib.request, urllib.parse, time

def dl(rel, url, w=160):
    dest = os.path.join('public', rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        return
    full = f"https://images.weserv.nl/?url={urllib.parse.quote(url, safe='')}&output=jpg&w={w}"
    try:
        req = urllib.request.Request(full, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=60).read()
        if len(data) >= 200:
            open(dest, 'wb').write(data)
    except Exception as e:
        print('  FAIL', rel, str(e)[:50])
    time.sleep(0.12)

NAME_ZH = {
 "山城":"山城","大和":"大和","河内":"河内","和泉":"和泉","伊賀":"伊贺","志摩":"志摩","尾張":"尾张",
 "三河":"三河","遠江":"远江","駿河":"骏河","伊豆":"伊豆","甲斐":"甲斐","相模":"相模","武蔵":"武藏",
 "下総":"下总","上総":"上总","安房":"安房","常陸":"常陆","信濃":"信浓","下野":"下野","陸奥":"陆奥",
 "近江":"近江","越前":"越前","越後":"越后","能登":"能登","加賀":"加贺","若狭":"若狭","丹波":"丹波",
 "但馬":"但马","因幡":"因幡","石見":"石见","隠岐":"隐岐","播磨":"播磨","備前":"备前","備中":"备中",
 "備後":"备后","周防":"周防","長門":"长门","紀伊":"纪伊","阿波":"阿波","讃岐":"讃岐","伊予":"伊予",
 "土佐":"土佐","筑前":"筑前","筑後":"筑后","肥前":"肥前","豊後":"丰后","日向":"日向","薩摩":"萨摩",
 "大隅":"大隅","壱岐":"壹岐",
}
def zh(n):
    return NAME_ZH.get(n, n)

# ===== 印章集 =====
raw = open('raw2/neta-hanko.html', encoding='utf-8', errors='replace').read()
# 印章表：每个 <td> 内 img alt 是 {slug}_seal，图片属于对应角色页
# 提取 (slug, url) 对
cells = re.findall(r'<img[^>]*alt="([^"]*_seal[^"]*)"[^>]*src="([^"]+)"', raw)
# 也用顺序对应角色编号
imgs = re.findall(r'https?://cdn\.wikiwiki\.jp[^"\']*::ref/([^"\']*_seal[^"\']*)', raw)
seen = set()
uniq = [u for u in imgs if not (u in seen or seen.add(u))]

# 从 alt/文件名提取 slug
seal_items = []
for u in uniq:
    m = re.search(r'([a-z0-9_\-]+)_seal', u)
    if m:
        slug = m.group(1)
        seal_items.append((slug, u))

body = "## 印章集（ハンコ集）\n\n各地魂男儿的印章（ハンコ）图案合集。表内印章仅为一例，实际存在多种图案（尤其备后等）。\n\n<div class=\"illust-grid\">\n"
for i, (slug, u) in enumerate(seal_items):
    rel = f"images/neta/seal_{slug}.jpg"
    dl(rel, u)
    body += f'<figure class="illust-item"><img src="/{rel}" alt="{zh(slug)}" loading="lazy" @error="this.parentElement.style.display=\'none\'" /><figcaption>{zh(slug)}</figcaption></figure>\n'
body += "</div>\n\n> 完整印章图案见[原文印章集](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF/%E3%83%8F%E3%83%B3%E3%82%B3%E9%9B%86)。\n"
d = {"id": "neta-hanko", "ja": "小ネタ/ハンコ集", "zh": "豆知识 · 印章集", "cat": "misc", "body": body}
json.dump(d, io.open('src/data/pages/neta-hanko.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"印章集: {len(seal_items)} 张")

# ===== 噬魂集 =====
raw = open('raw2/neta-kuu.html', encoding='utf-8', errors='replace').read()
imgs = re.findall(r'https?://cdn\.wikiwiki\.jp[^"\']*::ref/[^"\']+', raw)
seen = set()
uniq = [u for u in imgs if not (u in seen or seen.add(u))]

# 按 h3 分段
from bs4 import BeautifulSoup
soup = BeautifulSoup(raw, 'lxml')
body_el = soup.find('div', id='body')
sections = []
cur = None
for el in body_el.find_all(['h2','h3'], recursive=True):
    t = el.get_text(strip=True)
    if el.name in ('h2','h3'):
        cur = t
        sections.append((cur, []))
    # 收集后续图片直到下一个标题
# 更简单：按顺序收集图片，h3 标题作为分组
body = "## 噬魂集（喰魂集）\n\n> 剧透注意。收录作中登场的噬魂（喰魂）图鉴。\n\n<div class=\"illust-grid\">\n"
for i, u in enumerate(uniq):
    rel = f"images/neta/kuu_{i}.jpg"
    dl(rel, u, w=140)
    body += f'<figure class="illust-item"><img src="/{rel}" alt="噬魂 {i+1}" loading="lazy" @error="this.parentElement.style.display=\'none\'" /><figcaption>噬魂 {i+1}</figcaption></figure>\n'
body += "</div>\n\n> 完整噬魂图鉴（按类型分组：球型 / 史莱姆型 / 兽型 / 动物型 / 人型 / 幽灵型 / 现象型 / 合体型 / 力士型等）见[原文噬魂集](https://wikiwiki.jp/tamacolle/%E5%B0%8F%E3%83%8D%E3%82%BF/%E5%96%B0%E9%AD%82%E9%9B%86)。\n"
d = {"id": "neta-kuu", "ja": "小ネタ/喰魂集", "zh": "豆知识 · 噬魂集", "cat": "misc", "body": body}
json.dump(d, io.open('src/data/pages/neta-kuu.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"噬魂集: {len(uniq)} 张")
