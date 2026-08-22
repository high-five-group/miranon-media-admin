---
id: TASK-243.6
title: >-
  Fynd: hem-vyns visuella promoverings-grind vaktar den rivna K10-formen —
  blockerar baslinje-födseln
status: In Progress
assignee: []
created_date: '2026-08-22 18:00'
updated_date: '2026-08-22 18:19'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-243
ordinal: 540000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den visuella promoverings-grinden för hem-spalten "Senaste aktivitet" (tests/visual/hem-aktivitetsspalt-promoverings-grind.spec.ts, född i d72e9c90/TASK-201.7) låser den RETIRERADE K10-formen. TASK-243.1 (d794669f) ersatte src/components/hem/SenasteAktivitet.tsx (203 rader, raderade) med SenasteAktivitetKompakt.tsx (87 rader) utan att röra någon fil under tests/visual/ — disk-verifierat: git show --stat d794669f ger noll träffar på visual/__aria__. TASK-243.3 lagade SAMMA felklass i tre e2e-filer (dess Implementation Notes punkt 3: testid → role=region-lokator i aktivitetslogg-skarv.staging.test.ts) men uppräkningen i dess AC #1 omfattade bara tests/acceptance/hem*.ts — tests/visual/ föll utanför.

Utfall: baslinje-dispatchen 2026-08-22 (gh run view 32587783890) gav 238 passed / 8 failed, samtliga åtta i hem-vyn. Lokalt reproducerat mot main 9be5172d: 8 failed, samma åtta.

TRE oberoende staleness-axlar i grinden, var och en mätt:
(1) lokatorn page.getByTestId('senaste-aktivitet') — attributet finns inte i src/ (grep: noll träffar);
(2) ankaret getByRole('region', { name: 'Nya anmälningar att hantera' }) — regionens faktiska namn är dynamiskt, "N nya anmälningar att bekräfta" (NyaAnmalningar.tsx rad 62);
(3) aria-referenserna bär complementary "Senaste aktivitet" (rollen finns inte i src/ — grep på complementary/<aside> i src/components/hem/ ger noll) och den OMAPPADE verb-copyn "Roger bekräftade anmälan" (mappad form sedan TASK-225.3: "bekräftade en anmälan").

Dessutom: fallet "under xl — ingen spalt" beskriver ett rivet beteende. PRD task-243 kräver explicit alla bredder (Hem.tsx rad 396: "6. SENASTE AKTIVITET — kompakt, alla bredder."), och fallet skulle bli FALSKT GRÖNT om bara ankaret lagades: toBeHidden() och toHaveCount(0) passerar båda trivialt mot element som inte finns.

KORTET LAGAR GRINDEN, INTE FORMEN. Formen är stämplad (s102-hem-konvergens/facit.json, godkand av marcus 2026-08-17) och rörs inte — noll filer under src/ i diffen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grindens lokator träffar den faktiska formen via getByRole('region', { name: 'Senaste aktivitet' }) — samma mönster TASK-243.3 valde för aktivitetslogg-skarven; INGEN data-testid tillförd i src/ (den frånvaron är ett öppet bokfört designbeslut i hem-senaste-aktivitet.acceptance.test.ts)
- [x] #2 Ankaret i under-xl-fallet träffar NyaAnmalningar-regionens faktiska, dynamiska namn
- [x] #3 Fallet 'under xl — ingen spalt' omskrivet mot PRD task-243:s 'alla bredder'; ingen frånvaro-assertion mot en riven form kvar (ingen falsk grönhet)
- [x] #4 hem.spec.ts:18 scopad till hälsningens h1 så display_name-avsikten bevaras utan strict-mode-krock
- [x] #5 ariaSnapshot-referenserna regenererade med --update-snapshots=all (inte preset changed)
- [x] #6 npm run test:visual exit 0 för de åtta tidigare röda fallen, mätt
- [x] #7 Amenderings-sidofil enligt ADR-102 § A3 skriven bredvid s102-hem-konvergens/facit.json med föreslagen klass och mätt motivering; godkand aldrig rörd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTTA VÄRDEN PER AC (samtliga i denna worktree, main-rebasad till 5db01658).

AC #1 — lokatorn: page.getByRole('region', { name: 'Senaste aktivitet' }). Idiom-mätning gjord i BÅDA riktningar innan valet: syskon-grindarna i tests/visual/ ankrar på data-testid (personer-yta, dorrlista-yta, persondetalj-yta, register-yta, atgarder-kort, segment-listan, notis-*, appfel-fallback) — men var och en av dem ankrar en HEL promoverad vy/komponent utan namnbärande landmärke, och deras testid finns redan i src/. Hem-BLOCKEN är en annan klass: varje block är en <section aria-labelledby> med h2, och hela hem-acceptance-familjen lokaliserar via getByRole('region', { name }) (mätt: '2 nya anmälningar att bekräfta', '2 förfallna betalningar', 'Nästa event', SPALT_NAMN). AVGÖRANDE PRECEDENT: TASK-243.3 mötte exakt denna bugg på exakt denna komponent i tests/e2e/aktivitetslogg-skarv.staging.test.ts och valde 'Fix: EN rad, testid → role=region-lokator (samma mönster som hem-acceptance-sviterna)' (dess Implementation Notes punkt 3). Att i stället LÄGGA TILL data-testid hade (a) rört src/ på ett annat spårs stämplade yta, (b) falsifierat ett öppet bokfört designbeslut ('AVSTEG MOT K10-FACITET, ÖPPET BOKFÖRT: ingen data-testid' i hem-senaste-aktivitet.acceptance.test.ts) och (c) krävt ett formbeslut detta kort uttryckligen inte äger. Mätning: grep -rn 'senaste-aktivitet' src/ ger enbart aria-labelledby-id:t, noll data-testid.

