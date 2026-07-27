---
id: TASK-57
title: >-
  Fynd: hermetik-vaktens felmeddelande skalar dåligt och ger fel råd för externa
  domäner
status: To Do
assignee: []
created_date: '2026-07-27 18:06'
labels: []
dependencies: []
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt i TASK-54.3:s QA steg 2, som är designat för just detta: 'skillnaden mellan ett bra och ett dåligt felmeddelande syns bara' vid felstavning.

SYMPTOM 1 — stavfel lyfts inte fram. Ett anrop till /functions/v1/get-evnets (felstavat get-events) ger ett meddelande som listar alla mockade endpoints i registreringsordning. Utvecklaren måste själv ögna igenom listan och upptäcka likheten. Med dagens sju handlers går det. Acceptance-klassens nitton filer (ADR-080) kommer lägga till betydligt fler, och då blir listan en vägg av text där den mest sannolika kandidaten inte syns bättre än någon annan.

FÖRVÄNTAT BETEENDE: när den saknade pathen ligger nära en registrerad handler ska den kandidaten lyftas fram explicit — exempelvis 'Menade du: GET /functions/v1/get-events?' — i stället för att bara ingå i listan.

SYMPTOM 2 — externa domäner får EF-råd. Ett anrop till en helt främmande domän (mätt med https://api.nagon-extern-tjanst.com/v2/track) får exakt samma meddelande som en omockad Edge Function: en lista över EF-mockar och raden 'Handlers bor i tests/visual/support/handlers.ts'. Det är fel vägledning. För en främmande domän är rätt fråga inte vilken handler som saknas utan varför appen ringer dit alls — att lägga till en handler för en tredjepartstjänst är nästan aldrig rätt åtgärd.

FÖRVÄNTAT BETEENDE: meddelandet skiljer på två fall — en path under /functions/v1/ som saknar handler (lägg till en) och ett anrop till en domän utanför fixturvärlden (undersök varför det sker).

Ingen av bristerna är en regression: vakten fäller korrekt i båda fallen och hermetiken håller. Det är meddelandets BRUKSVÄRDE som brister, vilket är precis vad QA-kortet prövar och mekaniska grindar inte kan se.

Vakten bor i tests/visual/support/hermetik-vakt.ts.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
