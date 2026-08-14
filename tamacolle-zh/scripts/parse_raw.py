#!/usr/bin/env python3
"""解析 raw/*.html（wikiwiki 角色页快照）→ raw_data/*.json（结构化原始数据）"""
import os, re, json
from bs4 import BeautifulSoup

RAW = os.path.join(os.path.dirname(__file__), "..", "raw")
OUT = os.path.join(os.path.dirname(__file__), "..", "raw_data")
os.makedirs(OUT, exist_ok=True)

STAT_KEYS = {'HP', '攻撃値', '力', '魂圧値', '技', '命中', '豊満', '速さ'}
KV_KEYS = {'武器種', '所属', '国力', 'ハレの日', '実装', '得意地形', '抜魂技名', '効果', '抜魂の速さ', '分類', '追加効果'}

def unwrap(url):
    if "/web/" in url and "wikiwiki" in url:
        m = re.search(r'(https?://(?:cdn\.)?wikiwiki\.jp.*)', url)
        if m: return m.group(1)
    return url

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def table_rows(t):
    rows = []
    for tr in t.find_all('tr'):
        cells = [clean(c.get_text(' ', strip=True)) for c in tr.find_all(['th', 'td'])]
        if any(cells):
            rows.append(cells)
    return rows

def parse_char(raw):
    soup = BeautifulSoup(raw, 'lxml')
    body = soup.find('div', id='body')
    if not body: return None
    h1 = body.find('h1')
    out = {
        'name': clean(h1.get_text()) if h1 else '',
        'kana': '', 'num': '', 'status': {}, 'kv': {},
        'portrait': '', 'desc': '', 'artist': '', 'voice': '',
        'illusts': [], 'illust_notes': [], 'tactics': [], 'tactics_head': [],
        'bond': {}, 'motif': '', 'trivia': '', 'voice_text': '',
    }
    tables = body.find_all('table')

    # ===== 状态表（第一个 table）=====
    if tables:
        t = tables[0]
        rows = t.find_all('tr')
        out['num'] = clean(rows[0].get_text()) if (rows and clean(rows[0].get_text()).endswith('番')) else ''
        # 头像
        img = t.find('img')
        if img: out['portrait'] = unwrap(img.get('src', ''))
        pending = None
        for tr in rows:
            texts = [clean(c.get_text(' ', strip=True)) for c in tr.find_all(['th', 'td'])]
            joined = ' '.join(texts)
            # ruby 名字
            ruby = tr.find('ruby')
            if ruby:
                rt = ruby.find('rt')
                main_node = ruby.find(string=True, recursive=False) or next(ruby.strings, '')
                if not out['kana']:
                    out['name'] = clean(main_node)
                    out['kana'] = clean(rt.get_text()) if rt else ''
            # 跨行捕获（資料室説明 等）
            if pending and joined:
                out[pending] = joined
                pending = None
            label = texts[0] if texts else ''
            if label == '資料室説明':
                pending = 'desc'
            # 键值对
            for j in range(0, len(texts) - 1, 2):
                if texts[j] in STAT_KEYS:
                    out['status'][texts[j]] = texts[j + 1]
                elif texts[j] in KV_KEYS:
                    out['kv'][texts[j]] = texts[j + 1]
            # 絵・声
            if '絵' in joined and ('声' in joined):
                m = re.search(r'絵[：:]\s*(\S+)', joined)
                if m: out['artist'] = m.group(1)
                m = re.search(r'声[：:]\s*(\S+)', joined)
                if m: out['voice'] = m.group(1)

    # ===== 立绘表（第二个 table）=====
    if len(tables) >= 2:
        pt = tables[1]
        last_label = ''
        for tr in pt.find_all('tr'):
            cells = tr.find_all(['th', 'td'])
            if not cells: continue
            label = clean(cells[0].get_text())
            if label in ('解説文', '解説'):
                txt = clean(tr.get_text(' ', strip=True))
                txt = re.sub(r'^解説文?\s*', '', txt)
                if txt:
                    out['illust_notes'].append({'label': last_label, 'note': txt})
                continue
            if label:
                last_label = label
            for c in cells[1:]:
                im = c.find('img')
                if im and im.get('src'):
                    src = unwrap(im.get('src'))
                    if 'wikiwiki' in src:
                        out['illusts'].append({'label': last_label, 'img': src, 'alt': im.get('alt', '')})

    # ===== 章节文本 =====
    sec_text = {}
    for h in body.find_all(['h3', 'h4']):
        title = clean(h.get_text())
        # 收集到下一个同/上级标题为止
        nodes = []
        nxt = h.find_next_sibling()
        while nxt and nxt.name not in ('h3', 'h2'):
            nodes.append(nxt)
            nxt = nxt.find_next_sibling()
        sec_text[title] = nodes

    # 戦法
    for title, nodes in sec_text.items():
        if title == '戦法':
            for n in nodes:
                for t in n.find_all('table'):
                    rows = table_rows(t)
                    if rows and any('戦法' in c for c in rows[0]):
                        out['tactics_head'] = rows[0]
                for r in rows:
                    if r and r[0] not in ('アイコン', '戦法') and any('攻' in c or '狙' in c or '狙う' in c for c in r):
                        out['tactics'].append(r)

    # 絆
    for title, nodes in sec_text.items():
        if title in ('信頼・一', '信頼・特'):
            tbls = []
            text_parts = []
            for n in nodes:
                ts = n.find_all('table')
                if ts:
                    for t in ts:
                        tbls.append(table_rows(t))
                else:
                    txt = n.get_text('\n', strip=True)
                    if txt: text_parts.append(txt)
            if tbls:
                out['bond'][title] = tbls
            elif text_parts:
                out['bond'][title] = '\n'.join(text_parts)

    # 元ネタ / 小ネタ
    for title, nodes in sec_text.items():
        txt = '\n'.join(n.get_text('\n', strip=True) for n in nodes if n.get_text(strip=True))
        if title == '元ネタ・モチーフ': out['motif'] = txt
        elif title == '小ネタ': out['trivia'] = txt
        elif title == '声':
            out['voice_text'] = txt

    return out

results = {}
for fn in sorted(os.listdir(RAW)):
    if not fn.endswith('.html'): continue
    slug = fn[:-5]
    try:
        raw = open(os.path.join(RAW, fn), encoding='utf-8', errors='replace').read()
        d = parse_char(raw)
        if not d:
            print('SKIP', slug); continue
        d['slug'] = slug
        results[slug] = d
        open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8').write(
            json.dumps(d, ensure_ascii=False, indent=1))
        print('OK  ', slug, '| name=', d['name'], d['kana'], '| num=', d.get('num'),
              '| kv=', len(d['kv']), '| status=', len(d['status']), '| illusts=', len(d['illusts']),
              '| notes=', len(d['illust_notes']), '| tactics=', len(d['tactics']),
              '| bond=', {k: len(v) for k, v in d['bond'].items()},
              '| desc=', len(d['desc']), '| motif=', len(d['motif']), '| trivia=', len(d['trivia']))
    except Exception as e:
        print('ERR ', slug, str(e)[:90])
print('\ntotal:', len(results))
