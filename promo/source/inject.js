// Runs in every page: promo-only chrome tweaks, fake pixel cursor, caption helper.
(() => {
  const css = `
    nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display:none !important; }
    #promo-cursor { position:fixed; left:0; top:0; width:26px; height:26px; z-index:2147483647; pointer-events:none;
      transform:translate(-100px,-100px); image-rendering:pixelated; filter: drop-shadow(2px 2px 0 rgba(30,10,40,.55)); }
    #promo-cursor.down { transform-origin: 0 0; }
    #promo-cap { position:fixed; left:48px; bottom:44px; z-index:2147483646; pointer-events:none;
      display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
    #promo-cap .k { font-family: var(--font-press-start), monospace; font-size:12px; letter-spacing:.08em;
      background: var(--pink, #ff5fa2); color:#fff; padding:8px 12px; border:3px solid #1d1029; }
    #promo-cap .t { font-family: var(--font-press-start), monospace; font-size:22px; line-height:1.35; color:#ffd93b;
      background:#1d1029; padding:14px 18px; box-shadow: 6px 6px 0 rgba(29,16,41,.45); max-width:760px; }
    #promo-cap.in .k { animation: pcap .28s steps(4) both; }
    #promo-cap.in .t { animation: pcap .32s steps(4) .06s both; }
    @keyframes pcap { from { transform: translateX(-110%); opacity:0 } to { transform:none; opacity:1 } }
  `;
  const install = () => {
    if (document.getElementById('promo-style')) return;
    const s = document.createElement('style'); s.id = 'promo-style'; s.textContent = css; document.head.appendChild(s);
    const c = document.createElement('div'); c.id = 'promo-cursor';
    c.innerHTML = `<svg viewBox="0 0 13 13" width="26" height="26" shape-rendering="crispEdges">
      <path fill="#1d1029" d="M0 0h1v1H0zM0 1h2v1H0zM0 2h3v1H0zM0 3h4v1H0zM0 4h5v1H0zM0 5h6v1H0zM0 6h7v1H0zM0 7h8v1H0zM0 8h5v1H0zM0 9h2v1H0zM3 9h3v1H3zM0 10h1v1H0zM4 10h2v1H4zM4 11h3v1H4zM5 12h2v1H5z"/>
      <path fill="#fff" d="M1 2h1v1H1zM1 3h2v1H1zM1 4h3v1H1zM1 5h4v1H1zM1 6h5v1H1zM1 7h6v1H1zM1 8h3v1H1zM4 9h1v1H4zM5 10h1v1H5zM5 11h1v1H5z"/></svg>`;
    document.body.appendChild(c);
    const p = window.__promoPos || [-100, -100];
    c.style.transform = `translate(${p[0]}px,${p[1]}px)`;
    addEventListener('mousemove', e => { window.__promoPos = [e.clientX, e.clientY]; c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, true);
    addEventListener('mousedown', () => { c.style.transform += ' scale(.85)'; }, true);
    addEventListener('mouseup', () => { const q = window.__promoPos; c.style.transform = `translate(${q[0]}px,${q[1]}px)`; }, true);
    // Hide demo-mode chrome for the promo.
    const hide = () => {
      document.querySelectorAll('button[aria-label^="Demo mode"]').forEach(e => e.style.display = 'none');
      document.querySelectorAll('span,p,div').forEach(e => {
        if (e.childElementCount === 0 && /^\(demo\)$/.test(e.textContent.trim())) e.style.display = 'none';
      });
      document.querySelectorAll('strong').forEach(e => { if (e.textContent.startsWith('Demo leaderboard')) { const box = e.closest('p'); if (box) box.style.display = 'none'; } });
      document.querySelectorAll('p').forEach(e => { if (/demo board|Demo mode: ranks/.test(e.textContent) && e.childElementCount === 0) e.style.visibility = 'hidden'; });
      document.querySelectorAll('*').forEach(e => { for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent === ' · demo') n.textContent = ''; });
    };
    hide(); new MutationObserver(() => { clearTimeout(window.__ph); window.__ph = setTimeout(hide, 10); hide(); }).observe(document.body, { childList: true, subtree: true });
  };
  window.__cap = (k, t) => {
    let el = document.getElementById('promo-cap');
    if (!el) { el = document.createElement('div'); el.id = 'promo-cap'; document.body.appendChild(el); }
    if (!k) { el.innerHTML = ''; return; }
    el.className = ''; el.innerHTML = `<span class="k">${k}</span><span class="t">${t}</span>`; void el.offsetWidth; el.className = 'in';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
