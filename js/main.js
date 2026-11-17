import { initFB, live } from "./fb.js";
import { mountSlides } from "./slides.js";
import { mountQuiz } from "./quiz.js";
import { mountBoard } from "./board.js";
import { mountPlay, mountHostLive } from "./live.js";
const view = document.getElementById("view");
let cleanup = null, ready = initFB();
function setStatus() { document.getElementById("status").textContent = live() ? "● live" : "○ offline mode"; }
async function route() {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  const r = (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];
  document.querySelectorAll("header a").forEach(a => a.classList.toggle("on", a.dataset.r === r));
  document.body.style.overflow = r === "slides" ? "hidden" : "";
  view.innerHTML = "";
  await Promise.race([ready, new Promise(r => setTimeout(r, 4000))]); setStatus();
  if (r === "slides") cleanup = mountSlides(view);
  else if (r === "quiz") cleanup = mountQuiz(view);
  else if (r === "board") cleanup = mountBoard(view);
  else if (r === "host") cleanup = mountHostLive(view);
  else if (r === "play") cleanup = mountPlay(view);
  else home();
}
function home() {
  view.innerHTML = `<div class="wrap"><p class="aeyebrow">MNU Business School · ACHRM · Week 12</p><h1>Employment Law and Ethics in HRM</h1>
  <p>Guest lecture companion: slides, a live quiz and a class leaderboard.</p>
  <a class="tile" href="#/slides"><h3>Lecture slides</h3><p>Open on any device. Tap or use arrow keys to move through.</p></a>
  <a class="tile" href="#/play"><h3>Join the live quiz</h3><p>Join the lecturer's game: the host starts it and moves through the questions.</p></a>
  <a class="tile" href="#/quiz"><h3>Practice quiz</h3><p>Play on your own any time. Scores are not shared.</p></a>
  <a class="tile" href="#/board"><h3>Leaderboard</h3><p>See the top scores for the class.</p></a>
  <p class="asm">This is teaching material, not legal advice. Check the current consolidated text of the Employment Act before relying on any provision.</p></div>`;
}
addEventListener("hashchange", route); route();
