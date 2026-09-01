// Kvittots FÖRHANDSGRANSKNING — mekanisk vakt över kontraktet och
// sidoeffektsfriheten (TASK-353, Marcus order 2026-09-01: *"lägga en knapp
// bredvid 'Skicka X kvitton' som heter 'Förhandsgranska' och så tillämpar vi
// exakt samma metod som … för våra bilagor"*).
//
// ═══════════════════════════════════════════════════════════════════════════
// KÄLLKODS-NIVÅ, OCH VARFÖR DET INTE ÄR EN GENVÄG
// ═══════════════════════════════════════════════════════════════════════════
// `preview-receipt/index.ts` är Deno-only (`@ts-nocheck`, `esm.sh`-import,
// `Deno.serve`) och kan INTE köras hermetiskt i Node/Playwright. Det är
// husets etablerade läge för EF-handlers, ordagrant bokfört i
// `kvitto-visa-skicka-igen.test.ts` § filhuvud för `hamta-kvittolank`/
// `skicka-kvitto-igen`: deras SKARPA flöde kedjebevisas mot deployad staging,
// medan det som går att isolera bevisas hermetiskt här.
//
// Formen — en grind som läser KÄLLAN och fäller i review innan en regression
// hinner deployas — är `attachment-layer-independence.test.ts`s och
// `ef-metod-vakt.test.ts`s, inte en ny uppfinning.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SVITEN BEVISAR, OCH VAD DEN INTE GÖR
// ═══════════════════════════════════════════════════════════════════════════
// BEVISAS HÄR:
//   A. BAKÅTKOMPATIBILITETEN — `previewReceipt` postar fortfarande `{ eventId }`
//      mot `preview-receipt`, oförändrad. Den grenen är
//      generator-katalogens (`DokumentYta.tsx` via `dokumentKalla.ts`) och
//      får inte rubbas av det additiva tillägget.
//   B. ADDITIVITETEN — `previewKvittoForInbetalning` postar `{ inbetalningId }`
//      mot SAMMA EF, och skickar INTE med något `eventId` (eventet härleds
//      server-sidigt ur anmälan, så en klient inte kan para ihop en
//      inbetalning med fel events bokföringstext).
//   C. GRENVALET FINNS I EF:EN — handlern läser `inbetalningId` ur bodyn och
//      behåller typexempel-grenen.
//   D. SIDOEFFEKTSFRIHETEN, mekaniskt: EF:en rör ALDRIG ledgern eller
//      utskicksvägen. Detta är invarianten hela designen vilar på — en
//      förhandsgranskning som allokerade ett kvittonummer hade brutit
//      Rogers verifikationskedja, och en som skickade mail hade gjort
//      "granska innan du skickar" till en självmotsägelse.
//
// BEVISAS INTE HÄR (öppet bokfört, inte förbisett): att den DEPLOYADE EF:en
// faktiskt returnerar riktig kunddata för ett givet `inbetalningId`. Det
// kräver en skarp staging-körning mot en verklig inbetalning, och den ägs av
// orkestrerarens staging-deploy-verifiering (B5-mönstret) — samma
// ansvarsfördelning som `kvitto-visa-skicka-igen.test.ts` redan bokför för
// sina två EF:er.
//
// TVÅ RIKTNINGAR PER GRIND (uppdragets krav — bevisa att den FÄLLER när den
// ska, inte bara att den är grön): varje kontroll prövas mot en KONSTRUERAD
// sträng som ska falla, aldrig mot en temporärt trasig kopia av riktig
// källkod (som kunde lämnas trasig vid ett avbrott).
//
// api-pure: läser filer från disk med `node:fs`, inget nätverk, inga creds.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Kommentarerna bort — grinden gäller KOD, inte prosa.
 *
 * DETTA ÄR INGEN DETALJ, DET ÄR VAD SOM GÖR GRINDEN SANN. Första versionen
 * av sviten läste rå källa och FÄLLDE omedelbart på `allocateReceiptNumber`
 * — därför att `preview-receipt/index.ts`s filhuvud ägnar ett helt stycke åt
 * att förklara VARFÖR den funktionen inte används. En grind som inte skiljer
 * "koden anropar X" från "kommentaren nämner X" straffar precis den
 * dokumentationsdisciplin resten av repot bygger på, och hade tvingat fram
 * att förklaringen ströks för att grinden skulle bli grön. Fyndet är
 * bokfört, inte bortstädat.
 *
 * KÄND GRÄNS, medvetet inte överbyggd: en naiv strippning kan kapa `//` inuti
 * en strängliteral (t.ex. en URL). De filer sviten läser innehåller inga
 * sådana i de regioner grindarna prövar, och ett fullt AST-pass för två
 * namngivna filer vore ceremoni. Skulle en URL-literal dyka upp fäller
 * grinden högljutt i stället för att tiga — vilket är rätt håll att fela åt.
 */
