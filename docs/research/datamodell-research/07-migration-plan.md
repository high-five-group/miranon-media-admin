# 07 - Tvåstegs-migrationsplan

> **Status:** Gate 5-underlag
> **Datum:** 2026-04-30
> **Scope:** Plan för post-MK Airtable 11/10 och senare Supabase-migration.
> **Ej scope:** SQL-DDL, implementation, Edge Function-kod, faktisk migration.

---

## Del A - Ram

### A1. Vad Fas 5 gör

Fas 5 sekvenserar redan beslutade A-track- och S-track-resultat:

1. Airtable 11/10 efter MK: genomför 06a:s 12 åtgärder kontrollerat.
2. Supabase target: bygg och migrera mot 06b:s 36 target-tabeller/objekt.
3. Transformationskontrakt: använd 06b Del F2 som ram för export och transform.
4. Implementation: lämnas till senare Code-session med avgränsad prompt.

Planen beskriver ordning, skyddade records, cleanup, mapping, transformregler, validering, rollback och ägarskap. Den återuppfinner inte `06a-airtable-redesign.md` eller `06b-supabase-target.md`.

### A2. Strangler-fig-ordning

Migrationen sker domän-för-domän, inte som big bang:

1. Tenants och service-klienter.
2. Persons och identity.
3. Events och sessions.
4. Registrations och attendees.
5. Attendances.
6. Integration sources och lead sources.
7. Communication outbox.
8. Waitlist.
9. Stöddomäner: interactions, marketing segments, bulk campaigns.
10. Audit och read models.

Motivering: identity och events måste finnas före registrations; attendees måste finnas före attendances; integration sources måste finnas före request-loggar och offer downloads; outbox/waitlist behöver canonical persons/registrations/events. Read models byggs sist från canonical relationer.

### A3. Beslut och guardrails som styr planen

- G0.3: soft multi-tenant från dag ett. Alla domäntabeller i target får `tenant_id`; migrationen sätter initialt tenant till `miranon-media`.
- DQ4: stable keys är primary identifiers för alla integration sources, t.ex. `leadmagnet:kraftfaltet` och `event:psionautics-2026-summer`. Displaynamn är översättningslager.
- H6: REJECTED. `Källa (formulärkälla)` modelleras inte som form-input-data utan som Zapier/integration-config.
- K6: `integration_sources` och `lead_sources` är olika koncept och migreras till olika tabeller.
- K7: öppna Gate 4B-frågor får inte smyg-beslutas i denna plan.
- K8: preserve är aktivt. Namnlösa Personer, Återkommande-semantik och RIM3x/read models skyddas uttryckligen.
- K9: stable keys och displaynamn får inte blandas.
- Audit före event sourcing: planen kräver audit/outbox/request-logg, inte full event sourcing.

### A4. Milstolpar

| Milstolpe | Omfattning | Sanity-check |
|---|---|---|
| M1 | Steg 1-3 | Airtable 11/10 kan genomföras post-MK utan att störa MK-records eller radera preserve-data. |
| M2 | Steg 4-8 | Supabase target, export/transform, dry-run, parallel run och cutover är sekvenserade domänvis. |
| M3 | Del F + Del G + Steg 9 | Validering och rollback är konkreta per steg, inte allmänna fraser. |
| M4 | Del H + Del I | Future Code-prompten har 3-4 kärnfiler och öppna frågor är flaggade utan nya gap. |

---

## Del B - Tio steg

### Steg 1 - Pre-MK freeze

**Preconditions:** MK-frysen är kommunicerad till Marcus, Lotta/Roger och eventuell extern hjälp. Inga strukturändringar i Airtable görs före MK. Senaste `06a`, `06b`, `07` och arbetsdokumentet ligger i repo.

**Protected records:** Alla MK-relaterade event, anmälningar, deltaganden, väntelistor, mailstatusar och Personer är låsta från schema-/formeländring. Särskilt skyddas poster som deltar i A1-A3-riskerna: Inställt-status, mailutskick och väntelisteflytt.

**Data cleanup:** Ingen cleanup. Endast dokumenterad observation och read-only snapshot-planering.

**Mapping:** Ingen target-mapping körs. Förbered namngivning för senare crosswalk: Airtable table id/name, record id, target table, target uuid, migration run id.

**Transform rules:** Inga transformregler exekveras. 06b Del F2 låses som ram för senare Steg 5.

