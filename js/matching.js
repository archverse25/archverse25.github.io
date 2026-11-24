// Монита холбох алгоритм.
// Дүрэм:
//  - Оюутны код B + 2 оронтой элссэн он + 4 оронтой анги + 3 оронтой дугаар (B252800012).
//  - Хүн бүр ±2 жилийн зөрүүтэй хүнтэй таарна (25 → 23, 24, 25, 26, 27).
//  - Алтан монита: хүйс өөр, ±2 жилийн дүрэмд багтах 2 хүн бие биенээ сонгоно.
//    Тоо нь max(1, floor(n / 25)).
//  - Бусад хэн ч бие биенээ сонгохгүй (энгийн тойрог дор хаяж 3 хүнтэй).
//  - Дүрмээр болохгүй үед хамгийн ойр онтой бүлэг рүү нэвтэрнэ (зөрчлийг хамгийн бага байлгана).

export function yearOf(code) {
  return parseInt(String(code).slice(1, 3), 10);
}

export function goldenCountFor(n) {
  return Math.max(1, Math.floor(n / 25));
}

const VIOLATION = 1000;
const BAD_CYCLE = 1e7;
// Ижил хүйстэй холболтын торгууль: бүх торгуулийн нийлбэр нэг жилийн зөрүүнээс бага байхаар (жилийн дүрэм түрүүлнэ).
const genderWeight = (n) => Math.max(1, Math.floor(VIOLATION / (n + 1)));
// Эрэгтэй/эмэгтэйн тоо тэнцүү биш үед зайлшгүй үлдэх ижил хүйстэй холболтын хамгийн бага тоо.
export function minSameGender(people) {
  const m = people.filter((p) => p.gender === 'male').length;
  return people.length - 2 * Math.min(m, people.length - m);
}

// Элссэн оны зөвшөөрөгдөх зөрүү (дээш доош).
export const YEAR_RANGE = 2;
function gap(a, b) {
  const d = Math.abs(a - b);
  return d <= YEAR_RANGE ? 0 : d - YEAR_RANGE;
}

function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Алтан монитагийн тоог бусад хүмүүс зөв тойрог үүсгэх боломжтойгоор тохируулна.
export function plannedGoldenCount(people) {
  const n = people.length;
  let k = goldenCountFor(n);
  const males = people.filter((p) => p.gender === 'male').length;
  const females = n - males;
  k = Math.min(k, males, females);
  while (k > 0 && (n - 2 * k === 1 || n - 2 * k === 2 || n - 2 * k < 0)) k--;
  return k;
}

// spread > 0 үед хамгийн ойр биш хосыг ч туршина (бусдын холболтыг сайжруулж болох тул).
function pickGolden(people, k, rnd, spread = 0) {
  if (k === 0) return [];
  const males = shuffle(people.filter((p) => p.gender === 'male'), rnd);
  const females = shuffle(people.filter((p) => p.gender === 'female'), rnd);
  const pairs = [];
  for (const m of males) for (const f of females) pairs.push({ m, f, g: gap(m.year, f.year) + rnd() * spread, r: rnd() });
  pairs.sort((a, b) => a.g - b.g || a.r - b.r);
  const used = new Set();
  const out = [];
  for (const p of pairs) {
    if (out.length >= k) break;
    if (used.has(p.m.uid) || used.has(p.f.uid)) continue;
    used.add(p.m.uid);
    used.add(p.f.uid);
    out.push([p.m, p.f]);
  }
  return out;
}

// Тойргуудын бүтцийн үнэ: 1 хүнтэй тойрог болон ижил хүйстэй 2 хүнтэй тойрог хориотой,
// 2 хүнтэй (алтан) тойрог яг k ширхэг байх ёстой. ≥3 тойрог бүр +1 (цөөн тойрог давуу).
function structure(next, gender, k) {
  const m = next.length;
  const seen = new Uint8Array(m);
  let cost = 0;
  let twos = 0;
  let cycles = 0;
  for (let i = 0; i < m; i++) {
    if (seen[i]) continue;
    let len = 0;
    let j = i;
    while (!seen[j]) {
      seen[j] = 1;
      j = next[j];
      len++;
    }
    cycles++;
    if (len === 1) cost += BAD_CYCLE;
    else if (len === 2) {
      if (gender[i] === gender[next[i]]) cost += BAD_CYCLE;
      else twos++;
    } else cost += 1;
  }
  return { cost: cost + Math.abs(twos - k) * BAD_CYCLE, cycles };
}

