---
id: TASK-131
title: >-
  Fynd: PRD task-126:s testbeslut styr datalösa tester in i acceptance-klassen,
  vars vakt strukturellt avvisar dem — repot saknar hemvist för
  webbläsarbeteende utan datadimension
status: To Do
assignee: []
created_date: '2026-08-02 17:26'
updated_date: '2026-08-02 17:35'
labels: []
dependencies: []
ordinal: 217000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
STOPPADE TASK-126.2 i CI natten 2026-08-02 (S96). PR #628 står RÖD och olandad. Detta är ett spec-konflikt, inte ett byggfel.

VAD SOM HÄNDE: TASK-126.2 (InstallPrompt, bibliotekskomponent) lade 11 acceptance-tester enligt PRD task-126 § Testbeslut, som säger ordagrant: 'Install-ytans externa beteende (rätt väg per plattform, prompt-flödet, instruktionens tillstånd) testas i acceptance-skarven — hermetiskt, utan staging.' Jobbet 'Test suite / Acceptance (hermetisk)' föll efter 7m12s. 164 tester PASSERADE — inget påstående fallerade. Det som fällde är scripts/hermetik-sjalvtest.mjs, som flaggar alla 11 nya tester med: 'Testet överlever utan fixturens svar och bevisar därför inget om appens databeteende.'

ROTORSAKEN: acceptance-klassen är DEFINIERAD av fixtur-beroende. hermetik-sjalvtest.mjs (task-60 / T104 / ADR-080 beslut 3) kräver att varje test i klassen faller med OmockadRequestError när fixturens svar tas bort. InstallPrompt har inget databeteende — den läser navigator.userAgent, matchMedia och beforeinstallprompt. Att dess tester överlever utan fixturen är korrekt av naturen. Vakten gör alltså rätt; det är placeringen som är fel.

INGEN UNDANTAGSVÄG FINNS: skriptet bär ingen scope-config och ingen exclusion-lista (verifierat: ingen .hermetik-policy.conf, .hermetik/ tom). ADR-080 beslut 3 gör vakten till VILLKOR för klassens existens, inte ett tillägg. Skriptets eget felmeddelande formulerar resolutionen binärt: 'Ett test som överlever utan fixturens svar hör inte hemma i klassen, eller behöver skrivas om så att det faktiskt konsumerar svaret det påstår sig pröva.'

DEN VERKLIGA LUCKAN: repot saknar en hemvist för Playwright-tester som prövar WEBBLÄSARBETEENDE utan datadimension. tests/acceptance/ kräver fixtur-beroende. tests/e2e/ är staging-bundet. tests/api/ är API. tests/a11y/ finns och kör faktiskt fixturfria Playwright-tester (TASK-126.2:s egna tre a11y-beteendetester ligger där och fälls INTE av vakten) — men katalogens namn säger a11y, inte beteende.

ALTERNATIV (ej beslutade — detta är Marcus):
A. Flytta de 11 testerna ur acceptance-klassen till en ny, explicit namngiven klass för datalöst webbläsarbeteende. Orkestrerarens rekommendation: vakten är konstitutiv by design, och att urholka den träffar exakt det ADR-080 skyddar.
B. Ge hermetik-sjalvtest.mjs en config-driven undantagslista per repots .conf-konvention. Billigast, men försvagar en vakt som ADR-080 gjorde till villkor.
C. Skriva om testerna så de konsumerar fixtur-data. Avrådes — konstlad koppling till en EF-yta komponenten inte rör.

FÖLJDER OAVSETT VAL: PRD task-126 § Testbeslut måste rättas (den styrde in dem fel), och TASK-126.2:s AC#4 refererar samma skarvar. Systerkorten 126.3 och 126.5 rör samma install-yta och ärver frågan.

INGET FEL HOS AGENTEN: den följde PRD:ns testbeslut exakt, körde npm run test:acceptance lokalt (161/162, den enda röda en känd hem-flake per TASK-121) och hade ingen lokal signal — hermetik-självtestet är ett separat CI-steg, inte del av sviten.
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
RÄTTELSE (orkestreraren, samma natt). Kortets och sessionsdokets ursprungliga formulering — att PR #628 'kan landa av sig själv när klassfrågan är avgjord' — är FEL och rättas här.

PR #628 är sedan 2026-08-02 ~17:33 UTC inte bara RÖD utan DIRTY. Main har avancerat 27 commits sedan grenens bas (d5aed8d1). Enda konfliktande filen är 'backlog/tasks/task-126.2 - ...md': grenen bär agentens AC/DoD-bockningar, main bär den parkerings-not orkestreraren skrev efter stoppet. Båda sidor är rena tillägg i olika sektioner — resolutionen är 'behåll båda', men den måste göras för hand.

#628 kräver alltså TVÅ åtgärder, inte en: (1) klassbeslutet i detta kort, och (2) en kortfils-konfliktlösning.

ORSAKEN ÄR ORKESTRERARENS EGEN: att skriva bokföring till ett kort vars ändringar ligger olandade i en öppen PR skapar garanterat en konflikt i just den filen. Noten hade kunnat bo enbart här och i sessionsdokets Del 4, som inte finns på grenen. Fångad som lessons-fragment.
<!-- SECTION:NOTES:END -->
