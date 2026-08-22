---
id: TASK-288
title: 'Backfill: referenser-fält (__aria__-sökvägar) i 22 stämplade facit-ytor'
status: To Do
assignee: []
created_date: '2026-08-22 09:35'
updated_date: '2026-08-22 09:39'
labels:
  - ready-for-human
dependencies: []
ordinal: 532000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backfill: strukturerat `referenser`-fält (ariaSnapshot-sökvägar + sha256) på varje stämplad yta i `tasks/sessions/bilagor/*/facit.json`.

MEKANISMEN FINNS REDAN OCH ÄR LEVANDE (ADR-102 § Updates 2026-08-22, T157, landat i `31248808` / PR #1748 — se PREMISS-PASS nedan för hur denna agent verifierade det). `scripts/check-facit.sh` invariant (d): ett STÄMPLAT manifests deklarerade `referenser[].sha256` är innehållslåsta mot filens faktiska sha256 (schema: `scripts/lib/facit-validera.mjs`, `referenser: [{ fil: string, sha256: <64 hex, gemener> }]`). Hash-jämförelsen hoppas över för `"godkand": null`. Grinden skriver ut täckningen VID VARJE KÖRNING (verifierat genom att köra den, 2026-08-22):

    ✅ Facit-manifest OK: 12 manifest, 27 ytor deklarerade, 2 ogodkända (...)
       Innehållslås (invariant d): 0 referenser låsta mot sha256 i stämplade manifest; 22 stämplade ytor saknar "referenser" och är därmed INTE innehållslåsta.

UTGÅNGSSIFFRA: **22 av 22** stämplade ytor saknar `referenser` (mekaniskt verifierat ovan, 2026-08-22 — matchar både check-facit.sh:s slutrad, T157:s stängningsnotis och `.facit-policy.conf`:s nya "SYSKONREGEL"-avsnitt). Endast 4 av 12 manifest namnger sina `__aria__`-sökvägar i fritext (manifestens "not"-fält: s90-personlistan, s93-atgardssida, s93-hallplats, s103-persondetalj) — resterande 8 manifest (11 av de 22 ytorna) kräver mätning per yta innan `fil`+`sha256` kan fyllas i. (Mindre inkonsekvens, ej denna agents att rätta: `check-facit.sh`:s EGEN kommentartext säger på en rad "21 av 22" men skriptets FAKTISKA körning ger "22" — se PREMISS-PASS.)

MARCUS-MOMENT, VARFÖR: `scripts/deny-facit-godkand-skrivning.sh` (ADR-104 § Beslut 2) nekar VARJE Edit/Write mot ett facit-manifest vars RESULTERANDE `godkand` är icke-null — oavsett om det rörda fältet är `godkand` självt eller något annat, eftersom hjälparen bara läser sluttillståndet (mätt exit 2 på en Edit som enbart lade till en nyckel, 2026-08-22, se `.facit-policy.conf`s nya avsnitt + `tasks/sessions/bilagor/s90-personlistan-konvergens/AMENDERING-2026-08-22-task-286-2-referenser.md`). En agent kan alltså inte skriva `referenser` i något av de 22 stämplade manifesten — bara Marcus, via `!`-kanalen, kan.

AGENT-GÖRBART FÖRARBETE: en agent kan producera KARTAN (yta → `{ fil, sha256 }` för varje ariaSnapshot-referens under `tests/visual/__aria__/...`) för samtliga 22 stämplade ytor, som underlag Marcus klistrar in. Detta kräver INGEN skrivning mot facit.json — bara läsning av `__aria__`-katalogerna + manifestens "kallor"/"not"-fält, plus `shasum -a 256` på varje hittad `.aria.yml`-fil.

PREMISS-PASS (ADR-086, körd av den agent som skrev detta kort, 2026-08-22): uppdraget som initierade detta kort citerade "check-facit.sh invariant d", "ADR-102 § Updates 2026-08-22" och T157 som redan byggda. Vid FÖRSTA fetch (`origin/main` @ `8515abfd`) var detta FALSKT — ingen invariant (d) fanns, ADR-102 hade ingen Updates-sektion, T157 var `paused`. Ett andra `git fetch` (mitt i samma agent-tur) visade att `31248808` — "docs(ADR-102): [T157] amenderings-mekaniken för ett stämplat facit + invariant (d)" — hade landat via PR #1748 UNDER tiden denna agent arbetade. Efter rebase mot `origin/main` (nu `ef360c8d`) är hela uppdragets premiss VERIFIERAD SANN, mekaniskt körd, inte bara läst: `bash scripts/check-facit.sh` gav exakt utskriften ovan. Detta är själva ADR-086-fallet "en 'saknad' referens kan vara en landning du inte sett, inte ett fel i uppdraget" — bokfört här som exempel, inte som varning om uppdraget.

Referenser: `ADR-102` § Updates 2026-08-22 (`docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md#2026-08-22--amenderings-mekaniken-för-ett-stämplat-facit-t157`), `ADR-104` § Beslut 2, `T157` (`tasks/threads/T157-adr-102-saknar-amenderings-mekanik-for-stamplat-facit.md`, closed 2026-08-22), `scripts/check-facit.sh` (invariant d + header), `.facit-policy.conf` § "SYSKONREGEL: ytans referenser deklareras vid SAMMA ögonblick", `scripts/lib/facit-validera.mjs` (schema).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Agent-görbart förarbete: en fullständig karta (yta → [{ fil, sha256 }] för varje ariaSnapshot-referens under tests/visual/__aria__/...) producerad för samtliga 22 stämplade ytor i de 12 manifesten under tasks/sessions/bilagor/ (exkl. arkiverat s55-hem-konvergens). Kräver ingen skrivning mot facit.json — bara läsning av __aria__-katalogerna + manifestens kallor/not-fält, plus shasum -a 256 per hittad .aria.yml-fil. Bifogas kortet (t.ex. som notes eller en egen fil).
- [ ] #2 Marcus-moment: Marcus har, via !-kanalen (scripts/deny-facit-godkand-skrivning.sh nekar all agent-skrivning mot ett stämplat manifest, ADR-104 § Beslut 2), skrivit fältet `referenser: [{ fil, sha256 }]` (schema: scripts/lib/facit-validera.mjs) in i samtliga 22 stämplade ytors manifest-poster i tasks/sessions/bilagor/*/facit.json, med kartan (AC #1) som underlag. `godkand`-blocken (av/datum/citat/sha) lämnas oförändrade.
- [ ] #3 `bash scripts/check-facit.sh` körd efter skrivningen visar raden "Innehållslås (invariant d): 22 referenser låsta mot sha256 i stämplade manifest; 0 stämplade ytor saknar 'referenser'" (siffrorna kan avvika om ytornas faktiska referens-antal skiljer sig från 1 per yta — då gäller "0 saknar", inte det exakta talet 22). Exit 0.
- [ ] #4 Manifestens strukturella konsistens (scripts/lib/facit-validera.mjs, invariant b) obruten för samtliga 12 manifest efter skrivningen — varje deklarerad `referenser[].fil` finns på disk och `sha256` matchar filens faktiska hash (invariant d, ingen AMENDERING-sidofil ska behövas eftersom detta är EN förstagångsdeklaration, inte en ändring av en redan låst referens).
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
