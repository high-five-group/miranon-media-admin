import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';
import { DAG_MS, dagsStart } from './data';

/**
 * [PROTOTYPE-DEMODATA, TASK-226 konvergensvarv 2, punkt 3] Syntetiskt
 * demoläge (`?data=demo`). Staging-datat råkar inte innehålla alla tillstånd
 * samtidigt (ingen påminnelse ≥7 dagar gammal, inga eventinfo-eftersläntrare)
 * — utan denna fixtur skulle Marcus granska ett facit han aldrig sett i
 * verkligheten (uppdragets ledord: "facit får inte låsas mot ett tillstånd
 * han aldrig sett").
 *
 * ETT SJÄLVSTÄNDIGT UNIVERSUM (egna event-ID:n, egna registrerings-ID:n,
 * inbördes konsekventa `eventId`-länkar) — medvetet INTE en blandning av
 * riktiga + syntetiska poster: en demo-registrering som pekar på ett
 * `eventId` som inte finns i den riktiga eventskartan hade varit en tyst
 * korruption som varken TypeScript eller a11y-sviten fångar. "Nästa event"
 * läser SAMMA universum i demoläget, inte en tredje datakälla.
 *
 * Visar samtidigt (VariantRo.tsx kopplar in detta bakom `?data=demo`):
 *  - bevakningsradens BÅDA lägen: `demo-event-tom` (inget utskick alls) och
 *    `demo-event-efter` (eftersläntrare, delvis skickat)
 *  - [TASK-226 konvergens-varv 4, AC 3] bevakningsradens VÄRSTA FALL,
 *    permanent: `demo-event-bevakning-varsta-fall` — ett avsiktligt långt
 *    eventnamn + tvåsiffrigt antal (X=12), längre än de två fixturerna ovan,
 *    så line-clamp-2-skyddsnätet (VariantRo.tsx) alltid prövas mot en rad
 *    som faktiskt inte ryms på en rad
 *  - förfallna-blockets TRE tillståndsgrupper på `demo-event-forfallna`,
 *    sex rader i varje (gott om marginal över inline-scrollens ~5–6
 *    synliga rader, så scroll-läget faktiskt syns)
 *  - "Nya anmälningar"-listans scroll-läge (åtta obekräftade på samma event)
 *
 * Throwaway-kontraktet (ADR-102/103): filen rivs med förlorarna eller vid
 * konvergensens facit-skrivning — absorberas inte rakt av.
 */

function isoOmDagar(nuMs: number, dagar: number): string {
  return new Date(nuMs + dagar * DAG_MS).toISOString();
}

/**
 * [TASK-226 konvergensvarv 3, AC 1] `N` minuter före `nuMs` — bär "Nya
 * anmälningar"-radernas sub-dygns-åldrar ("nyss" / "för N min sedan" /
 * "för N tim sedan").
 */
function isoForMinuterSedan(nuMs: number, minuter: number): string {
  return new Date(nuMs - minuter * 60_000).toISOString();
}

/**
 * [TASK-226 konvergensvarv 3, AC 1] Ankrad i lokal MIDNATT (`dagsStart`),
 * INTE i `nuMs` — gör "igår HH:MM"/"för N dagar sedan"-formerna
 * deterministiska oavsett vilken tid på dygnet demoläget råkar öppnas
 * (subtraherar man i stället N*24h rakt av från `nuMs` kan resultatet hoppa
 * en kalenderdag beroende på klockslaget just då).
 */
function isoForDagarSedanVidTid(nuMs: number, dagar: number, timmePaDygnet: number): string {
  return new Date(dagsStart(nuMs) - dagar * DAG_MS + timmePaDygnet * 3_600_000).toISOString();
}

/**
 * [TASK-226 konvergensvarv 3, AC 1] "Nya anmälningar"-radernas 8 `inskickad`-
 * tidsstämplar — VARIERADE, realistiska åldrar som täcker `relativTid`s alla
 * fyra former (`hem/relativ-tid.ts`): nyss · för N min sedan · för N tim
 * sedan · igår HH:MM · för N dagar sedan. Utan detta hade alla åtta rader
 * delat `inskickad: null` (demoReg-defaulten) och visat ingen relativ tid
 * alls — exakt den lucka AC 1 pekar ut.
 */
