// Original chiptune loop synthesised from scratch: square lead arpeggio, triangle bass, noise drums.
const fs = require('fs');
const SR = 44100, BPM = 128, DUR = parseFloat(process.argv[3] || '30.4');
const beat = 60 / BPM, N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
// I–V–vi–IV in C, one chord per bar; last two bars of each 8 lift to IV–V.
const prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [53, 57, 60], [55, 59, 62]];
const sq = (ph, duty) => ((ph % 1) < duty ? 1 : -1);
const tri = ph => 4 * Math.abs((ph % 1) - 0.5) - 1;
let seed = 7; const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1;
function note(t0, len, f, vol, wave, duty = 0.25, decay = 6) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  for (let i = 0; i < n && s0 + i < N; i++) {
    const t = i / SR, env = Math.min(1, t * 400) * Math.exp(-t * decay) * Math.min(1, (n - i) / 200);
    const ph = f * t; const v = wave === 'sq' ? sq(ph, duty) : wave === 'tri' ? tri(ph) : noise();
    L[s0 + i] += v * vol * env;
  }
}
const bars = Math.ceil(DUR / (beat * 4));
const lastBar = bars - 2;
for (let b = 0; b < bars; b++) {
  const ch = prog[b % 8], t = b * 4 * beat;
  if (b > lastBar) continue; const intro = b < 1, outro = b === lastBar;
  if (outro) { // final hit: full C chord, ringing out
    for (const m of [60, 64, 67, 72]) note(t, 2.2, midi(m), 0.07, 'sq', 0.25, 1.4);
    note(t, 2.2, midi(36), 0.22, 'tri', 0, 1.2);
    continue;
  }
  // Lead: 16th-note arpeggio up an octave.
  const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2] + 12];
  for (let i = 0; i < 16; i++) note(t + i * beat / 4, beat / 4 * 0.9, midi(arp[i % 8]), intro ? 0.035 : 0.055, 'sq', 0.125, 9);
  // Melody hook every other bar from bar 2.
  if (!intro && b % 2 === 0) {
    const mel = [ch[2] + 12, null, ch[1] + 12, ch[2] + 12, null, ch[0] + 24, ch[2] + 12, null];
    mel.forEach((m, i) => m && note(t + i * beat / 2, beat / 2 * 0.85, midi(m), 0.06, 'sq', 0.5, 3));
  }
  // Bass: driving 8ths.
  for (let i = 0; i < 8; i++) note(t + i * beat / 2, beat / 2 * 0.8, midi(ch[0] - 24 + (i % 2 ? 12 : 0)), 0.2, 'tri', 0, 2);
  // Drums.
  if (!intro) for (let i = 0; i < 4; i++) {
    const tb = t + i * beat;
    if (i % 2 === 0) {}
    else note(tb, 0.12, 0, 0.22, 'nz', 0, 25);
    note(tb + beat / 2, 0.04, 0, 0.08, 'nz', 0, 80);
  }
}
// Kick: pitch-dropping sine, written separately.
function kicks() {}
// Patch note() kick handling: re-run for 'kick' entries using a sine sweep.
const origNote = note;
// (kick is rendered inline below by scanning: simpler to implement directly)
for (let b = 0; b < bars; b++) {
  const t = b * 4 * beat; const hits = b > lastBar ? [] : b === lastBar ? [0] : b < 1 ? [] : [0, 2];
  for (const h of hits) {
    const s0 = Math.floor((t + h * beat) * SR);
    for (let i = 0; i < 0.18 * SR && s0 + i < N; i++) { const tt = i / SR; const f = 50 + 120 * Math.exp(-tt * 30);
      L[s0 + i] += Math.sin(2 * Math.PI * f * tt) * 0.45 * Math.exp(-tt * 18); }
  }
}
// Master: fade out last 0.8s, soft clip, write 16-bit stereo WAV.
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR; const fade = Math.min(1, (DUR - t) / 0.8, t / 0.05);
  const v = Math.tanh(L[i] * 1.3) * 0.8 * fade; const s = Math.round(v * 32767);
  out.writeInt16LE(s, 44 + i * 4); out.writeInt16LE(s, 46 + i * 4);
}
fs.writeFileSync(process.argv[2] || 'music.wav', out);
console.log('music', DUR + 's', bars, 'bars');
