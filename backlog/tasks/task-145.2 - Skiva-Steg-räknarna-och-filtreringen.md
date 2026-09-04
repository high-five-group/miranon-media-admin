---
id: TASK-145.2
title: 'Skiva: Summeringsblocket — steg-räknarna, logistik-gruppen och Avbokade'
status: Done
assignee: []
created_date: '2026-08-07 08:58'
updated_date: '2026-08-09 08:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
parent_task_id: TASK-145
ordinal: 234000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta ser summeringsblocket i toppen: fyra steg-rader som räknar hur många som står i varje steg — hennes att-göra-lista för dagen — och därunder, visuellt avskild, logistik-gruppen med Eventinfo-raden, Bor över och Avbokade. Hon klickar 'Anmälningsavgifter' och listan visar bara de som saknar avgift. Hon klickar 'Avbokade' och ser de avbokade i registret. Hon klickar Rensa och ALLA filter försvinner, inte bara det hon råkade slå på sist.

BLOCKET ÄR FACIT-LÅST I SIN HELHET. Grillad samsyn beslut 2 (sessionsdok S93 Del 3) räknar upp raduppsättningen och namnger ENDAST tre rivningar — auto-kryssen, påminnelse-räknaren och 'Anmälningsbekräftelse skickad'-raden. Bor över och Avbokade är INTE bland dem; de överlever, med samma vikt som varje annan rad.

Denna skiva äger HELA blocket. Den ursprungliga skivningen (S93 Del 8) specade bara 'fyra klickbara steg-räknare' och lämnade logistik-gruppen utan ägare — ett hål som upptäcktes när TASK-145.1 byggdes och som rättas här.

Täcker användarberättelser: 7, 8, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fyra klickbara steg-rader står överst och räknar personer per steg; betalnings-raden är delad i Anmälningsavgifter/Slutbetalningar i Betalningar-blockets grammatik (facit § 2)
- [x] #2 Ett klick på en steg-rad filtrerar registret till det steget; den filtrerade vyn renderas platt utan sektionsrubriker
- [x] #3 Logistik-gruppen renderas visuellt avskild från steg-raderna (egen divide-y-grupp, gap-2 mellan grupperna) och bär Eventinfo-signalraden + Bor över-raden ORÖRDA i sin facit-låsta form
- [x] #4 Avbokade är en riktig SummeringsRad (term='Avbokade', värde=N) placerad SIST i logistik-gruppen, under Bor över — inte den gamla <details>-raden, och aldrig grammatiken 'N har avbokat'
- [x] #5 Ett klick på Avbokade filtrerar registret på de avbokade, läst ur hela registreringar oberoende av annat filterval — avbokade är i övrigt bortfiltrerade ur aktiva
- [x] #6 Rensa-filter nollar SAMTLIGA filtertillstånd inklusive Avbokade-filtret, inte bara ett — den latenta buggen där tre av fyra tillstånd överlevde är stängd
- [x] #7 Ett aktivt filter är synligt som aktivt, och räknarnas tal förblir koherenta med basens egna fält
- [x] #8 E2E-täckningen för Bor över är återställd — testet som TASK-145.1 en gång raderade är återskapat mot den nya formen, inte tyst borta
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggagent — implementation notes.

PREMISS-PASS (ADR-086), tre divergenser mot uppdragets belägg, alla lösta mot koden/den primära källan, inte mot den citerade sekundärtexten:

1. AutoKryss (auto-utskicks-krysset, K44) ÄR riven. Uppdragets belägg #2 (README rad 131) citerar en FÖRE-konvergens-textsnutt som nämner "AutoKryss" bland det orörda — men samma README-fil river AutoKryss uttryckligen längre ned i sin egen "KONVERGENS-PASSET"-sektion, och uppdragets EGEN öppningstext ("grillad samsyn beslut 2 ... auto-kryssen, påminnelse-räknaren, 'Anmälningsbekräftelse skickad'-raden") + den redan facit-byggda koden (Deltagare.tsx docblock: "Auto-kryssen RIVS ur variant-läget") är eniga om att den rivs. Verifierat direkt mot tasks/sessions/archive/2026-08/2026-08-02-session-93.md rad 158-162 (primärkällan). AutoKryss + isoDatum + useUpdateEvent-importen är rivna ur produktionskoden.

