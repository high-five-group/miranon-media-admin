---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T64 — Sentinel-purge-wiring för Airtable-test-data — ADR-060:s "purge vid SETUP" är obyggd och ska vidgas till create-event-sentinellerna; kräver Marcus-VÄGVAL

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Sentinel-purge-wiring för Airtable-test-data — ADR-060:s "purge vid SETUP" är obyggd och ska vidgas till create-event-sentinellerna; kräver Marcus-VÄGVAL först: var bor Airtable-städnings-credentialen? (test-runtime är medvetet EF-only/least-privilege; ADR-060 § öppna trådar pekar på "cred-skild seed-fas eller Fas E-datahem-byte"). När vägvalet är taget föds ett backlog-kort ur tråden — kort = kan bli en commit, tråd = behöver bli ett beslut först

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); utbruten ur fynd-kortet TASK-2 vid omscopning 2026-07-06 (S52; Marcus-kvitterad klassnings-praxis: byggbar spec → kort, beslutsbehov → tråd); rotorsak + interim dokumenterade i ADR-060 Updates-not + TASK-2 (60 sentinel-event markör-raderade via MCP, väg A)_
