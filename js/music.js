// Soft techno loop generated live with the Web Audio API (no audio files, no copyright issues).
let ctx = null, master = null, timer = null, step = 0, next = 0, running = false;
const BPM = 112, S = 60 / BPM / 4;                       // 16th-note length
const BASS = [55, 0, 0, 55, 0, 0, 65.41, 0, 0, 0, 55, 0, 82.41, 0, 73.42, 0]; // A minor groove (Hz, 0 = rest)
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]; // Am F C G
const ARP = [0, 2, 1, 2, 0, 1, 2, 1];
export const musicPref = () => { try { return localStorage.getItem("music") === "on"; } catch (e) { return false; } };
export const setMusicPref = on => { try { localStorage.setItem("music", on ? "on" : "off"); } catch (e) {} };
export const musicRunning = () => running;
function tone(t, f, dur, type, vol, lp) {
  const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = lp;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25);
}
function hat(t, vol) {
  const len = Math.floor(ctx.sampleRate * 0.05), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; hp.type = "highpass"; hp.frequency.value = 7000; g.gain.value = vol;
  s.connect(hp); hp.connect(g); g.connect(master); s.start(t);
}
function schedule(t, n) {
  const bar = Math.floor(n / 16) % 4, k = n % 16, chord = CHORDS[bar];
  if (k % 4 === 0) kick(t);
  if (k % 4 === 2) hat(t, 0.16); else if (k % 2 === 1) hat(t, 0.05);
  if (BASS[k]) tone(t, BASS[k], S * 2.2, "sawtooth", 0.22, 380);
  if (k % 2 === 0) tone(t, chord[ARP[(k / 2) % 8]] * 2, S * 3, "triangle", 0.07, 2400);
  if (k === 0) chord.forEach(f => tone(t, f, S * 15, "sine", 0.035, 1200));
}
function tick() {
  while (next < ctx.currentTime + 0.15) { schedule(next, step); next += S; step++; }
}
export function startMusic() {
  if (running) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    if (!master) { master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); }
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.35, ctx.currentTime, 0.1);
    step = 0; next = ctx.currentTime + 0.05; running = true; timer = setInterval(tick, 25);
  } catch (e) { running = false; }
}
export function stopMusic() {
  if (!running) return;
  running = false; clearInterval(timer);
  try { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15); } catch (e) {}
}
