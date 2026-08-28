---
id: TASK-33
title: 'supabase/config.toml har driftat: ~7 av ~20 EF:er listade'
status: To Do
assignee: []
created_date: '2026-07-23 02:06'
updated_date: '2026-08-28 05:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 4 (task-18.6:s bygg-agent).

supabase/config.toml listar bara ~7 av ~20 Edge Functions — create-event, send-email, get-event, get-registrations (nya) m.fl. saknas alla sedan Fas 6f. Supabase-default verify_jwt=true gör omissionen SÄKER (ingen EF exponeras oavsiktligt utan auth), men filen påstår sig vara 'deploy-tid-konfig per funktion' och är det inte längre — den ljuger om sitt eget innehåll.

FÖRVÄNTAT: antingen (a) komplettera filen till full EF-lista, eller (b) en grind som asserterar att varje supabase/functions/*/-katalog har en config.toml-post (samma klass som .prod-functions-allowlist-grinden).

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje katalog under supabase/functions/*/ har en motsvarande post i supabase/config.toml (verifierbart genom att jämföra katalognamn mot config.toml-nycklar — 0 saknade)
- [ ] #2 En grind (skript eller test, config-driven per repo-konvention) asserterar automatiskt att parität mellan supabase/functions/*/ och config.toml håller, så drift upptäcks framöver — inte bara denna gång
- [ ] #3 Grinden bevisat att fälla: en konstruerad avvikelse (borttagen post) ger rött, korrekt tillstånd ger grönt
- [ ] #4 Grinden wirad i CI och bevisat anropad (samma TASK-130-lärdom: verifiera faktisk anropskedja, inte bara existens)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
