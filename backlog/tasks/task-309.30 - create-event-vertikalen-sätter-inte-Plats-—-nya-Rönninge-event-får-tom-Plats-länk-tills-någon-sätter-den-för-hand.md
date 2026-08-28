---
id: TASK-309.30
title: >-
  create-event-vertikalen sätter inte Plats — nya Rönninge-event får tom
  Plats-länk tills någon sätter den för hand
status: To Do
assignee: []
created_date: '2026-08-26 05:02'
updated_date: '2026-08-28 03:28'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 596000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Öppen kant ur Plats-backfillen 2026-08-26 (S108 Del 24 § B, data-model § Prod-ID:n): alla 27 befintliga Rönninge-event fick Plats → recZc1EMWMYw5KADo (prod) på Marcus GO, men create-event (ADR-066-vertikalen, supabase/functions/create-event + klientens CreateEventForm) känner inte till Plats-fältet (fött 2026-08-24, ADR-125 § 2). Nästa event Lotta skapar i appen med Ort = Rönninge får tom Plats → bilagans adress-/parkerings-/transport-/klädblock faller tillbaka på TOMT i stället för Rönninges standard, och hon måste sätta platsen för hand (var? — verifiera om genereringsvyn ens bär en platsväljare; om inte finns ingen väg utom Airtable-UI:t).

DESIGNFRÅGA (avgör med research, bokför): (a) create-event slår upp Platser på Namn = Ort och länkar automatiskt när exakt en träff finns (härledning, inte länk-krav — samma anda som Eventinnehåll-uppslaget 'Event × Typ, ingen länk', ADR-125 § 2); (b) klienten får en platsväljare i CreateEventForm (formändring — Marcus); (c) båda. Rekommendation att pröva: (a) som golv nu (noll formändring, täcker Rönninge-fallet som är ~alla event), (b) som eget kort om Marcus vill. Datakällans kontrakt: data-model.md § Eventplanering (fält-ID:n prod fldaVV1KS6skbOLrB / staging fld8OmPGNgEYZ8eER); staging först via API-test (api-staging), prod-deploy via fas4-prod-deploy.sh (Marcus). Skydd: aldrig skriva över en redan satt Plats; ingen träff eller flera träffar → lämna tomt och logga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Beslut (a)/(b)/(c) bokfört med research-källa; om (a): create-event länkar Plats när exakt en Platser-rad matchar Ort, aldrig annars, aldrig över befintlig länk — staging-API-test i båda riktningar (träff → länk; ingen/flera träffar → tom + loggrad)
- [x] #2 data-model.md § Eventplanering + ADR-066/ADR-125 § Updates bär beteendet; prosa och kod säger samma sak
- [x] #3 Klientens skapa-event-flöde oförändrat i form (ingen ny kontroll) om (a) valdes; annars formändringen som eget kort för Marcus
- [x] #4 Prod-deploy bokförd som Marcus-moment; staging-EF:en deployad och UPDATED_AT verifierad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VÄGVAL: (a) — härledning, ingen formändring. create-event slår upp Platser på Namn = Ort och länkar vid EXAKT en träff. Källa: ADR-125 § 2 ("uppslag, inte länk" för Event × Typ) + ADR-066 b6 (Månad/år härleds server-side ur Startdatum) — samma härlednings-anda tillämpad på Plats-länken. (b)/(c) (platsväljare i CreateEventForm) EJ byggt: bokfört som EGET-KORT-KANDIDAT för Marcus-beslut. Argumentet för ett eget kort: (a) täcker Rönninge-fallet som i praktiken är alla event, medan en formkontroll rör den skarpa skapa-vyn Lotta använder på söndag och därför förtjänar ett eget beslut.

EXAKT EN TRÄFF — verifierat, inte antaget: Platser.Namn är singleLineText-primärfält (staging fldSDJcY7cb4dam3Y, describe_table 2026-08-28) och Airtable kan strukturellt inte tvinga unikhet på det. TVÅ rader med samma Namn skapades utan invändning i staging (ZZ-plats-dubblett-fixtur, rec1bMcnYvgAYeO6d + rec3XSjtWhbK3PRXF). Regeln vilar alltså på ett mätt bastillstånd, inte på en hypotes.

ORDNINGS-INVARIANTEN: Plats läggs ALDRIG i upsertens fields-map — den skrivs i en separat PATCH efter upserten, och bara när raden saknar länk. En upsert som bar fältet hade vid idempotent replay kunnat skriva över en Plats som satts för hand.

GRINDAR (mätta exitkoder): npm run typecheck 0 · npx @biomejs/biome check . 0 · npm run build 0 · npm run check:docs 0 (14/14 gröna) · node scripts/check-langa-streck.mjs 0 · node scripts/test-purge-staging-sentinels.mjs 0 · api-pure plats-uppslag 9/9 · api-staging create-event 15/15 (4 nya ORT-TILL-PLATS-tester).

STAGING-DEPLOY: supabase functions deploy create-event --project-ref pqtshyierkdgwdnxuirz (CLI 2.115.0, pinnad per .supabase-cli-policy.conf). VERSION 25 -> 26, UPDATED_AT 1787715796703 -> 1787886483740 = 2026-08-28T03:08:03.740Z. Verifierat via functions list EFTER deployen.

AC #4 PROD-MOMENTET (MARCUS): prod-EF-deployen av create-event är INTE gjord av mig och ska inte vara det. Formen, i Marcus egen terminal eller via !-prefixet:
    bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref>
    bash scripts/fas4-prod-deploy.sh --deploya <prod-ref>
Verifiera UPDATED_AT (inte VERSION — en deploy bumpar VERSION på alla funktioner). create-event står redan i .prod-functions-allowlist.conf rad 17. Ingen schema-förutsättning återstår: prod-fältet Plats (fldaVV1KS6skbOLrB) finns sedan 2026-08-24, till skillnad mot hur Idempotensnyckel och publiceringsflaggan låg till när de tillkom.

UPPDRAGS-DIVERGENS (premiss-passet): uppdraget angav staging-deployen som "--project-ref apphjj8Q7lkXCMsL4". Det är AIRTABLE-BASENS id, inte Supabase-projektrefen. Rätt staging-ref är pqtshyierkdgwdnxuirz (.env.staging VITE_SUPABASE_URL + .prod-ref-policy.conf PROD_REF_STAGING). Deployen kördes mot den riktiga refen.

OVÄNTAT, EJ RÖRT AV DENNA PR (ADR-053-triage: blockerar ej, värdefullt -> rapporterat): npm run test:api ger 4 röda som är helt oberoende av detta kort. Deras testfiler och EF-källor är byte-identiska med origin/main (git diff origin/main --stat = tomt), och get-document-sources fäller likadant ISOLERAT utan att create-event ens anropas. Tre av dem är staging-SEED-drift efter S108:s förlage-paritetsarbete som inte följdes av uppdaterade förväntningar i testerna: get-document-sources dag2-agenda förväntar 10 rader, staging bär nu 16 (mätt via list_records, Ordning 1-16, äkta innehåll — 10 + de sex agendapunkter CLAUDE.md § Bilagemallarnas FÖRLAGOR beskriver som tidigare missade); get-document-sources Beskrivning förväntar oformaterad text, staging bär nu markdown-fetstil (commit 8cf5479c fix/task-309-27-fetstil); generate-event-attachment preview-läge räknar 37 Bilagor-rader mot förväntat 36. Den fjärde (attachment-upload-large) är ett 30 s test-timeout på ett nätverksanrop, alltså transient.
<!-- SECTION:NOTES:END -->
