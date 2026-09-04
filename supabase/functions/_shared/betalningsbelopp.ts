// Beloppets normalisering — TASK-346.4, PRD TASK-346 användarberättelse 4
// ("Som Lotta vill jag kunna skriva '2 500,00' precis som banken visar det,
// så att appen inte tyst vägrar").
//
// REN MODUL, TRANSITIVT DENO-FRI (ingen import alls) → Node-typkollad via
// `tsconfig.edge-shared.json` och hermetiskt testbar i `api-pure`
// (`tests/api/betalningsbelopp.test.ts`). Samma klass som
// `_shared/plats-uppslag.ts` och `_shared/hojdanpassning.ts`.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR EN EGEN PARSER OCH INTE `Number(...)` / `parseFloat(...)`
// ═══════════════════════════════════════════════════════════════════════════
// Båda är TYST FEL för pengar, och på var sitt sätt:
//
//   Number('1e3')      → 1000    (exponentnotation — Lotta skrev aldrig 1000)
//   Number('2 500,00') → NaN     (svensk form avvisas helt)
//   Number('')         → 0       (tomt fält blir ett nollbelopp)
//   Number('0x10')     → 16      (hexadecimal)
//   Number('Infinity') → Infinity
//   parseFloat('12abc')→ 12      (läser prefix, slänger resten UTAN fel)
//
// Fyra av de sex fallen ger ett TAL där ett FEL var rätt svar. En
// bokföringspost får aldrig uppstå ur en tyst omtolkning av vad Lotta skrev,
// så parsern nedan är whitelist-baserad: den bygger en kanonisk sträng och
// prövar den mot ETT strikt uttryck. Allt som inte passar blir `null`, och
// `null` blir ett felmeddelande vid fältet (PRD berättelse 30) — aldrig ett
// gissat tal.
//
// ═══════════════════════════════════════════════════════════════════════════
// DECIMALTECKEN: KOMMA. PUNKT ACCEPTERAS OCKSÅ — MEN ALDRIG SOM TUSENTAL
// ═══════════════════════════════════════════════════════════════════════════
// Svensk konvention är komma som decimaltecken och blanksteg som
// tusentalsavgränsare (samma form `formatBelopp` (`receipt-content.ts`) redan
// SKRIVER ut). Punkt accepteras som decimaltecken därför att ett tangentbords
// numeriska block ger punkt.
//
// Konsekvensen, MEDVETET vald och inte en lucka: `'2.500'` (Airtable-
// fritextens form, se `data-model.md` § Eventinnehåll `Pris` = `"2.500"`)
// avvisas som `null` i stället för att tolkas som antingen 2,50 eller 2500.
// Formen är genuint tvetydig, och de två läsningarna skiljer sig med en
// faktor tusen på en bokföringspost. Fail-closed är enda försvarbara
// utfallet: Lotta får ett felmeddelande och skriver om, i stället för ett
// kvitto på fel belopp. (Prisfritexten i basen parsas ALDRIG av denna
// funktion — priser läses ur de NUMERISKA fälten, ADR-128 beslut 7.)
//
// ═══════════════════════════════════════════════════════════════════════════
// TVÅ DECIMALER ÄR TAKET
// ═══════════════════════════════════════════════════════════════════════════
// Kolumnen är `numeric(12,2)` i kronor (migration
// `20260830195728_betalningsdomanen_inbetalningar_kvitton.sql` § filhuvud).
// Postgres AVRUNDAR tyst vid fler decimaler; parsern avvisar dem i stället,
// så en inmatning aldrig kan bli ett annat tal än det som skrevs.

/**
 * Tusentalsavgränsare som strippas bort, angivna som KODPUNKTER och inte som
 * råa tecken. Skälet är granskningsbarhet: hårt blanksteg, siffer-blanksteg,
 * tunt blanksteg och smalt hårt blanksteg är OSYNLIGT olika från ett vanligt
 * blanksteg i en editor — och en kopierad bankrad bär ofta just dem. En
 * teckenklass ingen kan LÄSA är en teckenklass ingen kan granska.
 *
 * Ingen av kodpunkterna är regex-meta, så strängbygget nedan behöver ingen
 * escaping.
 */
const GRUPPTECKEN = [
  0x0020, // vanligt blanksteg
  0x00a0, // hårt blanksteg (no-break space)
  0x2007, // siffer-blanksteg (figure space)
  0x2009, // tunt blanksteg (thin space)
  0x202f, // smalt hårt blanksteg (narrow no-break space)
  0x0027, // apostrof (schweizisk/tysk tusentalsform)
] as const;

const GRUPPTECKEN_RE = new RegExp(
  `[${GRUPPTECKEN.map((kod) => String.fromCodePoint(kod)).join('')}]`,
  'g',
);

