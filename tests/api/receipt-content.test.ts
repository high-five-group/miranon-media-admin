// Kontraktstest för kvittots textinnehåll (`_shared/receipt-content.ts`,
// TASK-147.7/ADR-109). FÖRSTA testfilen för modulen — den fanns ingen sedan
// TASK-147.7 landade (verifierat: `find … -iname "*receipt-content*"` gav
// bara källfilen). Byggd i samband med att momsraden och org-uppgifterna
// bekräftades (T170, Marcus 2026-08-22 — "Allt på Rogers kvitto stämmer",
// se ADR-109 § Updates 2026-08-22).
//
// api-pure (ren logik, ingen staging, inga creds) — hela modulen är REN
// formatering (samma disciplin som coerce.test.ts/course-dimensions.test.ts).
//
// TÄCKER:
//   1. `beraknaMoms` — invarianten `netto + moms === brutto`, LÅST för minst
//      tre klasser (heltal, belopp med ören, belopp där en NAIV — oberoende
//      avrundad — variant bevisligen glider men den låsta ordningen inte
//      gör det). Se `beraknaMoms`s egen docstring i källfilen för den fulla
//      matematiska motiveringen (momsandelen 0,2, inte 0,25).
//   2. Rogers kvitto som facit — `2 500,00 → moms 500,00, netto 2 000,00`
//      (`~/Desktop/Miranon Media/exempelpdokument/2026-08-03
//      kvitto-forlaga.pdf`, `pdftotext -layout`, T170).
//   3. `kvittoRader` — org-uppgifterna (`MIRANON_ORG`) syns i klartext, ALDRIG
//      "PLACEHOLDER"/hakparentes-text, och Netto/Moms/Betalt-raderna finns i
//      rätt ordning med rätt formatering.
//   4. [S108, Marcus-beslut 2026-08-22] `formatBelopp` i Rogers format
//      ("2 500,00" — sv-SE-tusentalsavgränsare, alltid två decimaler, ingen
//      `kr`-suffix), `SEK`-prefixet EN gång på BETALT-raden, och köparens
//      e-post (`kundEpost`) som en egen rad direkt under kundnamnet.
//   5. [S108, Marcus-beslut 2026-08-22, "Kör dina rekommendationer"]
//      `formatKvittoDatum` i ISO (`YYYY-MM-DD`, UTC — ingen tidszons-
//      rollover vid årsskifte) och `MIRANON_ORG`s adress som TRE fält
//      (`gatuadress`/`postadress`/`land`) i stället för en radbrytande
//      sträng.
//
// EJ här: PDF-rendering (`receipt-pdf.ts`, pdf-lib/Deno-beroende — täcks av
// `preview-receipt.staging.test.ts`s skarpa PDF-textextraktion mot en
// deployad EF) och mail-utskick (`send-receipt.test.ts`).

import { expect, test } from '@playwright/test';
import {
  beraknaMoms,
  formatBelopp,
  formatKvittoDatum,
  type KvittoradSpec,
  kvittoBenamning,
  kvittoRader,
  MIRANON_ORG,
  MOMSSATS_PROCENT,
} from '../../supabase/functions/_shared/receipt-content';

// "Naiv" motexempel — moms OCH netto avrundas OBEROENDE av varandra direkt
// ur bruttot (ingen härledd via subtraktion). Detta är INTE koden under
// test — det är den FÖRKASTADE ordningen, replikerad här för att bevisa att
// den faktiskt glider (samma "negativ-kontroll-pass"-disciplin som
// ADR-109 § Beslut 2 använder för allokeringsprotokollet).
function naivOberoendeAvrundning(brutto: number): { moms: number; netto: number } {
  const moms = Number((brutto * 0.2).toFixed(2));
  const netto = Number((brutto * 0.8).toFixed(2));
  return { moms, netto };
}

function spec(overrides: Partial<KvittoradSpec> = {}): KvittoradSpec {
  return {
    kvittonummer: 'MM-2026-1001',
    kundnamn: 'Anna Andersson',
    // Fiktiv (PR #1786 pseudonymiserade kundnamn-fältet ovan; adressen
    // matchar samma fiktiva person — konsekvent med preview-receipts
    // TYPEXEMPEL, se preview-receipt/index.ts § TYPEXEMPEL).
    kundEpost: 'anna.andersson@example.com',
    belopp: 2500,
    betalsatt: 'Swish',
    betalning: 'avgift',
    eventNamn: 'Personlig utveckling',
    datum: '2026-08-03T00:00:00.000Z',
    // [TASK-306] Default null (samma "utelämna ledet"-golv som `alla fält
    // null → bara kursnamn`-testfallet nedan förutsätter) — tester som vill
    // se de nya fälten i benämningen sätter dem explicit via `overrides`.
    eventTyp: null,
    eventStart: null,
    eventSlut: null,
    bokforingstext: null,
    ...overrides,
  };
}

