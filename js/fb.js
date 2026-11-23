// Firebase холболт ба өгөгдлийн бүх үйлдэл.
import {
  initializeApp, getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, query, where, onSnapshot, getDoc, getDocs, getDocFromCache, setDoc,
  deleteDoc, writeBatch, serverTimestamp, terminate, clearIndexedDbPersistence,
} from '../vendor/firebase.js?v=3';
import { firebaseConfig } from './config.js?v=3';
import { planRemoval, yearOf } from './matching.js?v=3';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const est = { serverTimestamps: 'estimate' };
const CONFIG = () => doc(db, 'config', 'main');

// ---------- Нэвтрэлт ----------
export const onUser = (cb) => onAuthStateChanged(auth, cb);

export function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

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
export const watch = {
  config: (cb, err) => onSnapshot(CONFIG(), (s) => cb(s.exists() ? s.data(est) : null), err),
  profile: (uid, cb, err) =>
    onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data(est) : null, s.metadata.fromCache), err),
  isAdmin: (uid, cb, err) => onSnapshot(doc(db, 'admins', uid), (s) => cb(s.exists()), err),
  assignment: (uid, cb, err) => onSnapshot(doc(db, 'assignments', uid), (s) => cb(s.exists() ? s.data() : null), err),
  user: (uid, cb, err) => onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data(est) : null), err),
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
  photo: (uid, cb, err) => onSnapshot(doc(db, 'photos', uid), (s) => cb(s.exists() ? s.data().data : null), err),
  // админ
  allUsers: (cb, err) => onSnapshot(collection(db, 'users'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
  allAssignments: (cb, err) =>
    onSnapshot(collection(db, 'assignments'), (qs) => {
      const m = {};
      qs.docs.forEach((d) => (m[d.id] = d.data().target));
      cb(m);
    }, err),
  allNotifications: (cb, err) =>
    onSnapshot(collection(db, 'notifications'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data(est) }))), err),
};

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

export const savePhoto = (uid, data) => setDoc(doc(db, 'photos', uid), { data, updatedAt: serverTimestamp() });
export const deletePhoto = (uid) => deleteDoc(doc(db, 'photos', uid));
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

export async function startMonita(assign, goldenCount) {
  const existing = await getDocs(collection(db, 'assignments'));
  await inChunks(existing.docs.filter((d) => !(d.id in assign)).map((d) => () => deleteDoc(d.ref)));
  await inChunks(Object.entries(assign).map(([g, t]) => () => setDoc(doc(db, 'assignments', g), { target: t })));
  await updateConfig({ state: 'active', finalDay: false, goldenCount, currentDay: 0, startedAt: serverTimestamp() });
}

export async function cancelMonita() {
  await updateConfig({ state: 'registration', finalDay: false });
  const existing = await getDocs(collection(db, 'assignments'));
  await inChunks(existing.docs.map((d) => () => deleteDoc(d.ref)));
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

// Оролцогч устгах. Монита явагдаж байвал холбоосыг нөхнө.
export async function removeParticipant(user, { active, assign, users }) {
  const uid = user.id;
  if (active && (uid in assign || Object.values(assign).includes(uid))) {
    const years = {};
    users.forEach((u) => (years[u.id] = yearOf(u.studentCode)));
    const plan = planRemoval(assign, years, uid);
    const writes = [];
    for (const g of Object.keys(plan.assign)) {
      if (plan.assign[g] !== assign[g]) writes.push(() => setDoc(doc(db, 'assignments', g), { target: plan.assign[g] }));
    }
    for (const g of Object.keys(assign)) {
      if (!(g in plan.assign) && g !== uid) writes.push(() => deleteDoc(doc(db, 'assignments', g)));
    }
    await inChunks(writes);
    await deleteDoc(doc(db, 'assignments', uid));
    await inChunks(plan.changes.filter((c) => NOTICE[c.kind]).map((c) => () => sendNotification(c.uid, NOTICE[c.kind])));
  } else {
    await deleteDoc(doc(db, 'assignments', uid)).catch(() => {});
  }
  const b = writeBatch(db);
  b.delete(doc(db, 'users', uid));
  b.delete(doc(db, 'photos', uid));
  if (user.studentCode) b.delete(doc(db, 'studentCodes', user.studentCode));
  await b.commit();
}

export async function addAnnouncement(pages) {
  const files = [];
  for (const p of pages) {
    const ref = doc(collection(db, 'announcementFiles'));
    await setDoc(ref, { data: p.data, w: p.w, h: p.h });
    files.push(ref.id);
  }
  await setDoc(doc(collection(db, 'announcements')), {
    files,
    ratios: pages.map((p) => +(p.h / p.w).toFixed(4)),
    createdAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(a) {
  await deleteDoc(doc(db, 'announcements', a.id));
  await inChunks((a.files || []).map((id) => () => deleteDoc(doc(db, 'announcementFiles', id))));
}
