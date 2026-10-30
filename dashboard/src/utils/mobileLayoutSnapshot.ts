/** Read layout geometry only, on an explicit user action; never upload it. */
export function readMobileLayoutSnapshot() {
  const root = document.documentElement;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  let environmentInsets: { top: number; bottom: number };
  const cssViewportHeights: Record<string, number | null> = {};
  try {
    const measured = getComputedStyle(probe);
    environmentInsets = {
      top: parseFloat(measured.paddingTop) || 0,
      bottom: parseFloat(measured.paddingBottom) || 0,
    };
    Object.assign(probe.style, { padding: '0px', width: '0px', boxSizing: 'border-box' });
    for (const height of ['100vh', '100lvh', '100dvh', '100svh']) {
      if (typeof CSS !== 'undefined' && !CSS.supports('height', height)) {
        cssViewportHeights[height] = null;
        continue;
      }
      probe.style.height = height;
      cssViewportHeights[height] = Math.round(probe.getBoundingClientRect().height * 100) / 100;
    }
  } finally {
    probe.remove();
  }

  const rootStyle = getComputedStyle(root);
  const published: Record<string, string> = {};
  for (const name of ['--astrbot-viewport-height', '--astrbot-vv-height', '--astrbot-vv-offset-top', '--astrbot-safe-top', '--astrbot-safe-bottom']) {
    published[name] = rootStyle.getPropertyValue(name).trim();
  }
  const elements: Record<string, unknown> = {};
  for (const selector of ['html', 'body', '#app', '.v-application', '.v-application__wrap', '.top-header', '.section-toolbar', '.mobile-section-navigation', '.page-wrapper', '.page-content', '.mobile-bottom-navigation', '.config-actionbar', '.chat-ui']) {
    const element = document.querySelector(selector);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    elements[selector] = {
      top: Math.round(rect.top * 100) / 100,
      bottom: Math.round(rect.bottom * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      display: style.display,
      position: style.position,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    };
  }
  const visual = window.visualViewport;
  return {
    format: 'astrbot-layout-v1',
    cssViewportHeights,
    screen: { width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio },
    window: { width: window.innerWidth, height: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY },
    visualViewport: visual ? {
      width: visual.width, height: visual.height, offsetTop: visual.offsetTop, offsetLeft: visual.offsetLeft, scale: visual.scale,
    } : null,
    displayMode: {
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: !!(window.navigator as Navigator & { standalone?: boolean }).standalone,
      viewportMeta: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? null,
      contained: root.hasAttribute('data-ios-status-bar-contained'),
      keyboardOpen: root.dataset.mobileKeyboard === 'true',
    },
    safeArea: { environment: environmentInsets, published },
    elements,
  };
}
