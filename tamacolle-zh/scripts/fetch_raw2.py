#!/usr/bin/env python3
"""批量抓取所有待完整化的页面 HTML（web.archive.org）→ raw2/ 目录"""
import urllib.request, urllib.parse, os, time, json

BASE = "https://web.archive.org/web/https://wikiwiki.jp/tamacolle/"

# (slug, 日文页面名)
PAGES = [
    # 核心内容类
    ("item", "アイテム"),
    ("level", "レベル"),
    ("glossary", "用語集"),
    ("drop-table", "ドロップ表"),
    ("hp-pattern", "地魂男児/HP成長パターン"),
    ("login-bonus", "ログインボーナス"),
    ("update-log", "更新・メンテナンス履歴"),
    ("links", "リンク集"),
    ("makuma", "幕間"),
    ("bug", "バグ・不具合"),
    ("goods", "公式グッズ情報"),
    ("music", "楽曲一覧"),
    ("artists", "絵師一覧"),
    ("seiyuu", "声優一覧"),
    # 图鉴数据
    ("dex-kunidama-env", "地魂男児/得意環境"),
    ("dex-kunidama-material", "地魂男児/素材別"),
    ("dex-ayakashi-attr", "あやかし/属性別"),
    ("speed-table", "小ネタ/速さ表"),
    ("neta", "小ネタ"),
    ("neta-hanko", "小ネタ/ハンコ集"),
    ("neta-cutin", "小ネタ/カットイン集"),
    ("neta-kucho", "小ネタ/キャラ口調表"),
    ("neta-isho", "小ネタ/衣装表"),
    ("neta-calendar", "小ネタ/ハレの日カレンダー"),
    ("neta-era", "小ネタ/時代区分"),
    ("neta-kuu", "小ネタ/喰魂集"),
    ("genchijin", "現地人"),
    ("genchijin-kazeni", "現地人/サイド幾千里"),
    ("genchijin-main2", "現地人/メイン第二話"),
    ("genchijin-main3", "現地人/メイン第三話"),
    ("genchijin-mugen", "現地人/サイド夢幻の如く"),
    ("genchijin-shitei", "現地人/サイド風の師弟"),
    ("genchijin-shouen2024", "現地人/荘園の夏、日本の夏2024"),
    ("genchijin-shouen2025", "現地人/荘園の夏、日本の夏2025"),
    ("genchijin-yukige", "現地人/サイド雪消の丘で"),
    # 攻略数据
    ("daily-mon", "曜日クエスト/月曜日"),
    ("daily-tue", "曜日クエスト/火曜日"),
    ("daily-wed", "曜日クエスト/水曜日"),
    ("daily-thu", "曜日クエスト/木曜日"),
    ("daily-fri", "曜日クエスト/金曜日"),
    ("daily-sat", "曜日クエスト/土曜日"),
    ("daily-sun", "曜日クエスト/日曜日"),
    ("free-25ji", "フリークエスト/オレの魂が叫ぶ25時"),
    ("free-mugen", "フリークエスト/夢幻の如く"),
    ("free-shitei", "フリークエスト/風の師弟"),
    ("free-yukige", "フリークエスト/月冴ゆる雪消の丘で"),
    ("short-beach", "ショートエピソード/夏の浜辺の調査隊"),
    ("short-hyakumonogatari", "ショートエピソード/夏に恋して百物語"),
    ("short-shouen2024", "ショートエピソード/荘園の夏、日本の夏2024"),
    ("short-shouen2025", "ショートエピソード/荘園の夏、日本の夏2025"),
    ("short-summerfes2023", "ショートエピソード/サマーフェス2023"),
    ("short-sumo2023", "ショートエピソード/どすこい！大相撲大会2023"),
    ("short-sumo2024", "ショートエピソード/どすこい！大相撲大会2024"),
    ("short-toshikoshi", "ショートエピソード/年越し23-24"),
    ("short-valentine2023", "ショートエピソード/セントバレンタインデー2023"),
    ("short-valentine2024", "ショートエピソード/セントバレンタインデー2024"),
    ("short-valentine2025", "ショートエピソード/セントバレンタインデー2025"),
    # 编辑类
    ("tpl-char", "テンプレート/キャラテンプレ"),
    ("tpl-ayakashi", "テンプレート/あやかしテンプレ"),
    ("tpl-rokuhara", "テンプレート/ロクハラテンプレ"),
    ("tpl-genchijin", "テンプレート/現地人テンプレ"),
    ("tpl-quest", "テンプレート/クエストテンプレ"),
    ("help-ayakashi", "あやかし・ヘルプ"),
    ("help-kunidama", "地魂男児・ヘルプ"),
    ("format-rule", "整形ルール"),
    ("wiki-help", "ヘルプ"),
    ("wiki-opinion", "wiki編集に関する意見交換"),
    ("edit-task", "編集タスク情報"),
    ("ranking", "人気100"),
    ("today100", "今日100"),
]

OUT = os.path.join(os.path.dirname(__file__), "..", "raw2")
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
for slug, name in PAGES:
    dest = os.path.join(OUT, slug + ".html")
    if os.path.exists(dest) and os.path.getsize(dest) > 3000:
        ok.append(slug)
        continue
    url = BASE + urllib.parse.quote(name, safe="/")
    try:
        data = fetch(url)
        if len(data) < 3000:
            raise RuntimeError("too small: %d" % len(data))
        with open(dest, "wb") as f:
            f.write(data)
        ok.append(slug)
        print("OK  ", slug, len(data))
    except Exception as e:
        fail.append((slug, str(e)[:70]))
        print("FAIL", slug, str(e)[:70])
    time.sleep(1.0)

print("\n=== ok=%d fail=%d ===" % (len(ok), len(fail)))
for s, e in fail:
    print("  -", s, e)
json.dump({"fail": fail}, open(os.path.join(OUT, "_result.json"), "w"))
