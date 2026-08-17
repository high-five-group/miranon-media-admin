---
id: TASK-251
title: >-
  Fynd: acceptance-riggens dev-port är hårdkodad — parallella agenter kolliderar
  mätbart
status: Done
assignee: []
created_date: '2026-08-17 01:20'
updated_date: '2026-08-17 07:47'
labels:
  - ready-for-agent
dependencies: []
ordinal: 457000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-17 (S102, 241.3-bygget): agentens acceptance-körningar kolliderade med parallell agents vite-server på hårdkodade port 5399 — PID-spårad till den andra agentens process via ps/lsof. Under fleet-drift (flera bygg-agenter samtidigt) är en fast port en delad resurs utan ägare. Belägg: task-241.3-kortets Implementation Notes § koordination.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Porten per-process-unik (port 0/ephemeral eller worktree-deriverad) — två samtidiga acceptance-körningar i olika worktrees stör aldrig varandra, bevisat med parallell körning
- [x] #2 Flake-klassen ur S102-instansen (två körningar fällde olika orelaterade test i hem-laddlage.acceptance under kollisionen; tredje isolerad körning 5/5 grön) omkörd grön efter fixen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-251 löst med worktree-deriverad dev-serverport (tests/support/dev-portar.ts). Porten = klassens basport + worktree-index * 1000, där index är checkoutens plats i `git worktree list --porcelain` (huvudkatalogen alltid först per git-worktree(1) § list ⇒ index 0 ⇒ 5199/5299/5399/5499 oförändrade; CI bit-identiskt).

VARFÖR INTE PORT 0 (kortets andra väg): Playwrights webServer kräver att `url` är känd före serverstart och kan inte läsa tillbaka en kernel-allokerad port — begärt i microsoft/playwright#31235 och #37920, båda stängda utan implementation. Port 0 hade dessutom rivit stale-server-vakten (task-5): en port som aldrig kan vara upptagen kan aldrig fälla högt.

VARFÖR LISTINDEX OCH INTE HASH: hash över de 27 platser portschemat rymmer hade kolliderat oftare än inte vid de tio worktrees som fanns vid bygget (födelsedagsproblemet). Listindex är garanterat unikt inom en given lista.

AC 1 — MÄTT: port 5399 (den gamla delade porten) ockuperades av en främmande process under hela acceptance-körningen i denna worktree. Vår dev-server band 9399, ockupanten satt kvar på 5399 hela tiden (24 observationer var 3:e sekund), acceptance exit 0. Före fixen hade körningen dött på --strictPort. Enhetstestet tests/api/dev-portar.test.ts bevisar dessutom mot konstruerade listor att två checkouts aldrig får samma index — och fäller (exit 1, 1 failed) när kärnlogiken bryts (negativ kontroll körd).

AC 2 — MÄTT: hem-laddlage.acceptance.test.ts 5/5 grön efter fixen (1,2 min), körd under pågående portockupation.

ÖVRIGA KLASSER (samma mekanism, samma fix): webblasarbeteende 58/58 på 9499, visual 24/24 på 9299, a11y 94/95 på 9199 — den enda fällningen (fokusring-musklick, 'element not stable') kördes om isolerat 4/4 grön, alltså klass B-flake under tung samtidig last, inte portregression.

FÖLJDFIX: scripts/flake-matserie.mjs hårdkodade 5399 i sin portvakt OCH i `pkill -f 'vite --port 5399'` — i fleet-drift hade den dödat en annan agents dev-server. Läser nu samma devPort().

KVARSTÅR, ÖPPET BOKFÖRT: (a) e2e 5173 och staging-preview 4173 deriveras INTE — de är portlåsta av staging-EF:ernas CORS_ALLOWED_ORIGINS; fleet-kollision där kvarstår och lösningen bor i allowlisten, inte här. (b) Index är en position i en lista som ändras när en worktree skapas/tas bort; tas en bort mitt i en körning kan en NY körning landa på en port som redan används — snävt fönster, och utfallet är HÖGT (--strictPort), aldrig tyst.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGNING (orkestreraren, 2026-08-17): PR #1499 MERGED 07:43:00Z via merge-kön (full svit i kö-bygget, alla checks gröna — DoD 3 betald). Lösning: worktree-deriverade dev-portar (basport + worktree-index × 1000, huvudkatalog index 0 ⇒ CI bit-identiskt), AC1:s port-0-gren bevisad ofarbar (Playwright #31235/#37920). Bifynd fixat i samma landning: flake-riggens pkill på hårdkodad 5399 dödade främmande agenters dev-servrar. Bokförda rester: e2e/staging-preview-portar (5173/4173) CORS-låsta — fleet-kollision kvarstår där; ledighetsprobe medvetet avstådd (hade rivit stale-server-vakten).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
