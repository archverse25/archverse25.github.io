// Монита холбох алгоритм.
// Дүрэм:
//  - Оюутны код B + 2 оронтой элссэн он + 4 оронтой анги + 3 оронтой дугаар (B252800012).
//  - Хүн бүр ±1 жилийн зөрүүтэй хүнтэй таарна (25 → 24, 25, 26).
//  - Алтан монита: хүйс өөр, ±1 жилийн дүрэмд багтах 2 хүн бие биенээ сонгоно.
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

function gap(a, b) {
  const d = Math.abs(a - b);
  return d <= 1 ? 0 : d - 1;
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

function pickGolden(people, k, rnd) {
  if (k === 0) return [];
  const males = shuffle(people.filter((p) => p.gender === 'male'), rnd);
  const females = shuffle(people.filter((p) => p.gender === 'female'), rnd);
  const pairs = [];
  for (const m of males) for (const f of females) pairs.push({ m, f, g: gap(m.year, f.year), r: rnd() });
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

function cyclesOf(next) {
  const m = next.length;
  const seen = new Uint8Array(m);
  const lens = [];
  for (let i = 0; i < m; i++) {
    if (seen[i]) continue;
    let len = 0;
    let j = i;
    while (!seen[j]) {
      seen[j] = 1;
      j = next[j];
      len++;
    }
    lens.push(len);
  }
  return lens;
}

function structureCost(lens) {
  let c = 0;
  for (const l of lens) c += l < 3 ? BAD_CYCLE : 1;
  return c;
}

// Үлдсэн хүмүүсийг дор хаяж 3 хүнтэй тойрогт хуваана.
function cycleCover(nodes, rnd) {
  const m = nodes.length;
  if (m === 0) return { next: [], violation: 0, cycles: 0 };
  const ys = nodes.map((p) => p.year);

  // Эхлэл: оноор эрэмбэлээд зигзаг тойрог (санамсаргүй дараалал нэг онд).
  const order = nodes.map((_, i) => i);
  const r = order.map(() => rnd());
  order.sort((a, b) => ys[a] - ys[b] || r[a] - r[b]);
  const ring = [];
  for (let i = 0; i < m; i += 2) ring.push(order[i]);
  for (let i = m % 2 === 0 ? m - 1 : m - 2; i >= 1; i -= 2) ring.push(order[i]);
  const next = new Array(m);
  for (let i = 0; i < m; i++) next[ring[i]] = ring[(i + 1) % m];

  const edge = (a, b) => gap(ys[a], ys[b]) * VIOLATION;
  let edgeSum = 0;
  for (let i = 0; i < m; i++) edgeSum += edge(i, next[i]);
  let lens = cyclesOf(next);
  let cost = edgeSum + structureCost(lens);

  let best = next.slice();
  let bestCost = cost;
  let bestEdge = edgeSum;

  if (m >= 4) {
    const iters = Math.min(80000, 4000 + 300 * m);
    let T = 1500;
    const cooling = Math.pow(0.2 / T, 1 / iters);
    for (let it = 0; it < iters; it++, T *= cooling) {
      const a = Math.floor(rnd() * m);
      let b = Math.floor(rnd() * (m - 1));
      if (b >= a) b++;
      const na = next[a];
      const nb = next[b];
      // Солилт өөрөө рүүгээ заасан хүн үүсгэх бол алгасна.
      if (nb === a || na === b) continue;
      const dEdge = edge(a, nb) + edge(b, na) - edge(a, na) - edge(b, nb);
      next[a] = nb;
      next[b] = na;
      const newLens = cyclesOf(next);
      const newCost = edgeSum + dEdge + structureCost(newLens);
      const delta = newCost - cost;
      if (delta <= 0 || rnd() < Math.exp(-delta / T)) {
        cost = newCost;
        edgeSum += dEdge;
        lens = newLens;
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
  }
  const bestLens = cyclesOf(best);
  return { next: best, violation: bestEdge / VIOLATION, cycles: bestLens.length, minCycle: Math.min(...bestLens) };
}

// people: [{uid, code, gender}] → { assign: {giverUid: targetUid}, golden: [[uid, uid]], violation }
export function makeMatching(people, rnd = Math.random) {
  if (people.length < 3) throw new Error('Монита эхлүүлэхэд дор хаяж 3 оролцогч хэрэгтэй.');
  const ps = people.map((p) => ({ uid: p.uid, gender: p.gender, year: yearOf(p.code) }));
  const k = plannedGoldenCount(ps);
  let best = null;
  const trials = 40;
  for (let t = 0; t < trials; t++) {
    const golden = pickGolden(ps, k, rnd);
    const inGolden = new Set(golden.flat().map((p) => p.uid));
    const rest = ps.filter((p) => !inGolden.has(p.uid));
    const cover = cycleCover(rest, rnd);
    const goldenGap = golden.reduce((s, [a, b]) => s + gap(a.year, b.year), 0);
    const violation = goldenGap + cover.violation;
    const score = violation * VIOLATION + cover.cycles;
    if (!best || score < best.score) best = { score, golden, rest, cover, violation };
    if (violation === 0 && t >= 2) break;
  }
  const assign = {};
  for (const [a, b] of best.golden) {
    assign[a.uid] = b.uid;
    assign[b.uid] = a.uid;
  }
  best.rest.forEach((p, i) => {
    assign[p.uid] = best.rest[best.cover.next[i]].uid;
  });
  return {
    assign,
    golden: best.golden.map(([a, b]) => [a.uid, b.uid]),
    violation: best.violation,
  };
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
export function planRemoval(assignIn, years, removed, rnd = Math.random) {
  const assign = { ...assignIn };
  const changes = [];
  if (!(removed in assign)) {
    const g = giverOf(assign, removed);
    if (g) delete assign[g];
    return { assign, changes };
  }
  const T = assign[removed];
  const G = giverOf(assign, removed);
  delete assign[removed];
  const yr = (u) => years[u];
  const cost = (a, b) => gap(yr(a), yr(b));

  const pickEdge = (exclude, score) => {
    let bestScore = Infinity;
    let cands = [];
    for (const A in assign) {
      const B = assign[A];
      if (exclude.has(A) || exclude.has(B)) continue;
      const golden = assign[B] === A;
      const s = score(A, B) * 10 + (golden ? 1000 : 0);
      if (s < bestScore) {
        bestScore = s;
        cands = [[A, B]];
      } else if (s === bestScore) cands.push([A, B]);
    }
    if (!cands.length) return null;
    return cands[Math.floor(rnd() * cands.length)];
  };

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
  for (const p of people) {
    if (isGolden(assign, p.uid)) {
      if (!goldenSet.has(p.uid)) return `${p.uid} алтан биш ч бие биенээ сонгосон`;
      if (byId[p.uid].gender === byId[assign[p.uid]].gender) return 'Алтан хос ижил хүйстэй';
    }
  }
  return null;
}
