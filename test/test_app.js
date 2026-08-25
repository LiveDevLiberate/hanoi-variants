/* test_app.js — 集成测试: 模拟浏览器环境验证 app.js 流程 */
const assert = require('assert');

// ---- 最小 DOM stub ----
function createElement() {
  return {
    style: {}, dataset: {}, classList: { add(){}, remove(){} },
    innerHTML: '', textContent: '', value: '', checked: true,
    appendChild() {}, remove() {}, addEventListener() {},
    querySelector() { return { addEventListener(){}, textContent:'', checked:true }; },
  };
}
const elements = {};
function getEl(id) {
  if (!elements[id]) elements[id] = createElement();
  return elements[id];
}
global.document = {
  getElementById: getEl,
  createElement,
  addEventListener() {},
};
global.window = global;

// ---- 最小 d3 stub (链式 API) ----
function makeSel() {
  const sel = {
    data() { return makeSel(); },
    enter() { return makeSel(); },
    append() { return makeSel(); },
    attr() { return makeSel(); },
    style() { return makeSel(); },
    text() { return makeSel(); },
    selectAll() { return makeSel(); },
    remove() { return makeSel(); },
  };
  return sel;
}
global.d3 = {
  select() { return makeSel(); },
};

// ---- 加载模块 (浏览器全局) ----
globalThis.HanoiCore = require('../js/core.js');
globalThis.HanoiVariants = require('../js/variants.js');
globalThis.HanoiRender = require('../js/render.js');
globalThis.HanoiApp = require('../js/app.js');

const Core = globalThis.HanoiCore;
const Variants = global.HanoiVariants;
const App = global.HanoiApp;

// 7 个变体注册齐全
assert.strictEqual(Variants.length, 7);
const ids = Variants.map(v => v.id);
assert.deepStrictEqual(ids,
  ['classic', 'same-disk', 'oneway', 'linear', 'four-peg', 'magnetic', 'forbidden']);

// 每个变体有 build/formula/params
for (const v of Variants) {
  assert.strictEqual(typeof v.build, 'function', `${v.id} build`);
  assert.strictEqual(typeof v.formula, 'function', `${v.id} formula`);
  assert.ok(Array.isArray(v.params) && v.params.length > 0, `${v.id} params`);
}

// 每个变体在默认参数下 build 不崩溃, 坐标无 NaN
for (const v of Variants) {
  const p = {};
  v.params.forEach(pp => { p[pp.key] = pp.default; });
  const data = v.build(p);
  assert.ok(data.states.length > 0, `${v.id} states`);
  assert.ok(Array.isArray(data.coords) && data.coords.length === data.states.length,
    `${v.id} coords`);
  for (const c of data.coords) {
    assert.ok(Number.isFinite(c[0]) && Number.isFinite(c[1]), `${v.id} NaN coord`);
  }
  // edges 结构合法
  for (const e of data.edges) {
    if (data.directed) {
      assert.strictEqual(typeof e.from, 'number', `${v.id} edge.from`);
      assert.strictEqual(typeof e.to, 'number', `${v.id} edge.to`);
    } else {
      assert.ok(Array.isArray(e) && e.length === 2, `${v.id} edge pair`);
    }
  }
}

// app.js 完整流程: init + 7 变体切换 + rebuild
App.init();
for (const v of Variants) {
  App.selectVariant(v.id);
  App.rebuild();
}
// 切回 classic
App.selectVariant('classic');
App.rebuild();

console.log('✓ test_app 全部通过 (7 变体流程 + 坐标无 NaN + 渲染调用)');