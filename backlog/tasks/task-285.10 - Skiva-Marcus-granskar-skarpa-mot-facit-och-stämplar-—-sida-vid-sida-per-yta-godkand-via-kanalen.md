---
id: TASK-285.10
title: >-
  Skiva: Marcus granskar skarpa mot facit och stämplar — sida vid sida per yta,
  godkand via !-kanalen
status: Done
assignee: []
created_date: '2026-08-21 11:17'
updated_date: '2026-08-22 10:41'
labels:
  - ready-for-human
dependencies:
  - TASK-285.1
  - TASK-285.2
  - TASK-285.3
  - TASK-285.4
  - TASK-285.5
  - TASK-285.6
  - TASK-285.7
  - TASK-285.8
  - TASK-285.9
parent_task_id: TASK-285
ordinal: 525000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HITL. Marcus öppnar dev-servern (eller staging-previewn) och jämför varje promoverad yta mot sin prototyp sida vid sida — via växlaren ('öppna i nytt fönster') som fortfarande finns kvar eftersom inget är rivet: uppdateringsnotisen på /hem och /personer vid 390 och 1280 px (skarp = utan ?variant, prototyp = ?variant=1&data=ny-version), chunk-bannern (?data=chunk mot skarpt provocerat chunk-fel), offline-beskedet (nätet av i devtools), meddelanderutan i alla fyra intents och sektionsfelet (/dev/notis-prototyp med och utan ?variant=1, plus /dev-fel i skalet), appfel-fallbacken på primitiv-sidan. Han läser copy-svepets före/efter-tabell.

Säger han att skarpa och prototyp är identiska (ADR-102 B3 — det enda som räknas) stämplar han själv båda manifesten via !-kanalen: npm run facit:godkann -- --pass s109-uppdateringsnotis-konvergens --citat '...' och samma för s109-meddelandefamiljen-konvergens. Skriptet sätter godkand {av, datum, citat, sha}; en agent kan inte (hooken nekar Edit/Write/Bash mot fältet, ADR-104). Offline-beskedet och chunk-bannern är ytor utan egen facit-bild — hans ord här ÄR deras godkännande och bokförs i manifestens not-fält av orkestreraren efteråt.

Hittar han avvikelser: NYTT fynd-kort per avvikelse med exakt symptom och förväntat beteende; stämplingen väntar tills fynden är stängda. Ingen skiva retuscheras.

Täcker användarberättelser: 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje yta är jämförd sida vid sida av Marcus; utfallet (identisk / avvikelse-kort) är bokfört per yta i kortets notes
- [x] #2 Båda manifesten bär godkand satt av Marcus via facit:godkann med citat — inte av någon agent
- [x] #3 Copy-svepets före/efter-tabell är läst och kvitterad av Marcus, eller fynd-kort skapade för de strängar han vill ändra
- [x] #4 FÖRKRAV ur TASK-285.8: facit-manifestet s109-meddelandefamiljen-konvergens är avstämt mot koden före stämpling. Ytan appfel-sidan har ett not-fält som citerar den GAMLA tre-menings-brödtexten verbatim ('Något gick sönder så att sidan inte kan ritas upp. Det du redan har sparat finns kvar. Ladda om för att fortsätta.') och dess bild visar samma text, medan koden efter copy-svepet bär två meningar ('Sidan kunde inte ritas upp, men det du redan har sparat finns kvar. Ladda om för att fortsätta.'). Antingen tas bilden om och not-fältet uppdateras, eller så motiveras avvikelsen öppet i stämplingens PR
- [x] #5 FÖRKRAV ur TASK-285.8: manifestets interna inkonsekvens om copy är löst eller öppet bokförd. Ytan meddelanderutan säger uttryckligen 'Copyn i exemplen är FÖRSLAG enligt copy-domarna, ej låst med formen'; ytan appfel-sidan saknar motsvarande friskrivning och föreskriver i stället copy verbatim. Samma manifest kan inte både låsa och friskriva copy utan att det står varför
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-22 (S109 resume 3).

AC #1 — Marcus jämförde ytorna på dev-servern och stämplade BÅDA manifesten UTAN --undantag. Utfall per yta: identisk. Inga avvikelse-kort skapade.

AC #2 — godkand satt av Marcus via facit:godkann (!-kanalen, ADR-104):
  s109-uppdateringsnotis-konvergens  — 'Vi kör på det'
  s109-meddelandefamiljen-konvergens — 'Vi kör på det, godkänner'
  Landat i PR #1755.

AC #3 — copy-svepets före/efter-tabell (PR #1730) framlagd för Marcus 2026-08-22; kvittens verbatim: 'Kvitterar. Snyggt!' Inga strängar utpekade för ändring, inga fynd-kort.

DoD #6 mätt, inte antaget: appfel- + messagebox-promoverings-grindarna 12 passed, uppdateringsnotis-promoverings-grinden 3 passed, check-facit.sh exit 0 (11 referenser innehållslåsta, 0 ogodkända manifest).

DoD #3 bockad mot PR #1755:s CI: 7 pass, 2 skipping (diff-klassning), 0 fail.

DoD #7 EJ BOCKAD — strukturellt otillämplig. Punkten kräver ett test-konsument-svep över testfiler som konsumerar en flippad yta. Denna skiva är en STÄMPLINGSSKIVA och flippar ingen yta; den rör ingen kod alls (PR #1755 = två facit.json). Svepet gjordes i sina egna skivor, TASK-285.8 och TASK-285.9.
<!-- SECTION:NOTES:END -->
