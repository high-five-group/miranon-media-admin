import type { Transaktion } from '@/domain/models/Transaktion';
import { normaliseraBeloppKlient } from './belopp-inmatning';

/**
 * [TASK-346.10 AC #1, PRD TASK-346 § Swish-import (beslut 8)] Läser en
 * bankrapport till `Transaktion`-rader, via en KOLUMNMAPPNING som sparas per
 * bank.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KOLUMNMAPPNING ÄR BRANSCHENS SVAR, INTE VÅR UPPFINNING
 * ═══════════════════════════════════════════════════════════════════════════
 * Rapporten kommer från BANKEN, inte från Swish, och formatet varierar per
 * bank: Handelsbanken CSV enligt egen spec, Swedbank text, Nordea Excel
 * (`docs/research/swish-rapport-exportformat-2026-08-30.md` § 1, tre banker
 * verifierade). Research-passet mätte hur branschen löser det och fann samma
 * svar hos två oberoende system: Fortnox låter användaren koppla sina
 * kolumner en gång och SPARA kopplingen som mall; Pretix accepterar ett
 * fåtal format och lägger resten i en restlista för handpåläggning.
 * Slutsatsen, ordagrant ur passets § 6: branschstandarden är "kolumnmappning
 * gjord en gång per källa och sparad som mall, INTE ett hårdkodat fast
 * format per bank inbyggt i applikationskoden".
 *
 * Handelsbankens verifierade fältlista används därför som en INBYGGD PROFIL
 * (den enda riktiga specifikation vi har i handen), aldrig som det enda
 * format parsern kan läsa.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ FILFORMER, EN MEKANISM
 * ═══════════════════════════════════════════════════════════════════════════
 * Handelsbankens fil är INTE en rubrik-CSV. Den bär tre POSTTYPER, en per
 * rad: `01` startpost, `02` informationspost (en per transaktion) och `03`
 * slutpost. Det finns ingen rubrikrad alls, och fälten identifieras av sin
 * PLATS. En Nordea-export är tvärtom en vanlig rubrik-CSV.
 *
 * Mappningen nedan uttrycker båda med samma tre delar: en avgränsare, ett
 * valfritt `radfilter` (vilka rader som ÄR transaktioner) och ett
 * kolumnINDEX per internt fält. Rubrikraden är bara en rad som hoppas över;
 * rubrikTEXTEN används för att FÖRESLÅ index i dialogen, aldrig för att
 * slå upp dem vid läsning. En bank som byter kolumnrubrik utan att flytta
 * kolumnen bryter därmed ingenting.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RADFILTRET BÄR TVÅ OBEROENDE BEHOV
 * ═══════════════════════════════════════════════════════════════════════════
 * Filtret säger vilka rader som är inbetalningar. Handelsbanken-profilen
 * använder det till två saker samtidigt:
 *
 *   1. Posttypen: bara `02`-rader är transaktioner (`01`/`03` är fil-ram).
 *   2. Transaktionstypen: bara `SWH` är en INBETALNING. Formatet bär också
 *      `SWR` (återbetalning), `SWT` (retur av återbetalning), `SWU`
 *      (utbetalning) och `SWZ` (retur av utbetalning) i samma fil.
 *
 * Punkt 2 är ett PENGAFEL om den utelämnas: en utbetalning som importeras
 * som en inbetalning bokför pengar som aldrig kommit in. Fältet står inte i
 * beslut 8:s sexfältslista, och det är riktigt - det hör inte hemma i
 * `Transaktion`, som beskriver en betalning vi FAKTISKT tar emot. Det hör
 * hemma här, i läsningen, som ett filter. Bortfiltrerade rader RÄKNAS och
 * visas; de försvinner aldrig tyst.
 */

/** De sex fälten en källa kan fylla. Samma sex som `Transaktion` bär. */
export const TRANSAKTIONSFALT = [
  'datum',
  'belopp',
  'namn',
  'telefon',
  'meddelande',
  'bankreferens',
] as const;
export type Transaktionsfalt = (typeof TRANSAKTIONSFALT)[number];

