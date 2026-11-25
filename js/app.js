import {
  h, svg, icons, GIFT_MINI, HERO_ART, DECO_ART, motif, setMotif, burst, toast, openDialog, confirmDialog, shortName, genderLabel, fmtPhone, fmtDate, initial, normDay, parseDay, fmtDay, fmtMoney,
  toMillis, errText,
} from './ui.js?v=21';
import * as fb from './fb.js?v=21';
import { adminContent, startAdminSubs } from './admin.js?v=21';
import { fileToAvatar, thumbFromDataUrl, fileToGiftPhoto } from './media.js?v=21';

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
  gifts: [],
  myVote: undefined,
  reads: null,
  announcements: [],
  photos: {},
  inbox: [],
  outbox: [],
  tab: tabFromHash(),
  editing: false,
  seenAtOpen: 0,
  admin: { users: [], assign: {}, notifications: [], votes: [], admins: [], sub: sessionGet('monita:adminSub') || 'people', q: '' },
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

// ---------- Алдааны бүртгэл ----------
// Хэрэглэгчид харагдсан алдаа болон гэнэтийн алдааг админы «Алдаа» хэсэгт хадгална.
const APP_VERSION = (() => {
  try {
    return new URL(import.meta.url).searchParams.get('v') || '';
  } catch (_) {
    return '';
  }
})();
const reportedErrors = new Set();
let leaving = false;
function reportError(where, info) {
  if (!S.user || leaving || reportedErrors.size >= 20) return;
  const raw = info && typeof info === 'object' ? info.raw || info.message || '' : String(info || '');
  const msg = (info && info.msg ? info.msg + (raw && raw !== info.msg ? ' | ' + raw : '') : raw).slice(0, 300);
  const code = String((info && info.code) || '').slice(0, 60);
  if (!msg && !code) return;
  const key = where + '|' + code + '|' + msg;
  if (reportedErrors.has(key)) return;
  reportedErrors.add(key);
  fb.logError(S.user.uid, {
    where: where.slice(0, 60), msg, code,
    page: (location.hash || '#home').slice(0, 40), ua: navigator.userAgent.slice(0, 200), v: APP_VERSION.slice(0, 10),
  }).catch(() => {});
}
// Гарах үед сонсогчид "эрх алга" алдаа өгдөг тул тэр үеийн алдааг бүртгэхгүй.
function signOutNow() {
  leaving = true;
  return fb.logOut();
}
document.addEventListener('monita:error', (ev) => reportError('харагдсан алдаа', ev.detail));
window.addEventListener('error', (ev) => {
  const e = ev.error || {};
  reportError('скрипт', { raw: (e.message || ev.message || '') + (ev.filename ? ` @${ev.filename.split('/').pop()}:${ev.lineno}` : ''), code: e.code });
});
window.addEventListener('unhandledrejection', (ev) => {
  const r = ev.reason || {};
  reportError('promise', { raw: r.message || String(r), code: r.code });
});

// ---------- Холбоо барих, хувийн мэдээлэл ----------
const CONTACT_URL = 'https://www.instagram.com/arxi.verse_25/';

function contactLink(text = 'Instagram: @arxi.verse_25') {
  return h('a', { class: 'linklike', href: CONTACT_URL, target: '_blank', rel: 'noopener noreferrer' }, text);
}

function openPrivacy() {
  const sec = (title, ...body) => h('section', { class: 'privacy-sec' }, h('h3', null, title), ...body);
  const ul = (items) => h('ul', null, items.map((t) => h('li', null, t)));
  openDialog(h('div', { class: 'privacy' },
    sec('Ямар мэдээлэл цуглуулдаг вэ',
      ul(['Gmail хаяг (Google-ээр нэвтрэхэд)', 'Овог, нэр, оюутны код, хүйс, утасны дугаар', 'Hint (сонирхол, хүсэж буй бэлэг)', 'Профайл зураг (заавал биш)', 'Нэргүй захидал', 'Сүүлийн өдөр оруулсан бэлгийн зураг болон шилдэг бэлэгт өгсөн санал'])),
    sec('Юунд ашигладаг вэ',
      h('p', null, 'Зөвхөн ARXI.VERSE-25 ангийн монитаг зохион байгуулахад: хэн хэнд бэлэг өгөхийг холбох, бэлэг өгөх хүнд таны мэдээллийг харуулах.')),
    sec('Хэн хардаг вэ',
      ul([
        'Монита эхэлсний дараа танд бэлэг өгөх хүн таны нэр, утас, hint, зургийг харна.',
        'Сүүлийн өдөр хэн хэнийг сонгосон нь илчлэгдэнэ.',
        'Сүүлийн өдөр оруулсан бэлгийн зургийг бүх оролцогч харна. Хэн хэнд санал өгснийг зөвхөн админ харна.',
        'Админ бүх оролцогчийн мэдээллийг харна.',
        'Бусад оролцогч болон гадны хүн таны мэдээллийг харахгүй.',
      ])),
    sec('Хаана, хэр удаан хадгалдаг вэ',
      h('p', null, 'Google-ийн Firebase үйлчилгээнд хадгалагдана. Монита явагдаж байх үед админ алдаанаас сэргийлж нөөц хуулбар татаж болно. Монита дууссаны дараа админ оролцогчдын бүх мэдээлэл болон нөөц хуулбарыг устгана. Сайт таны Google нууц үгийг хэзээ ч харахгүй, хадгалахгүй.'),
      h('p', null, 'Сайтад алдаа гарвал засварлахын тулд алдааны тайлбар, хуудас, төхөөрөмж ба хөтчийн төрөл хадгалагдана.')),
    sec('Таны эрх',
      h('p', null, 'Монита эхлэхээс өмнө мэдээллээ засах, Профайл хэсгээс бүртгэлээ өөрөө устгах боломжтой. Монита явагдаж байх үед устгуулах бол админд хандана уу.')),
    sec('Холбоо барих', h('p', null, contactLink()))),
  { title: 'Хувийн мэдээллийн бодлого', wide: true });
}