function utanKommentarer(kalla: string): string {
  return kalla.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/.*$/gm, '');
}

const EF_KALLA = utanKommentarer(
  readFileSync(
    path.join(REPO_ROOT, 'supabase', 'functions', 'preview-receipt', 'index.ts'),
    'utf8',
  ),
);
const ADAPTER_KALLA = utanKommentarer(
  readFileSync(path.join(REPO_ROOT, 'src', 'data', 'adapters', 'AirtableAdapter.ts'), 'utf8'),
);

/**
 * Plockar ut EN metods kropp ur adapterkällan.
 *
 * MEDVETET ENKEL — och det är därför den bär en negativ kontroll nedan: den
 * klipper från metodens signatur till nästa rad som börjar på exakt två
 * mellanslag följt av `}` (klassmetodens avslutande klammer i husets
 * formatering). Ett fullt AST-pass hade varit rätt verktyg för en generell
 * regel; för två namngivna metoder i EN fil är det ceremoni.
 */
function metodKropp(kalla: string, metodnamn: string): string {
  const start = kalla.indexOf(`async ${metodnamn}(`);
  if (start === -1) return '';
  const slut = kalla.indexOf('\n  }', start);
  return slut === -1 ? kalla.slice(start) : kalla.slice(start, slut);
}

/* ═════════════════════ A. BAKÅTKOMPATIBILITETEN ═════════════════════ */

test('previewReceipt postar fortfarande { eventId } mot preview-receipt', () => {
  const kropp = metodKropp(ADAPTER_KALLA, 'previewReceipt');

  expect(kropp).not.toBe('');
  expect(kropp).toContain("postEdgeFunction<unknown>('preview-receipt', { eventId })");
});

test('previewReceipt skickar INTE med inbetalningId — typexempel-grenen är orörd', () => {
  // NEGATIV KONTROLL för hela grenskillnaden: hade tillägget råkat läcka in
  // ett `inbetalningId` här, hade generator-katalogen tyst börjat rendera en
  // verklig persons kvitto i en generisk katalogvy — exakt den
  // dataexponering `preview-receipt/index.ts` § PERSONDATA förbjuder.
  const kropp = metodKropp(ADAPTER_KALLA, 'previewReceipt');

  expect(kropp).not.toContain('inbetalningId');
});

/* ═════════════════════ B. ADDITIVITETEN ═════════════════════ */

test('previewKvittoForInbetalning postar { inbetalningId } mot SAMMA EF', () => {
  const kropp = metodKropp(ADAPTER_KALLA, 'previewKvittoForInbetalning');

  expect(kropp).not.toBe('');
  expect(kropp).toContain("postEdgeFunction<unknown>('preview-receipt', { inbetalningId })");
});

test('previewKvittoForInbetalning skickar ALDRIG med ett klient-valt eventId', () => {
  // Eventet härleds ur ANMÄLAN server-sidigt. Skickade klienten ett eget
  // eventId kunde en inbetalning paras ihop med fel events bokföringstext —
  // och bokföringstexten är det Roger läser i efterhand.
  const kropp = metodKropp(ADAPTER_KALLA, 'previewKvittoForInbetalning');

  expect(kropp).not.toContain('eventId');
});

