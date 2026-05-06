# Pre-Fas-2-verifiering — 11/10-validering inför Fas 2 Routing+Auth

> **Status:** 🔄 Pågående 2026-05-06 — K1 sessionsdok-skelett klar, K2-K5 öppna
> **Skapat:** 2026-05-06 (K1) | **Slutgiltig version:** TBD (K5 sista commit — bakar in Del 3/4/5/6/7/8)
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-06-pre-fas2-verifiering.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §11/§12 (SLUTFÖRT 2026-05-05) + P3b Del 8 lärdomskandidater + Marcus pre-Fas-2-prompt 2026-05-06
> **Föregångare:**
> - `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md` (P3b, slutförd 2026-05-05)
> **Efterföljare:** Fas 2 — Routing + Auth, mot `docs/byggplan.md` §4 Fas 2-prompt.
> **Stop-test (denna session):** Codex-verifieringsprompt levererad + alla fynd ≤10/10 åtgärdade + 3 P3b-lärdomskandidater (+ ev. nya) lyfta till `tasks/lessons.md` + hub-synk klar + sessionsdok låst.
> **Sessionsdok-commit-disciplin (P3a/P3b-mönster):** K1 = skelett-commit. K2-K3-K4 rör INTE sessionsdoket. K5 sista commit bakar in (a) sista innehållet (Codex-prompt + slutsignal) + (b) sessionsdok Del 3/4/5/6/7/8 fyllning. Total touch-count = 2 (K1 skapande + K5 sista commit).

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för pre-Fas-2-verifieringen — sista steget innan Fas 2 (Routing + Auth) startar. Dess uppgift är att producera fyra saker:

1. **Verifiering** — repot kontrolleras mot fyra dimensioner (A. innehållsintegritet, B. struktur, C. kod-hygien, D. återanvändbarhet som exempel) genom Code-RAPPORTERA + Chat-klassificering + Code:s ärliga omdöme. Ingen ändring i K1-K2; klassificering driver K3-åtgärder.
2. **Åtgärd** — alla fynd ≤10/10 åtgärdas innan Fas 2. Klassningsskala: 11/10 ✅ ingen åtgärd / 10/10 ⚠️ branschstandard kan bli 11/10 / 9/10 ❌ åtgärdas innan Fas 2 / <9/10 🚨 åtgärdas omedelbart.
3. **Lärdomslyft** — tre kandidater från P3b sessionsdok Del 8 (Senior AI tar tekniska beslut / DoD körda vs definierade tester / Inline-källor i Code-prompter) + ev. nya kandidater från denna verifiering lyfts till `tasks/lessons.md` (med `[UNIVERSAL]`-tag där tillämpligt) och `marcus-system/tasks/lessons.md` per cross-repo-disciplin.
4. **Tredjepartsverifiering** — Codex-prompt skrivs så Marcus kan starta extern verifiering utan följdfrågor. Codex bedömer samma fyra dimensioner A–D + jämför mot 11/10-referensprojekt.

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i repot är "current truth" efter att Code committat dem via prompterna i K3/K4/K5.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap):

| # | Källa | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution (transcript-disciplin, sessionsdok-rutin, P-fas-mönster) |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projekt-konstitution + kvalitetsribba |
| 3 | `tasks/lessons.md` | Universella lärdomar (befintliga, jämförelse-baseline för K4-lyft) |
| 4 | `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md` Del 8 | Tre lärdomskandidater + sammanfattning + slutstatus |
| 5 | `docs/byggplan.md` | Slutprodukt v1.1 (832 rader, 13 fas-prompter) |
| 6 | `tasks/byggplan-direktiv.md` §11+§12 | SLUTFÖRT-status verifierad 2026-05-05 |
| 7 | `docs/BUILD-LOG.md` Session 2 | Retrospektiv av Fas A M1–M8 + P0/P1/P2/P3a/P3b |
| 8 | `docs/decisions/README.md` + ADR-001..ADR-020 | Beslutskatalog (20 ADR:er) |
| 9 | `docs/research/datamodell-research/00-file-manifest.md` (datamodell-research, 2026-04-27) | Pre-revision filinventering — historisk baseline för jämförelse |

### Källprioritet vid konflikt

1. Code-RAPPORTERA-output (HEAD-state-data, K1.B-leverans) — auktoritativ för aktuell repo-state
2. P3b sessionsdok Del 7 Stop-test — auktoritativ för "vad som var åtgärdat 2026-05-05"
3. `tasks/byggplan-direktiv.md` §11/§12 — auktoritativ för slutsignal
4. `docs/byggplan.md` — styrande för Fas 2+ (referens, inte under-debatt)
5. P3b Del 8 lärdomskandidater — verbatim-källa för K4-lyft

### Klunge-struktur

Fem klungor, samma mönster som P0/P1/P2/P3a/P3b — sessionsdok rörs i K1 + K5 sista, mellan-klungor lämnar det orört.

