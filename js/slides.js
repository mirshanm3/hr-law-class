import { SLIDES } from "./data-slides.js";
export function mountSlides(view) {
  view.innerHTML = `<div id="slidewrap"><div id="stage"></div></div><div id="notes"></div>
  <div id="sbar"><button id="pv">‹</button><span id="pg" class="sm"></span><button id="nx">›</button><button id="nt">Notes</button><button id="fs">Full screen</button></div>`;
  const stage = document.getElementById("stage"), wrap = document.getElementById("slidewrap");
  stage.innerHTML = SLIDES.map((s, i) => `<section class="${s.cls}" data-n="${i + 1}">${s.html}</section>`).join("");
  const secs = [...stage.children];
  try {
    const url = location.origin + location.pathname + "#/quiz", box = stage.querySelector("#slideqr");
    if (box) { const q = qrcode(0, "M"); q.addData(url); q.make(); box.innerHTML = q.createSvgTag(10, 0); const sv = box.querySelector("svg"); sv.style.width = "100%"; sv.style.height = "auto"; stage.querySelector("#slideurl").textContent = url; }
  } catch (e) { const b = stage.querySelector("#slideqr"); if (b) b.textContent = "QR library did not load. Use the address on the host screen."; }
  let i = Math.max(0, Math.min(SLIDES.length - 1, (parseInt(sessionStorageGet("slide")) || 1) - 1)), notesOn = false;
  function frags(n) { return [...secs[n].querySelectorAll(".fragment")]; }
  function show(n, reveal) {
    i = n; secs.forEach((s, k) => s.classList.toggle("cur", k === n));
    frags(n).forEach(f => f.classList.toggle("visible", !!reveal));
    document.getElementById("pg").textContent = `${n + 1} / ${SLIDES.length}`;
    document.getElementById("notes").textContent = SLIDES[n].notes;
    sessionStorageSet("slide", n + 1);
  }
  function next() { const f = frags(i).find(x => !x.classList.contains("visible")); if (f) f.classList.add("visible"); else if (i < secs.length - 1) show(i + 1, false); }
  function prev() { const v = frags(i).filter(x => x.classList.contains("visible")); if (v.length) v[v.length - 1].classList.remove("visible"); else if (i > 0) show(i - 1, true); }
  function fit() { const k = Math.min(wrap.clientWidth / 1920, wrap.clientHeight / 1080); stage.style.transform = `translate(-50%,-50%) scale(${k})`; }
  const key = e => { if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); } else if (e.key === "n") toggleNotes(); };
  function toggleNotes() { notesOn = !notesOn; document.getElementById("notes").style.display = notesOn ? "block" : "none"; }
  wrap.onclick = e => { const r = wrap.getBoundingClientRect(); (e.clientX - r.left < r.width * 0.25) ? prev() : next(); };
  let x0 = null;
  wrap.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); e.preventDefault(); } x0 = null; });
  document.getElementById("nx").onclick = next; document.getElementById("pv").onclick = prev; document.getElementById("nt").onclick = toggleNotes;
  document.getElementById("fs").onclick = () => { try { document.documentElement.requestFullscreen(); } catch (e) {} };
  addEventListener("keydown", key); addEventListener("resize", fit); fit(); show(i, false);
  return () => { removeEventListener("keydown", key); removeEventListener("resize", fit); };
}
function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
