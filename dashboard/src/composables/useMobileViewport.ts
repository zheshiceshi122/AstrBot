import { onBeforeUnmount, onMounted, ref, type InjectionKey, type Ref } from 'vue';

export const mobileViewportPortraitKey: InjectionKey<Ref<boolean>> = Symbol('mobileViewportPortrait');

const MOBILE_QUERY = '(max-width: 959.98px)';
const KEYBOARD_MIN_GAP = 120;
const KEYBOARD_DIRTY_HEIGHT = 150;
const STANDALONE_KEYBOARD_MIN_GAP = 100;
const INPUT_REVEAL_MARGIN = 16;
const KEYBOARD_SETTLE_DELAY = 260;
const FOCUS_OUT_RECHECK_DELAY = 180;
const SAFE_AREA_RETRY_DELAYS = [120, 500, 1500, 3000];

function isEditableElement(element: Element | null): element is HTMLElement {
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement) {
    return !element.disabled && !element.readOnly &&
      ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(element.type);
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

function isIOSStandaloneWebApp(): boolean {
  return isIOSDevice() && isStandaloneDisplayMode();
}

function isAndroidDevice(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
}

function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    if (
      /(auto|scroll|overlay)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function isInsideScrollable(element: Element | null): boolean {
  let current = element as HTMLElement | null;
  for (let depth = 0; current && depth < 12; depth += 1) {
    const style = window.getComputedStyle(current);
    if (
      /(auto|scroll|overlay)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * Keeps the WebUI usable while a phone keyboard is open.
 *
 * The keyboard state comes from the visual viewport shrinking, never from focus:
 * a focused field does not prove a keyboard is visible (hardware keyboards,
 * broken IMEs), and a field can be unmounted while focused without a focusout.
 * The app shell height follows the visible area, the bottom navigation steps
 * aside, the page is prevented from panning underneath the keyboard, and the
 * focused field is scrolled above it. Tapping a non-interactive area or changing
 * routes closes the keyboard.
 */
export function useMobileViewport() {
  const keyboardOpen = ref(false);
  const portrait = ref(typeof window === 'undefined' || window.innerHeight >= window.innerWidth);

  let expandedHeight = 0;
  let lastWidth = 0;
  let lastHeight = -1;
  let lastOffsetTop = -1;
  let frame = 0;
  let revealTimer: number | undefined;
  let focusOutTimer: number | undefined;
  let listening = false;
  let cachedSafeTop: number | null = null;
  let cachedSafeBottom: number | null = null;
  let largeViewportHeight = 0;
  let containViewportPending = true;
  const safeRetryTimers: number[] = [];

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  const visualViewportHeight = () => window.visualViewport?.height ?? window.innerHeight;

  // env(safe-area-inset-*) can briefly read 0 on an iOS standalone cold start,
  // so measure it with a hidden probe and cache each edge independently.
  const readSafeAreaInsets = (): { top: number; bottom: number } => {
    const contained = document.documentElement.hasAttribute('data-ios-status-bar-contained');
    if (cachedSafeTop !== null && cachedSafeBottom !== null &&
      (!contained || (cachedSafeTop === 0 && cachedSafeBottom === 0))) {
      return { top: cachedSafeTop, bottom: cachedSafeBottom };
    }
    if (typeof document === 'undefined' || !document.body) {
      return { top: cachedSafeTop ?? 0, bottom: cachedSafeBottom ?? 0 };
    }
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.opacity = '0';
    probe.style.height = '100lvh';
    probe.style.boxSizing = 'border-box';
    probe.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe);
    const top = Math.round(parseFloat(computed.paddingTop) || 0);
    const bottom = Math.round(parseFloat(computed.paddingBottom) || 0);
    largeViewportHeight = Math.max(0, Math.round(probe.getBoundingClientRect().height));
    probe.remove();

    if (contained) {
      cachedSafeTop = top;
      cachedSafeBottom = bottom;
    } else {
      if (cachedSafeTop === null && top > 0) cachedSafeTop = top;
      if (cachedSafeBottom === null && bottom > 0) cachedSafeBottom = bottom;
    }
    return { top: cachedSafeTop ?? top, bottom: cachedSafeBottom ?? bottom };
  };

  const revealFocusedField = () => {
    if (!keyboardOpen.value) return;
    if (Math.abs((window.visualViewport?.scale ?? 1) - 1) > 0.01) return;
    const element = document.activeElement;
    if (!isEditableElement(element)) return;

    const viewportHeight = visualViewportHeight();
    const rect = element.getBoundingClientRect();
    if (
      rect.top >= INPUT_REVEAL_MARGIN &&
      rect.bottom <= viewportHeight - INPUT_REVEAL_MARGIN
    ) {
      return;
    }

    const scroller = findScrollableAncestor(element);
    if (!scroller) return;

    const area = scroller.getBoundingClientRect();
    const visibleTop = Math.max(area.top, INPUT_REVEAL_MARGIN);
    const visibleBottom = Math.min(area.bottom, viewportHeight - INPUT_REVEAL_MARGIN);
    if (visibleBottom <= visibleTop) return;

    if (rect.bottom > visibleBottom) {
      scroller.scrollTo({ top: scroller.scrollTop + rect.bottom - visibleBottom, behavior: 'instant' });
    } else if (rect.top < visibleTop) {
      scroller.scrollTo({ top: scroller.scrollTop - (visibleTop - rect.top), behavior: 'instant' });
    }
  };

  const scheduleInputReveal = () => {
    window.clearTimeout(revealTimer);
    // iOS finishes the keyboard animation after the visualViewport resize event,
    // so measure once the viewport has settled.
    revealTimer = window.setTimeout(revealFocusedField, KEYBOARD_SETTLE_DELAY);
  };

  const setKeyboardOpen = (open: boolean) => {
    if (keyboardOpen.value === open) return;
    keyboardOpen.value = open;
    if (open) {
      document.documentElement.dataset.mobileKeyboard = 'true';
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      scheduleInputReveal();
    } else {
      delete document.documentElement.dataset.mobileKeyboard;
      document.removeEventListener('touchmove', onTouchMove);
      window.clearTimeout(revealTimer);
    }
  };

  const update = () => {
    frame = 0;

    if (!isMobile()) {
      portrait.value = window.innerHeight >= window.innerWidth;
      setKeyboardOpen(false);
      document.documentElement.style.removeProperty('--astrbot-vv-height');
      document.documentElement.style.removeProperty('--astrbot-vv-offset-top');
      document.documentElement.style.removeProperty('--astrbot-safe-top');
      document.documentElement.style.removeProperty('--astrbot-safe-bottom');
      document.documentElement.style.removeProperty('--astrbot-viewport-height');
      delete document.documentElement.dataset.mobileStandalone;
      expandedHeight = 0;
      largeViewportHeight = 0;
      cachedSafeTop = null;
      cachedSafeBottom = null;
      return;
    }

    // Pinch zoom changes the visual viewport without opening a keyboard. Keep
    // the last confirmed geometry and let the browser manage the zoomed page.
    if (Math.abs((window.visualViewport?.scale ?? 1) - 1) > 0.01) return;

    const height = visualViewportHeight();
    // WebKit can report an empty visual viewport between keyboard frames.
    // Retain the last usable geometry instead of reopening the full shell.
    if (!Number.isFinite(height) || height <= 0) return;
    const offsetTop = window.visualViewport?.offsetTop ?? 0;
    const innerHeight = window.innerHeight;
    const standalone = isStandaloneDisplayMode();
    document.documentElement.dataset.mobileStandalone = standalone ? 'true' : 'false';

    // Rotation changes the usable height entirely; never read it as a keyboard.
    if (window.innerWidth !== lastWidth) {
      if (lastWidth) containViewportPending = false;
      cachedSafeTop = null;
      cachedSafeBottom = null;
      largeViewportHeight = 0;
      lastWidth = window.innerWidth;
      expandedHeight = height;
    }

    const safe = standalone ? readSafeAreaInsets() : { top: 0, bottom: 0 };
    const contained = document.documentElement.hasAttribute('data-ios-status-bar-contained');
    // Only the initial, unfocused cover -> contain settlement may lower the
    // baseline. Keyboard animation must never be mistaken for repeated settling.
    if (contained && containViewportPending && safe.top === 0 && safe.bottom === 0 &&
      !isEditableElement(document.activeElement) && height > KEYBOARD_DIRTY_HEIGHT &&
      height < expandedHeight && expandedHeight - height < STANDALONE_KEYBOARD_MIN_GAP) {
      expandedHeight = height;
      containViewportPending = false;
    }
    // Zero is valid when the native viewport already excludes the system bar.
    // A guessed 44px fallback creates a second status-bar-sized blank row.
    const safeTop = contained ? 0 : safe.top;
    let keyboard = false;
    let appHeight: number;

    if (standalone) {
      // Fullscreen PWA has no address bar; any large height drop is the keyboard.
      // Keyboard animation arrives as many small drops. None of them may lower
      // the expanded baseline; only rotation (above) or a larger viewport can.
      if (!expandedHeight || height > expandedHeight) {
        expandedHeight = height;
      }
      // Use the same keyboard-sized delta for opening and closing, as SullyOS
      // does. iOS may settle at a shorter resting viewport (852 -> 793); requiring
      // a return within 1px of the historical maximum permanently hides controls.
      keyboard = height > KEYBOARD_DIRTY_HEIGHT && height < expandedHeight - STANDALONE_KEYBOARD_MIN_GAP;
      if (keyboard) containViewportPending = false;
      // In iOS cover, 100lvh can expose the full canvas while visualViewport
      // reports a shorter height. Keep that canvas out of the keyboard baseline.
      appHeight = keyboard ? height : isIOSDevice() && !contained
        ? Math.max(expandedHeight, largeViewportHeight) : expandedHeight;
      // iOS 26 standalone pans the whole page when the keyboard opens; pull it
      // back so the top of the app still meets the visual viewport.
      if (keyboard && offsetTop > 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      // Android Chrome/Edge either resizes the layout viewport with the keyboard
      // (obscuredHeight ~ 0) or pans it (obscuredHeight > 120). iOS Safari tab
      // mode behaves like the latter.
      expandedHeight = Math.max(expandedHeight, height);
      const obscuredHeight = Math.max(0, innerHeight - height);
      // Resizes-content needs both a large measured drop and an editable focus
      // (or an already open keyboard); focus alone never changes the state.
      keyboard = obscuredHeight > KEYBOARD_MIN_GAP ||
        ((isEditableElement(document.activeElement) || keyboardOpen.value) &&
          height > KEYBOARD_DIRTY_HEIGHT && expandedHeight - height > KEYBOARD_MIN_GAP);
      appHeight = keyboard ? height : Math.max(innerHeight, height + offsetTop);
      if (keyboard && offsetTop > 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // The keyboard can make a portrait phone's visible height smaller than its
    // width. Navigation orientation follows the expanded viewport, not the IME.
    portrait.value = expandedHeight >= window.innerWidth;
    setKeyboardOpen(keyboard);

    const roundedHeight = Math.round(height);
    if (roundedHeight !== lastHeight) {
      lastHeight = roundedHeight;
      document.documentElement.style.setProperty('--astrbot-vv-height', `${roundedHeight}px`);
    }
    const roundedOffsetTop = Math.round(offsetTop);
    if (roundedOffsetTop !== lastOffsetTop) {
      lastOffsetTop = roundedOffsetTop;
      document.documentElement.style.setProperty(
        '--astrbot-vv-offset-top',
        `${roundedOffsetTop}px`,
      );
    }
    document.documentElement.style.setProperty(
      '--astrbot-viewport-height',
      `${Math.round(appHeight)}px`,
    );
    document.documentElement.style.setProperty('--astrbot-safe-top', `${safeTop}px`);
    // User-requested isolation experiment: remove only bottom safe-area spacing.
    document.documentElement.style.setProperty('--astrbot-safe-bottom', '0px');
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  const onSafeAreaChange = () => {
    cachedSafeTop = null;
    cachedSafeBottom = null;
    largeViewportHeight = 0;
    scheduleUpdate();
  };

  const onFocusIn = (event: FocusEvent) => {
    if (!isMobile()) return;
    const target = event.target as Element | null;
    if (!isEditableElement(target)) return;
    scheduleUpdate();
    // Moving between fields with the keyboard already up should still bring
    // the new field above it.
    if (keyboardOpen.value) scheduleInputReveal();
  };

  const onFocusOut = () => {
    scheduleUpdate();
    // WebKit can finish dismissing the keyboard without a final resize event.
    window.clearTimeout(focusOutTimer);
    focusOutTimer = window.setTimeout(scheduleUpdate, FOCUS_OUT_RECHECK_DELAY);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!isMobile()) return;
    const target = event.target as Element | null;
    if (!keyboardOpen.value) return;
    const editable = document.activeElement;
    if (!isEditableElement(editable)) return;

    if (!target) return;
    // Anything interactive keeps its own first tap; only blank surfaces dismiss
    // the keyboard, so buttons never need a second tap.
    if (
      target.closest(
        'input, textarea, select, button, a, label, [role="button"], [role="tab"], [role="slider"], [contenteditable="true"], .v-field, .v-selection-control, .v-slider',
      )
    ) {
      return;
    }
    editable.blur();
  };

  // While the keyboard is open, iOS can drag the whole page under the input.
  // Allow native scrolling inside real scroll containers and text fields, block
  // the rest so the header/footer cannot drift off screen.
  const onTouchMove = (event: TouchEvent) => {
    if (!keyboardOpen.value) return;
    if (event.touches.length > 1 || Math.abs((window.visualViewport?.scale ?? 1) - 1) > 0.01) return;
    if (!isIOSDevice() && !isAndroidDevice()) return;
    const target = event.target as Element | null;
    if (target?.closest('textarea, input, select, [contenteditable="true"]')) return;
    if (target && isInsideScrollable(target)) return;
    event.preventDefault();
  };

  const dismissKeyboard = () => {
    const editable = document.activeElement;
    if (isEditableElement(editable)) editable.blur();
  };

  onMounted(() => {
    if (listening) return;
    listening = true;
    window.visualViewport?.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('orientationchange', onSafeAreaChange, { passive: true });
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    scheduleUpdate();

    if (isIOSStandaloneWebApp()) {
      for (const delay of SAFE_AREA_RETRY_DELAYS) {
        safeRetryTimers.push(
          window.setTimeout(() => {
            const contained = document.documentElement.hasAttribute('data-ios-status-bar-contained');
            if (cachedSafeTop !== null && cachedSafeBottom !== null &&
              (!contained || (cachedSafeTop === 0 && cachedSafeBottom === 0))) return;
            scheduleUpdate();
          }, delay),
        );
      }
    }
  });

  onBeforeUnmount(() => {
    if (!listening) return;
    listening = false;
    window.visualViewport?.removeEventListener('resize', scheduleUpdate);
    window.visualViewport?.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    window.removeEventListener('orientationchange', onSafeAreaChange);
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('touchmove', onTouchMove);
    window.clearTimeout(revealTimer);
    window.clearTimeout(focusOutTimer);
    for (const timer of safeRetryTimers) window.clearTimeout(timer);
    if (frame) window.cancelAnimationFrame(frame);
    lastHeight = -1;
    lastOffsetTop = -1;
    delete document.documentElement.dataset.mobileKeyboard;
    delete document.documentElement.dataset.mobileStandalone;
    document.documentElement.style.removeProperty('--astrbot-vv-height');
    document.documentElement.style.removeProperty('--astrbot-vv-offset-top');
    document.documentElement.style.removeProperty('--astrbot-safe-top');
    document.documentElement.style.removeProperty('--astrbot-safe-bottom');
    document.documentElement.style.removeProperty('--astrbot-viewport-height');
  });

  return { keyboardOpen, dismissKeyboard, portrait };
}
