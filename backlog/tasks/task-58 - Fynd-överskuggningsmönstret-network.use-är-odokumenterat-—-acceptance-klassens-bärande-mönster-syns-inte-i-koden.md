---
id: TASK-58
title: >-
  Fynd: överskuggningsmönstret network.use() är odokumenterat —
  acceptance-klassens bärande mönster syns inte i koden
status: Done
assignee: []
created_date: '2026-07-27 18:07'
updated_date: '2026-07-27 20:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt i TASK-54.3:s QA steg 5 (läs koden som en ny agent skulle).

SYMPTOM: För att låta ETT test returnera ett annat svar än den delade handlern används network.use(handler) via den exponerade network-fixturen. Mönstret fungerar — verifierat i QA steg 3: överskuggningen gav status 500 i sitt eget test och läckte INTE till nästa (som fick 200 med tre event). Men det står ingenstans i fixturmodulerna.

En ny agent som öppnar tests/visual/support/ hittar: var handlers bor (handlers.ts), vad kontraktet är (EF-protokollet), vad vakten gör (hermetik-vakt.ts) och varför optionerna är satta. Den hittar INTE hur man överskuggar lokalt, och inte att network-fixturen är den yta ett test ska nå. Kunskapen finns bara i MSW:s egen dokumentation och i den här sessionens huvud.

VARFÖR DET ÄR MER ÄN EN TRIVIALITET: TASK-54:s PRD-användarberättelse 5 är uttryckligen 'som utvecklare vill jag kunna överskugga en delad handler lokalt i ett test, så att specialfall inte tvingar fram en egen fixturvärld'. TASK-54.2:s kort säger om samma mönster: 'Detta är mönstret acceptance-klassens filer kommer luta sig mot, så det ska vara bekvämt, inte klurigt.' Nitton acceptance-filer ska skrivas mot ett mönster som inte är nedskrivet.

FÖRVÄNTAT BETEENDE: fixturmodulen dokumenterar hur ett test överskuggar en handler lokalt och att överskuggningen är per test — helst med ett kort exempel i docblocken där handlers eller fixturen definieras, så att den som ska skriva en acceptance-fil hittar det utan att läsa bibliotekets dokumentation eller git-historik.

Detta är dokumentationsskuld, inte en defekt: mekanismen fungerar och är bevisad. QA-kortet föreskriver att sådan skuld bokförs som fynd.
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
- [x] #1 Överskuggnings-mönstret network.use(handler) är dokumenterat DÄR fixturen eller handlers definieras (hermetic.ts eller handlers.ts) — inte i en fristående fil — med ett kort exempel som visar hela anropet
- [x] #2 Dokumentationen slår fast att överskuggningen gäller PER TEST och namnger mekanismen som gör den det, så att läsaren slipper anta isoleringen
- [x] #3 network-fixturen är namngiven som den yta ett test når mönstret genom — TASK-54:s användarberättelse 5 går att läsa ut ur koden utan MSW:s egen dokumentation
- [x] #4 Exemplets form är verifierad mot bibliotekets faktiska typ (NetworkFixture) eller mot ett körande test — inte skriven ur minnet
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dokumentationen lades i hermetic.ts som ny sektion "ÖVERSKUGGA EN DELAD HANDLER I ETT ENSKILT TEST" i den befintliga docblocken över network-fixturen — alltså där fixturen faktiskt definieras — plus en pekare i handlers.ts docblock så att en läsare som landar på "vad är mockat" hittar vidare till "hur ändrar jag det för ETT test".

VERIFIERAT, EJ ANTAGET (fyra påståenden mot biblioteket):
- Signaturen use(...runtimeHandlers: Array<AnyHandler>): void läst i msw/lib/core/experimental/setup-api.d.ts. NetworkFixture = Omit<SetupApi, dispose> & {enable, disable}, alltså ärvs use() från SetupApi.
- PRECEDENSEN: handlers-controller.js rad 82 bygger [...overridesForKind, ...existingForKind] — overrides PREPEND:as, och första träffen vinner. Dokumentationen påstår därför precedens som är läst, inte gissad.
- ISOLERINGEN är STRUKTURELL: network är test-scopad ({auto: true} styr bara autostart, inte scope), så defineNetworkFixture körs om per test och bygger ny handlers-controller ur delade handlers-arrayen via super(...options.initialHandlers). disable() -> super.dispose() + unroute är TEARDOWN, inte det som ger isoleringen. Den distinktionen står i texten eftersom fel orsak inbjuder till fel slutsats (t.ex. att ett städsteg kan glömmas).
- EXEMPLET KÖRDES: kastbart spec-par (test A överskuggar get-events till 500 -> fixturens event renderas inte; test B direkt efter -> normalläget tillbaka). 2 passed. Enda skillnaden mellan A och B är use()-anropet, så precedensen OCH frånvaron av läckage är belagda i exakt den dokumenterade formen. Filen raderad per [DEBUG-]-kontraktet.

EGET FEL FÅNGAT FÖRE LANDNING: första utkastet skrev mönstret som "/**" + "/functions/v1/get-events" för att undgå att */ stänger blockkommentaren — men den splitten gav ett ANNAT mönster än handlarnas */functions/v1/. Rättat till "*" + "/functions/v1/..." (filens eget idiom, samma som page.route("**" + "/*")), och varför strängen är delad står nu i texten så att ingen kopierar den delade formen in i en riktig testfil.

UTÖVER AC:NA, medvetet: fällan där en överskuggning med felstavat mönster tyst gör INGENTING (handlern läggs först men matchar aldrig -> anropet faller igenom till den delade handlern -> testet ser normalläget och kan passera felaktigt). Hermetik-vakten kan strukturellt inte se detta, eftersom anropet ÄR mockat. Skrevs in eftersom nitton acceptance-filer ska luta sig mot mönstret och detta är dess enda tysta felläge.

GRINDAR: typecheck 0 fel · biome rena på båda rörda filer (6 varningar finns identiskt på main, pre-existerande baslinje) · npm run test:visual 22 passed 17,9 s utan baseline-avvikelse.
<!-- SECTION:NOTES:END -->