function siteFooter() {
  return keep('site:footer', () => h('footer', { class: 'site-foot' },
    h('button', { class: 'linklike', type: 'button', onclick: openPrivacy }, 'Хувийн мэдээллийн бодлого'),
    h('span', null, 'Холбоо барих: ', contactLink())));
}

// ---------- Интернэт тасрах үед ----------
const netBar = h('div', { class: 'net-bar', role: 'status', hidden: true }, 'Интернэт тасарсан байна. Холбогдмогц автоматаар шинэчлэгдэнэ.');
document.body.appendChild(netBar);
const syncNet = () => (netBar.hidden = navigator.onLine !== false);
window.addEventListener('online', syncNet);
window.addEventListener('offline', syncNet);
syncNet();

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
let profileFallback;
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
      target: undefined, giverId: undefined, giver: undefined, notifications: [], loadError: null, reads: null, gifts: [], myVote: undefined,
    });
    clearTimeout(profileFallback);
    render();
    return;
  }
  if (prev === user.uid) return render();
  S.loadError = null;
  clearTimeout(profileFallback);
  // Кэшэд "байхгүй" гэж ирээд сервер удвал серверээс шууд асууна: бүртгэлгүй эсвэл холболтгүйг ялгана.
  const onCacheMiss = () => {
    clearTimeout(profileFallback);
    profileFallback = setTimeout(async () => {
      if (S.profile !== undefined || !S.user || S.user.uid !== user.uid) return;
      try {
        const fresh = await fb.serverProfile(user.uid);
        if (S.profile === undefined && S.user && S.user.uid === user.uid) S.profile = fresh;
      } catch (e) {
        if (S.profile === undefined) S.loadError = errText(e);
      }
      render();
    }, 5000);
  };
  sub('u:profile', () =>
    fb.watch.profile(user.uid, (p) => {
      clearTimeout(profileFallback);
      S.profile = p;
      if (!p) {
        S.editing = false;
        forget('form:profile');
      }
      render();
    }, (e) => {
      console.error('profile', e);
      clearTimeout(profileFallback);
      if (S.profile === undefined) S.loadError = errText(e);
      else toast(errText(e), 'error');
      render();
    }, onCacheMiss));
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
    }, (e) => {
      console.error('config', e);
      if (S.config === undefined) {
        S.config = { ...DEFAULT_CONFIG };
        onConfig();
      }
      toast(errText(e), 'error');
      render();
    }));
  sub('u:notif', () => fb.watch.notifications(user.uid, onNotifications, loud('notifications')));
  sub('u:reads', () => fb.watch.reads(user.uid, (r) => {
    S.reads = r || {};
    render();
  }, () => {}));
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
  // Шилдэг бэлгийн санал хураалт (сүүлийн өдөр).
  if (active && c.finalDay) {
    if (!subs.has('u:gifts')) {
      sub('u:gifts', () => fb.watch.gifts((list) => {
        S.gifts = list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
        render();
      }, quiet(() => {
        S.gifts = [];
        render();
      })));
      sub('u:vote', () => fb.watch.myVote(S.user.uid, (v) => {
        S.myVote = v;
        render();
      }, quiet(() => {
        S.myVote = null;
        render();
      })));
    }
  } else {
    stop('u:gifts');
    stop('u:vote');
    Object.assign(S, { gifts: [], myVote: undefined });
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
// Уншсан төлөв: төхөөрөмж дээр болон серверт (reads/{uid}) хадгалж, ихийг нь авна.
const sentReads = {};
function serverRead(key) {
  return Math.max((S.reads && +S.reads[key]) || 0, sentReads[key] || 0);
}
function pushRead(key, value) {
  if (!S.user || value <= serverRead(key)) return;
  sentReads[key] = value;
  fb.saveReads(S.user.uid, { [key]: value }).catch((e) => console.warn('reads', e && e.code));
}
function lastSeen() {
  let local = 0;
  try {
    local = +(localStorage.getItem(seenKey()) || 0);
  } catch (_) {
    /* */
  }
  return Math.max(local, serverRead('notif'));
}
function markSeen() {
  const now = Date.now();
  try {
    localStorage.setItem(seenKey(), String(now));
  } catch (_) {
    /* хадгалах боломжгүй */
  }
  // Хэт олон бичихгүйн тулд 5 секундээс дээш зөрүүтэй үед л серверт хадгална.
  if (now - serverRead('notif') > 5000) pushRead('notif', now);
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

const THEME_COLORS = { home: '#2A1450', profile: '#1D1A52', notifications: '#2F1447', admin: '#150E38' };
// ---------- Хөвөх дүрсүүд (зүрх, цэцэг, бэлэг, од) ----------
// Хуудас бүрт өөр холимог: нүүр бэлэг, зүрхтэй; профайл цэцэгтэй; мэдэгдэл одтой; админ тайван.
const AMBIENT_MIX = {
  home: ['heart', 'gift', 'flower', 'heart', 'spark', 'gift'],
  profile: ['flower', 'heart', 'flower', 'spark'],
  notifications: ['spark', 'heart', 'spark', 'gift'],
  admin: ['spark', 'spark', 'heart'],
};
let ambientEls = [];
function ensureAmbient() {
  if (ambientEls.length) return;
  const wide = matchMedia('(min-width: 1000px)').matches;
  const n = wide ? 16 : 8;
  const layer = h('div', { class: 'ambient', 'aria-hidden': 'true' });
  for (let i = 0; i < n; i++) {
    const r = (a, b) => a + Math.random() * (b - a);
    const dur = r(28, 52);
    const item = h('span', {
      class: 'amb',
      style: {
        '--x': `${((i + r(0.1, 0.9)) / n) * 100}%`,
        '--y': `${r(5, 90)}%`,
        '--s': `${Math.round(r(wide ? 16 : 14, wide ? 34 : 26))}px`,
        '--d': `${dur.toFixed(1)}s`,
        '--delay': `${(-r(0, dur)).toFixed(1)}s`,
        '--sw': `${Math.round(r(12, 34))}px`,
        '--r': `${Math.round(r(-30, 30))}deg`,
        '--o': r(0.28, 0.55).toFixed(2),
      },
    }, motif('heart'));
    ambientEls.push(item);
    layer.appendChild(item);
  }
  document.body.appendChild(layer);
}
function updateAmbient(tab) {
  ensureAmbient();
  const mix = AMBIENT_MIX[tab] || AMBIENT_MIX.home;
  const fewer = tab === 'admin';
  ambientEls.forEach((el, i) => {
    setMotif(el.firstChild, mix[i % mix.length]);
    el.classList.toggle('amb-off', fewer && i % 3 !== 0);
  });
}

function setEnvironment(tab) {
  if (document.body.dataset.tab === tab) return;
  document.body.dataset.tab = tab;
  updateAmbient(tab);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[tab] || THEME_COLORS.home);
}

function draw() {
  setEnvironment(S.user && S.profile !== undefined ? S.tab : 'home');
  if (!S.authReady) return patch(root, [loadingView()]);
  if (!S.user) {
    screens.landing = screens.landing || h('main', { class: 'landing', id: 'main' });
    patch(screens.landing, landingContent());
    return patch(root, [screens.landing]);
  }
  if (S.loadError && S.profile === undefined) return patch(root, [errorView(S.loadError)]);
  if (S.profile === undefined || S.isAdmin === undefined || S.config === undefined) return patch(root, [loadingView()]);

  const tabs = availableTabs();
  if (!tabs.some((t) => t.id === S.tab)) S.tab = tabs[0].id;
  setEnvironment(S.tab);
  screens.main = screens.main || h('main', { class: 'page', id: 'main' });
  const wide = S.tab === 'admin' || (S.profile && (S.tab === 'home' || S.tab === 'profile'));
  screens.main.className = 'page' + (wide ? ' page-wide' : '') + (S.tab === screens.lastTab ? '' : ' page-enter');
  screens.lastTab = S.tab;
  patch(screens.main, [tabContent(), siteFooter()]);
  const deco = keep('bg:deco', () => svg(DECO_ART, 'bg-deco'));
  patch(root, [topbar(tabs), screens.main, tabbar(tabs), deco]);
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
function lettersSeen() {
  let local = 0;
  try {
    local = +(localStorage.getItem(lettersSeenKey()) || 0);
  } catch (_) {
    /* */
  }
  return Math.max(local, serverRead('letters'));
}
function unreadLetters() {
  const seen = lettersSeen();
  return incomingLetters().filter((m) => toMillis(m.createdAt) > seen).length;
}
function markLettersSeen() {
  const latest = Math.max(0, ...incomingLetters().map((m) => toMillis(m.createdAt)));
  if (!latest || latest <= lettersSeen()) return;
  try {
    localStorage.setItem(lettersSeenKey(), String(latest));
  } catch (_) {
    /* */
  }
  pushRead('letters', latest);
}

function errorView(msg) {
  return h('div', { class: 'loading' },
    h('div', { class: 'loading-inner' },
      svg(GIFT_MINI, 'loading-mark is-still'),
      h('div', { class: 'loading-help' },
        h('p', null, 'Мэдээлэл ачаалж чадсангүй.'),
        h('p', { class: 'small' }, msg),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: () => location.reload() }, 'Дахин ачаалах'),
          h('button', { class: 'btn btn-small', type: 'button', onclick: () => signOutNow() }, 'Гарах')))));
}

