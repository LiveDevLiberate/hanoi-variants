/* variants.js — 7 个汉诺塔变体注册器 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.HanoiVariants = factory(root.HanoiCore);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

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

  function classicBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'classic' }), false);
  }

  function sameDiskBuild({ N, nl }) {
    function distributions(N) {
      const total = Math.pow(3, N), seen = new Set(), out = [];
      for (let k = 0; k < total; k++) {
        const d = new Array(N); let x = k;
        for (let i = 0; i < N; i++) { d[i] = x % 3; x = Math.floor(x / 3); }
        const key = d.slice().sort((a, b) => a - b).join(',');
        if (!seen.has(key)) { seen.add(key); out.push(d.slice().sort((a, b) => a - b)); }
      }
      return out.sort((a, b) => a.join(',').localeCompare(b.join(',')));
    }
    const dists = distributions(N);
    const states = [];
    (function rec(level, cur) {
      if (level === 0) { states.push(cur.slice()); return; }
      for (const d of dists) { cur.push(d.slice()); rec(level - 1, cur); cur.pop(); }
    })(nl, []);

    function topsOf(st) {
      const t = [Infinity, Infinity, Infinity];
      for (let lv = 0; lv < nl; lv++)
        for (const p of st[lv]) if (t[p] === Infinity) t[p] = lv;
      return t;
    }
    // Wolfram 式显式枚举: 每 (lv, pos, dest) 检查源柱顶部与目标柱顶部
    function wolframNeighbors(s) {
      const res = [];
      for (let lv = 0; lv < nl; lv++) {
        for (let pos = 0; pos < N; pos++) {
          const a = s[lv][pos];
          for (let dest = 0; dest < 3; dest++) {
            if (a === dest) continue;
            const tp = topsOf(s);
            if (tp[a] < lv) continue;
            if (tp[dest] < lv) continue;
            const newp = s[lv].slice(); newp[pos] = dest; newp.sort((x, y) => x - y);
            const ns = s.map(x => x.slice()); ns[lv] = newp;
            res.push(ns);
          }
        }
      }
      const seen = new Set(); const out = [];
      for (const ns of res) { const k = JSON.stringify(ns); if (!seen.has(k)) { seen.add(k); out.push(ns); } }
      return out;
    }
    const idx = new Map(states.map((s, i) => [JSON.stringify(s), i]));
    const adj = states.map(() => []);
    for (let i = 0; i < states.length; i++) {
      for (const ns of wolframNeighbors(states[i])) {
        const j = idx.get(JSON.stringify(ns));
        if (j !== undefined && j !== i && !adj[i].includes(j)) adj[i].push(j);
      }
    }
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) if (i < j) edges.push([i, j]);
    const corner = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
    function barPoint(dist) {
      const c = [0, 0, 0];
      for (const p of dist) c[p]++;
      return [(c[0] * corner[0][0] + c[1] * corner[1][0] + c[2] * corner[2][0]) / N,
              (c[0] * corner[0][1] + c[1] * corner[1][1] + c[2] * corner[2][1]) / N];
    }
    const center = [0.5, Math.sqrt(3) / 6];
    const coords = states.map(st => {
      let pt = [0, 0];
      for (let lv = nl; lv >= 1; lv--) {
        const sc = Math.pow(0.22, nl - lv);
        const bp = barPoint(st[lv - 1]);
        pt[0] += (bp[0] - center[0]) * sc; pt[1] += (bp[1] - center[1]) * sc;
      }
      return [pt[0] + center[0], pt[1] + center[1]];
    });
    return { states, adj, edges, coords };
  }

  function onewayBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'oneway' }), true);
  }

  function linearBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'linear' }), false);
  }

  function magneticBuild({ n }) {
    const all = Core.enumStates(n, 3);
    // 合法状态: 同一柱上相邻盘必须异极 (奇偶不同)
    function legalQ(s) {
      const cols = [[], [], []];
      for (let i = 0; i < n; i++) cols[s[i]].push(i);
      for (const col of cols) {
        col.sort((a, b) => a - b);
        for (let t = 0; t < col.length - 1; t++) {
          if (col[t] % 2 === col[t + 1] % 2) return false;
        }
      }
      return true;
    }
    const states = all.filter(legalQ);
    const idx = new Map(states.map((s, i) => [s.join(','), i]));
    const adj = states.map(() => []);
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      for (let lv = 0; lv < n; lv++) {
        for (let dest = 0; dest < 3; dest++) {
          const ns = Core.tryMove(s, lv, dest, { moveRule: 'magnetic' });
          if (!ns) continue;
          const j = idx.get(ns.join(','));
          if (j !== undefined && j !== i && !adj[i].includes(j)) { adj[i].push(j); adj[j].push(i); }
        }
      }
    }
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) if (i < j) edges.push([i, j]);
    const coords = Core.barycentric(states);
    return { states, adj, edges, coords };
  }

  function fourPegBuild({ n }) {
    const total = Math.pow(4, n);
    const states = [];
    for (let k = 0; k < total; k++) {
      const s = new Array(n); let x = k;
      for (let i = 0; i < n; i++) { s[i] = x % 4; x = Math.floor(x / 4); }
      states.push(s);
    }
    function topOf4(st) {
      const t = [Infinity, Infinity, Infinity, Infinity];
      for (let i = 0; i < n; i++) if (t[st[i]] === Infinity) t[st[i]] = i;
      return t;
    }
    function tryMove4(s, lv, dest) {
      const a = s[lv]; if (a === dest) return null;
      const tp = topOf4(s);
      if (tp[a] < lv) return null;
      if (tp[dest] < lv) return null;
      const ns = s.slice(); ns[lv] = dest; return ns;
    }
    const adj = Core.buildAdjacency(states, tryMove4);
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) if (i < j) edges.push([i, j]);
    const tet3d = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => {
      const L = Math.sqrt(3); return [v[0] / L, v[1] / L, v[2] / L];
    });
    const rot = (a, b, c) => v => {
      const [x, y, z] = v;
      const x1 = x * Math.cos(c) - y * Math.sin(c), y1 = x * Math.sin(c) + y * Math.cos(c), z1 = z;
      const x2 = x1 * Math.cos(b) + z1 * Math.sin(b), y2 = y1, z2 = -x1 * Math.sin(b) + z1 * Math.cos(b);
      const x3 = x2, y3 = y2 * Math.cos(a) - z2 * Math.sin(a), z3 = y2 * Math.sin(a) + z2 * Math.cos(a);
      return [x3, y3];
    };
    const proj = rot(0.7, -0.6, 0.3);
    const projPts = tet3d.map(proj);
    const coords = states.map(s => {
      let p = [0, 0], w = 1 / 2;
      for (let k = n - 1; k >= 0; k--) {
        const c = projPts[s[k]];
        p[0] += c[0] * w; p[1] += c[1] * w; w /= 2;
      }
      return p;
    });
    return { states, adj, edges, coords };
  }

  function forbiddenBuild({ n }) {
    const all = Core.enumStates(n, 3);
    const states = all.filter(s => s[n - 1] !== 1);
    const idx = new Map(states.map((s, i) => [s.join(','), i]));
    function isForbidden(s) { return s[n - 1] === 1; }
    const adj = states.map(() => []);
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      for (let lv = 0; lv < n; lv++) for (let dest = 0; dest < 3; dest++) {
        const ns = Core.tryMove(s, lv, dest, { moveRule: 'classic', forbidden: { test: isForbidden } });
        if (ns && !isForbidden(ns)) {
          const j = idx.get(ns.join(','));
          if (j !== undefined && j !== i && !adj[i].includes(j)) adj[i].push(j);
        }
      }
    }
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) if (i < j) edges.push([i, j]);
    const coords = Core.barycentric(states);
    return { states, adj, edges, coords };
  }

  return [
    {
      id: 'classic', name: '经典 3 柱',
      desc: '三根柱子，n 个大小不同的盘。每次移动一个盘，大盘不能压小盘。状态图 = Sierpinski 三角。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 6, step: 1, default: 3 }],
      build: classicBuild,
      formula: p => ({ states: '3^n', edges: 'E(n) = 3·E(n−1) + 3' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
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
      shortest: { start: [0, 0, 0], end: [2, 2, 2], directed: true }
    },
    {
      id: 'linear', name: '线性相邻',
      desc: '盘只能移到相邻柱（A↔B、B↔C）。最短路径 3^n − 1 步。',
      params: [{ key: 'n', label: '盘数', min: 1, max: 5, step: 1, default: 3 }],
      build: linearBuild,
      formula: p => ({ states: '3^n', edges: '相邻约束下的边数' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
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
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'forbidden', name: '禁止状态',
      desc: '最大盘不能放在中柱。某些状态被剔除，状态图是挖洞的子图。',
      params: [{ key: 'n', label: '盘数', min: 2, max: 5, step: 1, default: 3 }],
      build: forbiddenBuild,
      formula: p => ({ states: '2·3^(n−1)', edges: '剔除后边数' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    }
  ];
});