---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T132 — Heartbeat-svepets DIRTY-väg filtrerar inte `isDraft`, medan armerings-kandidat-vägen gör det

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Heartbeat-svepets DIRTY-väg filtrerar inte `isDraft`, medan armerings-kandidat-vägen gör det.** Registrerad 2026-08-07 (S93 femte resumen) — triage: blockerar ej, värdefullt, defereras. **MÄTT i `scripts/heartbeat-svep.sh`:** fältet `isDraft` hämtas (rad 341 + 355) och används i kandidat-villkoret, vars egen kommentar säger _"CLEAN/UNSTABLE, **icke-draft**, utan aktiv auto-merge-begäran"_ (rad ~395). DIRTY-grenen (rad 390–393) prövar däremot **enbart** `mergeStateStatus == "DIRTY"` — draft-status läses aldrig. **MANIFESTATION:** `#862` (`TASK-145.1`) stod som draft under aktiv ombyggnad av en byggagent och larmade level-triggered var 90:e sekund i över en halvtimme, parallellt med två främmande sessioners konfliktade PR:er (`#873`, `#876`). Ingen av de tre var åtgärdbar av den svepande sessionen. **VARFÖR DET INTE ÄR SJÄLVKLART VILKET SVAR SOM ÄR RÄTT:** lärdomen `parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd` slår fast att draft är _"en sann utsaga om PR:en: den ÄR inte klar att landa"_ — under den läsningen är en DIRTY draft dubbelt icke-redo och larmet rent brus. Men en **övergiven** draft i konflikt är exakt `T108`-klassen (ett tillstånd utan bevakare), och ett draft-filter hade dolt den. Avvägningen är verklig och därför Marcus, inte en tyst skript-ändring. **BESLÄKTAD LUCKA, SAMMA KLASS:** svepet skiljer inte heller på egna och främmande sessioners PR:er — `HEARTBEAT_EXEMPT_AUTHORS` är författar-baserad, och alla våra PR:er bär samma författare. Besläktad: `T128` (kandidat-vägens falsklarm, åtgärdad i `TASK-128` med `isInMergeQueue`) · `T112` (svepet som arbetsform) · fragmentet om parkerad PR utan draft

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; draft-frågan är en avvägning som kräver Marcus)_
