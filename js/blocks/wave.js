// Волна как в прототипе: столбики 2 px через 1 px, сверху основная часть, снизу отражение.
// Данные волны взяты из прототипа (js/data.js, PEAKS).

const ALPH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PEAKS = 'ddegfeeeeffffeeeffffedffgggdffghgfdggghghgjoljknikmmjlAOGLNKKOLIMNLKROKLNINOKHOMIOSOITKRQTNLSKRPTMOSHLPOKPRIKQPMLOLKOMHLNLLROKLMIOOJHPJIPSNLTHRQTNMRLQQSMPRJJQOKPQEAFNEzDOQNEzyEPQOJFEFJNJxyFGNMPIBFHNVXSFEJPTQLyEKRVZNCDLRUTIzBPQNBzxFNQOJFEGJNJyxEHNJPIBFHOUYQEEKPTQJBCLRWYNQPBysddeffeJLDOMLMQOJPIIQNJKPHIQRONRLPQTLNRNMSPLQQJNOOISOJPNRKMMLMNKHOJLNRNIOHJQNJLOJGRQONRNORTLOQNQSPLRQJNNOJSNJOORINMBBwjjmljihjkjkjihjlllkljmstuxGLCzELQRRGyCNTXWNyGLUUQGEGNQMzzFIQOPIEEJOGJxzDKOINICDLQVYMCCMRRRFzDMTXWLAGLUUPFDGMPMAyFJQMPJCEKOFJxyEKOJMHNQBwuceddeeGIDSOKOONHULKOPQHPJLNNJIQKKORMJOIGRKIMOHKRPMOQOQSQKQOPQRQJTNLNNNHTKKOQPIPGMNNJJPLFORMKOIESKILNJJSQLPPOQSQIROCwuiiqjknhhkkkinfklkgjkjgkmjkk9bbbcbb8999a98788888766777766666666666666666666';
const PK = Array.from(PEAKS, (c) => ALPH.indexOf(c) / 61);

const cache = new Map();
export function bars(n, seed = 0) {
  const key = n + ':' + seed;
  if (cache.has(key)) return cache.get(key);
  const L = PK.length, off = seed ? (seed * 131) % L : 0, out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * L / n), b = Math.max(a + 1, Math.floor((i + 1) * L / n));
    let mx = 0, sm = 0;
    for (let j = a; j < b; j++) { const v = PK[(j + off) % L]; if (v > mx) mx = v; sm += v; }
    out.push(mx * 0.65 + (sm / (b - a)) * 0.35);
  }
  cache.set(key, out);
  return out;
}

export const dpr = () => Math.min(2, window.devicePixelRatio || 1);

// frac: сыгранная доля (белым), hover: доля под курсором или -1, top/bot: высота верхней и нижней части в px
export function paintWave(cv, { frac = 0, hover = -1, top, bot, seed = 0 }) {
  const w = cv.clientWidth, h = top + 1 + bot, r = dpr();
  if (!w) return;
  if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) {
    cv.width = Math.round(w * r); cv.height = Math.round(h * r);
  }
  const x = cv.getContext('2d');
  x.setTransform(r, 0, 0, r, 0, 0);
  x.clearRect(0, 0, w, h);
  const n = Math.max(40, Math.floor((w + 1) / 3)), xs = (w + 1) / n, v = bars(n, seed);
  const fn = frac * n, hn = hover * n;
  for (let i = 0; i < n; i++) {
    const bx = Math.round(i * xs);
    const t = Math.max(2, Math.round(2 + v[i] * (top - 2))), bh = Math.max(1, Math.round(t * bot / top));
    const played = i < fn, prev = !played && hover >= 0 && i < hn;
    x.fillStyle = played ? 'rgba(255,255,255,1)' : prev ? 'rgba(245,242,242,.74)' : 'rgba(245,242,242,.38)';
    x.fillRect(bx, top - t, 2, t);
    x.fillStyle = played ? 'rgba(255,255,255,.4)' : prev ? 'rgba(245,242,242,.28)' : 'rgba(245,242,242,.17)';
    x.fillRect(bx, top + 1, 2, bh);
  }
}

// Наведение как в прототипе: полоска и подсказка. label(f) возвращает текст подсказки.
export function hoverable(box, cv, redraw, label) {
  const line = document.createElement('span'), tip = document.createElement('span');
  line.className = 'w-line'; tip.className = 'w-tip';
  box.append(line, tip);
  const fx = (e) => { const r = cv.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const f = fx(e);
    box.classList.add('is-hover');
    line.style.left = tip.style.left = (f * 100) + '%';
    tip.textContent = label(f);
    redraw(f);
  });
  box.addEventListener('pointerleave', () => { box.classList.remove('is-hover'); redraw(-1); });
}
