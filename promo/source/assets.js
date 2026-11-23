// Renders the stage background and caption plates on the app's own origin so its fonts/tokens apply.
const { chromium } = require('playwright-core');
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'assets'); fs.mkdirSync(OUT, { recursive: true });
const CAPS = [
  ['01', 'PICK A GAMERTAG'], ['02', 'CHOOSE YOUR CHARACTER'], ['03', 'SIX GAME MODES'],
  ['04', 'REAL DESIGN SITUATIONS'], ['05', 'LEARN WHY, EVERY ANSWER'], ['06', 'EARN XP. LEVEL UP.'],
  ['07', 'CLIMB THE HISCORE'], ['08', 'COLLECT KNOWLEDGE CARDS'],
];
const FRAME = { x: 160, y: 32, w: 1600, h: 900 };

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('http://localhost:3210/onboarding'); await p.waitForLoadState('networkidle');
  await p.evaluate(() => document.fonts.ready);
  const base = `
    *{margin:0;box-sizing:border-box}
    html,body{width:1920px;height:1080px;overflow:hidden}
    .px{font-family:var(--font-press-start),monospace}
    .logo{position:absolute;left:${FRAME.x}px;top:968px;display:flex;align-items:center;gap:10px;font-size:26px;
      background:var(--ink);padding:16px 18px;box-shadow:6px 6px 0 rgba(38,21,39,.45)}
    .logo .x{background:var(--yellow);color:var(--ink);padding:6px 8px}
    .logo .d{color:var(--light)}
    .cap{position:absolute;right:${1920 - FRAME.x - FRAME.w}px;top:960px;display:flex;align-items:stretch;gap:0;
      box-shadow:8px 8px 0 rgba(38,21,39,.45)}
    .cap .k{background:var(--pink);color:var(--light);font-size:22px;padding:22px 18px;border:6px solid var(--ink);border-right:0;display:flex;align-items:center}
    .cap .t{background:var(--ink);color:var(--yellow);font-size:30px;padding:22px 26px;border:6px solid var(--ink);display:flex;align-items:center;letter-spacing:.04em}
  `;
  // Stage: violet sky with lavender tiles, ink-framed screen, pink checker strip at the bottom.
  await p.setContent(`<html><head><style>${base}
    body{background:var(--sky);background-image:linear-gradient(var(--sky-tile) 3px,transparent 3px),linear-gradient(90deg,var(--sky-tile) 3px,transparent 3px);background-size:120px 120px;background-position:-3px -3px}
    .scr{position:absolute;left:${FRAME.x - 10}px;top:${FRAME.y - 10}px;width:${FRAME.w + 20}px;height:${FRAME.h + 20}px;background:var(--ink);box-shadow:14px 14px 0 rgba(38,21,39,.5)}
    .floor{position:absolute;left:0;right:0;bottom:0;height:26px;background:repeating-linear-gradient(90deg,#c95aa8 0 52px,#e07cc4 52px 104px);border-top:6px solid var(--ink)}
  </style></head><body><div class="scr"></div><div class="floor"></div>
  <div class="logo px"><span class="d">DESIGN</span><span class="x">XP</span></div></body></html>`);
  // setContent drops the app's font CSS, so copy the app stylesheet links back in.
  await p.goto('http://localhost:3210/onboarding'); await p.waitForLoadState('networkidle');
  const render = async (html, file, transparent) => {
    await p.evaluate(([html, css, transparent]) => {
      document.body.innerHTML = html; document.body.className = '';
      let s = document.getElementById('stage-css'); if (!s) { s = document.createElement('style'); s.id = 'stage-css'; document.head.appendChild(s); }
      s.textContent = css + (transparent ? 'html,body{background:transparent!important;background-image:none!important}' : '');
      document.querySelectorAll('nextjs-portal').forEach(n => n.remove());
    }, [html, html.css, transparent]);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUT, file), omitBackground: !!transparent });
  };
  const stageCss = base + `
    html,body{background:var(--sky)!important;background-image:linear-gradient(var(--sky-tile) 3px,transparent 3px),linear-gradient(90deg,var(--sky-tile) 3px,transparent 3px)!important;background-size:120px 120px!important;background-position:-3px -3px!important}
    .scr{position:absolute;left:${FRAME.x - 10}px;top:${FRAME.y - 10}px;width:${FRAME.w + 20}px;height:${FRAME.h + 20}px;background:var(--ink);box-shadow:14px 14px 0 rgba(38,21,39,.5)}
    .floor{position:absolute;left:0;right:0;bottom:0;height:26px;background:repeating-linear-gradient(90deg,#c95aa8 0 52px,#e07cc4 52px 104px);border-top:6px solid var(--ink)}`;
  const stage = Object.assign(new String(`<div class="scr"></div><div class="floor"></div><div class="logo px"><span class="d">DESIGN</span><span class="x">XP</span></div>`), {});
  await p.evaluate(() => { document.documentElement.style.overflow = 'hidden'; });
  await renderWith(p, stage.toString(), stageCss, path.join(OUT, 'stage.png'), false);
  for (const [k, t] of CAPS) {
    await renderWith(p, `<div class="cap px"><span class="k">${k}</span><span class="t">${t}</span></div>`, base, path.join(OUT, `cap-${k}.png`), true);
  }
  await b.close();
  console.log('assets ok');
})().catch(e => { console.error(e); process.exit(1); });

async function renderWith(p, html, css, file, transparent) {
  await p.evaluate(([html, css, transparent]) => {
    document.body.innerHTML = html; document.body.className = '';
    let s = document.getElementById('stage-css'); if (!s) { s = document.createElement('style'); s.id = 'stage-css'; document.head.appendChild(s); }
    s.textContent = css + (transparent ? 'html,body{background:transparent!important;background-image:none!important}' : '');
  }, [html, css, transparent]);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: file, omitBackground: !!transparent });
}
