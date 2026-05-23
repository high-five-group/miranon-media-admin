---
owner: marcus803
updated: 2026-05-23
review_by: 2026-08-23
status: draft
---

# K-sista-0 Steg 2 — Fulltext-supplement till rå-katalogen (RAPPORTERA-only)

> **Syfte:** Anrika rå-katalogens (`2026-05-23-k-sista-0-lessons-rakatalog.md`,
> commit-serie 29a95e2/b0be332) §3.1–3.5-poster som hittills bara fanns som
> enradare. Detta är ANRIKNING — inga nya lessons, ingen ny räkning, ingen
> omnumrering. Katalog-totalen förblir 125 (124 förekomst-grupper +
> kompletterande). Detta dokument tillför djupare TEXT till befintliga poster.
>
> **Konsolidering, klassificering och omnumrering är Chat:s arbete (Steg 3).**

---

## Del 1 — Metod & källor

### Forensisk pre-pass (Block I)

| Item | Värde |
|---|---|
| Repo | `~/Repon/miranon-media-admin` |
| HEAD-SHA | `b0be332` (`docs(sessions): committa mini-5 kompletterande-fil`) |
| Branch | `main` (up-to-date med origin/main) |
| Working tree | clean |
| `date +%F` (TODAY) | `2026-05-23` |
| Rå-katalog committad | ✅ `tasks/sessions/2026-05-23-k-sista-0-lessons-rakatalog.md` |
| v1 finns | ✅ `tasks/sessions/2026-05-17-lessons-reconciliation-fangst.md` (336 rader) |

### Källfiler lästa (för fulltext-lokalisering)

| Fil | Vad som faktiskt fanns där |
|---|---|
| `2026-05-17-lessons-reconciliation-fangst.md` (v1, 336 rader) | **Del 2 konflikt-tabell (rad 78-88)** = materiell fulltext för alla 18 konflikt-lessons (§3.3 mini-1 + §3.4 mini-2). v1:s §3.1/§3.2/§3.5-tabeller (rad 102-180) = samma 1-rader som rå-katalogen + 3 mindre parentes-utvidgningar (L_HH/L_JJ/L_ZZ). Del 4 (rad 206-248) = fulltext för L_MMM (men L_MMM är §3.6, ej i scope). |
| `2026-05-14-session-6-6-6.md` (huvud-sessionsdok, 386 rader) | **Del 9 (rad 326-351)** = materiell fulltext för L_M, L_N, L_S, L_T, L_U, L_W + mini-1-versionerna av L_O, L_P, L_Q, L_R. Bästa källa för §3.2:s tidiga lessons. L_X, L_V, L_Y, L_Z, L_AA och §3.5 (L_BB+) saknas (senare K2.5-K2.6.2.D-skörd, efter Del 9:s K1.1-K2.2-scope). |
| `2026-05-16-...-mini-overlamning.md` (mini-1) | Del 4 (rad 137-165) = 1-rader (samma som rå-katalogen). Ingen brödtext-fulltext utöver. |
| `2026-05-17-...-mini-overlamning-2.md` (mini-2) | Del 4 (rad 184-245) = 1-rader, UTOM **L_AAA (rad 237-245)** som har fulltext-paragraf. |

### Avgörande verifikation

> **Innehåller v1 fulltext: DELVIS (ja för 18, nej för 37).**
>
> v1 har materiell fulltext ENDAST för de 18 konflikt-lessonsna (§3.3+§3.4)
> via Del 2 konflikt-tabellen. Rå-katalogens påstående "fulltext ej
> lokaliserad utanför v1" är empiriskt **delvis felaktigt**: (a) för §3.3/§3.4
> finns fulltext i v1 Del 2 (bekräftat); (b) för §3.2:s tidiga lessons är den
> bästa fulltext-källan huvud-sessionsdoket Del 9, INTE v1; (c) för §3.5
> (utom L_AAA) finns ingen fulltext någonstans — 1-raden ÄR fullaste
> formuleringen.

