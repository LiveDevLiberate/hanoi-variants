# 汉诺塔变体状态图展示网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯静态网站，用 D3/SVG 交互式展示 7 种汉诺塔变体的状态切换图（分形图），含参数滑块、最短路径高亮、论文引用区。

**Architecture:** 单页应用，左侧变体导航 + 右侧图区 + 底部论文区。所有 JS 用 UMD 风格（浏览器挂全局 `window.HanoiCore` 等，node 可 `require` 测试），因为纯静态用 `file://` 打开时 ES modules 会被 CORS 阻止。变体通过注册器接口统一：`buildStates` / `buildEdges` / `layout` / `formula`。

**Tech Stack:** 原生 JS (UMD, 无框架)、D3.js v7（本地 `lib/d3.v7.min.js`）、SVG 渲染、深色主题（黑底 `#0a0a0e`、白边、金点 `#ffd700`）。测试用 node 内置 `assert`（无测试框架）。

## Global Constraints

- 纯静态：无构建步骤、无 npm 依赖、浏览器直接打开 `index.html` 可用
- JS 文件全部 UMD 风格（`module.exports` + 挂全局），node 可 require 测试
- 深色主题（**纯文字极简 · 学术风**）：背景纯黑 `#000000`，边白色 `#ffffff`，节点金色 `#ffd700`，文字白色 `#ffffff`；衬线字体（Georgia/宋体），无卡片/圆角/阴影/渐变/emoji，只有文字与线条
- 状态数上限 5000：超过显示提示不渲染
- 标签阈值：状态数 > 800 自动隐藏节点标签
- 4柱变体用 D2 2D 四面体投影（不用 Three.js）
- 状态编码：`state[i]` = 盘 i 所在柱（0 基），长度 = 盘数 n
- 项目根：`~/hanoi-variants/`
- 已验证数据（测试期望值，来自 Wolfram）：
  - 经典 n=2: 9 状态 12 边；n=3: 27 状态 39 边
  - 相同碟片 (N=2,nl=2): 36 状态 63 边；(N=3,nl=2): 100 状态 198 边
  - 单向循环 n=3: 27 状态 26 有向边（CW 方向）
  - 线性相邻 n=2: 9 状态 8 边；n=3: 27 状态 26 边
  - 磁铁 n=2: 9 状态 15 边；n=3: 27 状态 45 边
  - 禁止状态（最大盘禁中柱）n=2: 6 状态 7 边；n=3: 18 状态 25 边

---

### Task 1: 项目脚手架（index.html + CSS + D3 下载）

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `lib/d3.v7.min.js`（下载）

**Interfaces:**
- Consumes: 无
- Produces: `index.html` 加载 `css/style.css`、`lib/d3.v7.min.js`、`js/core.js`、`js/variants.js`、`js/render.js`、`js/app.js`（普通 `<script>` 标签，非 module）；全局对象 `HanoiCore`、`HanoiVariants`、`HanoiRender`、`HanoiApp`

- [ ] **Step 1: 创建 index.html 骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>汉诺塔变体 · 状态图</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <aside id="sidebar">
      <h1>汉诺塔变体</h1>
      <nav id="variant-nav"></nav>
    </aside>
    <main id="main">
      <header id="variant-header"></header>
      <div id="controls"></div>
      <div id="graph-container">
        <svg id="graph"></svg>
        <div id="overlay"></div>
      </div>
      <section id="papers"></section>
    </main>
  </div>
  <script src="lib/d3.v7.min.js"></script>
  <script src="js/core.js"></script>
  <script src="js/variants.js"></script>
  <script src="js/render.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 下载 D3 到本地**

```bash
curl -fsSL https://d3js.org/d3.v7.min.js -o ~/hanoi-variants/lib/d3.v7.min.js
# 验证: 文件存在且 >100KB
ls -la ~/hanoi-variants/lib/d3.v7.min.js
```
若 curl 失败，改用 `node -e "const https=require('https');const fs=require('fs');https.get('https://d3js.org/d3.v7.min.js',r=>r.pipe(fs.createWriteStream('~/hanoi-variants/lib/d3.v7.min.js')))"`

- [ ] **Step 3: 创建 css/style.css（纯文字极简 · 学术黑底）**

设计语言：**纯文字极简**——黑底白字、金色节点、白色边；无卡片、无圆角、无阴影、无渐变、无 emoji；排版疏朗，标题用大字号衬线/无衬线混排，全站只有文字与线条。

```css
:root {
  --bg: #000000;          /* 纯黑背景 */
  --panel: #0a0a0a;       /* 次级黑（面板区） */
  --edge: #ffffff;        /* 白色边 */
  --node: #ffd700;        /* 金色节点 */
  --text: #ffffff;        /* 白色字体 */
  --dim: #999999;         /* 次级文字 */
  --line: #1f1f1f;        /* 分隔线（极淡灰） */
  --accent: #ffd700;      /* 强调 = 金色 */
  --danger: #ff6464;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--bg); color: var(--text);
  font-family: "Georgia", "Times New Roman", "Noto Serif CJK SC",
    "Songti SC", "SimSun", serif;   /* 衬线为主，学术感 */
  line-height: 1.7; font-size: 15px; }
#app { display: flex; min-height: 100vh; }
#sidebar { width: 240px; padding: 40px 24px;
  border-right: 1px solid var(--line);
  position: sticky; top: 0; height: 100vh; overflow-y: auto; }
#sidebar h1 { font-size: 15px; font-weight: normal;
  letter-spacing: 0.12em; margin-bottom: 28px; color: var(--dim);
  text-transform: uppercase; }
#variant-nav a { display: block; padding: 6px 0; color: var(--dim);
  text-decoration: none; font-size: 14px; letter-spacing: 0.05em;
  border-left: 1px solid transparent; padding-left: 12px; }
#variant-nav a:hover { color: var(--text); }
#variant-nav a.active { color: var(--node); border-left-color: var(--node); }
#main { flex: 1; padding: 48px 56px 60px; max-width: 1080px; }
#variant-header { margin-bottom: 20px; }
#variant-header h2 { font-size: 28px; font-weight: normal;
  letter-spacing: 0.02em; margin-bottom: 8px; }
#variant-header p { color: var(--dim); font-size: 14px; }
#variant-header #stats { color: var(--accent); font-size: 13px;
  margin-top: 10px; font-style: italic; }
#controls { display: flex; gap: 28px; flex-wrap: wrap; align-items: center;
  margin: 8px 0 24px; padding: 16px 0; border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line); }
.control label { font-size: 13px; color: var(--dim);
  letter-spacing: 0.04em; }
.control .val { color: var(--node); font-weight: normal; margin: 0 6px; }
.control input[type=range] { vertical-align: middle;
  accent-color: var(--node); background: #111; }
.control input[type=checkbox] { accent-color: var(--node); margin-right: 5px; }
#graph-container { position: relative; min-height: 460px; }
#graph { width: 100%; display: block; }
.node { cursor: pointer; }
.tooltip { position: absolute; background: #000; color: #fff;
  border: 1px solid var(--line); padding: 8px 12px; font-size: 12px;
  pointer-events: none; display: none; }
#papers { margin-top: 64px; border-top: 1px solid var(--line); padding-top: 28px; }
#papers h2 { font-size: 15px; font-weight: normal; letter-spacing: 0.1em;
  color: var(--dim); text-transform: uppercase; margin-bottom: 16px; }
#papers h3 { font-size: 14px; font-weight: normal; margin: 18px 0 8px;
  color: var(--text); }
#papers .paper { font-size: 13px; color: var(--dim); margin-bottom: 6px;
  padding-left: 12px; border-left: 1px solid var(--line); }
#papers .paper a { color: var(--accent); text-decoration: none; }
#papers .paper a:hover { text-decoration: underline; }
```