// Бүх хүнийг нэг дор: k алтан хос + дор хаяж 3 хүнтэй тойргууд, онын зөрүүг хамгийн бага байлгана.
function optimize(ps, k, rnd, spread, { gw = 0, init = null, T0 = 1500 } = {}) {
  const m = ps.length;
  const ys = ps.map((p) => p.year);
  const gender = ps.map((p) => p.gender);
  const idx = new Map(ps.map((p, i) => [p.uid, i]));
  const next = new Array(m);

  // Эхлэл: өгөгдсөн шийдэл, эсвэл алтан хосууд + үлдсэнийг оноор эрэмбэлсэн зигзаг тойрог.
  const golden = init ? [] : pickGolden(ps, k, rnd, spread);
  const inGolden = new Set();
  for (const [a, b] of golden) {
    next[idx.get(a.uid)] = idx.get(b.uid);
    next[idx.get(b.uid)] = idx.get(a.uid);
    inGolden.add(a.uid);
    inGolden.add(b.uid);
  }
  const order = ps.map((_, i) => i).filter((i) => !inGolden.has(ps[i].uid));
  const r = ps.map(() => rnd());
  order.sort((a, b) => ys[a] - ys[b] || r[a] - r[b]);
  const ring = [];
  for (let i = 0; i < order.length; i += 2) ring.push(order[i]);
  for (let i = order.length % 2 === 0 ? order.length - 1 : order.length - 2; i >= 1; i -= 2) ring.push(order[i]);
  for (let i = 0; i < ring.length; i++) next[ring[i]] = ring[(i + 1) % ring.length];
  if (init) for (let i = 0; i < m; i++) next[i] = init[i];

  const edge = (a, b) => gap(ys[a], ys[b]) * VIOLATION + (gw && gender[a] === gender[b] ? gw : 0);
  let edgeSum = 0;
  for (let i = 0; i < m; i++) edgeSum += edge(i, next[i]);
  let st = structure(next, gender, k);
  let cost = edgeSum + st.cost;
  let best = next.slice();
  let bestCost = cost;
  let bestEdge = edgeSum;

  const total = (nx) => {
    let e = 0;
    for (let i = 0; i < m; i++) e += edge(i, nx[i]);
    return e;
  };
  const predOf = (nx, c) => {
    for (let i = 0; i < m; i++) if (nx[i] === c) return i;
    return -1;
  };
  // Алтан хос солих нийлмэл алхам: (a,b) хосыг тойрогт оруулж, (c,d)-г тойргоос гаргаж алтан болгоно.
  const goldenSwap = () => {
    const pairs = [];
    for (let i = 0; i < m; i++) if (next[next[i]] === i && i < next[i]) pairs.push(i);
    if (!pairs.length) return null;
    const a = pairs[Math.floor(rnd() * pairs.length)];
    const b = next[a];
    const free = [];
    for (let i = 0; i < m; i++) if (next[next[i]] !== i) free.push(i);
    if (free.length < 3) return null;
    const c = free[Math.floor(rnd() * free.length)];
    const opp = free.filter((i) => i !== c && gender[i] !== gender[c]);
    if (!opp.length) return null;
    const d = opp[Math.floor(rnd() * opp.length)];
    const nx = next.slice();
    for (const v of [c, d]) {
      const pv = predOf(nx, v);
      nx[pv] = nx[v];
      nx[v] = v; // салгана (дараагийн хайлтад хуучин заалт үлдэхгүй)
    }
    nx[c] = d;
    nx[d] = c;
    const hosts = [];
    for (let i = 0; i < m; i++) if (i !== a && i !== b && i !== c && i !== d && nx[nx[i]] !== i) hosts.push(i);
    if (!hosts.length) return null;
    const x = hosts[Math.floor(rnd() * hosts.length)];
    const y = nx[x];
    const [u, w] = rnd() < 0.5 ? [a, b] : [b, a];
    nx[x] = u;
    nx[u] = w;
    nx[w] = y;
    return nx;
  };

  const iters = Math.min(80000, 4000 + 300 * m);
  let T = T0;
  const cooling = Math.pow(0.2 / T, 1 / iters);
  // Нэг хүнийг тойргоос нь гаргаж өөр газар оруулах алхам (хүйс ээлжлүүлэхэд хэрэгтэй).
  const relocate = () => {
    const x = Math.floor(rnd() * m);
    const after = next[x];
    if (next[after] === x) return null;
    const px = predOf(next, x);
    const a = Math.floor(rnd() * m);
    if (a === x || a === px) return null;
    const nx = next.slice();
    nx[px] = after;
    const b = nx[a];
    nx[a] = x;
    nx[x] = b;
    return nx;
  };

  for (let it = 0; it < iters; it++, T *= cooling) {
    const r0 = rnd();
    if ((k > 0 && r0 < 0.08) || r0 > 0.75) {
      const nx = r0 > 0.75 ? relocate() : goldenSwap();
      if (!nx) continue;
      const nEdge = total(nx);
      const nst = structure(nx, gender, k);
      const newCost = nEdge + nst.cost;
      const delta = newCost - cost;
      if (delta <= 0 || rnd() < Math.exp(-delta / T)) {
        for (let i = 0; i < m; i++) next[i] = nx[i];
        cost = newCost;
        edgeSum = nEdge;
        st = nst;
        if (cost < bestCost) {
          bestCost = cost;
          best = next.slice();
          bestEdge = edgeSum;
        }
      }
      continue;
    }
    const a = Math.floor(rnd() * m);
    let b = Math.floor(rnd() * (m - 1));
    if (b >= a) b++;
    const na = next[a];
    const nb = next[b];
    if (nb === a || na === b) continue;
    const dEdge = edge(a, nb) + edge(b, na) - edge(a, na) - edge(b, nb);
    next[a] = nb;
    next[b] = na;
    const nst = structure(next, gender, k);
    const newCost = edgeSum + dEdge + nst.cost;
    const delta = newCost - cost;
    if (delta <= 0 || rnd() < Math.exp(-delta / T)) {
      cost = newCost;
      edgeSum += dEdge;
      st = nst;
      if (cost < bestCost) {
        bestCost = cost;
        best = next.slice();
        bestEdge = edgeSum;
      }
    } else {
      next[a] = na;
      next[b] = nb;
    }
  }
  const fin = structure(best, gender, k);
  const isPerm = new Set(best).size === m;
  let violation = 0;
  let same = 0;
  for (let i = 0; i < m; i++) {
    violation += gap(ys[i], ys[best[i]]);
    if (gender[i] === gender[best[i]]) same++;
  }
  void bestEdge;
  return { next: best, violation, same, cycles: fin.cycles, valid: isPerm && fin.cost < BAD_CYCLE };
}

