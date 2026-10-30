import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/iosStatusBar.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function setup({ ua = 'iPhone OS 18_7 Version/27.0', standalone = true, manifest = true, desktop = false, height = 844, screenHeight = height, safeTop = 0 } = {}) {
  const events = () => ({
    listeners: new Map(),
    addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); },
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); },
    emit(type) { for (const callback of this.listeners.get(type) || []) callback(); },
  });
  class Element {
    constructor(color = 'rgba(0, 0, 0, 0)') {
      this.attrs = new Map(); this.properties = new Map(); this.children = [];
      this.style = { cssText: '', backgroundColor: '', getPropertyValue: key => this.properties.get(key) || '', setProperty: (key, value) => this.properties.set(key, value), removeProperty: key => this.properties.delete(key) };
      this.computed = { backgroundColor: color, backgroundImage: 'none', opacity: '1', display: 'block', visibility: 'visible' };
      this.top = 0;
    }
    setAttribute(key, value) { this.attrs.set(key, value); }
    removeAttribute(key) { this.attrs.delete(key); }
    hasAttribute(key) { return this.attrs.has(key); }
    appendChild(child) { this.children.push(child); child.parentElement = this; }
    contains(child) { return child === this || this.children.some(node => node.contains(child)); }
    remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
    getBoundingClientRect() { return { top: this.top, bottom: this.top + 40 }; }
  }
  const root = new Element(); const body = new Element('rgb(247, 244, 237)'); const head = new Element();
  const header = new Element('rgb(24, 44, 64)');
  const viewport = { content: 'width=device-width, viewport-fit=cover' };
  const metas = [{ content: '#f7f4ed' }, { content: '#1d1813' }];
  let surfaces = [header]; let observer; let nextId = 0;
  const frames = new Map(); const hitTests = [];
  const document = Object.assign(events(), {
    documentElement: root, body, head, querySelector: () => viewport, querySelectorAll: () => metas,
    createElement: () => { const element = new Element(); element.computed.paddingTop = `${safeTop}px`; return element; }, elementsFromPoint: (x, y) => { hitTests.push(y); return surfaces; },
  });
  const window = Object.assign(events(), {
    innerWidth: 390, innerHeight: height, screen: { width: 390, height: screenHeight }, visualViewport: { height, scale: 1, offsetTop: 0 }, astrbotDesktop: { isDesktop: desktop },
    matchMedia: () => ({ matches: manifest }),
    requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window, document, Element,
    navigator: { userAgent: ua, platform: ua.includes('iPhone') ? 'iPhone' : '', maxTouchPoints: 1, standalone },
    getComputedStyle: element => element.computed,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
      observe() {} disconnect() { this.disconnected = true; }
    },
  });
  return {
    install: module.exports.installIOSStatusBar, root, body, header, head, viewport, metas, frames, hitTests, document, window, Element,
    layers: values => { surfaces = values; },
    mutate(record) { observer.callback([record]); },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    observer: () => observer,
  };
}

test('iOS 27 uses Safari version, contains manifest standalone and installs an empty clipped color sample', () => {
  const s = setup(); const cleanup = s.install();
  assert.ok(s.viewport.content.includes('viewport-fit=contain'));
  assert.equal(s.root.hasAttribute('data-ios-status-bar-contained'), true);
  assert.equal(s.body.children.length, 1);
  const edge = s.body.children[0];
  assert.ok(edge.style.cssText.includes('background-clip:text'));
  assert.ok(edge.style.cssText.includes('pointer-events:none'));
  assert.equal(edge.style.backgroundColor, 'rgb(24, 44, 64)');
  assert.equal(s.root.style.getPropertyValue('--astrbot-status-color'), 'rgb(24, 44, 64)');
  cleanup();
});

test('older iOS synchronizes its backing without changing cover or adding a color strip', () => {
  const s = setup({ ua: 'iPhone OS 18_7 Version/26.5' }); const cleanup = s.install();
  assert.ok(s.viewport.content.includes('viewport-fit=cover'));
  assert.equal(s.root.hasAttribute('data-ios-status-bar-contained'), false);
  assert.equal(s.body.children.length, 0);
  assert.equal(s.metas[0].content, 'rgb(24, 44, 64)');
  cleanup();
});

test('a frozen standalone UA retains cover even with a status-bar-sized native viewport deficit', () => {
  const s = setup({ ua: 'iPhone OS 18_7', height: 793, screenHeight: 852, safeTop: 59 });
  const cleanup = s.install();
  assert.equal(s.root.hasAttribute('data-ios-status-bar-contained'), false);
  assert.ok(s.viewport.content.includes('viewport-fit=cover'));
  assert.equal(s.body.children.length, 0);
  cleanup();
  assert.ok(s.viewport.content.includes('viewport-fit=cover'));
});

