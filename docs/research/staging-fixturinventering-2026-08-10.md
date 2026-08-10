---
owner: marcus803
updated: 2026-08-10
review_by: 2027-02-10
status: draft
---

# Staging-basens fixturinventering: vad som är bundet, vad som är fritt, och hur seed-datan kan bli realistisk

> **Proveniens:** avgränsat inventeringspass 2026-08-10, kört read-only mot
> staging (`apphjj8Q7lkXCMsL4`) och prod (`app8uGPrVCVOm6LfD`) via
> Airtable-MCP, plus källkodsläsning i
> `.claude/worktrees/s103-t97-personvyerna` (gren `docs/s102-147-skivorna`,
> HEAD `c29b94a0`). **Ingenting skrevs, raderades eller ändrades i någon bas.**
> Passet tillför ingen mekanism och rör ingen kod: det är en mätning plus ett
> beslutsunderlag.
>
> **MÄTT vs SLUTET:** varje påstående nedan är märkt. `MÄTT` = live-avläst ur
> basen eller läst ur en namngiven fil på rad. `SLUTET` = härlett ur två eller
> flera mätta fakta, med härledningen utskriven.

## Frågan

Marcus vill se personlistan med data som liknar verkligheten, för att kunna
designa mot den. I dag är staging full av `ZZ-`-prefixade fixturer med
adresser som `seed-review+zz-granskning-s103-01@granskning.test`. Hans ord:
*"jag vill helst rensa hela skiten och sedan seeda på nytt så jag ser riktiga
namn, riktiga e-postadresser, riktiga orter ... det ska vara fiktiva namn och
adresser, men det ska likna verkligheten, inte massa ZZ-skit överallt."*

Frågan inventeringen ska svara på: **vad finns i staging-basen, vad av det är
BUNDET till något (tester, CI, skript, permanenta fixturer), och vad kan tas
bort utan att något går sönder?**

## Sammanfattat svar

**Rensa allt kostar mer än det ser ut, men den ugliness Marcus faktiskt ser
kostar nästan ingenting att ta bort.** De två sakerna sammanfaller inte.

1. **9 av 41 personer i staging är hårt bundna vid sina NAMN.** Fem
   `ZZ-Conformance Person 01..05` asserteras ord för ord och i exakt ordning
   av cursor-conformance-sviten; `ZZ-History Person 01` asserteras vid namn av
   tre sviter plus nattens kontraktsvakt; `ZZ-Arbetsko Person 01` bär tre
   rollup-facit; två `ZZ-Lead`-personer asserteras vid e-postadress. Namnen kan
   inte bytas mot realistiska utan att röra assertions. (MÄTT, se § Vad som är
   BUNDET.)
2. **Men de 32 personer Marcus ser mest av har redan realistiska NAMN**
   (Astrid Almqvist, Bengt Lindqvist ...) och är helt obundna. Fulheten sitter
   i deras **e-postadress**, i deras **tomma Telefon**, och i deras **tomma
   Ort**. Ingen av de tre är bunden av något test. (MÄTT.)
3. **Telefon och Ort är gratis realism.** `Personer.Telefon`
   (`fldmMYIUhIc1HMnZi`, `multilineText`) skrivs aldrig av något skript i dag,
   och `Personer.Ort` (`fldBd946g2waLT7NG`) är en **rollup över
   `Anmälningar.Ort`** (`fldP1LSzbyOJxrOGP`, `singleLineText`) som seed-skriptet
   aldrig fyller i. Fyll dem och varje personkort får samma fältuppsättning,
   utan att en enda assertion rörs. (MÄTT via schema-läsning.)
4. **E-postdomänen är den enda bäraren som faktiskt kostar något att byta** -
   den är det ENDA handtaget `--clean` har på seedade personer och anmälningar.
   Men den kan bytas mot något som är både realistiskt och maskin-exakt:
   `@example.com` / `.org` / `.net` är RFC 2606-reserverade och kan därför
   aldrig tillhöra en verklig kund. Det ger realism utan att tappa greppet.
5. **Sändningsrisken vid realistiska adresser är NOLL i staging.** Icke-prod
   släpper igenom EXAKT fyra adresser (`delivered@resend.dev` och tre
   syskon-adresser) och vägrar allt annat med 422 `non_prod_address_refused`
   (`supabase/functions/_shared/send-bulk.ts:19-24` + `:129-137`). Spärren är
   adress-allowlist, inte domän-heuristik: en adress som ser verklig ut blir
   inte farligare. (MÄTT.)

## Vad som finns (per tabell, med räkning)

Alla räkningar MÄTTA 2026-08-10 mot `apphjj8Q7lkXCMsL4` via
`list_records` med `maxRecords` väl över utfallet. Två av dem
korsverifierade med komplementfilter (se noterna).

### Personer (`tbl6ZyCm3V026iFTU`) - 41 rader

