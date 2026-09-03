import type { Event } from '@/domain/models/Event';

/**
 * BELÄGGNINGENS KOMPOSITION (TASK-373) — ren logik, utbruten ur
 * `components/events/detail/Belaggning.tsx` så mätarens aritmetik kan bevisas
 * hermetiskt (`tests/api/belaggning.test.ts`) i stället för bara genom en
 * renderad sida. Samma ETT-uppslag-disciplin som `aktiv-anmalan.ts`.
 *
 * FÄRGERNA BOR INTE HÄR: modulen returnerar `nyckel` + `antal`; komponenten
 * mappar nyckeln till sin Tailwind-klass. Presentation stannar i vyn.
 *
 * ══ INVARIANTEN mätaren måste hålla (kortets AC) ══
 *
 *   upptagna === basens `Antal anmälda` + basens `Extra platser`
 *
 * där basens `Antal anmälda` (fldTQkYOz9O2BGEIZ) sedan TASK-368.1 är
 * `{Antal aktiva anmälningar} + {Manuella platser}`. Delarna nedan ger exakt
 * det, förutsatt att get-event partitionerar de aktiva anmälningarna i
 * viaFormular + medfoljande + ovrigaAnmalningar (`_shared/belaggning.ts`):
 *
 *   (viaFormular + ovrigaAnmalningar)   ← "Anmälda deltagare"-raden
 * + manuelltTillagda                    ← basens 'Manuella platser' (SKRIVBART)
 * + medfoljande                         ← "Medföljande"-raden
 * + reserverade                         ← basens 'Extra platser' (SKRIVBART)
 * = Antal aktiva anmälningar + Manuella platser + Extra platser
 * = Antal anmälda + Extra platser ✔
 *
 * ══ VARFÖR 'Manuell' HAMNAR I FORMULÄR-RADEN OCH INTE I "Manuellt tillagda" ══
 *
 * Frestelsen är att lägga `Källa = 'Manuell'` i manuell-segmentet — etiketten
 * matchar ju ordagrant. Två skäl väger tyngre:
 *
 *  1. "Manuellt tillagda" är en SKRIVBAR fält-rad (Ändra-morfen skriver
 *     'Manuella platser' via update-event). Visnings-läget måste visa SAMMA tal
 *     som Ändra-lägets "ändrar från", annars ljuger morfen. En härledd räkning
 *     ovanpå fältvärdet hade brutit det.
 *  2. Raderna måste SUMMERA till mätaren för att vara avstämbara — det är hela
 *     poängen med K16 ("mappar basen 1-till-1"). Ett segment som räknar mer än
 *     sin rad visar är samma klass av oförklarligt tal som buggen kortet rättar.
 *
 * Följden, öppet bokförd: "Anmälda deltagare" är alla aktiva anmälda UTOM de
 * medföljande — oavsett väg in. Deltagarkortens pill ('Manuellt tillagd' ·
 * 'Från väntelistan', `hallplats-steg-prototyp.ts` § kategoriPillText) beskriver
 * en ANNAN axel: HUR personen kom in, inte VAD som fyller taket. Vem som kom in
 * hur läses i registret (Väg in-filtret), inte i kapacitets-mätaren.
 */

/** Mätarens segment == kategoriradernas streck, i fyllnadsordning (K16). */
export type BelaggningsNyckel = 'formular' | 'manuell' | 'medfoljande' | 'reserverad';

export type BelaggningsDel = { nyckel: BelaggningsNyckel; antal: number };

/**
 * "Anmälda deltagare"-radens tal: alla AKTIVA anmälningar utom de medföljande.
 * `ovrigaAnmalningar` saknas i svar från en äldre deployad get-event → 0, alltså
 * exakt beteendet före TASK-373 (aldrig ett fel, aldrig NaN).
 */
export function anmaldaDeltagare(e: Event): number {
  return (e.viaFormular ?? 0) + (e.ovrigaAnmalningar ?? 0);
}

/**
 * Delarna som fyller taket, i den ordning de fyller det (deltagare först,
 * reserverade sist; segmentordningen == radordningen). Saknade fält (stale
 * cache/osatt) → 0. Väntelistan är ALDRIG en del — utanför taket (K22).
 */
export function belaggningsDelar(e: Event): BelaggningsDel[] {
  return [
    { nyckel: 'formular', antal: anmaldaDeltagare(e) },
    { nyckel: 'manuell', antal: e.manuelltTillagda ?? 0 },
    { nyckel: 'medfoljande', antal: e.medfoljande ?? 0 },
    { nyckel: 'reserverad', antal: e.reserverade ?? 0 },
  ];
}

/** Mätarens "upptagna" — summan av delarna (inkl. reserverade; därav "upptagna"). */
export function belaggningUpptagna(e: Event): number {
  return belaggningsDelar(e).reduce((summa, del) => summa + del.antal, 0);
}
