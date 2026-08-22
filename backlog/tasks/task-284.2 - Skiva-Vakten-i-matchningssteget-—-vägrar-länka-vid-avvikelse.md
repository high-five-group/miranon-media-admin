---
id: TASK-284.2
title: 'Skiva: Vakten i matchningssteget — vägrar länka vid avvikelse'
status: Done
assignee: []
created_date: '2026-08-21 10:59'
updated_date: '2026-08-22 10:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-284.1
parent_task_id: TASK-284
ordinal: 517000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BETEENDE ÄNDE TILL ÄNDE: en ny anmälan kommer in. Går dess uppgifter ihop med det event nyckeln pekar på, länkas den som förut och allt nedströms fungerar oförändrat. Går de inte ihop, länkas den INTE — den blir liggande utan event, syns omedelbart i appen som en anmälan utan event, och inga följdposter skapas på ett event den kanske inte hör till.

FAIL-CLOSED ÄR HELA POÄNGEN: kraschar skriptet, eller körs det inte alls, blir eventlänken tom — samma utfall som en medveten fällning. Det finns inget felläge där en felkopplad anmälan slinker igenom för att vakten inte kördes. Den egenskapen förutsätter ERSÄTTNINGSFORMEN i AC 1; en vakt som läggs FÖRE den befintliga kopplingen har motsatt egenskap.

MÄTT UNDERLAG (live 2026-08-21): matchningssteget kopplar OVILLKORLIGT — vid noll träffar skriver det en tom lista, inte ingenting. Det finns alltså inget villkorssteg att haka i, vilket är varför ersättning är enda vägen.

STAGING-BYGGE (omklassad 2026-08-21, Marcus GO — ersätter den tidigare PROD-WRITE-raden): automations-ändringen görs i staging-basen apphjj8Q7lkXCMsL4, där A1 bär samma ID som i prod (wflDCKPAv2P6Yu9U6). Prod rörs aldrig av denna skiva, därför ready-for-agent; utrullningen är utbruten till TASK-284.6. Detaljerna står i Implementation Notes.

Täcker användarberättelser: 1, 11, 12, 13, 14, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptsteget ERSÄTTER de två befintliga stegen (sökningen och kopplingen). Det läggs ALDRIG före en kvarvarande ovillkorlig koppling — den formen är mätt fail-open: kopplingen körs även när sökningen gav noll träffar, så ett kraschat valideringssteg före den släpper igenom en felkopplad anmälan
- [x] #2 En anmälan vars uppgifter avviker från det tilltänkta eventet får INGEN eventlänk — fältet lämnas tomt, inget partiellt tillstånd
- [x] #3 En anmälan vars uppgifter stämmer länkas precis som förut — inga regressioner i normalflödet
- [x] #4 En eventnyckel utan prefix normaliseras före jämförelsen, och jämförelsen avgör därefter
- [x] #5 Expressflödets gren är opåverkad: villkoret är att eventnyckeln är TOM och datum-och-ort-fältet ifyllt (mätt live 2026-08-21 — dokumentationens påstående om noll träffar är falsifierat)
- [x] #6 En rad skrivs i Error-log vid fällning — som spår, aldrig som enda spår: den tomma eventlänken är den bärande signalen
- [x] #7 Skriptets kod är incheckad i repot som källa, även om datakällan kör sin egen kopia
- [x] #8 Inga deltaganden skapas för en anmälan som inte kunde länkas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OMKLASSAD 2026-08-21 (Marcus GO): skivan byggs och verifieras mot STAGING-basen apphjj8Q7lkXCMsL4 — inte prod. Prod-utrullningen är utbruten till TASK-284.6.

A1 har SAMMA automation-ID i staging som i prod (wflDCKPAv2P6Yu9U6), men står deploymentStatus: undeployed där. Marcus GO finns för att deploya den i staging så att kedjan kan provas ände-till-ände. Kom ihåg att det ändrar en DELAD testmiljö — andra sessioners tester läser samma bas.

AC 1 ÄR DEN BÄRANDE OCH FÅR INTE MJUKAS UPP. Det befintliga kopplingssteget (wacXLk4YN5AzohqCn, updateRecord) körs OVILLKORLIGT — vid noll träffar skriver det en tom lista. Läggs valideringen FÖRE det steget körs kopplingen ändå när valideringen fallerar, och vakten blir fail-OPEN: exakt motsatsen till ADR-122:s bärande egenskap. Skriptsteget måste ERSÄTTA både findRecords (wacDkQMtkfCRwDYxK) och updateRecord (wacXLk4YN5AzohqCn).

