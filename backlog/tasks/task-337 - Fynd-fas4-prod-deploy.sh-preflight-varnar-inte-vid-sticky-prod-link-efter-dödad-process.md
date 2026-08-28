---
id: TASK-337
title: >-
  Fynd: fas4-prod-deploy.sh preflight varnar inte vid sticky prod-link efter
  dödad process
status: To Do
assignee: []
created_date: '2026-08-28 04:45'
updated_date: '2026-08-28 04:51'
labels:
  - ready-for-agent
dependencies: []
ordinal: 608000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt instans (2026-08-28 ~03:38Z, källa: S108 sessionsdok Del 29 — skrivs parallellt av orkestreraren — + denna sessions chattlogg). fas4-prod-deploy.sh kördes via !-prefixet i stället för ett eget terminalfönster (CLAUDE.md § Prod-EF-deploy kräver det senare, men skriptets egen preflight hindrade det inte). !-prefixets 2-minuters-tak (BASH_DEFAULT_TIMEOUT_MS) SIGKILL:ade processen mitt i sekvensen. Skriptets EXIT-trap (som ska återlänka till staging oavsett utfall) körs INTE vid SIGKILL — bash kan inte fånga SIGKILL, trap-hanteraren triggas aldrig. supabase/.temp/project-ref stod därför kvar på prod-refen (sticky link) tills orkestreraren manuellt körde 'supabase link' mot staging igen. Nästa Supabase CLI-kommando i den katalogen (agent eller Marcus) hade gått mot PROD utan varning.

RISKEN: preflighten (--kontrollera/--deploya) läser i dag inte det EGNA sticky-tillståndet innan den startar — den litar på att länken redan är rätt. En SIGKILL-avbruten tidigare körning lämnar länken i fel läge tyst.

GÖR: preflight-steget i scripts/fas4-prod-deploy.sh läser supabase/.temp/project-ref VID START (innan någon länk-/deploy-operation) och jämför mot förväntad staging-ref. Är den redan lika med prod-refen (föregående körning återlänkade aldrig) ska skriptet FÄLLA eller tydligt VARNA med instruktion att köra `supabase link --project-ref STAGING_REF` manuellt innan det fortsätter — aldrig tyst fortsätta som om läget vore rent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 preflight läser supabase/.temp/project-ref och fäller/varnar om ≠ staging med tydlig instruktion
- [ ] #2 skriptets huvud + CLAUDE.md § Prod-EF-deploy bär regeln "kör aldrig via !-prefixet — eget terminalfönster"
- [ ] #3 tvåsidigt test i scripts/test-fas4-prod-deploy.sh
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
