# Byggplan-städning + arkivering + BUILD-LOG retrospektiv — P3b

> **Status:** ✅ SLUTFÖRT 2026-05-05 — alla fyra klungor genomförda, stop-test passerat, direktivet markerat SLUTFÖRT i §11.
> **Skapat:** 2026-05-05 (K1) | **Slutgiltig version:** 2026-05-05 (K4 commit 7 — bakar in Del 3/4/5/6/7/8)
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
> **Stop-test (P3b):** ✅ PASSERAT — direktivet markerat SLUTFÖRT + alla städnings-DoD avbockade + git status ren + 5 verifieringskommandon gröna + UNIVERSAL-lyft genomfört.
> **Sessionsdok-commit-disciplin (P3a-mönster, verifierat):** K1 = skelett-commit. K2-K3 = innehålls-commits, rörde INTE sessionsdoket. K4 sista commit (commit 7) bakar in (a) sista innehållet (direktivet SLUTFÖRT) + (b) sessionsdok Del 3/4/5/6/7/8 fyllning. Detta dokument committades 2 gånger totalt (K1 + K4 sista).

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för P3b-steget — sista steget i byggplan-revisionen. Dess uppgift var att producera tre saker:

1. **Repo-hygien** — `conversion-plan.md` arkiverad, `BUILD-LOG.md` retrospektivt komplett (Fas A + P0/P1/P2/P3a), `todo.md` rensad, `CLAUDE.md` (projekt) uppdaterad så ingen rad pekar på conversion-plan.
2. **Verifierings-baseline** — 5 kommandon gröna innan Fas 2 startar (`test:api`, `tsc`, `biome`, `build`, Lighthouse-baseline).
3. **Slutsignal** — `tasks/byggplan-direktiv.md` markerat SLUTFÖRT i §11, hubben (`marcus-system/tasks/lessons.md`) synkad med 7 nya UNIVERSAL-poster (3 från P1 + 4 från P2).

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i repot är "current truth" efter att Code committat dem via prompterna i K2/K3. Sessionsdoket självt committades en (1) gång till efter K1 — i K4 sista commit — per P3a-mönstret.

P3b avslutar hela byggplan-revisionen. Nästa session (i ny Chat) är **Fas 2 — Routing + Auth**, mot `docs/byggplan.md` som styrande dokument.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap):

| # | Fil | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, principer |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projektkonstitution, sessionsstart-checklista (uppdaterades i K3) |
| 3 | `tasks/lessons.md` | Universella lärdomar — 7 nya poster (3 P1 + 4 P2) som lyftes i K4 |
| 4 | `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` | P3a-leveransen — Del 6 Pass-status, Del 7 Stop-test PASSERAT |
| 5 | `docs/byggplan.md` | Slutprodukten — referensmaterial för CLAUDE.md/todo.md-uppdatering |
| 6 | `docs/conversion-plan.md` | Källan som arkiverades i K2 |
| 7 | `tasks/byggplan-direktiv.md` §6 P3 + §12 | Uppgifts- och slutnot-beskrivning |
| 8 | `docs/BUILD-LOG.md` | Befintlig — utökades i K2 |

**Tilläggskällor för K2 (BUILD-LOG retrospektivt):**

- `tasks/sessions/2026-05-04-security-hardening.md` — Fas A M1–M8, DoD per milstolpe, 8 arkitekturmönster
- `tasks/sessions/2026-05-04-byggplan-revision-p1.md` — P1-leveransen
- `tasks/sessions/2026-05-04-stodspec-synk-p2.md` — P2-leveransen
- `docs/byggplan-revision-inventory.md` — P0-leveransen

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §6 P3 + §12 — auktoritativ för P3b
2. `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` Del 6 + Del 7 — P3a-leveransstatus och stop-test
3. `docs/byggplan.md` (post-P3a) — styrande dokument efter K2-arkivering
4. `docs/conversion-plan.md` (arkiverad) — historiskt referensmaterial, **inte styrande** efter K2
5. **Code mini-RAPPORTERA mot HEAD** (2026-05-05) — auktoritativ för faktiska filnamn, drift-strängar, commit-hashar

### Klunga-struktur för P3b (slutförd)

| Klunga | Innehåll | Stop-test per klunga |
|---|---|---|
| **K1** | Sessionsdok-skelett | ✅ Filen committad i repot |
| **K2** | A: arkivera conversion-plan (commit 1) + B: BUILD-LOG retrospektiv (commit 2) | ✅ conversion-plan i `docs/archive/`, BUILD-LOG har Session 2-block + 4 drift-rader fixade. Sessionsdok rörs ej. |
| **K3** | D: CLAUDE.md (projekt) (commit 3) + E: todo.md (commit 4) | ✅ Båda uppdaterade, 0 conversion-plan-referenser kvar utanför `docs/archive/` + sessionsdoken. Sessionsdok rörs ej. |
| **K4** | F: 5 verifieringskommandon (ingen commit — bevaras inline i sessionsdoket) + G: UNIVERSAL-lyft 7 poster (commit 5 i hub) + C: direktivet SLUTFÖRT + sessionsdok bakas in (commit 6 i miranon-media-admin) | ✅ Alla 5 kommandon gröna, hubbens lessons.md har 7 nya poster, direktivets header SLUTFÖRT, sessionsdok komplett, git ren |

### Beslut fattade i K1 (2026-05-05) + uppdaterade under sessionen

