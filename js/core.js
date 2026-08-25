/* core.js — 汉诺塔状态图共享逻辑 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const deepTheme = { bg: '#000000', edge: '#ffffff', node: '#ffd700', text: '#ffffff' };

  // 枚举所有状态: state[i] = 盘 i 所在柱 (0 基), 长度 n, p 根柱
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
    return states;
  }

  // 每柱顶部盘 (返回数组, 柱号→盘号, Infinity=空)
  function topOf(state) {
    const t = [Infinity, Infinity, Infinity, Infinity];
    for (let i = 0; i < state.length; i++) {
      const p = state[i];
      if (t[p] === Infinity) t[p] = i;
    }
    return t;
  }

  // 单盘移动判定 (经典规则 + 变体约束)
  // opts: { moveRule: 'classic'|'oneway'|'linear'|'magnetic', forbidden: {test} }
  function tryMove(s, lv, dest, opts) {
    opts = opts || {};
    const a = s[lv];
    if (a === dest) return null;
    const tp = topOf(s);
    if (tp[a] < lv) return null;
    if (tp[dest] < lv) return null;
    if (opts.moveRule === 'oneway' && dest !== (a + 1) % 3) return null;
    if (opts.moveRule === 'linear' && Math.abs(a - dest) !== 1) return null;
    if (opts.moveRule === 'magnetic' && tp[dest] !== Infinity
        && (tp[dest] % 2) === (lv % 2)) return null;
    const ns = s.slice();
    ns[lv] = dest;
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

  // 构建邻接表: ruleFn(s, lv, dest) -> 新状态或 null
  function buildAdjacency(states, ruleFn) {
    const adj = states.map(() => []);
    const n = states[0].length;
    const idx = new Map(states.map((s, i) => [s.join(','), i]));
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      for (let lv = 0; lv < n; lv++) {
        for (let dest = 0; dest < 4; dest++) {
          const ns = ruleFn(s, lv, dest);
          if (!ns) continue;
          const ni = idx.get(ns.join(','));
          if (ni !== undefined && ni !== i && !adj[i].includes(ni)) adj[i].push(ni);
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

  // barycentric 布局 (3柱): 最大盘权重 1/2, 依次减半, 末尾质心剩余
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