function loadingView() {
  return keep('loading', () => {
    const help = h('div', { class: 'loading-help', hidden: true },
      h('p', null, 'Ачаалахад удаж байна. Интернэт холболтоо шалгаад дахин оролдоно уу.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: () => location.reload() }, 'Дахин ачаалах'),
        h('button', { class: 'btn btn-small', type: 'button', onclick: () => signOutNow() }, 'Гарах')));
    const el = h('div', { class: 'loading' },
      h('div', { class: 'loading-inner' }, svg(GIFT_MINI, 'loading-mark'), h('span', { class: 'sr-only' }, 'Ачаалж байна'), help));
    // Ачаалах дэлгэц 12 секундээс удаан харагдвал тусламж гаргана.
    let timer = 0;
    let wasShown = false;
    const check = () => {
      const shown = el.isConnected;
      if (shown && !wasShown) {
        help.hidden = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (el.isConnected) help.hidden = false;
        }, 12000);
      }
      if (!shown) clearTimeout(timer);
      wasShown = shown;
    };
    new MutationObserver(check).observe(document.getElementById('app'), { childList: true });
    setTimeout(check, 0);
    return el;
  });
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
      h('button', { class: 'icon-btn', type: 'button', title: 'Гарах', 'aria-label': 'Гарах', onclick: () => signOutNow() }, svg(icons.logout))));
}

function tabbar(tabs) {
  if (tabs.length < 2) return null;
  return h('nav', { class: 'tabbar', 'aria-label': 'Үндсэн цэс' }, tabs.map(tabLink));
}

