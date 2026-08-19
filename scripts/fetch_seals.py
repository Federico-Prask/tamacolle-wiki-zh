#!/usr/bin/env python3
"""下载各地魂的印章（ハンコ）到 public/images/seal/。

原 wiki 的「小ネタ/ハンコ集」是按番号排列的 5 列网格，
每格 = 印章图 + 角色名 + 链接；尚未实装印章的番号留空。

图片挂在各角色自己的页面下，文件名为 {wiki文件名}_seal.png
（wiki 文件名 ≠ slug 的情况见 NAME_MAP）。CDN 直连 403，走 images.weserv.nl 代理。

抓不到 = 原 wiki 也没有该角色的印章，属于正常情况，不算失败。
"""
import json
import os
import re
import subprocess
import sys
from urllib.parse import quote

OUT = 'public/images/seal'
PROXY = 'https://images.weserv.nl/?url={}&output=png'

NAME_MAP = {
    'omi': ('近江', 'oumi'),
    'mutsu': ('陸奥', 'rikuoh'),
    'bichu': ('備中', 'bicchu'),
    'awa': ('安房', 'awa'),
    'awa2': ('阿波', 'awa'),
}


def load_kunidama():
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
        out.append((slug, c.get('numInt') or 999, page_ja, fname))
    out.sort(key=lambda x: x[1])
    return out


def fetch(slug, page_ja, fname, force=False):
    dest = f'{OUT}/{slug}.png'
    if os.path.exists(dest) and not force:
        return True
    raw = f'cdn.wikiwiki.jp/to/w/tamacolle/{quote(page_ja)}/::ref/{fname}_seal.png'
    r = subprocess.run(['curl', '-sf', '-o', dest, PROXY.format(raw)], capture_output=True)
    if r.returncode != 0 or not os.path.exists(dest) or os.path.getsize(dest) < 500:
        if os.path.exists(dest):
            os.remove(dest)
        return False
    return True


def main():
    force = '--force' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    chars = load_kunidama()
    have, none = [], []
    for slug, num, page_ja, fname in chars:
        (have if fetch(slug, page_ja, fname, force) else none).append(slug)
    print(f'地魂 {len(chars)} 名：有印章 {len(have)}，原 wiki 无印章 {len(none)}')
    print('无印章：', none)
    json.dump(have, open('scripts/seal_have.json', 'w'), indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