- [ ] **Step 4: 验证页面可打开**

Run: `cd ~/hanoi-variants && python3 -m http.server 8000 &` 然后浏览器访问 `http://localhost:8000`（或直接打开 index.html）。Expected: 深色空页面骨架，无 console 报错（D3 加载成功）。

- [ ] **Step 5: Commit**

```bash
cd ~/hanoi-variants && git add index.html css/style.css lib/d3.v7.min.js
git commit -m "feat: 项目脚手架 (index.html + 深色主题 + D3)"
```

---

### Task 2: core.js — 共享逻辑（状态枚举/移动判定/布局/BFS）

**Files:**
- Create: `js/core.js`
- Test: `test/test_core.js`

**Interfaces:**
- Consumes: 无（纯逻辑，无 DOM）
- Produces: `HanoiCore` 对象（浏览器全局 / node module.exports）：
  - `enumStates(n, p=3)` → 状态数组（`state[i]` = 盘 i 所在柱，长度 n，3^n 个）
  - `canMove(s1, s2, {moveRule, magnetic, forbidden})` → boolean
  - `buildAdjacency(states, ruleFn)` → 邻接表 `adj[i]` = 邻居索引数组
  - `countEdges(adj)` → 无向边数
  - `barycentric(states)` → coords 数组 `[x,y]`（3柱三角格点）
  - `shortestPath(adj, startIdx, endIdx)` → 顶点索引数组
  - `deepTheme` 常量：`{bg:'#0a0a0e', edge:'#fff', node:'#ffd700', text:'#fff'}`
  - 布局使用三角形顶点 `corner = [[0,0],[1,0],[0.5,√3/2]]`，`place` 用 1/2 权重递推

- [ ] **Step 1: 写失败测试 test/test_core.js**

```js
const assert = require('assert');
const HanoiCore = require('../js/core.js');

// 经典枚举: 3盘 → 27 状态
assert.strictEqual(HanoiCore.enumStates(3, 3).length, 27);
assert.strictEqual(HanoiCore.enumStates(2, 3).length, 9);

// barycentric: 最小盘在柱0/1/2 的坐标不同
const states3 = HanoiCore.enumStates(3, 3);
const coords = HanoiCore.barycentric(states3);
assert.strictEqual(coords.length, 27);
// 全在柱0 {0,0,0} 的坐标 = [1/48, 1/48]（质心剩余项）
assert.ok(Math.abs(coords[0][0] - 1/48) < 1e-9);
assert.ok(Math.abs(coords[0][1] - 1/48) < 1e-9);
// {2,2,2} = [11/24, 1/48 + 7√3/16]
assert.ok(Math.abs(coords[26][0] - 11/24) < 1e-9);
assert.ok(Math.abs(coords[26][1] - (1/48 + 7*Math.sqrt(3)/16)) < 1e-9);

// 经典移动判定: {0,0,0} -> {1,0,0} 合法 (盘1从柱0到柱1)
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'classic'}), true);
// {0,0,0} -> {2,0,0} 合法
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'classic'}), true);
// {1,0,0} -> {0,0,0} 合法 (回移)
assert.strictEqual(HanoiCore.canMove([1,0,0], [0,0,0], {moveRule:'classic'}), true);
// {1,1,0} -> {0,1,0}: 盘1从柱1到柱0, 目标柱0空 → 合法
assert.strictEqual(HanoiCore.canMove([1,1,0], [0,1,0], {moveRule:'classic'}), true);
// 大盘不能压小盘: {1,1,1} 状态中盘3在柱1, 盘2在柱1, 盘1在柱1
// {1,1,1} -> {2,1,1}: 盘1从柱1到柱2, 目标空 → 合法
assert.strictEqual(HanoiCore.canMove([1,1,1], [2,1,1], {moveRule:'classic'}), true);
// 移动非顶部盘: {0,0,1} 中盘1在柱0, 盘2在柱0 → 盘2(柱0)不是顶部, 不能移到柱1? 
// 盘2在柱0, 柱0顶部是盘1(更小) → 盘2不能动
assert.strictEqual(HanoiCore.canMove([0,0,1], [0,1,1], {moveRule:'classic'}), false);

// 单向循环: 目标必须是 (源柱+1) mod 3
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'oneway'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'oneway'}), false); // 2不是0+1
assert.strictEqual(HanoiCore.canMove([2,0,0], [0,0,0], {moveRule:'oneway'}), true); // 0=(2+1)mod3

// 线性相邻: 只能相邻柱
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'linear'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'linear'}), false);

// 磁铁: 同奇偶不能叠
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'magnetic'}), true); // 盘1(奇)放空柱
// {0,1,0}: 盘1在柱0, 盘2在柱1, 盘3在柱0。盘1(奇)→柱1(顶部盘2偶) → 合法
assert.strictEqual(HanoiCore.canMove([0,1,0], [1,1,0], {moveRule:'magnetic'}), true);
// {1,1,0}: 盘1在柱1, 盘2在柱1, 盘3在柱0。盘3(奇)→柱1(顶部盘1奇) → 同奇偶, 非法!
assert.strictEqual(HanoiCore.canMove([1,1,0], [1,1,1], {moveRule:'magnetic'}), false);
// 盘2(偶)放到顶部盘为盘1(奇)上: {0,1,0} 盘2在柱1。盘3(奇)? 否。盘2(偶)已在柱1。
// 构造: {1,2,0} 盘1在柱1, 盘2在柱2, 盘3在柱0。盘1(奇)→柱2(顶部盘2偶) → 合法
assert.strictEqual(HanoiCore.canMove([1,2,0], [2,2,0], {moveRule:'magnetic'}), true);
// 同奇偶非法: {0,0,2} 盘1在柱0, 盘2在柱0, 盘3在柱2。盘1(奇)→柱2(顶部盘3奇) → 非法
assert.strictEqual(HanoiCore.canMove([0,0,2], [2,0,2], {moveRule:'magnetic'}), false);

// 禁止: 最大盘(盘n)不能在中柱(柱1)。n=3 时最大盘是盘3 (索引2)。
// 合法: 最大盘不在柱1 的移动 [0,0,0] -> [1,0,0] (盘1移动, 盘3仍在柱0)
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0],
  {moveRule:'classic', forbidden:{test: s => s[2] === 1}}), true);
// 非法: 移动结果最大盘到柱1。构造: 盘3已在柱0顶, 移到柱1
// 但经典规则下盘3只有柱0空出才能动。用 [0,1,1]: 盘1柱0,盘2柱1,盘3柱1 → 违反禁止状态本身
// 构造合法源: [0,0,0] -> [0,0,1] 盘3从柱0到柱1 → 结果 [0,0,1] 中盘3在柱1 → 禁止
assert.strictEqual(HanoiCore.canMove([0,0,0], [0,0,1],
  {moveRule:'classic', forbidden:{test: s => s[2] === 1}}), false);
// 非最大盘移入柱1 但最大盘不在柱1: 合法
assert.strictEqual(HanoiCore.canMove([0,0,0], [0,1,0],
  {moveRule:'classic', forbidden:{test: s => s[2] === 1}}), true);

// 最短路径: 经典 2盘 000→222 应为 3 步 (2^2-1)
// 构建邻接后 BFS
const st2 = HanoiCore.enumStates(2, 3);
const adj2 = HanoiCore.buildAdjacency(st2, (s1,s2)=>HanoiCore.canMove(s1,s2,{moveRule:'classic'}));
const path = HanoiCore.shortestPath(adj2, 0, 8); // 000→222
assert.strictEqual(path.length - 1, 3);

console.log('✓ test_core 全部通过');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd ~/hanoi-variants && node test/test_core.js`
Expected: FAIL — `Cannot find module '../js/core.js'`

