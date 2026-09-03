// Beläggnings-härledningens kontraktstest — TASK-373, api-pure (ren logik,
// ingen staging-koppling, ingen Airtable).
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SVITEN BEVISAR
// ═══════════════════════════════════════════════════════════════════════════
// Buggen: eventsidans mätare visade "12 av 20 platser upptagna" på RIM 3
// Rönninge (Event-25) medan basen sa 13. `get-event` räknade BARA `Källa` TOM
// och '+1'; anmälan skapad via appens Ny anmälan (`Källa = 'Manuell'`) räknades
// i INGEN del och försvann ur summan. Samma hål gällde 'Väntelista'.
//
// Tre lager prövas:
//   A. SERVERN (`_shared/belaggning.ts`) — partitionen och aktiv-filtret.
//   B. KLIENTPARITETEN — serverns statuslista mot `src/domain/types/Status.ts`
//      och mot `src/lib/aktiv-anmalan.ts`s predikat.
//   C. MÄTAREN (`src/lib/belaggning.ts`) — kompositionen och invarianten
//      `upptagna === Antal anmälda + Extra platser`.
//
// TVÅSIDIGT BEVIS: `RAKNING_FORE_FIXEN` nedan är den GAMLA implementationen,
// kopierad verbatim ur `get-event/index.ts` som den stod på origin/main
// `b391dffe`. Sviten kräver att den DIVERGERAR från den nya på just de fall
// kortet beskriver — utan den kan ett test som bara bekräftar den nya koden
// inte visa att någon bugg faktiskt fanns.
//
// api-pure: båda modulerna är Deno-fria och importfria så när som på
// `_shared/coerce.ts` respektive domäntyperna → kör rakt i Node.
// Tests-projektet når `src/` via `@/`-aliaset (tsconfig.tests.json § paths) och
// `supabase/functions/_shared/` via relativ sökväg — samma mönster som
// `tests/api/betalningsbelopp-klientparitet.test.ts`.

import { expect, test } from '@playwright/test';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { arAktivAnmalan } from '@/lib/aktiv-anmalan';
import { anmaldaDeltagare, belaggningsDelar, belaggningUpptagna } from '@/lib/belaggning';
import {
  type AnmalanRad,
  arAktivAnmalanRad,
  BELAGGNING_ANMALAN_FALT,
  INAKTIVA_ANMALNINGSSTATUSAR,
  KALLA_MEDFOLJANDE,
  raknaAnmalningar,
} from '../../supabase/functions/_shared/belaggning';

/**
 * En anmälningsrad som Airtable levererar den: singleSelect kommer som OBJEKT
 * `{ name }`, ett tomt fält UTELÄMNAS helt ur svaret (frånvaro är sanning).
 */
function rad(kalla: string | null, status: string | null = null): AnmalanRad {
  return {
    fields: {
      ...(kalla !== null ? { Källa: { name: kalla } } : {}),
      ...(status !== null ? { Status: { name: status } } : {}),
    },
  };
}

/**
 * DEN GAMLA RÄKNINGEN, verbatim ur `supabase/functions/get-event/index.ts` som
 * den stod på origin/main `b391dffe` (raderna i `fetchBelaggning`s for-loop).
 * Finns här ENBART som differential-motpart — den är inte en andra
 * implementation som ska hållas i synk, utan ett fruset historiskt facit.
 */
function RAKNING_FORE_FIXEN(regs: readonly AnmalanRad[]): {
  viaFormular: number;
  medfoljande: number;
} {
  let viaFormular = 0;
  let medfoljande = 0;
  for (const reg of regs) {
    const falt = reg.fields['Källa'];
    const kalla =
      typeof falt === 'string'
        ? falt.length > 0
          ? falt
          : null
        : falt && typeof falt === 'object' && 'name' in falt
          ? ((falt as { name?: unknown }).name as string)
          : null;
    if (kalla === null) viaFormular += 1;
    else if (kalla === '+1') medfoljande += 1;
  }
  return { viaFormular, medfoljande };
}

