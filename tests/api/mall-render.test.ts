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

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { Eta } from 'eta';
import { bekraftelsebilagaHtml } from '../../supabase/functions/_shared/mallar/bekraftelsebilaga.html';
import { deltagarinformationHtml } from '../../supabase/functions/_shared/mallar/deltagarinformation.html';
// [TASK-309.5] kvitto.html konverterades från `{{fältnamn}}`-strängersättning
// till Eta-syntax i denna skiva — se docs/mallar/bilagor/kvitto.html § filhuvud.
import { kvittoHtml } from '../../supabase/functions/_shared/mallar/kvitto.html';

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

// [TASK-309.5] kvitto.html bär INGA villkor/loopar (ren flat substitution,
// samma som förlagans {{}}-form) — se KvittoMallData i _shared/mall-data.ts.
const MINIMAL_KVITTO_DATA = {
  kvittonummer: 'x',
  datum: 'x',
  orgReferens: 'x',
  kundnamn: 'x',
  kundEpost: 'x',
  benamning: 'x',
  netto: 'x',
  moms: 'x',
  brutto: 'x',
  orgNamn: 'x',
  orgGatuadress: 'x',
  orgPostadress: 'x',
  orgLand: 'x',
  orgNummer: 'x',
  orgMomsregnummer: 'x',
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

  // [TASK-309.5] kvitto.html — kundnamn/kundEpost/benamning härstammar från
  // Lotta-inmatning respektive Anmälningar-tabellen (aldrig Lotta-fritext i
  // benamnings fall, men kundnamn/kundEpost ÄR persondata från basen) —
  // samma escaping-krav som de två andra mallarnas Airtable-härledda fält.
  test('kvitto.html: kundnamn escapeas', () => {
    const html = eta.renderString(kvittoHtml, {
      ...MINIMAL_KVITTO_DATA,
      kundnamn: FARLIG_STRANG,
    }) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });

  test('kvitto.html: kundEpost escapeas', () => {
    const html = eta.renderString(kvittoHtml, {
      ...MINIMAL_KVITTO_DATA,
      kundEpost: FARLIG_STRANG,
    }) as string;
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(FARLIG_STRANG);
  });

  test('kvitto.html: benamning (Lottas bokföringstext-fritext) escapeas', () => {
    const html = eta.renderString(kvittoHtml, {
      ...MINIMAL_KVITTO_DATA,
      benamning: FARLIG_STRANG,
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

  // [TASK-309.5] kvitto.html — ren flat substitution, samma AC-form som de
  // två andra mallarna. Bevisar mot den FAKTISKA mallen (inte en syntetisk
  // sträng) att varenda `<%= data.x %>`-token faktiskt fylls i.
  test('kvitto.html: samtliga femton token fylls i från KvittoMallData', () => {
    const data = {
      kvittonummer: 'MM-2026-1001',
      datum: '2026-08-03',
      orgReferens: 'Miranon Media/Lotta Gotthardsson',
      kundnamn: 'Anna Andersson',
      kundEpost: 'anna.andersson@example.com',
      benamning: 'Utbildning 2026-07-25/26, personlig utveckling, meditation',
      netto: '2 000,00',
      moms: '500,00',
      brutto: '2 500,00',
      orgNamn: 'Miranon Media AB',
      orgGatuadress: 'Uttringe Hages väg 17',
      orgPostadress: '144 63 Rönninge',
      orgLand: 'Sverige',
      orgNummer: '559540-5498',
      orgMomsregnummer: 'SE559540549801',
    };
    const html = eta.renderString(kvittoHtml, data) as string;
    for (const varde of Object.values(data)) {
      expect(html).toContain(varde);
    }
    // Ingen ofylld platshållare/oevaluerad Eta-tagg kvar i den RENDERADE
    // KROPPEN (efter <body>) — mallens filhuvud-KOMMENTAR nämner medvetet
    // den gamla `{{orgNamn}}`-formen som historik (se kvitto.html § filhuvud)
    // och ska inte räknas som en "kvarvarande platshållare".
    const kropp = html.slice(html.indexOf('<body>'));
    expect(kropp).not.toMatch(/\{\{\s*[\w]+\s*\}\}/);
    expect(kropp).not.toMatch(/<%[=~]?/);
  });
});

// [TASK-309.5, AC #2] KÄLLKODS-NIVÅ-BEVIS för "byte-identiska för samma
// indata" — samma disciplin som attachment-layer-independence.test.ts/
// ef-metod-vakt.test.ts: en ordnings-/arkitekturegenskap ("BÅDA
// anropssiterna använder SAMMA renderare med SAMMA datafunktion") är mest
// träffsäkert observerad i KÄLLAN, körs utan creds i api-pure, och fäller i
// review innan en regression (t.ex. en av EF:erna glider tillbaka till
// kvittoRader/renderKvittoPdf, eller börjar bygga sin egen data-form) hinner
// deployas. Den EMPIRISKA halvan (att DocRaptor-renderingen faktiskt ger
// sökbar text + inbäddat typsnitt för identisk data) bevisas LIVE i
// tests/api/preview-receipt.staging.test.ts — denna fil bevisar bara att
// BÅDA call-siterna matar SAMMA renderare SAMMA väg, vilket är
// FÖRUTSÄTTNINGEN för att den empiriska halvan ens är meningsfull.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EF_DIR = path.join(REPO_ROOT, 'supabase', 'functions');

test.describe('Kvittots renderingsväg — BÅDA anropssiterna använder SAMMA renderare (AC #2, källkods-nivå)', () => {
  test("preview-receipt/index.ts anropar byggKvittoData + renderaMallPdf('kvitto', …) — INTE kvittoRader/renderKvittoPdf", () => {
    const source = readFileSync(path.join(EF_DIR, 'preview-receipt', 'index.ts'), 'utf8');
    expect(source).toContain("import { byggKvittoData } from '../_shared/mall-data.ts'");
    expect(source).toContain("import { renderaMallPdf } from '../_shared/mall-render.ts'");
    expect(source).toMatch(/renderaMallPdf\(\s*'kvitto'/);
    expect(source).not.toContain('kvittoRader(');
    expect(source).not.toContain('renderKvittoPdf(');
    expect(source).not.toContain("from '../_shared/receipt-pdf.ts'");
  });

  test("send-receipt-email/index.ts anropar byggKvittoData + renderaMallPdf('kvitto', …) — INTE kvittoRader/renderKvittoPdf", () => {
    const source = readFileSync(path.join(EF_DIR, 'send-receipt-email', 'index.ts'), 'utf8');
    expect(source).toContain("import { byggKvittoData } from '../_shared/mall-data.ts'");
    expect(source).toContain("import { renderaMallPdf } from '../_shared/mall-render.ts'");
    expect(source).toMatch(/renderaMallPdf\(\s*'kvitto'/);
    expect(source).not.toContain('kvittoRader(');
    expect(source).not.toContain('renderKvittoPdf(');
    expect(source).not.toContain("from '../_shared/receipt-pdf.ts'");
  });

  test('_shared/receipt-pdf.ts (pdf-lib-renderaren) är RIVEN — negativ kontroll: filen existerar inte', () => {
    expect(() => readFileSync(path.join(EF_DIR, '_shared', 'receipt-pdf.ts'), 'utf8')).toThrow();
  });

  test('detektorn fäller på en KONSTRUERAD avvikelse (självtest — bevisar att grepet ovan verkligen diskriminerar)', () => {
    const drivenBort = [
      "import { renderKvittoPdf } from '../_shared/receipt-pdf.ts';",
      'const rader = kvittoRader({ kvittonummer: spec.kvittonummer });',
      'const bytes = await renderKvittoPdf(rader);',
    ].join('\n');
    expect(drivenBort).toContain('kvittoRader(');
    expect(drivenBort).toContain('renderKvittoPdf(');
    expect(drivenBort).toContain("from '../_shared/receipt-pdf.ts'");
  });
});
