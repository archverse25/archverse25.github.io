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
  copy: I('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V4H4v12h4"/>'),
};

export const GIFT_MINI = `<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 6 27 12 16 18 5 12Z M5 12v10l11 6 11-6V12 M16 18v10" stroke="currentColor" stroke-width="1.6"/>
  <path d="M10.5 9 21.5 15M21.5 9 10.5 15M10.5 15v10M21.5 15v10" stroke="var(--holly)" stroke-width="1.8"/>
</svg>`;

// Аксонометр бэлгийн хайрцаг, доор нь хэмжээсийн шугам (архитектур зургийн хэв маяг).
export const HERO_ART = `<svg class="hero-art" viewBox="0 0 260 250" role="img" aria-label="Бэлгийн хайрцагны аксонометр зураг">
  <g class="ax-hidden" stroke="var(--pine)" stroke-width="1" stroke-dasharray="3 4" fill="none">
    <path d="M52.06 135 130 90 207.94 135 M130 20V90"/>
  </g>
  <g class="ax" stroke="var(--pine)" stroke-width="1.6" fill="none" stroke-linejoin="round">
    <path pathLength="1" d="M130 20 207.94 65 130 110 52.06 65Z"/>
    <path pathLength="1" d="M52.06 65V135L130 180 207.94 135V65"/>
    <path pathLength="1" d="M130 110V180"/>
  </g>
  <g class="ax ribbon" stroke="var(--holly)" stroke-width="4.5" fill="none" stroke-linecap="butt">
    <path pathLength="1" d="M168.97 42.5 91.03 87.5V157.5"/>
    <path pathLength="1" d="M91.03 42.5 168.97 87.5V157.5"/>
  </g>
  <g class="ax bow" stroke="var(--holly)" stroke-width="2" fill="none" stroke-linecap="round">
    <path pathLength="1" d="M130 64C118 46 98 44 104 56 108 64 122 65 130 64Z"/>
    <path pathLength="1" d="M130 64C142 46 162 44 156 56 152 64 138 65 130 64Z"/>
  </g>
  <g class="dim" stroke="var(--pine)" stroke-width="1" fill="none">
    <path d="M52.06 190V226M207.94 190V226"/>
    <path d="M40 220H220"/>
    <path d="M47 225 57 215M202.94 225 212.94 215" stroke-width="1.6"/>
  </g>
  <text class="dim-label" x="130" y="212" text-anchor="middle">2027</text>
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

export function confirmDialog({ title, body, ok = 'Тийм', cancel = 'Болих', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const close = openDialog(
      h('div', null,
        body ? h('p', { class: 'dialog-text' }, body) : null,
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
  };
  const msg = map[code] || (e && e.userMessage) || fallback;
  return code ? `${msg} (${code})` : msg;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
