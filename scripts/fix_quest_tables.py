#!/usr/bin/env python3
"""修复自由任务页的 D6 表格（表头列数不足导致单元格被 GFM 截断）。

原 wiki 的任务页用两种嵌套表：

1. **任务情报表**（宽 5）
   1 列标题 + 若干「标签行 / 数值行」成对出现，每对的列数各不相同。
   处理：把每行的单元格在 5 列里均匀分配，多出的宽度用 [<] 向左合并。
   同列数的行会得到相同的分配，因此上下自然对齐。

2. **战斗表**（宽 3）
   `| 前列 | 后列 | 评价S经验值/报酬 |`
   第三列只在部分行有值，其余行留空 —— 原页是纵向合并。
   处理：3 格行原样保留；2 格行补 [^] 与上一行合并第三列。

只做结构转换，**不改动任何单元格的文字内容**。
"""
import re
import sys


def split_row(line):
    return line.strip().strip('|').split('|')


def build(cells):
    return '|' + '|'.join(cells) + '|'


def distribute(n, width):
    """把 width 列均分给 n 个单元格，靠前的多占。返回每格的跨度列表。"""
    base, extra = divmod(width, n)
    return [base + (1 if i < extra else 0) for i in range(n)]


def expand(cells, width):
    """按跨度展开成 width 列，跨度 >1 的用 [<] 补位。"""
    out = []
    for cell, span in zip(cells, distribute(len(cells), width)):
        out.append(cell)
        out.extend([' [<] '] * (span - 1))
    return out


def is_sep(cells):
    return all(re.fullmatch(r'[\s:-]*', c) for c in cells)


def fix_battle(rows, width=3):
    """战斗表：2 格数据行补 [^] 合并第三列。"""
    out = []
    for idx, r in enumerate(rows):
        cells = split_row(r)
        if is_sep(cells):
            out.append(build([' :-: '] * width))
            continue
        n = len(cells)
        if idx == 0 and n == 1:              # 标题行横跨整表
            out.append(build(expand(cells, width)))
        elif n == width:
            out.append(build(cells))
        elif n == width - 1:                 # 缺第三列 → 与上一行合并
            out.append(build(cells + [' [^] ']))
        else:
            out.append(build(expand(cells, width)))
    return out


def fix_generic(rows, width):
    out = []
    for r in rows:
        cells = split_row(r)
        if is_sep(cells):
            out.append(build([' :-- '] * width))
        else:
            out.append(build(expand(cells, width)))
    return out


def process(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    out, i, fixed = [], 0, 0
    while i < len(lines):
        if not lines[i].strip().startswith('|'):
            out.append(lines[i]); i += 1; continue
        tbl = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            tbl.append(lines[i]); i += 1
        widths = [len(split_row(r)) for r in tbl]
        width = max(widths)
        if widths[0] >= width:               # 表头够宽，无需处理
            out.extend(tbl); continue
        # 有分隔行则插在标题后，否则补一行
        has_sep = any(is_sep(split_row(r)) for r in tbl)
        body = fix_battle(tbl, width) if width == 3 else fix_generic(tbl, width)
        if not has_sep:
            marker = ' :-: ' if width == 3 else ' :-- '
            body.insert(1, build([marker] * width))
        out.extend(body); fixed += 1
    open(path, 'w', encoding='utf-8').write('\n'.join(out))
    return fixed


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f'{p}: 修复 {process(p)} 张表')
