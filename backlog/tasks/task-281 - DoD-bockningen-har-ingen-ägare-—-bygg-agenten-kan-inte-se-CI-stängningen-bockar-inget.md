---
id: TASK-281
title: >-
  DoD-bockningen har ingen ägare — bygg-agenten kan inte se CI, stängningen
  bockar inget
status: To Do
assignee: []
created_date: '2026-08-20 08:05'
updated_date: '2026-08-24 14:59'
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
- [x] #1 Rotorsaken är beskriven mot faktisk mekanik: var i arbetsformen bockningen faller mellan stolarna, belagt med minst två kort utöver 249.1/249.9
- [x] #2 Options-rymden är kartlagd innan en väg väljs — minst tre kandidater vägda mot varandra, t.ex. (i) orkestreraren bockar vid CI-verifiering som ett explicit steg i landnings-svepet, (ii) bygg-agenten armerar och bockar själv efter en CI-vakt, (iii) grinden slutar kräva rutan när CI-grönhet går att härleda maskinellt ur PR:en
- [x] #3 Vald väg är MEKANISERAD, inte nedskriven som prosa — ADR-083-disciplinen gäller: en regel utan mekanism efterlevs inte, och detta kort finns just för att bevisa det
- [x] #4 Death pointer-formen är åtgärdad: kortets Final Summary-mall bär det faktiska PR-numret, inte en hänvisning till notes som saknar det
- [x] #5 Lösningen är prövad mot ett verkligt kort från skapelse till Done utan att någon ruta lämnas obockad av en part som inte kan se utfallet
- [x] #6 Backlog-stängningsgrinden är körd efter ändringen och den nya klassen av post uppstår inte längre för kort som passerar den nya formen
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
LEVERERAD 2026-08-24 (S112 mandatpasset, beslut 2 — Marcus GO för väg iii).

MEKANISMEN, i två delar, båda i scripts/check-backlog-closure.sh + .backlog-closure-policy.conf:

(1) HÄRLEDD DoD-RAD + LANDNINGS-PEKARE. En obockad DoD-rad som matchar BACKLOG_HARLEDD_DOD_MONSTER ("CI grön per jobb") räknas inte längre som obockad — förutsatt att kortets Final Summary bär BACKLOG_LANDNINGS_PEKARE_MONSTER ("Landning: PR #<nr>"). Bocken (ett påstående av den som stängde kortet) byts mot en pekare (en maskinläsbar adress till landningen). Härledningens auktoritet är rulesetet: direktpush avvisas (ADR-076) och merge-kön mergar aldrig en röd post, så "CI grön per jobb" är en egenskap hos landningen, inte något en människa ska intyga.

(2) STÄNGNING MED AVSTÅDDA KRAV. Etiketten intentionally-unchecked PLUS markören "OBOCKAT MED AVSIKT:" i Notes eller Final Summary undantar ett STÄNGT kort från invariant 2. Tvåfaktors med flit — en enfaktors-form hade varit en blankocheck. Etikett utan markör fäller med eget meddelande.

VARFÖR INTE gh-API/git-ancestry (mätt hinder, inte bedömning): nattjobbet checkar ut med fetch-depth: 1 (.github/workflows/nightly.yml, jobbet "Backlog-stängning (natt-grind)"), så det finns ingen git-historik att matcha "Merge pull request #N" mot i CI, och ett nätverksberoende hade tvingat fram valet mellan tyst grönt och falskt rött i en required check. Grinden prövar pekarens NÄRVARO och FORM, inte dess sanning — öppen gräns, utskriven i grindens huvud.

MÄTT UTFALL: grinden 18 -> 14 inkonsistenta kort av 642 prövade. De fem instanser uppdraget namngav (283, 283.5, 285, 285.12, 286.6) passerar nu genom den nya formen. De 14 kvarvarande är den historiska skuld kortets AVGRÄNSNING deferrar (249.2/3/4/7, 283.1, 283.4, 284.4, 285.5/.6/.10, 286.1, 286.4) plus två öppna kort på invariant 1 (241.5, 309.1).

HUB-DEL FLAGGAD, EJ RÖRD: Final Summary-mallens ordalydelse bor i hubben, plugins/marcus-system/skills/do-work/SKILL.md steg 5 (b) — raden "Levererad · commit <sha> · CI-run <id> per jobb · ...". Den bör få "· Landning: PR #<nr>" i en separat hub-commit. Repo-sidan är gjord: backlog/config.yml:s DoD-mall namnger nu pekarformen, och grinden framtvingar den.

STÄNGNINGEN AV DETTA KORT SKA BÄRA "Landning: PR #<nr>" i sin Final Summary. DoD #3 lämnas obockad med avsikt — det är exakt den form kortet inför. Utan pekaren fäller grindens invariant 2 på just den raden, och grindens meddelande säger vad som saknas.
<!-- SECTION:NOTES:END -->