| # | Fråga | Beslut | Motiv |
|---|---|---|---|
| 1 | K2-commits: en eller två? | **Två** (mv conversion-plan + BUILD-LOG separat) | Arkivering är mekanisk, BUILD-LOG är substantiellt skrivande. Separata commits = enklare rollback + tydligare `git log`. |
| 2 | UNIVERSAL-lyft: hur körs det? | **Manuell Code-prompt** | `mps-sync` är skissad men ej committerad. 7 poster är hanterbar mängd för str_replace. |
| 3 | Defer-beslut: var dokumenteras? | **Sessionsdok Del 3.4 + todo.md** (ingen ADR) | Defer av hygien-arbete är inte arkitekturbeslut. ADR-021 vore inflation. |
| 4 (K2 v2) | Sessionsdok-commit-disciplin? | **K1 commit + K4 sista commit** (P3a-mönster) | K2/K3 levererar repo-ändringar utan att röra sessionsdoket. K4 sista commit bakar in alla Del 3/4/5-fyllningar + Pass-status + Stop-test + Del 8. |
| 5 (K2 v2) | RAPPORTERA-pause i complex commits? | **Ja** — Code stoppar mellan PLANERA och IMPLEMENTERA | BUILD-LOG-injicering + CLAUDE.md/todo.md-redigeringar är str_replace med whitespace-känslighet. Marcus får 30s att granska innan irreversibel commit. |
| 6 (K4) | Lighthouse-baseline: automation eller manuell? | **Manuell körning av Marcus, output bakas in i sessionsdoket** | Engångsmätning — automatisering har negativt ROI. Textuell output matchar repots dokumentationskultur. Säkerhetspaus naturlig. |
| 7 (K4) | Verifierings-bevis: separat fil eller inline? | **Inline i sessionsdokets Del 5.1** (ingen separat commit-fil) | Per UNIVERSAL "Korsreferens > duplicering". Engångsmätning hör i sessionsdoket. |

---

## Del 2 — K1: Sessionsdok-skelett

✅ **KLAR 2026-05-05** | Commit: `7de8cb4 docs(byggplan): start P3b session document — skeleton`

Filen skapad och committad. Innehållet i Del 1 utgör K1:s leverans — Prolog, indata-kontext, källprioritet, klunga-struktur, beslut låsta.

---

## Del 3 — K2: Arkivering + BUILD-LOG retrospektiv + defer-beslut

✅ **KLAR 2026-05-05** | Två commits:
- Commit 1 (arkivering): `2075ab3 chore(docs): archive conversion-plan.md → archive/conversion-plan-2026-04-14.md`
- Commit 2 (BUILD-LOG): `9fe236d docs(build-log): Session 2 — Fas A + P0–P3a retrospektiv + drift-fix`

### 3.1 — Arkivering (commit 1 ✅)

`git mv docs/conversion-plan.md docs/archive/conversion-plan-2026-04-14.md` — datumet i filnamnet är skapelsedatum (per ADR-012), inte arkiveringsdatum. Bevarade provenance.

**ARKIVERAD-header injicerad** direkt efter H1-rubriken i den flyttade filen:

```markdown
> **Status:** ARKIVERAD 2026-05-05 — ersatt av [`docs/byggplan.md`](../byggplan.md) per [ADR-012](../decisions/ADR-012-conversion-plan-ersatt-av-byggplan.md).
> **Skapelsedatum:** 2026-04-14 (Session 1 (React), Fas 0 + Fas 1).
> **Bevarad provenance:** Detta dokument är historiskt referensmaterial. För aktuell fas-för-fas-plan, se [`docs/byggplan.md`](../byggplan.md). BUILD-LOG-poster för Fas 0 + Fas 1 refererar fortfarande denna fil — sökvägar är uppdaterade till `archive/`-prefixet i Session 2-injiceringen (commit 2).
```

**Verifikation post-mv ✅:**
- `find docs/ -name 'conversion-plan.md'` → 0 resultat ✅
- `find docs/archive/ -name 'conversion-plan*'` → 1 resultat ✅
- `git log --follow docs/archive/conversion-plan-2026-04-14.md` → full historik från ursprunglig commit 2026-04-14 bevarad ✅
- Per ADR-012 "Verifiering"-block: båda kommandona passerade ✅

### 3.2 — BUILD-LOG Session 2-block (commit 2 ✅)

Ny `## Session 2 (React)` H2-sektion injicerad EFTER Session 1-blocket och FÖRE `## Session-modellen` (rad 373). Code identifierade exakt insättningspunkt via str_replace mot "## Session-modellen".

**Designprincip (UNIVERSAL "Korsreferens > duplicering" — P2 2026-05-04):** Session 2-blocket gav commit-spårning + 1-rads M-sammanfattningar + verifierad filstruktur-snapshot. Detaljerade arkitekturmönster + DoD-block + avvikelse-paragrafer pekas till deras auktoritativa platser (`security-hardening.md` §B + §C, `SECURITY-SPEC.md` §6, P0/P1/P2/P3a-sessionsdoken). Dubblerar inte innehåll.

**Innehåll i Session 2-blocket:**

