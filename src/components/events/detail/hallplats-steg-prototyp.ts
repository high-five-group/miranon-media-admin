/**
 * [PROTOTYPE] S93 hållplats-pass — KASTBAR delad logik + fixturer.
 *
 * Ren härledning (ingen React, inga hooks) delad av
 * `DeltagareHallplatsPrototyp.tsx`, `Deltagare.tsx`:s DEV-grindade gren och
 * `Betalningar.tsx`:s DEV-grindade gren. Frågan denna modul tjänar bor i
 * `DeltagareHallplatsPrototyp.tsx` (huvudprototypfilen).
 *
 * `hallplatsSteg()` är den Fable-designade tillståndsmodellen ur uppdraget:
 * SEX möjliga steg, prioritetsordning uppifrån — en person bär EXAKT ETT
 * märke även när det underliggande datat är ett NÄT (research-doken Del 3),
 * inte en kedja. `Status === Obekräftad` slår ALLTID betalningsläget (4:an
 * före 5:an) — en obekräftad-och-betald person (Del 3 fall A, verifierat i
 * staging) visar därför "Väntar på bekräftelse", inte "Klar": märket visar
 * det längst bak liggande OFÄRDIGA steget.
 *
 * KASTBAR (throwaway-kontraktet): rivs med hela S93-hållplats-passet.
 */
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationSource, RegistrationStatus } from '@/domain/types/Status';

/** Divergens-variantens stabila nycklar (ADR-074 beslut 1). */
export type HallplatsVariant = 'a' | 'b' | 'c';

export function isHallplatsVariant(v: string | null): v is HallplatsVariant {
  return v === 'a' || v === 'b' || v === 'c';
}

/** Tillståndsmodellen — se docblocket ovan för prioritetsordningen. */
export type HallplatsSteg =
  | 'vantar-bekraftelse'
  | 'vantar-betalning'
  | 'klar'
  | 'avbokad'
  | 'installt'
  | 'till-vantelista';

/** Etiketterna — orden ur research-doken Del 6C, ordagrant. */
export const HALLPLATS_LABEL: Record<HallplatsSteg, string> = {
  'vantar-bekraftelse': 'Väntar på bekräftelse',
  'vantar-betalning': 'Väntar på betalning',
  klar: 'Klar',
  avbokad: 'Avbokad',
  installt: 'Inställt',
  'till-vantelista': 'På väg till väntelistan',
};

/**
 * Betalningspåminnelse skickad — förenklad kopia av `Deltagare.tsx`:s privata
 * `harPaminnelse` (samma tre parallella tidsstämplar). Duplicerad hit så
 * `Betalningar.tsx`:s DEV-gren (A′ inbakat — räknaren flyttar hit) kan räkna
 * den utan tvärimport mellan skarpa filer.
 */
export function harPaminnelse(r: Registration): boolean {
  return (
    r.betalningspaminnelseSkickad != null ||
    r.paminnelseAnmalningsavgiftSkickad != null ||
    r.paminnelseSlutbetalningSkickad != null
  );
}

/**
 * Betalningen KLAR (delad formel med `Betalningar.tsx`:s `avgiftKlar`/`slutKlar`
 * — förenklad kopia, kastbar precedent ur S86:s `DeltagareBekraftaPrototyp.tsx`):
 * anmälningsavgiften Mottagen OCH slutbetalningen Mottagen ELLER Ej relevant
 * (föreläsningar saknar slutbetalning helt — Del 3 fall F).
 */
export function betalKlar(r: Registration): boolean {
  const avgift = r.anmalningsavgift === PaymentStatus.MOTTAGEN;
  const slut =
    r.slutbetalning === PaymentStatus.MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_RELEVANT;
  return avgift && slut;
}

/**
 * Härledningen (uppdragets prioritetsordning, 1→5):
 * 1. Avbokad/Ombokad → 'avbokad'
 * 2. Inställt → 'installt'
 * 3. Flytta till väntelista → 'till-vantelista'
 * 4. Obekräftad → 'vantar-bekraftelse' (ÄVEN om betald — se docblock ovan)
 * 5. Annars (Bekräftad (mail skickat) ELLER Betalningspåminnelse skickad):
 *    betalKlar → 'klar', annars 'vantar-betalning'.
 */
export function hallplatsSteg(r: Registration): HallplatsSteg {
  if (r.status === RegistrationStatus.AVBOKAD) return 'avbokad';
  if (r.status === RegistrationStatus.INSTALLT) return 'installt';
  if (r.status === RegistrationStatus.FLYTTA_TILL_VANTELISTA) return 'till-vantelista';
  if (r.status === RegistrationStatus.OBEKRAFTAD) return 'vantar-bekraftelse';
  return betalKlar(r) ? 'klar' : 'vantar-betalning';
}

/**
 * Kategori-pillens text (förenklad kopia av `Deltagare.tsx`:s `KATEGORI_PILL`
 * — duplicerad hit eftersom Betalningar.tsx är en ANNAN skarp fil och
 * prototypkonventionen är egna märkta kastbara filer, inte tvärimport mellan
 * skarpa filer). Normen (via formulär) bär inget märke (K37).
 */
export function kategoriPillText(r: Registration): string | null {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'Manuellt tillagd';
    case RegistrationSource.MEDFOLJANDE:
      return 'Medföljande';
    case RegistrationSource.VANTELISTA:
      return 'Från väntelistan';
    default:
      return null;
  }
}

