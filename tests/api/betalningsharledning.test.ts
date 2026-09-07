// Härledningens kontraktstest — TASK-346.4 AC #4, DoD #5, ADR-128 beslut 2.
//
// api-pure: `_shared/betalningsharledning.ts` importerar bara den importfria
// `betalningsbelopp.ts` och är därmed Node-körbar utan en enda mock.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM BEVISAS, OCH VARFÖR JUST DET
// ═══════════════════════════════════════════════════════════════════════════
// ADR-128 beslut 2, ordagrant: "avgiften är klar när summan når
// anmälningsavgiftens pris, allt är klart när summan når hela priset, oavsett
// i vilken ordning och i hur många poster pengarna kom, en föreläsning har
// ett pris utan fack" plus "`Avtalat pris` ... vinner över eventets pris".
//
// Kortets AC #4 räknar upp dem som "härledningens fyra fall + avtalat pris +
// återbetalning + föreläsning". Sviten följer den uppräkningen § för §.
//
// NEGATIVA KONTROLLER (DoD #5): varje regel prövas mot en TRASIG variant
// skriven här i testet. De trasiga varianterna är de troliga felen, inte
// halmgubbar:
//   - `>` i stället för `>=` (missar exakt-betalt, det VANLIGASTE fallet)
//   - sanningsvärde i stället för `!== null` (0-priset, exakt den bugg
//     `Saknas (kr)`-formeln bar i TASK-346.2 runda 2)
//   - härledning ur SENASTE posten i stället för ur summan (ordningsberoende)
//   - makulerade poster medräknade

import { expect, test } from '@playwright/test';
import {
  FORELASNING,
  harledBetalning,
  type InbetalningsBidrag,
  type Prisbild,
  raknasSomForfallen,
  valjPris,
} from '../../supabase/functions/_shared/betalningsharledning';

/** Utbildningens prisbild i grillningens exempel: 2500 totalt, 1000 i avgift. */
const UTBILDNING: Prisbild = {
  avtalatPris: null,
  eventPris: 2500,
  anmalningsavgift: 1000,
  eventTyp: 'Utbildning',
};

function poster(...belopp: number[]): InbetalningsBidrag[] {
  return belopp.map((b) => ({ belopp: b, status: 'aktiv' as const }));
}