// ═══════════════════════════════════════════════════════════════════════════
// A. SERVERN — partitionen och aktiv-filtret
// ═══════════════════════════════════════════════════════════════════════════

test.describe('raknaAnmalningar — Källa-partitionen', () => {
  test('Källa TOM (fältet utelämnat) → viaFormular', () => {
    expect(raknaAnmalningar([rad(null)])).toEqual({
      viaFormular: 1,
      medfoljande: 0,
      ovrigaAnmalningar: 0,
    });
  });

  test("Källa '+1' → medfoljande", () => {
    expect(raknaAnmalningar([rad('+1')])).toEqual({
      viaFormular: 0,
      medfoljande: 1,
      ovrigaAnmalningar: 0,
    });
  });

  test("Källa 'Manuell' → ovrigaAnmalningar (KORTETS BUGG: räknades förut i ingen del)", () => {
    expect(raknaAnmalningar([rad('Manuell')])).toEqual({
      viaFormular: 0,
      medfoljande: 0,
      ovrigaAnmalningar: 1,
    });
  });

  test("Källa 'Väntelista' → ovrigaAnmalningar (samma hål som 'Manuell')", () => {
    expect(raknaAnmalningar([rad('Väntelista')])).toEqual({
      viaFormular: 0,
      medfoljande: 0,
      ovrigaAnmalningar: 1,
    });
  });

  test('OKÄNT framtida Källa-värde → ovrigaAnmalningar (FAIL-CLOSED, aldrig tappat)', () => {
    expect(raknaAnmalningar([rad('Importerad 2027')])).toEqual({
      viaFormular: 0,
      medfoljande: 0,
      ovrigaAnmalningar: 1,
    });
  });

  test('Källa som RÅ STRÄNG (ej singleSelect-objekt) klassas likadant', () => {
    expect(raknaAnmalningar([{ fields: { Källa: 'Manuell' } }])).toEqual({
      viaFormular: 0,
      medfoljande: 0,
      ovrigaAnmalningar: 1,
    });
  });

  test('tom lista → nollor (event utan länkade anmälningar)', () => {
    expect(raknaAnmalningar([])).toEqual({
      viaFormular: 0,
      medfoljande: 0,
      ovrigaAnmalningar: 0,
    });
  });
});

test.describe('raknaAnmalningar — aktiv-filtret (basens Är aktiv (1/0))', () => {
  for (const kalla of [null, '+1', 'Manuell', 'Väntelista', 'Okänt']) {
    const namn = kalla ?? 'TOM';

    test(`Avbokad/Ombokad räknas INTE (Källa ${namn})`, () => {
      const r = raknaAnmalningar([rad(kalla, RegistrationStatus.AVBOKAD)]);
      expect(r.viaFormular + r.medfoljande + r.ovrigaAnmalningar).toBe(0);
    });

    test(`Inställt räknas INTE (Källa ${namn})`, () => {
      const r = raknaAnmalningar([rad(kalla, RegistrationStatus.INSTALLT)]);
      expect(r.viaFormular + r.medfoljande + r.ovrigaAnmalningar).toBe(0);
    });
  }

  for (const status of [
    RegistrationStatus.OBEKRAFTAD,
    RegistrationStatus.BEKRAFTAD,
    RegistrationStatus.BETALNINGSPAMINNELSE,
    RegistrationStatus.FLYTTA_TILL_VANTELISTA,
  ]) {
    test(`"${status}" RÄKNAS (basformeln exkluderar den inte)`, () => {
      expect(raknaAnmalningar([rad(null, status)]).viaFormular).toBe(1);
    });
  }

  test('saknad Status (fältet utelämnat) RÄKNAS — samma väg som basformelns IF(OR(…))', () => {
    expect(raknaAnmalningar([rad(null)]).viaFormular).toBe(1);
  });

  test('arAktivAnmalanRad är sant för okänd framtida status (fail-open per basformeln)', () => {
    expect(arAktivAnmalanRad({ Status: { name: 'Något nytt 2027' } })).toBe(true);
  });
});

