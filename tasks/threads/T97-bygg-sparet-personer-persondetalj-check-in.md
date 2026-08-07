---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T97 — Bygg-spåret Personer → persondetalj → check-in. …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Bygg-spåret Personer → persondetalj → check-in. **Premissen var fel i en god riktning:** Personer-vyn och persondetalj FINNS byggda (Fas 6a, S23, arch-auditerade rena) men är förfacit — sista substantiella commit `4f89cbb` 2026-06-19, alltså före Hem-K10, event-S72/S73, §19-knappstandarden, Skeleton/Lugnt laddläge och INSTANT-regeln (ADR-078). Det är OMBYGGNAD till facit, inte nybygge, och startar som konvergens-pass (befintlig yta = exakt kopia), inte divergens. **Check-in-SIDAN är däremot obyggd** och explicit utanför alla tre PRD-korten (task-18:90) — bara ingången finns, med öppet bokfört BELAGT-INTERIM-länkmål mot gamla `/narvaro`. Vue-referensen har NOLL att portera (19-raders platshållare). **Närvaro-WRITE saknas helt:** noll av 13 operationer i `field-allowlists.ts` rör Deltaganden. Rekommenderad ordning: Personer-listan → persondetalj (ADR-078 kräver placeholderData-seedning ur listcachen ⇒ listans shape måste låsas först) → task-48 → check-in. Check-in kräver grillning FÖRE prototyp: närvaro-write-forken (A9/A10-automationen via Eventplanering-checkboxen vs egen Deltaganden-operation) är över ADR-baren. ~5–7 sessioner, varav ~1,5–2 rena Marcus-moment. **S90-UPPDATERING (2026-07-26): alla tre prototyp-passen ÄR KÖRDA.** Personer-listan (konvergens, 11 steg + tonal/zebra-fork) · persondetalj (divergens A/B/C) · check-in (divergens A/B/C) — 61 snapshots i prototyp-passens tre bilagemappar (67 med task-48:s sex), README per pass, samtliga varianter smoke-verifierade i browser (13/13 ytor renderade, 0 konsolfel; skarpa vyerna bevisat orörda via tom git-diff). `task-48` LANDAD (PR #226) och därmed är check-ins grammatik-beroende infriat. Kortets rekommenderade ordning HÖLL utom på en punkt: check-in-prototypen kördes FÖRE grillningen (Marcus val B), och research-passet gjorde grillningen delvis onödig — **massmarkering visade sig inte vara ett dörr-mönster alls**, vilket löser write-forken utan val: A9/A10 till registret, per-post-write till dörren. KVAR i tråden: Marcus VAL av variant per yta → PRD + skivor. Skarpt underlag för check-in-bygget ligger i `bilagor/s90-checkin-forarbete/skarpt-underlag.md` (allowlist-raden kopieringsfärdig, A8 live-verifierad, attribuerings-vägen rekommenderad).

**Ursprunglig Ingång-cell:**
_(inget kort än); uppstod S87-spaningen, [`bilagor/s87-spaning/a9-byggsparet-checkin-personer.md`](../sessions/bilagor/s87-spaning/a9-byggsparet-checkin-personer.md). Beroenden att hålla: `TASK-46` (sidtitel i route-lagret) bör landa innan check-in-routen föds · task-48:s markera-läge ÄR check-ins interaktionsgrammatik ⇒ bygg check-in EFTER så den återanvänds · persondetaljens Anteckningar bär task-43-klassen (odelat fält utan författare/tidpunkt) · `get-person`/`get-attendance` saknas i prod-allowlisten_
