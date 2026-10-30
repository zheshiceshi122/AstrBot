/** Match iOS standalone's native status bar to the visible top surface. */
export function installIOSStatusBar(): () => void {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const manifestStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const standalone = manifestStandalone || !!(navigator as Navigator & { standalone?: boolean }).standalone;
  if (!ios || !standalone || window.astrbotDesktop?.isDesktop) return () => {};

  const root = document.documentElement;
  if (root.hasAttribute('data-ios-status-synced')) return () => {};
  const version = ua.match(/Version\/(\d+)/)?.[1] ?? ua.match(/OS (\d+)[_.]/)?.[1];
  const needsEdge = Number(version) >= 27;
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const previousViewport = viewport?.content;
  const contained = needsEdge && manifestStandalone && !!viewport;
  const themeMetas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const previousThemeColors = themeMetas.map(meta => meta.content);
  let frame = 0;
  let disposed = false;
  const sampleY = 1;
  let sampledSurfaces = new Set<Element>();

  // SullyOS separates the iOS 27 native-bar workaround from the page layout.
  // Its clipped, empty color sample does not paint a stripe over the controls.
  if (contained) {
    viewport.content = /viewport-fit\s*=\s*[^,]+/.test(viewport.content)
      ? viewport.content.replace(/viewport-fit\s*=\s*[^,]+/, 'viewport-fit=contain')
      : `${viewport.content}, viewport-fit=contain`;
    root.setAttribute('data-ios-status-bar-contained', '');
  }
  const edge = needsEdge ? document.createElement('div') : null;
  if (edge) {
    edge.id = 'astrbot-ios-status-edge';
    edge.setAttribute('aria-hidden', 'true');
    edge.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:11px;z-index:2147483647;pointer-events:none;-webkit-background-clip:text;background-clip:text';
    document.body.appendChild(edge);
  }
  root.setAttribute('data-ios-status-synced', '');

  const sync = () => {
    frame = 0;
    if (disposed) return;
    const rgb = [0, 0, 0];
    let remaining = 1;
    const surfaces = new Set([...document.elementsFromPoint(Math.round(window.innerWidth / 2), sampleY), document.body, root]);
    sampledSurfaces = surfaces;
    for (const element of surfaces) {
      if (element === edge) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
      // Dashboard surfaces use solid colors or CSS gradients, without wallpaper
      // images. Match a gradient's first computed stop, as the native bar is solid.
      const gradient = style.backgroundImage.includes('gradient(')
        ? style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0] : undefined;
      for (const value of [gradient, style.backgroundColor]) {
        const parts = value?.match(/^rgba?\(([^)]+)\)/)?.[1].split(/[,\s/]+/).filter(Boolean);
        if (!parts || parts.length < 3) continue;
        const alpha = Math.min(1, Math.max(0, Number(parts[3] ?? 1) * Number(style.opacity)));
        for (let channel = 0; channel < 3; channel++) rgb[channel] += Number(parts[channel]) * alpha * remaining;
        remaining *= 1 - alpha;
        if (remaining < 0.001) break;
      }
      if (remaining < 0.001) break;
    }
    const fallback = [247, 244, 237];
    const color = `rgb(${rgb.map((value, channel) => Math.round(value + fallback[channel] * remaining)).join(', ')})`;
    if (root.style.getPropertyValue('--astrbot-status-color') !== color) root.style.setProperty('--astrbot-status-color', color);
    if (edge && edge.style.backgroundColor !== color) edge.style.backgroundColor = color;
    for (const meta of themeMetas) if (meta.content !== color) meta.content = color;
  };
  const schedule = () => {
    if (!disposed && !frame) frame = window.requestAnimationFrame(sync);
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => {
      const target = record.target;
      if (!(target instanceof Element) || target === edge) return false;
      // Viewport and status-color CSS variables are owned by this same shell.
      // They must not wake another layout measurement on every keyboard frame.
      if (target === root && record.type === 'attributes' && record.attributeName === 'style') {
        return false;
      }
      if (document.head.contains(target)) return true;
      if (record.type === 'childList') {
        const nodes = [...record.addedNodes, ...record.removedNodes].filter((node): node is Element => node instanceof Element);
        if (!nodes.length) return false;
        // Teleported overlays have zero-height hosts. Their removed backdrop
        // still changes the sampled edge even though the host has no bounds.
        if (nodes.some(node => [...sampledSurfaces].some(surface => node.contains(surface)))) return true;
      }
      const bounds = target.getBoundingClientRect();
      return bounds.top <= sampleY && bounds.bottom >= sampleY;
    })) schedule();
  });
  sync();
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('load', schedule, true);

  return () => {
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
    observer.disconnect();
    sampledSurfaces.clear();
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('visibilitychange', schedule);
    document.removeEventListener('load', schedule, true);
    edge?.remove();
    root.removeAttribute('data-ios-status-synced');
    root.style.removeProperty('--astrbot-status-color');
    themeMetas.forEach((meta, index) => { meta.content = previousThemeColors[index]; });
    if (contained) {
      viewport.content = previousViewport!;
      root.removeAttribute('data-ios-status-bar-contained');
    }
  };
}
