import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import type { SendActionEmailInput } from '@/domain/schemas';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';

/**
 * [TASK-241.2] Åtgärdsutskickens MALLAR + platshållar-motorn — extraherade
 * VERBATIM ur `AtgardsSida.tsx` (varv 6/19, oförändrad logik) så att
 * sändytan (`src/components/svep/`) kan återanvända EXAKT samma
 * `ATGARDER`-innehåll och `fyllPlatshallare`-motor i stället för att bygga
 * en egen kopia — ADR-114 § Implementationsbeslut: "Sändvägarna återanvänder
 * Åtgärds-sidans befintliga sändkontrakt". Ingen mall-datakälla finns ännu
 * (samma "prototyp-stubb"-status som innan flytten); den dagen mallarna
 * flyttar till en riktig datakälla byter BÅDA konsumenterna källa samtidigt,
 * eftersom de delar denna fil.
 *
 * REN FLYTT, INGEN BETEENDEÄNDRING: `AtgardsSida.tsx` importerar nu allt
 * härifrån i stället för att definiera det lokalt (samma exporterade namn,
 * samma implementation).
 */

/* ------------------------------------------------------------------ *
 * De FYRA åtgärdstyperna (varv 6, Marcus 2026-08-07) — se ordagrant
 * ursprungshistorik i `AtgardsSida.tsx` git-loggen före denna flytt.
 * ------------------------------------------------------------------ */
export type AtgardsTyp = {
  nr: number;
  /** [TASK-147.3] Typad mot EF-kontraktets `actionType` — samma union, inte
      en fri sträng — så `GranskningsSida.skicka()` kan skicka `nyckel` rakt
      in i `SendActionEmailInput` utan en runtime-check av fyra literaler. */
  nyckel: SendActionEmailInput['actionType'];
  namn: string;
  /** Prototyp-stubb: mallens ämnesrad. Ingen mall-datakälla finns ännu. */
  amne: string;
  /** Prototyp-stubb: mallens brödtext. */
  mall: string;
  /** Vilka i urvalet åtgärden är relevant för — driver räknaren på raden. */
  urvalsfilter?: (r: Registration) => boolean;
};

export const saknarAnmalningsavgift = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN;
export const saknarSlutbetalning = (r: Registration) =>
  r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;
export const obetald = (r: Registration) => saknarAnmalningsavgift(r) || saknarSlutbetalning(r);
export const obekraftad = (r: Registration) => r.status === RegistrationStatus.OBEKRAFTAD;

export const ATGARDER: AtgardsTyp[] = [
  {
    nr: 1,
    nyckel: 'bekraftelse',
    namn: 'Skicka bekräftelsemail',
    amne: 'Din plats är bekräftad',
    mall: 'Hej {förnamn},\n\nDin plats på {event} är bekräftad. Vi ses {datum} i {ort}.\n\nVarmt välkommen!\nRoger och Lotta',
    urvalsfilter: obekraftad,
  },
  {
    nr: 2,
    nyckel: 'paminnelse',
    namn: 'Skicka betalningspåminnelse',
    amne: 'Påminnelse om betalning',
    mall: 'Hej {förnamn},\n\nVi ser att betalningen för {event} inte kommit in ännu. Sista dag är {deadline}.\n\nHör gärna av dig om något krånglar.\nRoger och Lotta',
    urvalsfilter: obetald,
  },
  {
    nr: 3,
    nyckel: 'eventinfo',
    namn: 'Skicka deltagarinformation',
    amne: 'Information inför {event}',
    mall: 'Hej {förnamn},\n\nSnart är det dags! Här kommer praktisk information inför {event}.\n\nRoger och Lotta',
  },
  { nr: 4, nyckel: 'fritt', namn: 'Skicka mail', amne: '', mall: '' },
];

/* ================================================================== *
 * PLATSHÅLLARNA — granskningens skarpaste verktyg (varv 19). Se
 * `AtgardsSida.tsx`s ursprungliga docblock (git-historik) för hela
 * bakgrunden till "de ofyllda är fyndet, inte ett fel i visningen".
 * ================================================================== */
export const DAG_MANAD_FORMAT = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
});

/** Dag + månad ur en ISO-tidsstämpel ('26 juni'); null/ogiltigt → null. */
export function dagManad(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DAG_MANAD_FORMAT.format(d);
}

/** Deadline-DATUMET (inte statusraden) — 14 dagar före start, eller null. */
export function deadlineDatum(startdatum: string | null | undefined): string | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setDate(d.getDate() - 14);
  return DAG_MANAD_FORMAT.format(d);
}

/**
 * Fyller mallens platshållare för EN mottagare och rapporterar vad som inte
 * gick att fylla. Ofyllda lämnas orörda i texten — se blockets docblock.
 */
export function fyllPlatshallare(
  mall: string,
  reg: Registration | undefined,
  event: Event | undefined,
): { text: string; ofyllda: string[] } {
  const varden: Record<string, string | null | undefined> = {
    förnamn: reg?.fornamn,
    event: event?.eventNamn ?? event?.eventlabel,
    datum: dagManad(event?.startdatum),
    ort: event?.ort,
    deadline: deadlineDatum(event?.startdatum),
  };

  const ofyllda: string[] = [];
  const text = mall.replace(/\{([a-zåäöA-ZÅÄÖ]+)\}/g, (traff, nyckel: string) => {
    const varde = varden[nyckel];
    if (varde == null || varde === '') {
      if (!ofyllda.includes(traff)) ofyllda.push(traff);
      return traff;
    }
    return varde;
  });

  return { text, ofyllda };
}

/** Det som bärs över till gransknings-vyn — hela utskicket, fruset vid klicket. */
export type Granskning = {
  atgard: AtgardsTyp;
  amne: string;
  text: string;
  bilagor: string[];
};