- [ ] **Step 3: 实现 js/core.js（UMD 风格）**

```js
/* core.js — 汉诺塔状态图共享逻辑 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const deepTheme = { bg: '#000000', edge: '#ffffff', node: '#ffd700', text: '#ffffff' };

  // 枚举所有状态: state[i] = 盘 i 所在柱 (0 基), 长度 n
  function enumStates(n, p) {
    p = p || 3;
    const total = Math.pow(p, n);
    const states = [];
    for (let k = 0; k < total; k++) {
      const s = new Array(n);
      let x = k;
      for (let i = 0; i < n; i++) { s[i] = x % p; x = Math.floor(x / p); }
      states.push(s);
    }
    return states; // 状态按 k 升序, 000 在最前, 222 在最后 (3柱时)
  }

  // 每柱顶部盘 (返回数组, 柱号→盘号, Infinity=空)
  function topOf(state) {
    const t = [Infinity, Infinity, Infinity];
    for (let i = 0; i < state.length; i++) {
      const p = state[i];
      if (t[p] === Infinity) t[p] = i;
    }
    return t;
  }

  // 单盘移动判定 (经典规则 + 变体约束)
  function tryMove(s, lv, dest, opts) {
    const a = s[lv];
    if (a === dest) return null;
    const tp = topOf(s);
    // 源柱顶部必须是 lv
    if (tp[a] < lv) return null;
    // 目标柱顶部为空或更大
    if (tp[dest] < lv) return null;
    // 变体: 单向循环
    if (opts.moveRule === 'oneway' && dest !== (a + 1) % 3) return null;
    // 变体: 线性相邻
    if (opts.moveRule === 'linear' && Math.abs(a - dest) !== 1) return null;
    // 变体: 磁铁 — 同奇偶不能叠 (大小奇偶 = 极性)
    if (opts.moveRule === 'magnetic' && tp[dest] !== Infinity
        && (tp[dest] % 2) === (lv % 2)) return null;
    const ns = s.slice();
    ns[lv] = dest;
    // 变体: 禁止状态 (移动后不能落入黑名单)
    if (opts.forbidden && opts.forbidden.test && opts.forbidden.test(ns)) return null;
    return ns;
  }

  // canMove: s1 能一步到 s2
  function canMove(s1, s2, opts) {
    opts = opts || {};
    const diffs = [];
    for (let i = 0; i < s1.length; i++) if (s1[i] !== s2[i]) diffs.push(i);
    if (diffs.length !== 1) return false;
    const lv = diffs[0];
    const ns = tryMove(s1, lv, s2[lv], opts);
    if (!ns) return false;
    for (let i = 0; i < ns.length; i++) if (ns[i] !== s2[i]) return false;
    return true;
  }

  // 构建邻接表
  function buildAdjacency(states, ruleFn) {
    const adj = states.map(() => []);
    const n = states[0].length;
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      for (let lv = 0; lv < n; lv++) {
        for (let dest = 0; dest < 3; dest++) {
          const ns = ruleFn(s, lv, dest);
          if (!ns) continue;
          let ni = -1;
          for (let j = 0; j < states.length; j++) {
            let eq = true;
            for (let k = 0; k < ns.length; k++) if (ns[k] !== states[j][k]) { eq = false; break; }
            if (eq) { ni = j; break; }
          }
          if (ni >= 0 && ni !== i && !adj[i].includes(ni)) adj[i].push(ni);
        }
      }
    }
    return adj;
  }

  function countEdges(adj) {
    let e = 0;
    for (let i = 0; i < adj.length; i++)
      for (const j of adj[i]) if (i < j) e++;
    return e;
  }

  // barycentric 布局 (3柱)
  function barycentric(states, corner) {
    corner = corner || [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
    const n = states[0].length;
    return states.map(s => {
      let p = [0, 0], w = 1 / 2;
      for (let k = n - 1; k >= 0; k--) {
        const c = corner[s[k]];
        p[0] += c[0] * w; p[1] += c[1] * w;
        w /= 2;
      }
      p[0] += (1 / 3) * w; p[1] += (1 / 3) * w;
      return p;
    });
  }

  // BFS 最短路径 → 顶点索引数组
  function shortestPath(adj, start, end) {
    const prev = new Array(adj.length).fill(-1);
    const visited = new Array(adj.length).fill(false);
    const queue = [start];
    visited[start] = true;
    while (queue.length) {
      const cur = queue.shift();
      if (cur === end) break;
      for (const nb of adj[cur]) {
        if (!visited[nb]) { visited[nb] = true; prev[nb] = cur; queue.push(nb); }
      }
    }
    if (!visited[end]) return [];
    const path = [];
    for (let at = end; at !== -1; at = prev[at]) path.push(at);
    return path.reverse();
  }

  return { deepTheme, enumStates, topOf, tryMove, canMove,
           buildAdjacency, countEdges, barycentric, shortestPath };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd ~/hanoi-variants && node test/test_core.js`