---

## Del 2 — Fulltext per arbetsnamn (55 poster)

### §3.1 — Retroaktiva från Session 6.6.5 (5 poster)

Fullaste källa: huvud-sessionsdok Del 9 (rad 330-334) — 1-rader med kort
empirisk kvalifikator. Lätt anrikade.

- **L15** · sessionsdok Del 9 rad 330 · "Empirisk verifikation FÖRE
  klassificering: är aktör-agnostisk Gate 2-disciplin" · *lätt anrikad
  enradare*
- **L16** · sessionsdok Del 9 rad 331 · "Projektkunskaps-index ≠ filsystem
  live-state (söktreffar är inte HEAD)" · *lätt anrikad enradare*
- **L17** · sessionsdok Del 9 rad 332 · "Pre-existing skuld som upptäcks i
  K-arbete: defer till mini-session, inte i pågående scope" · *lätt anrikad
  enradare*
- **L18** · sessionsdok Del 9 rad 333 · "Web-research FÖRE strategi-val vid
  tooling-frågor" · *endast enradare existerar*
- **L19** · sessionsdok Del 9 rad 334 · "Hub-sync inom 7 dagar är OK för
  icke-akuta; commit-trail kan vara stale" · *lätt anrikad enradare*

### §3.2 — ≈samma mini-1 + mini-2 (6 poster)

Fullaste källa: huvud-sessionsdok Del 9 för L_M/L_N/L_S/L_T/L_W. L_X saknar
fulltext (senare skörd).

- **L_M** · sessionsdok Del 9 rad 338 (fullast) · "Pre-implementation
  grindvakts-config-audit: ADR-030 vs `.vale.ini` hade drift (exclude
  saknades) som K1.1 bevisade empiriskt" · *ÄKTA FULLTEXT (anrikad från
  rå-katalogens 1-rad)*
- **L_N** · sessionsdok Del 9 rad 339 (fullast) · "AI pre-empirisk
  verktygs-antagande: K2.0 prediction ~52 var överskattning med 400 %.
  K2.1-empirisk verifikation fångade. (instans 4-5 av detta mönster)" ·
  *ÄKTA FULLTEXT*
- **L_S** · sessionsdok Del 9 rad 344 (fullast) · "Empirisk test FÖRE commit
  är upptäcktsmekanism: 7 L_I-iterationer (K2.0-K2.1.7) fångade 4 dramatiska
  antaganden-fel (Z-strategi blockerad, kebab-pattern brutet, existence också
  blockerad, prediction överskattad)" · *ÄKTA FULLTEXT*
- **L_T** · sessionsdok Del 9 rad 345 (fullast) · "Chat-prompt cross-scope-
  värden är design-bug: K2.2-prompt-värde '203 fynd' var post-K-sista-utfall,
  inte K2.2-scope. STOPPA-OCH-FRÅGA fångade korrekt." · *ÄKTA FULLTEXT*
- **L_W** · sessionsdok Del 9 rad 347 (fullast) · "Pre-commit lokal
  grindvakts-test fångar förväntad CI-fail innan push: K2.2 pre-commit-
  verifikation (29 fynd) förutsa CI Vale-job-fail (23 errors); Marcus var
  förberedd" · *ÄKTA FULLTEXT*
- **L_X** · mini-1 Del 4 rad 158-159 + v1 §3.2 rad 121 · mini-1: "Vale
  inline-disable filkontext-dependent (4 disable-syntax-varianter fungerar
  isolerat men ej i full-fil-kontext)" / v1-not: "Mini-2 meta-version (12+
  instanser), mini-1 specifik (4 disable-syntax-varianter)" · *endast enradare
  existerar — accepteras som fulltext (fulltext-paragraf finns ej i någon
  källa; L_X.1/L_X.2-fulltexten lever i §3.6 L_III, ej här)*

### §3.3 — Mini-1 unika konflikt-lessons (9 poster)