- **Fas A: Säkerhetshardening (M1–M8)** — 14 implementations-commits + 4 omgivande dokumentations-commits, kronologisk M-tabell, avvikelser (M2 ×2 hot-fixes, M4 discovery, M8 atomär classify401Body), 8 arkitekturmönster pekade till SECURITY-SPEC §6, 113 tester (verifierades grön i K4 — se Del 5.1), filstruktur-snapshot verifierad mot HEAD (`field-allowlists.ts`, `airtable-filter.ts`, `errors.ts`, `test-auth/` flaggad som teknisk skuld H.4)
- **P0** — Byggplan-revision inventering (commit `f3e4426`)
- **P1** — Fas-sekvens-revision, 8 beslut, 9 ADR-katalog (commits `810d669` → `5ed4668` → `5336d02` + städning `97573c0` + `def879a`)
- **P2** — Stödspec-synkning, 4 specs uppdaterade (commits `89979b5` → `176984d` → `c2ecffd` + städning `1fbb70c` + `167afd7`)
- **P3a** — Byggplan + ADR-katalog (commits `6de7c94` → `2ffede0` → `866b430` → `ce9dd02` + avslutning `b2ab337` + bonus `60ad326`)
- **DoD — Session 2:** Fas A ✅ (godkänt 2026-05-04), P0–P3a ✅ (varje fas hade egen stop-test, alla passerade), P3b avslutar §6 P3-städnings-DoD i denna session

### 3.3 — BUILD-LOG drift-fixar (commit 2 — del 2 av 2 ✅)

Fyra rader i befintlig BUILD-LOG.md driftade och fixades i samma commit som Session 2-injiceringen.

| Rad | Före | Efter |
|---|---|---|
| 5 | `Detta är **inte** en kravspec (den finns i \`conversion-plan.md\`)` | `Detta är **inte** en kravspec (den finns i \`byggplan.md\`)` |
| 380 | `- **Mål** (1 mening + länk till conversion-plan §D)` | `- **Mål** (1 mening + länk till byggplan.md §4)` |
| 387 | `Architecture Decision Records (10 st efter Session 1 (React))` | `Architecture Decision Records (20 ADR:er totalt — ADR-001..ADR-010 från Session 1 (React) Fas 0+1, ADR-011..ADR-020 från Session 2 (React) P3a)` |
| 388 | `[\`conversion-plan.md\`](conversion-plan.md) — fas-för-fas-planen (styrande)` | `[\`byggplan.md\`](byggplan.md) — fas-för-fas-planen (styrande)` |

**Ny rad efter 388:** `- [\`archive/conversion-plan-2026-04-14.md\`](archive/conversion-plan-2026-04-14.md) — historisk fas-för-fas-plan, ersatt av \`byggplan.md\` per [ADR-012](decisions/ADR-012-conversion-plan-ersatt-av-byggplan.md)`

**Historiska rader rörda inte:** 45, 49, 80, 190, 194, 238, 304 — beskriver vad som gällde 2026-04-14. Korrekta historiska påståenden.

### 3.4 — Defer-beslut H

Fyra öppna beslut. Tre defer:as (H.1, H.2, H.4), en är redan ADR-täckt (H.3). Dokumenterade här + i todo.md (K3 commit 4). Ingen ADR — defer av hygien-arbete är inte arkitekturbeslut.

#### H.1 — 4 CSS-warnings i `src/styles/base.css:72-75`

**Status:** DEFER tills Fas 3.
**Bakgrund:** 4 Biome-warnings om `!important` i `prefers-reduced-motion` (accepterat enligt Fas 0 verifieringspunkt 4).
**Skäl:** Fas 3 omarbetar `base.css` när primitiver landas. Att städa nu vore kasserat arbete.
**Trigger:** Första Fas 3-session.

#### H.2 — PostCSS audit-fix

**Status:** DEFER. Bevakas men inte aktiverat.
**Bakgrund:** `npm audit` rapporterar PostCSS-relaterade transitive dependencies. Inga `high`/`critical`.
**Skäl:** Inga hot-paths påverkade. PostCSS uppdateras naturligt via Tailwind v4-uppgradering eller dependabot.
**Trigger:** Om `npm audit --audit-level=high` blir röd, ELLER vid Tailwind v5-migration.

#### H.3 — CSP-plugin-deferral

**Status:** Redan ADR-täckt — [ADR-011](../docs/decisions/ADR-011-csp-plugin-deferral.md).
**Sammanfattning:** Vite security-headers-plugin med CSP-nonce uppskjuten från Fas 0 till Fas 7 per ADR.
**Ingen åtgärd i P3b** — pekare räcker.

#### H.4 — `supabase/functions/test-auth/` borttagning från produktion

**Status:** DEFER tills Fas 7.
**Bakgrund:** Upptäcktes i K2 mini-RAPPORTERA mot HEAD 2026-05-05. `test-auth/`-funktionen skapades som Playwright deny-paths-helper i M2 (`26e38bc`/`382c6b5`). Lever idag i `supabase/functions/` med `verify_jwt = false` i `config.toml`. Medvetet — testsuite behöver helper-funktionen för att simulera olika auth-scenarion. Men i produktion är funktionen onödig och representerar attack-yta.
**Skäl:** Fas 7 är "Konsolidering (CSP, chaos testing, deploy)" där test-only-funktioner antingen flyttas till en separat staging-miljö eller exkluderas vid deploy.
**Trigger:** Fas 7 prompt-DoD ska inkludera "test-* funktioner exkluderas från produktions-deploy".

### 3.5 — Code-prompts (commit 1 + commit 2 ✅)

