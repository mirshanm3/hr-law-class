import { QUIZ as Q } from "./data-quiz.js";
import { live, saveScore, watchScores, myId } from "./fb.js";
import { rowsHtml } from "./board.js";
const T = 20, BASE = 1000;
const RANKS = [[0, "HR Trainee"], [3000, "HR Officer"], [6500, "HR Manager"], [9500, "Chief People Officer"]];
const BADGES = { streak: ["🔥 Streak Master", "5 correct in a row"], speed: ["⚡ Speed Demon", "3 correct answers under 5 seconds"], perfect: ["🏆 Perfect Score", "All answers correct"], sharp: ["🎯 Sharp Mind", "80% or more correct"] };
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
const rank = sc => RANKS.filter(r => sc >= r[0]).pop()[1];
const mult = s => s >= 5 ? 2 : s >= 3 ? 1.5 : s >= 2 ? 1.2 : 1;
export function mountQuiz(view) {
  let S, timer = null, unsub = null;
  const root = document.createElement("div"); root.className = "wrap"; view.appendChild(root);
  const q$ = s => root.querySelector(s);
  const saved = () => { try { return localStorage.getItem("nick") || ""; } catch (e) { return ""; } };
  function home() {
    root.innerHTML = `<p class="aeyebrow">MNU Business School · ACHRM</p><h1>HR Law Showdown</h1>
    <p>${Q.length} questions. Faster answers earn more points. Build a streak for a multiplier.</p>
    <div class="acard"><label class="asm">Nickname (shown on the leaderboard)</label><input id="nm" maxlength="18" placeholder="e.g. Aishath" autocomplete="off" value="${esc(saved())}"></div>
    <button class="btn" id="go">Start</button>
    <p class="asm">${T} seconds per question. 1000 points base, up to double for speed. Streak: x1.2 at 2, x1.5 at 3, x2 at 5 in a row. One 50/50 lifeline.${live() ? "" : " Offline mode: scores stay on your device."}</p>`;
    q$("#go").onclick = () => { const v = q$("#nm").value.trim(); if (!v) { q$("#nm").focus(); return; } try { localStorage.setItem("nick", v); } catch (e) {} S = { name: v, i: 0, score: 0, streak: 0, best: 0, correct: 0, fast: 0, used: false, order: [], t0: 0, locked: false, missed: [] }; ask(); };
  }
  function ask() {
    if (S.i >= Q.length) return end();
    const q = Q[S.i]; S.locked = false;
    root.innerHTML = `<div class="hud"><span class="apill">Q ${S.i + 1}/${Q.length}</span><span class="apill">🔥 ${S.streak}${S.streak >= 2 ? " · x" + mult(S.streak) : ""}</span><span class="apill">${S.score} pts</span></div>
    <div class="bar"><i id="tb"></i></div><h2>${esc(q.q)}</h2><div id="opts"></div><div id="fb"></div>
    <button class="apill" id="l50" ${S.used || q.o.length < 4 ? "disabled" : ""} style="margin-top:8px">${S.used ? "50/50 used" : "Use 50/50"}</button>`;
    const box = q$("#opts");
    q.o.map((_, k) => k).sort(() => Math.random() - .5).forEach(k => { const b = document.createElement("button"); b.className = "aopt"; b.textContent = q.o[k]; b.dataset.k = k; b.onclick = () => pick(k); box.appendChild(b); });
    q$("#l50").onclick = () => { if (S.used || S.locked) return; S.used = true; q$("#l50").disabled = true; q$("#l50").textContent = "50/50 used"; [...box.children].filter(b => +b.dataset.k !== q.a).sort(() => Math.random() - .5).slice(0, 2).forEach(b => { b.classList.add("off"); b.disabled = true; }); };
    S.t0 = Date.now(); clearInterval(timer);
    timer = setInterval(() => { const f = 1 - (Date.now() - S.t0) / (T * 1000); q$("#tb").style.width = Math.max(0, f * 100) + "%"; if (f <= 0) { clearInterval(timer); pick(-1); } }, 100);
  }
  function pick(k) {
    if (S.locked) return; S.locked = true; clearInterval(timer);
    const q = Q[S.i], sec = (Date.now() - S.t0) / 1000, ok = k === q.a; let gain = 0;
    [...q$("#opts").children].forEach(b => { b.disabled = true; if (+b.dataset.k === q.a) b.classList.add("ok"); else if (+b.dataset.k === k) b.classList.add("bad"); });
    if (ok) { S.streak++; S.best = Math.max(S.best, S.streak); S.correct++; if (sec < 5) S.fast++; gain = Math.round(BASE * Math.max(0.5, 1 - sec / (T * 2)) * mult(S.streak)); S.score += gain; } else { S.streak = 0; S.missed.push(S.i); }
    q$("#fb").innerHTML = `<div class="acard pop"><strong>${ok ? "Correct! +" + gain : (k < 0 ? "Time's up" : "Not quite")}</strong><div class="exp">${esc(q.e)}</div></div><button class="btn" id="nx">${S.i + 1 >= Q.length ? "See results" : "Next"}</button>`;
    q$("#nx").onclick = () => { S.i++; ask(); };
  }
  async function end() {
    const got = []; if (S.best >= 5) got.push("streak"); if (S.fast >= 3) got.push("speed"); if (S.correct === Q.length) got.push("perfect"); if (S.correct / Q.length >= .8) got.push("sharp");
    root.innerHTML = `<p class="aeyebrow">Final result</p><p class="big pop">${S.score}</p><h2>${esc(S.name)}, you are now: ${rank(S.score)}</h2>
    <div class="acard"><div class="arow"><span>Correct</span><b>${S.correct}/${Q.length}</b></div><div class="arow"><span>Best streak</span><b>${S.best}</b></div><div class="arow"><span>Fast answers (under 5s)</span><b>${S.fast}</b></div></div>
    <p class="aeyebrow">Badges</p><div>${Object.keys(BADGES).map(k => `<span class="badge ${got.includes(k) ? "" : "locked"}">${BADGES[k][0]}<br><span class="asm">${BADGES[k][1]}</span></span>`).join("")}</div>
    ${S.missed.length ? `<div class="acard"><p class="aeyebrow">Revise these</p>${S.missed.map(i => `<p class="asm">• ${esc(Q[i].q)}<br><b>${esc(Q[i].o[Q[i].a])}</b></p>`).join("")}</div>` : ""}
    <div class="acard"><p class="aeyebrow">Leaderboard</p><div id="lb" class="asm">${live() ? "Saving…" : "Live leaderboard is off. Your score: " + S.score}</div></div>
    <button class="btn" id="again">Play again</button>`;
    q$("#again").onclick = () => { if (unsub) unsub(); home(); };
    if (!live()) return;
    try { await saveScore({ name: S.name.slice(0, 18), score: S.score, correct: S.correct, best: S.best, at: Date.now() }); } catch (e) { q$("#lb").textContent = "Could not save score: " + (e.code || e.message); return; }
    unsub = watchScores(10, rows => { const n = q$("#lb"); if (n) n.innerHTML = rowsHtml(rows, myId()); });
  }
  home();
  return () => { clearInterval(timer); if (unsub) unsub(); };
}