test.describe('beraknaMoms — invarianten netto + moms === brutto (LÅST ordning)', () => {
  test('heltal — Rogers kvitto som facit (2 500 → moms 500,00, netto 2 000,00)', () => {
    const { moms, netto } = beraknaMoms(2500);
    expect(moms).toBe(500);
    expect(netto).toBe(2000);
    expect(netto + moms).toBe(2500); // invarianten, strikt ===
  });

  test('belopp med ören (1 234,56 → moms 246,91, netto 987,65)', () => {
    const { moms, netto } = beraknaMoms(1234.56);
    expect(moms).toBe(246.91);
    expect(netto).toBe(987.65);
    expect(netto + moms).toBe(1234.56); // invarianten, strikt ===
  });

  test('belopp där en NAIV (oberoende avrundad) variant bevisligen glider — den låsta ordningen gör det inte', () => {
    const brutto = 100.09;

    // Motexemplet: bevisar att "avrunda båda delarna var för sig" är en
    // verklig bokföringsdefekt, inte en teoretisk oro.
    const naiv = naivOberoendeAvrundning(brutto);
    expect(naiv.moms).toBe(20.02);
    expect(naiv.netto).toBe(80.07);
    expect(naiv.netto + naiv.moms).not.toBe(brutto); // GLIDER: 100.08999999999999 ≠ 100.09

    // Samma delbelopp, men momsen avrundas FÖRST och nettot HÄRLEDS som
    // differens (den låsta ordningen i `beraknaMoms`) — invarianten håller.
    const korrekt = beraknaMoms(brutto);
    expect(korrekt.moms).toBe(20.02);
    expect(korrekt.netto).toBeCloseTo(80.07, 10);
    expect(korrekt.netto + korrekt.moms).toBe(brutto); // HÅLLER: strikt ===
  });

  test('ett brett urval belopp (1 kr–20 000 kr, 1 örets granularitet) håller invarianten exakt i ÖRE-heltalsrymden', () => {
    // Den STARKARE, exakta formen av samma invariant: `netto`/`moms` är
    // konstruerade ur heltalsöre (`Math.round(brutto*100)`), så en
    // ompaketering till öre-heltal måste alltid summera exakt — det är den
    // rymd där kronor-som-flyttal INTE kan garantera det (se källfilens
    // docstring för det empiriska beviset, 442 366/2 000 000 glidningar
    // uppmätta för en naiv flyttals-additionskontroll i öresrymden).
    let checked = 0;
    for (let ore = 1; ore <= 2_000_000; ore += 2003) {
      const brutto = ore / 100;
      const { moms, netto } = beraknaMoms(brutto);
      const momsOre = Math.round(moms * 100);
      const nettoOre = Math.round(netto * 100);
      expect(nettoOre + momsOre).toBe(ore);
      checked++;
    }
    expect(checked).toBeGreaterThan(900); // sanity: loopen körde faktiskt
  });
});

