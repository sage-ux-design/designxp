const { chromium } = require('playwright-core');
const fs = require('fs'); const path = require('path');
const { map, norm } = require('./answers');
const U = 'http://localhost:3210'; const OUT = path.join(__dirname, 'clips');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript({ path: path.join(__dirname, 'inject.js') });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  let frames = null;
  cdp.on('Page.screencastFrame', async f => {
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    if (frames) frames.push({ t: Date.now(), data: f.data });
  });
  page.rec = {
    async start() { page.marks = []; page.t0 = Date.now();
      frames = [];
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    },
    async stop(name) {
      const end = Date.now(); await cdp.send('Page.stopScreencast'); const fr = frames; frames = null;
      const dir = path.join(OUT, name); fs.mkdirSync(dir);
      let list = '';
      fr.forEach((f, i) => {
        const fn = `f${String(i).padStart(5, '0')}.jpg`;
        fs.writeFileSync(path.join(dir, fn), Buffer.from(f.data, 'base64'));
        const next = i + 1 < fr.length ? fr[i + 1].t : end;
        list += `file '${fn}'\nduration ${Math.max(0.001, (next - f.t) / 1000).toFixed(3)}\n`;
      });
      list += `file 'f${String(fr.length - 1).padStart(5, '0')}.jpg'\n`;
      fs.writeFileSync(path.join(dir, 'list.txt'), list); fs.writeFileSync(path.join(dir, 'marks.json'), JSON.stringify({ start: (fr[0].t - page.t0) / 1000, dur: (end - page.t0) / 1000, marks: page.marks }));
      console.log(name, fr.length, 'frames', ((end - fr[0].t) / 1000).toFixed(1) + 's');
    },
  };
  let pos = [640, 520];
  page.moveTo = async (target, ms = 550) => {
    let x, y;
    if (Array.isArray(target)) [x, y] = target;
    else { const b = await target.boundingBox(); x = b.x + b.width / 2; y = b.y + b.height / 2; }
    const steps = Math.max(1, Math.round(ms / 16)); const [sx, sy] = pos;
    for (let i = 1; i <= steps; i++) {
      const k = i / steps; const e = 1 - Math.pow(1 - k, 3);
      await page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e); await sleep(8);
    }
    pos = [x, y];
  };
  page.tap = async (loc, ms) => {
    await loc.scrollIntoViewIfNeeded();
    await page.moveTo(loc, ms); await sleep(120); await page.mouse.down(); await sleep(90); await page.mouse.up();
  };
  page.cap = async (k, t) => { if (k && page.marks) page.marks.push({ k, t, at: (Date.now() - page.t0) / 1000 }); };
  page.scrollSmooth = (y, ms = 900) => page.evaluate(([y, ms]) => new Promise(r => {
    const s = scrollY, d = y - s, t0 = performance.now();
    const f = now => {
      const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo(0, s + d * e); k < 1 ? requestAnimationFrame(f) : r();
    };
    requestAnimationFrame(f);
  }), [y, ms]);
  page.park = async () => { await page.mouse.move(pos[0], pos[1]); };
  return page;
}

