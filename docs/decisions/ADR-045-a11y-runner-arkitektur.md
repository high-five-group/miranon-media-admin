# ADR-045: A11y-runner-arkitektur — CI-måltavla, tolerans-regel och CI-placering

- Status: Accepted
- Datum: 2026-06-11
- Fas: 3.5

## Kontext

Fas 3.5 levererar a11y-test-infrastrukturen (axe-core + @axe-core/playwright +
Playwright a11y-runner) som Fas 3:s öppna DoD 1+4 stämplas mot (ADR-020
sekvens-noten). Session 15:s orienterings-pass avtäckte tre designfrågor som
måste avgöras före infra-bygget:

1. **CI-måltavla:** runnerns måltavla `/dev/primitives` är render-guardad till
   dev-läge (`import.meta.env.DEV`, ADR-044) — routen finns inte i
   prod-/staging-build. Ett CI-jobb som pekar `PLAYWRIGHT_TEST_BASE_URL` mot
   staging når den aldrig.
2. **Tolerans-regel:** byggplanens Fas 3.5-DoD säger "0 violations" medan
   ACCESSIBILITY-CHECKLIST §5:s fixture-exempel failade endast på
   critical+serious (moderate/minor loggades som warning) — två olika
   kanoniska regler i spec-lagret.
3. **CI-placering:** ci.yml har changed-files-gating (ADR-029, Strategi E);
   a11y-jobbets placering avgör när runnern faktiskt körs.

Beslutsunderlag per web-research-disciplinen (Chat): Playwrights
förstapartsdocs för webServer/CI-mönstret samt Deque-ekosystemets
dokumentation av impact-filtreringens roll. Marcus-förmedlat beslut.

## Beslut

1. **CI-måltavla = /dev/primitives via Playwrights webServer-mekanism.**
   A11y-runnern kör mot `/dev/primitives`. I CI lämnas
   `PLAYWRIGHT_TEST_BASE_URL` osatt för a11y-körningen, så att configens
   webServer-block startar dev-servern (förstapartsmönstret; befintligt block
   har `reuseExistingServer: !process.env.CI` — i CI startas alltid en egen
   server). DEV-guarden (ADR-044) röres inte.
2. **Tolerans: 0 violations är kanonisk fail-regel** på baseline-ytan
   (5 mönster + 6 primitiver). Impact-filtrering (critical+serious) är i
   Deque-ekosystemet en legacy-onboarding-mekanism för kodbaser med stor
   befintlig skuld — inte baseline-praxis. Projektet är greenfield på denna
   yta; ribban sätts på 0 från start. ACCESSIBILITY-CHECKLIST §5 korrigeras
   till samma regel (samma commit som denna ADR).
3. **CI-placering: `test:a11y` hör till Test+Build-jobbets sfär**
   (kod-grindad per ADR-029 changed-files-gating). Exakt stegmekanik
   implementeras och verifieras i K2, inklusive DoD 2:s medvetet brytande
   commit på branch som bevisar att CI failar vid axe-violation.

## Alternativ som övervägdes

**Alt 1 — Dedikerad Vite-mode som exponerar routen i preview-build.**
Avvisat: urholkar ADR-044:s DEV-guard (routen blir nåbar i en
produktionslik build) och introducerar en ny build-variant att underhålla
för ett behov som webServer-mönstret löser utan ny yta.

**Alt 2 — Staging som måltavla för a11y-runnern.** Avvisat: routen finns
inte i prod-build by design (ADR-044) — staging kan aldrig vara måltavla
utan att först riva guarden, vilket är Alt 1:s problem.

**Alt 3 — Behålla checklistens critical+serious-filter som fail-regel.**
Avvisat: filtreringen är en onboarding-mekanism för befintlig skuld i
Deque-ekosystemet. Att starta en greenfield-yta med inbyggd tolerans
normaliserar violations från dag ett och gör byggplanens DoD-formulering
("0 violations") osann mot sin egen fixture.

## Konsekvenser

- Byggplanens Fas 3.5-DoD 1 ("0 violations på alla 5 patterns") står
  oförändrad och är nu entydigt kanonisk; checklistens §5-fixture korrigeras
  till samma regel.
- Fas 3:s öppna DoD 1 (axe-delen) + DoD 4 stämplas mot denna runner när
  K2-infran är på plats.
- A11y-körning i CI kräver dev-server-start i jobbet (webServer-blocket) —
  ingen ny build-variant, ingen guard-ändring, inga nya beroenden utöver
  Fas 3.5:s planerade axe-paket.
- ADR-020:s hooks-formulering i §Scope står kvar som historiskt
  beslutsdokument (immutabilitet) — API-stilen styrs av ADR-044; byggplanens
  §4 Fas 3.5-mönsterlista skrivs om i components-termer i samma commit.
