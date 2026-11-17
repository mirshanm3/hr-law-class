import { live, watchScores, myId, teacherSignIn, resetScores } from "./fb.js";
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
export function rowsHtml(rows, me) {
  return rows.length ? rows.map((r, i) => `<div class="row lbrow"><span>${i + 1}. ${esc(r.name || "?")}${r.id === me ? " (you)" : ""}</span><b>${Number(r.score) || 0}</b></div>`).join("") : '<p class="sm">No scores yet.</p>';
}
export function mountBoard(view) {
  view.innerHTML = `<div class="wrap"><p class="eyebrow">Class</p><h1>Leaderboard</h1><div class="card" id="lb">${live() ? "Loading…" : "The live leaderboard is not switched on for this site yet."}</div></div>`;
  return watchScores(15, rows => { document.getElementById("lb").innerHTML = rowsHtml(rows, myId()); });
}
export function mountHost(view) {
  const url = location.origin + location.pathname;
  view.innerHTML = `<div class="wrap wide"><p class="eyebrow">Host view</p><h1>Scan to join</h1>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;align-items:start">
  <div class="card" style="text-align:center"><div id="qr" style="background:#fff;padding:16px;border-radius:12px"></div><p class="sm" style="word-break:break-all">${esc(url)}</p></div>
  <div class="card"><h2>Live leaderboard</h2><div id="lb">${live() ? "Waiting for scores…" : "Leaderboard is off: add your Firebase config."}</div></div></div>
  <div class="card"><p class="sm">Teacher tools (needs your Google account named in the Firestore rules)</p>
  <button class="btn sec" id="rs">Sign in and reset leaderboard</button><p class="sm" id="msg"></p></div></div>`;
  try { const q = qrcode(0, "M"); q.addData(url); q.make(); const b = document.getElementById("qr"); b.innerHTML = q.createSvgTag(8, 0); const sv = b.querySelector("svg"); sv.style.maxWidth = "100%"; sv.style.height = "auto"; } catch (e) { document.getElementById("qr").textContent = "QR library did not load."; }
  document.getElementById("rs").onclick = async () => {
    const m = document.getElementById("msg");
    if (!live()) { m.textContent = "Firebase is not connected."; return; }
    try { const em = await teacherSignIn(); m.textContent = "Signed in as " + em + ". Deleting…"; const n = await resetScores(); m.textContent = `Deleted ${n} scores.`; }
    catch (e) { m.textContent = "Could not reset: " + (e.code || e.message) + ". Check the teacher email in the rules."; }
  };
  return watchScores(15, rows => { document.getElementById("lb").innerHTML = rowsHtml(rows, null); });
}
