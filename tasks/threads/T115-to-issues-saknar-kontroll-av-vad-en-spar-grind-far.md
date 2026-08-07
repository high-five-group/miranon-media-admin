---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T115 — `/to-issues` saknar kontroll av vad en spår-grind får REFERERA

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**`/to-issues` saknar kontroll av vad en spår-grind får REFERERA.** Registrerad 2026-08-03 (S96, resumen) som andra ordningens fråga ur `TASK-132`. **MÄTT över hela `backlog/`:** stämplingen av spår-grindar på varje barnkort är INTE ny och INTE felet — `task-1`, `4`, `8`, `9`, `17`, `18`, `19`, `36`, `54` och `59` bär alla identiska extra-DoD-poster på samtliga barn, i tio familjer utan problem. **Det som skiljer T95 är grindarnas GRAMMATIK.** Tidigare spår-grindar är predikat över skivans EGET arbete och uppfylls av skivan själv — verbatim: _"Design-review … per skiva med UI-yta"_ (17/18/19) · _"varje BERÖRD facit-punkt"_ (17/18/19) · _"varje FLYTTAD fil har tvåsidigt bevis"_ (59) · _"körnings-ID:n citerade PÅ KORTET"_ (36). En skiva utan UI-yta uppfyller design-review-grinden vakuöst; de skapar granskningsvågor men aldrig ett beroende utåt. T95:s grindar refererar i stället (a) en **systerskivas leverabel** — `#6` rundturs-e2e ÄR `127.9` (den enda äkta cykeln), `#5` prototyp-pass ÄR `127.2` — eller (b) en **händelse utanför repot**: _"efter Grind 0"_ (Vercel-konto) och _"före DMARC-posten satt"_ (DNS), som per konstruktion aldrig kan uppfyllas av kod. **Rotorsak:** T95 är första deploy-bundna spåret och första där e2e-grönt både är spår-grind OCH egen skiva; skillen skiljer inte klasserna. **Åtgärdsriktning (ej utförd):** en rad i `/to-issues` som säger att en skiv-DoD endast får bära predikat över skivans eget arbete — grindar som namnger en systerskivas leverabel eller en händelse utanför repot hör på PRD-kortet. **INTE "sluta stämpla"** — det river tio familjers fungerande granskningsvågor. Hub-ändring (marcus-system-pluginet), tas vid hub-sync-moment. Besläktad: `TASK-132` · `TASK-131` · `TASK-130`

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad)_
