---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T73 — Kunders e-postadresser i git — PII-hygien i dokumentationen. …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Kunders e-postadresser i git — PII-hygien i dokumentationen. Spårade filer innehåller minst 5 riktiga deltagares adresser (`docs/reference/data-model.md`, `docs/backfill/execute-log.md`, `docs/research/datamodell-research/01-extraction.md` + `02-live-state.md`, sessionsdok). De flesta föregår S60; S60 införde tre till och skrubbade dem ur arbetsträdet direkt (record-ID bär samma spårbarhet utan kontaktuppgift). **Kvar:** (a) de befintliga förekomsterna, (b) git-HISTORIKEN, som en scrub av arbetsträdet inte når. Repot är privat, så exponeringen är begränsad — men adresser i historik är permanenta utan rewrite. Beslut krävs: acceptera, scrubba arbetsträdet, eller history-rewrite. Konvention framåt: referera records med `recXXX`, aldrig med e-post.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 60 vid PII-kontroll före commit av exportskripten._
