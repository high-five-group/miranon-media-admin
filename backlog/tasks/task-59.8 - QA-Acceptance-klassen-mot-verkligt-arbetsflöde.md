---
id: TASK-59.8
title: 'QA: Acceptance-klassen mot verkligt arbetsflöde'
status: Done
assignee: []
created_date: '2026-07-27 20:42'
updated_date: '2026-07-28 12:58'
labels:
  - ready-for-human
dependencies:
  - TASK-59.1
  - TASK-59.2
  - TASK-59.3
  - TASK-59.4
  - TASK-59.5
  - TASK-59.6
  - TASK-59.7
parent_task_id: TASK-59
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell prövning av det mekaniska grindar strukturellt inte kan se: om klassen är BRUKBAR, och om den säger sanningen om vad den bevisar.

STEG 1 — Öppna en PR som bara rör en av de arton ytorna. Mät hur lång tid det tar innan du har ett svar. Jämför med hur det kändes före. Frågan är inte om talet blev mindre utan om ÅTERKOPPLINGEN blev användbar.

STEG 2 — Läs en av de flyttade filerna som om du aldrig sett repot. Går det att avgöra av filens klass och söm vad den bevisar? Eller måste du läsa kroppen för att veta om den säger något om appen eller om datakällan? Klassbytet var hela poängen — om det inte syns är poängen inte levererad.

STEG 3 — Sabotera medvetet. Ta bort en handler som en flyttad fil behöver och kör den. Fäller vakten? Namnger meddelandet adressen? Föreslår det närmaste träff? Det är det skarpa provet på att hermetiken är en vakt och inte en konvention.

STEG 4 — Skriv ett NYTT acceptance-test från noll, utan att fråga någon. Hittar du hur man överskuggar en delad handler? Hittar du var handlers bor? Blev det bekvämt eller klurigt? Nitton filers värde av framtida arbete hänger på svaret.

STEG 5 — Gör en överskuggning med ett medvetet felstavat mönster. Ser du att den inte slog igenom, eller ser testet ut att passera? Detta är klassens enda tysta felläge och det ska kännas i handen hur lätt det är att gå på.

STEG 6 — Framkalla ett kontraktsvakts-larm och läs det som om du blev väckt av det. Går det att förstå VAD som glidit och vad du ska göra, eller måste du börja utreda?

STEG 7 — Kontrollera att API-sviten är orörd och fortfarande bevisar det den ska. Klassbytet får inte ha trubbat repots enda bevis för att Airtable beter sig som koden tror.

AVVIKELSER BOKFÖRS SOM NYA KORT med exakt symptom och förväntat beteende. Gamla planer retuscheras inte.

Täcker användarberättelser: 2, 3, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga sju steg körda och utfallet nedskrivet per steg — inklusive de som inte gav något fynd
- [x] #2 Varje fynd är registrerat som eget kort med symptom och förväntat beteende; inget fynd bor enbart i QA-anteckningen
- [x] #3 API-sviten verifierad orörd i omfattning och utfall
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sju steg körda på Marcus delegering; utfall nedskrivet per steg i sessionsdok Del 17 (även de två steg som inte gav fynd). Steg 2 och 4 delegerades till subagenter av metodologiska skäl — båda kräver en läsare som genuint aldrig sett repot.

LEVERERADE OCKSÅ AC #3:s POSITIVA GREN, som TASK-59.7 inte kunde köra: PR #335 (steg 4:s test) hade hela sin diff under tests/acceptance/** och gav Staging sentinel purge=skipped, Staging (API + E2E)=skipped, Acceptance (hermetisk)=grön — exakt receptet i mätningen § 7. Klassningen bekräftad korrekt, ej riven.

Återkoppling mätt: 7 min 33 s totalt, varav noll väntan på annan körning. Lint/typecheck 43 s, Pure+Build 1 min 2 s, acceptance 7 min 01 s.

FEM FYND SOM EGNA KORT: TASK-62 (överskuggning som aldrig matchar är omekaniserad — 3 röda vars fel aldrig nämner orsaken, 1 grönt på fel data; MSW:s isUsed+listHandlers källverifierade) · TASK-63 (0/18 filer typar fixturrader mot z.infer) · TASK-64 (svit-flakighet under workerlast, baseline fällde mest, retries: 2 maskerar) · TASK-65 (2,2 s marginal mot retrykedjan) · TASK-66 (tidsdimensionen odokumenterad).

INGET FYND: steg 3 (vakten fäller, namnger adress, föreslår rätt granne) och steg 6 (kontraktsvaktens larm är direkt handlingsbart).

FÖRKASTAT EXPLICIT: vaktens 'Menade du' pekade på en äkta grann-EF — tröskeln är lånad och källbelagd, raden är en fråga, hela listan står under.

LÄMNAT TILL MARCUS: dubbla support-kataloger (två oberoende färska läsare snubblade på samma sten) + namn-invändningen mot 'acceptance'. Omdöpningar är scope-beslut, ej QA-fynd.

TVÅ EGNA METODFEL BOKFÖRDA: steg 3 krävde tre försök — de två första saboterade handlers filen inte använde. Ett sabotage som inte fäller har inte bevisat att vakten är svag.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
