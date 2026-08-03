---
id: TASK-130
title: >-
  Fynd: PRD task-126 och TASK-126.4 antar att preview-skarven är en CI-grind —
  den anropas aldrig av CI
status: To Do
assignee: []
created_date: '2026-08-02 16:33'
updated_date: '2026-08-03 11:53'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 216000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet av TASK-126.1:s bygg-agent (S96-natten 2026-08-02) och verifierat av orkestreraren.

SYMPTOM: PRD task-126 § Testbeslut säger 'Manifest-fälten verifieras i preview-skarven som redan bygger appen och granskar bundlen'. TASK-126.4 AC#3 säger 'Preview-skarven verifierar screenshots-fälten'. Båda förutsätter att preview-skarven är en mekanisk CI-grind som kan falla rött i CI.

VERIFIERAT: den anropas ALDRIG av CI. grep mot samtliga .github/workflows/*.yml ger NOLL träffar på test:preview:staging, staging-preview och verify:staging-bundle. tests/preview/ + scripts/check-staging-bundle.sh är ett LOKALT verifieringsverktyg (docs/reference/staging-verifiering-runbook.md), inte en grind. Playwright-projektet staging-preview existerar dessutom bara under PLAYWRIGHT_STAGING_PREVIEW=1, som bara sätts av npm-scriptet — inte av CI.

FÖLJD: en grind lagd i den namngivna hemvisten hade aldrig körts i CI. En grind som aldrig körs är ingen grind.

REDAN HANTERAT FÖR 126.1: agenten placerade manifest-fältgrinden i .github/workflows/ci-suite.yml:s Pure+Build-jobb i stället, direkt efter Build, i det jobb som redan producerar dist/ ovillkorligt. Hemvist-valet är motiverat i en kommentar PÅ PLATS i ci-suite.yml, inte bara i PR-texten. Orkestreraren godkände som avsikt-över-bokstav (AC#3:s substans är 'mekanisk verifiering som faller rött', och den namngivna hemvisten kan strukturellt inte leverera den).

KVARSTÅENDE RISK: TASK-126.4 AC#3 bär formuleringen oförändrad och kommer möta samma vägg. PRD:ns Testbeslut-rad likaså.

ÅTGÄRDSRIKTNING (ej beslutad — AC-ändring är spec-ändring och därmed Marcus): antingen rätta 126.4:s AC#3 + PRD:ns Testbeslut-rad till ci-suite.yml Pure+Build som stående hemvist, eller besluta att preview-skarven SKA wiras in i CI och göra det till eget arbete. Separat, större fråga som denna post inte avgör: att tests/preview/ (TASK-10 + TASK-84:s arbete) står helt utanför CI kan vara medvetet men är värt en egen läsning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSAD ready-for-human / medium (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: AC-/PRD-ändring är spec.

BESLUT (orkestreraren 2026-08-03, på Marcus breda delegation "Du får avgöra vad vi behöver göra, vilket som blir bäst" + "Kör på, gör det du behöver göra"). VALT: rätta 126.4:s AC#3 och PRD task-126 § Testbeslut till ci-suite.yml Pure+Build som STÅENDE hemvist för mekaniska manifest-/bundle-grindar. Alternativet — att wira in preview-skarven i CI — är FÖRKASTAT för denna post.

SKÄLEN, i ordning:
1. PREJUDIKATET FINNS REDAN. TASK-126.1:s agent placerade manifest-fältgrinden i ci-suite.yml Pure+Build, med hemvist-valet motiverat i en kommentar PÅ PLATS. Att välja en annan hemvist för 126.4 skulle ge två hemvister för samma klass av grind — precis den sortens inkonsekvens som kostar vid nästa läsning.
2. PURE+BUILD PRODUCERAR REDAN dist/ OVILLKORLIGT. Grinden behöver ingen ny infrastruktur, inget staging-beroende och ingen mutex-hållning. Att wira preview-skarven vore att bygga en andra väg till samma mål.
3. AC#3:s SUBSTANS ÄR BEVARAD. Kriteriet säger "preview-skarven verifierar screenshots-fälten"; substansen är mekanisk verifiering som faller rött i CI. Den namngivna hemvisten kan strukturellt inte leverera det (verifierat: noll träffar i .github/workflows/ på test:preview:staging, staging-preview, verify:staging-bundle). Avsikt över bokstav, samma bedömning som orkestreraren gjorde för 126.1.

ARBETSFÖRDELNING (för att undvika kortfils-konflikt mellan parallella agenter): PRD task-126 § Testbeslut-raden ägs av TASK-131:s agent (dess arbetspunkt 5). task-126.4 AC#3 ägs av TASK-126.4:s agent. Denna post stängs när båda landat.

KVAR SOM EGEN FRÅGA, ej avgjord här: att tests/preview/ (TASK-10 + TASK-84:s arbete) står helt utanför CI kan vara medvetet men är värt en egen läsning. Den frågan följer INTE med detta beslut och ska inte antas besvarad av det.
<!-- SECTION:NOTES:END -->