Fullaste källa: **v1 Del 2 konflikt-tabell, mini-1-kolumnen (rad 80-88)** —
materiell fulltext. Sessionsdok Del 9 bekräftar L_O/P/Q/R/U identiskt.

- **L_O** (mini1) · v1 Del 2 rad 80 (= sessionsdok Del 9 rad 340) ·
  "Brand-name vs förkortning samma stavning: 'Aria' (Adobe) vs 'ARIA' (W3C)
  är distinkta legitima former; case-folding tvångskonvertering är fel
  default" · *ÄKTA FULLTEXT*
- **L_P** (mini1) · v1 Del 2 rad 81 (= sessionsdok rad 341) ·
  "Kategori-exkludering är Vale-config-domän — ADR-022 Kat 4 + 5b + 5c
  implementeras via section-level `BasedOnStyles =` exclude" · *ÄKTA FULLTEXT*
- **L_Q** (mini1) · v1 Del 2 rad 82 (= sessionsdok rad 342) · "Blind-disable
  utan empirisk fynd-verifikation — ADR-033-disable tillagd K-sista #3 utan
  att kolla om fynd faktiskt fanns (0 fynd, disable överflödig)" · *ÄKTA
  FULLTEXT*
- **L_R** (mini1) · v1 Del 2 rad 83 (= sessionsdok rad 343) · "Pre-K
  bulk-disable-operation — K6.2 Alt F per-fil-rad-1-disable var korrekt design
  men introducerade README dubblerad-block-anomali (oavsiktlig)" · *ÄKTA
  FULLTEXT*
- **L_U** (mini1) · v1 Del 2 rad 84 (= sessionsdok rad 346) · "Grindvakt-värde
  bevisas av nya fynd mellan baselines — CLAUDE.md 4 Vale.Terms-fynd uppstod
  mellan K1.1 (2026-05-14) och K2.2 (2026-05-16) — Vale fångade automatiskt" ·
  *ÄKTA FULLTEXT*
- **L_V** (mini1) · v1 Del 2 rad 85 · "Path-segment + backticks-konvention —
  mappnamn ska wrappas i backticks i prosa (`docs/`, `tasks/`, `.github/`)" ·
  *ÄKTA FULLTEXT*
- **L_Y** (mini1) · v1 Del 2 rad 86 · "Brand-canonical-fix kräver per-
  förekomst-kontext-läsning även när substitution är simpel — kontext kan
  ändra om fyndet är legitim eller drift" · *ÄKTA FULLTEXT*
- **L_Z** (mini1) · v1 Del 2 rad 87 · "Fix exponerar nya fynd inom samma fil
  under fix-pass — iterativ vale-verifikation tills stabilisering krävs (kan
  inte anta single-pass räcker)" · *ÄKTA FULLTEXT*
- **L_AA** (mini1) · v1 Del 2 rad 88 · "'Miranon Media-specifikt'-form med
  trailing kebab triggar Vale-quirk — pattern-design behöver lookahead-
  utvidgning för att hantera token-shift" · *ÄKTA FULLTEXT*

### §3.4 — Mini-2 unika konflikt-lessons (9 poster)

Fullaste källa: **v1 Del 2 konflikt-tabell, mini-2-kolumnen (rad 80-88)** —
materiell fulltext.

- **L_O** (mini2) · v1 Del 2 rad 80 · "Strategi B exclude > BlockIgnores
  (preliminär) — Vale-config-arkitektur-trade-off för Kategori-exkludering" ·
  *ÄKTA FULLTEXT*
- **L_P** (mini2) · v1 Del 2 rad 81 · "Vocab vs accept.txt-design — X1
  (vocab-token) vs X2 (substitution-pattern) trade-off för brand-canonical-
  enforcing" · *ÄKTA FULLTEXT*
- **L_Q** (mini2) · v1 Del 2 rad 82 · "Pattern-iteration: minimum 3-test-suite
  per pattern-change. Empirisk verifikation av regex-pattern kräver minst 3
  distinkta input-cases" · *ÄKTA FULLTEXT*