| Klass | Antal | E-post | Telefon | Ort (rollup) |
|---|---|---|---|---|
| `seed-review+zz-granskning-fixtur-NN@granskning.test` | 16 | ja | tom | `[null]` |
| `seed-review+zz-granskning-s103-NN@granskning.test` | 16 | ja | tom | `[null]` |
| `ZZ-Conformance Person 01..05` | 5 | **tom** | tom | `[]` |
| `ZZ-Lead Person 01/02` | 2 | ja (`@staging.test`) | tom | `[]` |
| `ZZ-Arbetsko Person 01` | 1 | ja (`@staging.test`) | tom | `[null]` |
| `ZZ-History Person 01` | 1 | **tom** | tom | `["ZZ-Skövde","ZZ-Göteborg"]` |

Korsverifiering: `NOT(FIND('seed-review+', {E-post} & '') = 1)` gav exakt de
9 icke-seed-personerna, vilket bekräftar 32 + 9 = 41.

**Noll av 41 personer har Telefon ifylld.** (MÄTT: fältet saknas i samtliga
svar.) `[null]` i Ort betyder att personen HAR länkade anmälningar men att
anmälningarnas egna `Ort` är tomt; `[]` betyder inga länkade anmälningar alls.

### Anmälningar (`tbloOcrppVoyrHbrq`) - 65 rader

| Klass | Antal | Anmärkning |
|---|---|---|
| `seed-review+...@granskning.test` (två fixturer) | 32 | Mobilnummer ifyllt, `Ort` tomt |
| `create-test+<uuid>@staging.test` | 20 | purge-ägda sentineler (4 namnvarianter) |
| `ZZ-Belaggning ...` | 4 | beläggnings-fixturens per-källa-uppdelning |
| `ZZ-Arbetsko ...` | 4 | arbetskö-fixturens fyra fall |
| `ZZ-History Person 01` | 2 | bär `Ort` = `ZZ-Skövde` / `ZZ-Göteborg` |
| `ZZ-6c-regfix 02/03` | 2 | ingen Person-länk, event `reci2UQEPBMl3ebNl` |
| `Staging Test` | 1 | ingen Person-länk, samma event |

Korsverifiering: komplementfiltret (varken `seed-review+` eller
`create-test+`) gav exakt 13 rader, vilket bekräftar 32 + 20 + 13 = 65.

### Eventplanering (`tblVE3UKWl1CKrphV`) - 52 rader

| Klass | Antal | Anmärkning |
|---|---|---|
| `Ort = ZZ-create-event-test` | 43 | purge-ägda; nästan alla `Startdatum 2026-09-15` |
| `Ort = ZZ-create-event-test-uppdaterad` | 2 | **purge-läcka**, se nedan |
| `Ort = ZZ-History Ort` | 3 | Event-57/58/59, RIM 1/2/3 |
| `ZZ-belaggning-fixtur` (Event-681) | 1 | permanent |
| `ZZ-arbetsko-fixtur` (Event-845) | 1 | permanent |
| `ZZ-GRANSKNING-FIXTUR` (Event-3905) | 1 | seed-review, `[UTGÅR: 2026-08-16]` |
| `ZZ-GRANSKNING-S103` (Event-5717) | 1 | seed-review, `[UTGÅR: 2026-08-24]` |

**Purge-läckan (MÄTT, ny observation):** `update-event.staging.test.ts:46`
döper om sin sentinel-rad till `ZZ-create-event-test-uppdaterad`, men
purge-targeten `create-event-sentineler` grovsorterar på
`{Ort} = 'ZZ-create-event-test'` och exakt-matchar
`^ZZ-create-event-test$` (`.purge-staging-policy.json:16-24`). De omdöpta
raderna listas alltså aldrig ens som kandidater och ackumulerar. Två rader i
dag; klassen växer långsamt. Detta är en fyndrapport, inte en åtgärd i detta
pass.

### Deltaganden (`tbldWHH6sSHWoQPHH`) - 4 rader

| Record | Event ort | Session | Status |
|---|---|---|---|
| `recQWjimysYJrkY0n` | `ZZ-arbetsko-fixtur` | Dag 1 | Närvarande |
| `recVFG03E9dihNFiA` | `ZZ-History Ort` | Dag 1 | Närvarande |
| `recbfLxgzWw7FpO6W` | `ZZ-History Ort` | Dag 1 | Närvarande |
| `reclwCtXanlSqRR0c` | `ZZ-History Ort` | Dag 1 | Närvarande |

Samtliga fyra är bundna (se nästa avsnitt). Ingen seed-review-person har ett
enda Deltagande.

### Touchpoints (`tbl22SCvlHrgcAiZi`) - 0 rader

Tabellen är tom. (MÄTT.) Ingenting att inventera, ingenting att skydda, och
ingen mekanism i repot skriver till den i dag.

### Övriga tabeller som berörs av en rensning

| Tabell | Rader | Klass |
|---|---|---|
| Anteckningar (`tbl87a23xDv19Mb6R`) | 21 | 20 `ZZ-note-test+<uuid>@sentinel` (purge-ägda) + 1 permanent (`recLcii847ZK7K6OY`) |
| Väntelista (`tbl2VxMx7JMkIxD4Q`) | 5 | 2 `ZZ-Belaggning`-rader + 3 `waitlist-*@staging.test` |
| Segment (`tbll2N6JKCj4u6y9o`) | 5 | samtliga `app-segment-test+<uuid>` (purge-ägda) |
| Engagemang (`tbl9H2SoGFfysBj5y`) | 2 | en per `ZZ-Lead`-person |
| Eventformat (`tbl8qhuJQ5ZWPMRk4`) | 3 | inklusive `ZZ-create-event-test-format` (`recclDd7hUQsfxoVs`) |
| Utskickslogg (`tblIesjbuSWNp6oxK`) | 0 | tom |