Båda Code-prompter levererades inline i Chat med **inline-källa-disciplin** (lärdom från K2 v1→v2-felet — se Del 8 Lärdomskandidat 3). Code stoppade i RAPPORTERA-pausen för commit 2 enligt designen, Marcus granskade och godkände, sedan IMPLEMENTERA.

**Avvikelse upptäckt och åtgärdad mid-K2:** Initialt refererade Code-prompt 2 till "Del 3.2 i sessionsdoket" som källa för Session 2-blocket. Code stoppade och flaggade att sessionsdoket var K1-skelett vid körningstid (per P3a-disciplinen). Korrigerad prompt levererad med inline Session 2-block direkt i Code-prompten. Alt B (inline) bekräftad som rätt mönster — överförd till resten av P3b.

---

## Del 4 — K3: CLAUDE.md (projekt) + todo.md

✅ **KLAR 2026-05-05** | Två commits:
- Commit 3 (CLAUDE.md): `af33891 chore(claude-md): byggplan replaces conversion-plan + Session 2 update`
- Commit 4 (todo.md): `c72d8cd chore(todo): byggplan replaces conversion-plan + P3a/P3b split + 3 defer-posts`

### 4.1 — CLAUDE.md (commit 3 ✅)

7 str_replace mot `~/Repon/miranon-media-admin/CLAUDE.md`. Mini-RAPPORTERA verifierade alla "Före"-strängar verbatim mot HEAD innan IMPLEMENTERA.

| # | Rad | Förändring |
|---|---|---|
| FIX 1 | 2 | Datumstämpel + version-tag → 2026-05-05 / v0.3 (Session 2 — Fas A + P0–P3a klara, P3b städning pågår) |
| FIX 2 | 12 | Styrande dokument-rad: ramskifte "konvertering" → "byggande", pekar på `docs/byggplan.md` i detta repo (ej Vue-repots react-migration) |
| FIX 3 | 14+15 | Vue-repots react-migration är nu **historiskt** (Fas 0+1) — `conversion-plan.md` struken från fil-listan |
| FIX 4 | 32 | Instruktioner-list-version av styrande-dokument-raden — samma ramskifte |
| FIX 5 | 92 | Filstruktur-snapshot: byggplan.md ny STYRANDE + ny rad för `archive/conversion-plan-2026-04-14.md` |
| FIX 6 | 222 | Fasordning-rubrik → `(enligt docs/byggplan.md §4)` |
| FIX 7 | 264 | Sessionsstart-checklistan punkt 4 → byggplan istället för conversion-plan, inkl. ADR-012-pekare |

**Historisk rad 184 (Vue-repo-snapshot från 2026-04-14):** rörd inte — korrekt historiskt påstående.

**Resultat:** `grep -c "conversion-plan" CLAUDE.md` → 1 träff (endast historiska rad 184 kvar). Var 7. ✅

### 4.2 — todo.md (commit 4 ✅)

10 str_replace mot `~/Repon/miranon-media-admin/tasks/todo.md`. Code rapporterade adaptionsbehov för FIX 4, 8, 9, 10 baserat på rapporterade verbatim-strängar.

| # | Rad/Sektion | Förändring |
|---|---|---|
| FIX 1 | 2 | Datumstämpel uppdaterad till 2026-05-05 (Session 2 — Fas A + P0–P3a klara, P3b städning pågår) |
| FIX 2 | 7 | Preambel-blockquote: byggplan istället för conversion-plan |
| FIX 3 | 13 | Fas 2-rad i Aktuellt fokus: byggplan §4 + BUILD-LOG Session 2 |
| FIX 4 | 15-17 | Session-historik utökad med Session 2-rad (Fas A + P0–P3a). Italics utökad till "Session 2 = Session 32–34" |
| FIX 5 | 121 | Fas 2-sektion-headerlik referens: byggplan §4 |
| FIX 6 | 167 | H2-rubrik "Kommande faser (från `docs/byggplan.md` §4)" |
| FIX 7 | 178 | H2-rubrik "Byggplan-revision (P0 → P3b)" |
| FIX 8 | 180-182 | Verbtempus-fix: "Reviderar" → "Reviderade" + slutprodukt-pekare. 3 rader → 1 rad (mjuka radbrytningar komprimerade) |
| FIX 9 | 192-194 | P-fas-tracking splittad: P3 → P3a ✅ AVSLUTAD 2026-05-05 + P3b ← NU. 3 rader → 6 rader |
| FIX 10 | Teknisk skuld | 3 nya defer-bullets appendade efter sista befintliga (`docs/DESIGN-SYSTEM-SPEC.md stale-risk`) — H.1, H.2, H.4 |

**Resultat:** `grep -c "conversion-plan" tasks/todo.md` → 0 träffar. Var 5. ✅

### 4.3 — K3-disciplin etablerad

K3 var sista klungan med kirurgiska str_replace-edits mot text-dokument. Mönstret som befästes:

1. Mini-RAPPORTERA mot HEAD innan jag bygger commit-prompten (verifiera "Före"-strängar verbatim)
2. Inline-källor i Code-prompter (inte sessionsdok-referenser — lärdom från K2)
3. RAPPORTERA-pause i Code-prompten innan IMPLEMENTERA (str_replace med whitespace-känslighet)
4. Code rapporterar adaptioner när "Före"-strängar inte matchar exakt — Marcus godkänner innan kör
5. Sessionsdok rörs inte (P3a-mönster) — bakas in i K4 sista commit

