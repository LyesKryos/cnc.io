function toggleNav() {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.body.classList.toggle('nav-open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.body.classList.remove('nav-open');
}

document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

(function () {
  if (document.getElementById('_lb-style')) return;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = '_lb-style';
  style.textContent = `
#_lb-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 999999;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s;
}
#_lb-backdrop.open { opacity: 1; pointer-events: all; }
#_lb-inner {
  position: relative; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; touch-action: none;
}
#_lb-img {
  max-width: 90vw; max-height: 88vh;
  border-radius: 4px;
  cursor: grab; user-select: none;
  transform-origin: 0 0;
  will-change: transform;
  display: block;
}
#_lb-img.grabbing { cursor: grabbing; }
._lb-btn {
  position: fixed;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff; border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 20px; line-height: 1;
  z-index: 1000000; transition: background 0.15s;
  font-family: sans-serif; padding: 0;
}
._lb-btn:hover { background: rgba(255,255,255,0.25); }
#_lb-close { top: 14px; right: 14px; font-size: 16px; }
#_lb-prev { left: 14px; top: 50%; transform: translateY(-50%); }
#_lb-next { right: 14px; top: 50%; transform: translateY(-50%); }
#_lb-zoom-row {
  position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px; z-index: 1000000;
}
._lb-zbtn {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff; border-radius: 6px;
  width: 34px; height: 30px;
  cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  font-family: sans-serif; transition: background 0.15s; padding: 0;
}
._lb-zbtn:hover { background: rgba(255,255,255,0.25); }
#_lb-reset { width: 42px; font-size: 11px; letter-spacing: 0.02em; }
#_lb-caption {
  position: fixed; bottom: 58px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.65); font-size: 13px;
  white-space: nowrap; max-width: 80vw;
  overflow: hidden; text-overflow: ellipsis;
  z-index: 1000000; pointer-events: none; font-family: sans-serif;
}
#_lb-counter {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.5); font-size: 13px;
  z-index: 1000000; pointer-events: none; font-family: sans-serif;
}
`;
  document.head.appendChild(style);

  // ── Markup ───────────────────────────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.id = '_lb-backdrop';
  backdrop.innerHTML = `
    <div id="_lb-inner">
      <img id="_lb-img" draggable="false" alt="" />
    </div>
    <button class="_lb-btn" id="_lb-close" title="Close (Esc)">&#x2715;</button>
    <button class="_lb-btn" id="_lb-prev"  title="Previous (arrow left)">&#x2039;</button>
    <button class="_lb-btn" id="_lb-next"  title="Next (arrow right)">&#x203A;</button>
    <div id="_lb-zoom-row">
      <button class="_lb-zbtn" id="_lb-zout"  title="Zoom out (-)">&#x2212;</button>
      <button class="_lb-zbtn" id="_lb-reset" title="Reset (0)">1:1</button>
      <button class="_lb-zbtn" id="_lb-zin"   title="Zoom in (+)">+</button>
    </div>
    <div id="_lb-caption"></div>
    <div id="_lb-counter"></div>`;
  document.body.appendChild(backdrop);

  const lbImg   = document.getElementById('_lb-img');
  const cap     = document.getElementById('_lb-caption');
  const counter = document.getElementById('_lb-counter');
  const inner   = document.getElementById('_lb-inner');
  const btnPrev = document.getElementById('_lb-prev');
  const btnNext = document.getElementById('_lb-next');

  // ── State ────────────────────────────────────────────────────────────────────
  let items = [], cur = 0;
  let scale = 1, tx = 0, ty = 0;
  let dragging = false, startX = 0, startY = 0, baseTx = 0, baseTy = 0;
  let lastPinchDist = null, lastPinchScale = 1;

  // ── Core ─────────────────────────────────────────────────────────────────────
  function setTransform() {
    lbImg.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }
  function resetView() { scale = 1; tx = 0; ty = 0; setTransform(); }

  function openAt(i) {
    cur = i;
    resetView();
    lbImg.src = items[i].src;
    cap.textContent = items[i].alt || items[i].title || '';
    counter.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : '';
    btnPrev.style.display = items.length > 1 ? '' : 'none';
    btnNext.style.display = items.length > 1 ? '' : 'none';
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function go(dir) {
    cur = (cur + dir + items.length) % items.length;
    openAt(cur);
  }

  function zoom(factor, pivotX, pivotY) {
    const next = Math.min(Math.max(scale * factor, 0.25), 10);
    if (pivotX !== undefined) {
      tx -= pivotX * (next - scale);
      ty -= pivotY * (next - scale);
    }
    scale = next;
    setTransform();
  }

  // ── Buttons ──────────────────────────────────────────────────────────────────
  document.getElementById('_lb-close').onclick  = close;
  btnPrev.onclick = () => go(-1);
  btnNext.onclick = () => go(1);
  document.getElementById('_lb-zin').onclick    = () => zoom(1.3);
  document.getElementById('_lb-zout').onclick   = () => zoom(1 / 1.3);
  document.getElementById('_lb-reset').onclick  = resetView;

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop || e.target === inner) close();
  });
  lbImg.addEventListener('click', e => e.stopPropagation());

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (!backdrop.classList.contains('open')) return;
    if (e.key === 'Escape')                   close();
    else if (e.key === 'ArrowLeft')           go(-1);
    else if (e.key === 'ArrowRight')          go(1);
    else if (e.key === '+' || e.key === '=')  zoom(1.2);
    else if (e.key === '-')                   zoom(1 / 1.2);
    else if (e.key === '0')                   resetView();
  });

  // ── Mouse drag ───────────────────────────────────────────────────────────────
  lbImg.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    baseTx = tx; baseTy = ty;
    lbImg.classList.add('grabbing');
    e.preventDefault(); e.stopPropagation();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    tx = baseTx + (e.clientX - startX);
    ty = baseTy + (e.clientY - startY);
    setTransform();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    lbImg.classList.remove('grabbing');
  });

  // ── Scroll-to-zoom ───────────────────────────────────────────────────────────
  inner.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = lbImg.getBoundingClientRect();
    zoom(
      e.deltaY < 0 ? 1.12 : 1 / 1.12,
      (e.clientX - rect.left) / scale,
      (e.clientY - rect.top)  / scale
    );
  }, { passive: false });

  // ── Pinch-to-zoom ────────────────────────────────────────────────────────────
  inner.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastPinchDist  = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchScale = scale;
    }
  }, { passive: true });
  inner.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    scale = Math.min(Math.max(lastPinchScale * (dist / lastPinchDist), 0.25), 10);
    setTransform();
  }, { passive: false });
  inner.addEventListener('touchend', () => { lastPinchDist = null; });

  // ── Image attachment ─────────────────────────────────────────────────────────
  function isBig(el) {
    if (el.naturalWidth  > 0 && el.naturalWidth  < 64) return false;
    if (el.naturalHeight > 0 && el.naturalHeight < 64) return false;
    const r = el.getBoundingClientRect();
    if (r.width  > 0 && r.width  < 48) return false;
    if (r.height > 0 && r.height < 48) return false;
    return true;
  }

  function isEligible(el) {
    if (el === lbImg) return false;
    if (el.closest('#_lb-backdrop')) return false;
    if (el.closest('a[href]')) return false;
    if (!isBig(el)) return false;
    return true;
  }

  function markReady(el) {
    if (!isEligible(el)) return;
    el.setAttribute('data-lb-ready', '');
    // Set cursor directly on the element's style so it wins over any stylesheet
    el.style.cursor = 'zoom-in';
  }

  function attach(el) {
    if (el._lbInit) return;
    el._lbInit = true;

    // Try to mark immediately if already loaded, else wait
    if (el.complete && el.naturalWidth > 0) {
      markReady(el);
    } else {
      el.addEventListener('load', () => markReady(el), { once: true });
      // Also try after a short delay in case 'load' already fired
      setTimeout(() => markReady(el), 200);
    }

    el.addEventListener('click', e => {
      if (!el.hasAttribute('data-lb-ready')) return;
      e.preventDefault();
      e.stopPropagation();
      items = Array.from(document.querySelectorAll('img[data-lb-ready]'));
      const i = items.indexOf(el);
      if (i !== -1) openAt(i);
    });
  }

  function scan() {
    document.querySelectorAll('img').forEach(el => {
      if (!el._lbInit) attach(el);
    });
  }

  scan();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  }
  window.addEventListener('load', scan);

  // Re-scan whenever the DOM changes (React, lazy loaders, etc.)
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });

})();