AC #2 — ankaret: /att bekräfta$/ (regex, ej literal). NyaAnmalningar.tsx rad 62 bygger h2:n som `${total} ${total === 1 ? 'ny anmälan' : 'nya anmälningar'} att bekräfta` — namnet är alltså både räknat och numerus-böjt. Svansen 'att bekräfta' är den enda stabila delen. Det gamla ankaret 'Nya anmälningar att hantera' existerar inte och fällde 2 av de 8 röda fallen — uppdragstexten tillskrev alla 6 grind-fall data-testid-felet, men mätningen delar dem 4 (testid) + 2 (ankaret).

AC #3 — under-xl-fallet: omskrivet till NÄRVARO-assertion + eget ariaSnapshot vid 1024x768. Motivet för omskrivning framför borttagning: (a) den responsiva mätningen är filens egen deklarerade poäng (docblockens § DEN RESPONSIVA GRENEN, som motiverar playwright.config.ts:s {projectName}-segmentering), och (b) det gamla fallet hade blivit FALSKT GRÖNT om bara ankaret lagats — getByTestId(...).toBeHidden() och getByRole('complementary').toHaveCount(0) passerar båda trivialt mot element som aldrig renderas, vilket är exakt den falska grönhet fallets EGEN kommentar varnade för.

AC #4 — hem.spec.ts: getByRole('heading', { level: 1, name: 'Hej Lotta' }). Strict-mode-krocken var 3 element: h1 'Hej Lotta' + två <span class=font-medium> med aktörsnamn ur SenasteAktivitetKompakt.tsx rad 70. Rubriken bär display_name-avsikten exakt; level: 1 lagt till per husets idiom i dorrlista-/segment-grindarna.

AC #5 — regenerering: npm run test:visual -- hem-aktivitetsspalt-promoverings-grind.spec.ts --update-snapshots=all, exit 0. Sex referensfiler. Fyra av dem (≥xl + under-xl, båda projekten) är BYTE-IDENTISKA, sha256 4143a462b3f93a275bff07dab3b84264233a274bc4844fe191aecde09c95f75d; tomläges-paret c8acae64176660662de8c53abf6551ecb15e6b99d97702f1c7587ed38cea8297. Identiteten är resultatet, inte redundans: den ÄR mätningen som visar att formen inte divergerar över den gamla xl-brytpunkten.

AC #6 — npm run test:visual (hela sviten, båda projekten): 246 passed, exit 0 (3,2 min). Första körningen gav 228 passed / 18 failed, samtliga med 'A snapshot doesn't exist at …-darwin.png, writing actual' — den PLATTFORMS-segmenterade baslinjedesignen (playwright.config.ts § snapshotPathTemplate, AC 3: endast -linux checkas in, -darwin/-win32 är gitignorerade per .gitignore rad 104-105). Andra körningen mot de nyss skrivna lokala darwin-baslinjerna: 246/246. ÄRLIG AVGRÄNSNING: pixel-halvan är därmed mätt mot en LOKAL darwin-baslinje, inte mot CI:s linux-baslinjer — den mätningen ägs av visual-baselines.yml. ariaSnapshot-halvan är däremot plattformsoberoende och kanonisk (samma config-kommentar), och det är den halvan detta kort ändrar.

TVÅSIDIGT BEVIS (grinden fäller när den ska): länk-copyn i SenasteAktivitetKompakt.tsx perturberades tillfälligt ('Se all aktivitetshistorik' → 'Se hela aktivitetshistoriken'); grinden gav exit 1 med ariaSnapshot-diff på 6/6 fall. Komponenten återställd med git checkout omedelbart efter; git status --porcelain bekräftar noll filer under src/ i den landade diffen.

GRINDAR, exitkoder fångade separat (aldrig via pipe): npx @biomejs/biome check . = 0 · npm run typecheck = 0 · npm run check:docs = 0 (14 grindar, skriptets egen slutrad) · npm run test:visual = 0. check-langa-streck.mjs EJ kört: den grinden är src/-scopad och diffen rör noll src-filer. npm run test:api EJ kört: dess 13 röda i api-staging är den främmande, registrerade TASK-284-signalen och diffen rör ingen API-yta.

DIVERGENSER MOT UPPDRAGSTEXTEN (ADR-086-passet): (1) main hade landat vidare — worktreen föddes på 3849ac5a, origin/main stod på 9be5172d vid mätning och 5db01658 vid rebase; samtliga mätningar gjorda mot det faktiska läget. (2) Uppdraget tillskrev alla 6 grind-fall 'element(s) not found' på data-testid; mätningen delar dem 4 + 2 (se AC #2). (3) Uppdraget föreslog parent TASK-225; kortet lades under TASK-243 — TASK-225:s egen 'Utanför omfattningen' undantar uttryckligen hem-spaltens FORM, medan d794669f (TASK-243.1) är den commit som orphanade grinden och TASK-243.3 är kortet som lagade samma felklass i syskonfilerna. TASK-243 är dessutom fortfarande To Do, TASK-225 är Done. (4) Uppdragets mål 'test:visual exit 0 i sin helhet' är uppnått, men bara efter att lokala darwin-baslinjer fötts — se AC #6:s avgränsning; på ett rent träd är första körningen alltid 18 röda på macOS, by design.
<!-- SECTION:NOTES:END -->
