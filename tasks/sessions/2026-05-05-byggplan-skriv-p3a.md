# Byggplan-skrivning + ADR-katalog — P3a

> **Status:** PÅGÅR — startad 2026-05-05.
> **Skapat:** 2026-05-05
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-05-byggplan-skriv-p3a.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §6 P3 + §12
> **Föregångare:**
> - `docs/byggplan-revision-inventory.md` (P0, slutförd 2026-05-04)
> - `tasks/sessions/2026-05-04-byggplan-revision-p1.md` (P1, slutförd 2026-05-04)
> - `tasks/sessions/2026-05-04-p1-avslutning.md` (P1-avslutning, 2026-05-04)
> - `tasks/sessions/2026-05-04-stodspec-synk-p2.md` (P2, slutförd 2026-05-04)
> **Efterföljare:** `tasks/sessions/2026-05-05-byggplan-stadning-p3b.md` (P3b — städning + arkivering + BUILD-LOG retrospektiv, planerad)
> **Stop-test (P3a):** `docs/byggplan.md` innehåller per-fas-prompt för alla 13 faser (Fas 2, 2.5, 3, 3.5, 5, 5.5, 6a–6e, 6.5, 7, 8, B, E) + alla 10 ADR:er har minst skelett (Context, Decision, Alternatives, Consequences) + `docs/decisions/README.md` uppdaterad med 10 nya rader.

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för P3a-steget i byggplan-revisionen. Dess uppgift är att producera tre leveranser:

1. `docs/byggplan.md` — den styrande slutprodukten som ersätter `docs/conversion-plan.md` som primärt fas-för-fas-direktiv för React-bygget.
2. 10 ADR:er i `docs/decisions/` — 9 från P1 Del 7-katalogen + 1 ny för Fas 3.5 (P2 A1-utfall).
3. Uppdaterad `docs/decisions/README.md` med de 10 nya posterna.

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i `docs/` blir "current truth" efter att Code committar dem via prompterna i Del 5 (sista delen i P3a). Samma mönster som P1 (där Del 6 §5-applikationen var Code-uppgiften) och P2 (där Del 6 spec-uppdateringarna var Code-uppgiften).

P3b — städning + arkivering + BUILD-LOG retrospektiv — är separat session och berör inte detta dokument utöver att referensbroar dit lämnas öppna i K4.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap):

| # | Fil | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, principer |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projektkonstitution, kvalitetsribba |
| 3 | `tasks/lessons.md` | Universella lärdomar (inkl. 7 nya: 3 från P1 + 4 från P2) |
| 4 | `tasks/sessions/2026-05-04-byggplan-revision-p1.md` | P1: Del 5 Pass-status, Del 6 §5-uppdatering (15 rader), Del 7 ADR-katalog (9 st) |
| 5 | `tasks/sessions/2026-05-04-stodspec-synk-p2.md` | P2: Del 5 A1-utfall = Fas 3.5 egen fas, Del 7 lessons-poster |
| 6 | `tasks/byggplan-direktiv.md` §5 (post-P1) + §6 P3 + §12 | Direktivets fas-tabell + uppgift + arkiveringskrav |
| 7 | `docs/SECURITY-SPEC.md` | Uppdaterad i P2 — operations-API + Fas A:s 8 mönster införlivade |
| 8 | `docs/STATE-STRATEGY.md` | Uppdaterad i P2 — strangler-fig + §8 operations-API + §5b polling |
| 9 | `docs/ACCESSIBILITY-CHECKLIST.md` | Omskriven i P2 — React Aria + WCAG 2.2 AA + Fas 3.5-leverabler |
| 10 | `docs/conversion-plan.md` | Källa för per-fas-innehåll (arkiveras i P3b — kvar som indata för P3a) |
| 11 | `docs/decisions/README.md` | Befintlig ADR-katalog (för numrerings-nollställning) |
| 12 | `docs/byggplan-revision-inventory.md` | P0-leveransen — klassningstabell per fas (informerar per-fas-prompter) |

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §5 (post-P1) + §6 P3 + §8.5 — auktoritativ för P3
2. `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 6 + Del 7 — fas-tabell + ADR-katalog
3. `tasks/sessions/2026-05-04-stodspec-synk-p2.md` Del 5 (A1-utfall) — Fas 3.5 = egen fas
4. P2-uppdaterade specs (SECURITY-SPEC, STATE-STRATEGY, ACCESSIBILITY-CHECKLIST) — referensmaterial som byggplan.md pekar mot
5. `docs/conversion-plan.md` §D — innehåll för per-fas-prompter, men där conversion-plan motsägs av P0-inventory eller P1/P2 vinner P0/P1/P2

### Klunga-struktur för P3a

Fyra klungor, samma mönster som P0/P1/P2:

| Klunga | Innehåll | Stop-test per klunga |
|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + struktur) | Filen committad i repot, denna del läsbar |
| **K2** | `docs/byggplan.md` — skelett + alla 13 fas-prompter | byggplan.md innehåller per-fas: scope/inte scope/beroenden/estimat/DoD/[GA]-tillägg |
| **K3** | 10 ADR:er i `docs/decisions/ADR-NNN-*.md` | Varje ADR har Context/Decision/Alternatives/Consequences (minst skelett-nivå) |
| **K4** | `docs/decisions/README.md` + packade Code-prompter för commit av alla nya filer | README uppdaterad; Code-prompter paketerade i Del 5 (mall: P1 Del 3 / P2 Del 6) |

---

## Del 2 — K1: Sessionsdok-skelett

✅ Detta är K1. Filen är skapad och committad — innehållet i Del 1 utgör K1:s leverans.

---

## Del 3 — K2: byggplan.md skelett + per-fas-prompter

[Fylls i under K2.]

---

## Del 4 — K3: 10 ADR:er

[Fylls i under K3.]

---

## Del 5 — K4: decisions/README.md + Code-prompter

[Fylls i under K4.]

---

## Del 6 — Pass-status

[Uppdateras vid varje klunga-avslutning.]

| Klunga | Innehåll | Status |
|---|---|---|
| K1 | Sessionsdok-skelett | ⏳ PÅGÅR |
| K2 | byggplan.md + 13 fas-prompter | ⏸ EJ STARTAD |
| K3 | 10 ADR:er | ⏸ EJ STARTAD |
| K4 | README.md + Code-prompter | ⏸ EJ STARTAD |

---