// 8 хүртэлх хүнтэй бол бүх боломжит хувилбарыг шалгаж хамгийн сайныг нь (тэнцүү бол санамсаргүй) сонгоно.
function exactSmall(ps, k, rnd) {
  const n = ps.length;
  const gw = genderWeight(n);
  const p = [...Array(n).keys()];
  let bestCost = Infinity;
  let pick = null;
  let ties = 0;
  const seen = new Uint8Array(n);
  const consider = () => {
    seen.fill(0);
    let twos = 0;
    for (let i = 0; i < n; i++) {
      if (p[i] === i) return;
      if (seen[i]) continue;
      let len = 0;
      let j = i;
      while (!seen[j]) {
        seen[j] = 1;
        j = p[j];
        len++;
      }
      if (len === 2) {
        if (ps[i].gender === ps[p[i]].gender) return;
        twos++;
      }
    }
    if (twos !== k) return;
    let c = 0;
    for (let i = 0; i < n; i++) c += gap(ps[i].year, ps[p[i]].year) * VIOLATION + (ps[i].gender === ps[p[i]].gender ? gw : 0);
    if (c < bestCost) {
      bestCost = c;
      pick = p.slice();
      ties = 1;
    } else if (c === bestCost) {
      ties++;
      if (rnd() * ties < 1) pick = p.slice();
    }
  };
  const rec = (i) => {
    if (i === n) return consider();
    for (let j = i; j < n; j++) {
      [p[i], p[j]] = [p[j], p[i]];
      rec(i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
  };
  rec(0);
  if (!pick) return null;
  const assign = {};
  const golden = [];
  let violation = 0;
  for (let i = 0; i < n; i++) {
    assign[ps[i].uid] = ps[pick[i]].uid;
    violation += gap(ps[i].year, ps[pick[i]].year);
    if (pick[pick[i]] === i && i < pick[i]) golden.push([ps[i].uid, ps[pick[i]].uid]);
  }
  return { assign, golden, violation };
}

// people: [{uid, code, gender}] → { assign: {giverUid: targetUid}, golden: [[uid, uid]], violation }
export function makeMatching(people, rnd = Math.random) {
  if (people.length < 3) throw new Error('Монита эхлүүлэхэд дор хаяж 3 оролцогч хэрэгтэй.');
  const ps = people.map((p) => ({ uid: p.uid, gender: p.gender, year: yearOf(p.code) }));
  const k = plannedGoldenCount(ps);
  if (ps.length <= 8) {
    const ex = exactSmall(ps, k, rnd);
    if (ex) return ex;
  }
  let best = null;
  const trials = 12;
  const gw = genderWeight(ps.length);
  const sameFloor = minSameGender(ps);
  const scoreOf = (res) => res.violation * VIOLATION + res.same * gw + res.cycles;
  // 1-р шат: зөвхөн жилийн дүрмээр хамгийн сайн холболт.
  for (let t = 0; t < trials; t++) {
    const res = optimize(ps, k, rnd, t < 2 ? 0 : 1 + (t / trials) * 3);
    if (!res.valid) continue;
    const score = res.violation * VIOLATION + res.cycles;
    if (!best || score < best.score) best = { score, ...res };
    if (res.violation === 0 && t >= 1) break;
  }
  // 2-р шат: тэр холболтоос эхлээд хүйсийг холино. Нийт оноо зөвхөн буурдаг тул жилийн дүрэм муудахгүй.
  if (best) {
    best.score = scoreOf(best);
    for (let t = 0; t < 10 && best.same > sameFloor; t++) {
      const res = optimize(ps, k, rnd, 0, { gw, init: best.next, T0: t % 2 ? 900 : 300 });
      if (res.valid && scoreOf(res) < best.score) best = { ...res, score: scoreOf(res) };
    }
  }
  if (!best) throw new Error('Холболт үүсгэж чадсангүй. Дахин оролдоно уу.');
  const assign = {};
  const golden = [];
  ps.forEach((p, i) => {
    const j = best.next[i];
    assign[p.uid] = ps[j].uid;
    if (best.next[j] === i && i < j) golden.push([p.uid, ps[j].uid]);
  });
  return { assign, golden, violation: best.violation };
}

// Алтан эсэх: бие биенээ сонгосон хос.
export function isGolden(assign, uid) {
  const t = assign[uid];
  return !!t && assign[t] === uid;
}

export function giverOf(assign, uid) {
  for (const g in assign) if (assign[g] === uid) return g;
  return null;
}

// Монита явагдаж байх үед оролцогч хасагдах.
// years: {uid: year}. Буцаах: { assign, changes: [{uid, kind, from, to}] }
//  kind 'replaced'  — таны монита гарсан, оронд нь түүний монита танд сонгогдлоо
//  kind 'reinserted'— алтан хос нь гарсан хүн шинэ монитатай боллоо
//  kind 'changed'   — тойргийг засахын тулд монита өөрчлөгдлөө
export function planRemoval(assignIn, years, removed, rnd = Math.random, genders = {}) {
  const assign = { ...assignIn };
  const changes = [];
  const yr = (u) => years[u];
  // Жилийн зөрүү түрүүлж, дараа нь эсрэг хүйсийг илүүд үзнэ.
  const cost = (a, b) => gap(yr(a), yr(b)) * 100 + (genders[a] && genders[a] === genders[b] ? 1 : 0);

  const pickEdge = (exclude, score) => {
    let bestScore = Infinity;
    let cands = [];
    for (const A in assign) {
      const B = assign[A];
      if (exclude.has(A) || exclude.has(B)) continue;
      const golden = assign[B] === A;
      const s = score(A, B) * 10 + (golden ? 100000 : 0);
      if (s < bestScore) {
        bestScore = s;
        cands = [[A, B]];
      } else if (s === bestScore) cands.push([A, B]);
    }
    if (!cands.length) return null;
    return cands[Math.floor(rnd() * cands.length)];
  };

  if (!(removed in assign)) {
    // Хасагдсан хүнд монита байгаагүй ч түүнийг сонгосон хүн байвал тэр хүнийг тойрогт оруулна.
    const g = giverOf(assign, removed);
    if (g) {
      delete assign[g];
      const e = pickEdge(new Set([g]), (A, B) => cost(A, g) + cost(g, B));
      if (e) {
        const [A, B] = e;
        assign[A] = g;
        assign[g] = B;
        changes.push({ uid: g, kind: 'reinserted', from: removed, to: B });
        changes.push({ uid: A, kind: 'changed', from: B, to: g });
      } else changes.push({ uid: g, kind: 'alone', from: removed, to: null });
    }
    return { assign, changes };
  }
  const T = assign[removed];
  const G = giverOf(assign, removed);
  delete assign[removed];

  if (G === T) {
    // Алтан хос: үлдсэн Y хүнийг өөр тойрогт оруулна.
    const Y = G;
    delete assign[Y];
    const e = pickEdge(new Set([Y]), (A, B) => cost(A, Y) + cost(Y, B));
    if (e) {
      const [A, B] = e;
      assign[A] = Y;
      assign[Y] = B;
      changes.push({ uid: Y, kind: 'reinserted', from: removed, to: B });
      changes.push({ uid: A, kind: 'changed', from: B, to: Y });
    } else {
      changes.push({ uid: Y, kind: 'alone', from: removed, to: null });
    }
    return { assign, changes };
  }

  if (G) {
    assign[G] = T;
    changes.push({ uid: G, kind: 'replaced', from: removed, to: T });
    if (assign[T] === G) {
      // 3 хүний тойрог 2 болж бие биенээ сонгох болсон — өөр тойрогтой нийлүүлнэ.
      const e = pickEdge(new Set([G, T]), (A, B) => cost(T, B) + cost(A, G));
      if (e) {
        const [A, B] = e;
        assign[T] = B;
        assign[A] = G;
        changes.push({ uid: T, kind: 'changed', from: G, to: B });
        changes.push({ uid: A, kind: 'changed', from: B, to: G });
      }
    }
  }
  return { assign, changes };
}

// Холболт бүрэн зөв эсэх: хүн бүр нэг монитатай, хүн бүрийг яг нэг хүн сонгосон, өөрийгөө сонгоогүй.
// Бие биенээ сонгосон хос зөвхөн allowMutual дотор (алтан хос) байж болно.
export function validateCycle(assign, allowMutual = new Set()) {
  const givers = Object.keys(assign);
  const set = new Set(givers);
  const seen = new Set();
  for (const g of givers) {
    const t = assign[g];
    if (!t || !set.has(t)) return `${g}-ийн монита оролцогч биш`;
    if (t === g) return `${g} өөрийгөө сонгосон`;
    if (seen.has(t)) return `${t} давхар сонгогдсон`;
    seen.add(t);
    if (assign[t] === g && givers.length > 2 && !(allowMutual.has(g) && allowMutual.has(t))) return `${g}, ${t} бие биенээ сонгосон`;
  }
  return null;
}

// Админд урьдчилан харуулах тайлан: ±2 жилийн дүрмээс гадуур холболт, алтан монитагийн тоо.
export function matchReport(people, assign, goldenPairs) {
  const years = Object.fromEntries(people.map((p) => [p.uid, yearOf(p.code)]));
  const gender = Object.fromEntries(people.map((p) => [p.uid, p.gender]));
  let yearIssues = 0;
  let maxGap = 0;
  let sameGender = 0;
  for (const g in assign) {
    const d = Math.abs(years[g] - years[assign[g]]);
    if (d > YEAR_RANGE) yearIssues++;
    if (d > maxGap) maxGap = d;
    if (gender[g] === gender[assign[g]]) sameGender++;
  }
  const males = people.filter((p) => p.gender === 'male').length;
  return {
    yearIssues, maxGap, golden: goldenPairs.length, goldenWanted: goldenCountFor(people.length),
    sameGender, sameFloor: minSameGender(people), males, females: people.length - males,
  };
}

// Шалгалт (тест болон эхлүүлэхээс өмнө).
export function validateMatching(people, assign, goldenPairs) {
  const ids = new Set(people.map((p) => p.uid));
  const targets = new Set();
  for (const p of people) {
    const t = assign[p.uid];
    if (!t || !ids.has(t)) return `${p.uid} монитагүй`;
    if (t === p.uid) return `${p.uid} өөрийгөө сонгосон`;
    if (targets.has(t)) return `${t} давхар сонгогдсон`;
    targets.add(t);
  }
  const goldenSet = new Set(goldenPairs.flat());
  const byId = Object.fromEntries(people.map((p) => [p.uid, p]));
  if (Object.keys(assign).length !== people.length) return 'Холболтын тоо оролцогчдын тоотой таарахгүй';
  for (const [a, b] of goldenPairs) {
    if (assign[a] !== b || assign[b] !== a) return 'Алтан хос бие биенээ сонгоогүй';
  }
  for (const p of people) {
    if (isGolden(assign, p.uid)) {
      if (!goldenSet.has(p.uid)) return `${p.uid} алтан биш ч бие биенээ сонгосон`;
      if (byId[p.uid].gender === byId[assign[p.uid]].gender) return 'Алтан хос ижил хүйстэй';
    }
  }
  return null;
}
