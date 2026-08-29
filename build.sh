#!/usr/bin/env bash
# 构建单文件部署版: 内联本地 css/js/d3, 输出 dist/index.html
# 用法: ./build.sh [输出目录=dist]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${1:-$ROOT/dist}"
OUT_FILE="$OUT_DIR/index.html"

echo "▶ 构建汉诺塔单文件版"
echo "  源:   $ROOT"
echo "  输出: $OUT_FILE"

# 1. 校验本地资源存在
for f in css/style.css lib/d3.v7.min.js js/core.js js/variants.js js/render.js js/app.js; do
  [ -f "$ROOT/$f" ] || { echo "✗ 缺少 $f"; exit 1; }
done

# 2. 跑测试
echo "▶ 运行测试…"
(cd "$ROOT" && node test/test_core.js && node test/test_variants.js && node test/test_app.js >/dev/null)

# 3. 内联打包
mkdir -p "$OUT_DIR"
python3 "$ROOT/tools/inline.py" "$ROOT/index.html" "$OUT_FILE" \
  --css "$ROOT/css/style.css" \
  --js "lib/d3.v7.min.js" \
  --prepend-js "lib/katex.min.js" \
  --js "js/core.js" \
  --js "js/variants.js" \
  --js "js/render.js" \
  --js "js/app.js"

# 4. 产物校验
python3 - "$OUT_FILE" << 'PY'
import sys, re
html = open(sys.argv[1], encoding='utf-8').read()
checks = {
  '内联 d3':      'd3js.org' in html,
  '内联 style':   '--bg: #000000' in html,
  '内联 core':    'HanoiCore' in html,
  '内联 variants':'HanoiVariants' in html,
  '内联 render':  'renderGraph' in html,
  '内联 app':     'HanoiApp' in html,
  '10 变体':      all(f"id: '{v}'" in html for v in
                    ['classic','same-disk','oneway','linear','star',
                     'four-peg','magnetic','twin','weighted','forbidden']),
  'ref 字段':     html.count('ref: ') >= 4,
  'arXiv 链接':   'arxiv.org/abs' in html,
  'KaTeX CDN':    'katex.min.css' in html,
  '金色三角内联': 'gold-edge' in html and 'footer-tri' in html and 'polygon' in html,
  '初始化钩子':    'DOMContentLoaded' in html,
  '无本地残留':    not re.search(r'(src|href)="(css/|js/|lib/)', html),
}
fails = [k for k, ok in checks.items() if not ok]
if fails:
    print('✗ 校验失败:', ', '.join(fails)); sys.exit(1)
size = len(html) / 1024
print(f'✓ 校验通过  {size:.0f} KB')
PY

# 5. 数据层验证: 10 变体全部可构建
echo "▶ 数据层验证…"
(cd "$ROOT" && node -e "
globalThis.HanoiCore = require('./js/core.js');
globalThis.HanoiVariants = require('./js/variants.js');
const vs = globalThis.HanoiVariants;
if (vs.length !== 10) { console.error('变体数 != 10'); process.exit(1); }
for (const v of vs) {
  const p = {}; v.params.forEach(pp => p[pp.key] = pp.default);
  const d = v.build(p);
  if (!Array.isArray(d.states) || !Array.isArray(d.edges) || !Array.isArray(d.coords)) {
    console.error(v.id + ' 数据异常'); process.exit(1);
  }
}
console.log('✓ 10 变体数据层全部通过');
")

echo "✓ 完成: $OUT_FILE"
echo "  部署: 上传该单文件到任意静态托管即可, 或直接 file:// 打开"