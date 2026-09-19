#!/usr/bin/env node
// Steg 4: bygger banken (per-klass-tabeller, filkarta, frekvenstabeller)
// PROGRAMMATISKT ur steg2-matchade-meddelanden-topp25.json +
// steg3-klassificering.mjs — aldrig genom att skriva av citat för hand.
// Detta garanterar verbatim-kravet: citat-texten kommer alltid direkt ur
// källdatan, aldrig genom mänsklig omskrivning.

import fs from 'node:fs';
import path from 'node:path';
import { CLASSIFICATION, FILE_SESSION } from './steg3-klassificering.mjs';

const DIR = path.dirname(new URL(import.meta.url).pathname);
const data = JSON.parse(
  fs.readFileSync(path.join(DIR, 'steg2-matchade-meddelanden-topp25.json'), 'utf8'),
);
const ranking = JSON.parse(
  fs.readFileSync(path.join(DIR, 'steg1-ranking-alla-filer.json'), 'utf8'),
);
const rankingByFile = Object.fromEntries(ranking.map((r) => [r.fileId, r]));

const CLASS_NAMES = {
  SKB: 'sidkrom-bredd',
  KG: 'kortgeometri',
  KN: 'knappar',
  TH: 'typografi-hierarki',
  FT: 'farg-token',
  CH: 'copy-hjalptext',
  FP: 'fixtur-prototyptext',
  KA: 'komponent-aterbruk',
  KS: 'konsekvens-syskonvy',
  BI: 'beteende-interaktion',
  LK: 'laddkansla',
  PR: 'process',
  AN: 'annat',
};
const CLASS_ORDER = Object.keys(CLASS_NAMES);

// Sortera kronologiskt och tilldela T-ID.
const enriched = data
  .map((m) => {
    const key = `${m.fileId}__${m.timestamp}`;
    const cls = CLASSIFICATION[key];
    if (!cls) throw new Error(`Saknar klassificering för ${key}`);
    return {
      fileId: m.fileId,
      fileShort: m.fileId.slice(0, 8),
      session: FILE_SESSION[m.fileId] || '?',
      ts: m.timestamp,
      hits: m.hits,
      words: Object.keys(m.perWord),
      text: m.text,
      classes: cls.classes,
      tolkning: cls.tolkning,
    };
  })
  .sort((a, b) => a.ts.localeCompare(b.ts));

enriched.forEach((r, i) => {
  r.id = `T-${String(i + 1).padStart(3, '0')}`;
});

fs.writeFileSync(path.join(DIR, 'steg4-bank.json'), JSON.stringify(enriched, null, 2));