const NYA_ANMALNINGAR_ALDRAR: ReadonlyArray<(nuMs: number) => string> = [
  (nuMs) => isoForMinuterSedan(nuMs, 0.5), // "nyss"
  (nuMs) => isoForMinuterSedan(nuMs, 8), // "för 8 min sedan"
  (nuMs) => isoForMinuterSedan(nuMs, 45), // "för 45 min sedan"
  (nuMs) => isoForMinuterSedan(nuMs, 180), // "för 3 tim sedan"
  (nuMs) => isoForMinuterSedan(nuMs, 540), // "för 9 tim sedan"
  (nuMs) => isoForDagarSedanVidTid(nuMs, 1, 18), // "igår 18:00"
  (nuMs) => isoForDagarSedanVidTid(nuMs, 3, 10), // "för 3 dagar sedan"
  (nuMs) => isoForDagarSedanVidTid(nuMs, 8, 10), // "för 8 dagar sedan"
];

function demoEvent(
  overrides: Partial<Event> & Pick<Event, 'id' | 'eventNamn' | 'startdatum'>,
): Event {
  return {
    eventlabel: overrides.eventNamn,
    typ: 'Kurs',
    ort: 'Demo',
    slutdatum: overrides.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: 30,
    antalAnmalda: 0,
    platserKvar: null,
    anmaldBelaggning: null,
    bekraftadBelaggning: null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: null,
    ...overrides,
  };
}

function demoReg(
  overrides: Partial<Omit<Registration, 'namn'>> &
    Pick<Registration, 'id' | 'eventId'> & { namn: string },
): Registration {
  // `namn` bryts ut EXPLICIT som `string` (inte Registration.namn:s
  // `string | null`) — varje anrop nedan skickar ett riktigt namn, och den
  // striktare lokala typen slipper en null-check som aldrig kan slå till.
  const { namn, ...rest } = overrides;
  return {
    namn,
    fornamn: namn.split(' ')[0] ?? null,
    efternamn: namn.split(' ').slice(1).join(' ') || null,
    email: null,
    telefon: null,
    eventNamn: null,
    ort: null,
    status: RegistrationStatus.BEKRAFTAD,
    flagga: null,
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.MOTTAGEN,
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    personId: null,
    deltagarinfoSkickad: null,
    ...rest,
  };
}

export interface DemoUniversum {
  events: Event[];
  registrations: Registration[];
}

