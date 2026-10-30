import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

const source = readFileSync(new URL('../src/layouts/full/FullLayout.vue', import.meta.url), 'utf8');
const { descriptor } = parse(source);
const ast = ts.createSourceFile('FullLayout.ts', descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
const declaration = ast.statements
  .filter(ts.isVariableStatement)
  .flatMap(statement => [...statement.declarationList.declarations])
  .find(item => item.name.getText(ast) === 'showMobileBottomNavigation');
assert.ok(declaration?.initializer);
const code = ts.transpileModule(`result = ${declaration.initializer.getText(ast)}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

test('all three peer Bot tabs retain primary navigation after returning from a detail page', () => {
  const route = { path: '/config', hash: '' };
  const scope = { route, mobileNavigation: { value: true }, computed: getter => ({ get value() { return getter(); } }) };
  vm.runInNewContext(code, scope);
  assert.equal(scope.result.value, false);
  for (const path of ['/platforms', '/session-management', '/cron', '/session-management', '/platforms']) {
    route.path = path;
    assert.equal(scope.result.value, true, path);
  }
});

test('secondary settings and extension pages remain full height, and returning home restores navigation', () => {
  const route = { path: '/settings', hash: '' };
  const scope = { route, mobileNavigation: { value: true }, computed: getter => ({ get value() { return getter(); } }) };
  vm.runInNewContext(code, scope);
  assert.equal(scope.result.value, true);
  route.hash = '#settings-appearance';
  assert.equal(scope.result.value, false);
  route.hash = '';
  for (const path of ['/config', '/providers', '/extension/plugins', '/extension/plugins/market']) {
    route.path = path;
    assert.equal(scope.result.value, false, path);
  }
  for (const path of ['/settings', '/extensions', '/data/trace']) {
    route.path = path;
    assert.equal(scope.result.value, true, path);
  }
  scope.mobileNavigation.value = false;
  assert.equal(scope.result.value, false);
});
