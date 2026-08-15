#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
按站点实际用字，把完整 TTF 裁剪成子集并生成内嵌 woff2 的 @font-face CSS。

背景
----
Webfont Bundler（GNOME）默认开启 Subsetting 且只保留 Latin，
把 Shippori Mincho 的 13591 个汉字 + 186 个假名全裁掉了，
生成的 CSS 里只剩 191 个拉丁字形 —— 日文只能 fallback 到 Google Fonts CDN。

本脚本改为「按需子集」：扫描仓库里所有会显示到页面上的文本
（角色 JSON / 内容 md / 组件里的中日文），只保留真正用到的字形。

用法
----
    pip install fonttools brotli
    python3 scripts/build_font_subset.py /path/to/Shippori_Mincho

    # 只处理指定字重
    python3 scripts/build_font_subset.py /path/to/fonts --weights 400,600,700

输出
----
    src/styles/shippori-mincho.css   （内嵌 base64 woff2）
"""

from __future__ import annotations

import argparse
import base64
import glob
import io
import os
import sys

# ---------------------------------------------------------------- 字符收集

# static 文件名 -> CSS font-weight
WEIGHT_MAP = {
    "Regular": 400,
    "Medium": 500,
    "SemiBold": 600,
    "Bold": 700,
    "ExtraBold": 800,
}

# 一定要保留的基础字符（UI 上可能动态出现，扫不到）
ALWAYS = (
    "0123456789"
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    "　、。，．・：；？！＂＇（）［］｛｝〈〉《》「」『』【】〔〕"
    "…—～〜ー－＋×÷＝≠≦≧％‰°′″℃№"
    "▲△▼▽◆◇○●◎□■☆★♪♫←↑→↓⇒⇔"
    "①②③④⑤⑥⑦⑧⑨⑩"
    "　"
)


def collect_chars(root: str) -> set[str]:
    """扫描仓库里所有会渲染到页面的文本。"""
    chars: set[str] = set(ALWAYS)
    patterns = [
        "src/data/pages/*.json",
        "src/data/*.ts",
        "src/content/*.md",
        "src/**/*.vue",
        "src/**/*.ts",
        "index.html",
        "README.md",
    ]
    seen = 0
    for pat in patterns:
        for path in glob.glob(os.path.join(root, pat), recursive=True):
            try:
                with open(path, encoding="utf-8") as fh:
                    chars |= set(fh.read())
                seen += 1
            except (UnicodeDecodeError, OSError):
                continue
    print(f"  扫描 {seen} 个文件", file=sys.stderr)
    # 去掉控制字符
    return {c for c in chars if ord(c) >= 0x20 or c in "\n\t"}


# ---------------------------------------------------------------- 子集化


def subset_font(ttf_path: str, text: str) -> bytes:
    """裁剪字体并输出 woff2 字节。"""
    from fontTools import subset
    from fontTools.ttLib import TTFont

    font = TTFont(ttf_path)

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.with_zopfli = True
    opts.desubroutinize = True
    # 保留排版必需的表；layout_features='*' 保证连字/替换等不丢
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.drop_tables += ["DSIG"]

    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(text=text)
    subsetter.subset(font)

    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    font.close()
    return buf.getvalue()


def build_css(family: str, faces: list[tuple[int, bytes]]) -> str:
    """生成内嵌 base64 的 @font-face CSS。"""
    out = [
        "/*",
        f" * {family} —— 按站点实际用字裁剪的子集（含日文假名与汉字）",
        " *",
        " * 由 scripts/build_font_subset.py 生成，请勿手改。",
        " * 若新增了含生僻字的内容，重新跑一次脚本即可。",
        " */",
        "",
    ]
    for weight, data in faces:
        b64 = base64.b64encode(data).decode("ascii")
        out.append("@font-face {")
        out.append(f"  font-family: '{family}';")
        out.append("  font-style: normal;")
        out.append(f"  font-weight: {weight};")
        out.append("  font-display: swap;")
        out.append(f"  src: url(data:font/woff2;charset=utf-8;base64,{b64}) format('woff2');")
        out.append("}")
        out.append("")
    return "\n".join(out)


# ---------------------------------------------------------------- main


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("font_dir", help="放 ShipporiMincho-*.ttf 的目录")
    ap.add_argument("--family", default="Shippori Mincho")
    ap.add_argument("--prefix", default="ShipporiMincho")
    ap.add_argument("--weights", default="400,500,600,700",
                    help="要生成的字重，逗号分隔（默认 400,500,600,700）")
    ap.add_argument("--out", default="src/styles/shippori-mincho.css")
    ap.add_argument("--repo", default=".", help="仓库根目录（用于扫描用字）")
    args = ap.parse_args()

    want = {int(w) for w in args.weights.split(",") if w.strip()}

    print("扫描站点用字…", file=sys.stderr)
    chars = collect_chars(args.repo)
    text = "".join(sorted(chars))

    def cnt(lo, hi):
        return sum(1 for c in chars if lo <= ord(c) <= hi)

    print(f"  去重后 {len(chars)} 个字符："
          f"平假名 {cnt(0x3040, 0x309F)} / 片假名 {cnt(0x30A0, 0x30FF)} / "
          f"汉字 {cnt(0x4E00, 0x9FFF)} / 拉丁 {cnt(0x20, 0xFF)}",
          file=sys.stderr)

    faces: list[tuple[int, bytes]] = []
    for name, weight in sorted(WEIGHT_MAP.items(), key=lambda kv: kv[1]):
        if weight not in want:
            continue
        path = os.path.join(args.font_dir, f"{args.prefix}-{name}.ttf")
        if not os.path.exists(path):
            print(f"  跳过 {name}（找不到 {path}）", file=sys.stderr)
            continue
        src_size = os.path.getsize(path)
        data = subset_font(path, text)
        faces.append((weight, data))
        print(f"  {name:10} w{weight}  {src_size/1024/1024:6.2f} MB "
              f"→ {len(data)/1024:7.1f} KB woff2", file=sys.stderr)

    if not faces:
        print("没有生成任何字重，请检查 --font-dir 与 --weights", file=sys.stderr)
        return 1

    css = build_css(args.family, faces)
    out_path = os.path.join(args.repo, args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(css)

    print(f"\n已写入 {out_path}  ({len(css.encode())/1024/1024:.2f} MB)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
