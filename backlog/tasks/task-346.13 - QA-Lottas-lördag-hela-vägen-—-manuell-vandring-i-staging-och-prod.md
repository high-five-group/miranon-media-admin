---
id: TASK-346.13
title: 'QA: Lottas lördag hela vägen — manuell vandring i staging och prod'
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
updated_date: '2026-09-01 10:56'
labels:
  - ready-for-human
dependencies:
  - TASK-346.1
  - TASK-346.2
  - TASK-346.3
  - TASK-346.4
  - TASK-346.5
  - TASK-346.6
  - TASK-346.7
  - TASK-346.8
  - TASK-346.9
  - TASK-346.10
  - TASK-346.11
  - TASK-346.12
parent_task_id: TASK-346
ordinal: 650000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, iPad + dator, staging först, sedan prod efter promovering):
1. Hem: det gamla blocket Förfallna betalningar står kvar med sina tre grupper (Att påminna · Väntar · Dags att ringa) och Skicka påminnelse till alla i den grupp knappen opererar på — kortet Betalningar är rivet (Marcus dom 2026-09-01). Genvägar har en tredje rad, Registrera betalning, som öppnar inkorgen med fokus i sökfältet. Kvittojobbets banderoll syns bara medan ett jobb faktiskt arbetar.
2. Skriv 'Ceci' → bara Cecilias rad; tryck [1 000 · anmälningsavgift], Swish, Enter → raden säger anmälningsavgift klar · 1 500 saknas · kvitto väntar; fokus åter i tomt sökfält.
3. Registrera 2 500 för en annan person → 'täcker anmälningsavgift + slutbetalning'; registrera 2 000 för en tredje → 'saknas 500'; sätt Avtalat pris 2 000 → allt betalt.
4. Skriv '2 500,00' i annat-fältet → accepteras; 'abc' → feltext vid fältet.
5. Skicka 3 kvitton → omedelbar kvittens, raderna tickar skickat, Hem säger '3 kvitton skickade'; öppna Visa kvitto: en rad, rätt belopp, Betalningsdatum = registreringsdatumet; Skicka igen till egen adress → samma nummer.
6. Makulera ett kvitto med skäl → raden makulerad, kvittot kvar i ledgern; registrera en återbetalning → kreditkvitto med hänvisning.
7. Importera Handelsbankens exempelfil → säkra/osäkra/omatchade rader; bekräfta → inbetalningar + Skicka N kvitton; importera samma fil igen → 0 nya, '… redan registrerade'.
8. Åtgärds-sidan: sektionen heter 'Betalningar · N saknar' och visar per person ett statuskort (kvar att betala, med Förfallen/Basen släpar när de gäller), Registrera betalning, Registrera återbetalning och inbetalningshistoriken i en fällning per person. INGA kryss att flippa och ingen fällknapp 'Pricka av och notera' — vertikalen är riven i den flaggade världen (Marcus GO 2026-09-01); noteringsfälten finns kvar under betalningsytan och skriver fortfarande. Påminnelsen räknar rätt. Anmälans detaljvy och personkortet visar inbetalningar och kvitton.
9. Stäng fliken mitt i 'Skicka 8 kvitton' → öppna igen: inget tappat, inget dubblerat, läget stämmer.
10. Airtable: valfälten, Summa inbetalt och Kvittonummer speglade på anmälan; vyn Obetalda anmälningar per event stämmer; A7 räknar Ej betalda.
11. Skärmläsare: fel och kvittenser annonseras; fokusordning i formuläret.
12. iPad: numeriskt tangentbord, radhöjd, ingen trunkering.
Godkännande i klartext per steg; varje avvikelse blir ett nytt fynd-kort.

Modell: — (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga steg genomförda och godkända av Marcus i klartext
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->
