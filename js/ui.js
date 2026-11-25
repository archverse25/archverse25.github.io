// Жижиг туслах функцууд: элемент үүсгэх, мэдэгдэл, цонх, формат.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') {
        // CSS хувьсагч (--x) нь setProperty-гаар л тохирно.
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else el.style[sk] = sv;
        }
      }
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
// Хэрэглэгчид харагдсан алдааг бүртгэлд дамжуулна (app.js сонсоно).
let lastError = null;
export function toast(msg, kind = 'info') {
  if (kind === 'error') {
    const recent = lastError && Date.now() - lastError.at < 2000 ? lastError.e : null;
    document.dispatchEvent(new CustomEvent('monita:error', {
      detail: { msg: String(msg), code: (recent && recent.code) || '', raw: (recent && recent.message) || '' },
    }));
  }
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
  if (e && typeof e === 'object') lastError = { e, at: Date.now() };
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


// ---------- Зүрх, цэцэг, бэлэг, од ----------
// Постерын солонгорсон өнгөөр зурсан жижиг дүрсүүд. Нэг удаа хуудсанд оруулж, <use>-ээр олон газар ашиглана.
// Цасан ширхэг: 6 мөчир, мөчир бүр дээр V хэлбэрийн салаа (архитектурын шугаман хэв маяг).
const SNOW_ARMS = [0, 60, 120, 180, 240, 300].map((a) =>
  `<g transform="rotate(${a} 12 12)"><path d="M12 12V2.6"/><path d="M9.6 5.2 12 7.4l2.4-2.2"/></g>`).join('');
const PETALS = [0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="6.4" rx="3.5" ry="4.7" transform="rotate(${a} 12 12)"/>`).join('');
const MOTIF_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">
<defs>
<linearGradient id="mHeart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC2E6"/><stop offset=".55" stop-color="#FF7EC4"/><stop offset="1" stop-color="#B48BFF"/></linearGradient>
<linearGradient id="mPetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6F3"/><stop offset="1" stop-color="#FF9EDB"/></linearGradient>
<radialGradient id="mCore"><stop offset="0" stop-color="#FFF6D2"/><stop offset="1" stop-color="#FFC46B"/></radialGradient>
<linearGradient id="mBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8FBFF"/><stop offset=".5" stop-color="#8FC2FF"/><stop offset="1" stop-color="#9C7CFF"/></linearGradient>
<linearGradient id="mRibbon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEAB0"/><stop offset="1" stop-color="#FFB46B"/></linearGradient>
<linearGradient id="mSpark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#A6FAFF"/></linearGradient>
<linearGradient id="mTree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DF7D8"/><stop offset=".6" stop-color="#3FC8A8"/><stop offset="1" stop-color="#2A8FA8"/></linearGradient>
<radialGradient id="mBauble" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#FFD9F0"/><stop offset=".5" stop-color="#FF7EC4"/><stop offset="1" stop-color="#8E5CFF"/></radialGradient>
</defs>
<symbol id="m-heart" viewBox="0 0 24 24"><path fill="url(#mHeart)" d="M12 21.2s-7.6-4.7-9.7-9.3C.8 8.4 2.8 4.3 6.8 4.3c2.2 0 3.8 1.2 5.2 3 1.4-1.8 3-3 5.2-3 4 0 6 4.1 4.5 7.6-2.1 4.6-9.7 9.3-9.7 9.3z"/><path fill="#fff" opacity=".5" d="M6.4 6.9c-1.6.3-2.5 1.9-2.2 3.5.7-1.4 1.7-2.3 3-2.6z"/></symbol>
<symbol id="m-flower" viewBox="0 0 24 24"><g fill="url(#mPetal)">${PETALS}</g><circle cx="12" cy="12" r="3.2" fill="url(#mCore)"/></symbol>
<symbol id="m-gift" viewBox="0 0 24 24"><rect x="3.6" y="10" width="16.8" height="10.6" rx="2" fill="url(#mBox)"/><rect x="2.6" y="7.2" width="18.8" height="4" rx="1.4" fill="url(#mBox)"/><rect x="10.6" y="7.2" width="2.8" height="13.4" fill="url(#mRibbon)"/><path fill="url(#mRibbon)" d="M12 7.2c-1.7-3.5-5.8-3.7-5.8-1.3 0 1.6 3.1 1.7 5.8 1.3zm0 0c1.7-3.5 5.8-3.7 5.8-1.3 0 1.6-3.1 1.7-5.8 1.3z"/></symbol>
<symbol id="m-snow" viewBox="0 0 24 24"><g fill="none" stroke="url(#mSpark)" stroke-width="1.6" stroke-linecap="round">${SNOW_ARMS}</g><circle cx="12" cy="12" r="1.6" fill="#fff"/></symbol>
<symbol id="m-tree" viewBox="0 0 24 24"><path fill="url(#mTree)" d="M12 3 6.8 9.6h2.6L5.2 15h3.1L4 20.6h16L15.7 15h3.1l-4.2-5.4h2.6z"/><rect x="10.7" y="20.4" width="2.6" height="2.4" rx=".6" fill="#C98A5B"/><path fill="url(#mRibbon)" d="M12 .9l.75 1.5 1.65.25-1.2 1.15.3 1.65L12 4.7l-1.5.75.3-1.65-1.2-1.15 1.65-.25z"/><circle cx="10" cy="12.6" r=".9" fill="#FFB3E1"/><circle cx="14.2" cy="16.9" r=".9" fill="#FFE7A6"/><circle cx="9.2" cy="18.3" r=".8" fill="#B8FBFF"/></symbol>
<symbol id="m-bauble" viewBox="0 0 24 24"><path d="M12 1.8v3" stroke="#FFE7A6" stroke-width="1.2" fill="none"/><rect x="9.6" y="4.4" width="4.8" height="2.6" rx=".8" fill="url(#mRibbon)"/><circle cx="12" cy="14.3" r="7.6" fill="url(#mBauble)"/><path d="M5.6 13.2c2.1 1.4 10.7 1.4 12.8 0" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none"/><ellipse cx="9.3" cy="11.2" rx="1.6" ry="1" fill="#fff" opacity=".6" transform="rotate(-30 9.3 11.2)"/></symbol>
<linearGradient id="bTree" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="285"><stop offset="0" stop-color="#B4FFE6"/><stop offset=".35" stop-color="#43D3B2"/><stop offset=".7" stop-color="#2A92BC"/><stop offset="1" stop-color="#4B4FC0"/></linearGradient>
<linearGradient id="bGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2C4"/><stop offset=".6" stop-color="#FFC56B"/><stop offset="1" stop-color="#F29A4A"/></linearGradient>
<radialGradient id="bSnowBall" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".65" stop-color="#EEF5FF"/><stop offset="1" stop-color="#C9DBFF"/></radialGradient>
<linearGradient id="bCarrot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB46B"/><stop offset="1" stop-color="#FF7A3D"/></linearGradient>
<linearGradient id="bScarf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9EDB"/><stop offset="1" stop-color="#B48BFF"/></linearGradient>
<linearGradient id="bHat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A6FAFF"/><stop offset="1" stop-color="#6F8BFF"/></linearGradient>
<linearGradient id="bPot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B49CFF"/><stop offset="1" stop-color="#5A3FC0"/></linearGradient>
<linearGradient id="bBract" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9CC8"/><stop offset="1" stop-color="#E8406F"/></linearGradient>
<linearGradient id="bBoxA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8FBFF"/><stop offset="1" stop-color="#6F8BFF"/></linearGradient>
<linearGradient id="bBoxB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC2E6"/><stop offset="1" stop-color="#B48BFF"/></linearGradient>
<symbol id="big-tree" viewBox="0 0 200 300">
  <rect x="87" y="258" width="26" height="34" rx="5" fill="#9A6A4F"/>
  <path fill="url(#bTree)" d="M100 128 179 260Q100 282 21 260Z"/>
  <path fill="url(#bTree)" d="M100 76 162 196Q100 214 38 196Z"/>
  <path fill="url(#bTree)" d="M100 30 140 130Q100 144 60 130Z"/>
  <g fill="#F4FBFF" fill-opacity=".92">
    <path d="M23 258Q38 270 54 262Q70 273 86 264Q100 271 114 264Q130 273 146 262Q162 270 177 258Q100 282 23 258Z"/>
    <path d="M40 194Q53 204 66 198Q80 207 94 200Q108 207 122 199Q136 206 148 198Q155 202 160 194Q100 214 40 194Z"/>
    <path d="M62 128Q72 137 82 132Q92 139 102 133Q114 139 124 132Q132 136 138 128Q100 144 62 128Z"/>
  </g>
  <g fill="none" stroke="url(#bGold)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0.1 9">
    <path d="M70 112Q100 128 132 108"/><path d="M52 178Q100 202 150 174"/><path d="M36 238Q100 262 166 234"/>
  </g>
  <circle cx="68" cy="158" r="7.5" fill="#FF7EC4"/><circle cx="134" cy="150" r="7" fill="#7CF6FF"/><circle cx="100" cy="216" r="8" fill="url(#bGold)"/>
  <circle cx="56" cy="232" r="7.5" fill="#B48BFF"/><circle cx="146" cy="226" r="7.5" fill="#FF7EC4"/><circle cx="90" cy="100" r="6" fill="#7CF6FF"/>
  <circle cx="116" cy="168" r="6" fill="#FFE7A6"/><circle cx="118" cy="244" r="6.5" fill="#7CF6FF"/>
  <g fill="#fff" fill-opacity=".6"><circle cx="65.5" cy="155.5" r="2"/><circle cx="131.5" cy="147.5" r="2"/><circle cx="97" cy="213" r="2.2"/><circle cx="53.5" cy="229.5" r="2"/><circle cx="143.5" cy="223.5" r="2"/></g>
  <path fill="url(#bGold)" d="M100.0,5.0 L104.7,17.5 L118.1,18.1 L107.6,26.5 L111.2,39.4 L100.0,32.0 L88.8,39.4 L92.4,26.5 L81.9,18.1 L95.3,17.5Z"/>
</symbol>
<symbol id="snowman" viewBox="0 0 180 240">
  <ellipse cx="90" cy="232" rx="62" ry="7" fill="#9FB6FF" fill-opacity=".35"/>
  <g stroke="#8A5A44" stroke-width="4" stroke-linecap="round" fill="none">
    <path d="M58 104 16 78M30 87 22 70M36 92 20 96"/><path d="M122 104 164 76M150 86 158 69M144 91 160 94"/>
  </g>
  <circle cx="90" cy="182" r="52" fill="url(#bSnowBall)"/>
  <circle cx="90" cy="110" r="38" fill="url(#bSnowBall)"/>
  <circle cx="90" cy="54" r="28" fill="url(#bSnowBall)"/>
  <path fill="url(#bScarf)" d="M60 80Q90 94 120 80L121 90Q90 104 59 90Z"/>
  <path fill="url(#bScarf)" d="M103 88 112 126 124 122 116 86Z"/>
  <path d="M107 98 118 96M109 108 120 106M111 117 122 115" stroke="#A6FAFF" stroke-width="2.2" stroke-linecap="round"/>
  <path fill="url(#bHat)" d="M64 40Q63 12 90 10Q117 12 116 40Z"/>
  <rect x="61" y="34" width="58" height="10" rx="5" fill="#8FC2FF"/>
  <circle cx="90" cy="9" r="8" fill="#FFFFFF"/>
  <g fill="#3A2466"><circle cx="80" cy="49" r="3.3"/><circle cx="100" cy="49" r="3.3"/>
    <circle cx="78" cy="65" r="1.8"/><circle cx="84" cy="68.5" r="1.8"/><circle cx="90" cy="69.5" r="1.8"/><circle cx="96" cy="68.5" r="1.8"/><circle cx="102" cy="65" r="1.8"/>
    <circle cx="90" cy="104" r="4"/><circle cx="90" cy="120" r="4"/><circle cx="90" cy="168" r="4.6"/><circle cx="90" cy="190" r="4.6"/></g>
  <path fill="url(#bCarrot)" d="M90 55 116 62 90 63Z"/>
  <g fill="#FF7EC4" fill-opacity=".35"><circle cx="73" cy="58" r="4.5"/><circle cx="107" cy="58" r="4.5"/></g>
</symbol>
<symbol id="poinsettia" viewBox="0 0 120 140">
  <g fill="#3FC8A8"><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(15 60 58)'/><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(75 60 58)'/><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(135 60 58)'/><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(195 60 58)'/><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(255 60 58)'/><ellipse cx='60' cy='30' rx='9' ry='20' transform='rotate(315 60 58)'/></g>
  <g fill="url(#bBract)"><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(0 60 58)'/><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(60 60 58)'/><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(120 60 58)'/><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(180 60 58)'/><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(240 60 58)'/><path d='M60 58C52 47 53 31 60 19C67 31 68 47 60 58Z' transform='rotate(300 60 58)'/></g>
  <g fill="#FF6FA8"><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(30 60 58)'/><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(90 60 58)'/><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(150 60 58)'/><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(210 60 58)'/><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(270 60 58)'/><path d='M60 58C55 50 55 40 60 32C65 40 65 50 60 58Z' transform='rotate(330 60 58)'/></g>
  <g fill="#FFD27A"><circle cx='64.0' cy='58.0' r='2.2'/><circle cx='61.2' cy='61.8' r='2.2'/><circle cx='56.8' cy='60.4' r='2.2'/><circle cx='56.8' cy='55.6' r='2.2'/><circle cx='61.2' cy='54.2' r='2.2'/></g>
  <rect x="28" y="86" width="64" height="11" rx="4" fill="#C2AEFF"/>
  <path fill="url(#bPot)" d="M33 97H87L80 136H40Z"/>
</symbol>
<symbol id="giftbox-a" viewBox="0 0 60 56">
  <rect x="6" y="22" width="48" height="32" rx="4" fill="url(#bBoxA)"/><rect x="3" y="14" width="54" height="11" rx="3" fill="url(#bBoxA)"/>
  <rect x="26" y="14" width="8" height="40" fill="url(#bGold)"/>
  <path fill="url(#bGold)" d="M30 14C25 3 13 2 13 9 13 14 22 15 30 14ZM30 14C35 3 47 2 47 9 47 14 38 15 30 14Z"/>
</symbol>
<symbol id="giftbox-b" viewBox="0 0 60 56">
  <rect x="6" y="22" width="48" height="32" rx="4" fill="url(#bBoxB)"/><rect x="3" y="14" width="54" height="11" rx="3" fill="url(#bBoxB)"/>
  <rect x="26" y="14" width="8" height="40" fill="#FFFFFF" fill-opacity=".9"/>
  <path fill="#FFFFFF" fill-opacity=".92" d="M30 14C25 3 13 2 13 9 13 14 22 15 30 14ZM30 14C35 3 47 2 47 9 47 14 38 15 30 14Z"/>
</symbol>
<linearGradient id="sDeer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2A07E"/><stop offset="1" stop-color="#8A5A44"/></linearGradient>
<linearGradient id="sAntler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF2C4"/><stop offset="1" stop-color="#E0B27A"/></linearGradient>
<linearGradient id="sSleigh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9EDB"/><stop offset=".55" stop-color="#B48BFF"/><stop offset="1" stop-color="#6F8BFF"/></linearGradient>
<linearGradient id="sCoat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6F8F"/><stop offset="1" stop-color="#D62E5E"/></linearGradient>
<symbol id="sleigh" viewBox="0 0 270 100">
  <g fill="#FFFFFF"><path transform="translate(8 52) scale(.55)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z" fill-opacity=".5"/>
    <path transform="translate(22 40) scale(.8)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z" fill-opacity=".75"/>
    <path transform="translate(14 66) scale(.45)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z" fill-opacity=".4"/></g>
  <path d="M120 60 L162 52 L222 46" stroke="url(#bGold)" stroke-width="1.8" fill="none"/>
  <g transform="translate(150 30)">
  <g stroke="url(#sAntler)" stroke-width="2.2" stroke-linecap="round" fill="none">
    <path d="M44 14 41 3M41 8 36 4M42.5 6 46 1"/><path d="M48 14 50 3M49.5 8 54 4"/>
  </g>
  <g stroke="#7A5242" stroke-width="3.2" stroke-linecap="round" fill="none">
    <path d="M30 34 40 46"/><path d="M34 34 46 42"/><path d="M12 34 2 44"/><path d="M16 35 8 47"/>
  </g>
  <ellipse cx="22" cy="28" rx="17" ry="9" fill="url(#sDeer)"/>
  <ellipse cx="22" cy="31" rx="11" ry="4.5" fill="#F3DCC6" fill-opacity=".7"/>
  <path d="M34 24 Q40 14 44 13 L48 16 Q42 22 38 30Z" fill="url(#sDeer)"/>
  <ellipse cx="47" cy="15" rx="6.5" ry="4.6" fill="url(#sDeer)"/>
  <circle cx="53" cy="16" r="2" fill="#FFD27A"/>
  <circle cx="48" cy="13.4" r="1.1" fill="#3A2466"/>
  <path d="M5 24 Q1 21 2 18" stroke="#B9876A" stroke-width="3" stroke-linecap="round" fill="none"/>
</g>
  <g transform="translate(208 22)">
  <g stroke="url(#sAntler)" stroke-width="2.2" stroke-linecap="round" fill="none">
    <path d="M44 14 41 3M41 8 36 4M42.5 6 46 1"/><path d="M48 14 50 3M49.5 8 54 4"/>
  </g>
  <g stroke="#7A5242" stroke-width="3.2" stroke-linecap="round" fill="none">
    <path d="M30 34 40 46"/><path d="M34 34 46 42"/><path d="M12 34 2 44"/><path d="M16 35 8 47"/>
  </g>
  <ellipse cx="22" cy="28" rx="17" ry="9" fill="url(#sDeer)"/>
  <ellipse cx="22" cy="31" rx="11" ry="4.5" fill="#F3DCC6" fill-opacity=".7"/>
  <path d="M34 24 Q40 14 44 13 L48 16 Q42 22 38 30Z" fill="url(#sDeer)"/>
  <ellipse cx="47" cy="15" rx="6.5" ry="4.6" fill="url(#sDeer)"/>
  <circle cx="53" cy="16" r="2" fill="#FFD27A"/>
  <circle cx="48" cy="13.4" r="1.1" fill="#3A2466"/>
  <path d="M5 24 Q1 21 2 18" stroke="#B9876A" stroke-width="3" stroke-linecap="round" fill="none"/>
</g>
  <path d="M36 84 H124 Q138 84 138 74 Q138 68 132 68" stroke="url(#bGold)" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <path d="M50 80 V70M112 80 V70" stroke="url(#bGold)" stroke-width="2.4"/>
  <ellipse cx="58" cy="42" rx="18" ry="16" fill="#E9C9A0"/>
  <path d="M46 30 Q58 24 70 30" stroke="#C79F72" stroke-width="2" fill="none"/>
  <rect x="44" y="18" width="13" height="12" rx="2" fill="url(#bBoxA)"/><rect x="49" y="18" width="3" height="12" fill="url(#bGold)"/>
  <rect x="58" y="14" width="12" height="14" rx="2" fill="url(#bBoxB)"/><rect x="62.5" y="14" width="3" height="14" fill="#fff" fill-opacity=".9"/>
  <ellipse cx="92" cy="46" rx="15" ry="14" fill="url(#sCoat)"/>
  <rect x="78" y="48" width="28" height="5" rx="2.5" fill="#FFFFFF"/>
  <circle cx="98" cy="26" r="8" fill="#FFD9B8"/>
  <path d="M89 27 Q98 46 107 27 Q98 33 89 27Z" fill="#FFFFFF"/>
  <path d="M89 22 Q96 6 110 14 L106 22Z" fill="url(#sCoat)"/>
  <rect x="88" y="19.5" width="19" height="4.5" rx="2.2" fill="#FFFFFF"/>
  <circle cx="111" cy="14" r="3.2" fill="#FFFFFF"/>
  <circle cx="101" cy="25" r="1.1" fill="#3A2466"/><circle cx="96" cy="25" r="1.1" fill="#3A2466"/>
  <path d="M104 40 L116 28" stroke="url(#sCoat)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="117" cy="26.5" r="3.8" fill="#3FC8A8"/>
  <path fill="url(#sSleigh)" d="M28 50 Q30 76 58 78 H118 Q132 76 134 58 L124 54 Q120 66 108 66 H62 Q46 64 44 48Z"/>
  <path d="M30 56 Q36 72 58 74" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none"/>
  <circle cx="126" cy="56" r="3" fill="url(#bGold)"/>
</symbol>
<symbol id="m-spark" viewBox="0 0 24 24"><path fill="url(#mSpark)" d="M12 2.5c.6 4.4 2.4 7 7.6 9.5-5.2 2.5-7 5.1-7.6 9.5-.6-4.4-2.4-7-7.6-9.5 5.2-2.5 7-5.1 7.6-9.5z"/></symbol>
</svg>`;
let spriteReady = false;
function ensureSprite() {
  if (spriteReady) return;
  spriteReady = true;
  const t = document.createElement('template');
  t.innerHTML = MOTIF_SPRITE.trim();
  document.body.prepend(t.content.firstChild);
}
const SVG_NS = 'http://www.w3.org/2000/svg';
export function motif(name, cls = '') {
  ensureSprite();
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('class', ('motif ' + cls).trim());
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const u = document.createElementNS(SVG_NS, 'use');
  u.setAttribute('href', '#m-' + name);
  s.appendChild(u);
  return s;
}
export function setMotif(svgEl, name) {
  const u = svgEl.querySelector('use');
  if (u) u.setAttribute('href', '#m-' + name);
}

// Баярын агшинд (бэлэг нээх, захидал илгээх, санал өгөх) дүрсүүд цацарна.
const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function burst(anchor, { kinds = ['heart', 'snow', 'gift', 'flower', 'bauble', 'spark'], count = 16, spread = 110 } = {}) {
  if (REDUCED_MOTION || !anchor) return;
  const r = anchor.getBoundingClientRect();
  if (!r.width && !r.height) return;
  const layer = document.createElement('div');
  layer.className = 'burst';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = `${r.left + r.width / 2}px`;
  layer.style.top = `${r.top + r.height / 2}px`;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const d = spread * (0.45 + Math.random() * 0.75);
    const bit = document.createElement('span');
    bit.className = 'burst-bit';
    bit.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    bit.style.setProperty('--dy', `${Math.sin(a) * d - 30}px`);
    bit.style.setProperty('--r', `${Math.round(Math.random() * 120 - 60)}deg`);
    bit.style.setProperty('--s', `${Math.round(14 + Math.random() * 14)}px`);
    bit.style.setProperty('--delay', `${Math.round(Math.random() * 90)}ms`);
    bit.appendChild(motif(kinds[i % kinds.length]));
    layer.appendChild(bit);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1500);
}

// Цастай үзэгдэл: гацуур мод, цасан хүн, цэцэг (пуансеттиа), бэлгийн хайрцаг.
export const WINTER_SCENE = `<svg class="scene-svg" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs><linearGradient id="sGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C6D6FF"/></linearGradient></defs>
<g class="scene-stars" fill="#fff">
  <path transform="translate(140 60)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/><path transform="translate(360 30) scale(.7)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/><path transform="translate(820 44)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/>
  <path transform="translate(1040 70) scale(.8)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/><path transform="translate(620 20) scale(.6)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/><path transform="translate(240 110) scale(.5)" d="M0 -6C.4 -2 1.6 -.6 6 0 1.6 .6 .4 2 0 6-.4 2-1.6 .6-6 0-1.6-.6-.4-2 0-6Z"/>
</g>
<path fill="#DCE7FF" fill-opacity=".45" d="M0 206C150 186 260 198 380 202 520 208 640 188 760 196 900 206 1020 188 1200 198V240H0Z"/>
<use href="#poinsettia" x="60" y="120" width="80" height="94"/>
<use href="#giftbox-a" x="150" y="174" width="48" height="45"/><use href="#giftbox-b" x="192" y="186" width="36" height="34"/>
<use href="#big-tree" x="276" y="110" width="70" height="105"/>
<use href="#big-tree" x="420" y="-6" width="148" height="222"/>
<use href="#giftbox-b" x="384" y="186" width="36" height="33"/><use href="#giftbox-a" x="552" y="180" width="44" height="40"/><use href="#giftbox-b" x="590" y="194" width="28" height="26"/>
<use href="#snowman" x="632" y="40" width="132" height="176"/>
<g class="scene-sleigh"><use href="#sleigh" x="850" y="4" width="230" height="85"/></g>
<use href="#giftbox-b" x="790" y="178" width="46" height="43"/><use href="#giftbox-a" x="832" y="188" width="36" height="34"/>
<use href="#poinsettia" x="930" y="124" width="74" height="88"/>
<use href="#big-tree" x="1060" y="96" width="80" height="120"/>
<path fill="url(#sGround)" d="M0 220C200 204 320 214 460 216 620 218 720 204 860 212 980 218 1080 208 1200 214V240H0Z"/>
<g fill="#fff" fill-opacity=".8"><circle cx="120" cy="228" r="1.5"/><circle cx="380" cy="230" r="1.2"/><circle cx="700" cy="232" r="1.4"/><circle cx="980" cy="229" r="1.2"/></g>
</svg>`;
export function ensureMotifSprite() {
  ensureSprite();
}