/**
 * FIXTURUPPSÄTTNINGEN (`?data=proto`) — 14 poster, in-memory, READ-ONLY.
 * Täcker research-dokens Del 3-nät + uppdragets datakrav:
 *
 *  · normalflöden i alla tre huvudsteg (01/02 · 03/04 · 05/06)
 *  · obekräftad+betald, Källa Manuell — Del 3 fall A (07, "Maria Holm")
 *  · bekräftad som aldrig betalar, redan påmind — Del 3 fall B (08, "Peter Lund")
 *  · avbokad ×2 — Del 3 fall C (09, 10)
 *  · Inställt — Del 3 fall D (11, "Nina Palm")
 *  · Flytta till väntelista — Del 3 fall D (12, "Oskar Dahl")
 *  · medföljande +1 — Del 3 fall E (13, "Emma Söder", länkad till 05)
 *  · från väntelistan (uppflyttad) — Del 3 fall E (14, "Gustav Wik")
 *
 * `eventId`/`personId` sätts av konsumenten (event.id resp. null — se
 * DeltagareHallplatsPrototyp.tsx docblock om varför personId alltid är null
 * här). `id`-prefixet `proto-hallplats-` gör fixturerna omisskännliga i DOM
 * och devtools.
 */
function bas(overrides: Partial<Registration> & { id: string; namn: string }): Registration {
  return {
    fornamn: null,
    efternamn: null,
    email: `${overrides.namn.toLowerCase().replace(/\s+/g, '.')}@exempel.se`,
    telefon: null,
    eventNamn: null,
    ort: null,
    status: RegistrationStatus.OBEKRAFTAD,
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-20T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: null,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 0,
    borOver: false,
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    erfarenhetsbadge: null,
    kurshistorik: null,
    ...overrides,
  };
}

export const HALLPLATS_PROTO_FIXTURES: Registration[] = [
  // 01–02: väntar på bekräftelse (normalflöde)
  bas({
    id: 'proto-hallplats-01',
    namn: 'Anna Ek',
    status: RegistrationStatus.OBEKRAFTAD,
    inskickad: '2026-07-18T08:30:00.000Z',
  }),
  bas({
    id: 'proto-hallplats-02',
    namn: 'Erik Larsson',
    status: RegistrationStatus.OBEKRAFTAD,
    inskickad: '2026-07-22T10:15:00.000Z',
  }),
  // 03–04: väntar på betalning (normalflöde)
  bas({
    id: 'proto-hallplats-03',
    namn: 'Sara Nilsson',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-19T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
  }),
  bas({
    id: 'proto-hallplats-04',
    namn: 'Johan Berg',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-19T09:05:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
  }),
  // 05–06: klara (normalflöde)
  bas({
    id: 'proto-hallplats-05',
    namn: 'Karin Ström',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-15T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.MOTTAGEN,
    antalGenomfordaEvent: 2,
  }),
  bas({
    id: 'proto-hallplats-06',
    namn: 'Fredrik Åkesson',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-16T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_RELEVANT,
  }),
  // 07: Del 3 fall A — obekräftad OCH betald, Källa Manuell
  bas({
    id: 'proto-hallplats-07',
    namn: 'Maria Holm',
    status: RegistrationStatus.OBEKRAFTAD,
    kalla: RegistrationSource.MANUELL,
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
    inskickad: '2026-07-25T14:00:00.000Z',
  }),
  // 08: Del 3 fall B — bekräftad, betalar aldrig, redan påmind
  bas({
    id: 'proto-hallplats-08',
    namn: 'Peter Lund',
    status: RegistrationStatus.BETALNINGSPAMINNELSE,
    bekraftelseSkickad: '2026-06-20T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
    betalningspaminnelseSkickad: '2026-07-10T09:00:00.000Z',
    paminnelseAnmalningsavgiftSkickad: '2026-07-10T09:00:00.000Z',
  }),
  // 09–10: Del 3 fall C — avbokade (exkluderas ur `aktiva`, egen räknerad)
  bas({
    id: 'proto-hallplats-09',
    namn: 'Lisa Fransson',
    status: RegistrationStatus.AVBOKAD,
  }),
  bas({
    id: 'proto-hallplats-10',
    namn: 'Tomas Berggren',
    status: RegistrationStatus.AVBOKAD,
  }),
  // 11: Del 3 fall D — Inställt (arrangör-initierat)
  bas({
    id: 'proto-hallplats-11',
    namn: 'Nina Palm',
    status: RegistrationStatus.INSTALLT,
    bekraftelseSkickad: '2026-07-05T09:00:00.000Z',
  }),
  // 12: Del 3 fall D — Flytta till väntelista (på väg NER)
  bas({
    id: 'proto-hallplats-12',
    namn: 'Oskar Dahl',
    status: RegistrationStatus.FLYTTA_TILL_VANTELISTA,
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
  }),
  // 13: Del 3 fall E — medföljande (+1), betalning ofta huvudpersonens
  bas({
    id: 'proto-hallplats-13',
    namn: 'Emma Söder',
    status: RegistrationStatus.BEKRAFTAD,
    kalla: RegistrationSource.MEDFOLJANDE,
    medfoljandeTill: 'proto-hallplats-05',
    bekraftelseSkickad: '2026-07-15T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.MOTTAGEN,
  }),
  // 14: Del 3 fall E — från väntelistan (uppflyttad, egen bana)
  bas({
    id: 'proto-hallplats-14',
    namn: 'Gustav Wik',
    status: RegistrationStatus.OBEKRAFTAD,
    kalla: RegistrationSource.VANTELISTA,
    inskickad: '2026-07-28T09:00:00.000Z',
  }),
];
