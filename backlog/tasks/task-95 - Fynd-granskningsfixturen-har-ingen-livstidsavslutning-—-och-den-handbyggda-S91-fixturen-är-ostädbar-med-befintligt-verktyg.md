---
id: TASK-95
title: >-
  Fynd: granskningsfixturen har ingen livstidsavslutning — och den handbyggda
  S91-fixturen är ostädbar med befintligt verktyg
status: To Do
assignee: []
created_date: '2026-07-30 19:30'
updated_date: '2026-07-31 06:49'
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
- [x] #1 Del B: de 33 uppräknade posterna städade — räkning FÖRE, verifiering mot basen EFTER, och de permanenta rollup-fixturerna (rec7F8jYc7rczwwkM, recqxaFNwHAdQlAqb) bevisat orörda
- [x] #2 Del B: formen vald bland (e)/(f)/(g) och motiverad i PR:n; de förkastade bär sina skäl
- [x] #3 Del A: fixturens livstid har en avslutning som INTE är prosa — tvåsidigt bevis: den städar när den ska, och rör INTE en fixtur vars granskning pågår
- [x] #4 Skyddsräcke 2 intakt efter ändringen: en granskningsfixtur får ALDRIG bli purge-bar — verifierat mekaniskt mot .purge-staging-policy.json, inte antaget
- [x] #5 Event-796 (Ort Skövde, kvar sedan 2026-07-22) räknad och hanterad av samma mekanism — eller skälet till att den undantas utskrivet
- [x] #6 Preflighten (TASK-77/TASK-84) respekterad i varje staging-körning — exitkod redovisad per körning
- [x] #7 Marcus godkännande för S91-städningen citerat och verifierat fortfarande giltigt vid utförandet — en fixtur som hunnit bli föremål för en NY granskning städas aldrig tyst
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORMVAL — DEL A: (a) TTL i fixturen själv, verkställd av ett förfallo-svep i skriptets egna lägen.

Create stämplar `[UTGÅR: YYYY-MM-DD]` i eventets Notering (14 dagar default, `--livstid N`). Svepet läser stämpeln och städar det som passerat via EXAKT samma planClean-väg, raderings-ordning och skyddsräcken som manuell clean. Kör automatiskt i create + clean (`--ingen-svep` stänger av), ensamt med `--sweep`.

Varför stämpeln var nödvändig oavsett verkställare: "granskningen pågår" var inte uttryckt NÅGONSTANS i datan. Utan den är varje automatisk städning en gissning. Det är den irreducibla luckan, och (b)/(c) löser den inte — de förutsätter den.

FÖRKASTADE, DEL A:
(b) Rapporterande CI-vakt — AC #3 kräver att avslutningen STÄDAR. En vakt som bara listar avslutar ingenting; den flyttar uppmaningen från skriptets sista rad till en CI-logg. L321-klassen: rådgivande lägen efterlevs inte.
(c) Raderande CI-vakt med lång TTL — återinför precis den risk skyddsräcke 2 stänger, med en aktör ingen ser innan den fyrar. Kräver dessutom write-scopad STAGING_AIRTABLE_TOKEN i ett nytt jobb plus semafor-koordinering mot purge-jobbet (TASK-76:s race). Fel proportion mot ett ackumulerande skräpproblem.
(d) Acceptera och skriv ned — vägd sist per kortets krav, och faller: två fixturer hade två skrivna uppmaningar och noll efterlevnad. Att skriva en tredje är samma sak igen.

ÄRLIG GRÄNS, utskriven i kod + runbook: svepet körs NÄR SKRIPTET KÖRS. Ingen tidsdriven automat. En förfallen fixtur ligger kvar tills någon kör skriptet igen.

FORMVAL — DEL B: (e) explicit legacy-läge, i "eller motsvarande"-formen: ett SLUTET REGISTER i CONFIG, inte en fri `--legacy-monster <regex>`.