async function answerCurrent(page, animate) {
  await page.waitForSelector('#question-heading', { timeout: 15000 });
  const q = norm(await page.textContent('#question-heading')); const ans = map.get(q) || [];
  if (!ans.length) console.warn('no answer for', q);
  for (const btn of await page.locator('[aria-label^="Answer options"] button').all()) {
    const t = norm(await btn.textContent());
    if (ans.some(a => t.includes(a))) { if (animate) await page.tap(btn, 700); else await btn.click(); }
  }
  const check = page.getByRole('button', { name: 'CHECK ANSWER' });
  if (animate) { await sleep(250); await page.tap(check, 600); } else await check.click();
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const p = await newPage(browser);

  // 1. Title screen -> gamertag -> character
  await p.goto(U + '/onboarding'); await p.waitForLoadState('networkidle'); await sleep(800); await p.park();
  await p.rec.start(); await sleep(2600);
  await p.tap(p.getByRole('button', { name: /PRESS START/ }), 700); await sleep(500);
  await p.cap('01', 'PICK A GAMERTAG');
  const input = p.getByPlaceholder('PIXELDESIGNER'); await p.tap(input, 500);
  await input.pressSequentially('PIXELSAGE', { delay: 85 }); await sleep(900);
  await p.tap(p.getByRole('button', { name: /▶/ }).first(), 500); await sleep(400);
  await p.cap('02', 'CHOOSE YOUR CHARACTER');
  await sleep(300); await p.moveTo(p.locator('label:has-text("Shade")'), 500); await sleep(250);
  await p.tap(p.locator('label:has-text("Ember")'), 600); await sleep(1300);
  await p.rec.stop('a-onboarding');
  await p.cap();
  await p.getByRole('button', { name: /CONFIRM CHARACTER/ }).click(); await sleep(500);
  await p.getByRole('button', { name: /START|PLAY|ENTER|BEGIN/ }).last().click(); await p.waitForURL(/dashboard/);

  // Off-camera warm-up round so the recorded round crosses into Level 2.
  await p.goto(U + '/play/spot-the-ux');
  for (let i = 0; i < 5; i++) { await answerCurrent(p, false); await p.getByRole('button', { name: /NEXT QUESTION|FINISH QUEST/ }).click(); }
  await sleep(2500);

  // 2. Mode select
  await p.goto(U + '/play'); await p.waitForLoadState('networkidle'); await sleep(600);
  await p.evaluate(() => scrollTo(0, 0)); await p.moveTo([900, 300], 10);
  await p.rec.start();
  await p.cap('03', 'SIX GAME MODES'); await sleep(500);
  const lingo = p.locator('a[href="/play/design-lingo"]').first();
  const lb = await lingo.boundingBox();
  await p.scrollSmooth(lb.y - 220, 1100); await sleep(150);
  await p.moveTo(p.locator('a[href="/play/spot-the-ux"]').first(), 450); await sleep(250);
  await p.moveTo(p.locator('a[href="/play/what-would-you-do"]').first(), 400); await sleep(250);
  await p.tap(lingo, 450); await p.waitForSelector('#question-heading'); await sleep(300);
  // 3. Answer + feedback
  await p.cap('04', 'REAL DESIGN SITUATIONS'); await sleep(1400);
  await answerCurrent(p, true); await sleep(700);
  await p.cap('05', 'LEARN WHY, EVERY ANSWER');
  const fb = await p.locator('[aria-label="Answer feedback"]').boundingBox();
  const sy = await p.evaluate(() => scrollY);
  await p.scrollSmooth(sy + fb.y - 90, 1100); await sleep(2200);
  await p.rec.stop('b-play');
  await p.cap();
  await p.getByRole('button', { name: /NEXT QUESTION/ }).click();
  for (let i = 1; i < 5; i++) { await answerCurrent(p, false); if (i < 4) await p.getByRole('button', { name: /NEXT QUESTION/ }).click(); }
  await sleep(600);

  // 4. Finish -> QUEST COMPLETE + LEVEL UP
  const fin = p.getByRole('button', { name: /FINISH QUEST/ }); await fin.scrollIntoViewIfNeeded();
  await p.rec.start(); await sleep(300);
  await p.tap(fin, 500); await p.waitForSelector('text=QUEST COMPLETE', { timeout: 15000 }); await sleep(300);
  await p.cap('06', 'EARN XP. LEVEL UP.'); await sleep(2300);
  await p.scrollSmooth(560, 1200); await sleep(1200);
  await p.rec.stop('c-victory');
  await p.cap();

  // 5. Leaderboard
  await p.goto(U + '/leaderboard'); await p.waitForLoadState('networkidle'); await sleep(1200);
  await p.rec.start(); await p.cap('07', 'CLIMB THE HISCORE'); await sleep(1300);
  const me = p.locator('text=PIXELSAGE').first(); const mb = await me.boundingBox();
  await p.scrollSmooth(Math.max(0, mb.y - 360), 1500); await sleep(1300);
  await p.rec.stop('d-leaderboard'); await p.cap();

  // 6. Knowledge library
  await p.goto(U + '/knowledge'); await p.waitForLoadState('networkidle'); await sleep(1000);
  await p.locator('[aria-label="Show"] button').nth(1).click(); await sleep(600);
  await p.evaluate(() => scrollTo(0, 0));
  await p.rec.start(); await p.cap('08', 'COLLECT KNOWLEDGE CARDS'); await sleep(900);
  await p.scrollSmooth(330, 1000); await sleep(300);
  const cards = p.locator('button[aria-label$="Open card."]');
  console.log('cards', await cards.count());
  await p.moveTo(cards.nth(1), 500); await sleep(300); await p.moveTo(cards.nth(2), 450); await sleep(1500);
  await p.rec.stop('e-knowledge'); await p.cap();

  // 7. End card: fresh title screen, trimmed to the wordmark + tagline.
  const e = await newPage(browser);
  await e.goto(U + '/onboarding'); await e.waitForLoadState('networkidle'); await sleep(800);
  await e.evaluate(() => {
    document.querySelector('.pixel-frame')?.remove();
    document.querySelectorAll('p').forEach(x => { if (x.textContent.includes('PRESS ENTER')) x.remove(); });
    const sign = document.querySelector('p.sign'); if (sign) sign.style.visibility = 'hidden';
    const tag = [...document.querySelectorAll('p')].find(x => x.textContent === 'LEVEL UP YOUR DESIGN THINKING');
    const n = document.createElement('p'); n.className = 'sign'; n.style.cssText = 'margin-top:44px;font-size:20px;padding:16px 22px';
    n.textContent = 'PLAY · DISCOVER · LEARN · LEVEL UP'; tag.after(n);
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('PRESS START'));
    if (btn) { btn.style.marginTop = '40px'; btn.blur(); }
  });
  await e.rec.start(); await sleep(3600); await e.rec.stop('f-end');
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
