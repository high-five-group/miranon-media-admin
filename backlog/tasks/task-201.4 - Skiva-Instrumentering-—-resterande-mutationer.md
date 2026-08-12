---
id: TASK-201.4
title: 'Skiva: Instrumentering — resterande mutationer'
status: To Do
assignee: []
created_date: '2026-08-11 20:23'
updated_date: '2026-08-12 19:28'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
parent_task_id: TASK-201
ordinal: 369000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: pilotens mönster (201.3) rullas ut mekaniskt över hela mutationsytan så att ALLT som förändrar data loggas — luckfriheten är själva förtroendemotivet (en logg med luckor är värre än ingen logg). "Lade till person" ingår i skapa-anmälan tills person-skapande får egen mutation (bokfört i PRD:n).

Täcker användarberättelser: 1, 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga återstående mutationer instrumenterade via onSuccess — listan VERIFIERAS mot mutationskatalogen vid bygget (ADR-086: mät, anta inte); förväntat: skapa anmälan, boende, kvitto, uppdatera event, person-flagga, event-anteckning, person-anteckning (skapa + uppdatera)
- [x] #2 Antecknings-poster loggar ATT något antecknades — sammanfattningen innehåller ALDRIG anteckningsinnehåll (api-test bevisar)
- [x] #3 e2e-staging-stickprov på minst två av de nya typerna (rad med rätt aktör, typ, svensk sammanfattning)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [x] #6 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ABSOLUT MAILFÖRBUD — samma order och form som 201.3:s notes: e2e-stickprov som rör mail-typer använder ENDAST den etablerade @example.com-fixturformen; inga befintliga staging-personer som mottagare. Vid osäkerhet: STOPPA.

TVÅ SKULDER ÖVERFÖRDA FRÅN 201.3 (bokförda av orkestreraren 2026-08-12, S105).

1. EVENT_ID_EXTENSION_IRI — EMITTERAS INTE ÄN