/**
 * Fält utan vilka en rad inte är en betalning vi kan bokföra. `datum` är
 * medvetet INTE med: ett saknat datum kan Lotta fylla i, ett saknat belopp
 * kan hon inte gissa.
 */
export const OBLIGATORISKA_FALT: readonly Transaktionsfalt[] = ['belopp'];

/** Avgränsarna som prövas vid analys. Tabb ingår för txt-exporter. */
export const AVGRANSARE = [',', ';', '\t'] as const;
export type Avgransare = (typeof AVGRANSARE)[number];

/** En rad är en transaktion bara om kolumnen bär ett av de tillåtna värdena. */
export type Radfilter = {
  kolumn: number;
  tillatna: string[];
  /** Vad Lotta får se när raden filtreras bort. */
  skal: string;
};

export type Kolumnmappning = {
  /** Bankens namn som Lotta skrev det. Nyckeln mappningen sparas under. */
  bank: string;
  avgransare: Avgransare;
  /** Filen inleds med en rubrikrad som ska hoppas över. */
  harRubrikrad: boolean;
  radfilter: Radfilter[];
  /** Kolumnindex per internt fält, 0-baserat. `null` = källan saknar fältet. */
  kolumner: Record<Transaktionsfalt, number | null>;
};

/** En läst rad, med sitt ursprung kvar så att den kan pekas ut i UI. */
export type ImporteradRad = {
  /** 1-baserat radnummer i filen, som en texteditor räknar. */
  radnummer: number;
  transaktion: Transaktion;
};

export type Overhoppad = {
  radnummer: number;
  skal: string;
};

export type Parsresultat = {
  rader: ImporteradRad[];
  /** Rader radfiltret sorterade bort (fil-ram, utbetalningar). Räknas, aldrig tyst. */
  bortfiltrerade: Overhoppad[];
  /** Rader som SKULLE varit transaktioner men inte gick att läsa. */
  fel: Overhoppad[];
};

/* ═══════════════════════════ CSV-LÄSNINGEN ═══════════════════════════ */

/**
 * Byte order mark. Excel skriver den i sina CSV-exporter, och utan denna rad
 * blir filens FÖRSTA fält `﻿02` i stället för `02` - vilket får
 * radfiltret att kasta hela filen med ett obegripligt skäl.
 */
const BOM = '﻿';

/**
 * Delar en rad i fält enligt RFC 4180: ett fält kan omslutas av citattecken,
 * inuti dem är avgränsaren vanlig text, och ett dubblat citattecken är ett
 * enkelt.
 *
 * Handelsbankens filer bär inga citattecken alls, så för DEM vore ett enkelt
 * `split` nog. Regeln finns för alla ANDRA banker: ett namn som "Berg, Bo"
 * eller ett meddelande med semikolon i skulle annars förskjuta varenda
 * kolumn till höger om sig, och resultatet blir inte ett fel utan FEL DATA
 * (beloppet läses ur meddelandekolumnen). Husets egen CSV-skrivare följer
 * samma standard (`lib/segment-export.ts`).
 */
export function delaRad(rad: string, avgransare: string): string[] {
  const falt: string[] = [];
  let nuvarande = '';
  let inomCitat = false;

  for (let i = 0; i < rad.length; i += 1) {
    const tecken = rad[i];

    if (inomCitat) {
      if (tecken === '"') {
        if (rad[i + 1] === '"') {
          nuvarande += '"';
          i += 1;
        } else {
          inomCitat = false;
        }
      } else {
        nuvarande += tecken;
      }
      continue;
    }

    if (tecken === '"' && nuvarande.trim() === '') {
      // Citattecken öppnar bara ett fält i fältets BÖRJAN. Ett citattecken
      // mitt i ett ociterat fält (tum-tecken, en apostrofform) är text.
      inomCitat = true;
      nuvarande = '';
      continue;
    }

    if (tecken === avgransare) {
      falt.push(nuvarande);
      nuvarande = '';
      continue;
    }

    nuvarande += tecken;
  }

  falt.push(nuvarande);
  return falt;
}

