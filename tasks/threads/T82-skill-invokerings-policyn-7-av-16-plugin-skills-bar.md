---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T82 — Skill-invokerings-policyn — 7 av 16 plugin-skills bär `disable-model-invocation: true` (do-work · grill-me · grill-with-docs · prototype · to-issues · t

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Skill-invokerings-policyn — 7 av 16 plugin-skills bär `disable-model-invocation: true` (do-work · grill-me · grill-with-docs · prototype · to-issues · to-prd · work-batch) → löptext-order ("Vi kör /grill-me på T81") kan inte invokeras via Skill-verktyget utan faller till L306-cache-läsningen (sanktionerad men andra klassens väg; slash-parsning gäller endast meddelande-start). Rekommenderad fix: flippa flaggan — invokerings-policy är konfiguration (Claude Codes frontmatter-mekanism), och beteende-guarden "endast på Marcus-order" bor redan i konstitutionen + skill-texternas egna grindar (modell-invokerbar ≠ auto-avfyrad); medvetet kvarlås på enstaka skill är Marcus-val

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); född S75 paus-läge (Marcus-fråga 2026-07-22; ADR-053-triage: blockerar ej + värdefullt → defer). Hub-materia (marcus-system-frontmatters) → BUNTAS med T80/T81-sessionens hub-landning (T78 b + ev. T81-skill-text) = ETT plugin-bump/T18-reinstall-moment. **LEVERERAD S76** (STOPPA-fråga → Marcus-kvittens A: 6 av 7 flippade [do-work/grill-me/grill-with-docs/prototype/to-issues/to-prd], work-batch KVARLÅST per ADR-071 beslut 1; hub `1f9ca16`, plugin 1.18.0; README-punkt 3 = policyns hemvist med work-batch-fallbacken kvar). **STÄNGD S76** — aktiverings-verifiering (löptext-order → äkta Skill-invokering) vid T18-reinstallen + första bruk. Besläktad `T18` (plugin-distributionen)_
