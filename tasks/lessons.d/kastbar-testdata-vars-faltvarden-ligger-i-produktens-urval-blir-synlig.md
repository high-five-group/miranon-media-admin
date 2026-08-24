# Kastbar testdata vars fältvärden ligger inom produktens egna urval blir synlig för användaren — städbar är inte samma sak som osynlig

**En testfixturs NAMN gör den städbar; dess FÄLTVÄRDEN avgör om den syns. Ett
kastbart event med ett framtida startdatum hamnar i appens eventväljare precis
som ett riktigt, hur tydligt sentinel-prefixet än är. Välj därför värden som
faller UTANFÖR produktens normala urval, och lita aldrig på att en purge-target
räcker: en SETUP-purge städar före nästa körning, inte efter din — mellan dem
ligger skräpet framme.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.15`): `tests/api/save-event-text.staging.test.ts`
§ `createThrowawayEvent` (rad 70–89) skapar event med `startdatum: '2026-09-15'`
och `ort: sentinelOrt(suffix)` = `ZZ-TASK-309.3-text-<suffix>-<uuid>`. Sviten
har ingen teardown — filens egen not konstaterar att ingen återställning av
FÄLTVÄRDEN behövs, vilket är sant, men den skapar också EVENT och de raderas
aldrig. `.purge-staging-policy.json` HAR en target för familjen
(`save-event-text-eventplanering-sentineler`, `FIND('ZZ-TASK-309.3-', {Ort}) = 1`),
men `ci-suite.yml` rad 85 och 659–661 säger uttryckligen att purge-jobbet är en
**setup**-purge som körs FÖRE staging-stegen. Följden är att mängden aldrig har
en stabil nollpunkt: **44** poster med `ZZ-TASK-309.3-text-`-prefix mättes på
kortet 2026-08-24, och en oberoende omräkning senare samma dag (Airtable
staging, samma filter) gav **54** poster i hela `ZZ-TASK-309.3-`-familjen
varav **33** med `text-`-prefix. Kostnaden var inte lagringen: Marcus valde ett
av dem vid granskningen och såg en genereringsvy där varje block stod tomt —
testeventet har varken eventinnehåll eller platslänk — vilket läste som ett
designfel i vyn i stället för som frånvarande data, och kostade en
granskningsrunda.

**Det generella:** testdata i en delad icke-produktionsmiljö har två skilda
egenskaper som lätt slås ihop. IDENTIFIERBARHET (ett sentinel-prefix) löser
städning och är det man designar för. SYNLIGHET avgörs av helt andra fält —
datum, status, flaggor — och den designas sällan alls, eftersom testet bara
bryr sig om att posten existerar. Ett värde som är bekvämt för testet
(*"lägg det i framtiden så det är giltigt"*) är exakt det som placerar posten
i produktens standardurval. Två motmedel, båda behövs: välj fältvärden som
faller utanför urvalet där det går, och äg städningen i sviten själv
(teardown) med den delade purgen kvar som andra försvarslinje — aldrig som
första.