export function demoUniversum(nuMs: number): DemoUniversum {
  // --- BEVAKNINGSRAD Läge 1: "deltagarinfo inte skickad" (demo-event-tom) ---
  const eventTom = demoEvent({
    id: 'demo-event-tom',
    eventNamn: 'Demo: Sommarläger Örnsköldsvik',
    ort: 'Örnsköldsvik',
    startdatum: isoOmDagar(nuMs, 5),
    maxPlatser: 20,
    antalAnmalda: 2,
  });
  const eventTomRegs: Registration[] = [1, 2].map((i) =>
    demoReg({
      id: `demo-reg-tom-${i}`,
      namn: `Demo Deltagare T${i}`,
      eventId: eventTom.id,
      deltagarinfoSkickad: null, // ingen av dem — Läge 1
    }),
  );

  // --- BEVAKNINGSRAD Läge 2: "N nya deltagare saknar deltagarinfo" (demo-event-efter) ---
  const eventEfter = demoEvent({
    id: 'demo-event-efter',
    eventNamn: 'Demo: Höstkurs Umeå',
    ort: 'Umeå',
    startdatum: isoOmDagar(nuMs, 15),
    maxPlatser: 20,
    antalAnmalda: 5,
  });
  const eventEfterRegs: Registration[] = [
    ...[1, 2].map((i) =>
      demoReg({
        id: `demo-reg-efter-skickad-${i}`,
        namn: `Demo Deltagare E${i}`,
        eventId: eventEfter.id,
        deltagarinfoSkickad: isoOmDagar(nuMs, -3), // redan skickad
      }),
    ),
    ...[3, 4, 5].map((i) =>
      demoReg({
        id: `demo-reg-efter-ostampad-${i}`,
        namn: `Demo Deltagare E${i}`,
        eventId: eventEfter.id,
        deltagarinfoSkickad: null, // eftersläntrare — X=3
      }),
    ),
  ];

  // --- BEVAKNINGSRAD värsta fall (TASK-226 konvergens-varv 4, AC 3):
  // permanent, avsiktligt LÄNGRE än dagens längsta rad (lång eventnamn +
  // tvåsiffrigt antal) — designen ska alltid prövas mot den, inte bara mot
  // de två "typiska" fixturerna ovan. Isolerat event/regs, rör inget annat
  // block (BEKRÄFTAD + MOTTAGEN-defaulten läcker aldrig in i "Nya
  // anmälningar" eller "Förfallna betalningar").
  const eventBevakningVarstaFall = demoEvent({
    id: 'demo-event-bevakning-varsta-fall',
    eventNamn:
      'Demo: Fördjupningskurs i konflikthantering och medling för föreningsledare i Västerbotten',
    ort: 'Umeå',
    startdatum: isoOmDagar(nuMs, 12),
    maxPlatser: 30,
    antalAnmalda: 18,
  });
  const eventBevakningVarstaFallRegs: Registration[] = [
    ...[1, 2, 3].map((i) =>
      demoReg({
        id: `demo-reg-varsta-fall-skickad-${i}`,
        namn: `Demo Deltagare VF${i}`,
        eventId: eventBevakningVarstaFall.id,
        deltagarinfoSkickad: isoOmDagar(nuMs, -2), // redan skickad
      }),
    ),
    ...Array.from({ length: 12 }, (_, idx) => {
      const i = idx + 4;
      return demoReg({
        id: `demo-reg-varsta-fall-ostampad-${i}`,
        namn: `Demo Deltagare VF${i}`,
        eventId: eventBevakningVarstaFall.id,
        deltagarinfoSkickad: null, // eftersläntrare — X=12
      });
    }),
  ];

  // --- FÖRFALLNA-BLOCKET + "Nya anmälningar" (demo-event-forfallna, passerat) ---
  const eventForfallna = demoEvent({
    id: 'demo-event-forfallna',
    eventNamn: 'Demo: Vinterkurs Luleå',
    ort: 'Luleå',
    startdatum: isoOmDagar(nuMs, -20), // deadline (start-14d) sedan länge passerad
    maxPlatser: 40,
    antalAnmalda: 26,
  });
  // Alla BEKRÄFTADE regs på detta event är REDAN eventinfo-stämplade — annars
  // hade eventet läckt in som en TREDJE bevakningsrad (spec kräver EXAKT två).
  const stampladEventinfo = isoOmDagar(nuMs, -25);

  const nyaAnmalningar: Registration[] = Array.from({ length: 8 }, (_, idx) => {
    const i = idx + 1;
    return demoReg({
      id: `demo-reg-obekraftad-${i}`,
      namn: `Demo Ny ${i}`,
      eventId: eventForfallna.id,
      status: RegistrationStatus.OBEKRAFTAD,
      deltagarinfoSkickad: null, // obekräftad — räknas aldrig som "bekräftad" i bevakningsraden
      inskickad: NYA_ANMALNINGAR_ALDRAR[idx](nuMs), // AC 1 — varierade, realistiska åldrar
    });
  });

  const attPaminna: Registration[] = Array.from({ length: 6 }, (_, idx) => {
    const i = idx + 1;
    return demoReg({
      id: `demo-reg-paminna-${i}`,
      namn: `Demo Obetald P${i}`,
      eventId: eventForfallna.id,
      anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
      paminnelseAnmalningsavgiftSkickad: null, // ingen påminnelse ännu
      deltagarinfoSkickad: stampladEventinfo,
    });
  });

  const vantar: Registration[] = Array.from({ length: 6 }, (_, idx) => {
    const i = idx + 1;
    return demoReg({
      id: `demo-reg-vantar-${i}`,
      namn: `Demo Obetald V${i}`,
      eventId: eventForfallna.id,
      anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
      paminnelseAnmalningsavgiftSkickad: isoOmDagar(nuMs, -2), // 2 dagar gammal — under tröskeln
      deltagarinfoSkickad: stampladEventinfo,
    });
  });

  const dagsAttRinga: Registration[] = Array.from({ length: 6 }, (_, idx) => {
    const i = idx + 1;
    const harNotering = i <= 3; // hälften med notering, hälften utan — båda grenarna demonstrerade
    return demoReg({
      id: `demo-reg-ring-${i}`,
      namn: `Demo Obetald R${i}`,
      eventId: eventForfallna.id,
      telefon: `070-555 00 ${String(i).padStart(2, '0')}`,
      anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
      paminnelseAnmalningsavgiftSkickad: isoOmDagar(nuMs, -10), // 10 dagar gammal — över tröskeln
      noteringAnmalningsavgift: harNotering ? 'Sa hon skulle Swisha nästa vecka.' : null,
      deltagarinfoSkickad: stampladEventinfo,
    });
  });

  return {
    events: [eventTom, eventEfter, eventBevakningVarstaFall, eventForfallna],
    registrations: [
      ...eventTomRegs,
      ...eventEfterRegs,
      ...eventBevakningVarstaFallRegs,
      ...nyaAnmalningar,
      ...attPaminna,
      ...vantar,
      ...dagsAttRinga,
    ],
  };
}