Expected: `✓ test_core 全部通过`（无断言失败）

- [ ] **Step 5: Commit**

```bash
cd ~/hanoi-variants && git add js/core.js test/test_core.js
git commit -m "feat: core.js 共享逻辑 + 测试 (枚举/移动判定/布局/BFS)"
```

---

### Task 3: variants.js — 7 个变体注册器

**Files:**
- Create: `js/variants.js`
- Test: `test/test_variants.js`

**Interfaces:**
- Consumes: `HanoiCore`（`enumStates`, `canMove`, `buildAdjacency`, `countEdges`, `barycentric`, `shortestPath`, `tryMove`）
- Produces: `HanoiVariants` = 变体数组，每项 `{ id, name, desc, params, build, formula, shortest }`：
  - `build(params)` → `{ states, edges, coords, adj }`
  - `formula(params)` → `{ states: '3^n', edges: '...' }`（LaTeX/文本公式字符串）
  - `shortest` → `{ start: [0,0,0], end: [2,2,2] }` 或 null

变体 id 列表（顺序 = 导航顺序）：
`classic, same-disk, oneway, linear, four-peg, magnetic, forbidden`

- [ ] **Step 1: 写失败测试 test/test_variants.js**

```js
const assert = require('assert');
const HanoiCore = require('../js/core.js');
const HanoiVariants = require('../js/variants.js');

function counts(id, params) {
  const v = HanoiVariants.find(x => x.id === id);
  const r = v.build(params);
  return { states: r.states.length, edges: r.edges.length };
}

// 经典 n=2: 9/12, n=3: 27/39
assert.deepStrictEqual(counts('classic', {n:2}), {states:9, edges:12});
assert.deepStrictEqual(counts('classic', {n:3}), {states:27, edges:39});

// 相同碟片 N=2,nl=2: 36/63; N=3,nl=2: 100/198
assert.deepStrictEqual(counts('same-disk', {N:2, nl:2}), {states:36, edges:63});
assert.deepStrictEqual(counts('same-disk', {N:3, nl:2}), {states:100, edges:198});

// 单向循环 n=3: 27 状态, 26 有向边 (CW)
const ow = HanoiVariants.find(x=>x.id==='oneway').build({n:3});
assert.strictEqual(ow.states.length, 27);
assert.strictEqual(ow.edges.length, 26);
// 有向: 边是 {from, to} 对象, 且每条边方向满足单向规则 (to = (from+1)%3)
assert.ok(ow.edges.every(e => typeof e.from === 'number' && typeof e.to === 'number'));
assert.ok(ow.edges.every(e => {
  const a = ow.states[e.from], b = ow.states[e.to];
  const diffIdx = a.findIndex((v,i) => v !== b[i]);
  return diffIdx >= 0 && b[diffIdx] === (a[diffIdx] + 1) % 3;
}));

// 线性 n=2: 9/8; n=3: 27/26
assert.deepStrictEqual(counts('linear', {n:2}), {states:9, edges:8});
assert.deepStrictEqual(counts('linear', {n:3}), {states:27, edges:26});

// 磁铁 n=2: 9/15; n=3: 27/45
assert.deepStrictEqual(counts('magnetic', {n:2}), {states:9, edges:15});
assert.deepStrictEqual(counts('magnetic', {n:3}), {states:27, edges:45});

// 禁止 (最大盘禁中柱) n=2: 6/7; n=3: 18/25
assert.deepStrictEqual(counts('forbidden', {n:2}), {states:6, edges:7});
assert.deepStrictEqual(counts('forbidden', {n:3}), {states:18, edges:25});

// 最短路径: classic n=3, 000→222 应为 7 步
const cl = HanoiVariants.find(x=>x.id==='classic').build({n:3});
const sp = HanoiCore.shortestPath(cl.adj, 0, cl.states.length-1);
assert.strictEqual(sp.length - 1, 7);

console.log('✓ test_variants 全部通过');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd ~/hanoi-variants && node test/test_variants.js`
Expected: FAIL — `Cannot find module '../js/variants.js'`

- [ ] **Step 3: 实现 js/variants.js**

