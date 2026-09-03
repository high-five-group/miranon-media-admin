// [TASK-370.1, PRD TASK-370 § Implementationsbeslut, S116 Del 2 beslut 6]
// Enhetsnivå UTAN DocRaptor för "Förhandsgranska alla N" — samma skarv som
// `kvitto-forhandsgranskning.test.ts`/`mall-render.test.ts`/
// `hojdanpassning.test.ts` (PRD § Testbeslut punkt 1).
//
// KAN IMPORTERAS DIREKT I NODE: `supabase/functions/_shared/
// kvitto-kombination.ts` är IMPORTFRI (samma mönster som
// `_shared/hojdanpassning.ts`, TASK-309.34) — `_shared/mall-render.ts`s
// `import { Eta } from 'https://esm.sh/eta@4.6.0'` gör HELA den filen
// omöjlig att importera i Node (`ERR_UNSUPPORTED_ESM_URL_SCHEME`), men
// kompositionsmodulen rör varken Eta eller Deno. Se dess filhuvud.
//
// VAD SVITEN BEVISAR (AC #2/#3/#5 för `370.1`-kortet):
//   A. Valideringen av `inbetalningIds` — UUID-form, dubblett, tom lista,
//      taket (30).
//   B. Kompositionen — N redan Eta-fyllda kvitto-dokument -> ETT dokument
//      med N-1 sidbrytningar, given ordning, `<head>` orört.
//   C. Lagringsnyckelns form — `utkast/kombinerat/<requestId>.pdf`.
//   D. Ålders-predikatet sweepen bygger på — ren funktion, ingen Storage.
//
// TVÅ RIKTNINGAR PER GRIND (uppdragets krav): varje kontroll prövas mot ett
// fall som SKA fälla, inte bara mot ett som råkar vara grönt.
//
// api-pure: ren logik, inget nätverk, inga creds, ingen DocRaptor-kostnad.

import { expect, test } from '@playwright/test';
import {
  arKombineratUtkastForfallet,
  byggKombineratUtkastPath,
  KOMBINERAT_UTKAST_MAPP,
  KOMBINERAT_UTKAST_TTL_MS,
  kombineraFylldaKvittoSidor,
  MAX_KOMBINERADE_KVITTON,
  valideraInbetalningIdLista,
} from '../../supabase/functions/_shared/kvitto-kombination';

/* ═════════════════════ A. VALIDERINGEN ═════════════════════ */

const GILTIG_UUID_1 = '11111111-1111-1111-1111-111111111111';
const GILTIG_UUID_2 = '22222222-2222-2222-2222-222222222222';
const GILTIG_UUID_3 = '33333333-3333-3333-3333-333333333333';

test('taket är namngivet och satt till 30 (S116 Del 2 beslut 6)', () => {
  expect(MAX_KOMBINERADE_KVITTON).toBe(30);
});

test('en giltig lista av unika UUID:er passerar oförändrad', () => {
  const lista = [GILTIG_UUID_1, GILTIG_UUID_2, GILTIG_UUID_3];
  expect(valideraInbetalningIdLista(lista)).toEqual(lista);
});

test('EN giltig UUID (N=1) passerar — funktionen själv sätter ingen N>=2-gräns', () => {
  // N>=2-regeln för NÄR KNAPPEN VISAS bor i klienten (skiva 370.4), inte
  // här. Denna funktion validerar FORMEN på listan, inget annat.
  expect(valideraInbetalningIdLista([GILTIG_UUID_1])).toEqual([GILTIG_UUID_1]);
});

test('exakt 30 giltiga UUID:er passerar (bara-gränsen)', () => {
  const unika = Array.from({ length: 30 }, (_, i) => {
    const hex = i.toString(16).padStart(4, '0');
    return `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa${hex}`;
  });
  expect(valideraInbetalningIdLista(unika)).toHaveLength(30);
});

test('31 UUID:er avvisas — taket är en HÅRD gräns, inte en tyst delmängd', () => {
  const unika = Array.from({ length: 31 }, (_, i) => {
    const hex = i.toString(16).padStart(4, '0');
    return `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb${hex}`;
  });
  expect(() => valideraInbetalningIdLista(unika)).toThrow(/at most 30/);
});

test('tom lista avvisas', () => {
  expect(() => valideraInbetalningIdLista([])).toThrow(/non-empty/);
});

test('icke-array avvisas', () => {
  expect(() => valideraInbetalningIdLista('not-an-array')).toThrow(/non-empty array of UUIDs/);
  expect(() => valideraInbetalningIdLista(null)).toThrow();
  expect(() => valideraInbetalningIdLista(undefined)).toThrow();
});

