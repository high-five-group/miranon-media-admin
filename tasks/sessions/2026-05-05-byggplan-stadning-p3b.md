# Byggplan-städning + arkivering + BUILD-LOG retrospektiv — P3b

> **Status:** 🚧 PÅGÅR — K1 (skelett) klar efter denna commit. K2–K4 planerade.
> **Skapat:** 2026-05-05
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-05-byggplan-stadning-p3b.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §6 P3 (städnings-DoD) + §12 (slutnot)
> **Föregångare:**
> - `docs/byggplan-revision-inventory.md` (P0, slutförd 2026-05-04)
> - `tasks/sessions/2026-05-04-byggplan-revision-p1.md` (P1, slutförd 2026-05-04)
> - `tasks/sessions/2026-05-04-p1-avslutning.md` (P1-avslutning, 2026-05-04)
> - `tasks/sessions/2026-05-04-stodspec-synk-p2.md` (P2, slutförd 2026-05-04)
> - `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` (P3a, slutförd 2026-05-05)
> **Efterföljare:** Ingen — P3b avslutar byggplan-revisionen. Nästa Chat-session: Fas 2 — Routing + Auth, mot `docs/byggplan.md`.
> **Stop-test (P3b):** Direktivet markerat SLUTFÖRT + alla städnings-DoD (§6 P3) avbockade + git status ren + 5 verifieringskommandon gröna + UNIVERSAL-lyft genomfört.

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för P3b-steget — sista steget i byggplan-revisionen. Dess uppgift är att producera tre saker:

1. **Repo-hygien** — `conversion-plan.md` arkiverad, `BUILD-LOG.md` retrospektivt komplett (Fas A + P0/P1/P2/P3a), `todo.md` rensad, `CLAUDE.md` (projekt) uppdaterad så ingen rad pekar på conversion-plan.
2. **Verifierings-baseline** — 5 kommandon gröna innan Fas 2 startar (`test:api`, `tsc`, `biome`, `build`, Lighthouse-baseline). Detta är "11/10 sanity-baseline" per direktivet §6 P3.
3. **Slutsignal** — `tasks/byggplan-direktiv.md` markerat SLUTFÖRT i headern, hubben (`marcus-system/tasks/lessons.md`) synkad med 7 nya UNIVERSAL-poster (3 från P1 + 4 från P2).

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i repot blir "current truth" efter att Code committar dem via prompterna i K2/K3/K4. Samma mönster som P0/P1/P2/P3a.

P3b avslutar hela byggplan-revisionen. Nästa session (i ny Chat) är **Fas 2 — Routing + Auth**, mot `docs/byggplan.md` som styrande dokument.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap):

| # | Fil | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, principer |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projektkonstitution, sessionsstart-checklista (uppdateras i K3) |
| 3 | `tasks/lessons.md` | Universella lärdomar — 7 nya poster (3 P1 + 4 P2) som ska lyftas i K4 |
| 4 | `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` | P3a-leveransen — Del 6 Pass-status, Del 7 Stop-test PASSERAT |
| 5 | `docs/byggplan.md` | Slutprodukten — referensmaterial för CLAUDE.md/todo.md-uppdatering |
| 6 | `docs/conversion-plan.md` | Källan som ska arkiveras (kvar tills K2 körs) |
| 7 | `tasks/byggplan-direktiv.md` §6 P3 + §12 | Uppgifts- och slutnot-beskrivning |
| 8 | `docs/BUILD-LOG.md` | Befintlig — utökas i K2 |

**Tilläggskällor för K2 (BUILD-LOG retrospektivt):**

