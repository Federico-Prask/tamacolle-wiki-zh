#!/usr/bin/env python3
"""下载战斗地图/界面截图（经 weserv 代理）到 public/images/"""
import urllib.request, urllib.parse, os, time

def dl(rel, url, w=160):
    dest = os.path.join('public', rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        print('skip', rel); return
    full = f"https://images.weserv.nl/?url={urllib.parse.quote(url, safe='')}&output=jpg&w={w}"
    try:
        req = urllib.request.Request(full, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=60).read()
        if len(data) < 200: raise RuntimeError('small')
        open(dest, 'wb').write(data)
        print('OK  ', rel, len(data))
    except Exception as e:
        print('FAIL', rel, str(e)[:60])
    time.sleep(0.2)

Q = 'https://cdn.wikiwiki.jp/to/w/tamacolle/%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/'
B = 'https://cdn.wikiwiki.jp/to/w/tamacolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/::ref/'

# 地图格图标（小）
dl('images/quest/start.jpg',      Q + 'start.png.webp?rev=2d120d07c32420a05428c014772a71a4&t=20221124072339', 120)
dl('images/quest/battle.jpg',     Q + 'battle.png?rev=ce0d0f715ded699cfe1bfa0a50c6751d&t=20221124072354', 120)
dl('images/quest/event.jpg',      Q + 'event.png.webp?rev=537c6a247b40e1cf3520358344a628a4&t=20221124072407', 120)
dl('images/quest/treasure.jpg',   Q + 'treasure.png.webp?rev=9aeb5ac3b98c0ec506c122078a19e8e1&t=20221124072424', 120)
dl('images/quest/accident.jpg',   Q + 'accident.png?rev=11e89201e36c94bce82c26cb9c5f7421&t=20221124072437', 120)
dl('images/quest/boss.jpg',       Q + 'boss.png?rev=63a094498c46ced797a0d0255b1bcd37&t=20221124072449', 120)
# 编成画面
dl('images/quest/hensei1.jpg',    Q + 'hensei1.jpg.webp?rev=475e6c7e1e8f3626192f8d42496b953a&t=20250627095926', 460)
dl('images/quest/hensei2.jpg',    Q + 'hensei2.jpg.webp?rev=16931ee8e74284bc6d3423671878cf6f&t=20250627100511', 460)
# 战斗界面
dl('images/battle/char-status.jpg',  B + 'battle_character2.png.webp?rev=e8b3d12e1170e6d58266b5a85de68441&t=20230103170839', 300)
dl('images/battle/element_01.jpg',   B + 'element_01.jpg?rev=d79c59de4e5115bbba3572484cfcbc94&t=20250710092418', 360)
dl('images/battle/element_02.jpg',   B + 'element_02.jpg?rev=7df990d015a4ff77970a5a13e7851e03&t=20250710092440', 360)
dl('images/battle/element_03.jpg',   B + 'element_03.jpg?rev=04a83028bce8a8a2ab3123b5a34e7cb7&t=20250710092502', 360)
print('done')
