#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把扁平的语音纯文本还原成带合并单元格的表格 Markdown。

原始文本（原 wiki 复制出来的样子）形如：
    语音一览
    普通
    标题
    魂これ
    触摸
    通常
    セリフ1
    セリフ2
    股间
    セリフ3
    ...
层级信息全丢了（这正是「看不懂格式」的原因）。
本脚本用原 wiki 的固定分类 schema 恢复层级，输出四列表格：

    | 分类 | 场景 | 子场景 | 台词 |
    | 普通 | 标题 | [<]  | 魂これ |
    | [^]  | 触摸 | 通常 | セリフ1 |
    | [^]  | [^]  | 股间 | セリフ3 |

其中 [^] = 与上一格合并、[<] = 与左一格合并
（由前端自定义表格语法解析成 rowspan / colspan）。

历史：71 个角色页的 char.voiceText 已由本脚本一次性转换为 char.voiceMd，
      并随后删除了冗余的 voiceText 字段（原始数据可在 git 历史中找回）。
      现在本脚本作为「新增角色 / 修正语音」时的转换工具保留。

用法：
    # 从文件转换
    python3 scripts/build_voice_tables.py voice.txt

    # 从剪贴板/管道转换
    pbpaste | python3 scripts/build_voice_tables.py

    # 直接写入某个角色页的 char.voiceMd
    python3 scripts/build_voice_tables.py voice.txt --into src/data/pages/bizen.json