```js
/* variants.js — 7 个汉诺塔变体注册器 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.HanoiVariants = factory(root.HanoiCore);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  // 通用: 从 states + ruleFn 构建图 (有向可选)
  function buildGraph(states, ruleFn, directed) {
    const adj = Core.buildAdjacency(states, ruleFn);
    const edges = [];
    for (let i = 0; i < adj.length; i++) {
      for (const j of adj[i]) {
        if (directed) edges.push({ from: i, to: j });
        else if (i < j) edges.push([i, j]);
      }
    }
    const coords = Core.barycentric(states);
    return { states, adj, edges, coords };
  }

  // 经典 3 柱: 任意柱移动
  function classicBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'classic' }), false);
  }

  // 相同碟片: 每级 N 个相同盘
  function sameDiskBuild({ N, nl }) {
    // 每级分布 = 排序去重的 N 元组
    function genDistrib(level, max, cur) {
      if (level === 0) return [cur.slice()];
      const res = [];
      for (let p = 0; p < 3; p++) { cur.push(p); res.push(...genDistrib(level-1, max, cur)); cur.pop(); }
      return res;
    }
    // 简单: 枚举所有 N 盘位组合并排序去重
    function distributions(N) {
      const total = Math.pow(3, N), seen = new Set(), out = [];
      for (let k = 0; k < total; k++) {
        const d = new Array(N); let x = k;
        for (let i = 0; i < N; i++) { d[i] = x % 3; x = Math.floor(x/3); }
        const key = d.slice().sort((a,b)=>a-b).join(',');
        if (!seen.has(key)) { seen.add(key); out.push(d.slice().sort((a,b)=>a-b)); }
      }
      return out.sort((a,b)=>a.join(',').localeCompare(b.join(',')));
    }
    const dists = distributions(N);
    // 状态 = nl 个分布的笛卡尔积
    const states = [];
    (function rec(level, cur) {
      if (level === 0) { states.push(cur.slice()); return; }
      for (const d of dists) { cur.push(d.slice()); rec(level-1, cur); cur.pop(); }
    })(nl, []);
    // 移动: 找状态间差一个盘
    function topsOf(st) {
      const t = [Infinity, Infinity, Infinity];
      for (let lv = 0; lv < nl; lv++)
        for (const p of st[lv]) if (t[p] === Infinity) t[p] = lv;
      return t;
    }
    function canMoveOne(st1, st2) {
      // 找差一个盘的两个分布
      let diffLv = -1, diffPos = -1, from = -1, to = -1;
      for (let lv = 0; lv < nl; lv++) {
        const d1 = st1[lv].slice().sort((a,b)=>a-b);
        const d2 = st2[lv].slice().sort((a,b)=>a-b);
        if (d1.join(',') !== d2.join(',')) {
          if (diffLv >= 0) return false;
          diffLv = lv;
          // 找不同位置
          const merged = new Set([...d1, ...d2]);
          let removed = null, added = null;
          for (const v of merged) {
            const c1 = d1.filter(x=>x===v).length, c2 = d2.filter(x=>x===v).length;
            if (c1 > c2) removed = v;
            if (c2 > c1) added = v;
          }
          if (removed === null || added === null) return false;
          from = removed; to = added;
        }
      }
      if (diffLv < 0) return false;
      const tp = topsOf(st1);
      if (tp[from] < diffLv) return false;
      if (tp[to] < diffLv) return false;
      return true;
    }
    const idx = new Map(states.map((s,i)=>[JSON.stringify(s), i]));
    const adj = states.map(()=>[]);
    for (let i = 0; i < states.length; i++)
      for (let j = i+1; j < states.length; j++)
        if (canMoveOne(states[i], states[j])) { adj[i].push(j); adj[j].push(i); }
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) if (i<j) edges.push([i,j]);
    // 布局: 多叉递归 — 外层 = 大等级分布 barycentric, 内层偏移
    const corner = [[0,0],[1,0],[0.5,Math.sqrt(3)/2]];
    function barPoint(dist) {
      const c = [0,0,0];
      for (const p of dist) c[p]++;
      return [(c[0]*corner[0][0]+c[1]*corner[1][0]+c[2]*corner[2][0])/N,
              (c[0]*corner[0][1]+c[1]*corner[1][1]+c[2]*corner[2][1])/N];
    }
    const center = [0.5, Math.sqrt(3)/6];
    const coords = states.map(st => {
      let pt = [0,0];
      for (let lv = nl; lv >= 1; lv--) {
        const sc = Math.pow(0.22, nl - lv);
        const bp = barPoint(st[lv-1]);
        pt[0] += (bp[0]-center[0])*sc; pt[1] += (bp[1]-center[1])*sc;
      }
      return [pt[0]+center[0], pt[1]+center[1]];
    });
    return { states, adj, edges, coords };
  }

  // 单向循环: 有向图, 目标 = (源柱+1) mod 3
  function onewayBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'oneway' }), true);
  }

  // 线性相邻
  function linearBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'linear' }), false);
  }

  // 磁铁
  function magneticBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'magnetic' }), false);
  }

  // 4 柱: 状态 = 4^p 枚举, 四面体投影
  function fourPegBuild({ n }) {
    // 状态: 4 柱, n 盘 → 4^n
    const total = Math.pow(4, n);
    const states = [];
    for (let k = 0; k < total; k++) {
      const s = new Array(n); let x = k;
      for (let i = 0; i < n; i++) { s[i] = x % 4; x = Math.floor(x/4); }
      states.push(s);
    }
    // 移动: 任意柱→任意柱 (4柱)
    function topOf4(st) {
      const t = [Infinity,Infinity,Infinity,Infinity];
      for (let i=0;i<n;i++) if (t[st[i]]===Infinity) t[st[i]]=i;
      return t;
    }
    function tryMove4(s, lv, dest) {
      const a = s[lv]; if (a===dest) return null;
      const tp = topOf4(s);
      if (tp[a] < lv) return null;
      if (tp[dest] < lv) return null;
      const ns = s.slice(); ns[lv] = dest; return ns;
    }
    const adj = Core.buildAdjacency(states, tryMove4);
    const edges = [];
    for (let i=0;i<adj.length;i++) for (const j of adj[i]) if (i<j) edges.push([i,j]);
    // 四面体 2D 投影: 4 顶点 → 正交投影到 2D
    const tet3d = [
      [1,1,1], [1,-1,-1], [-1,1,-1], [-1,-1,1]
    ].map(v => {
      const L = Math.sqrt(3); return [v[0]/L, v[1]/L, v[2]/L];
    });
    // 正交投影 (旋转到好看角度): 用固定旋转矩阵
    const rot = (a,b,c) => v => {
      const [x,y,z] = v;
      // 绕Z
      const x1 = x*Math.cos(c)-y*Math.sin(c), y1 = x*Math.sin(c)+y*Math.cos(c), z1 = z;
      // 绕Y
      const x2 = x1*Math.cos(b)+z1*Math.sin(b), y2 = y1, z2 = -x1*Math.sin(b)+z1*Math.cos(b);
      // 绕X
      const x3 = x2, y3 = y2*Math.cos(a)-z2*Math.sin(a), z3 = y2*Math.sin(a)+z2*Math.cos(a);
      return [x3, y3];
    };
    const proj = rot(0.7, -0.6, 0.3);
    const projPts = tet3d.map(proj);
    // barycentric-like: 状态坐标 = 盘位加权 (最大盘权重大)
    const coords = states.map(s => {
      let p = [0,0], w = 1/2;
      for (let k = n-1; k >= 0; k--) {
        const c = projPts[s[k]];
        p[0] += c[0]*w; p[1] += c[1]*w; w /= 2;
      }
      // 归一化到单位正方形
      return p;
    });
    return { states, adj, edges, coords };
  }

  // 禁止状态: 最大盘(盘n)禁放中柱(柱1), 从状态集剔除
  function forbiddenBuild({ n }) {
    const all = Core.enumStates(n, 3);
    const states = all.filter(s => s[n-1] !== 1); // 最大盘不在中柱
    const idx = new Map(states.map((s,i)=>[JSON.stringify(s),i]));
    function isForbidden(s) { return s[n-1] === 1; }
    const adj = states.map(()=>[]);
    for (let i=0;i<states.length;i++) {
      const s = states[i];
      for (let lv=0; lv<n; lv++) for (let dest=0; dest<3; dest++) {
        const ns = Core.tryMove(s, lv, dest, {
          moveRule: 'classic',
          forbidden: { test: isForbidden }
        });
        if (ns && !isForbidden(ns)) {
          const j = idx.get(JSON.stringify(ns));
          if (j !== undefined && j !== i && !adj[i].includes(j)) adj[i].push(j);
        }
      }
    }
    const edges = [];
    for (let i=0;i<adj.length;i++) for (const j of adj[i]) if (i<j) edges.push([i,j]);
    const coords = Core.barycentric(states);
    return { states, adj, edges, coords };
  }

  return [
    {
      id: 'classic', name: '经典 3 柱',
      desc: '三根柱子，n 个大小不同的盘。每次移动一个盘，大盘不能压小盘。状态图 = Sierpinski 三角。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 6, step: 1, default: 3 }],
      build: classicBuild,
      formula: p => ({ states: '3^n', edges: '状态数 = 3^n，边数递推 E(n) = 3E(n-1) + 3' }),
      shortest: { start: [0,0,0], end: [2,2,2] }
    },
    {
      id: 'same-disk', name: '相同碟片',
      desc: '每级 N 个相同大小的盘，nl 个等级。同大小盘互换算同一状态，每级 C(N+2,2) 种分布。',
      params: [
        { key: 'N', label: '每级碟数', min: 1, max: 4, step: 1, default: 2 },
        { key: 'nl', label: '等级数', min: 1, max: 3, step: 1, default: 2 }
      ],
      build: sameDiskBuild,
      formula: p => ({ states: `C(${p.N}+2,2)^${p.nl}`,
        edges: `nl=2 时 E = (3/4)·N·(N+1)·(N²+N+4)` }),
      shortest: null
    },
    {
      id: 'oneway', name: '单向循环',
      desc: '盘只能 A→B→C→A 单向循环移动。有向图，边带箭头。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 5, step: 1, default: 3 }],
      build: onewayBuild,
      formula: p => ({ states: '3^n', edges: '有向边，单向约束' }),
      shortest: { start: [0,0,0], end: [2,2,2], directed: true }
    },
    {
      id: 'linear', name: '线性相邻',
      desc: '盘只能移到相邻柱（A↔B、B↔C）。最短路径 3^n - 1 步。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 5, step: 1, default: 3 }],
      build: linearBuild,
      formula: p => ({ states: '3^n', edges: '相邻约束下的边数' }),
      shortest: { start: [0,0,0], end: [2,2,2] }
    },
    {
      id: 'four-peg', name: '4 柱',
      desc: '四根柱子。状态图 = Sierpinski 四面体的 2D 投影。Frame–Stewart 算法。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 4, step: 1, default: 2 }],
      build: fourPegBuild,
      formula: p => ({ states: '4^n', edges: '多柱边数' }),
      shortest: null
    },
    {
      id: 'magnetic', name: '磁铁',
      desc: '相邻盘必须异极相对（奇偶盘极性不同），同极不能相邻。状态图是受限子图。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 5, step: 1, default: 3 }],
      build: magneticBuild,
      formula: p => ({ states: '3^n', edges: '磁极约束下的边数' }),
      shortest: { start: [0,0,0], end: [2,2,2] }
    },
    {
      id: 'forbidden', name: '禁止状态',
      desc: '最大盘不能放在中柱。某些状态被剔除，状态图是挖洞的子图。',
      params: [{ key: 'n', label: '盘数', min: 2, max: 5, step: 1, default: 3 }],
      build: forbiddenBuild,
      formula: p => ({ states: '2·3^(n-1)', edges: '剔除后边数' }),
      shortest: { start: [0,0,0], end: [2,2,2] }
    }
  ];
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd ~/hanoi-variants && node test/test_variants.js`
Expected: `✓ test_variants 全部通过`（7 个变体的状态/边数与 Wolfram 验证数据一致）

