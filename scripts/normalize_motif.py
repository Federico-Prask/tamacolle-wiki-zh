#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
规范化 motifZh / triviaZh 的小标题写法。

原状：小标题写成独占一行的 **粗体**，
      而这些文本又被 Vue 用 {{ }} 当纯文本插值输出，
      所以页面上直接显示出了字面的星号。

现在：正文改走 Markdown 渲染器，并把「独占一行的 **粗体**」
      提升为 `### 三级标题`（段落标题 h2 之下的一级）。

用法： python3 scripts/normalize_motif.py [--dry-run]
"""

from __future__ import annotations

import glob
import json
import re
import sys

FIELDS = ("motifZh", "triviaZh", "descZh")

# 整行只有一段粗体（允许行尾标点残留在粗体内）
BOLD_LINE = re.compile(r"^\s*\*\*(?P<t>[^*\n]+?)\*\*\s*[:：]?\s*$")


def normalize(text: str) -> str:
    if not text:
        return text
    out: list[str] = []
    lines = text.split("\n")
    for i, line in enumerate(lines):
        m = BOLD_LINE.match(line)
        if m:
            title = m.group("t").strip()
            # 标题前保证有空行，让 Markdown 正确断块
            if out and out[-1].strip():
                out.append("")
            out.append(f"### {title}")
            continue
        out.append(line)
    # 折叠 3 个以上连续空行
    res = "\n".join(out)
    res = re.sub(r"\n{3,}", "\n\n", res)
    return res.strip()


def main() -> int:
    dry = "--dry-run" in sys.argv
    changed = 0
    hits = 0
    for path in sorted(glob.glob("src/data/pages/*.json")):
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        char = data.get("char")
        if not isinstance(char, dict):
            continue
        dirty = False
        for f in FIELDS:
            v = char.get(f)
            if not isinstance(v, str) or not v:
                continue
            nv = normalize(v)
            if nv != v:
                char[f] = nv
                dirty = True
                hits += nv.count("### ")
        if dirty:
            changed += 1
            if not dry:
                with open(path, "w", encoding="utf-8") as fh:
                    json.dump(data, fh, ensure_ascii=False, indent=2)
                    fh.write("\n")
    print(f"{'[dry-run] ' if dry else ''}normalized {changed} files, {hits} headings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