// ---------- Hjälpfunktioner för markdown-tabellrender ----------
function escapeCell(s) {
  // TASK-461 (CodeQL js/incomplete-sanitization #12): backslashen måste
  // escapas FÖRE pipen — annars kolliderar en redan befintlig `\` i
  // citat-texten med escape-backslashen `\|` denna funktion själv lägger
  // till, och resultatet blir felaktigt (en till synes escapad pipe som
  // Markdown ändå kan tolka som kolumn-avgränsare). Ordningen är
  // avsiktlig: `\` → `\\` FÖRST, sedan `|` → `\|`.
  let out = s.replace(/\\/g, '\\\\');
  out = out.replace(/\|/g, '\\|');
  // Bara URL:er (MD034) fälls annars — omslut med <...> (CommonMark-
  // autolink-syntax). Detta ändrar INTE den lästa texten (URL:en visas
  // identisk), det är strukturell markdown-markup, inte en textändring —
  // samma princip som pipe-escapen ovan.
  out = out.replace(/(?<!<)(https?:\/\/[^\s"<>]+)(?!>)/g, '<$1>');
  return out;
}
function newlinesToBr(s) {
  return s.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
}
function renderQuote(text) {
  const escaped = newlinesToBr(escapeCell(text));
  if (text.length > 600) {
    return `<details><summary>Visa citat i sin helhet (${text.length} tecken)</summary><br>${escaped}</details>`;
  }
  return escaped;
}
function fmtTs(ts) {
  // 2026-08-22T09:52:32.346Z -> 2026-08-22 09:52:32Z
  return ts.replace('T', ' ').replace(/\.\d+Z$/, 'Z');
}

// ---------- Filkarta ----------
const fileIds = [...new Set(enriched.map((r) => r.fileId))];
// Behåll rangordningen (mest designtäta filen först) som i Steg 1.
fileIds.sort((a, b) => {
  const ra = rankingByFile[a]?.designWordHits || 0;
  const rb = rankingByFile[b]?.designWordHits || 0;
  return rb - ra;
});

let filkarta =
  '| Fil-id | Session | Tidsspann (första–sista människomeddelande) | Designmeddelanden (denna fil) | Ordträffar totalt |\n';
filkarta += '|---|---|---|---|---|\n';
for (const fid of fileIds) {
  const r = rankingByFile[fid];
  const session = FILE_SESSION[fid];
  const count = enriched.filter((e) => e.fileId === fid).length;
  filkarta += `| \`${fid.slice(0, 8)}\` | ${session} | ${fmtTs(r.firstTs)} – ${fmtTs(r.lastTs)} | ${count} | ${r.designWordHits} |\n`;
}
fs.writeFileSync(path.join(DIR, 'gen-filkarta.md'), filkarta);

// ---------- Per-klass-tabeller ----------
let bankMd = '<!-- markdownlint-disable MD033 -->\n\n';
for (const code of CLASS_ORDER) {
  const rows = enriched.filter((r) => r.classes.includes(code));
  bankMd += `### ${CLASS_NAMES[code]} (\`${code}\`) — ${rows.length} meddelanden\n\n`;
  if (rows.length === 0) {
    bankMd += '_Inga meddelanden klassade i denna kategori._\n\n';
    continue;
  }
  bankMd += '| ID | Fil-id | Tidsstämpel | Citat (verbatim) | Tolkning |\n';
  bankMd += '|---|---|---|---|---|\n';
  for (const r of rows) {
    bankMd += `| ${r.id} | \`${r.fileShort}\` | ${fmtTs(r.ts)} | ${renderQuote(r.text)} | ${escapeCell(r.tolkning)} |\n`;
  }
  bankMd += '\n';
}
bankMd += '<!-- markdownlint-enable MD033 -->\n';
fs.writeFileSync(path.join(DIR, 'gen-bank.md'), bankMd);

// ---------- Frekvens per klass ----------
let freqClass = '| Klass | Antal meddelanden |\n|---|---|\n';
for (const code of CLASS_ORDER) {
  const count = enriched.filter((r) => r.classes.includes(code)).length;
  freqClass += `| ${CLASS_NAMES[code]} (\`${code}\`) | ${count} |\n`;
}
fs.writeFileSync(path.join(DIR, 'gen-frekvens-klass.md'), freqClass);

// ---------- Frekvens per fil (antal klassade meddelanden + dominant klass) ----------
let freqFile = '| Fil-id | Session | Meddelanden | Vanligaste klass(er) |\n|---|---|---|---|\n';
for (const fid of fileIds) {
  const rows = enriched.filter((r) => r.fileId === fid);
  const classCounts = {};
  for (const r of rows) {
    for (const c of r.classes) classCounts[c] = (classCounts[c] || 0) + 1;
  }
  const sorted = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
  const top = sorted
    .slice(0, 3)
    .map(([c, n]) => `${CLASS_NAMES[c]} (${n})`)
    .join(', ');
  freqFile += `| \`${fid.slice(0, 8)}\` | ${FILE_SESSION[fid]} | ${rows.length} | ${top} |\n`;
}
fs.writeFileSync(path.join(DIR, 'gen-frekvens-fil.md'), freqFile);

console.log('Klart.');
console.log('Totalt antal meddelanden:', enriched.length);
console.log('Per klass:');
for (const code of CLASS_ORDER) {
  console.log(' ', CLASS_NAMES[code], '=', enriched.filter((r) => r.classes.includes(code)).length);
}
console.log('Filer:', fileIds.length);
console.log(
  'Genererade filer: gen-filkarta.md, gen-bank.md, gen-frekvens-klass.md, gen-frekvens-fil.md, steg4-bank.json',
);
