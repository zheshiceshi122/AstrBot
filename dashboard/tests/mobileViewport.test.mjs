import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/composables/useMobileViewport.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ standalone = false, contained = false, height = 844, largeHeight = height, safeTop = 0, safeBottom = 0, ua = 'iPhone OS 18_6' } = {}) {
  let now = 0, nextId = 0, mounted, unmounted;
  const timers = new Map();
  const events = () => ({
    listeners: new Map(),
    addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(listener); },
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); },
    emit(type, event = {}) { for (const listener of this.listeners.get(type) || []) listener(event); },
  });
  const properties = new Map();
  const root = {
    dataset: {},
    style: { setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key) },
    hasAttribute: name => contained && name === 'data-ios-status-bar-contained',
  };
  const document = Object.assign(events(), {
    documentElement: root, activeElement: null, body: { appendChild() {} },
    createElement: () => ({ style: {}, getBoundingClientRect: () => ({ height: largeHeight }), remove() {} }), querySelectorAll: () => [],
  });
  class HTMLElement {
    constructor(tagName = 'DIV') { this.tagName = tagName; this.isContentEditable = false; this.parentElement = null; this.reveals = 0; this.scrolls = []; this.scrollTop = 0; }
    closest(selector) { return selector.split(',').some(part => part.trim() === this.tagName.toLowerCase()) ? this : null; }
    getBoundingClientRect() { return { top: 100, bottom: 140 }; }
    scrollIntoView() { this.reveals++; }
    scrollTo(options) { this.scrolls.push(options); this.scrollTop = options.top; }
    focus() { document.activeElement = this; document.emit('focusin', { target: this }); }
    blur() { document.activeElement = null; document.emit('focusout', { target: this }); }
  }
  class HTMLInputElement extends HTMLElement {
    constructor(type = 'text') { super('INPUT'); this.type = type; this.disabled = false; this.readOnly = false; }
  }
  class HTMLTextAreaElement extends HTMLElement {
    constructor() { super('TEXTAREA'); this.disabled = false; this.readOnly = false; }
  }
  const viewport = Object.assign(events(), { height, offsetTop: 0, scale: 1 });
  const pageScrolls = [];
  const window = Object.assign(events(), {
    innerWidth: 390, innerHeight: height, visualViewport: viewport,
    matchMedia: query => ({ matches: query.includes('standalone') ? standalone : window.innerWidth < 960 }),
    setTimeout(callback, delay) { const id = ++nextId; timers.set(id, { callback, time: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { return this.setTimeout(callback, 16); },
    cancelAnimationFrame(id) { timers.delete(id); }, scrollTo(options) { pageScrolls.push(options); },
    getComputedStyle: element => ({ overflowY: element.overflowY, paddingTop: `${safeTop}px`, paddingBottom: `${safeBottom}px`, getPropertyValue: () => '' }),
  });
  window.navigator = { standalone };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window, document,
    navigator: { userAgent: ua, platform: ua.includes('iPhone') ? 'iPhone' : '', maxTouchPoints: 1 },
    HTMLElement, HTMLInputElement, HTMLTextAreaElement, getComputedStyle: window.getComputedStyle,
    require: name => {
      assert.equal(name, 'vue');
      return { ref: value => ({ value }), onMounted: callback => { mounted = callback; }, onBeforeUnmount: callback => { unmounted = callback; } };
    },
  });
  const hook = module.exports.useMobileViewport();
  function tick(duration = 400) {
    const end = now + duration;
    while (true) {
      const pending = [...timers.entries()].filter(([, task]) => task.time <= end).sort((a, b) => a[1].time - b[1].time)[0];
      if (!pending) break;
      const [id, task] = pending; timers.delete(id); now = task.time; task.callback();
    }
    now = end;
  }
  mounted(); tick();
  return {
    hook, root, properties, document, window, viewport, timers, tick, pageScrolls, HTMLElement, HTMLInputElement, HTMLTextAreaElement,
    resize(values) { Object.assign(viewport, values); viewport.emit('resize'); tick(); },
    safeArea(top, bottom) { safeTop = top; safeBottom = bottom; },
    largeViewport(value) { largeHeight = value; },
    unmount: () => unmounted(),
  };
}