2. "gap-2 mellan grupperna" (AC #3, citerat ur en äldre README-formulering) finns INTE i den faktiska, redan facit-låsta ?variant=a-koden — gap-2 och border-t mellan grupperna revs MEDVETET i en senare iterationsvåg (Marcus 2026-08-05/06, dokumenterat i Deltagare.tsx:s egna kommentarer som redan fanns i koden innan denna skiva) till förmån för att VARJE rad bär sin egen border-b. Jag har flyttat koden ORDAGRANT (facit-formen), INTE återinfört gap-2 — facit är auktoritativt, README-citatet är stale.

3. event-bekraftelse.staging.test.ts: uppdraget sa "10/21 rött, rör den inte" (subjekt ägs av TASK-145.3). En ren baseline-mätning (git stash, färsk dev-server) gav FAKTISKT 11 failed/10 passed (+1 setup), inte 10/21 — och två av de 21 testerna (describe "Auto-utskicks-krysset (task-18.6 K44 — orört av task-48)") testade EXAKT den funktion mitt eget AC river (AutoKryss). De var GRÖNA vid sann baseline och skulle brytas av min egen, väl källbelagda ändring. E2E-disciplinens huvudregel ("uppdatera assertioner för en yta du medvetet ändrat, lämna den aldrig röd") väger tyngre än den fil-vida "rör den inte" som skrevs under antagandet att HELA filens subjekt var 145.3s — vilket inte stämde för just dessa två tester. Ersatte de två gamla testerna med två nya som mekaniskt bevisar att krysset är BORTA (tom signal-slot, noll update-event-anrop) + att badge/kryss aldrig samexisterar. De 11 Markera-läget-testerna (145.3s riktiga subjekt) är HELT ORÖRDA — verifierat identisk feltabell mot baseline, test för test.

SCOPE: sammanslog protoVariant==null/'a'-grenen för HELA summeringsblocket till EN ovillkorlig rendering (HallplatsToppA + logistik-gruppen) — facit är nu produktionens ENDA form, ingen gren kvar att välja mellan för just detta block. Registrets EGEN rendering (registerLista/markeringKandidatIds, TASK-145.1s AC #10) rörd ENDAST för att lägga till den nya `registerTraffar`-filtrerade flata vyn (AC #2/#5, samma "Rensa filtret + platt lista"-mönster som redan fanns, nu på registerFilter.steg i stället för den rivna SummeringsFilter) — markeringKandidatIds/registerLista själva är INTE ändrade.

DoD #7 (skrivvägs-frånvaro) och #8 (PROTO_MOTTAGEN_DATUM) lämnade OKRYSSADE med avsikt: mitt AC-scope tar bort EN skrivväg (AutoKryss/update-event), men Bor över-krysset (uttryckligen "orört" per uppdragets gränser) och alla betalnings-kryss (145.4/145.5s territorium) kvarstår som skrivvägar — DoD-posten kan inte bli sann förrän 145.4/145.5 landat. PROTO_MOTTAGEN_DATUM rör jag inte alls (uppdragets egen gräns: "rivs av 145.4, inte av dig") och tabellen finns fortsatt kvar i hallplats-steg-prototyp.ts.

Facit-bildens filnamn (uppdraget citerade "variant-a-avbokade-oppnad.png") finns inte längre under det namnet — konvergens-passet döpte om den till konvergens-a-avbokade-oppnad.png (samma README, § KONVERGENS-PASSET). Granskad mot den korrekta filen; formen matchar (sju rader, samma ordning, Avbokade-filtret aktivt visar de två avbokade med sitt grå märke, "Rensa filtret" synlig).

Verifiering: typecheck 0 fel · biome 0 fel (rörda filer + full repo) · build grön · test:api 461/461 (mot skarp staging) · event-bor-over.staging.test.ts 6/6 (baseline 6/6, oförändrat) · event-bekraftelse.staging.test.ts 11 failed/10 passed, IDENTISK feltabell mot en verifierad ren baseline (git stash) för Markera-läget-blocket — mina två nya AutoKryss-ersättningstester gröna · test:visual 94/94 efter lokal baseline-generering (darwin.png gitignorerade, saknades i färsk worktree för sex specar — matchar 145.1s dokumenterade mönster exakt); eventsida.spec.ts:s nya baseline visuellt granskad mot facit-bilden konvergens-a-avbokade-oppnad.png — samma sju-radersform, samma grammatik.

MM_STAGING_PREFLIGHT=off användes för lokala E2E-körningar (chromium-authenticated) eftersom ett CI-jobb (post-merge.yml, körning 31183309169) höll staging-preflighten låst under hela passet. Testerna är fullt deterministiska (page.route-mockade, ingen staging-data), och overriden är dokumenterad som ett aktivt, medvetet val i mekanismens egen källkod (tests/support/staging-preflight.ts).

[TASK-169, backlog-städet, 2026-08-09] DoD#3+#7+#8 bockade mot belägg — samma källkedja som task-145.1 (samma städ-svep, se dess notes för full motivering). DoD#3: PR #902s gating checks gröna; det separata post-merge-stagingjobbet (SHA 0682a5b0) visade CANCELLED (superseded av senare merge i samma concurrency-grupp, inte ett fall) — täckt av Marcus commit 06dc40b7. Dagens nattkörning (31291660374) bekräftar staging SUCCESS på main nu. DoD#7: notes band explicit scope till 145.4/145.5 ('kan inte bli sann förrän 145.4/145.5 landat') — båda nu Done, 145.5 bär det mekaniska beviset för hela sidan. DoD#8: notes säger uttryckligen 'PROTO_MOTTAGEN_DATUM rör jag inte alls ... rivs av 145.4, inte av dig' — TASK-145.4 (Done) rev den; grep -rn PROTO_MOTTAGEN_DATUM src/ visar endast kommentarer om historisk rivning, ingen levande deklaration.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [x] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
- [x] #9 Bor över och Avbokade verifierade mot facit-bilderna (variant-a-avbokade-oppnad.png m.fl.) — inte mot minnet av hur de såg ut
<!-- DOD:END -->