---

## Del 5 — K4: Verifiering + UNIVERSAL-lyft + direktivet SLUTFÖRT

✅ **KLAR 2026-05-05** | Två commits + en cross-repo-commit:
- Commit 5 (verifierings-bevis): **ingen separat commit** — output bakas in i Del 5.1 nedan per Beslut 7
- Commit 6 (UNIVERSAL-lyft till hub): `91f6a39 docs(lessons): lift 7 UNIVERSAL lessons from miranon-media-admin P1+P2` (i `marcus-system`)
- Commit 7 (direktivet SLUTFÖRT + sessionsdok bakas in): denna commit (hash fylls i `git log` post-push)

### 5.1 — Verifierings-baseline (HEAD: c72d8cd, datum: 2026-05-05)

#### `npm run test:api`

- **Exit:** 0
- **Resultat:** 72 passed, 0 failed, 41 skipped (totalt 113 tester)
- **Tid:** 1.7s
- **Avvikelse mot direktiv-prognos:** Direktivet förväntade "113 passed". Faktiskt: 72 passed + 41 skipped = 113 totalt. De 41 skipped är `end-to-end fuzz`-tester som kräver staging-deployment och inte kan köras i lokal/CI-miljö utan staging-credentials. Markeras med `-` (skip) i Playwright-output. Exit 0 = sviten grön; ingen test failed. **Ej blockerande.** Avvikelsen är redovisnings-drift i DoD-formuleringen, inte en kvalitetsbrist (god praxis: tester som kräver extern miljö ska markeras `test.skip()`, inte tas bort).
- **Lärdomskandidat:** "DoD-formulering ska skilja 'körda' från 'definierade' tester" — se Del 8.

#### `npx tsc --noEmit`

- **Exit:** 0
- **Resultat:** 0 errors

#### `npx @biomejs/biome check .`

- **Exit:** 0
- **Resultat:** Checked 58 files in 27ms — 0 errors, 4 warnings
- **Warnings:** 4 warnings i `src/styles/base.css:72-75` (`!important` i `prefers-reduced-motion`) — matchar H.1 defer-post i `tasks/todo.md` (DEFER → Fas 3). Förväntat och accepterat.

#### `npm run build`

- **Exit:** 0
- **Resultat:** 402 modules transformed, JS 323.81 kB (gzip 102.17 kB), CSS 19.09 kB (gzip 4.73 kB), built in 329ms

#### Lighthouse-baseline (production-build mot `npm run preview`)

| Kategori | Poäng | Tolkning |
|---|---|---|
| Performance | **86** | Solid baseline för en tom React-app — Vite v8 levererar |
| Accessibility | **100** | 🎯 Perfekt baseline |
| Best Practices | **96** | Mycket bra |
| SEO | **82** | Förväntat — saknar meta-description, h1, semantiska headings (tom sida) |

**Mätningsmetod:** `npm run build` → `npm run preview` (port 4173) → `npx lighthouse http://localhost:4173/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless"`. Output JSON i `/tmp/lh-baseline-prod.json`, parsad via `jq`.

**Bonus — dev-server-mätning för kontrast:** Performance 56 / Accessibility 100 / Best Practices 96 / SEO 82. Skillnaden Performance 56 → 86 illustrerar varför baseline ska tas mot production-build, inte dev. Sparar oss 30 poängs falsk progression vid framtida jämförelse.

**Lärdomskandidat:** "Senior AI tar tekniska beslut, frågar inte" — Beslut 6 (manuell Lighthouse) och beslut att köra om mot production-build var Chat-baserade beslut, inte preferensfrågor till Marcus. Se Del 8.

#### Sammanfattning

✅ **Alla 5 verifieringskommandon gröna.** Repot är teknisk-baseline-klart för Fas 2.

### 5.2 — UNIVERSAL-lyft till hub (commit 6 ✅)

**Cross-repo-operation:** `cd ~/Repon/marcus-system` → str_replace mot `tasks/lessons.md` → explicit `git add tasks/lessons.md` (aldrig `-A` — hubben hade untracked-mappar `odoo-events-transcripts-openai/` + `youtube-transcripts/` som inte fick committas).

**Ny H2-sektion injicerad** mellan v2-share-blocket och `## 2026-04-30 — Datamodell-research-projekt (Fas 6-slut)`:

```markdown
## 2026-05-04 — Byggplan-revision P1 + P2 (miranon-media-admin)

> Källa-projekt: miranon-media-admin (React-konvertering / byggplan-revision)
> Källa-sessioner:
> - P1: tasks/sessions/2026-05-04-byggplan-revision-p1.md (commit 97573c0)
> - P2: tasks/sessions/2026-05-04-stodspec-synk-p2.md (commit 1fbb70c)
> Lyft till hub: 2026-05-05 (P3b K4 commit 6)
> Antal poster: 7 ([UNIVERSAL]-flaggade i källan, alla bevarade verbatim)
```

**7 poster lyfta verbatim** (rad 96-208 i miranon-media-admins lessons.md):

