// Firebase холболт ба өгөгдлийн бүх үйлдэл.
import {
  initializeApp, getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, query, where, onSnapshot, getDoc, getDocs, getDocFromCache, setDoc,
  deleteDoc, writeBatch, serverTimestamp, terminate, clearIndexedDbPersistence,
} from '../vendor/firebase.js?v=13';
import { firebaseConfig } from './config.js?v=13';


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const est = { serverTimestamps: 'estimate' };
const CONFIG = () => doc(db, 'config', 'main');

// ---------- Нэвтрэлт ----------
export const onUser = (cb) => onAuthStateChanged(auth, cb);

export const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

export function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // Суулгасан апп дотор нэмэлт цонх найдваргүй тул шилжүүлэх аргаар нэвтэрнэ.
  if (isStandalone()) return signInWithRedirect(auth, provider);
  return signInWithPopup(auth, provider);
}

export const redirectResult = () => getRedirectResult(auth);

export async function logOut() {
  await signOut(auth);
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (_) {
    /* өөр таб нээлттэй бол кэш үлдэнэ */
  }
  location.reload();
}

// ---------- Сонсогчид ----------
// Серверээс шууд шалгана: { exists, data } эсвэл холболтгүй бол алдаа.
export async function serverProfile(uid) {
  const s = await getDoc(doc(db, 'users', uid));
  if (s.metadata.fromCache) throw Object.assign(new Error('offline'), { code: 'unavailable' });
  return s.exists() ? s.data(est) : null;
}

// Нэг баримт сонсох. Кэшэд "байхгүй" гэж хадгалагдсан бол серверийн баталгааг хүлээнэ
// (серверийн "байхгүй" баталгаа зөвхөн includeMetadataChanges үед ирдэг). Ижил өгөгдлийг давтан дамжуулахгүй.
function watchDoc(ref, cb, err, { map = (s) => s.data(est), onCacheMiss } = {}) {
  let last;
  return onSnapshot(ref, { includeMetadataChanges: true }, (s) => {
    if (!s.exists() && s.metadata.fromCache) {
      if (onCacheMiss) onCacheMiss();
      return;
    }
    const v = s.exists() ? map(s) : null;
    const sig = JSON.stringify(v);
    if (sig === last) return;
    last = sig;
    cb(v);
  }, err);
}

