---
id: TASK-201.12
title: 'Skiva: personId-extensionen i aktivitetsloggens statements'
status: To Do
assignee: []
created_date: '2026-08-12 20:11'
updated_date: '2026-08-12 20:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.4
parent_task_id: TASK-201
ordinal: 380000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: TASK-201.6 byggde navigeringsmekaniken 'klicka en aktivitetspost → gå till personen eller eventet' i AktivitetsHistorik.tsx, men person-halvan är strukturellt omöjlig att aktivera — ingen skiva emitterar någon person-identifierande extension i context.extensions. Denna skiva stänger gapet: en PERSON_ID_EXTENSION_IRI analog med TASK-201.4s EVENT_ID_EXTENSION_IRI, emitterad av varje mutation som har en GENUIN person i sitt sammanhang (aldrig ett tomt/påhittat värde när personen saknas — frånvaro är ett giltigt tillstånd).

Källmärkt bakgrund: TASK-201.6-agentens implementation notes (verbatim i sak): 'Person-navigering är INTE byggd alls: ingen mutation/statement-typ sätter någon person-identifierande extension ännu.' Marcus beslut 2026-08-12: 'Ordentligt är det enda som gäller' — gapet ska byggas bort, inte bokföras vidare.

Täcker användarberättelse 8 (PRD TASK-201): 'Som Lotta vill jag klicka på en post och komma till personen eller eventet det gällde, så att jag kan agera direkt på det jag hittar.'

