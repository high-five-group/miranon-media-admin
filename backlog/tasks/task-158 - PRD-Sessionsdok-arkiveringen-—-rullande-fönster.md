---
id: TASK-158
title: 'PRD: Sessionsdok-arkiveringen — rullande fönster'
status: To Do
assignee: []
created_date: '2026-08-07 12:23'
labels: []
dependencies: []
ordinal: 271000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Sessionsdokens rot bär 86 dok varav 77 stängda. Den styrande arkiveringsregeln är fas-avslut-bunden (ADR-023, korrigerad av ADR-041), men Fas 6:s längd (30+ sessioner) har falsifierat premissen att fas-avslut ger rimlig arkiveringskadens: roten växer obegränsat, claude.ai-projektkunskapen synkar alla stängda rot-dok (arkivet är exkluderat per ADR-048) vilket förorenar synken, och registerklassens Read-tak-problem (uppdrag 4) visar vart monoton tillväxt leder.

### Lösning

Rullande fönster: roten bär de ~10 senast stängda doken + alla paused/active; äldre stängda bor i arkivet (befintlig månadsmappsform, inget raderas). Kadensen mekaniseras — arkiverings-skript, drift-grind i nattnätet, hub-steg i session-end — och en engångsmigration flyttar ~70 äldre stängda dok med atomisk länk-omskrivning (77 filer i repot länkar in mot roten). ADR-099 kodifierar fönstret och amenderar ADR-041 öppet.

### Användarberättelser

1. Som Marcus vill jag att claude.ai-projektkunskapen bara synkar aktuella sessionsdok, så att sökträffar speglar pågående arbete i stället för historik.
2. Som orkestrerare vill jag att sessionsstartens LÄS-fas möter en rot med bara aktuella dok, så att lokalisering av pausade/aktiva dok inte kräver filtrering av 80+ stängda.
3. Som agent vill jag att arkivering sker mekaniskt på kadens, så att ingen session behöver minnas en manuell städregel.
4. Som agent vill jag att länkar till arkiverade dok skrivs om atomiskt i samma landning som flytten, så att inga brutna länkar existerar ens transient.
5. Som orkestrerare vill jag en drift-grind i nattnätet som larmar när roten överskrider fönstret, så att drift upptäcks utan mänsklig bevakning.
6. Som Marcus vill jag att historiken förblir nåbar via git och arkivet med pekare, så att inget raderas.
7. Som session-end-utförare vill jag att arkiveringssteget ingår i stängningsrutinen, så att fönstret upprätthålls vid källan.
8. Som framtida läsare vill jag att ADR-099 öppet redovisar varför fas-avslut-bindningen revs, så att beslutets historik är läsbar.

### Implementationsbeslut

- Fönsterregeln: roten behåller ~10 senast stängda + samtliga paused/active; talet bor i policy-konfig, inte hårdkodat (config-driven grindvakts-regeln).
- ADR-099 amenderar ADR-041:s fas-avslut-bindning ÖPPET — rivning med kvittens, ej tyst.
- Arkivet behåller månadsmappsformen; README-pekare består.
- Arkiverings-skriptet är idempotent, verkställer fönsterregeln och skriver om inkommande länkar atomiskt i samma körning; universell logik i skriptet, värden i konfig.
- Engångsmigrationen körs MED skriptet — migrationen är skriptets första skarpa körning, ingen separat handrutin.
- Drift-grinden kör i nattnätet med befintlig larmkedja (ärende vid rött), aldrig tyst.
- Hub-steget: session-end-skillen får arkiverings-momentet; plugin-bump + reinstall i samma landning per praxis.
- Synk-horisonten (ADR-048) är oförändrad — arkivet förblir exkluderat.

### Testbeslut

Externt beteende, inte implementationsdetaljer: skriptets testsvit i repots etablerade test-familjeform (fäller/släpper/fail-closed; shellcheck-strict). Migrationens bevis = befintliga länk-grinden (lychee) grön efter flytten — ingen ny bevismekanism. Drift-grinden bevisas tvåsidigt (rött-först mot fixtur som överskrider fönstret, grönt efter). Förebilder: gren-städarens och deny-familjens testsviter.

### Utanför omfattningen

- Andra dokklasser (research, ADR:er; trådregistret ägs av TASK-157).
- Ändringar i synk-horisonten (ADR-048).
- Radering av något dok.
- Arkivstruktur utanför sessionsdok.

### Estimat

6 skivor, S–M per skiva.

### ADR-koppling

ADR-099 mintas (första skivan) — amenderar ADR-041. Respekterar ADR-023 (historiken), ADR-048 (synk-horisonten oförändrad), ADR-051/052 (lifecycle-fältet är klassningsgrunden).

### Ytterligare anteckningar

Samsynen grillad i S99 Del 5 (2026-08-07); task-158 var reserverat för detta kort. Fönstertalet ~10 är startvärde — omprövas mot uppmätt rot-storlek, inte helig konstant.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