test('switches, readonly controls and text focus without an OSK leave navigation/save state visible', () => {
  const s = setup();
  for (const field of [new s.HTMLInputElement('checkbox'), new s.HTMLInputElement('radio'), new s.HTMLInputElement('color'), new s.HTMLElement('SELECT'), new s.HTMLInputElement('text')]) {
    field.focus(); s.document.emit('pointerdown', { target: field }); s.tick();
    assert.equal(s.hook.keyboardOpen.value, false);
    assert.equal(s.root.dataset.mobileEditing, undefined);
    assert.equal(s.root.dataset.mobileKeyboard, undefined);
  }
  const readonly = new s.HTMLInputElement(); readonly.readOnly = true; readonly.focus(); s.tick();
  assert.equal(s.root.dataset.mobileEditing, undefined);
  s.unmount();
});

test('confirmed keyboard resize and dismissal restore the original height while focus remains', () => {
  const s = setup(); const input = new s.HTMLTextAreaElement(); input.focus();
  s.resize({ height: 500 });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '500px');
  assert.equal(s.root.dataset.mobileKeyboard, 'true');
  assert.equal(input.reveals, 0);
  s.resize({ height: 844 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.root.dataset.mobileKeyboard, undefined);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '844px');
  assert.equal(s.document.activeElement, input);
  s.unmount();
});

test('resizes-content keyboards are detected even when both viewport heights shrink together', () => {
  const s = setup(); const input = new s.HTMLInputElement(); input.focus();
  s.window.innerHeight = 500; s.resize({ height: 500 });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '500px');
  s.window.innerHeight = 844; s.resize({ height: 844 });
  assert.equal(s.hook.keyboardOpen.value, false);
  s.unmount();
});

test('browser toolbar changes and rotation do not become resizes-content keyboards', () => {
  const s = setup(); const input = new s.HTMLInputElement(); input.focus();
  s.window.innerHeight = 784; s.resize({ height: 784 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '784px');
  s.window.innerWidth = 844; s.window.innerHeight = 390; s.resize({ height: 390 });
  assert.equal(s.hook.keyboardOpen.value, false);
  s.unmount();
});

test('pinch zoom does not resize the shell or enter keyboard mode', () => {
  const s = setup();
  s.resize({ height: 422, scale: 2, offsetTop: 40 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '844px');
  s.resize({ height: 844, scale: 1, offsetTop: 0 });
  assert.equal(s.properties.get('--astrbot-vv-height'), '844px');
  s.unmount();
});

test('standalone keyboard animation does not lower the expanded viewport baseline on each frame', () => {
  const s = setup({ standalone: true, height: 874, safeTop: 62, safeBottom: 34 });
  const input = new s.HTMLInputElement(); input.focus();
  for (const height of [830, 770, 700, 620, 550, 476]) s.resize({ height });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '476px');
  assert.equal(s.root.dataset.mobileKeyboard, 'true');
  for (const height of [550, 620, 700, 770, 830, 874]) s.resize({ height });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '874px');
  s.unmount();
});

