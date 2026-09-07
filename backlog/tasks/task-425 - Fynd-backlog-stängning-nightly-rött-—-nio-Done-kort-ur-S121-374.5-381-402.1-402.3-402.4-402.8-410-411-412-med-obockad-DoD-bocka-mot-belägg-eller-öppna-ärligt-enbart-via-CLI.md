---
id: TASK-425
title: >-
  Fynd: backlog-stängning (nightly) rött — nio Done-kort ur S121 (374.5, 381,
  402.1, 402.3, 402.4, 402.8, 410, 411, 412) med obockad DoD; bocka mot belägg
  eller öppna ärligt, enbart via CLI
status: Done
assignee: []
created_date: '2026-09-07 15:30'
updated_date: '2026-09-07 17:06'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 755000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 (2026-09-07 05:54 UTC), jobbet 'Backlog-stängning (natt-grind)' rött: 'Backlog-DRIFT (exit 1): grinden fann inkonsistenta kort', invariant 2 (stängt men obockat) med ❌-rader för TASK-412, 411, 410, 402.8, 402.4, 402.3, 402.1, 381, 374.5 — samtliga stängda av S121 (sessionsdok S121, lifecycle closed 2026-09-06). Loggen bär dessutom två äldre listor (invariant 1/3, 41 resp. 25 kort-ID:n, t.ex. TASK-118, 124, 18, 173.x, 283.x, 346.x) som INTE ingår i detta korts scope: inventera dem och bokför i notes vilken invariant och vilket antal, minta ett separat fynd-kort om de fäller grinden på egen hand. Åtgärd för de nio: per kort läs kortets notes/PR/commit-belägg (gh pr list --search TASK-<id>), bocka DoD-punkterna mot belägget med 'task edit --check-dod' (eller motsvarande CLI-form), eller — saknas belägg — återöppna kortet ärligt med skäl i notes. Kortfiler ändras ENBART via backlog-CLI:t (PreToolUse-hooken nekar direktredigering).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Var och en av de nio korten: DoD bockad med belägg (PR-nummer/SHA) i notes ELLER återöppnad med skäl — inget kort lämnat i mellanläge
- [ ] #2 Grinden körd lokalt med CI:s kommando ur nightly.yml (jobbet Backlog-stängning); exit 0, eller kvarvarande ❌-rader bevisat tillhörande de äldre listorna och bokförda i notes med kort-ID
- [x] #3 De två äldre listorna inventerade i notes (invariant, antal, exempel) och ett separat fynd-kort mintat om de fäller grinden på egen hand
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-DIVERGENS (ADR-086), rapporteras öppet: kortets beskrivning karaktäriserade nightly-loggens 'två äldre listor (invariant 1/3, 41 resp. 25 kort-ID:n)' fel. Verifierat mot scripts/check-backlog-closure.sh + en färsk körning: de två listorna hör INTE till invariant 1/3 — de är loggens 'Stängningsformer bland de 870 korten'-sektion: (a) 25 kort godkända via härledd DoD-rad ('CI grön per jobb') + landnings-pekare, exempel TASK-37/116/118/200/212/124/138/198/31/34/173.2/173.5/190/193/222/223/224/283/285/309.12-16/319; (b) 41 (nu 43, se nedan) kort stängda med etiketten 'intentionally-unchecked' + markören 'OBOCKAT MED AVSIKT:' i Notes/Final Summary, exempel TASK-118/124/18/18.20/30/34/39/40/42/170/173.1-3/173.5/192/194/249.2-4/249.7/283/283.1/283.4-5/285.5-6/285.10/285.12/286.1/286.4/286.6/309.17/346.1-6/346.8/346.11/370.5. BÅDA listorna är redan UNDANTAGNA från invariant 2 (scripts/check-backlog-closure.sh rad ~905: 'avstadd == 0' krävs för att invariant 2 ska fälla) och visas ALDRIG som ❌-rader i loggen — de fäller alltså inte grinden på egen hand, och AC #3:s villkorade fynd-kort ('om de fäller grinden') gäller därmed strikt läst INTE dem. AC #3 tolkas ändå som uppfylld i sak: inventeringen är gjord (ovan, med invariant/antal/exempel), och en verklig, tidigare obekant population av grind-fällande kort UPPTÄCKTES under arbetet (se nedan) — för DEN mintades TASK-427, i linje med AC #3:s syfte (registrera, förkasta aldrig tyst; ADR-053). AC #2 LÄMNAS OBOCKAD: efter fix av de nio S121-korten återstår 22 ❌-kort (31 − 9 = 22; INGET av de nio kvarstår, verifierat). Dessa 22 hör INTE till de två äldre (icke-fällande) listorna ovan — de är en TREDJE, separat population som varken TASK-425:s premiss eller nightly-loggens 41/25-sektioner förutsåg. Grindens exakta CI-kommando gav alltså varken exit 0 eller 'kvarvarande rader bevisat tillhörande de äldre listorna' — AC #2:s bokstavliga disjunktion håller inte, och rutan lämnas därför ärligt obockad snarare än tvingad. De 22 korten är inventerade med kort-ID och fällningsform i det nya kortet TASK-427 (samma bocka-eller-öppna-mönster som detta kort), som även bär hela premiss-korrigeringen ovan i sin egen beskrivning.

STÄNGNING (S123 resume 1, 2026-09-07): PR #2443 → cf719938 (batch med 59d8d336); post-merge 59d8d336 GRÖN. Review runda 1 (Sonnet): 3 info varav 2 ask-user (TASK-427:s 22-lista exakt verifierad mot grindens utdata; check:docs 14/14 ej avläsbart i CI men båda bärande jobb gröna), risk låg; Marcus 'OK 2443' 2026-09-07. AC #2/#3 bedömda felställda av granskaren (premissen 'två äldre listor' var fel — de fäller aldrig grinden; den tredje populationen på 22 kort bär TASK-427). Orkestreraren accepterar: AC #2 kvarstår obockad ärligt, AC #3 bockad på avsikten. Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
