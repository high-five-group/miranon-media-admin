---
id: TASK-368.6
title: 'Skiva: QA-vandring — avbokning och ombokning ände-till-ände i staging och prod'
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
labels:
  - ready-for-human
dependencies:
  - TASK-368.1
  - TASK-368.2
  - TASK-368.3
  - TASK-368.4
  - TASK-368.5
parent_task_id: TASK-368
ordinal: 672000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus i browsern, staging med granskningsfixtur seed:review, sedan prod efter EF-deploy via fas4-skriptet i egen terminal och Vercel-landning):
1. Öppna en aktiv anmälan på ett kommande event med väntelista. Tryck Avboka anmälan: bekräftelsesteget visar betalläget och 'N personer väntar på plats'. Skriv skälet 'sjuk' och bekräfta.
2. Kontrollera: status Avbokad på sidan, knappen är nu Återta avbokning, personen borta ur Mer > Betalningar och ur dörrlistan, synlig under Avbokade på eventsidan, Senaste aktivitet på Hem visar 'avbokade anmälan', basens Notering på anmälan bär raden med datum och skäl, eventets Platser kvar steg med ett i basen.
3. Tryck Återta avbokning: statusen är Bekräftad (mail skickat) om bekräftelse skickats, annars Obekräftad; loggen visar 'återtog avbokning'; personen är tillbaka i inkorgen om något saknas.
4. Registrera en inbetalning på personen och tryck Avboka anmälan igen: betalläget visar beloppet och vägen till Registrera återbetalning fungerar.
5. Boka om till ett event med SAMMA pris: ny anmälan skapas, du landar på den, inbetalningen syns där, den gamla anmälan är avbokad med 'Ombokad till ...', kvittot (om utfärdat) står kvar oförändrat, basens spegel visar rätt summa på båda.
6. Boka om till ett DYRARE och sedan till ett BILLIGARE event: texten säger rätt belopp före bekräftelse, länkarna leder rätt, inkorgen visar resten för det dyrare fallet.
7. Felläge: bryt nätet (offline i devtools) och försök avboka: begripligt fel, status oförändrad.
8. Mobil: samma flöde på iPhone-bredd, fokusordning och annonsering (VoiceOver-stickprov).
9. Prod: efter Marcus GO på basens räknarfix och EF-deploy, upprepa steg 1–3 på ett verkligt event med en testperson (Marcus (test) Johansson) och kontrollera Platser kvar i prod-basen.
10. Axe-scan noll överträdelser på anmälans sida i alla lägen.
Fynd registreras som nya kort med exakt symptom och förväntat beteende.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
