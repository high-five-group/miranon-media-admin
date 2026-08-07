---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T40 — Full idempotens-prod-create-smoke (create-event) — autentiserad prod-bas-write-verifiering

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 38 (6f prod-deploy STEG 4, beslut C); **PRE-FLIGHT S84 2026-07-24:** smoke-ordningen fastlagd (deny-triple → autentiserad LÄS-smoke `get-event-formats` bevisar Airtable-secreterna i drift → write-idempotens create-event/save-segment/create-event-note) — se [`docs/research/t39-ef-sync-preflight-2026-07-24.md`](../../docs/research/t39-ef-sync-preflight-2026-07-24.md) §6; prod-testanvändaren kvarstår som enda förkrav för steg 3+. **SMOKESEN UTFÖRDA 2026-07-24 (S84;** smoke-user `marcus+ef-smoke@h5gruppen.se` Marcus-provisionerad via dashboarden — beslut C-kanalen hölls, lösenord i lokal git-ignorerad fil**):** login → läs-tripeln formats/events/registrations (AIRTABLE_BASE_ID/TOKEN **runtime-bevisade**, historiska obevisat-fyndet stängt) → create-event-idempotensen (ZZ-create 201 → replay 200 SAMMA rad) → create-event-note/get-event-notes-rundturen → save-segment 201; ZZ-teardown verifierad (basen åter i utgångsläge). Byggplanens closeout-förkravsrad inwirad (resolutions-triggern verkställd). Smoke-datumfyndet = fälla 45 (Månad/år-options-horisonten). KVARVARANDE prod-frontend-deploy-kontrollen ÖVERGÅR till `T46`. TRÅDEN STÄNGD_