**Validation:** Kontrollera `git status`, senaste commits, att MK-frys finns i arbetsdokumentet och att inga nya Airtable-fält/automationer planeras före MK.

**Rollback:** Eftersom inga dataändringar görs är rollback att stoppa arbetet och återgå till senast committade dokumentation. Om en oavsiktlig Airtable-ändring görs före MK: pausa projektet, dokumentera exakt ändring och återställ från Airtable revision/snapshot innan arbetet fortsätter.

**Ownership:** Marcus äger freeze-beslut. Codex/Code får inte göra live-ändringar. Lotta/Roger informeras om att drift går före research.

### Steg 2 - Post-MK Airtable hardening

**Preconditions:** MK är avslutat, driftläget är stabilt och en read-only snapshot/export finns. A-track-åtgärderna A1-A3 är granskade mot aktuell Airtable-bas innan de körs.

**Protected records:** MK-historik, alla befintliga Anmälningar, Personer, Deltaganden, Väntelista-poster och mailtimestampfält skyddas från massradering. Namnlösa Personer får inte fyllas med placeholders.

**Data cleanup:** Kör endast hårdnande driftfixar först: A1 aktiv-semantik, A2 mail partial-success/retrybarhet och A3 idempotent väntelisteflytt. A4-A8 förbereds men batchas inte in i samma release om de inte behövs för driftfixen.

**Mapping:** Dokumentera exakt vilka Airtable-fält/automationer varje A1-A3-ändring påverkar. För A2 och A3 mappas operationens före/efter-status till framtida `communication_outbox`, `communication_attempts`, `waitlist_entries` och `waitlist_conversions`.

**Transform rules:** Ingen Supabase-transform körs. Däremot ska A2/A3-resultaten skapa tydligare källfält för senare transform: operation status, retry/compensation-state och tidsstämplar.

**Validation:** Testa A1 med minst ett Inställt-event och ett aktivt event. Testa A2 med simulerad mail success och simulerad Airtable PATCH failure. Testa A3 med dubbelklick/retry på samma väntelistepost och verifiera att endast en legitim anmälan skapas.

**Rollback:** A1 återställs genom att återlägga tidigare formel. A2 återställs genom att inaktivera ny retry/kompensationsväg och använda tidigare manuella mailrutin. A3 återställs genom att stoppa ny flyttautomation och hantera berörd väntelistepost manuellt från snapshot.

**Ownership:** Marcus godkänner releasefönster. Implementation i senare Code-session. Lotta/Roger verifierar verksamhetsutfall för mail och väntelista.

### Steg 3 - Airtable cleanup, datakvalitet och migration readiness

**Preconditions:** Steg 2 är verifierat i drift och inga post-MK incidenter är öppna. Konsumentsök för berörda fält är gjort innan rename/delete/archive.

**Protected records:** Preserve-lås från 06a Del F gäller absolut: namnlösa Personer, Återkommande-semantik, RIM3x/read model och A2 reverse-flow får inte förenklas bort. H6 får inte återöppnas.

**Data cleanup:** Kör A4-A8 kontrollerat: rename/dokumentera Återkommande, kanonisera case-dubletter, pensionera gamla count/read-model-fält efter karantän, hantera tomma selectfält och göra Zapier/DQ4-source-values läsbara. A9-A12 dokumenteras som aktiva preserve/defer-guards.

**Mapping:** Skapa migrationsordlista för legacyvärden: kursavsikter till `programs.program_key`, source/displayvärden till `lead_sources` eller `integration_sources`, återkommandevärden till person state/read model och gamla countfält till target read models.

**Transform rules:** Förbered crosswalk-specen utan att ladda target: Airtable record id är legacy identity, Supabase uuid är target identity, stable keys är business identity vid integration/program/event/source. Displaynamn får bara mappas till stable key via explicit tabell, inte användas som identifierare.

**Validation:** Kör före/efter-kontroller: antal Personer inklusive namnlösa, antal Anmälningar per status, antal Deltaganden, antal Väntelista-poster, lista över Zapier/source-options och samtliga A4-A8-fält. Kontrollera att RIM3x-resultat inte förändras av cleanup.

**Rollback:** Rename kan reverseras via Airtable field history. Case-kanonisering kräver export av originalvärden och återställningslista. Delete av tomma selectfält görs först efter karantän; före karantän är rollback att återaktivera/döpa tillbaka fältet.

**Ownership:** Marcus godkänner cleanup. Code genomför senare efter plan. Verksamheten verifierar att synliga fält fortfarande betyder samma sak.