- **L_R** (mini2) · v1 Del 2 rad 83 · "Vale kontext-quirk-instans-pattern
  (klass-L_X) — varje Vale-quirk är individuell instans men kollektivt klass
  av latenta buggar" · *ÄKTA FULLTEXT*
- **L_U** (mini2) · v1 Del 2 rad 84 · "Vale.Terms vs Brand: rule-typ påverkar
  fix-strategi — substitution-rules kräver per-förekomst-läsning, existence-
  rules räcker med pattern-match" · *ÄKTA FULLTEXT*
- **L_V** (mini2) · v1 Del 2 rad 85 · "VueToReact-defer-disciplin —
  Miranon.VueToReact-fix defereras till K3/ADR-032 + Fas 2.5; INTE blandas
  med Vale.Terms-pass" · *ÄKTA FULLTEXT*
- **L_Y** (mini2) · v1 Del 2 rad 86 · "Brand-pivot-narrativ är trust-domän —
  när Brand-strategi byts mid-session, dokumentera pivot-rationale explicit
  (Z-strategi → X2 → existence + (?!\.)-pattern empirisk trail)" · *ÄKTA
  FULLTEXT*
- **L_Z** (mini2) · v1 Del 2 rad 87 · "Tooling-doc-research-prioritering —
  branschledar-docs (Elastic/PostHog/HPC/Vale.sh) konsulteras FÖRE arkitektur-
  beslut, inte efter" · *ÄKTA FULLTEXT*
- **L_AA** (mini2) · v1 Del 2 rad 88 · "ADR-katalog-uppdaterings-timing —
  `docs/decisions/README.md` uppdateras vid K-sista, INTE pre-emptive vid
  ADR-reserve" · *ÄKTA FULLTEXT*

### §3.5 — Mini-2 L_BB–L_AAA (26 poster)

Fullaste källa: v1 §3.5 (rad 155-180) — 1-rader (3 med mindre parentes-
utvidgning: L_HH, L_JJ, L_ZZ). Endast **L_AAA** har fulltext-paragraf
(mini-2 Del 4 rad 237-245).

- **L_BB** · v1 §3.5 rad 155 · "Marker-syntax i prep är prosa-rekonstruktion" ·
  *endast enradare existerar*
- **L_CC** · v1 §3.5 rad 156 · "Vale markdown-parser-quirks klass-pattern
  (L17-tröskel)" · *endast enradare existerar*
- **L_DD** · v1 §3.5 rad 157 · "TokenIgnore-tokeniserings-shift-klass
  (.1 + .2)" · *endast enradare existerar*
- **L_EE** · v1 §3.5 rad 158 · "Rapport-cellvärde vs Σ-rad-konsistens" ·
  *endast enradare existerar*
- **L_FF** · v1 §3.5 rad 159 · "Rapport-formulering klassar via fel-attribut" ·
  *endast enradare existerar*
- **L_GG** · v1 §3.5 rad 160 · "Vinst-vs-disciplin-trade-off-bias" · *endast
  enradare existerar*
- **L_HH** · v1 §3.5 rad 161 (fullast) · "Vale-egen inline-code-detection som
  aktiv skydd (backticks-wrap)" · *endast enradare existerar (v1 har parentes-
  utvidgning vs mini-2)*
- **L_II** · v1 §3.5 rad 162 · "Web-research som operationell del av
  11/10-disciplin" · *endast enradare existerar*
- **L_JJ** · v1 §3.5 rad 163 (fullast) · "Vocab-domän-separation är
  industri-norm (Elastic/PostHog/HPC/Vale.sh)" · *endast enradare existerar
  (v1 har parentes-utvidgning)*
- **L_KK** · v1 §3.5 rad 164 · "Vocab-fragment-fångst (compound-ord-effekt)" ·
  *endast enradare existerar*