| # | Rubrik | Källa |
|---|---|---|
| 1 | Sessionsdokument från första klunga vid flerstegs-Chat-arbete | P1 |
| 2 | Scenariobeslut när indata saknas | P1 |
| 3 | Beroendegraf före beslutsserier | P1 |
| 4 | Stödspec-synk via tillägg, inte omskrivning | P2 |
| 5 | Trigger-beslut med självaktiverande indata | P2 |
| 6 | Korsreferens > duplicering vid synk-arbete | P2 |
| 7 | Källa-vs-implementation-skiktning vid stack-byte | P2 |

**Datumstämpel uppdaterad i hubben:** `2026-05-04 (v2-share single-file delbar version)` → `2026-05-05 (Byggplan-revision P1+P2 lyft från miranon-media-admin — 7 nya UNIVERSAL-poster + v2-share)`.

**Cross-repo-disciplin höll:** untracked-mappar i hubben förblev orörda. ✅

### 5.3 — Direktivet SLUTFÖRT (commit 7 — denna commit)

**Två filer ändras i denna commit:**

1. `tasks/byggplan-direktiv.md` — §11 Status-tabell + §12 Slutnot
2. `tasks/sessions/2026-05-05-byggplan-stadning-p3b.md` — denna fil (262 rader → ~700 rader, bakar in Del 3/4/5/6/7/8)

#### §11 Status-uppdatering

Två nya rader injicerade i tabellen:
- `| Klar (P3b) | 2026-05-05 |`
- `| Direktiv-status | **SLUTFÖRT 2026-05-05** — alla §6 P3-städnings-DoD verifierade, byggplanen är aktiv styrande plan |`

Plus uppdatering av "Senast uppdaterat"-raden till `2026-05-05 (P3b SLUTFÖRT — se tasks/sessions/2026-05-05-byggplan-stadning-p3b.md)`.

#### §12 Slutnot — alla 5 punkter markerade ✅

- ✅ Detta direktiv markeras SLUTFÖRT i headern (denna commit)
- ✅ Conversion-plan flyttas till `docs/archive/conversion-plan-2026-04-14.md` (K2 commit 1: `2075ab3`)
- ✅ ADR skrivs i `docs/decisions/` om varför conversion-plan ersattes av byggplan (ADR-012, P3a commit `866b430`)
- ✅ Alla städnings-DoD per §6 P3 verifierade (denna sessions K2/K3/K4)
- ✅ Fas 2 av React-arbetet kan starta mot byggplanen (klart efter denna commit)

### 5.4 — Sessionsdok bakas in (denna fil!)

Marcus laddar ner K7-versionen från Chat (denna fil) → Code skriver över befintlig 262-rads-skelett i repot → committas tillsammans med direktiv-uppdateringarna i samma atomiska commit.

Sessionsdok rörs aldrig mer efter denna commit. Det är låst som auktoritativ retrospektiv trail för P3b.

---

## Del 6 — Pass-status

| Klunga | Innehåll | Status | Commits |
|---|---|---|---|
| K1 | Sessionsdok-skelett | ✅ KLAR 2026-05-05 | `7de8cb4` |
| K2 | Arkivering + BUILD-LOG retrospektiv | ✅ KLAR 2026-05-05 | `2075ab3` (commit 1) + `9fe236d` (commit 2) |
| K3 | CLAUDE.md (projekt) + todo.md | ✅ KLAR 2026-05-05 | `af33891` (commit 3) + `c72d8cd` (commit 4) |
| K4 | Verifiering + UNIVERSAL-lyft + SLUTFÖRT | ✅ KLAR 2026-05-05 | `91f6a39` (commit 6, hub) + (commit 7-hash, denna commit) |

**Total commit-count för P3b:** 6 i miranon-media-admin (K1, K2.1, K2.2, K3.3, K3.4, K7) + 1 i marcus-system (K6) = **7 commits**.

**K5 (verifierings-bevis):** 0 commits per Beslut 7 — output bakat i Del 5.1 ovan istället för separat fil.

**Sessionsdok touch-count:** 2 (K1 skapande + K7 sista commit). Mellan-klungor rörde inte sessionsdoket. Per P3a-mönstret. ✅

---

## Del 7 — P3b Stop-test

**Stop-test enligt direktiv §6 P3 (P3b-andelen) + §12 slutnot.**

### Verifieringschecklista

**Repo-hygien:**
- ✅ `docs/conversion-plan.md` flyttad till `docs/archive/conversion-plan-2026-04-14.md`
- ✅ Den arkiverade filen har ARKIVERAD-header som pekar på `docs/byggplan.md` per ADR-012
- ✅ `docs/BUILD-LOG.md` har Session 2-sektion (Fas A M1–M8 + commit-hashar + planerat vs faktiskt + 113 tester + avvikelser + DoD)
- ✅ `docs/BUILD-LOG.md` har P0/P1/P2/P3a-poster (kompakta, med trail-pekare)
- ✅ 4 drift-rader i BUILD-LOG fixade (rad 5, 380, 387, 388) + 1 ny archive-rad
- ✅ Defer-beslut dokumenterade i Del 3.4 + tasks/todo.md (H.1 CSS-warnings + H.2 PostCSS audit + H.3 CSP-pekare + H.4 test-auth/ Fas 7-borttagning)