test('en icke-UUID-sträng i listan avvisas', () => {
  expect(() => valideraInbetalningIdLista([GILTIG_UUID_1, 'not-a-uuid'])).toThrow(/UUIDs/);
});

test('ett icke-sträng-element i listan avvisas (formvakt, inte bara regex)', () => {
  expect(() => valideraInbetalningIdLista([GILTIG_UUID_1, 42])).toThrow(/UUIDs/);
});

test('en dubblett i listan avvisas med ett meddelande som pekar ut id:t', () => {
  expect(() => valideraInbetalningIdLista([GILTIG_UUID_1, GILTIG_UUID_1])).toThrow(
    new RegExp(`duplicate.*${GILTIG_UUID_1}`),
  );
});

test('UUID-formen är skiftlägesokänslig — samma disciplin som preview-receipt/index.ts', () => {
  expect(valideraInbetalningIdLista([GILTIG_UUID_1.toUpperCase()])).toEqual([
    GILTIG_UUID_1.toUpperCase(),
  ]);
});

/* ═════════════════════ B. KOMPOSITIONEN ═════════════════════ */

/** Bygger ett SYNTETISKT "redan Eta-fyllt kvitto-dokument" — samma
 *  form som `fyllMall('kvitto', …)` producerar (head med två <link>,
 *  body med ETT `.sida--kvitto`-div) utan att behöva Eta/mall-render.ts. */
