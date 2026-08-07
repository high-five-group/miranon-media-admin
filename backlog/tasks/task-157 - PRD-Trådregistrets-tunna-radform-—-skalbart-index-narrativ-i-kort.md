---
id: TASK-157
title: 'PRD: Trådregistrets tunna radform — skalbart index, narrativ i kort'
status: To Do
assignee: []
created_date: '2026-08-07 11:31'
labels: []
dependencies: []
ordinal: 266000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Trådregistret (tasks/threads/README.md) är 268 rader men 214 KB — snittraden ~800 tecken, de fetaste 2 100+. Tillväxten bor i radlängden: 79 % av trådarna (104/131) saknar eget kort, så narrativ (stängningsskäl, carry-texter, commit-hashar) bor i indexraden. Filen närmar sig Read-verktygets 256 KB-tak — samma felklass som gjorde todo.md oläsbar. Registret är handskrivet utan radform-invariant, så formen driftar monotont.

### Lösning

Branschens tunna-index-princip (PEP/RFC/KEP: en indexrad är ID · titel · status · länk — aldrig narrativ) tillämpas fullt ut: hela registret migreras NU (inte framåt-regel), narrativ flyttar till trådens kortfil (kort föds där det saknas och narrativ finns), och en radlängds-invariant i check-thread-index.sh gör formen mekanisk. Inget raderas — allt innehåll överlever i kort + git-historik. Växt-vägen skrivs in i ADR-098: vid radantals-tröskel eller observerad index-drift → steg B (genererat index ur kortfiler, PEP 0-mönstret), billigt då migrationen redan gett post-filer. Rotation avrådd med skäl (löser inte radfetman; statuspartitionering saknar branschstöd — Kubernetes behåller t.o.m. Rejected synligt).

### Användarberättelser

1. Som utförare vill jag kunna läsa hela registret i ett svep utan Read-tak-risk, så att orientering aldrig avvisas av verktygsgränser.
2. Som orkestrerare vill jag slå upp en tråds fulla narrativ i dess kortfil, så att indexet förblir navigeringsyta och kortet innehållsyta.
3. Som systemägare vill jag att radformen inte kan drifta tillbaka, så att nästa fetrad stoppas i CI i stället för att upptäckas vid nästa kris.
4. Som framtida läsare vill jag att inget narrativ raderats vid migrationen, så att forensisk läsbarhet (ADR-053:s syfte) består.
5. Som Marcus vill jag en dokumenterad växt-väg med trigger, så att registret växer in i branschens toppmönster stegvis i stället för att designas om under tvång.

### Implementationsbeslut

- Tunna radformen: ID · titel · status · ingångslänk. Radlängds-tak sätts i grindens policy-konfig (värde väljs i ADR-098 med marginal för titlar + länk).
- Besläktad-deklarationernas hemvist efter tunningen avgörs i ADR-098 mot ADR-095 (relationsmodellen) och check-thread-index invariant 5 — de valideras i dag ur raderna; formen efter flytt måste förbli grind-bar.
- Kort föds vid migrationen för varje tråd vars rad bär narrativ; trådar med redan tunn rad får inget tomt kort.
- Ordningen är bindande: ADR → migration → grind. Grinden byggs EFTER migrationen (annars fäller den varje PR mot dagens feta rader); dess rött-först-bevis tas som self-test mot fixtur, inte mot live-registret.
- ADR-098 refererar och skärper ADR-053 (två-lagers-strukturen består — detta återställer dess tunna index-avsikt), ADR-085 (samma problemklass löst för lessons, förlaga för tröskel-form) och research-passet register-index-skalning-branschmonster-2026-08-07.

### Testbeslut

- Grinden: tvåsidig testsvit i repots grind-form (fäller fet rad i fixtur · släpper tunn · fail-closed på oparsbar rad), config-driven.
- Migrationen: innehålls-bevarande verifieras mekaniskt — flyttat narrativ ska återfinnas i kortfil (diff-baserad kontroll per rad i slutrapporten), och check-thread-index.sh:s befintliga sex invarianter gröna efter.
- Docs-grindarna för alla skivor.

### Utanför omfattningen

- Steg B (genererat index) — dokumenterad växt-väg, byggs vid trigger, inte nu.
- Rotation/arkivvolymer för registret — avrådd med research-belägg.
- Kortfilernas inre form — orörd (ADR-053 beslut 6 består).

### Estimat

4 skivor (varav 1 QA). Klass medel — migrationen är mekanisk men bred (≥50 nya kortfiler möjliga).

### ADR-koppling

ADR-098 mintas i skiva 1. Styrande: ADR-053 (tråd-arkitekturen), ADR-085 (lessons-skalningen, förlaga), ADR-095 (relationsmodellen), ADR-052 (lifecycle).

### Ytterligare anteckningar

Grillad samsyn: sessionsdok S99 Del 4 (formvalet A kvitterat med skalbarhets-krav; migrations-scope + växt-väg + leveransform kvitterade som paket). Research-underlag: register-index-skalning-branschmonster-2026-08-07 (landas i Del 4-committen) + tråd-substratsvepet (mätningarna ovan).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