| K | Innehåll | Stop-test per klunga |
|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + struktur) + paketerad Code-RAPPORTERA-prompt med sju block (filtree/repo-root/docs-kategorisering/sessions-platthet/referens-integritet/baseline-status/Code:s omdöme) | Sessionsdok committad i repo, RAPPORTERA-prompten levererad till Marcus i Chat (inline) |
| **K2** | Code-RAPPORTERA-svar inkommet → Chat klassificerar varje fynd 11/10/10⚠️/9❌/<9🚨 + skapar åtgärdsplan grupperad i del-klungor (åa/åb/åc...) likt P0-P3-mönstret med estimat + integrerar Code:s omdöme (Block 7) | Klassningstabell + åtgärdsplan levererad i Chat (artifact-uppdatering, inte commit); varje fynd har klassning + åtgärdsbeslut + ev. ADR-trigger |
| **K3** | Åtgärds-implementation. Paketerade Code-prompter per åtgärds-grupp (mappgruppering, metadata, README, .github om relevant, orphan-städ). 2-4 commits beroende på K2-utfall. ADR-NNN för varje strukturellt beslut (kandidater: ADR-021 docs/-omstrukturering, ADR-022 README-skapande/uppdatering, ADR-023 sessions-arkivering om aktuellt) | Repo har ny struktur + nya ADR:er + uppdaterad CLAUDE.md/todo.md/BUILD-LOG.md där refs ändras; git status ren; alla 5 verifieringskommandon fortfarande gröna; inga broken refs |
| **K4** | Lärdomslyft: 3 P3b-kandidater (Del 8) + ev. nya kandidater från denna verifiering → `tasks/lessons.md` (med `[UNIVERSAL]`-tag) → cross-repo-lyft till `marcus-system/tasks/lessons.md` med ny H2-sektion `2026-05-06 — Pre-Fas-2-verifiering (miranon-media-admin)` | 1 commit i miranon-media-admin + 1 commit i marcus-system; lessons.md har minst 3 nya poster verbatim; hubben har matchande sektion; cross-repo-disciplin höll (`git add tasks/lessons.md` explicit, aldrig `-A`) |
| **K5** | Codex-verifieringsprompt skriven (fristående, klassningsskala A-D, jämförelse mot 11/10-referensprojekt) + slutsignal: sessionsdok bakas in (Del 3-8) + ev. ny pekare i CLAUDE.md/todo.md att Codex-verifiering skedde | Codex-prompten är komplett och fristående; sessionsdoket är slutgiltigt; commit pushad |

---

## Del 2 — K1: Sessionsdok-skelett + RAPPORTERA-prompt

✅ **KLAR** 2026-05-06.

**K1.A — Skelett:** Denna fil. Innehållet i Del 1 utgör K1.A:s leverans.

**K1.B — Code-RAPPORTERA-prompt:** Levererad inline i Chat 2026-05-06. Sju block: (1) filtree+counts, (2) repo-root metadata, (3) docs/-mappkategorisering, (4) tasks/sessions/-platthet, (5) referens-integritet + orphan-detektion, (6) baseline-status, (7) Code:s ärliga omdöme. Inga ändringar i repot — ren rapportering. Code-svaret driver K2.

**K1-commit:** "docs(verifiering): start pre-Fas-2 session document — skeleton" (commit-hash sätts efter Code-commit)

---

## Del 3 — K2: Klassificering + åtgärdsplan

⏳ **ÖPPEN.** Bakas in i K5 sista commit. Innehåller (när komplett):
- Klassningstabell per fynd från Code-rapport (filtree/repo-root/docs/sessions/refs/baseline)
- Code:s omdöme integrerat (Block 7-svar, Chat-bedömning av godhet)
- Åtgärdsplan grupperad i del-klungor (åa/åb/åc...) med estimat
- ADR-trigger-lista (vilka strukturella beslut blir ADR:er)
- Beslut om K3-splitsning (1 session vs 2)

---

## Del 4 — K3: Åtgärds-implementation

⏳ **ÖPPEN.** Bakas in i K5 sista commit. Innehåller (när komplett):
- Code-prompt(er) per åtgärds-grupp
- Commit-hashar
- Före/efter-snapshot (filcount, mappstruktur)
- ADR:er skrivna (vilka, kort sammanfattning)
- Verifierings-baseline-omkörning (5 kommandon, jämfört mot P3b-baseline)
- Avvikelser från åtgärdsplan i K2

---

## Del 5 — K4: Lärdomslyft

⏳ **ÖPPEN.** Bakas in i K5 sista commit. Innehåller (när komplett):
- 3 P3b-kandidater (Del 8) verbatim → `tasks/lessons.md`-poster
- Ev. nya kandidater från denna verifiering (kandidat 4 redan identifierad: Chat-prompter ska skilja "projektkunskap" från "Code-filsystem"; mer kan tillkomma från K2/K3)
- Cross-repo-lyft till `marcus-system/tasks/lessons.md` H2-sektion `2026-05-06 — Pre-Fas-2-verifiering (miranon-media-admin)`
- Datumstämpel-uppdatering i hubben
- Cross-repo-disciplin verifierad

---

## Del 6 — K5: Codex-verifiering + slutsignal

⏳ **ÖPPEN.** Bakas in i K5 sista commit (denna del + sessionsdok-bake-in är samma commit). Innehåller (när komplett):
- Komplett Codex-prompt (kopierbar)
- Eventuell ny pekare i CLAUDE.md/todo.md/BUILD-LOG.md att Codex-verifiering genomförts (post-Codex-svar, om det görs i denna session — annars deferred)
- Slutsignal-text (motsv. P3b §12 Slutnot men för verifierings-ronden)

---

## Del 7 — Stop-test

⏳ **ÖPPEN.** Bakas in i K5 sista commit. Innehåller (när komplett):
- Verifierings-checklista per stop-test-rad i header
- Pass/fail-status
- Eventuella avvikelser som motiverar uppskjutning

---

## Del 8 — Sammanfattning för framtida läsare

⏳ **ÖPPEN.** Bakas in i K5 sista commit. Innehåller (när komplett):
- Vad denna session levererade (verifiering + åtgärder + lyft + Codex-prompt)
- Vad denna session inte gjorde (defer-poster, Fas 2-arbete)
- Vad nästa session ska göra (Fas 2 — Routing + Auth)
- Var den auktoritativa pre-Fas-2-trailen finns (denna fil)
- Slutprodukten (repo-state efter åtgärder, klart för Codex + Fas 2)
- Ev. nya lärdomskandidater för framtida UNIVERSAL-lyft