**M1 sanity-check:** Steg 1-3 gör Airtable säkrare före targetmigration utan att ändra målmodellen. De löser driftkritiska problem, förbereder transform och bevarar legitim legacy-semantik.

### Steg 4 - Supabase schema build

**Preconditions:** Gate 5 är godkänd. Supabase-projekt, staging-miljö, service-role-separation och migration workflow finns. 06b är källan för targetdesign.

**Protected records:** Inga production-records flyttas i detta steg. Airtable förblir system of record. Production Supabase får inte fyllas med delmigrerad data förrän dry-run och cutover-kriterier är uppfyllda.

**Data cleanup:** Ingen Airtable-cleanup. I Supabase seedas endast globala/grundläggande konfigurationsposter som behövs för tomt schema: tenant `miranon-media`, memberships/service clients och beslutade stable-key-kataloger där de redan är låsta.

**Mapping:** Bygg target enligt 06b: tenancy, identity/persons, events, registrations/attendees/attendances, integration sources, lead sources, outbox, waitlist, audit, read models och integration requests. Composite indexes ska börja med `tenant_id` för domäntabeller enligt G0.3.

**Transform rules:** Inga legacydata transformeras. Däremot måste target acceptera senare transform: nullable/nameless persons, multiple identifiers, stable integration keys, separate lead sources, idempotency keys, operation status och audit/change-log.

**Validation:** Kör schema-/policytester i staging: RLS tillåter tenantmedlem att läsa egen tenant och blockerar annan tenant; service role kan skriva integration/audit; FK/unique constraints stoppar dubletter; tom target kan skapa tenant, event, person, registration, attendance och outbox-testpost.

**Rollback:** Eftersom detta steg inte migrerar live-data är rollback att backa schema-migrationen i staging eller kasta om staging-databasen. Production rollback kräver att inga cutover-switchar har ändrats.

**Ownership:** Code äger implementation senare. Marcus äger beslut om Supabase-projekt och miljöer. 06b äger modellens form.

### Steg 5 - Data export och transform

**Preconditions:** Steg 3 och 4 är klara. Airtable-export är read-only och versionsmärkt. Target schema finns i staging. Crosswalk-formatet är bestämt på plan-nivå.

**Protected records:** Alla legacy-records bevaras oförändrade. Namnlösa Personer migreras aktivt. Inställda, avbokade, väntelista- och mailpartial-records migreras som legitima tillstånd, inte som skräp.

**Data cleanup:** Endast cleanup som redan beslutats i A-track används som input. Nya luckor flaggas i Del I, inte som nya gap eller ad hoc-transformer.

**Mapping:** Använd 06b Del F2:

| Legacy source | Target | Huvudregel |
|---|---|---|
| Personer | `persons`, `person_identifiers`, `lead_profiles`, state transitions | Namnlösa bevaras; e-post/telefon typas; lifecycle separeras. |
| Anmälningar | `registrations`, `registration_attendees`, transitions | Status mappas explicit; källa delas till lead source och/eller integration source. |
| Deltaganden | `attendances` | FK byggs från länkrelationer/export, inte RECORD_ID-formler. |
| Eventplanering/Eventformat | `programs`, `event_formats`, `events`, `event_sessions`, `event_ingest_configs` | EventKey blir target event key/ingest config, inte formelberoende. |
| Erbjudanden/Hämtade erbjudanden | `lead_magnets`, `offer_downloads`, `lead_profiles` | Hash/displayvärden mappas till stable integration source keys. |
| Källa/hash/options | `integration_sources`, `integration_source_configs` | H6 förblir rejected; integration source är produkt/config. |
| Återkommande? | `person_states`, read models | Aktiv process-semantik bevaras under nytt namn. |
| RIM3x/counts | read models | Byggs från canonical relationer. |
| Mail timestamps | `communication_outbox`, `communication_attempts` | Providerstatus och target update separeras. |
| Väntelista | `waitlist_entries`, `waitlist_conversions`, outbox | Idempotent operation med status per steg. |
| Zapier/Elfsight/form edges | `integration_sources`, `integration_requests` | Stable key, owner, status, idempotency och request-logg. |
| Touchpoints/Engagemang/Kontaktlogg | `interactions`, `marketing_segments`, read models | Typed payload och bevarad semantik. |

