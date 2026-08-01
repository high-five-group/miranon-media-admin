---
id: TASK-88
title: >-
  Fynd: ZZ-GRANSKNING-S91 lever kvar i staging — granskningsfixturen är inte
  självstädande
status: Done
assignee: []
created_date: '2026-07-29 17:36'
updated_date: '2026-08-01 13:04'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfixturen `ZZ-GRANSKNING-S91` skapades för en Marcus-granskning och ligger kvar i staging. Den är **inte självstädande**, och `.purge-staging-policy.json` nämner den inte — verifierat 2026-07-27.

Städkommandot finns och är känt:

    npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91

**Men skivan är större än ett kommando.** Frågan den ska svara på är varför fixturen inte städar sig själv, och om nästa granskningsfixtur kommer lämna samma spår. `CLAUDE.md` § Granskningsdata beskriver skriptets skydd — bland annat korsläsning mot purge-policyn så granskningsdata INTE städas bort mitt i en granskning. Det skyddet är avsiktligt; det är därför den ligger kvar.

**Avgörande:** kör inte städningen om en granskning pågår. Fråga Marcus om fixturen får tas bort innan den tas bort.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus tillfrågad om ZZ-GRANSKNING-S91 får städas — svaret citerat i kortet, inte antaget
- [x] #2 Städningen körd med preflighten respekterad, och utfallet verifierat mot basen
- [x] #3 Frågan besvarad i skrift: lämnar nästa granskningsfixtur samma spår, och är det avsiktligt?
- [x] #4 Om svaret är att det INTE är avsiktligt: eget kort mintat för mekaniseringen — denna skiva lappar inte
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVVIKELSE MOT KORTETS EGET ANTAGANDE — LÄS FÖRST. Kortet och restlistans § Spår E anger `npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91` som städkommandot. Det kommandot städar INGENTING. Mätt 2026-07-30 mot staging apphjj8Q7lkXCMsL4, exit 0:

  PREFLIGHT OK — inget staging-rörande CI-jobb igång (lokal seed:review).
  ▸ Träffar: 1 event, 0 anmälningar, 0 personer
  ▸ Raderas: 0 anmälningar, 0 personer, 0 event
     ⚠️  recBepsw4Qy9scfoj lämnas kvar — saknar fixtur-sentinel i Notering
  Inget att städa.

ROTORSAKEN: ZZ-GRANSKNING-S91 byggdes FÖR HAND 2026-07-26. Den händelsen är själva skälet till att skriptet finns (seed-review-fixture.mjs rad 6–10; runbooken § Granskningsfixtur). Fixturen bär därför inte skriptets markörer, och skriptet identifierar fixturer ENBART via sina egna — fail-safe per runbooken § Hur man städar: "En rad utan fixtur-markör rörs aldrig".

MEKANISKT PRÖVAT mot de faktiska värden som lästes ur staging (Airtable-MCP, read-only), inte mot antagna:

  isFixtureEvent(recBepsw4Qy9scfoj, "ZZ-GRANSKNING-S91") → false
    faktisk Notering: "Granskningsfixtur S91 — task-48 design-review. Raderas efter granskning."
    krävs:            börjar med "[SEED-REVIEW-FIXTUR]"
  clean-mönstret ^seed-review\+zz-granskning-s91-\d{2,3}@granskning\.test$
    mot faktisk "zz-granskning-01@staging.test"                        → false
    mot skript-form "seed-review+zz-granskning-s91-01@granskning.test" → true
  purgeCollisions(faktiska markörer, .purge-staging-policy.json) → 0 träffar
  purgeCollisions(skript-markörer,  .purge-staging-policy.json) → 0 träffar

Fixturen är alltså immun mot BÅDE CI-purgen och sitt eget städkommando. Städningen är därmed inte "ett kommando bort" — den kräver ett verktyg som inte finns.

