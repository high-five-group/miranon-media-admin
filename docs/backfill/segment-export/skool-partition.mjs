// Skool-leverans: partition över de låsta "Mentala ankare" + Resend-listor.
//
// VARFÖR PARTITION (Marcus empiriska test 2026-07-09): samma adress uppladdad tre
// gånger i Skool gav TRE inbjudningsmail. Skool dedupar inte och sätter åtkomst per
// uppladdning. Med överlappande listor hade de 126 personer som gått flera kurser
// fått flera inbjudningar var. Varje person ska därför ligga i EXAKT en fil.
//
// Segment-modellen i basen är oförändrad (överlappande, källäst, ADR-062/064) —
// det är LEVERANSEN till Skool som partitioneras.
//
// FILFORMAT (Skools egen mall, verifierad mot `test-skool.csv`, 22 bytes):
//   ingen rubrikrad · en adress per rad · INGEN avslutande radbrytning.
//
// Körs efter export.mjs, som producerar lista-*.csv i samma katalog.

import fs from 'node:fs';
import path from 'node:path';

const IN = process.cwd();
const OUT = process.env.SKOOL_OUT ?? path.join(process.env.HOME, 'Downloads', 'skool-export');

// Skools LÅSTA ankare. Psionautics tillagd som 4:e ankare 2026-07-10 (S60 Del 6:
// R&L:s material är på väg) — 'Mentala ankare Psionautics' MÅSTE existera i Skool
// innan uppladdning; sänddagen ligger därför efter ankar-skapandet (INSTRUKTION.md).
const ANKARE = [
  { nyckel: 'FS', fil: 'lista-fjarrskadning.csv', skool: 'Mentala ankare Fjärrskådning' },
  { nyckel: 'RIM1', fil: 'lista-resor-i-medvetandet-1.csv', skool: 'Mentala ankare RIM1' },
  { nyckel: 'RIM2', fil: 'lista-resor-i-medvetandet-2.csv', skool: 'Mentala ankare RIM2' },
  { nyckel: 'PSIO', fil: 'lista-psionautics.csv', skool: 'Mentala ankare Psionautics' },
];

const las = (f) =>
  fs
    .readFileSync(path.join(IN, f), 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .map((rad) => {
      const m = rad.match(/^([^,]+),"(.*)",(rec\w+)$/);
      if (!m) throw new Error(`oparsbar rad i ${f}: ${rad.slice(0, 40)}`);
      return { email: m[1], namn: m[2], id: m[3] };
    });

const union = las('lista-skool-union.csv');
const medlemskap = new Map(ANKARE.map((a) => [a.nyckel, new Set(las(a.fil).map((p) => p.email))]));

// ── Partition: gruppera på exakt kombination av ankare ───────────────────────
const grupper = new Map();
for (const p of union) {
  const nycklar = ANKARE.filter((a) => medlemskap.get(a.nyckel).has(p.email)).map((a) => a.nyckel);
  const id = nycklar.join('+') || 'INGA';
  if (!grupper.has(id)) grupper.set(id, { nycklar, personer: [] });
  grupper.get(id).personer.push(p);
}

const ordnade = [...grupper.entries()].sort((a, b) => b[1].personer.length - a[1].personer.length);

fs.mkdirSync(path.join(OUT, 'skool'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'resend'), { recursive: true });

// Skool-format: naken adresslista, ingen header, ingen trailing newline.
const skoolCsv = (personer) => personer.map((p) => p.email).join('\n');

const rader = ordnade.map(([id, g], i) => {
  const nr = String(i + 1).padStart(2, '0');
  const slug = id === 'INGA' ? 'inga-ankare' : id.toLowerCase().replaceAll('+', '-');
  const fil = `${nr}-${slug}--${g.personer.length}-personer.csv`;
  fs.writeFileSync(path.join(OUT, 'skool', fil), skoolCsv(g.personer));
  const kryss = g.nycklar.length
    ? g.nycklar.map((k) => ANKARE.find((a) => a.nyckel === k).skool).join(' + ')
    : '— inga privata ankare (lämna samtliga okryssade)';
  return { fil, antal: g.personer.length, kryss };
});

// ── Resend: två disjunkta listor efter om namnet finns (fälla 43) ────────────
const harNamn = (p) => p.namn.trim().length > 0;
const med = union.filter(harNamn);
const utan = union.filter((p) => !harNamn(p));
const esc = (s) => s.replaceAll('"', '""');

fs.writeFileSync(
  path.join(OUT, 'resend', 'mail-1-personlig-halsning.csv'),
  `email,fornamn\n${med.map((p) => `${p.email},"${esc(p.namn.split(' ')[0])}"`).join('\n')}\n`,
);
fs.writeFileSync(
  path.join(OUT, 'resend', 'mail-2-namnlos-halsning.csv'),
  `email\n${utan.map((p) => p.email).join('\n')}\n`,
);

// ── Invarianter: fäll hellre än leverera en dubbel-inbjudan ──────────────────
const alla = ordnade.flatMap(([, g]) => g.personer.map((p) => p.email));
const unika = new Set(alla);
const unionSet = new Set(union.map((p) => p.email));
const problem = [];
if (alla.length !== unika.size)
  problem.push(`${alla.length - unika.size} adress(er) i mer än en Skool-fil`);
if (unika.size !== unionSet.size)
  problem.push(`partition (${unika.size}) ≠ union (${unionSet.size})`);
for (const e of unionSet)
  if (!unika.has(e)) problem.push(`saknas i partitionen: ${e.slice(0, 3)}…`);
if (med.length + utan.length !== union.length)
  problem.push('Resend-listorna summerar inte till unionen');

console.log(`SKOOL — ${rader.length} uppladdningar (partition):\n`);
for (const r of rader) console.log(`  ${r.fil.padEnd(44)} → kryssa: ${r.kryss}`);
console.log(`\nRESEND:\n  personlig hälsning: ${med.length}\n  namnlös hälsning:   ${utan.length}`);
console.log(`\n${alla.length} adresser, ${unika.size} unika, union ${unionSet.size}`);

if (problem.length) {
  console.error(`\n⛔ INVARIANTER BRUTNA:\n${problem.map((p) => `   ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('✅ varje person i exakt en Skool-fil; partitionen == unionen');
console.log(`\n→ ${OUT}`);
