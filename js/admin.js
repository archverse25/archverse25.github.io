import { h, svg, icons, toast, confirmDialog, openDialog, shortName, fullName, fmtDate, toMillis, errText, normDay, nextIsoDay, isoDay, parseDay } from './ui.js?v=25';
import * as fb from './fb.js?v=25';
import { makeMatching, validateMatching, validateCycle, matchReport, planRemoval, plannedGoldenCount, yearOf, isGolden, giverOf } from './matching.js?v=25';
import { fileToPages } from './media.js?v=25';

export function startAdminSubs(S, render, loud) {
  fb.ensureConfig().catch(loud('config'));
  const u1 = fb.watch.allUsers((list) => {
    S.admin.users = list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt) || String(a.studentCode).localeCompare(b.studentCode));
    render();
  }, loud('users'));
  const u2 = fb.watch.allAssignments((m) => {
    S.admin.assign = m;
    render();
  }, loud('assignments'));
  const u4 = fb.watch.allThumbs((m) => {
    S.admin.thumbs = m;
    render();
  }, () => {});
  const u3 = fb.watch.allNotifications((list) => {
    S.admin.notifications = list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    render();
  }, loud('notifications'));
  const u5 = fb.watch.allAdmins((list) => {
    S.admin.admins = list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
    render();
  }, () => {});
  const u6 = fb.watch.allVotes((list) => {
    S.admin.votes = list;
    render();
  }, () => {});
  const u7 = fb.watch.allErrors((list) => {
    S.admin.errors = list;
    render();
  }, () => {});
  return () => {
    u1();
    u2();
    u3();
    u4();
    u5();
    u6();
    u7();
  };
}

const SUBS = [
  ['people', 'Оролцогчид'],
  ['monita', 'Монита'],
  ['notify', 'Мэдэгдэл'],
  ['ads', 'Зар'],
  ['errors', 'Алдаа'],
];

function goSub(ctx, id) {
  ctx.S.admin.sub = id;
  try {
    sessionStorage.setItem('monita:adminSub', id);
  } catch (_) {
    /* */
  }
  ctx.render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function adminContent(ctx) {
  const { S, render } = ctx;
  const errCount = (S.admin.errors || []).length;
  const nav = h('div', { class: 'subnav', role: 'tablist', 'aria-label': 'Админы хэсэг' },
    SUBS.map(([id, label]) =>
      h('button', {
        class: 'subnav-btn' + (S.admin.sub === id ? ' active' : ''),
        type: 'button',
        role: 'tab',
        'aria-selected': S.admin.sub === id ? 'true' : 'false',
        onclick: () => {
          S.admin.sub = id;
          try {
            sessionStorage.setItem('monita:adminSub', id);
          } catch (_) {
            /* */
          }
          render();
        },
      }, label, id === 'errors' && errCount ? h('span', { class: 'subnav-count' }, String(errCount)) : null)));
  const out = [h('header', { class: 'page-head' }, h('h1', { class: 'h-display' }, 'Админ')), nav, remindersPanel(ctx)];
  const sub = S.admin.sub;
  if (sub === 'monita') out.push(...monitaSection(ctx));
  else if (sub === 'notify') out.push(...notifySection(ctx));
  else if (sub === 'ads') out.push(...adsSection(ctx));
  else if (sub === 'errors') out.push(...errorsSection(ctx));
  else out.push(...peopleSection(ctx));
  return out;
}

// ---------- Сануулга: өнөөдөр админ юу хийх ёстой ----------
function reminders(S) {
  const c = S.config;
  const now = Date.now();
  const out = [];
  const days = (c.days || []).map(normDay);
  if (c.state !== 'active') {
    if (c.startAt && now >= c.startAt) out.push({ text: 'Монита эхлэх хугацаа боллоо. Бэлэн бол монитаг эхлүүлнэ үү.', go: 'monita', label: 'Монита хэсэг рүү' });
    else if (c.startAt && c.startAt - now < 86400000) out.push({ text: `Монита 24 цагийн дотор эхэлнэ. Одоогоор ${people(S).length} оролцогч бүртгэлтэй.` });
  } else {
    const cur = Math.min(c.currentDay || 0, Math.max(days.length - 1, 0));
    const today = isoDay(new Date());
    const idx = days.findIndex((d) => d.date === today);
    if (!c.finalDay && idx >= 0 && idx !== cur) {
      const p = parseDay(today);
      out.push({
        text: `Өнөөдөр ${p.mo}/${p.d}: ${idx + 1}-р өдөр. Одоо ${cur + 1}-р өдөр идэвхтэй байна.`,
        action: { label: `${idx + 1}-р өдөр рүү шилжих`, run: () => fb.updateConfig({ currentDay: idx }), done: `${idx + 1}-р өдөр рүү шилжлээ` },
      });
    }
    if (days.length && days.some((d) => !d.date)) out.push({ text: 'Зарим өдрийн огноо оруулаагүй байна. Огноотой бол өдөр солих сануулга гарна.', go: 'monita', label: 'Өдрүүд рүү' });
    if (!c.finalDay && c.finalAt && now >= c.finalAt) out.push({ text: 'Сүүлийн өдрийн хугацаа боллоо. Сүүлийн өдрийг идэвхжүүлнэ үү.', go: 'monita', label: 'Монита хэсэг рүү' });
    if (c.finalDay && c.voting !== 'closed') out.push({ text: `Шилдэг бэлгийн санал хураалт явагдаж байна (${(S.admin.votes || []).length} санал). Дуусмагц дүнг зарлаарай.`, go: 'monita', label: 'Санал хураалт' });
    if (c.finalDay && c.voting === 'closed') out.push({ text: 'Монита дууссан бол хувийн мэдээллийн бодлогын дагуу оролцогчдын мэдээллийг устгаарай.', go: 'monita', label: 'Устгах хэсэг рүү' });
    if (!c.adminLocked) out.push({ text: 'Админ код нээлттэй байна. Бүх админ нэмэгдсэн бол хаагаарай.', go: 'monita', label: 'Админууд' });
  }
  const recent = (S.admin.errors || []).filter((e) => now - toMillis(e.at) < 86400000).length;
  if (recent) out.push({ text: `Сүүлийн 24 цагт ${recent} алдаа бүртгэгдсэн.`, go: 'errors', label: 'Алдаа харах' });
  return out;
}
function remindersPanel(ctx) {
  const list = reminders(ctx.S);
  if (!list.length) return null;
  return h('section', { class: 'reminders', 'aria-label': 'Сануулга' },
    h('ul', null, list.map((r) => {
      let btn = null;
      if (r.action) {
        btn = h('button', { class: 'btn btn-small btn-primary', type: 'button' }, r.action.label);
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await r.action.run();
            toast(r.action.done || 'Боллоо');
          } catch (e) {
            toast(errText(e), 'error');
            btn.disabled = false;
          }
        });
      } else if (r.go && ctx.S.admin.sub !== r.go) {
        btn = h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: () => goSub(ctx, r.go) }, r.label);
      }
      return h('li', null, h('p', null, r.text), btn);
    })));
}

