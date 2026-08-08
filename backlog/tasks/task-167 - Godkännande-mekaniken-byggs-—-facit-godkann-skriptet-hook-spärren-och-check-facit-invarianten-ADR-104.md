---
id: TASK-167
title: >-
  Godkännande-mekaniken byggs — facit:godkann-skriptet, hook-spärren och
  check-facit-invarianten (ADR-104)
status: To Do
assignee: []
created_date: '2026-08-08 18:48'
updated_date: '2026-08-08 20:03'
labels:
  - ready-for-agent
dependencies: []
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bygger ADR-104:s tre artefakter (G2-grillningen, S93 Del 14). (1) SKRIPTET npm run facit:godkann -- --pass <namn> --citat '...': stämplar godkand: {av, datum, citat, sha} i tasks/sessions/bilagor/<pass>/facit.json; stöd för undantags-form (yta + skäl) per ADR-104 beslut 1; körs av Marcus via !-prefixet (kanalseparation — skriptet får INTE anropas av agenter som godkännande-väg, men själva skriptet kan inte skilja anropare: spärren är hooken). (2) HOOKEN: PreToolUse-hook som nekar agent-skrivningar mot facit-manifestens godkand-fält, matchande Edit, Write OCH Bash (heredoc-kringgåendet är källbelagt; förlaga deny-backlog-direct-edit.sh men bredare tool-matchning); !-kanalen är mätt osynlig för hook-pipelinen (S93 Del 14) så Marcus väg behöver ingen särskiljare. (3) GRIND-INVARIANTEN i scripts/check-facit.sh: godkand: null ⇒ ytans variant-markörer måste finnas kvar i koden — rivning utan godkännande fäller CI (kopplas till ADR-103 B3 lager 2-scanningen; config-driven per Lesson #6, värden i .facit-policy.conf). Alla tre citerar ADR-104 som styrande huvud. TVÅSIDIG testsvit för samtliga tre (fäller/fäller-inte). SKARPBEVIS-SKULDEN: hooken kan INTE skarpbevisas i byggsessionen (L450) — logiken bevisas med testsvit + manuell skript-körning; skarpbeviset bokförs ÖPPET i slutrapport + kort som nästa sessions skuld, aldrig som gjort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptet stämplar korrekt schema inkl. undantags-form; felväg vid okänt pass/redan-satt fält
- [x] #2 Hooken nekar Edit/Write/Bash-skrivningar mot godkand-fältet — tvåsidigt bevisad i testsvit + manuell körning; skarpbevis bokfört som öppen skuld
- [x] #3 check-facit-invarianten fäller på riven markör med godkand: null och släpper igenom med satt fält — tvåsidigt bevisad
- [x] #4 Samtliga tre artefakter citerar ADR-104; config-värden i .facit-policy.conf, ej hardkodade
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tilläggskrav (Marcus, 2026-08-08, mitt i bygget): facit-godkann.mjs är SJÄLVDOKUMENTERANDE. Körs det utan argument, eller med --help/-h, skriver det ut en färdig copy/paste-!-exempelrad + de kända pass-namnen (kataloger under FACIT_BILAGE_ROT med manifest) + undantags-formens exempel — exit 0 (hjälp, inte fel). Ett FAKTISKT stämplingsförsök som saknar --pass/--citat förblir exit 1 (skiljs på argv.length===0 || --help/-h, prövat före övrig parsning). Implementerat i renderHelp() + main()s tidiga gren; 8 nya tester (renderHelp x4 + main-nivå x4), totalt 38 tester i test-facit-godkann.mjs.

Premiss-pass-fynd (ADR-086): uppdragets punkt (3) talar om att 'grind-invarianten byggs' i scripts/check-facit.sh — men invariant (c) (godkand:null => proto-markörer måste finnas kvar) FANNS REDAN, byggd under ADR-102-arbetet (mätt: git log/läsning av check-facit.sh + test-check-facit.sh T8/T9 fanns redan före denna session). Det som FAKTISKT byggdes här för artefakt 3 är: (a) facit-validera.mjs:s godkand-SCHEMA-validering utökad från bar sträng till ADR-104:s objektform {av,datum,citat,sha,undantag?}, (b) test-check-facit.sh utökad med T12-T16 (schema-specifika fall) + T9 uppdaterad till nya schemat, (c) ADR-104-citat tillagt i både check-facit.sh och facit-validera.mjs. Bokfört öppet — bygger inte vidare på uppdragets 'byggs'-premiss som att invarianten var frånvarande.

Designbeslut, bokfört: (1) Hookens Bash-nät har TVÅ kanaler — kanal A denyar direkt anrop av 'npm run facit:godkann'/scripts/facit-godkann.mjs (den farligaste bypass-vägen: skriptet skriver fältet korrekt formaterat, ingen heredoc/redirect-heuristik hade fångat det), kanal B den generiska heredoc/redirect/sed/jq-mönstermatchningen uppdraget efterfrågade explicit. (2) Hooken är FAIL-OPEN på infra-fel (jq/node saknas, trasig stdin), MEDVETET avvikande från deny-resend-send.sh:s fail-closed — motiverat av att blast-radien (Edit/Write är de mest frekventa verktygen i hela sessionen) är oproportionerlig mot en risk som redan har ett OBEROENDE andra lager (check-facit.sh, obligatorisk CI-grind som redan kräver .facit-policy.conf för att bli grön) — 'rivningsprövningen är dubbel' (ADR-104 § Beslut 3). Fullt resonemang i skriptets eget huvud. (3) scripts/test-deny-facit-godkand-skrivning.sh är IEJ wirad i ci.yml — matchar det etablerade, mätta mönstret att INGEN av repots sex befintliga deny-*.sh-hookars testsviter är CI-wirade (grep-verifierat: noll träffar på 'test-deny-' i .github/workflows/*.yml). Logiken bevisas lokalt (27 tvåsidiga fall + manuell körning), inte i CI — samma klass som skarpbevis-skulden. scripts/test-facit-godkann.mjs ÄR wirad (ci.yml, lint-jobbet) eftersom facit-godkann.mjs är en REN node-CLI (samma klass som seed-review-fixture.mjs), inte en harness-hook.

SKARPBEVIS-SKULD, ÖPPEN (L450): scripts/deny-facit-godkand-skrivning.sh registrerades i .claude/settings.json i DENNA byggsession och laddas därmed INTE i denna session (hook-omladdningsregeln). Logiken är bevisad TVÅSIDIGT här: 27 fall i test-deny-facit-godkand-skrivning.sh (planterade DENY + ALLOW för Edit/Write/Bash, båda kanalerna, fail-open-fallen, exit-kod=2 på deny-vägen) + manuell körning mot verklig JSON-payload (jq -nc ... | bash scripts/deny-facit-godkand-skrivning.sh, verifierat NEKAR med exit 2). Skarpbeviset (differentialmätning: provocera en REDAN laddad hook parallellt, t.ex. deny-grind-genom-pipe.sh, för att skilja 'fel logik' från 'ej laddad än') är INTE gjort och betalas som en av nästa sessions första handlingar — bokfört som skuld, aldrig som gjort.

SKARPBEVISET BETALT I FÖRTID (2026-08-08, samma session): hooken laddades via main-ff-synken och FÄLLDE skarpt ett verkligt agent-Bash-kommando (orkestrerarens python3-läsning som mönstermatchade manifest-sökväg + fältnamn) med ADR-104-motiveringen — deny-sidan bevisad i drift; allow-sidan trivialt bevisad av alla övriga passerande kommandon. Skulden 'skarpbevis nästa session' är därmed stängd. BIFYND, lesson-kandidat: CLAUDE.md § 'En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den' är för absolut formulerad — förstapartsdokumentationens form är 'may have missed the change', och denna instans visar att en settings-ändring som anländer via git-merge KAN plockas upp av file-watchern mitt i sessionen. Regeln bör mildras till 'kan inte FÖRLITAS på' (planera för utebliven laddning, men behandla en tidig fällning som giltigt bevis). Bifynd 2: matcharens medvetna bredd ger falska fällningar på LÄSANDE Bash-kommandon som nämner sökväg+fältnamn — accepterad kostnad per design (billig falsk fällning, Read-verktyget är fri läsväg); tunas endast om frekvensen stör.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
