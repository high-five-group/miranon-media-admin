/**
 * [TASK-346.10 AC #2, PRD TASK-346 § Swish-import (beslut 8)] Svenska
 * telefonnummer på EN kanonisk form, så att två skrivsätt av samma nummer
 * kan jämföras.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR MODULEN FINNS
 * ═══════════════════════════════════════════════════════════════════════════
 * Swish-importens säkra matchning går på telefonnummer (AC #2), och de två
 * sidorna skriver samma nummer olika:
 *
 *   - Bankens rapport: `+46709879879` (Handelsbankens `MOBILNUMMER`-fält,
 *     verifierat i `docs/research/swish-rapport-exempel/`).
 *   - Basens anmälan: `070-987 98 79` (fältet `Mobilnummer`, `multilineText`
 *     alltså FRITEXT, `data-model.md` § Schema cheat sheet).
 *
 * En jämförelse på råtext ger noll träffar på ett nummer som är detsamma.
 * Research-passet flaggade exakt detta som en förebyggande åtgärd
 * (`swish-rapport-exportformat-2026-08-30.md` § Rekommendation punkt 4:
 * "Normalisera telefonnummer på BÅDA sidor av matchningen").
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR INTE `baraSiffror` I `inkorg-harledningar.ts`
 * ═══════════════════════════════════════════════════════════════════════════
 * Den funktionen finns och gör något ANNAT: den stödjer Lottas SÖKNING, där
 * en DELSTRÄNG ska träffa ("070 102" hittar numret). Den kan därför inte
 * användas för matchning, eftersom en delsträngsjämförelse mellan två hela
 * nummer är fel både när den träffar och när den missar. Skillnaden är mätt i
 * husets egen testsvit: `tests/api/betalningar-inkorg.test.ts` låser att
 * sökningen ger `false` på `'+46 70-102 12 17'` mot basens `'070-102 12 17'`
 * ("landsnummer, annat prefix"). Det är rätt för sökning och katastrof för
 * matchning, och är hela skälet till att denna modul är egen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KANONISK FORM: E.164 UTAN PLUSTECKEN
 * ═══════════════════════════════════════════════════════════════════════════
 * `46709879879`. Plustecknet utelämnas därför att det bara är notation, och
 * en nyckel med ett valfritt prefix är en nyckel med två former.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ETT FÄLT KAN BÄRA FLERA NUMMER
 * ═══════════════════════════════════════════════════════════════════════════
 * `Mobilnummer` är `multilineText`, alltså kan en anmälan bära två rader.
 * `telefonnycklar` returnerar därför en MÄNGD, och matchningen träffar om
 * något av numren träffar. Att bara läsa det första hade gjort en helt
 * korrekt anmälan omatchad utan att något såg fel ut.
 */

/**
 * Ett svenskt mobilnummer är 10 siffror med ledande nolla (`07XXXXXXXX`),
 * alltså 11 på E.164-form. Golvet är satt lägre (8) för att rymma korta
 * riktnummer-former, men INTE så lågt att ett postnummer eller ett
 * kursbelopp i ett fritextfält råkar bli ett telefonnummer.
 *
 * Taket följer E.164:s egen gräns (15 siffror). Ett längre tal är inte ett
 * telefonnummer, hur mycket det än ser ut som ett.
 */
const MINSTA_ANTAL_SIFFROR = 8;
const STORSTA_ANTAL_SIFFROR = 15;

/** Sveriges landsnummer. Modulen tolkar ENBART svenska nummer. */
const LANDSNUMMER = '46';

/**
 * En nummerliknande sekvens i fritext: valfritt `+`, sedan siffror med
 * mellanslag, bindestreck, punkter eller parenteser emellan. Bindestrecket
 * är sist i teckenklassen så att det läses som ett tecken, inte ett intervall.
 *
 * SEPARATORERNA ÄR `[ \t]`, ALDRIG `\s`. Skillnaden är hela poängen med att
 * modulen läser ett `multilineText`-fält: `\s` matchar även radbrytning, så
 * `070-987 98 79\n073-111 22 33` hade blivit EN sekvens om tjugo siffror
 * i stället för två nummer. Den skulle sedan falla på längdtaket och ge en
 * TOM mängd, alltså noll matchningar på ett fält som bär två fullt giltiga
 * nummer. Mätt när sviten skrevs: två fall föll på precis detta.
 */
