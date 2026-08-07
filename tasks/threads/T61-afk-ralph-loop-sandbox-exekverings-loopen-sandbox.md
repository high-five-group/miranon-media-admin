---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: active
---

# T61 — AFK/Ralph-loop + sandbox — exekverings-loopen + sandbox obyggda; märknings-sidan låst (ready-for-agent; fork 4 beslut 4 v + två-aktörs-ADR:n [WIP] p.4/5)

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); trigger ARMERAD sedan S50 (beroendekedjan T57 → do-work uppfylld); källa: S47 Del 16 F1-routningen ("T57+, efter do-work") + restlista-passet S51 (bärarlös tills dess); egen landning i Marcus-takt — naturlig evidensgrind: S52:s hel-kedje-körning + drift-metriken._ **UPPTAGEN S61 (2026-07-11):** grillad samsyn = AFK-batch-kontraktet (5 beslut, [S61 Del 2](../sessions/2026-07-11-session-61.md)) + **PILOT KÖRD GRÖN** — task-3 autonomt `To Do`→`Done` via sekventiellt orkestrerings-skript kring OFÖRÄNDRAD do-work-skill (first-pass-CI, 0 defekter, 0 ingripanden; S61 Del 3). Batch 2 + granskningsvågen stängda S61 (Del 4–5). **S62 (2026-07-11):** `/work-batch`-skill BYGGD (hub `3174a1e`, plugin 1.13.0) + [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md) mintad — batch-loopen formaliserad; **batch 3 = skillens första skarpa bruk** — task-4.5 → review-ready (first-pass-CI, 0 defekter, 0 ingripanden; [S62 Del 3](../sessions/2026-07-11-session-62.md)). Återstår: sandbox-delen · parallellism (T67) · headless/CI-formen (ADR-071 beslut 6) · stop-vägen obevisad tills första skarpa halten
