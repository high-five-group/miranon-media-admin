---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T66 — Prototyp-skillens tvåfas-generalisering — Marcus-kvitterad STÅENDE ARBETSFORM för allt prototyparbete (2026-07-06, generaliserar T65): (1) DIVERGENS-pass

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Prototyp-skillens tvåfas-generalisering — Marcus-kvitterad STÅENDE ARBETSFORM för allt prototyparbete (2026-07-06, generaliserar T65): (1) DIVERGENS-pass: tre varianter → Marcus väljer EN; (2) KONVERGENS-pass: vinnaren itereras med Marcus tills helt nöjd (för befintlig yta: starta som EXAKT kopia av faktiska vyn); (3) SKARPT utförande genom leverans-grindarna (NYSKRIVEN, throwaway-kontraktet); (4) senare ändringsbehov = nytt konvergens-pass från exakt kopia — samma process, återkommande. Skill-uppdateringen (hub: prototype-skillen, som idag ENDAST bär divergens-formen "radikalt olika varianter"/EN fråga) ska också: (a) öppet förfina Del 4-mönstret "justeringar = byggkrav, aldrig prototyp-iterering" (småjusteringar vid svar-fångst förblir byggkrav; helhets-missnöje → konvergens-pass — förfining, ej tyst rivning), (b) bunta Del 7-skörd-kandidaten skärmdumpar-per-variant före radering + återupplivningsvägen, (c) web-förankra diverge/converge-metodiken vid designen (L25). Hub-materia: plugin-bump + omstart — EGEN landning, ej S52-detour

**Ursprunglig Ingång-cell:**
_LEVERERAD S54 (Del 4): hub `6272336` — plugin 1.11.0 bär tvåfas-sektionen (SKILL.md) + konvergens-passet (UI.md) + punkterna a–c; aktiverings-förbehållet INFRIAT vid S55-sessionsstarten 2026-07-06 (omstarten utförd: install-record 1.11.0 == hub-HEAD `6272336`, tvåfas-sektionen live i cachen). Ursprung: Marcus-direktiv vid task-1.3-stängningen (S52, post-Del 8); ADR-053: blockerar ej + värdefullt → defer; processens kanoniska plats är nu SKILLEN (denna rad historisk trail; T65 = första instansen, upptagen S55)_
