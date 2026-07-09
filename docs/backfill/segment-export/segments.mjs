// Segment-export S60 Steg 4 — READ-ONLY.
// Replikerar EF:ns kanoniska källfråga exakt (segment-resolution.ts):
//   Deltaganden, filterByFormula {Närvaropoäng}=1,
//   fields: Person (länk) | Kursnamn (lookup) | Event typ
// Algebra: computeMembership (segment-membership.ts) — par-set per person,
// include=OR, dedup gratis via Set (Dag 1 + Dag 2 kollapsar).
// Ingen rollup läses (fälla 32: 'Fjärrskådning ×' blandar Utbildning+Föreläsning).

const KEY = process.env.AIRTABLE_API_KEY;
const BASE = 'app8uGPrVCVOm6LfD';
const SOURCE_FIELDS = ['Person (länk)', 'Kursnamn (lookup)', 'Event typ'];
const PERSON_FIELDS = ['Namn', 'E-post', 'Ej godkänd för mailutskick'];
const MODALITETER = ['Utbildning', 'Föreläsning'];
const PERSON_BATCH_SIZE = 50;

const warnings = [];

async function fetchAll(table, { filterByFormula, fields }) {
  const out = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`);
    if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);
    for (const f of fields) url.searchParams.append('fields[]', f);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!res.ok)
      throw new Error(`${table} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    out.push(...json.records);
    offset = json.offset;
  } while (offset);
  return out;
}

// scalarString-disciplinen: varna vid >1, aldrig tyst array-drop.
function scalar(value, label, recId) {
  if (!Array.isArray(value)) return typeof value === 'string' ? value : null;
  if (value.length > 1) warnings.push(`${recId}: ${label} har ${value.length} värden → tog första`);
  return value.length > 0 && typeof value[0] === 'string' ? value[0] : null;
}

const raw = await fetchAll('Deltaganden', {
  filterByFormula: '{Närvaropoäng}=1',
  fields: SOURCE_FIELDS,
});

let skipped = 0;
const rows = [];
for (const r of raw) {
  const personId = scalar(r.fields['Person (länk)'], 'Person (länk)', r.id);
  const kurs = scalar(r.fields['Kursnamn (lookup)'], 'Kursnamn (lookup)', r.id);
  const modalitet = scalar(r.fields['Event typ'], 'Event typ', r.id);
  if (!personId || !kurs || !MODALITETER.includes(modalitet)) {
    skipped++;
    continue;
  }
  rows.push({ personId, kurs, modalitet });
}

// Par-set per person (Set ⇒ Dag1+Dag2 kollapsar).
const byPerson = new Map();
for (const { personId, kurs, modalitet } of rows) {
  if (!byPerson.has(personId)) byPerson.set(personId, new Set());
  byPerson.get(personId).add(`${kurs}|${modalitet}`);
}

// Enumerera distinkta par ur DATAN (öppen taxonomi, ADR-064 beslut 2).
const parCount = new Map();
for (const set of byPerson.values())
  for (const k of set) parCount.set(k, (parCount.get(k) ?? 0) + 1);

// Material-listor = ett per Utbildnings-par. Föreläsning ger inget material.
const utbildningsPar = [...parCount.keys()].filter((k) => k.endsWith('|Utbildning')).sort();

const listor = utbildningsPar.map((par) => ({
  par,
  kurs: par.split('|')[0],
  personIds: [...byPerson.entries()].filter(([, set]) => set.has(par)).map(([id]) => id),
}));

// Skool-union = ≥1 utbildnings-par.
const unionIds = [...byPerson.entries()]
  .filter(([, set]) => utbildningsPar.some((p) => set.has(p)))
  .map(([id]) => id);

// Berikning (chunkad, ≤50 per filter — get-attendance-mall, noll N+1).
const allIds = [...new Set([...unionIds])];
const byId = new Map();
for (let i = 0; i < allIds.length; i += PERSON_BATCH_SIZE) {
  const c = allIds.slice(i, i + PERSON_BATCH_SIZE);
  const recs = await fetchAll('Personer', {
    filterByFormula: `OR(${c.map((r) => `RECORD_ID()='${r}'`).join(',')})`,
    fields: PERSON_FIELDS,
  });
  for (const r of recs) byId.set(r.id, r.fields);
}