/**
 * Filens rader, tomma bortsorterade men med RADNUMREN bevarade.
 *
 * Radnumret är 1-baserat och räknar filens faktiska rader, inklusive de
 * tomma. Det är det enda tal Lotta kan slå upp i sin nedladdade fil när
 * appen säger att en rad inte gick att läsa.
 *
 * Alla tre radslut hanteras: CRLF (Handelsbankens filer, mätt med `file`),
 * LF och ensamt CR.
 */
export function delaFil(innehall: string): { radnummer: number; text: string }[] {
  const utanBom = innehall.startsWith(BOM) ? innehall.slice(BOM.length) : innehall;
  return utanBom
    .split(/\r\n|\r|\n/)
    .map((text, index) => ({ radnummer: index + 1, text }))
    .filter((rad) => rad.text.trim() !== '');
}

/* ═══════════════════════════ INBYGGDA PROFILER ═══════════════════════════ */

/**
 * Handelsbankens Swish-rapport, INDEX FÖR INDEX ur bankens egen
 * formatspecifikation (v3.1.2, publicerad 2024-06-05) och verifierade mot de
 * fyra riktiga exempelfilerna i `docs/research/swish-rapport-exempel/`:
 *
 * ```text
 * 02,5566778899,123456789,HANDSESS,1235524400,2015-04-16,SWH,1500.00,SEK,
 * └0 └1         └2        └3       └4         └5         └6  └7      └8
 * +46709879879,Anna Swish,4469411476093487,Meddelande från Anna,,2015-04-16T13:32:22
 * └9           └10        └11              └12                  └13 └14
 * ```
 *
 * ═══ VARFÖR PROFILEN ÄR AVGRÄNSAR-AGNOSTISK ═══
 * Specen: "Decimaltecken för alla belopp vid kommaseparerad fil är punkt (.)
 * ... Decimaltecken i semikolonseparerad fil är kommatecken (,)". Vilken av
 * de två banken skickar är AVTALAT, inte ett val vid nedladdning - så båda
 * måste kunna läsas. Profilen bär därför ingen avgränsare alls;
 * `analyseraFil` mäter den ur filen, och `normaliseraBeloppKlient` läser
 * BÅDA decimaltecknen utan att behöva veta vilket det var.
 *
 * ═══ EXEMPELFILERNA ÄR ÄLDRE ÄN SPECEN, OCH DET SPELAR ROLL ═══
 * Specen listar 18 fält; exempelfilerna bär 15 (de saknar bokföringsdatum,
 * Instruction ID och End to End ID) och är daterade 2015. Parsern kräver
 * därför ALDRIG ett visst antal fält - bara att de index profilen faktiskt
 * läser finns. En framtida 18-fältsfil läses av samma profil utan ändring,
 * eftersom alla sex fält vi bryr oss om ligger på index 5 till 12 i BÅDA
 * versionerna.
 */
export const HANDELSBANKEN_SWISH: Omit<Kolumnmappning, 'avgransare'> = {
  bank: 'Handelsbanken (Swish-rapport)',
  harRubrikrad: false,
  radfilter: [
    {
      kolumn: 0,
      tillatna: ['02'],
      skal: 'Filens start- eller slutpost, inte en betalning.',
    },
    {
      kolumn: 6,
      tillatna: ['SWH'],
      skal: 'Raden är inte en inbetalning (utbetalning eller återbetalning).',
    },
  ],
  kolumner: {
    datum: 5,
    belopp: 7,
    telefon: 9,
    namn: 10,
    bankreferens: 11,
    meddelande: 12,
  },
};

