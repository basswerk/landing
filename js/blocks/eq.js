// Эквалайзер на фоне первого экрана: столбики растут от нижней линии почти до верха,
// поднимаются возле курсора и подсвечиваются светом вокруг него.
// Клик или тап пускает «бочку»: столбики подпрыгивают, от точки клика расходится красное кольцо.
// Рисуем только пока первый экран виден и вкладка активна.

import { bars, dpr } from './wave.js?v=20261120m';

const STEP = 6, BW = 2;
const SAT = 1.8, NORM = 1 - Math.exp(-SAT * 1.5);
// Мягкое насыщение: высокие столбики не упираются в потолок одной линией
const shape = (v) => Math.min(1, (1 - Math.exp(-SAT * v)) / NORM);

export default function initEq(hero) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas');
  cv.className = 'eq';
  cv.setAttribute('aria-hidden', 'true');
  hero.prepend(cv);
  const ctx = cv.getContext('2d');

  // Два служебных слоя вне страницы: маска столбиков и свет. Свет обрезается по маске
  // и кладётся поверх с полной яркостью, поэтому подсветка и кольца видны чётко
  const mk = document.createElement('canvas'), mctx = mk.getContext('2d');
  const lt = document.createElement('canvas'), lctx = lt.getContext('2d');

  let W = 0, H = 0, n = 0, base = [], cur = [], hs = [], col = [], red = [];
  let mx = -1, my = -1, lastMove = 0, raf = 0, onScreen = true, lastFrame = 0;
  const kicks = [];

  function size() {
    const r = dpr();
    W = cv.clientWidth; H = cv.clientHeight;
    for (const [c, x] of [[cv, ctx], [mk, mctx], [lt, lctx]]) {
      c.width = Math.round(W * r); c.height = Math.round(H * r);
      x.setTransform(r, 0, 0, r, 0, 0);
    }
    n = Math.ceil(W / STEP) + 1;
    base = bars(n, 5);
    cur = new Float32Array(n); hs = new Float32Array(n); col = new Float32Array(n); red = new Float32Array(n);
    for (let i = 0; i < n; i++) cur[i] = base[i] * 0.2;
  }

  function frame(t) {
    raf = 0;
    const busy = t - lastMove < 1500 || kicks.length;
    // В покое хватает 30 кадров в секунду
    if (!busy && t - lastFrame < 33) { schedule(); return; }
    lastFrame = t;
    for (let k = kicks.length - 1; k >= 0; k--) if (t - kicks[k].t0 > 1800) kicks.splice(k, 1);

    const maxH = H * 0.94, near = mx >= 0, lit = near || kicks.length > 0;

    for (let i = 0; i < n; i++) {
      const x = i * STEP;
      const idle = 0.6 + 0.4 * Math.sin(t * 0.0012 + i * 0.19) * Math.sin(t * 0.0007 + i * 0.047);
      // Всё множим на собственную высоту столбика, поэтому форма волны сохраняется
      let k = 0.3 * idle, c = 0, rd = 0;
      if (near) { const d = (x - mx) / 170; c = Math.exp(-d * d); k += c * 1.15; }
      for (const kk of kicks) {
        const age = t - kk.t0, r = age * 0.9, d = (Math.abs(x - kk.x) - r) / 50;
        const b = Math.exp(-d * d) * Math.exp(-age / 650);
        k += b * 1.2; rd = Math.max(rd, b);
      }
      cur[i] += (base[i] * k - cur[i]) * 0.18;
      hs[i] = Math.max(2, shape(cur[i]) * maxH); col[i] = c; red[i] = rd;
    }

    ctx.clearRect(0, 0, W, H);
    if (!lit) {
      // Покой: просто тусклые столбики
      ctx.fillStyle = 'rgba(243,239,239,.09)';
      for (let i = 0; i < n; i++) ctx.fillRect(i * STEP, H - hs[i], BW, hs[i]);
      schedule();
      return;
    }

    // Маска: все столбики непрозрачные
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = '#fff';
    for (let i = 0; i < n; i++) mctx.fillRect(i * STEP, H - hs[i], BW, hs[i]);

    // База: тусклые столбики, рядом с курсором светлее, под «бочкой» красные
    ctx.globalAlpha = 0.09;
    ctx.drawImage(mk, 0, 0, W, H);
    ctx.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      if (col[i] > 0.02) { ctx.fillStyle = `rgba(243,239,239,${(col[i] * 0.08).toFixed(3)})`; ctx.fillRect(i * STEP, H - hs[i], BW, hs[i]); }
      if (red[i] > 0.02) { ctx.fillStyle = `rgba(255,70,64,${(red[i] * 0.16).toFixed(3)})`; ctx.fillRect(i * STEP, H - hs[i], BW, hs[i]); }
    }

    // Свет: пятно вокруг курсора и кольца от кликов, обрезанные по столбикам
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    if (near) {
      const R = 300, g = lctx.createRadialGradient(mx, my, 0, mx, my, R);
      g.addColorStop(0, 'rgba(255,255,255,.34)');
      g.addColorStop(0.4, 'rgba(255,238,238,.13)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = g;
      lctx.fillRect(mx - R, my - R, R * 2, R * 2);
    }
    for (const kk of kicks) {
      const age = t - kk.t0, r = age * 0.9, a = 0.32 * Math.exp(-age / 750), w = 80;
      const r0 = Math.max(0, r - w), r1 = r + w;
      const g = lctx.createRadialGradient(kk.x, kk.y, r0, kk.x, kk.y, r1);
      g.addColorStop(0, 'rgba(255,70,64,0)');
      g.addColorStop(0.5, `rgba(255,70,64,${a.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,70,64,0)');
      lctx.fillStyle = g;
      lctx.fillRect(kk.x - r1, kk.y - r1, r1 * 2, r1 * 2);
    }
    lctx.globalCompositeOperation = 'destination-in';
    lctx.drawImage(mk, 0, 0, W, H);
    lctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(lt, 0, 0, W, H);
    schedule();
  }

  function schedule() {
    if (!raf && onScreen && !document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }

  function still() {
    // «Уменьшить движение»: один статичный кадр
    const maxH = H * 0.94;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(243,239,239,.09)';
    for (let i = 0; i < n; i++) {
      const h = Math.max(2, shape(base[i] * 0.3) * maxH);
      ctx.fillRect(i * STEP, H - h, BW, h);
    }
  }

  size();
  if (reduce) { still(); new ResizeObserver(() => { size(); still(); }).observe(cv); return; }

  new ResizeObserver(size).observe(cv);
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    [mx, my] = pos(e); lastMove = performance.now();
    schedule();
  });
  hero.addEventListener('pointerleave', () => { mx = -1; });
  hero.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e);
    kicks.push({ x, y, t0: performance.now() });
    if (kicks.length > 6) kicks.shift();
    schedule();
  });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; schedule(); }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
  schedule();
}
