import {
  h, svg, icons, GIFT_MINI, HERO_ART, toast, openDialog, confirmDialog, shortName, genderLabel, fmtPhone, fmtDate, initial, normDay,
  toMillis, errText,
} from './ui.js?v=7';
import * as fb from './fb.js?v=7';
import { adminContent, startAdminSubs } from './admin.js?v=7';
import { fileToAvatar, thumbFromDataUrl } from './media.js?v=7';

// ---------- Төлөв ----------
const S = {
  authReady: false,
  user: null,
  profile: undefined,
  isAdmin: undefined,
  config: undefined,
  assignment: undefined,
  targetId: undefined,
  target: undefined,
  giverId: undefined,
  giver: undefined,
  notifications: [],
  announcements: [],
  photos: {},
  inbox: [],
  outbox: [],
  tab: tabFromHash(),
  editing: false,
  seenAtOpen: 0,
  admin: { users: [], assign: {}, notifications: [], sub: sessionGet('monita:adminSub') || 'people', q: '' },
};
window.__monita = S; // алдаа шалгахад хэрэгтэй

const DEFAULT_CONFIG = { state: 'registration', finalDay: false, days: [], currentDay: 0, goldenCount: 0 };

function sessionGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch (_) {
    return null;
  }
}
function tabFromHash() {
  return (location.hash || '#home').slice(1).split('/')[0] || 'home';
}

// ---------- Сонсогчид ----------
const subs = new Map();
function sub(key, start) {
  stop(key);
  subs.set(key, start());
}
function stop(key) {
  const u = subs.get(key);
  if (u) {
    u();
    subs.delete(key);
  }
}
function stopAll(prefix) {
  for (const k of [...subs.keys()]) if (k.startsWith(prefix)) stop(k);
}
const loud = (where) => (e) => {
  console.error(where, e);
  toast(errText(e), 'error');
};
const quiet = (fn) => (e) => {
  console.warn(e && e.code);
  fn && fn();
};

// ---------- Дахин ашиглагдах элементүүд (формын бичвэр алдагдахгүй) ----------
const kept = new Map();
function keep(key, make) {
  if (!kept.has(key)) kept.set(key, make());
  return kept.get(key);
}
function forget(prefix) {
  for (const k of [...kept.keys()]) if (k === prefix || k.startsWith(prefix + ':')) kept.delete(k);
}

function patch(parent, kids) {
  const list = kids
    .flat(Infinity)
    .filter((k) => k !== null && k !== undefined && k !== false)
    .map((k) => (k instanceof Node ? k : document.createTextNode(String(k))));
  const wanted = new Set(list);
  for (const n of [...parent.childNodes]) if (!wanted.has(n)) n.remove();
  list.forEach((k, i) => {
    const cur = parent.childNodes[i];
    if (cur !== k) parent.insertBefore(k, cur || null);
  });
}

// ---------- Утсанд суулгах ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvt = e;
  render();
});
window.addEventListener('appinstalled', () => {
  installEvt = null;
  toast('Утсандаа суулгалаа');
  render();
});
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_MOBILE = IS_IOS || /Android/i.test(navigator.userAgent);

function installPanel() {
  if (fb.isStandalone()) return null;
  if (!installEvt && !IS_MOBILE) return null;
  let body;
  if (installEvt) {
    body = [
      h('p', { class: 'muted' }, 'Нүүр дэлгэцэнд Монитагийн икон нэмэгдэж, апп шиг нээгдэнэ.'),
      h('div', { class: 'actions' }, h('button', {
        class: 'btn btn-primary btn-small', type: 'button', onclick: async () => {
          const ev = installEvt;
          if (!ev) return;
          ev.prompt();
          try {
            await ev.userChoice;
          } catch (_) {
            /* */
          }
          installEvt = null;
          render();
        },
      }, 'Суулгах')),
    ];
  } else if (IS_IOS) {
    body = [h('p', { class: 'muted' }, 'Safari-ийн доод талын «Хуваалцах» товч (□↑) → «Add to Home Screen» (Нүүр дэлгэцэнд нэмэх) гэснийг дарна.')];
  } else {
    body = [h('p', { class: 'muted' }, 'Хөтчийн цэс (⋮) → «Add to Home screen» эсвэл «Install app» гэснийг сонгоно.')];
  }
  return h('section', { class: 'panel install-panel' }, h('h2', { class: 'h-section' }, 'Утсандаа суулгах'), body);
}

fb.redirectResult().catch((e) => {
  console.error(e);
  toast(errText(e, 'Нэвтрэхэд алдаа гарлаа'), 'error');
});

// ---------- Нэвтрэлтийн урсгал ----------
fb.onUser((user) => {
  const prev = S.user && S.user.uid;
  S.user = user;
  S.authReady = true;
  if (!user) {
    stopAll('u:');
    stopAll('a:');
    stopAll('ph:');
    S.photos = {};
    Object.assign(S, {
      profile: undefined, isAdmin: undefined, config: undefined, assignment: undefined, targetId: undefined,
      target: undefined, giverId: undefined, giver: undefined, notifications: [],
    });
    render();
    return;
  }
  if (prev === user.uid) return render();
  sub('u:profile', () =>
    fb.watch.profile(user.uid, (p, fromCache) => {
      if (!p && fromCache) return;
      S.profile = p;
      if (!p) {
        S.editing = false;
        forget('form:profile');
      }
      render();
    }, loud('profile')));
  sub('u:admin', () =>
    fb.watch.isAdmin(user.uid, (isAdmin) => {
      S.isAdmin = isAdmin;
      if (isAdmin) {
        if (!subs.has('a:all')) sub('a:all', () => startAdminSubs(S, render, loud));
      } else stopAll('a:');
      render();
    }, quiet(() => {
      S.isAdmin = false;
      render();
    })));
  sub('u:config', () =>
    fb.watch.config((c) => {
      S.config = { ...DEFAULT_CONFIG, ...(c || {}) };
      S.configExists = !!c;
      onConfig();
      render();
    }, loud('config')));
  sub('u:notif', () => fb.watch.notifications(user.uid, onNotifications, loud('notifications')));
  syncPhotos();
  render();
});

