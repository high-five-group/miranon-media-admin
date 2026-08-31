import type { Transaktion } from '@/domain/models/Transaktion';
import { sammaTelefonnummer } from '@/lib/telefon';
import type { InkorgsRad } from './inkorg-harledningar';

/**
 * [TASK-346.10 AC #2, PRD TASK-346 § Swish-import (beslut 8)] Från en
 * bankrad till en anmälan: telefon, sedan namn plus belopp, sedan ingenting.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TRE KLASSER, OCH BARA EN AV DEM ÄR SÄKER
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD beslut 8, ordagrant: "Matchning: telefon → anmälan; annars namn +
 * belopp mot öppna betalningar; annars omatchad. Rader märks
 * säker/osäker/omatchad i samma inkorg."
 *
 * Ordningen är inte en optimering utan en RANGORDNING AV BEVIS:
 *
 *   1. TELEFON är den enda nyckeln som är personens egen och som banken
 *      själv fyllt i. Träffar den exakt en anmälan är raden SÄKER.
 *   2. NAMN + BELOPP är indicier. De ger kandidater Lotta väljer bland,
 *      aldrig ett svar. Två skäl, båda verkliga: bankens namn är den
 *      registrerade SWISH-ÄGARENS, inte nödvändigtvis deltagarens (en
 *      förälder betalar för sitt barn, en arbetsgivare för sin anställda),
 *      och två personer kan heta samma sak.
 *   3. INGET AV DEM är omatchad, och raden får sökfältet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FLERA TELEFONTRÄFFAR ÄR OSÄKERT, INTE SÄKERT
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma person kan ha två öppna anmälningar (två event, PRD berättelse 1:
 * "åtta betalningar för åtta event"). Telefonnumret pekar då ut PERSONEN men
 * inte BETALNINGEN, och att välja den första hade bokfört pengarna på fel
 * event utan att någon fick veta. En sådan rad är osäker med båda
 * anmälningarna som kandidater - vilket är exakt vad Lotta behöver se.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN FUNKTION HÄR LÄSER KLOCKAN ELLER NÄTVERKET
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma disciplin som `inkorg-harledningar.ts`: rena funktioner över indata
 * som trädas in. PRD:ns DoD #5 kräver en negativ kontroll per regel, och en
 * sådan går att skriva mot en funktion men inte mot en JSX-gren.
 */

export type Matchningsklass = 'saker' | 'osaker' | 'omatchad';

export type Matchning = {
  klass: Matchningsklass;
  /**
   * Kandidaterna, bäst först.
   *
   * INVARIANT, låst av testsviten: `saker` bär EXAKT en, `osaker` minst en,
   * `omatchad` noll. En `saker` med två kandidater vore en självmotsägelse,
   * och en `osaker` med noll hade lämnat Lotta med en fråga utan svarsalternativ.
   */
  kandidater: InkorgsRad[];
  /** Vad som gav träffen, i klartext. Visas på raden. */
  grund: string;
};

/* ═══════════════════════════ NAMNJÄMFÖRELSEN ═══════════════════════════ */

/**
 * Namnets ord, gemena och utan skiljetecken.
 *
 * DIAKRITERNA BEVARAS. Att vika `ä` till `a` hade slagit ihop `Öberg` och
 * `Oberg` till samma namn, och i svenska är de olika namn. Research-passet
 * flaggade namnstavning som en känd risk
 * (`swish-rapport-exportformat-2026-08-30.md` § Vad detta betyder för
 * matchningen: "normalisera innan jämförelse, förvänta dig inte exakt
 * strängmatchning") - och svaret på den risken är ordmängder, inte
 * teckenvikning.
 */
export function namnord(namn: string | null | undefined): string[] {
  if (typeof namn !== 'string') return [];
  return namn
    .toLocaleLowerCase('sv')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((ord) => ord !== '');
}

/**
 * Är detta samma person, så långt namnen räcker?
 *
 * REGELN: minst TVÅ gemensamma ord, eller ett enda ord på båda sidor som är
 * lika.
 *
 * Tvåordskravet är det som bär. `Anna Swish` mot `Anna Kristina Swish` delar
 * `anna` och `swish` och är samma person; `Anna Swish` mot `Anna Bergström`
 * delar bara `anna` och är det inte. Ett förnamn ensamt är ingen
 * identifiering - i en kurslista med tjugo deltagare finns det flera Annor,
 * och en matchning på förnamn hade producerat kandidater som ser
 * kvalificerade ut utan att vara det.
 *
 * Enordsundantaget finns för att basen ibland bär ett ofullständigt namn.
 * Där är ett ord allt som finns, och en exakt likhet är då det starkaste
 * bevis som är möjligt. Det ger fortfarande bara en OSÄKER kandidat, aldrig
 * en säker.
 */
export function namnLiknar(
  ena: string | null | undefined,
  andra: string | null | undefined,
): boolean {
  const enas = namnord(ena);
  const andras = namnord(andra);
  if (enas.length === 0 || andras.length === 0) return false;

  const andrasMangd = new Set(andras);
  const gemensamma = new Set(enas.filter((ord) => andrasMangd.has(ord)));

  if (gemensamma.size >= 2) return true;
  return enas.length === 1 && andras.length === 1 && gemensamma.size === 1;
}

