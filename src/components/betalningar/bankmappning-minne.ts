import { z } from 'zod';
import { AVGRANSARE, type Kolumnmappning, TRANSAKTIONSFALT } from './bankimport-parser';

/**
 * [Fix-runda 2, TASK-346.10] `Strukturensignatur`s lagringsform.
 *
 * VALFRI I INDATA (`.default(null)`): en post skriven INNAN denna skiva
 * saknar fältet helt, och den ska INTE slängas av `MappningSchema.safeParse`
 * (`lasMappningar` § "poster som inte längre håller schemat SLÄNGS tyst") -
 * bara sakna signatur. `matcharSignatur(null, ...)` returnerar alltid
 * `false`, så en sådan post kan aldrig väljas automatiskt igen; den
 * behandlas som icke-matchande och filen går till dialogen (Marcus beslut
 * 2026-08-31, punkt 5 - noll sparade mappningar i drift i dag, så detta är
 * defensiv korrekthet, inte en migrering av verklig data).
 */
const SignaturSchema = z
  .union([
    z.object({ typ: z.literal('rubrik'), falt: z.array(z.string().nullable()) }),
    z.object({ typ: z.literal('postmarkorer'), forstaFalt: z.string(), sistaFalt: z.string() }),
    z.null(),
  ])
  .default(null);

/**
 * [TASK-346.10 AC #1, PRD berättelse 22] Kolumnmappningen per bank, och
 * loggen över vad denna webbläsare redan importerat.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BERÄTTELSE 22, ORDAGRANT
 * ═══════════════════════════════════════════════════════════════════════════
 * "Som Lotta vill jag göra kolumnmappningen för min bank en gång och få den
 * sparad, så att nästa import är ett klick."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BARA HALVA AC #1 ÄR BYGGD HÄR - OCH DET ÄR ETT BESLUT, INTE ETT GLÖMSKEFEL
 * ═══════════════════════════════════════════════════════════════════════════
 * AC #1 säger "mappningen sparas per bank (lokalt + i basen)". Denna modul är
 * den LOKALA halvan. Bas-halvan är STOPPA-bokförd med förslag i PR-kroppen,
 * på uppdragets egen anvisning ("är bas-delen för stor för natten:
 * STOPPA-bokför med förslag i stället för att bygga fel"). De tre skälen:
 *
 *   1. BANKEN ÄR OKÄND. AC #5 lämnar matchningen mot Lottas verkliga fil som
 *      HITL just därför att vi inte vet vilken bank hon har. En permanent
 *      Airtable-tabell vars enda innehåll vore en mappning för en bank hon
 *      sannolikt inte har är infrastruktur före kunskap - och basen är en
 *      förstklassig leverabel (ADR-063), inte en plats att improvisera på.
 *   2. YTAN ÄR STÖRRE ÄN DEN SER UT. Klienten når aldrig Airtable direkt, så
 *      bas-halvan kräver en ny tabell, ett deklarativt fältskript,
 *      TVÅ nya Edge Functions (läs + skriv), portar i adapterlagret och en
 *      prod-lista för Marcus.
 *   3. B5-DISCIPLINEN. Orkestreraren applicerar staging seriellt före varje
 *      armering, och parallella skivor konkurrerar om det fönstret. Två extra
 *      funktionsdeploys för AC #1:s minst värdefulla halva är fel
 *      risk/nytta-kvot en natt då pengalogiken är det som ska landa.
 *
 * FORMEN ÄR VALD SÅ ATT BAS-HALVAN KAN LÄGGAS TILL UTAN ATT NÅGOT SKRIVS OM:
 * `MappningSchema` serialiserar till ren JSON, och ett `Långtext`-fält i
 * basen bär exakt samma sträng som `localStorage` gör i dag.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KASTAR ALDRIG
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma kontrakt som `betalsatt-minne.ts`: `localStorage` kan kasta redan vid
 * ÅTKOMST i privat läge. Faller läsningen får Lotta mappningsdialogen; faller
 * skrivningen får hon den en gång till nästa gång. Ingen inbetalning hänger
 * på den här modulen.
 *
 * OCH DET ÄR HELA POÄNGEN MED ATT SKILJA DEM ÅT: dubblettskyddet ligger i
 * DATABASEN (`inbetalningar_bankreferens_unik_idx`), aldrig här.
 * Importloggen nedan gör en redan importerad rad SYNLIG innan Lotta trycker;
 * den avgör ingenting.
 */

/* ═══════════════════════════ SCHEMAT ═══════════════════════════ */

const KolumnerSchema = z.object(
  Object.fromEntries(
    TRANSAKTIONSFALT.map((falt) => [falt, z.number().int().min(0).nullable()]),
  ) as Record<(typeof TRANSAKTIONSFALT)[number], z.ZodNullable<z.ZodNumber>>,
);

const RadfilterSchema = z.object({
  kolumn: z.number().int().min(0),
  tillatna: z.array(z.string()),
  skal: z.string(),
});

/**
 * Mappningens lagringsform. VALIDERAS VID LÄSNING, alltid.
 *
 * `localStorage` är en systemgräns som vilken annan: innehållet är skrivet av
 * en tidigare version av appen, av en annan flik, eller av någon som öppnat
 * devtools. En mappning med `belopp: 47` på en fil med fyra kolumner läser
 * `undefined` som belopp för varenda rad - och utan schemat hade det sett ut
 * som en trasig fil i stället för ett trasigt minne.
 */
