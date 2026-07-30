---
id: TASK-95
title: >-
  Fynd: granskningsfixturen har ingen livstidsavslutning — och den handbyggda
  S91-fixturen är ostädbar med befintligt verktyg
status: To Do
assignee: []
created_date: '2026-07-30 19:30'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-88 mätte granskningsfixturens spår i staging och fann TVÅ problem, inte ett. Detta kort bär mekaniseringen; TASK-88 lappade inte.

### DEL A — livstiden har ingen avslutning

Granskningsfixturen är MEDVETET immun mot CI-purgen. `purgeCollisions` (skyddsräcke 2 i `scripts/seed-review-fixture.mjs`) korsläser fixturens markörer mot den skarpa `.purge-staging-policy.json` och AVVISAR skapandet vid träff, så att granskningsdata inte kan raderas mitt under Marcus granskning. **Det skyddet är rätt och ska inte ändras.**

Men skyddet svarar bara på "vem får INTE radera fixturen medan granskningen pågår". Ingenting svarar på "vem raderar den när granskningen är slut". Mätt 2026-07-30: ingen TTL (purge-policyns `minAgeMinutes: 60` gäller enbart dess egna targets, och fixturen är medvetet ingen target), ingen påminnelse, ingen rapport, inget CI-steg som listar kvarlämnade fixturer, ingen mekanism som ens känner till att en granskning är avslutad.

Det enda som finns är en rad prosa: skriptets sista utskrift "Städa efteråt: npm run seed:review:clean -- --ort <ort>" (rad 819). En uppmaning till en människa i slutet av en logg är exakt den mekanism-klass ADR-083 dömer.

**Två empiriska belägg för att prosan inte räcker.** `ZZ-GRANSKNING-S91` bär noteringen "Raderas efter granskning." i basen och stod kvar i fyra dygn. `Event-796` (Ort `Skövde`) bär "GRANSKNINGSDATA … Städas efter review-vågen" och står kvar sedan 2026-07-22 — över en vecka. Två fixturer, två skrivna uppmaningar, noll efterlevnad.

### DEL B — S91-fixturen är ostädbar, och Marcus godkännande ligger oanvänt

Marcus godkände 2026-07-30 att `ZZ-GRANSKNING-S91` städas. Städningen kunde inte utföras. Fixturen byggdes FÖR HAND 2026-07-26 — den händelse som föranledde skriptet — och bär därför inte skriptets markörer. Skriptet identifierar fixturer ENBART via sina egna markörer (fail-safe: "En rad utan fixtur-markör rörs aldrig").

Mätt 2026-07-30, exit 0: `npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91` raderar NOLL poster och rapporterar "Inget att städa".

    isFixtureEvent(recBepsw4Qy9scfoj) → false — Notering saknar [SEED-REVIEW-FIXTUR]
    clean-mönstret ^seed-review\+zz-granskning-s91-\d{2,3}@granskning\.test$
      mot faktisk zz-granskning-01@staging.test → false

Kvar i staging, räknat mot basen (aldrig uppskattat): **33 poster** — 1 event (`recBepsw4Qy9scfoj`, Event-2249, Startdatum 2026-08-03) + 16 anmälningar (`zz-granskning-01..16@staging.test`, 8 Obekräftad + 8 Bekräftad) + 16 personer (samma adresser, samtliga med `Totala deltaganden = 0`).

Fixturen är alltså immun mot BÅDE CI-purgen och sitt eget städkommando.

### AVGRÄNSNING — en purge-target är FEL svar

Restlistan bokför "ZZ-GRANSKNING-S91 och app-segment-test saknas båda i purge-policyn (0 förekomster vardera)" som om det vore samma klass av lucka. **De har motsatta rätta svar.** `app-segment-test` SKA ha en target (det är `TASK-87`). `ZZ-GRANSKNING-*` ska ALDRIG ha en target — en sådan target vore precis det skyddsräcke 2 finns för att förhindra, och att lägga till den vore att riva skyddet. Gör inte analogin.

### FORMER SOM SKA VÄGAS — ingen är vald

Del A:
(a) **TTL i fixturen själv** — eventets Notering bär ett utgångsdatum som skriptet läser vid nästa körning och städar då. Ingen ny CI-yta, ingen ny aktör; men städar först när någon råkar köra skriptet igen.
(b) **Rapporterande CI-vakt** — ett steg som LISTAR kvarlämnade granskningsfixturer utan att radera. Billigt och fail-safe, men rådgivande, och repot har precedent för att rådgivande lägen inte efterlevs (L321-klassen; samma skäl fällde form (c) i `TASK-77`).
(c) **Raderande CI-vakt med lång TTL** (t.ex. 14 dygn) — faktisk mekanism, men återinför exakt den risk skyddsräcke 2 finns för att stänga: en granskning som pågår längre än TTL:en får sin data raderad under sig.
(d) **Acceptera och skriv ned** — granskningsfixturer är långlivade med flit; sluta bokföra dem som skuld. FÖRKASTA denna om den väljs utan att först väga (a)–(c).

Del B:
(e) **Explicit legacy-läge i clean** (`--legacy-monster <regex>` eller motsvarande) som kräver ett aktivt val och dry-run först.
(f) **Märk om fixturen i basen** så befintlig clean tar den — färre kodrader, men 33 skrivningar för hand och en förfalskad historik.
(g) **Engångsskript** som raderar de uppräknade record-ID:na. Enklast, men lämnar `Event-796` olöst och nästa handbyggda fixtur likaså.

Rekommendationen ska motiveras mot samtliga former, och det förkastade bära sitt skäl.

Källa: `TASK-88` (mätningen), restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Del B: de 33 uppräknade posterna städade — räkning FÖRE, verifiering mot basen EFTER, och de permanenta rollup-fixturerna (rec7F8jYc7rczwwkM, recqxaFNwHAdQlAqb) bevisat orörda
- [ ] #2 Del B: formen vald bland (e)/(f)/(g) och motiverad i PR:n; de förkastade bär sina skäl
- [ ] #3 Del A: fixturens livstid har en avslutning som INTE är prosa — tvåsidigt bevis: den städar när den ska, och rör INTE en fixtur vars granskning pågår
- [ ] #4 Skyddsräcke 2 intakt efter ändringen: en granskningsfixtur får ALDRIG bli purge-bar — verifierat mekaniskt mot .purge-staging-policy.json, inte antaget
- [ ] #5 Event-796 (Ort Skövde, kvar sedan 2026-07-22) räknad och hanterad av samma mekanism — eller skälet till att den undantas utskrivet
- [ ] #6 Preflighten (TASK-77/TASK-84) respekterad i varje staging-körning — exitkod redovisad per körning
- [ ] #7 Marcus godkännande för S91-städningen citerat och verifierat fortfarande giltigt vid utförandet — en fixtur som hunnit bli föremål för en NY granskning städas aldrig tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