sub('pub:ann', () =>
  fb.watch.announcements((list) => {
    S.announcements = list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    render();
  }, quiet()));

function onConfig() {
  const c = S.config;
  const active = c.state === 'active';
  if (active) {
    if (!subs.has('u:inbox')) {
      sub('u:inbox', () =>
        fb.watch.letters(S.user.uid, (list) => {
          announceLetters('in', S.inbox, list, 'down');
          S.inbox = list;
          render();
        }, quiet(() => {
          S.inbox = [];
          render();
        })));
    }
    if (!subs.has('u:assign')) {
      sub('u:assign', () =>
        fb.watch.assignment(S.user.uid, (a) => {
          S.assignment = a;
          onAssignment();
          render();
        }, quiet(() => {
          S.assignment = null;
          onAssignment();
          render();
        })));
    }
  } else {
    stop('u:assign');
    stop('u:target');
    stop('u:inbox');
    stop('u:outbox');
    Object.assign(S, { assignment: undefined, targetId: undefined, target: undefined, inbox: [], outbox: [] });
    syncPhotos();
  }
  if (active && c.finalDay) {
    if (!subs.has('u:givers')) {
      sub('u:givers', () =>
        fb.watch.givers(S.user.uid, (ids) => {
          onGiver(ids[0] || null);
          render();
        }, quiet(() => {
          onGiver(null);
          render();
        })));
    }
  } else {
    stop('u:givers');
    stop('u:giver');
    Object.assign(S, { giverId: undefined, giver: undefined });
    syncPhotos();
  }
}

// Профайл зураг: өөрийн, сонгосон хүний, сүүлийн өдөр намайг сонгосон хүний.
function syncPhotos() {
  const want = new Set([S.user && S.user.uid, S.targetId, S.giverId].filter(Boolean));
  for (const k of [...subs.keys()]) {
    if (k.startsWith('ph:') && !want.has(k.slice(3))) {
      stop(k);
      delete S.photos[k.slice(3)];
    }
  }
  for (const uid of want) {
    if (subs.has('ph:' + uid)) continue;
    sub('ph:' + uid, () =>
      fb.watch.photo(uid, (d) => {
        S.photos[uid] = d;
        if (d && uid === S.user.uid) ensureThumb(d);
        render();
      }, quiet(() => {
        S.photos[uid] = null;
        render();
      })));
  }
}

// Өмнө нь оруулсан зурагт админы жагсаалтын жижиг хувилбар байхгүй бол нэг удаа үүсгэнэ.
let thumbDone = false;
async function ensureThumb(data) {
  if (thumbDone || !S.config || S.config.state === 'active') return;
  const key = 'monita:thumb:' + S.user.uid;
  try {
    if (localStorage.getItem(key) === data.length + '') return;
  } catch (_) {
    /* */
  }
  thumbDone = true;
  try {
    await fb.saveThumb(S.user.uid, await thumbFromDataUrl(data));
    localStorage.setItem(key, data.length + '');
  } catch (e) {
    console.warn('thumb', e && e.code);
  }
}

function onAssignment() {
  const t = (S.assignment && S.assignment.target) || null;
  if (t === S.targetId) return;
  S.targetId = t;
  stop('u:target');
  S.target = t ? undefined : null;
  syncPhotos();
  stop('u:outbox');
  S.outbox = [];
  if (t) {
    sub('u:outbox', () =>
      fb.watch.letters(t, (list) => {
        announceLetters('out:' + t, S.outbox, list, 'up');
        S.outbox = list;
        render();
      }, quiet(() => {
        S.outbox = [];
        render();
      })));
  }
  if (t) {
    sub('u:target', () =>
      fb.watch.user(t, (p) => {
        S.target = p;
        render();
      }, quiet(() => {
        S.target = null;
        render();
      })));
  }
}

function onGiver(id) {
  if (id === S.giverId) return;
  S.giverId = id;
  stop('u:giver');
  S.giver = id ? undefined : null;
  syncPhotos();
  if (id) {
    sub('u:giver', () =>
      fb.watch.user(id, (p) => {
        S.giver = p;
        render();
      }, quiet(() => {
        S.giver = null;
        render();
      })));
  }
}

const lettersReady = new Set();
function announceLetters(kind, before, after, incomingDir) {
  if (!lettersReady.has(kind)) {
    lettersReady.add(kind);
    return;
  }
  const known = new Set(before.map((m) => m.id));
  if (after.some((m) => !known.has(m.id) && m.dir === incomingDir)) toast('Шинэ нэргүй захидал ирлээ');
}

let notifReady = false;
function onNotifications(list) {
  list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  if (notifReady && S.tab !== 'notifications') {
    const known = new Set(S.notifications.map((n) => n.id));
    if (list.some((n) => !known.has(n.id))) toast('Шинэ мэдэгдэл ирлээ');
  }
  if (!notifReady && S.tab === 'notifications') S.seenAtOpen = lastSeen();
  notifReady = true;
  S.notifications = list;
  if (S.tab === 'notifications') markSeen();
  render();
}

