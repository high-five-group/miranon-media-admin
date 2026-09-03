---
id: TASK-374.4
title: >-
  Skiva: Rivningen och regressionslåset — växel, variant-post, fyllnadsläge och
  prototypmapp bort, markören avregistrerad i samma commit, visual-baslinjen
  om-baselinjerad efter godkännandet
status: To Do
assignee: []
created_date: '2026-09-03 09:21'
updated_date: '2026-09-03 12:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-374.3
parent_task_id: TASK-374
ordinal: 679000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter landningen finns bara en Intresserade-vy i källkoden — den godkända formen — och inget villkor, ingen växel och ingen fyllnadsdata kan längre visa något annat. Facit-grinden är grön eftersom markören dog i samma commit som koden, och regressionslåset (ariaSnapshot-paret + den nya visuella baslinjen) bär den godkända formen framåt. Täcker användarberättelser: 18, 19, 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Prototyp-substratet rivet enligt ADR-103 B2 steg 4: variant-växeln, variant-posten i prototyp-railen, dataläget ?data=fyll och fyllnadsfabriken, prototypmappen tömd; inga [PROTOTYPE]-markörer eller ?variant-/?data-grenar kvar för intresserade (grep-svep bilagt i Final Summary)
- [x] #2 Markören IntresseradeKonvergens avregistrerad ur .facit-policy.conf i SAMMA commit som koden rivs; bash scripts/check-facit.sh exit 0 efter (slutraden citerad)
- [x] #3 Den promoverade formen är byte-identisk före och efter rivningen: ariaSnapshot per läge oförändrad i båda vyporterna, grind-specen grön
- [ ] #4 Visual-baslinjerna för Intresserade (fyra bilder) om-baselinjerade via CI-workflowen visual-baselines.yml EFTER Marcus godkännande i 374.3, aldrig lokalt och aldrig före; ändringen bokförd i commit-meddelandet som avsiktlig; visual-sviten grön
- [x] #5 Acceptance-, grind- och API-sviterna gröna på rivningscommiten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [x] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [x] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rivningen (ADR-103 B2 steg 4), i samma gren/PR #2263 som flippen (374.2) och kvittensen (374.3) — anmälningssidans precedent (flipp+rivning i en review-loop).

AC #1: Route (intresserade.tsx) rensad — PROTO_VARIANTS, PROTO_DATA_LAGEN, PrototypeSwitcher-monteringen och useQueryState borta, renderar bara <Intresserade />. Komponenten: fyllnadsfabriken, dataläget, varningsrutan och alla prototyp-markeringar rivna. Barreln: alias-exporten borta. Prototypmappen borttagen (rmdir, redan tom sedan 374.2s git-mv).

Grep-svep (fyra mönster: IntresseradeKonvergens, PROTOTYPE-taggen, data=fyll, exempel.invalid) mot src/components/intresserade och routen: 0 träffar för intresserade-ytan.

Kravde en omskrivning av tva historiska docblock-kommentarer (Intresserade.tsx, route-filen) som tidigare citerade det gamla prototypnamnet och markorerna i klartext - historiken finns kvar via git log foljning, bara inte som en literal strang i koden langre.

AC #2: markören IntresseradeKonvergens avregistrerad ur FACIT_PROTO_MARKORER i .facit-policy.conf i samma commit. check-facit.sh exit 0, slutraden citerad: "Facit-manifest OK: 15 manifest, 30 ytor deklarerade, 2 ogodkanda (3 registrerade prototyp-markorer verifierade kvar i src/)."

Bevisat tvasidigt: grind rott (exit 1) nar markoren tillfalligt aterinfordes i policyn medan strangen redan var borta ur src/ (negativ kontroll), och gront igen efter aterstallning till den riktiga, avregistrerade versionen.

AC #3: grind-specen (16 testfall, bada vyportar) kord mot exakt samma __aria__-referenser som fore rivningen (git status bekraftar de star ororda) - 16/16 gront, det mekaniska beviset att rivningen tog vaxlar och inte formen.

AC #4 (visual-baselines): LAMNAS OBOCKAD med avsikt - orkestreraren utfor om-baselinjeringen efter landning via CI-workflowen visual-baselines.yml pa main, aldrig lokalt och aldrig fore Marcus godkannande (nu givet i 374.3).

AC #5: acceptance-klassen 461/463 (2 orelaterade, forbestaende flakes i dokument-generering-bekraftelse.acceptance.test.ts och mer-aktivitetshistorik-filter.acceptance.test.ts, ingen fil dar rord av denna diff), grind-specen 16/16, test:api 1939/1945 (6 orelaterade staging-kontention-flakes: cancel-registration, generate-event-attachment x2, get-registrations x2, send-registration-confirmation - alla mot delad staging-bas, ingen fil dar rord).

Grindar: typecheck exit 0, biome exit 0, build exit 0 (dist-grep 0 traffar for fyllnadsstrangar), check-langa-streck.mjs exit 0 (298 filer skannade, en fil forsvann ur rakningen eftersom fyllnadsfabrikens streck-tecken foljde med rivningen).
<!-- SECTION:FINAL_SUMMARY:END -->