## Vad som är BUNDET och av vad

Detta är inventeringens tyngsta avsnitt: här avgörs vad "rensa allt" faktiskt
kostar. Varje post har sin konsument på fil och rad.

### Skyddsräcket i koden: `CONFIG.protectedRecordIds`

`scripts/seed-review-fixture.mjs:175-180` bär fyra record-ID:n som skriptets
raderingsvägar aldrig får röra, inte ens vid markör-träff
(`planClean`, rad 1068/1076/1085; `planSweep`, rad 791):

| Record-ID | Vad det är | Varför det står där |
|---|---|---|
| `rec7F8jYc7rczwwkM` | `ZZ-Arbetsko Person 01` | rollup-facit (TASK-31) |
| `recqxaFNwHAdQlAqb` | `ZZ-History Person 01` | rollup-/historik-facit (TASK-31) |
| `recIFrxHZw165ycXk` | `ZZ-belaggning-fixtur` (Event-681) | `BELAGGNING_EXPECTED` (task-18.2) |
| `recZyRIzbqWSifAQO` | `ZZ-arbetsko-fixtur` (Event-845) | `ARBETSKO_EXPECTED` (task-18.4) |

Ordningen är bärande enligt kommentaren på rad 171-173: personerna först
(testsviten adresserar index 0), eventen efter. Formen valideras av
`validateConfig` rad 470-477 och asserteras av
`scripts/test-seed-review-fixture.mjs:165-211`.

### Personer som inte får raderas (9 av 41)

| Person | Record-ID | Bundet av | Vad som asserteras |
|---|---|---|---|
| `ZZ-Conformance Person 01` | `recUvh5WonUaE9FN0` | `tests/api/get-persons.staging.test.ts:32-42` | Exakt namnsträng, exakt Namn-asc-ordning, exakt 5 träffar på söksträngen `ZZ-Conformance Person`, sidsekvens `[2,2,1]` |
| `... Person 02` | `reciDDkiza1geqG05` | samma | samma |
| `... Person 03` | `recYtWHL9z7KPCUKd` | samma | samma |
| `... Person 04` | `recFWtbfbbMMVEadb` | samma | samma |
| `... Person 05` | `recaz7wT10AH6fBlI` | samma | samma |
| `ZZ-History Person 01` | `recqxaFNwHAdQlAqb` | `get-person.staging.test.ts:56,58,74,114`; `get-persons.staging.test.ts` via `get-person.staging.test.ts:136`; `get-attendance.staging.test.ts:31,82`; `update-record.staging.test.ts:208,225`; `kontraktsvakt/kontraktsfall.ts:275` | Namnet ord för ord, `antalGenomfordaEvent = 3`, historik = 3 poster i datum-desc, `ort = ["ZZ-Skövde","ZZ-Göteborg"]`, samt nattens kontraktsvakt-ankare |
| `ZZ-Arbetsko Person 01` | `rec7F8jYc7rczwwkM` | `tests/api/fixtures.ts:59-63,92-102` konsumerat av `get-registrations.staging.test.ts:294,406,432` och `get-registration.staging.test.ts:53-57` | `antalGenomfordaEvent = 1`, `erfarenhetsbadge = 'Fjärrskådare'`, kurshistorik (`Fjärrskådning`, `2025-10-20`, `Dag 1`) |
| `ZZ-Lead Person 01` | `recSsbzqUxxvjKavd` | `get-leads.staging.test.ts:36,78,104,150` | E-postadressen `zz-lead-person-01@staging.test` som värde; `antalHamtningar >= 1`; `antalAnmalningar = 0` |
| `ZZ-Lead Person 02` | `recbXfJuC8kjHr0Cd` | `get-leads.staging.test.ts:37,79,151` | E-postadressen som värde |

**Viktig nyans (MÄTT, och den avgör om Marcus önskan går att uppfylla):** för
`ZZ-Conformance`-personerna asserteras ENBART `namn` (harnessen reducerar
sidan till `body.persons.map(p => p.namn)`, `get-persons.staging.test.ts:66`).
Deras `E-post`, `Telefon` och `Ort` är alltså **fria att fylla i**.
`ZZ-History Person 01`s tomma e-post är kommenterad i
`compute-segment.staging.test.ts:58-60`, men assertionen på rad 64-67 lyder
`m.email === null || (typeof m.email === 'string' && m.email.length > 0)` -
den tolererar BÅDA. Att fylla i e-post på den permanenta historik-fixturen
fäller alltså ingenting.

### Event som inte får raderas (7)