test('navigator.standalone web clips keep cover while browser tabs, Android and desktop are untouched', () => {
  const clip = setup({ manifest: false }); const cleanup = clip.install();
  assert.ok(clip.viewport.content.includes('viewport-fit=cover'));
  assert.equal(clip.body.children.length, 1); cleanup();
  for (const options of [{ standalone: false, manifest: false }, { ua: 'Android Version/27.0' }, { desktop: true }]) {
    const s = setup(options); s.install()();
    assert.equal(s.root.hasAttribute('data-ios-status-synced'), false);
    assert.equal(s.body.children.length, 0);
    assert.equal(s.metas[0].content, '#f7f4ed');
  }
});

test('transparent headers blend with their backing and gradients use their actual first stop', () => {
  const s = setup(); s.header.computed.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  s.layers([s.header, new s.Element('rgb(24, 44, 64)')]); const cleanup = s.install();
  assert.equal(s.metas[0].content, 'rgb(140, 150, 160)');
  s.header.computed.backgroundImage = 'linear-gradient(135deg, rgb(29, 24, 19) 0%, rgb(42, 35, 29) 100%)';
  s.mutate({ target: s.header, type: 'attributes', attributeName: 'class' }); s.flush();
  assert.equal(s.metas[0].content, 'rgb(29, 24, 19)'); cleanup();
});

test('page and theme changes update the color while streaming text and owned viewport styles do not schedule work', () => {
  const s = setup(); const cleanup = s.install();
  s.header.computed.backgroundColor = 'rgb(42, 35, 29)';
  s.mutate({ target: s.header, type: 'attributes', attributeName: 'class' }); s.flush();
  assert.equal(s.metas[0].content, 'rgb(42, 35, 29)');
  const message = new s.Element(); message.top = 200;
  s.mutate({ target: message, type: 'attributes', attributeName: 'style' });
  s.mutate({ target: message, type: 'childList', addedNodes: [{}], removedNodes: [] });
  s.mutate({ target: s.root, type: 'attributes', attributeName: 'style' });
  assert.equal(s.frames.size, 0); cleanup();
});

test('status color samples the physical top canvas instead of the inset page or a generated color band', () => {
  const s = setup({ ua: 'iPhone OS 18_7 Version/26.5' });
  s.root.style.setProperty('--astrbot-safe-top', '62px'); s.header.top = 62;
  const canvas = new s.Element('rgb(29, 24, 19)');
  canvas.getBoundingClientRect = () => ({ top: 0, bottom: 844 });
  s.document.elementsFromPoint = (x, y) => {
    s.hitTests.push(y);
    return y < 62 ? [canvas] : [s.header, canvas];
  };
  const cleanup = s.install();
  assert.equal(s.hitTests.at(-1), 1);
  assert.equal(s.metas[0].content, 'rgb(29, 24, 19)');
  canvas.computed.backgroundColor = 'rgb(247, 244, 237)';
  s.mutate({ target: canvas, type: 'attributes', attributeName: 'class' }); s.flush();
  assert.equal(s.metas[0].content, 'rgb(247, 244, 237)');
  s.root.style.setProperty('--astrbot-safe-top', '0px');
  s.mutate({ target: s.root, type: 'attributes', attributeName: 'style' });
  assert.equal(s.frames.size, 0); cleanup();
});

test('removing a sampled backdrop from a zero-height overlay host restores native chrome color', () => {
  const s = setup();
  const host = new s.Element(); host.getBoundingClientRect = () => ({ top: 0, bottom: 0 });
  const overlay = new s.Element(); const scrim = new s.Element('rgba(10, 8, 6, 0.5)');
  overlay.appendChild(scrim); host.appendChild(overlay);
  s.layers([scrim, s.header]); const cleanup = s.install();
  assert.notEqual(s.metas[0].content, 'rgb(24, 44, 64)');
  s.layers([s.header]);
  s.mutate({ target: host, type: 'childList', addedNodes: [], removedNodes: [overlay] });
  assert.equal(s.frames.size, 1);
  s.flush();
  assert.equal(s.metas[0].content, 'rgb(24, 44, 64)');
  cleanup();
});

test('duplicate installation is inert and cleanup restores metadata and releases scheduled work', () => {
  const s = setup(); const cleanup = s.install(); const duplicate = s.install(); duplicate();
  assert.equal(s.body.children.length, 1);
  s.window.emit('pageshow'); assert.equal(s.frames.size, 1); cleanup();
  assert.equal(s.frames.size, 0); assert.equal(s.observer().disconnected, true);
  assert.equal(s.body.children.length, 0); assert.ok(s.viewport.content.includes('viewport-fit=cover'));
  assert.equal(s.root.hasAttribute('data-ios-status-bar-contained'), false);
  assert.equal(s.root.hasAttribute('data-ios-status-synced'), false);
  assert.equal(s.root.style.getPropertyValue('--astrbot-status-color'), '');
  assert.deepEqual(s.metas.map(meta => meta.content), ['#f7f4ed', '#1d1813']);
  for (const target of [s.document, s.window]) assert.equal([...target.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
});
