---
id: TASK-340.2
title: >-
  Skiva: klienten — inget fönster vid Skapa, 'Skapa om'-etikett, bekräftelseyta
  på plats med fokus och två val
status: To Do
assignee: []
created_date: '2026-08-29 08:18'
labels:
  - ready-for-agent
dependencies:
  - TASK-340.1
parent_task_id: TASK-340
ordinal: 621000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan: Skapa öppnar inget fönster och skriver ingen laddningssida (förhandsgranskningens synkrona fönster + TASK-309.38:s väntetext behålls oförändrade). Klienten skickar med kallhash från senaste förhandsgranskning (per event × mall i vyns state) och läser svarets promoverad/underlagAndrat/ersatte. Primärknappen heter 'Skapa om <dokumentnamnet>' när en event-mallad rad redan finns för mallen, annars 'Skapa <dokumentnamn>'. Efter lyckat Skapa ersätts formuläret av en bekräftelseyta i husets form (MessageBox intent success, samma mönster som CreateEventForm: knappen som trycktes finns inte kvar → fokus flyttas till bekräftelsen; avvikelsen från MDN:s status-regel namnges i docblocket). Texten komponeras ur svaret: sparad · underlaget ändrat → gjordes om, förhandsgranska gärna igen · ersatte den tidigare · platsens standard sparad. Två val: 'Visa dokumentet' (signerad URL i nytt fönster i ett direkt klick) och 'Till dokumenten' (dokumentvyn ?typ=bilaga). Ingen auto-omdirigering, ingen toast, ingen radmarkering (PRD § Implementationsbeslut — Marcus prövar formen i QA). Förhandsgranskningens egen ruta behålls med 'Öppna'-fallbacken ENDAST vid blockerat fönster. RouteAnnouncer: mät att bekräftelsen läses exakt en gång och att 'Till dokumenten' ger exakt en annonsering. Täcker användarberättelser: 2, 5, 6, 7, 8, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Acceptance: Skapa öppnar inget fönster (negativt bevis: context.waitForEvent('page') firar INTE inom 3 s) medan Förhandsgranska fortfarande gör det; ingen laddningssida för skapa-grenen kvar i koden
- [ ] #2 Acceptance: bekräftelseytan ersätter formuläret, tar fokus (document.activeElement inuti ytan), visar rätt textvariant för promoverad / underlagAndrat / ersatte / platsstandard (MSW-fixturer per fall), och bär exakt två val; 'Till dokumenten' landar på dokumentvyn med ?typ=bilaga; axe grönt; tangentbordsvandring bokförd
- [ ] #3 Knappens etikett 'Skapa om …' när rad finns, 'Skapa …' annars — testat i båda lägena; kallhash skickas med när en förhandsgranskning gjorts i vyn (nätverkspåstående i test)
- [ ] #4 Skärmläsare: exakt en annonsering vid bekräftelsen och exakt en vid 'Till dokumenten' (Playwright-assert på live-regioner/RouteAnnouncer, eller manuell VoiceOver-mätning bokförd med utfall); aria-/visual-snapshots för genereringsvyn regenererade via spec-filens mekanism
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
