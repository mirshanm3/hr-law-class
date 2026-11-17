import { CONFIG } from "./config.js";
const V = "10.12.2", B = `https://www.gstatic.com/firebasejs/${V}/`;
let X = null;
export const live = () => !!X;
export async function initFB() {
  if (!CONFIG || !CONFIG.apiKey || CONFIG.apiKey.startsWith("PASTE")) return false;
  try {
    const [A, Au, F] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
    const app = A.initializeApp(CONFIG), auth = Au.getAuth(app), db = F.getFirestore(app);
    await Au.signInAnonymously(auth);
    X = { Au, F, auth, db };
    return true;
  } catch (e) { console.error("Firebase init failed", e); X = null; return false; }
}
export async function saveScore(rec) {
  if (!X) return false;
  const { F, db, auth } = X, ref = F.doc(db, "scores", auth.currentUser.uid);
  const cur = await F.getDoc(ref);
  if (cur.exists() && (cur.data().score || 0) >= rec.score) return true;
  await F.setDoc(ref, rec);
  return true;
}
export function myId() { return X && X.auth.currentUser ? X.auth.currentUser.uid : null; }
export function watchScores(n, cb) {
  if (!X) return () => {};
  const { F, db } = X;
  return F.onSnapshot(F.query(F.collection(db, "scores"), F.orderBy("score", "desc"), F.limit(n)),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.error(e));
}
export async function teacherSignIn() {
  const { Au, auth } = X;
  const r = await Au.signInWithPopup(auth, new Au.GoogleAuthProvider());
  return r.user.email;
}
export async function resetScores() {
  const { F, db } = X, snap = await F.getDocs(F.collection(db, "scores"));
  await Promise.all(snap.docs.map(d => F.deleteDoc(d.ref)));
  return snap.size;
}
