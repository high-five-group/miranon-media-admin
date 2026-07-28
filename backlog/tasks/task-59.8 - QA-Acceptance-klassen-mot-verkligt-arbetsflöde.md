---
id: TASK-59.8
title: 'QA: Acceptance-klassen mot verkligt arbetsflöde'
status: To Do
assignee: []
created_date: '2026-07-27 20:42'
updated_date: '2026-07-28 12:52'
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



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