// ---------- Алдааны бүртгэл ----------
function deviceOf(ua) {
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Бусад';
  const br = /Instagram/.test(ua) ? 'Instagram' : /FBAN|FBAV|Messenger/.test(ua) ? 'Facebook' : /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Хөтөч';
  return `${os}, ${br}`;
}
function errorsSection(ctx) {
  const { S } = ctx;
  const byId = byIdMap(S);
  const list = (S.admin.errors || []).slice().sort((a, b) => toMillis(b.at) - toMillis(a.at));
  const clear = h('button', { class: 'btn btn-small btn-ghost', type: 'button', disabled: !list.length }, svg(icons.trash), 'Бүгдийг цэвэрлэх');
  clear.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Бүх алдааг цэвэрлэх үү?', ok: 'Цэвэрлэх', danger: true });
    if (!ok) return;
    try {
      await fb.clearErrors();
      toast('Цэвэрлэлээ');
    } catch (e) {
      toast(errText(e), 'error');
    }
  });
  return [h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', { class: 'h-section' }, 'Алдааны бүртгэл'), clear),
    h('p', { class: 'muted' }, 'Оролцогчдод алдаа гарахад энд автоматаар бүртгэгдэнэ. Давтагдсан алдаа нэг мөрөнд шинэчлэгдэнэ. Засах шаардлагатай алдааг зураг дарж илгээгээрэй.'),
    list.length
      ? h('ul', { class: 'error-list' }, list.map((e) => {
        const u = byId[e.uid];
        return h('li', { class: 'error-item' },
          h('div', { class: 'error-meta' },
            h('b', null, u ? shortName(u) : 'Бүртгэлгүй хэрэглэгч'),
            h('span', null, fmtDate(e.at)),
            h('span', null, deviceOf(e.ua || '')),
            h('span', null, `${e.page || ''} v${e.v || '?'}`)),
          h('p', { class: 'error-msg' }, e.msg || '—'),
          h('p', { class: 'muted small' }, [e.where, e.code].filter(Boolean).join(', ')),
          h('button', {
            class: 'icon-btn', type: 'button', 'aria-label': 'Устгах', onclick: () => fb.deleteError(e.id).catch((er) => toast(errText(er), 'error')),
          }, svg(icons.close)));
      }))
      : h('p', { class: 'muted' }, 'Алдаа бүртгэгдээгүй байна.'))];
}

function people(S) {
  return S.admin.users.filter((u) => u.studentCode);
}
function byIdMap(S) {
  return Object.fromEntries(S.admin.users.map((u) => [u.id, u]));
}

// ---------- Оролцогчид ----------
function stat(label, value) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'stat-label' }, label));
}

function peopleSection(ctx) {
  const { S } = ctx;
  const users = people(S);
  const byId = byIdMap(S);
  const assign = S.admin.assign;
  const thumbs = S.admin.thumbs || {};
  const active = S.config.state === 'active';
  const males = users.filter((u) => u.gender === 'male').length;
  const golden = active
    ? Object.keys(assign).filter((g) => isGolden(assign, g)).length / 2
    : plannedGoldenCount(users.map((u) => ({ gender: u.gender, year: yearOf(u.studentCode) })));

  const stats = h('div', { class: 'stats' },
    stat('Оролцогч', users.length),
    stat('Эрэгтэй', males),
    stat('Эмэгтэй', users.length - males),
    stat('Алтан монита', golden));
  const breakdown = statsPanel(users, thumbs);

  const search = ctx.keep('admin:search', () => {
    const inp = h('input', { class: 'input', type: 'search', placeholder: 'Код, нэрээр хайх', 'aria-label': 'Оролцогч хайх' });
    inp.addEventListener('input', () => {
      S.admin.q = inp.value.trim().toLowerCase();
      ctx.render();
    });
    const exportBtn = h('button', { class: 'btn btn-small', type: 'button' }, svg(icons.download), 'Excel татах');
    exportBtn.addEventListener('click', () => exportExcel(ctx, exportBtn));
    return h('div', { class: 'people-tools' }, h('div', { class: 'searchbox' }, svg(icons.search), inp), exportBtn);
  });

  const q = S.admin.q;
  const match = (u) => !q || [u.studentCode, u.lastName, u.firstName, shortName(u)].some((s) => String(s || '').toLowerCase().includes(q));
  const rows = [];
  users.forEach((u, i) => {
    if (!match(u)) return;
    const t = byId[assign[u.id]];
    const g = active && isGolden(assign, u.id);
    rows.push(h('tr', { class: g ? 'is-golden' : null },
      h('td', { class: 'c-num', 'data-label': '№' }, String(i + 1)),
      h('td', { class: 'c-code', 'data-label': 'Код' }, u.studentCode),
      h('td', { class: 'c-name', 'data-label': 'Нэр' },
        h('span', { class: 'name-cell' },
          thumbs[u.id]
            ? h('img', { class: 'avatar-xs', src: thumbs[u.id], alt: '' })
            : h('span', { class: 'avatar-xs avatar-empty', 'aria-hidden': 'true' }, (u.firstName || '?')[0].toUpperCase()),
          h('button', { class: 'linklike', type: 'button', onclick: () => details(ctx, u) }, shortName(u)))),
      h('td', { class: 'c-gender', 'data-label': 'Хүйс' }, u.gender === 'male' ? 'Эр' : 'Эм'),
      h('td', { class: 'c-tcode', 'data-label': 'Монитагийн код' }, t ? t.studentCode : '—'),
      h('td', { class: 'c-tname', 'data-label': 'Монитагийн нэр' },
        t ? h('button', { class: 'linklike', type: 'button', onclick: () => details(ctx, t) }, shortName(t)) : '—',
        g ? h('span', { class: 'gold-mark', title: 'Алтан монита' }, ' ✦') : null),
      h('td', { class: 'c-act' },
        h('button', { class: 'icon-btn danger', type: 'button', 'aria-label': `${shortName(u)}-г устгах`, title: 'Устгах', onclick: () => remove(ctx, u) }, svg(icons.trash)))));
  });

  const table = users.length
    ? h('div', { class: 'table-wrap' },
      h('table', { class: 'ptable' },
        h('thead', null, h('tr', null,
          h('th', { class: 'c-num' }, '№'),
          h('th', null, 'Код'),
          h('th', null, 'Нэр'),
          h('th', null, 'Хүйс'),
          h('th', null, 'Монитагийн код'),
          h('th', null, 'Монитагийн нэр'),
          h('th', { class: 'c-act' }, h('span', { class: 'sr-only' }, 'Үйлдэл')))),
        h('tbody', null, rows)),
      rows.length ? null : h('p', { class: 'empty' }, 'Хайлтад тохирох оролцогч алга.'))
    : h('p', { class: 'empty' }, 'Одоогоор бүртгүүлсэн оролцогч алга.');
  return [stats, breakdown, search, table];
}