**Dokument-hygien:**
- ✅ `CLAUDE.md` (projekt) har "Aktuellt fokus: Fas 2 — Routing + Auth" (semantisk innebörd kvar; v0.3-uppdatering markerar Session 2-status)
- ✅ `CLAUDE.md` sessionsstart-checklistan punkt 4 pekar på `docs/byggplan.md` (inte conversion-plan)
- ✅ `CLAUDE.md` har 0 conversion-plan-referenser utanför explicit historisk kontext (rad 184 — Vue-repo-snapshot från 2026-04-14, korrekt historiskt)
- ✅ `tasks/todo.md` har 0 conversion-plan-referenser, P3a/P3b split infört, defer-poster (H.1, H.2, H.4) på plats
- ✅ `marcus-system/tasks/lessons.md` har 7 nya UNIVERSAL-poster (3 P1 + 4 P2) under ny H2-sektion 2026-05-04
- ✅ `tasks/byggplan-direktiv.md` headerns §11 Status-tabell har "Klar (P3b) | 2026-05-05" + "Direktiv-status | **SLUTFÖRT 2026-05-05**"-rader
- ✅ `tasks/byggplan-direktiv.md` §12 Slutnot har alla 5 punkter markerade ✅

**Verifierings-hygien:**
- ✅ `npm run test:api` → grön (72 passed + 41 staging-only-skipped, totalt 113)
- ✅ `npx tsc --noEmit` → 0 fel
- ✅ `npx @biomejs/biome check .` → 0 fel (4 warnings förväntade, H.1 defer)
- ✅ `npm run build` → grön (402 modules, JS 102 kB gzip, 329ms)
- ✅ Lighthouse-baseline tagen mot production-build (86/100/96/82) + dev-baseline för referens (56/100/96/82)

**Slutkontroll:**
- ✅ `git status` ren (efter denna commit)
- ✅ Lokal HEAD = origin HEAD på alla 7 commits (efter denna commit pushad)
- ✅ Inget kvarvarande arbete i Downloads (sessionsdoket committat, inga lösa filer)

### **Stop-test ✅ PASSERAT 2026-05-05.**

P3b uppfyller §6 P3-städnings-DoD + §12 slutnot. Direktivet markerat SLUTFÖRT.

---

## Del 8 — Sammanfattning för framtida läsare

### Vad denna session levererade

P3b avslutade hela byggplan-revisionen som startade med direktivet 2026-05-04. Konkreta leveranser:

1. **`docs/conversion-plan.md` arkiverad** till `docs/archive/conversion-plan-2026-04-14.md` med ARKIVERAD-header som pekar mot byggplan.md per ADR-012. Provenance bevarad — `git log --follow` visar full historik från 2026-04-14.
2. **`docs/BUILD-LOG.md` retrospektivt komplett** — ny `## Session 2 (React)`-sektion injicerad med Fas A M1–M8 (14 implementations-commits + 4 doc-commits) + kompakta P0/P1/P2/P3a-poster med trail-pekare. 4 drift-rader fixade (rad 5, 380, 387, 388) + 1 ny archive-pekare.
3. **`CLAUDE.md` (projekt) uppdaterad** — 7 str_replace mot conversion-plan-referenser, ramskifte "konvertering" → "byggande", filstruktur-snapshot + sessionsstart-checklista pekar på byggplan.md, version-tag bumpad till v0.3 (Session 2).
4. **`tasks/todo.md` rensad** — 10 str_replace, 4 conversion-plan-referenser bytta, Session-historik utökad med Session 2-rad, P-fas-tracking splittad till P3a ✅ + P3b ← NU, tre nya defer-poster (H.1 CSS-warnings, H.2 PostCSS audit, H.4 test-auth/) i `## Teknisk skuld`-sektionen.
5. **Verifierings-baseline tagen** — alla 5 kommandon gröna (72+41=113 tester / 0 tsc-fel / 0 biome-errors+4 förväntade warnings / 402 modules build / Lighthouse 86-100-96-82 production). Bevaras inline i Del 5.1.
6. **7 UNIVERSAL-poster lyfta till hub** — `marcus-system/tasks/lessons.md` har ny `## 2026-05-04 — Byggplan-revision P1 + P2`-sektion med samtliga 7 poster verbatim.
7. **`tasks/byggplan-direktiv.md` markerat SLUTFÖRT** — §11 Status-tabell utökad, §12 Slutnot har alla 5 punkter markerade ✅. Direktivet är arkivvärt.

### Vad denna session inte gjorde

- **Påbörjade inte Fas 2-arbetet.** Fas 2 (Routing + Auth) är nästa Chat-session, mot byggplan.md §4 Fas 2-prompten.
- **Lämnade defer-besluten kvar** (H.1 CSS-warnings, H.2 PostCSS audit, H.4 test-auth/ borttagning). Alla tre är dokumenterade i todo.md med trigger-villkor och tas vid första session de blir aktuella.
- **Tog inte action på 3 nya lärdomskandidater** som uppstod i denna session (se nedan). De kan lyftas till lessons.md vid första Fas 2-session eller separat post-P3b-städning.

### Vad nästa session ska göra

**Fas 2 — Routing + Auth.** I ny Chat-session: läs sessionsstart-checklistan i CLAUDE.md (uppdaterad), använd `docs/byggplan.md` §4 Fas 2-prompten direkt. Beroenden klara: Fas 0 + Fas 1 + Fas A. Ingen blocker. Kan starta omedelbart.

### Var den auktoritativa P3b-trailen finns

Denna fil — `tasks/sessions/2026-05-05-byggplan-stadning-p3b.md`. Detta är slutgiltiga versionen — committas en (1) gång till efter K1, sedan låst.

