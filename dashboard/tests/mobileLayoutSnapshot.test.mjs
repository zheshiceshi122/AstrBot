import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/mobileLayoutSnapshot.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function setup({ brokenProbe = false } = {}) {
  let probes = 0;
  const forbidden = () => { throw Error('Private data must not be read'); };
  const root = {
    dataset: { mobileKeyboard: 'false' },
    hasAttribute: () => false,
    getBoundingClientRect: () => ({ top: 0, bottom: 793, width: 393, height: 793 }),
    clientHeight: 793, scrollHeight: 793,
  };
  for (const property of ['textContent', 'innerText', 'value']) Object.defineProperty(root, property, { get: forbidden });
  const document = {
    documentElement: root,
    body: { appendChild() { probes++; } },
    createElement: () => ({ probe: true, style: {}, getBoundingClientRect() { return { height: this.style.height === '100lvh' ? 852 : 793 }; }, remove() { probes--; } }),
    querySelector: selector => selector.startsWith('meta') ? { content: 'width=device-width,viewport-fit=cover' } : root,
  };
  const properties = { '--astrbot-viewport-height': '793px', '--astrbot-vv-height': '793px', '--astrbot-vv-offset-top': '0px', '--astrbot-safe-top': '59px', '--astrbot-safe-bottom': '0px' };
  const getComputedStyle = element => {
    if (element.probe && brokenProbe) throw Error('Unavailable geometry');
    return { paddingTop: '59px', paddingBottom: element.probe ? '34px' : '0px', display: 'flex', position: 'relative', getPropertyValue: key => properties[key] || '' };
  };
  const navigator = { standalone: true }; Object.defineProperty(navigator, 'userAgent', { get: forbidden });
  const window = {
    screen: { width: 393, height: 852 }, devicePixelRatio: 3, innerWidth: 393, innerHeight: 793, scrollX: 0, scrollY: 0,
    visualViewport: { width: 393, height: 793, offsetTop: 0, offsetLeft: 0, scale: 1 },
    navigator, matchMedia: () => ({ matches: true }),
    fetch: forbidden,
  };
  Object.defineProperty(window, 'location', { get: forbidden });
  Object.defineProperty(window, 'localStorage', { get: forbidden });
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, window, document, getComputedStyle, fetch: forbidden });
  return { read: module.exports.readMobileLayoutSnapshot, probes: () => probes };
}

test('layout collection runs only on invocation and reports raw versus published insets without private data', () => {
  const s = setup();
  assert.equal(s.probes(), 0);
  const snapshot = s.read();
  assert.equal(snapshot.screen.height, 852);
  assert.equal(snapshot.cssViewportHeights['100lvh'], 852);
  assert.equal(snapshot.cssViewportHeights['100dvh'], 793);
  assert.equal(snapshot.visualViewport.height, 793);
  assert.equal(snapshot.safeArea.environment.bottom, 34);
  assert.equal(snapshot.safeArea.published['--astrbot-safe-bottom'], '0px');
  assert.equal(snapshot.safeArea.published['--astrbot-safe-top'], '59px');
  assert.equal(snapshot.elements['.mobile-bottom-navigation'].bottom, 793);
  assert.equal(s.probes(), 0);
  assert.ok(JSON.stringify(snapshot).length > 0);
});

test('a failed manual measurement always removes its temporary geometry probe', () => {
  const s = setup({ brokenProbe: true });
  assert.throws(s.read, /Unavailable geometry/);
  assert.equal(s.probes(), 0);
});