test('båda portarna validerar svaret mot DocumentPreviewSchema (ADR-026, datagränsen)', () => {
  for (const metod of ['previewReceipt', 'previewKvittoForInbetalning']) {
    expect(metodKropp(ADAPTER_KALLA, metod)).toContain('DocumentPreviewSchema.parse(data)');
  }
});

test('metodKropp diskriminerar — negativ kontroll på hjälparen själv', () => {
  // Utan detta fall kunde varje `toContain`-assertion ovan vara grön av fel
  // skäl: en trasig `metodKropp` som returnerade HELA filen hade innehållit
  // alla söksträngarna, och en som returnerade tom sträng hade fällt på
  // `not.toBe('')` men inte nödvändigtvis avslöjat varför.
  const konstruerad = [
    '  async forst(a: string) {',
    "    return post('ef-ett', { a });",
    '  }',
    '',
    '  async sedan(b: string) {',
    "    return post('ef-tva', { b });",
    '  }',
  ].join('\n');

  expect(metodKropp(konstruerad, 'forst')).toContain('ef-ett');
  expect(metodKropp(konstruerad, 'forst')).not.toContain('ef-tva');
  expect(metodKropp(konstruerad, 'sedan')).toContain('ef-tva');
  expect(metodKropp(konstruerad, 'finnsInte')).toBe('');
});

/* ═════════════════════ C. GRENVALET I EF:EN ═════════════════════ */

test('EF:en grenar på inbetalningId och behåller typexempel-grenen', () => {
  // Grenvalet läses ur BODYN ...
  expect(EF_KALLA).toContain('body?.inbetalningId');
  // ... typexempel-grenen läser fortfarande eventId ur samma body ...
  expect(EF_KALLA).toContain('body?.eventId');
  // ... och typexemplet finns kvar som konstant.
  expect(EF_KALLA).toContain("kundnamn: 'Exempelperson'");
});

test('EF:en validerar inbetalningId som UUID innan den läser något', () => {
  // Utan formvalidering hade ett godtyckligt klientvärde gått rakt in i en
  // PostgREST-fråga. `hamta-kvittolank/index.ts` bär samma vakt för sitt
  // `kvittoId`; formen speglas medvetet.
  expect(EF_KALLA).toContain('UUID_RE');
  expect(EF_KALLA).toContain("throw new ValidationError('inbetalningId must be a UUID')");
});

test('EF:en härleder eventet ur anmälan, inte ur anropet', () => {
  // `utkastEventId` sätts i BÅDA grenarna och är det enda som når
  // `laggUtkast` — så typexempel-grenens eventId och den nya grenens
  // härledda eventId kan inte blandas ihop.
  expect(EF_KALLA).toContain('utkastEventId');
  expect(EF_KALLA).toContain('eventId: utkastEventId');
  expect(EF_KALLA).toContain('anmalan.eventId');
});

/* ═════════════════════ D. SIDOEFFEKTSFRIHETEN ═════════════════════ */

/**
 * Symboler som INTE får förekomma i förhandsgransknings-EF:en. Var och en
 * motsvarar en konkret sidoeffekt förhandsgranskningen aldrig får ha.
 *
 * `KVITTON_TABELL` är med trots att EF:en importerar från samma modul
 * (`_shared/betalningar-db.ts`) — det är precis därför den är med: modulen
 * exporterar BÅDE inbetalnings- och kvitto-ytan, så en framtida "medan jag
 * ändå är här"-import är ett realistiskt misstag, inte en halmgubbe.
 */
const FORBJUDNA_SYMBOLER = [
  'allocateReceiptNumber',
  'receipt-numbering',
  'send-receipt.ts',
  'sendReceipt',
  'KVITTON_TABELL',
  'resend',
  'Resend',
];

