// Eta-ifyllningens ESCAPING-halva (TASK-309.4 AC #1: "enhetstest av
// ifyllnad + escaping (api-pure) utan nätverk"). Se `mall-data.test.ts` för
// resolutions-halvan (kopia/standard, agenda, datumformat) — DENNA fil
// bevisar att Airtable-härledd fritext ALDRIG kan injicera HTML/JS in i
// den renderade bilagan, mot de FAKTISKA mallarna, inte en syntetisk
// teststräng.
//
// VARFÖR DENNA FIL INTE IMPORTERAR `_shared/mall-render.ts`: den filen har
// `import { Eta } from 'https://esm.sh/eta@4.6.0'` på första raden — en
// `https://`-specifikation Node/Playwright inte kan resolva (samma
// begränsning `_shared/send-action-email.ts`s filhuvud redan dokumenterar
// för sin `index.ts`-motpart). I stället: samma `eta`-NPM-paket
// (`package.json` devDependency, EXAKT samma pinnade version 4.6.0 som
// esm.sh-importen i mall-render.ts) + SAMMA Eta-konfiguration
// (`autoEscape: true, varName: 'data'`) + de FAKTISKA mallsträngarna ur
// `_shared/mallar/*.html.ts` (rena TS-strängexporter, dual-importable —
// INGEN esm.sh-import i DE filerna). Skulle mall-render.ts:s konfig någon
// gång glida (t.ex. autoEscape av misstag satt till false) skulle DENNA
// fil INTE upptäcka det automatiskt — se `KONFIG-PARITETSNOT` nedan för
// varför det är en accepterad, bokförd gräns snarare än en tyst risk.
//
// MINIMALTESTET SOM GRUNDAR ATT ETA VERKLIGEN AUTOESCAPEAR I DENNA
// RUNTIME-KLASS: samma esm.sh-import kördes SKARPT i en kastbar EF mot
// staging (Deno Edge Runtime) under byggsessionen — se skivans
// slutrapport. Detta test bevisar samma sak för den lokala Node-körningen.

import { expect, test } from '@playwright/test';
import { Eta } from 'eta';
import { bekraftelsebilagaHtml } from '../../supabase/functions/_shared/mallar/bekraftelsebilaga.html';
import { deltagarinformationHtml } from '../../supabase/functions/_shared/mallar/deltagarinformation.html';

// KONFIG-PARITETSNOT: måste hållas manuellt i synk med den Eta-instans
// `_shared/mall-render.ts` skapar (`new Eta({ autoEscape: true, varName:
// 'data' })`). En framtida ändring där ENDAST en av de två platserna
// uppdateras är en känd, obevakad drift-risk — ingen mekanisk grind länkar
// dem (den enda länken är att BÅDA pekar på samma `eta`-version i
// package.json). Bokfört öppet, inte löst i denna skiva.
const eta = new Eta({ autoEscape: true, varName: 'data' });

const FARLIG_STRANG = '<script>alert(1)</script>';

const MINIMAL_BEKRAFTELSE_DATA = {
  kursnamn: FARLIG_STRANG,
  datumTid: 'x',
  plats: 'x',
  pris: 'x',
  anmalningsavgift: 'x',
  visaResterande: false,
  resterandeBelopp: '',
  sistaBetalningsdatum: '',
  beskrivning: [] as string[],
  dagEttAgenda: [] as { text: string; tid: string; meditation: boolean }[],
  dagTvaAgenda: [] as { text: string; tid: string; meditation: boolean }[],
};

const MINIMAL_DELTAGARINFO_DATA = {
  kursnamn: 'x',
  datumTid: 'x',
  plats: 'x',
  forberedelser: null as string | null,
  klader: null as string | null,
  tagMed: null as string | null,
  rokning: null as string | null,
  parfym: null as string | null,
  mat: null as string | null,
  overnattning: null as string | null,
  parkering: null as string | null,
  transport: null as string | null,
  utrustning: null as string | null,
};

test.describe('Escaping — Airtable-härledd fritext kan aldrig injicera HTML (ADR-125 § 4)', () => {
  test('bekraftelsebilaga.html: kursnamn escapeas, ingen rå <script> i utdatan', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, MINIMAL_BEKRAFTELSE_DATA) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });

  test('bekraftelsebilaga.html: agenda-punktens text escapeas (loop + villkor)', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, {
      ...MINIMAL_BEKRAFTELSE_DATA,
      dagEttAgenda: [{ text: FARLIG_STRANG, tid: '', meditation: false }],
    }) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });

  test('bekraftelsebilaga.html: beskrivningsstycket escapeas', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, {
      ...MINIMAL_BEKRAFTELSE_DATA,
      beskrivning: [FARLIG_STRANG],
    }) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });

  test('deltagarinformation.html: ämnesstyckets text escapeas', () => {
    const html = eta.renderString(deltagarinformationHtml, {
      ...MINIMAL_DELTAGARINFO_DATA,
      forberedelser: FARLIG_STRANG,
    }) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });
});

test.describe('Ifyllnad — mallens villkor och loopar (samma AC #1, "ifyllnad"-halvan mot den RIKTIGA mallen)', () => {
  test('bekraftelsebilaga.html: visaResterande=false utelämnar hela meningen', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, MINIMAL_BEKRAFTELSE_DATA) as string;
    expect(html).not.toContain('betalas senast');
  });

  test('bekraftelsebilaga.html: visaResterande=true skriver ut beloppet och datumet', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, {
      ...MINIMAL_BEKRAFTELSE_DATA,
      visaResterande: true,
      resterandeBelopp: '1500:-',
      sistaBetalningsdatum: '17 oktober 2026',
    }) as string;
    expect(html).toContain('Resterande 1500:- betalas senast 17 oktober 2026');
  });

  test('bekraftelsebilaga.html: tom beskrivning-array renderar ingen .brodtext', () => {
    const html = eta.renderString(bekraftelsebilagaHtml, MINIMAL_BEKRAFTELSE_DATA) as string;
    expect(html).not.toContain('class="brodtext"');
  });

  test('bekraftelsebilaga.html: agenda-listan utelämnas helt när tom, visas när satt', () => {
    const tom = eta.renderString(bekraftelsebilagaHtml, MINIMAL_BEKRAFTELSE_DATA) as string;
    expect(tom).not.toContain('Innehåll, Dag Ett');

    const fylld = eta.renderString(bekraftelsebilagaHtml, {
      ...MINIMAL_BEKRAFTELSE_DATA,
      dagEttAgenda: [{ text: 'Punkt 1', tid: '30 min', meditation: true }],
    }) as string;
    expect(fylld).toContain('Innehåll, Dag Ett');
    expect(fylld).toContain('<span class="meditationsnamn">Punkt 1</span>');
    expect(fylld).toContain('<span class="tid">30 min</span>');
  });

  test('deltagarinformation.html: null-fält utelämnar HELA ämnesstycket', () => {
    const html = eta.renderString(deltagarinformationHtml, MINIMAL_DELTAGARINFO_DATA) as string;
    expect(html).not.toContain('Förberedelser:');
    expect(html).not.toContain('Kläder:');
    expect(html).not.toContain('Parkering:');
  });

  test('deltagarinformation.html: satt fält visar ämnesstycket', () => {
    const html = eta.renderString(deltagarinformationHtml, {
      ...MINIMAL_DELTAGARINFO_DATA,
      forberedelser: 'Kom i tid.',
    }) as string;
    expect(html).toContain('<strong>Förberedelser:</strong> Kom i tid.');
  });
});