test.describe('raknaAnmalningar — INVARIANT: ingen aktiv anmälan tappas', () => {
  /** Blandat korpus: varje Källa-värde × varje status, plus formvarianter. */
  const KORPUS: { rad: AnmalanRad; aktiv: boolean }[] = [
    { rad: rad(null), aktiv: true },
    { rad: rad(null, RegistrationStatus.BEKRAFTAD), aktiv: true },
    { rad: rad(null, RegistrationStatus.AVBOKAD), aktiv: false },
    { rad: rad('+1', RegistrationStatus.OBEKRAFTAD), aktiv: true },
    { rad: rad('+1', RegistrationStatus.INSTALLT), aktiv: false },
    { rad: rad('Manuell', RegistrationStatus.OBEKRAFTAD), aktiv: true },
    { rad: rad('Manuell', RegistrationStatus.AVBOKAD), aktiv: false },
    { rad: rad('Väntelista', RegistrationStatus.BETALNINGSPAMINNELSE), aktiv: true },
    { rad: rad('Väntelista', RegistrationStatus.INSTALLT), aktiv: false },
    { rad: rad('Framtida värde'), aktiv: true },
    { rad: { fields: { Källa: 'Manuell', Status: 'Bekräftad (mail skickat)' } }, aktiv: true },
    { rad: rad(null, RegistrationStatus.FLYTTA_TILL_VANTELISTA), aktiv: true },
  ];

  test('summan av de tre delarna === antalet AKTIVA rader i korpuset', () => {
    const regs = KORPUS.map((k) => k.rad);
    const forvantatAktiva = KORPUS.filter((k) => k.aktiv).length;
    const r = raknaAnmalningar(regs);
    expect(r.viaFormular + r.medfoljande + r.ovrigaAnmalningar).toBe(forvantatAktiva);
    // Distinkta tal per del → utesluter förväxlade räknare (samma disciplin som
    // staging-fixturens 2 ≠ 1-argument i get-event.staging.test.ts).
    expect(r).toEqual({ viaFormular: 3, medfoljande: 1, ovrigaAnmalningar: 4 });
  });

  test('varje enskild rad hamnar i exakt EN del (aktiv) eller ingen (inaktiv)', () => {
    for (const { rad: r, aktiv } of KORPUS) {
      const d = raknaAnmalningar([r]);
      expect(d.viaFormular + d.medfoljande + d.ovrigaAnmalningar, JSON.stringify(r)).toBe(
        aktiv ? 1 : 0,
      );
    }
  });
});