**Transform rules:** Transformen ska vara deterministisk och idempotent per migration run. Crosswalk sparar legacy record id till target id per tabell. Stable keys sätts från beslutade mappings, inte från displaynamn. `tenant_id = miranon-media` sätts på alla domänrader. Unknown/öppna värden hamnar i explicit review bucket, inte i tyst default.

**Validation:** Räkna legacy vs target per domän. Kontrollera FK-orphans = 0 för migrated scope. Kontrollera duplicate stable keys = 0. Stickprova minst: namnlös Person, återkommande Person, Inställt-event/anmälan, mailpartial, väntelistekonvertering, Zapier source/hash, Deltaganden med RECORD_ID-problematik och RIM3x-read model.

**Rollback:** Transform rollback är att kasta staging-loaden och crosswalken för aktuell migration run. Airtable påverkas inte. Om production staging hunnit användas för parallel run ska cutover inte ske förrän ny transform-run är grön.

**Ownership:** Code äger senare export/transform-script. Marcus äger mappings för tvetydiga source/displayvärden. 06b Del F2 äger transformramen.

### Steg 6 - Dry-run migration

**Preconditions:** Steg 5 transform kan köras om idempotent. Staging target är tom eller återställd. Validation suite finns innan load.

**Protected records:** Production Airtable och production Supabase lämnas orörda. Dry-run-data märks med migration run och får inte exponeras för vanlig drift.

**Data cleanup:** Ingen cleanup. Dry-run används för att hitta transformfel och Del I-frågor.

**Mapping:** Ladda domäner i strangler-ordningen: tenant, persons, events, registrations/attendees, attendances, integration sources/lead sources, outbox, waitlist, stöddomäner, audit/read models.

**Transform rules:** Samma regler som Steg 5. Dry-run får inte ha specialfall som inte också finns i production-run.

**Validation:** Kör automatiserade checks efter varje domänload: counts, FK, unique constraints, RLS read tests, idempotency re-run, sample jämförelse mot Airtable-export och read-model-rebuild. Dry-run är inte godkänd om någon domän kräver manuell databaskorrigering efter load.

**Rollback:** Återställ staging till pre-run snapshot eller skapa ny staging DB. Crosswalk för misslyckad run arkiveras som felsökningsartefakt men används inte för cutover.

**Ownership:** Code kör senare. Marcus godkänner dry-run-resultat per domän.

### Steg 7 - Parallel run

**Preconditions:** Dry-run är grön. Appens data-access-layer kan peka per domän mot Airtable eller Supabase utan att byta allt samtidigt. Airtable är fortfarande primär write-path.

**Protected records:** Airtable förblir source of truth tills respektive domän cutover-godkänns. Supabase-data i parallel run får inte skriva tillbaka till Airtable utan explicit operation.

**Data cleanup:** Ingen ny cleanup. Driftavvikelser dokumenteras och klassas som transformfix, source-data-fråga eller Del I-fråga.

**Mapping:** Kör parallell läsning/jämförelse per domän i samma ordning som A2. För UI/app är adapter-gränsen från `docs/conversion-plan.md` relevant: DataSourceAdapter kan vara cutover-yta, men exakt implementation lämnas till Code.

**Transform rules:** Inkrementella förändringar efter initial load måste följa samma transformregler och idempotency keys som dry-run. Integration requests och outbox testas isolerat innan de blir production write-path.

**Validation:** För varje domän: jämför listvyer, detaljer, counts, statusfilter och stickprov mot Airtable. Kontrollera att namnlösa leads visas, återkommande-semantik stämmer, lead source och integration source inte blandas och stable keys aldrig visas som ersättning för begripligt displaynamn där UI behöver text.

**Rollback:** Slå tillbaka domänens read-path till Airtable och kasta/markera Supabase-parallel-run-data som ogiltig för domänen. Eftersom Airtable fortfarande är primär write-path krävs ingen verksamhetsrollback.

**Ownership:** Marcus beslutar domänvis go/no-go. Code äger adapter/cutover-implementation senare.

### Steg 8 - Cutover

**Preconditions:** Parallel run är grön för aktuell domän. Cutover-fönster och kommunikation finns. Rollback-väg är testad för domänen.

**Protected records:** Domäner som inte cutover-godkänts ligger kvar på Airtable. Historical Airtable-data arkiveras read-only, inte raderas. Integrationer som Zapier/Elfsight får inte peka om utan verifierad idempotency och request logging.

