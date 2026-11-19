// Макет ленты: вкладки «Для тебя / Подписки», фильтры по типам, лайки, волны с наведением.
// Звука нет: кнопка play серая и не нажимается.

import { paintWave, hoverable } from './wave.js?v=20261120m';

const BEATS = {
  killswitch: { t: 'KILLSWITCH', by: 'papaguap', hue: 185, s: 59, rub: '2 290', dur: 168, seed: 3 },
  nocturne: { t: 'NOCTURNE', by: 'morkowka', hue: 325, s: 60, rub: '1 990', dur: 185, seed: 7 },
  midnight: { t: 'MIDNIGHT', hue: 55, s: 41 },
  haunted: { t: 'HAUNTED', hue: 105, s: 55 },
  redroom: { t: 'REDROOM', hue: 355, s: 60 },
  glasshouse: { t: 'GLASSHOUSE', hue: 155, s: 56 },
  lowend: { t: 'LOW END', hue: 15, s: 60 },
  static: { t: 'STATIC', hue: 45, s: 60 },
  coldhands: { t: 'COLD HANDS', hue: 215, s: 60 },
  graveyard: { t: 'GRAVEYARD', hue: 225, s: 51 },
  motel: { t: 'MOTEL', by: 'slaywitme', hue: 25, s: 60, rub: '2 490', dur: 152, seed: 11 },
  bleed: { t: 'BLEED', hue: 275, s: 60 },
};

const FEED = [
  { t: 'post', who: 'papaguap', time: '12 мин', text: 'KILLSWITCH уже в ленте. Эксклюзив пока свободен, присылай оффер.', beat: 'killswitch', likes: 86, coms: 12 },
  { t: 'sale', who: 'KRXXK', time: '18 мин', lic: 'WAV', beat: 'bleed', amt: '+3 490 ₽' },
  { t: 'beat', who: 'Muney Jordan', time: '25 мин', beat: 'midnight' },
  { t: 'post', who: 'morkowka', time: '41 мин', text: 'NOCTURNE вышел. Этот бит уже готов для твоего голоска.', beat: 'nocturne', likes: 57, coms: 14 },
  { t: 'repost', who: 'boolymon', time: '52 мин', beat: 'haunted' },
  { t: 'sale', who: 'makkgin', time: '1 ч', lic: 'эксклюзив', beat: 'redroom', amt: '+24 900 ₽' },
  { t: 'post', who: 'gyro', time: '1 ч', text: 'Перерисовал обложку для GLASSHOUSE, старая была слишком светлая. Как вам?', img: 'glasshouse', likes: 112, coms: 9 },
  { t: 'beat', who: 'skai', time: '2 ч', beat: 'lowend' },
  { t: 'sale', who: 'legion', time: '2 ч', lic: 'MP3', beat: 'static', amt: '+1 990 ₽' },
  { t: 'post', who: 'ok', time: '3 ч', text: 'Завтра в 19:00 дроп нового бита. Кто подписан, увидит первым.', likes: 34, coms: 5 },
  { t: 'repost', who: 'zatru', time: '3 ч', beat: 'killswitch' },
  { t: 'beat', who: 'yoi', time: '4 ч', beat: 'coldhands' },
  { t: 'sale', who: 'cight', time: '5 ч', lic: 'Track Out', beat: 'graveyard', amt: '+6 990 ₽' },
  { t: 'post', who: 'slaywitme', time: '6 ч', text: 'MOTEL за сутки зашёл в горячие. Спасибо всем, кто взял лиз.', beat: 'motel', likes: 140, coms: 21 },
];
FEED.forEach((e, i) => { e.id = i; });

const SUBS = new Set(['papaguap', 'morkowka', 'gyro', 'ok', 'skai', 'cight', 'slaywitme']);
const TYPES = [['post', 'Посты'], ['beat', 'Биты'], ['sale', 'Продажи'], ['repost', 'Репосты']];

const I = {
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  msg: '<path d="M5 5h14v10H9l-4 4V5Z"/>',
  repost: '<path d="M7 7h10v4M17 17H7v-4M14 4l3 3-3 3M10 20l-3-3 3-3"/>',
  share: '<path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6"/>',
  bag: '<path d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0"/>',
  note: '<path d="M9 17V5l10-2v12M9 17a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z"/>',
};
const ic = (name, size, fill = false) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;
const PLAY = '<svg class="i" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5-13-7.5Z"/></svg>';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initial = (n) => esc(n.trim()[0].toUpperCase());
const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const cover = (id, cls) => {
  const b = BEATS[id];
  return `<span class="${cls}" data-hue="${b.hue}" data-s="${b.s}" data-n="${b.t.length}"><span>${esc(b.t)}</span></span>`;
};

function attHTML(id) {
  const b = BEATS[id];
  return `<div class="att">${cover(id, 'cv cv-att')}<div class="att-main"><div class="att-top">` +
    `<span class="pl" aria-disabled="true">${PLAY}</span>` +
    `<div class="att-tt"><span class="att-t">${esc(b.t)}</span><span class="att-s">prod. by ${esc(b.by)}</span></div>` +
    `<span class="att-price">от ${b.rub} ₽</span></div>` +
    `<div class="wave" data-beat="${id}"><canvas></canvas></div></div></div>`;
}