- **L_LL** · v1 §3.5 rad 165 · "Revert+rebuild som disciplin-respons" ·
  *endast enradare existerar*
- **L_MM** · v1 §3.5 rad 166 · "Rad-positioner är icke-stabila (intra-K-fas
  instans 18)" · *endast enradare existerar*
- **L_NN** · v1 §3.5 rad 167 · "Heuristik-klassifikations-drift D vs K
  (89 %-omklass)" · *endast enradare existerar*
- **L_OO** · v1 §3.5 rad 168 · "Inline-disable + top-of-file disable är broken" ·
  *endast enradare existerar*
- **L_PP** · v1 §3.5 rad 169 · "Temp-verifikation måste bevara live-tillstånd" ·
  *endast enradare existerar*
- **L_QQ** · v1 §3.5 rad 170 · "Sed-canonical-fix kräver vocab-coverage" ·
  *endast enradare existerar*
- **L_RR** · v1 §3.5 rad 171 · "BSD-perl global sed osäker för mixed-kontext" ·
  *endast enradare existerar*
- **L_SS** · v1 §3.5 rad 172 · "Vale-config-design-domän som meta-klass" ·
  *endast enradare existerar*
- **L_TT** · v1 §3.5 rad 173 · "K-sub-klassifikation (already-wrapped/
  not-wrapped/N-A)" · *endast enradare existerar*
- **L_UU** · v1 §3.5 rad 174 · "WRAP-grammatik-test" · *endast enradare
  existerar*
- **L_VV** · v1 §3.5 rad 175 · "perl -0pe slurp-mode för fixed-text-
  borttagning" · *endast enradare existerar*
- **L_WW** · v1 §3.5 rad 176 · "Multi-block-fix räknar ALLA rules" · *endast
  enradare existerar*
- **L_XX** · v1 §3.5 rad 177 · "Disable-block-scope-isolation (rule-A rör inte
  rule-B)" · *endast enradare existerar*
- **L_YY** · v1 §3.5 rad 178 · "Klass-namnging är arkitektur-design" · *endast
  enradare existerar*
- **L_ZZ** · v1 §3.5 rad 179 (fullast) · "Pair-programming-pattern (extern
  fångst > intern självkontroll)" · *endast enradare existerar (v1 har
  parentes-utvidgning vs mini-2:s 'defer Session 6.7+')*
- **L_AAA** · mini-2 Del 4 rad 237-245 (fullast) · "(NY post-K2.6.2.D.4-
  failure) — Lessons-internalisering-mellan-K-faser kräver explicit referens-
  checklist per ny K-fas-prompt, inte bara 'dokumenterad i prompten'.
  Pattern-anti: Chat designar prompter med antagande att lessons är
  operationella när de bara är dokumenterade. K2.6.2.D.4-failure var
  iteration-3-instans av samma underliggande mönster (K2.6.2.A L_OO-skuld,
  K2.6.2.D.2 L_WW-skuld). Operationell mitigation: pre-prompt-design-checklist
  över ALLA etablerade lessons som applicerbar-check." · *ÄKTA FULLTEXT (fanns
  redan i rå-katalogen; oförändrad)*

---

## Del 3 — Sammanfattning

### Anriknings-utfall (55 poster)

| Bucket | Antal | Vilka |
|---|---:|---|
| **ÄKTA FULLTEXT** (materiell fler-sats empirisk text hittad) | **24** | §3.3 mini-1 (9) + §3.4 mini-2 (9) + L_M, L_N, L_S, L_T, L_W (5) + L_AAA (1) |
| **Lätt anrikad enradare** (1-rad + empirisk kvalifikator) | **4** | L15, L16, L17, L19 (§3.1; sessionsdok-parenteser) |
| **Endast enradare existerar** (accepteras som fulltext) | **27** | L18 (§3.1) + L_X (§3.2) + 25 av §3.5 (alla utom L_AAA) |
| **Σ** | **55** | — |

### Källfördelning för äkta fulltext