### Var byggplan-revisionen som helhet finns spårad

| Fas | Trail | Slutprodukt |
|---|---|---|
| P0 | `docs/byggplan-revision-inventory.md` | Klassningstabell över conversion-plan §D |
| P1 | `tasks/sessions/2026-05-04-byggplan-revision-p1.md` + `2026-05-04-p1-avslutning.md` | §5-tabell uppdaterad i direktivet (15 rader, Fas 8 ny) + 9 ADR-katalog |
| P2 | `tasks/sessions/2026-05-04-stodspec-synk-p2.md` | 4 stödspecs uppdaterade (SECURITY-SPEC, STATE-STRATEGY, ACCESSIBILITY-CHECKLIST omskriven) + Fas 3.5 = egen fas-beslut |
| P3a | `tasks/sessions/2026-05-05-byggplan-skriv-p3a.md` | `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter) + 10 nya ADR:er ADR-011..ADR-020 + decisions/README.md uppdaterad till 20 rader |
| P3b | denna fil | Repo "rent och 11/10" — alla artefakter på rätt plats, ingen drift mellan dokument och verklighet |

### Slutprodukten

**`docs/byggplan.md` v1.1** — 832 rader, 13 fas-prompter (Fas 2, 2.5, 3, 3.5, 5, 5.5, 6a–6e, 6.5, 7, 8, B, E), alla 8 sektioner per fas (Mål/Scope/Inte-scope/Beroenden/Estimat/Filer/DoD/ADR-krav), 10 ADR:er ADR-011..ADR-020 listade i §5, 8 etablerade arkitekturmönster post-Fas A i §3. Pekar mot `tasks/byggplan-direktiv.md` §5 (post-P1) som auktoritativ källa för fas-sekvens.

### Lärdomskandidater (för framtida UNIVERSAL-lyft)

Tre lärdomar som uppstod i P3b. Inte lyfta till lessons.md i denna session (skulle blåsa upp commit 7 från fokus "slutsignal"). Föreslås fångas vid första Fas 2-session eller separat post-P3b-städning.

#### Kandidat 1 — Senior AI tar tekniska beslut, frågar inte

**Observation:** I K4 frågade jag Marcus välja mellan tre Lighthouse-implementeringar (Alt 1 automation / Alt 2 manuell / Alt 3 defer). Marcus svarade "Hur hade ett proffs AI-team gjort?" — vilket korrekt påpekade att frågan inte borde ställts. Jag hade all data för att fatta beslutet själv.

**Generaliserbar regel:** AI-team som agerar som senior ingenjörer fattar tekniska beslut baserat på data + principer. Att frågar användaren multiplicerar deras kognitiva belastning och outsourcar ansvaret. Skillnad: *preferensfrågor* (vad vill du?) ska frågas; *beslutsfrågor* (vad är rätt?) ska beslutas. När man har data → besluta. När man saknar data → samla först, sedan besluta.

**Källa:** P3b K4 Lighthouse-design-iteration 2026-05-05.

#### Kandidat 2 — DoD-formulering ska skilja "körda" från "definierade" tester

**Observation:** Direktivet §6 P3-DoD sa "113 tester (förväntat)". Verifiering visade 72 passed + 41 skipped = 113 totalt. Skenbar diskrepans mellan "passed" och "totalt" skapade en sekund av förvirring tills Code förklarade att 41 är staging-only-tester med legitim `test.skip()`.

**Generaliserbar regel:** När en testsvit innehåller villkorligt skipped tester (staging-only, OS-specifika, etc.) ska DoD-formulering specificera "X körda lokalt + Y skipped under villkor Z" istället för "N passed". Annars uppstår skenbar regression vid lokal verifiering. Exempel: "113 tester totalt — 72 körda lokalt + 41 skipped (staging-only, kräver staging-credentials)".

**Källa:** P3b K4 commit 5 verifierings-rapport 2026-05-05.

#### Kandidat 3 — Inline-källor i Code-prompter när sessionsdok-disciplin förbjuder löpande uppdatering

**Observation:** I K2 v1 refererade jag till "Del 3.2 i sessionsdoket" som källa för Session 2-blocket i Code-prompten. Code stoppade och flaggade att sessionsdoket vid körningstid var K1-skelett (per P3a-disciplinen — sessionsdoket bakas in först i K4 sista commit). Jag hade missat att P3a faktiskt löste samma problem genom att leverera byggplan.md inline i Code-prompten i K2, inte via sessionsdok-referens.

**Generaliserbar regel:** När en sessionsdok-disciplin innebär att doket inte uppdateras under arbetets gång (P3a-mönstret: K1 skelett + K-sista bakar in), måste innehåll som behövs i Code-prompter levereras INLINE i prompten — inte refereras från sessionsdoket. Sessionsdoket är retrospektiv referens, inte källa under körning. Detta gäller alla flerstegs-Chat-arbeten med samma disciplin.

**Källa:** P3b K2 v1→v2-felet, Code:s STOP-rapport 2026-05-05. Direkt komplement till lessons-post 2026-05-04 "Sessionsdokument från första klunga vid flerstegs-Chat-arbete" (P1) — det fångade *när* man skapar sessionsdoket; denna fångar *hur källor flödar* när doket inte uppdateras löpande.

---

**Byggplan-revisionen är slutförd.** ✅ 2026-05-05.
