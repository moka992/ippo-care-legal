// Builds the Ippo Care legal and support site (GitHub Pages) from locales/*.json into dist/.
// Pages: /privacy/, /terms/, /support/ (English) and /<lang>/<page>/ for every language. All links are relative,
// so the site works under https://<user>.github.io/<repo>/.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://moka992.github.io/ippo-care-legal';
const REPO = 'https://github.com/moka992/ippo-care-legal';
const OUT = process.argv[2] ?? 'docs';
const UPDATED = '2026-11-18';
const EMAIL = 'wm88889@hotmail.com';
const EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const codes = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko'];
const pages = ['privacy', 'terms', 'support'];

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const prose = t => esc(t).replaceAll(EMAIL, `<a href="mailto:${EMAIL}">${EMAIL}</a>`);
const path = (code, page) => (code === 'en' ? '' : code + '/') + (page ? page + '/' : '');
// Relative link from the folder of (fromCode, fromPage) to (code, page).
const rel = (fromCode, fromPage, code, page) => {
  const depth = (fromCode === 'en' ? 0 : 1) + (fromPage ? 1 : 0);
  return ('../'.repeat(depth) || './') + path(code, page);
};

const locales = codes.map(code => {
  const l = JSON.parse(readFileSync(join('locales', code + '.json'), 'utf8'));
  if (l.code !== code) throw new Error('code mismatch ' + code);
  return l;
});
const en = locales[0];
for (const l of locales) {
  for (const key of Object.keys(en.ui)) if (l.ui[key] === undefined) throw new Error(`missing ui ${l.code}.${key}`);
  for (const kind of ['privacy', 'terms']) {
    if (l[kind].length !== en[kind].length) throw new Error(`${l.code}.${kind}: ${l[kind].length} sections, English has ${en[kind].length}`);
    l[kind].forEach((s, i) => { if (s.id !== en[kind][i].id || !s.title) throw new Error(`${l.code}.${kind}[${i}] ${s.id}`); });
  }
  if (l.support.length !== en.support.length) throw new Error(`${l.code}.support count`);
  const text = JSON.stringify(l);
  if (/[​‌‍﻿]/.test(text)) throw new Error('zero-width character in ' + l.code);
}

