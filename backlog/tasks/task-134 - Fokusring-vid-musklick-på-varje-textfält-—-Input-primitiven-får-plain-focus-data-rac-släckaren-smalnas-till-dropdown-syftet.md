---
id: TASK-134
title: >-
  Fokusring vid musklick på varje textfält — Input-primitiven får plain :focus,
  [data-rac]-släckaren smalnas till dropdown-syftet
status: To Do
assignee: []
created_date: '2026-08-04 10:37'
updated_date: '2026-08-04 11:44'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - src/styles/base.css
  - src/components/primitives/Input.tsx
  - tests/a11y/fokusring-musklick.spec.ts
priority: medium
ordinal: 220000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BESLUTAT (Marcus 2026-08-04, S96, T117 — båda delarna; bokförs i Del 10). Research-grund: docs/research/focus-ring-auth-musklick-2026-08-03.md — ring vid musklick på skrivytor är webbläsarnas spec-dokumenterade default-heuristik (CSS Selectors L4 § 9.4), 9/9 live-mätta produkter, tre designsystem kodifierar plain :focus på textfält (govuk-frontend 5.14.0, uswds 3.13.0, carbon 1.112.0, verifierat i kompilerad CSS). Fyndet i T117-tråden: det som släcker ringen är React Arias [data-rac]:focus-visible:not([data-focus-visible]) i src/styles/base.css — byggd S73 K85 för popover-dropdowns, träffar ALLA React-Aria-skrivytor.

ARBETE: (1) smalna släckar-regeln till dropdown-/popover-klassen den byggdes för; (2) textfält via Input-primitiven (src/components/primitives/) visar ring vid varje fokus oavsett modalitet. OBS: base.css är OLAGRAD och slår alla Tailwind-lager (T117-mätning — en [&_input:focus]-variant slog aldrig igenom); lösningen ska ligga i base.css/primitiven, inte i Tailwind-varianter. Auth-undantaget .mm-auth-formular (prototyp-grenen, ej landat) ska INTE ärvas in — den breda formen ersätter det (facit-README § Öppet vid låsningen: "faller det ska regeln rivas, inte ärvas").

VERIFIKAT: a11y-tester gröna (WCAG 2.4.7-ribban); /dev/primitives + /login granskas i RIKTIG browser — headless Chromium rapporterar outlineColor fel (T117:s bokförda mätfälla); dropdown-beteendet regressionsprövas (släckaren ska fortsatt verka där).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Premiss-pass (ADR-086): worktree var redan på färsk origin/main (d68a484c,
inkluderar PR #690 auth-fond-blocket) — git fetch gav inga nya commits.
base.css:s fokus-sektion låg vid rad 177-232 (INTE rad 130-166 som
forskningsfilen citerar — den referensen är från FÖRE #690:s insättning av
auth-fond-blocket, exakt den "byggd mot fel del av kaskaden"-fälla kortet
varnade för). Läste FAKTISK fil, inte forskningsfilens citerade rader.

IMPLEMENTATION:
1. base.css: [data-rac]:focus-visible:not([data-focus-visible]) smalnad
   till [role="listbox"][data-rac]... + [role="listbox"] [data-rac]...
   (två selektorer). role="listbox" är React Arias EGET, dokumenterat fast
   attribut (react-aria/dist/private/listbox/useListBox.mjs: role:
   'listbox', aldrig konfigurerbart) — matchar exakt S73 K85-ytan utan
   markörklass på varje Popover-anropsplats.
2. Borttagen redundant .mm-fokusring-vid-fokus[data-rac]:focus (fanns för
   att defeat:a den breda släckaren) — död efter narrowing, hade blivit
   missvisande kod om kvarlämnad.
3. Input.tsx: <AriaInput> bär nu mm-fokusring-vid-fokus (plain :focus,
   deterministisk ring oavsett modalitet — samma val govuk-frontend/
   USWDS/Carbon gör källkodsverifierat).

MÄTFÄLLA BEKRÄFTAD EMPIRISKT (inte bara citerad): headless Chromium
(samma test:a11y-projekt CI kör) rapporterar getComputedStyle(el).
outlineColor FEL för RAC-textfält efter musklick — samma element gav
rgb(28,67,90) och rgb(28,70,96) i två körningar, medan --mm-focus-ring
konsekvent löser till rgb(27,73,101) (probat via separat span, samma
teknik som css-cascade.staging.test.ts). Riktig Chrome (chrome-devtools
MCP, headed, Chrome 150.0.0.0) gav rgb(27,73,101) — korrekt — för SAMMA
interaktion. outlineStyle var stabilt korrekt i BÅDA miljöerna. Alla nya
tester asserterar därför bara outlineStyle, aldrig färg.

Bidirektionellt bevis: stash:ade fixen, körde fokusring-musklick.spec.ts
mot ORIGINAL kod → Input/TextArea/ComboBox föll korrekt (outlineStyle
"none"); Select-regressionstestet var grönt även FÖRE (bevisar det testar
rätt sak, inte bara "alltid grönt"). Pop:ade stash, alla 4 gröna igen.

Verifierat i RIKTIG browser (chrome-devtools MCP, headed Chrome 150.0.0.0,
per kortets VERIFIKAT-krav): /dev/primitives Input — synlig ring vid
musklick (skärmdump + computed style, outlineColor rgb(27,73,101) exakt
token-match). Select-dropdown öppnad via mus — INGEN ring runt listbox
eller alternativ (S73 K85 intakt). /login — oförändrat, ring vid musklick
som förut (plain HTML, aldrig berört av ändringen).

SCOPE-BESLUT (registrerat, ej eget beslut fattat): TextArea-primitiven
fick INTE den explicita mm-fokusring-vid-fokus-klassen (kortets ARBETE
namngav bara "Input-primitiven"). Den FÅR ändå korrekt ring vid musklick
som sidoeffekt av narrowing (mätt, grönt test) — men determinismen vilar
på webbläsarens :focus-visible-heuristik snarare än egen CSS, en svagare
garanti än Input har (t.ex. vid programmatiskt fokus utan gest). Flaggas
som möjlig uppföljning, inte åtgärdat här (ingen scope-expansion på eget
bevåg).

Oanvänt/ej rört: PersonsListPrototyp.tsx:241 refererar "base.css:119-127"
för samma mekanism — redan stale FÖRE detta pass (pekar nu på
auth-fond-blocket, inte fokusregeln), orsakad av PR #690, inte av detta
kort. Ej fixat (orelaterad fil, DoD #4).
<!-- SECTION:NOTES:END -->
