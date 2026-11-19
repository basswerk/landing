// basswerk landing. Без JS страница целиком читается; JS добавляет интерактив и макеты.

const V = new URL(import.meta.url).search;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO = 'IntersectionObserver' in window;

// Блоки грузятся, когда до них остаётся меньше полутора экранов
function lazy(sel, file) {
  const el = document.querySelector(sel);
  if (!el) return;
  const load = () => import('./blocks/' + file + V).then((m) => m.default(el)).catch(() => {});
  if (!hasIO) { load(); return; }
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    load();
  }, { rootMargin: '150% 0px' });
  io.observe(el);
}
lazy('.hero', 'eq.js');
lazy('[data-feed]', 'feed.js');
lazy('.road', 'road.js');

// Анимация призрака на паузе, когда первый экран не виден
const hero = document.querySelector('.hero');
if (hero && hasIO) {
  new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
}

// «Скопировать ссылку» в макете лицензии
for (const btn of document.querySelectorAll('[data-copy]')) {
  let timer = 0;
  btn.addEventListener('click', async () => {
    const url = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; ta.setAttribute('readonly', ''); ta.className = 'sr';
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* не вышло, молча */ }
      ta.remove();
    }
    btn.classList.add('is-done');
    clearTimeout(timer);
    timer = setTimeout(() => btn.classList.remove('is-done'), 2000);
  });
}

// Плавное появление блоков ниже первого экрана. Вкладка в фоне: не включаем
if (!reduce && hasIO && document.visibilityState === 'visible') {
  const waiting = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
      waiting.delete(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  for (const el of document.querySelectorAll('[data-rv]')) {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('rv');
      io.observe(el);
      waiting.add(el);
    }
  }

  // Ушли в фон до того, как докрутили: показываем всё сразу
  const showAll = () => {
    if (!document.hidden) return;
    for (const el of waiting) el.classList.remove('rv');
    waiting.clear();
    io.disconnect();
    document.removeEventListener('visibilitychange', showAll);
  };
  document.addEventListener('visibilitychange', showAll);
}