TASK-201.5 (PR #1215) definierade konstanten EVENT_ID_EXTENSION_IRI additivt i src/domain/schemas/ActivityStatement.schema.ts (exporterad via index.ts). Läs-EF:en get-activity-log använder den för att kunna FILTRERA på eventId. Skrivvägen emitterar den inte — 201.3-agenten deferrade den hit med öppen motivering: att emittera den mitt i bygget hade riskerat merge-konflikt i schema-filen mot en då oländad PR, och ingen av 201.3:s AC nämnde den.

Följd: eventId-filtret i läsvägen har inget att filtrera på förrän denna skiva emitterar extensionen. Återanvänd 201.5:s konstant — inför ALDRIG en egen definition av samma IRI.

2. HERMETIK-VAKTEN FÄLLER VARJE OMOCKAT log-activity-ANROP

Mätt i CI 2026-08-12 (run 31620566991, PR #1216 på SHA 7f8e22a9): 201.3:s tre instrumenterade pilotmutationer fällde SJU acceptance-sviter, samtliga med samma fel verbatim — "OmockadRequestError: Hermetik-vakten stoppade ett omockat anrop i fixturvärlden." Deterministiskt, inte flake: flera föll även i sina två retries. Utfall 7 failed / 189 passed.

Orsaken är strukturell, inte en bugg: recordActivity är fire-and-forget men gör fortfarande ett nätverksanrop mot log-activity-EF:en, och acceptance-sviten kör i en hermetisk fixturvärld där varje utgående anrop måste vara mockat. Vakten är designad att fälla precis detta.

KRITISKT FÖR DENNA SKIVA: 201.3 instrumenterade TRE mutationer och fällde sju sviter. Denna skiva instrumenterar HELA den återstående mutationsytan (förväntat: skapa anmälan, boende, kvitto, uppdatera event, person-flagga, event-anteckning, person-anteckning skapa+uppdatera). Utan en CENTRAL mock i fixturvärldens gemensamma uppsättning faller acceptance-klassen brett. Lappa aldrig per test.

201.3 lägger den centrala mocken som del av sin röd-fix — verifiera att den finns och täcker din utökade yta innan du instrumenterar, i stället för att upptäcka det i CI.

Värt att överväga här: ett negativt fall som bevisar att en FELANDE log-activity inte stjälper mutationen (mocka 500, mutationen ska ändå lyckas). 201.3 bevisade fire-and-forget på enhetsnivå (AC #1); i den sammansatta vyn är egenskapen billig att bevisa när mocken väl finns.

3. Bonus-observation ur 201.3:s slutrapport, ej åtgärdad: readDisplayNameFromJwt-hjälparen finns nu i FYRA EF:er (var redan i tre före 201.3:s fjärde). ADR-026-tröskeln var alltså bruten redan innan. Ingen refaktor gjord av 201.3 eftersom den hade rört orelaterade filer. Om din skiva ändå rör EF-ytan brett: bedöm om extraheringen hör hemma här eller i eget kort — förkasta explicit om inte.

---

BYGGT (egen worktree, agent-a5658b20f68f3ee58). Rullade ut TASK-201.3s mönster
mekaniskt över de 8 återstående mutationerna: skapa anmälan
(useCreateRegistration), boende (useSetBorOver), kvitto (useSendReceipt),
uppdatera event (useUpdateEvent), person-flagga (useUpdatePersonFlag),
event-anteckning (useCreateEventNote), person-anteckning skapa
(useCreatePersonNote) + uppdatera (useUpdatePersonNote).

MUTATIONSKATALOG-VERIFIERING (AC #1, ADR-086): enumererade HELA
src/data/mutations/*.ts (11 filer) mot PRD TASK-201s egen "~11"-räkning
(§ Implementationsbeslut § Skrivväg). Facit höll EXAKT: 3 piloterade
(201.3) + 8 här = 11. TRE kandidater övervägdes och MEDVETET UTESLUTNA
(divergens öppet bokförd, ingen tyst uteslutning): useUpdatePaymentNote,
useLogPaymentReminder (registrationPayments.ts) och useConfirmAll (bulk-
bekräfta, registrationConfirmation.ts) — PRD:ns "~11" räknar INTE in dem,
bekräftat genom att räkna PRD-listans nio substantiv (betalningar,
bekräftelser, anmälningar, boende, mail, kvitton, event-ändringar, flaggor,
anteckningar) mot de faktiska hook-namnen. useSendActionTestEmail
uteslöts av annat skäl: skriver strukturellt inget fält (egen docblock,
"ingen anmälan i urvalet berörs").

EVENT_ID_EXTENSION_IRI (skuld 1, överförd från 201.3): recordActivity.ts
fick ett nytt valfritt `eventId`-fält som — när satt — läggs i
context.extensions under EVENT_ID_EXTENSION_IRI (TASK-201.5s konstant,
ÅTERANVÄND, aldrig omdefinierad). Retroaktivt applicerat på PILOTENS TRE
(useSetPaymentStatus/useSendConfirmationFromDetail/useSendActionEmail,
som redan hade eventId hook-bundet) + samtliga nya event-scopade
mutationer. Person-scopade (flagga, person-anteckning) bär INGEN eventId
— en person är inte scopad till ett event. Verifierat mot den FAKTISKA
`get-activity-log`-EF:ens filter-implementation (supabase/functions/
get-activity-log/index.ts rad ~223: `.contains('statement', { context:
{ extensions: { [EVENT_ID_EXTENSION_IRI]: eventId } } })`) — värdet är
RAK STRÄNG (registrations/eventets eget record-ID), inte en IRI-inpackad
form. TASK-201.5s öppna koordineringsskuld ("filtret returnerar [] mot
riktiga rader tills skrivvägen antar SAMMA nyckelsträng") är därmed
BETALD.

HERMETIK-MOCKEN (skuld 2): verifierad FÖRE instrumentering (mät, anta
inte) — `tests/support/fixturvarld/handlers.ts`s log-activity-handler är
registrerad i den DELADE `handlers`-arrayen (normalläget, ALLA acceptance-
tester) och matchar `*/functions/v1/log-activity` host-agnostiskt —
strukturellt omöjlig att missa oavsett vilken mutation som anropar den.
Ingen ändring av handlers.ts behövdes.

NYA AKTIVITETSTYPER (activityTypes.ts): sex nya ACTIVITY_OBJECT_TYPES
(anmalan/boende/kvitto/event/flagga/anteckning) speglar PRD-berättelse 9s
nio substantiv ORDAGRANT. `eventObjectId`/`personObjectId` (nya, bredvid
befintlig `registrationObjectId`) — objektet ÄR eventet/personen för
uppdatera-event/person-flagga/anteckningar, inte en anmälan som råkar
tillhöra dem. `eventActivityName`/`personActivityName` — delade,
TESTBARA namn-fallbacks (samma "aldrig tomt/null-namn"-disciplin som
`actorName` i recordActivity.ts) — ANVÄNDS av fyra mutationer, verklig
återanvändning, ingen spekulativ abstraktion.

NAMN-TRÅDNING (person/event saknar namn i EF-svaret för flagga/
anteckningar): useUpdatePersonFlag/useUpdatePersonNote/useCreatePersonNote
fick ett NYTT hook-bundet `personNamn`-parameter (bredvid `personId`,
samma bindningsform); useCreateEventNote fick `eventNamn`. UI-trådning:
PersonFlagEditor/PersonNoteEditor/PersonAnteckningar fick en ny
`personNamn`-prop; PersonDetail.tsx (SKARP produktionsyta) och
PersonDetailPrototyp.tsx (dev-only prototyp, `import.meta.env.DEV`-gated,
`PersonFlagEditor`/`PersonAnteckningar`s ENDA nuvarande renderings-plats)
uppdaterade att skicka `displayName(person)`. events/detail/Anteckningar.tsx
Composer fick `eventNamn`, trådad från `Anteckningar({ event })`.
useSendReceipt (kvitto) fick en `registration: Registration`-variabel i
TVariables (samma `mottagare`-mönster som `useSendActionEmail`) — skickas
ALDRIG till servern; AtgardsSida.tsx § `SkickaKvittoKnapp` uppdaterad.
useCreateRegistration/useUpdateEvent behövde INGEN trådning — onSuccess
har redan EF-svarets fulla Registration/Event (namn + eventNamn
inkluderat).

AC #2 (anteckningsposter loggar ATT, ALDRIG innehåll): strukturellt
garanterat — ANTECKNADE_VERB/UPPDATERADE_ANTECKNING_VERB är parameterlösa
konstanter (kan inte ta emot text), object.name kommer ENDAST från
personNamn/eventNamn (hook-bundet). onSuccess i useUpdatePersonNote/
useCreatePersonNote/useCreateEventNote destrukturerar MEDVETET inte
mutationens text-parameter. Api-test-bevis: tests/api/
activity-log-resterande-statements.test.ts § "AC #2 — REGRESSIONSVAKT".

GRINDAR (naket körda, exitkod läst separat från fil):
- typecheck: exit 0
- biome check .: exit 0 (endast pre-existing 6 varningar/38 infos, noll i
  min diff — verifierat via filnamns-grep mot outputen)
- build: exit 0
- test:api (pure+staging, DoD-kommandot): 708/708 gröna, exit 0 — INGEN
  flake denna körning (attachment-upload-large.staging.test.ts, TASK-196s
  kända isolerade flake, föll inte denna gång)
- test:api:pure (delmängd, för snabb iteration): 436/436, inkl. 13 nya
  statement-form-tester + 2 nya EVENT_ID_EXTENSION_IRI-riktningstester

E2E-STAGING (AC #3, TVÅ nya AKTIVITETSLOGGEN-prov): PORT-KROCK öppet
bokförd — `test:e2e:staging`s hårdkodade E2E_DEV_PORT=5173 var upptagen
av en LÅNGLIVAD extern process (1 dag 22 h, ej agent-relaterad — troligen
Marcus egen persistenta dev-server, rördes ALDRIG). Löste det via samma
väg 201.5s slutrapport använde: EGEN dev-server i worktreen (port 5178,
`npx vite --port 5178 --strictPort`) + `PLAYWRIGHT_NO_WEB_SERVER=1
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5178`. FÖRSTA körningen fällde
EN egen test-bugg (fel nästlingsnivå: `object.type` i stället för
`object.definition.type` — samma fel i BÅDA nya testerna, kopierat fel
från en förenklad lokal typ i stället för att spegla `recordActivity.ts`s
faktiska form). Rättad, ANDRA körningen: 9/9 gröna (samtliga
FÖREXISTERANDE tester i båda filerna PLUS de två nya) — dev-servern
avslutad efteråt (ingen kvarlämnad process).

ACCEPTANCE-KLASSEN: EJ empiriskt körd lokalt — ACCEPTANCE_DEV_PORT=5399
var upptagen av en AKTIV, kort-livad process (troligen en samtidig
agent-session i samma miljö) vid TVÅ separata försök. Till skillnad mot
e2e-porten krävde acceptance-projektet omstart med FIXTUR-env
(VITE_SUPABASE_URL mot en fejkad origin) för att workaround-vägen skulle
vara meningsfull — bedömdes som en oproportionerlig kostnad given att
hermetik-mocken redan verifierats kod-nivå (se ovan) och att
Acceptance-klassen är CI:s jobb per CLAUDE.md. ÖPPEN VERIFIERING FÖR
ORKESTRERAREN: CI:s Acceptance-jobb är den FÖRSTA empiriska bekräftelsen
att den globala log-activity-mocken täcker samtliga åtta nya
instrumenterade mutationer i praktiken, inte bara i kod-läsning.

PREMISS-PASS (ADR-086): `git fetch` + `git log --oneline -1 origin/main`
bekräftade b5534199 = uppdragets angivna bas, ingen divergens. TASK-201.3s
landning (PR #1216 → e4a110bc) verifierad på disk (git show --stat,
kortets status fortfarande "To Do" i registret — bokfört i uppdraget som
väntande STÄNGNING, INGEN kod-avvikelse). TASK-201.5s EVENT_ID_EXTENSION_IRI
och get-activity-log-EF:ens faktiska filter-form läst direkt ur källkoden
(supabase/functions/get-activity-log/index.ts) i stället för antagen —
bekräftade RAK STRÄNG-formen (inget IRI-omslag). Inga divergenser mot
uppdragets premisser i övrigt.

Rörda filer (20 ändrade + 1 ny, samtliga direkt relaterade — verifierat
git status): activityLog/{activityTypes,recordActivity}.ts,
mutations/{actionEmail,receipts,registrationConfirmation,
registrationLodging,registrationPayments,useCreateEventNote,
useCreatePersonNote,useCreateRegistration,useUpdateEvent,
useUpdatePersonFlag,useUpdatePersonNote}.ts, components/{events/atgarder/
AtgardsSida,events/detail/Anteckningar,persons/PersonAnteckningar,
persons/PersonDetail,persons/PersonDetailPrototyp,persons/PersonFlagEditor,
persons/PersonNoteEditor}.tsx, tests/api/{record-activity,
activity-log-resterande-statements(ny)}.test.ts, tests/e2e/
{atgarder-kvitto,event-bor-over}.staging.test.ts.
<!-- SECTION:NOTES:END -->