async function exportExcel(ctx, btn) {
  const { S } = ctx;
  const users = people(S);
  if (!users.length) return toast('Оролцогч алга байна.');
  btn.disabled = true;
  try {
    const XLSX = await import('../vendor/xlsx.js?v=25');
    const byId = byIdMap(S);
    const assign = S.admin.assign;
    const active = S.config.state === 'active';
    const rows = users.map((u, i) => {
      const t = byId[assign[u.id]];
      return {
        '№': i + 1,
        'Оюутны код': u.studentCode,
        'Овог': u.lastName,
        'Нэр': u.firstName,
        'Хүйс': u.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй',
        'Утас': u.phone,
        'Имэйл': u.email || '',
        'Hint': u.wishes || '',
        'Монитагийн код': t ? t.studentCode : '',
        'Монитагийн овог нэр': t ? `${t.lastName} ${t.firstName}` : '',
        'Алтан монита': active && isGolden(assign, u.id) ? 'Тийм' : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [5, 14, 16, 16, 10, 12, 26, 40, 16, 24, 12].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Оролцогчид');
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    XLSX.writeFile(wb, `monita-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`);
  } catch (e) {
    console.error(e);
    toast(errText(e, 'Excel файл үүсгэж чадсангүй'), 'error');
  } finally {
    btn.disabled = false;
  }
}

async function details(ctx, u) {
  const { S } = ctx;
  let photo = null;
  try {
    photo = await fb.getPhoto(u.id);
  } catch (_) {
    /* зураг алга */
  }
  const byId = byIdMap(S);
  const assign = S.admin.assign;
  const t = byId[assign[u.id]];
  const giver = byId[giverOf(assign, u.id)];
  const golden = isGolden(assign, u.id);
  openDialog(h('div', { class: 'stack' },
    ctx.titleBlock(fullName(u), u, {
      golden,
      photo,
      extra: ctx.cell('Gmail', u.email ? h('a', { href: 'mailto:' + u.email, class: 'tel' }, u.email) : '—', 'wide'),
    }),
    t ? h('p', { class: 'detail-line' }, 'Сонгосон монита: ', h('strong', null, `${t.studentCode} ${shortName(t)}`)) : null,
    giver ? h('p', { class: 'detail-line' }, 'Түүнийг сонгосон: ', h('strong', null, `${giver.studentCode} ${shortName(giver)}`)) : null),
  { title: 'Оролцогч', wide: true });
}

// Устгахаас өмнө хэний монита яаж өөрчлөгдөхийг тооцоолж шалгана.
function removalPlan(S, u) {
  const assign = S.admin.assign || {};
  if (S.config.state !== 'active' || !(u.id in assign || Object.values(assign).includes(u.id))) return null;
  const years = {};
  const genders = {};
  S.admin.users.forEach((x) => {
    years[x.id] = yearOf(x.studentCode);
    genders[x.id] = x.gender;
  });
  const plan = planRemoval(assign, years, u.id, Math.random, genders);
  const golden = new Set(Object.keys(assign).filter((g) => isGolden(assign, g)));
  const err = validateCycle(plan.assign, golden);
  if (err) throw new Error('Холболт нөхөхөд алдаа гарлаа: ' + err);
  return plan;
}

const CHANGE_LABEL = { replaced: 'устгагдсан хүний монитаг авна', reinserted: 'шинэ монитатай болно', changed: 'монита нь өөрчлөгдөнө' };

async function remove(ctx, u) {
  const { S } = ctx;
  let plan;
  try {
    plan = removalPlan(S, u);
  } catch (e) {
    toast(e.message, 'error');
    return;
  }
  const byId = byIdMap(S);
  const nm = (id) => (byId[id] ? shortName(byId[id]) : '—');
  const rows = plan ? plan.changes.filter((c) => CHANGE_LABEL[c.kind]) : [];
  const extra = rows.length
    ? h('div', { class: 'change-list' },
      h('p', { class: 'muted small' }, 'Холболтын өөрчлөлт (эдгээр хүмүүст мэдэгдэл очно):'),
      h('ul', null, rows.map((c) =>
        h('li', null, h('b', null, nm(c.uid)), ` ${CHANGE_LABEL[c.kind]}: `, h('b', null, nm(c.to))))))
    : null;
  const ok = await confirmDialog({
    title: 'Оролцогчийг устгах уу?',
    body: `${fullName(u)} (${u.studentCode})-ийн бүртгэл устна.`,
    extra,
    ok: 'Устгах',
    danger: true,
  });
  if (!ok) return;
  try {
    // Хүлээх хооронд холболт өөрчлөгдсөн байж болзошгүй тул дахин тооцоолно.
    const fresh = removalPlan(S, u);
    await fb.removeParticipant(u, { assign: S.admin.assign || {}, plan: fresh });
    toast('Устгалаа');
  } catch (e) {
    console.error(e);
    toast(errText(e, 'Устгаж чадсангүй'), 'error');
  }
}

// Элссэн оноос курс: хичээлийн жил 9-р сараас эхэлнэ (2026–27 онд 26 он = 1-р курс, 25 он = 2-р курс).
function courseOf(yy) {
  const now = new Date();
  const studyYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return studyYear - (2000 + yy) + 1;
}

// Статистик: курсээр (хүйсээр задлан), зураггүй оролцогчид.
function statsPanel(users, thumbs) {
  if (!users.length) return null;
  const byYear = {};
  for (const u of users) {
    const y = yearOf(u.studentCode);
    const r = (byYear[y] = byYear[y] || { total: 0, male: 0, female: 0 });
    r.total++;
    r[u.gender === 'male' ? 'male' : 'female']++;
  }
  // Курсээр эрэмбэлнэ: 1-р курс эхэнд.
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  const max = Math.max(...years.map((y) => byYear[y].total));
  const noPhoto = users.filter((u) => !thumbs[u.id]);
  return h('section', { class: 'panel stats-panel' },
    h('div', { class: 'stats-block' },
      h('h2', { class: 'h-section' }, 'Курсээр'),
      h('ul', { class: 'meter-list' }, years.map((y) => {
        const r = byYear[y];
        const c = courseOf(y);
        const label = c >= 1 ? `${c}-р курс` : `${2000 + y} он`;
        const detail = `${r.total} хүн (эр ${r.male}, эм ${r.female})`;
        return h('li', { class: 'meter-row', title: `${label}: ${detail}` },
          h('span', { class: 'meter-name' }, label),
          h('span', { class: 'meter-track', 'aria-hidden': 'true' }, h('span', { class: 'meter-bar', style: { width: `${(r.total / max) * 100}%` } })),
          h('span', { class: 'meter-fig' }, detail));
      }))),
    h('div', { class: 'stats-block' },
      h('h2', { class: 'h-section' }, `Зураггүй оролцогчид (${noPhoto.length})`),
      noPhoto.length
        ? h('ul', { class: 'chip-list' }, noPhoto.map((u) => h('li', { class: 'chip' }, shortName(u))))
        : h('p', { class: 'muted' }, 'Бүх оролцогч профайл зурагтай.')));
}

// ---------- Монита удирдлага ----------
function monitaSection(ctx) {
  const { S } = ctx;
  const c = S.config;
  const users = people(S);
  const active = c.state === 'active';
  const k = plannedGoldenCount(users.map((u) => ({ gender: u.gender, year: yearOf(u.studentCode) })));

  let body;
  if (!active) {
    const startBtn = h('button', { class: 'btn btn-primary', type: 'button', disabled: users.length < 3 }, 'Монитаг эхлүүлэх');
    startBtn.addEventListener('click', () => start(ctx, startBtn));
    body = [
      h('p', { class: 'status-line' }, 'Бүртгэл явагдаж байна'),
      h('p', { class: 'muted' }, users.length < 3
        ? 'Эхлүүлэхэд дор хаяж 3 оролцогч хэрэгтэй.'
        : `${users.length} оролцогч холбогдож, ${k} алтан монита үүснэ.`),
      h('div', { class: 'actions' }, startBtn),
    ];
  } else {
    const finalBtn = h('button', { class: 'btn ' + (c.finalDay ? 'btn-ghost' : 'btn-primary'), type: 'button' },
      c.finalDay ? 'Сүүлийн өдрийг буцаах' : 'Сүүлийн өдрийг идэвхжүүлэх');
    finalBtn.addEventListener('click', () => toggleFinal(ctx, finalBtn));
    const cancelBtn = h('button', { class: 'btn btn-danger', type: 'button' }, 'Монитаг цуцлах');
    cancelBtn.addEventListener('click', () => cancel(ctx, cancelBtn));
    body = [
      h('p', { class: 'status-line' }, c.finalDay ? 'Сүүлийн өдөр идэвхтэй' : 'Монита явагдаж байна'),
      h('p', { class: 'muted' }, `${Object.keys(S.admin.assign).length} оролцогч холбогдсон. Эхэлсэн: ${fmtDate(c.startedAt)}`),
      h('div', { class: 'actions' }, finalBtn, cancelBtn),
    ];
  }
  const status = h('section', { class: 'panel' }, h('h2', { class: 'h-section' }, 'Төлөв'), body);
  const days = ctx.keep('admin:days', () => daysEditor(ctx));
  days.sync();
  const sched = ctx.keep('admin:schedule', () => schedulePanel(ctx));
  sched.sync();
  return [status, active && c.finalDay ? votePanel(ctx) : null, sched, days, adminsPanel(ctx), backupPanel(ctx), wipePanel(ctx)];
}

// ---------- Нөөц хуулбар ----------
function backupPanel(ctx) {
  const dl = h('button', { class: 'btn btn-primary', type: 'button' }, svg(icons.download), 'Нөөц татах');
  dl.addEventListener('click', async () => {
    dl.disabled = true;
    try {
      const b = await fb.exportBackup();
      const blob = new Blob([JSON.stringify(b)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `monita-noots-${isoDay(new Date())}.json` });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
      toast('Нөөц татагдлаа');
    } catch (e) {
      console.error(e);
      toast(errText(e, 'Нөөц татаж чадсангүй'), 'error');
    } finally {
      dl.disabled = false;
    }
  });
  const fileId = 'restore-' + Math.random().toString(36).slice(2, 7);
  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', id: fileId });
  const pick = h('label', { class: 'btn btn-ghost', for: fileId }, svg(icons.upload), 'Нөөцөөс сэргээх');
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    let b;
    try {
      b = JSON.parse(await f.text());
    } catch (_) {
      return toast('Файлыг уншиж чадсангүй. Энэ сайтаас татсан нөөц файл сонгоно уу.', 'error');
    }
    const sum = fb.backupSummary(b);
    if (!sum) return toast('Энэ файл монитагийн нөөц биш байна.', 'error');
    const input = h('input', { class: 'input', placeholder: 'СЭРГЭЭХ', autocomplete: 'off', 'aria-label': 'Баталгаажуулах үг' });
    const go = h('button', { class: 'btn btn-danger', type: 'button', disabled: true }, 'Сэргээх');
    input.addEventListener('input', () => (go.disabled = input.value.trim().toUpperCase() !== 'СЭРГЭЭХ'));
    const c = sum.counts;
    const close = openDialog(h('div', null,
      h('p', { class: 'dialog-text' }, `${fmtDate(sum.exportedAt)}-ны нөөц: ${c.users} оролцогч, ${c.assignments} холболт, ${c.letters} захидал, ${c.notifications} мэдэгдэл.`),
      h('p', { class: 'muted small' }, 'Нөөцөд байгаа мэдээлэл одоогийнхыг дарж бичнэ. Нөөцийн дараа бүртгүүлсэн хүмүүс устахгүй. Профайл зураг сэргээгдэхгүй.'),
      h('p', { class: 'muted small' }, 'Баталгаажуулахын тулд СЭРГЭЭХ гэж бичнэ үү.'),
      input,
      h('div', { class: 'dialog-actions' }, h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => close() }, 'Болих'), go)),
    { title: 'Нөөцөөс сэргээх үү?' });
    go.addEventListener('click', async () => {
      go.disabled = true;
      input.disabled = true;
      go.textContent = 'Сэргээж байна…';
      try {
        await fb.restoreBackup(b);
        close();
        toast('Нөөцөөс сэргээлээ');
      } catch (e) {
        console.error(e);
        go.textContent = 'Сэргээх';
        go.disabled = false;
        input.disabled = false;
        toast(errText(e, 'Сэргээж чадсангүй'), 'error');
      }
    });
    setTimeout(() => input.focus(), 50);
  });
  return h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Нөөц хуулбар'),
    h('p', { class: 'muted' }, 'Холболт, өдрүүд, оролцогчдын мэдээлэл, захидлыг нэг файлаар татна. Санамсаргүй устгал эсвэл алдаа гарвал энэ файлаас сэргээнэ. Монита эхэлсний дараа болон чухал өөрчлөлтийн өмнө татаж аваарай.'),
    h('p', { class: 'note' }, 'Файлд оролцогчдын хувийн мэдээлэл бий. Бусдад бүү дамжуул, монита дууссаны дараа устгаарай.'),
    h('div', { class: 'actions' }, dl, pick), file);
}