| Event | Record-ID | Bundet av |
|---|---|---|
| `ZZ-belaggning-fixtur` | `recIFrxHZw165ycXk` | `BELAGGNING_EXPECTED` (7 exakta tal, `fixtures.ts:35-43`) via `get-event.staging.test.ts:128-157`; attach-mål för `create-event-note`/`get-event-notes` |
| `ZZ-arbetsko-fixtur` | `recZyRIzbqWSifAQO` | `ARBETSKO_EXPECTED` (`fixtures.ts:76-103`) via fem sviter; `get-registration.staging.test.ts:70` asserterar `reg.eventOrt === 'ZZ-arbetsko-fixtur'`; kontraktsvaktens `get-event-notes`-ankare (`kontraktsfall.ts:145`) |
| RIM 1 (Event-57) | `reci2UQEPBMl3ebNl` | `get-person.staging.test.ts:24-28` (kursnamn + datum `2026-01-15`) |
| RIM 2 (Event-58) | `recxe1oTDwA4qbVk7` | samma (`2026-02-15`) |
| RIM 3 (Event-59) | `recfnotr1i2nQLBJd` | samma (`2026-03-15`); dessutom `get-attendance.staging.test.ts:55,70-74` som härleder sitt event ur `Ort = 'ZZ-History Ort'` |
| Eventformat `ZZ-create-event-test-format` | `recclDd7hUQsfxoVs` | `seed-review-fixture.mjs:147` (`eventformatRecordId`, KRÄVS vid create per ADR-066 b5); `get-event-formats.staging.test.ts:6`; `create-event.staging.test.ts:26,75-79`; `src/lib/eventformat-etikett.ts:13` |

**Lucka värd att notera (SLUTET):** de tre `ZZ-History Ort`-eventen är
BUNDNA men står INTE i `protectedRecordIds`. De skyddas i dag av konstruktion
(clean listar bara event vars `Ort` är exakt den angivna, och kräver dessutom
notering-sentineln, `planClean` rad 1067-1074) - inte av register. Skyddet
håller så länge ingen kör `--ort "ZZ-History Ort"`, vilket inget i dag gör.
Att lägga till dem i registret vore en billig härdning.

### Anmälningar som inte får raderas (10 av 65)

- 4 × `ZZ-Arbetsko`-rader adresserade vid record-ID i `fixtures.ts:78-84`
  (`rec2OjLD2qiKzZCA0`, `recn7huvtrMiJgXxv`, `recwH8y4FTZZi1wYg`,
  `recFf7eNoFfNJhfvh`) och asserterade en och en i
  `get-registrations.staging.test.ts:240-243,260-272,293-297,335-342`.
- 4 × `ZZ-Belaggning`-rader (`rec1cHg8067IDEQnV`, `recGwQILs8HLX6JZm`,
  `recjftVh8xdXmy0k2`, `recteMBGDQCXGdZdq`). Adresseras inte vid ID men bär
  `BELAGGNING_EXPECTED.antalAnmalda = 5` och per-källa-uppdelningen.
- 2 × `ZZ-History Person 01`-rader (`rec0wC9rEGKUIHC2W` med `Ort = ZZ-Skövde`,
  `recO8TSK2A0b0a5YF` med `Ort = ZZ-Göteborg`). MÄTT: båda är Person-länkade
  till `recqxaFNwHAdQlAqb` och saknar Event-länk. De ÄR källan till
  `EXPECTED_ORTER` i `get-person.staging.test.ts:114`.

### Deltaganden: alla 4 är bundna

- `recQWjimysYJrkY0n` (arbetskö-eventet) ger `antalGenomfordaEvent = 1`,
  `erfarenhetsbadge = 'Fjärrskådare'` och kurshistorik-posten.
- De tre `ZZ-History Ort`-raderna ger `person.historik` med längd 3 och
  `narvaro = true` genomgående (`get-person.staging.test.ts:74-80`), samt
  `compute-segment` HIT-fallet (`compute-segment.staging.test.ts:47-51`,
  `include[(Resor i medvetandet 1, Utbildning)]` måste ge `count >= 1`).

### En NEGATIV bindning som är lätt att missa

`compute-segment.staging.test.ts:72-84` kräver att
`include[(Psionautics, Utbildning)]` ger **count 0 och `members === []`**. En
framtida seed som skapar ett Deltagande med kursnamn `Psionautics`, modalitet
`Utbildning` och `Närvaropoäng = 1` fäller det testet. Detta är den enda
bindningen i inventeringen som handlar om vad som INTE får finnas.

### Väntelista, Anteckningar, Engagemang

- `waitlist-active-a@staging.test`, `waitlist-active-b@staging.test`,
  `waitlist-flyttad@staging.test` asserteras vid adress och sorteringsordning
  i `get-waitlist.staging.test.ts:34-36`.
- De två `ZZ-Belaggning`-väntelisteraderna bär
  `BELAGGNING_EXPECTED.vantelista = 1` (aktiv) plus flyttad-fallet.
- `recLcii847ZK7K6OY` (Anteckningar) är kontraktsvaktens permanenta ankare,
  `fixtures.ts:105-140`. Purge-immuniteten är konstruerad, inte tur: texten
  inleds inte med sentinel-markören, så `FIND(...) = 1` ger 0.
- De två Engagemang-raderna (`recNyCx849FT7ZlL2`, `recI0E39TF2fB2VJ0`) är det
  ENDA som gör `ZZ-Lead`-personerna till leads (`COUNTA(Engagemang) > 0`).

### Vad som INTE binder mot staging

