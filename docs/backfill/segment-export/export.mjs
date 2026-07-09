// S60 Steg 4 — material-listor + Skool-union → CSV. READ-ONLY mot basen.
// Bygger på segment-export.json (källäst ur Deltaganden, {Närvaropoäng}=1).
//
// Marcus-kvitterade justeringar (2026-07-09):
//   · 2 testkonton exkluderas (highfive-dubbletten + inbox@marcusemails.com)
//   · Ulrika Arvas (rec3ERFZfQnMwMym6): Person.E-post tom i basen → adress hämtad
//     ur hennes Event-21-anmälan; bas-defekt registrerad till T16
//   · Ann-Marie Martinsson: ingen e-post någonstans → ingen inbjudan (noterad)
//   · RIM 3: inget event genomfört → listan existerar inte (väntat, ADR-064)

import fs from 'node:fs';

// ÄKTA testartefakter (fälla 44 / testkonton.md): identifierade via ORPHAN-egenskapen
// + roll-matrisen — ALDRIG via adress-match. Marcus riktiga deltagar-records
// (rectU34rbPfo6VD10 = Psionautics, reczBItiZhCLlE2Cs = FS/RIM1/RIM2) hör INTE hit:
// han är en riktig, betalande deltagare. Deras orphan-Delt bär noll närvaropoäng och
// faller därför ur källfrågan av sig själva.
const TESTKONTON = new Map([
  ['recIynU41be2DcYup', 'marcus@h5gruppen.se — testpersona, 0 anmälningar, 22 orphans'],
  ['rec3iFLEHuRHl1QZH', 'test-kalla-delete@example.com — ren testrad'],
]);
// Tom: Ulrikas Person bär numera sin adress i basen (dubbletten konsoliderad).
const EPOST_OVERRIDE = new Map();

const data = JSON.parse(fs.readFileSync(new URL('./segment-export.json', import.meta.url), 'utf8'));

const epost = (p) => EPOST_OVERRIDE.get(p.id) ?? p.email ?? null;
const arTest = (p) => TESTKONTON.has(p.id);
const nyckel = (p) => epost(p).trim().toLowerCase();

// Dedup-vid-utskick på normaliserad e-post (segment-arkitektur.md). Krävs på
// riktigt: Ulrika Arvas bär TVÅ Person-records (fälla 40 — Event-17-anmälan
// saknade e-post → A2 matchade inte → dubblett), ett per material. Hon ska ha
// båda materialen men EN inbjudan.
function dedupa(personer) {
  const sedda = new Map();
  for (const p of personer) if (!sedda.has(nyckel(p))) sedda.set(nyckel(p), p);
  return [...sedda.values()];
}

const csv = (rader) =>
  ['email,namn,person_id', ...rader.map((p) => {
    const namn = (p.namn ?? '').trim();
    const rent = /^ej tillgängligt$/i.test(namn) ? '' : namn;
    return `${nyckel(p)},"${rent.replaceAll('"', '""')}",${p.id}`;
  })].join('\n') + '\n';

const slug = (s) =>
  s.toLowerCase().replaceAll('å', 'a').replaceAll('ä', 'a').replaceAll('ö', 'o')
    .replaceAll(' ', '-').replace(/[^a-z0-9-]/g, '');

console.log('── MATERIAL-LISTOR (test exkluderade, e-post-krav) ──\n');
const utanEpost = [];
for (const lista of data.listor) {
  const kvar = lista.personer.filter((p) => !arTest(p));
  const mailbara = kvar.filter((p) => epost(p));
  for (const p of kvar) if (!epost(p)) utanEpost.push({ ...p, kurs: lista.kurs });
  const mottagare = dedupa(mailbara);

  const namnlosa = mottagare.filter((p) => /^ej tillgängligt$/i.test((p.namn ?? '').trim())).length;
  const fil = `lista-${slug(lista.kurs)}.csv`;
  fs.writeFileSync(new URL(`./${fil}`, import.meta.url), csv(mottagare));

  console.log(`${lista.kurs}`);
  console.log(`  ${lista.personer.length} i källan → ${mottagare.length} mottagare` +
    `  (test: -${lista.personer.length - kvar.length}, utan e-post: -${kvar.length - mailbara.length}` +
    `, dedup: -${mailbara.length - mottagare.length})`);
  console.log(`  utan namn i basen: ${namnlosa}/${mottagare.length}   → ${fil}\n`);
}

// Skool-union = ≥1 utbildnings-par.
const unionKvar = data.skoolUnion.filter((p) => !arTest(p));
const unionMail = unionKvar.filter((p) => epost(p));
const unionMottagare = dedupa(unionMail);
fs.writeFileSync(new URL('./lista-skool-union.csv', import.meta.url), csv(unionMottagare));

const unika = new Set(unionMottagare.map(nyckel));

console.log('── SKOOL-UNION (access-grant) ──');
console.log(`  ${data.skoolUnion.length} i källan → ${unionMottagare.length} mottagare` +
  `  (test: -${data.skoolUnion.length - unionKvar.length}, utan e-post: -${unionKvar.length - unionMail.length}` +
  `, dedup: -${unionMail.length - unionMottagare.length})`);
console.log(`  unika normaliserade adresser: ${unika.size}  ${unika.size === unionMottagare.length ? '✓ 1:1, inga dubbletter' : '⚠️  DUBBLETTER KVAR'}`);
console.log(`  utan namn i basen: ${unionMottagare.filter((p) => /^ej tillgängligt$/i.test((p.namn ?? '').trim())).length}/${unionMottagare.length}`);
console.log('  → lista-skool-union.csv\n');

console.log('── EXKLUDERADE ──');
for (const [id, vad] of TESTKONTON) console.log(`  test:        ${id}  ${vad}`);
for (const p of utanEpost) console.log(`  ingen e-post: ${p.id}  ${p.namn} (${p.kurs})`);
if (EPOST_OVERRIDE.size) for (const [id, e] of EPOST_OVERRIDE) console.log(`\n  e-post-override: ${id} → ${e}`);