// Шилдэг бэлгийн санал хураалт: явц, дүн зарлах.
function voteTally(S) {
  const entries = new Set((S.gifts || []).map((g) => g.id));
  const counts = {};
  for (const v of S.admin.votes || []) if (entries.has(v.entry)) counts[v.entry] = (counts[v.entry] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
function votePanel(ctx) {
  const { S } = ctx;
  const c = S.config;
  const open = c.voting !== 'closed';
  const byId = byIdMap(S);
  const tally = voteTally(S);
  const totalVotes = tally.reduce((s, [, n]) => s + n, 0);
  const nm = (id) => (byId[id] ? shortName(byId[id]) : '—');
  const btn = h('button', { class: 'btn ' + (open ? 'btn-primary' : 'btn-ghost'), type: 'button', disabled: open && !tally.length },
    open ? 'Санал хураалтыг хааж дүнг зарлах' : 'Дүнг нууж санал хураалтыг дахин нээх');
  btn.addEventListener('click', async () => {
    if (open) {
      const top = tally.length ? tally[0][1] : 0;
      const winners = tally.filter(([, n]) => n === top && n > 0);
      const ok = await confirmDialog({
        title: 'Дүнг зарлах уу?',
        body: `Шилдэг бэлэг: ${winners.map(([id]) => `${nm(giverOf(S.admin.assign, id))} → ${nm(id)}`).join(', ')} (${top} санал). Санал хураалт хаагдана.`,
        ok: 'Зарлах',
      });
      if (!ok) return;
      btn.disabled = true;
      try {
        await fb.updateConfig({
          voting: 'closed',
          giftWinner: { entries: winners.map(([id, n]) => ({ id, votes: n, giver: nm(giverOf(S.admin.assign, id)), receiver: nm(id) })), total: totalVotes },
        });
        toast('Дүн зарлагдлаа');
      } catch (e) {
        toast(errText(e), 'error');
        btn.disabled = false;
      }
    } else {
      btn.disabled = true;
      try {
        await fb.updateConfig({ voting: 'open', giftWinner: null });
        toast('Санал хураалт дахин нээгдлээ');
      } catch (e) {
        toast(errText(e), 'error');
        btn.disabled = false;
      }
    }
  });
  return h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Шилдэг бэлэг'),
    h('p', { class: 'muted' }, `${(S.gifts || []).length} зураг, ${totalVotes} санал. ${open ? 'Санал хураалт явагдаж байна.' : 'Дүн зарлагдсан.'}`),
    tally.length
      ? h('ol', { class: 'vote-list' }, tally.slice(0, 10).map(([id, n]) =>
        h('li', null, h('span', null, `${nm(giverOf(S.admin.assign, id))} → ${nm(id)}`), h('b', null, `${n} санал`))))
      : null,
    h('div', { class: 'actions' }, btn));
}

// 'YYYY-MM-DDTHH:MM' (орон нутгийн цаг) ↔ мс
function toLocalInput(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}
function fromLocalInput(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

// Тоолуурын хугацаа: монита эхлэх, сүүлийн өдөр.
function schedulePanel(ctx) {
  const { S } = ctx;
  let dirty = false;
  const startInp = h('input', { class: 'input input-date', type: 'datetime-local', 'aria-label': 'Монита эхлэх огноо, цаг' });
  const finalInp = h('input', { class: 'input input-date', type: 'datetime-local', 'aria-label': 'Сүүлийн өдрийн огноо, цаг' });
  const save = h('button', { class: 'btn btn-primary', type: 'button', disabled: true }, 'Хугацаа хадгалах');
  [startInp, finalInp].forEach((el) => el.addEventListener('input', () => {
    dirty = true;
    save.disabled = false;
  }));
  save.addEventListener('click', async () => {
    const startAt = fromLocalInput(startInp.value);
    const finalAt = fromLocalInput(finalInp.value);
    if (startAt && finalAt && finalAt <= startAt) return toast('Сүүлийн өдөр эхлэх хугацаанаас хойш байх ёстой.', 'error');
    save.disabled = true;
    try {
      await fb.updateConfig({ startAt, finalAt });
      dirty = false;
      toast('Хадгаллаа');
    } catch (e) {
      save.disabled = false;
      toast(errText(e), 'error');
    }
  });
  const lab = (text, ctl) => h('label', { class: 'mini-field' }, h('span', { class: 'mini-label' }, text), ctl);
  const el = h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Тоолуур'),
    h('p', { class: 'muted' }, 'Нүүр хуудсанд монита эхлэх болон сүүлийн өдөр хүртэл хэр хугацаа үлдсэнийг харуулна. Хоосон орхивол харагдахгүй.'),
    h('div', { class: 'sched-grid' }, lab('Монита эхлэх', startInp), lab('Сүүлийн өдөр', finalInp)),
    h('div', { class: 'actions' }, save));
  el.sync = () => {
    if (dirty) return;
    startInp.value = toLocalInput(S.config.startAt);
    finalInp.value = toLocalInput(S.config.finalAt);
  };
  return el;
}

// Монита дууссаны дараа оролцогчдын мэдээллийг бүрмөсөн устгах (хувийн мэдээллийн бодлогын дагуу).
function wipePanel(ctx) {
  const { S } = ctx;
  const c = S.config;
  const blocked = c.state === 'active' && !c.finalDay;
  const btn = h('button', { class: 'btn btn-danger', type: 'button', disabled: blocked }, svg(icons.trash), 'Бүх мэдээллийг устгах');
  btn.addEventListener('click', () => {
    const input = h('input', { class: 'input', placeholder: 'УСТГАХ', autocomplete: 'off', 'aria-label': 'Баталгаажуулах үг' });
    const go = h('button', { class: 'btn btn-danger', type: 'button', disabled: true }, 'Устгах');
    input.addEventListener('input', () => (go.disabled = input.value.trim().toUpperCase() !== 'УСТГАХ'));
    const close = openDialog(h('div', null,
      h('p', { class: 'dialog-text' }, `${people(S).length} оролцогчийн бүртгэл, зураг, холболт, захидал, мэдэгдэл бүрмөсөн устна. Буцаах боломжгүй.`),
      h('p', { class: 'muted small' }, 'Баталгаажуулахын тулд УСТГАХ гэж бичнэ үү.'),
      input,
      h('div', { class: 'dialog-actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => close() }, 'Болих'),
        go)),
    { title: 'Бүх мэдээллийг устгах уу?' });
    go.addEventListener('click', async () => {
      go.disabled = true;
      input.disabled = true;
      go.textContent = 'Устгаж байна…';
      try {
        const n = await fb.wipeParticipantData();
        close();
        toast(`${n} оролцогчийн мэдээлэл устлаа`);
      } catch (e) {
        console.error(e);
        go.textContent = 'Устгах';
        go.disabled = false;
        input.disabled = false;
        toast(errText(e, 'Устгаж чадсангүй. Дахин оролдоно уу.'), 'error');
      }
    });
    setTimeout(() => input.focus(), 50);
  });
  return h('section', { class: 'panel danger-zone' },
    h('h2', { class: 'h-section' }, 'Монита дууссаны дараа'),
    h('p', { class: 'muted' }, 'Оролцогчдын бүртгэл, зураг, холболт, захидал, мэдэгдлийг бүрмөсөн устгана. Зар, өдрийн сэдэв, админууд хэвээр үлдэнэ.'),
    blocked ? h('p', { class: 'note' }, 'Монита явагдаж байна. Сүүлийн өдрийг идэвхжүүлсний дараа эсвэл цуцалсны дараа устгах боломжтой.') : null,
    h('div', { class: 'actions' }, btn));
}

// Админууд: хэн админ болсныг харах, хасах, шинээр админ болохыг хаах.
function adminsPanel(ctx) {
  const { S } = ctx;
  const list = S.admin.admins || [];
  const locked = !!S.config.adminLocked;
  const lockBtn = h('button', { class: 'btn ' + (locked ? 'btn-ghost' : 'btn-primary'), type: 'button' },
    locked ? 'Админ кодыг нээх' : 'Админ кодыг хаах');
  lockBtn.addEventListener('click', async () => {
    lockBtn.disabled = true;
    try {
      await fb.updateConfig({ adminLocked: !locked });
      toast(locked ? 'Админ код нээгдлээ' : 'Админ код хаагдлаа');
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      lockBtn.disabled = false;
    }
  });
  return h('section', { class: 'panel admins-panel' },
    h('h2', { class: 'h-section' }, 'Админууд'),
    h('ul', { class: 'admin-list' }, list.map((a) => {
      const self = a.id === S.user.uid;
      return h('li', null,
        h('div', null,
          h('p', { class: 'account-email' }, a.email || '—', self ? h('span', { class: 'muted small' }, ' (та)') : null),
          h('p', { class: 'muted small' }, fmtDate(a.createdAt))),
        self ? null : h('button', {
          class: 'btn btn-small btn-danger', type: 'button', onclick: async () => {
            const ok = await confirmDialog({ title: 'Админ эрхийг хасах уу?', body: `${a.email}-ийн админ эрх хасагдана.`, ok: 'Хасах', danger: true });
            if (!ok) return;
            try {
              await fb.removeAdmin(a.id);
              toast('Админ эрх хасагдлаа');
            } catch (e) {
              toast(errText(e), 'error');
            }
          },
        }, 'Хасах'));
    })),
    h('p', { class: 'muted' }, locked
      ? 'Админ код хаалттай: кодыг мэдсэн ч шинээр хэн ч админ болох боломжгүй.'
      : 'Админ код нээлттэй: кодыг мэдсэн хүн бүр админ болж чадна. Бүх админ нэмэгдсэний дараа хаахыг зөвлөж байна.'),
    h('div', { class: 'actions' }, lockBtn));
}

// Урьдчилсан тайлан: ±2 жилийн дүрэм, алтан монитагийн тоо.
function previewNotes(users) {
  const ppl = users.map((u) => ({ uid: u.id, code: u.studentCode, gender: u.gender }));
  let m;
  try {
    m = makeMatching(ppl);
  } catch (_) {
    return null;
  }
  const r = matchReport(ppl, m.assign, m.golden);
  const notes = [];
  notes.push(`Алтан монита: ${r.golden}` + (r.golden < r.goldenWanted
    ? ` (дүрмээр ${r.goldenWanted} байх ёстой ч хүйсийн харьцаа эсвэл оролцогчдын тооноос болж ${r.golden} үүснэ)`
    : ''));
  if (r.yearIssues > 0) {
    notes.push(`${r.yearIssues} холболт ±2 жилийн дүрэмд багтахгүй: ойролцоо онтой хүн хүрэлцэхгүй тул хамгийн ойр онтой хүнтэй холбогдоно (хамгийн их зөрүү ${r.maxGap} жил).`);
  } else notes.push('Бүх холболт ±2 жилийн дүрэмд багтана.');
  if (r.sameGender === 0) notes.push('Бүх хүн эсрэг хүйсийн хүнд бэлэг өгнө.');
  else {
    notes.push(`${users.length - r.sameGender} хүн эсрэг хүйсийн, ${r.sameGender} хүн ижил хүйсийн хүнд бэлэг өгнө` +
      (r.sameGender <= r.sameFloor ? ` (эрэгтэй ${r.males}, эмэгтэй ${r.females} тул үүнээс бага боломжгүй).` : '.'));
  }
  return h('ul', { class: 'change-list' }, notes.map((t) => h('li', null, t)));
}

async function start(ctx, btn) {
  const { S } = ctx;
  const users = people(S);
  const ok = await confirmDialog({
    title: 'Монитаг эхлүүлэх үү?',
    body: `${users.length} оролцогчийг холбоно. Эхэлсний дараа шинээр бүртгүүлэх, мэдээлэл засах боломжгүй.`,
    extra: previewNotes(users),
    ok: 'Эхлүүлэх',
  });
  if (!ok) return;
  btn.disabled = true;
  let locked = false;
  try {
    await fb.lockRegistration();
    locked = true;
    const fresh = (await fb.freshUsers()).filter((u) => u.studentCode);
    const ppl = fresh.map((u) => ({ uid: u.id, code: u.studentCode, gender: u.gender }));
    if (ppl.length < 3) throw new Error('Дор хаяж 3 оролцогч хэрэгтэй.');
    const m = makeMatching(ppl);
    const err = validateMatching(ppl, m.assign, m.golden);
    if (err) throw new Error(err);
    await fb.startMonita(m.assign, m.golden.length);
    toast(fresh.length === users.length ? 'Монита эхэллээ' : `Монита эхэллээ (${fresh.length} оролцогч)`);
  } catch (e) {
    console.error(e);
    if (locked) await fb.reopenRegistration().catch(() => {});
    toast(errText(e, e.message || 'Эхлүүлж чадсангүй'), 'error');
  } finally {
    btn.disabled = false;
  }
}

async function cancel(ctx, btn) {
  const ok = await confirmDialog({
    title: 'Монитаг цуцлах уу?',
    body: 'Бүх холболт устаж, бүртгэлийн шат руу буцна. Оролцогчдын бүртгэл хэвээр үлдэнэ.',
    ok: 'Цуцлах',
    danger: true,
  });
  if (!ok) return;
  btn.disabled = true;
  try {
    await fb.cancelMonita();
    toast('Монита цуцлагдлаа');
  } catch (e) {
    toast(errText(e), 'error');
  } finally {
    btn.disabled = false;
  }
}

async function toggleFinal(ctx, btn) {
  const on = !ctx.S.config.finalDay;
  if (on) {
    const ok = await confirmDialog({
      title: 'Сүүлийн өдрийг идэвхжүүлэх үү?',
      body: 'Оролцогч бүр өөрийг нь сонгосон хүнийг харах болно. Алтан монита ч мөн илчлэгдэнэ.',
      ok: 'Идэвхжүүлэх',
    });
    if (!ok) return;
  }
  btn.disabled = true;
  try {
    await fb.updateConfig({ finalDay: on });
    toast(on ? 'Сүүлийн өдөр идэвхжлээ' : 'Сүүлийн өдрийг буцаалаа');
  } catch (e) {
    toast(errText(e), 'error');
  } finally {
    btn.disabled = false;
  }
}

function daysEditor(ctx) {
  const { S } = ctx;
  const fromConfig = () => (S.config.days || []).map(normDay);
  let items = fromConfig();
  let dirty = false;
  let sig = '';
  const list = h('ol', { class: 'days' });
  const saveBtn = h('button', { class: 'btn btn-primary', type: 'button', disabled: true }, 'Сэдэв хадгалах');
  const addBtn = h('button', { class: 'btn btn-ghost', type: 'button' }, svg(icons.plus), 'Өдөр нэмэх');
  const markDirty = () => {
    dirty = true;
    saveBtn.disabled = false;
  };

  function mediaBox(d, i) {
    const box = h('div', { class: 'day-media-edit' });
    if (d.files.length) {
      box.append(
        ctx.adFigure({ id: 'day-' + d.files[0], files: d.files, ratios: d.ratios }),
        h('button', {
          class: 'btn btn-small btn-danger', type: 'button', onclick: async () => {
            const ok = await confirmDialog({ title: `${i + 1}-р өдрийн зургийг хасах уу?`, ok: 'Хасах', danger: true });
            if (!ok) return;
            const old = d.files;
            items[i] = { ...items[i], files: [], ratios: [] };
            await save(undefined, 'Зураг хасагдлаа');
            fb.deleteFiles(old).catch(() => {});
          },
        }, 'Зураг хасах'));
    } else {
      const id = 'day-file-' + i + '-' + Math.random().toString(36).slice(2, 7);
      const input = h('input', { type: 'file', accept: 'application/pdf,image/png,image/jpeg', class: 'sr-only', id });
      const label = h('label', { class: 'btn btn-small btn-ghost', for: id }, svg(icons.upload), 'Зураг / PDF нэмэх');
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        label.classList.add('is-busy');
        label.lastChild.textContent = 'Бэлдэж байна…';
        try {
          const pages = await fileToPages(file);
          const saved = await fb.saveFiles(pages);
          items[i] = { ...items[i], ...saved };
          await save(undefined, 'Зураг нэмэгдлээ');
        } catch (e) {
          console.error(e);
          toast(errText(e, e.message || 'Зураг нэмж чадсангүй'), 'error');
          label.classList.remove('is-busy');
          label.lastChild.textContent = 'Зураг / PDF нэмэх';
        }
      });
      box.append(input, label);
    }
    return box;
  }

  function draw() {
    const cur = S.config.currentDay || 0;
    list.replaceChildren(...items.map((d, i) => {
      const inp = h('input', { class: 'input', value: d.theme, placeholder: 'Сэдэв', 'aria-label': `${i + 1}-р өдрийн сэдэв` });
      inp.addEventListener('input', () => {
        items[i] = { ...items[i], theme: inp.value };
        markDirty();
      });
      const dateInp = h('input', { class: 'input input-date', type: 'date', value: d.date, 'aria-label': `${i + 1}-р өдрийн огноо` });
      dateInp.addEventListener('input', () => {
        items[i] = { ...items[i], date: dateInp.value };
        markDirty();
      });
      // Нэмэлт мэдээлэл: тайлбар, үнийн хязгаар, хүлээлгэн өгөх цаг ба газар.
      const bind = (el, key, conv = (v) => v) => {
        el.addEventListener('input', () => {
          items[i] = { ...items[i], [key]: conv(el.value) };
          markDirty();
        });
        return el;
      };
      const descInp = bind(h('textarea', { class: 'input textarea', rows: '2', maxlength: '300', placeholder: 'Жишээ: Цэнхэр өнгөтэй, гараар хийсэн зүйл' }), 'desc');
      descInp.value = d.desc;
      const budgetInp = h('input', { class: 'input', inputmode: 'numeric', placeholder: '20,000', value: d.budget ? d.budget.toLocaleString('en-US') : '' });
      budgetInp.addEventListener('input', () => {
        const n = parseInt(budgetInp.value.replace(/\D/g, ''), 10) || 0;
        budgetInp.value = n ? n.toLocaleString('en-US') : '';
        items[i] = { ...items[i], budget: n };
        markDirty();
      });
      const timeInp = bind(h('input', { class: 'input input-date', type: 'time', value: d.time }), 'time');
      const placeInp = bind(h('input', { class: 'input', maxlength: '80', placeholder: 'Жишээ: 3-р байр, 204 тоот', value: d.place }), 'place');
      const lab = (text, ctl, cls = '') => h('label', { class: 'mini-field ' + cls }, h('span', { class: 'mini-label' }, text), ctl);
      const details = h('div', { class: 'day-details' },
        lab('Тайлбар', descInp, 'wide'),
        lab('Үнийн дээд хязгаар (₮)', budgetInp),
        lab('Хүлээлгэн өгөх цаг', timeInp),
        lab('Газар', placeInp));
      const isCur = S.config.state === 'active' && cur === i;
      return h('li', { class: 'day-row' + (isCur ? ' current' : '') },
        h('span', { class: 'day-num' }, `${i + 1}-р өдөр`),
        dateInp,
        inp,
        h('div', { class: 'day-actions' },
          isCur
            ? h('span', { class: 'day-current' }, 'Одоогийн өдөр')
            : h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: () => save(i) }, 'Энэ өдөр рүү шилжих'),
          h('button', {
            class: 'icon-btn', type: 'button', 'aria-label': `${i + 1}-р өдрийг хасах`, onclick: () => {
              const removed = items.splice(i, 1)[0];
              if (removed && removed.files.length) fb.deleteFiles(removed.files).catch(() => {});
              markDirty();
              draw();
            },
          }, svg(icons.trash))),
        details,
        mediaBox(d, i));
    }));
    if (!items.length) list.append(h('li', { class: 'empty' }, 'Өдөр нэмээд сэдвээ оруулна уу.'));
  }

  async function save(switchTo, message) {
    const days = items.map((d) => ({
      theme: d.theme.trim(), date: d.date || '', desc: (d.desc || '').trim(), budget: d.budget || 0,
      time: d.time || '', place: (d.place || '').trim(), files: d.files, ratios: d.ratios,
    }));
    let currentDay = switchTo !== undefined ? switchTo : S.config.currentDay || 0;
    if (currentDay >= days.length) currentDay = Math.max(0, days.length - 1);
    saveBtn.disabled = true;
    try {
      await fb.updateConfig({ days, currentDay });
      dirty = false;
      toast(message || (switchTo !== undefined ? `${currentDay + 1}-р өдөр рүү шилжлээ` : 'Хадгаллаа'));
    } catch (e) {
      saveBtn.disabled = false;
      toast(errText(e), 'error');
    }
  }

  addBtn.addEventListener('click', () => {
    // Огноог өмнөх өдрийн дараагийн өдрөөр (эхний өдөр бол өнөөдрөөр) бөглөнө.
    const prev = items.length ? items[items.length - 1].date : '';
    const last = items.length ? items[items.length - 1] : null;
    // Үнийн хязгаар, цаг, газрыг өмнөх өдрөөс хуулна (ихэвчлэн ижил байдаг).
    items.push({ ...normDay(null), date: nextIsoDay(prev), budget: last ? last.budget : 0, time: last ? last.time : '', place: last ? last.place : '' });
    markDirty();
    draw();
    const inputs = list.querySelectorAll('input.input:not(.input-date)');
    inputs[inputs.length - 1] && inputs[inputs.length - 1].focus();
  });
  saveBtn.addEventListener('click', () => save());

  const el = h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Өдрүүд ба сэдэв'),
    h('p', { class: 'muted' }, 'Өдөр бүрийн сэдвийг бичиж, хүсвэл зураг эсвэл PDF хавсаргана. Сэдэв солих үед "Энэ өдөр рүү шилжих" товчийг дарна.'),
    list,
    h('div', { class: 'actions' }, addBtn, saveBtn));
  el.sync = () => {
    const next = JSON.stringify([S.config.days || [], S.config.currentDay || 0, S.config.state]);
    if (next === sig) return;
    sig = next;
    if (!dirty) items = fromConfig();
    draw();
  };
  return el;
}