**Data cleanup:** Ingen cleanup i cutover-fönstret utöver låsta final sync-steg. Cleanup efter cutover sker i Steg 10.

**Mapping:** Slå om domänens read/write-path till Supabase i strangler-ordning. För integrationer: flytta först ingest till `integration_requests`, därefter domain-write, därefter observability.

**Transform rules:** Final delta-transform måste vara replaybar. Alla records som ändrats sedan senaste dry-run/parallel sync ska ha crosswalk och checksum.

**Validation:** Direkt efter cutover: skapa/läs/uppdatera ett kontrollerat record per domän, verifiera UI-lista/detalj, RLS, audit/change-log, outbox/request-logg och counts mot final export. För waitlist krävs idempotency-test med samma operation key.

**Rollback:** Stäng Supabase write-path för domänen, återaktivera Airtable-adapter/write-path och replaya manuellt de få cutover-fönsterändringar som hann ske om de inte finns i Airtable. Rollback-fönstret ska vara kort och per domän, inte globalt.

**Ownership:** Marcus äger cutover-beslut. Code äger teknisk switch senare. Verksamheten verifierar kritiska flöden.

**M2 sanity-check:** Steg 4-8 följer strangler-fig, skyddar Airtable tills domänen är grön och använder 06b target/F2-transformer utan att designa om tabellerna.

### Steg 9 - Rollback-strategi

**Preconditions:** Varje tidigare steg har egen rollback. Global rollback används bara om flera domäner påverkas eller cutover måste avbrytas.

**Protected records:** Airtable read-only-arkiv, final exports, crosswalks, migration-run logs, integration request logs och communication outbox/attempts får inte raderas under rollback-perioden.

**Data cleanup:** Ingen cleanup under rollback. Cleanup efter incident är separat postmortem-arbete.

**Mapping:** Rollback använder crosswalk för att identifiera vilka Supabase-rader som motsvarar vilka Airtable-records och vilka cutover-fönsterändringar som måste replayas eller kompenseras.

**Transform rules:** Kompensation ska ske på operationsnivå, inte genom fria SQL-korrigeringar. Outbox- och waitlist-operationer rollbackas genom status/compensation records, inte genom att tyst ta bort historik.

**Validation:** Rollback är godkänd först när appens kritiska vyer pekar på korrekt source, counts matchar vald source of truth, inga integrationsdubletter skapas och verksamheten kan fortsätta registrera/betala/närvaromarkera.

**Rollback:** Nivå 1: domän rollback till Airtable read/write. Nivå 2: integration rollback till tidigare Zapier/Airtable-kedja. Nivå 3: full cutover pause med Supabase read-only och Airtable som source of truth. Nivå 4: manuell verksamhetsrutin för kort incidentfönster.

**Ownership:** Marcus är incident owner. Code genomför teknisk rollback senare. Lotta/Roger får endast ett tydligt arbetsläge: "använd gamla vägen" eller "använd nya vägen", aldrig båda utan instruktion.

### Steg 10 - Post-migration cleanup

**Preconditions:** Alla domäner är cutover-godkända och rollback-perioden är passerad. Audit/read models och integration observability är stabila.

**Protected records:** Airtable archive, exports, crosswalks, audit logs, communication attempts, integration requests och migration-run artefakter bevaras enligt retention-beslut. Legacy-data raderas inte förrän retention och compliance är beslutade.

**Data cleanup:** Avveckla legacy-fält, gamla Edge Functions/Zapier-kedjor och Airtable automationer först när deras ersättare har bevisad drift. Ta bort UI-/adaptervägar domänvis efter karantän.

**Mapping:** Dokumentera slutlig source-of-truth per domän och var historiken finns. Lås crosswalk som read-only referens.

**Transform rules:** Inga nya transforms. Eventuella sena korrigeringar hanteras som data repair med audit och ägarskap, inte som migration.

**Validation:** Kontrollera att alla gamla integrationsvägar är avstängda, att inga dubbla mail/registrations skapas, att read models uppdateras från canonical relationer och att support kan hitta gamla Airtable-records via crosswalk.

**Rollback:** Efter rollback-period är teknisk rollback till Airtable inte längre standardväg. Beredskap blir data repair eller tillfällig read-only referens mot Airtable archive. Innan denna punkt får Airtable inte göras otillgängligt.

**Ownership:** Marcus godkänner avveckling. Code tar bort teknisk legacy-yta senare. Verksamheten godkänner att gamla manuella rutiner inte längre behövs.

---

