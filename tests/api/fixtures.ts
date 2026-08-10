// Delade staging-fixtur-konstanter för API-testerna (single-source, L120).
//
// Permanenta, namngivna staging-records (P-mönster, ingen PII) som flera
// *.staging.test.ts-filer delar. En enda hemvist så ett fixtur-ID aldrig kan
// dupliceras och driva isär mellan konsumenter (anti-mönstret: två kopior av
// samma 'rec…' som råkar uppdateras i bara den ena filen).
//
// Växer per Fas 6-sub-fas allteftersom fler tester konsumerar samma fixturer.

/**
 * `ZZ-History Person 01` — permanent historik-fixtur i staging-Personer.
 * 3 Deltaganden (RIM 1/2/3, distinkta datum) + 2 Anmälningar i olika orter.
 * Konsumeras av get-person.staging.test (skarp historik-/ort-conformance) och
 * update-record.staging.test (Anteckningar-write mot ett känt record).
 * STÄDA INTE bort den.
 */
export const HISTORY_PERSON_ID = 'recqxaFNwHAdQlAqb';

/**
 * `ZZ-belaggning-fixtur` — permanent beläggnings-fixtur i staging-Eventplanering
 * (task-18.2; seedad via MCP 2026-07-21, Ort 'ZZ-belaggning-fixtur' — medvetet
 * SKILD från ADR-060-purgens sentinel-markör). Bär K16-modellens samtliga
 * per-källa-fall mot kända värden:
 *   Max antal platser 10 · Extra platser 2 (reserverade) · Manuella platser 1
 *   4 länkade Anmälningar: 2 × Källa TOM (via formulär) · 1 × Källa '+1'
 *   (medföljande) · 1 × Källa 'Manuell' (bevisar exkludering ur båda räkningarna)
 *   2 Väntelista-rader via nya länkfältet 'Event (länk)': 1 aktiv + 1 med
 *   Flyttad till anmälan (bevisar aktiv-filtret i vantelista-räkningen)
 * Basens formel 'Antal anmälda' = 4 länkar + 1 manuella = 5 (summerings-beviset).
 * Konsumeras av get-event.staging.test (per-källa-conformance, AC #1).
 * Ingen EF kan skriva Källa TOM/'+1' eller vänteliste-länken → seedad fixtur är
 * enda deterministiska vägen (get-waitlist-fixturens precedent). STÄDA INTE.
 */
export const BELAGGNING_EVENT_ID = 'recIFrxHZw165ycXk';
export const BELAGGNING_EXPECTED = {
  maxPlatser: 10,
  reserverade: 2,
  manuelltTillagda: 1,
  viaFormular: 2,
  medfoljande: 1,
  vantelista: 1,
  antalAnmalda: 5,
} as const;

/**
 * `ZZ-arbetsko-fixtur` — permanent arbetskö-fixtur i staging-Eventplanering
 * (task-18.4; seedad via MCP 2026-07-22, Ort 'ZZ-arbetsko-fixtur' — medvetet
 * SKILD från ADR-060-purgens sentinel-markör, precis som beläggnings-fixturen).
 * EGET event (inte beläggnings-fixturens) så BELAGGNING_EXPECTED:s räkningar
 * står orörda. Bär deltagar-shape-utökningens SAMTLIGA fall mot kända värden:
 *
 *   | anmälan       | Källa   | Status                  | Inskickad (UTC)  | bekräftelse | eventinfo | medföljandeTill | antalGenomfordaEvent |
 *   |---------------|---------|-------------------------|------------------|-------------|-----------|-----------------|----------------------|
 *   | Bekraftad     | (tom)   | Bekräftad (mail skickat)| 2025-09-01 08:15 | 09-02 10:00 | 09-03 11:00 | –             | 1 (Person-batch)     |
 *   | Manuell       | Manuell | Obekräftad              | 2025-09-04 07:05 | –           | –         | –               | null (ingen Person)  |
 *   | Obekraftad    | (tom)   | Obekräftad              | 2025-09-05 09:30 | –           | –         | –               | null (ingen Person)  |
 *   | Medfoljande   | +1      | Obekräftad              | 2025-09-06 12:45 | –           | –         | Bekraftad       | null (ingen Person)  |
 *
 * `antalGenomfordaEvent` = 1 kommer ur PERSONEN `ZZ-Arbetsko Person 01`
 * (`rec7F8jYc7rczwwkM`, formeln `Antal genomförda event` flddy8JND3YnlgZxe)
 * som bär EN Deltagande-rad (Fjärrskådning, Närvarande) på detta event.
 * Number-vs-null-skillnaden är batch-läsningens skarpa bevis: bara en faktisk
 * Personer-läsning kan ge 1 på en rad och null på en annan.
 *
 * Ingen EF kan skriva Källa TOM/'+1', `Medföljande till` eller de två
 * skickad-tidsstämplarna → seedad fixtur är enda deterministiska vägen
 * (beläggnings-/väntelistefixturernas precedent). STÄDA INTE.
 *
 * BOR ÖVER (task-18.7): `Bekraftad`-raden bär `Bor över` = ikryssad, de tre
 * andra urkryssade — seedat via MCP 2026-07-22 i samma veva som det additiva
 * fältet föddes. Skillnaden true-vs-false på samma event är läs-mappningens
 * skarpa bevis (en `=== true`-normalisering som alltid gav false hade fällt
 * det) och 17.5:s härledda antal (1 av 4) har därmed ett känt facit.
 */
export const ARBETSKO_EVENT_ID = 'recZyRIzbqWSifAQO';