/**
 * Känns filen igen som en Handelsbanken-rapport?
 *
 * SIGNATUREN ÄR STRUKTURELL, INTE EN GISSNING. Tre villkor måste hålla
 * samtidigt: filen inleds med en `01`-post, avslutas med en `03`-post, och
 * bär minst en `02`-rad med tillräckligt många fält för att alla profilens
 * index ska finnas. Ingen annan CSV råkar se ut så.
 *
 * AC #1 säger "okänt format ger mappningsdialog, aldrig gissning". Den här
 * funktionen gissar inte - den IDENTIFIERAR ett format vars specifikation vi
 * har läst. Håller inte alla tre villkoren returneras `false`, och filen går
 * till dialogen.
 */
export function arHandelsbanksformat(rader: { text: string }[], avgransare: Avgransare): boolean {
  if (rader.length < 3) return false;

  const forsta = delaRad(rader[0].text, avgransare)[0]?.trim();
  const sista = delaRad(rader[rader.length - 1].text, avgransare)[0]?.trim();
  if (forsta !== '01' || sista !== '03') return false;

  const hogstaIndex = Math.max(
    ...Object.values(HANDELSBANKEN_SWISH.kolumner).filter((i): i is number => i !== null),
    ...HANDELSBANKEN_SWISH.radfilter.map((f) => f.kolumn),
  );

  return rader.some((rad) => {
    const falt = delaRad(rad.text, avgransare);
    return falt[0]?.trim() === '02' && falt.length > hogstaIndex;
  });
}

/* ═══════════════════════════ FILANALYSEN ═══════════════════════════ */

/** Vad dialogen visar per kolumn: dess plats, dess rubrik och vad den bär. */
export type Kolumnprov = {
  index: number;
  /** Rubriktexten, när filen har en rubrikrad. */
  rubrik: string | null;
  /** Upp till tre värden ur filen, så Lotta ser vad kolumnen faktiskt är. */
  exempel: string[];
};

export type Filanalys = {
  avgransare: Avgransare;
  /** Filens rader, tomma bortsorterade. Radnumren är filens egna. */
  rader: { radnummer: number; text: string }[];
  kolumner: Kolumnprov[];
  /**
   * En igenkänd, verifierad profil - eller `null`, vilket betyder att filen
   * går till mappningsdialogen.
   */
  igenkand: Kolumnmappning | null;
  /** Filen hade en rubrikrad (härlett; inte ett antagande om innehållet). */
  harRubrikrad: boolean;
};

/**
 * Gissar avgränsaren genom att MÄTA, inte genom att anta: den avgränsare som
 * ger flest fält på filens rader vinner. En semikolonfil läst med komma ger
 * ett fält per rad, och tvärtom.
 *
 * Vid oavgjort vinner den FÖRSTA i `AVGRANSARE` (komma). Det spelar bara
 * roll för en fil där ingen avgränsare förekommer alls, och där är varje val
 * lika riktigt: hela raden blir ett fält.
 */
export function gissaAvgransare(rader: { text: string }[]): Avgransare {
  let bast: Avgransare = AVGRANSARE[0];
  let bastAntal = 0;

  for (const kandidat of AVGRANSARE) {
    const antal = rader.reduce((summa, rad) => summa + delaRad(rad.text, kandidat).length, 0);
    if (antal > bastAntal) {
      bastAntal = antal;
      bast = kandidat;
    }
  }
  return bast;
}

/**
 * Har filen en rubrikrad? Regeln: den första raden är en rubrikrad om INGET
 * av dess fält går att läsa som ett belopp medan minst en senare rad har ett
 * fält som gör det.
 *
 * Det är en HÄRLEDNING ur filen, inte en gissning om banken, och den är
 * medvetet konservativ: säger den fel blir konsekvensen att en rad visas i
 * dialogen som Lotta ser och kan rätta, aldrig en tyst felläsning. En
 * Handelsbanken-fil svarar `false` här (rad 1 bär datum och belopp), vilket
 * är korrekt.
 */
