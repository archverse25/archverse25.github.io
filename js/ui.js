// Жижиг туслах функцууд: элемент үүсгэх, мэдэгдэл, цонх, формат.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'required') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function svg(markup, cls = 'icon') {
  const span = document.createElement('span');
  span.className = cls;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = markup;
  return span;
}

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const icons = {
  home: I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  bell: I('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  shield: I('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  logout: I('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>'),
  trash: I('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  upload: I('<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
  grid: I('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  download: I('<path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V4H4v12h4"/>'),
};

// Жижиг солонгорсон куб (лого).
export const GIFT_MINI = `<svg viewBox="0 0 32 32">
  <defs>
    <linearGradient id="mcT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9FCFF"/><stop offset="1" stop-color="#8FB8FF"/></linearGradient>
    <linearGradient id="mcL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DF3FF"/><stop offset="1" stop-color="#3A6BFF"/></linearGradient>
    <linearGradient id="mcR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A86FF"/><stop offset=".6" stop-color="#B04BFF"/><stop offset="1" stop-color="#FF6FCF"/></linearGradient>
  </defs>
  <path d="M16 3 28 10 16 17 4 10Z" fill="url(#mcT)"/>
  <path d="M4 10 16 17V30L4 23Z" fill="url(#mcL)"/>
  <path d="M28 10 16 17V30L28 23Z" fill="url(#mcR)"/>
</svg>`;

// Постер шиг солонгорсон хоёр куб.
export const HERO_ART = `<svg class="hero-art" viewBox="0 0 320 250" role="img" aria-label="Солонгорсон куб">
  <defs>
    <linearGradient id="hT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D2FDFF"/><stop offset=".55" stop-color="#9FE9FF"/><stop offset="1" stop-color="#8E9BFF"/></linearGradient>
    <linearGradient id="hL" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#9AF6FF"/><stop offset=".55" stop-color="#2FC6E8"/><stop offset="1" stop-color="#3155F2"/></linearGradient>
    <linearGradient id="hR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F8BFF"/><stop offset=".45" stop-color="#18C7C9"/><stop offset=".7" stop-color="#7B45FF"/><stop offset="1" stop-color="#F563D6"/></linearGradient>
    <linearGradient id="sT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE0F4"/><stop offset="1" stop-color="#B58CFF"/></linearGradient>
    <linearGradient id="sL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB8E2"/><stop offset="1" stop-color="#8B3DFF"/></linearGradient>
    <linearGradient id="sR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E24BFF"/><stop offset=".6" stop-color="#5A7BFF"/><stop offset="1" stop-color="#FFC9A8"/></linearGradient>
  </defs>
  <g class="cube cube-big">
    <g transform="rotate(-9 182 112)">
      <path d="M182 26 256 69 182 112 108 69Z" fill="url(#hT)"/>
      <path d="M108 69 182 112V198L108 155Z" fill="url(#hL)"/>
      <path d="M256 69 182 112V198L256 155Z" fill="url(#hR)"/>
      <path d="M108 155 182 198" stroke="#F3FF8C" stroke-width="1.4" fill="none"/>
      <path d="M108 69 182 112 256 69" stroke="rgba(255,255,255,.75)" stroke-width="1.2" fill="none"/>
    </g>
  </g>
  <g class="cube cube-small">
    <g transform="rotate(24 58 196)">
      <path d="M58 168 82 182 58 196 34 182Z" fill="url(#sT)"/>
      <path d="M34 182 58 196V224L34 210Z" fill="url(#sL)"/>
      <path d="M82 182 58 196V224L82 210Z" fill="url(#sR)"/>
    </g>
  </g>
</svg>`;

// Том дэлгэцийн арын бүдэг кубууд (постер шиг).
export const DECO_ART = `<svg class="deco-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="dT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D2FDFF"/><stop offset="1" stop-color="#8E9BFF"/></linearGradient>
    <linearGradient id="dL" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#9AF6FF"/><stop offset="1" stop-color="#3155F2"/></linearGradient>
    <linearGradient id="dR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F8BFF"/><stop offset=".6" stop-color="#7B45FF"/><stop offset="1" stop-color="#F563D6"/></linearGradient>
    <linearGradient id="eT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE0F4"/><stop offset="1" stop-color="#B58CFF"/></linearGradient>
    <linearGradient id="eL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB8E2"/><stop offset="1" stop-color="#8B3DFF"/></linearGradient>
    <linearGradient id="eR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E24BFF"/><stop offset=".6" stop-color="#5A7BFF"/><stop offset="1" stop-color="#FFC9A8"/></linearGradient>
  </defs>
  <g class="deco-move-a"><g class="deco-a" transform="translate(70 40) rotate(-12 930 560)">
    <path d="M930 420 1051 490 930 560 809 490Z" fill="url(#dT)"/>
    <path d="M809 490 930 560V700L809 630Z" fill="url(#dL)"/>
    <path d="M1051 490 930 560V700L1051 630Z" fill="url(#dR)"/>
  </g>
  </g><g class="deco-move-b"><g class="deco-b" transform="translate(-50 430) rotate(22 70 150)">
    <path d="M70 110 105 130 70 150 35 130Z" fill="url(#eT)"/>
    <path d="M35 130 70 150V190L35 170Z" fill="url(#eL)"/>
    <path d="M105 130 70 150V190L105 170Z" fill="url(#eR)"/>
  </g>
</g>
</svg>`;

let toastTimer;
export function toast(msg, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(el);
  }
  el.className = 'toast show ' + kind;
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), kind === 'error' ? 7000 : 3500);
}