"""

from __future__ import annotations

import glob
import json
import re
import sys

# ---------------------------------------------------------------- schema

# 原 wiki 语音表的固定层级。key = 大分类，value = 该分类下的场景。
# 场景写成 dict 表示它自身还有子场景。
SCHEMA: dict[str, list] = {
    "普通": [
        "标题",
        "开始",
        {"触摸": ["通常", "股间", "晴服", "泳装"]},
        "负伤",
        "晴服",
        "泳装",
        "圣诞",
        "放置",
        {"庄园": ["通常", "走光", "晴服", "泳装", "入浴", "沐浴"]},
        "购买",
        "资料室",
        "成就",
        "任务(了)",
        "曜日任务",
        "声闻",
        "再声闻",
        "羁绊",
        "界限突破",
    ],
    "个人房间": ["入室", "通常", "股间", "晴服", "泳装"],
    "战斗": [
        "编成",
        "大魂守",
        "神妖连结",
        "任务开始",
        "分岐",
        "发现宝藏",
        "意外",
        "战斗开始",
        "普通攻击",
        {"拔魂技前": ["通常", "反击", "追击", "剩敌一人", "味方负伤"]},
        "拔魂技",
        {"中弹": ["通常", "负伤(服破損)"]},
        "净化",
        "MVP",
        "鎮魂",
    ],
}

TOP_LEVELS = list(SCHEMA.keys())

# 场景 → 它所属的大分类；子场景 → 它所属的场景
SCENE_PARENT: dict[str, str] = {}
SUBSCENE_PARENT: dict[str, list[str]] = {}
GROUP_SCENES: set[str] = set()

for _top, _items in SCHEMA.items():
    for _it in _items:
        if isinstance(_it, dict):
            (_scene, _subs), = _it.items()
            SCENE_PARENT[_scene] = _top
            GROUP_SCENES.add(_scene)
            for _sub in _subs:
                SUBSCENE_PARENT.setdefault(_sub, []).append(_scene)
        else:
            SCENE_PARENT.setdefault(_it, _top)

KANA = re.compile(r"[\u3040-\u309f\u30a0-\u30ff]")

# 已知标签全集（用于判断一行是标签还是台词）
KNOWN_LABELS: set[str] = set(TOP_LEVELS) | set(SCENE_PARENT) | set(SUBSCENE_PARENT)

# 数据里出现过、但不在标准 schema 中的额外标签（角色专属场景）
EXTRA_LABELS = {
    "圣诞",
    "净化",
    "曜日任务",
    "主",
    "阿呆",
    "教師",
    "咖啡店员",
    "手術",
    "舁",
    "入眠後",
}
KNOWN_LABELS |= EXTRA_LABELS


def is_label(line: str) -> bool:
    """标签行：在已知标签表内，且不含假名（台词几乎必然含假名）。"""
    s = line.strip()
    if s in KNOWN_LABELS:
        return True
    return False


# ---------------------------------------------------------------- parse


class Row:
    __slots__ = ("top", "scene", "sub", "text")

    def __init__(self, top: str, scene: str, sub: str, text: str):
        self.top = top
        self.scene = scene
        self.sub = sub
        self.text = text


def parse_voice(text: str) -> list[Row]:
    """把扁平文本解析成 (大分类, 场景, 子场景, 台词) 行列表。"""
    lines = [l.strip() for l in (text or "").split("\n")]
    lines = [l for l in lines if l]
    if lines and lines[0] in ("语音一览", "ボイス一覧"):
        lines = lines[1:]

    rows: list[Row] = []
    cur_top = ""
    cur_scene = ""
    cur_sub = ""
    # 台词缓冲：同一场景下连续多行台词合并成一格（原 wiki 里是一格内多行）
    buf: list[str] = []

    def flush() -> None:
        nonlocal buf
        if not buf:
            return
        rows.append(Row(cur_top, cur_scene, cur_sub, "\n".join(buf)))
        buf = []

    for line in lines:
        if not is_label(line):
            buf.append(line)
            continue

        # 标签行 → 结算上一格
        flush()

        if line in SCHEMA:
            cur_top, cur_scene, cur_sub = line, "", ""
            continue

        # 子场景？只有当它属于当前已打开的场景时才算子场景
        parents = SUBSCENE_PARENT.get(line, [])
        if cur_scene in parents:
            cur_sub = line
            continue

        # 场景
        if line in SCENE_PARENT:
            top = SCENE_PARENT[line]
            # 场景名能反推大分类，顺手纠正（防止上游漏了大分类行）
            if top in SCHEMA and cur_top != top:
                # 只有当前分类里确实没有这个场景时才切换
                if line not in [
                    s if isinstance(s, str) else list(s)[0]
                    for s in SCHEMA.get(cur_top, [])
                ]:
                    cur_top = top
            cur_scene = line
            cur_sub = ""
            continue

        # schema 外的角色专属标签：当作当前分类下的场景
        cur_scene = line
        cur_sub = ""

    flush()
    return rows


# ---------------------------------------------------------------- emit


def esc(s: str) -> str:
    """表格单元格内转义：| 需转义，换行用 <br> 表示。"""
    s = s.replace("\\", "\\\\").replace("|", "\\|")
    return s.replace("\n", "<br>")


def to_markdown(rows: list[Row]) -> str:
    """输出带 [^] 向上合并标记的三列表格。"""
    if not rows:
        return ""

    has_sub = any(r.sub for r in rows)
    out: list[str] = []
    if has_sub:
        out.append("| 分类 | 场景 | 子场景 | 台词 |")
        out.append("| :-- | :-- | :-- | :-- |")
    else:
        out.append("| 分类 | 场景 | 台词 |")
        out.append("| :-- | :-- | :-- |")

    prev_top = prev_scene = prev_sub = None
    for r in rows:
        top = "[^]" if r.top == prev_top else (r.top or "—")
        # 场景变了就必须重新写，即使文字与上一行相同
        if r.scene == prev_scene and top == "[^]":
            scene = "[^]"
        else:
            scene = r.scene or "—"
        if has_sub:
            if not r.sub:
                # 该场景没有子场景：让「场景」横跨到子场景列（[<] = 并入左格），
                # 避免整列都是 — 占位、白白吃掉宽度
                sub = "[<]"
            elif r.sub == prev_sub and scene == "[^]":
                sub = "[^]"
            else:
                sub = r.sub
            out.append(f"| {top} | {scene} | {sub} | {esc(r.text)} |")
        else:
            out.append(f"| {top} | {scene} | {esc(r.text)} |")

        prev_top, prev_scene, prev_sub = r.top, r.scene, r.sub

    return "\n".join(out)


# ---------------------------------------------------------------- main


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    into = None
    if "--into" in sys.argv:
        i = sys.argv.index("--into")
        if i + 1 < len(sys.argv):
            into = sys.argv[i + 1]
            args = [a for a in args if a != into]

    # 读取输入：位置参数当文件名，否则读 stdin
    if args:
        with open(args[0], encoding="utf-8") as fh:
            text = fh.read()
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
    else:
        print(__doc__)
        return 1

    rows = parse_voice(text)
    if not rows:
        print("没有解析到任何台词，请检查输入格式。", file=sys.stderr)
        return 1
    md = to_markdown(rows)

    if into:
        with open(into, encoding="utf-8") as fh:
            data = json.load(fh)
        char = data.get("char")
        if not isinstance(char, dict):
            print(f"{into} 不是角色页（缺少 char 字段）", file=sys.stderr)
            return 1
        char["voiceMd"] = md
        with open(into, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"已写入 {into} 的 char.voiceMd（{len(rows)} 行台词）", file=sys.stderr)
    else:
        print(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
