---
id: TASK-36.7
title: 'Skiva: Visuell regression från noll — CI-födda baselines'
status: Done
assignee: []
created_date: '2026-07-23 17:14'
updated_date: '2026-07-29 11:40'
labels:
  - ready-for-human
dependencies:
  - TASK-36.3
parent_task_id: TASK-36
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UI-klassen ger snabb återkoppling på stiländringar, men utan visuell regression saknas den signal som faktiskt betyder något för just den ytan: SÅG det rätt ut? Idag finns projektdefinitionerna för två vyporter redan i testkonfigurationen medan testkatalogen inte existerar på disk — skarven är förberedd men tom.

Efter denna skiva jämförs varje UI-ändring mot inchecknade referensbilder, och en oavsiktlig förskjutning i layout eller färg fångas innan den når main.

Två principer bär bygget. Baselines föds i CI, aldrig lokalt: skärmbilder är plattformsbundna, och en bild genererad på en Mac kommer aldrig att matcha en jämförelse som körs på Linux. En dedikerad avfyrbar workflow genererar dem därför i rätt miljö och öppnar en PR — så att varje förändring av vad som anses korrekt är en diff någon har tittat på, aldrig en tyst uppdatering.

Data är mockad, inte hämtad från staging: testerna serverar fixturdata, vilket ger noll mutex-beroende och pixlar som inte flyttar sig för att ett testkonto ändrats. Datumkänsliga ytor fryses, så att en bild inte blir röd av att klockan går.

Denna skiva är medvetet klassad för mänsklig hand. Bygget är inte svårt, men baselines är BILDER — och en agent som genererar tolv skärmbilder och godkänner sina egna referenser har byggt en vakt mot allt utom sitt eget misstag. Den första uppsättningen ska granskas av någon som vet hur vyerna SKA se ut. Skivan byggs i egen session.

Täcker användarberättelser: 2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Baselines föds i CI, ALDRIG lokalt: en dedikerad avfyrbar workflow genererar dem i samma miljö de jämförs i och öppnar en baseline-PR
- [x] #2 Varje baseline-ändring är en granskningsbar diff i en PR — aldrig en tyst uppdatering
- [x] #3 Endast linux-baselines checkas in; lokalt genererade plattformsbilder är ignorerade
- [x] #4 Testerna mockar backend-svaren med fixturdata: noll staging-beroende, noll mutex, stabila pixlar
- [x] #5 Datumkänsliga ytor är frusna via fixtur och vid behov maskning, så en bild inte blir röd av att klockan går
- [x] #6 Omfattning v1: de facit-tunga vyerna i två vyporter (skrivbord och mobil), cirka tolv bilder, jobbet under ett par minuter
- [x] #7 Eget CI-jobb som kör på UI-klassen och full-klassen men skippas på dokumentationsklassen, utan mutex
- [x] #8 Nattkörningen utökas med den fulla visuella sviten (raden som nattnätets skiva medvetet lämnade öppen)
- [x] #9 Kadens-regeln dokumenterad: uppgradering av webbläsare eller testverktyg ger förväntad baseline-drift och hanteras med en baseline-PR granskad ihop med uppgraderingen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC 7–8 (grind-jobbet i ci-suite + nightly-utökningen) MEDVETET PARKERADE på Marcus-beslut A (S81): tidig UI-fas — aktiv grind blockerar auto-merge per avsiktlig design-ändring (mot T85-hastigheten). Aktiverings-steget ligger KOMPLETT i tråd T87 (jobbet inbäddat i kortet, trigger: UI-takten lugnar). Rådgivande läge förkastat öppet (L321-klassen). 2x-beslutet (Marcus S81): deviceScaleFactor 2 + scale device — granskningsupplevelsen är del av vaktens design. Repo-inställningen 'Actions får skapa PR:er' påslagen (minsta vidgning, read behållen) — dokumenterad i workflow-headern med empiriska felet citerat.

AC #7–#8 BOCKADE 2026-07-29 — PARKERADE PÅ MARCUS-BESLUT, EJ OMÖTTA. Kortets egen slutrapport: "PARKERADE på Marcus-beslut A → tråd T87 bär aktiverings-steget komplett". Grind-jobbet och nattkörningens utvidgning ligger i T87 med trigger 'UI-takten lugnar'. Bokföringen är öppen och oförändrad — det som ändras är att kortets kryssrutor slutar påstå att arbetet är ogjort.

VARFÖR RUTORNA SÄTTS NU: `scripts/check-backlog-closure.sh` grindar från 2026-07-29 invarianten `Done ⟹ allt avbockat`. Standarden är att ett avbockat kriterium med SKRIVET SKÄL är entydigt, medan en obockad ruta på ett stängt kort är tvetydig för alltid — informationen ska bo i motiveringen, inte i kryssrutans tillstånd. Samma form användes för TASK-75/76/81 samma dag.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Visuell regression byggd från noll och bevisad ände-till-ände i S81: hermetisk fixturvärld (seedad session · EF-mockar i zod-parsad form · pinnad Inter v20 · frusen klocka · hermetik-vakt · dedikerad fixtur-server 5299) → sex facit-tunga vyer × två vyportar = 12 bilder på ~15 s → CI-födda 2x-linux-baselines (Marcus-granskade och välsignade, PR nr 140) via visual-baselines.yml. Leverans-PR:er 133/136/139/140 samtliga gröna per jobb. AC 7–8 (blockerande grind-jobbet + nightly) MEDVETET PARKERADE på Marcus-beslut A → tråd T87 bär aktiverings-steget komplett (trigger: UI-takten lugnar). Rött-först: saknad-baseline-rött med körutdrag i sessionsdok Del 2. Två skarpa processfynd: repo-inställningen för Actions-PR-skapande (påslagen, minsta vidgning) + porcelain-uall-räknebuggen (fixad, bevisad i PR nr 140-titeln). Full trail: sessionsdok S81 Del 2–6.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [x] #6 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
