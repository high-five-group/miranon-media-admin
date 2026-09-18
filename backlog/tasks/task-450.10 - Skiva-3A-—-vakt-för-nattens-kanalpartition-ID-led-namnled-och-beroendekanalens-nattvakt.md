---
id: TASK-450.10
title: >-
  Skiva: 3A — vakt för nattens kanalpartition (ID-led + namnled) och
  beroendekanalens nattvakt
status: To Do
assignee: []
created_date: '2026-09-18 11:52'
updated_date: '2026-09-18 23:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.1
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: high
ordinal: 799000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-09-18 (3A, S126 Del 9). Efter N2 (TASK-450.1) räknar nattens tre larmkanaler upp sina jobb för hand, och nattvakten bär en fjärde handhållen lista. I dag är uppräkningen komplett (3 + 4 + 1 = 8 av 8, verifierat av två granskare) men ingenting vaktar den: ett nionde nattjobb som glöms i alla listor blir TYST, och ett omdöpt jobb tystar hela produktkanalen utan att något fäller. Efter skivan fäller en CI-wirad invariant-vakt, i samma form som N4:s (check-aggregator-needs), i BÅDA leden som runda 2-granskaren av #2521 skrev ut: (i) jobb-ID-mängderna i de tre kanalernas triggrar partitionerar larmjobbens needs-lista utan överlapp och utan rest, OCH (ii) varje ID i produktkanalens trigger mappar till ett name: som nattvaktens prefixlista faktiskt matchar (prefix, inte likhet — nattsvitens jobb heter 'Nattlig fullsvit / <barnjobb>' i jobblistan). Skivan wirar också .nattvakt-kanal-policy.conf i ci.yml:s shellcheck-strict-uppräkning (skuld bokförd i filens huvud av N2). När K1 (b) (TASK-450.5) är byggd blir beroendekanalen enda vägen en extern sårbarhetsvarning mot oförändrat träd når en människa — den ska därför få en egen 'vaktens vakt' (dead man's switch, samma mönster som Prometheus Watchdog-larm): vakten ska märka om beroendekanalen borde ha fyrat men inte gjorde det. Bedöm om det byggs här eller som AC på TASK-450.5; säg vilket.

Täcker användarberättelser: 1, 2, 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tvåsidig testsvit mot sandlådekopior av nightly.yml: ett jobb borttaget ur alla tre triggrar FÄLLER med jobbets namn; ett jobb i två triggrar FÄLLER; riktiga filen PASSERAR
- [x] #2 Namnledet: ett ändrat name: på ett produktjobb (eller ett prefix som inte längre matchar något jobb) FÄLLER; riktiga filerna PASSERAR
- [x] #3 Vakten och dess testsvit är wirade i ci.yml och gröna i PR:ens lint-jobb; .nattvakt-kanal-policy.conf står i shellcheck-strict-uppräkningen
- [x] #4 Beroendekanalens nattvakt är byggd här ELLER uttryckligen lagd som AC på TASK-450.5, med skälet utskrivet
- [x] #5 Prosan i nightly.yml, .nattvakt-kanal-policy.conf, CONTRIBUTING § Nattnätet och ADR-082 som i dag säger att invarianten INTE är mekaniserad är rättad till att peka på vakten (ADR-083)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggd i samma form som N4 (check-aggregator-needs.mjs): scripts/check-nattkanal-partition.mjs härleder BÅDA leden ur nightly.yml (js-yaml) och .nattvakt-kanal-policy.conf (sourcad i en riktig bash-subprocess) — ingen femte handhållen lista. 17 fall / 24 assert i test-check-nattkanal-partition.mjs, tvåsidigt mutationsprövat (led i och led ii var för sig avstängda -> exakt de fyra förväntade fallen fälls). Extra bevis mot en muterad KOPIA av det RIKTIGA nightly.yml (inte bara den förenklade fixturen): drop av sessionsdok-fonster ur bokforings-arende-triggern -> FÄLLER; omdöpt suite-jobb -> FÄLLER (bägge leden samtidigt). Wirad i ci.yml lint-jobbet (ingen ny job/minut, samma placering som N4) + gatekeeper-testsviten. .nattvakt-kanal-policy.conf tillagd i shellcheck-strict (post 33). AC #4: beroendekanalens dödmansgrepp lagd som AC #7 på TASK-450.5 i stället för byggd här -- den kanalen blir lastbärande för hela beroendesäkerheten forst nar 450.5 landat (ADR-082 § Updates). AC #5: prosan rättad i nightly.yml, .nattvakt-kanal-policy.conf, CONTRIBUTING § Nattnätet, ADR-082 (+ nightly-watchdog.yml som bonus).
<!-- SECTION:NOTES:END -->
