import type { OppenBetalning } from '@/domain/schemas';

/**
 * [PROTOTYPE] Deterministisk fixtur för bekräftelsestegets divergens-pass
 * (S121 beslut 8). TIO rader i TRE event, hopsatt för att täcka VARJE
 * tillstånd besluten i Del 2 nämner — se § Täckningen nedan. Ingen riktig
 * mutation, ingen läsning ur basen: raderna är litteraler i
 * `OppenBetalning`-form (`src/domain/schemas/Betalningar.schema.ts`), samma
 * kontrakt `useOppnaBetalningar` levererar, så variant-koden inte kan se
 * skillnad på fixtur och staging.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DATUMEN ÄR FRUSNA VID `FIXTUR_IDAG`
 * ═══════════════════════════════════════════════════════════════════════════
 * Härledningarna (`harledRad`, `grupperaPerEvent`) tar `idag` som argument och
 * läser aldrig klockan (deras egen regel). Fixtur-läget matar dem
 * `FIXTUR_IDAG` i stället för `idagIso()`, så "förfallen" och "kommande" är
 * stabila oavsett när prototypen öppnas — en skärmdump tagen om ett halvår
 * visar samma sak som en tagen i dag. Staging-läget använder den riktiga
 * `idagIso()`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TÄCKNINGEN (varje tillstånd besluten nämner, med raden som bär det)
 * ═══════════════════════════════════════════════════════════════════════════
 *   • anmälningsavgiften saknas (bulk "Anmälningsavgift" ger ett belopp):
 *     rad 1-4 (RIM 1, avgift 1 000) + rad 6-9 (Fjärrskådning, avgift 1 500)
 *     = ÅTTA rader.
 *   • annan anmälningsavgift per event: RIM 1 = 1 000, Fjärrskådning = 1 500,
 *     så samma bulkval ger OLIKA belopp per rad.
 *   • hela priset saknas (inget fack, bulk "Allt som saknas" är beloppet):
 *     rad 10 (föreläsning, ett pris utan fack) + rad 5:s rest (avgiften redan
 *     betald, kvar = slutbetalningen).
 *   • avgiften redan betald ⇒ "Anmälningsavgift" går inte ihop, raden får
 *     ingen siffra utan en markering: rad 5 (Erik, 1 000 redan inbetalt).
 *   • Obekräftad anmälan (registreras som vanligt, förblir märkt): rad 3.
 *   • Förfallen (slutbetalningens deadline passerad): rad 4.
 *   • föreläsning med ETT pris utan fack (ADR-128 beslut 6): rad 10.
 *
 * Namnen är påhittade deltagare; eventnamnen är husets värld (RIM,
 * Fjärrskådning, en föreläsning). Alla belopp i hela kronor.
 */

/** Fryst "i dag" för fixtur-läget. Rad 4:s deadline ligger före detta. */
export const FIXTUR_IDAG = '2026-09-04';

/**
 * Radens `anmalanRecordId` som fallerar i den simulerade registreringen
 * (beslut 4: "ett fel stoppar inte de andra"). Vald till en rad som ALLTID
 * bär ett belopp under båda bulkvalen (Fjärrskådning, avgift 1 500 · kvar
 * 3 500), så felet syns oavsett vilket bulkval Lotta gjort.
 */
export const FIXTUR_FEL_ID = 'rec-fjarr-002';

/** Bygger EN rad utan att upprepa de fält varje rad delar. */
function rad(
  over: Partial<OppenBetalning> &
    Pick<OppenBetalning, 'anmalanRecordId' | 'personNamn' | 'gallandePris' | 'summaInbetalt'>,
): OppenBetalning {
  const gallandePris = over.gallandePris;
  const summaInbetalt = over.summaInbetalt;
  const saknas = gallandePris === null ? null : gallandePris - summaInbetalt;
  return {
    personEpost: null,
    personTelefon: null,
    eventId: null,
    eventNamn: null,
    eventStartdatum: null,
    eventTyp: 'Kurs',
    anmalanStatus: 'Bekräftad',
    anmalningsavgift: null,
    summaInbetaltSpegel: summaInbetalt,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    saknas,
    ...over,
  };
}

/** RIM 1 — kurs, pris 2 500, anmälningsavgift 1 000, startar 2026-09-20. */
const RIM = {
  eventId: 'rec-event-rim1',
  eventNamn: 'RIM 1',
  eventStartdatum: '2026-09-20',
  eventTyp: 'Kurs',
  gallandePris: 2500,
  anmalningsavgift: 1000,
} as const;

/** Fjärrskådning — kurs, pris 3 500, ANNAN avgift 1 500, startar 2026-09-27. */
const FJARR = {
  eventId: 'rec-event-fjarr',
  eventNamn: 'Fjärrskådning',
  eventStartdatum: '2026-09-27',
  eventTyp: 'Kurs',
  gallandePris: 3500,
  anmalningsavgift: 1500,
} as const;

export function bekraftelseFixtur(): OppenBetalning[] {
  return [
    // ── RIM 1 (avgift 1 000) ──
    rad({ ...RIM, anmalanRecordId: 'rec-rim-001', personNamn: 'Anna Lindqvist', summaInbetalt: 0 }),
    rad({ ...RIM, anmalanRecordId: 'rec-rim-002', personNamn: 'Björn Sjöberg', summaInbetalt: 0 }),
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-003',
      personNamn: 'Cecilia Malm',
      summaInbetalt: 0,
      anmalanStatus: 'Obekräftad',
    }),
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-004',
      personNamn: 'David Ek',
      summaInbetalt: 0,
      // Deadline passerad (ligger före FIXTUR_IDAG) ⇒ förfallen.
      deadlineSlutbetalning: '2026-08-20',
    }),
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-005',
      personNamn: 'Erik Holm',
      // Anmälningsavgiften (1 000) är redan betald ⇒ "Anmälningsavgift" går
      // inte ihop, raden markeras. Kvar = slutbetalningen (1 500).
      summaInbetalt: 1000,
    }),

    // ── Fjärrskådning (avgift 1 500 — annan än RIM 1) ──
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-001',
      personNamn: 'Fatima Nouri',
      summaInbetalt: 0,
    }),
    // rec-fjarr-002 = FIXTUR_FEL_ID, raden som fallerar i simuleringen.
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-002',
      personNamn: 'Gunnar Falk',
      summaInbetalt: 0,
    }),
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-003',
      personNamn: 'Hanna Wikström',
      summaInbetalt: 0,
    }),
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-004',
      personNamn: 'Ida Ström',
      summaInbetalt: 0,
    }),

    // ── Föreläsning — ETT pris utan fack (ADR-128 beslut 6) ──
    rad({
      anmalanRecordId: 'rec-forel-001',
      personNamn: 'Johan Lund',
      eventId: 'rec-event-forel',
      eventNamn: 'Föreläsning: Att tyda drömmar',
      eventStartdatum: '2026-09-12',
      eventTyp: 'Föreläsning',
      // Priset ÄR avgiften (ett fack) ⇒ inga två fack; "Allt som saknas" = 500.
      gallandePris: 500,
      anmalningsavgift: 500,
      summaInbetalt: 0,
    }),
  ];
}