- **v1 Del 2 konflikt-tabell (rad 78-88):** 18 poster (alla §3.3 + §3.4).
- **Huvud-sessionsdok Del 9 (rad 326-351):** 5 poster (L_M, L_N, L_S, L_T,
  L_W) — och bekräftar §3.3 mini-1 L_O/P/Q/R/U identiskt med v1.
- **mini-2 Del 4 (rad 237-245):** 1 post (L_AAA — fanns redan).

### Korrigering av rå-katalogens antagande

Rå-katalogens markering "fulltext ej lokaliserad utanför v1" är **delvis
felaktig** och bör läsas så här efter denna verifikation:

- §3.3 + §3.4 (18): fulltext finns i v1 Del 2 — påståendet korrekt.
- L_M/L_N/L_S/L_T/L_W (5): fulltext finns i huvud-sessionsdok Del 9, INTE i
  v1 — påståendet missvisande (pekade fel källa).
- L18, L_X, §3.5 utom L_AAA (27): ingen fulltext-paragraf finns någonstans —
  enraden ÄR fullaste formuleringen. Detta är ett giltigt, förväntat utfall;
  ingen text har hittats på.

### Räknings-bekräftelse (oförändrad)

Detta dokument tillför ENBART djupare text till befintliga poster. **Inga nya
lessons. Katalog-totalen förblir 125** (124 förekomst-grupper i rå-katalogen +
kompletterande-filens 3 kollisions-varianter, per rå-katalogens Del 5). Ingen
omnumrering, ingen klassificering, ingen konsolidering — det är Chat:s Steg 3.

### Dold-kollisions-kontroll

Inga §3.1–3.5-poster hittades under sitt namn med innehåll som materiellt
motsäger rå-katalogens post. v1 Del 2 + sessionsdok Del 9 är konsistenta med
rå-katalogens 1-rader (de utvidgar dem, motsäger dem inte). De redan kända
namn-kollisionerna (mini-1 vs mini-2 på L_O–L_AA) är dokumenterade i
rå-katalogens Del 3 och bekräftas av v1 Del 2 (som listar båda definitionerna).

---

## Transparens-rapport (Lager 2 §6.2)

**Vad gjordes:** Block I-pre-pass verifierade repo-state (clean, i synk,
HEAD `b0be332`), datum och källfilernas existens. Läste v1 (336 rader) och
huvud-sessionsdoket (386 rader) i sin helhet, samt återanvände mini-1/mini-2
från Steg 1. Lokaliserade fullaste verbatim-formulering för var och en av de
55 §3.1–3.5-arbetsnamnen, transkriberade med källa + radnummer, och
nollrapporterade ärligt där endast enradare existerar.

**Var fulltext faktiskt fanns:** v1 Del 2 konflikt-tabell (18 konflikt-lessons,
§3.3+§3.4) + huvud-sessionsdok Del 9 (5 ≈samma-lessons L_M/N/S/T/W) + mini-2
Del 4 (L_AAA). v1:s eget §3.1/§3.2/§3.5-innehåll var 1-rader. **v1 innehåller
fulltext = DELVIS** (ja för 18, nej för 37).

**Anrikningsresultat:** 24 av 55 fick äkta fulltext, 4 lätt anrikade, 27
förblev enradare (accepterade som fulltext — ingen text hittades på).

**Anomali:** Rå-katalogens "fulltext ej lokaliserad utanför v1" var delvis
missvisande för 5 lessons (fulltexten låg i huvud-sessionsdoket, ej v1).
Korrigerat i Del 3. Ingen dold kollision funnen.

**Working-tree / commit / push:** Se commit-resultat nedan.

**Leverabel:** `tasks/sessions/2026-05-23-k-sista-0-rakatalog-fulltext-supplement.md`.

---

> **Slut på fulltext-supplement.** RAPPORTERA-only. Konsolidering, klass-
> tilldelning, L20-LNN-omnumrering och kollisions-resolution är Chat:s Steg 3.