/**
 * `ZZ-Arbetsko Person 01` — samma permanenta person som bär
 * `ARBETSKO_EXPECTED.erfarenhetsbadge`/`kurshistorik*` ovan, nu ÄVEN
 * konsumerad direkt (inte bara via `ARBETSKO_EVENT_ID`s deltagande) av
 * `senaste-interaktion-grammatik.staging.test.ts` (ADR-108) som den ena av
 * två permanenta pin-fixturer för `Personer.Senaste interaktion (text)`.
 * Live-verifierat värde 2026-08-10: "Anmälde sig till Fjärrskådning i
 * ZZ-arbetsko-fixtur" (kurs+ort-kombinationen). STÄDA INTE.
 */
export const ARBETSKO_PERSON_ID = 'rec7F8jYc7rczwwkM';

export const ARBETSKO_EXPECTED = {
  /** Anmälan med BÅDA skickad-tidsstämplarna + Person-länk (Källa tom). */
  bekraftadId: 'rec2OjLD2qiKzZCA0',
  /** Anmälan med Källa 'Manuell' — alla nya tidsstämpel-/länkfält null. */
  manuellId: 'recn7huvtrMiJgXxv',
  /** Anmälan utan någonting satt — null-vägens bevis (Källa tom). */
  obekraftadId: 'recwH8y4FTZZi1wYg',
  /** Anmälan med Källa '+1' + `Medföljande till` → bekraftadId. */
  medfoljandeId: 'recFf7eNoFfNJhfvh',
  bekraftelseSkickad: '2025-09-02T10:00:00.000Z',
  deltagarinfoSkickad: '2025-09-03T11:00:00.000Z',
  antalGenomfordaEvent: 1,
  antalAnmalningar: 4,
  /** Antal ikryssade `Bor över` på eventet (endast bekraftadId) — 17.5:s facit. */
  borOverAntal: 1,
  /**
   * Gruppdynamik-shapen (task-18.10). `ZZ-Arbetsko Person 01` (bekraftadId:s
   * person) bär den kanoniska `Erfarenhetsbadge` 'Fjärrskådare' (formeln ur
   * EN Fjärrskådning-Deltagande) och EN kurshistorik-post. De tre andra
   * anmälningarna saknar Person-länk → badge + kurshistorik null (samma
   * null-väg som antalGenomfordaEvent). Live-verifierat mot staging 2026-07-23
   * (person rec7F8jYc7rczwwkM · Deltagande recQWjimysYJrkY0n).
   */
  erfarenhetsbadge: 'Fjärrskådare',
  kurshistorikKursnamn: 'Fjärrskådning',
  kurshistorikDatum: '2025-10-20',
  kurshistorikSession: 'Dag 1',
} as const;

/**
 * Permanent ANTECKNING-fixtur i staging-Anteckningar (TASK-61; seedad via MCP
 * 2026-07-28, Författare `ZZ-anteckning-fixtur`). Kontraktsvaktens ankare för
 * `get-event-notes` — den enda av vaktens tre endpoints som saknade en permanent
 * fixtur att mäta mot. STÄDA INTE.
 *
 * BOR PÅ ARBETSKÖ-EVENTET, INTE PÅ BELÄGGNINGS-EVENTET — och det är hela poängen.
 * `create-event-note`- och `get-event-notes`-sviterna skriver sina sentinel-
 * anteckningar (`ZZ-note-test+<uuid>@sentinel`) mot BELAGGNING_EVENT_ID, och
 * ADR-060-purgen är DESIGNAD att radera dem. Ett vakt-anrop mot det eventet mäter
 * alltså mot data som purge tömmer: cykeln blev purge tömmer → vakten läser tomt →
 * sviten fyller på igen, och utfallet avgjordes av vilken av dem som hann först
 * (nightly 30328246805 föll på `[TOMT-UNDERLAG]` åtta sekunder efter purge; dispatch
 * 30309427472 var grön av två sekunders marginal FÖRE den). Arbetskö-eventet får
 * aldrig sentinel-anteckningar — vaktens svar är därför exakt denna fixtur, lika
 * före som under som efter purge. Körordningen slutar spela roll.
 *
 * PURGE-IMMUNITETEN ÄR KONSTRUKTION, INTE TUR — och prövad mot policyn på disk,
 * inte mot minnet av den. Två oberoende spärrar i `create-event-note-sentineler`:
 *   1. Server-side-urvalet kräver att markören står FÖRST
 *      (`FIND('ZZ-note-test+', {Anteckning}) = 1`). Fixturtexten inleds med
 *      "PERMANENT test-fixtur (TASK-61)" och bär markören inte alls → FIND ger 0 →
 *      raden listas aldrig ens som kandidat.
 *   2. Exakt-matchen (`^ZZ-note-test\+<uuid>@sentinel$`) körs sedan per rad i kod.
 *      Fixturen faller ut som `skippedMismatch` även med åldern satt till år 2020,
 *      alltså utan hjälp av ålders-guarden.
 * Samma medvetna avstånd till purge-markören som ZZ-belaggning-/ZZ-arbetsko-
 * fixturerna håller i Ort-fältet.
 *
 * Konsumeras av kontraktsvakten (`tests/kontraktsvakt/kontraktsfall.ts`), som
 * anropar `get-event-notes?eventId=${ARBETSKO_EVENT_ID}`. Record-ID:t nedan är
 * registrets spår av VILKEN rad som är permanent — vakten adresserar eventet, inte
 * anteckningen, så att en framtida andra fixtur-rad på samma event bara gör
 * underlaget bredare.
 */
export const ANTECKNING_FIXTUR_NOTE_ID = 'recLcii847ZK7K6OY';
