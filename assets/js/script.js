const header = document.querySelector('header');
const sidenav = document.querySelector('.sidenav');

function updateNavTop() {
  sidenav.style.top = header.offsetHeight + 'px';
}

window.addEventListener('load', updateNavTop);
window.addEventListener('resize', updateNavTop);

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

  const css = `
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
  transition: opacity 0.15s;
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
  z-index: 1000000;
  transition: background 0.15s;
  font-family: sans-serif;
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
  font-family: sans-serif;
  transition: background 0.15s;
}
._lb-zbtn:hover { background: rgba(255,255,255,0.25); }
#_lb-reset { width: 42px; font-size: 11px; letter-spacing: 0.02em; }
#_lb-caption {
  position: fixed; bottom: 58px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.65); font-size: 13px;
  white-space: nowrap; max-width: 80vw;
  overflow: hidden; text-overflow: ellipsis;
  z-index: 1000000; pointer-events: none;
  font-family: sans-serif;
}
#_lb-counter {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.5); font-size: 13px;
  z-index: 1000000; pointer-events: none;
  font-family: sans-serif;
}
img[data-lb] { cursor: zoom-in !important; }
`;

  const style = document.createElement('style');
  style.id = '_lb-style';
  style.textContent = css;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.id = '_lb-backdrop';
  backdrop.innerHTML = `
    <div id="_lb-inner">
      <img id="_lb-img" draggable="false" alt="" />
    </div>
    <button class="_lb-btn" id="_lb-close" title="Close (Esc)">✕</button>
    <button class="_lb-btn" id="_lb-prev" title="Previous (←)">‹</button>
    <button class="_lb-btn" id="_lb-next" title="Next (→)">›</button>
    <div id="_lb-zoom-row">
      <button class="_lb-zbtn" id="_lb-zout" title="Zoom out (-)">−</button>
      <button class="_lb-zbtn" id="_lb-reset" title="Reset (0)">1:1</button>
      <button class="_lb-zbtn" id="_lb-zin" title="Zoom in (+)">+</button>
    </div>
    <div id="_lb-caption"></div>
    <div id="_lb-counter"></div>
  `;
  document.body.appendChild(backdrop);

  const img = document.getElementById('_lb-img');
  const cap = document.getElementById('_lb-caption');
  const counter = document.getElementById('_lb-counter');

  let images = [], cur = 0, scale = 1, tx = 0, ty = 0;
  let dragging = false, startX = 0, startY = 0, baseTx = 0, baseTy = 0;
  let lastPinchDist = null, lastPinchScale = 1;

  function setTransform() {
    img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }

  function resetView() { scale = 1; tx = 0; ty = 0; setTransform(); }

  function gather() {
    images = Array.from(document.querySelectorAll('img[data-lb]'));
  }

  function open(i) {
    gather();
    cur = i;
    resetView();
    img.src = images[i].src;
    cap.textContent = images[i].alt || images[i].title || '';
    counter.textContent = images.length > 1 ? `${i + 1} / ${images.length}` : '';
    document.getElementById('_lb-prev').style.display = images.length > 1 ? '' : 'none';
    document.getElementById('_lb-next').style.display = images.length > 1 ? '' : 'none';
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    img.src = '';
  }

  function go(dir) {
    cur = (cur + dir + images.length) % images.length;
    open(cur);
  }

  function zoom(factor, pivotX, pivotY) {
    const newScale = Math.min(Math.max(scale * factor, 0.25), 10);
    if (pivotX !== undefined) {
      tx -= pivotX * (newScale - scale);
      ty -= pivotY * (newScale - scale);
    }
    scale = newScale;
    setTransform();
  }

  document.getElementById('_lb-close').onclick = close;
  document.getElementById('_lb-prev').onclick = () => go(-1);
  document.getElementById('_lb-next').onclick = () => go(1);
  document.getElementById('_lb-zin').onclick = () => zoom(1.3);
  document.getElementById('_lb-zout').onclick = () => zoom(1 / 1.3);
  document.getElementById('_lb-reset').onclick = resetView;

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop || e.target.id === '_lb-inner') close();
  });

  document.addEventListener('keydown', e => {
    if (!backdrop.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === '+' || e.key === '=') zoom(1.2);
    if (e.key === '-') zoom(1 / 1.2);
    if (e.key === '0') resetView();
  });

  img.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    baseTx = tx; baseTy = ty;
    img.classList.add('grabbing');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    tx = baseTx + (e.clientX - startX);
    ty = baseTy + (e.clientY - startY);
    setTransform();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    img.classList.remove('grabbing');
  });

  document.getElementById('_lb-inner').addEventListener('wheel', e => {
    e.preventDefault();
    const rect = img.getBoundingClientRect();
    const ox = (e.clientX - rect.left) / scale;
    const oy = (e.clientY - rect.top) / scale;
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, ox, oy);
  }, { passive: false });

  document.getElementById('_lb-inner').addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchScale = scale;
    }
  }, { passive: true });

  document.getElementById('_lb-inner').addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.min(Math.max(lastPinchScale * (dist / lastPinchDist), 0.25), 10);
      setTransform();
    }
  }, { passive: false });

  document.getElementById('_lb-inner').addEventListener('touchend', () => {
    lastPinchDist = null;
  });

  // Auto-init: observe DOM for images, apply data-lb and click handlers
  function initImage(el) {
    if (el._lbInit) return;
    el._lbInit = true;
    el.setAttribute('data-lb', '');
    el.addEventListener('click', () => {
      gather();
      const i = images.indexOf(el);
      if (i !== -1) open(i);
    });
  }

  function shouldInclude(el) {
    // Skip tiny icons, 1px tracking pixels, etc.
    const w = el.naturalWidth || el.width;
    const h = el.naturalHeight || el.height;
    if (w > 0 && w < 64) return false;
    if (h > 0 && h < 64) return false;
    // Skip images inside <a> that go somewhere (let the link handle it)
    const parent = el.closest('a[href]');
    if (parent) return false;
    return true;
  }

  function scanImages() {
    document.querySelectorAll('img').forEach(el => {
      if (!el._lbInit && shouldInclude(el)) initImage(el);
    });
  }

  scanImages();

  // Watch for dynamically added images
  const observer = new MutationObserver(() => scanImages());
  observer.observe(document.body, { childList: true, subtree: true });
})();