- `tasks/sessions/2026-05-04-security-hardening.md` — Fas A M1–M8, DoD per milstolpe, K7-respekt-noteringar
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` — P1-leveransen
- `tasks/sessions/2026-05-04-stodspec-synk-p2.md` — P2-leveransen
- `docs/byggplan-revision-inventory.md` — P0-leveransen

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §6 P3 + §12 — auktoritativ för P3b
2. `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` Del 6 + Del 7 — P3a-leveransstatus och stop-test
3. `docs/byggplan.md` (post-P3a) — styrande dokument efter K2-arkivering
4. `docs/conversion-plan.md` — historiskt referensmaterial, **inte styrande** efter K2

### Klunga-struktur för P3b

Fyra klungor, samma mönster som P0/P1/P2/P3a:

| Klunga | Innehåll | Beslut/källor | Stop-test per klunga |
|---|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 + struktur) | — | Filen committad i repot, denna del läsbar |
| **K2** | A: arkivera conversion-plan (commit 1) + B: BUILD-LOG retrospektiv (commit 2) + H: defer-beslut dokumenterade | A + B + H | conversion-plan i `docs/archive/`, BUILD-LOG har Fas A M1–M8 + P0/P1/P2/P3a-poster + commit-hashar verifierade, defer-poster i Del 3.4 |
| **K3** | D: CLAUDE.md (projekt) + E: todo.md | D + E | Båda uppdaterade, 0 conversion-plan-referenser kvar utanför `docs/archive/` + sessionsdoken |
| **K4** | F: 5 verifieringskommandon (Code-prompt) + G: UNIVERSAL-lyft 7 poster till hub + C: direktivet SLUTFÖRT (sista commit) | F + G + C | Alla 5 kommandon gröna, hubbens lessons.md har 7 nya poster, direktivets header SLUTFÖRT, git ren, P3b stop-test passerat |

### Beslut fattade i K1 (2026-05-05)

| # | Fråga | Beslut | Motiv |
|---|---|---|---|
| 1 | K2-commits: en eller två? | **Två** (mv conversion-plan + BUILD-LOG separat) | Arkivering är mekanisk, BUILD-LOG är substantiellt skrivande. Separata commits = enklare rollback + tydligare `git log`. |
| 2 | UNIVERSAL-lyft: hur körs det? | **Manuell Code-prompt** (kopiera 7 poster till hubben) | `mps-sync` är skissad i `research/mps/03d-design-byggbarhet.md` men ej committerad. Att vänta blockerar P3b. 7 poster är hanterbar mängd för str_replace. |
| 3 | Defer-beslut: var dokumenteras? | **Sessionsdok Del 3.4 + todo.md** (ingen ADR) | Defer av CSS-warnings + PostCSS audit är hygien, inte arkitektur. ADR-021 vore ADR-inflation. CSP-pluginen är redan ADR-011. |

---

## Del 2 — K1: Sessionsdok-skelett

🚧 **PÅGÅR — denna commit.**

Innehållet i Del 1 utgör K1:s leverans. Filen är medvetet inte komplett — Del 3/4/5 fylls i K2/K3/K4. Pass-status (Del 6) och Stop-test (Del 7) markeras klara löpande.

### 2.1 — Code-prompt för commit av denna fil

```
LÄS först:
- ~/Repon/miranon-media-admin/CLAUDE.md
  (för att verifiera commit-stil och repo-konventioner)
- ~/Repon/miranon-media-admin/tasks/sessions/
  (verifiera att 2026-05-05-byggplan-stadning-p3b.md INTE redan finns —
   om den gör det: stoppa och rapportera, gör inget mer)

RAPPORTERA:
- Bekräfta att working tree är ren (`git status` → "nothing to commit")
- Bekräfta att filen finns på Marcus' maskin (~/Downloads eller motsvarande)
- Bekräfta att filen börjar med "# Byggplan-städning + arkivering + BUILD-LOG retrospektiv — P3b"
  (head -1 ska matcha)
- Lista vad som kommer committas: en (1) ny fil i tasks/sessions/

PLANERA:
- En `mv` från Downloads till tasks/sessions/2026-05-05-byggplan-stadning-p3b.md
- En `git add` av den nya filen
- En `git commit` med message-mallen nedan
- En `git push`
- Ingen ändring i någon annan fil

IMPLEMENTERA + VERIFIERA:
- Flytta filen, git add, git commit, git push
- `git diff HEAD~1 HEAD --stat` ska visa exakt 1 ny fil, 0 borttagna,
  inga andra ändringar
- `git ls-remote origin HEAD` ska matcha lokal HEAD

DOKUMENTERA + COMMITTA:
- Commit-message:

    docs(byggplan): start P3b session document — skeleton

    K1 of P3b (städning + arkivering + BUILD-LOG retrospektiv).
    Trail follows P0/P1/P2/P3a pattern. Skeleton only — Del 3/4/5
    filled in K2/K3/K4.

    Decisions locked in K1:
    - K2 = two commits (mv conversion-plan + BUILD-LOG separately)
    - UNIVERSAL-lift = manual Code-prompt (mps-sync deferred)
    - Defer-decisions = sessionsdok + todo.md only (no ADR)

    Next: K2 (archive conversion-plan + BUILD-LOG retrospective).