Kartlagt för att undvika onödig försiktighet: **hela `tests/acceptance/`,
`tests/visual/`, `tests/a11y/` och nästan hela `tests/e2e/` är hermetiska.**
De läser `tests/support/fixturvarld/fixture-data.ts` (frusen fixturvärld,
`FROZEN_NOW = 2026-09-15`, egna `recVisual*`-ID:n) eller mockar EF-svaren med
`page.route`. MÄTT: 12 av 17 filer i `tests/e2e/` innehåller `route(`; av de
fem övriga är fyra auth-/shell-/PWA-tester utan datakrav och den femte,
`skapa-event.staging.test.ts`, SKAPAR sin egen sentinel-rad i stället för att
läsa befintlig data.

**Följd (SLUTET):** en rensning av staging-persondata kan inte fälla vare sig
den visuella regressionen eller acceptance-klassen. Endast
`tests/api/*.staging.test.ts` och `tests/kontraktsvakt/` är exponerade.

## Vad som är fritt att radera

Med "fritt" menas: ingen assertion, ingen policy och inget skript i repot
refererar raden, varken vid ID, namn, adress eller räkning. Belagt genom
grep över `tests/`, `src/`, `scripts/`, `supabase/` och
`.purge-staging-policy.json`.

| Vad | Antal | Ägare av städningen i dag |
|---|---|---|
| `seed-review+...@granskning.test`-personer | 32 | `npm run seed:review:clean` + förfallo-svepet |
| `seed-review+...`-anmälningar | 32 | samma |
| `ZZ-GRANSKNING-FIXTUR` + `ZZ-GRANSKNING-S103` (event) | 2 | samma |
| `create-test+<uuid>@staging.test`-anmälningar | 20 | setup-purgen (60 min ålders-guard) |
| `ZZ-note-test+<uuid>@sentinel`-anteckningar | 20 | setup-purgen |
| `app-segment-test+<uuid>`-segment | 5 | setup-purgen |
| `Ort = ZZ-create-event-test`-event | 43 | setup-purgen |
| `Ort = ZZ-create-event-test-uppdaterad`-event | 2 | **ingen** (purge-läckan ovan) |
| `ZZ-6c-regfix 02/03` + `Staging Test`-anmälningar | 3 | **ingen** (föräldralösa) |

De tre sista raderna i tabellen är föräldralösa: MÄTT saknar de Person-länk
och har bara en Event-länk till `reci2UQEPBMl3ebNl`. Att radera dem ändrar
ingen rollup som asserteras (Deltaganden är oberoende av dem).

**Summa fritt: 159 av 198 rader.** (SLUTET, adderat ur räkningarna ovan:
Personer 41 + Anmälningar 65 + Eventplanering 52 + Deltaganden 4 +
Touchpoints 0 + Anteckningar 21 + Väntelista 5 + Segment 5 + Engagemang 2 +
Eventformat 3 = 198. Av dem är 37 fixtur-bundna enligt föregående avsnitt och
2 är basens genuina eventformat-rader `Utbildning - 2 dagar` och
`Föreläsning`, som varken är fixturer eller fria. 198 - 39 = 159.)

## Bärar-analysen för identifierbarhet

Sex möjliga bärare av "detta är en fixtur, inte en riktig kund". Kolumnen
*Realismkostnad* är vad Marcus ser i personlistan och på personkortet
(`PersonsList.tsx:27` visar namn + e-post + telefon; `PersonDetail.tsx:177-180`
visar e-post, telefon och ort).

| Bärare | Vem läser den i dag | Realismkostnad | Kan bytas mot realistiskt värde? |
|---|---|---|---|
| **Namnprefix `ZZ-`** | Fem assertions på exakt namnsträng (Conformance ×5, History ×1) samt en negativ (`get-leads.staging.test.ts:91`). Purge och seed-clean läser den ALDRIG. | **Högst.** Namnet är det första ögat läser. | **För de 32 seedade: ja, redan gjort** - deras namn är redan realistiska och bär ingen funktion. **För de 9 permanenta: nej** utan att röra assertions. |
| **E-postdomän** | `fixtureEmailFormula` (rad 690) + `fixtureEmailPattern` (rad 685). Det ENDA handtaget `stadaOrt` (rad 1403-1416) har på personer och anmälningar. Purgen läser en ANNAN domän (`@staging.test`). | **Hög.** Adressen står under namnet i listan. | **Ja, med villkor.** Se förslaget: en RFC 2606-reserverad domän är samtidigt realistisk och bevisbart aldrig en kund. |
| **Ort-namn** | `stadaOrt` grovsorterar event med `{Ort} = '<ort>'` (rad 1399), sedan avgör notering-sentineln (`isFixtureEvent`, rad 1032-1037). Purgen matchar exakt `^ZZ-create-event-test$`, en annan sträng. | **Medel.** Syns på eventet och (via rollup) potentiellt på personkortet. | **Ja.** Ort är ett grovfilter, inte beslutaren. Men se varningen nedan. |
| **`Notering`-sentinel** | Svepets enda ingång (`sweepEventFormula`, rad 698), `parseUtgangsdatum` (rad 755), `planSweep` (rad 788), och halva `isFixtureEvent`. | **Nära noll för personer.** Bor på eventet, inte på personen. | **Behöver inte bytas.** Den är redan den billigaste bäraren och gör redan det tyngsta jobbet. |
| **Dedikerat fält** | Finns inte. | Noll om staging-only. | **Avrådes.** Ett staging-only fält är exakt den staging/prod-schemadrift `airtable-constraints.md` P25 § O2 varnar för, och basen saknar schema-as-code att stämma av mot. |
| **Record-ID-register i kod** | Redan i bruk två gånger: `protectedRecordIds` (rad 175) och `CONFIG.legacy` (rad 295) med `stadad`-avslutning. | **Noll.** Record-ID:n syns aldrig i vyn. | **Ja, men bara för statiska mängder.** Ett register kan inte bära rader som skapas färskt vid varje seed-körning utan att någon skriver tillbaka till filen. |