function seenKey() {
  return 'monita:seen:' + (S.user ? S.user.uid : '');
}
function lastSeen() {
  try {
    return +(localStorage.getItem(seenKey()) || 0);
  } catch (_) {
    return 0;
  }
}
function markSeen() {
  try {
    localStorage.setItem(seenKey(), String(Date.now()));
  } catch (_) {
    /* хадгалах боломжгүй */
  }
}
function unreadCount() {
  const s = lastSeen();
  return S.notifications.filter((n) => toMillis(n.createdAt) > s).length;
}

window.addEventListener('hashchange', () => {
  const t = tabFromHash();
  if (t === 'notifications' && S.tab !== 'notifications') {
    S.seenAtOpen = lastSeen();
    markSeen();
  }
  S.tab = t;
  render();
  window.scrollTo(0, 0);
});

// ---------- Дүрслэл ----------
const root = document.getElementById('app');
const screens = {};
let frame = 0;
function render() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    try {
      draw();
    } catch (e) {
      console.error(e);
      toast(errText(e, 'Дэлгэц зурахад алдаа гарлаа'), 'error');
    }
  });
}

function draw() {
  if (!S.authReady) return patch(root, [loadingView()]);
  if (!S.user) {
    screens.landing = screens.landing || h('main', { class: 'landing', id: 'main' });
    patch(screens.landing, landingContent());
    return patch(root, [screens.landing]);
  }
  if (S.profile === undefined || S.isAdmin === undefined || S.config === undefined) return patch(root, [loadingView()]);

  const tabs = availableTabs();
  if (!tabs.some((t) => t.id === S.tab)) S.tab = tabs[0].id;
  screens.main = screens.main || h('main', { class: 'page', id: 'main' });
  const wide = S.tab === 'admin' || (S.tab === 'home' && S.profile && S.config.state === 'active');
  screens.main.className = 'page' + (wide ? ' page-wide' : '') + (S.tab === screens.lastTab ? '' : ' page-enter');
  screens.lastTab = S.tab;
  patch(screens.main, tabContent());
  patch(root, [topbar(tabs), screens.main, tabbar(tabs)]);
  if (S.tab === 'home') markLettersSeen();
}

// ---------- Уншаагүй захидал ----------
function lettersSeenKey() {
  return 'monita:letters:' + (S.user ? S.user.uid : '');
}
function incomingLetters() {
  const myKey = (S.assignment && S.assignment.k) || '';
  return [
    ...S.inbox.filter((m) => m.dir === 'down'),
    ...S.outbox.filter((m) => m.dir === 'up' && (!m.k || m.k === myKey)),
  ];
}
function unreadLetters() {
  let seen = 0;
  try {
    seen = +(localStorage.getItem(lettersSeenKey()) || 0);
  } catch (_) {
    /* */
  }
  return incomingLetters().filter((m) => toMillis(m.createdAt) > seen).length;
}
function markLettersSeen() {
  const latest = Math.max(0, ...incomingLetters().map((m) => toMillis(m.createdAt)));
  if (!latest) return;
  try {
    if (+(localStorage.getItem(lettersSeenKey()) || 0) < latest) localStorage.setItem(lettersSeenKey(), String(latest));
  } catch (_) {
    /* */
  }
}

function loadingView() {
  return keep('loading', () =>
    h('div', { class: 'loading' }, svg(GIFT_MINI, 'loading-mark'), h('span', { class: 'sr-only' }, 'Ачаалж байна')));
}

function availableTabs() {
  const t = [{ id: 'home', label: 'Нүүр', icon: 'home', badge: S.tab === 'home' ? 0 : unreadLetters() }];
  if (S.profile) {
    t.push({ id: 'profile', label: 'Профайл', icon: 'user' });
    t.push({ id: 'notifications', label: 'Мэдэгдэл', icon: 'bell', badge: unreadCount() });
  }
  if (S.isAdmin) t.push({ id: 'admin', label: 'Админ', icon: 'shield' });
  return t;
}

function tabLink(t) {
  const on = S.tab === t.id;
  return h('a', { class: 'tab' + (on ? ' active' : ''), href: '#' + t.id, 'aria-current': on ? 'page' : null },
    svg(icons[t.icon]),
    h('span', { class: 'tab-label' }, t.label),
    t.badge ? h('span', { class: 'badge', 'aria-label': `${t.badge} шинэ` }, String(t.badge)) : null);
}

function topbar(tabs) {
  return h('header', { class: 'topbar' },
    h('div', { class: 'topbar-inner' },
      h('a', { class: 'brand', href: '#home', 'aria-label': 'Монита, нүүр хуудас' }, svg(GIFT_MINI, 'brand-mark'), h('span', { class: 'brand-name' }, 'Монита')),
      tabs.length > 1 ? h('nav', { class: 'tabs', 'aria-label': 'Үндсэн цэс' }, tabs.map(tabLink)) : h('span', { class: 'spacer' }),
      h('button', { class: 'icon-btn', type: 'button', title: 'Гарах', 'aria-label': 'Гарах', onclick: () => fb.logOut() }, svg(icons.logout))));
}

function tabbar(tabs) {
  if (tabs.length < 2) return null;
  return h('nav', { class: 'tabbar', 'aria-label': 'Үндсэн цэс' }, tabs.map(tabLink));
}

function tabContent() {
  if (S.tab === 'admin' && S.isAdmin) {
    return adminContent({ S, keep, forget, render, adFigure, titleBlock });
  }
  if (!S.profile) return registerContent();
  if (S.tab === 'profile') return profileContent();
  if (S.tab === 'notifications') return notificationsContent();
  return homeContent();
}

// ---------- Нэвтрэх хуудас ----------
const GOOGLE_G = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

