---
id: TASK-147.5
title: 'Skiva: Bilage-bärande sändvägen + bilageväljaren skarp'
status: Done
assignee: []
created_date: '2026-08-10 07:01'
updated_date: '2026-08-10 18:15'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.1
  - TASK-146.4
  - TASK-146.5
parent_task_id: TASK-147
priority: high
ordinal: 342000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den andra sändgrenen: loopad singelsändning med deterministisk idempotensnyckel per mottagare — omkörning av en delvis fallen körning dubblerar aldrig. Bilageväljaren kopplas från stubb till verkligt fundament (146.4 adapter/uppladdning + 146.5 event-mallad generering): klass A (uppladdad) och klass B (event-mallad) sändbara. Ingen förvals-logik — beteendet lever redan i koden och bevaras. Kortets viktigaste testbeslut: bilagan bevisas FRAMME hos mottagaren ände-till-ände, inte via kontraktstest — det var så den tysta batch-bristen kunde vara tyst (PRD § Implementationsbeslut + AtgardsSida.tsx BILAGOR-docblocken: klass C ger grenen samma svar).

Täcker användarberättelser: 7, 8, 25.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Utskick med vald bilaga går via singelloop-grenen; utskick utan bilaga fortsatt via batchgrenen — grenvalet automatiskt
- [x] #2 Bilagan bevisad FRAMME i mottaget mail ände-till-ände (staging/testmottagare)
- [x] #3 Idempotensnyckeln deterministisk per mottagare: omkörning dubblerar ingen
- [x] #4 Ingen bilaga förvald (grillad samsyn beslut 5 — bevarat beteende, verifierat)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done S102 batch (13). Branch task/147-5-bilage-sandvagen.

AC-status (matt): AC1 (grenval automatiskt) CHECKAD - bevisad server-sidan (runActionSend grenar pa attachments.length>0, api-pure tester) OCH klient-sidan (ny acceptance-test: vald bilaga ger attachmentIds i POST-kroppen, ingen vald ger tom lista). AC2 (bilagan bevisad FRAMME i mottaget mail) EJ CHECKAD - strukturellt blockerad pre-merge: send-action-email ar staging-deployad i 147.1-147.3/147.10-skicket, MINA andringar (attachment-grenen + ny EF get-event-attachments) ar INTE deployade. Deploy sker manuellt av orkestreraren efter merge (ADR-050) - samma ingen-deploy-denna-landning-grans 147.1 sjalv drog for hela HTTP/staging-lagret. DEPLOY-SKULD: efter redeploy, kor ett skarpt utskick med Resend-testadress + riktig bilaga, verifiera mottagen bilaga. AC3 (idempotensnyckel deterministisk per mottagare) CHECKAD - format jobId/actionType/registrationId, api-pure-bevisad stabil vid omkorning. AC4 (ingen bilaga forvald) CHECKAD - client useState(new Set()), ny acceptance-test verifierar not.toBeChecked() pa riktiga mockade bilagor, negativ kontroll kord (tvingad preselection gav rott, aterstallt).

EF-andring JA: send-action-email (ny bilage-barande gren), NY EF get-event-attachments, samt upload-attachment/finalize-attachment-upload/generate-event-attachment (skriver nu additivt Lagringsnyckel-faltet). Deploya INTE sjalv. supabase/config.toml uppdaterad (ny get-event-attachments-post + en saknad send-action-email-post fran 147.1 fylld i).

Schema-andring (staging, redan LIVE via Airtable MCP, INTE via script eftersom AIRTABLE_SCHEMA_TOKEN saknas lokalt): additivt falt Lagringsnyckel (singleLineText) pa Bilagor (tblFamrna53MVf1nG, fldRw08hcRyKit3qF). Motiv EMPIRISKT bekraftat: staging bar sex Bilagor-rader for SAMMA event med IDENTISKT Namn (upprepad klass B-generering) - en filnamns-baserad storage.list()-matchning ar strukturellt tvetydig utan denna nyckel. scripts/create-bilagor-table.mjs uppdaterad som deklarativ hemvist (dess egen pure-test-svit, 26 gröna, opaverkad). Faltet ar SERVER-INTERNT, exponeras aldrig i mapAttachmentRecord/klient-domanen.

Grindutfall: typecheck gron, biome gron (0 fel, varningar/infos enbart i orörda filer), build gron, test:api api-pure 345/345 grona (18 nya for attachment-grenen). api-staging BLOCKERAD av kravStagingLedigt-preflighten (TASK-77, en post-merge.yml-korning holl staging live) - respekterad, ALDRIG override:ad. Statiskt verifierat: ingen befintlig staging-test gor exact-equality pa record.fields som skulle fallas av det additiva faltet. Acceptance 10/10 befintliga grona (ingen regression) + 4/4 nya. Visual/aria/axe 20/20 pa bade visual-desktop och visual-mobile, NOLL aria-diff pa facit-lasta granskning-yta/mottagar-kort. verify:ci-parity EJ kord (diagnosverktyg, ej rutin).

Fynd: (1) PrototypNot-textens tva stale pastaenden rattade i samma commit (billigt, samma fil). (2) Bilagor-tabellen HELT odokumenterad i data-model.md sedan 146.2-146.5 - utanfor detta korts scope, flaggat for orkestreraren. (3) send-action-email saknade config.toml-post sedan 147.1 - fylld i. (4) Klass C (kvitto) strukturellt franvarande ur valjaren, TASK-147.7 ager fragan.

Modell-identitet: Sonnet 5 (claude-sonnet-5).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Done S102 batch ⑬: PR #1128 (merge c55e8fb2) + em-dash-fix 1aea42d2. AC #2/DoD #5 FRAMME-bevisad 2026-08-10 varv 3: mail b1e1b27b-e579-4c39-960d-f0a0cc8b7ea1 till delivered@resend.dev, bilaga 'Deltagarinformation – ZZ-create-event-test – ....pdf' 1298 bytes, nedladdad+verifierad %PDF-1.7; idempotens skarp (2 anrop → 1 mail). Vägen krävde två fix-vågor: ref-incidenten (S102 Del 4) + Event-fältnamnsbuggen (147.1-arv, fixad PR #1134/69c17f40 med tvåsidigt regressionsbevis). CI grön per jobb på PR:en. Bifynd bokfört: attachment saknar explicit content-type (application/octet-stream) — eget kort.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Bilagan bevisad ände-till-ände FRAMME hos mottagaren (PRD DoD 5-arv)
<!-- DOD:END -->
