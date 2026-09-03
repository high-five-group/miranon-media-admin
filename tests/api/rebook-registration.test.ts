// rebook-registration — hermetisk svit för ombokningens rena logik
// (`_shared/rebook-registration.ts`), TASK-368.4.
//
// api-pure (ren logik, ingen staging) — samma klass som
// `cancel-registration.test.ts` och `betalningsharledning.test.ts`:
// tillståndsbeslutet som BÄR idempotensen, Notering-radens exakta form,
// ögonblicksbildens fallbacks och prisskillnadens tre utfall bevisas
// UTTÖMMANDE här, i stället för att kräva en levande Airtable-fixtur per
// kombination.
//
// ── VAD SOM BEVISAS HÄR OCH INTE I STAGING, OCH VARFÖR ────────────────────
// PRISSKILLNADEN (kortets AC #3/#5: positiv, negativ, null) kräver kontroll
// över MÅL-eventets pris. Ingen befintlig Edge Function kan sätta
// `Eventplanering.Pris (kr)` — `create-event`s allowlist bär inget prisfält
// (`_shared/field-allowlists.ts`), och `Avtalat pris (kr)` sätts bara på en
// anmälan som redan har en inbetalning registrerad. Ett staging-test kan
// därför bevisa IDENTITETEN (prisskillnad = nytt pris minus summan på den nya
// anmälan, eller null när priset saknas) men inte de tre TECKNEN determinis-
// tiskt. Samma delning som `cancel-registration.staging.test.ts` redan gör för
// sex-status-matrisen, och av samma slag av skäl: det som inte går att
// konstruera skarpt utan att skriva förbi allowlisten bevisas hermetiskt.
//
// PRISSKILLNADEN HAR INGEN EGEN FUNKTION, med avsikt: EF:en returnerar
// `harledBetalning(...).saknas` för den NYA anmälan rakt av. Att skriva en
// egen `beraknaPrisskillnad` hade duplicerat en pengaregel (avrundning till
// hela ören, "0 är ett satt pris") som redan har EN ägare
// (`_shared/betalningsharledning.ts`, orörd i denna skiva — TASK-372 arbetar
// parallellt i samma fil). Fallen nedan prövar därför härledningen med exakt
// de prisbilder en ombokning producerar.

import { expect, test } from '@playwright/test';
import { harledBetalning } from '../../supabase/functions/_shared/betalningsharledning';
import {
  appendNotering,
  STATUS_AVBOKAD,
  stockholmDatum,
} from '../../supabase/functions/_shared/cancel-registration';
import {
  beslutaOmbokning,
  byggFlyttadOgonblicksbild,
  byggOmbokningsrad,
  summeraFlyttat,
} from '../../supabase/functions/_shared/rebook-registration';

const STATUS_BEKRAFTAD = 'Bekräftad (mail skickat)';
const STATUS_PAMINNELSE = 'Betalningspåminnelse skickad';
const STATUS_OBEKRAFTAD = 'Obekräftad';
const STATUS_VANTELISTA = 'Flytta till väntelista';
const STATUS_INSTALLT = 'Inställt';

const GAMMALT_EVENT = 'recGAMMALTEVENT1';
const NYTT_EVENT = 'recNYTTEVENT0001';

