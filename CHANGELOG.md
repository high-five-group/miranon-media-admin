# Changelog

Alla noterbara ändringar i detta projekt dokumenteras i denna fil.

Format följer [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
och projektet följer [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed — Manuell anmälan visade "(okänt event)" i aktivitetsloggen (Session 113, 2026-09-02)

Marcus prod-observation (Hem-kortets aktivitetsrad): *"Marcus Johansson skapade en anmälan · Marcus Test (okänt event)"*. Rotorsaken satt i `create-registration`-EF:en — den skrev aldrig Anmälans egna `Vill anmäla sig till`, så formeln `Event (namn)` (`{Vill anmäla sig till}`) var alltid tom för en manuell/+1/väntelista-anmälan och `eventNamn` föll till `null` i EF-svaret. Samma tomma formel lästes av läsvägen (`get-registrations`/`get-registration`), så bugg-ytan var bredare än enbart skapelseögonblicket.

- `create-registration/index.ts` (`mapCreatedRegistration`) och `_shared/registration-read.ts` (`mapRegistration`): `eventNamn` föredrar nu lookupen `Kurs (from Event)` (eventets kanoniska kursnamn — samma källa `get-person` och basens egen "Senaste anmälan (sammanfattning)"-formel redan föredrar, TASK-184) med fallback till formeln `Event (namn)`, och `create-registration` har en tredje sista-utväg-fallback (eventnamnet EF:en redan läste ur Eventplanering-posten innan skrivningen) — `eventNamn` är därmed aldrig `null` när Event-länken finns, utan att någon bas-skrivning ändrades
- **STOPP-BESLUT (ADR-086-premisspasset):** uppdraget föreslog även att EF:en skulle skriva `Vill anmäla sig till` vid create. `docs/reference/data-model.md` visar att fältet bär en ANNAN semantik — anmälans egna self-reported form-claim, `Eventmatchning`-formelns PÅSTÅENDE-sida, och källa för `Antal tidigare genomförda utbildningar`-rollupen på Personer — så den skrivningen uteblev medvetet; endast läsvägarna rättades (TASK-363, PR #2211)

### Changed — Betalningsytorna omgjorda i iteration med Marcus (Session 113, 2026-09-01)

En heldags iterationsloop där Marcus dömde varje yta i tur och ordning. Allt som rör betalningsflödet ligger bakom miljöflaggan `VITE_FEATURE_BETALNINGAR` och är avstängt i prod; de fyra prod-synliga punkterna är utmärkta med **PROD** nedan.

- **Hem: det gamla påminnelse-blocket är tillbaka, och det nya betalningskortet är rivet.** Kortet prövades i två pass innan det föll på Marcus dom (*"Nej det här håller inte. Lotta kommer bli så sjukt förvirrad."*). Grundfelet var inte formen utan att blocket blandade två jobb: listan visade alla öppna betalningar medan dess enda knapp opererade på delmängden i "Att påminna"-läget. `ForfallnaBetalningar` renderas ovillkorligt igen — dess tre grupper ÄR påminnelse-modellens tillstånd, och knappen sitter i den grupp den opererar på. `BetalningarKort.tsx` är borttagen från disk, inte parkerad (commit `42f1edd6`)
- **"Registrera betalning" flyttade till Genvägar** som en tredje rad (`Banknote` → `/mer/betalningar`), villkorad på flaggan av samma skäl som routen är det: målet redirectar till `/mer` med flaggan av, så en ovillkorlig rad hade studsat. Kvittojobbets besked bor numera i en egen `KvittojobbBanderoll`, synlig endast medan ett jobb faktiskt arbetar (commit `42f1edd6`)
- **Betalningssidan bytte togglen "kommande/tidigare" mot anmälningssidans filterrad** — samma primitiv, samma fyra dimensioner (period · typ · ort · event), URL-axlar via nuqs. Default är `upcoming` på Marcus uttryckliga dom (*"Kommande givetvis, hur ofta kommer hon regga en betalning i efterhand, typ aldrig."*); följden är synlig och avsiktlig: perioden räknas som ett aktivt filter, så tratten bär badge "1" vid sidladdning i stället för att filtrera tyst. Sökfältet flyttade in på filterradens egen rad, så ett satt filter inte längre kan försvinna medan man skriver i sökrutan (commits `5fb84bc2`, `f92cd6a3`)
- **Listan blev en kortlista**: varje anmälan är ett kort, och den expanderade raden markerar HELA kortet i stället för att rita en ruta inuti sig. Markeringen fick egna tokens sedan mätningen visade att den bar exakt samma grön som `MessageBox`-notisrutan (`#f0fdf4` mot `#f0fdf4` — rutan var inte svårläst, den var osynlig). Listan och filterraden fick dessutom menybarens bredd; de stod 32 px smalare än fliklisten rakt under (commits `5076ec44`, `8dd1ec28`)
- **Nytt granskningsblock i inkorgen** med en rad per betalning Lotta registrerat i sessionen (namn · belopp · betalsätt · kvittostatus) och "Skicka N kvitton" som blockets egen avslutande handling. Förut stod här en naken knapp — "Skicka 8 kvitton" utan att visa vilka åtta är inte granskningsbart. Blockets logg är skild från kvittokön: kön töms vid tryck, loggen aldrig under sessionen. Varje rad kan **ångras**, vilket ångrar själva registreringen (inbetalningen ligger i ledgern och kvittot i kön — att bara plocka bort raden hade varit en lögn); Ångra erbjuds bara medan det fortfarande är sant, annars pekar ytan på makuleringsvägen i klartext. Ingen ny serverlogik, ingen ny kö (commits `259c6eb8`, `1baf415c`, `d7749203`)
- **Inbetalningshistoriken fick bank-anatomi** efter Marcus jämförelse med sin egen banks transaktionslista (*"barnsligt … inte klart"*): en sammanhängande listyta med hårlinjer, betalsättet som titelled och beloppet i en högerställd sifferkolumn med `tabular-nums`. Listan rullar inline i stället för att kapas vid fem rader, så "Visar X av Y" kunde utgå. Ordet "Återbetalning" står först på de rader där beloppet är negativt — aldrig ett ensamt minustecken som enda bärare (commits `e727fdb7`, `cc124b96`, `b6f36ecd`, `1ccd46f4`)
- **Noteringsfält på själva inbetalningen** — hela kedjan byggd som kod (migration `20260901111500_inbetalning_notering.sql`, delad modul `_shared/inbetalning-notering.ts`, EF `registrera-inbetalning`, schema och fält i formuläret), efter att en mätning fällt den billiga vägen: Åtgärds-panelens noteringsfält skriver till ANMÄLANS fält, inte till en inbetalning. **Staging är deployat** (mätt 2026-09-01: `supabase migration list --project-ref pqtshyierkdgwdnxuirz` visar `20260901111500` som `remote`, och `functions list` visar `registrera-inbetalning` v4, `update-record` v35). **Prod återstår**, och där gäller ordningsregeln: migrationen måste gå FÖRE EF-deployen, eftersom `notering` står i `INBETALNING_KOLUMNER` som nio Edge Functions delar och PostgREST fäller hela select-anropet om en kolumn saknas. Fönstret före en deploy är hanterat i stället för dolt: svaret parsas utan nyckeln, och kvittensen säger rakt ut om noteringen inte sparades (commits `f9ccefd9`, `5bdd7f48`)
- **Avtalat pris kan sättas från appen** — förut fanns fältet bara i Airtable, utan någon UI-konsument alls. Ytan erbjuds där den betyder något (en registrering som lämnar en rest) och har sedan `3fcd3346` en egen Spara-knapp och en egen skrivväg: prisöverenskommelsen är oberoende av en betalning, och den gamla buntningen saknade helt väg för "vi sänkte priset, ingen har betalat än". Noll är ett giltigt pris (gratisplats) och har därför en egen felregel; ett skrivet men osparat pris sägs ut vid knappen i stället för att försvinna tyst (commits `e9bcaf90`, `3fcd3346`, `683a221e`)
- **Registreringsformuläret förenklat**: beloppschipsen ("1 500 – resten", "annat …") är rivna, beloppsfältet är alltid synligt och förifyllt med resten-beloppet markerat vid fokus — det vanligaste fallet blir ren Enter. Utfallstexten blev en färgad ruta med ikon i stället för en fetstilsväxling, med 1 sekunds fördröjning så skärmläsaren inte annonserar vid varje tangenttryck (commits `cb4ac531`, `ee7cae3d`, `045ba337`)
- **Kortet i listan uppdateras i samma tick som registreringen och ångringen**, båda riktningarna. Fördröjningen var inte kosmetisk: kortets försvinnande styrdes av en full nätverksrundtur mot Airtable medan resten av ytan uppdaterades ur lokalt state. Fixen är inte en optimistisk gissning utan serverns EGNA omräknade tal, som redan låg i mutationssvaret och nu skrivs in i cachen (commit `07a707f0`)
- **Terminologin lagd om över alla betalningsytor**: "Saknas" → **"Kvar att betala"**, "öppen/öppna betalning" → "kvarvarande betalning", "bankrapport" → **"Kontoutdrag"**, "Välj rapportfil" → "Ladda upp fil", och "500 kr täcker hela priset" → "Inget kvar att betala". Kodidentifierare och basens fältnamn är orörda, liksom "Öppna" som verb. Begreppen är kanoniserade i `ORDLISTA.md` (commits `776250a8`, `ad234e3e`, `87b2b58e`, `e14d3909`)
- **Pricka av-vertikalen riven på Åtgärds-sidan** i den flaggade världen — fällknappen, kryssen och "Ej relevant"-raden i sin gamla form. Kryssen hade gjorts läsande i TASK-346.7, och en kontroll som ser ut som en kontroll men inte är det är sämre än ingen kontroll: Lotta prickade av här i åratal. Sektionen bär i stället samma betalningsanatomi som anmälans detaljvy och personkortet. **Noteringsfälten överlevde rivningen** — de är hennes enda skrivväg till anmälans två noteringsfält (commit `40249ad2`)
- **PROD** — **"Just nu"-blocket på persondetaljen tappade guldet helt.** Först revs guld-fonden (*"det skär sig med färgerna som 'event-raderna' har"* — tre kulörfamiljer på tre lager), sedan revs även guld-konturen som byggts på hans egen motidé (*"Ta bort den oranga konturen … jag vill inte ha den"*). Slutsatsen är inte "fel ton" utan "ingen ton": blocket bär nu samma neutrala form som sina systerblock. Den token som mintats för konturen togs bort i samma andetag — inga föräldralösa tokens (commits `02e9f9af`, `4c290fc1`)
- **PROD** — **en pill-anatomi i stället för tre.** "Obekräftad" fanns i tre former samtidigt (kopparfärgad på betalningsytorna, RÖD i deltagarregistret och på Åtgärds-sidan) och stod bredvid "Förfallen" med två varningssignaler på samma rad. Regeln som ersätter båda felen: max en varningssignal per rad. "Förfallen" behåller koppar och sin klocka (det är tiden som gått fel); "Obekräftad" blir neutral utan ikon — den har ett eget bekräftelseflöde och är det normala läget för en ny anmälan, medan rött sade "fel har inträffat" om något som inte är ett fel (commit `7f2f11a7`)
- **PROD** — **ghost-knapparnas hover blev en genomskinlig skrim** i stället för en opak platta. En opak hover har fast ton, så dess synlighet beror på ytan under den — på `bg-muted` var kontrastkvoten exakt 1,000, alltså ingen återkoppling alls. Skrimmen mörknar ytan i stället för att måla över den och ger därför samma återkoppling på vit, tonad och guldad botten. Fixen sitter på tokennivån, så den löser vid källan den fälla `DokumentYta.tsx` räknar sex instanser av (commit `13bd2f87`)
- **PROD** — **filterradens luft och eventväljarens etikett**: 8 px mellan sökrutan och tratten läste som att de satt ihop och blev 16 px, och den visuella rubriken "Event" över eventväljaren är `sr-only` — på Marcus order uttryckligen på PRIMITIVEN, så den försvinner på betalningssidan och anmälningssidan samtidigt. Texten står kvar i tillgänglighetsträdet; spannet namngav aldrig kontrollen programmatiskt, så ingen a11y-egenskap gick förlorad (commits `5076ec44`, `f92cd6a3`)
- Fem `AMENDERING`-sidofiler skrivna under `tasks/sessions/bilagor/` per [ADR-102](docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)-plikten. Touch-mängden mättes mot manifestens `kallor` i stället för att ärvas ur uppdraget, vilket fann två berörda facit-kataloger som ingen räknat upp (`s103-persondetalj-konvergens`, `s111-anmalningssidan-konvergens`) och två extra ytor i en tredje. `AMENDERING-2026-08-31-betalningskortets-formsprak-346-14.md` är helt överspelad och bär en huvudnot i stället för att raderas — den är beviset för att formen prövades innan den revs

### Added — Prod-väg för inbetalnings-backfillen (Session 113, 2026-09-02)

- `scripts/backfill-inbetalningar.mjs` fick en prod-väg av samma typa-för-att-bekräfta-klass som `scripts/create-betalningsfalt.mjs` (PR #2192): `--bas`/`--projekt-ref` mot prod släpps ENDAST när miljövariablerna `AIRTABLE_PROD_GODKAND_AV_MARCUS`/`<PROD_REF_BYPASS_VAR ur .prod-ref-policy.conf>` är satta till EXAKT samma värden, satta av Marcus på kommandoraden — aldrig en agent. Samtliga fyra oberoende lås (`validateBaseGuard`, `validateProjectRef`, `provaLanktillstand`, `scripts/deny-prod-ref.sh`) består oförändrade; `provaLanktillstand`s hårda "länk=PROD"-vägran släpper nu bara den exakta "länk=PROD och mål=PROD"-kombinationen, och bara när BÅDA overrides redan godkänt bypass. Ny konsistensvakt `validateMiljoKonsistens` vägrar en körning där `--bas` och `--projekt-ref` pekar åt olika håll (t.ex. prod-Airtable mot staging-Postgres), eftersom backfillen skriver till båda systemen i samma körning. Varje släppt override loggas synligt till stderr. `.backfill-inbetalningar-policy.json` bär fortfarande INTE prod-refens värde (§ A11 i testsviten, oförändrat låst); 21 nya tester tillkom (TASK-360, 164 totalt)

### Added — Bilage- och dokumentspåret till prod (Session 108, 2026-08-20 → 2026-08-28)

- Höjdanpassning i `renderaMallPdf` (`supabase/functions/_shared/mall-render.ts`): bilagan renderas, sidorna räknas i PDF-strömmen via `/Count` (läsbar även med komprimerade objektströmmar) och renderas om mindre i en trappa `[1, 0,88, 0,8]` — "en sida" blir en garanti i stället för tur. RIM 1:s verkliga innehåll klarar sig på ETT pass, så normalfallet betalar ingenting; 25 % större innehåll räddas på pass två (TASK-309.27, PR #2028; live i prod som `generate-event-attachment` v13)
- `create-event` härleder `Plats` ur `Ort` vid skapande via `supabase/functions/_shared/plats-uppslag.ts` — uppslaget sker i en separat PATCH efter upsert, så en okänd ort aldrig fäller själva skapandet (TASK-309.30, PR #2038; live i prod som `create-event` v21)
- Lokal PDF-loop `npm run mall:pdf` — mall till renderad PDF på ~5 s med sidantal och geometri automatiskt mätta, plus `--watch`. Ersätter mätvägen via `supabase functions deploy`, som kostade tiotals minuter per mätpunkt (Session 108 Del 28 § B)
- `scripts/docraptor-sjalvbarande.mjs` neutraliserar ohämtbara `local("")`-faces innan mallen skickas till DocRaptor, med egen testsvit wirad som gatekeeper-svit i CI (TASK-301, PR #2034)
- `scripts/check-facit.sh` VARNAR när ett stämplat facit-pass saknar nyckeln `referenser` och namnger varje sådan yta — täckningsluckan i invariant (d) blir synlig utan att grinden fäller, per [ADR-102](docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) § Updates 2026-08-28. Slutmätning: 14 manifest, 29 ytor, 23 av 27 stämplade ytor utan innehållslås (TASK-309.31, PR #2032)

### Changed

- Facit-passet `s102-dokument-konvergens` **pensionerat** i stället för omstämplat: arkivflytt med `ARKIVERAD.md` plus pekar-svep över alla inlänkar, eftersom s108-faciten täcker samma ytor i sin nuvarande form. Underlaget för valet: `docs/research/facit-pensionering-s102-2026-08-26.md` (TASK-309.29, PR #2031)
- Bilagemallarnas FÖRLAGOR bokförda med sin faktiska sökväg (`~/Desktop/Miranon Media/exempelpdokument/`) i `CLAUDE.md` och `docs/mallar/bilagor/README.md` — README pekade tidigare på en katalog som inte existerar (PR #2022)
- Höjdanpassningens trappa utbruten ur `mall-render.ts` till `supabase/functions/_shared/hojdanpassning.ts` med 25 api-pure-tester; beteendepariteten mekaniskt bevisad mot den tidigare loopen över 125 scenarier med noll avvikelser, och `raknaSidor` byte-identisk (TASK-309.34 skiva i, PR #2054). Prod bär tills nästa EF-deploy den strukturellt äldre men beteendemässigt identiska koden
- `CLAUDE.md` § Prod-EF-deploy: kanalregeln skärpt per läge i stället för riven — `--kontrollera` (sekunder) får gå via `!`-prefixet, `--deploya` (45 EF, ~10 min) får det inte, eftersom kanalens tvåminuterstak dödar processen med SIGKILL utan att EXIT-trapen hinner återlänka staging. Den tidigare formuleringen behandlade båda lägena lika; `!`-kanalens hook-passage är oförändrad och skälet att kanalen finns kvar för korta anrop

### Fixed

- Bekräftelsebilagan renderades i **två sidor oavsett innehåll** — rotorsaken var Prince egen lucka (`align-self: stretch` för flex-items i row-containers implementerades aldrig), inte textmängden. Löst med block-layout plus absolut positionerad sidfot; de tolv EF-deployerna v37→v49 dessförinnan mätte alltså en flexbox-bugg (TASK-309.27, PR #2019/#2020/#2024/#2025)
- Fetstilen i kursbeskrivningen återinförd säkert via `fetMarkera` (`supabase/functions/_shared/fet-markering.ts`): hela strängen escapas, och `<strong>` återinförs därefter enbart där `**…**` matchar. Adversarial granskning fann ingen injektionsväg (TASK-309.27, PR #2025)
- Beviset för dokumentgenereringens popup-policy mätte något annat än vad det påstod — `page.evaluate` förnyar user activation och förstör mätningen. Ersatt av ett bevis i äkta Chrome; produktkoden var redan synkron och behövde ingen ändring (TASK-309.26 AC #2, PR #2040)
- `tests/api/get-document-sources.staging.test.ts` följer stagings avsiktligt berikade RIM 1-fixtur i stället för den gamla; testet hade varit rött sedan 2026-08-27 utan att synas, därför att `classify-post-merge.sh` ärver docs-only-klassningen och hoppar över staging-verifieringen (TASK-333, PR #2053; luckan själv är TASK-334)

## [0.8.0] - 2026-08-14

### Added — Fas 6.5: Aktivitetslogg (xAPI) (Session 105, 2026-08-11 → 2026-08-14)

- Supabase-tabell `activity_log` (staging + prod, RLS aktiv, append-only strukturellt bevisad; write endast via `service_role` i EF) — lagringsvalet Supabase i stället för Airtable per [ADR-110](docs/decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
- Edge Functions `log-activity` (skrivväg, fire-and-forget från klienten) + `get-activity-log` (läsväg med filter/paginering) under EF-ribban, metod-vakt före auth i koden (gateway `verify_jwt` svarar dock 401 först — runbook-rättelsen i samma fas)
- xAPI-statements Zod-validerade runtime (`src/domain/schemas/ActivityStatement.schema.ts`): actor/verb/object/context/timestamp, IRI-nycklade verb med svenska `sv-SE`-display, `requestId` som enda korrelations-ID i `context.extensions` per [ADR-111](docs/decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md), personId-extension för person-tidslinjen
- `recordActivity` (`src/data/activityLog/`) med obligatorisk queryClient-DI och cache-invalidering av loggens query-nycklar — hem-spalten speglar en nyss loggad handling utan omladdning (TASK-210)
- Hem-vyns spalt "Senaste aktivitet" (endast ≥xl; facit-stämplad mot k10 2026-08-13 med mittpunkts-undantaget) + full aktivitetshistorik med filterrad (kategori/event/tidsperiod) via Mer; event-filtrets alternativ disambiguerade `Namn · Ort · datum` (TASK-201.17)
- Katalog-invarianten "varje exporterad mutationshook loggar" mekaniserad: gatekeeper `tests/api/mutation-hemvist-vakt.test.ts` + config-driven allowlist `.mutation-hemvist-policy.conf` fäller `useMutation` utanför `src/data/mutations/` (TASK-201.15); slutmätning 16/16/0
- Nya mutations-hooks `useCreateEvent`, `useSendSegmentMail`, `useSaveSegment` (extraherade ur komponent-lokala `useMutation`, instrumenterade; segment-mail loggar EN aggregerad post per EF-kontraktets faktiska svar)
- e2e-skarven `tests/e2e/aktivitetslogg-skarv.staging.test.ts`: mail-fri åtgärd → posten i hem-spalt (utan omladdning) och historikvy med rätt aktör/språk/tid; anteckningsfallet asserterar ATT-inte-innehåll

### Changed

- Anteckningsposter (event + person) loggar ATT en anteckning gjordes — aldrig innehållet; tvåsidigt fällningsbevisat på payload-nivå
- `docs/features/FEATURE-ACTIVITY-LOG.md` omskriven från 2026-04-05-planeringsform till byggd form; superseded `ActivityEntry`-Airtable-modell och ikon-idén öppet markerade
- `docs/reference/prod-driftsattning-runbook.md` § Steg 5: deny-triple-förväntan rättad till `401 · 401 · 401` (gatewayen exekverar före funktionskoden vid `verify_jwt = true`); valfri fjärde 405-probe med anon-Bearer tillagd

### Removed

- `useConfirmAll` + `useLogPaymentReminder` (död kod, noll anropsplatser efter TASK-145-rivningarna; tre oberoende verifieringar) inkl. exklusiva verb och testposter — Marcus-mandat, TASK-201.18

## [0.7.0] - 2026-06-17

### Added — Fas 5.5: Vertikal write-slice "markera anmälningsavgift som betald" (Sessions 18/19 + 22)

- Datakälla-åtkomst via TanStack Router-context-DI (ADR-055): adaptern injiceras i router-context bredvid `queryClient` + `auth`; `src/data/dataSource.ts` (namngivet hem, `new AirtableAdapter()`) + `src/data/useDataSource.ts` (route-agnostisk access-hook). Första UI→data-wiringen — precedens för Fas 6:s mutationer
- Optimistic mutation `src/data/mutations/markRegistrationPaid.ts` per ADR-016:s fem komponenter: `dataSource.updateRecord('mark-registration-fee-paid', id, { Anmälningsavgift: 'Mottagen' })` + `onMutate`-rollback-context + optimistisk `setQueryData` + `onError`-rollback + `onSettled`-invalidate + aria-live för lyckad flip (`alertScreenReader`)
- `src/components/registrations/`: `RegistrationsList` (betalnings-status som text — färg aldrig ensam bärare) + `MarkPaidButton` (dold när redan Mottagen; MessageBox `role="alert"` med `requestId` vid fel)
- `src/queries/keys.ts`: query-key-factory (STATE-STRATEGY §3) — `queryKeys.registrations.byEvent`
- Route `src/routes/_authenticated/event/$eventId.tsx` (Betalnings-vy); `event.tsx` → `event/index.tsx` (placeholder bevarad, syskon-leaf)
- Typad `EdgeFunctionError` (`src/data/config/EdgeFunctionError.ts`): `callEdgeFunction`/`postEdgeFunction` kastar fel med strukturerad `status` + `requestId` (ur EF-fel-kroppen) i stället för plain Error
- 3 e2e `tests/e2e/mark-paid.staging.test.ts` (DoD 1/5/6/7/8 via deterministisk `page.route`-gate); server deny/allow + restore-teardown i `tests/api/update-record.staging.test.ts` (Sessions 18/19)
- ADR-055 (datakälla-åtkomst via router-context-DI) med additiva errata-noter vid STATE-STRATEGY:152 + ADR-016
- Lessons L137–L139 i `tasks/lessons.md`

### Changed

- `src/routes/__root.tsx`: `RouterContext` utökad med `dataSource`
- `docs/byggplan.md`: Fas 5.5 ✅ KLAR (§2 + §4 Slutförd-paragraf, versionshistorik 1.11); estimat-summa Fas 6 → Fas 7 = 7,5 sessioner
- README ADR-räkning 54 → 55

### Fixed

- markdownlint MD028 (blank-rad i blockquote) i ADR-016:s ADR-055-not

## [0.6.0] - 2026-06-12

### Added — Fas 5: App-shell (Session 16)

- PWA-grund per ADR-047: `vite-plugin-pwa` med `injectManifest` — Fas 0-SW-skelettet porterat till `src/sw.ts` (Workbox precache + `NavigationRoute` + offline-fallback), `public/offline.html` (fristående, prefers-color-scheme), manifest med namn/standalone/`lang: sv` + ikoner 192/512/maskable, registrering via `virtual:pwa-register`
- App-skal på `_authenticated`-layouten: `AppShell` (header + `main#main` + botten-fäst tab bar med 4 flikar, 44 px touch-targets, `aria-current`), `SkipLink` (programmatisk fokus till `#main`), `RouteAnnouncer` (globalt i `__root`; `staticData.title`-konvention + `document.title`-synk), `OfflineIndicator` (TanStack `onlineManager`, alltid-monterad live-region)
- Placeholder-routes `/event`, `/personer`, `/mer` + DEV-guardad feltrigger `/dev-fel`
- Error boundaries i två lager: `SectionError` (MessageBox-baserad `defaultErrorComponent`; reset + invalidate) + `AppErrorBoundary` (beroende-snål klasskomponent i `main.tsx`, täcker provider-fel)
- TanStack offline-config: explicit `networkMode: 'online'` på queries + mutations (ADR-047 B5; persistQueryClient defer till Fas 6/8)
- Varaktiga DoD-tester: `tests/e2e/shell.staging.test.ts` (skal, skip-länk, announcer, sektions-fel, offline-banner, reduced-motion, responsivt, axe) + `tests/e2e/pwa-offline.staging.test.ts` (SW-precache → cachat skal offline; manifest-check) — miljö-självguardande dev/preview
- Ikon-pipeline: `pwa-assets.config.ts` (lossless-PNG — generatorns quality-60-kvantisering bortvald; maskable padding 0.45 per hörn-radie-geometri) + `scripts/generate-favicons.mjs` (rund favicon med vit platta ur `public/favicon/favicon.svg`, dependency-fri PNG-ICO)
- ADR-047 (PWA-arkitektur + DoD 4-modernisering — Lighthouse v12 tog bort PWA-kategorin) med K-sista-korrigeringsnot (Performance ärver Fynd 7-defern; Fas 5-ingångsvärde 81)
- Lessons L96–L102 i `tasks/lessons.md`

### Changed

- Fel-hanterings-arkitekturen konsoliderad (Session 16 K4, stänger Session 7-todo-tråden): `Sentry.ErrorBoundary` riven ur `__root.tsx`, `RouteErrorFallback` ersatt av `SectionError` — boundaries renderar, createRoot-hooks rapporterar (ADR-038-korrigeringsnot)
- `src/main.tsx`: manuell SW-registrering ersatt av plugin-mekanismen; devtools-knapparna till topp-positioner (tab baren äger botten-ytan)
- `docs/byggplan.md`: Fas 5 ✅ KLAR (§2 + §4 Slutförd-paragraf, versionshistorik 1.8–1.10); API-runtime-caching defer till Fas 6 (K3-beslutsspår)
- Browser-favicon: rund vit platta (`favicon.svg` cirkel + omgenererat ICO/PNG/apple-touch-set) wirad explicit i `index.html`
- `tsconfig.tests.json`: DOM-lib (page.evaluate-callbacks typecheckas i tests-projektet)

### Removed

- `public/sw.js` (Fas 0-skelettet — porterat till `src/sw.ts`), `RouteErrorFallback.tsx`, K2:s rot-`favicon.ico` + `pwa-64x64.png` + full-bleed `apple-touch-icon-180x180.png`, Fas 0-favicon-resterna `site.webmanifest` + `web-app-manifest-192/512.png`

### Fixed

- Maskable-ikonen höll sig inte inom maskens safe-cirkel (kantmått ≠ hörn-radie) — padding 0.45, uppmätt kvot 0,868 (K5c)
- PWA-ikonernas palett-kvantisering (13 distinkta färger i 192:an → 432 efter lossless-fix, K5b)
- Latenta docs-fillänkar brutna av K2-/K4-raderingar (`public/sw.js`, `RouteErrorFallback.tsx`) — exponerade av changed-files-skippade länk-jobb, lagade med code-spans + ADR-038-korrigeringsnot

## [0.5.0] - 2026-06-11

### Added — Fas 3: UI-primitiver + Fas 3.5: A11y-baseline (Sessions 14–15)

- 6 UI-primitiver i `src/components/primitives/` — Button, Input, Select, MessageBox, Modal, Dialog — på react-aria-components + CVA-varianter (size sm/md/lg, intent primary/secondary/danger/ghost) med JSDoc-usage-exempel (ADR-044)
- Demo-route `/dev/primitives` (DEV-guardad, root-monterad utanför auth-trädet) för visuell + interaktiv verifiering
- Komponent-tokens `--mm-button-*`, `--mm-input-*`, `--mm-select-*` i `components.css` + ny semantisk roll `--mm-border-field` (WCAG 1.4.11-kontrastfix)
- A11y-runner: `axe-core` + `@axe-core/playwright`, Playwright-projekt `a11y`, fixtures med 0-violations-tolerans (ADR-045), 12 tester (7 primitiv + 5 mönster), `test:a11y`-script, CI-steg i Test+Build-jobbet — gate-proof-bevisad (medvetet brytande branch → rött run exakt på a11y-steget)
- Port-härdad a11y-server: dedikerad port + `--strictPort` + `reuseExistingServer: false` (alltid-färsk; eliminerar tyst-återanvänd-främmande-server- och stale-server-klasserna)
- Referens-route `/dev/patterns` (DEV-guardad) med 5 React Aria-mönster: Overlay, Listbox, Disclosure, MenuTrigger, ComboBox
- `docs/aria-patterns/` — 5 mönster-filer med kodexempel + test-mall + a11y-acceptance-criteria (Fas 6-konsumtionsunderlag)
- ADR-044 (react-aria-components som primitiv-bas + demo-route), ADR-045 (a11y-runner-arkitektur), ADR-046 (felmeddelande-wiring via describedby)
- Lessons L88–L94 (`[UNIVERSAL]`) i `tasks/lessons.md`

### Changed

- `--mm-text-muted`: `--p-neutral-400` → `--p-neutral-500` — Select-placeholdern mätte 3,49:1 mot WCAG 1.4.3-kravet 4,5:1 (axe-fynd, semantisk rotorsaks-fix som även botar den axe-osynliga Input-placeholdern)
- Explicit `aria-errormessage`-wiring riven ur Input/Select — React Arias FieldError/`aria-describedby` är enda felmeddelande-associationen (ADR-046; ARIA-UPGRADE §1-erratum)
- `cn.ts`: `extendTailwindMerge` registrerar custom font-size-skalan — tailwind-merge åt annars färgklasser tyst (L88)
- `docs/byggplan.md` §4: Fas 3-scope i components-termer per ADR-044 + Fas 3.5-mönsterlistan dito; §2 fas-tabell Fas 3 + 3.5 ✅ KLARA, estimat-summa 13,5 → 10,5 sessioner (versionshistorik 1.5–1.7)
- `ACCESSIBILITY-CHECKLIST.md` §5: 0 violations kanonisk fail-regel (ADR-045) + ci.yml-referens + additiv-not; §5/§6 stämplade "✅ levererad i Fas 3.5"
- Biome `$schema` 2.4.11 → 2.4.15 (lockfile-re-resolve + `biome migrate`)

### Fixed

- ComboBox-pattern-specen öppnar förslagslistan med riktiga tangenttryck (`pressSequentially`) — `fill()`-events öppnade inte React Arias listbox i CI (L93)
- Kanonisk ADR-räkning i rot-README höll inte jämna steg med katalogen (ADR-039-grinden fångade; L91)

## [0.4.0] - 2026-06-10

### Added — Fas 2.5: Schema-kontrakt-sync (Session 13)

- `RegistrationStatus` utökad 4 → 6 värden (`Flytta till väntelista`, `Inställt`) verbatim mot `docs/reference/data-model.md`, MCP-verifierade mot live-basen
- Ny `EventStatus`-enum (4 värden, Eventplanering.Status) + `Event`-modell/schema smalnade
- A1–A12 Synk-gate 1-inventering (`docs/research/datamodell-research/09-a1-a12-synk-gate-1-inventering.md`) — MCP-verifierad mot live-basen, gate stängd med Marcus-kvittens + schema-frys under fas-fönstret
- Adapter-debt-klassning: alla 9 TODO-stubs JSDoc-klassade per A5-tabellen (`@deferTo` + konsekvent `Not deployed yet`-throw; ADR-014/ADR-015 refererade)
- Lessons L83–L87 (`[UNIVERSAL]`) i `tasks/lessons.md`

### Changed

- Zod-scheman: status-/select-fält i `Registration`/`Attendance`/`Event` → `z.enum` härledda ur Status.ts-konstanterna (single source) — live-läsvägarnas `.parse()` (ADR-026) validerar nu värden, inte bara shape; modeller smalnade i parallell (ADR-005-assignability)
- Spekulativa EF-anrop borttagna ur throw-klassade stub-kroppar (skisser kvar i git-historik)
- `docs/byggplan.md` §2/§4: Fas 2.5 ✅ KLAR, estimat-summa 14,5 → 13,5 sessioner (versionshistorik 1.3 + 1.4)

### Fixed

- `docs/byggplan.md` Fas B-synk-gates återställda till beslutat A4-innehåll — "Gate B1 (innan Fas 6c)"/"Gate B2 (innan Fas E)" var transkriptions-drift utan beslutsspår (Session 13-forensik); Synk-gate 1 (hard, före Fas 2.5) + Synk-gate 2 (handshake per Fas 5.5/6-operation) + ny Beroenden-rad i §4.5
- Schema-path-typo i byggplan §4.5: `src/data/schemas/*.ts` → `src/domain/schemas/*.ts`

## [0.3.0] - 2026-05-13

### Added — Fas 2: Routing + Auth (Sessions 4+5+5b)

- Defense-in-depth tre-skikt-arkitektur: klient-side guard (TanStack Router `_authenticated` beforeLoad), AuthError throw-contract, server-side `requireUser` (oförändrad, Fas A M2)
- TanStack Router file-based routing med pathless `_authenticated`-layout
- AuthProvider med Supabase-integration (InnerApp-pattern)
- nuqs URL-state-setup + dev-only test-route
- Playwright `authenticatedPage`-fixture + 6-tests arkitektur-regression-suite (K4.3)
- `src/auth/AuthError.ts` — typed error class
- audit-ci-disciplin (allowlist för GHSA-rmmr-r34h-pfm5)
- ADR-026 — Runtime-validering vid datagräns med Zod `.parse()`
- ADR-027 — KVALITETSDEFINITIONER stack-skifte (Vue → React)
- ADR-028 — Supply chain incident-respons-protokoll

### Changed

- `src/data/config/supabase-client.ts` — `getAuthHeader()` throws AuthError istället för anon-key-fallback (Fas A §A3-fynd stängt)
- 18 nya UNIVERSAL-lessons (K17-K38) i `tasks/lessons.md`
- 7 hub-lyft till `~/Repon/marcus-system/tasks/lessons.md`

### Security

- Supply chain malware-respons (GHSA-rmmr-r34h-pfm5): pin exakt `@tanstack/react-router` + `@tanstack/router-plugin`, `overrides` för `@tanstack/history`. Integrity-MATCH pre/post-install.
- Anon-key-fallback i klient borttagen (defense-in-depth skikt 2).

### Fixed

- InnerApp useEffect race-condition (K3.5) — `[isAuthenticated, isLoading]` deps för korrekt guard re-eval.

## [0.2.0] - 2026-05-06

### Added — Pre-Fas-2 (Session 3)

- Pre-Fas-2 publik professionalisering: LICENSE, package.json metadata, .editorconfig, .nvmrc, .vscode/extensions.json, `.github/`-paketet (CI + Dependabot + CODEOWNERS + templates), CHANGELOG, SECURITY, CONTRIBUTING (ADR-024)
- docs/-omstrukturering: docs/specs/, docs/analysis/, docs/reference/, docs/logs/ (ADR-021)
- analys/ flyttad till docs/research/datamodell-research/ (ADR-022)
- tasks/sessions/-arkivering till archive/2026-04/, archive/2026-05/, archive/datamodell-research-2026-04-30/ (ADR-023)

### Changed

- BYGGPLAN-LÄTTLÄST v2 → v3 efter byggplan-revisionen (ADR-025). v2 arkiverad till docs/archive/. Speglar docs/byggplan.md v1.1 (13 fas-prompter inkl. nya Fas A/2.5/3.5/5.5/6a-e/8/B/E).

## [0.1.0] - 2026-05-05

### Added

- `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter) som styrande plan för Fas 2+ (P3a)
- 10 ADR:er ADR-011..ADR-020 (P3a)
- `docs/BUILD-LOG.md` retrospektivt komplett — Fas A M1–M8 + P0/P1/P2/P3a/P3b (P3b)
- 7 UNIVERSAL-poster lyfta till `marcus-system/tasks/lessons.md` (P3b)
- Fas A — security hardening: klient-DSN, två-stegs auth-check, test-prefix-konvention, operations-baserad API, INVARIANT-mönster, structured JSON-loggning, M1–M8 (14 commits)
- Fas 1 — domäntransplant från Vue-referensen (10 domain-filer + 4 data-filer + utilities)
- Fas 0 — projektinitiering: Vite + React 19 + TanStack Router/Query/Table + Tailwind v4 + Biome 2.0 + Supabase
- 10 ADR:er ADR-001..ADR-010 (Fas 0+1)
- 113 tester (72 körda lokalt + 41 staging-only-skipped)
- Lighthouse-baseline: 86 / 100 / 96 / 82 (production)

### Changed

- `conversion-plan.md` ersatt av `byggplan.md` (ADR-012)

### Archived

- `docs/conversion-plan.md` → `docs/archive/conversion-plan-2026-04-14.md` (ADR-012)

[Unreleased]: https://github.com/high-five-group/miranon-media-admin/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/high-five-group/miranon-media-admin/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/high-five-group/miranon-media-admin/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/high-five-group/miranon-media-admin/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/marcus803/miranon-media-admin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/marcus803/miranon-media-admin/releases/tag/v0.1.0