function isInAppBrowser() {
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|KAKAOTALK|TikTok|musical_ly|Snapchat|Twitter|; wv\)/i.test(navigator.userAgent);
}

function landingContent() {
  return [
    keep('landing:hero', () =>
      h('section', { class: 'hero' },
        svg(HERO_ART, 'hero-figure'),
        h('p', { class: 'hero-eyebrow' }, 'ARXI.VERSE-25'),
        h('h1', { class: 'wordmark' }, 'Монита'))),
    keep('landing:signin', signInBlock),
    announcementsSection(),
    keep('landing:vertical', () => h('div', { class: 'vertical-mark', 'aria-hidden': 'true' }, 'MUST ARCHITECTURE')),
  ];
}

function signInBlock() {
  const err = h('p', { class: 'field-error', role: 'alert' });
  const btn = h('button', { class: 'btn btn-google', type: 'button' }, svg(GOOGLE_G, 'g-logo'), h('span', null, 'Google-ээр нэвтрэх'));
  btn.addEventListener('click', async () => {
    err.textContent = '';
    btn.disabled = true;
    try {
      await fb.signIn();
    } catch (e) {
      const silent = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
      if (!silent.includes(e.code)) err.textContent = errText(e, 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      btn.disabled = false;
    }
  });
  const block = h('section', { class: 'signin' }, btn, err);
  if (isInAppBrowser()) block.append(inAppNotice());
  return block;
}

function inAppNotice() {
  const url = location.origin + location.pathname;
  const android = /Android/i.test(navigator.userAgent);
  const urlText = h('code', { class: 'inapp-url' }, url);
  return h('div', { class: 'inapp' },
    h('p', null, 'Messenger, Facebook зэрэг апп доторх хөтөч Google-ээр нэвтрэхийг хориглодог. Линкийг Chrome эсвэл Safari хөтчөөр нээнэ үү.'),
    urlText,
    h('div', { class: 'inapp-actions' },
      android
        ? h('a', { class: 'btn btn-primary', href: `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end` }, 'Chrome-оор нээх')
        : null,
      h('button', {
        class: 'btn btn-ghost', type: 'button', onclick: async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast('Линк хуулагдлаа');
          } catch (_) {
            const r = document.createRange();
            r.selectNodeContents(urlText);
            const sel = getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
          }
        },
      }, svg(icons.copy), 'Линк хуулах')));
}

// ---------- Зар ----------
const fileCache = new Map();
let io;
function lazyLoad(img, id) {
  const load = () => {
    if (fileCache.has(id)) {
      img.src = fileCache.get(id);
      return;
    }
    fb.loadFile(id).then((data) => {
      if (data) {
        fileCache.set(id, data);
        img.src = data;
      }
    }).catch((e) => console.warn('ad', e));
  };
  if (!('IntersectionObserver' in window)) return load();
  io = io || new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        io.unobserve(en.target);
        en.target.__load && en.target.__load();
      }
    }
  }, { rootMargin: '400px' });
  img.__load = load;
  io.observe(img);
}

function adFigure(a) {
  const fig = h('figure', { class: 'ad' });
  const files = a.files || [];
  if (!files.length) return fig;
  const ratio = (a.ratios && a.ratios[0]) || 1.414;
  const img = h('img', { class: 'ad-img', alt: 'Зар', style: { aspectRatio: `1 / ${ratio}` } });
  fig.append(h('button', { class: 'ad-page', type: 'button', 'aria-label': 'Зарыг томруулж харах', onclick: () => openAd(a) },
    img,
    files.length > 1 ? h('span', { class: 'ad-count' }, `${files.length} хуудас`) : null));
  lazyLoad(img, files[0]);
  return fig;
}

function openAd(a) {
  const pages = (a.files || []).map((id) => {
    const img = h('img', { class: 'lightbox-img', alt: 'Зар' });
    if (fileCache.has(id)) img.src = fileCache.get(id);
    else fb.loadFile(id).then((d) => d && (img.src = d));
    return img;
  });
  openDialog(h('div', { class: 'lightbox' }, pages), { title: 'Зар', wide: true });
}

function announcementsSection() {
  const list = S.announcements;
  if (!list.length) return null;
  return h('section', { class: 'ads' },
    h('h2', { class: 'h-section' }, 'Зар'),
    h('div', { class: 'ads-grid' }, list.map((a) => keep('ann:' + a.id, () => adFigure(a)))));
}

// ---------- Мэдээллийн хүснэгт (архитектур зургийн хүснэгт шиг) ----------
function cell(label, value, cls = '') {
  return h('div', { class: 'tb-cell ' + cls }, h('span', { class: 'tb-label' }, label), h('span', { class: 'tb-value' }, value));
}

function avatar(p, photo, cls = 'avatar') {
  if (photo) return h('img', { class: cls, src: photo, alt: '' });
  return h('span', { class: cls + ' avatar-empty', 'aria-hidden': 'true' }, initial(p && p.firstName));
}

function titleBlock(title, p, { golden = false, note = null, extra = null, photo } = {}) {
  const pic = photo !== undefined ? photo : S.photos[p.uid || p.id];
  return h('article', { class: 'tblock' + (golden ? ' golden' : '') },
    h('header', { class: 'tb-head' },
      h('div', { class: 'tb-who' }, avatar(p, pic), h('h2', { class: 'tb-title' }, title)),
      golden ? h('span', { class: 'tb-badge' }, '✦ Алтан монита') : null),
    note ? h('p', { class: 'tb-note' }, note) : null,
    h('div', { class: 'tb-grid' },
      cell('Овог', p.lastName),
      cell('Нэр', p.firstName),
      cell('Оюутны код', p.studentCode, 'code'),
      cell('Хүйс', genderLabel(p.gender)),
      cell('Утас', h('a', { href: 'tel:' + p.phone, class: 'tel' }, fmtPhone(p.phone)), 'wide'),
      cell('Сонирхол, хүсэж буй бэлэг', p.wishes || '—', 'wide pre'),
      extra));
}

