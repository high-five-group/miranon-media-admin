---
id: TASK-214.1
title: >-
  Skiva: WRITE-enabling — allowlist-posten set-attendance-status +
  create-attendance-EF + API-testparet
status: Done
assignee: []
created_date: '2026-08-14 19:09'
updated_date: '2026-08-14 20:41'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-214
ordinal: 402000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skrivvägen för närvaro byggs och bevisas ände-till-ände i API-skarven, utan att någon UI-yta rörs: en Status-skrivning mot en befintlig Deltaganden-rad går genom den generiska update-record-EF:en via den nya allowlist-posten, och en saknad rad kan skapas atomärt av den nya create-attendance-EF:en (backup-vägen — rotorsaken läks i basen via 213.12). A8 äger Avstämt: appen skriver aldrig tidsstämpeln. Komplett förarbete med beslutstabell, färdig allowlist-rad, testpar och räcken: S90-förarbetets skarpa underlag (tasks/sessions/bilagor/s90-checkin-forarbete). Styrande: PRD task-214, S103 Del 15 (F2, F5), ADR-050/066/104. Täcker användarberättelser: 13, 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Allowlist-posten set-attendance-status finns (tabellen Deltaganden per namn, ENDAST fältet Status) och update-record accepterar en Status-skrivning mot en befintlig Deltaganden-rad i staging
- [x] #2 create-attendance-EF:en skapar en Deltaganden-rad atomärt med server-side-byggda fält (Anmälan-länk, Event-länk, Session, Status satt till Närvarande) enligt husets EF-mönster med auth och DENY/ALLOW-loggning — varje användning syns i loggen
- [x] #3 API-testparet grönt i staging: deny på Avstämt-skrivning, allow-toggle Närvarande/Ej avstämt verifierad via läsvägen, create-attendance-testet skapar och städar egna rader
- [x] #4 Testerna asserterar aldrig på Avstämt och rör aldrig historik- eller granskningsfixturer
- [x] #5 Attribuerings-noten dokumenterad i data-model-referensen: Registrerad av bokför teknisk skribent (lastModifiedBy) för app-skrivna rader (väg a, S103 Del 15 F5)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [x] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [x] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTATION NOTES (bygg-agent, 2026-08-14)

PREMISS-PASS (ADR-086) — utfall:
- Kortet task-214.1 + merge-commit 45070da1: BEKRÄFTAT på origin/main (git fetch + git log).
- S90-bilagan (tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md): filen finns, läst i sin helhet.
- "17 operationer i dag" (uppdragstexten): FEL, DIVERGENS. Räknat mot disk (grep) = 18 operationer i field-allowlists.ts, noll rör Deltaganden (den delen av premissen höll). Blockerar inte — bokfört, byggde inte vidare på talet 17.
- set-attendance-status allowlist-raden: S90:s FÄRDIGA kodrad live-verifierad ordagrant mot describe_table (staging apphjj8Q7lkXCMsL4, tbldWHH6sSHWoQPHH) 2026-08-14 — Status/fldRFOzNqVswqZ1mN, Avstämt/fld61tbzc2fqqf116, Anmälan/fldwQdDpRK8vByNhb, Event/fldaj5mbpU3yPw2np, Registrerad av/fldhx3tludhu1gH7w (lastModifiedBy) — alla exakt som S90 påstod.
- KRITISK DIVERGENS: "Komplett förarbete med ... testpar-spec och räcken" i S90-bilagan gäller ENDAST set-attendance-status (AC1+halva AC3/4). Grep-verifierat: 0 träffar på "create-attendance" i hela S90-filen — den predaterar PRD:ns CREATE-backup-idé helt. create-attendance-EF:en och dess test är därför designade av mig från grunden mot PRD task-214 § Implementationsbeslut, inte kopierade ur ett färdigt facit. Se motivering i supabase/functions/create-attendance/index.ts och tests/api/create-attendance.staging.test.ts filhuvuden.