/** Föreläsningens prisbild: ETT pris, ingen avgiftsnivå (ADR-128 beslut 2). */
const FORELASNINGSPRISBILD: Prisbild = {
  avtalatPris: null,
  eventPris: 450,
  anmalningsavgift: null,
  eventTyp: FORELASNING,
};

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — Härledningens FYRA FALL (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — de fyra fallen', () => {
  test('FALL 1: inget betalt — varken avgift eller allt', () => {
    const ut = harledBetalning([], UTBILDNING);
    expect(ut.summa).toBe(0);
    expect(ut.avgiftKlar).toBe(false);
    expect(ut.alltKlart).toBe(false);
    expect(ut.saknas).toBe(2500);
    expect(ut.anmalningsavgiftVarde).toBe('Ej mottagen');
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('FALL 2: anmälningsavgiften betald — avgift klar, allt inte', () => {
    const ut = harledBetalning(poster(1000), UTBILDNING);
    expect(ut.avgiftKlar).toBe(true);
    expect(ut.alltKlart).toBe(false);
    expect(ut.saknas).toBe(1500);
    expect(ut.anmalningsavgiftVarde).toBe('Mottagen');
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('FALL 3: hela priset betalt i EN post — allt klart', () => {
    const ut = harledBetalning(poster(2500), UTBILDNING);
    expect(ut.avgiftKlar).toBe(true);
    expect(ut.alltKlart).toBe(true);
    expect(ut.saknas).toBe(0);
    expect(ut.anmalningsavgiftVarde).toBe('Mottagen');
    expect(ut.slutbetalningVarde).toBe('Mottagen');
  });

  test('FALL 4: hela priset betalt i TVÅ poster — samma utfall', () => {
    const ut = harledBetalning(poster(1000, 1500), UTBILDNING);
    expect(ut.alltKlart).toBe(true);
    expect(ut.saknas).toBe(0);
  });

  test('ORDNINGEN SPELAR INGEN ROLL — 1500 först, sedan 1000', () => {
    // ADR-128 beslut 2: "oavsett i vilken ordning och i hur många poster
    // pengarna kom". Egenskapen är strukturell (bara summan går in), och
    // detta test är beviset för att den faktiskt är det.
    const framlanges = harledBetalning(poster(1000, 1500), UTBILDNING);
    const baklanges = harledBetalning(poster(1500, 1000), UTBILDNING);
    expect(baklanges).toEqual(framlanges);
  });

  test('NEGATIV KONTROLL: en härledning ur SENASTE posten ser klar ut men är fel', () => {
    // Den troliga genvägen: "titta på beloppet som just kom in". Den är grön
    // på lördagens vanliga fall (1000 sedan 1500) — vilket är precis varför
    // ett enda lyckligt-fall-test inte hade fångat den.
    const trasigUrSenaste = (belopp: number[], pris: Prisbild) => {
      const senaste = belopp[belopp.length - 1] ?? 0;
      return senaste >= (pris.anmalningsavgift ?? 0);
    };
    expect(trasigUrSenaste([1000, 1500], UTBILDNING)).toBe(true);

    // Den faller så snart pengarna kom i en annan styckning: 2000 + 500 är
    // 2500 kronor, alltså allt betalt — men den SISTA posten är 500.
    expect(trasigUrSenaste([2000, 500], UTBILDNING)).toBe(false);
    expect(harledBetalning(poster(2000, 500), UTBILDNING).avgiftKlar).toBe(true);
    expect(harledBetalning(poster(2000, 500), UTBILDNING).alltKlart).toBe(true);
  });

  test('NEGATIV KONTROLL: `>` i stället för `>=` missar exakt-betalt', () => {
    // Det VANLIGASTE fallet är att Lotta får in precis rätt belopp. En
    // implementation med strikt större-än är grön på varje överbetalning och
    // fel på varje exakt betalning.
    const trasigStrikt = (summa: number, grans: number) => summa > grans;
    expect(trasigStrikt(1000, 1000)).toBe(false);
    expect(harledBetalning(poster(1000), UTBILDNING).avgiftKlar).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — Avtalat pris (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — avtalat pris vinner', () => {
  test('rabatterat pris gör 2000 till "allt betalt"', () => {
    const ut = harledBetalning(poster(2000), { ...UTBILDNING, avtalatPris: 2000 });
    expect(ut.gallandePris).toBe(2000);
    expect(ut.alltKlart).toBe(true);
    expect(ut.saknas).toBe(0);
  });

  test('AVTALAT PRIS 0 VINNER ÖVER EVENTETS 2500 — noll är ett SATT pris', () => {
    // Exakt den bugg `Saknas (kr)`-formeln bar innan TASK-346.2 runda 2:
    // Airtables (och JavaScripts) `OR()`/`IF()` läser talet 0 som falskt, så
    // ett gratis-/comp-pris lästes som "inget pris känt".
    const ut = harledBetalning(poster(500), { ...UTBILDNING, avtalatPris: 0 });
    expect(ut.gallandePris).toBe(0);
    expect(ut.saknas).toBe(-500);
    expect(ut.alltKlart).toBe(true);
  });

  test('NEGATIV KONTROLL: sanningsvärdesprövning ger 2500 i stället för 0', () => {
    const trasigSanningsvarde = (pris: Prisbild) => pris.avtalatPris || pris.eventPris;
    expect(trasigSanningsvarde({ ...UTBILDNING, avtalatPris: 0 })).toBe(2500);
    expect(harledBetalning([], { ...UTBILDNING, avtalatPris: 0 }).gallandePris).toBe(0);
  });

  test('valjPris följer samma noll-regel genom alla tre nivåerna', () => {
    expect(valjPris(0, 2500, 3000)).toBe(0);
    expect(valjPris(null, 0, 3000)).toBe(0);
    expect(valjPris(null, null, 0)).toBe(0);
    expect(valjPris(null, null, null)).toBeNull();
    expect(valjPris(null, 2500, 3000)).toBe(2500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — Återbetalning (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — återbetalning', () => {
  test('en negativ post drar ned summan och FLIPPAR TILLBAKA facket', () => {
    const fore = harledBetalning(poster(2500), UTBILDNING);
    expect(fore.alltKlart).toBe(true);

    const efter = harledBetalning(poster(2500, -1500), UTBILDNING);
    expect(efter.summa).toBe(1000);
    expect(efter.alltKlart).toBe(false);
    expect(efter.avgiftKlar).toBe(true);
    expect(efter.slutbetalningVarde).toBe('Ej mottagen');
    expect(efter.saknas).toBe(1500);
  });

  test('full återbetalning nollställer båda facken', () => {
    const ut = harledBetalning(poster(2500, -2500), UTBILDNING);
    expect(ut.summa).toBe(0);
    expect(ut.avgiftKlar).toBe(false);
    expect(ut.alltKlart).toBe(false);
  });

  test('NEGATIV KONTROLL: absolutbelopp gör en återbetalning till en inbetalning', () => {
    const trasigAbs = [2500, -1500].reduce((a, b) => a + Math.abs(b), 0);
    expect(trasigAbs).toBe(4000);
    expect(harledBetalning(poster(2500, -1500), UTBILDNING).summa).toBe(1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — Makulerade poster räknas inte
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — makulering', () => {
  test('en makulerad post räknas inte in i summan', () => {
    const ut = harledBetalning(
      [
        { belopp: 1000, status: 'aktiv' },
        { belopp: 1500, status: 'makulerad' },
      ],
      UTBILDNING,
    );
    expect(ut.summa).toBe(1000);
    expect(ut.alltKlart).toBe(false);
  });

  test('NEGATIV KONTROLL: utan statusfiltret ser anmälan fullbetald ut', () => {
    const trasigUtanFilter = [1000, 1500].reduce((a, b) => a + b, 0);
    expect(trasigUtanFilter).toBe(2500);
    expect(
      harledBetalning(
        [
          { belopp: 1000, status: 'aktiv' },
          { belopp: 1500, status: 'makulerad' },
        ],
        UTBILDNING,
      ).summa,
    ).toBe(1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — Föreläsning: ETT pris utan fack (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — föreläsning', () => {
  // Delad med § 6:s mutantjämförelse — se toppen av filen.
  const FORELASNINGSPRIS = FORELASNINGSPRISBILD;

  test('avgiftens gräns ÄR hela priset — inget delbetalningssteg finns', () => {
    const halvt = harledBetalning(poster(200), FORELASNINGSPRIS);
    expect(halvt.arForelasning).toBe(true);
    expect(halvt.avgiftsgrans).toBe(450);
    expect(halvt.avgiftKlar).toBe(false);
    expect(halvt.alltKlart).toBe(false);

    const helt = harledBetalning(poster(450), FORELASNINGSPRIS);
    expect(helt.avgiftKlar).toBe(true);
    expect(helt.alltKlart).toBe(true);
  });

  test('slutbetalningen märks "Ej relevant (för föreläsningar)" — MED parentesen', () => {
    // Parentesen är inte kosmetisk. `data-model.md` § Kända fällor 52: basens
    // egen formel `Deadline slutbetalning` testar mot `"Ej relevant"` UTAN
    // parentes, och dess undantagsgren har därför varit död kod sedan den
    // skrevs. Ett skrivfel HÄR hade gett ett Airtable-fel Lotta ser.
    const ut = harledBetalning(poster(450), FORELASNINGSPRIS);
    expect(ut.slutbetalningVarde).toBe('Ej relevant (för föreläsningar)');
    expect(ut.slutbetalningVarde).not.toBe('Ej relevant');
  });

  test('NEGATIV KONTROLL: en utbildnings-härledning på en föreläsning ger fel fack', () => {
    // Utan `arForelasning`-grenen skulle avgiftens gräns hämtas ur
    // `anmalningsavgift`, som är `null` för en föreläsning — och facket hade
    // då aldrig kunnat bli klart.
    const somUtbildning = harledBetalning(poster(450), {
      ...FORELASNINGSPRIS,
      eventTyp: 'Utbildning',
    });
    expect(somUtbildning.avgiftsgrans).toBeNull();
    expect(somUtbildning.slutbetalningVarde).toBe('Mottagen');
    expect(harledBetalning(poster(450), FORELASNINGSPRIS).avgiftsgrans).toBe(450);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 6 — Okänt pris: `null` betyder "rör inte fältet"
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — okänt pris', () => {
  const UTAN_PRIS: Prisbild = {
    avtalatPris: null,
    eventPris: null,
    anmalningsavgift: null,
    eventTyp: 'Utbildning',
  };

  test('inget pris känt ger `null` för BÅDA facken, aldrig "Ej mottagen"', () => {
    // Att gissa "Ej mottagen" hade skrivit en osanning in i basen: ett fack
    // vars gräns saknas kan inte avgöras.
    const ut = harledBetalning(poster(1000), UTAN_PRIS);
    expect(ut.gallandePris).toBeNull();
    expect(ut.saknas).toBeNull();
    expect(ut.anmalningsavgiftVarde).toBeNull();
    expect(ut.slutbetalningVarde).toBeNull();
  });

  test('KÄNT helpris men OKÄND avgift: allt-klart implicerar avgift-klar', () => {
    // Utan implikationen hade en fullbetald anmälan utan ifylld
    // `Anmälningsavgift (kr)` visat "avgift ej mottagen" — en synlig
    // motsägelse i Lottas vy.
    const ut = harledBetalning(poster(2500), { ...UTBILDNING, anmalningsavgift: null });
    expect(ut.avgiftsgrans).toBeNull();
    expect(ut.alltKlart).toBe(true);
    expect(ut.avgiftKlar).toBe(true);
    expect(ut.anmalningsavgiftVarde).toBe('Mottagen');
  });

  test('NEGATIV KONTROLL: utan implikationen blir facket "Ej mottagen" på en fullbetald anmälan', () => {
    const trasigUtanImplikation = (summa: number, grans: number | null) =>
      grans !== null && summa >= grans;
    expect(trasigUtanImplikation(2500, null)).toBe(false);
    expect(
      harledBetalning(poster(2500), { ...UTBILDNING, anmalningsavgift: null }).avgiftKlar,
    ).toBe(true);
  });

  // ── Granskningsfynd runda 1: falskt "Ej mottagen" när bara avgiften saknas ──
  //
  // KÄNT HELPRIS men OKÄND AVGIFT är inte samma sak som "inget pris känt", och
  // det är precis där den ursprungliga implementationen påstod för mycket.
  // `avgiftKanAvgoras` löd `avgiftsgrans !== null || gallandePris !== null`, så
  // helprisets närvaro ensam gjorde avgiftsfacket "avgörbart" — och en
  // delbetalning märktes "Ej mottagen" trots att ingen visste vad avgiften
  // kostade.

  test('SONDERINGEN: summa 1000, pris 2500, avgift OKÄND ⇒ avgiftsfacket rörs INTE', () => {
    const ut = harledBetalning(poster(1000), { ...UTBILDNING, anmalningsavgift: null });
    expect(ut.gallandePris).toBe(2500);
    expect(ut.avgiftsgrans).toBeNull();
    expect(ut.alltKlart).toBe(false);
    // Kärnan: `null` betyder "rör inte fältet", INTE "Ej mottagen".
    expect(ut.anmalningsavgiftVarde).toBeNull();
    // Slutbetalningen är däremot avgörbar — DESS gräns är helpriset, som är känt.
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('SAMMA prisbild, summa 2500 ⇒ avgiftsfacket blir Mottagen (allt klart implicerar det)', () => {
    const ut = harledBetalning(poster(2500), { ...UTBILDNING, anmalningsavgift: null });
    expect(ut.alltKlart).toBe(true);
    expect(ut.anmalningsavgiftVarde).toBe('Mottagen');
    expect(ut.slutbetalningVarde).toBe('Mottagen');
  });

  test('NEGATIV KONTROLL: granskarens mutation (|| gallandePris !== null) DÖDAS av sonderingen', () => {
    // Den muterade formen, skriven här och aldrig i produktionskoden. Den är
    // inte en halmgubbe — den ÄR koden som låg i filen före denna fix-runda.
    const muteradKanAvgoras = (avgiftsgrans: number | null, gallandePris: number | null) =>
      avgiftsgrans !== null || gallandePris !== null;
    const gallandeKanAvgoras = (avgiftsgrans: number | null, alltKlart: boolean) =>
      avgiftsgrans !== null || alltKlart;

    // Sonderingens indata: avgiftsgräns okänd, helpris 2500, summa 1000.
    expect(muteradKanAvgoras(null, 2500)).toBe(true); // ⇒ hade gett 'Ej mottagen'
    expect(gallandeKanAvgoras(null, false)).toBe(false); // ⇒ ger null

    // Och den riktiga implementationen följer den senare, inte den förra.
    expect(
      harledBetalning(poster(1000), { ...UTBILDNING, anmalningsavgift: null })
        .anmalningsavgiftVarde,
    ).toBeNull();
  });

  test('de två formerna skiljer sig ENBART i detta hörn — mätt genom harledBetalning', () => {
    // Om mutationen hade gett samma svar överallt vore fixen kosmetisk. Den
    // gör det inte — och den gör det bara i ETT hörn: avgiftsgränsen saknas
    // OCH summan är STRIKT POSITIV men understiger helpriset.
    //
    // "Strikt positiv" tillkom i `TASK-372`: vid `summa <= 0` med känt
    // helpris ger produktionskoden numera samma svar som mutanten
    // ('Ej mottagen'), av ett helt annat skäl — se § 8. Hörnet krympte
    // alltså, det flyttade inte; sonderingen nedan ligger kvar i det.
    //
    // VARJE FALL GÅR GENOM PRODUKTIONSKODEN (granskningsfynd runda 2 ersatte
    // en tidigare version som jämförde två lokala uttryck med varandra och
    // därför kunde ha varit grön mot vilken implementation som helst).
    // Mutantens svar räknas fram ur harledBetalnings EGNA utdata
    // (`avgiftKlar`, `avgiftsgrans`, `gallandePris`), så jämförelsen är
    // mellan den riktiga funktionen och den enda rad som skiljer mutanten
    // från den.
    const somMutanten = (ut: ReturnType<typeof harledBetalning>) =>
      ut.avgiftKlar
        ? 'Mottagen'
        : ut.avgiftsgrans !== null || ut.gallandePris !== null
          ? 'Ej mottagen'
          : null;

    const vanligaFall: { namn: string; belopp: number[]; pris: Prisbild }[] = [
      { namn: 'avgift känd, delbetalt', belopp: [500], pris: UTBILDNING },
      { namn: 'avgift känd, avgiften betald', belopp: [1000], pris: UTBILDNING },
      { namn: 'avgift känd, allt betalt', belopp: [2500], pris: UTBILDNING },
      {
        namn: 'avgift okänd, allt betalt',
        belopp: [2500],
        pris: { ...UTBILDNING, anmalningsavgift: null },
      },
      {
        namn: 'inget pris alls känt',
        belopp: [1000],
        pris: { ...UTBILDNING, eventPris: null, anmalningsavgift: null },
      },
      { namn: 'föreläsning, allt betalt', belopp: [450], pris: FORELASNINGSPRISBILD },
      { namn: 'föreläsning, delbetalt', belopp: [200], pris: FORELASNINGSPRISBILD },
    ];

    for (const fall of vanligaFall) {
      const ut = harledBetalning(poster(...fall.belopp), fall.pris);
      expect(ut.anmalningsavgiftVarde, fall.namn).toBe(somMutanten(ut));
    }

    // HÖRNET: avgiftsgräns okänd, helpris känt, summan under det.
    const horn = harledBetalning(poster(1000), { ...UTBILDNING, anmalningsavgift: null });
    expect(horn.anmalningsavgiftVarde).toBeNull();
    expect(somMutanten(horn)).toBe('Ej mottagen');
    expect(horn.anmalningsavgiftVarde).not.toBe(somMutanten(horn));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 7 — Öret: att spegeln aldrig får bära flyttalsbrus
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledBetalning — precision', () => {
  test('saknas avrundas till hela ören', () => {
    const ut = harledBetalning(poster(0.05), {
      ...UTBILDNING,
      eventPris: 2500.55,
      avtalatPris: null,
    });
    // 2500.55 - 0.05 ger 2500.4999999999995 i IEEE 754, och just det talet
    // hade skrivits rakt in i basens spegel utan avrundningen.
    expect(ut.saknas).toBe(2500.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 8 — SUMMA NOLL SKRIVER TILLBAKA (TASK-372)
// ═══════════════════════════════════════════════════════════════════════════
//
// Felet som mättes i prod 2026-09-03 (RIM 3 Rönninge, `recLJ3SuZz8A1UEND`):
// helpriset registrerades och RADERADES, och `Anmälningsavgift` stod kvar på
// `Mottagen` fast summan var 0. Härledningen var ENVÄGS för ett event utan
// `Anmälningsavgift (kr)` — den kunde sätta facket men aldrig ta tillbaka det,
// eftersom `null` betyder "rör inte fältet" och `skrivSpegel` hoppar över det.
//
// Regeln som prövas här: `summa <= 0` gör avgiftsfacket avgörbart NÄR
// HELPRISET ÄR KÄNT. Hela härledningen och den medvetna avgränsningen står i
// `betalningsharledning.ts` § SUMMA NOLL — sviten låser BÅDA riktningarna,
// alltså både att facket nu återställs och att det INTE återställs där
// avgränsningen säger nej.

test.describe('harledBetalning — summa noll skriver tillbaka', () => {
  /** RIM 3:s prisbild: helpriset känt, `Anmälningsavgift (kr)` tom i basen. */
  const UTAN_AVGIFTSPRIS: Prisbild = { ...UTBILDNING, anmalningsavgift: null };
  /** Ingen prisinformation alls — den klass fixen medvetet INTE rör. */
  const UTAN_NAGOT_PRIS: Prisbild = { ...UTBILDNING, eventPris: null, anmalningsavgift: null };

  test('ENVÄGSFELET, ände-till-ände: registrera helpris → radera ⇒ båda facken tillbaka', () => {
    // Steg 1 — Marcus registrerar 2 500 kr. Egenskap 2 ger `Mottagen` trots
    // att avgiftens egen gräns är okänd. Detta är och förblir korrekt.
    const efterRegistrering = harledBetalning(poster(2500), UTAN_AVGIFTSPRIS);
    expect(efterRegistrering.anmalningsavgiftVarde).toBe('Mottagen');
    expect(efterRegistrering.slutbetalningVarde).toBe('Mottagen');

    // Steg 2 — raden RADERAS. Postgres har noll rader kvar, alltså noll poster.
    const efterRadering = harledBetalning([], UTAN_AVGIFTSPRIS);
    expect(efterRadering.summa).toBe(0);
    // Kärnan: FÖRE fixen var detta `null` ⇒ spegeln hoppade över fältet ⇒
    // `Mottagen` stod kvar i basen. Spökflaggan.
    expect(efterRadering.anmalningsavgiftVarde).toBe('Ej mottagen');
    expect(efterRadering.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('MAKULERING ger samma utfall som radering — summan är 0 i båda fallen', () => {
    const ut = harledBetalning([{ belopp: 2500, status: 'makulerad' }], UTAN_AVGIFTSPRIS);
    expect(ut.summa).toBe(0);
    expect(ut.anmalningsavgiftVarde).toBe('Ej mottagen');
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('NETTONEGATIV summa räknas som noll-fallet — därför `<= 0`, inte `=== 0`', () => {
    // En återbetalning större än inbetalningarna bär exakt samma sanning:
    // ingenting är betalt, och en okänd gräns är strikt positiv.
    const ut = harledBetalning(poster(2500, -3000), UTAN_AVGIFTSPRIS);
    expect(ut.summa).toBe(-500);
    expect(ut.anmalningsavgiftVarde).toBe('Ej mottagen');
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('REGRESSIONSVAKT: en DELBETALNING som står kvar rörs fortfarande INTE', () => {
    // § 6:s sondering, oförändrad. Fixen gäller `summa <= 0` — inte varje
    // summa under helpriset. Vore detta `Ej mottagen` hade granskningsfyndet
    // från runda 1 återinförts.
    const ut = harledBetalning(poster(1000), UTAN_AVGIFTSPRIS);
    expect(ut.summa).toBe(1000);
    expect(ut.anmalningsavgiftVarde).toBeNull();
    expect(ut.slutbetalningVarde).toBe('Ej mottagen');
  });

  test('OKÄNT HELPRIS + summa 0 ⇒ facken rörs INTE — avgränsningen som skyddar Lottas flaggor', () => {
    // Sanningsargumentet ("okänd gräns är strikt positiv") hade räckt för att
    // skriva `Ej mottagen` även här. Villkoret är medvetet SMALARE: 305
    // historiska anmälningar bär Lottas manuella `Mottagen` utan en enda
    // inbetalningsrad, och för dem är basen enda källan. Utan känt helpris
    // uttalar sig appen inte — samma linje som backfillens `pris-okant`-hopp.
    const ut = harledBetalning([], UTAN_NAGOT_PRIS);
    expect(ut.summa).toBe(0);
    expect(ut.gallandePris).toBeNull();
    expect(ut.anmalningsavgiftVarde).toBeNull();
    expect(ut.slutbetalningVarde).toBeNull();
  });

  test('GRATISEVENT: pris 0, summa 0, avgift okänd ⇒ Mottagen — ternärens ordning bär det', () => {
    // 0 är ett SATT pris (§ NOLL), så `alltKlart` är sant redan utan poster
    // och `avgiftKlar`-grenen tas FÖRE noll-predikatet får betydelse. Vore
    // ordningen omkastad hade ett gratisevent märkts "Ej mottagen".
    const gratis: Prisbild = { ...UTBILDNING, eventPris: 0, anmalningsavgift: null };
    const ut = harledBetalning([], gratis);
    expect(ut.gallandePris).toBe(0);
    expect(ut.alltKlart).toBe(true);
    expect(ut.anmalningsavgiftVarde).toBe('Mottagen');
    expect(ut.slutbetalningVarde).toBe('Mottagen');
  });

  test('FÖRELÄSNING vid summa 0: facket är `Ej relevant`, avgiften följer helpriset', () => {
    const ut = harledBetalning([], FORELASNINGSPRISBILD);
    expect(ut.summa).toBe(0);
    // Föreläsningens avgiftsgräns ÄR helpriset, alltså känd — utfallet är
    // detsamma före och efter fixen. Fallet står här för att en föreläsning
    // aldrig ska kunna hamna i noll-grenen av misstag.
    expect(ut.avgiftsgrans).toBe(450);
    expect(ut.anmalningsavgiftVarde).toBe('Ej mottagen');
    expect(ut.slutbetalningVarde).toBe('Ej relevant (för föreläsningar)');
  });

  test('NEGATIV KONTROLL: en fix UTAN prisvillkoret skriver över den prislösa anmälan', () => {
    // Den bredare varianten, skriven här och aldrig i produktionskoden. Den
    // löser RIM 3 lika bra — och skriver samtidigt `Ej mottagen` över en
    // anmälan appen inget vet om. Det är skälet den valdes bort.
    const utanPrisvillkor = (summa: number, avgiftsgrans: number | null, alltKlart: boolean) =>
      avgiftsgrans !== null || alltKlart || summa <= 0;

    // Prislös anmälan, summa 0: mutanten säger "avgörbar", koden säger nej.
    expect(utanPrisvillkor(0, null, false)).toBe(true);
    expect(harledBetalning([], UTAN_NAGOT_PRIS).anmalningsavgiftVarde).toBeNull();

    // Och på RIM 3-fallet är de överens — skillnaden ligger BARA i hörnet ovan.
    expect(harledBetalning([], UTAN_AVGIFTSPRIS).anmalningsavgiftVarde).toBe('Ej mottagen');
  });

  test('NEGATIV KONTROLL: `=== 0` i stället för `<= 0` missar den nettonegativa summan', () => {
    const medLikhet = (summa: number, gallandePris: number | null) =>
      summa === 0 && gallandePris !== null;
    expect(medLikhet(-500, 2500)).toBe(false); // ⇒ hade gett `null`, alltså spökflagga
    expect(harledBetalning(poster(2500, -3000), UTAN_AVGIFTSPRIS).anmalningsavgiftVarde).toBe(
      'Ej mottagen',
    );
  });

  test('INVARIANTEN: vid summa <= 0 med okänd avgift är facken avgörbara TILLSAMMANS', () => {
    // Detta är regelns egentliga form: fixen ger avgiftsfacket exakt den
    // avgörbarhet slutbetalningsfacket redan hade, aldrig mer. Prövas över
    // hela korsprodukten summa × helpris, inte på ett enskilt fall.
    const summor = [0, -0.5, -500, -2500];
    const priser: (number | null)[] = [2500, 1, null];

    for (const summa of summor) {
      for (const eventPris of priser) {
        const ut = harledBetalning(summa === 0 ? [] : poster(summa), {
          ...UTBILDNING,
          eventPris,
          anmalningsavgift: null,
        });
        const etikett = `summa=${summa} pris=${eventPris}`;
        expect(ut.summa, etikett).toBeLessThanOrEqual(0);
        expect(ut.avgiftsgrans, etikett).toBeNull();
        expect(ut.anmalningsavgiftVarde !== null, etikett).toBe(ut.slutbetalningVarde !== null);
        expect(ut.anmalningsavgiftVarde, etikett).toBe(eventPris === null ? null : 'Ej mottagen');
      }
    }
  });
});

/* ═══════════════════ FÖRFALLEN KRÄVER ÖPPEN (TASK-367 review runda 1, FYND 1) ═══════════════════
 *
 * ADR-128 beslut 2: "ÖPPEN BETALNING = Saknas (kr) > 0 … FÖRFALLEN =
 * slutbetalningens deadline passerad" — förfallen är ett attribut HOS en
 * öppen betalning, inte ett fristående datumvillkor. `hamta-oppna-
 * betalningar`s toppnivåfält `forfallna` ska därför ALDRIG räkna en
 * fullbetald anmälan, oavsett hur gammalt deadline-datumet är.
 */

test('en ÖPPEN betalning med passerat deadline ÄR förfallen', () => {
  expect(raknasSomForfallen(500, '2026-08-01', '2026-09-06')).toBe(true);

  // NEGATIV KONTROLL: trasig variant som ignorerar `saknas` helt — det ÄR
  // exakt buggen FYND 1 fångade (räknade varenda rad i `rader`, oavsett om
  // något fortfarande saknades).
  const trasig = (deadline: string | null, idag: string) =>
    deadline !== null && deadline.slice(0, 10) < idag;
  expect(trasig('2026-08-01', '2026-09-06')).toBe(true);
});

test('en FULLBETALD anmälan (saknas = 0) räknas ALDRIG som förfallen, även med gammalt deadline', () => {
  expect(raknasSomForfallen(0, '2026-08-01', '2026-09-06')).toBe(false);

  // NEGATIV KONTROLL: samma trasiga variant som ovan hade sagt `true` här —
  // exakt skillnaden mellan koden FÖRE och EFTER denna rättning.
  const trasig = (deadline: string | null, idag: string) =>
    deadline !== null && deadline.slice(0, 10) < idag;
  expect(trasig('2026-08-01', '2026-09-06')).toBe(true);
  expect(raknasSomForfallen(0, '2026-08-01', '2026-09-06')).toBe(false);
});

test('en ÖVERBETALD anmälan (saknas negativt) räknas inte som förfallen', () => {
  expect(raknasSomForfallen(-100, '2026-08-01', '2026-09-06')).toBe(false);
});

test('okänt saknas-belopp (basen kunde inte räkna fram ett pris) räknas inte som förfallen', () => {
  // Fail-open: ett okänt belopp är inte ett bevisat skuldbelopp — samma
  // princip som `deadline === null` nedan.
  expect(raknasSomForfallen(null, '2026-08-01', '2026-09-06')).toBe(false);
});

test('saknad deadline är aldrig förfallen, oavsett saknat belopp', () => {
  expect(raknasSomForfallen(500, null, '2026-09-06')).toBe(false);
});

test('deadline SAMMA DAG är inte förfallen, dagen EFTER är det', () => {
  expect(raknasSomForfallen(500, '2026-09-06', '2026-09-06')).toBe(false);
  expect(raknasSomForfallen(500, '2026-09-05', '2026-09-06')).toBe(true);
});