function postHTML(e, liked) {
  let h = `<li class="post"><div class="p-head"><span class="av">${initial(e.who)}</span><div><b>${esc(e.who)}</b><small>${e.time}</small></div></div>`;
  h += `<p class="p-text">${esc(e.text)}</p>`;
  if (e.img) h += cover(e.img, 'cv cv-img');
  if (e.beat) h += attHTML(e.beat);
  h += `<div class="p-acts"><button type="button" class="like${liked ? ' on' : ''}" data-like="${e.id}" aria-pressed="${liked}">` +
    `${ic('heart', 17, liked)}<span class="sr">Нравится, </span>${e.likes + (liked ? 1 : 0)}</button>` +
    `<span>${ic('msg', 17)}<span class="sr">Комментарии, </span>${e.coms}</span><span>${ic('repost', 17)}</span><span>${ic('share', 17)}</span></div></li>`;
  return h;
}

function eventHTML(e) {
  const b = BEATS[e.beat];
  const text = e.t === 'sale' ? `продал ${e.lic} на` : e.t === 'beat' ? 'выложил новый бит' : 'репостнул';
  const icon = { sale: 'bag', beat: 'note', repost: 'repost' }[e.t];
  const side = e.t === 'sale' ? `<span class="ev-amt">${e.amt}</span>` : cover(e.beat, 'cv cv-ev');
  return `<li class="ev"><span class="ev-av"><span class="av">${initial(e.who)}</span><i class="${e.t}">${ic(icon, 11)}</i></span>` +
    `<p><b>${esc(e.who)}</b> <span class="muted">${text}</span> <span class="lnk">${esc(b.t)}</span><small>${e.time}</small></p>${side}</li>`;
}

export default function initFeed(root) {
  const st = { tab: 'foryou', off: new Set(), liked: new Set() };

  root.innerHTML =
    `<div class="fd-head"><div class="seg" role="group" aria-label="Чья лента">` +
    `<button type="button" data-tab="foryou" aria-pressed="true">Для тебя</button><button type="button" data-tab="subs" aria-pressed="false">Подписки</button></div>` +
    `<div class="chips" role="group" aria-label="Что показывать">` +
    TYPES.map(([t, name]) => `<button type="button" data-type="${t}" aria-pressed="true">${name}</button>`).join('') +
    `</div></div><ol class="fd-list" tabindex="0" aria-label="Лента, макет"></ol>`;
  const list = root.querySelector('.fd-list');
  const waves = [];

  function paintCovers(scope) {
    for (const el of scope.querySelectorAll('[data-hue]')) {
      el.style.setProperty('--cv', `hsl(${el.dataset.hue} ${el.dataset.s}% 20%)`);
      el.style.setProperty('--n', el.dataset.n);
    }
  }

  function render() {
    const items = FEED.filter((e) => !st.off.has(e.t) && (st.tab !== 'subs' || SUBS.has(e.who)));
    list.innerHTML = items.length
      ? items.map((e) => (e.t === 'post' ? postHTML(e, st.liked.has(e.id)) : eventHTML(e))).join('') +
        '<li class="fd-end">Дальше старые события. В макете лента на этом заканчивается.</li>'
      : '<li class="fd-empty">Тут пока тихо. Включи хотя бы один тип событий.</li>';
    paintCovers(list);
    waves.length = 0;
    for (const box of list.querySelectorAll('.wave')) {
      const cv = box.querySelector('canvas'), b = BEATS[box.dataset.beat];
      const draw = (hover = -1) => paintWave(cv, { hover, top: 22, bot: 10, seed: b.seed });
      hoverable(box, cv, draw, (f) => fmt(f * b.dur));
      waves.push(draw);
      draw();
    }
  }

  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]'), type = e.target.closest('[data-type]'), like = e.target.closest('[data-like]');
    if (tab) {
      st.tab = tab.dataset.tab;
      for (const b of root.querySelectorAll('[data-tab]')) b.setAttribute('aria-pressed', String(b === tab));
      list.scrollTop = 0;
      render();
    } else if (type) {
      const t = type.dataset.type, on = st.off.has(t);
      if (on) st.off.delete(t); else st.off.add(t);
      type.setAttribute('aria-pressed', String(on));
      list.scrollTop = 0;
      render();
    } else if (like) {
      const id = +like.dataset.like, e2 = FEED[id];
      if (st.liked.has(id)) st.liked.delete(id); else st.liked.add(id);
      const liked = st.liked.has(id);
      like.classList.toggle('on', liked);
      like.setAttribute('aria-pressed', String(liked));
      like.innerHTML = `${ic('heart', 17, liked)}<span class="sr">Нравится, </span>${e2.likes + (liked ? 1 : 0)}`;
    }
  });

  new ResizeObserver(() => waves.forEach((d) => d())).observe(list);
  render();
}
