---
id: TASK-464.5
title: >-
  Skiva: S2 — förslaget blir lätt; hela acceptance-klassen och det tvåsidiga
  beviset körs EN gång, i kön
status: To Do
assignee: []
created_date: '2026-09-19 10:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.4
parent_task_id: TASK-464
priority: high
ordinal: 821000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Förslagsytan (pull_request) kör lint, typkontroll, bygge och de snabba testerna. Hela acceptance-klassen, hermetik-beviset (tvåsidigt) och webbläsarbeteende-klassen körs BARA i kön (merge_group), där de bevisar exakt det träd som landar. Den obligatoriska kontrollen 'CI Passed or Skipped' måste fortsatt RAPPORTERAS på båda ytorna (GitHub: 'A merge queue will wait for required checks to be reported') — vad som körs under namnet är fritt. Ett rött i kön måste fortsatt betyda EN sak (CONTRIBUTING § Rött-först). Skärvningen BEHÅLLS. I samma PR: (a) en rad i .claude/agents/bygg-agent.md — rör ändringen en yta med acceptance-tester kör agenten det berörda urvalet lokalt före push (scripts/acceptance-urval.sh), ingen ny CI-mekanik; (b) SE20 — de fyra olåsta externa byggstenarna i ci-suite.yml låses till exakta versioner som filens övriga; (c) prosa i CLAUDE.md/CONTRIBUTING rättas ENDAST där den blivit falsk, med mätta tal. Kostnaden är känd och accepterad: acceptance-fel upptäcks först i kön (5,2 % av förslagskörningarna föll i augusti), en kö-fällning konsumerar armeringen. Review-grinden (ADR-105) får inte försvagas — review-backstopp stannar på kö-ytan. Väntas ge risk HÖG i granskningen ⇒ Marcus före armering. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kontrastpar med run-ID: en kod-PR:s pull_request-körning startar INGEN runner för acceptance, hermetik-bevis eller webbläsarbeteende; samma PR:s merge_group-körning kör alla oförändrat (jobblistor ur gh run view --json jobs)
- [ ] #2 'CI Passed or Skipped' rapporteras på båda ytorna och är fail-closed: ett skipped godkänns ENDAST för jobb som villkorats här; check-aggregator-needs + gate-proof gröna
- [ ] #3 Inget verkligt skydd borta: säkerhetsskanning, tillgänglighet, hermetik-bevis och review-backstopp kör på varje kodlandning före merge — bevisat med kö-körningens jobblista
- [ ] #4 Bygg-agentens kontrakt bär raden om lokalt urval; SE20:s fyra referenser är låsta till exakta versioner
- [ ] #5 Mätt väntan: förslagsrundan och kö-rundan var för sig (väggtid) före/efter, mot taket kod <= 12 min median
- [ ] #6 verify:ci-parity:fast grön; .ci-parity-policy.json och .listparitet-policy.conf följer med
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna, månadseffekt vid 1 279 landningar
- [ ] #5 Inget nytt JOBB där ett steg i ett befintligt jobb räcker (varje jobb avrundas upp till hel minut, gånger ytorna)
<!-- DOD:END -->
