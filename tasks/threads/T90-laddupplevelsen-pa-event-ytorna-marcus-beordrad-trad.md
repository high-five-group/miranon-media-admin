---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T90 — Laddupplevelsen på event-ytorna — Marcus-beordrad tråd (S83 pass 4, 2026-07-24): regeln är att allt i appen ska vara INSTANT, och skeleton-laddningen är d

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Laddupplevelsen på event-ytorna — Marcus-beordrad tråd (S83 pass 4, 2026-07-24): **regeln är att allt i appen ska vara INSTANT**, och skeleton-laddningen är dessutom inte branschledarmässig designmässigt ("det ser helt enkelt inte snyggt ut"). Delvis adresserat i PR #163 (placeholder ur listcachen + prefetch på avsikt; direktklick 1315 ms → hover 1500 ms 278 ms; CLS 0,000 vid navigering) — men golvet är Airtables EF-latens: `get-event` ~1,1 s, `get-registrations` ~1,4 s mätt, vilket inte går att optimera bort klientsidan. Marcus accepterar gränsen tills **Supabase-migrationen** stänger den. KVAR i tråden: (a) laddlägenas DESIGN som eget pass — den bästa skeletonen är den man aldrig ser, men de som ändå syns ska se ut som design; (b) öppet belastningsbeslut: varm registrations-cache för ALLA event skulle eliminera det sista layouthoppet (Anmälda deltagare 187 → 627 px, CLS 0,045 om man scrollar dit under laddning) men kostar 11 × 2 anrop mot Airtable vid listöppning — rate limit 5 req/s, 429-risk; ej taget av Code

**Ursprunglig Ingång-cell:**
PR #163 · besläktad `T87` (visual-grinden) · bas-/Supabase-spåret `ADR-063`