// ---------- Мэдэгдэл ----------
function notifySection(ctx) {
  const { S } = ctx;
  const byId = byIdMap(S);
  const composer = ctx.keep('admin:composer', () => composerForm(ctx));
  composer.sync();
  const list = S.admin.notifications;
  const sent = h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Илгээсэн мэдэгдэл'),
    list.length
      ? h('ol', { class: 'notes' }, list.map((n) => {
        const u = byId[n.to];
        return h('li', { class: 'notice' },
          h('p', { class: 'notice-to' }, n.to === 'all' ? 'Бүх оролцогчид' : u ? `${u.studentCode} ${shortName(u)}` : 'Устсан оролцогч'),
          h('p', { class: 'notice-text' }, n.text),
          h('div', { class: 'notice-foot' },
            h('time', { class: 'notice-time' }, fmtDate(n.createdAt)),
            h('button', {
              class: 'btn btn-small btn-ghost', type: 'button', onclick: async () => {
                const ok = await confirmDialog({ title: 'Мэдэгдлийг устгах уу?', ok: 'Устгах', danger: true });
                if (!ok) return;
                fb.deleteNotification(n.id).catch((e) => toast(errText(e), 'error'));
              },
            }, 'Устгах')));
      }))
      : h('p', { class: 'empty' }, 'Илгээсэн мэдэгдэл алга.'));
  return [composer, sent];
}

