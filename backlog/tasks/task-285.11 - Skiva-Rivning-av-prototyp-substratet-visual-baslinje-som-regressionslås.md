---
id: TASK-285.11
title: 'Skiva: Rivning av prototyp-substratet + visual-baslinje som regressionslås'
status: To Do
assignee: []
created_date: '2026-08-21 11:19'
updated_date: '2026-08-22 12:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.10
parent_task_id: TASK-285
ordinal: 526000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när båda manifesten bär godkand rivs allt som bara fanns för prototypen — notisens växlare och dess montering i roten, ?variant- och ?data-grenarna i uppdateringsbannern, prototyp-routen /dev/notis-prototyp, MessageBoxPrototyp och AppErrorPrototyp, märk-kommentarerna [PROTOTYPE] — mekaniskt, utan att formen rörs (det som rivs är villkor och växlar, aldrig formen; ADR-103). check-facit.sh är grinden: rivning med godkand null fäller CI och kan inte landa — kontrollera att båda manifesten är stämplade INNAN första raden rivs. Därefter tas visual-baslinjen för de nya ytorna (notis, offline, chunk-banner, meddelanderutan) på den godkända formen som regressionslås, via CI-artefakt-vägen repot redan använder.

Täcker användarberättelser: 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Båda manifesten bär godkand före rivningen (läst ur filerna, inte antaget) och check-facit.sh är grön efter
- [x] #2 Inga [PROTOTYPE]-markörer, ?variant-/?data-grenar, prototyp-routes eller prototyp-komponenter för notisfamiljen finns kvar i källkoden (grep-svep bilagt)
- [x] #3 Den promoverade formen är byte-identisk före och efter rivningen (ariaSnapshot per yta oförändrad)
- [ ] #4 Visual-baslinjen för notis, offline, chunk-banner och meddelanderutan är tagen på godkänd yta och grön i CI
- [x] #5 FÖRKRAV, ur TASK-287: ?variant/prototypAktiv-grenen i src/components/AppShell/AppUpdateBanner.tsx bär en registrerad markör i FACIT_PROTO_MARKORER, ELLER så är dess frånvaro öppet motiverad i rivningens PR — TASK-287 kunde inte lägga den (filen var låst av parallella TASK-285.6) och stängde luckan med proxy-markörer i NotisPrototypVaxlare/prototyp-routen i stället
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DELSTÄNGD 2026-08-22 (S109 resume 3). Rivningen landad i PR #1769 (CI: 12 pass, 3 skipping, 0 fail). Kortet står KVAR som To Do — se AC #4.

BELAGT OCH BOCKAT:
- AC #1: båda manifesten verifierade godkand: marcus före rivningen (sha 932c2689 uppslagen som commit-objekt, ingen godkand.undantag-nyckel). check-facit.sh exit 0 efter att rivnings-klausulen landat (PR #1774) — grinden accepterar och NAMNGER de två rivna kallor-posterna.
- DoD #2-#8: grindarna gröna, ariaSnapshot-paret grönt (10 visual), inga orelaterade filer.

ÖPPET, MED SKÄL — AC #4 (visual-baslinjen) och därmed DoD #1:
Baslinjer föds i CI via workflow_dispatch mot visual-baselines.yml (T87), aldrig lokalt. Den workflowen kör 'npm run test:visual -- --update-snapshots' över HELA sviten och skriver om varje baseline vars rendering avviker.

Mätt 2026-08-22: personer.spec.ts bär fyra baselines (två linux), och TASK-286.3 (commit 1b226272) ändrade personlistans sortering. En baslinje-födsel NU hade därför tyst skrivit om personlistans pixel-lås till den nya formen — samma felklass som TASK-283.4 uttryckligen förbjuder på struktur-axeln: låset får inte återställas av arbetet som bröt det. TASK-283.2 ändrar dessutom samma yta igen.

ÖVERLÄMNAT TILL TASK-283.4: baslinje-födseln tas när 283.2 och 283.3 landat och personlistans form står stilla. Då täcker EN dispatch både notisfamiljens fyra ytor och den nya bokstavsraden, och Marcus får ETT granskningstillfälle i stället för två — samma moment som hans omstämpling.

FÖRKRAV ATT MÄTA FÖRE DISPATCH: 'Allow GitHub Actions to create and approve pull requests' är en tre-nivåers kedja (enterprise → org → repo) som slogs AV när repot flyttades till org 2026-07-27. Utan den failar workflowen på gh pr create (empiriskt: run 30079692827, run 30292488425). Se visual-baselines.yml filhuvud.
<!-- SECTION:NOTES:END -->