FIXTURENS FAKTISKA OMFATTNING, räknad mot basen 2026-07-30 (aldrig uppskattad): 33 poster.
  1 event         recBepsw4Qy9scfoj (Event-2249, Startdatum 2026-08-03, Max 30 platser)
  16 anmälningar  zz-granskning-01..16@staging.test — 8 Obekräftad + 8 Bekräftad (mail skickat)
  16 personer     samma adresser, samtliga med Totala deltaganden = 0

────────────────────────────────────────────────────────────
AC #3 — SVARET, som är kortets egentliga fråga

FRÅGA: lämnar nästa granskningsfixtur samma spår, och är det avsiktligt?
SVAR: JA, den lämnar samma spår. "Avsiktligt" delar sig i två, och bara det ena är det.

(1) IMMUNITETEN MOT CI-PURGEN ÄR AVSIKTLIG OCH KODAD — och ska inte ändras.
Skyddsräcke 2 i seed-review-fixture.mjs (purgeCollisions) korsläser fixturens markörer mot den SKARPA .purge-staging-policy.json och AVVISAR skapandet vid träff. Policyn läses; mönstren dupliceras aldrig in i skriptet, så vakten kan inte drifta ifrån den purge som faktiskt körs. En granskningsfixtur som purgen kunde städa hade per definition aldrig fått skapas. Skälet står i skriptet och i runbooken: en fixtur som matchade purge-mönstren hade raderats mitt under Marcus granskning.

(2) FRÅNVARON AV EN AVSLUTNING ÄR INTE AVSIKTLIG — den är obemärkt.
Skyddet svarar på "vem får INTE radera fixturen medan granskningen pågår". Ingenting svarar på "vem raderar den när granskningen är slut". Verifierat mot disk och policy:
  - ingen TTL — purge-policyns minAgeMinutes: 60 gäller enbart dess egna targets, och granskningsfixturen är per (1) medvetet ingen target
  - ingen påminnelse, ingen rapport, inget CI-steg som listar kvarlämnade fixturer
  - ingen mekanism känner ens till att en granskning är avslutad
Det enda som finns är en rad prosa: skriptet skriver "Städa efteråt: npm run seed:review:clean -- --ort <ort>" som sista rad (rad 819). En uppmaning till en människa i slutet av en logg är exakt den mekanism-klass ADR-083 dömer.

Beviset att prosan inte räcker är fixturen själv. Uppmaningen fanns visserligen inte 2026-07-26 (skriptet fanns inte än) — men noteringen "Raderas efter granskning." satt PÅ eventet i basen, och den stod kvar i fyra dygn. Ännu tydligare: Event-796 (Ort Skövde) från 2026-07-22 bär noteringen "GRANSKNINGSDATA … Städas efter review-vågen" och står kvar sedan dess. Två fixturer, två skrivna uppmaningar, noll efterlevnad.

(3) EN TREDJE SAK, VÄRRE ÄN BÅDA: en fixtur utan skriptets markörer kan inte städas alls med befintliga verktyg (mätningen överst).

KONSEKVENS: nästa fixtur — skript-skapad — lämnar SAMMA spår som S91 gjorde. Den blir liggande tills en människa minns kommandot. Skillnaden är att den åtminstone ÄR städbar när någon minns; S91 är det inte.

────────────────────────────────────────────────────────────
AVGRÄNSNINGEN MOT TASK-87 — läst tillstånd och egen slutsats

.purge-staging-policy.json LÄSTES vid worktree-HEAD b8ca291 den 2026-07-30 19:14 UTC. Filens senaste ändring är 4093af1 (2026-07-23). Kontrollerat mot origin/main efter git fetch samma pass (först f0a9429 19:17 UTC, därefter 7f7ef42 19:24 UTC): filen är IDENTISK i båda — TASK-87:s target hade alltså inte landat. Filen är ORÖRD i denna PR.

