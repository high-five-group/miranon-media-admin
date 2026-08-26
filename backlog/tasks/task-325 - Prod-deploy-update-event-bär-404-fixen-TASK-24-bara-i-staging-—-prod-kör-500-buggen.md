---
id: TASK-325
title: >-
  Prod-deploy: update-event bär 404-fixen (TASK-24) bara i staging — prod kör
  500-buggen
status: To Do
assignee: []
created_date: '2026-08-26 04:56'
labels:
  - ready-for-human
  - prod
dependencies: []
ordinal: 598000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
update-event ligger i .prod-functions-allowlist.conf sedan fulldeployen c6c96a52 (verifierat: commit finns, meddelande 'chore(deploy): [S102] prod-allowlisten till app-paritet — 19 rader, get-person-driften rättad'; update-event bekräftad på rad 52 i .prod-functions-allowlist.conf). TASK-24-kortets premiss 'inte i prod' var därmed stale redan innan detta pass. Fixen (404-kontrakt för update-event mot okänt/raderat rec-ID, i stället för dagens 500) landade i main via PR #1988 (verifierat mergad 2026-08-26T04:18:49Z, merge-commit 8d2ad561b5d8215d05943c66040c4d8f28ccaaa0, titel 'fix: [S112 fix-våg 4, bunt C] update-event 404-kontrakt, input-bg surface-token, auth-fond, stale kommentarer'). Staging v23 deployad (ej oberoende verifierad i detta pass — staging-versionsnumret kommer från uppdragets egen källa, ej omätt här). Marcus kör bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref> och därefter --deploya (CLAUDE.md paragraf Prod-EF-deploy) — refen anges av Marcus, aldrig av agent (scripts/deny-prod-ref.sh matchar refens NÄRVARO i Bash-kommandosträngen och fäller varje agent-anrop).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 functions list visar UPDATED_AT för update-event nyare än deployen — läs UPDATED_AT, inte VERSION (CLAUDE.md paragraf Prod-EF-deploy: VERSION bumpar +1 för ALLA funktioner oavsett vilka som rördes)
- [ ] #2 prod-svar 404 på okänt rec-ID verifierat (read-only-anrop, ingen mutation)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