const ICONS = {
  phone: '<path d="M8 2.75h8A2.25 2.25 0 0 1 18.25 5v14A2.25 2.25 0 0 1 16 21.25H8A2.25 2.25 0 0 1 5.75 19V5A2.25 2.25 0 0 1 8 2.75Z"/><path d="M10.5 18h3"/>',
  heart: '<path d="M12 20s-7.25-4.35-7.25-10A4.25 4.25 0 0 1 12 7.1 4.25 4.25 0 0 1 19.25 10C19.25 15.65 12 20 12 20Z"/>',
  shield: '<path d="M12 2.9 19.25 5.6v5.6c0 4.6-3 8.3-7.25 9.9-4.25-1.6-7.25-5.3-7.25-9.9V5.6L12 2.9Z"/><path d="m9 12 2.1 2.1L15.3 9.9"/>',
  spark: '<path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z"/><path d="M18.5 15.5c.25 1.7.8 2.25 2.5 2.5-1.7.25-2.25.8-2.5 2.5-.25-1.7-.8-2.25-2.5-2.5 1.7-.25 2.25-.8 2.5-2.5Z"/>',
  export: '<path d="M12 14.5V3.5"/><path d="m7.75 7.5 4.25-4 4.25 4"/><path d="M5 12.5v5.75A2.25 2.25 0 0 0 7.25 20.5h9.5A2.25 2.25 0 0 0 19 18.25V12.5"/>',
  mail: '<rect x="3" y="5.25" width="18" height="13.5" rx="2.5"/><path d="m3.75 7 8.25 6 8.25-6"/>',
  doc: '<path d="M7 2.75h6.5L18.25 7.5v11.75A2 2 0 0 1 16.25 21.25h-9.5a2 2 0 0 1-2-2v-14.5a2 2 0 0 1 2-2Z"/><path d="M13.25 3v4.75H18M8.5 12.5h7M8.5 16h5"/>',
  scale: '<path d="M12 3.5v17M7 20.5h10M5.5 7h13M5.5 7 3 13a2.75 2.75 0 0 0 5 0L5.5 7Zm13 0L16 13a2.75 2.75 0 0 0 5 0l-2.5-6Z"/>',
  apple: '<path d="M12 6.5c1.4-1.9 3.6-2.3 4.4-2.2-.1 1.6-.9 3.3-2.6 4"/><path d="M12 8.6c-1.3-.7-2.3-1-3.4-1C5.9 7.6 4.5 10 4.5 12.9c0 3.9 2.8 7.6 4.7 7.6 1 0 1.6-.6 2.8-.6s1.8.6 2.8.6c1.9 0 4.7-3.7 4.7-7.6 0-2.9-1.4-5.3-4.1-5.3-1.1 0-2.1.3-3.4 1Z"/>',
  chevron: '<path d="m6.5 9.25 5.5 5.5 5.5-5.5"/>',
  arrow: '<path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5"/>',
  up: '<path d="M12 19.5v-15M6.5 10 12 4.5 17.5 10"/>',
  globe: '<circle cx="12" cy="12" r="8.75"/><path d="M3.5 12h17M12 3.25c2.4 2.4 3.6 5.3 3.6 8.75S14.4 18.35 12 20.75C9.6 18.35 8.4 15.45 8.4 12S9.6 5.65 12 3.25Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  copy: '<rect x="8.25" y="8.25" width="12" height="12" rx="2.5"/><path d="M15.75 5.5V5a2.25 2.25 0 0 0-2.25-2.25H5A2.25 2.25 0 0 0 2.75 5v8.5A2.25 2.25 0 0 0 5 15.75h.5"/>',
};
const icon = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const GLANCE = ['phone', 'heart', 'shield', 'spark', 'export'];
// "3. Title" -> ['03', 'Title']
const split = t => { const m = /^(\d+)\.\s*(.+)$/.exec(t); return m ? [m[1].padStart(2, '0'), m[2]] : ['', t]; };
const body = s => (s.paragraphs ?? []).map(p => `<p>${prose(p)}</p>`).join('') +
  (s.bullets ? '<ul>' + s.bullets.map(b => `<li>${prose(b)}</li>`).join('') + '</ul>' : '');
const heading = t => { const [n, x] = split(t); return `<h2>${n ? `<span class="num">${n}</span>` : ''}<span>${esc(x)}</span></h2>`; };
const docSections = list => list.map(s => s.id === 'summary'
  ? `<section id="summary" class="glance"><h2><span>${esc(s.title)}</span></h2><ul class="glance-grid">` +
    s.bullets.map((b, i) => `<li>${icon(GLANCE[i] ?? 'shield', 'glance-icon')}<p>${prose(b)}</p></li>`).join('') + '</ul></section>'
  : `<section id="${s.id}" class="doc-section">${heading(s.title)}<div class="prose">${body(s)}</div></section>`).join('\n');
const tocLinks = list => list.map(s => { const [n, x] = split(s.title); return `<a href="#${s.id}" data-toc="${s.id}">${n ? `<span class="num">${n}</span>` : '<span class="num dot">•</span>'}<span>${esc(x)}</span></a>`; }).join('');

