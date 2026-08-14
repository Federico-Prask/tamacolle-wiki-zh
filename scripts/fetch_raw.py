#!/usr/bin/env python3
"""从 web.archive.org 批量抓取角色页面 HTML（原始快照），保存到 raw/ 目录"""
import urllib.request, urllib.parse, os, time, json, sys

BASE = "https://web.archive.org/web/https://wikiwiki.jp/tamacolle/"

# 角色 (slug, 日文页面名) —— 与 src/data/characters.js 对应
CHARS = [
    # 地魂男儿
    ("yamashiro", "山城"), ("yamato", "大和"), ("kawachi", "河内"), ("izumi", "和泉"),
    ("iga", "伊賀"), ("shima", "志摩"), ("owari", "尾張"), ("mikawa", "三河"),
    ("totomi", "遠江"), ("suruga", "駿河"), ("izu", "伊豆"), ("kai", "甲斐"),
    ("sagami", "相模"), ("musashi", "武蔵"), ("shimousa", "下総"), ("kazusa", "上総"),
    ("awa", "安房"), ("hitachi", "常陸"), ("soma", "相馬"), ("shinano", "信濃"),
    ("shimotsuke", "下野"), ("mutsu", "陸奥"), ("omi", "近江"), ("echizen", "越前"),
    ("echigo", "越後"), ("noto", "能登"), ("kaga", "加賀"), ("wakasa", "若狭"),
    ("tanba", "丹波"), ("tajima", "但馬"), ("inaba", "因幡"), ("iwami", "石見"),
    ("oki", "隠岐"), ("harima", "播磨"), ("bizen", "備前"), ("bichu", "備中"),
    ("bingo", "備後"), ("suo", "周防"), ("nagato", "長門"), ("kii", "紀伊"),
    ("awa2", "阿波"), ("sanuki", "讃岐"), ("iyo", "伊予"), ("tosa", "土佐"),
    ("chikuzen", "筑前"), ("chikugo", "筑後"), ("hizen", "肥前"), ("bungo", "豊後"),
    ("hyuga", "日向"), ("satsuma", "薩摩"), ("osumi", "大隅"), ("iki", "壱岐"),
    # 妖怪
    ("zashikiwarashi", "座敷わらし"), ("yakou-san", "夜行さん"), ("nue", "鵺"),
    ("kasha", "火車"), ("shippeitaro", "悉平太郎"), ("akaname", "あかなめ"),
    ("aoandon", "青行燈"), ("namomihagi", "ナモミハギ"), ("shirafu", "白布"),
    ("karasutengu", "烏天狗"), ("arctos", "アルクトス"), ("riku", "りく"),
    ("azukiarai", "小豆洗い"),
    # 六原职员等
    ("natsuhito", "夏人"), ("inomori", "猪森"), ("nekonoya", "猫乃屋"),
    ("kotetsumaru", "虎鉄丸"), ("hyakuta", "百太"), ("hatori", "羽鳥"),
]

OUT = os.path.join(os.path.dirname(__file__), "..", "raw")
os.makedirs(OUT, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            r = urllib.request.urlopen(req, timeout=60)
            return r.read()
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(2 + i * 2)

ok, fail = [], []
for slug, name in CHARS:
    dest = os.path.join(OUT, slug + ".html")
    if os.path.exists(dest) and os.path.getsize(dest) > 5000:
        ok.append(slug)
        continue
    url = BASE + urllib.parse.quote(name, safe="")
    try:
        data = fetch(url)
        if len(data) < 5000:
            raise RuntimeError("too small: %d" % len(data))
        with open(dest, "wb") as f:
            f.write(data)
        ok.append(slug)
        print("OK  ", slug, len(data))
    except Exception as e:
        fail.append((slug, str(e)[:70]))
        print("FAIL", slug, str(e)[:70])
    time.sleep(1.2)

print("\n=== 完成: ok=%d fail=%d ===" % (len(ok), len(fail)))
for s, e in fail:
    print("  -", s, e)
json.dump({"ok": ok, "fail": [s for s, _ in fail]}, open(os.path.join(OUT, "_result.json"), "w"))
