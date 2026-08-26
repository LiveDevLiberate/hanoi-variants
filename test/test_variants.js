const assert = require('assert');
const HanoiCore = require('../js/core.js');
const HanoiVariants = require('../js/variants.js');

function counts(id, params) {
  const v = HanoiVariants.find(x => x.id === id);
  const r = v.build(params);
  return { states: r.states.length, edges: r.edges.length };
}

// 经典 n=2: 9/12, n=3: 27/39
assert.deepStrictEqual(counts('classic', { n: 2 }), { states: 9, edges: 12 });
assert.deepStrictEqual(counts('classic', { n: 3 }), { states: 27, edges: 39 });

// 相同碟片 N=2,nl=2: 36/63; N=3,nl=2: 100/198
assert.deepStrictEqual(counts('same-disk', { N: 2, nl: 2 }), { states: 36, edges: 63 });
assert.deepStrictEqual(counts('same-disk', { N: 3, nl: 2 }), { states: 100, edges: 198 });

// 单向循环 n=3: 27 状态, 39 有向边 (CW, Wolfram 权威验证)
const ow = HanoiVariants.find(x => x.id === 'oneway').build({ n: 3 });
assert.strictEqual(ow.states.length, 27);
assert.strictEqual(ow.edges.length, 39);
assert.ok(ow.edges.every(e => typeof e.from === 'number' && typeof e.to === 'number'));
assert.ok(ow.edges.every(e => {
  const a = ow.states[e.from], b = ow.states[e.to];
  const diffIdx = a.findIndex((v, i) => v !== b[i]);
  return diffIdx >= 0 && b[diffIdx] === (a[diffIdx] + 1) % 3;
}));

// 线性 n=2: 9/8; n=3: 27/26
assert.deepStrictEqual(counts('linear', { n: 2 }), { states: 9, edges: 8 });
assert.deepStrictEqual(counts('linear', { n: 3 }), { states: 27, edges: 26 });

// 双子塔 n=1: 9/24有向; n=2: 81/252 (有向边, 无向化后 21/222 与 Wolfram 一致)
assert.deepStrictEqual(counts('twin', { n: 1 }), { states: 9, edges: 24 });
assert.deepStrictEqual(counts('twin', { n: 2 }), { states: 81, edges: 252 });

// 加权 n=3: 27/39 (同经典, 边带权重)
assert.deepStrictEqual(counts('weighted', { n: 3 }), { states: 27, edges: 39 });

// 星形 n=2: 9/8; n=3: 27/26; n=4: 81/80 (Wolfram 验证: E = 3^n - 1)
assert.deepStrictEqual(counts('star', { n: 2 }), { states: 9, edges: 8 });
assert.deepStrictEqual(counts('star', { n: 3 }), { states: 27, edges: 26 });
assert.deepStrictEqual(counts('star', { n: 4 }), { states: 81, edges: 80 });

// 磁铁 n=2: 9/12; n=3: 21/24 (过滤同极相邻非法状态, Wolfram 权威验证)
assert.deepStrictEqual(counts('magnetic', { n: 2 }), { states: 9, edges: 12 });
assert.deepStrictEqual(counts('magnetic', { n: 3 }), { states: 21, edges: 24 });

// 禁止 (最大盘禁中柱) n=2: 6/7; n=3: 18/25
assert.deepStrictEqual(counts('forbidden', { n: 2 }), { states: 6, edges: 7 });
assert.deepStrictEqual(counts('forbidden', { n: 3 }), { states: 18, edges: 25 });

// 最短路径: classic n=3, 000→222 应为 7 步
const cl = HanoiVariants.find(x => x.id === 'classic').build({ n: 3 });
const sp = HanoiCore.shortestPath(cl.adj, 0, cl.states.length - 1);
assert.strictEqual(sp.length - 1, 7);

// 4柱 sanity: n=2 → 16 状态
const f4 = HanoiVariants.find(x => x.id === 'four-peg').build({ n: 2 });
assert.strictEqual(f4.states.length, 16);

console.log('✓ test_variants 全部通过');