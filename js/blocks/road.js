// «Где мы сейчас»: волна как в прототипе, заполнена до текущей точки.
// При наведении полоска, подсветка до курсора и этап в подсказке.

import { paintWave, hoverable } from './wave.js?v=20261120m';

const NOW = 0.19;
const STAGES = [
  [0.25, '2026: прототип'],
  [0.5, '2027: разработка и опрос'],
  [0.75, '2028: тест и первые продажи'],
  [1.01, 'Потом: запуск'],
];

export default function initRoad(road) {
  const track = road.querySelector('.road-track');
  const box = document.createElement('div');
  box.className = 'wave road-cv';
  box.innerHTML = '<canvas></canvas>';
  track.prepend(box);
  track.classList.add('has-cv');
  const cv = box.querySelector('canvas');

  let frac = NOW, hover = -1;
  const sizes = () => {
    const h = box.clientHeight;
    return { top: Math.round(h * 0.68), bot: Math.max(4, Math.round(h * 0.3) - 1) };
  };
  const draw = () => paintWave(cv, { frac, hover, seed: 9, ...sizes() });
  const setFrac = (f) => { frac = f; road.style.setProperty('--p', (f * 100).toFixed(2) + '%'); draw(); };

  hoverable(box, cv, (f) => { hover = f; draw(); }, (f) => STAGES.find(([end]) => f < end)[1]);
  new ResizeObserver(draw).observe(box);

  // Заполняется, когда до неё докрутили. В фоне и при «уменьшить движение» сразу целиком
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || document.hidden || road.getBoundingClientRect().top < innerHeight * 0.6) { setFrac(NOW); return; }
  setFrac(0);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400), ease = 1 - Math.pow(1 - k, 3);
      setFrac(NOW * ease);
      if (k < 1 && !document.hidden) requestAnimationFrame(step); else setFrac(NOW);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.5 });
  io.observe(road);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { io.disconnect(); setFrac(NOW); } }, { once: true });
}