DESIGNBESLUT (mitt, utanför S90:s spec — rapporteras explicit):
1. create-attendance-EF:en är IDEMPOTENT (kollar om Anmälan redan har en Deltagande-rad för samma Session innan den skapar; returnerar 200 created:false på en dubblett i stället för att skapa en andra rad). Motiv: (a) verklig produktionsrisk — dubbel-tryck vid dörren ska aldrig ge två Deltaganden-rader, (b) gör create-attendance-testet säkert att köra upprepade gånger mot en PERMANENT fixtur utan sentinel+purge-infrastruktur.
2. Sentinel+purge (ADR-060, husets normala create-EF-testmönster) an vändes INTE för create-attendance-testet. Skäl: Deltagandens allowlistade write-fält (Anmälan/Event/Session/Status) har INGET fritext-fält en purge-policy-target kan exakt-matcha mot, och en sentinel-Anmälan/-Event skulle EFTER purge lämna en tyst ackumulerande orphan-Deltagande (exakt den bugklass ADR-060 § Updates 2026-07-06/07-19 två gånger redan kostat CI-röda). Idempotens sidesteppar hela problemet. Full motivering i testfilens huvud.
3. NYA PERMANENTA staging-fixturer seedade via Airtable MCP (samma konvention som ARBETSKO/BELAGGNING-fixturerna, EGET event så inga andra fixturers räkningar rörs): CHECKIN_EVENT_ID=recPwJEj88Hj8C2gU (Ort='ZZ-Checkin-fixtur'), CHECKIN_ANMALAN_A_ID=recCwbFpUBq45xbzA (bär CHECKIN_DELTAGANDE_A_ID=recei18YBOSWZMQqr, Status='Ej avstämt' baseline — set-attendance-status-toggle), CHECKIN_ANMALAN_B_ID=reckGJUD3Odd0azRQ (medvetet UTAN Deltagande-rad — create-attendance "saknad rad"-scenariot). STÄDA INTE.
4. Sidofynd, redan känt (data-model.md §Kända fällor 23 / airtable-constraints.md P8, INTE en ny upptäckt av mig): Deltagandens RECORD_ID({Anmälan})/RECORD_ID({Event})-formelfält är trasiga (returnerar radens EGET ID). create-attendance:s idempotent-koll läser därför Anmälans "Deltaganden"-reverslänk (fldgKGmudjmdD6eQJ) + record-ID-batch, ALDRIG de trasiga formelfälten — samma mönster get-attendance/get-registrations redan använder.

DEPLOY: create-attendance + update-record (konsumerar den ändrade field-allowlists.ts) redeployade till staging (pqtshyierkdgwdnxuirz) INNAN testkörning. [functions.create-attendance] tillagd i supabase/config.toml (verify_jwt=true), MEDVETET UTELÄMNAD ur .prod-functions-allowlist.conf — ingen UI-yta konsumerar den ännu (task-214.2 är nästa skiva).

DoD #5/#6/#9 (ariaSnapshot/bevis-loop-skärmdump/kvittensfönster) är INTE TILLÄMPLIGA på denna skiva — den rör ENDAST API-skarven, ingen UI-yta ("utan att någon UI-yta rörs", kortets egen beskrivning). Dessa DoD-punkter verkar vara ärvda oförändrade ur PRD-kortets DoD-mall och passar form-skivorna (214.2/214.3), inte denna. Flaggat, inte tyst ignorerat — orkestreraren avgör om DoD-mallen bör differentieras per skiva-typ.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad av bygg-agent (Sonnet) 2026-08-14, PR #1299, merge ecd444e5, via merge-kön med gröna grindar per jobb. AC 1–5 avbockade i agentens commit 7a66316b. Faktiskt mätta grindar: test:api 739/739 (inkl 11 nya check-in-tester), typecheck 0, biome 0, build grön, check:docs 14/14. Två divergenser öppet bokförda av agenten: (a) allowlist-registret bar 18 operationer, inte uppdragets 17; (b) S90-förarbetet täckte ENDAST set-attendance-status — create-attendance-EF:en designades av agenten mot PRD:t: idempotent (reverslänk-lookup, 200 created:false på dubblett), medvetet UTAN sentinel/purge (Deltaganden saknar purge-bart fritextfält; motivering i testfilens huvud). Tre permanenta CHECKIN_*-staging-fixturer seedade. DoD 5/6/9 (ariaSnapshot, bevis-loop, kvittensfönster) är N/A på denna rent API-scopade skiva — belagt här, inte tyst; process-fyndet att DoD-mallen kunde differentieras per skiva-typ noteras i sessionshandoffen. Stängd av orkestreraren efter landningsverifikat mot origin/main.
<!-- SECTION:FINAL_SUMMARY:END -->