// [TASK-306 rättelsevarv, Marcus dom 1, 2026-08-23] Marcus granskade
// `kvitto-prince-306.pdf` och dömde den tidigare fyrledade formen
// ("Utbildning, 2026-07-25 - 2026-07-26, Resor i medvetandet 1, personlig
// utveckling, meditation") för lång — den tog tre rader i Prince-kolumnen
// mot förlagans EN. Ordagrant: "Kan vi skriva 'Utbildning 2026-07-25/26,
// personlig utveckling, meditation' bara och få plats med det på en rad
// utan att det ser konstigt ut?" Ny form: `<Typ> <Datumspann>,
// <Bokföringstext>` — INGET kursnamn, datumspannet komprimerat
// (`formaterDatumspann`, se `receipt-content.ts`).
test.describe('kvittoBenamning — TASK-306 rättelsevarv <Typ> <Datumspann>, <Bokföringstext>', () => {
  test('Marcus-facit verbatim: "Utbildning 2026-07-25/26, personlig utveckling, meditation"', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Utbildning',
      eventStart: '2026-07-25',
      eventSlut: '2026-07-26',
      bokforingstext: 'personlig utveckling, meditation',
    });
    expect(benamning).toBe('Utbildning 2026-07-25/26, personlig utveckling, meditation');
    expect(benamning).not.toContain('–'); // en-dash
    expect(benamning).not.toContain('—'); // em-dash
  });

  test('datumspann: samma år, olika månad → "MM-DD" på slutet', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Utbildning',
      eventStart: '2026-07-31',
      eventSlut: '2026-08-01',
      bokforingstext: null,
    });
    expect(benamning).toBe('Utbildning 2026-07-31/08-01');
  });

  test('datumspann: olika år → hela slutdatumet ut', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Utbildning',
      eventStart: '2026-12-31',
      eventSlut: '2027-01-01',
      bokforingstext: null,
    });
    expect(benamning).toBe('Utbildning 2026-12-31/2027-01-01');
  });

  test('endagars-event (start === slut): ETT datum, inget intervall', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Föreläsning',
      eventStart: '2026-08-03',
      eventSlut: '2026-08-03',
      bokforingstext: null,
    });
    expect(benamning).toBe('Föreläsning 2026-08-03');
  });

  test('saknat slutdatum behandlas som endagars (inget "undefined"/streck utan andra sidan)', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Utbildning',
      eventStart: '2026-08-03',
      eventSlut: null,
      bokforingstext: null,
    });
    expect(benamning).toBe('Utbildning 2026-08-03');
  });

  test('bara Typ (inga datum, ingen bokföringstext) → bara typen, ingen platshållare/kommatecken', () => {
    const benamning = kvittoBenamning({
      eventTyp: 'Utbildning',
      eventStart: null,
      eventSlut: null,
      bokforingstext: null,
    });
    expect(benamning).toBe('Utbildning');
    expect(benamning).not.toContain(',');
  });

  test('bara bokföringstext (Typ + datum saknas) → bokföringstexten ensam, ingen inledande kommatecken', () => {
    const benamning = kvittoBenamning({
      eventTyp: null,
      eventStart: null,
      eventSlut: null,
      bokforingstext: 'personlig utveckling, meditation',
    });
    expect(benamning).toBe('personlig utveckling, meditation');
    expect(benamning.startsWith(',')).toBe(false);
  });

  test('samtliga fyra fält null → tom sträng (ingen platshållare, aldrig "null"/"undefined")', () => {
    const benamning = kvittoBenamning({
      eventTyp: null,
      eventStart: null,
      eventSlut: null,
      bokforingstext: null,
    });
    expect(benamning).toBe('');
  });

  test('kvittoRader — Avser-raden använder SAMMA benämning (mirror-kontraktet), ingen betalningsetikett (Marcus dom 2)', () => {
    const rader = kvittoRader(
      spec({
        betalning: 'slut',
        eventTyp: 'Utbildning',
        eventStart: '2026-07-25',
        eventSlut: '2026-07-26',
        bokforingstext: 'personlig utveckling, meditation',
      }),
    );
    expect(rader).toContain('Avser: Utbildning 2026-07-25/26, personlig utveckling, meditation');
    // Etiketten är BORTA — varken "Slutbetalning" eller "Anmälningsavgift" får förekomma i Avser-raden.
    const avserRad = rader.find((r) => r.startsWith('Avser:'));
    expect(avserRad).not.toContain('Slutbetalning');
    expect(avserRad).not.toContain('Anmälningsavgift');
  });

  test('kvittoRader — Betalsätt-raden FINNS KVAR i mailtexten (mallens borttagning, beslut c, rör INTE kvittoRader)', () => {
    const rader = kvittoRader(spec({ betalsatt: 'Bankgiro' }));
    expect(rader).toContain('Betalsätt: Bankgiro');
  });

  test('kvittoRader — Avser-raden utan benämning (alla fyra benämningsfält null) blir bara "Avser:", ingen etikett-fallback', () => {
    const rader = kvittoRader(
      spec({
        betalning: 'avgift',
        eventTyp: null,
        eventStart: null,
        eventSlut: null,
        bokforingstext: null,
      }),
    );
    expect(rader.find((r) => r.startsWith('Avser:'))).toBe('Avser:');
    expect(rader).not.toContain('Avser: Anmälningsavgift');
  });
});