test('contained startup discards cover insets once without consuming keyboard animation as settling', () => {
  const s = setup({ standalone: true, contained: true, height: 874, safeTop: 62, safeBottom: 34 });
  s.safeArea(0, 0); s.resize({ height: 874 }); s.resize({ height: 812 });
  assert.equal(s.properties.get('--astrbot-safe-top'), '0px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  assert.equal(s.properties.get('--astrbot-viewport-height'), '812px');
  const input = new s.HTMLInputElement(); input.focus();
  for (const height of [770, 700, 620, 550, 476]) s.resize({ height });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '476px');
  s.resize({ height: 812 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '812px');
  s.unmount();
});

test('contained cold start remeasures stale cover insets even without a resize event', () => {
  const s = setup({ standalone: true, contained: true, height: 874, safeTop: 62, safeBottom: 34 });
  // The viewport-fit change can settle without notifying either resize listener.
  s.safeArea(0, 0);
  s.viewport.height = 812;
  s.window.innerHeight = 812;
  s.tick(1200);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '812px');
  assert.equal(s.properties.get('--astrbot-safe-top'), '0px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  assert.equal(s.hook.keyboardOpen.value, false);
  s.unmount();
});

test('an already-contained viewport never consumes the first focused keyboard frames as startup settling', () => {
  const s = setup({ standalone: true, contained: true, height: 812 });
  const input = new s.HTMLInputElement(); input.focus();
  for (const height of [770, 700, 620, 550, 476]) s.resize({ height });
  assert.equal(s.hook.keyboardOpen.value, true);
  s.resize({ height: 812 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '812px');
  s.unmount();
});

test('pinching with the keyboard already visible retains its last confirmed geometry', () => {
  const s = setup(); const input = new s.HTMLInputElement(); input.focus(); s.resize({ height: 500 });
  const reveals = input.reveals;
  s.resize({ height: 250, scale: 2 }); input.focus(); s.tick();
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '500px');
  assert.equal(input.reveals, reveals);
  s.resize({ height: 500, scale: 1 }); s.resize({ height: 844 });
  assert.equal(s.hook.keyboardOpen.value, false);
  s.unmount();
});

test('standalone panning is corrected instantly without inheriting root smooth scrolling', () => {
  const s = setup({ standalone: true });
  s.resize({ height: 476, offsetTop: 80 });
  assert.ok(s.pageScrolls.length > 0);
  for (const options of s.pageScrolls) {
    assert.equal(options.top, 0);
    assert.equal(options.behavior, 'instant');
  }
  s.unmount();
});

test('input reveal scrolls only its nearest scroll container and leaves the document alone', () => {
  const s = setup(); const input = new s.HTMLInputElement(); const scroller = new s.HTMLElement();
  Object.assign(scroller, { overflowY: 'auto', scrollHeight: 1200, clientHeight: 450 });
  scroller.getBoundingClientRect = () => ({ top: 40, bottom: 500 });
  input.parentElement = scroller;
  input.getBoundingClientRect = () => ({ top: 700, bottom: 740 });
  input.focus(); s.resize({ height: 500 });
  assert.equal(input.reveals, 0);
  assert.equal(s.pageScrolls.length, 0);
  assert.equal(scroller.scrollTop, 256);
  assert.equal(scroller.scrolls[0].behavior, 'instant');
  s.unmount();
});

test('closing the keyboard before the reveal delay cancels pending input movement', () => {
  const s = setup(); const input = new s.HTMLInputElement(); const scroller = new s.HTMLElement();
  Object.assign(scroller, { overflowY: 'auto', scrollHeight: 1200, clientHeight: 450 });
  input.parentElement = scroller;
  input.getBoundingClientRect = () => ({ top: 900, bottom: 940 });
  input.focus(); s.viewport.height = 500; s.viewport.emit('resize'); s.tick(16);
  assert.equal(s.hook.keyboardOpen.value, true);
  s.resize({ height: 844 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(scroller.scrolls.length, 0);
  assert.equal(input.reveals, 0);
  s.unmount();
});

test('standalone rotation replaces the height baseline and remeasures safe areas', () => {
  const s = setup({ standalone: true, height: 874, safeTop: 62, safeBottom: 34 });
  s.window.innerWidth = 874; s.largeViewport(390); s.safeArea(0, 21); s.window.emit('orientationchange'); s.resize({ height: 390 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '390px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  assert.equal(s.hook.portrait.value, false);
  s.unmount();
});

test('a wide portrait phone stays in portrait navigation when its keyboard leaves less height than width', () => {
  const s = setup({ standalone: true });
  s.window.innerWidth = 430; s.largeViewport(874); s.resize({ height: 874 });
  assert.equal(s.hook.portrait.value, true);
  s.window.innerHeight = 380; s.resize({ height: 380 });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.hook.portrait.value, true);
  s.unmount();
});

test('zero system insets do not manufacture a second 44px status-bar space', () => {
  const s = setup({ standalone: true, height: 812 });
  assert.equal(s.properties.get('--astrbot-safe-top'), '0px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  assert.equal(s.properties.get('--astrbot-viewport-height'), '812px');
  s.unmount();
});

test('measured iPhone cover geometry uses the large canvas without confusing its 59px deficit with a keyboard', () => {
  const s = setup({ standalone: true, height: 793, largeHeight: 852, safeTop: 59, safeBottom: 34 });
  assert.equal(s.properties.get('--astrbot-viewport-height'), '852px');
  assert.equal(s.properties.get('--astrbot-vv-height'), '793px');
  assert.equal(s.properties.get('--astrbot-safe-top'), '59px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  const input = new s.HTMLInputElement(); input.focus(); s.tick();
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '852px');
  for (const height of [740, 660, 550, 476]) s.resize({ height });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '476px');
  s.resize({ height: 793 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '852px');
  s.unmount();
});

test('large cover canvas sizing does not expand contained mode, browser tabs or Android', () => {
  for (const options of [{ standalone: true, contained: true }, { standalone: false }, { standalone: true, ua: 'Android' }, { standalone: true, largeHeight: 0 }]) {
    const s = setup({ height: 793, largeHeight: 852, ...options });
    assert.equal(s.properties.get('--astrbot-viewport-height'), '793px');
    assert.equal(s.hook.keyboardOpen.value, false);
    s.unmount();
  }
});

test('removing bottom safe-area spacing preserves top spacing and viewport height through keyboard resizing', () => {
  const s = setup({ standalone: true, height: 844, safeTop: 62, safeBottom: 34 });
  assert.equal(s.properties.get('--astrbot-viewport-height'), '844px');
  assert.equal(s.properties.get('--astrbot-safe-top'), '62px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  const input = new s.HTMLInputElement(); input.focus();
  s.safeArea(0, 0); s.window.innerHeight = 476; s.window.emit('resize'); s.resize({ height: 476 });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-safe-top'), '62px');
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  s.window.innerHeight = 844; s.window.emit('resize'); s.resize({ height: 844 });
  assert.equal(s.hook.keyboardOpen.value, false);
  assert.equal(s.properties.get('--astrbot-safe-bottom'), '0px');
  assert.equal(s.properties.get('--astrbot-viewport-height'), '844px');
  s.unmount();
});

test('an empty transient visual viewport does not reopen navigation or collapse the shell between keyboard frames', () => {
  const s = setup({ standalone: true }); const input = new s.HTMLInputElement(); input.focus();
  s.resize({ height: 476 }); s.resize({ height: 0 });
  assert.equal(s.hook.keyboardOpen.value, true);
  assert.equal(s.properties.get('--astrbot-viewport-height'), '476px');
  assert.equal(s.properties.get('--astrbot-vv-height'), '476px');
  s.resize({ height: 844 }); assert.equal(s.hook.keyboardOpen.value, false);
  s.unmount();
});

test('a status-bar-sized change in standalone resting height does not latch keyboard state', () => {
  for (const focusState of ['focused', 'blurred', 'unmounted']) {
    const s = setup({ standalone: true, height: 852, largeHeight: 852, safeTop: 59, safeBottom: 34 });
    s.resize({ height: 793 });
    assert.equal(s.hook.keyboardOpen.value, false);
    for (let round = 0; round < 2; round++) {
      const input = new s.HTMLInputElement(); input.focus();
      s.window.innerHeight = 476; s.resize({ height: 476 });
      assert.equal(s.hook.keyboardOpen.value, true);
      if (focusState === 'unmounted') s.document.activeElement = null;
      if (focusState === 'blurred') input.blur();
      s.window.innerHeight = 793; s.resize({ height: 793 });
      assert.equal(s.hook.keyboardOpen.value, false);
      assert.equal(s.root.dataset.mobileKeyboard, undefined);
      assert.equal(s.properties.get('--astrbot-viewport-height'), '852px');
      assert.equal(s.properties.get('--astrbot-vv-height'), '793px');
      assert.equal(s.document.listeners.get('touchmove')?.size ?? 0, 0);
      if (focusState === 'focused') assert.equal(s.document.activeElement, input);
    }
    s.unmount();
  }
});

test('standalone keyboard recovery tolerates sub-keyboard viewport differences without restoring while substantially obscured', () => {
  for (const contained of [false, true]) {
    const s = setup({ standalone: true, contained, height: 812 }); const input = new s.HTMLInputElement();
    input.focus(); s.resize({ height: 476 }); input.blur();
    for (const height of [550, 620, 700]) {
      s.resize({ height });
      assert.equal(s.hook.keyboardOpen.value, true);
      assert.equal(s.properties.get('--astrbot-viewport-height'), height + 'px');
    }
    s.resize({ height: 770 });
    assert.equal(s.hook.keyboardOpen.value, false);
    s.unmount();
  }
});

test('blank taps dismiss input, action taps are not consumed, and unmount releases listeners/timers', () => {
  const s = setup(); const input = new s.HTMLInputElement(); input.focus(); s.resize({ height: 500 });
  let prevented = false;
  s.document.emit('pointerdown', { target: new s.HTMLElement('BUTTON'), preventDefault() { prevented = true; } });
  assert.equal(s.document.activeElement, input); assert.equal(prevented, false);
  s.document.emit('touchmove', { target: new s.HTMLElement(), touches: [{}, {}], preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  s.document.emit('pointerdown', { target: new s.HTMLElement() });
  assert.equal(s.document.activeElement, null);
  s.unmount();
  for (const target of [s.document, s.window, s.viewport]) assert.equal([...target.listeners.values()].reduce((count, set) => count + set.size, 0), 0);
  assert.equal(s.timers.size, 0);
  assert.equal(s.root.dataset.mobileKeyboard, undefined);
});
