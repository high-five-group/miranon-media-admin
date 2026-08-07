---
id: TASK-145.1
title: 'Skiva: Registret som EN lista — steg-hinkar, steg-märken, FIFO'
status: To Do
assignee: []
created_date: '2026-08-07 08:57'
updated_date: '2026-08-07 11:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-145
ordinal: 233000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta öppnar ett event och ser alla anmälda i en enda lista, sorterad efter vad som återstår: de som väntar på bekräftelse överst, sedan de som saknar anmälningsavgift, sedan de som saknar slutbetalning, sist de klara. Inom varje grupp ligger den som anmälde sig först överst. Hon ser var varje person står på personens eget märke — inga rubriker behövs. Listan scrollar som förut när den blir lång.

Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 10, 25
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Obekräftade- och Bekräftade-rubrikerna är rivna; registret renderas som EN deltagarlista
- [ ] #2 Listan sorteras på fyra steg-hinkar i ordningen väntar på bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist
- [ ] #3 Inom varje hink sorteras personerna i anmälningsordning (äldst registrerad först)
- [ ] #4 Steg-märket ÄR grupperingen — inga sektionsrubriker renderas
- [ ] #5 Exakt ETT märke per person även när flera steg är ogjorda; undantagen (Avbokad, Inställt, På väg till väntelistan) bär egna ärliga märken
- [ ] #6 Inline-scrollen är återanvänd med samma klipphöjd som kön hade — ingen ny höjd mintas
- [ ] #7 Scroll-ytans tillgänglighetsetikett följer sektionen och ärver INTE köns hårdkodade namn
- [ ] #8 Summeringsblocket lämnas ORÖRT av denna skiva — steg-raderna OCH logistik-gruppen (Eventinfo-signalraden, Bor över, Avbokade) står kvar exakt som förut; blocket ägs av TASK-145.2
- [ ] #9 Inga befintliga E2E-filer raderas i denna skiva; ett test vars subjekt flyttar hör till skivan som äger subjektet, inte till denna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-07 11:36
---
STOP-rapport (byggagent, andra försöket, efter orkestrerarens rättelse på #862).

Kortet läst om från origin/docs/s93-del9 (PR #872, ej landad) innan bygget
återupptogs — AC #8/#9 och de tre auktoritativa källorna (grillad samsyn
beslut 2, bilagans § Avbokade-rad + rad 131, main:Deltagare.tsx:1789/1803/1884)
verifierade. Instruktionen "gissa inte, bygg inte runt det" följs bokstavligt:
jag har INTE försökt en tredje design. Koden är återställd byte-för-byte mot
origin/main (verifierat: `git diff origin/main -- <5 filer>` = 0 rader) och
grindarna körda gröna på det återställda läget (typecheck/biome/build exit 0).

DEN STRUKTURELLA KOPPLINGEN (fil+rad, origin/main, Deltagare.tsx):
- rad 2102-2113: `<GruppRubrik varning handling={<MarkeraKnapp .../>}>` —
  Markera-knappens ENDA anropsplats i produktionsvyn sitter INUTI
  "Obekräftade ({obekraftade.length})"-rubriken (rad 2113).
- rad 2117-2131: `MarkeringsBatchBar onBekrafta={bekraftaMarkerade}` +
  `<DeltagarListan rader={obekraftade} ... markering={...}>` — Markera-lägets
  KANDIDATMÄNGD (markeringKandidatIds, rad 1651-1654: `obekraftadeIds`) och
  dess `markering`-prop är scopade till EXAKT den `obekraftade`-arrayen.
- rad 2144-2160: en ANDRA, separat `<DeltagarListan rader={bekraftade}>` utan
  `markering`-prop alls — Bekräftade-korten kan aldrig markeras idag.
- Konsekvens: "Obekräftade" och "Bekräftade" är i dagens kod TVÅ SEPARATA
  `<ul>`-listor (inte en), och Markera-läget existerar ENDAST som en
  egenskap hos den ena. Att slå ihop dem till EN <ul> (AC #1: "registret
  renderas som EN deltagarlista") utan att också röra hur Markera hittar
  sina kandidater eller var knappen sitter är inte möjligt utan antingen
  (a) riva Markera-anchor:et (vad jag gjorde i #862, och som ni rättade),
  eller (b) bygga NY logik för blandad markerbarhet inom en och samma lista
  (ingen sådan finns idag — `DeltagarListan`s `markering`-prop är allt-eller-
  inget för HELA `rader`-arrayen den får).

Ingen av dessa är "lämna markera-läget orört" — båda ÄR en förändring av
markera-lägets kod, bara av olika sort. Jag har därför inte byggt någotdera.

BETALNING: koden är återställd, `task-145.1`-kortets AC/DoD är samtliga
avbockade till [ ] (matchar det avbockade läget i origin/docs/s93-del9), och
kortet väntar på ett explicit vägval innan nästa byggförsök.
---
<!-- COMMENTS:END -->