Expressgrenens villkor (mätt live, falsifierar schema_reference som säger 'noll träffar'): EventKey isEmpty AND 'Datum och ort' isNotEmpty. Rör den inte.

=== VERKSTÄLLD 2026-08-22 (S110 resume 3) ===

VERKTYGSGRÄNSEN SOM BLOCKERADE SKIVAN ÄR BEKRÄFTAD, INTE KRINGGÅNGEN (T167). MCP-ytan kan varken SKAPA eller UPPDATERA en customScript-nod — mätt i båda formerna, den andra med bevarad nod-key. Airtables svar ordagrant: "This automation contains a read-only node (customScript) that cannot be edited through the API. Edit this automation in the Airtable UI instead." Marcus klistrade därför in skriptet och satte input-variabeln anmId i UI:t; A1 står nu deployed i staging.

FÄLLA VÄRD ATT MINNAS: input-variabler för ett skript-steg VISAS i Properties-panelen men SKAPAS i kod-editorn bakom "Edit code". Saknas de ser panelen ut som om funktionen inte fanns. Variabelnamnet är dessutom skiftlägeskänsligt — anmID (stort D) gav samma "Missing anmId"-krasch som ingen variabel alls.

ÄNDE-TILL-ÄNDE MOT STAGING, sex fall skapade via API med A1 påslagen, samtliga städade efteråt:
  A rätt uppgifter + alla tre formateringsklasserna → LÄNKAD, Eventmatchning OK, ingen Error-log (AC 3)
  B fel år 2025 mot facit 2026            → EJ länkad, Error-log visar ort och kurs LIKA, bara året skiljer (AC 2, 6 + T168)
  C fel ort                                → EJ länkad, Error-log (AC 2, 6)
  D okänd EventKey                         → EJ länkad, Error-log "ingen träff" (AC 6)
  E express, tom EventKey OCH tomt Datum   → skriptet TEG helt (noll Error-log), express-grenen länkade (AC 5)
  F EventKey "8755" utan prefix            → normaliserad till Event-8755, LÄNKAD (AC 4)

AC 1 verifierad mot A1:s faktiska konfiguration: wacDkQMtkfCRwDYxK och wacXLk4YN5AzohqCn finns inte längre; skriptnoden ligger FÖRE conditionalGroup — Airtable avvisar strukturellt en nod efter en villkorsgrupp (mätt: nodeAfterDecisionGroup).

AC 8 ÄR STRUKTURELLT BEVISAT, INTE KÖRNINGSBEVISAT — och det sägs ut. A3 (Förskapa deltaganden) är AVSTÄNGD i staging, liksom alla automationer utom A1, så inget körningsbevis kunde tas. A3:s trigger kräver dock Event isNotEmpty (läst live ur dess filtersObj), så en anmälan utan eventlänk uppfyller aldrig dess villkor. Garantin ligger i A3:s eget villkor, inte i denna skivas kod.

MÄTGRÄNS ATT BÄRA VIDARE TILL 284.5/284.6: eftersom bara A1 är påslagen i staging mäter passet A1 ISOLERAT, inte kedjan A1→A2→A3 som den ser ut i prod.

T168-REGRESSIONEN, öppet bokförd: rättningens första form extraherade årtalet som egen axel. Korrekt i JavaScript, fel som formel — Airtables AND() kortsluter inte, och REGEX_EXTRACT utan träff ger fel i stället för blank, vilket gav #ERROR! på VARJE rad med Event-länk och tomt Datum (mätt på befintlig staging-data). Riven samma dag och ersatt med kollaps-i-normaliseringen, som inte kan fela. Full historik i T168.

=== STÄNGD 2026-08-22 ===
Landad i #1722, merge-commit e885fb6b. Post-merge grön på ALLA fyra runs
(CI, Post-merge, Push on main, CI) — DoD 3 verifierad per jobb, inte antagen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
BLOCKERAD PÅ KÄRNAN (AC1): den levande A1-automationen kunde INTE ändras. Endast AC7 (repo-källa) är uppnått — AC1–6 och AC8 kvarstår omärkta, med skäl nedan. Detta avviker från uppdraget och rapporteras öppet i stället för att mjukas upp.

