#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载角色头像（icon），修正「立绘缩图被当成头像」的问题。

背景
----
原 wiki 的头像是各角色页下的 <slug>_icon.png（脸部特写，带装饰相框），
但仓库里有 32 张 *_icon.jpg 实际是全身立绘的缩图（浅色和纸底、看不清脸）。
本脚本按角色页名重新抓取真正的 icon。

wikiwiki 的 CDN 会拦截无浏览器特征的直连（403），
沿用项目既有做法：通过 images.weserv.nl 代理下载。

用法
----
    python3 scripts/fetch_char_icons.py            # 下载缺失/错误的
    python3 scripts/fetch_char_icons.py --force    # 全部重下
    python3 scripts/fetch_char_icons.py --check    # 只检测不下载
"""

from __future__ import annotations

import glob
import json
import os
import sys
import time
import urllib.parse
import urllib.request

OUT_DIR = "public/images/chars"
CDN = "https://cdn.wikiwiki.jp/to/w/tamacolle/"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# 角色页名与 icon 文件名不总是等于 slug，这里记录例外
# slug -> (wiki 页面名, icon 文件名去扩展名)
OVERRIDES: dict[str, tuple[str, str]] = {
    "omi": ("近江", "oumi_icon"),
    "mutsu": ("陸奥", "rikuoh_icon"),
    # 六原职员的 wiki 页面名是姓氏，不是 JSON 里的全名
    "hatori": ("羽鳥", "hatori_icon"),
    "hyakuta": ("百太", "momota_icon"),
    "inomori": ("猪森", "inomori_icon"),
    "kotetsumaru": ("虎鉄丸", "kotetsumaru_icon"),
    "natsuhito": ("夏人", "natsuto_icon"),
    "nekonoya": ("猫乃屋", "nekonoya_icon"),
    "riku": ("りく", "riku_icon"),
    "soma": ("相馬", "souma_icon"),
    "arctos": ("アルクトス", "arctos_icon"),
    "azukiarai": ("小豆洗い", "azukiarai_icon"),
    # 阿波的 icon 与安房同名（各在自己页面下），備中的拼写是 bicchu
    "awa2": ("阿波", "awa_icon"),
    "bichu": ("備中", "bicchu_icon"),
    # 妖怪：页面名与文件名的拼写与 slug 不一致
    "kasha": ("火車", "kasya_icon"),
    "shippeitaro": ("悉平太郎", "sippeitaro_icon"),
    "shirafu": ("白布", "sirafu_icon"),
    "yakou-san": ("夜行さん", "yakousan_icon"),
}


def border_brightness(path: str) -> float | None:
    """取四边平均亮度：真头像有深色相框，立绘缩图边缘偏亮。"""
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        im = Image.open(path).convert("RGB")
    except Exception:  # noqa: BLE001
        return None
    w, h = im.size
    px = im.load()
    vals = []
    for x in range(0, w, 3):
        for y in (0, 1, 2, h - 3, h - 2, h - 1):
            r, g, b = px[x, y]
            vals.append((r + g + b) / 3)
    for y in range(0, h, 3):
        for x in (0, 1, 2, w - 3, w - 2, w - 1):
            r, g, b = px[x, y]
            vals.append((r + g + b) / 3)
    return sum(vals) / len(vals)


def download(url: str, dest: str) -> bool:
    bare = url.replace("https://", "").replace("http://", "")
    proxied = "https://images.weserv.nl/?url=" + urllib.parse.quote(bare, safe="")
    for attempt in (proxied, url):
        try:
            req = urllib.request.Request(attempt, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if len(data) < 500:
                continue
            with open(dest, "wb") as fh:
                fh.write(data)
            return True
        except Exception:  # noqa: BLE001
            continue
    return False


def main() -> int:
    force = "--force" in sys.argv
    check_only = "--check" in sys.argv

    chars: list[tuple[str, str]] = []  # (slug, 日文页名)
    for f in sorted(glob.glob("src/data/pages/*.json")):
        d = json.load(open(f, encoding="utf-8"))
        if not (d.get("char") or {}):
            continue
        ja = d.get("ja")
        if ja:
            chars.append((d["id"], ja))

    os.makedirs(OUT_DIR, exist_ok=True)
    ok = skip = fail = 0
    suspects: list[str] = []

    for slug, ja in chars:
        page, name = OVERRIDES.get(slug, (ja, f"{slug}_icon"))
        dest = os.path.join(OUT_DIR, f"{slug}_icon.png")
        old_jpg = os.path.join(OUT_DIR, f"{slug}_icon.jpg")

        # 判断现有文件是否可疑（边框偏亮 = 立绘缩图）
        existing = dest if os.path.exists(dest) else (old_jpg if os.path.exists(old_jpg) else None)
        bad = False
        if existing:
            b = border_brightness(existing)
            bad = b is not None and b > 150
            if bad:
                suspects.append(f"{slug}（亮度 {b:.0f}）")

        if check_only:
            continue
        if existing and not bad and not force:
            skip += 1
            continue

        url = CDN + urllib.parse.quote(page) + "/::ref/" + urllib.parse.quote(name + ".png")
        if download(url, dest):
            # 新的 png 到位后，移除旧的错误 jpg，避免两份并存
            if os.path.exists(old_jpg):
                os.remove(old_jpg)
            print(f"  ✓ {slug:16} → {os.path.basename(dest)}")
            ok += 1
        else:
            print(f"  ✗ {slug:16} 下载失败（{page}/{name}.png）")
            fail += 1
        time.sleep(0.2)

    if check_only:
        print(f"疑似立绘缩图 {len(suspects)} 张：")
        for s in suspects:
            print("   ", s)
        return 0

    print(f"\n下载 {ok}，跳过 {skip}，失败 {fail}", file=sys.stderr)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