En regex på kommandoraden flyttar hela skyddet till den som skriver den i stunden — prosa som utger sig för att vara mekanism (ADR-083) i kodform. Registret flyttar skyddet till kodgranskning + testsvit. Fyra ankare per post: ort, eventRecordId, `^…$`-ankrat emailPattern, och `forvantat` (mätt räkning). Avviker basen VÄGRAR skriptet. Dry-run default; radering kräver `--bekrafta`, och `--dry-run` vinner alltid.

FÖRKASTADE, DEL B:
(f) Märk om fixturen i basen — 33 skrivningar som ÄNDRAR data i stället för att ta bort den, förfalskar historik ([SEED-REVIEW-FIXTUR] på ett event skriptet aldrig skapade), och lämnar ett trasigt mellanläge om körningen avbryts. Löser dessutom inte Event-796: dess sex anmälningar saknar gemensam slug och bara tre av dem har person.
(g) Engångsskript — lämnar Event-796 olöst (AC #5) och nästa handbyggda fixtur likaså. Hårdkodade record-ID:n har noll återanvändning och skulle behöva egen bas-guard, protected-spärr och länk-guard — en andra, sämre kopia av det som redan finns.

MÄTNING — S91, räknad mot basen, aldrig uppskattad
FÖRE:  1 event (recBepsw4Qy9scfoj, Event-2249) + 16 anmälningar (zz-granskning-01..16@staging.test, 8 Obekräftad + 8 Bekräftad) + 16 personer = 33 poster
EFTER: 0 kvar. Verifierat oberoende via Airtable-MCP, inte bara ur skriptets egen efter-verifiering.

PERMANENTA ROLLUP-FIXTURERNA — före/efter byte-identiska:
  rec7F8jYc7rczwwkM  Deltaganden ["recQWjimysYJrkY0n"], Totala deltaganden 1
  recqxaFNwHAdQlAqb  Deltaganden ["recbfLxgzWw7FpO6W","recVFG03E9dihNFiA","reclwCtXanlSqRR0c"], Totala deltaganden 2
Även de permanenta EVENT-fixturerna orörda: Event-681 (ZZ-belaggning-fixtur), Event-845 (ZZ-arbetsko-fixtur). Notera: dessa två EVENT står INTE i protectedRecordIds — den listan bär bara de två PERSONERNA. De skyddades här av registrets record-ID-ankare.

AC #5 — EVENT-796: RÄKNAD OCH HANTERAD, RADERING EJ UTFÖRD
Räknad mot basen: 1 event (recigcY12dDllUkYt, Event-796, Ort Skövde) + 6 anmälningar (granskning-*@example.com, samtliga Efternamn "Granskning") + 3 personer = 10 poster. Bara 3 av 6 anmälningar har Person-länk — den handbyggda asymmetrin.
Hanterad av samma mekanism: registerposten `Skovde-S75`. Dry-run mot basen, exit 0: räkningen stämmer exakt (1/6/3).
RADERINGEN UTFÖRD: NEJ. Marcus godkännande 2026-07-30 gällde ordagrant TASK-88, alltså ZZ-GRANSKNING-S91. Event-796 har inget citerat godkännande. Att radera 10 poster på eget bevåg vore ett scope-beslut, inte ett utförandeval. Ett kommando bort när Marcus säger till:
  npm run seed:review -- --legacy Skovde-S75 --bekrafta

AC #7 — GODKÄNNANDET, CITERAT OCH AKTUALITETS-PRÖVAT
Marcus 2026-07-30, ordagrant: "Angående task-88. Om det är så lätt att återskapa så lägg med task-88 i denna våg också då. Jag godkänner."
Verifierat vid utförandet (2026-07-31, före den skarpa körningen): sökning över Eventplanering på GRANSKNING i Ort/Notering samt SEED-REVIEW-sentinel gav exakt TVÅ rader — S91 och Skövde, båda kända sedan mätningen. Ingen ny granskningsfixtur hade tillkommit, ingen skript-skapad fixtur existerade. Godkännandet gällde alltså exakt det som togs bort.

AC #6 — PREFLIGHT + EXITKOD PER STAGING-KÖRNING (sex körningar, alla PREFLIGHT OK)
  1. --legacy ZZ-GRANSKNING-S91 (dry-run)          exit 0   räkning 1/16/16 stämmer
  2. --legacy Skovde-S75 (dry-run)                 exit 0   räkning 1/6/3 stämmer
  3. --legacy ZZ-GRANSKNING-S91 --bekrafta         exit 0   33 raderade, efter-verifiering 0 kvar
  4. --sweep (skarpt, tom bas)                     exit 0   0 förfallna
  5. seed:review --ort ZZ-GRANSKNING-T95 --livstid 14  exit 0   fixtur skapad, stämpel [UTGÅR: 2026-08-14]
  6. --sweep (grön sida) / --sweep (röd sida)      exit 0 / exit 0

AC #3 — TVÅSIDIGT BEVIS, BÅDE ENHET OCH SKARPT
Enhet: 96 tester gröna (baseline 60 → +36). RÖD/GRÖN-par genom hela sviten.
SKARPT END-TO-END mot staging, samma fixtur:
  GRÖN: stämpel [UTGÅR: 2026-08-14] ⇒ "1 aktiva" — "ZZ-GRANSKNING-T95 lämnas — granskning pågår, utgår 2026-08-14". Noll rader rörda.
  RÖD:  stämpeln åldrad till 2026-07-20 ⇒ "1 förfallna" — 4 anmälningar + 4 personer + 1 event raderade, efter-verifiering 0 kvar.
MUTATIONSRUNDA (engångs, ej committad): 12 mutationer som river varsin bärande guard. 12/12 fäller sviten. Tre krävde riktad omkörning — två perl-fel i mutations-skriptet och ett falskt "lucka"-fynd orsakat av att `grep -qF false` alltid matchar; samtliga tre fäller korrekt med entydig kvittering.

AC #4 — SKYDDSRÄCKE 2 MEKANISKT VERIFIERAT
.purge-staging-policy.json är ORÖRD i diffen. Tre tester läser den skarpa filen direkt:
  - purgeCollisions ger 0 träffar för skript-markörer OCH båda legacy-fixturernas markörer
  - ingen target åberopar ZZ-GRANSKNING i vare sig exactMatchPattern eller filterByFormula
  - ingen target läser fältet Notering — utgångsstämpeln kan alltså inte göra fixturen purge-bar
Klassvarningen från kortet står nu i CLAUDE.md och i skriptets header: ZZ-GRANSKNING-* och app-segment-test har MOTSATTA rätta svar.

OVÄNTAT — REGISTRERAT, EJ TYST FÖRKASTAT (ADR-053)
1. Min ursprungliga worktree auto-städades under ett API-avbrott (inga ändringar fanns i den — bara läsningar). Ny worktree skapades i scratchpad. Huvudkatalogen var då utcheckad på TASK-94:s gren och rördes aldrig.
2. protectedRecordIds bär bara de två PERSONERNA. De två PERMANENTA EVENT-fixturerna (Event-681, Event-845, båda med "STÄDA INTE bort den" i Notering) står inte i listan. De var aldrig i fara här — svepet kräver fixtur-sentineln och legacy kräver record-ID-ankaret — men luckan är värd ett eget kort om någon framtida mekanism börjar radera event på bredare grund. Blockerar ej, utanför scope.
3. Ett befintligt test dolde en lucka: buildEvent anropades utan utgangsdatum och gav [UTGÅR: undefined], vilket är OLÄSBART och därmed skulle gjort fixturen ODÖDLIG. Stängt i koden (utgangsstampel kastar), inte bara i testet.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
