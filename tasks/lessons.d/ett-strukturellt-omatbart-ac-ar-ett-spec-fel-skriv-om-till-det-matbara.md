# Ett strukturellt omätbart AC är ett spec-fel — skriv om till det mätbara, bocka aldrig på tro

**[UNIVERSAL] Ett acceptanskriterium som kräver något strukturellt
omätbart (byte-lika pixlar där matematiken själv gör exakt likhet omöjligt)
klassades av en granskare som ett bygg-fel — men bristen låg i kriteriets
formulering, inte i implementationen.** Mätt 2026-09-08 (S124 Del 6,
PR #2469 runda 1, `tasks/sessions/2026-09-08-session-124.md`): AC:t
krävde att pixlar under ett rullningsskrim skulle vara byte-lika med brickans pixlar
utanför skrimmet. Vid FULL bandstyrka höll det exakt; vid DELVIS
bandstyrka gav en 8-bitars alfakomposit-avrundning upp till 1/255 avvikelse
per kanal — ett generiskt gränsvärde för blend-matematik, inte ett
implementationsfel (samma restfel uppmättes mot en helt annan
kompositionsteknik som kontroll). Ett annat AC i samma PR krävde en lokalt
grön visuell regressionsgrind vars pixelbaslinjer är gitignorade för
utvecklarens plattform (bara CI:s linux-körning kan föda dem) — ett krav
som INTE kan uppfyllas lokalt oavsett hur korrekt koden är. Regel: ett AC
som är strukturellt omätbart i den kontext det ska verifieras i (matematisk
avrundning, en miljö-asymmetri mellan lokalt och CI) är ett SPEC-fel, inte
ett bygg-fel. Skriv om kriteriet till det faktiskt mätbara (en explicit
tolerans, eller var mätningen verkligen kan ske) i stället för att lämna
det obockat på obestämd tid eller bocka det på tro utan mätning bakom.
