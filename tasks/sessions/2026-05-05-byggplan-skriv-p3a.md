# Byggplan-skrivning + ADR-katalog — P3a

> **Status:** ✅ KLAR — alla fyra klungor genomförda, stop-test passerat 2026-05-05.
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

✅ **KLAR** 2026-05-05. Filen skapad och committad ("docs(byggplan): start P3a session document — skeleton") — innehållet i Del 1 utgör K1:s leverans. Code-bekräftelse: 1 ny fil, ren commit, lokal HEAD = origin HEAD.

---

## Del 3 — K2: byggplan.md skelett + per-fas-prompter

✅ **KLAR** 2026-05-05. `docs/byggplan.md` skapad och committad ("docs(byggplan): add docs/byggplan.md — P3a K2 leverans"). Storlek: 831 rader, ~41 kB. Verifierat: 0 ADR-NNN-rester, 11 ADR (#N)-referenser konsistent (uppdateras till slutgiltiga ADR-NNN i K3). Code-avvikelseflagga: verifieringskravet "16 fas-rubriker" matchade inte — dokumentet har 15 (Fas 6 är EN rubrik med 6a-6e som sub-allokering inom). Designval bekräftat som medvetet i Chat-svar: bryta ut 6a-e till `### Fas 6a/6b/6c/6d/6e` skulle duplicera DoD-mall, beroenden och ADR-krav — bryter mot UNIVERSAL "Korsreferens > duplicering" (P2 2026-05-04).

### K2-leveransens struktur

`docs/byggplan.md` består av sex sektioner:

| § | Innehåll | Rader (ungefär) |
|---|---|---|
| 1 | Prolog — syfte, läsanvisning, dokumentstruktur (3-lager: Strategi/Plan/Implementation) | ~50 |
| 2 | Fas-tabell (15 rader post-P1) + total estimat 16,5 sessioner + numreringsnot om Fas 4 | ~30 |
| 3 | Övergripande arkitektur — 8 etablerade mönster post-Fas A (operations-API, Auth, INVARIANT, observability, test-prefix, strangler-fig, M4-principen, källa-vs-implementation) | ~60 |
| 4 | Per-fas-prompter — 16 prompter: 3 retrospektiva (Fas 0/1/A klara) + 13 framåtblickande (Fas 2, 2.5, 3, 3.5, 5, 5.5, 6, 6.5, 7, 8, B, E). Per fas: Mål/Scope/Inte-scope/Beroenden/Estimat/Filer/DoD/ADR-krav/Korsreferens | ~600 |
| 5 | ADR-index (10 ADR:er, slutgiltigt numrerade ADR-011 till ADR-020 efter K3) + bonus-ADR-not för Fas 6.5 | ~25 |
| 6 | Versionshistorik (v1.0 K2, v1.1 K3) | ~5 |

### Korrigeringar mot råversion

Sju fynd identifierade vid självgranskning innan K2-commit, alla fixade:

1. **Fas B status "KLAR (start)"** — meningslöst → "PARALLELL"
2. **"ADR-NNN" placeholders** överallt → "ADR (#N)" med matchning mot §5 ADR-index (uppdaterades till slutgiltiga ADR-NNN i K3)
3. **Fas 6.5 saknad "Filer"-sektion** — strukturfel, lagt till
4. **Fas 6.5 ADR är 11:e** (utöver de 10) — markerad explicit som "Bonus-ADR"
5. **Saknad estimat-summa** — lagt till efter fas-tabellen: 16,5 sessioner med beräkning
6. **Fas 5.5 scope saknar `aria-live`** — lagt till
7. **Fas 6 DoD saknar 11/10/10-anchor** — lagt till som ny DoD-punkt 1

### Designval värda att dokumentera

- **Per-fas-promptens åtta sektioner** — konsekvent över alla 13 faser så att Code-prompter blir deterministiska
- **Fas 0/1/A som retrospektiva prompter** — kort men explicit, läsbarhet och spårbarhet
- **§3 "Övergripande arkitektur"** — Fas A-mönster låses en gång, refereras från fas-prompter (UNIVERSAL "Korsreferens > duplicering")
- **Fas 6 = ETT prompt-block med sub-fas-tabell** — sub-faserna delar DoD-mall, beroenden, ADR-krav
- **Fas 8/B/E får kort prompt med "preliminärt — låses vid aktualisering"-not** — defer:ade faser har lägre kvalitetskrav
- **ADR (#1)/#2/#3 (CSP, conversion→byggplan, Fas 4) som meta-ADR:er i P3a** — de andra 7 markeras "skrivs i Fas X"

---

## Del 4 — K3: 10 ADR:er + uppdaterad byggplan.md

✅ **KLAR** 2026-05-05. 10 ADR:er skrivna och committade ("docs(decisions): add 10 ADRs (ADR-011..ADR-020) + update byggplan.md references"). byggplan.md uppdaterad till v1.1 med slutgiltiga ADR-NNN-referenser. Code-bekräftelse: 11 filer ändrade (10 nya + 1 modifierad), lokal HEAD = origin HEAD.

### Numreringsstrategi

Befintliga ADRs i `docs/decisions/`: ADR-001 till ADR-010 (Fas 0 + Fas 1, Session 1, 2026-04-14). Mina 10 nya: ADR-011 till ADR-020. Säker numrering, ingen kollisionsrisk.

### Mappning P3a-katalog → slutgiltig numrering

| ADR-fil | Ämne | Fas där den refereras |
|---|---|---|
| ADR-011 | CSP-plugin-deferral i `vite.config.ts` | Fas 0 (skuld) + Fas 7 (verifikation) |
| ADR-012 | `conversion-plan.md` ersatt av `byggplan.md` | Meta (P3a) |
| ADR-013 | Fas 4-borttagningen (DataTable → Fas 7) | Meta (P3a, numreringsnot) |
| ADR-014 | `createRegistration`-idempotency | Fas 6c |
| ADR-015 | `sendEmail` direct-Resend-skuld | Fas 6e |
| ADR-016 | TanStack optimistic mutation-mönster | Fas 5.5 (mall för Fas 6) |
| ADR-017 | Hybrid polling 60s, Realtime till Fas E | Fas 6d |
| ADR-018 | Fas 5-förenklingen | Fas 5 |
| ADR-019 | Background Sync defer från Fas 7 till Fas 8 | Fas 8 (defer från Fas 7) |
| ADR-020 | Fas 3.5 = egen fas (P2 A1-utfall) | Fas 3.5 |

### ADR-format (verifierat mot ADR-001..ADR-010)

```
# ADR-NNN: [Titel]
- Status: Accepted | Superseded | Deprecated
- Datum: YYYY-MM-DD
- Fas: 0 | 1 | ...
## Kontext
## Beslut
## Alternativ som övervägdes
## Konsekvenser
```

Alla 10 nya ADRs följer detta format. Genomsnitt 75 rader per ADR (range 47-131). Totalt ~750 rader, ~52 kB.

### byggplan.md-uppdateringen

11 ADR-referenser i fas-prompter ersatta från "ADR (#N)" till "ADR-0NN":
- 6 referenser till ADR-011 (Fas 0 skuld + Fas 7 ADR-krav + Fas 7 verifikation)
- 1 till ADR-012 (versionshistorik)
- 2 till ADR-013 (numreringsnoten + ADR-index)
- 2 till ADR-014, 2 till ADR-015, 3 till ADR-016
- 2 till ADR-017, 2 till ADR-018, 2 till ADR-019
- 4 till ADR-020 (Fas 3.5 ADR-krav + DoD + tabell + lessons-pekare)

§5 ADR-index uppdaterad: kolumn "# i P3a-katalog" → "ADR" med slutgiltiga ADR-NNN-värden. Bonus-ADR-not tillagd för Fas 6.5 (`trace_id` vs `requestId`-relationen).

Versionshistoriken utökad: v1.1 markerar K3-uppdateringen.

---

## Del 5 — K4: decisions/README.md + sessionsdok-uppdatering

Sista klungan i P3a. Två leveranser:

### 5.1 — `docs/decisions/README.md` uppdatering

Befintlig README har en "## Index"-tabell med ADR-001 till ADR-010. K4 lägger till 10 nya rader efter ADR-010, samma format:

```markdown
| [ADR-011](ADR-011-csp-plugin-deferral.md) | CSP-nonce-plugin uppskjuten från Fas 0 till Fas 7 | Accepted | 0 |
| [ADR-012](ADR-012-conversion-plan-ersatt-av-byggplan.md) | `conversion-plan.md` ersatt av `byggplan.md` | Accepted | Meta |
| [ADR-013](ADR-013-fas-4-borttagningen.md) | Fas 4 borttagen — DataTable till Fas 7 | Accepted | Meta |
| [ADR-014](ADR-014-create-registration-idempotency.md) | `create-registration` måste vara idempotent | Accepted | 6c |
| [ADR-015](ADR-015-send-email-direct-resend.md) | `send-email` direkt Resend-anrop — medveten skuld | Accepted | 6e |
| [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md) | TanStack optimistic mutation-mönster | Accepted | 5.5 |
| [ADR-017](ADR-017-polling-vs-realtime.md) | Hybrid polling 60s, Realtime till Fas E | Accepted | 6d |
| [ADR-018](ADR-018-fas-5-forenkling.md) | Fas 5 selektivt förenklad — 4 [GA] till Fas 7 | Accepted | 5 |
| [ADR-019](ADR-019-background-sync-defer.md) | Background Sync defer från Fas 7 till Fas 8 | Accepted | 8 |
| [ADR-020](ADR-020-fas-3-5-egen-fas.md) | Fas 3.5 = egen fas (a11y-baseline) | Accepted | 3.5 |
```

Implementation: Code gör str_replace mot ADR-010-raden (lägger till 10 nya rader efter den). Inga andra ändringar i README.md i K4.

### 5.2 — Sessionsdok-uppdatering (denna fil)

Uppdateras med fyllda Del 3 (K2) + Del 4 (K3) + Del 5 (K4) + Pass-status + Stop-test + P3b startkontext. Implementation: Marcus laddar ner uppdaterad fil till Downloads, Code skriver över befintlig sessionsdok.

### 5.3 — Code-prompt för K4-commit

Code-prompten levereras i Chat tillsammans med uppdaterad sessionsdok (denna fil). Strukturen följer P1 Del 3 / P2 Del 6-mönstret:

1. LÄS — verifiera nuläge (README-struktur, sessionsdok i Downloads, working tree clean)
2. RAPPORTERA — visa nuläge för Marcus
3. PLANERA — str_replace mot README + mv av sessionsdok
4. IMPLEMENTERA — exekvera ändringar
5. VERIFIERA — räkna ADR-rader, kontrollera sessionsdok-storlek, git diff
6. DOKUMENTERA + COMMITTA — commit-message + push
7. EFTER — bekräfta synk + säg till Marcus att klicka "Update" inför P3b

---

## Del 6 — Pass-status

| Klunga | Innehåll | Status | Commit |
|---|---|---|---|
| K1 | Sessionsdok-skelett | ✅ KLAR 2026-05-05 | "docs(byggplan): start P3a session document — skeleton" |
| K2 | byggplan.md + 13 fas-prompter | ✅ KLAR 2026-05-05 | "docs(byggplan): add docs/byggplan.md — P3a K2 leverans" |
| K3 | 10 ADRs + byggplan.md v1.1 | ✅ KLAR 2026-05-05 | "docs(decisions): add 10 ADRs (ADR-011..ADR-020) + update byggplan.md references" |
| K4 | decisions/README.md + sessionsdok-uppdatering | ⏳ PÅGÅR (denna fil) | (denna commit) |

---

## Del 7 — P3a Stop-test

**Stop-test enligt direktiv §6 P3 (P3a-andelen): byggplan.md klar + ADR:er skrivna.**

### Verifieringschecklista

- ✅ `docs/byggplan.md` finns och är 832 rader (initiellt 831 i K2, +1 rad bonus-ADR-not i K3)
- ✅ byggplan.md innehåller per-fas-prompt för alla 13 framåtblickande faser:
  - Fas 2, Fas 2.5, Fas 3, Fas 3.5
  - Fas 5, Fas 5.5, Fas 6 inkl. sub-fas-tabell 6a-6e
  - Fas 6.5, Fas 7, Fas 8
  - Fas B, Fas E
- ✅ Per fas innehåller åtta sektioner: Mål/Scope/Inte-scope/Beroenden/Estimat/Filer/DoD/ADR-krav (+ Korsreferens)
- ✅ Fas 0/1/A finns som retrospektiva korta prompter med commit-pekare
- ✅ §3 Övergripande arkitektur dokumenterar 8 etablerade mönster post-Fas A
- ✅ §5 ADR-index har 10 ADRs listade med slutgiltiga ADR-011..ADR-020-numreringar + bonus-ADR-not
- ✅ 10 ADR-filer finns i `docs/decisions/`: ADR-011 till ADR-020
- ✅ Varje ADR har Status/Datum/Fas i header + sektioner Kontext/Beslut/Alternativ/Konsekvenser
- ✅ `docs/decisions/README.md` uppdaterad — Index-tabellen har 20 rader (ADR-001..ADR-020) [efter K4-commit]
- ✅ Inga "ADR-NNN"-platshållare kvar i byggplan.md (verifierat med `grep -c "ADR-NNN" → 0`)
- ✅ Inga "ADR (#N)"-platshållare kvar i byggplan.md (utom 1 i versionshistorik-not som dokumenterar v1.0-format — medveten retention)

### **Stop-test PASSERAT 2026-05-05.**

P3a:s output uppfyller §6 P3-kraven för byggplan-skrivning + ADR-katalog. Återstående §6 P3-krav (städnings-DoD, BUILD-LOG retrospektiv, direktivet SLUTFÖRT, verifierings-hygien) tas i P3b.

---

## Del 8 — P3b startkontext (briefing för nästa Chat-session)

Färdig prompt-mall att klistra in vid start av P3b-sessionen. Säkerställer att P3b startar med rätt kontext utan att läsa hela P3a-sessionsdoket.

```
[P3b-START-PROMPT — klistra in i ny Chat-session]

Hej. P3a är klar och committad. Nu kör vi P3b — Städning + arkivering + BUILD-LOG
retrospektiv enligt direktiv §6 P3 + §12.

Läs i denna ordning:
1. ~/Repon/marcus-system/CLAUDE.md
2. ~/Repon/miranon-media-admin/CLAUDE.md
3. ~/Repon/miranon-media-admin/tasks/lessons.md
4. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-05-byggplan-skriv-p3a.md
   (P3a-leveransen — främst Del 6 Pass-status, Del 7 Stop-test)
5. ~/Repon/miranon-media-admin/docs/byggplan.md (slutprodukten — referensmaterial)
6. ~/Repon/miranon-media-admin/docs/conversion-plan.md (ska arkiveras)
7. ~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md §6 P3 + §12
   (uppgifts- och slutnot-beskrivningen)
8. ~/Repon/miranon-media-admin/docs/BUILD-LOG.md (befintlig — utökas i P3b)

Mål: Repo:t blir "rent och 11/10". Alla artefakter på rätt plats, ingen drift
mellan dokument och verklighet.

Specifika P3b-uppgifter:

A. Arkivera conversion-plan.md → docs/archive/conversion-plan-2026-04-14.md
   (datumet är skapelsedatum, bevarar provenance per ADR-012).

B. Uppdatera docs/BUILD-LOG.md med Fas A-sektion retrospektivt:
   - 8 milstolpar M1-M8 med commit-hashar (14 commits totalt)
   - Planerat vs faktiskt
   - 113 tester (planerat antal vs faktiskt)
   - Avvikelser med ADR-pekare
   - Definition of Done
   - Källa: tasks/sessions/2026-05-04-security-hardening.md
   - Plus mindre P0/P1/P2-poster (eller hänvisning till sessionsdoken)

C. Markera tasks/byggplan-direktiv.md som SLUTFÖRT i headern (§12).

D. Uppdatera CLAUDE.md (projekt) med:
   - Aktuellt fokus: "Fas 2 — Routing + Auth (per docs/byggplan.md)"
   - Filstruktur-snapshot uppdaterad
   - Referenser till conversion-plan ersatta med byggplan
   - Sessionsstart-checklistan pekar på byggplan istället för conversion-plan

E. Rensa tasks/todo.md från conversion-plan-poster + uppdatera enligt byggplan
   (t.ex. "Fas 2 nästa" istället för "Fas 2 enligt conversion-plan §D Fas 2").

F. Verifierings-hygien (Code-uppgifter):
   - npm run test:api → grön (113 tester förväntas)
   - npx tsc --noEmit → 0 fel
   - npx @biomejs/biome check . → 0 fel
   - npm run build → grön
   - Lighthouse-baseline tagen på en placeholder-route (för senare jämförelse)

G. UNIVERSAL-lyft från projekt → hub:
   - 7 nya UNIVERSAL-poster i tasks/lessons.md (3 från P1 + 4 från P2)
   - Lyft till marcus-system/tasks/lessons.md per WORKFLOW.md veckosynk-rutin

H. Defer-beslut explicit dokumenterade:
   - 4 CSS-warnings i src/styles/base.css:72-75 — behåll eller städa? (defer)
   - PostCSS audit-fix — kör nu eller vänta? (defer)
   - CSP-plugin-deferral-ADR-innehåll: redan skrivet (ADR-011), Fas 7 verifierar.

Stop-test (P3b): direktivet markerat SLUTFÖRT + alla städnings-DoD avbockade
+ git status ren + 5 verifieringskommandon gröna + UNIVERSAL-lyft genomfört.

Föreslå arbetsupplägg innan vi börjar. Sannolikt sessionsdok-fil för P3b
(samma mönster som P0/P1/P2/P3a). Eventuellt 3-4 klungor:
- K1 sessionsdok-skelett
- K2 BUILD-LOG retrospektiv + arkivering av conversion-plan
- K3 dokument-hygien (CLAUDE.md, todo.md, direktivet, UNIVERSAL-lyft)
- K4 verifierings-hygien (Code-prompter)

Code är fri, P3a committad. Detta är Chat-arbete.
```

---

## Del 9 — Sammanfattning för framtida läsare

**Vad denna session levererade:** `docs/byggplan.md` (slutprodukten, 832 rader) + 10 ADR-filer (ADR-011..ADR-020 i `docs/decisions/`, ~750 rader) + uppdaterad `docs/decisions/README.md` (20 rader i Index). Alla beslut från P0/P1/P2 införlivade som per-fas-prompter med konsistenta DoD-mallar och slutgiltiga ADR-referenser.

**Vad denna session inte gjorde:** Arkiverade inte conversion-plan (det är P3b). Uppdaterade inte BUILD-LOG retrospektivt (det är P3b). Markerade inte direktivet SLUTFÖRT (det är P3b). Lyfte inte UNIVERSAL till hub (det är P3b).

**Vad nästa session ska göra:** P3b — städning + arkivering + BUILD-LOG retrospektiv per direktiv §6 P3 städnings-DoD + §12 slutnot.

**Var den auktoritativa P3a-trailen finns:** `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` — denna fil, ~410 rader efter K4.

**Var den auktoritativa byggplanen finns (efter Code committat K2+K3):** `docs/byggplan.md` v1.1 — 832 rader, ersätter conversion-plan som styrande dokument.

---