const MappningSchema = z.object({
  bank: z.string().min(1),
  avgransare: z.enum(AVGRANSARE),
  harRubrikrad: z.boolean(),
  radfilter: z.array(RadfilterSchema),
  kolumner: KolumnerSchema,
  signatur: SignaturSchema,
});

const MAPPNINGAR_NYCKEL = 'mm.betalningar.bankmappningar';
const IMPORTLOGG_NYCKEL = 'mm.betalningar.importerade';

/**
 * Importloggens tak. En rapport bär en handfull rader per helg, så tusen
 * referenser räcker i åratal - och ett tak finns för att `localStorage` har
 * en hård kvot (normalt 5 MB per origin) som en obegränsad lista når till
 * slut. Äldst faller ut först.
 */
const IMPORTLOGG_TAK = 1000;

const ImportloggSchema = z.array(z.object({ bankreferens: z.string().min(1), nar: z.string() }));

export type Importpost = z.infer<typeof ImportloggSchema>[number];

/* ═══════════════════════════ MAPPNINGARNA ═══════════════════════════ */

function lasRatt(nyckel: string): unknown {
  try {
    const ratext = window.localStorage.getItem(nyckel);
    return ratext === null ? null : JSON.parse(ratext);
  } catch {
    // Privat läge, blockerad lagring, eller ogiltig JSON. Alla tre betyder
    // samma sak för anroparen: det finns inget minne.
    return null;
  }
}

function skriv(nyckel: string, varde: unknown): void {
  try {
    window.localStorage.setItem(nyckel, JSON.stringify(varde));
  } catch {
    // Kvoten är full eller lagringen blockerad. Se filhuvudet: minnet är en
    // bekvämlighet, aldrig data.
  }
}

/**
 * Lottas sparade mappningar. Poster som inte längre håller schemat SLÄNGS
 * tyst i stället för att fälla hela listan - en gammal mappning ska inte
 * kunna låsa ute de nya.
 */
export function lasMappningar(): Kolumnmappning[] {
  const rått = lasRatt(MAPPNINGAR_NYCKEL);
  if (!Array.isArray(rått)) return [];

  const giltiga: Kolumnmappning[] = [];
  for (const post of rått) {
    const utfall = MappningSchema.safeParse(post);
    if (utfall.success) giltiga.push(utfall.data as Kolumnmappning);
  }
  return giltiga;
}

/**
 * Sparar mappningen under sitt banknamn. En befintlig mappning för samma bank
 * ERSÄTTS - Lotta har en mappning per bank, inte en historik.
 *
 * Banknamnet jämförs skiftlägesokänsligt och trimmat, så att "Nordea" och
 * "nordea " inte blir två banker.
 */
export function sparaMappning(mappning: Kolumnmappning): void {
  const nyckel = mappning.bank.trim().toLocaleLowerCase('sv');
  const kvar = lasMappningar().filter(
    (post) => post.bank.trim().toLocaleLowerCase('sv') !== nyckel,
  );
  skriv(MAPPNINGAR_NYCKEL, [...kvar, mappning]);
}

/* ═══════════════════════════ IMPORTLOGGEN ═══════════════════════════ */

/**
 * Bankreferenserna denna webbläsare framgångsrikt registrerat, med datum.
 *
 * VAD DEN ÄR TILL FÖR, OCH VAD DEN INTE ÄR: den gör en redan importerad rad
 * synlig FÖRE bekräftelsen, så att en omimport visar "importerad 30 aug" i
 * stället för att raden faller ut som omatchad (anmälan är ju inte längre
 * öppen när den är betald). Den är ett HJÄLPMEDEL för ögat.
 *
 * DUBBLETTSKYDDET ÄR DATABASENS. `inbetalningar_bankreferens_unik_idx` är
 * unikt när `bankreferens` är satt, och `registrera-inbetalning` svarar 409
 * `dubblett_bankreferens` på ett brott. Den vägen gäller oavsett vilken
 * webbläsare, enhet eller person som importerar - och den gäller även när
 * denna logg är tom, rensad eller från en annan dator.
 */
export function lasImportlogg(): Importpost[] {
  const utfall = ImportloggSchema.safeParse(lasRatt(IMPORTLOGG_NYCKEL));
  return utfall.success ? utfall.data : [];
}

/** Uppslagstabell referens till datum, för radernas märkning. */
export function importloggKarta(): Map<string, string> {
  return new Map(lasImportlogg().map((post) => [post.bankreferens, post.nar]));
}

/**
 * Bokför referenser som importerade. Redan bokförda referenser behåller sitt
 * FÖRSTA datum - det är den dagen raden faktiskt registrerades, och att
 * skriva över den med dagens datum hade gjort loggen till en logg över
 * senaste importFÖRSÖK i stället för över registreringar.
 */
export function bokforImporterade(referenser: readonly string[], nar: string): void {
  if (referenser.length === 0) return;

  const befintliga = lasImportlogg();
  const kanda = new Set(befintliga.map((post) => post.bankreferens));
  const nya = referenser
    .filter((referens) => referens !== '' && !kanda.has(referens))
    .map((bankreferens) => ({ bankreferens, nar }));

  if (nya.length === 0) return;
  skriv(IMPORTLOGG_NYCKEL, [...befintliga, ...nya].slice(-IMPORTLOGG_TAK));
}