### Varningen om realistiska ortnamn

`CONFIG.legacy`-postens `Skovde-S75` (rad 315-335) dokumenterar precis den
fälla ett realistiskt ortnamn öppnar: `Skövde` är ett riktigt ortsnamn, och
utan record-ID-ankaret hade ort-filtret kunnat träffa en framtida verklig
Skövde-rad. Kommentaren på rad 258-260 säger det rakt ut.

**Men fällan är redan stängd för seed-vägen (SLUTET):** `isFixtureEvent`
kräver BÅDE rätt Ort OCH notering-sentineln, och `planClean` skickar allt
utan sentinel till `skippedEvents` i stället för att radera det (rad
1072-1073). Ett verkligt Skövde-event skulle alltså listas som kandidat och
sedan lämnas kvar med orsaken `saknar fixtur-sentinel i Notering`. Det är
korrekt fail-safe-riktning. Restrisken är därmed låg **så länge Ort förblir
grovfilter och sentineln förblir beslutare**.

### Vad forskningen säger om domänvalet

- **RFC 2606 § 3** reserverar `example.com`, `example.net` och `example.org`
  permanent för dokumentation och exempel. De är registrerade av IANA och kan
  aldrig tilldelas någon annan. En adress på dem ser ut som en vanlig
  e-postadress för ett mänskligt öga, samtidigt som den bevisbart aldrig kan
  tillhöra en verklig Miranon Media-deltagare.
- **RFC 2606 § 2** reserverar TLD `.test` för testning. `@granskning.test` och
  `@staging.test` är alltså korrekt valda i dag - de är bara fula.
- **RFC 5233** definierar subadressering (`lokal+tagg@domän`). En `+`-tagg är
  en etablerad väg att bära en markör, men den syns i listan och är precis den
  form Marcus pekade ut som skräp.
- **Repots eget precedent:** `Skovde-S75`-fixturen använde redan
  `granskning-<slug>@example.com` (`seed-review-fixture.mjs:321`), och
  `kontraktsfall.ts:250` refererar den som `granskning-review*@example.com`.
  `example.com` är alltså inte en ny idé i det här repot, bara en oanvänd.

### Den avgörande observationen om sändningsrisk

Icke-prod-spärren är **adress-allowlist, inte domän-heuristik**:

```text
supabase/functions/_shared/send-bulk.ts:19-24
  RESEND_TEST_ADDRESSES = [delivered@resend.dev, bounced@resend.dev,
                           complained@resend.dev, suppressed@resend.dev]
supabase/functions/_shared/send-bulk.ts:132
  if (!RESEND_TEST_ADDRESSES.includes(spec.email)) offending.add(spec.email);
```

Allt annat kastar `NonProdAddressError` och EF:en svarar 422
`non_prod_address_refused` (`send-email/index.ts:242`,
`send-registration-confirmation/index.ts:240`). **Följd (SLUTET): en
realistiskt utseende adress i staging är exakt lika ofarlig som
`@granskning.test`.** Realismen kostar noll i sändningsrisk. Det som skyddar
är spärren, inte adressens utseende.

## Konkret förslag på ny seed-form

Förslaget är utformat så att **inte en enda assertion behöver röras** och
**inget skyddsräcke tas bort**. Det består av fyra byten och en tillägg.

### 1. E-postadressen blir realistisk, domänen blir bäraren

Från `seed-review+zz-granskning-s103-01@granskning.test`
till `astrid.almqvist@example.com`.

Markören flyttar från local-part till domän. Nytt exakt mönster:

```text
^[a-zaåäö]+\.[a-zaåäö]+(\d{2})?@example\.(com|org|net)$
```

Rotera mellan de tre reserverade domänerna så listan inte ser maskinstansad
ut. Siffersuffixet används bara vid namnkollision inom samma seed-körning.

**Vad det kostar och vad det kräver:**

- `fixtureEmailFormula` kan inte längre grovsortera på ett per-ort-prefix.
  Ersätt med `FIND('@example.', {E-post}) > 0` som grovfilter och behåll den
  ankrade regexen som finfilter i kod. Formen (grovt server-side, exakt i
  kod) är oförändrad, bara mönstret byts.
- Purge-kollisionsvakten (`purgeCollisions`, rad 711-722) fortsätter fungera
  oförändrad: `@example.com` matchar inte
  `^create-test\+<uuid>@staging\.test$`, och vakten läser policyn från disk i
  stället för att duplicera den.
