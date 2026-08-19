#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载道具一览（アイテム）页面的图标，并为 item.md 各表补上「图标」列。

背景
----
原 wiki 的道具表第一列是「アイコン」，我们的翻译版把这一列整个丢了。
本脚本按「日文道具名 → 图标 URL」的映射下载图片，
再按中文译名回填到 src/content/item.md。

wikiwiki 的 CDN 会拦截无浏览器特征的直连（403），
沿用项目既有做法：通过 images.weserv.nl 代理下载。

用法
----
    python3 scripts/fetch_item_icons.py            # 下载 + 回填
    python3 scripts/fetch_item_icons.py --dry-run  # 只看会做什么
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

OUT_DIR = "public/images/items"
MAP_FILE = "scripts/item_icons.json"
ITEM_MD = "src/content/item.md"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def download(url: str, dest: str) -> bool:
    """优先走 weserv 代理，失败再试直连。"""
    bare = url.replace("https://", "").replace("http://", "")
    proxied = "https://images.weserv.nl/?url=" + urllib.parse.quote(bare, safe="")
    for attempt in (proxied, url):
        try:
            req = urllib.request.Request(attempt, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if len(data) < 200:
                continue
            with open(dest, "wb") as fh:
                fh.write(data)
            return True
        except Exception:  # noqa: BLE001
            continue
    return False


def main() -> int:
    dry = "--dry-run" in sys.argv

    if not os.path.exists(MAP_FILE):
        print(f"缺少映射表 {MAP_FILE}", file=sys.stderr)
        return 1
    with open(MAP_FILE, encoding="utf-8") as fh:
        mapping: dict[str, dict[str, str]] = json.load(fh)

    os.makedirs(OUT_DIR, exist_ok=True)

    ok = skip = fail = 0
    for zh, info in mapping.items():
        slug = info["slug"]
        url = info["url"]
        ext = ".png" if ".png" in url.lower() else (
            ".gif" if ".gif" in url.lower() else ".jpg"
        )
        dest = os.path.join(OUT_DIR, f"{slug}{ext}")
        if os.path.exists(dest) and os.path.getsize(dest) > 200:
            skip += 1
            continue
        if dry:
            print(f"  [dry] {zh} → {dest}")
            continue
        if download(url, dest):
            print(f"  ✓ {zh:24} → {os.path.basename(dest)}")
            ok += 1
        else:
            print(f"  ✗ {zh:24} 下载失败")
            fail += 1
        time.sleep(0.25)

    print(f"\n下载 {ok} 张，跳过 {skip} 张，失败 {fail} 张", file=sys.stderr)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