EGEN SLUTSATS om huruvida TASK-87 berör ZZ-frågan: nej, inte i sak — och den kan inte göra det tyst.
  - TASK-87:s target ankras på "app-segment-test+". Granskningsfixturens markörer är "seed-review+…@granskning.test" (skript) respektive "zz-granskning-NN@staging.test" (handbyggd). Tre skilda prefix; ingen överlappning är möjlig.
  - Skulle en framtida target mot förmodan matcha granskningsfixturens markörer AVVISAS skapandet hårt av skyddsräcke 2, som läser policyn i stället för att kopiera den. En bredare purge-policy kan alltså inte tyst göra granskningsfixturen purge-bar — den kan bara få nästa seed:review att vägra. Fail-safe-riktningen.

MEN DEN VIKTIGA IAKTTAGELSEN LIGGER BREDVID: restlistan (sessionsdok S91, verifieringspasset 2026-07-27) bokför "ZZ-GRANSKNING-S91 och app-segment-test saknas båda i purge-policyn (0 förekomster vardera)" — som om de vore samma klass av lucka. DE HAR MOTSATTA RÄTTA SVAR. app-segment-test SKA ha en target (det är TASK-87). ZZ-GRANSKNING-* ska ALDRIG ha en target — en sådan target vore precis det skyddsräcke 2 finns för att förhindra. Att lösa TASK-88 med en purge-target vore alltså att riva skyddet. Registrerat här så nästa läsare inte gör analogin.

────────────────────────────────────────────────────────────
OVÄNTAT UNDER ARBETET — registrerat, inte tyst förkastat (ADR-053)

TASK-93:s kollision inträffade nästan, skarpt, i detta pass. Innan TASK-95 mintades kontrollerades samtliga fjärrgrenar: PR #475 låg då i merge-kön och bar REDAN backlog/tasks/task-94. Min worktree saknade den filen, så backlog-CLI:t hade allokerat 94 — en äkta kollision. Undveks genom att grenen fast-forwardades till färsk origin/main (7f7ef42, där #475 landat) FÖRE create-anropet; CLI:t gav då 95.

Detta är ett oberoende, skarpt belägg för TASK-93 AC #1 — och notera att ADR-081 rad 79 fortfarande påstår "Kort: redan löst. backlog-CLI:t äger allokeringen." Det påståendet är nu falsifierat en andra gång, av en annan aktör än research-passet. Amenderingen ägs av TASK-93 AC #7 och görs INTE här.

Praktisk lärdom värd att bära vidare: en bygg-agent som mintar ett kort bör fast-forwarda till färsk origin/main omedelbart före create-anropet. Det stänger inte fönstret (ocommitterat arbete i systerträd är fortfarande osynligt, som TASK-93 skriver ut) men det stänger det landade fallet, som var det som faktiskt inträffade här.

────────────────────────────────────────────────────────────
AC-STATUS

#1 UPPFYLLT. Marcus tillfrågades 2026-07-30, ordagrant svar: "Angående task-88. Om det är så lätt att återskapa så lägg med task-88 i denna våg också då. Jag godkänner." Frågan som ställdes var om ZZ-GRANSKNING-S91 får städas, med upplysningen att fixturen återskapas med npm run seed:review på ett kommando. Städningen är auktoriserad.

#2 EJ UPPFYLLT — ärligt obockat, inte bortglömt. Preflighten respekterades (PREFLIGHT OK, mätt) och utfallet verifierades mot basen (33 poster kvarstår, räknade). Men STÄDNINGEN skedde inte: det kommando kortet anvisar raderar noll poster, och de 33 posterna står kvar. Marcus godkännande gavs mot premissen "det är så lätt att återskapa" — den premissen håller (npm run seed:review bygger en likvärdig fixtur på ett kommando), men den anvisade VÄGEN håller inte. Att i stället radera 33 poster för hand via MCP vore att göra precis det antimönster skriptet finns för att avskaffa, utan skriptets bas-guard, protectedRecordIds-spärr och länk-guard — och en sådan väg är ett scope-beslut, inte ett utförandeval. Eskalerat i stället för att avgöras här. Städningen bärs vidare av TASK-95 del B.