- Pusha
- Säg till Marcus: "K1 committat. Redo för K2 (arkivering + BUILD-LOG)."
```

---

## Del 3 — K2: Arkivering + BUILD-LOG retrospektiv + defer-beslut

🚧 **PLANERAD — fylls i K2.**

Innehåll som kommer:

- **3.1 Arkivering (commit 1)** — `git mv docs/conversion-plan.md docs/archive/conversion-plan-2026-04-14.md` + ARKIVERAD-header i den flyttade filen som pekar på `docs/byggplan.md` per ADR-012
- **3.2 BUILD-LOG Fas A-sektion (commit 2)** — M1–M8 med commit-hashar, planerat vs faktiskt, 113 tester, avvikelser med ADR-pekare, DoD. Källa: `2026-05-04-security-hardening.md`
- **3.3 BUILD-LOG P0/P1/P2/P3a-poster** — kompakta poster med commit-range + hänvisning till respektive sessionsdok (undvik dubblering — UNIVERSAL "Korsreferens > duplicering")
- **3.4 Defer-beslut H** — CSS-warnings (`src/styles/base.css:72-75`) + PostCSS audit-fix; båda formuleras som todo.md-poster med "DEFER tills [fas]" + 2-radersnot här
- **3.5 Code-prompts** — commit 1 (arkivering) och commit 2 (BUILD-LOG)

---

## Del 4 — K3: CLAUDE.md (projekt) + todo.md

🚧 **PLANERAD — fylls i K3.**

Innehåll som kommer:

- **4.1 CLAUDE.md (projekt) — fyra ändringar:**
  1. Aktuellt fokus / version-rubrik → "Fas 2 — Routing + Auth (per `docs/byggplan.md`)"
  2. "Styrande dokument för konverteringen"-raden → byggplan istället för conversion-plan
  3. Sessionsstart-checklistan punkt 4 → byggplan istället för conversion-plan
  4. Filstruktur-snapshot uppdaterad (om sådan finns; annars — verifiera och hoppa över)
- **4.2 todo.md** — rensa conversion-plan-referenser, lägg in "Fas 2 nästa enligt `docs/byggplan.md`", lägg in defer-poster från 3.4
- **4.3 Code-prompts** — commit 3 (CLAUDE.md), commit 4 (todo.md). Två separata commits för spårbarhet.

---

## Del 5 — K4: Verifiering + UNIVERSAL-lyft + direktivet SLUTFÖRT

🚧 **PLANERAD — fylls i K4.**

Innehåll som kommer:

- **5.1 Verifierings-prompt (commit 5)** — 5 kommandon med rapporterad output:
  - `npm run test:api` → grön (113 tester förväntas)
  - `npx tsc --noEmit` → 0 fel
  - `npx @biomejs/biome check .` → 0 fel
  - `npm run build` → grön
  - Lighthouse-baseline tagen + sparad (placeholder-route — t.ex. `/`)
- **5.2 UNIVERSAL-lyft (commit 6)** — manuell Code-prompt för append av 7 poster till `~/Repon/marcus-system/tasks/lessons.md`. Posterna kopieras verbatim från projektets lessons.md utan att duplicera (Code dedupar mot befintliga rubriker)
- **5.3 Direktivet SLUTFÖRT (commit 7 — SISTA)** — str_replace mot `tasks/byggplan-direktiv.md` headerns Status-tabell (lägg till rad "Status | **SLUTFÖRT 2026-05-05**") + ev. uppdatering av §12 om så krävs
- **5.4 P3b stop-test markerat PASSERAT** i Del 7
- **5.5 Sammanfattning för framtida läsare** i Del 8

---

## Del 6 — Pass-status

| Klunga | Innehåll | Status | Commit |
|---|---|---|---|
| K1 | Sessionsdok-skelett | 🚧 PÅGÅR (denna commit) | "docs(byggplan): start P3b session document — skeleton" |
| K2 | Arkivering + BUILD-LOG retrospektiv + defer | 📅 PLANERAD | (kommer — 2 commits) |
| K3 | CLAUDE.md (projekt) + todo.md | 📅 PLANERAD | (kommer — 2 commits) |
| K4 | Verifiering + UNIVERSAL-lyft + SLUTFÖRT | 📅 PLANERAD | (kommer — 3 commits, sista markerar §12) |

**Total commit-count för P3b:** 1 (K1) + 2 (K2) + 2 (K3) + 3 (K4) = **8 commits**.

---

## Del 7 — P3b Stop-test

**Stop-test enligt direktiv §6 P3 (P3b-andelen) + §12 slutnot.**

### Verifieringschecklista

**Repo-hygien:**
- ⏳ `docs/conversion-plan.md` flyttad till `docs/archive/conversion-plan-2026-04-14.md`
- ⏳ Den arkiverade filen har ARKIVERAD-header som pekar på `docs/byggplan.md` per ADR-012
- ⏳ `docs/BUILD-LOG.md` har Fas A-sektion (M1–M8 + commit-hashar + planerat vs faktiskt + 113 tester + avvikelser med ADR-pekare + DoD)
- ⏳ `docs/BUILD-LOG.md` har P0/P1/P2/P3a-poster (kompakta, med hänvisningar till sessionsdoken)
- ⏳ Defer-beslut dokumenterade i Del 3.4 + tasks/todo.md (CSS-warnings + PostCSS audit)

**Dokument-hygien:**
- ⏳ `CLAUDE.md` (projekt) har "Aktuellt fokus: Fas 2 — Routing + Auth (per `docs/byggplan.md`)"
- ⏳ `CLAUDE.md` sessionsstart-checklistan punkt 4 pekar på `docs/byggplan.md` (inte conversion-plan)
- ⏳ `CLAUDE.md` har 0 conversion-plan-referenser utanför explicit historisk kontext
- ⏳ `tasks/todo.md` har 0 conversion-plan-referenser, "Fas 2 nästa" infört, defer-poster på plats
- ⏳ `marcus-system/tasks/lessons.md` har 7 nya UNIVERSAL-poster (3 P1 + 4 P2)
- ⏳ `tasks/byggplan-direktiv.md` headerns Status-tabell har "Status: SLUTFÖRT 2026-05-05"-rad

**Verifierings-hygien:**
- ⏳ `npm run test:api` → grön (113 tester)
- ⏳ `npx tsc --noEmit` → 0 fel
- ⏳ `npx @biomejs/biome check .` → 0 fel
- ⏳ `npm run build` → grön
- ⏳ Lighthouse-baseline tagen + sparad (placeholder-route)

**Slutkontroll:**
- ⏳ `git status` ren
- ⏳ Lokal HEAD = origin HEAD på alla 8 commits
- ⏳ Inget kvarvarande arbete i Downloads (sessionsdoket committat, inga lösa filer)

### **Stop-test PASSERAT (markeras efter K4 är klar)**

---

## Del 8 — Sammanfattning för framtida läsare

🚧 **PLANERAD — fylls efter K4.**

Mall (fylls i):

**Vad denna session levererade:** [arkiverad conversion-plan, BUILD-LOG retrospektivt komplett, CLAUDE.md + todo.md uppdaterade, 5 verifieringskommandon gröna, 7 UNIVERSAL-poster i hubben, direktivet SLUTFÖRT — totalt 8 commits].

**Vad denna session inte gjorde:** [Påbörjade inte Fas 2-arbetet. Lämnade defer-besluten kvar (CSS-warnings + PostCSS audit) eftersom de är hygien som tas vid första session de blir aktuella.]

**Vad nästa session ska göra:** Fas 2 — Routing + Auth, mot `docs/byggplan.md` som styrande dokument. Använd byggplan-fasprompten direkt; sessionsstart-checklistan i `CLAUDE.md` är uppdaterad.

**Var den auktoritativa P3b-trailen finns:** denna fil — `tasks/sessions/2026-05-05-byggplan-stadning-p3b.md`.

**Var byggplan-revisionen som helhet finns spårad:**
- P0 → `docs/byggplan-revision-inventory.md`
- P1 → `tasks/sessions/2026-05-04-byggplan-revision-p1.md` + `2026-05-04-p1-avslutning.md`
- P2 → `tasks/sessions/2026-05-04-stodspec-synk-p2.md`
- P3a → `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md`
- P3b → denna fil
- Slutprodukt → `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter, 10 ADR:er ADR-011..ADR-020)

---