function composerForm(ctx) {
  const { S } = ctx;
  const select = h('select', { class: 'input', 'aria-label': 'Хүлээн авагч' });
  const text = h('textarea', { class: 'input textarea', rows: '4', maxlength: '1000', placeholder: 'Мэдэгдлийн агуулга', 'aria-label': 'Мэдэгдлийн агуулга' });
  const send = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Илгээх');
  let sig = '';
  const form = h('form', { class: 'panel form' },
    h('h2', { class: 'h-section' }, 'Мэдэгдэл илгээх'),
    h('div', { class: 'field' }, h('label', { class: 'label' }, 'Хэнд'), select),
    h('div', { class: 'field' }, h('label', { class: 'label' }, 'Агуулга'), text),
    h('div', { class: 'actions' }, send));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = text.value.trim();
    if (!msg) {
      text.focus();
      return;
    }
    const to = select.value;
    send.disabled = true;
    try {
      await fb.sendNotification(to, msg);
      text.value = '';
      toast('Илгээлээ');
    } catch (er) {
      toast(errText(er), 'error');
    } finally {
      send.disabled = false;
    }
  });
  form.sync = () => {
    const users = people(S);
    const next = users.map((u) => u.id + u.studentCode + u.lastName + u.firstName).join('|');
    if (next === sig) return;
    sig = next;
    const val = select.value || 'all';
    select.replaceChildren(
      h('option', { value: 'all' }, 'Бүх оролцогчид'),
      ...users.map((u) => h('option', { value: u.id }, `${u.studentCode} ${shortName(u)}`)));
    select.value = [...select.options].some((o) => o.value === val) ? val : 'all';
  };
  return form;
}

