---
updated: 2026-05-18
review_by: 2026-08-17
status: draft
owner: marcus803
total_unique_lessons: 94
revision: v2-final-post-K3.4-empiri
supersedes_v1: 82dd9a5
---

# Lessons-reconciliation-fångst — Session 6.6.6 K-sista-0-säkring (v2-final)

> **Revision v2-final (2026-05-17 post-K3.4-empiri):** Utvidgad med 13
> nya lessons-kandidater (L_OOO-L_ÅÅÅ) skördade post-reconciliation-
> commit `82dd9a5`. Total 80 unika kandidater (uppjusterat från 67).
>
> **Syfte oförändrat:** Säkringsåtgärd för lessons-kandidater inför
> K-sista-0-konsolidering. v2-final-revision triggades av Marcus mid-
> session-fångst att 11 lessons existerade endast i Chat-trail (post-
> reconciliation-skörd från K3.1.b + K3.2 + K3.3 + K3.4-research), och
> uppdaterades direkt efter K3.4-empirisk verifikation med 2 ytterligare
> lessons (L_ZZZ + L_ÅÅÅ).

---

## Del 1 — Reconciliation-kontext (oförändrad från v1)

[Innehåll oförändrat från `82dd9a5`. Se Del 1 i v1 för full kontext.]

---

## Del 2 — Konflikt-tabell (oförändrad från v1)

[Innehåll oförändrat. 9 mini-1/mini-2 lessons-namn-kollisioner.]

---

## Del 3 — Komplett 80-lessons-katalog

### Sektion 3.1-3.5 — Oförändrade från v1

5 retroaktiva + 6 ≈samma + 9 mini-1-konflikt + 9 mini-2-konflikt + 26
mini-2-unika = 55 lessons. Innehåll oförändrat från `82dd9a5`.

### Sektion 3.6 — Post-mini-2 Chat-genererade lessons (25 lessons, uppdaterad v2-final)

Genererade 2026-05-17 mid-session. Sektion 3.6 utvidgad i v2-final med
13 post-reconciliation-lessons (L_OOO-L_ÅÅÅ).

