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
  const intro = page ? u[page + 'Intro'] : u.privacyIntro;
  const nav = `<nav class="seg" aria-label="Ippo Care">` + pages.map(p => `<a href="${r(code, p)}"${p === page ? ' aria-current="page"' : ''}>${esc(u[p])}</a>`).join('') + '</nav>';
  const switcher = `<details class="language"><summary aria-label="Language">${icon('globe')}<span>${esc(l.name)}</span>${icon('chevron', 'i chev')}</summary><div class="language-list">` +
    locales.map(o => `<a href="${r(o.code, page)}" lang="${o.code}" hreflang="${o.code}"${o.code === code ? ' aria-current="true"' : ''}>${esc(o.name)}</a>`).join('') + '</div></details>';
  const header = `<a class="skip" href="#content">${esc(u.skip)}</a><div class="progress" aria-hidden="true"><span></span></div>` +
    `<header class="bar"><div class="bar-inner"><a class="brand" href="${r(code, '')}"><img src="${A}icon-128.png" width="30" height="30" alt="">Ippo Care</a>${nav}${switcher}</div></header>`;
  const footer = `<footer class="foot"><div class="foot-inner"><div class="foot-brand"><a class="brand" href="${r(code, '')}"><img src="${A}icon-128.png" width="28" height="28" alt="">Ippo Care</a><p>${esc(u.tagline)}</p></div>` +
    `<div class="foot-links"><p>Ippo Care</p>${pages.map(p => `<a href="${r(code, p)}">${esc(u[p])}</a>`).join('')}</div>` +
    `<div class="foot-links"><p>Apple</p><a href="${EULA}" rel="noreferrer">${esc(u.appleEula)}</a><a href="https://www.apple.com/legal/privacy/" rel="noreferrer">${esc(u.applePrivacy)}</a></div>` +
    `<div class="foot-links"><p>${esc(u.contact)}</p><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${REPO}/commits/main" rel="noreferrer">${esc(u.history)} ↗</a></div>` +
    `<div class="foot-note"><p>${esc(u.integrity)}</p><p>${esc(u.languageNote)}</p><p>© 2026 ${esc(u.copyright)}</p></div></div></footer>`;
  const alternates = locales.map(o => `<link rel="alternate" hreflang="${o.code}" href="${ORIGIN}/${path(o.code, page)}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/${path('en', page)}">`;
  const head = `<!doctype html>
<html lang="${code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#fbf8f5" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0d0c0c" media="(prefers-color-scheme: dark)"><meta name="description" content="${esc(intro)}"><title>${esc(title)} · Ippo Care</title><link rel="canonical" href="${ORIGIN}/${path(code, page)}">${alternates}<link rel="stylesheet" href="${A}style.css"><link rel="icon" type="image/png" sizes="32x32" href="${A}icon-32.png"><link rel="apple-touch-icon" href="${A}icon-180.png"><meta property="og:title" content="${esc(title)} · Ippo Care"><meta property="og:description" content="${esc(intro)}"><meta property="og:image" content="${ORIGIN}/assets/icon-512.png"><script src="${A}site.js" defer></script></head>`;

  if (!page) {
    const meta = `<a class="contact" href="mailto:${EMAIL}">${EMAIL} <span aria-hidden="true">↗</span></a>`;
    const main = '<main id="content" class="home"><div class="cards">' + pages.map(p => `<a class="card" href="${r(code, p)}"><strong>${esc(u[p])}</strong><span>${esc(u[p + 'Intro'])}</span><em>${esc(u.read)} →</em></a>`).join('') + '</div>' +
      '<section class="highlights">' + u.highlights.map(([t, x]) => `<div><h3>${esc(t)}</h3><p>${esc(x)}</p></div>`).join('') + '</section></main>';
    return head + `<body class="page-home">${header}<div class="hero landing"><img class="app-icon" src="${A}icon-512.png" width="112" height="112" alt="Ippo Care"><h1>Ippo Care</h1><p class="tagline">${esc(u.tagline)}</p><p class="intro">${esc(u.landingIntro)}</p>${meta}</div>${main}${footer}</body></html>\n`;
  }

  const hero = u[page + 'Hero'].filter(Boolean);
  const heroIcon = { privacy: 'shield', terms: 'scale', support: 'heart' }[page];
  const chips = page === 'support'
    ? `<div class="chips"><span class="chip"><i class="dot-live"></i>${esc(u.reply)}</span></div>`
    : `<div class="chips"><span class="chip"><b>${esc(u.updated)}</b>${UPDATED}</span><span class="chip"><b>${esc(u.effective)}</b>${UPDATED}</span><span class="chip"><b>${esc(u.provider)}</b>Yusen Wang</span><span class="chip">${l[page].filter(s => s.id !== 'summary').length} ${esc(u.sections)}</span></div>`;
  const top = `<div class="doc-hero"><div class="doc-hero-inner"><p class="eyebrow">${icon(heroIcon)}<span>${esc(u[page])}</span></p>` +
    `<h1>${esc(hero[0])}${hero[1] ? `<br><span class="grad">${esc(hero[1])}</span>` : ''}</h1><p class="lede">${esc(intro)}</p>${chips}</div></div>`;

  let main;
  if (page === 'support') {
    const [contact, ...rest] = l.support, policies = rest.pop();
    const card = `<section class="contact-card" id="contact"><div class="contact-copy"><span class="contact-icon">${icon('mail')}</span><h2>${esc(contact.title)}</h2>${contact.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>` +
      `<div class="contact-actions"><a class="btn primary" href="mailto:${EMAIL}">${icon('mail')}<span>${esc(u.emailUs)}</span></a><button class="btn ghost" type="button" data-copy="${EMAIL}" data-done="${esc(u.copied)}">${icon('copy')}<span>${EMAIL}</span></button></div></section>`;
    const faq = `<section class="faq" id="faq"><h2 class="faq-title">${esc(u.faq)}</h2><div class="faq-list">` +
      rest.map((s, i) => `<details class="qa" id="q${i + 1}"${i === 0 ? ' open' : ''}><summary><span>${esc(s.title)}</span><span class="plus" aria-hidden="true"></span></summary><div class="prose">${body(s)}</div></details>`).join('') + '</div></section>';
    const docs = `<section class="policies"><h2 class="faq-title">${esc(policies.title)}</h2><div class="policy-grid">` +
      [['privacy', 'shield', r(code, 'privacy'), u.privacyIntro], ['terms', 'scale', r(code, 'terms'), u.termsIntro]].map(([p, ic, href, t]) => `<a class="policy" href="${href}">${icon(ic)}<strong>${esc(u[p])}</strong><span>${esc(t)}</span>${icon('arrow', 'i go')}</a>`).join('') +
      `<a class="policy" href="${EULA}" rel="noreferrer">${icon('apple')}<strong>${esc(u.appleEula)}</strong><span>${esc(policies.paragraphs[0])}</span>${icon('arrow', 'i go')}</a></div></section>`;
    main = `<main id="content" class="support-main">${card}${faq}${docs}</main>`;
  } else {
    const list = l[page];
    main = `<main id="content" class="doc"><aside class="toc" aria-label="${esc(u.contents)}"><p class="toc-title">${esc(u.contents)}</p><nav>${tocLinks(list)}</nav></aside>` +
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