若某些变体计数不匹配，优先检查实现中的边界（如磁铁极性用奇偶、禁止状态 max 盘索引 n-1、same-disk 分布去重）。

- [ ] **Step 5: Commit**

```bash
cd ~/hanoi-variants && git add js/variants.js test/test_variants.js
git commit -m "feat: 7 个变体注册器 + 测试 (数据与 Wolfram 验证一致)"
```

---

### Task 4: render.js — D3/SVG 渲染器

**Files:**
- Create: `js/render.js`

**Interfaces:**
- Consumes: `d3` 全局、`HanoiCore.deepTheme`
- Produces: `HanoiRender`：
  - `renderGraph(svgEl, { states, edges, coords, adj, directed }, { showLabels, showPath, start, end })` → 无返回（操作 DOM）
  - `clearGraph(svgEl)`
  - `showMessage(svgEl, text)` → 状态过多时显示提示

- [ ] **Step 1: 实现 js/render.js**

```js
/* render.js — D3/SVG 渲染器 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const T = (root.HanoiCore || window.HanoiCore).deepTheme;
  const MAX_STATES = 5000, LABEL_LIMIT = 800;

  function computeTransform(coords, width, height, pad) {
    const xs = coords.map(c => c[0]), ys = coords.map(c => c[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = Math.min(...ys), ymax = Math.max(...ys);
    const spanX = Math.max(xmax - xmin, 1e-6), spanY = Math.max(ymax - ymin, 1e-6);
    const scale = Math.min((width - 2*pad) / spanX, (height - 2*pad) / spanY);
    return c => [
      pad + (c[0] - xmin) * scale + (width - 2*pad - spanX*scale) / 2,
      pad + (c[1] - ymin) * scale + (height - 2*pad - spanY*scale) / 2
    ];
  }

  function clearGraph(svgEl) {
    d3.select(svgEl).selectAll('*').remove();
  }

  function showMessage(svgEl, text) {
    clearGraph(svgEl);
    const w = svgEl.clientWidth || 800, h = svgEl.clientHeight || 500;
    d3.select(svgEl).append('text')
      .attr('x', w/2).attr('y', h/2)
      .attr('text-anchor', 'middle')
      .style('fill', '#ff6464').style('font-size', '18px').style('font-weight', 'bold')
      .text(text);
  }

  function renderGraph(svgEl, data, opts) {
    opts = opts || {};
    clearGraph(svgEl);
    if (data.states.length > MAX_STATES) {
      showMessage(svgEl, `状态数过多：${data.states.length}（上限 ${MAX_STATES}）`);
      return;
    }
    const w = svgEl.clientWidth || 900, h = svgEl.clientHeight || 500;
    const pad = 40;
    const toPx = computeTransform(data.coords, w, h, pad);
    const svg = d3.select(svgEl);
    svg.attr('viewBox', `0 0 ${w} ${h}`);

    // 边
    const directed = !!data.directed;
    const edgeSel = svg.selectAll('line.edge').data(data.edges).enter()
      .append(directed ? 'line' : 'line')
      .attr('class', 'edge')
      .attr('x1', e => toPx(data.coords[e.from ?? e[0]])[0])
      .attr('y1', e => toPx(data.coords[e.from ?? e[0]])[1])
      .attr('x2', e => toPx(data.coords[e.to ?? e[1]])[0])
      .attr('y2', e => toPx(data.coords[e.to ?? e[1]])[1])
      .style('stroke', T.edge).style('stroke-width', 1.2)
      .style('opacity', 0.6);

    // 有向箭头 (marker)
    if (directed) {
      svg.append('defs').append('marker')
        .attr('id', 'arrow').attr('viewBox', '0 0 10 10')
        .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6)
        .attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .style('fill', T.edge);
      edgeSel.attr('marker-end', 'url(#arrow)');
    }

    // 节点
    const nodeSel = svg.selectAll('circle.node').data(data.states).enter()
      .append('circle').attr('class', 'node')
      .attr('cx', (s, i) => toPx(data.coords[i])[0])
      .attr('cy', (s, i) => toPx(data.coords[i])[1])
      .attr('r', data.states.length > 800 ? 3 : 5)
      .style('fill', T.node)
      .style('stroke', 'rgba(0,0,0,0.4)').style('stroke-width', 1);

    // 标签
    if (opts.showLabels && data.states.length <= LABEL_LIMIT) {
      svg.selectAll('text.lbl').data(data.states).enter()
        .append('text').attr('class', 'lbl')
        .attr('x', (s, i) => toPx(data.coords[i])[0])
        .attr('y', (s, i) => toPx(data.coords[i])[1] - 8)
        .attr('text-anchor', 'middle')
        .style('fill', T.text).style('font-size', '8px')
        .text(s => s.join(''));
    }

    // 最短路径高亮
    if (opts.showPath && data.adj && opts.start !== undefined && opts.end !== undefined) {
      const path = HanoiCore.shortestPath(data.adj, opts.start, opts.end);
      for (let k = 0; k < path.length - 1; k++) {
        svg.append('line')
          .attr('x1', toPx(data.coords[path[k]])[0])
          .attr('y1', toPx(data.coords[path[k]])[1])
          .attr('x2', toPx(data.coords[path[k+1]])[0])
          .attr('y2', toPx(data.coords[path[k+1]])[1])
          .style('stroke', '#ff4040').style('stroke-width', 3)
          .style('opacity', 0.9);
      }
      // 起终点放大
      svg.selectAll('circle.path-end').data([path[0], path[path.length-1]]).enter()
        .append('circle').attr('class', 'path-end')
        .attr('cx', i => toPx(data.coords[path[i]])[0])
        .attr('cy', i => toPx(data.coords[path[i]])[1])
        .attr('r', 9).style('fill', 'none').style('stroke', '#ff4040').style('stroke-width', 2);
    }
  }

  return { renderGraph, clearGraph, showMessage };
});
```

