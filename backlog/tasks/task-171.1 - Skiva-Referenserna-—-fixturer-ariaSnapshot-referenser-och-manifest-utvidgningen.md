---
id: TASK-171.1
title: >-
  Skiva: Referenserna — fixturer, ariaSnapshot-referenser och
  manifest-utvidgningen
status: Done
assignee: []
created_date: '2026-08-09 08:21'
updated_date: '2026-08-09 09:58'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-171
ordinal: 316000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den hermetiska fixturvärlden får fixturer för åtgärds-/granskningsytan (tomt läge · mottagarurval · granskningsläge · de tre utfallslägena), ariaSnapshot-referenser tas i variant-läget för samtliga lägen, och facit-manifestet utvidgas så check-facit-invarianten (godkand null => markörer kvar) täcker ytan. FACIT ÄR LÅST: Marcus låste åtgärds- och granskningssidan (inkl. granskningens ytor/lägen) som v1-facit i klartext 2026-08-09 — verbatim-citat i sessionsdok S93 Del 15 + PRD-kortets notes; referenstagningen mäter alltså mot godkänt facit. Täcker användarberättelser: 9, 11.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Facit-låsningen refererad i notes (citatkälla: S93 Del 15 + task-171 notes) FÖRE referenstagningen
- [x] #2 Fixturvärlden bär åtgärds-/granskningsytans lägen: tomt läge, mottagarurval, granskningsläge, tre utfallslägen
- [x] #3 ariaSnapshot-referenser tagna i variant-läget för samtliga lägen och incheckade
- [x] #4 Facit-manifestet utvidgat med ytan; check-facit.sh grön inkl. tvåsidigt invariant-bevis
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-LÅSNING (AC #1), verifierad mot KÄLLAN, inte bara task-171:s kopia: tasks/sessions/archive/2026-08/2026-08-02-session-93.md Del 15 bär Marcus verbatim-citat ordagrant identiskt med task-171:s Implementation Notes — 'Du får göra bedömningen om granulariteten och beroendena. Och inget borde väl blockera nu, jag låser Åtgärdssidan och Granskningsidan (och granskningssidans olika ytor/lägen) som facit. Det är okej för v1, jag vill att de blir skarpa sidor i appen nu.' Citatet är återgivet i det nya manifestets lasning-fält.

DIVERGENS MOT UPPDRAGET (ADR-086, öppet bokförd): uppdraget antog en ?variant=-URL-mekanik (PrototypeSwitcher + ADR-074 URL-state) analog med eventsidans. Läsning av AtgardsSida.tsx + båda routerna visar att PrototypeSwitcher monteras (DEV-grindad) och bär internt useQueryState('variant'), men PROTO_VARIANTS har EN post (key: 'a') och varken AtgardsSida eller dess routes läser variantParam (grep: noll träffar) — till skillnad från eventsidans EventDetail.tsx/Deltagare.tsx som faktiskt grenade på isHallplatsVariant(variantParam). Det finns alltså ingen andra form att flippa MOT ännu; referenserna togs genom direkt navigering till de skarpa URL:erna (/atgarder, /event/$eventId/atgarder), inte via query-param. Dokumenterat i spec-filens docblock. TASK-171.2 äger den faktiska bedömningen av vad som flippas.

AC #2/#3: sex ariaSnapshot-referenser (tests/visual/atgardssida-promoverings-grind.spec.ts) mot tre lägen + tre utfall — tomt läge, mottagarurval (4 av 5 seedade: Anna/Björn/Cecilia/Filip, David kandidat — verifierat mot fixture-data.ts REGISTRATIONS_RESPONSE), granskningsläge (urvalsfilter 'bekraftelse' 4→2, alla platshållare ifyllda), tre utfallslägen (paminnelse-urvalet, 4 mottagare: allt=4/0, delvis=3/1, inget=0/4 — deterministiskt via simuleraUtfall). Ingen ny fixturdata krävdes: befintlig VISUAL_EVENT_ID/REGISTRATIONS_RESPONSE täcker samtliga lägen. Tre nya data-testid-ankare tillagda i AtgardsSida.tsx (atgardssida-tomt, granskning-yta) utan formändring — granskning-yta avgränsar MEDVETET bort PrototypRigg (riggens egen docblock: 'riggen, inte ytan') så referensen förblir giltig efter en framtida rivning (171.5 AC #3 kräver 'utan omtagning'). 12/12 grönt två körningar i rad; tvåsidigt bevisat med avsiktlig mutation (DetaljGrupp-rubrik) → rött med exakt diff → reverterat → grönt.

AC #4: NYTT manifest (inte en utökning av det redan godkända s93-hallplats-prototyp-manifestet — dess toppnivå-kvitto sattes 2026-08-08 för en ANNAN, redan avslutad pass; ADR-104 beslut 1 'Granularitet: per manifest/pass' kräver ett eget pass för denna promovering) på tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json, kvitto-fältet null, tre ytor (atgarder-tomt-lage, atgarder-mottagarurval, atgarder-granskning), bilder:[] (facit är ariaSnapshot). check-facit.sh grön (2 manifest, 8 ytor, 1 ännu ej kvitterad). Tvåsidigt bevisat, BÅDA delinvarianterna: (b) strukturell konsistens — trasig kalla-sökväg i mitt manifest gav exakt diagnostiserat rött, reverterat till grönt; (c) B3 rivnings-spärren — lade temporärt till en garanterat frånvarande probe-marker (kod TASK171PROBEMARKER) i policy-configen: rött med mitt manifest namngivet i felet, sedan grönt efter att markören tillfälligt funnits i AtgardsSida.tsx, båda temporära ändringarna reverterade och verifierade rena (grep+git diff). scripts/test-check-facit.sh 27/27 grönt, opåverkat.

.facit-policy.conf FACIT_PROTO_MARKORER rördes INTE permanent — jag lade inte till någon ny markör där, eftersom 171.1 inte flippar något villkor (det beslutet hör till 171.2, som äger vad som faktiskt flippas/markeras).

DoD-status: #1 (AC) klara via --check-ac. #2 lokala grindar gröna: typecheck 0, biome check . exit 0 (inga fel i mina filer), build grönt, test:api 465/465 grönt, test:visual 12/12 grönt (två körningar), check-facit.sh + test-check-facit.sh gröna. #3 (CI grön per jobb) EJ verifierbar av mig — orkestrerarens domän. #4 path-scopad add, verifierat inga orelaterade filer. #5 (ariaSnapshot-paret variant-före==promoverad-efter) BOCKAS INTE — efter-sidan finns first i 171.2 per kortets egen instruktion; endast före-sidan (referenserna) är incheckad i denna skiva. #6 bevis-loopens spår: textform i PR-beskrivningen (grön-röd-med-diff-grön, två separata loopar: ariaSnapshot-grinden och strukturinvarianten) — inga PNG-skärmdumpar producerade eftersom facit här är ariaSnapshot, inte pixel (samma mönster som 162.1: png-frånvaron öppet deklarerad). #7/#8 rör datavägs-invarianten/test-konsument-svepet, som hör till 171.2 (ingen flip sker i denna skiva). DoD-boxarna lämnas OMARKERADE i sin helhet — matchar precedentet i task-162.1 (samtliga sju DoD-boxar där är fortfarande tomma trots Done-status), och orkestreraren äger stängningen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1037 (merge 081df6aa genom kön; post-merge/CI/Push on main success, väktar-verifikat). Sex lägen fixturerade i hermetiska fixturvärlden, 12 ariaSnapshot-referenser (desktop+mobile) tagna och gröna x2, nytt manifest s93-atgardssida-promovering per ADR-104 beslut 1 (per pass), check-facit tvåsidigt bevisad i tre riktningar (mutation/trasig källa/probe-markör, allt revert-verifierat). Divergens-fyndet bokfört: ytan har ingen variant-gren — referenserna togs mot skarpa URL:erna. DoD #5 (par-beviset) bockad med 171.2-belägg: flippen degenererade till identitet, referenserna gröna OFÖRÄNDRADE i 171.2 (PR #1039) — variant före == promoverad efter är bevisat som samma yta. DoD #8 bockad med 171.2:s svep-belägg (träffyta bilagd där; denna skivas enda konsument är dess egen spec).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [x] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
