import { Ban, Banknote, Undo2 } from 'lucide-react';
import type { TidslinjeIkon, TidslinjeUnderrad } from '@/components/registrations/tidslinje-typer';
import type { Inbetalning, InbetalningarBatchGrupp, Kvitto } from '@/domain/schemas';
import { visaKronor } from './belopp-inmatning';
import { kvittolage } from './panel-harledningar';

/**
 * [TASK-438] EN anmälans inbetalningar som HÄNDELSER i en tidslinje — den
 * härledning eventdetaljens Händelselogg (och, i ett eget kort, persondetaljens
 * Händelser) blandar med utskicken ur `registrations/handelser.ts`.
 *
 * VARFÖR EN MODUL, INTE JSX: samma disciplin som `panel-harledningar.ts` —
 * ordvalen och uppdelningen bor i en ren funktion som kan prövas utan
 * webbläsare, och två ytor som visar samma inbetalning säger samma sak
 * ("samma sak heter samma sak var Lotta än står", Marcus dom 2026-09-01).
 *
 * ORDVALEN ÄR BETALNINGSSIDANS. `InbetalningsLista.tsx` har betalsättet som
 * radens titel och "(Återbetalning ·) datum · kvittostatus" som sekundärled;
 * här är raden en HÄNDELSE och leder därför med vad som hände — "Inbetalning
 * 2 500 kr · Swish" — medan kvittostatusen (`kvittolage`, samma text som
 * listan: "Kvitto 1023 · skickat", "Inget kvitto"), makuleringen och
 * noteringen står som dämpade underrader. Beloppet visas ALLTID som ett
 * positivt tal: typordet ("Återbetalning") bär riktningen, inte tecknet —
 * ett minustecken framför ett ord som redan säger "återbetalning" hade sagt
 * samma sak två gånger.
 *
 * EN MAKULERAD INBETALNING SYNS, MED SITT SKÄL. ADR-128: "sanningen rättas
 * utan att kvittot försvinner ur bokföringen" — en logg som tystade
 * makulerade rader hade dolt just den historik en logg finns för. Raden får
 * `Ban`-ikonen och underraden "Makulerad: <skäl>", betalningssidans ord.
 * EN MEDVETEN SKILLNAD mot `InbetalningsLista.tsx` (granskarfynd PR #2468
 * r1): saknar en makulerad rad skäl (typen tillåter `null`, EF:en kräver
 * 3–500 tecken så vägen är i praktiken stängd) tystnar listan, medan loggen
 * säger "Makulerad" utan skäl — en logg som döljer att raden är makulerad
 * hade ljugit om historiken, vilket är exakt vad ADR-128 förbjuder.
 *
 * KVITTOJOBBETS FELSKÄL (`kvittolage(...).felskal`) VISAS INTE HÄR, med
 * avsikt: det hör till en yta där Lotta kan göra något åt det (köa om,
 * skicka igen) — betalningssidan. Loggen är en läsyta; kvittots LÄGE
 * ("väntar på att skickas") räcker för att säga att något inte gått fram.
 *
 * TIDEN: `betalningsdatum` (Lottas datum, utan klockslag) före `skapadNar`
 * (radens skapelse, ISO med klockslag). Callern formaterar — och måste
 * skilja ett rent datum från en tidpunkt, annars visas "00:00" för en
 * betalning som bara har ett datum. `arRentDatum` finns för det.
 */

export interface InbetalningsHandelse {
  /** Stabil list-nyckel. */
  id: string;
  /** `YYYY-MM-DD` (betalningsdatum) eller ISO-tidpunkt (skapadNar) — callern formaterar. */
  nar: string;
  text: string;
  /** Dämpade underrader i ordningen kvittostatus · makulering · notering; `id` = slaget. */
  undertext: TidslinjeUnderrad[];
  ikon: TidslinjeIkon;
}

/** `YYYY-MM-DD` utan klockslag — formateras som dag och månad, aldrig med tid. */
export function arRentDatum(nar: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(nar);
}

/** Händelserna för EN anmälan ur batch-svaret (TASK-437). Ordningen är svarets;
    callern sorterar tillsammans med utskicken. */
export function inbetalningsHandelser(grupp: InbetalningarBatchGrupp): InbetalningsHandelse[] {
  // EN uppslagning per grupp, aldrig en sökning per rad (samma princip som
  // `InbetalningsLista.tsx` § jobbfelPerInbetalning).
  const jobbfel = new Map(grupp.jobbfel.map((f) => [f.inbetalningId, f.skal]));
  return grupp.inbetalningar.map((i) =>
    inbetalningsHandelse(i, grupp.kvitton, jobbfel.get(i.id) ?? null),
  );
}

function inbetalningsHandelse(
  inbetalning: Inbetalning,
  kvitton: readonly Kvitto[],
  felskal: string | null,
): InbetalningsHandelse {
  const makulerad = inbetalning.status === 'makulerad';
  const aterbetalning = inbetalning.typ === 'aterbetalning';
  const lage = kvittolage(inbetalning, kvitton, felskal);
  const undertext: TidslinjeUnderrad[] = [{ id: 'kvitto', text: lage.text }];
  if (makulerad) {
    undertext.push({
      id: 'makulering',
      text: inbetalning.makuleradSkal ? `Makulerad: ${inbetalning.makuleradSkal}` : 'Makulerad',
    });
  }
  if (inbetalning.notering) {
    undertext.push({ id: 'notering', text: `Notering: ${inbetalning.notering}` });
  }
  return {
    id: `inbetalning-${inbetalning.id}`,
    nar: inbetalning.betalningsdatum ?? inbetalning.skapadNar,
    text: `${aterbetalning ? 'Återbetalning' : 'Inbetalning'} ${visaKronor(Math.abs(inbetalning.belopp))} kr · ${inbetalning.betalsatt}`,
    undertext,
    ikon: makulerad ? Ban : aterbetalning ? Undo2 : Banknote,
  };
}
