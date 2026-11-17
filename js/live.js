import { QUIZ as Q } from "./data-quiz.js";
import { live, myId, watchScores, watchState, putPlayer, getMe, setState, teacherSignIn, resetScores } from "./fb.js";
import { startMusic, stopMusic, musicRunning } from "./music.js";
const T = 20, BASE = 1000;
const COL = ["#E21B3C", "#1368CE", "#D89E00", "#26890C"], SHP = ["▲", "◆", "●", "■"];
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
const mult = s => s >= 5 ? 2 : s >= 3 ? 1.5 : s >= 2 ? 1.2 : 1;
const RANKS = [[0, "HR Trainee"], [3000, "HR Officer"], [6500, "HR Manager"], [9500, "Chief People Officer"]];
const rank = sc => RANKS.filter(r => sc >= r[0]).pop()[1];
const CSS = `<style>.lv{max-width:640px;margin:0 auto;padding:18px}.lvo{display:flex;gap:12px;align-items:center;width:100%;border:0;border-radius:14px;padding:18px;margin:10px 0;color:#fff;font-size:18px;font-weight:700;text-align:left}.lvo i{font-style:normal;font-size:26px}.lvo.dim{opacity:.3}.lvo.ok{outline:4px solid #fff}
.hs{padding:20px 32px;max-width:1300px;margin:0 auto}.hq{font-family:'EB Garamond',serif;font-size:clamp(24px,3vw,40px);margin:6px 0}.hgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ho{border-radius:14px;padding:22px;color:#fff;font-size:clamp(18px,2.4vw,30px);font-weight:700;display:flex;gap:14px;align-items:center}.ho.dim{opacity:.25}.ho i{font-style:normal;font-size:1.3em}
.cnt{font-size:64px;font-weight:800;color:var(--gold)}.hbar{display:flex;align-items:flex-end;gap:10px;height:90px;margin:10px 0}.hbar div{flex:1;border-radius:8px 8px 0 0;color:#fff;text-align:center;font-weight:800;min-height:24px;padding-top:4px}
.ctl{position:sticky;bottom:0;background:#0a1f2a;padding:12px 32px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}.ctl .btn{margin:0;width:auto;padding:14px 26px}.pod{display:flex;gap:16px;align-items:flex-end;justify-content:center;margin:20px 0}.pod div{background:var(--card);border-radius:14px;padding:16px 22px;text-align:center;min-width:150px}</style>`;
export function mountPlay(view) {
  const root = document.createElement("div"); root.className = "lv"; view.appendChild(root);
  const un = []; let timer = null;
  const put = h => { root.innerHTML = CSS + h; };
  const wait = (t, sub) => put(`<p class="aeyebrow">HR Law Showdown</p><h2>${t}</h2><p class="asm">${sub || ""}</p>`);
  if (!live()) { wait("Live mode is not available", "This site is not connected to Firebase yet. Ask your lecturer."); return () => {}; }
  let name = "", sess = null, st = null, me = null, rows = [], answered = false, t0 = 0, qNow = -1, skipQ = -2, last = { ok: false, gain: 0 }, busy = Promise.resolve();
  try { name = localStorage.getItem("nick") || ""; } catch (e) {}
  put(`<p class="aeyebrow">MNU Business School · ACHRM</p><h1>Join the quiz</h1><div class="acard"><label class="asm">Your nickname</label><input id="nm" maxlength="18" autocomplete="off" value="${esc(name)}"></div><button class="btn" id="go">Join</button>`);
  root.querySelector("#go").onclick = () => { const v = root.querySelector("#nm").value.trim(); if (!v) return; name = v.slice(0, 18); try { localStorage.setItem("nick", name); } catch (e) {} wait("You're in, " + esc(name) + "!", "Waiting for the host to start…"); un.push(watchScores(200, r => { rows = r; if (st && (st.phase === "reveal" || st.phase === "final")) paint(); })); un.push(watchState(s => { busy = busy.then(() => onState(s)).catch(console.error); })); };
  const rec = a => ({ name, score: me.score, correct: me.correct, best: me.best, streak: me.streak, a, aq: qNow, session: sess, at: Date.now() });
  async function onState(s) {
    st = s;
    if (!s) { wait("Waiting for the host to open the game…"); return; }
    if (s.session !== sess) {
      sess = s.session; const d = await getMe();
      me = d && d.session === sess ? { score: d.score, correct: d.correct, best: d.best, streak: d.streak } : { score: 0, correct: 0, best: 0, streak: 0 };
      qNow = -1; skipQ = s.phase === "question" ? s.q : -2; answered = false;
      if (!(d && d.session === sess)) await putPlayer(rec(-2));
    }
    paint();
  }
  function paint() {
    const s = st; if (!s || !me) return; clearInterval(timer);
    if (s.phase === "lobby") { qNow = -1; wait("You're in, " + esc(name) + "!", "Waiting for the host to start…"); }
    else if (s.phase === "question") {
      if (s.q === skipQ) { wait("Get ready!", "You joined during a question. You'll play the next one."); return; }
      if (s.q !== qNow) { qNow = s.q; answered = false; t0 = Date.now(); last = { ok: false, gain: 0 }; }
      if (answered) { wait("Answer locked in ✔", "Waiting for the others…"); return; }
      const q = Q[s.q];
      put(`<div class="hud"><span class="apill">Q ${s.q + 1}/${Q.length}</span><span class="apill">🔥 ${me.streak}</span><span class="apill">${me.score} pts</span></div><div class="bar"><i id="tb"></i></div><h2>${esc(q.q)}</h2>${q.o.map((o, k) => `<button class="lvo" data-k="${k}" style="background:${COL[k]}"><i>${SHP[k]}</i>${esc(o)}</button>`).join("")}`);
      root.querySelectorAll(".lvo").forEach(b => b.onclick = () => lock(+b.dataset.k));
      timer = setInterval(() => { const f = 1 - (Date.now() - t0) / (T * 1000), tb = root.querySelector("#tb"); if (tb) tb.style.width = Math.max(0, f * 100) + "%"; if (f <= 0) { clearInterval(timer); lock(-1); } }, 120);
    } else if (s.phase === "reveal") {
      if (s.q === skipQ) { wait("Next question coming…"); return; }
      if (!answered && s.q === qNow) lock(-1, true);
      const i = rows.findIndex(r => r.id === myId());
      put(`<p class="aeyebrow">Question ${s.q + 1}</p><p class="big pop">${last.ok ? "Correct!" : "Not this time"}</p><h2>${last.ok ? "+" + last.gain + " points" : "0 points"}</h2><div class="acard"><div class="arow"><span>Total</span><b>${me.score}</b></div><div class="arow"><span>Streak</span><b>🔥 ${me.streak}</b></div><div class="arow"><span>Rank</span><b>${i >= 0 ? "#" + (i + 1) + " of " + rows.length : "…"}</b></div></div><div class="acard"><p class="asm">${esc(Q[s.q].e)}</p></div><p class="asm">Waiting for the host…</p>`);
    } else if (s.phase === "final") {
      const i = rows.findIndex(r => r.id === myId());
      put(`<p class="aeyebrow">Final result</p><p class="big pop">${me.score}</p><h2>${esc(name)}: ${rank(me.score)}</h2><div class="acard"><div class="arow"><span>Final rank</span><b>${i >= 0 ? "#" + (i + 1) + " of " + rows.length : "…"}</b></div><div class="arow"><span>Correct</span><b>${me.correct}/${Q.length}</b></div><div class="arow"><span>Best streak</span><b>${me.best}</b></div></div><p class="asm">Thank you for playing!</p>`);
    }
  }
  function lock(k, silent) {
    if (answered) return; answered = true; clearInterval(timer);
    const q = Q[qNow], sec = (Date.now() - t0) / 1000, ok = k === q.a;
    if (ok) { me.streak++; me.best = Math.max(me.best, me.streak); me.correct++; last = { ok: true, gain: Math.round(BASE * Math.max(0.5, 1 - sec / (T * 2)) * mult(me.streak)) }; me.score += last.gain; } else { me.streak = 0; last = { ok: false, gain: 0 }; }
    putPlayer(rec(k)).catch(console.error);
    if (!silent) wait(k < 0 ? "Time's up" : "Answer locked in ✔", "Waiting for the others…");
  }
  return () => { clearInterval(timer); un.forEach(f => { try { f(); } catch (e) {} }); };
}
export function mountHostLive(view) {
  const url = location.origin + location.pathname + "#/play";
  const root = document.createElement("div"); view.appendChild(root);
  let st = null, rows = [], signed = false, timer = null, msg = "", ending = false; const un = [];
  const ans = () => rows.filter(r => st && r.session === st.session && r.aq === st.q);
  const players = () => rows.filter(r => st && r.session === st.session);
  async function set(o) { try { await setState({ session: st ? st.session : String(Date.now()), t: T, ...o, at: Date.now() }); msg = ""; } catch (e) { msg = "Could not change the game: " + (e.code || e.message) + ". Sign in with the teacher account first."; draw(); } }
  async function signIn() { try { const em = await teacherSignIn(); signed = true; msg = "Signed in as " + em; } catch (e) { msg = "Sign-in failed: " + (e.code || e.message); } draw(); }
  async function newGame() { try { await resetScores(); } catch (e) { msg = "Could not reset scores: " + (e.code || e.message); } stopMusic(); await set({ session: String(Date.now()), phase: "lobby", q: -1 }); }
  function draw() {
    clearInterval(timer);
    const p = st ? st.phase : "none", q = st ? st.q : -1;
    let body = "";
    if (p === "none" || p === "lobby") {
      body = `<div class="hgrid"><div class="acard" style="text-align:center"><div id="qr" style="background:#fff;padding:16px;border-radius:12px"></div><p class="asm" style="word-break:break-all">${esc(url)}</p></div><div class="acard"><p class="aeyebrow">Players joined</p><p class="cnt">${players().length}</p><div class="asm">${players().slice(0, 40).map(r => esc(r.name)).join(" · ")}</div></div></div>`;
    } else if (p === "question") {
      const o = Q[q].o; body = `<p class="aeyebrow">Question ${q + 1} of ${Q.length}</p><div class="hq">${esc(Q[q].q)}</div><div class="hgrid">${o.map((t, k) => `<div class="ho" style="background:${COL[k]}"><i>${SHP[k]}</i>${esc(t)}</div>`).join("")}</div><p><span class="cnt" id="cd">${T}</span> <span class="asm">seconds · <b id="ac">${ans().length}</b> of ${players().length} answered</span></p>`;
    } else if (p === "reveal") {
      const o = Q[q].o, a = Q[q].a, cnt = o.map((_, k) => ans().filter(r => r.a === k).length), mx = Math.max(1, ...cnt);
      body = `<p class="aeyebrow">Question ${q + 1} · answer</p><div class="hq">${esc(Q[q].q)}</div><div class="hgrid">${o.map((t, k) => `<div class="ho ${k === a ? "" : "dim"}" style="background:${COL[k]}"><i>${SHP[k]}</i>${esc(t)}${k === a ? " ✔" : ""}</div>`).join("")}</div><div class="hbar">${cnt.map((c, k) => `<div style="background:${COL[k]};height:${Math.max(24, c / mx * 100)}px">${c}</div>`).join("")}</div><div class="acard"><p class="asm">${esc(Q[q].e)}</p></div><div class="acard"><p class="aeyebrow">Top 5</p>${rows.slice(0, 5).map((r, i) => `<div class="arow lbrow"><span>${i + 1}. ${esc(r.name || "?")}</span><b>${r.score}</b></div>`).join("")}</div>`;
    } else {
      const t3 = rows.slice(0, 3); body = `<h1>Final results</h1><div class="pod">${t3.map((r, i) => `<div style="${i === 0 ? "order:0;padding-bottom:40px" : ""}"><p class="cnt" style="font-size:40px">${["🥇", "🥈", "🥉"][i]}</p><b>${esc(r.name)}</b><br>${r.score}</div>`).join("")}</div><div class="acard">${rows.slice(0, 15).map((r, i) => `<div class="arow lbrow"><span>${i + 1}. ${esc(r.name || "?")}</span><b>${r.score}</b></div>`).join("")}</div>`;
    }
    let btns = "";
    if (!signed) btns += `<button class="btn sec" id="si">Sign in as teacher</button>`;
    if (p === "none") btns += `<button class="btn" id="ng">Open new game</button>`;
    else if (p === "lobby") btns += `<button class="btn" id="go" ${players().length ? "" : "disabled"}>Start quiz</button>`;
    else if (p === "question") btns += `<button class="btn" id="rv">Show answer</button>`;
    else if (p === "reveal") btns += `<button class="btn" id="nx">${q + 1 >= Q.length ? "Final results" : "Next question"}</button>`;
    else btns += `<button class="btn" id="ng">New game</button>`;
    btns += `<button class="btn sec" id="mm">${musicRunning() ? "⏸ Music off" : "🎵 Music on"}</button>`;
    root.innerHTML = CSS + `<div class="hs"><p class="aeyebrow">Host · HR Law Showdown</p>${body}<p class="asm">${esc(msg)}</p></div><div class="ctl">${btns}</div>`;
    const $ = s => root.querySelector(s);
    if ($("#qr")) { try { const c = qrcode(0, "M"); c.addData(url); c.make(); $("#qr").innerHTML = c.createSvgTag(8, 0); const sv = $("#qr svg"); sv.style.maxWidth = "100%"; sv.style.height = "auto"; } catch (e) { $("#qr").textContent = "QR library did not load."; } }
    if ($("#si")) $("#si").onclick = signIn; if ($("#ng")) $("#ng").onclick = newGame;
    if ($("#go")) $("#go").onclick = () => { startMusic(); set({ phase: "question", q: 0 }); };
    if ($("#rv")) $("#rv").onclick = () => set({ phase: "reveal", q });
    if ($("#nx")) $("#nx").onclick = () => { if (q + 1 >= Q.length) { stopMusic(); set({ phase: "final", q }); } else set({ phase: "question", q: q + 1 }); };
    $("#mm").onclick = () => { musicRunning() ? stopMusic() : startMusic(); draw(); };
    if (p === "question") timer = setInterval(() => { const left = Math.max(0, T - Math.floor((Date.now() - st.at) / 1000)); const cd = $("#cd"), ac = $("#ac"); if (cd) cd.textContent = left; if (ac) ac.textContent = ans().length; if (left <= 0 && signed) { clearInterval(timer); set({ phase: "reveal", q }); } }, 300);
  }
  if (!live()) { root.innerHTML = CSS + `<div class="hs"><h1>Live mode needs Firebase</h1><p>Add your Firebase settings to js/config.js first.</p></div>`; return () => {}; }
  un.push(watchState(s => { st = s; draw(); }));
  un.push(watchScores(200, r => { rows = r; if (st && st.phase !== "question") draw(); else { const ac = root.querySelector("#ac"); if (ac) ac.textContent = ans().length; } }));
  draw();
  return () => { clearInterval(timer); stopMusic(); un.forEach(f => { try { f(); } catch (e) {} }); };
}