## Del C - Crosswalk och migration runs

Crosswalk är en förstaklassartefakt i planen, inte temporärt skriptminne. Den behöver minst bära:

- Source system: `airtable`.
- Source table id/name och source record id.
- Target table och target id.
- Tenant key: initialt `miranon-media`.
- Migration run id.
- Source checksum eller jämförelsehash.
- Transform status: mapped, loaded, skipped-for-review, failed.
- Review reason vid skipped/failed.

Crosswalk används för idempotency, rollback, support och för att kunna förklara för verksamheten var en gammal Airtable-post finns i Supabase.

---

## Del D - Transformationsdisciplin

### D1. Stable keys och displaynamn

Stable keys sätts före eller under transform och används som primary identifiers vid integrationskanter. Displaynamn får ändras utan att migration, retry, audit eller request-logg tappar identitet.

Exempel:

- `leadmagnet:kraftfaltet`
- `leadmagnet:psionautics-guide`
- `event:psionautics-2026-summer`
- `form:elfsight:psionautics-registration`
- `zapier:legacy:download-kraftfaltet`

Exakta nycklar för legacykällor som inte redan är beslutade ska hamna i Del I review, inte hittas på tyst i implementation.

### D2. Integration source är inte lead source

Migrationen ska kunna sätta båda när source-data stödjer det:

- Lead source: verksamhetsförklaring, t.ex. organic, leadmagnet, referral.
- Integration source: teknisk/product edge, t.ex. Zapier/Elfsight/form/lead magnet med stable key, owner och status.

Om en legacykolumn blandar båda ska transformen skapa review bucket eller explicit split mapping. Den får inte kopiera Airtable-fältet 1:1 till en enda targetkolumn.

### D3. Preserve aktivt

Preserve-regler i transform:

- Namnlösa Personer migreras som legitima leads med nullable display name och identifier/lead profile när sådan data finns.
- `Återkommande?` migreras som aktiv process-/state-semantik, inte som enkel "har deltagit tidigare".
- RIM3x och gamla counts migreras inte som sanning; de byggs som read models från attendances/events/programs.
- DS6/DQ7/H4 RECORD_ID-formler används inte som FK-sanning.

---

## Del E - Käll- och domänberoenden

| Domän | Måste finnas före | Varför |
|---|---|---|
| Tenants | Allt | RLS, `tenant_id`, service clients och memberships. |
| Persons/identity | Registrations, attendees, attendances, leads | Alla relationer behöver canonical person/identifier. |
| Events/sessions | Registrations, attendances | Anmälan och deltagande behöver event/session. |
| Registrations/attendees | Attendances, outbox, waitlist conversion | Attendance knyter till attendee/session; outbox behöver target object. |
| Attendances | Read models | RIM3x/course history beror på canonical attendance. |
| Integration sources | Requests, offer downloads, lead profiles | Config och stable keys måste finnas innan request-logg och leadmagnet-data. |
| Communication outbox | Cutover för mail | Mailstatus måste bli operationer med attempts. |
| Waitlist | Cutover för väntelista | Konvertering kräver idempotency och compensation. |
| Stöddomäner | Read models/segments | Interactions och campaigns bygger på canonical identity/source. |
| Audit/read models | Sist | De ska observera och derivera från canonical relationer. |

---

## Del F - Valideringsstrategi

Validering ska vara konkret och körbar:

| Steg | Minimikontroll |
|---|---|
| 1 | Freeze-checklista, repo clean, inga planerade schemaändringar före MK. |
| 2 | A1 Inställt-test; A2 partial-success-test; A3 duplicate/idempotency-test. |
| 3 | Före/efter-counts, konsumentsök, RIM3x oförändrat, namnlösa Personer oförändrat antal. |
| 4 | RLS-policytest, FK/unique-test, tenant isolation, service-role-write-test. |
| 5 | Counts per domän, FK-orphans = 0, duplicate stable keys = 0, review bucket explicit. |
| 6 | Dry-run kan köras om och ge samma resultat; samplediffar mot Airtable-export godkända. |
| 7 | Parallel read comparison per domän; UI/list/detail counts matchar vald source. |
| 8 | Cutover smoke test per domän; request/outbox/audit finns för operationer. |
| 9 | Rollback drill per domän innan riktig cutover. |
| 10 | Legacy integrations avstängda, archive/crosswalk read-only och support-sökning fungerar. |

Särskilda stickprov som alltid ska ingå i Steg 5-8:

- Namnlös Person med leadmagnet-/offer-koppling.
- Person med flera e-postvärden eller multiline email legacy.
- Återkommande-person.
- Inställt-event eller avbokad/inställd anmälan.
- Deltagande där legacy RECORD_ID-formel inte är tillförlitlig.
- Mail där providerstatus och Airtable PATCH-status kan skilja.
- Väntelistepost som konverteras.
- DQ4/Zapier hash/source-värde som ska bli integration source stable key.

---

## Del G - Rollback-strategi

Rollback är per steg och per domän:

| Nivå | När | Väg |
|---|---|---|
| Dokumentationsrollback | Steg 1 | Återgå till senaste commit, inga dataändringar. |
| Airtable field rollback | Steg 2-3 | Återställ formel/field rename från snapshot/history; stoppa ändrad automation. |
| Transform rollback | Steg 5-6 | Kasta staging-load och migration run; Airtable orörd. |
| Parallel-run rollback | Steg 7 | Peka domänens read-path tillbaka till Airtable; markera Supabase-run ogiltig. |
| Cutover rollback | Steg 8-9 | Domänvis åter till Airtable, replay/kompensera cutover-fönsterändringar. |
| Post-retention repair | Steg 10 | Data repair med audit; Airtable är read-only referens, inte standard rollback. |

Rollback får inte bygga på att radera audit, outbox eller request-loggar. Dessa är bevis för vad som hände och behövs för support.

**M3 sanity-check:** Del F och G gör validering och rollback testbara. Varje steg har en konkret stop/återgångsväg, och outbox/audit bevaras även vid fel.

---

## Del H - Future Code-prompt

Använd denna prompt i separat implementation/post-projekt-session. Den ska inte köras under Fas 5.

```text
Du ska implementera migrationsförberedelserna för Miranon Media Admin enligt Fas 5-planen. Börja inte med kod innan du har läst dessa kärnfiler:

1. docs/research/datamodell-research/07-migration-plan.md
2. docs/research/datamodell-research/06a-airtable-redesign.md
3. docs/research/datamodell-research/06b-supabase-target.md
4. tasks/sessions/archive/2026-04/2026-04-28-datamodell-research-projekt.md

Läs därefter docs/reference/data-model.md endast för frusen legacyfält-/flödesdetalj när en mapping kräver det.

Scope:
- Implementera Steg 1-3 först: post-MK Airtable hardening/cleanup med skydd för MK-historik och preserve-regler.
- Därefter implementera Steg 4-6 i staging: Supabase schema enligt 06b, export/transform enligt 06b Del F2 och dry-run migration.
- Stoppa före Steg 7 parallel run om Marcus inte uttryckligen godkänner go.

Guardrails:
- Inga MCP-anrop om inte Marcus ber om live-verifiering i den sessionen.
- Ingen big bang. Migration sker domän-för-domän.
- Inga nya gap. Nya luckor flaggas som implementation questions.
- H6 förblir REJECTED.
- integration_sources och lead_sources är separata.
- Stable keys är primary identifiers för integration sources; displaynamn är översättningslager.
- Namnlösa Personer migreras aktivt som legitima leads.
- RECORD_ID-formler används inte som FK-sanning.

Verifiera per steg:
- Kör de valideringar som listas i 07 Del F.
- Dokumentera rollback-test eller rollback-väg per ändring.
- Uppdatera arbetsdokumentets spårbarhetsmatris och dagliga logg när ett steg är klart.
```

**M4 sanity-check:** Future Code-prompten pekar på fyra kärnfiler och anger stoppunkt, guardrails och verifiering. Den kräver inte att Code läser hela projektets historik.

---

## Del I - Gate 5-frågor och öppna implementationfrågor

### I1. Gate 5-frågor

1. **Kan Airtable göras 11/10 säkert efter MK utan att störa drift?** Ja, om Steg 1-3 följs: freeze, driftkritiska A1-A3 först, cleanup A4-A8 separat och preserve A9-A12 aktivt.
2. **Saknas Supabase-arkitekturbeslut för att implementation ska kunna börja?** Nej för planstart. 06b låser target på rätt nivå. Exakt SQL/RLS/trigger/state-catalogue är implementation, inte Fas 5-design.
3. **Kan framtida Code-session exekvera utan att gissa?** Ja, med Del H:s fyra kärnfiler och stoppunkter. Den kan börja med Step 1-3/4-6 utan att läsa hela projektet.
4. **Är strangler-fig-ordningen motiverad?** Ja. Den följer beroenden: tenant -> identity -> events -> registrations/attendees -> attendances -> integrations/outbox/waitlist -> read models.
5. **Är rollback realistisk per steg?** Ja, eftersom Airtable behålls som source of truth till domänvis cutover, staging-loads kan kastas, och cutover rollback är per domän.
6. **Är future Code-prompten tillräckligt detaljerad?** Ja för första implementationen. Den begränsar scope, anger kärnfiler, guardrails, stoppunkt och valideringskrav.

