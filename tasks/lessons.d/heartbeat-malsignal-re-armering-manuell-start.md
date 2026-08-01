# Heartbeaten: nyckla på målsignalen, re-armera vid varje väckning, den startar inte av sig själv

**En landningssvep-heartbeat är bara så bra som den tillståndsändring den
nycklas mot — poll en proxy och vakten väcker på brus eller missar helt det
den finns för att upptäcka. En armering är dessutom inte ett minne mellan två
väckningar: kommandot som armerar är billigt och idempotent, så kör det igen
i stället för att lita på gårdagens svar. Och vakten själv är konvention, inte
mekanism — ingen hook eller cron startar den åt dig; glöms starten är hela
väckningskedjan naken.** `[UNIVERSAL]`

**Empiri (S91, tjugoandra resumen, 2026-08-01→02 — orkestrerarens egna
mätningar från den pågående sessionen, ännu inte skrivna till sessionsdoket
när detta fragment landades; källmärkta som sådana i stället för prövade mot
en skriven källa).**

## 1. Nyckla på målsignalen, inte på närmsta observerbara

Tre iterationer av landningssvepets heartbeat mättes samma kväll:

- **Nycklad på `mergeStateStatus`** → väckte på brus. Dependabot-PR:er
  flappade `UNKNOWN`→`CLEAN` utan att något faktiskt hänt i kön.
- **Nycklad på öppna PR-MÄNGDEN** → väckte på nya agent-PR:er som
  task-notifikationer redan täcker — redundant väckning, samma händelse
  rapporterad två gånger av två olika kanaler.
- **Nycklad på main-toppens SHA** (`git ls-remote origin main`) → väcker
  exakt på landningar, vilket är det svepet faktiskt behöver.

Regeln: fråga *"vilken tillståndsändring ska utlösa mitt svep?"* och polla
DEN, inte en proxy som råkar korrelera med den. En proxy som korrelerar
löst väcker för ofta (brus) eller för sällan (missad täckning) — sällan
exakt rätt.

## 2. En armering är inte ett minne — re-armera vid varje väckning

PR #565 armerades med `gh pr merge --auto --merge` och svaret såg ut som en
lyckad armering (*"The merge strategy for main is set by the merge
queue"*), men vid nästa svep var PR:en INTE köad — samma kommando gav
strategi-svaret igen i stället för `already queued to merge`.

Disambigueringen (armera på nytt, läs det faktiska svaret) är billig och
idempotent, så det finns ingen anledning att lita på ett tidigare
armerings-försök som fakta. Detta är `CLAUDE.md` § Landnings svep-regel
(*"armera det som står oarmerat"*) andra empiriska bekräftelse — samma
mönster som `failed_checks`-utsparkningens tysta armeringskonsumtion
(`TASK-115`): en PR kan se identisk ut oavsett om den faktiskt är armerad
eller ej, så gissa aldrig — fråga kommandot igen.

## 3. Heartbeaten är konvention, inte mekanism

Den startas för hand som bakgrunds-bash (~90 s poll), med en ändlig
livslängd (~30 min) och en timeout-rapport så jobbet aldrig blir en tyst
evighetsloop. Ingen hook eller cron startar den åt orkestreraren.

**Praktisk konsekvens:** glöms starten är hela väckningskedjan T112-naken —
svepet den skulle utlösa uteblir helt utan att något syns fela. Detta är ett
medvetet, inte ett bortglömt, hål: cron-mekanisering är VILANDE på Marcus
beslut tills `T111`-bygget (källa: `tasks/threads/README.md` T112-radens
§ Åtgärdsval, punkt (i); `CLAUDE.md` § Landning, stycket *"Svep vid varje
väckning"*).