/* ═══════════════════════════ BELOPPSJÄMFÖRELSEN ═══════════════════════════ */

/**
 * Belopp jämförs i ÖREN, inte som flyttal. `1500.00` och `1500` är samma
 * pengar, och `0.1 + 0.2 !== 0.3` är samma fälla som `summeraKronorKlient`
 * finns för att undvika.
 */
function sammaBelopp(ena: number, andra: number): boolean {
  return Math.round(ena * 100) === Math.round(andra * 100);
}

/**
 * Stämmer beloppet mot något Lotta rimligen väntar sig på anmälan?
 *
 * De fyra talen är hela priset, anmälningsavgiften, det som återstår totalt
 * och det som återstår av avgiften. De är samma fyra som inkorgens
 * BELOPPSSÖKNING redan använder (`inkorg-harledningar.ts`
 * § `beloppskandidater`), och av samma skäl: det är de tal ett belopp i
 * banken kan betyda.
 *
 * `summaInbetalt` ingår MEDVETET INTE - det är vad som redan kommit in,
 * aldrig något en ny banktransaktion kan vara.
 */
export function beloppStammer(rad: InkorgsRad, belopp: number): boolean {
  const kandidater = [
    rad.betalning.gallandePris,
    rad.betalning.anmalningsavgift,
    rad.kvar,
    rad.avgiftKvar,
  ];
  return kandidater.some((tal) => tal !== null && tal > 0 && sammaBelopp(tal, belopp));
}

/* ═══════════════════════════ MATCHNINGEN ═══════════════════════════ */

const OMATCHAD: Matchning = {
  klass: 'omatchad',
  kandidater: [],
  grund: 'Ingen anmälan matchade telefonnumret eller namnet.',
};

/**
 * Matchar EN banktransaktion mot de öppna betalningarna.
 *
 * `rader` är inkorgens egna rader, alltså de anmälningar som fortfarande
 * saknar pengar. Det är rätt mängd: en fullbetald anmälan är inte något en ny
 * inbetalning ska landa på, och att söka bland dem hade gett kandidater som
 * bara kan vara fel.
 *
 * DEN KÄNDA FÖLJDEN, öppet bokförd: importeras samma fil TVÅ gånger är
 * anmälan inte längre öppen efter den första importen, och raden blir
 * omatchad i stället för igenkänd. Dubblettskyddet ligger inte här utan i
 * databasen (`inbetalningar_bankreferens_unik_idx`), och synligheten i
 * importloggen (`bankmappning-minne.ts`) - se `SwishImport.tsx`
 * § DUBBLETTERNA.
 */
export function matchaTransaktion(
  transaktion: Transaktion,
  rader: readonly InkorgsRad[],
): Matchning {
  const telefontraffar = rader.filter((rad) =>
    sammaTelefonnummer(transaktion.telefon, rad.betalning.personTelefon),
  );

  if (telefontraffar.length === 1) {
    return {
      klass: 'saker',
      kandidater: telefontraffar,
      grund: 'Telefonnumret matchar anmälans mobilnummer.',
    };
  }

  if (telefontraffar.length > 1) {
    return {
      klass: 'osaker',
      kandidater: rankaKandidater(telefontraffar, transaktion),
      grund: 'Telefonnumret matchar flera anmälningar. Välj vilken betalningen gäller.',
    };
  }

  const namntraffar = rader.filter((rad) => namnLiknar(transaktion.namn, rad.namn));
  if (namntraffar.length === 0) return OMATCHAD;

  const medBelopp = namntraffar.filter((rad) => beloppStammer(rad, transaktion.belopp));

  return {
    klass: 'osaker',
    kandidater: rankaKandidater(namntraffar, transaktion),
    grund:
      medBelopp.length > 0
        ? 'Namnet och beloppet stämmer, men telefonnumret matchar inte. Bekräfta anmälan.'
        : 'Namnet stämmer men inte beloppet. Kan vara en delbetalning.',
  };
}

/**
 * Kandidaterna i den ordning Lotta vill se dem: beloppsträff först, sedan
 * förfallna, sedan namn i svensk ordning.
 *
 * Beloppet rankar men KVALIFICERAR INTE. En delbetalning (1 000 kr på en
 * anmälan där 2 500 saknas) träffar inget av de fyra talen och skulle
 * filtrerats bort av ett hårt beloppskrav - trots att den är helt legitim
 * och det vanligaste fallet i PRD:ns egen berättelse 5. Den sorteras därför
 * ned, aldrig ut.
 */
function rankaKandidater(rader: InkorgsRad[], transaktion: Transaktion): InkorgsRad[] {
  return [...rader].sort((a, b) => {
    const aBelopp = beloppStammer(a, transaktion.belopp);
    const bBelopp = beloppStammer(b, transaktion.belopp);
    if (aBelopp !== bBelopp) return aBelopp ? -1 : 1;
    if (a.forfallen !== b.forfallen) return a.forfallen ? -1 : 1;
    return a.namn.localeCompare(b.namn, 'sv');
  });
}