export function harRubrikrad(rader: { text: string }[], avgransare: Avgransare): boolean {
  if (rader.length < 2) return false;

  const harBelopp = (text: string) =>
    delaRad(text, avgransare).some((falt) => {
      const tal = normaliseraBeloppKlient(falt.trim());
      return tal !== null && tal !== 0;
    });

  return !harBelopp(rader[0].text) && rader.slice(1).some((rad) => harBelopp(rad.text));
}

/**
 * Läser filen tillräckligt för att antingen köra direkt (igenkänt format
 * eller sparad mappning) eller visa mappningsdialogen.
 *
 * `sparade` är Lottas tidigare mappningar. En sparad mappning används när
 * dess avgränsare och kolumnantal PASSAR filen - inte enbart för att den
 * finns. Att köra en Nordea-mappning på en Handelsbanken-fil hade läst
 * beloppet ur fel kolumn utan att något såg trasigt ut.
 */
export function analyseraFil(innehall: string, sparade: readonly Kolumnmappning[] = []): Filanalys {
  const rader = delaFil(innehall);
  const avgransare = gissaAvgransare(rader);
  const rubrikrad = harRubrikrad(rader, avgransare);

  const faltPerRad = rader.map((rad) => delaRad(rad.text, avgransare));
  const bredd = faltPerRad.reduce((max, falt) => Math.max(max, falt.length), 0);
  const datarader = rubrikrad ? faltPerRad.slice(1) : faltPerRad;

  const kolumner: Kolumnprov[] = Array.from({ length: bredd }, (_, index) => ({
    index,
    rubrik: rubrikrad ? (faltPerRad[0]?.[index]?.trim() ?? null) : null,
    exempel: datarader
      .map((falt) => falt[index]?.trim() ?? '')
      .filter((varde) => varde !== '')
      .slice(0, 3),
  }));

  const igenkand = valjMappning(rader, avgransare, bredd, sparade);

  return { avgransare, rader, kolumner, igenkand, harRubrikrad: rubrikrad };
}

/**
 * Vilken mappning gäller för filen? SPARAD FÖRE INBYGGD, med avsikt: har
 * Lotta en gång rättat en mappning för sin bank ska den rättelsen gälla, även
 * om filen ytligt liknar ett format vi känner igen.
 */
function valjMappning(
  rader: { text: string }[],
  avgransare: Avgransare,
  bredd: number,
  sparade: readonly Kolumnmappning[],
): Kolumnmappning | null {
  const passar = sparade.find(
    (mappning) => mappning.avgransare === avgransare && rymsIBredd(mappning, bredd),
  );
  if (passar) return passar;

  if (arHandelsbanksformat(rader, avgransare)) {
    return { ...HANDELSBANKEN_SWISH, avgransare };
  }
  return null;
}

/** Ryms mappningens högsta index i filens faktiska kolumnantal? */
function rymsIBredd(mappning: Kolumnmappning, bredd: number): boolean {
  const index = [
    ...Object.values(mappning.kolumner).filter((i): i is number => i !== null),
    ...mappning.radfilter.map((f) => f.kolumn),
  ];
  return index.length > 0 && Math.max(...index) < bredd;
}

/* ═══════════════════════════ LÄSNINGEN ═══════════════════════════ */

/**
 * ISO-datum, med eller utan efterföljande tid. Handelsbanken skriver
 * `2015-04-16`, en Excel-export kan skriva `2026-08-30 13:32`.
 *
 * ANDRA DATUMFORMER LÄSES INTE, OCH DET ÄR AVSIKTLIGT. `03/08/2026` är
 * tredje augusti i Sverige och åttonde mars i USA, och en parser som väljer
 * åt Lotta väljer fel halva tiden utan att säga något. En oläst dag blir
 * `null`, raden visar "datum saknas", och hon fyller i det själv. Det är
 * samma "aldrig gissning"-regel som AC #1 ställer på kolumnmappningen,
 * tillämpad på fältinnehållet.
 */
const ISO_DATUM_RE = /^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/;

export function lasDatum(ratext: string): string | null {
  const traff = ISO_DATUM_RE.exec(ratext.trim());
  return traff ? traff[1] : null;
}

