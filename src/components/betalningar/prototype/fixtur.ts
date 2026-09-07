import type { OppenBetalning } from '@/domain/schemas';

/**
 * [PROTOTYPE] Deterministisk fixtur för bekräftelsesteget (S121). Sedan
 * konvergens varv 2 (2026-09-05) bär den MARCUS BERÄTTELSE om Lottas morgon,
 * verbatim ur chatten:
 *
 * > "Hon har sett på sitt kontoutdrag denna morgon att hon fått in 8 swishar
 * > och 2 bankgiro-inbetalningar. Hon ser att 6 av dem har beloppet 1000kr
 * > och vet därför att det är anmälningsavgifter. 4 belopp är 1500kr, alltså
 * > slutbetalningar (resterande). … de 6 anmälningsavgifterna som inbetalats
 * > är spridda över 3 olika framtida event. Hon ser att alla 4 inbetalningar
 * > på 1500 kr är för ett och samma event."
 *
 * Raderna är litteraler i `OppenBetalning`-form, samma kontrakt som
 * `useOppnaBetalningar` levererar. Ingen läsning ur basen, ingen mutation.
 *
 * EVENTNAMNEN ÄR FULLA ("Resor i medvetandet 1, Skövde") — så ser `eventNamn` ut i datat
 * (inkorgen visar "Fjärrskådning, ZZ-GRANSKNING-S113B · 2026-09-07"), och
 * rubriken ska läsa exakt som där (Marcus varv 4/5: *"Lotta måste känna
 * igen sig"*). Utan orten såg gruppens rubrik kortare ut än inkorgens.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BERÄTTELSEN I RADER
 * ═══════════════════════════════════════════════════════════════════════════
 *   • Resor i medvetandet 1, Skövde (pris 2 500, avgift 1 000, 20 sep): FYRA som redan betalat
 *     avgiften och nu betalat resten 1 500 — Anna, Björn, Cecilia, David.
 *     Cecilia har passerad deadline (förfallen). Plus TVÅ nya som betalat
 *     avgiften 1 000 — Erik (obekräftad anmälan, normalt för en ny) och Fatima.
 *   • Fjärrskådning (pris 3 500, avgift 1 000, 27 sep): TVÅ nya — Gunnar och
 *     Hanna.
 *   • Psionautics (pris 4 500, avgift 1 000, 25 okt): TVÅ nya — Ida och Johan.
 *
 *   Sex avgifter à 1 000 över tre event, fyra slutbetalningar à 1 500 i ett
 *   event: 12 000 kr. Betalsätten (åtta Swish, två bankgiro) bär datat inte —
 *   dem sätter Lotta i steget, och de två bankgiro-raderna är exakt de
 *   undantag steget ska göra billiga.
 *
 * Datumen är frusna vid `FIXTUR_IDAG` så "förfallen"/"kommande" är stabila
 * oavsett när prototypen öppnas (härledningarna läser aldrig klockan).
 */

/** Fryst "i dag" för fixtur-läget. Cecilias deadline ligger före detta. */
export const FIXTUR_IDAG = '2026-09-04';

/**
 * Raden som fallerar i den simulerade registreringen (beslut 4: "ett fel
 * stoppar inte de andra"). En ny anmälan, så raden bär belopp under alla
 * bulkval och felet syns oavsett vad Lotta valt.
 */
export const FIXTUR_FEL_ID = 'rec-fjarr-001';

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
    oskickadeKvitton: [],
    saknas,
    ...over,
  };
}

const RIM = {
  eventId: 'rec-event-rim1',
  eventNamn: 'Resor i medvetandet 1, Skövde',
  eventStartdatum: '2026-09-20',
  eventTyp: 'Kurs',
  gallandePris: 2500,
  anmalningsavgift: 1000,
} as const;

const FJARR = {
  eventId: 'rec-event-fjarr',
  eventNamn: 'Fjärrskådning, Göteborg',
  eventStartdatum: '2026-09-27',
  eventTyp: 'Kurs',
  gallandePris: 3500,
  anmalningsavgift: 1000,
} as const;

const PSIO = {
  eventId: 'rec-event-psio',
  eventNamn: 'Psionautics, Stockholm',
  eventStartdatum: '2026-10-25',
  eventTyp: 'Kurs',
  gallandePris: 4500,
  anmalningsavgift: 1000,
} as const;

export function bekraftelseFixtur(): OppenBetalning[] {
  return [
    // ── RIM 1: fyra slutbetalningar (avgiften redan betald) ──
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-001',
      personNamn: 'Anna Lindqvist',
      summaInbetalt: 1000,
    }),
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-002',
      personNamn: 'Björn Sjöberg',
      summaInbetalt: 1000,
    }),
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-003',
      personNamn: 'Cecilia Malm',
      summaInbetalt: 1000,
      // Slutbetalningens deadline passerad (ligger före FIXTUR_IDAG).
      deadlineSlutbetalning: '2026-08-28',
    }),
    rad({ ...RIM, anmalanRecordId: 'rec-rim-004', personNamn: 'David Ek', summaInbetalt: 1000 }),
    // ── RIM 1: två nya som betalat avgiften ──
    rad({
      ...RIM,
      anmalanRecordId: 'rec-rim-005',
      personNamn: 'Erik Holm',
      summaInbetalt: 0,
      anmalanStatus: 'Obekräftad',
    }),
    rad({ ...RIM, anmalanRecordId: 'rec-rim-006', personNamn: 'Fatima Nouri', summaInbetalt: 0 }),

    // ── Fjärrskådning: två nya ──
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-001',
      personNamn: 'Gunnar Falk',
      summaInbetalt: 0,
    }),
    rad({
      ...FJARR,
      anmalanRecordId: 'rec-fjarr-002',
      personNamn: 'Hanna Wikström',
      summaInbetalt: 0,
    }),

    // ── Psionautics: två nya ──
    rad({ ...PSIO, anmalanRecordId: 'rec-psio-001', personNamn: 'Ida Ström', summaInbetalt: 0 }),
    rad({ ...PSIO, anmalanRecordId: 'rec-psio-002', personNamn: 'Johan Lund', summaInbetalt: 0 }),
  ];
}