/** Valutasuffix Lotta/banken kan råka få med. Prövas efter trim, skiftlägesfritt. */
const VALUTASUFFIX_RE = /(?:\s*(?::-|kr|kronor|sek))+$/i;

/**
 * Kanonisk form: valfritt minustecken, minst en siffra, valfritt
 * decimaltecken med EXAKT en eller två siffror. Inget `e`, inget `0x`,
 * ingen `Infinity`, inget efterföljande skräp.
 */
const KANONISK_RE = /^-?\d+(?:\.\d{1,2})?$/;

/** Kolumnens bredd: `numeric(12,2)` ⇒ högst 10 heltalssiffror. */
export const BELOPP_MAX = 9_999_999_999.99;

/**
 * Normaliserar Lottas inmatning till kronor som `number`, eller `null` när
 * strängen inte ENTYDIGT är ett belopp.
 *
 * Accepterar: `'2 500,00'` (blanksteg + komma), `'2500,50'`, `'2500'`,
 * `'2 500 kr'`, `'1000:-'`, `'-500'` (återbetalning), `'12.50'`.
 * Avvisar (→ `null`): `'abc'`, `'1e3'`, `'2.500'`, `''`, `'  '`, `'0x10'`,
 * `'Infinity'`, `'1,234'` (tre decimaler), `'12abc'`, `'1,2,3'`.
 *
 * NOLL RETURNERAS SOM 0, inte som `null` — "är noll ett giltigt belopp?" är
 * en DOMÄN-fråga (nej, `inbetalningar_belopp_ej_noll` fäller den), inte en
 * parse-fråga. Att blanda ihop de två hade gett samma felmeddelande för
 * "obegripligt" och "noll", vilket är två olika saker för Lotta.
 */
export function normaliseraBelopp(ratext: unknown): number | null {
  if (typeof ratext !== 'string') return null;

  const utanValuta = ratext.trim().replace(VALUTASUFFIX_RE, '');
  const kanonisk = utanValuta.replace(GRUPPTECKEN_RE, '').replace(',', '.');

  if (!KANONISK_RE.test(kanonisk)) return null;

  const tal = Number(kanonisk);
  // Number() på en KANONISK_RE-matchning kan inte ge NaN; kontrollen står som
  // spärr mot en framtida uppmjukning av uttrycket, inte mot dagens.
  if (!Number.isFinite(tal)) return null;
  if (Math.abs(tal) > BELOPP_MAX) return null;

  // -0 finns i IEEE 754 och överlever Number('-0'). Den skulle passera
  // `belopp <> 0`-checken i Postgres som 0 och är aldrig vad någon menade.
  return tal === 0 ? 0 : tal;
}

/**
 * Summerar kronbelopp UTAN flyttalsdrift: `0.1 + 0.2 !== 0.3` gäller lika
 * mycket för `1000.10 + 2000.20`. Räknar i ören som heltal och delar
 * tillbaka — samma disciplin som `beraknaMoms` (`receipt-content.ts`) redan
 * följer för momsdelningen.
 *
 * `Math.round` på varje term FÖRE summeringen är avsiktligt: termerna kommer
 * ur `numeric(12,2)` och har därför per definition högst två decimaler, men
 * PostgREST levererar dem som STRÄNGAR som parsats av anroparen — en term
 * med flyttalsbrus ska avrundas till sitt ÖRE, inte bära bruset vidare.
 */
export function summeraKronor(belopp: readonly number[]): number {
  const oren = belopp.reduce((summa, kr) => summa + Math.round(kr * 100), 0);
  return oren / 100;
}

/**
 * Läser ett `numeric`-värde som PostgREST/supabase-js levererar. Kolumnen är
 * `numeric(12,2)` och kommer därför tillbaka som STRÄNG, inte som tal
 * (migrationens § KONSUMENT-VARNING). Ett `number` accepteras också, för
 * kolumner som faktiskt är `integer` och för hermetiska tester.
 *
 * Detta är AVSIKTLIGT en annan funktion än `normaliseraBelopp`: den här
 * läser ett värde databasen redan validerat och lagrat, den andra läser vad
 * en människa skrev. Att låta Lottas inmatning gå genom en parser som
 * accepterar `'1e3'` (vilket `Number` gör) vore precis det fel filhuvudet
 * beskriver.
 */
export function lasNumeric(varde: unknown): number | null {
  if (typeof varde === 'number') return Number.isFinite(varde) ? varde : null;
  if (typeof varde !== 'string') return null;
  const trimmad = varde.trim();
  if (trimmad === '') return null;
  const tal = Number(trimmad);
  return Number.isFinite(tal) ? tal : null;
}
