// Platshållare-mirror för åtgärdsutskicken (TASK-147.1, ADR-067-revisionen).
//
// SPEGLAR EXAKT src/components/events/atgarder/AtgardsSida.tsx:
//   :443 `DAGMANAD_LANG` (Intl.DateTimeFormat('sv-SE', {day:'numeric',month:'long'}))
//   :446 `deadlineDatum` (14 dagar före startdatum)
//   :459 `fyllPlatshallare` (platshållar-regex + fyllnings-/ofylld-kontraktet)
// — INTE en delad import: src/ är Vite-sidan, onåbar från en Deno-EF (runtime-
// gränsen; samma disciplin som prepare-bulk-send.ts:79 `normalizeEmail` speglar
// src/lib/segment-export.ts:40, ELLER get-events/get-event:s `selectName`-bruk
// av 'Event (source)'/'Ort'/'Startdatum'). HÅLL FORMERNA I SYNK VID ÄNDRING —
// AtgardsSida.tsx:s egen docblock (rad 1981) slår fast VARFÖR: "Var och en får
// sitt eget mail (PRD berättelse 10), så det finns ingen enda sann text att visa
// — det finns N stycken." Granskningen Lotta ser är EN representativ mottagares
// rendering; det FAKTISKA utskicket renderar N unika mail. Driver de isär är
// granskningen en lögn.
//
// OFYLLDA PLATSHÅLLARE LÄMNAS LITERALT I TEXTEN, ALDRIG TYST BLANKADE — samma
// kontrakt som klientens `fyllPlatshallare`: "DE OFYLLDA ÄR FYNDET, INTE ETT FEL
// I VISNINGEN." Ett mail som går ut med `Sista dag är {deadline}.` är ett
// SYNLIGT fel Lotta kan agera på, aldrig ett dolt.

const DAGMANAD_LANG_SV = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });

/** De FEM platshållarna åtgärdsmallarna bär (AtgardsSida.tsx `ATGARDER`/`fyllPlatshallare`). */
export type TemplateVars = {
  förnamn: string | null;
  event: string | null;
  datum: string | null;
  ort: string | null;
  deadline: string | null;
};

/** Dag + månad, sv-SE ('15 augusti') — speglar AtgardsSida.tsx:562 `dagManad`. */
export function dagManad(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DAGMANAD_LANG_SV.format(d);
}

/** 14 dagar före startdatum — speglar AtgardsSida.tsx:446 `deadlineDatum`. */
export function deadlineDatum(startdatum: string | null | undefined): string | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setDate(d.getDate() - 14);
  return DAGMANAD_LANG_SV.format(d);
}

/**
 * Fyll mallens platshållare för EN mottagare — speglar AtgardsSida.tsx:459
 * `fyllPlatshallare` REGEL FÖR REGEL (samma regex, samma "lämna literalt vid
 * miss"-kontrakt). Ren funktion, inget I/O.
 */
export function fillPlaceholders(
  template: string,
  vars: TemplateVars,
): { text: string; ofyllda: string[] } {
  const varden: Record<string, string | null | undefined> = { ...vars };
  const ofyllda: string[] = [];
  const text = template.replace(/\{([a-zåäöA-ZÅÄÖ]+)\}/g, (traff, nyckel: string) => {
    const varde = varden[nyckel];
    if (varde == null || varde === '') {
      if (!ofyllda.includes(traff)) ofyllda.push(traff);
      return traff;
    }
    return varde;
  });
  return { text, ofyllda };
}
