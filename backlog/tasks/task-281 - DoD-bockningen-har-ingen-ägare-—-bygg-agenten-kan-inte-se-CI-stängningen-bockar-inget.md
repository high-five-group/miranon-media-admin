---
id: TASK-281
title: >-
  DoD-bockningen har ingen ägare — bygg-agenten kan inte se CI, stängningen
  bockar inget
status: To Do
assignee: []
created_date: '2026-08-20 08:05'
labels:
  - ready-for-agent
dependencies: []
ordinal: 507000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT MÖNSTER, inte en hypotes. Backlog-stängningsgrinden driver 15 kort i klassen 'status Done men DoD står obockade'. En utredning av TASK-249.1 och TASK-249.9 (S107, 2026-08-20) visade att det inte är 15 slarvfel utan EN strukturell lucka som producerar samma post varje gång.

MEKANIKEN:
1. Bygg-agenten lämnar DoD-rutan 'CI grön per jobb' obockad BY DESIGN — den kan inte se CI-utfallet, eftersom dess arbete slutar vid pushen. TASK-249.5 kommentar #1 säger det verbatim: 'DoD-status: #3 (CI grön per jobb) lämnas obockad — CI-verifikation ägs av orkestrerarens svep, inte av mig.'
2. Stängnings-commiten flippar bara status till Done. Mätt på ea1cffbc: enda ändringen på korten är status, updated_date och ett Final Summary-block. NOLL kryssrutor rörda.
3. Ingen part äger steget däremellan. CI blir grön, signalen kommer, och ingen går tillbaka.

Följden: varje PRD med bygg-agent-skivor producerar en ny kull kort som grinden larmar om. Fyra kort i TASK-249-familjen bär spåret (249.5, 249.6, 249.9 + 249.1).

MÄTT KONSEKVENS: nattnätets backlog-grind gick från 20 drivande kort (2026-08-18) till 31 (2026-08-20) på två dygn. Grinden larmar korrekt men mängden växer snabbare än den städas.

TRE BIFYND I SAMMA RIKTNING (samma utredning):
(a) Korten pekar på ingenting. Final Summary säger 'PR: se kortets notes/kommentarer' men varken 249.1 eller 249.9 innehåller något PR-nummer. Numren (#1480, #1510) gick bara att få fram via git log --grep. Death pointer i mall-form.
(b) Motstridig bockning av identisk text. TASK-249.6 DoD #7 är bockad med utskriven motivering; TASK-249.1 DoD #7 — ordagrant samma text, samma sakläge — är obockad.
(c) TASK-249.8 är stängd med Marcus slutkvittens 'Ser bra ut' men har samtliga fem DoD-rutor obockade.

AVGRÄNSNING: detta kort löser MEKANISMEN. Den historiska skulden (de 15 korten) är en separat fråga som väntar Marcus vägval — en retroaktiv verifieringsrunda eller ett policy-undantag. Städa inte historiken här; hålet är uppgiften.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken är beskriven mot faktisk mekanik: var i arbetsformen bockningen faller mellan stolarna, belagt med minst två kort utöver 249.1/249.9
- [ ] #2 Options-rymden är kartlagd innan en väg väljs — minst tre kandidater vägda mot varandra, t.ex. (i) orkestreraren bockar vid CI-verifiering som ett explicit steg i landnings-svepet, (ii) bygg-agenten armerar och bockar själv efter en CI-vakt, (iii) grinden slutar kräva rutan när CI-grönhet går att härleda maskinellt ur PR:en
- [ ] #3 Vald väg är MEKANISERAD, inte nedskriven som prosa — ADR-083-disciplinen gäller: en regel utan mekanism efterlevs inte, och detta kort finns just för att bevisa det
- [ ] #4 Death pointer-formen är åtgärdad: kortets Final Summary-mall bär det faktiska PR-numret, inte en hänvisning till notes som saknar det
- [ ] #5 Lösningen är prövad mot ett verkligt kort från skapelse till Done utan att någon ruta lämnas obockad av en part som inte kan se utfallet
- [ ] #6 Backlog-stängningsgrinden är körd efter ändringen och den nya klassen av post uppstår inte längre för kort som passerar den nya formen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