export const watch = {
  config: (cb, err) => watchDoc(CONFIG(), cb, err),
  profile: (uid, cb, err, onCacheMiss) => watchDoc(doc(db, 'users', uid), cb, err, { onCacheMiss }),
  // Серверт баталгаажсаны дараа л админ гэж үзнэ (эс тэгвээс жагсаалтууд эрхгүй гэж унана).
  isAdmin: (uid, cb, err) =>
    onSnapshot(doc(db, 'admins', uid), { includeMetadataChanges: true }, (s) => {
      if (s.metadata.hasPendingWrites) return;
      cb(s.exists());
    }, err),
  assignment: (uid, cb, err) => watchDoc(doc(db, 'assignments', uid), cb, err, { map: (s) => s.data() }),
  user: (uid, cb, err) => watchDoc(doc(db, 'users', uid), cb, err),
  givers: (uid, cb, err) =>
    onSnapshot(query(collection(db, 'assignments'), where('target', '==', uid)), (qs) => cb(qs.docs.map((d) => d.id)), err),
  notifications: (uid, cb, err) => {
    let mine = [];
    let all = [];
    const emit = () => cb([...mine, ...all]);
    const map = (qs) => qs.docs.map((d) => ({ id: d.id, ...d.data(est) }));
    const u1 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', uid)), (qs) => {
      mine = map(qs);
      emit();
    }, err);
    const u2 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', 'all')), (qs) => {
      all = map(qs);
      emit();
    }, err);
    return () => {
      u1();
      u2();
    };
  },
  announcements: (cb, err) =>
    onSnapshot(collection(db, 'announcements'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
  letters: (t, cb, err) =>
    onSnapshot(query(collection(db, 'letters'), where('t', '==', t)), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
  photo: (uid, cb, err) => watchDoc(doc(db, 'photos', uid), cb, err, { map: (s) => s.data().data }),
  // админ
  allUsers: (cb, err) => onSnapshot(collection(db, 'users'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
  allAssignments: (cb, err) =>
    onSnapshot(collection(db, 'assignments'), (qs) => {
      const m = {};
      qs.docs.forEach((d) => (m[d.id] = d.data().target));
      cb(m);
    }, err),
  allThumbs: (cb, err) =>
    onSnapshot(collection(db, 'thumbs'), (qs) => {
      const m = {};
      qs.docs.forEach((d) => (m[d.id] = d.data().data));
      cb(m);
    }, err),
  allNotifications: (cb, err) =>
    onSnapshot(collection(db, 'notifications'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
  // Код өөрөө харагдахгүй: зөвхөн имэйл, огноо.
  allAdmins: (cb, err) =>
    onSnapshot(collection(db, 'admins'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, email: d.data().email, createdAt: d.data(est).createdAt }))), err),
};

export const removeAdmin = (uid) => deleteDoc(doc(db, 'admins', uid));

// ---------- Оролцогч ----------
export async function codeOwner(code) {
  const s = await getDoc(doc(db, 'studentCodes', code));
  return s.exists() ? s.data().uid : null;
}

export async function saveProfile(user, data, existing) {
  const uid = user.uid;
  const b = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const fields = {
    studentCode: data.studentCode,
    gender: data.gender,
    lastName: data.lastName,
    firstName: data.firstName,
    phone: data.phone,
    wishes: data.wishes,
    uid,
    email: user.email,
    updatedAt: serverTimestamp(),
  };
  if (!existing) {
    b.set(doc(db, 'studentCodes', data.studentCode), { uid });
    b.set(userRef, { ...fields, createdAt: serverTimestamp() });
  } else {
    if (existing.studentCode !== data.studentCode) {
      b.set(doc(db, 'studentCodes', data.studentCode), { uid });
      b.delete(doc(db, 'studentCodes', existing.studentCode));
    }
    b.update(userRef, fields);
  }
  await b.commit();
}

export function newKey() {
  const a = new Uint8Array(9);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
}

// Нэргүй захидал. t = бэлэг авагч (thread), dir: 'down' = түүнийг сонгосон хүнээс, 'up' = өөрөөс нь.
export function sendLetter({ t, dir, k, text }) {
  return setDoc(doc(collection(db, 'letters')), { t, dir, k: k || '', text, createdAt: serverTimestamp() });
}

export async function savePhoto(uid, data, thumb) {
  await setDoc(doc(db, 'photos', uid), { data, updatedAt: serverTimestamp() });
  if (thumb) await saveThumb(uid, thumb);
}
export const saveThumb = (uid, data) => setDoc(doc(db, 'thumbs', uid), { data, updatedAt: serverTimestamp() });
export async function deletePhoto(uid) {
  await deleteDoc(doc(db, 'photos', uid));
  await deleteDoc(doc(db, 'thumbs', uid)).catch(() => {});
}
export async function getPhoto(uid) {
  const s = await getDoc(doc(db, 'photos', uid));
  return s.exists() ? s.data().data : null;
}

export function claimAdmin(user, code) {
  return setDoc(doc(db, 'admins', user.uid), { code, email: user.email, createdAt: serverTimestamp() });
}

// Зарын зураг: эхлээд төхөөрөмжийн кэшээс, байхгүй бол серверээс.
export async function loadFile(id) {
  const ref = doc(db, 'announcementFiles', id);
  try {
    const c = await getDocFromCache(ref);
    if (c.exists()) return c.data().data;
  } catch (_) {
    /* кэшэд алга */
  }
  const s = await getDoc(ref);
  return s.exists() ? s.data().data : null;
}

// ---------- Админ ----------
async function inChunks(tasks, size = 20) {
  for (let i = 0; i < tasks.length; i += size) {
    await Promise.all(tasks.slice(i, i + size).map((t) => t()));
  }
}

export async function ensureConfig() {
  const s = await getDoc(CONFIG());
  if (!s.exists()) {
    await setDoc(CONFIG(), { state: 'registration', finalDay: false, days: [], currentDay: 0, goldenCount: 0 });
  }
}

export const updateConfig = (patch) => setDoc(CONFIG(), patch, { merge: true });

// Эхлүүлэхийн өмнө бүртгэлийг түр хааж (rules: state != 'registration'), серверээс шинэ жагсаалт авна.
// Ингэснээр яг эхлүүлэх агшинд бүртгүүлсэн хүн холболтоос хоцрохгүй.
export const lockRegistration = () => updateConfig({ state: 'starting' });
export const reopenRegistration = () => updateConfig({ state: 'registration' });
export async function freshUsers() {
  const qs = await getDocs(collection(db, 'users'));
  if (qs.metadata && qs.metadata.fromCache) throw Object.assign(new Error('offline'), { code: 'unavailable' });
  return qs.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function startMonita(assign, goldenCount) {
  const existing = await getDocs(collection(db, 'assignments'));
  await inChunks(existing.docs.filter((d) => !(d.id in assign)).map((d) => () => deleteDoc(d.ref)));
  const oldLetters = await getDocs(collection(db, 'letters'));
  await inChunks(oldLetters.docs.map((d) => () => deleteDoc(d.ref)));
  await inChunks(Object.entries(assign).map(([g, t]) => () => setDoc(doc(db, 'assignments', g), { target: t, k: newKey() })));
  await updateConfig({ state: 'active', finalDay: false, goldenCount, currentDay: 0, startedAt: serverTimestamp() });
}

export async function cancelMonita() {
  await updateConfig({ state: 'registration', finalDay: false });
  const existing = await getDocs(collection(db, 'assignments'));
  await inChunks(existing.docs.map((d) => () => deleteDoc(d.ref)));
  const letters = await getDocs(collection(db, 'letters'));
  await inChunks(letters.docs.map((d) => () => deleteDoc(d.ref)));
}

export const NOTICE = {
  replaced: 'Уучлаарай, таны монита монитагаас гарсан байна. Харин оронд нь түүний монита таны дээр сонгогдож байна.',
  reinserted: 'Уучлаарай, таны монита монитагаас гарсан байна. Оронд нь танд шинэ монита сонгогдлоо.',
  changed: 'Таны монита өөрчлөгдлөө. Шинэ монитагийн мэдээллийг нүүр хуудаснаас харна уу.',
};

export function sendNotification(to, text) {
  return setDoc(doc(collection(db, 'notifications')), { to, text, createdAt: serverTimestamp() });
}
export const deleteNotification = (id) => deleteDoc(doc(db, 'notifications', id));

// Оролцогч устгах. plan (matching.planRemoval) байвал холболтын өөрчлөлт, мэдэгдэл, устгалт бүгд
// нэг batch-аар хамт хадгалагдана: интернэт тасарвал аль нь ч хагас хийгдэхгүй.
export async function removeParticipant(user, { assign = {}, plan = null } = {}) {
  const uid = user.id;
  const b = writeBatch(db);
  if (plan) {
    for (const g of Object.keys(plan.assign)) {
      if (plan.assign[g] !== assign[g]) b.set(doc(db, 'assignments', g), { target: plan.assign[g], k: newKey() });
    }
    for (const g of Object.keys(assign)) {
      if (!(g in plan.assign) && g !== uid) b.delete(doc(db, 'assignments', g));
    }
    for (const c of plan.changes) {
      if (NOTICE[c.kind]) b.set(doc(collection(db, 'notifications')), { to: c.uid, text: NOTICE[c.kind], createdAt: serverTimestamp() });
    }
  }
  b.delete(doc(db, 'assignments', uid));
  b.delete(doc(db, 'users', uid));
  b.delete(doc(db, 'photos', uid));
  b.delete(doc(db, 'thumbs', uid));
  if (user.studentCode) b.delete(doc(db, 'studentCodes', user.studentCode));
  await b.commit();
  // Түүнд ирсэн захидлууд (өөр хэнд ч харагдахгүй тул дараа нь цэвэрлэнэ).
  const mine = await getDocs(query(collection(db, 'letters'), where('t', '==', uid))).catch(() => null);
  if (mine) await inChunks(mine.docs.map((d) => () => deleteDoc(d.ref).catch(() => {})));
}

// Зураг/PDF хуудсуудыг хадгална (зар болон өдрийн сэдэвт).
export async function saveFiles(pages) {
  const files = [];
  for (const p of pages) {
    const ref = doc(collection(db, 'announcementFiles'));
    await setDoc(ref, { data: p.data, w: p.w, h: p.h });
    files.push(ref.id);
  }
  return { files, ratios: pages.map((p) => +(p.h / p.w).toFixed(4)) };
}

export async function deleteFiles(ids) {
  await inChunks((ids || []).map((id) => () => deleteDoc(doc(db, 'announcementFiles', id))));
}

export async function addAnnouncement(pages) {
  const { files, ratios } = await saveFiles(pages);
  await setDoc(doc(collection(db, 'announcements')), { files, ratios, createdAt: serverTimestamp() });
}

export async function deleteAnnouncement(a) {
  await deleteDoc(doc(db, 'announcements', a.id));
  await inChunks((a.files || []).map((id) => () => deleteDoc(doc(db, 'announcementFiles', id))));
}