// ---------- Нүүр ----------
function homeContent() {
  const c = S.config;
  const out = [];
  if (c.state !== 'active') {
    out.push(h('section', { class: 'intro' },
      h('h1', { class: 'h-display' }, 'Монита эхлээгүй байна'),
      h('p', { class: 'lead' }, 'Эхлэхээс өмнө профайлаа засах боломжтой.'),
      h('a', { class: 'btn btn-ghost', href: '#profile' }, S.photos[S.user.uid] ? 'Профайл харах' : 'Профайл зураг оруулах')));
    out.push(targetPlaceholder());
    out.push(announcementsSection());
    return out;
  }
  out.push(daySection(c));
  const left = [];
  const right = [];
  const goldenReveal = c.finalDay && S.giverId && S.giverId === S.targetId && S.target;
  if (goldenReveal) {
    left.push(wrapped('gold:' + S.targetId, titleBlock('Таны монита', S.target, { golden: true, note: 'Та хоёр бие биенээ сонгосон алтан монита байлаа.' }), 'Сүүлийн өдрийн нууцыг нээх', true));
  } else {
    if (c.finalDay) left.push(revealSection());
    left.push(targetSection());
  }
  if (S.target) {
    const po = keep('letters:out', () => letterPanel('out'));
    po.sync();
    right.push(po);
  }
  const pi = keep('letters:in', () => letterPanel('in'));
  pi.sync();
  right.push(pi);
  const colL = keep('home:left', () => h('div', { class: 'home-col' }));
  const colR = keep('home:right', () => h('div', { class: 'home-col' }));
  patch(colL, left);
  patch(colR, right);
  out.push(keep('home:grid', () => h('div', { class: 'home-grid' }, colL, colR)));
  out.push(announcementsSection());
  return out;
}

// Бэлгийн хайрцаг шиг нээгддэг карт (нэг удаа).
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function openedKey(key) {
  return 'monita:opened:' + S.user.uid + ':' + key;
}
function isOpened(key) {
  try {
    return localStorage.getItem(openedKey(key)) === '1';
  } catch (_) {
    return true;
  }
}
function wrapped(key, card, label, golden = false) {
  if (isOpened(key)) return card;
  const box = keep('wrap:' + key, () => {
    const el = h('div', { class: 'giftwrap' + (golden ? ' gold' : '') });
    const slot = h('div', { class: 'gift-slot', 'aria-hidden': 'true' });
    const cover = h('button', { class: 'gift-cover', type: 'button' },
      svg(GIFT_MINI, 'gift-cube'),
      h('span', { class: 'gift-label' }, label),
      h('span', { class: 'gift-hint' }, 'Нээх'));
    cover.addEventListener('click', () => {
      el.classList.add('opening');
      setTimeout(() => {
        try {
          localStorage.setItem(openedKey(key), '1');
        } catch (_) {
          /* */
        }
        render();
      }, REDUCED ? 0 : 950);
    });
    el._slot = slot;
    el.append(slot, cover);
    return el;
  });
  box._slot.replaceChildren(card);
  return box;
}

function dimString(n, cur) {
  return h('div', { class: 'dimstring', 'aria-hidden': 'true' },
    Array.from({ length: n }, (_, i) =>
      h('span', { class: 'dim-seg' + (i < cur ? ' past' : '') + (i === cur ? ' current' : '') }, h('span', { class: 'dim-num' }, String(i + 1)))));
}

function daySection(c) {
  const days = (c.days || []).map(normDay);
  const cur = Math.min(c.currentDay || 0, Math.max(days.length - 1, 0));
  const day = days[cur] || normDay(null);
  const theme = day.theme.trim();
  let label = 'Монита явагдаж байна';
  if (c.finalDay) label = 'Сүүлийн өдөр';
  else if (days.length) label = theme ? `${cur + 1}-р өдрийн сэдэв` : `${cur + 1}-р өдөр`;
  return h('section', { class: 'day' + (c.finalDay ? ' final' : '') },
    days.length > 1 ? dimString(days.length, cur) : null,
    h('p', { class: 'day-label' }, label),
    theme ? h('p', { class: 'day-theme' }, theme) : null,
    day.files.length
      ? h('div', { class: 'day-media' }, keep('daymedia:' + day.files[0], () => adFigure({ id: 'day-' + day.files[0], files: day.files, ratios: day.ratios })))
      : null);
}

function waiting() {
  return h('div', { class: 'tblock skeleton', 'aria-busy': 'true' }, h('span', { class: 'sr-only' }, 'Ачаалж байна'));
}