const person = (id) => {
  const f = byId.get(id) ?? {};
  return {
    id,
    namn: scalar(f['Namn'], 'Namn', id),
    email: scalar(f['E-post'], 'E-post', id),
    ejGodkandMail: f['Ej godkänd för mailutskick'] === true,
  };
};

// ── Rapport ────────────────────────────────────────────────────────────────
console.log(`Deltaganden med Närvaropoäng=1: ${raw.length}  (hoppade: ${skipped})`);
console.log(`Distinkta personer med närvaro: ${byPerson.size}`);
console.log(`\nAlla distinkta par i närvaro-datan (personer per par):`);
for (const [par, n] of [...parCount.entries()].sort((a, b) => b[1] - a[1])) {
  const mod = par.split('|')[1];
  console.log(
    `  ${n.toString().padStart(4)}  ${par}${mod === 'Föreläsning' ? '   ← inget material' : ''}`,
  );
}

console.log(`\n── ${listor.length} MATERIAL-LISTOR (utbildnings-gated, deduplicerade) ──`);
for (const l of listor) {
  const ppl = l.personIds.map(person);
  const utanMail = ppl.filter((p) => !p.email).length;
  const ejGodkand = ppl.filter((p) => p.ejGodkandMail).length;
  console.log(
    `  ${l.kurs.padEnd(24)} ${ppl.length.toString().padStart(4)} personer` +
      `  (utan e-post: ${utanMail}, "ej godkänd för mailutskick": ${ejGodkand})`,
  );
}

const unionPpl = unionIds.map(person);
const unikaMail = new Set(
  unionPpl.map((p) => (p.email ?? '').trim().toLowerCase()).filter(Boolean),
);
console.log(
  `\nSkool-union (≥1 utbildnings-par): ${unionIds.length} personer, ` +
    `${unikaMail.size} unika normaliserade e-postadresser, ${unionPpl.filter((p) => !p.email).length} utan e-post`,
);

// Överlapp: hur många par per person
const fordelning = new Map();
for (const id of unionIds) {
  const n = utbildningsPar.filter((p) => byPerson.get(id).has(p)).length;
  fordelning.set(n, (fordelning.get(n) ?? 0) + 1);
}
console.log(`Överlapp (antal material per person):`);
for (const [n, c] of [...fordelning.entries()].sort())
  console.log(`  ${n} material: ${c} personer`);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} data-form-varningar:`);
  for (const w of warnings.slice(0, 10)) console.log(`  ${w}`);
}

// Dubblett-e-post (samma normaliserade adress, olika Person-record) — fälla 40-klassen.
const mailToIds = new Map();
for (const p of unionPpl) {
  if (!p.email) continue;
  const k = p.email.trim().toLowerCase();
  if (!mailToIds.has(k)) mailToIds.set(k, []);
  mailToIds.get(k).push(p);
}
const dubbletter = [...mailToIds.entries()].filter(([, v]) => v.length > 1);
if (dubbletter.length) {
  console.log(`\n⚠️  ${dubbletter.length} normaliserade e-postadresser bärs av >1 Person-record:`);
  for (const [mail, ppl] of dubbletter)
    console.log(`  ${mail} → ${ppl.map((p) => `${p.namn} (${p.id})`).join(' | ')}`);
} else {
  console.log(`\n✓ Inga dubblett-e-poster bland union-personerna.`);
}

const fs = await import('node:fs');
fs.writeFileSync(
  new URL('./segment-export.json', import.meta.url),
  JSON.stringify(
    {
      genereratFran: 'Deltaganden {Närvaropoäng}=1 (källäst, ej rollup)',
      parIDatan: Object.fromEntries(parCount),
      listor: listor.map((l) => ({ kurs: l.kurs, par: l.par, personer: l.personIds.map(person) })),
      skoolUnion: unionPpl,
    },
    null,
    2,
  ),
);
console.log(`\n→ Full data: scratchpad/segment-export.json`);