#3 UPPFYLLT. Svaret ovan, plus § Fixturens livstid i docs/reference/staging-verifiering-runbook.md.

#4 UPPFYLLT. Svaret på (2) och (3) är att spåret INTE är avsiktligt → TASK-95 mintat med båda delarna. Denna skiva lappar inte: seed-review-fixture.mjs, .purge-staging-policy.json och purge-staging-sentinels.mjs är samtliga ORÖRDA i denna PR.

────────────────────────────────────────────────────────────
AC #2 — UPPFYLLT 2026-07-31, verifierat av TASK-101 mot basen (egen mätning, inte övertaget påstående)

STÄDNINGEN ÄR KÖRD. Den utfördes av TASK-95 (PR #493, landad 2026-07-31 08:50) via det legacy-läge TASK-95 byggde — inte via det kommando detta kort ursprungligen anvisade, som mätte 0 raderade poster. TASK-95 redovisar 33 poster raderade och PREFLIGHT OK med exitkod per körning (dess AC #6, sex körningar).

UTFALLET VERIFIERAT MOT BASEN av TASK-101, två oberoende vägar, staging apphjj8Q7lkXCMsL4:

1. Skriptets legacy-läge (Airtable REST, PREFLIGHT OK):
     npm run seed:review -- --legacy ZZ-GRANSKNING-S91
     ▸ Träffar: 0 event, 0 anmälningar, 0 personer

2. Airtable-MCP, oberoende av skriptet:
     Eventplanering  filterByFormula {Ort} = "ZZ-GRANSKNING-S91"        → 0 records
     Anmälningar     filterByFormula FIND("zz-granskning-", LOWER({E-post})) = 1 → 0 records

Räkningen FÖRE var 33 poster (1 event recBepsw4Qy9scfoj + 16 anmälningar + 16 personer), mätt av detta kort 2026-07-30. EFTER: 0. Fixturen finns inte kvar i staging.

PREFLIGHTEN RESPEKTERAD i varje körning TASK-101 gjorde: samtliga rapporterade "PREFLIGHT OK — inget staging-rörande CI-jobb igång (lokal seed:review)".

BOCKNINGEN GÖRS PÅ EGEN MÄTNING. Kortet sätts INTE till Done här — DoD kräver CI grön per jobb, och den signalen finns inte vid bockningstillfället.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nattgrindens första äkta drift-fynd (nattärende #541): alla fyra AC bockade men kortet stod To Do bortom karensen. Leveransen i tre led, alla CI-verifierade per jobb: (1) Kortets eget pass — PR #480 (head 3578b75, merge 86453d3): rotorsaken mätt (handbyggd fixtur utan skriptets markörer är immun mot BÅDE CI-purgen och sitt eget städkommando — 0 raderade av anvisat kommando, mätt), AC#3-svaret skrivet (spåret är inte avsiktligt: skyddet mot radering under granskning är kodat, avslutningen saknas), AC#4 uppfyllt via mintade TASK-95. merge_group-run 30575907834: Detect changed files success · Lint + Audit + TypeCheck success · Docs link check success · Test suite skipped by-design · CI Passed or Skipped success. (2) Städningen — TASK-95 del B (PR #493) via legacy-läget: 33 poster raderade med PREFLIGHT OK per körning. (3) AC#2-verifikatet — TASK-101 (PR #504, merge 938b58e) mätte utfallet mot basen två oberoende vägar (skriptets legacy-läge + Airtable-MCP: 0 träffar) och bockade AC#2; merge_group-run 30624656579 alla körda jobb success. DoD#2 avser docs-klassen: Docs link check grön i samtliga tre runs. Ingen rest: fixturen borta ur staging (33 → 0, räknat), livstidsmekaniken ägs av TASK-95 (Done). Stängd 2026-08-01 i svans-passet efter nattgrindens fynd.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
