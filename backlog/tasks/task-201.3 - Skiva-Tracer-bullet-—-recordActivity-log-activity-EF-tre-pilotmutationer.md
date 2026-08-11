---
id: TASK-201.3
title: 'Skiva: Tracer bullet — recordActivity, log-activity-EF, tre pilotmutationer'
status: To Do
assignee: []
created_date: '2026-08-11 20:22'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.2
parent_task_id: TASK-201
ordinal: 368000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: FÖRSTA hela vertikalen genom alla lager — ett klick i staging-appen (markera betalning / bekräfta / skicka mail) blir en validerad, korrelerad rad i activity_log. Piloten avtäcker mönstret (EF-form, requestId-väg, fire-and-forget-semantiken) innan den mekaniska utrullningen i nästa skiva. Skrivvägs-förebild: kvitto-EF:ns mönster (ADR-109-landningen).

Täcker användarberättelser: 1, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 recordActivity-modulen (klientsidan av datalagret, via adaptern) bygger Zod-validerade statements och postar till log-activity-EF; fire-and-forget — en fallerad loggning fäller ALDRIG Lottas mutation (api-test bevisar båda riktningarna)
- [ ] #2 log-activity-EF validerar inkommande statement med SAMMA Zod-schema server-side (ogiltigt → 4xx, skrivs aldrig), skriver via service-role, uppfyller EF-ribban (SECURITY-SPEC §6.10)
- [ ] #3 requestId propageras klient → EF → activity_log-rad — api-staging-test läser tillbaka raden och jämför mot klientens requestId (byggplanens DoD 3)
- [ ] #4 Tre pilotmutationer instrumenterade via onSuccess: markera betalning, bekräfta anmälan, mail-åtgärd; e2e-staging-test utför en åtgärd och verifierar rad med rätt aktör, typ och tid
- [ ] #5 Sammanfattningar på Lotta-språket (Gunilla-principen), formen "Lotta markerade betalning — Anna Andersson (Fjärrskådning 2)"; IRI-verb under huven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [ ] #6 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->