function underlag(overrides: Partial<Parameters<typeof beslutaOmbokning>[0]> = {}) {
  return {
    aktuellStatus: STATUS_OBEKRAFTAD as string | null,
    gammaltEventId: GAMMALT_EVENT as string | null,
    nyttEventId: NYTT_EVENT,
    malAnmalanFinns: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. beslutaOmbokning — samma event prövas FÖRST
// ═══════════════════════════════════════════════════════════════════════════

test.describe('beslutaOmbokning: samma event', () => {
  test('aktiv anmälan till SAMMA event avvisas med samma_event', () => {
    const beslut = beslutaOmbokning(underlag({ nyttEventId: GAMMALT_EVENT }));
    expect(beslut.ok).toBe(false);
    if (beslut.ok) return;
    expect(beslut.kod).toBe('samma_event');
    expect(beslut.felmeddelande).toContain('redan på det eventet');
  });

  test('samma_event VINNER över en otillåten status (pekar ut rätt fel för Lotta)', () => {
    const beslut = beslutaOmbokning(
      underlag({ aktuellStatus: STATUS_INSTALLT, nyttEventId: GAMMALT_EVENT }),
    );
    expect(beslut.ok).toBe(false);
    if (beslut.ok) return;
    expect(beslut.kod).toBe('samma_event');
  });

  test('anmälan UTAN event-länk fälls aldrig på samma_event', () => {
    const beslut = beslutaOmbokning(underlag({ gammaltEventId: null }));
    expect(beslut.ok).toBe(true);
    if (!beslut.ok) return;
    expect(beslut.lage).toBe('utfor');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. beslutaOmbokning — övergångstabellen (ärvd från cancel-registration)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('beslutaOmbokning: statusaxeln', () => {
  for (const status of [STATUS_BEKRAFTAD, STATUS_PAMINNELSE, STATUS_OBEKRAFTAD]) {
    test(`aktiv status "${status}" ger utfor + statusskrivning till Avbokad/Ombokad`, () => {
      const beslut = beslutaOmbokning(underlag({ aktuellStatus: status }));
      expect(beslut.ok).toBe(true);
      if (!beslut.ok) return;
      expect(beslut.lage).toBe('utfor');
      expect(beslut.statusSkaSkrivas).toBe(true);
      expect(beslut.nyStatus).toBe(STATUS_AVBOKAD);
    });
  }

  test('aktiv status + mål-anmälan finns redan ger ÄNDÅ utfor (adoptionen görs av EF:en)', () => {
    // Detta är halv-fel-återupptagningen: första försöket hann skapa raden men
    // inte skriva statusen. Beslutet måste tillåta att resten körs klart.
    const beslut = beslutaOmbokning(underlag({ malAnmalanFinns: true }));
    expect(beslut.ok).toBe(true);
    if (!beslut.ok) return;
    expect(beslut.lage).toBe('utfor');
    expect(beslut.statusSkaSkrivas).toBe(true);
  });

  test('redan avbokad + mål-anmälan finns ger aterupptagning UTAN statusskrivning', () => {
    const beslut = beslutaOmbokning(
      underlag({ aktuellStatus: STATUS_AVBOKAD, malAnmalanFinns: true }),
    );
    expect(beslut.ok).toBe(true);
    if (!beslut.ok) return;
    expect(beslut.lage).toBe('aterupptagning');
    expect(beslut.statusSkaSkrivas).toBe(false);
    expect(beslut.nyStatus).toBe(STATUS_AVBOKAD);
  });

  test('redan avbokad UTAN mål-anmälan avvisas med redan_avbokad', () => {
    const beslut = beslutaOmbokning(underlag({ aktuellStatus: STATUS_AVBOKAD }));
    expect(beslut.ok).toBe(false);
    if (beslut.ok) return;
    expect(beslut.kod).toBe('redan_avbokad');
    expect(beslut.felmeddelande).toContain('redan avbokad');
  });

  for (const status of [STATUS_INSTALLT, STATUS_VANTELISTA, 'Något helt annat']) {
    test(`otillåten status "${status}" avvisas med status_ej_tillaten`, () => {
      const beslut = beslutaOmbokning(underlag({ aktuellStatus: status }));
      expect(beslut.ok).toBe(false);
      if (beslut.ok) return;
      expect(beslut.kod).toBe('status_ej_tillaten');
      expect(beslut.felmeddelande).toContain(status);
    });
  }

  test('tom status (null) avvisas med status_ej_tillaten, kastar aldrig', () => {
    const beslut = beslutaOmbokning(underlag({ aktuellStatus: null }));
    expect(beslut.ok).toBe(false);
    if (beslut.ok) return;
    expect(beslut.kod).toBe('status_ej_tillaten');
    expect(beslut.felmeddelande).toContain('okänd');
  });

  test('en otillåten status som ändå har mål-anmälan blir inte aterupptagning', () => {
    // Bara Avbokad/Ombokad kan vara en påbörjad ombokning. Ett Inställt event
    // med en anmälan på mål-eventet är något annat, och ska avvisas.
    const beslut = beslutaOmbokning(
      underlag({ aktuellStatus: STATUS_INSTALLT, malAnmalanFinns: true }),
    );
    expect(beslut.ok).toBe(false);
    if (beslut.ok) return;
    expect(beslut.kod).toBe('status_ej_tillaten');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Idempotensen som SEKVENS (kortets AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('idempotens: samma anrop två gånger', () => {
  test('anrop 1 utför, anrop 2 och 3 återupptar utan att skriva något', () => {
    const forsta = beslutaOmbokning(underlag());
    expect(forsta.ok && forsta.statusSkaSkrivas).toBe(true);

    // Efter anrop 1: gamla anmälan är avbokad och mål-anmälan finns.
    const efterlaget = underlag({ aktuellStatus: STATUS_AVBOKAD, malAnmalanFinns: true });
    for (const varv of [2, 3]) {
      const beslut = beslutaOmbokning(efterlaget);
      expect(beslut.ok, `varv ${varv}`).toBe(true);
      if (!beslut.ok) return;
      expect(beslut.lage, `varv ${varv}`).toBe('aterupptagning');
      expect(beslut.statusSkaSkrivas, `varv ${varv}`).toBe(false);
    }
  });

  test('avbruten körning (rad skapad, status oskriven) kan köras klart', () => {
    const beslut = beslutaOmbokning(underlag({ malAnmalanFinns: true }));
    expect(beslut.ok).toBe(true);
    if (!beslut.ok) return;
    expect(beslut.statusSkaSkrivas).toBe(true);
    // …och nästa varv efter det är en ren återupptagning.
    const efter = beslutaOmbokning(
      underlag({ aktuellStatus: STATUS_AVBOKAD, malAnmalanFinns: true }),
    );
    expect(efter.ok && efter.statusSkaSkrivas).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. byggOmbokningsrad — formen är LÅST av kortets AC #2
// ═══════════════════════════════════════════════════════════════════════════

test.describe('byggOmbokningsrad', () => {
  test('full form: [Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>', () => {
    const rad = byggOmbokningsrad('2026-09-03', 'Lotta Nilsson', 'Fjärrskådning', '2026-10-15');
    expect(rad).toBe('[Ombokad 2026-09-03 av Lotta Nilsson] till Fjärrskådning, 2026-10-15');
  });

  test('AC-formen matchar även med okända delar', () => {
    const form = /^\[Ombokad \d{4}-\d{2}-\d{2} av .+\] till .+$/;
    expect(form.test(byggOmbokningsrad('2026-09-03', 'Lotta', 'Kurs', '2026-10-15'))).toBe(true);
    expect(form.test(byggOmbokningsrad('2026-09-03', 'Lotta', null, null))).toBe(true);
  });

  test('utan datum: inget hängande komma och ingen tom svans', () => {
    const rad = byggOmbokningsrad('2026-09-03', 'Lotta', 'Fjärrskådning', null);
    expect(rad).toBe('[Ombokad 2026-09-03 av Lotta] till Fjärrskådning');
    expect(rad.endsWith(',')).toBe(false);
    expect(rad.endsWith(' ')).toBe(false);
  });

  test('utan eventnamn: okänt event, aldrig ordet null i basens text', () => {
    const rad = byggOmbokningsrad('2026-09-03', 'Lotta', null, '2026-10-15');
    expect(rad).toBe('[Ombokad 2026-09-03 av Lotta] till okänt event, 2026-10-15');
    expect(rad).not.toContain('null');
  });

  test('tomma och blanksteg-bara värden behandlas som saknade', () => {
    expect(byggOmbokningsrad('2026-09-03', 'Lotta', '   ', '  ')).toBe(
      '[Ombokad 2026-09-03 av Lotta] till okänt event',
    );
  });

  test('namn och datum trimmas', () => {
    expect(byggOmbokningsrad('2026-09-03', 'Lotta', '  Fjärrskådning ', ' 2026-10-15 ')).toBe(
      '[Ombokad 2026-09-03 av Lotta] till Fjärrskådning, 2026-10-15',
    );
  });

  test('appendNotering bevarar befintlig text och lägger raden sist', () => {
    const befintlig = 'Lottas egen anteckning.';
    const rad = byggOmbokningsrad('2026-09-03', 'Lotta', 'Fjärrskådning', '2026-10-15');
    const resultat = appendNotering(befintlig, rad);
    expect(resultat.startsWith(befintlig)).toBe(true);
    expect(resultat.endsWith(rad)).toBe(true);
    expect(resultat).toBe(`${befintlig}\n\n${rad}`);
  });

  test('tomt Notering-fält ger raden ensam, utan inledande radbrytning', () => {
    const rad = byggOmbokningsrad('2026-09-03', 'Lotta', 'Fjärrskådning', null);
    expect(appendNotering(null, rad)).toBe(rad);
    expect(appendNotering('   ', rad)).toBe(rad);
  });

  test('datumet kommer från stockholmDatum (samma källa som avbokningen)', () => {
    const datum = stockholmDatum(new Date('2026-09-03T22:30:00.000Z'));
    // 22:30 UTC är redan den 4:e i Stockholm (sommartid, UTC+2).
    expect(datum).toBe('2026-09-04');
    expect(byggOmbokningsrad(datum, 'Lotta', 'Kurs', null)).toContain('[Ombokad 2026-09-04 av');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. byggFlyttadOgonblicksbild — verifikationskravet överlever flytten
// ═══════════════════════════════════════════════════════════════════════════

test.describe('byggFlyttadOgonblicksbild', () => {
  test('namn och datum skrivs om till mål-eventets', () => {
    expect(byggFlyttadOgonblicksbild('Fjärrskådning', '2026-10-15')).toEqual({
      ogonblicksbild_event: 'Fjärrskådning',
      ogonblicksbild_eventdatum: '2026-10-15',
    });
  });

  test('saknat eventnamn ger Okänt event (kolumnen är not null i schemat)', () => {
    expect(byggFlyttadOgonblicksbild(null, '2026-10-15').ogonblicksbild_event).toBe('Okänt event');
    expect(byggFlyttadOgonblicksbild('  ', null).ogonblicksbild_event).toBe('Okänt event');
  });

  test('saknat datum ger null, aldrig tom sträng (kolumnen är date)', () => {
    expect(byggFlyttadOgonblicksbild('Kurs', null).ogonblicksbild_eventdatum).toBeNull();
    expect(byggFlyttadOgonblicksbild('Kurs', '   ').ogonblicksbild_eventdatum).toBeNull();
  });

  test('ogonblicksbild_namn rörs ALDRIG — den är personens, och purge-sentinelns fält', () => {
    const uppdatering = byggFlyttadOgonblicksbild('Kurs', '2026-10-15');
    expect(Object.keys(uppdatering).sort()).toEqual([
      'ogonblicksbild_event',
      'ogonblicksbild_eventdatum',
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. summeraFlyttat — pengar räknas i hela ören
// ═══════════════════════════════════════════════════════════════════════════

test.describe('summeraFlyttat', () => {
  test('tom flytt ger 0', () => {
    expect(summeraFlyttat([])).toBe(0);
  });

  test('flera poster summeras exakt (ingen flyttalsdrift)', () => {
    expect(summeraFlyttat([0.1, 0.2])).toBe(0.3);
    expect(summeraFlyttat([1500, 1000])).toBe(2500);
  });

  test('en flyttad återbetalning (negativt belopp) drar ned summan', () => {
    expect(summeraFlyttat([2500, -500])).toBe(2000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Prisskillnaden (AC #3): positiv, negativ, null — via härledningen EF:en
//    faktiskt returnerar (`harledBetalning(...).saknas` för NYA anmälan)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('prisskillnaden', () => {
  const prisbild = (eventPris: number | null, avtalatPris: number | null = null) => ({
    avtalatPris,
    eventPris,
    anmalningsavgift: null,
    eventTyp: 'Utbildning',
  });
  const flyttat = (belopp: number) => [{ belopp, status: 'aktiv' as const }];

  test('dyrare nytt event ger POSITIV prisskillnad (personen ska betala mellanskillnaden)', () => {
    const h = harledBetalning(flyttat(1500), prisbild(2500));
    expect(h.saknas).toBe(1000);
    expect(h.gallandePris).toBe(2500);
  });

  test('billigare nytt event ger NEGATIV prisskillnad (pengar ska tillbaka)', () => {
    const h = harledBetalning(flyttat(2500), prisbild(2000));
    expect(h.saknas).toBe(-500);
  });

  test('okänt pris ger NULL, aldrig 0 (0 vore ett påstående om något vi inte vet)', () => {
    const h = harledBetalning(flyttat(1500), prisbild(null));
    expect(h.saknas).toBeNull();
    expect(h.gallandePris).toBeNull();
  });

  test('samma pris ger 0 — inget att kräva, inget att betala tillbaka', () => {
    expect(harledBetalning(flyttat(2500), prisbild(2500)).saknas).toBe(0);
  });

  test('avtalat pris på den nya anmälan vinner över eventets pris', () => {
    expect(harledBetalning(flyttat(1500), prisbild(2500, 2000)).saknas).toBe(500);
  });

  test('MAKULERADE poster räknas inte in — en makulerad rad flyttas aldrig, och skulle den ligga kvar på den nya anmälan påverkar den inte skillnaden', () => {
    const h = harledBetalning(
      [
        { belopp: 1500, status: 'aktiv' },
        { belopp: 900, status: 'makulerad' },
      ],
      prisbild(2500),
    );
    expect(h.summa).toBe(1500);
    expect(h.saknas).toBe(1000);
  });

  test('flyttad summa noll (inga aktiva inbetalningar) ger hela priset som skillnad', () => {
    expect(harledBetalning([], prisbild(2500)).saknas).toBe(2500);
  });

  test('öresexakthet: skillnaden avrundas till hela ören', () => {
    const h = harledBetalning(flyttat(0.05), prisbild(2500.55));
    expect(h.saknas).toBe(2500.5);
  });
});