// ---------- Нэргүй захидал ----------
function letterPanel(kind) {
  const out = kind === 'out';
  const list = h('ol', { class: 'letters' });
  const empty = h('p', { class: 'muted small' });
  const ta = h('textarea', {
    class: 'input textarea letter-input', rows: '3', maxlength: '500',
    placeholder: out ? 'Монитадаа нэрээ нуугаад бичээрэй' : 'Таныг сонгосон хүнд хариу бичих',
    'aria-label': out ? 'Монитадаа захидал' : 'Хариу захидал',
  });
  const send = h('button', { class: 'btn btn-primary btn-small', type: 'submit' }, 'Илгээх');
  const form = h('form', { class: 'letter-form' }, ta, h('div', { class: 'actions' }, send));
  let last;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) return ta.focus();
    send.disabled = true;
    try {
      if (out) {
        await fb.sendLetter({ t: S.targetId, dir: 'down', k: S.assignment && S.assignment.k, text });
      } else {
        const lastDown = [...S.inbox].filter((m) => m.dir === 'down').sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))[0];
        await fb.sendLetter({ t: S.user.uid, dir: 'up', k: lastDown ? lastDown.k : '', text });
      }
      ta.value = '';
      toast('Илгээлээ');
    } catch (er) {
      console.error(er);
      toast(errText(er, 'Илгээж чадсангүй'), 'error');
    } finally {
      send.disabled = false;
    }
  });

  const el = h('section', { class: 'panel letters-panel' },
    h('div', null,
      h('h2', { class: 'h-section' }, out ? 'Монитадаа нэргүй захидал' : 'Танд ирсэн нэргүй захидал'),
      h('p', { class: 'muted small' }, out ? 'Таны нэр харагдахгүй.' : 'Хэн бичсэнийг сүүлийн өдөр мэдэх болно.')),
    list, empty, form);

  el.sync = () => {
    const myKey = (S.assignment && S.assignment.k) || '';
    let msgs;
    if (out) msgs = S.outbox.filter((m) => (m.dir === 'down' && m.k === myKey) || (m.dir === 'up' && (!m.k || m.k === myKey)));
    else msgs = S.inbox;
    msgs = [...msgs].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
    const otherName = out ? shortName(S.target) : (S.config.finalDay && S.giver ? shortName(S.giver) : 'Таныг сонгосон хүн');
    const key = JSON.stringify([msgs.map((m) => m.id + toMillis(m.createdAt)), otherName]);
    if (key === last) return;
    last = key;
    const mineDir = out ? 'down' : 'up';
    list.replaceChildren(...msgs.map((m) => {
      const mine = m.dir === mineDir;
      return h('li', { class: 'letter ' + (mine ? 'mine' : 'theirs') },
        h('span', { class: 'letter-who' }, mine ? 'Та' : otherName),
        h('p', { class: 'letter-text' }, m.text),
        h('time', { class: 'letter-time' }, fmtDate(m.createdAt)));
    }));
    list.style.display = msgs.length ? '' : 'none';
    empty.textContent = msgs.length ? '' : out ? 'Одоогоор захидал бичээгүй байна.' : 'Одоогоор захидал ирээгүй байна.';
    empty.style.display = msgs.length ? 'none' : '';
  };
  return el;
}

function targetPlaceholder() {
  return h('article', { class: 'tblock placeholder' },
    h('header', { class: 'tb-head' },
      h('div', { class: 'tb-who' }, svg(GIFT_MINI, 'avatar avatar-cube'), h('h2', { class: 'tb-title' }, 'Таны монита'))),
    h('p', { class: 'tb-empty' }, 'Монита эхлэхэд таны монита энд харагдана.'));
}

function targetSection() {
  if (S.assignment === undefined || (S.targetId && S.target === undefined)) return waiting();
  if (!S.target) return h('p', { class: 'note' }, 'Танд одоогоор монита сонгогдоогүй байна.');
  const key = 'm:' + ((S.assignment && S.assignment.k) || S.targetId);
  return wrapped(key, titleBlock('Таны монита', S.target), 'Таны монита хэн бэ?');
}

function revealSection() {
  if (S.giverId === undefined || (S.giverId && S.giver === undefined)) return waiting();
  if (!S.giver) return null;
  return wrapped('g:' + S.giverId, titleBlock('Таныг сонгосон хүн', S.giver), 'Таныг хэн сонгосон бэ?');
}

// ---------- Бүртгэл ба профайл ----------
function registerContent() {
  if (S.config.state === 'active') {
    return [
      h('section', { class: 'intro' },
        h('h1', { class: 'h-display' }, 'Монита эхэлсэн байна'),
        h('p', { class: 'lead' }, 'Монита явагдаж байх үед шинээр бүртгүүлэх боломжгүй.')),
      keep('form:admin', adminCodeForm),
    ];
  }
  return [
    h('header', { class: 'page-head' },
      h('h1', { class: 'h-display' }, 'Бүртгүүлэх'),
      h('p', { class: 'lead' }, 'Монитад оролцохын тулд мэдээллээ бөглөнө үү.')),
    keep('form:register', () => profileForm(null)),
    keep('form:admin', adminCodeForm),
  ];
}

function profileContent() {
  const locked = S.config.state === 'active';
  if (locked && S.editing) {
    S.editing = false;
    forget('form:profile');
  }
  const out = [h('header', { class: 'page-head' }, h('h1', { class: 'h-display' }, 'Профайл'))];
  const pc = keep('photo:control', photoControl);
  pc.sync();
  out.push(pc);
  if (S.editing) out.push(keep('form:profile', () => profileForm(S.profile)));
  else {
    out.push(titleBlock('Миний мэдээлэл', S.profile));
    out.push(locked
      ? h('p', { class: 'note' }, 'Монита явагдаж байх үед мэдээллээ өөрчлөх боломжгүй.')
      : h('div', { class: 'actions' },
        h('button', {
          class: 'btn btn-primary', type: 'button', onclick: () => {
            forget('form:profile');
            S.editing = true;
            render();
          },
        }, 'Мэдээлэл засах')));
  }
  out.push(installPanel());
  out.push(h('section', { class: 'account' },
    h('div', null, h('p', { class: 'muted small' }, 'Google бүртгэл'), h('p', { class: 'account-email' }, S.user.email)),
    h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => fb.logOut() }, svg(icons.logout), 'Гарах')));
  if (!S.isAdmin) out.push(keep('form:admin', adminCodeForm));
  return out;
}

