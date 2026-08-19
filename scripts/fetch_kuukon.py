#!/usr/bin/env python3
"""下载「喰魂集」（噬魂集）的全部图片到 public/images/kuu/。

原 wiki 的 小ネタ/喰魂集 按「型」分成 10 个小节，每节包含：
  - 战斗图标（{type}_{色}_i.png，小图，多个颜色变体）
  - 立ち絵（{type}_{色}.jpg，大图）

本站早期抓取时把文件名压成了无意义的 kuu_0..67，**分类信息全部丢失**，
页面变成 68 张无名图平铺。本脚本按原文件名重抓以还原结构。

色码后缀：t=通常? k=黄 y=? o=? b=蓝 c=? j=? i=? —— 原 wiki 未说明含义，
故本站只按「变体 1/2/3…」编号展示，不臆造名称。

CDN 直连 403，走 images.weserv.nl 代理。
"""
import json
import os
import subprocess
import sys
from urllib.parse import quote

OUT = 'public/images/kuu'
PAGE = '小ネタ/喰魂集'
PROXY = 'https://images.weserv.nl/?url={}&output={}'

# 各型的图标变体与立绘，逐节誊自原页
SECTIONS = [
    # (锚点, 日文名, 中文名, [图标...], [立绘...], 备注)
    ('ball', 'ボール型', '球型',
     ['ball_k_i', 'ball_b_i'], ['ball_k', 'ball_b'], ''),
    ('slime', 'スライム型', '史莱姆型',
     ['slime_t_i', 'slime_k_i', 'slime_y_i', 'slime_o_i', 'slime_b_i', 'slime_c_i', 'slime_j_i'],
     ['slime'], '※ 立绘全种共通。※ 活动周回的派生型也相同。'),
    ('mara', 'マーラ様型', '摩罗神型',
     ['mara_t_i', 'mara_k_i', 'mara_y_i', 'mara_o_i', 'mara_b_i', 'mara_c_i', 'mara_j_i'],
     ['mara'], '※ 立绘全种共通。'),
    ('kemono', 'ケモノ型', '兽型',
     ['kemono_t_i', 'kemono_k_i', 'kemono_y_i', 'kemono_o_i', 'kemono_b_i', 'kemono_c_i', 'kemono_j_i',
      'kemono_t2_i', 'kemono_k2_i', 'kemono_y2_i', 'kemono_o2_i', 'kemono_b2_i', 'kemono_c2_i', 'kemono_j2_i'],
     ['kemono_t', 'kemono_k', 'kemono_y', 'kemono_o', 'kemono_b', 'kemono_c', 'kemono_j',
      'kemono_t2', 'kemono_k2', 'kemono_y2', 'kemono_o2', 'kemono_b2', 'kemono_c2', 'kemono_j2'], ''),
    ('beast', 'ドウブツ型', '动物型',
     ['beast_i_i', 'beast_k_i', 'beast_y_i'], ['beast_i', 'beast_k'],
     '※ 第三种（beast_y）的立绘原 wiki 尚未上传。'),
    ('human', 'ヒト型', '人型',
     ['human_t_i', 'human_y_i'], ['human_t', 'human_y'], ''),
    ('ghost', 'ユウレイ型', '幽灵型',
     ['ghost_k_i', 'ghost_j_i'], ['ghost_k', 'ghost_j'], ''),
    ('element', 'ゲンショウ型', '现象型',
     ['fire_i'], ['fire'], ''),
    ('union', 'ガッタイ型', '合体型',
     [], [], '※ 原 wiki 此节的图标与立绘均为未上传的添付占位，暂无图片。'),
]
LIMITED = [
    ('sumou', 'リキシ型', '力士型', ['sumou_b'], ['sumou_b01', 'sumou_b2'], ''),
]
OTHER = [
    ('local', '現地人', '现地人', ['onitokage'], ['onitokage_b1'], ''),
]


def fetch(name, ext):
    dest = f'{OUT}/{name}.{ext}'
    if os.path.exists(dest):
        return True
    raw = f'cdn.wikiwiki.jp/to/w/tamacolle/{quote(PAGE)}/::ref/{name}.{ext}'
    r = subprocess.run(['curl', '-sf', '-o', dest, PROXY.format(raw, ext)],
                       capture_output=True)
    if r.returncode != 0 or not os.path.exists(dest) or os.path.getsize(dest) < 500:
        if os.path.exists(dest):
            os.remove(dest)
        return False
    return True


def main():
    os.makedirs(OUT, exist_ok=True)
    ok, bad = [], []
    for group in (SECTIONS, LIMITED, OTHER):
        for _, _, _, icons, stands, _ in group:
            for n in icons:
                (ok if fetch(n, 'png') else bad).append(n + '.png')
            for n in stands:
                (ok if fetch(n, 'jpg') else bad).append(n + '.jpg')
    print(f'成功 {len(ok)}，失败 {len(bad)}')
    if bad:
        print('失败：', bad)
    return 0


if __name__ == '__main__':
    sys.exit(main())
