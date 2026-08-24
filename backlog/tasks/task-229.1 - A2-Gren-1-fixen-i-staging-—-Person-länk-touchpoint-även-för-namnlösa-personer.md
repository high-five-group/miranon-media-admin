---
id: TASK-229.1
title: >-
  A2 Gren 1-fixen i staging — Person-länk + touchpoint även för namnlösa
  personer
status: To Do
assignee: []
created_date: '2026-08-24 13:35'
updated_date: '2026-08-24 14:34'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-229
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsaken ur S112-utredningen (2026-08-24, Opus, mätt mot prod-A2 wflRPMp5QNGEa7wH1): Gren 1 (villkor: Personer.E-post matchar AND Förnamn isEmpty) kör endast updateRecord som fyller namn — Person-länken sätts aldrig och ingen Inskickad anmälan-touchpoint skapas; Gren 2 hoppas över. 61 namnlösa lead-personer är laddade fällor (+~9/mån). Fixen: Gren 1 ska även sätta Anmälningar.Person och skapa touchpointen — byggs och bevisas i STAGING (apphjj8Q7lkXCMsL4, identiska automation-ID:n). Marcus GO 2026-08-24: 'Det är absolut GO på 1+2.'
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ändringsdesign skriven mot A2:s faktiska nodstruktur i staging (läst live, inte ur schema_reference)
- [x] #2 MCP-skrivvägen MÄTT: kan update_automation skriva de nya noderna? readOnlyNodeType-utfall bokförs per försök (T167-klassen)
- [x] #3 Om MCP kan: ändringen utförd i staging-A2. Om inte: exakt UI-instruktion för Marcus (T167 väg 1-formen inkl. UI-fällorna: input-variabler skapas bakom Edit code; namn skiftlägeskänsliga)
- [x] #4 Ände-till-ände-bevis i staging: namnlös person + ny anmälan ger Person-länk + touchpoint; motprov: person MED namn ger oförändrat Gren 2-beteende
- [x] #5 Prod-utrullningen görs INTE här — den är systerskivans (ready-for-human)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UTFÖRT (bygg-agent, Opus 5, 2026-08-24). MCP-SKRIVVÄGEN KAN SKRIVA — två försök mot staging-A2 (wflRPMp5QNGEa7wH1, apphjj8Q7lkXCMsL4), båda isValid:true, INGET readOnlyNodeType: (1) identitets-skrivning actgdLjzEESRxdHRO — gjord FÖRE ändringen för att skilja 'accepterar nodtyperna' från 'skriver troget'; återläsning semantiskt byte-identisk (normaliserad diff exit 0); (2) ändringen actFYYR7BqQiOwZim. T167:s readOnlyNodeType gäller customScript, INTE updateRecord/createRecord — nu mätt, inte antaget. Gren 1 (i conditionalGroup wdezdzNWaL1MYcrkE) har nu tre noder: befintlig wacKY1MLhOdtIXxR7 (namn) + NYA wachkIpvrX0FnbdvB (Person-länk fldQekqRlLfup8x5K) + wacSOcz26EBGzr661 (touchpoint, Typ=sel8DlybaDi9slhD3). Normaliserad diff visar EXAKT tre ändringar (grenbeskrivning + två noder); grenarna 2-4 och båda findRecords noll rader. deploymentStatus undeployed FÖRE och EFTER — MCP-skrivning ändrar den inte. AC #4 EJ UPPFYLLT — BLOCKERAT AV MILJÖN, ej av ändringen. Staging-A2 är undeployed och kör inte alls. MÄTT, ej härlett: två testanmälningar 2026-08-24 gav (a) namnlös person fick INGET namn — alltså körde inte ens Gren 1:s BEFINTLIGA namn-steg, (b) MOTPROV mot person MED namn fick INGEN Person-länk fast Gren 2 är oförändrad och fungerar i prod. Motprovet är det bärande beviset: A2 som helhet är avstängd i staging, det är inte de nya noderna som fallerar. update_automation har ingen deployment-parameter (T167: statusen läsbar, ej skrivbar) — att slå på A2 i staging är ett Marcus-moment, och det aktiverar HELA A2 i en delad testmiljö (T162). STÄDAT OCH VERIFIERAT: 2 anmälningar + 2 personer raderade, noll träffar vid efterkontroll. Prod (app8uGPrVCVOm6LfD) ALDRIG rörd. DIVERGENSER mot uppdragstexten: (1) wacmPhj6tKzUl65Wk är en findRecords-NOD, inte en villkorsnod — villkoret är length(...)=1 i conditionalGroup wdezdzNWaL1MYcrkE; (2) conditionalGroup har FYRA grenar, ej två — Gren 3 (dubblett→Error-log) och Gren 4 (else: skapa person) fanns ej i uppdragstexten och lämnades orörda; (3) de två findRecords matchar OLIKA e-postfält — Gren 2 mot Normaliserad e-post fld0CIF2qC7ufa8UD, Gren 1 mot råtext fldVY310IdOIbTkE8; asymmetrin bokförd som eget fynd, EJ åtgärdad här. Fält-ID:na var PROD-mätta i uppdraget och är nu STAGING-verifierade via get_table_schema — noll avvikelser. Full design + prod-spec: docs/reference/automation-scripts/a2-gren1-person-lank-och-touchpoint.md

