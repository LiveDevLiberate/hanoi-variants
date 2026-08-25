const assert = require('assert');
const HanoiCore = require('../js/core.js');

// 经典枚举: 3盘 → 27 状态
assert.strictEqual(HanoiCore.enumStates(3, 3).length, 27);
assert.strictEqual(HanoiCore.enumStates(2, 3).length, 9);

// barycentric: 坐标验证 (000 → [1/48, 1/48], 222 → [11/24, 1/48 + 7√3/16])
const states3 = HanoiCore.enumStates(3, 3);
const coords = HanoiCore.barycentric(states3);
assert.strictEqual(coords.length, 27);
assert.ok(Math.abs(coords[0][0] - 1/48) < 1e-9);
assert.ok(Math.abs(coords[0][1] - 1/48) < 1e-9);
assert.ok(Math.abs(coords[26][0] - 11/24) < 1e-9);
assert.ok(Math.abs(coords[26][1] - (1/48 + 7*Math.sqrt(3)/16)) < 1e-9);

// 经典移动判定
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'classic'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'classic'}), true);
assert.strictEqual(HanoiCore.canMove([1,0,0], [0,0,0], {moveRule:'classic'}), true);
assert.strictEqual(HanoiCore.canMove([1,1,0], [0,1,0], {moveRule:'classic'}), true);
assert.strictEqual(HanoiCore.canMove([1,1,1], [2,1,1], {moveRule:'classic'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,1], [0,1,1], {moveRule:'classic'}), false); // 盘2非顶

// 单向循环
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'oneway'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'oneway'}), false); // 2不是0+1
assert.strictEqual(HanoiCore.canMove([2,0,0], [0,0,0], {moveRule:'oneway'}), true); // 0=(2+1)mod3

// 线性相邻
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'linear'}), true);
assert.strictEqual(HanoiCore.canMove([0,0,0], [2,0,0], {moveRule:'linear'}), false);

// 磁铁: 同奇偶不能叠
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'magnetic'}), true); // 盘1(奇)放空柱
assert.strictEqual(HanoiCore.canMove([0,1,0], [1,1,0], {moveRule:'magnetic'}), true);  // 盘1(奇)→柱1(顶盘2偶)
assert.strictEqual(HanoiCore.canMove([1,1,0], [1,1,1], {moveRule:'magnetic'}), false); // 盘3(奇)→柱1(顶盘1奇) 同奇偶
assert.strictEqual(HanoiCore.canMove([1,2,0], [2,2,0], {moveRule:'magnetic'}), true);  // 盘1(奇)→柱2(顶盘2偶)
assert.strictEqual(HanoiCore.canMove([0,0,2], [2,0,2], {moveRule:'magnetic'}), false); // 盘1(奇)→柱2(顶盘3奇) 同奇偶

// 禁止: 最大盘(盘n)不能在中柱(柱1)。n=3 时最大盘是盘3 (索引2)
const forbidTest = { test: s => s[2] === 1 };
assert.strictEqual(HanoiCore.canMove([0,0,0], [1,0,0], {moveRule:'classic', forbidden:forbidTest}), true);
// [0,0,2]: 盘3在柱2(顶部), 移到柱1 → 结果盘3在柱1 → 触发 forbidden → false
assert.strictEqual(HanoiCore.canMove([0,0,2], [0,0,1], {moveRule:'classic', forbidden:forbidTest}), false);
// [2,0,0]: 盘2在柱0(顶部), 移到柱1 → 盘3仍在柱0, 不触发 forbidden → true
assert.strictEqual(HanoiCore.canMove([2,0,0], [2,1,0], {moveRule:'classic', forbidden:forbidTest}), true);

// 最短路径: 经典 2盘 000→222 应为 3 步
const st2 = HanoiCore.enumStates(2, 3);
const adj2 = HanoiCore.buildAdjacency(st2, (s, lv, dest) => HanoiCore.tryMove(s, lv, dest, {moveRule:'classic'}));
const path = HanoiCore.shortestPath(adj2, 0, 8);
assert.strictEqual(path.length - 1, 3);

// 无向边数: 经典 2盘 12 边
assert.strictEqual(HanoiCore.countEdges(adj2), 12);

console.log('✓ test_core 全部通过');