### I2. Öppna frågor som inte beslutas i Fas 5

- Exakt SQL-DDL, triggerform och RLS-policytext.
- Enum vs reference table för state catalogues.
- Exakt Edge Function-split för nya integration/request/outbox-flöden.
- H13: exakt källa i HTML-template om mapping kräver live-verifiering.
- DS7: action-level legacy-diff om det behövs utöver target audit/request logs.
- Exakta stable keys för legacykällor som inte redan har beslutat namn.

Inga nya gap läggs till. Dessa är implementationfrågor eller Gate 6/slutgranskningsfrågor.

---

## Del J — Projekt-slutsektion (Fas 6)

### J1 — Sammanfattning

Datamodell-research-projektet har levererat fem analysfiler: `04` med 10 principer och baseline, `05` med 15 gap, `06a` med 12 Airtable-åtgärder, `06b` med 36 Supabase target-tabeller/objekt och `07` med 10 migrationssteg. Alla 29 DS/DQ/H-rader är spårade genom Fas 1-6. Slutresultatet svarar på projektfrågan: modellen var inte 11/10 ännu, men det finns nu en konkret väg till Airtable 11/10 och Supabase target utan att ärva Airtable-skuld. Future Code-prompten i Del H är redo som startpunkt för separat implementation.

### J2 — Valideringsutfall

| Test | Pass/Fail | Motivering |
|---|---|---|
| Airtable excellence | Pass | A1-A3 löser tre konkreta driftproblem från driftkartan: Inställt räknas inte längre som aktivt (C7/rapportering), mail partial-success blir synlig (C12/DQ8) och väntelistaflytt blir idempotent/kompenserbar (C13/DQ9). A4-A8 lägger dessutom kontrollerad cleanup för återkommande-semantik, case-dubletter, read models, tomma selects och Zapier-config. |
| Supabase readiness | Pass | Alla sex låsningar i 06b F4 hanteras utan Airtable-skuld-arv: namnlösa leads modelleras explicit, RIM3x blir read model, Återkommande-semantik separeras från historik, DQ4 blir integration config, G12/G13 får outbox/audit/transactional operation och DS6/DQ7/H4 ersätts av riktiga FK via `attendances`. |
| DS/DQ closure | Pass | Arbetsdokumentets §6 har 29/29 rader med Fas 2-princip, Fas 3-klass, Fas 4-åtgärd och Fas 5-migration ifyllda. Fas 6 closure är markerad som pass för samtliga rader. |
| Spårbarhets-test | Pass | Stickprov på 10 faktapåståenden fördelade över 04-07 gav 10/10 spårbara, 0 delvis spårbara och 0 ej spårbara. Källspår fanns via `docs/reference/data-model.md`, `docs/research/datamodell-research/02-live-state.md`, arbetsdokumentets besluts-/spårbarhetsrader och interna 04-07-referenser. |

### J3 — Hand-off till future Code-implementation

Future Code-implementation ska starta från Del H i detta dokument. Den pekar på fyra kärnfiler: `07-migration-plan.md`, `06a-airtable-redesign.md`, `06b-supabase-target.md` och arbetsdokumentet. Code behöver därmed inte läsa hela projektets historik innan första implementationen; `docs/reference/data-model.md` används bara när en konkret legacyfält-/flödesdetalj kräver det.

### J4 — Vad nästa session ska tänka på

- MK ska vara avslutat och driftläget stabilt innan Steg 2-3 genomförs.
- Supabase-projekt, staging-miljö, service-role credentials och RLS-testväg behöver finnas innan Steg 4.
- Marcus behöver ge explicit go per domän innan parallel run eller cutover.
- Stable keys och crosswalk ska behandlas som produktionskritiska migration artefakter, inte skriptdetaljer.
- Nya luckor under implementation flaggas som implementationfrågor; inga nya gap smygs in i den frusna designleveransen.
