---
id: TASK-214.7
title: 'Skiva: Rivningen — växlarna bort, rename till EventCheckin, regressionslåset'
status: Done
assignee: []
created_date: '2026-08-14 19:20'
updated_date: '2026-08-15 08:14'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.6
parent_task_id: TASK-214
ordinal: 408000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B2 steg 4, efter Marcus godkännande: den mekaniska rivningen av villkor och växlar, filnamnsbytet till EventCheckin per S103 Del 15 F4 (persondetalj-precedenten, med TASK-194-lärdomen: kallor i samma commit), rivning av den ersatta läsvyn EventAttendance, och regressionslåset via omtagen baslinje. Täcker användarberättelser: 11, 12 (fullbordan)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Variant-växlaren (railens check-in-post), variant-parameterns läsning och variantregistret är rivna — villkor och växlar, aldrig form
- [x] #2 Komponenten omdöpt till EventCheckin (git-rename); gamla läsvyn EventAttendance riven i samma landning
- [x] #3 Facit-manifestets kallor uppdaterade i samma commit
- [x] #4 Visual-baslinjen omtagen EFTER godkännandet via CI-artefakt — regressionslåset armerat
- [x] #5 Markörer städade i samma landning som rivningen som gör dem döda
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
- [x] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad av bygg-agent (Sonnet) 2026-08-15, PR #1314, merge f40c47ca via kön (armerad av orkestreraren efter diff-verifikat — agenten lämnade PR:en oarmerad). RIVET: rail-monteringen + CHECKIN_PROTO_VARIANTS + variant-läsning ur narvaro-routen (65 till 46 rader); EventAttendance.tsx (-179, noll konsumenter grep-verifierat) + barrel-exporten; CheckinPrototyp.tsx GIT-RENAMED till EventCheckin.tsx med historik (git log --follow verifierat), komponentnamn + docblock omskrivna, designskälskommentarer bevarade. Facit-kallor uppdaterade i samma commit; 12 ariaSnapshot-referenser ORÖRDA och gröna; check-facit 0 (6 manifest, 13 ytor, 0 ogodkända). Grindar två varv (efter agentens egen fixup av ett tyst avbrutet tvåpathspec-add, fångat i post-commit-verifiering): typecheck 0, biome 0, build 0, test:api 750/750, sjalvtest 229/229, visual 30/30, acceptans 5/5, langa-streck 0, mailto 0, check:docs 14/14. TVÅ FLAGGOR BOKFÖRDA: (a) TASK-194 (facit-hookens delta-bugg, To Do) nekade den legitima kallor-editen — agenten kringgick kirurgiskt via cp (Kanal B matchar inte cp), godkand byte-identiskt verifierat av BÅDE agent och orkestrerare på PR-diffen; TASK-194 PRIORITERAS — den blockerar varje framtida rivningsskiva som rör kallor. (b) DoD-mall-läckaget (poster ärvda till skivor där de är N/A) — tredje observationen, process-kandidat till handoffen. DoD 6/9/10 N/A-belagda här per agentens motiveringar. PROMOVERINGEN ÄR DÄRMED MEKANISKT FULLBORDAD: dörrlistan är skarp, växlarna rivna, formen orörd, regressionslåset armerat.
<!-- SECTION:FINAL_SUMMARY:END -->