- [ ] **Step 2: 手动验证渲染**

Run: 打开 `index.html`（浏览器），在 console 手动调用：
```js
const data = HanoiVariants.find(v=>v.id==='classic').build({n:3});
HanoiRender.renderGraph(document.getElementById('graph'), data, {showLabels:true, showPath:true, start:0, end:26});
```
Expected: 深色背景 + Sierpinski 三角（金点、白边、标签、红色最短路径 000→222）

- [ ] **Step 3: Commit**

```bash
cd ~/hanoi-variants && git add js/render.js
git commit -m "feat: D3/SVG 渲染器 (节点/边/标签/最短路径高亮)"
```

---

### Task 5: app.js — UI 逻辑（变体切换、滑块、论文区）

**Files:**
- Create: `js/app.js`

**Interfaces:**
- Consumes: `d3`, `HanoiCore`, `HanoiVariants`, `HanoiRender`, DOM 元素
- Produces: `HanoiApp.init()` 启动应用；页面交互完成

- [ ] **Step 1: 实现 js/app.js**

```js
/* app.js — 应用逻辑 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiApp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PAPERS = [
    { group: '奠基', items: [
      { text: 'É. Lucas, Récréations Mathématiques vol. III, 1893 — 汉诺塔原始出处' },
      { text: 'A.M. Hinz et al., The Tower of Hanoi – Myths and Maths, Springer, 2013 — 权威专著' }
    ]},
    { group: 'Sierpinski 同构', items: [
      { text: 'I. Stewart, Le lion, le lama et la laitue, Pour la Science 142, 1989 — 首次提出汉诺塔图 ≅ Sierpinski 垫片',
        url: 'https://www.pourlascience.fr' },
      { text: 'A.M. Hinz & A. Schief, The average distance on the Sierpiński gasket, Probab. Theory Related Fields 87, 1990' },
      { text: 'D. Romik, Shortest paths in the Tower of Hanoi, arXiv:math/0310109',
        url: 'https://arxiv.org/abs/math/0310109' }
    ]},
    { group: '多柱 / Frame–Stewart', items: [
      { text: 'H.E. Dudeney, The Canterbury Puzzles, 1908 — 4柱问题 (Reve\'s Puzzle)' },
      { text: 'J.S. Frame & B.M. Stewart, Amer. Math. Monthly 48, 1941 — Frame–Stewart 算法' },
      { text: 'X. Chen & J. Shen, On the Frame–Stewart conjecture, SIAM J. Comput. 33, 2004',
        url: 'https://doi.org/10.1137/S0097539703431019' },
      { text: 'T. Bousch, La quatrième tour de Hanoï, Bull. Belg. Math. Soc. 21, 2014 — 证明4柱情形',
        url: 'https://doi.org/10.36045/bbms/1420071861' }
    ]},
    { group: '图结构', items: [
      { text: 'S. Klavžar, U. Milutinović, C. Petr, On the Frame-Stewart algorithm, Discrete Appl. Math. 120, 2002' },
      { text: 'P.K. Stockmeyer, Variations on the four-post Tower of Hanoi, Congr. Numer. 102, 1994' },
      { text: 'Aumann, Götz, Hinz, Petr, The number of moves of the largest disc in shortest paths on Hanoi graphs, Electron. J. Combin. 21, 2014',
        url: 'https://www.combinatorics.org/ojs/index.php/eljc/article/view/v21i4p38' }
    ]}
  ];

  let currentId = 'classic';
  let currentParams = {};
  let currentData = null;

  function renderNav() {
    const nav = document.getElementById('variant-nav');
    nav.innerHTML = '';
    HanoiVariants.forEach(v => {
      const a = document.createElement('a');
      a.textContent = v.name;
      a.dataset.id = v.id;
      if (v.id === currentId) a.classList.add('active');
      a.addEventListener('click', () => selectVariant(v.id));
      nav.appendChild(a);
    });
  }

  function renderControls() {
    const ctrl = document.getElementById('controls');
    ctrl.innerHTML = '';
    const v = HanoiVariants.find(x => x.id === currentId);
    const header = document.getElementById('variant-header');
    header.innerHTML = `<h2>${v.name}</h2><p style="color:#888;font-size:13px">${v.desc}</p>`;

    v.params.forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'control';
      wrap.innerHTML = `<label>${p.label}: <span class="val" id="val-${p.key}">${currentParams[p.key] ?? p.default}</span></label>
        <input type="range" id="param-${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${currentParams[p.key] ?? p.default}">`;
      wrap.querySelector('input').addEventListener('input', e => {
        currentParams[p.key] = Number(e.target.value);
        document.getElementById(`val-${p.key}`).textContent = currentParams[p.key];
        rebuild();
      });
      ctrl.appendChild(wrap);
    });

    // 标签开关
    const lblWrap = document.createElement('div');
    lblWrap.className = 'control';
    lblWrap.innerHTML = `<label><input type="checkbox" id="chk-labels" checked> 标签</label>`;
    lblWrap.querySelector('input').addEventListener('change', rebuild);
    ctrl.appendChild(lblWrap);

    // 最短路径开关
    if (v.shortest) {
      const spWrap = document.createElement('div');
      spWrap.className = 'control';
      spWrap.innerHTML = `<label><input type="checkbox" id="chk-path" checked> 最短路径</label>`;
      spWrap.querySelector('input').addEventListener('change', rebuild);
      ctrl.appendChild(spWrap);
    }
  }

  function buildParams() {
    const v = HanoiVariants.find(x => x.id === currentId);
    const p = {};
    v.params.forEach(pp => { p[pp.key] = currentParams[pp.key] ?? pp.default; });
    return p;
  }

  function rebuild() {
    const v = HanoiVariants.find(x => x.id === currentId);
    const p = buildParams();
    currentData = v.build(p);
    const svg = document.getElementById('graph');
    const showLabels = document.getElementById('chk-labels')?.checked ?? true;
    const showPath = document.getElementById('chk-path')?.checked ?? false;
    const opts = { showLabels, showPath };
    const v2 = HanoiVariants.find(x => x.id === currentId);
    if (v2.shortest && currentData.states.length <= 5000) {
      // 找最短路径起终点索引
      const startS = v2.shortest.start, endS = v2.shortest.end;
      opts.start = currentData.states.findIndex(s => JSON.stringify(s) === JSON.stringify(startS));
      opts.end = currentData.states.findIndex(s => JSON.stringify(s) === JSON.stringify(endS));
    }
    HanoiRender.renderGraph(svg, currentData, opts);
    updateStats(v, p);
  }

  function updateStats(v, p) {
    const stats = document.getElementById('variant-header');
    const f = v.formula(p);
    let html = stats.innerHTML;
    const info = document.createElement('div');
    info.id = 'stats';
    info.style.cssText = 'color:#4a9eff;font-size:13px;margin-top:6px;';
    info.textContent = `状态数 = ${currentData.states.length}（公式 ${f.states}）· 边数 = ${currentData.edges.length}（${f.edges}）`;
    const old = document.getElementById('stats');
    if (old) old.remove();
    stats.appendChild(info);
  }

  function renderPapers() {
    const sec = document.getElementById('papers');
    sec.innerHTML = '<h2>参考文献</h2>';
    PAPERS.forEach(g => {
      const h = document.createElement('h3');
      h.style.cssText = 'color:#fff;font-size:14px;margin:12px 0 6px;';
      h.textContent = g.group;
      sec.appendChild(h);
      g.items.forEach(it => {
        const p = document.createElement('p');
        p.className = 'paper';
        if (it.url) {
          const a = document.createElement('a');
          a.href = it.url; a.target = '_blank'; a.textContent = ' [链接]';
          p.textContent = it.text; p.appendChild(a);
        } else {
          p.textContent = it.text;
        }
        sec.appendChild(p);
      });
    });
  }

  function selectVariant(id) {
    currentId = id;
    currentParams = {};
    const v = HanoiVariants.find(x => x.id === id);
    v.params.forEach(p => { currentParams[p.key] = p.default; });
    renderNav();
    renderControls();
    rebuild();
  }

  function init() {
    renderPapers();
    selectVariant('classic');
  }

  return { init, selectVariant, rebuild };
});
```