function byggFylltDokument(namn: string, kvittonummer = 'FÖRHANDSVISNING'): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="sv">',
    '<head>',
    '<meta charset="UTF-8" />',
    `<title>Kvitto - ${kvittonummer}</title>`,
    '<link rel="stylesheet" href="./bilaga-delad.css" />',
    '<link rel="stylesheet" href="./kvitto.css" />',
    '</head>',
    '<body>',
    '<div class="sida sida--kvitto">',
    `  <p>${namn}</p>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('\n');
}

test('kombineraFylldaKvittoSidor kräver minst ETT dokument', () => {
  expect(() => kombineraFylldaKvittoSidor([])).toThrow(/minst ETT/);
});

test('ETT dokument (N=1) ger noll sidbrytningar', () => {
  const kombinerad = kombineraFylldaKvittoSidor([byggFylltDokument('Anna Andersson')]);
  expect((kombinerad.match(/break-before: page/g) ?? []).length).toBe(0);
  expect((kombinerad.match(/class="sida sida--kvitto"/g) ?? []).length).toBe(1);
});

test('N=3: exakt N sidor och N-1 sidbrytningar, given ordning bevarad', () => {
  const dokument = [
    byggFylltDokument('Anna Andersson'),
    byggFylltDokument('Bengt Bengtsson'),
    byggFylltDokument('Cecilia Carlsson'),
  ];
  const kombinerad = kombineraFylldaKvittoSidor(dokument);

  expect((kombinerad.match(/class="sida sida--kvitto"/g) ?? []).length).toBe(3);
  expect((kombinerad.match(/break-before: page/g) ?? []).length).toBe(2);

  // Ordning: Anna FÖRE Bengt FÖRE Cecilia i den sammanslagna strängen.
  const iAnna = kombinerad.indexOf('Anna Andersson');
  const iBengt = kombinerad.indexOf('Bengt Bengtsson');
  const iCecilia = kombinerad.indexOf('Cecilia Carlsson');
  expect(iAnna).toBeGreaterThan(-1);
  expect(iBengt).toBeGreaterThan(iAnna);
  expect(iCecilia).toBeGreaterThan(iBengt);
});

test('den FÖRSTA sidan bär ALDRIG break-before — den öppnar dokumentet', () => {
  const kombinerad = kombineraFylldaKvittoSidor([
    byggFylltDokument('Anna Andersson'),
    byggFylltDokument('Bengt Bengtsson'),
  ]);
  const forstaSidaSlut = kombinerad.indexOf('Anna Andersson');
  const forePos = kombinerad.slice(0, forstaSidaSlut).lastIndexOf('class="sida sida--kvitto"');
  const forstaSidansDivTagg = kombinerad.slice(forePos, forstaSidaSlut);
  expect(forstaSidansDivTagg).not.toContain('break-before');
});

test('head/<link>-antalet ärvs OFÖRÄNDRAT från den FÖRSTA sidan — kompositionen dubblar dem inte', () => {
  const kombinerad = kombineraFylldaKvittoSidor([
    byggFylltDokument('Anna Andersson'),
    byggFylltDokument('Bengt Bengtsson'),
    byggFylltDokument('Cecilia Carlsson'),
  ]);
  expect((kombinerad.match(/<link rel="stylesheet"/g) ?? []).length).toBe(2);
});

test('ett dokument utan <body> fälls med ett meddelande som pekar ut POSITIONEN', () => {
  const trasigt = '<html><head></head></html>'; // ingen <body>
  expect(() => kombineraFylldaKvittoSidor([byggFylltDokument('Anna Andersson'), trasigt])).toThrow(
    /Kvitto 2:.*<body>/,
  );
});

test('ett dokument utan .sida--kvitto (index > 0) fälls med ett meddelande som pekar ut positionen', () => {
  const trasigt = '<html><head></head><body><div class="nagot-annat">x</div></body></html>';
  expect(() => kombineraFylldaKvittoSidor([byggFylltDokument('Anna Andersson'), trasigt])).toThrow(
    /Kvitto 2:.*sida--kvitto/,
  );
});

test('diskrimineringskontroll — ett KORREKT sammansatt dokument fäller INTE på errorvägarna ovan', () => {
  // Utan detta fall kunde `not.toThrow`-vägen ovan vara "grön av att aldrig
  // testad" — detta bevisar att en LYCKAD komposition faktiskt går igenom.
  expect(() =>
    kombineraFylldaKvittoSidor([
      byggFylltDokument('Anna Andersson'),
      byggFylltDokument('Bengt Bengtsson'),
    ]),
  ).not.toThrow();
});

/* ═════════════════════ C. LAGRINGSNYCKELN ═════════════════════ */

test('byggKombineratUtkastPath bygger utkast/kombinerat/<requestId>.pdf', () => {
  expect(byggKombineratUtkastPath(GILTIG_UUID_1)).toBe(
    `${KOMBINERAT_UTKAST_MAPP}/${GILTIG_UUID_1}.pdf`,
  );
  expect(KOMBINERAT_UTKAST_MAPP).toBe('utkast/kombinerat');
});

test('byggKombineratUtkastPath avvisar en icke-UUID requestId', () => {
  expect(() => byggKombineratUtkastPath('not-a-uuid')).toThrow(/UUID/);
  expect(() => byggKombineratUtkastPath('')).toThrow();
});

test('två olika requestId ger två olika nycklar — ingen kollision mellan samtidiga anrop', () => {
  const a = byggKombineratUtkastPath(GILTIG_UUID_1);
  const b = byggKombineratUtkastPath(GILTIG_UUID_2);
  expect(a).not.toBe(b);
});

test('nyckelformen är INTE utkast/<eventId>/<typ>.pdf — spänner inte över eventId', () => {
  const path = byggKombineratUtkastPath(GILTIG_UUID_1);
  expect(path.startsWith('utkast/kombinerat/')).toBe(true);
  expect(path).not.toMatch(/^utkast\/rec/); // eventId-formen (`rec…`) förekommer aldrig här
});

/* ═════════════════════ D. ÅLDERS-PREDIKATET (sweepen) ═════════════════════ */

test('en saknad tidsstämpel behandlas som FÖRFALLEN (fail-safe åt städ-hållet)', () => {
  expect(arKombineratUtkastForfallet(null, Date.now())).toBe(true);
});

test('en otolkbar tidsstämpel behandlas som FÖRFALLEN', () => {
  expect(arKombineratUtkastForfallet('inte-ett-datum', Date.now())).toBe(true);
});

test('ett objekt precis under TTL:n är INTE förfallet', () => {
  const nu = Date.parse('2026-09-03T12:00:00.000Z');
  const uppdaterad = new Date(nu - (KOMBINERAT_UTKAST_TTL_MS - 1000)).toISOString();
  expect(arKombineratUtkastForfallet(uppdaterad, nu)).toBe(false);
});

test('ett objekt precis över TTL:n ÄR förfallet', () => {
  const nu = Date.parse('2026-09-03T12:00:00.000Z');
  const uppdaterad = new Date(nu - (KOMBINERAT_UTKAST_TTL_MS + 1000)).toISOString();
  expect(arKombineratUtkastForfallet(uppdaterad, nu)).toBe(true);
});

test('en anpassad ttlMs respekteras (sweepen är inte hårdkodad mot default-konstanten)', () => {
  const nu = Date.parse('2026-09-03T12:00:00.000Z');
  const uppdaterad = new Date(nu - 5000).toISOString();
  expect(arKombineratUtkastForfallet(uppdaterad, nu, 10_000)).toBe(false);
  expect(arKombineratUtkastForfallet(uppdaterad, nu, 1000)).toBe(true);
});

test('diskrimineringskontroll — ett NYSS uppdaterat objekt är aldrig förfallet med default-TTL:n', () => {
  const nu = Date.now();
  expect(arKombineratUtkastForfallet(new Date(nu).toISOString(), nu)).toBe(false);
});