- **En ny egenskap måste bevakas:** mönstret är inte längre ort-specifikt.
  Två samtidiga granskningsfixturer (exakt läget i dag: `ZZ-GRANSKNING-FIXTUR`
  och `ZZ-GRANSKNING-S103` finns båda) skulle städas av varandras `--clean`.
  **Lösningen är att sluta använda e-posten som ort-diskriminator alls** - se
  punkt 2.

### 2. Clean slutar leta efter personer via e-post, och går via länken i stället

Detta är förslagets tyngsta del och den som gör resten möjlig.

I dag hittar `stadaOrt` (rad 1403-1416) anmälningar och personer genom att
söka på e-postmönstret. Men fixturen har ett bättre ankare som redan finns:
**eventet**. Sekvensen blir:

1. Hitta eventet: `{Ort} = '<ort>'` plus notering-sentineln. Oförändrat.
2. Hämta eventets anmälningar via Event-länken.
3. Läs ut varje anmälans `Person`-länk **innan** anmälan raderas.
4. Radera anmälningar, sedan de utlästa personerna, sedan eventet.
   Raderingsordningen är redan den (rad 1438-1466).

E-postmönstret behålls som **finfilter och andra spärr** i steg 3-4: en
person vars adress inte matchar det ankrade `@example.`-mönstret raderas
aldrig, oavsett vad länken säger. Länk-guarden (`personLinkGuardTrips`, rad
1050-1055) står orörd ovanpå.

**Vinsten:** ort-diskrimineringen flyttar till länkgrafen, där den hör hemma.
Två parallella fixturer kan inte längre städa varandra. Och e-posten behöver
inte längre koda orten, vilket är precis vad som gör den realistisk.

### 3. Ortnamnet blir en riktig svensk stad, sentineln förblir beslutare

Från `--ort ZZ-GRANSKNING-S103` till `--ort Skövde` (eller Varberg, Umeå,
Göteborg). `ORT_PATTERN` (rad 410) accepterar redan svenska tecken och
släpper igenom dem oförändrat.

Skyddet mot att träffa ett verkligt event ligger kvar där det redan ligger:
notering-sentineln avgör, ort grovsorterar. Verifierat mot koden i
`planClean` rad 1067-1074.

**Behåll en synlig, men diskret, markör i eventets `Notering`.** Den är redan
där, redan maskinläsbar, och syns aldrig i personlistan.

### 4. Fyll Telefon på personen och Ort på anmälan

Detta är det som ger Marcus "alla personkort ser likadana ut", och det kostar
ingenting alls.

| Fält | Fält-ID | Typ | I dag | Förslag |
|---|---|---|---|---|
| `Personer.Telefon` | `fldmMYIUhIc1HMnZi` | `multilineText` (skrivbar, `data-model.md` § Personer - write-fält) | aldrig satt | sätt samma nummer som anmälans `Mobilnummer` |
| `Anmälningar.Ort` | `fldP1LSzbyOJxrOGP` | `singleLineText` (skrivbar) | aldrig satt | sätt samma stad som eventets Ort |

**Mekanismen (MÄTT via `get_table_schema`):** `Personer.Ort`
(`fldBd946g2waLT7NG`) är en **rollup** över länkfältet
`Anmälningar (länkat fält)` (`fld8pOivka8YdiywK`) av `Anmälningar.Ort`
(`fldP1LSzbyOJxrOGP`). Det förklarar exakt varför varje seed-review-person i
dag visar `[null]`: personen HAR en anmälan, men anmälans egna `Ort` är tom.
Det förklarar också varför `ZZ-History Person 01` är den enda personen med
Ort - dess två anmälningar bär `Ort` direkt (`ZZ-Skövde` / `ZZ-Göteborg`).

Notera att `Ort (from Event)` (`fldUhHceqBud4BHvf`) är en ANNAN, lookup-baserad
väg som personens rollup inte läser. `data-model.md:511` säger det rakt ut:
*"Anmälans EGNA `Ort` duger inte - backfill-anmälningar har den tom."* Den
raden gäller åt andra hållet (varför eventvyn använder lookupen), men den
bekräftar att de två fälten är skilda.

### 5. Fyll i de permanenta fixturernas hål också

Detta är det billigaste sättet att uppfylla "alla kort ska ha samma
fältuppsättning", och det fäller ingenting (belagt i § Vad som är BUNDET):

| Person | Sätt | Rör INTE |
|---|---|---|
| `ZZ-Conformance Person 01..05` | `E-post`, `Telefon` | `Förnamn`/`Efternamn` (namnet asserteras ord för ord) |
| `ZZ-History Person 01` | `E-post`, `Telefon` | namnet, de två anmälningarnas `Ort`, deltagandena |
| `ZZ-Arbetsko Person 01` | `Telefon` | namnet, deltagandet |
| `ZZ-Lead Person 01/02` | `Telefon` | E-postadressen (asserteras som värde), Engagemang-länken |

Kommentaren i `get-persons.staging.test.ts:12` säger att Conformance-personerna
bär *"INGEN PII (tom e-post/telefon)"*. Att fylla dem med en RFC
2606-reserverad adress bryter inte det åtagandet: en `example.com`-adress är
per definition inte någons personuppgift.

