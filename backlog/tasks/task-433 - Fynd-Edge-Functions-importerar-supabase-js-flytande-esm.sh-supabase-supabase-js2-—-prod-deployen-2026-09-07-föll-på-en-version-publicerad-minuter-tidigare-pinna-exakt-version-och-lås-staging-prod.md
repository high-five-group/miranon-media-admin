---
id: TASK-433
title: >-
  Fynd: Edge Functions importerar supabase-js flytande
  ('esm.sh/@supabase/supabase-js@2') — prod-deployen 2026-09-07 föll på en
  version publicerad minuter tidigare; pinna exakt version och lås staging =
  prod
status: To Do
assignee: []
created_date: '2026-09-07 17:11'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 760000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Marcus prod-deploy 2026-09-07 ~16:45 UTC (S123 resume 1), fas4-prod-deploy.sh --deploya föll på första funktionen (compute-segment) med 'Failed to bundle the function (reason: Module not found https://esm.sh/@supabase/functions-js@2.116.0/denonext/functions-js.mjs at https://esm.sh/@supabase/supabase-js@2.116.0:3:8)'. Orsak, mätt: supabase/functions/_shared/{auth,betalningar-db,inbetalning-notering,storage-kopiera}.ts importerar 'https://esm.sh/@supabase/supabase-js@2' (major-pinne, flytande); npm publicerade supabase-js 2.116.0 kl 16:26:56 UTC samma dag (npm view time), och esm.sh hade inte hunnit bygga functions-js@2.116.0:s denonext-artefakt när Supabases bundlare bad om den. Andra körningen (~16:55 UTC) gick igenom — prod bär nu 2.116.0 medan staging-EF:erna (bundlade 2026-09-06 17:07 UTC) bär 2.115.0: staging ≠ prod i biblioteksversion tills staging deployas om. Marcus: 'Deployen har ALDRIG strulat förut.' Åtgärd: (1) pinna EXAKT version i alla fyra _shared-filerna (och andra esm.sh-importer med flytande major — inventera med grep 'esm\.sh/@[^"]*@[0-9]+"'), samma version i alla; (2) välj versionen medvetet (den staging redan verifierat, eller 2.116.0 efter en staging-omdeploy + grön post-merge) och bokför valet; (3) en grind (gatekeeper-skript, CI-wirad, config-driven per CLAUDE.md § Custom CI-grindvakts-logik) som fäller flytande major-pinnar i supabase/functions/** — tvåsidig testsvit; (4) docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Inkrementell deploy får en rad om felklassen (CDN-bygge pågår ⇒ kör om, skriptet är idempotent) så nästa läsare känner igen den; (5) lessons-fragment [UNIVERSAL]: en flytande beroendepinne gör varje deploy till ett lotteri mot upstreams publiceringsklocka. Uppgradering av supabase-js i framtiden sker via en avsiktlig PR, aldrig via deploy-tidpunkt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla esm.sh-importer i supabase/functions/** bär exakt version (inventering i notes); staging och prod bundlade mot samma version, verifierat med functions list på båda
- [ ] #2 Grind som fäller flytande major-pinnar CI-wirad med tvåsidig testsvit
- [ ] #3 Runbooken bär felklassen och omkörnings-regeln; lessons-fragment landat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