function photoControl() {
  const pic = h('div', { class: 'photo-pic' });
  const input = h('input', { type: 'file', accept: 'image/*', class: 'sr-only', id: 'photo-file' });
  const pickLabel = h('span', null, 'Зураг оруулах');
  const pick = h('label', { class: 'btn btn-small', for: 'photo-file' }, svg(icons.upload), pickLabel);
  const del = h('button', { class: 'btn btn-small btn-danger', type: 'button' }, 'Зураг устгах');
  const preset = h('button', { class: 'btn btn-small', type: 'button' }, svg(icons.grid), 'Бэлэн зураг сонгох');
  const status = h('p', { class: 'muted small', role: 'status' });
  const actions = h('div', { class: 'actions' }, preset, input, pick, del);
  preset.addEventListener('click', () => openAvatarPicker());
  let last;

  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    pick.classList.add('is-busy');
    status.textContent = 'Зургийг бэлдэж байна…';
    try {
      const { data, thumb } = await fileToAvatar(file);
      await fb.savePhoto(S.user.uid, data, thumb);
      status.textContent = '';
      toast('Профайл зураг хадгалагдлаа');
    } catch (e) {
      console.error(e);
      status.textContent = '';
      toast(errText(e, e.message || 'Зураг хадгалж чадсангүй'), 'error');
    } finally {
      pick.classList.remove('is-busy');
    }
  });
  del.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Профайл зургаа устгах уу?', ok: 'Устгах', danger: true });
    if (!ok) return;
    try {
      await fb.deletePhoto(S.user.uid);
      toast('Зураг устлаа');
    } catch (e) {
      toast(errText(e), 'error');
    }
  });

  const el = h('section', { class: 'photo-control' }, pic, h('div', { class: 'photo-side' }, actions, status));
  el.sync = () => {
    const photo = S.photos[S.user.uid] || null;
    const locked = S.config.state === 'active';
    const key = [photo, locked, S.profile && S.profile.firstName].join('|');
    if (key === last) return;
    last = key;
    pic.replaceChildren(avatar(S.profile, photo, 'avatar-lg'));
    pickLabel.textContent = photo ? 'Зураг солих' : 'Зураг оруулах';
    pick.style.display = locked ? 'none' : '';
    preset.style.display = locked ? 'none' : '';
    del.style.display = locked || !photo ? 'none' : '';
    status.textContent = locked ? 'Монита явагдаж байх үед зургаа солих боломжгүй.' : '';
  };
  return el;
}

async function openAvatarPicker() {
  let list;
  try {
    ({ AVATARS: list } = await import('./avatars.js?v=7'));
  } catch (e) {
    toast(errText(e, 'Зургуудыг ачаалж чадсангүй'), 'error');
    return;
  }
  const current = S.photos[S.user.uid];
  let close;
  const grid = h('div', { class: 'avatar-grid', role: 'list' }, list.map((a) => {
    const b = h('button', {
      class: 'avatar-opt', type: 'button', role: 'listitem', 'aria-label': 'Энэ зургийг сонгох', 'aria-pressed': a.src === current ? 'true' : 'false',
    }, h('img', { src: a.src, alt: '' }));
    b.addEventListener('click', async () => {
      grid.querySelectorAll('.avatar-opt').forEach((x) => (x.disabled = true));
      try {
        await fb.savePhoto(S.user.uid, a.src, a.src);
        toast('Профайл зураг хадгалагдлаа');
        close();
      } catch (e) {
        console.error(e);
        toast(errText(e, 'Зураг хадгалж чадсангүй'), 'error');
        grid.querySelectorAll('.avatar-opt').forEach((x) => (x.disabled = false));
      }
    });
    return b;
  }));
  close = openDialog(grid, { title: 'Бэлэн зураг сонгох', wide: true });
}

export function normalizeCode(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, '').replace(/В/g, 'B');
}

function field(label, control, hint) {
  const err = h('p', { class: 'field-error', role: 'alert' });
  const id = 'f-' + Math.random().toString(36).slice(2, 8);
  control.id = id;
  const wrap = h('div', { class: 'field' }, h('label', { class: 'label', for: id }, label), control, hint ? h('p', { class: 'hint' }, hint) : null, err);
  wrap.setError = (m) => {
    err.textContent = m || '';
    control.setAttribute('aria-invalid', m ? 'true' : 'false');
  };
  return wrap;
}

