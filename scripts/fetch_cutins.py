#!/usr/bin/env python3
"""下载各地魂的 Cut-in（拔魂技发动特写）到 public/images/cutin/。

原 wiki 的「小ネタ/カットイン集」是一张 51 行的表，每行 = 角色头像 + Cut-in 大图。
本站早期翻译整张表都跳过了，只留一句「请去角色页看」。

图片挂在各角色自己的页面下（不是 カットイン集 页面下），
文件名规律为 {wiki文件名}_c.jpg，其中 wiki 文件名 ≠ slug（见 NAME_MAP）。
CDN 直连 403，需走 images.weserv.nl 代理。
"""
import json
import os
import subprocess
import sys
from urllib.parse import quote

OUT = 'public/images/cutin'
PROXY = 'https://images.weserv.nl/?url={}&output=jpg'

# slug -> (角色页日文名, 图片文件名前缀)
# 多数情况两者都能由 slug 推出，但以下角色不一致，逐个核对过
NAME_MAP = {
    'omi': ('近江', 'oumi'),
    'mutsu': ('陸奥', 'rikuoh'),
    'bichu': ('備中', 'bicchu'),
    'awa': ('安房', 'awa'),
    'awa2': ('阿波', 'awa'),
}


def load_chars():
    """从 manifest 里取全部地魂（type=kunidama 的 51 人）"""
    import re
    src = open('src/data/manifest.ts', encoding='utf-8').read()
    rows = re.findall(r"P\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'dex',\s*'char'\)", src)
    out = []
    for slug, ja, zh in rows:
        p = f'src/data/pages/{slug}.json'
        if not os.path.exists(p):
            continue
        c = json.load(open(p, encoding='utf-8'))['char']
        if c.get('type') != 'kunidama':
            continue
        page_ja, fname = NAME_MAP.get(slug, (ja, slug))
        out.append((slug, page_ja, fname))
    return out


def fetch(slug, page_ja, fname, force=False):
    dest = f'{OUT}/{slug}.jpg'
    if os.path.exists(dest) and not force:
        return 'skip'
    raw = f'cdn.wikiwiki.jp/to/w/tamacolle/{quote(page_ja)}/::ref/{fname}_c.jpg'
    url = PROXY.format(raw)
    r = subprocess.run(['curl', '-sf', '-o', dest, url], capture_output=True)
    if r.returncode != 0 or os.path.getsize(dest) < 2000:
        if os.path.exists(dest):
            os.remove(dest)
        return 'FAIL'
    return 'ok'


def main():
    force = '--force' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    chars = load_chars()
    print(f'地魂 {len(chars)} 名')
    bad = []
    for slug, page_ja, fname in chars:
        st = fetch(slug, page_ja, fname, force)
        if st == 'FAIL':
            bad.append(slug)
        print(f'  {st:4} {slug:12} {page_ja}/{fname}_c.jpg')
    print(f'\n完成。失败 {len(bad)}: {bad}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