VAD SOM HÄNDE: update_automation mot wflDCKPAv2P6Yu9U6 (apphjj8Q7lkXCMsL4, verifierad undeployed FÖRE varje ändring) avvisades med isValid:false, node "vaktEventmatchningA1", message "readOnlyNodeType", providedNodeType "customScript" — den customScript-nodtyp AC1 kräver är READ-ONLY i hela mcp__claude_ai_Airtable-ytan (bekräftat: typen "customScript" saknas helt i get_create_automation_instructions kuraterade lista, "available but not yet fully supported"-katalog OCH "exists but not creatable here"-listan — strukturellt exkluderad från write-ytan, inte en dokumentationslucka). Ingen skrivning skedde (tool-kontraktet: "if isValid is false, nothing was saved") — verifierat: get_automation efter försöket är BYTE-IDENTISK med före-läget. A1 lämnas i exakt samma skick jag fann den: deploymentStatus undeployed, ursprungliga findRecords (wacDkQMtkfCRwDYxK) + updateRecord (wacXLk4YN5AzohqCn) + conditionalGroup (wded6gggP5Gk0qSa9) orörda.

DETTA ÄR EN VERKTYGSGRÄNS, INTE ETT DESIGNVAL: ingen deklarativ ersättningsarkitektur (formelfält + conditionalGroup i stället för skript) har prövats — det vore ett arkitekturbeslut som river ADR-122 beslut 6 (vaktens hemvist är A1-skriptet) och ligger utanför mandatet att fatta ensidigt.

VAD SOM ÄR GJORT OCH VERIFIERAT:
1. Skriptet docs/reference/automation-scripts/a1-eventmatchning-vakt.js är skrivet, incheckat (AC7) och biome-rent. Det ERSÄTTER findRecords+updateRecord i sin design, normaliserar EventKey (AC4), jämför tre axlar (Ort/Kurs/Datum) med SAMMA normalisering som Eventmatchning-formeln (fldYz2NRZJjyX8VWB, TASK-284.1) portad verbatim, skriver Error-log vid fällning (AC6), lämnar tom nyckel (expressraden) helt orörd (AC5), och länkar aldrig partiellt (AC2/AC8 följer strukturellt).
2. Logiken är verifierad OFFLINE (Node vm-sandbox som kör den literala filen mot en Airtable Scripting-shim, ingen omimplementation) mot LIVE-hämtade fält från de permanenta TASK-284.1-fixturerna (Event-8755/8756, ZZ-TASK-284.1 Fixtur OK/Avviker/Backfill) plus två syntetiska kanter (ingen match, tom EventKey). Alla sex scenarier gav förväntat utfall. Detta bevisar att SKRIPTET är korrekt; det bevisar inte att A1 kör det, eftersom A1 aldrig kunde uppdateras.
3. FÄLT-ID-DIVERGENS UPPTÄCKT (premiss-pass): ADR-122 §Fynd1 / kortets Implementation Notes anger PROD-fältID:n för "Ort (from Event)" (fld5560T3pQZSUBaJ) och "Kurs (from Event)" (fldfqU6MfBQdaeLUk). Ingen av dem finns i STAGING (apphjj8Q7lkXCMsL4) — get_table_schema gav tomt svar för båda. Staging bär motsvarande fält under andra ID:n (fldUhHceqBud4BHvf / fldcTDSzGBG0bHjl3). Skriptet läser fälten via NAMN, så divergensen påverkar inte körningen — men den är bokförd i skriptets header och här.

REKOMMENDATION: enda kvarvarande vägen att få vakten LIVE i staging är att en människa (eller ett verktyg med UI-åtkomst) klistrar in exakt docs/reference/automation-scripts/a1-eventmatchning-vakt.js i ett nytt "Run a script"-steg i Airtable-UI:t, tar bort de två gamla stegen (wacDkQMtkfCRwDYxK, wacXLk4YN5AzohqCn), lämnar conditionalGroup (wded6gggP5Gk0qSa9) orörd, och deployar. Ingen ny automation skapades, ingen deploy skedde, inga records i staging rördes av mig.

AC-STATUS: AC7 avbockad (repo-källa, literalt uppfyllt). AC1–6, AC8 EJ avbockade — de beskriver den levande automationens beteende, som är oförändrad. DoD: #2 och #4 avbockade (grindar gröna på den rörda fil-klassen; path-scopad diff). #1 EJ avbockad (kräver alla AC — bara 1 av 8 är det). #3 orörd (CI-verifiering, Marcus/orkestreraren).

PR:en skapas som DRAFT — en medveten parkering i väntan på Marcus beslut om vägen framåt, inte normalfallet.
<!-- SECTION:FINAL_SUMMARY:END -->