function tabContent() {
  if (S.tab === 'admin' && S.isAdmin) {
    return adminContent({ S, keep, forget, render, adFigure, titleBlock, cell });
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
    keep('landing:art', () => h('div', { class: 'hero-art-wrap' }, svg(HERO_ART, 'hero-figure'),
      h('div', { class: 'hero-motifs', 'aria-hidden': 'true' },
        [['heart', 'hm1'], ['flower', 'hm2'], ['gift', 'hm3'], ['spark', 'hm4'], ['heart', 'hm5']].map(([k, c]) => motif(k, 'hero-motif ' + c))))),
    keep('landing:text', () =>
      h('section', { class: 'hero' },
        h('p', { class: 'hero-eyebrow' }, 'ARXI.VERSE-25'),
        h('h1', { class: 'wordmark' }, 'Монита'),
        h('p', { class: 'hero-sub' }, 'Архитектурын ангийн шинэ жилийн нууц бэлэг'))),
    keep('landing:signin', signInBlock),
    howToView(false),
    announcementsSection(),
    keep('landing:vertical', () => h('div', { class: 'vertical-mark', 'aria-hidden': 'true' }, 'MUST ARCHITECTURE')),
    siteFooter(),
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
  fig.append(h('button', { class: 'ad-page', type: 'button', 'aria-label': a.title ? `${a.title}: зургийг томруулж харах` : 'Зарыг томруулж харах', onclick: () => openAd(a) },
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
  openDialog(h('div', { class: 'lightbox' }, pages), { title: a.title || 'Зар', wide: true });
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

// variant: 'target' — таны бэлэг өгөх хүн, 'giver' — танд бэлэг өгсөн хүн.
const VARIANT_TAG = { target: 'Та бэлэг өгнө', giver: 'Танд бэлэг өгсөн' };
function titleBlock(title, p, { golden = false, note = null, extra = null, photo, variant = null } = {}) {
  const pic = photo !== undefined ? photo : S.photos[p.uid || p.id];
  return h('article', { class: 'tblock' + (golden ? ' golden' : '') + (variant ? ' v-' + variant : '') },
    h('header', { class: 'tb-head' },
      h('div', { class: 'tb-who' }, avatar(p, pic), h('h2', { class: 'tb-title' }, title)),
      golden ? h('span', { class: 'tb-badge' }, motif('heart', 'motif-inline'), 'Алтан монита', motif('heart', 'motif-inline'))
        : variant ? h('span', { class: 'tb-tag' }, motif(variant === 'target' ? 'gift' : 'heart', 'motif-inline'), VARIANT_TAG[variant]) : null),
    note ? h('p', { class: 'tb-note' }, note) : null,
    h('div', { class: 'tb-grid' },
      cell('Овог', p.lastName),
      cell('Нэр', p.firstName),
      cell('Оюутны код', p.studentCode, 'code'),
      cell('Хүйс', genderLabel(p.gender)),
      cell('Утас', h('a', { href: 'tel:' + p.phone, class: 'tel' }, fmtPhone(p.phone)), 'wide'),
      cell('Hint', p.wishes || '—', 'wide pre'),
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
      countdownView(),
      h('a', { class: 'btn btn-ghost', href: '#profile' }, S.photos[S.user.uid] ? 'Профайл харах' : 'Профайл зураг оруулах')));
    out.push(targetPlaceholder());
    return [h('div', { class: 'home-pre' }, out), howToView(true), announcementsSection()];
  }
  out.push(countdownView());
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
  if (c.finalDay) {
    const gs = keep('gifts', giftSection);
    gs.sync();
    out.push(gs);
  }
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
      h('span', { class: 'wrap-motifs', 'aria-hidden': 'true' },
        (golden ? ['heart', 'heart', 'spark', 'heart'] : ['heart', 'flower', 'spark', 'gift']).map((k, i) => motif(k, 'wrap-motif wm' + (i + 1)))),
      svg(GIFT_MINI, 'gift-cube'),
      h('span', { class: 'gift-label' }, label),
      h('span', { class: 'gift-hint' }, 'Нээх'));
    cover.addEventListener('click', () => {
      el.classList.add('opening');
      burst(cover, golden ? { kinds: ['heart', 'heart', 'spark'], count: 24, spread: 150 } : { count: 18, spread: 130 });
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

// Өдрүүдийн шугам: өдөр бүрийн дугаар ба огноо.
function dimString(days, cur) {
  return h('ol', { class: 'dimstring', 'aria-label': 'Монитагийн өдрүүд' },
    days.map((d, i) => {
      const p = parseDay(d.date);
      return h('li', {
        class: 'dim-seg' + (i < cur ? ' past' : '') + (i === cur ? ' current' : ''),
        'aria-current': i === cur ? 'step' : null,
      },
      h('span', { class: 'dim-num' }, String(i + 1), h('span', { class: 'dim-num-word' }, '-р өдөр')),
      h('span', { class: 'dim-bar' }),
      p ? h('span', { class: 'dim-date' }, `${p.mo}/${p.d}`) : null);
    }));
}

// Огнооны хавтан: он, сар, өдөр, гараг.
function dateTile(iso) {
  const p = parseDay(iso);
  if (!p) return null;
  return h('div', { class: 'date-tile', 'aria-hidden': 'true' },
    h('span', { class: 'dt-year' }, `${p.y} он`),
    h('span', { class: 'dt-month' }, `${p.mo}-р сар`),
    h('span', { class: 'dt-day' }, String(p.d)),
    h('span', { class: 'dt-week' }, p.wd));
}

// ---------- Шилдэг бэлэг ----------
function openPhoto(src, title) {
  openDialog(h('div', { class: 'lightbox' }, h('img', { class: 'lightbox-img', src, alt: title || 'Бэлгийн зураг' })), { title: title || 'Бэлгийн зураг', wide: true });
}

function giftSection() {
  const intro = h('p', { class: 'muted' });
  const winnerBox = h('div', { class: 'gift-winner-wrap' });
  const mine = h('div', { class: 'gift-mine' });
  const grid = h('ul', { class: 'gift-grid' });
  const empty = h('p', { class: 'muted small' });
  const caption = h('input', { class: 'input', maxlength: '120', placeholder: 'Бэлгийн тухай товч (заавал биш)', 'aria-label': 'Бэлгийн тухай' });
  const fileId = 'gift-file-' + Math.random().toString(36).slice(2, 7);
  const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/heic', class: 'sr-only', id: fileId });
  const pick = h('label', { class: 'btn btn-primary btn-small', for: fileId }, svg(icons.upload), h('span', null, 'Бэлгийн зураг оруулах'));
  let busy = false;
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f || busy) return;
    busy = true;
    pick.classList.add('is-busy');
    pick.lastChild.textContent = 'Хадгалж байна…';
    try {
      const { data, ratio } = await fileToGiftPhoto(f);
      await fb.saveGift(S.user.uid, data, ratio, caption.value.trim());
      burst(pick, { kinds: ['gift', 'flower', 'spark'], count: 12, spread: 90 });
      toast('Бэлгийн зураг нэмэгдлээ');
    } catch (e) {
      console.error(e);
      toast(errText(e, e.message || 'Зураг хадгалж чадсангүй'), 'error');
    } finally {
      busy = false;
      pick.classList.remove('is-busy');
      el.sync(true);
    }
  });

  const el = h('section', { class: 'panel gifts-panel', 'aria-labelledby': 'gifts-h' },
    h('h2', { class: 'h-section with-motif', id: 'gifts-h' }, motif('gift', 'motif-head'), 'Шилдэг бэлэг'), intro, winnerBox, mine, grid, empty, file);

  let last = '';
  el.sync = (force) => {
    const c = S.config;
    const open = c.voting !== 'closed';
    const me = S.user.uid;
    const canTake = !!S.profile;
    const myGift = S.gifts.find((g) => g.id === me);
    const voted = S.myVote && S.myVote.entry;
    const win = c.giftWinner && c.giftWinner.entries ? c.giftWinner : null;
    const key = JSON.stringify([open, canTake, voted, S.gifts.map((g) => g.id + toMillis(g.createdAt) + (g.caption || '')), win]);
    if (key === last && !force) return;
    last = key;

    intro.textContent = open
      ? 'Авсан бэлгийнхээ зургийг оруулаад, хамгийн гоё бэлэгт саналаа өгөөрэй. Өөрийн зурагт санал өгөх боломжгүй.'
      : 'Санал хураалт дууслаа.';

    // Ялагч
    winnerBox.replaceChildren(...(win ? win.entries.map((w) => {
      const g = S.gifts.find((x) => x.id === w.id);
      return h('article', { class: 'gift-winner' },
        g ? h('button', { class: 'gift-img-btn', type: 'button', onclick: () => openPhoto(g.data, 'Шилдэг бэлэг') },
          h('img', { src: g.data, alt: 'Шилдэг бэлэг', style: { aspectRatio: `1 / ${g.ratio || 1}` } })) : null,
        h('div', { class: 'gift-winner-text' },
          h('span', { class: 'tb-badge' }, motif('gift', 'motif-inline'), 'Шилдэг бэлэг'),
          g && g.caption ? h('p', { class: 'gift-caption' }, g.caption) : null,
          h('dl', { class: 'day-facts' },
            h('div', { class: 'fact' }, h('dt', null, 'Бэлэг өгсөн'), h('dd', null, w.giver || '—')),
            h('div', { class: 'fact' }, h('dt', null, 'Хүлээн авсан'), h('dd', null, w.receiver || '—')),
            h('div', { class: 'fact' }, h('dt', null, 'Санал'), h('dd', null, String(w.votes))))));
    }) : []));

    // Өөрийн зураг
    mine.replaceChildren();
    if (open && canTake) {
      if (myGift) {
        if (myGift.caption) caption.value = myGift.caption;
        pick.lastChild.textContent = 'Зураг солих';
        mine.append(h('div', { class: 'gift-mine-row' },
          h('img', { class: 'gift-mine-img', src: myGift.data, alt: 'Таны оруулсан зураг' }),
          h('div', { class: 'gift-mine-actions' },
            h('p', { class: 'small' }, 'Таны оруулсан зураг'),
            caption,
            h('div', { class: 'actions' }, pick,
              h('button', {
                class: 'btn btn-small btn-ghost', type: 'button', onclick: async () => {
                  const ok = await confirmDialog({ title: 'Зургаа устгах уу?', ok: 'Устгах', danger: true });
                  if (!ok) return;
                  try {
                    await fb.deleteGift(me);
                    toast('Зураг устлаа');
                  } catch (e) {
                    toast(errText(e), 'error');
                  }
                },
              }, 'Устгах')))));
      } else {
        if (!busy) pick.lastChild.textContent = 'Бэлгийн зураг оруулах';
        mine.append(h('div', { class: 'gift-mine-actions' }, caption, h('div', { class: 'actions' }, pick)));
      }
    }

    // Бүх зураг
    const list = S.gifts;
    grid.replaceChildren(...list.map((g, i) => {
      const own = g.id === me;
      const isMyVote = voted === g.id;
      let action = null;
      if (own) action = h('span', { class: 'gift-tag' }, 'Таны зураг');
      else if (open && canTake) {
        action = h('button', {
          class: 'btn btn-small ' + (isMyVote ? 'btn-primary' : 'btn-ghost'), type: 'button', 'aria-pressed': isMyVote ? 'true' : 'false',
          onclick: async (e) => {
            e.currentTarget.disabled = true;
            try {
              const btnEl = e.currentTarget;
              if (isMyVote) await fb.unvote(me);
              else {
                burst(btnEl, { kinds: ['heart', 'spark'], count: 10, spread: 70 });
                await fb.vote(me, g.id);
              }
            } catch (er) {
              toast(errText(er, 'Санал өгч чадсангүй'), 'error');
            }
          },
        }, isMyVote ? '✓ Таны санал' : 'Санал өгөх');
      }
      return h('li', { class: 'gift-card' + (isMyVote ? ' voted' : '') },
        h('button', { class: 'gift-img-btn', type: 'button', 'aria-label': `${i + 1}-р бэлгийн зургийг томруулах`, onclick: () => openPhoto(g.data, `${i + 1}-р бэлэг`) },
          h('img', { src: g.data, alt: g.caption || `${i + 1}-р бэлэг`, loading: 'lazy', style: { aspectRatio: `1 / ${Math.min(g.ratio || 1, 1.5)}` } })),
        h('div', { class: 'gift-card-body' },
          g.caption ? h('p', { class: 'gift-caption' }, g.caption) : null,
          action));
    }));
    grid.hidden = !list.length;
    empty.textContent = list.length ? '' : 'Одоогоор зураг оруулаагүй байна.';
    empty.hidden = !!list.length;
  };
  return el;
}

// ---------- Хэрхэн оролцох вэ ----------
const HOW_TO = [
  ['Бүртгүүлэх', 'Google-ээр нэвтэрч, мэдээллээ бөглөнө.'],
  ['Монитаа харах', 'Монита эхлэхэд таны бэлэг өгөх хүн нүүр хуудсанд гарна.'],
  ['Бэлгээ өгөх', 'Өдөр бүрийн сэдвийн дагуу бэлгээ нууцаар өгнө. Нэргүй захидлаар харилцаж болно.'],
  ['Илчлэлт', 'Сүүлийн өдөр хэн хэнийг сонгосон, алтан монита хэн байсан нь илчлэгдэнэ.'],
];
function howToView(registered) {
  return keep('howto:' + (registered ? 'in' : 'out'), () =>
    h('section', { class: 'howto', 'aria-labelledby': 'howto-h-' + (registered ? 'in' : 'out') },
      h('h2', { class: 'h-section', id: 'howto-h-' + (registered ? 'in' : 'out') }, 'Хэрхэн оролцох вэ'),
      h('ol', { class: 'howto-steps' }, HOW_TO.map(([t, d], i) =>
        h('li', { class: 'howto-step' + (registered && i === 0 ? ' done' : '') },
          h('span', { class: 'howto-num', 'aria-hidden': 'true' }, registered && i === 0 ? '✓' : String(i + 1)),
          h('div', null, h('p', { class: 'howto-title' }, t), h('p', { class: 'howto-desc' }, d)))))));
}

// ---------- Тоолуур ----------
// Монита эхлэх (бүртгэлийн үед) эсвэл сүүлийн өдөр хүртэл (явагдаж байх үед) үлдсэн хугацаа.
function countdownTarget() {
  const c = S.config;
  const now = Date.now();
  if (c.state !== 'active' && c.startAt > now) return { at: c.startAt, label: 'Монита эхлэхэд' };
  if (c.state === 'active' && !c.finalDay && c.finalAt > now) return { at: c.finalAt, label: 'Сүүлийн өдөр хүртэл' };
  return null;
}
function countdownView() {
  const el = keep('countdown', () => {
    const label = h('p', { class: 'cd-label' });
    const units = h('div', { class: 'cd-units' });
    const when = h('p', { class: 'cd-when' });
    const box = h('section', { class: 'countdown', role: 'timer', 'aria-live': 'off' }, label, units, when);
    box.tick = () => {
      const t = countdownTarget();
      box.hidden = !t;
      if (!t) return;
      const left = Math.max(0, t.at - Date.now());
      const d = Math.floor(left / 86400000);
      const hh = Math.floor((left % 86400000) / 3600000);
      const mm = Math.floor((left % 3600000) / 60000);
      label.textContent = t.label;
      const parts = (d > 0 ? [[d, 'өдөр']] : []).concat([[hh, 'цаг'], [mm, 'минут']]);
      units.replaceChildren(...parts.map(([n, u]) =>
        h('span', { class: 'cd-unit' }, h('span', { class: 'cd-num' }, String(n).padStart(u === 'өдөр' ? 1 : 2, '0')), h('span', { class: 'cd-word' }, u))));
      when.textContent = fmtDate(t.at);
    };
    return box;
  });
  el.tick();
  return countdownTarget() ? el : null;
}
setInterval(() => {
  const el = document.querySelector('.countdown');
  if (el && el.tick) {
    const had = !el.hidden;
    el.tick();
    if (had && el.hidden) render();
  }
}, 20000);

// Үнийн хязгаар, хүлээлгэн өгөх цаг, газар.
function dayFacts(day) {
  const facts = [
    day.budget ? ['Үнийн дээд хязгаар', fmtMoney(day.budget)] : null,
    day.time ? ['Хүлээлгэн өгөх цаг', day.time] : null,
    day.place ? ['Газар', day.place] : null,
  ].filter(Boolean);
  if (!facts.length) return null;
  return h('dl', { class: 'day-facts' }, facts.map(([k, v]) => h('div', { class: 'fact' }, h('dt', null, k), h('dd', null, v))));
}

function daySection(c) {
  const days = (c.days || []).map(normDay);
  const cur = Math.min(c.currentDay || 0, Math.max(days.length - 1, 0));
  const day = days[cur] || normDay(null);
  const theme = day.theme.trim();
  const label = days.length ? `${cur + 1}-р өдрийн сэдэв` : 'Монита явагдаж байна';
  const full = fmtDay(day.date);
  return h('section', { class: 'day panel' + (c.finalDay ? ' final' : '') + (day.files.length ? ' has-media' : '') + (parseDay(day.date) ? ' has-date' : '') },
    days.length > 1 ? dimString(days, cur) : null,
    h('div', { class: 'day-body' },
      dateTile(day.date),
      h('div', { class: 'day-text' },
        h('p', { class: 'day-label' }, motif('flower', 'motif-inline'), label, c.finalDay ? h('span', { class: 'final-pill' }, 'Сүүлийн өдөр') : null),
        theme ? h('p', { class: 'day-theme' }, theme) : null,
        full ? h('p', { class: 'day-date' }, h('span', { class: 'sr-only' }, 'Огноо: '), full) : null),
      day.desc || dayFacts(day) ? h('div', { class: 'day-more' }, day.desc ? h('p', { class: 'day-desc' }, day.desc) : null, dayFacts(day)) : null,
      day.files.length
        ? h('div', { class: 'day-media' }, keep('daymedia:' + day.files[0], () =>
          adFigure({ id: 'day-' + day.files[0], files: day.files, ratios: day.ratios, title: theme || label })))
        : null));
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
      burst(send, { kinds: ['heart', 'spark'], count: 10, spread: 80 });
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
      h('h2', { class: 'h-section with-motif' }, motif('heart', 'motif-head'), out ? 'Монитадаа нэргүй захидал' : 'Танд ирсэн нэргүй захидал'),
      h('p', { class: 'muted small' }, out ? 'Таны нэр харагдахгүй.' : 'Хэн бичсэнийг сүүлийн өдөр мэдэх болно.')),
    list, empty, form);

  el.sync = () => {
    const myKey = (S.assignment && S.assignment.k) || '';
    let msgs;
    if (out) msgs = S.outbox.filter((m) => (m.dir === 'down' && m.k === myKey) || (m.dir === 'up' && (!m.k || m.k === myKey)));
    else msgs = S.inbox;
    msgs = [...msgs].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
    // Захидалд хэзээ ч нэр харуулахгүй: зөвхөн үүргээр нь.
    const otherName = out ? 'Таны монита' : 'Таныг сонгосон хүн';
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
  return wrapped(key, titleBlock('Таны монита', S.target, { variant: 'target' }), 'Таны монита хэн бэ?');
}

function revealSection() {
  if (S.giverId === undefined || (S.giverId && S.giver === undefined)) return waiting();
  if (!S.giver) return null;
  return wrapped('g:' + S.giverId, titleBlock('Таныг сонгосон хүн', S.giver, { variant: 'giver' }), 'Таныг хэн сонгосон бэ?');
}

// ---------- Бүртгэл ба профайл ----------
// Аль Gmail-ээр нэвтэрснийг харуулж, өөр хаягаар орох боломж өгнө.
function accountSwitch(hint) {
  return h('section', { class: 'account-switch' },
    h('div', null,
      h('p', { class: 'muted small' }, 'Нэвтэрсэн Gmail'),
      h('p', { class: 'account-email' }, S.user.email),
      hint ? h('p', { class: 'muted small' }, hint) : null),
    h('button', { class: 'btn btn-small', type: 'button', onclick: () => signOutNow() }, svg(icons.logout), 'Өөр Gmail-ээр нэвтрэх'));
}

function registerContent() {
  if (S.config.state === 'active') {
    return [
      h('section', { class: 'intro' },
        h('h1', { class: 'h-display' }, 'Монита эхэлсэн байна'),
        h('p', { class: 'lead' }, 'Энэ Gmail хаягаар бүртгэл олдсонгүй. Монита явагдаж байх үед шинээр бүртгүүлэх боломжгүй.')),
      accountSwitch('Хэрэв өөр Gmail-ээр бүртгүүлсэн бол тэр хаягаараа нэвтэрнэ үү.'),
      keep('form:admin', adminCodeForm),
    ];
  }
  return [
    h('header', { class: 'page-head' },
      h('h1', { class: 'h-display' }, 'Бүртгүүлэх'),
      h('p', { class: 'lead' }, 'Монитад оролцохын тулд мэдээллээ бөглөнө үү.')),
    accountSwitch(),
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
  const left = [];
  const right = [];
  const pc = keep('photo:control', photoControl);
  pc.sync();
  left.push(pc);
  if (S.editing) left.push(keep('form:profile', () => profileForm(S.profile)));
  else {
    left.push(titleBlock('Миний мэдээлэл', S.profile));
    left.push(locked
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
  right.push(installPanel());
  right.push(h('section', { class: 'account' },
    h('div', null, h('p', { class: 'muted small' }, 'Google бүртгэл'), h('p', { class: 'account-email' }, S.user.email)),
    h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => signOutNow() }, svg(icons.logout), 'Гарах')));
  if (S.config.state === 'registration' && !S.editing) right.push(deleteAccountPanel());
  if (!S.isAdmin) right.push(keep('form:admin', adminCodeForm));
  const colL = keep('profile:left', () => h('div', { class: 'profile-col' }));
  const colR = keep('profile:right', () => h('div', { class: 'profile-col profile-side' }));
  patch(colL, left);
  patch(colR, right);
  return [
    h('header', { class: 'page-head' }, h('h1', { class: 'h-display' }, 'Профайл')),
    keep('profile:grid', () => h('div', { class: 'profile-grid' }, colL, colR)),
  ];
}

// Монита эхлэхээс өмнө бүртгэлээ өөрөө устгах.
function deleteAccountPanel() {
  const btn = h('button', { class: 'btn btn-small btn-danger', type: 'button' }, svg(icons.trash), 'Бүртгэлээ устгах');
  btn.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Бүртгэлээ устгах уу?',
      body: 'Таны мэдээлэл, зураг бүрмөсөн устна. Дахин оролцох бол шинээр бүртгүүлнэ.',
      ok: 'Устгах',
      danger: true,
    });
    if (!ok) return;
    btn.disabled = true;
    try {
      const code = S.profile && S.profile.studentCode;
      await fb.deleteMyAccount(S.user.uid, code);
      try {
        localStorage.removeItem('monita:thumb:' + S.user.uid);
      } catch (_) {
        /* */
      }
      toast('Бүртгэл устлаа');
    } catch (e) {
      console.error(e);
      const msg = e.code !== 'permission-denied' ? errText(e)
        : S.config.state === 'registration' ? 'Одоогоор бүртгэл устгах боломжгүй байна. Админд хандана уу.'
          : 'Монита эхэлсэн тул бүртгэл устгах боломжгүй.';
      toast(msg, 'error');
      btn.disabled = false;
    }
  });
  return h('section', { class: 'account danger-zone' },
    h('p', { class: 'muted small' }, 'Монита эхлэхээс өмнө бүртгэлээ устгах боломжтой.'),
    btn);
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
    ({ AVATARS: list } = await import('./avatars.js?v=21'));
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
  const fWishes = field('Hint', wishes);
  fWishes.append(counter);

  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, p ? 'Хадгалах' : 'Бүртгүүлэх');
  const formErr = h('p', { class: 'field-error form-error', role: 'alert' });

  // Хувийн мэдээллийн зөвшөөрөл (өмнө нь өгөөгүй бол).
  const needConsent = !p || !p.consentAt;
  const consent = h('input', { type: 'checkbox', class: 'check-input', id: 'consent-' + Math.random().toString(36).slice(2, 7) });
  const consentErr = h('p', { class: 'field-error', role: 'alert' });
  const fConsent = needConsent
    ? h('div', { class: 'field consent' },
      h('div', { class: 'check-row' },
        consent,
        h('label', { for: consent.id }, 'Миний мэдээллийг монита зохион байгуулахад ашиглахыг зөвшөөрч байна.')),
      h('button', { class: 'linklike consent-more', type: 'button', onclick: openPrivacy }, 'Хувийн мэдээллийн бодлого'),
      consentErr)
    : null;
  consent.addEventListener('change', () => consent.checked && (consentErr.textContent = ''));

  const form = h('form', { class: 'form panel', novalidate: true },
    fCode, fGender, h('div', { class: 'row-2' }, fLast, fFirst), fPhone, fWishes, fConsent, formErr,
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
      consent: consent.checked,
    };
    if (needConsent && !consent.checked) consentErr.textContent = 'Үргэлжлүүлэхийн тулд зөвшөөрнө үү.';
    const errs = [
      [fCode, /^B\d{9}$/.test(data.studentCode) ? '' : 'Код "B" үсэг, араас нь 9 оронтой тоо байна. Жишээ: B252800012'],
      [fGender, data.gender ? '' : 'Хүйсээ сонгоно уу.'],
      [fLast, data.lastName ? '' : 'Овгоо оруулна уу.'],
      [fFirst, data.firstName ? '' : 'Нэрээ оруулна уу.'],
      [fPhone, /^\d{8}$/.test(data.phone) ? '' : 'Утасны дугаар 8 оронтой байна.'],
      [fWishes, data.wishes ? '' : 'Hint-ээ бичнэ үү.'],
    ];
    errs.forEach(([f, m]) => f.setError(m));
    const firstBad = errs.find(([, m]) => m);
    if (firstBad) {
      const ctl = firstBad[0].querySelector('input, textarea, button');
      ctl && ctl.focus();
      return;
    }
    if (needConsent && !consent.checked) {
      consent.focus();
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
      if (!p) burst(submit, { count: 20, spread: 140 });
      toast(p ? 'Хадгаллаа' : 'Бүртгэл амжилттай');
      S.editing = false;
      forget('form:profile');
      forget('form:register');
      render();
    } catch (er) {
      console.error(er);
      let taken = false;
      if (er.code === 'permission-denied' && S.config.state !== 'active') {
        // Нэг кодыг хоёр хүн зэрэг бүртгүүлэх үед хоёр дахь нь энд унана.
        try {
          const owner = await fb.codeOwner(data.studentCode);
          taken = !!owner && owner !== S.user.uid;
        } catch (_) {
          /* */
        }
      }
      if (taken) {
        fCode.setError('Энэ оюутны код өөр хүн дээр бүртгэлтэй байна.');
        code.focus();
      } else if (er.code === 'permission-denied' && S.config.state === 'active') formErr.textContent = 'Монита эхэлсэн тул мэдээлэл өөрчлөх боломжгүй.';
      else if (er.code === 'permission-denied') formErr.textContent = 'Хадгалж чадсангүй. Хуудсаа дахин ачаалаад оролдоно уу.';
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
      err.textContent = er.code === 'permission-denied'
        ? (S.config && S.config.adminLocked ? 'Админ код хаалттай байна. Одоогийн админаас нээлгэнэ үү.' : 'Код буруу байна.')
        : errText(er);
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