**Kvarstående ojämnhet efter förslaget:** de fem Conformance-personerna och de
två Lead-personerna har fortfarande `Ort = []`, eftersom de saknar anmälningar
helt och Ort är en rollup. Det går inte att laga utan att ge dem anmälningar,
vilket skulle fälla `get-leads` (`antalAnmalningar = 0` asserteras på rad 84).
**Detta är en äkta gräns, inte en lucka i förslaget** - och den speglar prod:
en person utan anmälningar har ingen ort där heller.

### Jämförelsen mot prod: vad en verklig person faktiskt har

MÄTT read-only mot `app8uGPrVCVOm6LfD`. Endast formen redovisas, inga namn
eller kontaktuppgifter.

| Egenskap | Prod-utfall |
|---|---|
| Antal personer | 662 |
| Saknar `E-post` | **2 av 662** (0,3 %) |
| Har `Telefon` (kohort skapad efter 2026-06-01) | 38 av 65 (58 %) |
| Har `Ort` (samma kohort) | 53 av 65 (82 %) |

**Slutsatsen är obekväm men värd att säga rakt ut (SLUTET):** prod är INTE
uniform. E-post är närmast universell, men Telefon saknas på fyra av tio
färska personer och Ort på nästan två av tio. Ett staging där varje kort har
exakt samma fyra fält är alltså **mer** enhetligt än verkligheten.

**Rekommendation:** seeda med samma ojämnhet som prod har, inte med perfekt
uniformitet. Konkret: E-post på alla, Telefon på ungefär tre av fem, Ort på
ungefär fyra av fem. Då designar Marcus mot det verkliga fallet, inklusive
det tomma Telefon-fältet han annars aldrig skulle se förrän i prod. Varje
utelämnande ska vara deterministiskt (index-baserat, som `betalstatusFor` rad
967-976 redan gör) så en granskning går att återskapa exakt.

### Vad förslaget INTE föreslår

- **Inget nytt fält i basen.** P25 § O2 (`airtable-constraints.md:405-417`):
  staging/prod-schemasynk saknar pågående disciplin, och ett staging-only fält
  ökar driften utan att lösa något de befintliga bärarna inte klarar.
- **Ingen target i `.purge-staging-policy.json` för granskningsfixturen.**
  Skyddsräcke 2 (`seed-review-fixture.mjs:85-90`) är uttryckligt: setup-purgen
  kör före varje staging-CI-jobb och hade raderat fixturen mitt under
  granskningen.
- **Ingen ändring av `protectedRecordIds`-innehållet**, utöver den föreslagna
  härdningen att lägga till de tre `ZZ-History Ort`-eventen.

## Vad som är omätt

Ärligt utskrivet i stället för underförstått.

1. **Att MCP:ns `list_records` returnerade hela tabellen.** Räkningarna vilar
   på att svaret var kortare än `maxRecords`. För Personer och Anmälningar är
   det korsverifierat med komplementfilter; för Eventplanering, Deltaganden,
   Anteckningar, Väntelista, Segment och Engagemang är det INTE korsverifierat.
2. **Prod-totalen 662.** En enda hämtning med `maxRecords: 1200`. Ingen
   oberoende räkning gjord.
3. **Prod-fyllnadsgraden för hela populationen.** Telefon och Ort mättes bara
   på kohorten skapad efter 2026-06-01 (n = 65). Den äldre populationen kan ha
   en annan profil, särskilt de ~200 rader som skapades i ett enda pass
   2026-04-19 (synligt i tidsstämplarna, sannolikt en import).
4. **Om `--clean` faktiskt fungerar med den föreslagna länk-vägen.** Förslaget
   är läst ur koden, inte kört. Ingen dry-run gjordes i detta pass eftersom
   uppdraget var read-only.
5. **Vilka svenska mobilnummerserier som är reserverade för fiktion.** Jag har
   inte verifierat att någon PTS-reserverad testserie finns. Förslaget använder
   därför den nummerform seed-skriptet redan genererar (`070-1NN NN NN`,
   rad 1010) utan att påstå att den är reserverad.
6. **Om `Anmälningar.Ort` fylls av produktionsformuläret i dag.** Fältet är
   skrivbart och finns i prod, men jag har inte mätt hur ofta det faktiskt är
   ifyllt på verkliga prod-anmälningar. Om det oftast är tomt även där, är
   `[null]` i personens Ort-rollup ett realistiskt utfall och inte en defekt.
7. **Purge-läckans fulla omfattning.** Två `-uppdaterad`-rader mättes i dag.
   Om `update-event.staging.test.ts` normalt återställer orten efter sig och
   dessa två är kvarlämningar från avbrutna körningar, är tillväxttakten en
   helt annan än om varje körning lämnar en rad. Inte undersökt.
8. **Kontraktsvaktens nattliga beteende vid en rensning.** Vakten läser
   `get-person?id=recqxaFNwHAdQlAqb` och `get-event-notes` mot arbetskö-eventet
   varje natt. Båda ankarna är i den bundna mängden, så en rensning enligt
   detta dokument bör lämna vakten grön - men det är slutet, inte kört.
