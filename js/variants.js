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
    return { states, adj, edges, coords, directed: !!directed };
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

  function starBuild({ n }) {
    const states = Core.enumStates(n, 3);
    return buildGraph(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'star' }), false);
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


  // 双子塔: 两套 3 柱 (A/B), 每套 n 盘, 同步移动
  // 状态 = 每盘在 A/B 两组的位置对, 共 9^n 个
  function twinBuild({ n }) {
    const perDisk = 9; // 每盘 (a,b) ∈ {0,1,2}²
    const total = Math.pow(perDisk, n);
    const states = [];
    // 用 9 进制编码每盘: 位 = a*3 + b
    for (let k = 0; k < total; k++) {
      const s = new Array(2 * n); let x = k;
      for (let i = 0; i < n; i++) {
        const v = x % 9; x = Math.floor(x / 9);
        s[i] = Math.floor(v / 3);      // A 组盘位
        s[n + i] = v % 3;              // B 组盘位
      }
      states.push(s);
    }
    function topOf(st) {
      const t = [Infinity, Infinity, Infinity];
      for (let i = 0; i < st.length; i++) if (t[st[i]] === Infinity) t[st[i]] = i;
      return t;
    }
    function tryMoveTwin(s, lv, dest) {
      const aA = s[lv], aB = s[n + lv];
      if (aA === dest && aB === dest) return null;
      // A/B 两组栈分开算
      const tA = topOf(s.slice(0, n));
      const tB = topOf(s.slice(n));
      // 源: A 组盘 lv 必须在 A 组柱顶; B 组同理
      if (tA[aA] < lv || tB[aB] < lv) return null;
      // 目标: A 组 dest 柱无更小盘, B 组 dest 柱无更小盘
      if (tA[dest] < lv || tB[dest] < lv) return null;
      const ns = s.slice();
      ns[lv] = dest; ns[n + lv] = dest;
      return ns;
    }
    // twin 移动不对称 (同步设为 dest), 是有向图: 收集有向边
    const idx = new Map(states.map((s, i) => [s.join(','), i]));
    const adj = states.map(() => []);
    for (let i = 0; i < states.length; i++) {
      for (let lv = 0; lv < n; lv++) {
        for (let dest = 0; dest < 3; dest++) {
          const ns = tryMoveTwin(states[i], lv, dest);
          if (!ns) continue;
          const j = idx.get(ns.join(','));
          if (j !== undefined && j !== i && !adj[i].includes(j)) adj[i].push(j);
        }
      }
    }
    const edges = [];
    for (let i = 0; i < adj.length; i++) for (const j of adj[i]) edges.push({ from: i, to: j });
    // 布局: 两组各自重心 + 归一化到三角, A/B 交错贡献 (Sierpinski 直积风)
    const corner = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
    const coords = states.map(s => {
      let p = [0, 0], w = 1 / 2;
      for (let k = 2 * n - 1; k >= 0; k--) {
        const c = corner[s[k]];
        p[0] += c[0] * w; p[1] += c[1] * w; w /= 2;
      }
      p[0] += (1 / 3) * w; p[1] += (1 / 3) * w;
      return p;
    });
    return { states, adj, edges, coords, directed: true };
  }

  // 加权汉诺塔: 经典规则, 但柱间移动有成本 w(a,dest) = |a-dest|
  // 最短路径 = 加权最短 (Dijkstra), 边的粗细反映成本
  function weightedBuild({ n }) {
    const states = Core.enumStates(n, 3);
    const adj = Core.buildAdjacency(states, (s, lv, dest) =>
      Core.tryMove(s, lv, dest, { moveRule: 'classic' }), false);
    const edges = [];
    for (let i = 0; i < adj.length; i++) {
      for (const j of adj[i]) {
        if (i < j) {
          // 找出这条边对应的柱对 (从状态差异推导)
          let from = -1, to = -1;
          for (let k = 0; k < n; k++) {
            if (states[i][k] !== states[j][k]) { from = states[i][k]; to = states[j][k]; break; }
          }
          edges.push([i, j, Math.abs(from - to)]);
        }
      }
    }
    // 加权最短路径 (Dijkstra)
    function weightedPath(start, end) {
      const dist = new Array(states.length).fill(Infinity);
      const prev = new Array(states.length).fill(-1);
      const done = new Array(states.length).fill(false);
      dist[start] = 0;
      for (;;) {
        let u = -1, best = Infinity;
        for (let i = 0; i < states.length; i++)
          if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
        if (u === -1) break;
        done[u] = true;
        if (u === end) break;
        for (const e of edges) {
          const [a, b, w] = e;
          const nb = a === u ? b : b === u ? a : -1;
          if (nb === -1) continue;
          if (dist[u] + w < dist[nb]) { dist[nb] = dist[u] + w; prev[nb] = u; }
        }
      }
      if (!done[end]) return [];
      const path = [];
      for (let at = end; at !== -1; at = prev[at]) path.push(at);
      return path.reverse();
    }
    const coords = Core.barycentric(states);
    return { states, adj, edges, coords, directed: false, weightedPath };
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
      id: 'classic', name: { zh: '经典 3 柱', en: 'Classic 3-Peg' },
      desc: { zh: '三根柱子，n 个大小不同的盘。每次移动一个盘，大盘不能压小盘。状态图 = Sierpinski 三角。', en: 'Three pegs, n disks of distinct sizes. Move one disk at a time; a larger disk can never sit on a smaller one. State graph = Sierpinski gasket.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 6, step: 1, default: 1 }],
      build: classicBuild,
      formula: p => ({ states: '3^n', edges: 'E(n) = 3\\,E(n-1) + 3' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'same-disk', name: { zh: '相同碟片', en: 'Same-Size Disks' },
      desc: { zh: '每级 N 个相同大小的盘，nl 个等级。同大小盘互换算同一状态，每级 C(N+2,2) 种分布。', en: 'N equal disks per level, nl levels. Permuting disks of equal size gives the same state; C(N+2,2) distributions per level.' },
      params: [
        { key: 'N', label: { zh: '每级碟数', en: 'Disks/level' }, min: 1, max: 4, step: 1, default: 1 },
        { key: 'nl', label: { zh: '等级数', en: 'Levels' }, min: 1, max: 3, step: 1, default: 1 }
      ],
      build: sameDiskBuild,
      formula: p => ({ states: `\\binom{${p.N}+2}{2}^{${p.nl}}`,
        edges: `E = \\tfrac{3}{4}N(N+1)(N^2+N+4)` }),
      shortest: null
    },
    {
      id: 'oneway', name: { zh: '单向循环', en: 'One-Way Cycle' },
      desc: { zh: '盘只能 A→B→C→A 单向循环移动。有向图，边带箭头。', en: 'Disks may move only in the cycle A→B→C→A. Directed graph with arrows on edges.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 5, step: 1, default: 1 }],
      build: onewayBuild,
      formula: p => ({ states: '3^n', edges: 'E(n) = 3\\,E(n-1) + 3' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2], directed: true }
    },
    {
      id: 'linear', name: { zh: '线性相邻', en: 'Linear / Adjacent' },
      desc: { zh: '盘只能移到相邻柱（A↔B、B↔C）。最短路径 3^n − 1 步。', en: 'Disks move only between adjacent pegs (A↔B, B↔C). Shortest path takes 3^n − 1 moves.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 5, step: 1, default: 1 }],
      build: linearBuild,
      formula: p => ({ states: '3^n', edges: 'd(000,222) = 3^n - 1' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'star', name: { zh: '星形', en: 'Star' },
      desc: { zh: '盘只能移到中心柱（柱0）或从中心柱移出，非中心柱之间不能直接移动。移动图 = K₁,ₘ₋₁。', en: 'Disks move only to/from the central peg (peg 0); non-central pegs cannot exchange directly. Movement graph = K₁,ₘ₋₁.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 5, step: 1, default: 1 }],
      build: starBuild,
      formula: p => ({ states: '3^n', edges: 'E(n) = 3^n - 1' }),
      ref: 'E.-M. Mehiri, On the restricted Hanoi graphs, arXiv:2304.03857',
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'four-peg', name: { zh: '4 柱', en: 'Four Pegs' },
      desc: { zh: '四根柱子。状态图 = Sierpinski 四面体的 2D 投影。Frame–Stewart 算法。', en: 'Four pegs. State graph = 2D projection of the Sierpinski tetrahedron. Frame–Stewart algorithm.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 4, step: 1, default: 1 }],
      build: fourPegBuild,
      formula: p => ({ states: '4^n', edges: 'Frame\text{-}Stewart' }),
      shortest: null
    },
    {
      id: 'magnetic', name: { zh: '磁铁', en: 'Magnetic' },
      desc: { zh: '相邻盘必须异极相对（奇偶盘极性不同），同极不能相邻。状态图是受限子图。', en: 'Adjacent disks must have opposite polarity (parity of disk index differs); equal poles cannot be neighbors. State graph is a restricted subgraph.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 1, max: 5, step: 1, default: 1 }],
      build: magneticBuild,
      formula: p => ({ states: '3^n', edges: '|E| = 3\\,2^{n-1}' }),
      ref: 'U. Levy, The Magnetic Tower of Hanoi, arXiv:1003.0225',
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'twin', name: { zh: '双子塔', en: 'Twin Towers' },
      desc: { zh: '两套 3 柱同步运行。移动盘时 A、B 两组同时移到同一目标柱，两处都必须合法。状态 = 每盘在两组的位置，共 9ⁿ 个。', en: 'Two coupled sets of 3 pegs run in sync. Moving a disk transfers it to the same target peg in both sets; both moves must be legal. State = position in both sets per disk, 9ⁿ total.' },
      params: [{ key: 'n', label: { zh: '每套盘数', en: 'Disks/set' }, min: 1, max: 3, step: 1, default: 1 }],
      build: twinBuild,
      formula: p => ({ states: '9^n', edges: 'E(n) = 3^n' }),
      ref: 'Z. Sunic, Twin Towers of Hanoi, arXiv:1108.4494',
      shortest: null
    },
    {
      id: 'weighted', name: { zh: '加权', en: 'Weighted' },
      desc: { zh: '经典规则，但柱间移动成本 = 柱距 |a−b|。粗边成本高，最短路径按加权计算（不再是最少步数）。', en: 'Classic rules, but moving between pegs costs the peg distance |a−b|. Thick edges are costly; shortest path is computed with weights (not minimal moves).' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 2, max: 6, step: 1, default: 2 }],
      build: weightedBuild,
      formula: p => ({ states: '3^n', edges: 'E(n) = 3\,E(n-1) + 3' }),
      ref: 'E.-M. Mehiri & H. Belbachir, The weighted Tower of Hanoi, arXiv:2208.06705',
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    },
    {
      id: 'forbidden', name: { zh: '禁止状态', en: 'Forbidden States' },
      desc: { zh: '最大盘不能放在中柱。某些状态被剔除，状态图是挖洞的子图。', en: 'The largest disk cannot rest on the middle peg. Some states are removed; the state graph is a subgraph with holes.' },
      params: [{ key: 'n', label: { zh: '盘数', en: 'Disks' }, min: 2, max: 5, step: 1, default: 2 }],
      build: forbiddenBuild,
      formula: p => ({ states: '2 \\cdot 3^{n-1}', edges: 'E(n) = 3\\,E(n-1) + 1' }),
      shortest: { start: [0, 0, 0], end: [2, 2, 2] }
    }
  ];
});