KÄND DIVERGENS VID BYGGSTART (premiss-pass, källmärkt): TASK-201.6 (PR #1231) hade INTE landat på origin/main vid denna skivas basering (verifierat: git log origin/main visar 7e74c94b som senaste commit, gh pr view 1231 visar state OPEN, mergeStateStatus BLOCKED). AktivitetsHistorik.tsx existerar därmed INTE på denna skivas bas. Bygget genomförs mot den verkliga vyn OM 201.6 hunnit landa innan denna skiva slutförs (ff + bygg vidare, uppdragets egen fallback-instruktion); annars levereras schema+emission+läsväg fullt ut och vy-kopplingen bokförs öppet som extern-beroende skuld i implementation notes, aldrig tyst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PERSON_ID_EXTENSION_IRI definierad i src/domain/schemas/ActivityStatement.schema.ts, analog konstruktion med EVENT_ID_EXTENSION_IRI (TASK-201.4/201.5-mönstret), exporterad via index.ts-barreln
- [x] #2 recordActivity() bär personId villkorligt i context.extensions under rätt IRI-nyckel — bevisat i BÅDA riktningar (personId satt → buret; personId utelämnat → nyckeln saknas helt, aldrig tom sträng/undefined-värde)
- [x] #3 Mutationskatalogen VERIFIERAD mot faktisk kod (ADR-086: mät, anta inte) — varje mutation med en genuin person i sammanhanget emitterar personId, varje mutation utan person emitterar den INTE (ingen fabricerad IRI för en obefintlig konsument); utfallet per mutation redovisas explicit i implementation notes
- [x] #4 get-activity-log-EF:en verifierad att returnera extensionen oförändrad i statement-blobben — ändring görs ENDAST om mätning visar att den behövs, annars redovisas verifieringen öppet
- [x] #5 AktivitetsHistorik.tsx (TASK-201.6) kopplas till personId-navigeringen OM 201.6 landat på main innan denna skiva slutförs; annars bokförs kopplingen öppet som blockerad extern-beroende skuld (PR #1231), aldrig tyst bortglömd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRT (AC #1-4):

1. PERSON_ID_EXTENSION_IRI mintad i ActivityStatement.schema.ts, exakt samma
   konstruktion som EVENT_ID_EXTENSION_IRI (${XAPI_IRI_BASE}/extensions/personId),
   exporterad via index.ts-barreln.

2. recordActivity.ts fick ett nytt optionellt personId?: string-fält på
   RecordActivityInput, spreadat villkorligt i context.extensions — samma
   mönster som eventId. Bevisat i BÅDA riktningar + ett tredje
   samexistens-test (eventId+personId oberoende) i
   tests/api/record-activity.test.ts.

3. Mutationskatalogen (TASK-201.4s 11 filer, VERIFIERAD mot faktisk kod, inte
   antagen) gav 11 recordActivity-anropsplatser totalt. Uppdelning:

   EMITTERAR personId (9 anropsplatser):
   - registrationPayments.ts (useSetPaymentStatus): registration.personId ?? undefined
   - registrationConfirmation.ts (useSendConfirmationFromDetail): registration.personId ?? undefined
   - actionEmail.ts (useSendActionEmail): reg.personId ?? undefined (per mottagare i loopen)
   - receipts.ts (useSendReceipt): registration.personId ?? undefined
   - registrationLodging.ts (useSetBorOver): registration.personId ?? undefined
   - useCreateRegistration.ts: created.personId ?? undefined (EF-svarets Person-länk)
   - useCreatePersonNote.ts: personId (hook-param, alltid satt — objektet ÄR redan
     personen, extensionen emitteras ändå för UNIFORM vy-navigering, samma princip
     som event-objekt-statements redan använder för eventId)
   - useUpdatePersonFlag.ts: personId (hook-param, alltid satt, samma motiv)
   - useUpdatePersonNote.ts: personId (hook-param, alltid satt, samma motiv)

   EMITTERAR INTE personId (2 anropsplatser, explicit kommenterade i koden):
   - useCreateEventNote.ts: eventet är objektet, ingen genuin person
   - useUpdateEvent.ts: eventet är objektet, ingen genuin person

   Registration.personId är NULLABLE (domain/models/Registration.ts:56 —
   "personId: string | null", en anmälan kan sakna Person-länk). Samtliga
   sex registration-scopade anropsplatser använder ?? undefined — ingen
   fabricerad IRI när länken saknas, precis som AC kräver.

   useUpdatePaymentNote/useLogPaymentReminder (registrationPayments.ts) och
   useSendActionTestEmail (actionEmail.ts) anropar recordActivity ALDRIG
   alls (redan sant före denna skiva, oförändrat av den) — de ingår inte i
   PRDs nio loggade kategorier och rörs inte här.

4. get-activity-log/index.ts VERIFIERAD, INGEN ändring gjord: EF:en
   returnerar row.statement (hela JSONB-blobben, rad 248: statements:
   page.map((row) => row.statement)) OFÖRÄNDRAD per rad — context.extensions
   passerar därmed automatiskt igenom oavsett vilka nycklar den bär. Ingen
   personId-FILTER-parameter läggs till (ej efterfrågat av kortets AC,
   över-engineering-vakten: ingen konsument efterfrågar den ännu).

INTE GENOMFÖRT (AC #5) — KÄLLMÄRKT DIVERGENS, INTE TYST:

TASK-201.6 (PR #1231) hade INTE landat på origin/main vid varken byggstart
ELLER byggslut (verifierat två gånger: gh pr view 1231 visar state OPEN,
mergedAt null; git ls-remote origin main oförändrat på 7e74c94b).
AktivitetsHistorik.tsx existerar därmed INTE på denna gren — det finns ingen
vy-fil att koppla personId-navigeringen till.

Detta är samma koordinerings-skuld-form som EVENT_ID_EXTENSION_IRI själv
bar mellan TASK-201.3/201.5 och TASK-201.4 (läsväg/vy byggda före
skrivvägens emission) — bara i omvänd ordning (emission byggd före vyn).
Extensionen är nu LIVE i skarpa mutationer och kommer synas i riktiga
statements från och med denna PRs landning; den dag TASK-201.6 landar
behöver AktivitetsHistorik.tsx en liten, avgränsad uppföljning: en
aktivitetensPersonId()-motsvarighet till dess redan byggda
aktivitetensEventId(), som läser PERSON_ID_EXTENSION_IRI och länkar till
personens sida. Ingen ny mekanism — samma mönster, en ny nyckel.

Detta bokförs INTE tyst: orkestreraren äger uppföljningen (antingen ett nytt
litet kort, eller en direkt komplettering av 201.6-PR:en före den landar).

UPPFÖLJNING (AC #5) — 201.6 LANDADE UNDER BYGGET:

TASK-201.6 (PR #1231) mergade till main (430a8156, 2026-08-12T20:21:07Z)
medan denna skiva byggdes. Branchen rebasad mot uppdaterad origin/main;
AktivitetsHistorik.tsx fanns nu tillgänglig. AC #5 GENOMFÖRD:

- aktivitetensPersonId(statement) mintad i AktivitetsHistorik.tsx, EXAKT
  samma läsdisciplin som aktivitetensEventId (defensiv, .trim() !== "",
  aldrig en gissning).
- AktivitetsRad utökad med PRIORITETSORDNING: eventId FÖRE personId när
  båda finns på samma statement (t.ex. en betalningsrad efter denna PR
  bär båda) — bevarar NyaAnmalningarCard-precedentets "registrering →
  händelsens event"-mål OFÖRÄNDRAT för statement-typer som redan
  länkade dit. personId aktiverar navigering ENDAST för de tre
  statement-typer som aldrig hade ett eventId (person-flagga,
  person-anteckning skapa/uppdatera) — tidigare strukturellt olänkade,
  nu klickbara till /personer/$personId.
- aktivitetensEventId-docblocken uppdaterad (den gamla "person-navigering
  är INTE byggd"-satsen är nu falsk och borttagen).
- Test: tests/acceptance/mer-aktivitetshistorik.acceptance.test.ts fick
  statement()-helperns personId-parameter (samma opt-in-form som eventId)
  och ett nytt test som bevisar BÅDA riktningarna — personId-länk när
  eventId saknas, OCH att eventId vinner prioritetsordningen när båda
  finns (annars hade prioritets-assertionen fällt). 8/8 tester gröna
  lokalt (35.7s).

Kortets ursprungliga källmärkta divergens (201.6 ej landad vid byggstart)
kvarstår som ett FAKTUM i historiken ovan, men löstes UNDER samma
byggsession — AC #5 är därmed uppfylld i denna PR, inte uppskjuten.
<!-- SECTION:NOTES:END -->
