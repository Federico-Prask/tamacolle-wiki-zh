#!/usr/bin/env python3
"""下载全部角色立绘（经 images.weserv.nl 压缩 w=440）到 public/images/chars/"""
import json, glob, os, urllib.request, urllib.parse, time

BASE = "https://images.weserv.nl/?url={}&output=jpg&w=440"
PUB = os.path.join(os.path.dirname(__file__), "..", "public", "images", "chars")
os.makedirs(PUB, exist_ok=True)

tasks = []
for p in glob.glob(os.path.join(os.path.dirname(__file__), "..", "src", "data", "pages", "*.json")):
    d = json.load(open(p, encoding='utf-8'))
    if d.get('kind') != 'char' or not d.get('char'): continue
    for i, il in enumerate(d['char'].get('illusts', [])):
        tasks.append((d['id'], i, il['img']))

print("共", len(tasks), "张立绘")
ok, fail = 0, []
for slug, i, url in tasks:
    dest = os.path.join(PUB, f"{slug}_{i}.jpg")
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        ok += 1; continue
    full = BASE.format(urllib.parse.quote(url, safe=""))
    try:
        req = urllib.request.Request(full, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=60).read()
        if len(data) < 200: raise RuntimeError("small %d" % len(data))
        open(dest, "wb").write(data)
        ok += 1
        if ok % 40 == 0: print("  ...", ok)
    except Exception as e:
        fail.append((slug, i, str(e)[:60]))
    time.sleep(0.15)

print(f"\n完成: ok={ok} fail={len(fail)}")
for s, i, e in fail[:30]:
    print("  -", s, i, e)
