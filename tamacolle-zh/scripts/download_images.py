#!/usr/bin/env python3
"""通过 images.weserv.nl 代理下载原 wiki 图片到 public/ 目录"""
import urllib.parse, urllib.request, os, time, sys

BASE = "https://images.weserv.nl/?url={}&output=jpg&w=1200"

# 目标: (目标相对路径, 原始URL)
ITEMS = [
    ("images/title.jpg", "https://cdn.wikiwiki.jp/to/w/tamacolle/FrontPage/::ref/title.jpg.webp?rev=b19c7fd9a9fb45d775d5ab24c5750edb&t=20221113033920"),
    ("images/gacha/item_smn.png", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0/::ref/item_smn.png.webp?rev=b8f899470387bbf09cdc3f6517371c7a&t=20221122011444"),
    ("images/gacha/normal_star.jpg", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%82%AC%E3%83%81%E3%83%A3%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/normal_star.jpg?rev=be6c93de06daa4d68028d8a0b80d1b2f&t=20221115003051"),
    ("images/gacha/gold_star.png", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%82%AC%E3%83%81%E3%83%A3%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/gold_star.png.webp?rev=7688cceb16c342bc4ed7ec72fd27fc85&t=20221116232711"),
    ("images/battle/konatsu.jpg", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/konatsu.jpg.webp?rev=4bf9987772eaa0e2709d150f5d3c7277&t=20240527230125"),
    ("images/battle/weapons.png", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/weapons.png.webp?rev=cf7393dd9facb96c5937f84d90f36f0d&t=20221226185507"),
    ("images/drop/expected_rewards.png", "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/expected_rewards.png.webp?rev=7620ca50f9372c7a06cc0bd6851e4f13&t=20260520163801"),
]

# 角色图标（文件名: slug_icon.jpg）
ICONS = {
    "yamashiro": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%B1%B1%E5%9F%8E/::ref/yamashiro_icon.png.webp?rev=f6e9bba56c38e612c4dcc1e47baaa17a&t=20260419011426",
    "yamato": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%A4%A7%E5%92%8C/::ref/yamato_icon.png.webp?rev=318ca0ef1d5f9a303d21ebea7336d4ba&t=20221116232708",
    "kawachi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%B2%B3%E5%86%85/::ref/kawachi_icon.png.webp?rev=505c86e9173daedc588a097e0cf9ffbb&t=20221118200505",
    "izumi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%92%8C%E6%B3%89/::ref/izumi_icon.png.webp?rev=d9aa05df25c5fdf45e954fec46eaf304&t=20221117152034",
    "iga": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%BC%8A%E8%B3%80/::ref/iga_icon.png.webp?rev=c383cf3cbb33b7a4316f6efe59c19672&t=20221119131755",
    "shima": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%BF%97%E6%91%A9/::ref/shima_icon.png.webp?rev=cf308d3a56676ff527336f32e9278a94&t=20221118211805",
    "owari": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%B0%BE%E5%BC%B5/::ref/owari_icon.png.webp?rev=9091a24324ab3785040dc5cdc0644e25&t=20231105223837",
    "mikawa": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%B8%89%E6%B2%B3/::ref/mikawa_icon.png.webp?rev=7abca4ed163fe835aa4c9bdf78ebdb6d&t=20221117144933",
    "totomi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E9%81%A0%E6%B1%9F/::ref/totomi_icon.png.webp?rev=2c21f15cad77c2d1898fa812716f127d&t=20250809024342",
    "suruga": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E9%A7%BF%E6%B2%B3/::ref/suruga_icon.png.webp?rev=819e68b646714e28aafab978fdc46454&t=20241105225745",
    "izu": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%BC%8A%E8%B1%86/::ref/izu_icon.png.webp?rev=da3e3fd9e2df34bf32fb9b868015b166&t=20241020002638",
    "kai": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%94%B2%E6%96%90/::ref/kai_icon.png.webp?rev=747ad9612ecabc7b4b5e7329af20003a&t=20221128231532",
    "sagami": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%9B%B8%E6%A8%A1/::ref/sagami_icon.png.webp?rev=2bcea95faac30c89b3d92dd1c1c32efb&t=20230630202758",
    "musashi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%AD%A6%E8%94%B5/::ref/musashi_icon.png.webp?rev=2ff9147f93f051b7be467c680991fb14&t=20221129041055",
    "shimousa": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%B8%8B%E7%B7%8F/::ref/shimousa_icon.png.webp?rev=aba242be8a53c979002ac7f586030741&t=20240121090726",
    "shimotsuke": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%B8%8B%E9%87%8E/::ref/shimotsuke_icon.png.webp?rev=07ef90defdd49911b38b7335f89b0708&t=20260114235452",
    "mutsu": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E9%99%B8%E5%A5%A5/::ref/rikuoh_icon.png.webp?rev=01314433d5c993937cf0ea6c137d17de&t=20260606230437",
    "omi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E8%BF%91%E6%B1%9F/::ref/oumi_icon.png.webp?rev=2d9f883848ea1816330826effe146eff&t=20221119232751",
    "shinano": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%BF%A1%E6%BF%83/::ref/shinano_icon.png.webp?rev=dd6ffd23e7013c7ec4024692d3704018&t=20221119023405",
    "tajima": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%BD%86%E9%A6%AC/::ref/tajima_icon.png.webp?rev=3fb59f1867f488a747895fa371d2b5e9&t=20221119143612",
    "kii": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%B4%80%E4%BC%8A/::ref/kii_icon.png.webp?rev=db3f5008a51b5fd0193e7390b92b7919&t=20230506093259",
    "iyo": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E4%BC%8A%E4%BA%88/::ref/iyo_icon.png.webp?rev=53883d5580dba9bcce59e60fbb26cd54&t=20230207224430",
    "tosa": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%9C%9F%E4%BD%90/::ref/tosa_icon.png.webp?rev=2ca015e9155f1c67a7c6277651542242&t=20230416151600",
    "sanuki": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E8%AE%83%E5%B2%90/::ref/sanuki_icon.png.webp?rev=dfd968153fda2902e0c88a7726d29657&t=20221118004211",
    "echigo": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E8%B6%8A%E5%BE%8C/::ref/echigo_icon.png.webp?rev=10051c7cf5855097d21d8bc7f8e1bb57&t=20221118020432",
    "wakasa": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E8%8B%A5%E7%8B%AD/::ref/wakasa_icon.png.webp?rev=c2c9dc861115a66e065336e19ea34614&t=20221117124133",
    "chikugo": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%AD%91%E5%BE%8C/::ref/chikugo_icon.png.webp?rev=d6860db4c9f193a6f617f0ac0246f00c&t=20230326101631",
    "zashikiwarashi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%BA%A7%E6%95%B7%E3%82%8F%E3%82%89%E3%81%97/::ref/zashikiwarashi_icon.png.webp?rev=17f6d8e74e1db6f5cb4b1e76d2507d6f&t=20230108182346",
    "yakou-san": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E5%A4%9C%E8%A1%8C%E3%81%95%E3%82%93/::ref/yagyo-san_icon.png.webp?rev=af610b795f31c51c7be377c6f6b9218f&t=20230624225344",
    "nue": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E9%B5%BA/::ref/nue_icon.png.webp?rev=f5857021b687f3ea39191b904ad6bad9&t=20230730214335",
    "kasha": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%81%AB%E8%BB%8A/::ref/kasya_icon.png.webp?rev=7da545e5b87d868b410cf723454907ab&t=20231030072233",
    "shippeitaro": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%82%89%E5%B9%B3%E5%A4%AA%E9%83%8E/::ref/shippeitarou_icon.png.webp?rev=4ea35b7d5deacb0ec670d718e4bf898e&t=20240217225032",
    "akaname": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%81%82%E3%81%8B%E3%81%AA%E3%82%81/::ref/akaname_icon.png.webp?rev=dfbc16f410c2bda31a0a2b7262099e73&t=20240807015817",
    "aoandon": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E9%9D%92%E8%A1%8C%E7%87%88/::ref/aoandon_icon.png.webp?rev=104460b6ea7cec1f1ab0b2d1933740f0&t=20241126012836",
    "namomihagi": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%83%8A%E3%83%A2%E3%83%9F%E3%83%8F%E3%82%AE/::ref/namomihagi_icon.png.webp?rev=5908acc95463436c2d664ce1359ea294&t=20250723072004",
    "shirafu": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%99%BD%E5%B8%83/::ref/shironuno_icon.png.webp?rev=37d27c2e891cbbdb5301d4ae2ed4de98&t=20251001022815",
    "karasutengu": "https://cdn.wikiwiki.jp/to/w/tamacolle/%E7%83%8F%E5%A4%A9%E7%8B%97/::ref/karasutengu_icon.png.webp?rev=d49d1da28b03da8d6bc89441616470a7&t=20260710145152",
}
for k, v in ICONS.items():
    ITEMS.append((f"images/chars/{k}_icon.jpg", v))

os.chdir(os.path.join(os.path.dirname(__file__), ".."))
root = os.getcwd()

ok, fail = 0, []
for rel, url in ITEMS:
    dest = os.path.join("public", rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        ok += 1
        continue
    full = BASE.format(urllib.parse.quote(url, safe=""))
    try:
        req = urllib.request.Request(full, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=60).read()
        if len(data) < 200:
            raise RuntimeError("too small %d" % len(data))
        with open(dest, "wb") as f:
            f.write(data)
        ok += 1
        print("OK ", rel, len(data))
    except Exception as e:
        fail.append((rel, str(e)[:80]))
        print("FAIL", rel, str(e)[:80])
    time.sleep(0.25)

print(f"\nDone. ok={ok} fail={len(fail)}")
for r, e in fail:
    print("  -", r, e)