test('EF:en importerar varken ledger-allokering, sändväg eller Resend', () => {
  for (const symbol of FORBJUDNA_SYMBOLER) {
    expect(
      EF_KALLA.includes(symbol),
      `preview-receipt/index.ts får inte referera "${symbol}" — förhandsgranskningen ska vara sidoeffektsfri (AC #3, EF:ens filhuvud).`,
    ).toBe(false);
  }
});

test('EF:en gör ingen skrivning mot någon tabell — bara .select()', () => {
  // Storage-utkastet (`laggUtkast`) är den ENDA skrivningen, och den går via
  // `.storage.from(...).upload(...)`, aldrig via en tabelloperation.
  for (const skrivning of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    expect(
      EF_KALLA.includes(skrivning),
      `preview-receipt/index.ts får inte innehålla "${skrivning}" — ingen tabellskrivning i en förhandsgranskning.`,
    ).toBe(false);
  }
  // ... och den LÄSER faktiskt, så frånvaron ovan inte är grön av att
  // datalagret aldrig rörs alls.
  expect(EF_KALLA).toContain('.select(INBETALNING_KOLUMNER)');
});

test('kvittonumret är platshållaren i BÅDA grenarna — aldrig ett allokerat nummer', () => {
  // Ett andra anrop ger exakt samma text; det ÄR beviset att ingen ledger
  // rörts (EF:ens filhuvud § KVITTONUMRET).
  expect(EF_KALLA).toContain("const FORHANDSVISNING_KVITTONUMMER = 'FÖRHANDSVISNING'");
  const antalAnvandningar = EF_KALLA.split('kvittonummer: FORHANDSVISNING_KVITTONUMMER').length - 1;
  expect(antalAnvandningar, 'båda grenarna ska sätta platshållaren').toBe(2);
});

test('utanKommentarer diskriminerar — och tömmer inte källan', () => {
  // UTAN DETTA FALL vore varje `not.toContain`/`includes(...) === false`
  // ovan grön av fel skäl: en trasig strippare som returnerade tom sträng
  // hade "bevisat" sidoeffektsfrihet för vilken källa som helst. Det är
  // exakt den falska tryggheten filens egen tvåriktnings-disciplin finns
  // för att utesluta.
  const konstruerad = [
    '/* Detta blockkommentar nämner allocateReceiptNumber men anropar inget. */',
    "import { laggUtkast } from './utkast.ts'; // nämner sendReceipt i radkommentar",
    'const x = 1;',
  ].join('\n');

  const rensad = utanKommentarer(konstruerad);

  // Prosan är borta ...
  expect(rensad).not.toContain('allocateReceiptNumber');
  expect(rensad).not.toContain('sendReceipt');
  // ... men KODEN är kvar.
  expect(rensad).toContain('laggUtkast');
  expect(rensad).toContain('const x = 1;');

  // Och den riktiga EF-källan är inte heller tömd — annars hade alla
  // frånvaro-assertioner ovan varit meningslösa.
  expect(EF_KALLA.length).toBeGreaterThan(500);
  expect(EF_KALLA).toContain('Deno.serve');
});

test('förbudslistan diskriminerar — negativ kontroll', () => {
  // Bevisar att kontrollerna ovan FÄLLER på en källa som bryter mot dem,
  // inte bara att de är gröna mot en källa som råkar vara ren.
  const trasigKalla = [
    "import { allocateReceiptNumber } from '../_shared/receipt-numbering.ts';",
    'await db.from(KVITTON_TABELL).insert({ kvittonummer });',
  ].join('\n');

  const traffade = FORBJUDNA_SYMBOLER.filter((s) => trasigKalla.includes(s));
  expect(traffade).toContain('allocateReceiptNumber');
  expect(traffade).toContain('receipt-numbering');
  expect(traffade).toContain('KVITTON_TABELL');
  expect(trasigKalla.includes('.insert(')).toBe(true);
});
