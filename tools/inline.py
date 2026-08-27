#!/usr/bin/env python3
"""内联打包: 把 index.html 的本地 css/js 资源内联为单文件 HTML"""
import argparse, re, sys
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('template')
    ap.add_argument('output')
    ap.add_argument('--css', action='append', default=[])
    ap.add_argument('--js', action='append', default=[])
    a = ap.parse_args()

    root = Path(a.template).parent
    html = Path(a.template).read_text(encoding='utf-8')

    # 内联 CSS: <link rel="stylesheet" href="css/style.css"> -> <style>...</style>
    for css_path in a.css:
        css = Path(css_path).read_text(encoding='utf-8')
        href = str(Path(css_path).relative_to(root)).replace('\\', '/')
        # 匹配该 css 的 link 标签 (保留其它 CDN link)
        pat = re.compile(r'<link[^>]+href="' + re.escape(href) + r'"[^>]*>\s*')
        assert pat.search(html), f'找不到 link: {href}'
        html = pat.sub(lambda m: f'<style>\n{css}\n</style>\n', html, count=1)

    # 内联 JS: <script src="js/core.js"></script> -> <script>...</script>
    for js_path in a.js:
        js = Path(root / js_path).read_text(encoding='utf-8')
        pat = re.compile(r'<script[^>]+src="' + re.escape(js_path) + r'"[^>]*>\s*</script>\s*')
        assert pat.search(html), f'找不到 script: {js_path}'
        html = pat.sub(lambda m: f'<script>\n{js}\n</script>\n', html, count=1)

    Path(a.output).parent.mkdir(parents=True, exist_ok=True)
    Path(a.output).write_text(html, encoding='utf-8')
    print(f'▶ 已生成 {a.output}')

if __name__ == '__main__':
    sys.exit(main())