// Ippo Care legal site: reading progress, table-of-contents scroll-spy, copy-to-clipboard.
// No network requests, no storage, no tracking.
(() => {
  const bar = document.querySelector('.progress span');
  const toTop = document.querySelector('.to-top');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (toTop) toTop.classList.toggle('show', scrollY > innerHeight * 0.9);
    document.body.classList.toggle('scrolled', scrollY > 8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  const sections = [...document.querySelectorAll('.doc-body > section[id]')];
  const links = [...document.querySelectorAll('[data-toc]')];
  const current = document.querySelector('[data-current]');
  const mobile = document.querySelector('.toc-mobile');
  if (sections.length && 'IntersectionObserver' in window) {
    const visible = new Map();
    const pick = () => {
      let id = sections[0].id;
      for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.5) id = s.id;
      for (const a of links) {
        const on = a.dataset.toc === id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      }
      const active = document.querySelector('.toc a.active');
      if (active) {
        const nav = active.closest('.toc');
        const top = active.offsetTop - nav.clientHeight / 2;
        if (active.offsetTop < nav.scrollTop || active.offsetTop > nav.scrollTop + nav.clientHeight - 40) nav.scrollTo({ top, behavior: 'smooth' });
      }
      if (current) {
        const a = links.find(x => x.dataset.toc === id);
        current.textContent = a ? a.textContent.replace(/^\s*(\d+|•)/, '').trim() : '';
      }
    };
    const io = new IntersectionObserver(entries => { for (const e of entries) visible.set(e.target.id, e.isIntersecting); pick(); }, { rootMargin: '0px 0px -60% 0px' });
    sections.forEach(s => io.observe(s));
    addEventListener('scroll', () => requestAnimationFrame(pick), { passive: true });
    pick();
  }
  if (mobile) mobile.addEventListener('click', e => { if (e.target.closest('a')) mobile.open = false; });

  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      const label = b.querySelector('span');
      const before = label.textContent;
      try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
      b.classList.add('done');
      label.textContent = b.dataset.done;
      setTimeout(() => { b.classList.remove('done'); label.textContent = before; }, 1600);
    });
  }

  // Close the language menu when clicking elsewhere or pressing Escape.
  const lang = document.querySelector('.language');
  if (lang) {
    document.addEventListener('click', e => { if (!lang.contains(e.target)) lang.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lang.open = false; });
  }
})();
