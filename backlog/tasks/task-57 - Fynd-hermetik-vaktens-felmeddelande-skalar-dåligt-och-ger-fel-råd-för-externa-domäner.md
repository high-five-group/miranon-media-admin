---
id: TASK-57
title: >-
  Fynd: hermetik-vaktens felmeddelande skalar dåligt och ger fel råd för externa
  domäner
status: To Do
assignee: []
created_date: '2026-07-27 18:06'
updated_date: '2026-07-27 20:09'
labels:
  - ready-for-agent
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 När den saknade pathen ligger nära en registrerad handler lyfts den kandidaten fram EXPLICIT ovanför listan (formen "Menade du: GET /functions/v1/get-events?"), inte bara som en rad bland de andra
- [x] #2 Närhets-tröskeln är ett medvetet valt värde med motivering i koden; ingen kandidat lyfts fram när ingen är rimligt nära
- [x] #3 Meddelandet skiljer två fall: path under /functions/v1/ utan handler (åtgärd: lägg till handler) mot anrop till domän UTANFÖR fixturvärlden (åtgärd: undersök varför appen ringer dit). Externa domäner får inte EF-rådet som åtgärdsförslag
- [x] #4 Båda meddelandeformerna är enhetstestade mot OmockadRequestError — utfallet är mätt, inte visuellt granskat
- [x] #5 hermetik-vakt.spec.ts:s befintliga tvåsidiga bevis förblir grönt: vakten fäller fortfarande i båda fallen och hermetiken är oförändrad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MEKANISM: Levenshtein-avstånd (egen tvåradsimplementation, ~20 rader) mot EF-NAMNET, inte mot hela mönstret — alla handlers delar prefixet */functions/v1/, så ett avstånd över hela strängen hade dränkts av det gemensamma och fått varje kandidat att se nära ut.

TRÖSKELN ÄR LÅNAD, INTE PÅHITTAD (AC 2). TypeScripts getSpellingSuggestion utesluter kandidater vars avstånd överstiger 0,4 × det sökta namnets längd, och hoppar över avståndsberäkning för namn under 3 tecken (där bara skiftlägesokänslig likhet prövas). Kvoten tillåter ungefär en ersättning per fem tecken. Samma konstanter används här med källa angiven i koden (microsoft/TypeScript PR #15507). Verifierat via web-research mot primärkällans beskrivning; egen empiri räcker inte för ett tröskelvärde.

KLASSDELNINGEN (AC 3): efNamn() på request-pathen avgör klass. Träff på /functions/v1/ -> EF-meddelande (Menade du + lista + hur man lägger till/överskuggar). Ingen träff -> extern-meddelande, som varken listar EF-mockar eller nämner handlers.ts. Motiveringen står i koden: rätt fråga för en främmande adress är inte vilken handler som saknas utan varför appen ringer dit, och en handler för en tredjepartstjänst gör beroendet permanent i stället för synligt.

MEDDELANDENA LÄSTES, INTE BARA ASSERTADE. Assertions kan passera på ett fult meddelande, och kortet handlar om BRUKSVÄRDE — därför skrevs alla tre formerna ut och granskades som text före landning.

EN BEFINTLIG TESTPREMISS ÄNDRADES MEDVETET: "listar vad som VAR mockat" använde en EXTERN URL och krävde att alla handler-headers stod i meddelandet. Det är precis beteendet AC 3 river. Testet pekar nu på en EF-URL, där listan hör hemma, och ett nytt test kräver motsatsen för extern domän. Ändringen är i AC:ns riktning, inte runt den.

AC 5 HÅLLER: de två test.fail()-verkan-testerna är orörda och gröna — vakten fäller fortfarande i båda fallen och hermetiken är oförändrad.

RENSAT UNDER ARBETET: första utkastet bar fyra non-null-assertions med biome-ignore-rader. noUncheckedIndexedAccess är AV i tsconfig och regeln fyrade aldrig — alltså spekulativt brus jag själv lagt in. Borttaget.

GRINDAR: typecheck 0 fel · biome ren på rörda filer (6 varningar finns identiskt på main) · vakt-specen 8 passed · npm run test:visual 28 passed.

ÖPPEN AVVIKELSE, EJ BORTFÖRKLARAD: i en av fyra fulla visual-körningar föll personer.spec.ts. Den passerade isolerat och i tre efterföljande fulla körningar (28 passed x3). Artefakten hann skrivas över innan den lästes, så orsaken är INTE diagnostiserad. Testet ligger inte på denna ändrings kodväg — vaktens meddelande byggs bara vid ett omockat anrop, vilket personer-testet inte gör — men de tre nya testerna x två vyportar ändrar svitens schemaläggning, och det kan inte uteslutas som utlösare.
<!-- SECTION:NOTES:END -->