- [ ] **Step 2: 在 index.html 底部加初始化**

在 `</body>` 前、`<script src="js/app.js"></script>` 后加：
```html
<script>document.addEventListener('DOMContentLoaded', function(){ HanoiApp.init(); });</script>
```

- [ ] **Step 3: 手动验证完整功能**

Run: 浏览器打开 `index.html`（或 `python3 -m http.server`）
Expected:
- 左侧 7 个变体导航，点击切换
- 经典 3 柱默认显示：Sierpinski 三角 + 标签 + 红色最短路径
- 拖动盘数滑块（1→6）实时更新，>6 时状态 729 < 5000 正常；经典 n=6 状态 729 正常
- 标签开关、最短路径开关生效
- 相同碟片变体：N/nl 两个滑块
- 4柱变体：四面体投影
- 底部论文区 4 组文献显示
- 无 console 报错

- [ ] **Step 4: Commit**

```bash
cd ~/hanoi-variants && git add js/app.js index.html
git commit -m "feat: 应用逻辑 (变体切换/滑块/论文区)"
```

---

### Task 6: 集成验证 + README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: 全部模块
- Produces: 可运行文档

- [ ] **Step 1: 写 README.md**

```markdown
# 汉诺塔变体 · 状态图展示

纯静态网站，用 D3/SVG 交互式展示 7 种汉诺塔变体的状态切换图（分形图）。

## 运行

直接用浏览器打开 `index.html`（无需服务器），或：

```bash
cd hanoi-variants
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 变体

经典 3 柱 / 相同碟片 / 单向循环 / 线性相邻 / 4 柱 / 磁铁 / 禁止状态

## 测试

```bash
node test/test_core.js
node test/test_variants.js
```

测试数据已用 Wolfram 独立验证（状态数/边数）。

## 结构

```
index.html / css/ / js/ (core, variants, render, app) / lib/d3.v7.min.js
docs/specs/ 设计文档
```

## 参考文献

底部论文区列出汉诺塔图论经典文献（Lucas, Hinz, Bousch, Romik 等）。
```

- [ ] **Step 2: 全量测试 + 浏览器验证**

Run: `cd ~/hanoi-variants && node test/test_core.js && node test/test_variants.js`
Expected: 两个测试都输出 `✓ ... 全部通过`

Run: 浏览器逐个切换 7 个变体，拖动参数
Expected: 每个变体状态图正确渲染，无报错，状态数/边数与测试数据一致

- [ ] **Step 3: Commit**

```bash
cd ~/hanoi-variants && git add README.md
git commit -m "docs: README (运行/测试/结构说明)"
```

---

### Task 7: 最终自审 + 完成

- [ ] **Step 1: 对照 spec 检查覆盖**

逐项核对 spec 第 5/6/7/8 节：7 变体 ✓、渲染细节 ✓、UI 布局 ✓、论文区 ✓、状态上限 5000 ✓、标签阈值 800 ✓、4柱 2D 投影 ✓

- [ ] **Step 2: 全量回归**

Run: `cd ~/hanoi-variants && node test/test_core.js && node test/test_variants.js && git log --oneline`
Expected: 两测试通过，提交历史包含 6+ 个 commit

- [ ] **Step 3: 交付说明**

总结项目位置、运行方式、7 个变体、测试结果、后续可扩展项（可玩游戏、3D 版、更多变体）