const SEKVENS_RE = /\+?[\d][\d \t().-]*/g;

/**
 * Normaliserar EN sträng som redan antas vara ett enskilt nummer.
 * Returnerar kanonisk form, eller `null` när strängen inte entydigt är ett
 * svenskt telefonnummer.
 *
 * De fyra formerna som faktiskt förekommer, och vad de blir:
 *
 * | Indata | Kanonisk form | Väg |
 * |---|---|---|
 * | `+46709879879` | `46709879879` | plus + landsnummer |
 * | `0046709879879` | `46709879879` | `00` = internationellt prefix |
 * | `070-987 98 79` | `46709879879` | ledande `0` byts mot landsnumret |
 * | `46709879879` | `46709879879` | redan kanonisk |
 *
 * ORDNINGEN MELLAN REGLERNA ÄR LASTBÄRANDE. `00` prövas FÖRE `0`, annars
 * hade `0046...` lästs som ett nationellt nummer med `046` som riktnummer.
 * Och landsnummer-regeln kräver att nästa siffra INTE är en nolla: `460...`
 * är ett nationellt nummer i Skåne, inte landsnumret plus ett nummer som
 * börjar på noll (ett sådant nummer finns inte).
 */
export function normaliseraTelefon(ratext: string | null | undefined): string | null {
  if (typeof ratext !== 'string') return null;

  const harPlus = ratext.trimStart().startsWith('+');
  const siffror = ratext.replace(/\D+/g, '');
  if (siffror === '') return null;

  let kanonisk: string;

  if (siffror.startsWith('00')) {
    kanonisk = siffror.slice(2);
  } else if (harPlus) {
    // Plustecknet SÄGER att landsnumret står först. Vi tolkar det aldrig om.
    kanonisk = siffror;
  } else if (siffror.startsWith('0')) {
    kanonisk = LANDSNUMMER + siffror.slice(1);
  } else if (siffror.startsWith(LANDSNUMMER) && !siffror.startsWith(`${LANDSNUMMER}0`)) {
    kanonisk = siffror;
  } else {
    // Varken internationellt prefix, ledande nolla eller landsnummer. Det är
    // inte ett svenskt nummer i någon känd skrivform, och att gissa hade
    // gjort en främmande siffersträng till en matchningsnyckel.
    return null;
  }

  if (!kanonisk.startsWith(LANDSNUMMER)) return null;
  if (kanonisk.length < MINSTA_ANTAL_SIFFROR) return null;
  if (kanonisk.length > STORSTA_ANTAL_SIFFROR) return null;

  return kanonisk;
}

/**
 * Alla telefonnummer i ett fritextfält, på kanonisk form och utan dubbletter.
 *
 * Detta är funktionen matchningen använder, på BÅDA sidor: bankens rapport
 * bär ett nummer per rad, basens `Mobilnummer` kan bära flera. Två fält
 * matchar när mängderna skär varandra.
 *
 * Tomt fält, skräptext och ett fält som bara bär ett kursbelopp ger alla en
 * TOM mängd, aldrig ett halvt nummer.
 */
export function telefonnycklar(ratext: string | null | undefined): string[] {
  if (typeof ratext !== 'string') return [];

  const funna = new Set<string>();
  for (const trafft of ratext.matchAll(SEKVENS_RE)) {
    const kanonisk = normaliseraTelefon(trafft[0]);
    if (kanonisk !== null) funna.add(kanonisk);
  }
  return [...funna];
}

/**
 * Bär de två fälten samma telefonnummer? Symmetrisk, och `false` så snart
 * någondera sidan saknar ett läsbart nummer.
 *
 * FAIL-CLOSED MED AVSIKT. Ett okänt nummer är inte en träff. Kostnaden för
 * en missad matchning är att Lotta får peka ut anmälan själv; kostnaden för
 * en falsk matchning är en inbetalning bokförd på fel person.
 */
export function sammaTelefonnummer(
  ena: string | null | undefined,
  andra: string | null | undefined,
): boolean {
  const enas = telefonnycklar(ena);
  if (enas.length === 0) return false;
  const andras = new Set(telefonnycklar(andra));
  return enas.some((nyckel) => andras.has(nyckel));
}