test.describe('kvittoRader — org-uppgifter + moms-rader', () => {
  test('org-uppgifterna är de VERKLIGA (aldrig platshållartext/hakparenteser)', () => {
    const rader = kvittoRader(spec());
    expect(rader).toContain('Miranon Media AB');
    expect(rader).toContain('Org.nr: 559540-5498');
    expect(rader).toContain('Momsreg.nr: SE559540549801');

    for (const rad of rader) {
      expect(rad).not.toContain('PLACEHOLDER');
      expect(rad).not.toContain('EJ BEKRÄFTAT');
      expect(rad).not.toContain('EJ BEKRÄFTAD');
      expect(rad).not.toMatch(/[[\]]/); // ingen hakparentes-platshållare kvar
    }
  });

  // [S108, Marcus-beslut 2026-08-22] Adressen är TRE rader (Rogers egen
  // radindelning), inte en radbrytande enradssträng — se receipt-content.ts
  // filhuvud och ADR-109 § Updates 2026-08-22.
  test('org-adressen är TRE separata rader, i Rogers ordning (gata → postort → land)', () => {
    const rader = kvittoRader(spec());
    expect(rader).toContain('Uttringe Hages väg 17');
    expect(rader).toContain('144 63 Rönninge');
    expect(rader).toContain('Sverige');
    expect(rader).not.toContain('Uttringe Hages väg 17, 144 63 Rönninge, Sverige');

    const namnIdx = rader.indexOf('Miranon Media AB');
    const gataIdx = rader.indexOf('Uttringe Hages väg 17');
    const postortIdx = rader.indexOf('144 63 Rönninge');
    const landIdx = rader.indexOf('Sverige');
    expect(gataIdx).toBe(namnIdx + 2); // efter Org.nr-raden
    expect(postortIdx).toBe(gataIdx + 1);
    expect(landIdx).toBe(postortIdx + 1);
  });

  test('MIRANON_ORG bär exakt de sju bekräftade fälten — adressen delad i tre (S108), varReferens eget fält (TASK-306 rättelsevarv, Marcus dom 3)', () => {
    expect(MIRANON_ORG).toEqual({
      namn: 'Miranon Media AB',
      varReferens: 'Miranon Media/Lotta Gotthardsson',
      orgnummer: '559540-5498',
      gatuadress: 'Uttringe Hages väg 17',
      postadress: '144 63 Rönninge',
      land: 'Sverige',
      momsregnummer: 'SE559540549801',
    });
  });

  test('[S108] Datum-raden är ISO (YYYY-MM-DD) — kvittot är en bokföringshandling, inte svensk datumtext', () => {
    const rader = kvittoRader(spec({ datum: '2026-08-03T00:00:00.000Z' }));
    expect(rader).toContain('Datum: 2026-08-03');
    expect(rader).not.toContain('Datum: 3 augusti 2026');
  });

  test('Netto/Moms/Betalt-raderna finns, i rätt ordning, med Rogers facit-belopp OCH -format ("2 000,00", SEK-prefix EN gång)', () => {
    const rader = kvittoRader(spec({ belopp: 2500 }));
    expect(MOMSSATS_PROCENT).toBe(25);
    expect(rader).toContain('Netto: 2 000,00');
    expect(rader).toContain('Moms (25 %): 500,00');
    expect(rader).toContain('Betalt: SEK 2 500,00');

    const nettoIdx = rader.indexOf('Netto: 2 000,00');
    const momsIdx = rader.indexOf('Moms (25 %): 500,00');
    const betaltIdx = rader.indexOf('Betalt: SEK 2 500,00');
    expect(nettoIdx).toBeGreaterThanOrEqual(0);
    expect(momsIdx).toBe(nettoIdx + 1);
    expect(betaltIdx).toBe(momsIdx + 1);
  });

  test('Netto/Moms/Betalt med ören-belopp formateras konsekvent via formatBelopp', () => {
    const rader = kvittoRader(spec({ belopp: 133.5 }));
    // moms = avrunda(133.5*0.2*100)/100 = avrunda(2670)/100 = 26,70; netto = 133.5-26.70 = 106,80
    expect(rader).toContain(`Netto: ${formatBelopp(106.8)}`);
    expect(rader).toContain(`Moms (25 %): ${formatBelopp(26.7)}`);
    expect(rader).toContain(`Betalt: SEK ${formatBelopp(133.5)}`);
  });

  test('[S108] E-posten skrivs som egen rad DIREKT under kundnamnet (Rogers Fakturaadress-ordning: namn → e-post)', () => {
    const rader = kvittoRader(
      spec({ kundnamn: 'Anna Andersson', kundEpost: 'anna.andersson@example.com' }),
    );
    const kundIdx = rader.indexOf('Kund: Anna Andersson');
    const epostIdx = rader.indexOf('E-post: anna.andersson@example.com');
    expect(kundIdx).toBeGreaterThanOrEqual(0);
    expect(epostIdx).toBe(kundIdx + 1);
  });

  test('mirror-kontraktets FAKTISKA räckvidd — kvittoRader() är källan för PDF-layouten i BÅDA anropssiterna (send-receipt-email + preview-receipt), samma rader oavsett anropare', () => {
    const gemensam = {
      belopp: 2500,
      betalsatt: 'Swish' as const,
      betalning: 'avgift' as const,
      kundEpost: 'a@example.com',
    };
    const radA = kvittoRader({
      ...gemensam,
      kvittonummer: 'MM-2026-1001',
      kundnamn: 'A',
      eventNamn: null,
      datum: '2026-08-03T00:00:00.000Z',
      eventTyp: null,
      eventStart: null,
      eventSlut: null,
      bokforingstext: null,
    });
    const radB = kvittoRader({
      ...gemensam,
      kvittonummer: 'FÖRHANDSVISNING',
      kundnamn: 'A',
      eventNamn: null,
      datum: '2026-08-03T00:00:00.000Z',
      eventTyp: null,
      eventStart: null,
      eventSlut: null,
      bokforingstext: null,
    });
    // Samma belopp → identiska Netto/Moms/Betalt-rader oavsett vilken av de
    // två EF:erna (send-receipt-email/preview-receipt) som anropar — det ÄR
    // mirror-kontraktets kärna: SAMMA härledningsfunktion, ingen dubblering.
    expect(
      radA.filter((r) => r.startsWith('Netto:') || r.startsWith('Moms') || r.startsWith('Betalt:')),
    ).toEqual(
      radB.filter((r) => r.startsWith('Netto:') || r.startsWith('Moms') || r.startsWith('Betalt:')),
    );
  });
});