export function openDialog(content, { title, wide = false, onClose } = {}) {
  const dlg = h('dialog', { class: 'dialog' + (wide ? ' wide' : '') });
  const close = () => {
    if (dlg.open) dlg.close();
  };
  dlg.addEventListener('close', () => {
    dlg.remove();
    onClose && onClose();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  dlg.append(
    h('div', { class: 'dialog-head' },
      title ? h('h2', { class: 'dialog-title' }, title) : h('span'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Хаах', onclick: close }, svg(icons.close))),
    h('div', { class: 'dialog-body' }, content),
  );
  document.body.appendChild(dlg);
  dlg.showModal();
  return close;
}

export function confirmDialog({ title, body, extra = null, ok = 'Тийм', cancel = 'Болих', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const close = openDialog(
      h('div', null,
        body ? h('p', { class: 'dialog-text' }, body) : null,
        extra,
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => close() }, cancel),
          h('button', {
            class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'),
            type: 'button',
            onclick: () => {
              result = true;
              close();
            },
          }, ok))),
      { title, onClose: () => resolve(result) },
    );
  });
}

// Өдөр: хуучин хувилбарт зөвхөн бичвэр байсан, одоо {theme, files, ratios}.
const EMPTY_DAY = { theme: '', date: '', desc: '', budget: 0, time: '', place: '', files: [], ratios: [] };
export function normDay(d) {
  if (!d) return { ...EMPTY_DAY };
  if (typeof d === 'string') return { ...EMPTY_DAY, theme: d };
  return {
    theme: d.theme || '', date: d.date || '', desc: d.desc || '', budget: +d.budget || 0,
    time: d.time || '', place: d.place || '', files: d.files || [], ratios: d.ratios || [],
  };
}
// 20000 → "20,000₮"
export function fmtMoney(n) {
  return n ? `${Math.round(n).toLocaleString('en-US')}₮` : '';
}

// Өдрийн огноо 'YYYY-MM-DD' хэлбэрээр хадгалагдана.
const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
export function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  return { y, mo, d, wd: WEEKDAYS[new Date(y, mo - 1, d).getDay()] };
}
export function fmtDay(s) {
  const p = parseDay(s);
  return p ? `${p.y} оны ${p.mo}-р сарын ${p.d}, ${p.wd} гараг` : '';
}
export function isoDay(date) {
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}
export function nextIsoDay(s) {
  const p = parseDay(s);
  return isoDay(p ? new Date(p.y, p.mo - 1, p.d + 1) : new Date());
}

export function initial(s) {
  return (String(s || '').trim()[0] || '').toUpperCase();
}
export function shortName(p) {
  if (!p) return '—';
  return `${initial(p.lastName)}.${p.firstName}`;
}
export function fullName(p) {
  if (!p) return '—';
  return `${p.lastName} ${p.firstName}`;
}
export function genderLabel(g) {
  return g === 'male' ? 'Эрэгтэй' : g === 'female' ? 'Эмэгтэй' : '—';
}
export function fmtPhone(p) {
  const s = String(p || '');
  return s.length === 8 ? `${s.slice(0, 4)} ${s.slice(4)}` : s;
}
export function toMillis(t) {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t.seconds) return t.seconds * 1000;
  return +t || 0;
}
export function fmtDate(t) {
  const ms = toMillis(t);
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Firebase алдааг ойлгомжтой болгох. Кодыг нь хадгална — дэлгэцийн зураг илгээхэд хэрэгтэй.
export function errText(e, fallback = 'Алдаа гарлаа') {
  const code = (e && e.code) || '';
  const map = {
    'permission-denied': 'Энэ үйлдлийг хийх эрх алга.',
    'unavailable': 'Сервертэй холбогдож чадсангүй. Интернэтээ шалгана уу.',
    'auth/network-request-failed': 'Интернэт холболтоо шалгана уу.',
    'auth/popup-blocked': 'Хөтөч нэвтрэх цонхыг хаасан байна. Дахин дарна уу.',
    'auth/unauthorized-domain': 'Энэ хаяг Firebase-д бүртгэгдээгүй байна.',
    'auth/too-many-requests': 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.',
    'auth/internal-error': 'Нэвтрэх үед дотоод алдаа гарлаа.',
    'auth/web-storage-unsupported': 'Хөтчийн күүки/хадгалах сан хаалттай байна. Chrome эсвэл Safari-гаар энгийн цонхонд нээнэ үү.',
    'auth/operation-not-supported-in-this-environment': 'Энэ хөтчөөр нэвтрэх боломжгүй. Chrome эсвэл Safari-гаар нээнэ үү.',
    'resource-exhausted': 'Сайтын өдрийн хязгаар түр дүүрсэн байна. Хэсэг хугацааны дараа дахин оролдоно уу.',
    'deadline-exceeded': 'Сервер хариу өгөхгүй удаж байна. Дахин оролдоно уу.',
    'failed-precondition': 'Сайт өөр цонхонд нээлттэй байж магадгүй. Бусад цонхыг хаагаад дахин ачаална уу.',
  };
  const msg = map[code] || (e && e.userMessage) || fallback;
  // Энгийн хэрэглэгчид ойлгомжтой байлгахын тулд кодыг зөвхөн тодорхойгүй алдаанд үлдээнэ.
  return code && !map[code] ? `${msg} (${code})` : msg;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
