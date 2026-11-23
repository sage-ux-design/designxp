// Cuts the recorded clips into the 30s promo: framed app footage + caption plates + original chiptune.
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const FF = require('ffmpeg-static'); const D = __dirname;
const OUT = process.argv[2];
const run = args => execFileSync(FF, ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
fs.mkdirSync(path.join(D, 'raw'), { recursive: true }); fs.mkdirSync(path.join(D, 'seg'), { recursive: true });

for (const c of ['a-onboarding', 'b-play', 'c-victory', 'd-leaderboard', 'e-knowledge', 'f-end'])
  run(['-f', 'concat', '-safe', '0', '-i', `${D}/clips/${c}/list.txt`, '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', `${D}/raw/${c}.mp4`]);

// [clip, in, out, speed, framed, captions [[id, at-seconds-in-output]]]
const SEGS = [
  ['a-onboarding', 0, 4.3, 1.25, false, []],
  ['a-onboarding', 4.3, 13.0, 1.8, true, [['01', 0], ['02', 2.68]]],
  ['b-play', 0, 6.0, 1.9, true, [['03', 0]]],
  ['b-play', 6.0, 14.55, 1.65, true, [['04', 0], ['05', 2.3]]],
  ['c-victory', 0.4, 6.7, 1.5, true, [['06', 1.0]]],
  ['d-leaderboard', 0, 4.2, 1.35, true, [['07', 0]]],
  ['e-knowledge', 0, 5.7, 1.6, true, [['08', 0]]],
  ['f-end', 0, 3.0, 1, false, []],
];
let total = 0; const list = [];
SEGS.forEach(([clip, a, b, speed, framed, caps], i) => {
  const dur = +((b - a) / speed).toFixed(3); total += dur;
  const inputs = ['-i', `${D}/raw/${clip}.mp4`];
  let fc = `[0:v]trim=start=${a}:end=${b},setpts=(PTS-STARTPTS)/${speed},fps=30`;
  if (framed) {
    inputs.push('-loop', '1', '-i', `${D}/assets/stage.png`);
    fc += `,scale=1600:900:flags=lanczos[app];[1:v][app]overlay=160:32[s0]`;
    caps.forEach(([id, at], j) => {
      const end = j + 1 < caps.length ? caps[j + 1][1] : dur + 1;
      inputs.push('-loop', '1', '-i', `${D}/assets/cap-${id}.png`);
      const n = 2 + j;
      // Plate slides in from the right in 4 pixel-snapped steps.
      fc += `;[${n}:v]format=rgba[c${j}];[s${j}][c${j}]overlay=x='if(lt(t-${at},0.2),floor((1-(t-${at})/0.2)*4)*90,0)':y=0:enable='between(t,${at},${end})'[s${j + 1}]`;
    });
    fc += `;[s${caps.length}]format=yuv420p[v]`;
  } else fc += `,format=yuv420p[v]`;
  const f = `${D}/seg/s${i}.mp4`;
  run([...inputs, '-filter_complex', fc, '-map', '[v]', '-t', String(dur), '-r', '30', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', f]);
  list.push(`file '${f.replace(/\\/g, '/')}'`);
  console.log(`seg ${i} ${clip} ${dur}s`);
});
fs.writeFileSync(`${D}/seg/list.txt`, list.join('\n'));
execFileSync(process.execPath, [`${D}/music.js`, `${D}/music.wav`, total.toFixed(2)], { stdio: 'inherit' });
run(['-f', 'concat', '-safe', '0', '-i', `${D}/seg/list.txt`, '-i', `${D}/music.wav`,
  '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT]);
console.log('total', total.toFixed(2) + 's ->', OUT);
