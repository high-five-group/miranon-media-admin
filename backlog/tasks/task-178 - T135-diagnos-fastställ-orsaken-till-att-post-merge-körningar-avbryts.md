---
id: TASK-178
title: 'T135-diagnos: fastställ orsaken till att post-merge-körningar avbryts'
status: Done
assignee: []
created_date: '2026-08-10 06:15'
updated_date: '2026-08-10 08:59'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 335000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge är primär bärare av staging-kontrollen (A7:5); en avbruten körning ger larm utan dom — sex larm på ett dygn, reproducerad 2/2 per tråden. Utan diagnos är nattbatchens 'grönt på main' otillförlitligt — därför första vågen i kvällens batch.

Källa: tasks/threads/T135-post-merge-korningen-avbryts-trots-att-filen-sager-aldrig.md.

Diagnos först (rotorsak, ej lappning). Åtgärd som kräver arkitektur-/policybeslut eskaleras till Marcus i stället för att byggas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rotorsaken fastställd med belägg: run-id:n, event-data, workflow-config-läsning
- [x] #2 Åtgärdsväg föreslagen med källhänvisningar
- [x] #3 Om fixen är trivial och riskfri: levererad med tvåsidigt bevis; annars öppet eskalerad
- [x] #4 T135-tråden uppdaterad med diagnosen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROTORSAK FASTSTÄLLD (ej mutex-eviction — utesluten): test-staging-jobbets
EGET timeout-minutes: 12 (ci-suite.yml). Tre reproducerade instanser
(31196593426/31197915169/31198327068, 2026-08-07) mätte jobb-väggklocka
via gh api jobs/<id> (started_at→completed_at): 12m16s / 12m15s / 12m15s —
exakt taket. queue: max (staging-tests-gruppen) kan per GitHubs dokumentation
bara evictera VÄNTANDE poster, aldrig en redan pågående — alla tre hade
redan klarat API-steget (194 passed) innan E2E avbröts. GitHub visar samma
generiska "The operation was canceled" för timeout OCH grupp-eviction sedan
en plattformsändring (community-diskussion #40582) — därför läste den
ursprungliga tråden signaturen som mutex-krock.

Utlösande orsak till overrunet (VARFÖR jobbet gick över 12 min, normalt
~6-7 min per TASK-59.7 + tre färska 2026-08-10-körningar 5m48s-6m48s) är
INTE fastställd — dot-notation visar F/T-kluster i E2E-loggen, förstärkt av
retries:2 (playwright.config.ts:231), men den bakomliggande flake-orsaken
kräver ett separat metrics:flake-pass. Dagens (2026-08-10) tätare
landnings-burst reproducerade INTE cancellationen, vilket utesluter enkel
landnings-kadens som ensam trigger.

LEVERERAT (trivialt+riskfritt, prosa/kommentar-only, ingen logik/trigger
ändrad): post-merge.yml concurrency-kommentaren rättad (falsk "avbryts
ALDRIG" kvalificerad), larm-ärendets Tolkningshjälp fick ny punkt som
skiljer cancelled-via-timeout från failure-via-regression, ci-suite.yml
fick cross-referens-kommentar vid timeout-minutes: 12 med explicit varning
mot reflexmässig höjning. actionlint (CI:s exakta -ignore-flagga) + yamllint
.github/ båda gröna.

ESKALERAT TILL MARCUS (policybeslut, ej byggt):
1. Ska timeout-minutes: 12 höjas för test-staging? Nuvarande ~1,8x marginal
   matchar redan TASK-59.7:s egen presedens för "säker marginal" — en höjning
   utan förstådd orsak till 2026-08-07-klustret vore en gissning.
2. Ska E2E-flaket 2026-08-07 16:14-16:56 UTC utredas separat via
   npm run metrics:flake?

T135-tråden uppdaterad fullständigt (lifecycle paused→closed) med tabell,
källor och samma eskalering. tasks/threads/README.md-raden uppdaterad;
check-thread-index.sh + check-lifecycle.sh båda gröna.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Diagnos levererad i PR #1087 (7114b1d9, mergad 0cfb0104): rotorsaken är test-stagings eget timeout-minutes: 12 (ci-suite.yml) — inte mutex-eviction; alla tre instanserna mätte 12m15-16s väggklocka, och queue:max kan bara evictera väntande poster. Prosarättelse + tolkningshjälp levererad; timeout-marginal-beslutet eskalerat till Marcus. T135-tråden STÄNGD. AFK-proveniens: S102-batchen kort ①.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