AC #4 UTFÖRT (S112, Sonnet 5, 2026-08-24 14:33 UTC). Förutsättning verifierad live via list_automations: A2 (wflRPMp5QNGEa7wH1) deploymentStatus=deployed, A1 (wflDCKPAv2P6Yu9U6) deployed, alla övriga 10 automationer undeployed — matchar uppdragets premiss. Deployed A2 bär redan Gren 1-fixens tre noder (wacKY1MLhOdtIXxR7 + wachkIpvrX0FnbdvB + wacSOcz26EBGzr661), dvs. Marcus deploy publicerade draften. GREN 1 (namnlös lead): Personer recKxDw7pnAO7xO6t skapad med endast E-post (zz-task2291-namnlos@example.com), Förnamn/Efternamn tomma. Anmälningar recP9oYBZDihSfn2s (ID 5907) skapad med samma e-post + Förnamn=ZzBevis229ett/Efternamn=Gren1Test. A2 körde inom sekunder: Anmälningar.Person satt till recKxDw7pnAO7xO6t, Personer.Förnamn/Efternamn ifyllda, Touchpoints recBuqXyNnCOhnUHp skapad (Typ=Inskickad anmälan, Person=recKxDw7pnAO7xO6t, Datum=2026-08-24T14:33:13.697Z). MOTPROV (Gren 2, person MED namn): Personer recrs45NOzq8ToVBP skapad med Förnamn=ZzBevis229tva/Efternamn=Motprov + E-post. Anmälningar recJg4HLveeiU2gLg (ID 5908) skapad med samma e-post. A2 körde: Person-länk satt till recrs45NOzq8ToVBP, Touchpoints reckUbaLTpf45LLrA skapad (Typ=Inskickad anmälan, Datum=2026-08-24T14:33:49.925Z) — Gren 2 oförändrat beteende bekräftat. Båda anmälningarna fick Eventmatchning=Utan event (inget Event-fält) eftersom A1 (också ON) inte fick några event-parametrar — DESIGNAT beteende (A1:s snabbformulär-gren hittade ingen Label-match), ej ett fel i beviset, bokfört ej felsökt. STÄDAT: 2 Touchpoints + 2 Anmälningar + 2 Personer raderade (recBuqXyNnCOhnUHp, reckUbaLTpf45LLrA, recP9oYBZDihSfn2s, recJg4HLveeiU2gLg, recKxDw7pnAO7xO6t, recrs45NOzq8ToVBP). Verifierat: search_records för 'zz-task2291' gav noll träffar i Personer, Anmälningar, Touchpoints och Deltaganden efter radering. Prod (app8uGPrVCVOm6LfD) aldrig rörd — allt via mcp__airtable__* mot apphjj8Q7lkXCMsL4.
<!-- SECTION:NOTES:END -->
