#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载「戦法」图标到 public/images/tactics/。

全站只有 6 种战法，图标统一挂在原 wiki 的
「テンプレート/キャラテンプレ」页面下（不是每个角色各一套），
所以这里直接写死这 6 个 URL 即可。

wikiwiki.jp 的 CDN 会拦截无浏览器特征的直连（403），
沿用项目既有做法：通过 images.weserv.nl 代理下载。

用法：python3 scripts/download_tactic_icons.py
"""

from __future__ import annotations

import os
import urllib.parse
import urllib.request

OUT_DIR = "public/images/tactics"

CDN = (
    "https://cdn.wikiwiki.jp/to/w/tamacolle/"
    "%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88/"
    "%E3%82%AD%E3%83%A3%E3%83%A9%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC/::ref/"
)

# 战法名（日文，与 char.tactics[].name 对应） -> (原图文件名, 本地 slug)
ICONS: dict[str, tuple[str, str]] = {
    "まえを攻める": ("%E6%88%A6%E7%95%A5_%E5%89%8D.png", "mae"),
    "うしろを攻める": ("%E6%88%A6%E7%95%A5_%E5%BE%8C%E3%82%8D.png", "ushiro"),
    "素直に攻める": ("%E6%88%A6%E7%95%A5_%E7%B4%A0%E7%9B%B4.png", "sunao"),
    "一心不乱に攻める": ("%E6%88%A6%E7%95%A5_%E4%B8%80%E5%BF%83%E4%B8%8D%E4%B9%B1.png", "isshin"),
    "みんなで攻める": ("%E6%88%A6%E7%95%A5_%E7%9A%86.png", "minna"),
    "弱いところを攻める": ("%E6%88%A6%E7%95%A5_%E5%BC%B1%E3%81%84.png", "yowai"),
}

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def download(url: str, dest: str) -> bool:
    # images.weserv.nl 代理：绕过 CDN 的直连拦截
    proxied = "https://images.weserv.nl/?url=" + urllib.parse.quote(
        url.replace("https://", ""), safe=""
    )
    for attempt_url in (proxied, url):
        try:
            req = urllib.request.Request(attempt_url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if len(data) < 100:
                continue
            with open(dest, "wb") as fh:
                fh.write(data)
            return True
        except Exception as e:  # noqa: BLE001
            print(f"    尝试失败: {e}")
    return False


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    ok = 0
    for name, (fname, slug) in ICONS.items():
        dest = os.path.join(OUT_DIR, f"{slug}.png")
        if os.path.exists(dest) and os.path.getsize(dest) > 100:
            print(f"  {name} → 已存在，跳过")
            ok += 1
            continue
        url = CDN + fname
        print(f"  {name} → {dest}")
        if download(url, dest):
            ok += 1
        else:
            print(f"    !! 下载失败：{name}")
    print(f"\n完成 {ok}/{len(ICONS)}")
    return 0 if ok == len(ICONS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