/** Fältets värde, trimmat. `null` för saknad kolumn eller tomt fält. */
function las(falt: string[], index: number | null): string | null {
  if (index === null) return null;
  const varde = falt[index]?.trim();
  return varde === undefined || varde === '' ? null : varde;
}

/**
 * Läser hela filen med en given mappning.
 *
 * TRE UTFALL PER RAD, aldrig två: raden blir en transaktion, den
 * filtreras bort som "inte en betalning", eller den fälls med ett skäl. Den
 * sista högen är den viktiga - en rad som inte gick att läsa ska SYNAS, inte
 * försvinna. Åtta rader i banken måste bli åtta rader i appen, oavsett
 * utfall.
 */
export function parsaTransaktioner(innehall: string, mappning: Kolumnmappning): Parsresultat {
  const alla = delaFil(innehall);
  const datarader = mappning.harRubrikrad ? alla.slice(1) : alla;

  const rader: ImporteradRad[] = [];
  const bortfiltrerade: Overhoppad[] = [];
  const fel: Overhoppad[] = [];

  for (const { radnummer, text } of datarader) {
    const falt = delaRad(text, mappning.avgransare);

    const filter = mappning.radfilter.find(
      (f) => !f.tillatna.includes(falt[f.kolumn]?.trim() ?? ''),
    );
    if (filter) {
      bortfiltrerade.push({ radnummer, skal: filter.skal });
      continue;
    }

    const raBelopp = las(falt, mappning.kolumner.belopp);
    if (raBelopp === null) {
      fel.push({ radnummer, skal: 'Beloppskolumnen är tom.' });
      continue;
    }

    const belopp = normaliseraBeloppKlient(raBelopp);
    if (belopp === null) {
      fel.push({ radnummer, skal: `Beloppet gick inte att läsa: ${raBelopp}` });
      continue;
    }
    if (belopp === 0) {
      fel.push({ radnummer, skal: 'Ett nollbelopp är aldrig en inbetalning.' });
      continue;
    }
    // NEGATIVA BELOPP FÄLLS, DE VÄNDS INTE. En rad med minustecken är pengar
    // UT, och `registrera-inbetalning` hade tagit `Math.abs()` av den och
    // bokfört en inbetalning som aldrig kommit in (EF:ens § "TECKNET FÖLJER
    // TYPEN"). Återbetalningar registreras i den egna ytan (TASK-346.9), inte
    // genom en import som inte kan veta vad raden avser.
    if (belopp < 0) {
      fel.push({
        radnummer,
        skal: 'Negativt belopp. Importen registrerar bara inbetalningar.',
      });
      continue;
    }

    const raDatum = las(falt, mappning.kolumner.datum);

    rader.push({
      radnummer,
      transaktion: {
        datum: raDatum === null ? null : lasDatum(raDatum),
        belopp,
        namn: las(falt, mappning.kolumner.namn),
        telefon: las(falt, mappning.kolumner.telefon),
        meddelande: las(falt, mappning.kolumner.meddelande),
        bankreferens: las(falt, mappning.kolumner.bankreferens),
      },
    });
  }

  return { rader, bortfiltrerade, fel };
}

/**
 * Duger mappningen att läsa med? Returnerar felmeddelandet, eller `null`.
 *
 * Kontrollen sitter FÖRE läsningen och inte efter: en mappning utan
 * beloppskolumn producerar noll rader och en lista med lika många fel som
 * filen har rader, vilket ser ut som en trasig fil i stället för en
 * ofullständig mappning.
 */
export function mappningsFel(mappning: Kolumnmappning): string | null {
  if (mappning.bank.trim() === '') {
    return 'Skriv vilken bank rapporten kommer från, så sparas mappningen till nästa gång.';
  }
  const saknade = OBLIGATORISKA_FALT.filter((falt) => mappning.kolumner[falt] === null);
  if (saknade.length > 0) {
    return `Peka ut vilken kolumn som är ${saknade.join(', ')}.`;
  }
  return null;
}