test.describe('DIFFERENTIAL mot koden före fixen (tvåsidigt bevis)', () => {
  /** RIM 3 Rönninge-formen: 12 formuläranmälningar + 1 manuellt skapad. */
  const RIM3 = [...Array.from({ length: 12 }, () => rad(null)), rad('Manuell')];

  test('gamla räkningen tappar den manuella anmälan (12), nya behåller den (13)', () => {
    const fore = RAKNING_FORE_FIXEN(RIM3);
    expect(fore.viaFormular + fore.medfoljande, 'symptomet i prod: "12 av 20"').toBe(12);

    const efter = raknaAnmalningar(RIM3);
    expect(
      efter.viaFormular + efter.medfoljande + efter.ovrigaAnmalningar,
      'basens Antal aktiva anmälningar: 13',
    ).toBe(13);
  });

  test("gamla räkningen tappar även Källa 'Väntelista'", () => {
    const regs = [rad(null), rad('Väntelista')];
    const fore = RAKNING_FORE_FIXEN(regs);
    expect(fore.viaFormular + fore.medfoljande).toBe(1);
    const efter = raknaAnmalningar(regs);
    expect(efter.viaFormular + efter.medfoljande + efter.ovrigaAnmalningar).toBe(2);
  });

  test('gamla räkningen räknade avbokade som upptagna platser', () => {
    const regs = [rad(null), rad(null, RegistrationStatus.AVBOKAD)];
    const fore = RAKNING_FORE_FIXEN(regs);
    expect(fore.viaFormular, 'gamla: avbokad räknades med').toBe(2);
    const efter = raknaAnmalningar(regs);
    expect(efter.viaFormular, 'nya: avbokad exkluderas som i basens formel').toBe(1);
  });

  test('de två implementationerna är ÖVERENS när ingen udda Källa och ingen avbokning finns', () => {
    const regs = [rad(null), rad(null), rad('+1', RegistrationStatus.BEKRAFTAD)];
    const fore = RAKNING_FORE_FIXEN(regs);
    const efter = raknaAnmalningar(regs);
    expect(efter.viaFormular).toBe(fore.viaFormular);
    expect(efter.medfoljande).toBe(fore.medfoljande);
    expect(efter.ovrigaAnmalningar).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// B. KLIENTPARITET — serverns konstanter mot domäntyperna
// ═══════════════════════════════════════════════════════════════════════════

test.describe('klientparitet: EF-konstanterna speglar src/domain/types/Status.ts', () => {
  test('INAKTIVA_ANMALNINGSSTATUSAR === [AVBOKAD, INSTALLT]', () => {
    expect([...INAKTIVA_ANMALNINGSSTATUSAR]).toEqual([
      RegistrationStatus.AVBOKAD,
      RegistrationStatus.INSTALLT,
    ]);
  });

  test('KALLA_MEDFOLJANDE === RegistrationSource.MEDFOLJANDE', () => {
    expect(KALLA_MEDFOLJANDE).toBe(RegistrationSource.MEDFOLJANDE);
  });

  test('BELAGGNING_ANMALAN_FALT innehåller Status — annars kan filtret inte fälla', () => {
    expect([...BELAGGNING_ANMALAN_FALT]).toContain('Status');
    expect([...BELAGGNING_ANMALAN_FALT]).toContain('Källa');
  });

  test('arAktivAnmalanRad ger SAMMA svar som klientens arAktivAnmalan för alla sex statusar', () => {
    const bas: Omit<Registration, 'status'> = {
      id: 'recParitet',
      namn: 'Test Testsson',
      fornamn: 'Test',
      efternamn: 'Testsson',
      email: null,
      telefon: null,
      eventNamn: null,
      ort: null,
      flagga: null,
      anmalningsavgift: null,
      slutbetalning: null,
      betalningspaminnelseSkickad: null,
      inskickad: null,
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: 'recEvent',
      personId: null,
    };
    for (const status of Object.values(RegistrationStatus)) {
      expect(arAktivAnmalanRad({ Status: { name: status } }), status).toBe(
        arAktivAnmalan({ ...bas, status }),
      );
    }
    // null-status: båda sidor säger AKTIV.
    expect(arAktivAnmalanRad({})).toBe(arAktivAnmalan({ ...bas, status: null }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C. MÄTAREN — kompositionen och invarianten
// ═══════════════════════════════════════════════════════════════════════════

/** Minimal Event-fixtur; bara beläggnings-fälten är relevanta. */
function ev(overrides: Partial<Event> = {}): Event {
  return {
    id: 'recEventTest0001',
    eventlabel: null,
    eventNamn: 'Testevent',
    typ: null,
    ort: null,
    startdatum: null,
    slutdatum: null,
    tidKvarTillEvent: null,
    maxPlatser: 20,
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

test.describe('belaggningsDelar — segmentuppsättningen (S73-facit K16)', () => {
  test('FYRA delar i fyllnadsordning; väntelistan är aldrig en del (K22)', () => {
    expect(belaggningsDelar(ev()).map((d) => d.nyckel)).toEqual([
      'formular',
      'manuell',
      'medfoljande',
      'reserverad',
    ]);
  });

  test('saknade fält (äldre get-event-svar / stale cache) → 0, aldrig NaN', () => {
    const delar = belaggningsDelar(ev());
    expect(delar.every((d) => d.antal === 0)).toBe(true);
    expect(belaggningUpptagna(ev())).toBe(0);
  });

  test('ovrigaAnmalningar utelämnat → samma tal som före TASK-373 (deploy-säkerhet)', () => {
    expect(anmaldaDeltagare(ev({ viaFormular: 8 }))).toBe(8);
  });
});

test.describe('mätarens INVARIANT: upptagna === Antal anmälda + Extra platser', () => {
  test('RIM 3 Rönninge-fallet (Event-25): 13 av 20, inte 12', () => {
    // Basens läge 2026-09-03: 13 aktiva anmälningar (12 via formulär + 1 med
    // Källa 'Manuell'), Manuella platser 0, Extra platser 0, Max 20 →
    // Antal anmälda = 13, Platser kvar = 7.
    const rim3 = ev({
      maxPlatser: 20,
      antalAnmalda: 13,
      platserKvar: 7,
      viaFormular: 12,
      ovrigaAnmalningar: 1,
      medfoljande: 0,
    });

    expect(anmaldaDeltagare(rim3), '"Anmälda deltagare"-raden').toBe(13);
    expect(belaggningUpptagna(rim3), 'mätarens "X av 20 platser upptagna"').toBe(13);
    // EventCard (listans stapel) läser `antalAnmalda` — SAMMA tal som mätaren
    // när Extra platser är 0, vilket det är för RIM 3.
    expect(belaggningUpptagna(rim3)).toBe(rim3.antalAnmalda + (rim3.reserverade ?? 0));
    expect(rim3.antalAnmalda, 'event-listans stapel visar samma 13').toBe(13);
  });

  test('invarianten håller över ett korpus av kombinationer', () => {
    const KORPUS: { via: number; ovriga: number; medf: number; manu: number; extra: number }[] = [
      { via: 12, ovriga: 1, medf: 0, manu: 0, extra: 0 },
      { via: 2, ovriga: 1, medf: 1, manu: 1, extra: 2 },
      { via: 0, ovriga: 0, medf: 0, manu: 0, extra: 0 },
      { via: 0, ovriga: 5, medf: 0, manu: 3, extra: 1 },
      { via: 8, ovriga: 0, medf: 1, manu: 1, extra: 1 },
      { via: 1, ovriga: 2, medf: 3, manu: 4, extra: 5 },
    ];

    for (const k of KORPUS) {
      // Basens formel: Antal anmälda = Antal aktiva anmälningar + Manuella platser.
      const antalAnmalda = k.via + k.ovriga + k.medf + k.manu;
      const e = ev({
        antalAnmalda,
        viaFormular: k.via,
        ovrigaAnmalningar: k.ovriga,
        medfoljande: k.medf,
        manuelltTillagda: k.manu,
        reserverade: k.extra,
      });
      expect(belaggningUpptagna(e), JSON.stringify(k)).toBe(antalAnmalda + k.extra);
    }
  });

  test('avbokade når aldrig mätaren: de är redan borträknade i EF:ens delar', () => {
    // Serverns partition ur ett event med en avbokad formuläranmälan …
    const regs = [rad(null), rad(null), rad(null, RegistrationStatus.AVBOKAD), rad('Manuell')];
    const r = raknaAnmalningar(regs);
    // … matar mätaren direkt. Tre aktiva rader, ingen manuell plats i basen.
    const e = ev({
      antalAnmalda: 3,
      viaFormular: r.viaFormular,
      ovrigaAnmalningar: r.ovrigaAnmalningar,
      medfoljande: r.medfoljande,
    });
    expect(belaggningUpptagna(e)).toBe(3);
  });
});