function profileForm(p) {
  const v = p || {};
  const code = h('input', { class: 'input', name: 'studentCode', value: v.studentCode || '', placeholder: 'B252800012', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
  code.addEventListener('input', () => {
    const n = normalizeCode(code.value).slice(0, 12);
    if (n !== code.value) code.value = n;
  });
  const fCode = field('Оюутны код', code, 'Латин B үсгээр эхэлнэ. Жишээ: B252800012');

  let gender = v.gender || '';
  const gBtns = [['male', 'Эрэгтэй'], ['female', 'Эмэгтэй']].map(([val, label]) => {
    const b = h('button', { type: 'button', class: 'seg-btn', role: 'radio', 'aria-checked': gender === val ? 'true' : 'false' }, label);
    b.addEventListener('click', () => {
      gender = val;
      gBtns.forEach((x) => x.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      fGender.setError('');
    });
    return b;
  });
  const gGroup = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Хүйс' }, gBtns);
  const fGender = field('Хүйс', gGroup);

  const last = h('input', { class: 'input', name: 'lastName', value: v.lastName || '', autocomplete: 'family-name', maxlength: '60' });
  const first = h('input', { class: 'input', name: 'firstName', value: v.firstName || '', autocomplete: 'given-name', maxlength: '60' });
  const fLast = field('Овог', last);
  const fFirst = field('Нэр', first);

  const phone = h('input', { class: 'input', name: 'phone', value: v.phone || '', type: 'tel', inputmode: 'numeric', autocomplete: 'tel-national', placeholder: '99112233' });
  phone.addEventListener('input', () => {
    const n = phone.value.replace(/\D/g, '').slice(0, 8);
    if (n !== phone.value) phone.value = n;
  });
  const fPhone = field('Утасны дугаар', phone);

  const wishes = h('textarea', { class: 'input textarea', name: 'wishes', rows: '5', maxlength: '1000', placeholder: 'Юу сонирхдог, ямар бэлэг авмаар байгаагаа бичээрэй' });
  wishes.value = v.wishes || '';
  const counter = h('span', { class: 'counter' });
  const updCounter = () => (counter.textContent = `${wishes.value.length}/1000`);
  wishes.addEventListener('input', updCounter);
  updCounter();
  const fWishes = field('Сонирхол, хүсэж буй бэлэг', wishes);
  fWishes.append(counter);

  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, p ? 'Хадгалах' : 'Бүртгүүлэх');
  const formErr = h('p', { class: 'field-error form-error', role: 'alert' });

  const form = h('form', { class: 'form panel', novalidate: true },
    fCode, fGender, h('div', { class: 'row-2' }, fLast, fFirst), fPhone, fWishes, formErr,
    h('div', { class: 'actions' },
      p ? h('button', {
        class: 'btn btn-ghost', type: 'button', onclick: () => {
          S.editing = false;
          forget('form:profile');
          render();
        },
      }, 'Болих') : null,
      submit));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.textContent = '';
    const data = {
      studentCode: normalizeCode(code.value),
      gender,
      lastName: last.value.trim(),
      firstName: first.value.trim(),
      phone: phone.value.trim(),
      wishes: wishes.value.trim(),
    };
    const errs = [
      [fCode, /^B\d{9}$/.test(data.studentCode) ? '' : 'Код "B" үсэг, араас нь 9 оронтой тоо байна. Жишээ: B252800012'],
      [fGender, data.gender ? '' : 'Хүйсээ сонгоно уу.'],
      [fLast, data.lastName ? '' : 'Овгоо оруулна уу.'],
      [fFirst, data.firstName ? '' : 'Нэрээ оруулна уу.'],
      [fPhone, /^\d{8}$/.test(data.phone) ? '' : 'Утасны дугаар 8 оронтой байна.'],
      [fWishes, data.wishes ? '' : 'Сонирхол, хүсэж буй бэлгээ бичнэ үү.'],
    ];
    errs.forEach(([f, m]) => f.setError(m));
    const firstBad = errs.find(([, m]) => m);
    if (firstBad) {
      const ctl = firstBad[0].querySelector('input, textarea, button');
      ctl && ctl.focus();
      return;
    }
    submit.disabled = true;
    try {
      if (!p || p.studentCode !== data.studentCode) {
        const owner = await fb.codeOwner(data.studentCode);
        if (owner && owner !== S.user.uid) {
          fCode.setError('Энэ оюутны код өөр хүн дээр бүртгэлтэй байна.');
          code.focus();
          return;
        }
      }
      await fb.saveProfile(S.user, data, p);
      toast(p ? 'Хадгаллаа' : 'Бүртгэл амжилттай');
      S.editing = false;
      forget('form:profile');
      forget('form:register');
      render();
    } catch (er) {
      console.error(er);
      if (er.code === 'permission-denied' && S.config.state === 'active') formErr.textContent = 'Монита эхэлсэн тул мэдээлэл өөрчлөх боломжгүй.';
      else if (er.code === 'permission-denied') formErr.textContent = errText(er, 'Хадгалж чадсангүй. Оюутны код давхцаж байж магадгүй.');
      else formErr.textContent = errText(er, 'Хадгалж чадсангүй');
    } finally {
      submit.disabled = false;
    }
  });
  return form;
}

function adminCodeForm() {
  const inp = h('input', { class: 'input', name: 'adminCode', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Админ код' });
  const btn = h('button', { class: 'btn btn-ghost', type: 'submit' }, 'Баталгаажуулах');
  const err = h('p', { class: 'field-error', role: 'alert' });
  const form = h('form', { class: 'inline-form' }, inp, btn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const code = inp.value.trim().toUpperCase();
    if (!code) return;
    btn.disabled = true;
    try {
      await fb.claimAdmin(S.user, code);
      inp.value = '';
      toast('Админ эрх нээгдлээ');
      location.hash = '#admin';
    } catch (er) {
      err.textContent = er.code === 'permission-denied' ? 'Код буруу байна.' : errText(er);
    } finally {
      btn.disabled = false;
    }
  });
  return h('details', { class: 'admin-code' }, h('summary', null, 'Админ код'), form, err);
}

// ---------- Мэдэгдэл ----------
function notificationsContent() {
  const seen = S.seenAtOpen;
  const list = S.notifications;
  return [
    h('header', { class: 'page-head' }, h('h1', { class: 'h-display' }, 'Мэдэгдэл')),
    list.length
      ? h('ol', { class: 'notes' }, list.map((n) =>
        h('li', { class: 'notice' + (toMillis(n.createdAt) > seen ? ' fresh' : '') },
          h('p', { class: 'notice-text' }, n.text),
          h('time', { class: 'notice-time' }, fmtDate(n.createdAt)))))
      : h('p', { class: 'empty' }, 'Одоогоор мэдэгдэл алга.'),
  ];
}

render();
