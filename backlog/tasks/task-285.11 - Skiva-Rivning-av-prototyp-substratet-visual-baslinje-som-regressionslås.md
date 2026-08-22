---
id: TASK-285.11
title: 'Skiva: Rivning av prototyp-substratet + visual-baslinje som regressionslås'
status: Done
assignee: []
created_date: '2026-08-21 11:19'
updated_date: '2026-08-22 19:32'
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
- [x] #4 Visual-baslinjen för notis, offline, chunk-banner och meddelanderutan är tagen på godkänd yta och grön i CI
- [x] #5 FÖRKRAV, ur TASK-287: ?variant/prototypAktiv-grenen i src/components/AppShell/AppUpdateBanner.tsx bär en registrerad markör i FACIT_PROTO_MARKORER, ELLER så är dess frånvaro öppet motiverad i rivningens PR — TASK-287 kunde inte lägga den (filen var låst av parallella TASK-285.6) och stängde luckan med proxy-markörer i NotisPrototypVaxlare/prototyp-routen i stället
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
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

---

STÄNGNING 2026-08-22 (S109, bokföringspass — AC #4 bockad, kortet sätts Done).

Baslinjen är född: workflow_dispatch-run 32591327919 mot main (conclusion success, enda jobbet "Generera linux-baselines + öppna baseline-PR" success) öppnade PR #1811, merged 2026-08-22T19:11:16Z som 918b6576 med 16 linux-baslinjer. CI per jobb på #1811: samtliga pass, med A11y / Staging (API + E2E) / Staging sentinel purge / Docs link check korrekt skipping.

DE FYRA YTORNA, verifierade mot #1811:s FAKTISKA filmängd — inte mot dispatch-avsikten. Tre av fyra bär pixel-baslinje ur PR:en:
- notis-visual.spec.ts -> notis-uppdateringsnotis-visual-{desktop,mobile}-linux.png
- offline-visual.spec.ts -> offline-indicator-visual-{desktop,mobile}-linux.png
- chunk-banner-visual.spec.ts -> chunk-banner-visual-{desktop,mobile}-linux.png

DEN FJÄRDE — MEDDELANDERUTAN — HAR INGEN PIXEL-BASLINJE, OCH KAN INTE FÅ EN. Mätt i specen, inte antaget: tests/visual/messagebox-promoverings-grind.spec.ts innehåller NOLL toHaveScreenshot och FYRA toMatchAriaSnapshot. Den är aria-only by design. Följdmätning: git ls-files över tests/visual/__screenshots__ ger noll träffar på message/meddeland — det finns alltså ingen incheckad skärmbild för ytan som en dispatch skulle kunna skriva om. Meddelanderutans regressionslås är i stället de ÅTTA referenserna under tests/visual/__aria__/messagebox-promoverings-grind.spec.ts/ (fyra intenter × två vyporter), och de är sedan T157 dessutom INNEHÅLLSLÅSTA mot sha256 i facit-manifestet (check-facit invariant d) — ett hårdare lås än en pixelbild, inte ett svagare.

AC #4 BOCKAS DÄRFÖR PÅ MÄTT TÄCKNING, INTE PÅ FILRÄKNING: alla fyra ytor bär ett regressionslås på den godkända formen, grönt i CI. Tre via pixel (#1811), en via aria (redan låst före denna landning). Hade kriteriet lästs som "fyra pixel-baslinjer" vore det ouppfyllbart utan att först ge messagebox-specen skärmbildsassertioner — vilket ingen bett om och som skulle vara en formändring, inte en baslinje-födsel.

EN KANT SOM SKA STÅ, mätt under samma pass: visual-projekten (visual-desktop/visual-mobile) körs INTE i ci.yml eller ci-suite.yml — grep över .github/workflows ger träff på npm run test:visual ENDAST i visual-baselines.yml. Pixel-baslinjerna är alltså ett lås som fyrar vid dispatch och lokalt, inte per PR. Det ändrar inte AC #4 (som kräver tagen och grön i CI, vilket är mätt ovan), men det betyder att en pixel-regression inte fångas av en vanlig PR-körning. Den luckan är T172:s ämne (facit-regimernas täckning) och registreras inte om här.

DoD #1 bockad som följd: samtliga fem AC nu avbockade.
<!-- SECTION:NOTES:END -->