test.describe('formatKvittoDatum / formatBelopp — beteendegolv', () => {
  // [S108, Marcus-beslut 2026-08-22, "Kör dina rekommendationer"] ISO i
  // stället för svensk datumtext — kvittot är en bokföringshandling. Se
  // receipt-content.ts filhuvud och ADR-109 § Updates 2026-08-22.
  test('formatKvittoDatum: ISO-datum (YYYY-MM-DD), ogiltig input → rå sträng', () => {
    expect(formatKvittoDatum('2026-08-03T00:00:00.000Z')).toBe('2026-08-03');
    expect(formatKvittoDatum('inte-ett-datum')).toBe('inte-ett-datum');
  });

  test('formatKvittoDatum: UTC-datum, ALDRIG lokal tidszon — 23:30 UTC sista december blir INTE nästa dag/år', () => {
    expect(formatKvittoDatum('2026-12-31T23:30:00.000Z')).toBe('2026-12-31');
    // Motsatt kant: strax efter midnatt UTC nyårsdagen ska INTE glida
    // bakåt till föregående år.
    expect(formatKvittoDatum('2027-01-01T00:15:00.000Z')).toBe('2027-01-01');
  });

  test('formatKvittoDatum: enkelsiffriga månader/dagar nollpaddas (YYYY-MM-DD, alltid två siffror)', () => {
    expect(formatKvittoDatum('2026-01-05T12:00:00.000Z')).toBe('2026-01-05');
  });

  // [S108, Marcus-beslut 2026-08-22] Rogers format: sv-SE-tusentalsavgränsare
  // (ALLTID ett vanligt mellanslag, U+0020 — normaliserat oavsett vilket
  // grupperingstecken Intl.NumberFormat('sv-SE') råkar ge i körmiljön, se
  // `formatBelopp`s egen docstring), ALLTID två decimaler, INGEN `kr`-suffix.
  test('formatBelopp: sv-SE-gruppering + två decimaler, ingen kr-suffix', () => {
    expect(formatBelopp(2500)).toBe('2 500,00');
    expect(formatBelopp(0)).toBe('0,00');
    expect(formatBelopp(1234567)).toBe('1 234 567,00');
    expect(formatBelopp(133.5)).toBe('133,50');
    expect(formatBelopp(20.02)).toBe('20,02');
  });

  test('formatBelopp: grupperingstecknet är GARANTERAT ett vanligt mellanslag (U+0020) — aldrig NBSP/NNBSP (pdf-lib/WinAnsi kan inte koda U+202F, se formatBelopps docstring)', () => {
    const formaterat = formatBelopp(2500);
    expect(formaterat).not.toMatch(/[  ]/);
    expect(formaterat).toBe('2 500,00');
    // Byte-nivå-kontroll: separatorn ÄR U+0020, inte en synligt identisk
    // NBSP/NNBSP-varning som bara syns vid kodpunkts-inspektion.
    const separatorIndex = formaterat.indexOf(' ');
    expect(formaterat.codePointAt(separatorIndex)).toBe(0x20);
  });
});
