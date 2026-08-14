#!/usr/bin/env python3
"""统一生成/缩放全部角色图标到 240x240（有立绘的裁剪顶部方形，已下载的 icon 直接缩放）"""
import json, glob, os
from PIL import Image

PAGES = os.path.join(os.path.dirname(__file__), "..", "src", "data", "pages")
PUB = os.path.join(os.path.dirname(__file__), "..", "public", "images", "chars")
SIZE = 240

chars = []
for p in glob.glob(os.path.join(PAGES, "*.json")):
    d = json.load(open(p, encoding='utf-8'))
    if d.get('kind') == 'char' and d.get('char'):
        chars.append(d)

ok = fail = 0
for d in chars:
    slug = d['id']
    icon = os.path.join(PUB, f"{slug}_icon.jpg")
    first = os.path.join(PUB, f"{slug}_0.jpg")
    src = None
    if os.path.exists(icon):
        src = icon          # 已有图标 → 直接缩放
    elif os.path.exists(first):
        src = first         # 立绘 → 裁剪顶部方形
    if not src:
        continue
    try:
        im = Image.open(src).convert("RGB")
        w, h = im.size
        if src == icon:
            im2 = im.resize((SIZE, SIZE), Image.LANCZOS)
        else:
            side = min(w, h)
            # 裁剪顶部居中方形
            left = (w - side) // 2
            im2 = im.crop((left, 0, left + side, side)).resize((SIZE, SIZE), Image.LANCZOS)
        im2.save(icon, "JPEG", quality=88)
        ok += 1
    except Exception as e:
        fail += 1
        print("FAIL", slug, e)
print(f"ok={ok} fail={fail}")
