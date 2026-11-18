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

const sections = list => list.map(s => `<section${s.id ? ` id="${s.id}"` : ''}><h2>${esc(s.title)}</h2>` +
  (s.paragraphs ?? []).map(p => `<p>${prose(p)}</p>`).join('') +
  (s.bullets ? '<ul>' + s.bullets.map(b => `<li>${prose(b)}</li>`).join('') + '</ul>' : '') + '</section>').join('\n');

function render(l, page) {
  const u = l.ui, code = l.code, r = (c, p) => rel(code, page, c, p);
  const title = page ? u[page] : 'Ippo Care';
  const hero = page ? u[page + 'Hero'] : ['Ippo Care', ''];
  const intro = page ? u[page + 'Intro'] : u.privacyIntro;
  const nav = pages.map(p => `<a href="${r(code, p)}"${p === page ? ' aria-current="page"' : ''}>${esc(u[p])}</a>`).join('');
  const switcher = `<details class="language"><summary>${esc(l.name)}<span aria-hidden="true">⌄</span></summary><div class="language-list">` +
    locales.map(o => `<a href="${r(o.code, page)}" lang="${o.code}" hreflang="${o.code}"${o.code === code ? ' aria-current="true"' : ''}>${esc(o.name)}</a>`).join('') + '</div></details>';
  let main;
  if (!page) {
    main = '<main class="cards" id="content">' + pages.map(p => `<a class="card" href="${r(code, p)}"><strong>${esc(u[p])}</strong><span>${esc(u[p + 'Intro'])}</span></a>`).join('') + '</main>';
  } else if (page === 'support') {
    main = `<main class="support" id="content">${sections(l.support)}</main>`;
  } else {
    const list = l[page];
    main = `<main class="layout" id="content"><aside class="contents" aria-label="${esc(u.contents)}"><p>${esc(u.contents)}</p>` +
      list.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('') + `</aside><article>${sections(list)}</article></main>`;
  }
  const meta = page && page !== 'support'
    ? `<div class="meta"><span>${esc(u.updated)}: ${UPDATED}</span><span>${esc(u.effective)}: ${UPDATED}</span><span>${esc(u.provider)}: Yusen Wang</span></div>`
    : `<a class="contact" href="mailto:${EMAIL}">${EMAIL} <span aria-hidden="true">↗</span></a>`;
  const alternates = locales.map(o => `<link rel="alternate" hreflang="${o.code}" href="${ORIGIN}/${path(o.code, page)}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/${path('en', page)}">`;
  return `<!doctype html>
<html lang="${code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light dark"><meta name="description" content="${esc(intro)}"><title>${esc(title)} · Ippo Care</title><link rel="canonical" href="${ORIGIN}/${path(code, page)}">${alternates}<link rel="stylesheet" href="${r('en', '')}assets/style.css"><link rel="icon" type="image/png" sizes="32x32" href="${r('en', '')}assets/icon-32.png"><link rel="apple-touch-icon" href="${r('en', '')}assets/icon-180.png"><meta property="og:image" content="${ORIGIN}/assets/icon-512.png"></head><body>` +
    `<a class="skip" href="#content">${esc(u.skip)}</a><header class="top"><a class="brand" href="${r(code, '')}"><img class="mark" src="${r('en', '')}assets/icon-128.png" width="36" height="36" alt="" aria-hidden="true">Ippo Care</a><div class="top-actions"><nav aria-label="Ippo Care">${nav}</nav>${switcher}</div></header>` +
    `<div class="hero"><p class="eyebrow">${esc(page ? u[page] : 'Ippo Care')}</p><h1>${hero.filter(Boolean).map(esc).join('<br>')}</h1><p class="intro">${esc(intro)}</p>${meta}</div>${main}` +
    `<div class="note"><p>${esc(u.languageNote)}</p><p>${esc(u.integrity)} <a href="${REPO}/commits/main" rel="noreferrer">${esc(u.history)}</a></p></div>` +
    `<footer><span>© 2026 ${esc(u.copyright)}</span><a href="mailto:${EMAIL}">${esc(u.contact)}</a><a href="${EULA}" rel="noreferrer">${esc(u.appleEula)}</a><a href="https://www.apple.com/legal/privacy/" rel="noreferrer">${esc(u.applePrivacy)}</a></footer></body></html>\n`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT,'assets'), { recursive: true });
writeFileSync(join(OUT,'assets','style.css'), readFileSync('src/style.css', 'utf8'));
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