// ---------- Зар ----------
function adsSection(ctx) {
  const { S } = ctx;
  const up = ctx.keep('admin:upload', () => uploadPanel());
  const list = S.announcements;
  const current = h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Нүүр хуудасны зар'),
    list.length
      ? h('div', { class: 'ad-admin-list' }, list.map((a) =>
        h('div', { class: 'ad-admin' },
          ctx.keep('ann:' + a.id, () => ctx.adFigure(a)),
          h('div', { class: 'ad-admin-foot' },
            h('time', { class: 'notice-time' }, fmtDate(a.createdAt)),
            h('button', {
              class: 'btn btn-small btn-danger', type: 'button', onclick: async () => {
                const ok = await confirmDialog({ title: 'Зарыг устгах уу?', ok: 'Устгах', danger: true });
                if (!ok) return;
                try {
                  await fb.deleteAnnouncement(a);
                  toast('Зар устлаа');
                } catch (e) {
                  toast(errText(e), 'error');
                }
              },
            }, 'Устгах')))))
      : h('p', { class: 'empty' }, 'Одоогоор зар алга.'));
  return [up, current];
}

function uploadPanel() {
  const input = h('input', { type: 'file', accept: 'application/pdf,image/png,image/jpeg', class: 'sr-only', id: 'ad-file' });
  const label = h('label', { class: 'btn btn-primary', for: 'ad-file' }, svg(icons.upload), 'Файл сонгох');
  const status = h('p', { class: 'muted', role: 'status' });
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    label.classList.add('is-busy');
    try {
      status.textContent = 'Файлыг бэлдэж байна…';
      const pages = await fileToPages(file, (i, n) => (status.textContent = `Хуудас ${i}/${n}-ийг бэлдэж байна…`));
      status.textContent = 'Хадгалж байна…';
      await fb.addAnnouncement(pages);
      status.textContent = '';
      toast('Зар нэмэгдлээ');
    } catch (e) {
      console.error(e);
      status.textContent = '';
      toast(errText(e, e.message || 'Зар нэмж чадсангүй'), 'error');
    } finally {
      label.classList.remove('is-busy');
    }
  });
  return h('section', { class: 'panel' },
    h('h2', { class: 'h-section' }, 'Зар нэмэх'),
    h('p', { class: 'muted' }, 'PDF эсвэл PNG файл оруулна. Зар нүүр хуудсанд бүх хүнд харагдана.'),
    h('div', { class: 'actions' }, input, label),
    status);
}