| Temp-namn | Kort beskrivning | Genererad i Chat-turn |
|---|---|---|
| L_BBB | Filartefakt-protokoll latent-bug — körning auktoritativ över skrivet protokoll | Block A-respons (sed-bug-rapport från Code) |
| L_CCC | BSD vs GNU sed/perl portabilitets-meta-klass — specialisering av L_RR | Block A-respons (sed `-i -E` failure-diagnostik) |
| L_DDD | Σ-trajektoria parallell-uppdatering med mekanism-shift — protokoll-värden uppdateras parallellt | Block A-respons (66 vs 49-konsistens-analys) |
| L_EEE | Chat mental dry-run av disciplin-kommandon (sed/perl/awk + ranges + BSD-syntax) FÖRE skickande | Block A-respons (L_AAA-instans 4) |
| L_FFF | Pre-scope-låsning verifiera fil-profil-attribut (kategori, disable-block-typ, mapping-komplexitet) — INTE bara fynd-count | JUDGMENT-respons (D.5 react-stack-omklassifikation post-Code-data) |
| L_GGG | Latent-drift-mitigation — när Edit-tool öppnar rad/sektion, mitigera dolda drifter där overhead är marginell (speciellt vid Vale-quirk-dolda) | JUDGMENT C2-rationale (todo.md rad 181) |
| L_HHH | Klass-gräns-respekt vid backticks-wrap-konsistens — wrap konsekvent INOM klass, inte across klass | JUDGMENT B1-rationale (todo.md rad 250) |
| L_III | L_X under-klassificering — L_X.1 (IL-mitigerbar quirks) vs L_X.2 (intra-fil-state-quirks, IL/vocab/TokenIgnore alla failar) | STEG F-respons (todo.md rad 245 L_X.2-upptäckt) |
| L_JJJ | Web-research för upstream-version-verifikation är operationell BLOCKER innan version-bump-strategi väljs — L_18 + L_II applicerad på tooling-version-research | STEG F-respons (Vale 3.14.1 falsifierar version-bump-strategi) |
| L_KKK | L_X-klassbestämning via isolerad-fil-test — kopiera rad till tom .md, vale-test → klass-discrimination | STEG F-respons + STEG 1.5-operationalisering (Code lessons.md STEG 1.5 bevisade L_X.1 för #4/#6) |
| L_LLL | Intra-prompt konsistens-check — prosa-beskrivning och kod-exempel måste matcha EXAKT (3 instanser bekräftat systemisk: STEG E + STEG 2-live-vs-disable + K3.3.A.1 radnummer-stripped-vs-live) | Code's avvikelse-rapporter (STEG E + STEG 2 STOPPA + K3.3.A) |
| L_MMM | Parallell-Chat-design-skuld — efterföljande Chat-iterations producerar dubbla namn-tilldelningar för distinkta lessons när lessons-namn-kollision-check inte är operationaliserad i prompt-design | Denna reconciliation-fil-skapelse (Marcus-fångst 2026-05-17 mid-session) |
| L_NNN | Empirisk-baserad K-fas-omprioritering — när 2+ K-fas-instanser visar samma systemiska problem (>50% hit-rate i N≥2), pivota till rot-orsak-domän-K-fas framför fortsatt instans-arbete | C-pivot-respons (todo.md + lessons.md 2/2 L_X.2-hit-rate → K3 omprioriterad före D.4-rest) |
| L_OOO | TokenIgnores-pattern som matchar token inuti code-span bryter Vale code-detection — K2.1 generaliserad: gäller även specifika @scope/pkg-patterns, ej bara breda kebab | K3.1.b TEST 1 STOPPA-rapport |
| L_PPP | Mitigation-test mot fil A kan regressera fil B — cross-fil-regression-check obligatorisk vid Vale-config-ändring | K3.1.b TEST 1 STOPPA-rapport |
| L_QQQ | Rotorsaks-diagnostik (ta-bort-den-misstänkta) FÖRE acceptans av mitigerings-hypotes — D1 falsifierade TokenIgnores-orsak på 1 test | K3.1.b TEST 1 STOPPA-rapport |
| L_RRR | L_X.2-masking är mekanism-oberoende — varje suppmerings-mekanism (IL/TokenIgnores/BlockIgnores) som tar bort ett rapporterat fynd un-maskerar dolda; total bevaras-eller-värre | K3.1.b slutrapport |
| L_SSS | BlockIgnores är block/rad-nivå, ej inline-span-nivå — backtick-span-regex har noll effekt (mekanism-gräns, ej Issue #858) | K3.1.b slutrapport |
| L_TTT | 3-mitigerings-familj-uttömning som empirisk bar för upstream-bugg-klassning (vs antagande efter 1 fail) — operativ klass-pattern för tooling-bug-klassning över alla framtida tooling-debug-sessioner | K3.1.b slutrapport |
| L_UUU | Single-finding-IL cascade-test under-detekterar L_X.2 — maskeringen triggas först när tillräckligt av en token-kluster suppimeras. Tillförlitlig metod = strukturell pre-screen (token-i-backtick-spans) ELLER fix-hela-token-typen | K3.2 slutrapport |
| L_VVV | Δ=0 i IL-baserat test är tvetydigt (cascade vs IL-suppmerings-fel) — kräver inspektion av post-IL-fynd-lista. IL failar ofta på table-rader + list-items | K3.2 slutrapport |
| L_WWW | L_X.2-precondition = token-i-backtick-span + plain-sibling-fynd av samma token i samma fil. Strukturell pre-screen är tillförlitlig klassificerare; cascade-test via suppmering är det inte | K3.2 slutrapport |
| L_XXX | Vale's "Use 'X' instead of 'x'"-substitution-suggestion är token-nivå, kontext-blind — `tanstack` inuti `@tanstack/pkg` är ett paketnamn, canonical-cap korrupterar. Klassificering (D vs L_HH) kräver kontext-läsning, aldrig Vale-meddelandet rakt av | K3.3.A.1 STOPPA-rapport (committad i edf9705) |
| L_YYY | Upstream-bugg-klassning kräver minimal-repro-verifikation FÖRE issue-filande — "mitigerings-familj-uttömning" är nödvändigt men inte tillräckligt empiriskt bevis. Minimal repro = isolerad standard-fil utan custom config. jdkato's #387-respons bevisar branschstandard: Vale-maintainer kräver minimal repro som första steg | K3.4 Chat-web-research (Marcus-fångst-trigger) |
| **L_ZZZ** | **Minimal-repro kräver variation av markdown-KONSTRUKT (paragraf-typ, list, table, bold, lazy-continuation), ej bara innehåll — case-a/b/c (plain paragraphs) gav falskt "reproducerar inte"; case-d (list-item/flerrads-paragraf) avslöjade buggen. 11 cases krävdes för pinpoint** | **K3.4 minimal-repro-slutrapport (11 cases)** |
| **L_ÅÅÅ** | **"Reproducerar inte minimalt" efter N cases är preliminärt tills konstrukt-rymden (paragraf-typ, list, table, bold, frontmatter, flerrads) är systematiskt täckt — pre-emptive "kan inte reproducera"-slutsats är L_AAA-bias** | **K3.4 minimal-repro-slutrapport** |

**Notering om uppdatering:**
- 12 lessons L_BBB-L_NNN: oförändrade från v1
- 13 nya lessons L_OOO-L_ÅÅÅ: tillagda v2-final-revision (varav L_ZZZ + L_ÅÅÅ från K3.4-empiri post-v2-research-version)
- Total Sektion 3.6: 25 lessons (uppjusterat från 12 i v1)
- **Pre-existing räknings-drift Sektion 3.6** (text säger 25, breakdown summerar till 26) bevaras oförändrad. K-sista-0-domän vid omnumrering till L20-LNN.

### Sektion 3.7 — Post-mini-3 K0-skörd (14 lessons)

Genererade 2026-05-18 under Session 6.6.6 K0-fas (pre-K3.5 CI-baseline-
korrektur). 14 lessons-kandidater från K0.1-K0.4 (forensisk-pass +
K0.3 4-commit-exekvering + K0.4 pre-edit-STOPPA). Källor: 3 Marcus-
Gate-2-fångster + 6 Code-transparens-rapporter + 5 Code-design-
förbättringar.

| Temp-namn | Kort beskrivning | Genererad i Chat-turn |
|---|---|---|
| L_ÄÄÄ | UTF-8-blind-spot-klass vid filename-iteration — git-output utan `-z` + exakt-match-jämförelse failar på non-ASCII-paths. Mitigering: canonical NUL-terminated read-pattern per Git officiell docs. Klass-pattern bekräftat efter 2 empiriska instanser: K1.17 (tj-actions UTF-8-glob, Session 6) + K0.1 (.githooks/pre-commit, denna session). Hub-konsolideringsbrist — K1.17 hub-formulering var tooling-specifik (third-party Actions), inte klass-generaliserad. | K0.1 forensisk-pass + K0.3 Commit 1+4 |
| L_ÖÖÖ | Cross-grindvakt-regression-mönster — Vale-cleanup-commit i en domän introducerar collateral damage i annan grindvakt. K0.1 (commit `91b6337` K2.6.2.D.1 → frontmatter-fail via v3.md updated-drift) + K0.2 (commit `85a47bf` K2.6.2.D.3 → markdownlint MD029-fail via Vale-disable-block-list-split). 2 instanser samma session-period. | K0.1 + K0.2 forensisk-pass |
| L_AAAA | markdownlint-cli2 glob-merge med explicit fil-argument — explicit fil-argument slås ihop med repo-config-globs → mätning lintar live-repo-fil istället för temp-fil. Isolerad mätning kräver körning från `/tmp` utan repo-config. Code's D.3-metodavvikelse fångades self-review. | K0.2 Code D.3-transparens-rapport |
| L_AAAB | L_AAA-instans 14 — L1 forensisk-pass-regel ("Ristat i sten" i hub-CLAUDE.md sedan Session 6.6.5 K-sista #4) ej tillämpad på K0.3 Alt-A/B/C-rekommendation; Marcus' Gate 2-fångst ("hur har vi hamnat här?") triggade post-hoc forensisk-pass som avslöjade scope-utvidgning. **Operativ konsekvens:** Lager 2 §1.4 (NY) — Pre-K forensisk-pass på touched config/infrastructure som explicit procedursteg. | K0.3 design pre-Marcus' fångst |
| L_AAAC | L_AAA-instans 15 — Chat rusade till fix-rekommendation utan historik-förklaring; Marcus-fångst krävdes för att triggra K7-trail-rekonstruktion (när hooken etablerades + varför UTF-8 inte var i scope + K1.17-relation). **Operativ konsekvens:** fix-rekommendation kräver historik-trail FÖRE alternativ-presentation. | K0.3 design Alt-A/B/C-presentation |
| L_AAAD | L_AAA-instans 16 — bash-pattern-spec i Chat-prompt ej verifierad mot ADR-033 strict-mode + L_C nivå-rangordning + Session 6.6.7 K3.1 SC2312-precedent. Promptens `< <(...)` triggade SC2312 info under `--enable=all`; Alt A-refactor (temp-fil-pattern) krävdes. **Operativ konsekvens:** Lager 2 §3.3 utvidgning — bash-pattern-spec verifieras mot strict-mode + L_C-nivå + repo-precedent FÖRE prompt-leverans. | K0.3 Commit 1 STOPPA-OCH-FRÅGA (Code-fångst) |
| L_AAAE | L_AAA-instans 17 — datum-stämpel i Chat-prompt ej verifierad mot TODAY vid prompt-leverans-tid (K7.7 ursprungligen för Code-prompt-design-tid; gäller även prompt-leverans-tid när leverans sker over-night/over-weekend). K7.7-tillämpning på Chat-side. **Operativ konsekvens:** Lager 2 §3 utvidgning med leverans-tid TODAY-validering. | K0.3 Commit 2 STOPPA-OCH-FRÅGA (dag-rollover Code-fångst) |
| L_AAAF | Inner-kommentarer i Chat-prompt-revisions kan tappas bort när hela kod-blocket bytts ut; specifika kommentarer i ursprungs-kod (typ "K7.C ansvarar för bulk-add"-kommentar i hook) måste re-säkras vid revision. Code's transparens-rapport räddade kommentaren post-hoc. | K0.3 Commit 1 transparens-rapport |
| L_AAAG | Test-design positiv-only ≠ regression-skydd — negativ-test (introducera deliberat fel + verifiera flaggning) krävs för att bevisa faktisk iteration-mekanism. T13 ändrades från Chat-prompt-spec (positiv test, valid v3.md → exit 0) till Code-design (negativ test, deliberat fel → måste flaggas). Positiv-only kan inte skilja "validerad" från "tyst skippad". | K0.3 Commit 4 T13 Code-design-förbättring |
| L_AAAH | CI-trogen invocation > approximation — lokal CI-simulering ska använda EXAKT samma kommando som CI, inte en delmängd eller variant. V.A.5 markdownlint kördes no-args (config-driven, CI-identiskt) istället för Chat-prompt-spec `"**/*.md"`-glob. Mönsterförstärkning av maskerings-klass (L9). | K0.3 Block V.A Code-design-förbättring |
| L_AAAI | Commit-trailer-format följer repo-konvention, inte Chat-prompt-default — verifiera 3 senaste commits för trailer-pattern (typ Co-Authored-By, Refs, Signed-off-by) FÖRE commit-message-design. | K0.3 Code transparens-rapport |
| L_AAAJ | Commit-message-snippet ärvd från ursprungs-prompt måste re-verifieras mot final-implementation post-revisions — L_LLL-tillämpning på commit-message-domän. Promptens snippet visade pipe-pattern; Alt A-final var temp-fil-pattern; Code korrigerade. | K0.3 Commit 1 transparens-rapport |
| L_AAAK | L_AAA-instans 18 — Chat missade att "CI grön"-definition är instabilt state under aktiv Vale-cleanup-session. Session 6.6.6 sessionsdok Del 7 (commit `cec2fa5`) säger explicit "CI förblir röd tills K2.3-K2.6 manuell-fix-pass slutförd. Detta är design". K0-syftet "pre-K3.5 CI-baseline-korrektur" formulerat felaktigt som "CI grön" istället för "CI på förväntad Session 6.6.6 baseline + alla oväntade pre-existing fixed". **Operativ konsekvens:** Lager 2 §3.5 (NY) — Sessions-scope-medvetenhet ("CI grön"-definition kan vara instabilt state under aktiv cleanup-session). | K0.3 post-push Marcus-fångst |
| L_AAAL | L_AAA-instans 19 — Chat-prompt antog att pre-commit-hook auto-bumpar `updated:`-fält för ALLA modifierade filer, men hooken bumpar enbart governing docs (FRONTMATTER_GOVERNING_DOCS-array per K0.1 C.3 + K0.3 Commit 1). Reconciliation-fil är arbets-artefakt, INTE governing → hook bumpar inte → frontmatter-drift om manuell bump saknas. K0.4-prompt G.4/G.5-verifikation + STOPPA-villkor (f) byggde på samma felaktiga antagande. **Operativ konsekvens:** Chat-prompt som rör frontmatter-fält verifierar governing-vs-non-governing-status FÖRE hook-bump-antagande. | K0.4 Block A→B STOPPA-OCH-FRÅGA (Code-fångst pre-edit) |

**Operativa konsekvenser för Lager 2 v0.1 → v1.0-revision (säkras vid K-sista-0):**
- **§1.4 (NY)** — Pre-K forensisk-pass på touched config/infrastructure som explicit procedursteg (L_AAAB)
- **§3 utvidgning** — Datum-stämpel TODAY-validering vid prompt-leverans, inte bara prompt-design (L_AAAE, K7.7-tillämpning på Chat-side)
- **§3.3 utvidgning** — Bash-pattern-spec mot ADR-033 strict-mode + L_C nivå-rangordning + repo-precedent FÖRE prompt-leverans (L_AAAD)
- **§3.5 (NY)** — Sessions-scope-medvetenhet ("CI grön"-definition kan vara instabilt state under aktiv cleanup-session) (L_AAAK)
- **§3 utvidgning #2** — Chat-prompt som rör frontmatter-fält verifierar governing-vs-non-governing-status FÖRE hook-bump-antagande (L_AAAL)

**L_AAA-mönster-trajektoria:**
- Mini-3 rapporterade 11/17 K-faser = 59% (Session 6.6.6 pre-K0)
- Post-K0.3: 18/19 K-faser = 89%
- Post-K0.4 (denna commit): **19/20 K-faser = 95%** (L_AAAL hook-governing-scope-antagande)
- Frekvensen ökar i djupt fokuserat arbete, ej avtagande. Code's pair-programming-pattern (L_ZZ) primär kvalitets-mekanism: **8/14 K0-fångster** (57%). Marcus Gate-2: 3/14. Chat-self: 3/14 (varav 2 retroaktiva post-Marcus).

---

## Del 4 — L_MMM meta-lesson (oförändrad från v1)

[Parallell-Chat-design-skuld-meta-lesson, innehåll oförändrat.]

---

## Del 5 — K-sista-0-konsoliderings-instruktioner (uppdaterad v2-final)

### Bake-in-protokoll (uppdaterad med L_ZZZ/L_ÅÅÅ)

1. **Läs denna v2-final-fil + mini-1 + mini-2 i ordning.**
2. **Klass-pattern-konsolidering** — uppdaterad med post-K3.1.b/K3.2/K3.4/K0-lessons:
   - Empirisk-disciplin-klass (L_S/L_T/L_N/L_NN/L_MM/L_PP + L_UUU/L_VVV/L_WWW)
   - Vale-quirks-klass-pattern (L_X.1 vs L_X.2 + L_HH/L_OO/L_QQ/L_TT/L_UU/L_XX + L_RRR)
   - Mitigerings-uttömning-disciplin (L_OOO/L_PPP/L_QQQ/L_SSS/L_TTT)
   - TokenIgnore-pattern-design-klass (L_DD.1/L_DD.2/L_KK + L_OOO)
   - Disciplin-meta-klass (L_GG/L_II/L_LL/L_AAA/L_LLL/L_MMM)
   - Tooling-disciplin-klass (L_RR/L_VV/L_BB/L_CCC/L_JJJ)
   - Klass-namnging-klass (L_FF/L_WW/L_YY/L_HHH)
   - Hub-portabilitets-klass (L15-L19/L_JJ/L_ZZ)
   - K-fas-strategi-klass (L_NNN/L_FFF/L_GGG)
   - Brand-specifik-klass (mini1-L_O/mini1-L_Y/mini1-L_AA + mini2-L_Y)
   - Vale-config-arkitektur-klass (mini1-L_P + mini2-L_O/mini2-L_P + L_SS)
   - Klassificerings-kontext-disciplin (L_NN/L_FFF/L_XXX)
   - Upstream-bug-klassning-disciplin (L_TTT/L_YYY/L_JJJ + **L_ZZZ/L_ÅÅÅ**)
   - UTF-8-blind-spot-klass (**L_ÄÄÄ**, klass-pattern efter K1.17 + K0.1)
   - Cross-grindvakt-regression-mönster (**L_ÖÖÖ**, K0.1 + K0.2-instanser)
   - L_AAA-instanser 14-19 (**L_AAAB/L_AAAC/L_AAAD/L_AAAE/L_AAAK/L_AAAL**) — Chat-design-skuld-mönster
   - Code-pair-programming-fångst-domän (**L_AAAF/L_AAAG/L_AAAH/L_AAAI/L_AAAJ**) — Code-transparens-rapport-precedent

3. **Konsolidera till 10-15 hub-lessons** (oförändrat mål; 94-katalog-storlek konfirmerar).

4. **Omnumrera till L20-LNN.**

5. **Bake-in till `tasks/lessons.md`.**

6. **Markera UNIVERSAL-kandidater.**

7. **Markera denna v2-final-fil som SUPERSEDED.**

8. **Arkivera v1 (82dd9a5) + v2-final post-K-sista-1.**

---

## Del 6 — Spårbarhet (uppdaterad v2-final)

### Källfiler

- **Mini-1 (2026-05-16):** `tasks/sessions/2026-05-16-session-6-6-6-mini-overlamning.md` Del 4
- **Mini-2 (2026-05-17):** `tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-2.md` Del 4
- **Session 6.6.6 K1.1-K2.2 trail:** `tasks/sessions/2026-05-14-session-6-6-6.md` Del 9
- **L_BBB-L_NNN trail:** Chat-trail 2026-05-17 mid-session
- **L_OOO-L_QQQ trail:** Chat-trail K3.1.b TEST 1 STOPPA-respons
- **L_RRR-L_TTT trail:** Chat-trail K3.1.b slutrapport-respons
- **L_UUU-L_WWW trail:** Chat-trail K3.2 slutrapport-respons
- **L_XXX trail:** Chat-trail K3.3.A.1 STOPPA-respons + commit `edf9705`-message
- **L_YYY trail:** Chat-trail K3.4 web-research (Marcus-fångst-trigger)
- **L_ZZZ + L_ÅÅÅ trail:** Chat-trail K3.4 minimal-repro-slutrapport (11 cases)
- **L_ÄÄÄ-L_AAAL trail (Sektion 3.7):** Chat-trail K0.1-K0.4 Session 6.6.6 2026-05-17/18 (forensisk-pass + 3 Marcus-Gate-2-fångster + 6 Code-transparens-rapporter + 5 Code-design-förbättringar)

### Minimal-repro-bilagor (för upstream-issue + ADR-032-spårbarhet)

- `/tmp/k34-minimal-repro/case-d4.md` — 4 rader, HELT-bold rad 1 + lazy-continuation
- `/tmp/k34-minimal-repro/case-d6.md` — 4 rader, code-span rad 1 + plain lazy-continuation
- `/tmp/k34-minimal-repro/.vale.ini` — minimal-config (BasedOnStyles=Vale + 4-terms-vocab)
- BEVARAS för upstream-issue-bilaga (K3.4.5)

### Commit-referenser

- mini-överlämning 1: `cc01761`
- mini-överlämning 2: `6179402`
- todo.md K3-defer: `35aaf9a`
- lessons.md K3-defer: `d2cd843`
- v1 reconciliation-fil: `82dd9a5`
- K3.3.A react-stack L_HH (L_XXX committad i message): `edf9705`
- K3.3.B BUILD-LOG K3-PENDING: `2b4678f`
- K3.3.C ADR-031 K3-PENDING: `5b7c02d`
- K3.3.D react-headless K3-PENDING: `849485d`
- v2-final reconciliation-fil-update: `f8080c3`
- K0.3 Commit 1 (hook UTF-8-fix): `3251d2f`
- K0.3 Commit 2 (v3.md bump): `92e95e8`
- K0.3 Commit 3 (ADR-029 MD029-fix): `31e9f3c`
- K0.3 Commit 4 (cross-grindvakt UTF-8-audit): `4a42826`
- K0.4 reconciliation-fil Sektion 3.7-tillägg: <pending — denna commit>

### Sessions-fortsättning-information

Om sessionsbyte sker innan K-sista-0 är klar: ny Chat-iteration ska
läsa denna v2-final-fil FÖRE mini-överlämning 2 eller den missar 25
post-mini-2 lessons (12 v1 + 13 v2-final) + 9 mini-1-konflikt-lessons.

---

> **Slut på v2-final-reconciliation-fångst.**
>
> v2-final ersätter v1 (`82dd9a5`) som auktoritativ K-sista-0-input-
> katalog. v1 kan referas för historisk trail. v2-final inkluderar all
> empirisk skörd från Session 6.6.6 K1.1 till K3.4 minimal-repro.