function render(l, page) {
  const u = l.ui, code = l.code, r = (c, p) => rel(code, page, c, p), A = r('en', '') + 'assets/';
  const title = page ? u[page] : 'Ippo Care';
  const intro = page ? u[page + 'Intro'] : u.heroLede;
  const nav = `<nav class="nav" aria-label="Ippo Care">` + pages.map(p => `<a href="${r(code, p)}"${p === page ? ' aria-current="page"' : ''}>${esc(u[p])}</a>`).join('') + '</nav>';
  const switcher = `<details class="language"><summary aria-label="Language">${icon('globe')}<span>${esc(l.name)}</span>${icon('chevron', 'i chev')}</summary><div class="language-list">` +
    locales.map(o => `<a href="${r(o.code, page)}" lang="${o.code}" hreflang="${o.code}"${o.code === code ? ' aria-current="true"' : ''}>${esc(o.name)}</a>`).join('') + '</div></details>';
  const header = `<a class="skip" href="#content">${esc(u.skip)}</a>${page && page !== 'support' ? '<div class="progress" aria-hidden="true"><span></span></div>' : ''}` +
    `<header class="bar"><div class="wrap bar-inner"><a class="brand" href="${r(code, '')}"><img src="${A}icon-128.png" width="28" height="28" alt="">Ippo Care</a>${nav}${switcher}</div></header>`;
  const footer = `<footer class="foot"><div class="wrap"><div class="foot-grid"><div class="foot-brand"><a class="brand" href="${r(code, '')}"><img src="${A}icon-128.png" width="28" height="28" alt="">Ippo Care</a><p>${esc(u.tagline)}</p></div>` +
    `<div class="foot-links"><p>Ippo Care</p>${pages.map(p => `<a href="${r(code, p)}">${esc(u[p])}</a>`).join('')}</div>` +
    `<div class="foot-links"><p>Apple</p><a href="${EULA}" rel="noreferrer">${esc(u.appleEula)}</a><a href="https://www.apple.com/legal/privacy/" rel="noreferrer">${esc(u.applePrivacy)}</a></div>` +
    `<div class="foot-links"><p>${esc(u.contact)}</p><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${REPO}/commits/main" rel="noreferrer">${esc(u.history)} ↗</a></div></div>` +
    `<div class="foot-note"><p>${esc(u.integrity)} ${esc(u.languageNote)}</p><p>© 2026 ${esc(u.copyright)}</p></div></div></footer>`;
  const alternates = locales.map(o => `<link rel="alternate" hreflang="${o.code}" href="${ORIGIN}/${path(o.code, page)}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/${path('en', page)}">`;
  const head = `<!doctype html>
<html lang="${code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#faf7f3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#121110" media="(prefers-color-scheme: dark)"><meta name="description" content="${esc(intro)}"><title>${page ? `${esc(title)} · Ippo Care` : `Ippo Care · ${esc(u.tagline)}`}</title><link rel="canonical" href="${ORIGIN}/${path(code, page)}">${alternates}<link rel="stylesheet" href="${A}style.css"><link rel="icon" type="image/png" sizes="32x32" href="${A}icon-32.png"><link rel="apple-touch-icon" href="${A}icon-180.png"><meta property="og:title" content="${page ? `${esc(title)} · Ippo Care` : `Ippo Care · ${esc(u.tagline)}`}"><meta property="og:description" content="${esc(intro)}"><meta property="og:image" content="${ORIGIN}/assets/icon-512.png"><script src="${A}site.js" defer></script></head>`;
  const shot = (name, cls, eager = false) => `<div class="phone ${cls}"><img src="${A}shots/${code}/${name}.webp" width="640" height="1391" alt="${esc(u.shotAlt[name])}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;

  if (!page) {
    const hero = `<section class="home-hero"><div class="wrap home-hero-grid"><div class="home-hero-copy">` +
      `<p class="eyebrow"><img src="${A}icon-128.png" width="22" height="22" alt="">${esc(u.heroEyebrow)}</p>` +
      `<h1>${esc(u.tagline)}</h1><p class="lede">${esc(u.heroLede)}</p>` +
      `<ul class="facts">${u.heroFacts.map(f => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>` +
      `<div class="actions"><a class="btn primary" href="${r(code, 'privacy')}">${esc(u.ctaPrivacy)}</a><a class="btn ghost" href="${r(code, 'support')}">${esc(u.ctaSupport)}</a></div></div>` +
      `<div class="phones">${shot('city', 'back left')}${shot('today', 'front', true)}${shot('assistant', 'back right')}</div></div></section>`;
    const [lead, ...rest] = u.noteBody;
    const note = `<section class="note" aria-labelledby="note-title"><div class="wrap note-grid"><div class="note-head"><p class="eyebrow plain">${esc(u.noteEyebrow)}</p><h2 id="note-title">${esc(u.noteTitle)}</h2>` +
      `<div class="signature"><span class="monogram" aria-hidden="true">YW</span><span><strong>${esc(u.noteSign)}</strong><em>${esc(u.noteRole)}</em></span></div></div>` +
      `<blockquote class="note-body"><p class="note-lead">${esc(lead)}</p>${rest.map(p => `<p>${esc(p)}</p>`).join('')}</blockquote></div></section>`;
    const data = `<section class="data" aria-labelledby="data-title"><div class="wrap data-grid"><div class="data-copy"><h2 id="data-title">${esc(u.dataTitle)}</h2><ul class="pillars">` +
      u.highlights.map(([t, x], i) => `<li><span class="pillar-icon">${icon(['phone', 'shield', 'spark'][i])}</span><span><strong>${esc(t)}</strong><span>${esc(x)}</span></span></li>`).join('') +
      `</ul><a class="text-link" href="${r(code, 'privacy')}">${esc(u.ctaPrivacy)}${icon('arrow')}</a></div>${shot('health', 'solo')}</div></section>`;
    const docs = `<section class="docs" aria-labelledby="docs-title"><div class="wrap"><h2 id="docs-title">${esc(u.docsTitle)}</h2><div class="doc-cards">` +
      [['privacy', 'shield'], ['terms', 'scale'], ['support', 'heart']].map(([p, ic]) => `<a class="doc-card" href="${r(code, p)}"><span class="doc-card-icon">${icon(ic)}</span><strong>${esc(u[p])}</strong><span>${esc(u[p + 'Intro'])}</span><em>${esc(u.read)}${icon('arrow')}</em></a>`).join('') +
      `</div><p class="docs-contact">${esc(u.contact)} · <a href="mailto:${EMAIL}">${EMAIL}</a></p></div></section>`;
    return head + `<body class="page-home">${header}<main id="content">${hero}${note}${data}${docs}</main>${footer}</body></html>\n`;
  }

  const heroIcon = { privacy: 'shield', terms: 'scale', support: 'heart' }[page];
  const meta = page === 'support'
    ? `<p class="meta"><span class="live" aria-hidden="true"></span>${esc(u.reply)}</p>`
    : `<p class="meta"><span>${esc(u.updated)} <time datetime="${UPDATED}">${UPDATED}</time></span><span>${esc(u.effective)} <time datetime="${UPDATED}">${UPDATED}</time></span><span>${esc(u.provider)} Yusen Wang</span></p>`;
  const top = `<div class="doc-hero"><div class="wrap"><p class="eyebrow"><span class="eyebrow-icon">${icon(heroIcon)}</span><a href="${r(code, '')}">Ippo Care</a><span aria-hidden="true">/</span><span>${esc(u[page])}</span></p>` +
    `<h1>${esc(u[page])}</h1><p class="lede">${esc(intro)}</p>${meta}</div></div>`;

  let main;
  if (page === 'support') {
    const [contact, ...rest] = l.support, policies = rest.pop();
    const card = `<section class="contact-card" id="contact" aria-labelledby="contact-title"><div class="contact-copy"><h2 id="contact-title">${esc(contact.title)}</h2>${contact.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>` +
      `<div class="contact-actions"><a class="btn primary" href="mailto:${EMAIL}">${icon('mail')}<span>${esc(u.emailUs)}</span></a><button class="btn ghost" type="button" data-copy="${EMAIL}" data-done="${esc(u.copied)}">${icon('copy')}<span>${EMAIL}</span></button></div></section>`;
    const faq = `<section class="faq" id="faq" aria-labelledby="faq-title"><h2 id="faq-title">${esc(u.faq)}</h2><div class="faq-list">` +
      rest.map((s, i) => `<details class="qa" id="q${i + 1}"${i === 0 ? ' open' : ''}><summary><span>${esc(s.title)}</span><span class="plus" aria-hidden="true"></span></summary><div class="prose">${body(s)}</div></details>`).join('') + '</div></section>';
    const docs = `<section class="related" aria-labelledby="related-title"><h2 id="related-title">${esc(policies.title)}</h2><div class="doc-cards three">` +
      [['privacy', 'shield', r(code, 'privacy'), u.privacyIntro], ['terms', 'scale', r(code, 'terms'), u.termsIntro]].map(([p, ic, href, t]) => `<a class="doc-card" href="${href}"><span class="doc-card-icon">${icon(ic)}</span><strong>${esc(u[p])}</strong><span>${esc(t)}</span><em>${esc(u.read)}${icon('arrow')}</em></a>`).join('') +
      `<a class="doc-card" href="${EULA}" rel="noreferrer"><span class="doc-card-icon">${icon('apple')}</span><strong>${esc(u.appleEula)}</strong><span>${esc(policies.paragraphs[0])}</span><em>${esc(u.read)}${icon('arrow')}</em></a></div></section>`;
    main = `<main id="content" class="wrap support-main">${card}${faq}${docs}</main>`;
  } else {
    const list = l[page];
    main = `<main id="content" class="wrap doc"><aside class="toc" aria-label="${esc(u.contents)}"><p class="toc-title">${esc(u.contents)}</p><nav>${tocLinks(list)}</nav></aside>` +
      `<details class="toc-mobile"><summary><span class="toc-title">${esc(u.contents)}</span><span class="toc-current" data-current></span>${icon('chevron', 'i chev')}</summary><nav>${tocLinks(list)}</nav></details>` +
      `<article class="doc-body">${docSections(list)}</article></main>`;
  }
  return head + `<body class="page-${page}">${header}${top}${main}<a class="to-top" href="#content" aria-label="${esc(u.backToTop)}">${icon('up')}</a>${footer}</body></html>\n`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT,'assets'), { recursive: true });
writeFileSync(join(OUT,'assets','style.css'), readFileSync('src/style.css', 'utf8'));
writeFileSync(join(OUT,'assets','site.js'), readFileSync('src/site.js', 'utf8'));
for (const n of [32, 128, 180, 512]) writeFileSync(join(OUT, 'assets', `icon-${n}.png`), readFileSync(`src/img/icon-${n}.png`));
for (const c of codes) { mkdirSync(join(OUT, 'assets', 'shots', c), { recursive: true }); for (const n of ['today', 'city', 'assistant', 'health']) writeFileSync(join(OUT, 'assets', 'shots', c, `${n}.webp`), readFileSync(`src/img/shots/${c}/${n}.webp`)); }
writeFileSync(join(OUT,'.nojekyll'), '');
let count = 0;
for (const l of locales) for (const page of ['', ...pages]) {
  const folder = join(OUT, path(l.code, page));
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.html'), render(l, page)); count++;
}
// /en/<page>/ aliases redirect to the English default routes, so every language has /<lang>/<page>/.
const redirect = to => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"><title>Ippo Care</title></head><body><a href="${to}">${to}</a></body></html>\n`;
for (const page of ['', ...pages]) {
  const folder = join(OUT, 'en', page);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.html'), redirect(`${ORIGIN}/${path('en', page)}`));
}
writeFileSync(join(OUT,'404.html'), redirect(`${ORIGIN}/`));
console.log(JSON.stringify({ pages: count, languages: codes }));
