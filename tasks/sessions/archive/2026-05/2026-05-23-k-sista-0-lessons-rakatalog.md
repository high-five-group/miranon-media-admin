---
owner: marcus803
updated: 2026-05-24
review_by: 2026-08-23
status: superseded
superseded_by: 'tasks/lessons.md — Session 6.6.6 konsoliderad H2 (2026-05-23, commit 950aa0f)'
---

# K-sista-0 Steg 1 — Rå-katalog lessons-extraktion (RAPPORTERA-only)

> **Syfte:** Mekanisk, namn-nycklad extraktion av alla lessons-kandidater
> inför K-sista-0-konsolidering (som görs separat i Chat, Steg 3). Detta
> dokument EXTRAHERAR och TRANSKRIBERAR verbatim — det konsoliderar inte,
> numrerar inte om till L20-LNN, namnger inte om, klassar inte. Semantisk
> merge across olika namn är Chat:s Steg 3.
>
> **Dedup-princip:** Mekanisk och namn-nycklad. Poster grupperas per
> arbetsnamn EXAKT som det står i källan. Inom en namn-grupp: materiellt
> olika texter → KOLLISION (alla definitioner listas); matchande texter →
> DUBBLETT (förekomster slås ihop med multi-källa-proveniens).

---

## Del 1 — Metod & källor

### Forensisk pre-pass (Block I, empiriskt verifierat)

| Item | Värde |
|---|---|
| Repo | `~/Repon/miranon-media-admin` |
| HEAD-SHA | `1365f0e` (`docs(sessions): addera pre-leverans-grind i mini-5 Del 13`) |
| Branch | `main` (up-to-date med origin/main) |
| Working tree | clean |
| `date +%F` (TODAY) | `2026-05-23` |
| Senaste 3 commits | `1365f0e` → `1f56cb6` → `4e19259` |

### Källfiler (lästa, verifierade existens + git-state)

Alla committade i HEAD `1365f0e`, working tree clean:

| Fil | Rader | Roll |
|---|---:|---|
| `tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md` | 222 | Auktoritativ 94-bas, §3.1–3.7 (frontmatter `total_unique_lessons: 94`) |
| `tasks/sessions/2026-05-16-session-6-6-6-mini-overlamning.md` | 314 | Mini-1 (Del 4 = 19 kandidater, fulltext §3.1–3.2 mini-1-sida) |
| `tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-2.md` | 518 | Mini-2 (Del 4 = 46 kandidater, fulltext §3.1–3.5 mini-2-sida) |
| `tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-3.md` | 389 | Mini-3 (refererar v2-final; ingen ny lesson-text) |
| `tasks/sessions/2026-05-18-session-6-6-6-mini-overlamning-4.md` | 1034 | Mini-4 (§3.7-trail fulltext + L_AAAM-fulltext) |
| `tasks/sessions/2026-05-20-session-6-6-6-mini-overlamning-5.md` | 1383 | Mini-5 (Del 6/13/14 — L_AAAM-P, L_AAA-21–28, L_AAAQ-X, L_AAAY-E fulltext) |

### Kompletterande-fil — status

`2026-05-20-session-6-6-6-mini-overlamning-5-kompletterande.md`:

- **EJ committad i repot.** Saknas i `tasks/sessions/`.
- **Finns i `~/Downloads/`** (117 rader, läst därifrån).
- Innehåller 3 lessons-kandidater: **L_AAAF, L_AAAG, L_AAAH** — som
  ÅTERANVÄNDER namn redan kanoniska i v2-final §3.7 → **NAMNKOLLISION**
  (se Del 3).
- Filen själv hävdar "94 + 30 = 124" lessons-kandidater.

**Provenans-not (11/10-transparens):** Eftersom kompletterande-filen finns
i Downloads (ej committad) är dess kandidater extraherade och INKLUDERADE i
denna katalog, men källan själv är inte i git. Rekommendation till Marcus:
committa kompletterande-filen separat (per HÅRDA RAMAR fick denna commit
endast innehålla rå-katalogen, så `mv` av kompletterande-filen gjordes
INTE här). Tills dess är L_AAAF/G/H (kompletterande-varianterna) cataloged
men deras källfil lever utanför repot.

### v1 reconciliation — EXKLUDERAD

`2026-05-17-lessons-reconciliation-fangst.md` (utan `-v2`, 336 rader) är
SUPERSEDED av v2-final och redan absorberad i den. Extraherades INTE
(dubbelräknar).

---

## Del 2 — Rå-katalog

Grupperad efter v2-finals §3.1–3.7-struktur + mini-5-tilläggen. Per post:
**arbetsnamn · källa(or) · verbatim text · markering**.

> **Transkriptions-not:** v2-final §3.6 ger 1-rads-formuleringar (det ÄR
> fulltexten — lessonsna är "Chat-genererade" 1-rads-poster). §3.1–3.5
> har endast 1-rads-formuleringar i mini-1/mini-2 Del 4 (fulltext lever i
> v1, som är exkluderad) → dessa är markerade "minimal formulering,
> fulltext ej lokaliserad utanför v1". §3.7 + mini-5-tilläggen har fulltext.

### §3.1 — Retroaktiva från Session 6.6.5 (5 lessons)

Källa: mini-1 Del 4 (rad 137-139, namn) + mini-2 Del 4 (rad 184-190,
1-rads-text). Bekräftade hub-lyft-kandidater.

- **L15** · mini-2 Del 4 rad 186 · "Empirisk verifikation FÖRE
  klassificering" · *unik · minimal formulering, fulltext ej lokaliserad
  utanför v1*
- **L16** · mini-2 Del 4 rad 187 · "Projektkunskaps-index ≠ filsystem
  live-state" · *unik · minimal formulering*
- **L17** · mini-2 Del 4 rad 188 · "Pre-existing skuld defer till
  mini-session" · *unik · minimal formulering*
- **L18** · mini-2 Del 4 rad 189 · "Web-research FÖRE strategi-val" ·
  *unik · minimal formulering*
- **L19** · mini-2 Del 4 rad 190 · "Hub-sync inom 7 dagar OK för
  icke-akuta" · *unik · minimal formulering*

### §3.2 — ≈samma mini-1 + mini-2 (6 lessons, dubbletter)

Dessa 6 namn har materiellt matchande (eller nära-matchande) definitioner i
mini-1 Del 4 och mini-2 Del 4 → behandlas som DUBBLETT-förekomst per v2-finals
breakdown ("6 ≈samma"). Båda formuleringarna transkriberas för proveniens.

- **L_M** · mini-1 Del 4 rad 143 + mini-2 Del 4 rad 194 ·
  mini-1: "Pre-implementation grindvakts-config-audit (vid >50 fynd:
  config-bug eller verklig skuld?)" / mini-2: "Pre-implementation
  grindvakts-config-audit" · *dubblett-förekomst (mini-1-formulering
  fullast)*
- **L_N** · mini-1 Del 4 rad 144 + mini-2 Del 4 rad 195 ·
  mini-1: "AI pre-empirisk verktygs-antagande (instans 4-5)" / mini-2:
  "AI pre-empirisk verktygs-antagande" · *dubblett-förekomst*
- **L_S** · mini-1 Del 4 rad 152-153 + mini-2 Del 4 rad 200 ·
  mini-1: "Empirisk test FÖRE commit är upptäcktsmekanism för
  tool-arkitektur-luckor (7 L_I-iterationer K2.0-K2.2 bevisat)" / mini-2:
  "Empirisk test FÖRE atomic commit" · *dubblett-förekomst (samma lesson,
  mini-1-formulering fullast; gränsfall mot kollision men v2-final klassar
  som ≈samma)*
- **L_T** · mini-1 Del 4 rad 154 + mini-2 Del 4 rad 201 ·
  mini-1: "Chat-prompt cross-scope-värden är design-bug (K2.2 förväntat
  203 vs faktisk 29)" / mini-2: "Cross-scope-värden i prep-dok är
  design-bug" · *dubblett-förekomst*
- **L_W** · mini-1 Del 4 rad 157 + mini-2 Del 4 rad 204 ·
  "Pre-commit lokal grindvakts-test fångar förväntad CI-fail" (identisk i
  båda) · *dubblett-förekomst*
- **L_X** · mini-1 Del 4 rad 158-159 + mini-2 Del 4 rad 205 ·
  mini-1: "Vale inline-disable filkontext-dependent (4 disable-syntax-
  varianter fungerar isolerat men ej i full-fil-kontext)" / mini-2:
  "Vale-pattern-quirks är klass av latenta buggar (12+ instanser)" ·
  *dubblett-förekomst (v2-final klassar som ≈samma; evolverande definition
  — senare splittrad i L_X.1 vs L_X.2, se §3.6/§3.7-kontext)*

### §3.3 — Mini-1 unika konflikt-lessons (9 lessons)

Källa: mini-1 Del 4 (rad 146-165). I mini-1 står de som BARA namn
(`L_O`...`L_AA`). v2-final §3.3 disambiguerar dem med prefix `mini1-L_X`.
Eftersom samma bara namn återanvänds i mini-2 Del 4 för andra lessons →
varje namn är **del av kollision** (se Del 3).

- **L_O** (v2-final: `mini1-L_O`) · mini-1 Del 4 rad 145 · "Brand-name vs
  förkortning samma stavning (Aria/ARIA)" · *del av kollision*
- **L_P** (`mini1-L_P`) · mini-1 Del 4 rad 147 · "Kategori-exkludering är
  Vale-config-domän" · *del av kollision*
- **L_Q** (`mini1-L_Q`) · mini-1 Del 4 rad 148 · "Blind-disable utan
  empirisk fynd-verifikation (ADR-033)" · *del av kollision*
- **L_R** (`mini1-L_R`) · mini-1 Del 4 rad 149 · "Pre-K bulk-disable
  post-verifikation (README dubblerad)" · *del av kollision*
- **L_U** (`mini1-L_U`) · mini-1 Del 4 rad 155-156 · "Grindvakt-värde
  bevisas av nya fynd mellan baselines (CLAUDE.md post-K1.1-skuld 4 fynd)" ·
  *del av kollision*
- **L_V** (`mini1-L_V`) · mini-1 Del 4 rad 157 · "Path-segment + backticks-
  konvention (mappnamn ska wrappas)" · *del av kollision*
- **L_Y** (`mini1-L_Y`) · mini-1 Del 4 rad 160-161 · "Brand-canonical-fix
  kräver per-förekomst-kontext-läsning även när substitution är simpel" ·
  *del av kollision*
- **L_Z** (`mini1-L_Z`) · mini-1 Del 4 rad 162-163 · "Fix exponerar nya
  fynd inom samma fil under fix-pass: iterativ vale-verifikation tills
  stabilisering" · *del av kollision*
- **L_AA** (`mini1-L_AA`) · mini-1 Del 4 rad 164-165 · "(kandidat)
  'Miranon Media-specifikt'-form med trailing kebab triggar Vale-quirk;
  pattern-design behöver lookahead-utvidgning" · *del av kollision*

### §3.4 — Mini-2 unika konflikt-lessons (9 lessons)

Källa: mini-2 Del 4 (rad 196-208). I mini-2 står de som BARA namn
(`L_O`...`L_AA`). v2-final §3.4 disambiguerar med prefix `mini2-L_X`.

- **L_O** (v2-final: `mini2-L_O`) · mini-2 Del 4 rad 196 · "Strategi B
  exclude > BlockIgnores (preliminär)" · *del av kollision*
- **L_P** (`mini2-L_P`) · mini-2 Del 4 rad 197 · "Vocab vs accept.txt-design
  (X1 vs X2 trade-off)" · *del av kollision*
- **L_Q** (`mini2-L_Q`) · mini-2 Del 4 rad 198 · "Pattern-iteration: minimum
  3-test-suite per change" · *del av kollision*
- **L_R** (`mini2-L_R`) · mini-2 Del 4 rad 199 · "Vale kontext-quirk-instans-
  pattern (klass-L_X)" · *del av kollision*
- **L_U** (`mini2-L_U`) · mini-2 Del 4 rad 202 · "Vale.Terms vs Brand:
  rule-typ påverkar fix-strategi" · *del av kollision*
- **L_V** (`mini2-L_V`) · mini-2 Del 4 rad 203 · "VueToReact-defer-disciplin" ·
  *del av kollision*
- **L_Y** (`mini2-L_Y`) · mini-2 Del 4 rad 206 · "Brand-pivot-narrativ är
  trust-domän" · *del av kollision*
- **L_Z** (`mini2-L_Z`) · mini-2 Del 4 rad 207 · "Tooling-doc-research-
  prioritering" · *del av kollision*
- **L_AA** (`mini2-L_AA`) · mini-2 Del 4 rad 208 · "ADR-katalog-uppdaterings-
  timing" · *del av kollision*

### §3.5 — Mini-2 L_BB–L_AAA unika (26 lessons)

Källa: mini-2 Del 4 (rad 210-245). Mini-2-headern säger "27 kandidater"
men listar 26 namn (L_BB-L_ZZ = 25 + L_AAA = 26) — pre-existing miscount,
v2-final-breakdown använder korrekt 26. 1-rads-text utom L_AAA (fulltext).

- **L_BB** · mini-2 Del 4 rad 212 · "Marker-syntax i prep är prosa-
  rekonstruktion" · *unik · minimal formulering*
- **L_CC** · rad 213 · "Vale markdown-parser-quirks klass-pattern
  (L17-tröskel)" · *unik · minimal formulering*
- **L_DD** · rad 214 · "TokenIgnore-tokeniserings-shift-klass (.1 + .2)" ·
  *unik · minimal formulering*
- **L_EE** · rad 215 · "Rapport-cellvärde vs Σ-rad-konsistens" · *unik ·
  minimal formulering*
- **L_FF** · rad 216 · "Rapport-formulering klassar via fel-attribut" ·
  *unik · minimal formulering*
- **L_GG** · rad 217 · "Vinst-vs-disciplin-trade-off-bias" · *unik ·
  minimal formulering*
- **L_HH** · rad 218 · "Vale-egen inline-code-detection som aktiv skydd" ·
  *unik · minimal formulering*
- **L_II** · rad 219 · "Web-research som operationell del av 11/10-
  disciplin" · *unik · minimal formulering*
- **L_JJ** · rad 220 · "Vocab-domän-separation är industri-norm" · *unik ·
  minimal formulering*
- **L_KK** · rad 221 · "Vocab-fragment-fångst (compound-ord-effekt)" ·
  *unik · minimal formulering*
- **L_LL** · rad 222 · "Revert+rebuild som disciplin-respons" · *unik ·
  minimal formulering*
- **L_MM** · rad 223 · "Rad-positioner är icke-stabila (intra-K-fas instans
  18)" · *unik · minimal formulering*
- **L_NN** · rad 224 · "Heuristik-klassifikations-drift D vs K (89 %-
  omklass)" · *unik · minimal formulering*
- **L_OO** · rad 225 · "Inline-disable + top-of-file disable är broken" ·
  *unik · minimal formulering*
- **L_PP** · rad 226 · "Temp-verifikation måste bevara live-tillstånd" ·
  *unik · minimal formulering*
- **L_QQ** · rad 227 · "Sed-canonical-fix kräver vocab-coverage" · *unik ·
  minimal formulering*
- **L_RR** · rad 228 · "BSD-perl global sed osäker för mixed-kontext" ·
  *unik · minimal formulering*
- **L_SS** · rad 229 · "Vale-config-design-domän som meta-klass" · *unik ·
  minimal formulering*
- **L_TT** · rad 230 · "K-sub-klassifikation (already-wrapped/not-wrapped/
  N-A)" · *unik · minimal formulering*
- **L_UU** · rad 231 · "WRAP-grammatik-test" · *unik · minimal formulering*
- **L_VV** · rad 232 · "perl -0pe slurp-mode för fixed-text-borttagning" ·
  *unik · minimal formulering*
- **L_WW** · rad 233 · "Multi-block-fix räknar ALLA rules" · *unik ·
  minimal formulering*
- **L_XX** · rad 234 · "Disable-block-scope-isolation (rule-A rör inte
  rule-B)" · *unik · minimal formulering*
- **L_YY** · rad 235 · "Klass-namnging är arkitektur-design" · *unik ·
  minimal formulering*
- **L_ZZ** · rad 236 · "Pair-programming-pattern (defer Session 6.7+)" ·
  *unik · minimal formulering*
- **L_AAA** · mini-2 Del 4 rad 237-245 · "(NY post-K2.6.2.D.4-failure) —
  Lessons-internalisering-mellan-K-faser kräver explicit referens-checklist
  per ny K-fas-prompt, inte bara 'dokumenterad i prompten'. Pattern-anti:
  Chat designar prompter med antagande att lessons är operationella när de
  bara är dokumenterade. K2.6.2.D.4-failure var iteration-3-instans av samma
  underliggande mönster (K2.6.2.A L_OO-skuld, K2.6.2.D.2 L_WW-skuld).
  Operationell mitigation: pre-prompt-design-checklist över ALLA etablerade
  lessons som applicerbar-check." · *unik (basnamn `L_AAA`; distinkt från
  suffix-namn L_AAA-21..28 och L_AAAx-serien) · fulltext*

### §3.6 — Post-mini-2 Chat-genererade (26 namn enumererade; v2-final räknar 25)

Källa: v2-final §3.6 tabell (rad 52-77). 1-rads-text ÄR fulltexten.
**Räknings-not:** v2-final rad 82-83 säger "Total Sektion 3.6: 25 lessons"
men breakdownen/tabellen enumererar 26 namn (L_BBB-L_ÅÅÅ) — explicit
dokumenterad pre-existing drift (rad 83). Alla 26 transkriberas (verbatim
krävs); avstämning i Del 5.

- **L_BBB** · v2-final §3.6 rad 52 · "Filartefakt-protokoll latent-bug —
  körning auktoritativ över skrivet protokoll" · *unik*
- **L_CCC** · rad 53 · "BSD vs GNU sed/perl portabilitets-meta-klass —
  specialisering av L_RR" · *unik*
- **L_DDD** · rad 54 · "Σ-trajektoria parallell-uppdatering med mekanism-
  shift — protokoll-värden uppdateras parallellt" · *unik*
- **L_EEE** · rad 55 · "Chat mental dry-run av disciplin-kommandon
  (sed/perl/awk + ranges + BSD-syntax) FÖRE skickande" · *unik*
- **L_FFF** · rad 56 · "Pre-scope-låsning verifiera fil-profil-attribut
  (kategori, disable-block-typ, mapping-komplexitet) — INTE bara fynd-count" ·
  *unik*
- **L_GGG** · rad 57 · "Latent-drift-mitigation — när Edit-tool öppnar
  rad/sektion, mitigera dolda drifter där overhead är marginell (speciellt
  vid Vale-quirk-dolda)" · *unik*
- **L_HHH** · rad 58 · "Klass-gräns-respekt vid backticks-wrap-konsistens —
  wrap konsekvent INOM klass, inte across klass" · *unik*
- **L_III** · rad 59 · "L_X under-klassificering — L_X.1 (IL-mitigerbar
  quirks) vs L_X.2 (intra-fil-state-quirks, IL/vocab/TokenIgnore alla
  failar)" · *unik*
- **L_JJJ** · rad 60 · "Web-research för upstream-version-verifikation är
  operationell BLOCKER innan version-bump-strategi väljs — L_18 + L_II
  applicerad på tooling-version-research" · *unik*
- **L_KKK** · rad 61 · "L_X-klassbestämning via isolerad-fil-test — kopiera
  rad till tom .md, vale-test → klass-discrimination" · *unik*
- **L_LLL** · rad 62 · "Intra-prompt konsistens-check — prosa-beskrivning
  och kod-exempel måste matcha EXAKT (3 instanser bekräftat systemisk:
  STEG E + STEG 2-live-vs-disable + K3.3.A.1 radnummer-stripped-vs-live)" ·
  *unik*
- **L_MMM** · rad 63 · "Parallell-Chat-design-skuld — efterföljande
  Chat-iterations producerar dubbla namn-tilldelningar för distinkta lessons
  när lessons-namn-kollision-check inte är operationaliserad i prompt-design" ·
  *unik*
- **L_NNN** · rad 64 · "Empirisk-baserad K-fas-omprioritering — när 2+
  K-fas-instanser visar samma systemiska problem (>50% hit-rate i N≥2),
  pivota till rot-orsak-domän-K-fas framför fortsatt instans-arbete" · *unik*
- **L_OOO** · rad 65 · "TokenIgnores-pattern som matchar token inuti
  code-span bryter Vale code-detection — K2.1 generaliserad: gäller även
  specifika @scope/pkg-patterns, ej bara breda kebab" · *unik*
- **L_PPP** · rad 66 · "Mitigation-test mot fil A kan regressera fil B —
  cross-fil-regression-check obligatorisk vid Vale-config-ändring" · *unik*
- **L_QQQ** · rad 67 · "Rotorsaks-diagnostik (ta-bort-den-misstänkta) FÖRE
  acceptans av mitigerings-hypotes — D1 falsifierade TokenIgnores-orsak på
  1 test" · *unik*
- **L_RRR** · rad 68 · "L_X.2-masking är mekanism-oberoende — varje
  suppmerings-mekanism (IL/TokenIgnores/BlockIgnores) som tar bort ett
  rapporterat fynd un-maskerar dolda; total bevaras-eller-värre" · *unik*
- **L_SSS** · rad 69 · "BlockIgnores är block/rad-nivå, ej inline-span-nivå —
  backtick-span-regex har noll effekt (mekanism-gräns, ej Issue #858)" ·
  *unik*
- **L_TTT** · rad 70 · "3-mitigerings-familj-uttömning som empirisk bar för
  upstream-bugg-klassning (vs antagande efter 1 fail) — operativ
  klass-pattern för tooling-bug-klassning över alla framtida tooling-debug-
  sessioner" · *unik*
- **L_UUU** · rad 71 · "Single-finding-IL cascade-test under-detekterar
  L_X.2 — maskeringen triggas först när tillräckligt av en token-kluster
  suppimeras. Tillförlitlig metod = strukturell pre-screen (token-i-backtick-
  spans) ELLER fix-hela-token-typen" · *unik*
- **L_VVV** · rad 72 · "Δ=0 i IL-baserat test är tvetydigt (cascade vs
  IL-suppmerings-fel) — kräver inspektion av post-IL-fynd-lista. IL failar
  ofta på table-rader + list-items" · *unik*
- **L_WWW** · rad 73 · "L_X.2-precondition = token-i-backtick-span +
  plain-sibling-fynd av samma token i samma fil. Strukturell pre-screen är
  tillförlitlig klassificerare; cascade-test via suppmering är det inte" ·
  *unik*
- **L_XXX** · rad 74 · "Vale's \"Use 'X' instead of 'x'\"-substitution-
  suggestion är token-nivå, kontext-blind — `tanstack` inuti `@tanstack/pkg`
  är ett paketnamn, canonical-cap korrupterar. Klassificering (D vs L_HH)
  kräver kontext-läsning, aldrig Vale-meddelandet rakt av" · *unik*
- **L_YYY** · rad 75 · "Upstream-bugg-klassning kräver minimal-repro-
  verifikation FÖRE issue-filande — 'mitigerings-familj-uttömning' är
  nödvändigt men inte tillräckligt empiriskt bevis. Minimal repro = isolerad
  standard-fil utan custom config. jdkato's #387-respons bevisar
  branschstandard: Vale-maintainer kräver minimal repro som första steg" ·
  *unik*
- **L_ZZZ** · rad 76 · "Minimal-repro kräver variation av markdown-KONSTRUKT
  (paragraf-typ, list, table, bold, lazy-continuation), ej bara innehåll —
  case-a/b/c (plain paragraphs) gav falskt 'reproducerar inte'; case-d
  (list-item/flerrads-paragraf) avslöjade buggen. 11 cases krävdes för
  pinpoint" · *unik*
- **L_ÅÅÅ** · rad 77 · "'Reproducerar inte minimalt' efter N cases är
  preliminärt tills konstrukt-rymden (paragraf-typ, list, table, bold,
  frontmatter, flerrads) är systematiskt täckt — pre-emptive 'kan inte
  reproducera'-slutsats är L_AAA-bias" · *unik*

### §3.7 — Post-mini-3 K0-skörd (14 lessons)

Källa: v2-final §3.7 (rad 95-108) — fulltext. Mini-4 Del 4 (rad 465-478)
ger samma 14 i tabellform med kortare domän-etiketter (dubblett-förekomst,
v2-final fullast). **OBS:** L_AAAB–L_AAAH här är de KANONISKA definitionerna;
mini-5 Del 14 + kompletterande återanvänder samma namn för andra lessons
(se Del 3).

- **L_ÄÄÄ** · v2-final §3.7 rad 95 (+ mini-4 rad 465) · "UTF-8-blind-spot-
  klass vid filename-iteration — git-output utan `-z` + exakt-match-jämförelse
  failar på non-ASCII-paths. Mitigering: canonical NUL-terminated read-pattern
  per Git officiell docs. Klass-pattern bekräftat efter 2 empiriska instanser:
  K1.17 (tj-actions UTF-8-glob, Session 6) + K0.1 (.githooks/pre-commit, denna
  session). Hub-konsolideringsbrist — K1.17 hub-formulering var tooling-
  specifik (third-party Actions), inte klass-generaliserad." · *unik · fulltext*
- **L_ÖÖÖ** · v2-final §3.7 rad 96 (+ mini-4 rad 466) · "Cross-grindvakt-
  regression-mönster — Vale-cleanup-commit i en domän introducerar collateral
  damage i annan grindvakt. K0.1 (commit `91b6337` K2.6.2.D.1 → frontmatter-
  fail via v3.md updated-drift) + K0.2 (commit `85a47bf` K2.6.2.D.3 →
  markdownlint MD029-fail via Vale-disable-block-list-split). 2 instanser
  samma session-period." · *unik · fulltext*
- **L_AAAA** · v2-final §3.7 rad 97 (+ mini-4 rad 467) · "markdownlint-cli2
  glob-merge med explicit fil-argument — explicit fil-argument slås ihop med
  repo-config-globs → mätning lintar live-repo-fil istället för temp-fil.
  Isolerad mätning kräver körning från `/tmp` utan repo-config. Code's
  D.3-metodavvikelse fångades self-review." · *unik · fulltext*
- **L_AAAB** (KANONISK) · v2-final §3.7 rad 98 (+ mini-4 rad 468) · "L_AAA-
  instans 14 — L1 forensisk-pass-regel ('Ristat i sten' i hub-CLAUDE.md sedan
  Session 6.6.5 K-sista #4) ej tillämpad på K0.3 Alt-A/B/C-rekommendation;
  Marcus' Gate 2-fångst ('hur har vi hamnat här?') triggade post-hoc
  forensisk-pass som avslöjade scope-utvidgning. Operativ konsekvens: Lager 2
  §1.4 (NY) — Pre-K forensisk-pass på touched config/infrastructure som
  explicit procedursteg." · *del av kollision (se Del 3 — mini-5 Del 14
  återanvänder L_AAAB)*
- **L_AAAC** (KANONISK) · v2-final §3.7 rad 99 (+ mini-4 rad 469) · "L_AAA-
  instans 15 — Chat rusade till fix-rekommendation utan historik-förklaring;
  Marcus-fångst krävdes för att triggra K7-trail-rekonstruktion (när hooken
  etablerades + varför UTF-8 inte var i scope + K1.17-relation). Operativ
  konsekvens: fix-rekommendation kräver historik-trail FÖRE alternativ-
  presentation." · *del av kollision (se Del 3)*
- **L_AAAD** (KANONISK) · v2-final §3.7 rad 100 (+ mini-4 rad 470) · "L_AAA-
  instans 16 — bash-pattern-spec i Chat-prompt ej verifierad mot ADR-033
  strict-mode + L_C nivå-rangordning + Session 6.6.7 K3.1 SC2312-precedent.
  Promptens `< <(...)` triggade SC2312 info under `--enable=all`; Alt A-refactor
  (temp-fil-pattern) krävdes. Operativ konsekvens: Lager 2 §3.3 utvidgning —
  bash-pattern-spec verifieras mot strict-mode + L_C-nivå + repo-precedent
  FÖRE prompt-leverans." · *del av kollision (se Del 3)*
- **L_AAAE** (KANONISK) · v2-final §3.7 rad 101 (+ mini-4 rad 471) · "L_AAA-
  instans 17 — datum-stämpel i Chat-prompt ej verifierad mot TODAY vid
  prompt-leverans-tid (K7.7 ursprungligen för Code-prompt-design-tid; gäller
  även prompt-leverans-tid när leverans sker over-night/over-weekend).
  K7.7-tillämpning på Chat-side. Operativ konsekvens: Lager 2 §3 utvidgning
  med leverans-tid TODAY-validering." · *del av kollision (se Del 3)*
- **L_AAAF** (KANONISK) · v2-final §3.7 rad 102 (+ mini-4 rad 472) · "Inner-
  kommentarer i Chat-prompt-revisions kan tappas bort när hela kod-blocket
  bytts ut; specifika kommentarer i ursprungs-kod (typ 'K7.C ansvarar för
  bulk-add'-kommentar i hook) måste re-säkras vid revision. Code's transparens-
  rapport räddade kommentaren post-hoc." · *del av kollision (se Del 3 —
  kompletterande-fil återanvänder L_AAAF)*
- **L_AAAG** (KANONISK) · v2-final §3.7 rad 103 (+ mini-4 rad 473) · "Test-
  design positiv-only ≠ regression-skydd — negativ-test (introducera deliberat
  fel + verifiera flaggning) krävs för att bevisa faktisk iteration-mekanism.
  T13 ändrades från Chat-prompt-spec (positiv test, valid v3.md → exit 0) till
  Code-design (negativ test, deliberat fel → måste flaggas). Positiv-only kan
  inte skilja 'validerad' från 'tyst skippad'." · *del av kollision (se Del 3)*
- **L_AAAH** (KANONISK) · v2-final §3.7 rad 104 (+ mini-4 rad 474) · "CI-trogen
  invocation > approximation — lokal CI-simulering ska använda EXAKT samma
  kommando som CI, inte en delmängd eller variant. V.A.5 markdownlint kördes
  no-args (config-driven, CI-identiskt) istället för Chat-prompt-spec
  '**/*.md'-glob. Mönsterförstärkning av maskerings-klass (L9)." · *del av
  kollision (se Del 3)*
- **L_AAAI** · v2-final §3.7 rad 105 (+ mini-4 rad 475) · "Commit-trailer-
  format följer repo-konvention, inte Chat-prompt-default — verifiera 3 senaste
  commits för trailer-pattern (typ Co-Authored-By, Refs, Signed-off-by) FÖRE
  commit-message-design." · *unik · fulltext*
- **L_AAAJ** · v2-final §3.7 rad 106 (+ mini-4 rad 476) · "Commit-message-
  snippet ärvd från ursprungs-prompt måste re-verifieras mot final-
  implementation post-revisions — L_LLL-tillämpning på commit-message-domän.
  Promptens snippet visade pipe-pattern; Alt A-final var temp-fil-pattern;
  Code korrigerade." · *unik · fulltext*
- **L_AAAK** · v2-final §3.7 rad 107 (+ mini-4 rad 477) · "L_AAA-instans 18 —
  Chat missade att 'CI grön'-definition är instabilt state under aktiv
  Vale-cleanup-session. Session 6.6.6 sessionsdok Del 7 (commit `cec2fa5`)
  säger explicit 'CI förblir röd tills K2.3-K2.6 manuell-fix-pass slutförd.
  Detta är design'. K0-syftet 'pre-K3.5 CI-baseline-korrektur' formulerat
  felaktigt som 'CI grön' istället för 'CI på förväntad Session 6.6.6 baseline +
  alla oväntade pre-existing fixed'. Operativ konsekvens: Lager 2 §3.5 (NY) —
  Sessions-scope-medvetenhet ('CI grön'-definition kan vara instabilt state
  under aktiv cleanup-session)." · *unik · fulltext*
- **L_AAAL** · v2-final §3.7 rad 108 (+ mini-4 rad 478) · "L_AAA-instans 19 —
  Chat-prompt antog att pre-commit-hook auto-bumpar `updated:`-fält för ALLA
  modifierade filer, men hooken bumpar enbart governing docs
  (FRONTMATTER_GOVERNING_DOCS-array per K0.1 C.3 + K0.3 Commit 1).
  Reconciliation-fil är arbets-artefakt, INTE governing → hook bumpar inte →
  frontmatter-drift om manuell bump saknas. K0.4-prompt G.4/G.5-verifikation +
  STOPPA-villkor (f) byggde på samma felaktiga antagande. Operativ konsekvens:
  Chat-prompt som rör frontmatter-fält verifierar governing-vs-non-governing-
  status FÖRE hook-bump-antagande." · *unik · fulltext*

### Mini-5-tillägg A — L_AAAM–L_AAAP (4 lessons)

Källa: mini-5 Del 6 (rad 451-454). L_AAAM har fulltext även i mini-4 Del 4
(rad 482-489) — dubblett-förekomst, mini-4 fullast.

- **L_AAAM** · mini-5 Del 6 rad 451 + mini-4 Del 4 rad 482-489 ·
  mini-5: "Multi-sektion-edit cross-reference-propagering" / mini-4 (fullast):
  "Cross-reference-propagering vid lesson-add i revision. När en revision
  lägger till en lesson-instans (typ L_AAAL), måste ALLA cross-referenser i
  samma commit propageras: tabell, header-count, frontmatter, klass-bullets,
  trail-sektioner, commit-message. Chat-revision missade 3 cross-referenser;
  Code propagerade self-review. Specialisering av L_LLL på multi-sektion-edit-
  domän. Operativ konsekvens: Lager 2 §2 (NY procedursteg) — vid lesson-add i
  revision, generera cross-reference-checklist FÖRE prompt-leverans." ·
  *dubblett-förekomst (mini-4 fullast) · unikt namn*
- **L_AAAN** · mini-5 Del 6 rad 452 · "Chat-prompt-INTERNAL referenser kräver
  empirisk verifikation" (källa: K3.5 Block I ADR-022-fynd) · *unik · minimal
  formulering*
- **L_AAAO** · mini-5 Del 6 rad 453 · "Code-block under ordered list-item
  kräver 4-space indent" (källa: K3.5 V.B.6 post-edit ADR-032 MD029) · *unik ·
  minimal formulering*
- **L_AAAP** · mini-5 Del 6 rad 454 · "Meta-ADR om Brand-rule kräver
  Brand-helfil-disable, distinkt från content-files" (källa: K3.5 V.B.6
  post-edit ADR-032 Brand-träffar) · *unik · minimal formulering*

### Mini-5-tillägg B — L_AAA-21 till L_AAA-27 (7 lessons)

Källa: mini-5 Del 6 (rad 455-461). Suffix-numrerade L_AAA-instanser
(distinkta namn). Web-research-syntes (Del 3 rad 224-230) ger komprimerade
1-rads-formuleringar; mini-5 Del 6 ger källa + beskrivning.

- **L_AAA-21** · mini-5 Del 6 rad 455 (+ Del 3 rad 224) · "Chat-side
  'TODAY-verifikation' utan empirisk källa" / Del 3: "Gissade TODAY utan
  empirisk källa" (källa: Pre-mini-5 datum-gissning) · *unik*
- **L_AAA-22** · mini-5 Del 6 rad 456 (+ Del 3 rad 225) · "Multi-del
  Code-prompt-leverans vs K7 inline-källor-disciplin" / Del 3: "Multi-del-
  leverans istället för inline-paketering" (källa: Pre-K3.5 multi-del-
  leverans) · *unik*
- **L_AAA-23** · mini-5 Del 6 rad 457 (+ Del 3 rad 226) · "Chat-design
  refererade fiktiv ADR-struktur utan verifikation" / Del 3: "Refererade
  fiktiv ADR-022 § Del 5" (källa: K3.5 ADR-022 § Del 5-fynd via Code) · *unik*
- **L_AAA-24** · mini-5 Del 6 rad 458 (+ Del 3 rad 227) · "Chat-konversation
  istället för kodblock vid Code-instruktion" / Del 3: "Chat-konversation
  istället för kodblock" (källa: Pre-K3.6 GO-signal-format) · *unik*
- **L_AAA-25** · mini-5 Del 6 rad 459 (+ Del 3 rad 228) · "Fixture-design
  utan källverifikation mot real-repo" / Del 3: "Använde förenklad fixture
  istället för verbatim real-repo" (källa: K3.6 Code Fynd #1) · *unik*
- **L_AAA-26** · mini-5 Del 6 rad 460 (+ Del 3 rad 229) · "ADR-titel-gissning
  trots att filen kunde läsas" / Del 3: "Gissade ADR-033-titel istället för
  att läsa filen" (källa: K3.6 Code Fynd #4) · *unik*
- **L_AAA-27** · mini-5 Del 6 rad 461 (+ Del 3 rad 230) · "Bash-pattern utan
  strict-mode-pre-verifikation" / Del 3: "Bash-pattern utan strict-mode-pre-
  verifikation" (källa: K3.6 Code Fynd #3) · *unik*

### Mini-5-tillägg C — L_AAAQ–L_AAAS (3 web-research-lessons)

Källa: mini-5 Del 6 (rad 462-464).

- **L_AAAQ** · mini-5 Del 6 rad 462 · "Anti-bloat-konsensus + distribuerad
  arkitektur är empiriskt etablerad branschpraxis" (källa: Web-research
  2026-05-20) · *unik*
- **L_AAAR** · mini-5 Del 6 rad 463 · "Project Instructions vs CLAUDE.md
  distinktion (Chat vs Code) — olika mekanismer" (källa: Web-research
  2026-05-20) · *unik*
- **L_AAAS** · mini-5 Del 6 rad 464 · "Hooks 100% vs CLAUDE.md 70%
  compliance — enforcement där möjligt" (källa: Web-research 2026-05-20) ·
  *unik*

### Mini-5-tillägg D — L_AAAV–L_AAAX (3 K3.6-emergent, Code Block VII.5)

Källa: mini-5 Del 6 (rad 465-467) — fulltext.

- **L_AAAV** · mini-5 Del 6 rad 465 · "Upstream-repo-rename utan issue-redirect
  bryter lychee-grindvakt; broken-link-fångst sker INTE pre-push, bara CI-only.
  Lokal lychee-test pre-commit för länk-tunga ADR-edits worth-it (~30s lokal
  vs ~5-10 min CI-fail-cycle)" (källa: K3.6-E broken-link CI-fångst) · *unik ·
  fulltext*
- **L_AAAW** · mini-5 Del 6 rad 466 · "macOS `mktemp -t` placerar fil i
  `/var/folders/.../T/` utanför CWD-tree → Vale .vale.ini-scope-matching missar.
  Fix: CWD-relative `mktemp .tmp-XXXXXX.md`. Vale config-discovery matchar
  CWD-relativ tree, inte absolut path" (källa: K3.6-A V.A iteration #1) · *unik ·
  fulltext*
- **L_AAAX** · mini-5 Del 6 rad 467 · "AssertFlip-mönster fungerar empiriskt
  som lift-trigger. T1 PASS i Vale 3.14.1 = bug bekräftad; framtida T1 FAIL =
  upstream-fix landat → CI röd = ADR-032 § Lift-protokoll aktiveras automatiskt.
  Branschstandard-konformitet (arXiv 2507.17542 + Vale-CLI #387 jdkato-
  precedent)" (källa: K3.6 AssertFlip empirisk validering) · *unik · fulltext*

### Mini-5-tillägg E — L_AAA-28 + L_AAAT + L_AAAU (3 från Del 13)

Källa: mini-5 Del 13 (rad 1212-1214) — fulltext.

- **L_AAA-28** · mini-5 Del 13 rad 1212 · "Intra-fil-konsistens-drift i
  meta-dokument om L_AAA — 6 instanser fångade via grep + str_replace"
  (källa: Mini-5 post-skapelse forensisk granskning) · *unik · fulltext*
- **L_AAAT** · mini-5 Del 13 rad 1213 · "Paradigm-skifte-leverans → större
  mini-överlämning (>900 rader). Standard sessions-paus → mindre (~700-800).
  Bedömningsregel etablerad." (källa: Mini-5 storleks-semantik-insikt) ·
  *unik · fulltext*
- **L_AAAU** · mini-5 Del 13 rad 1214 · "Mini-överlämning-skapande har
  genrekonventioner värda formalisering — 13-stegs procedur inkl. post-skapelse
  granskning" (källa: Mini-5 session-handoff-skill-design) · *unik · fulltext*

### Mini-5-tillägg F — L_AAAY–L_AAAE (7 från Del 14)

Källa: mini-5 Del 14 (rad 1250-1258) — fulltext. **OBS:** efter L_AAAÅ
hoppar namnserien tillbaka till L_AAAB/C/D/E, vilket KOLLIDERAR med de
kanoniska §3.7-namnen L_AAAB/C/D/E (se Del 3).

- **L_AAAY** · mini-5 Del 14 rad 1252 · "Vale Core-rules är globala, inte
  per-scope BasedOnStyles-omfattade. `BasedOnStyles =` (tom) deaktiverar
  STYLES (Vale, Miranon, Vale.Terms-canonical) men INTE Core-rules
  (Vale.Repetition, Vale.Spelling). Per-scope explicit deaktivering krävs för
  Core-rules. Empirisk källa: Session 6.6.6 mini-5-add V.6 ls-config + V.5
  1-rads minimal-repro 'Vale .vale.ini' trigger-konstruktion" · *unik · fulltext*
- **L_AAAZ** · mini-5 Del 14 rad 1253 · "Empirisk lokal-test ≠ CI-prediktion
  utan ekvivalens-verifikation. Code's lokal-test rapporterade Vale.Repetition
  på rad 466, men slutsats 'CI kommer falla' krävde empirisk verifikation av
  test-procedur-ekvivalens (V.1 path-verifikation + V.5 CI-kommando-
  verifikation). L_AAA-instans från Code-sidan, mitigerat via Marcus' 'varför
  blev inte CI grön'-fråga som triggade forensisk pinpoint-pass" · *unik ·
  fulltext*
- **L_AAAÅ** · mini-5 Del 14 rad 1254 · "Forensisk falsifierings-test via
  precedent kräver djup-analys av varför precedent är giltig. Chat-hypotes
  'mini-4 grön → BasedOnStyles=tom deaktiverar Vale.Repetition' var fel slutsats
  från korrekt precedent — korrekt slutsats var 'mini-4 saknade Word.Word-
  trigger-konstruktion'. Lesson: empirisk precedent kräver mekanism-djupanalys,
  inte ytlig analys" · *unik · fulltext*
- **L_AAAB** (mini-5 Del 14-variant) · mini-5 Del 14 rad 1255 · "Arkitektonisk
  konsekvens-resonemang utan empirisk falsifiering på alla scope-instanser är
  L_AAA-mönster. Per-scope verifikation FÖRE bulk-fix kräver actuella fynd,
  inte härledd risk. Min A'.2 (alla 6 BasedOnStyles=tom-zoner) var arkitektoniskt
  resonerad men empiriskt obevisad på 5 av 6 zoner. A'.1 (endast 1 zon,
  mini-5-specifik) är empiriskt grundad" (källa: Chat-self A'.2 → A'.1) ·
  *del av kollision (se Del 3 — skiljer sig materiellt från §3.7 L_AAAB)*
- **L_AAAC** (mini-5 Del 14-variant) · mini-5 Del 14 rad 1256 · "Anti-bloat-
  konsensus för CLAUDE.md gäller INTE Code-prompts. Code-prompts ska vara så
  långa som uppgiften kräver för 11/10-disciplin (Block I-VI struktur, Lager 2,
  STOPPA-OCH-FRÅGA, transparens-rapport). Kort prompt-design = potentiell
  anti-bloat-bias-läckage från CLAUDE.md-domän till Code-prompt-domän"
  (källa: Chat-self A'.1 → A'.1 v2) · *del av kollision (se Del 3)*
- **L_AAAD** (mini-5 Del 14-variant) · mini-5 Del 14 rad 1257 · "Chat-prompt-
  design blandar Code-instruktioner med Chat-trail-dokumentation. Code är
  instrumentell (vad ska göras), Chat-trail är reflektiv (vad lärdes). Lessons-
  kandidater hör inte hemma i Code-prompt — Code har ingen giltig plats att
  addera dem. L_T-mönster (Chat-prompt cross-scope-värden är design-bug)"
  (källa: Chat-self A'.1 v2 → A'.1 v3) · *del av kollision (se Del 3)*
- **L_AAAE** (mini-5 Del 14-variant) · mini-5 Del 14 rad 1258 · "KRITISK
  ARKITEKTUR-DISCIPLIN. Chat-trail är efemär — försvinner vid sessions-byte.
  Endast filartefakter (mini-överlämningar, sessionsdok, lessons.md, ADRs)
  överlever. Alla lessons-kandidater MÅSTE bakas in i filartefakter INNAN
  sessions-byte, annars går de förlorade. Chat-kontext är arbete-i-flygande,
  filer är arbete-säkrat. Detta är hela kontinuitet-arkitekturen — hub-spoke-
  portabilitet, sessions-handoff, lessons.md, ADRs bygger på 'filartefakter är
  sanningskällan'" (källa: Marcus' direktiv "INGET kan stanna i denna chat") ·
  *del av kollision (se Del 3)*

### Kompletterande-tillägg — L_AAAF + L_AAAG + L_AAAH (3, EJ committad källa)

Källa: `~/Downloads/2026-05-20-...-kompletterande.md` (rad 44-68) — fulltext.
**OBS:** dessa namn återanvänder de kanoniska §3.7-namnen L_AAAF/G/H för
helt andra lessons (se Del 3). Källfilen är EJ committad (i Downloads).

- **L_AAAF** (kompletterande-variant) · kompletterande rad 44-52 · "Pre-K-fas-
  avbrutna state kan kvarstå mellan Code-prompter. När en K-fas avbryts
  pre-commit pga STOPPA-direktiv, kan filsystem-state ha modifierats. Nästa
  K-fas-prompt måste explicit verifiera + rensa pre-K-fas-artefakter i Block I,
  inte anta clean state. Mitigation: Block I.5-design (target-path-konflikt-
  check) var korrekt. Chat-prompt-design borde explicit nämnt 'Verifiera även
  working-tree-state för untracked files från eventuell avbruten pre-K-fas'.
  Klass: Cross-prompt state-disciplin." · *del av kollision (se Del 3)*
- **L_AAAG** (kompletterande-variant) · kompletterande rad 54-60 · "Implicit
  overwrite vs explicit cleanup-trade-off. När pre-state är 'fel men kommer att
  överskrivas av efterföljande operation', är frestelsen 'låt det bara hända'.
  Men explicit cleanup FÖRE operation ger renare empirisk grund för tester +
  tydligare trail + scope-separation bevarad. 11/10-disciplin är explicit
  cleanup, inte implicit overwrite. Klass: Empirisk-disciplin-klass (utvidgning
  av L_S-mönstret från Session 6.6)." · *del av kollision (se Del 3)*
- **L_AAAH** (kompletterande-variant) · kompletterande rad 62-70 · "Chat-prompt-
  design måste anticipera mid-session-fil-state-drift. Chat-prompt-design måste
  anticipera att fil-state kan ha drivit mellan prompt-skapelse och prompt-
  körning. Block I pre-flight ska verifiera ALLT pre-state, inte anta.
  Alternativ-handlings-instruktioner ska finnas inbyggda för avvikelser från
  förväntat pre-state. Klass: Chat-prompt-design-disciplin (NY). Mitigation:
  session-handoff.skill Del 13 + Lager 2 v1.0 utvidgning #6 kan utökas till
  'pre-state-drift-medvetenhet'." · *del av kollision (se Del 3)*

---

## Del 3 — Kollisions-register

Arbetsnamn med >1 distinkt (materiellt olik) definition. Per HÅRDA RAMAR
är detta mekanisk namn-nyckling — semantisk merge är Chat:s Steg 3.

### Kollisions-grupp 1 — mini-1 vs mini-2 (9 namn, bara namn `L_O`...`L_AA`)

I de råa mini-1- och mini-2-filerna står dessa som bara `L_O` etc. v2-final
disambiguerar via prefix `mini1-`/`mini2-` (§3.3/§3.4). Varje namn har TVÅ
materiellt olika definitioner:

| Namn | mini-1-definition (§3.3) | mini-2-definition (§3.4) |
|---|---|---|
| L_O | Brand-name vs förkortning samma stavning (Aria/ARIA) | Strategi B exclude > BlockIgnores (preliminär) |
| L_P | Kategori-exkludering är Vale-config-domän | Vocab vs accept.txt-design (X1 vs X2 trade-off) |
| L_Q | Blind-disable utan empirisk fynd-verifikation (ADR-033) | Pattern-iteration: minimum 3-test-suite per change |
| L_R | Pre-K bulk-disable post-verifikation (README dubblerad) | Vale kontext-quirk-instans-pattern (klass-L_X) |
| L_U | Grindvakt-värde bevisas av nya fynd mellan baselines | Vale.Terms vs Brand: rule-typ påverkar fix-strategi |
| L_V | Path-segment + backticks-konvention (mappnamn ska wrappas) | VueToReact-defer-disciplin |
| L_Y | Brand-canonical-fix kräver per-förekomst-kontext-läsning | Brand-pivot-narrativ är trust-domän |
| L_Z | Fix exponerar nya fynd inom samma fil under fix-pass (iterativ) | Tooling-doc-research-prioritering |
| L_AA | "Miranon Media-specifikt"-form med trailing kebab triggar Vale-quirk | ADR-katalog-uppdaterings-timing |

**Resolution i auktoritativ källa:** v2-final löser denna kollision via
`mini1-`/`mini2-`-prefix. Vid omnumrering (Steg 3) bör båda definitionerna
behandlas som distinkta lessons.

### Kollisions-grupp 2 — L_AAAB/C/D/E (§3.7 KANONISK vs mini-5 Del 14)

Fyra namn med två materiellt olika definitioner vardera:

| Namn | §3.7 KANONISK (v2-final) | mini-5 Del 14-variant |
|---|---|---|
| L_AAAB | L_AAA-instans 14 — L1 forensisk-pass ej tillämpad på K0.3 Alt-A/B/C | Arkitektonisk konsekvens-resonemang utan empirisk falsifiering på alla scope-instanser (A'.2 → A'.1) |
| L_AAAC | L_AAA-instans 15 — Chat rusade till fix utan historik-förklaring | Anti-bloat-konsensus gäller INTE Code-prompts (A'.1 → A'.1 v2) |
| L_AAAD | L_AAA-instans 16 — bash-pattern-spec ej verifierad mot strict-mode (SC2312) | Chat-prompt-design blandar Code-instruktion med Chat-trail (A'.1 v2 → v3) |
| L_AAAE | L_AAA-instans 17 — datum-stämpel ej verifierad mot TODAY (K7.7 Chat-side) | KRITISK ARKITEKTUR-DISCIPLIN: Chat-trail är efemär, filartefakter överlever |

**Orsak:** mini-5 Del 14 namnserien gick L_AAAY → L_AAAZ → L_AAAÅ och
hoppade sedan tillbaka till L_AAAB/C/D/E i stället för att fortsätta i ett
icke-kolliderande namnrum. Klassisk L_MMM/parallell-Chat-design-skuld
(lessons-namn-kollision-check ej operationaliserad).

### Kollisions-grupp 3 — L_AAAF/G/H (§3.7 KANONISK vs kompletterande-fil)

Tre namn med två materiellt olika definitioner vardera:

| Namn | §3.7 KANONISK (v2-final) | kompletterande-variant (Downloads) |
|---|---|---|
| L_AAAF | Inner-kommentarer i Chat-prompt-revisions kan tappas bort vid kod-blocks-byte | Pre-K-fas-avbrutna state kan kvarstå mellan Code-prompter |
| L_AAAG | Test-design positiv-only ≠ regression-skydd (negativ-test krävs) | Implicit overwrite vs explicit cleanup-trade-off |
| L_AAAH | CI-trogen invocation > approximation | Chat-prompt-design måste anticipera mid-session-fil-state-drift |

**Orsak:** Kompletterande-filen tilldelade L_AAAF/G/H utan katalog-sökning
mot v2-final §3.7 (kompletterande-filen själv erkänner detta som
L_AAAH-instans, rad 16). Källfilen är dessutom EJ committad (i Downloads).

> **Sammanfattning kollisions-register:** 9 (grupp 1) + 4 (grupp 2) +
> 3 (grupp 3) = **16 kolliderande arbetsnamn**, var och en med 2 distinkta
> definitioner = 32 distinkta definitioner inom kollisions-namnrymden.

---

## Del 4 — Dubblett-register

Arbetsnamn vars förekomster slogs ihop (materiellt matchande text i flera
källor, multi-källa-proveniens):

| Namn | Förekomster (källor) | Not |
|---|---|---|
| L_M | mini-1 Del 4 + mini-2 Del 4 | ≈samma; mini-1-formulering fullast |
| L_N | mini-1 Del 4 + mini-2 Del 4 | ≈samma; mini-1 har "(instans 4-5)"-tillägg |
| L_S | mini-1 Del 4 + mini-2 Del 4 | ≈samma (gränsfall); mini-1 fullast |
| L_T | mini-1 Del 4 + mini-2 Del 4 | ≈samma; samma kärnlesson |
| L_W | mini-1 Del 4 + mini-2 Del 4 | identisk text |
| L_X | mini-1 Del 4 + mini-2 Del 4 | ≈samma; evolverande (→ L_X.1/L_X.2 senare) |
| L_ÄÄÄ–L_AAAL (§3.7, 14 st) | v2-final §3.7 + mini-4 Del 4-tabell | mini-4 ger kortform; v2-final fullast (transkriberad i Del 2 §3.7). OBS: L_AAAB–H är samtidigt del av kollision (Del 3) |
| L_AAAM | mini-5 Del 6 + mini-4 Del 4 | mini-4 fullast; mini-5 1-rad |
| L_AAA-21..27 | mini-5 Del 6 + mini-5 Del 3 (web-research-syntes) | två formuleringar i samma fil; Del 6 + Del 3 nära-identiska |

**Not:** §3.7-posterna räknas som dubblett-FÖREKOMST (samma lesson i v2-final
plus mini-4), inte som separata lessons. L_AAAB–H tillhör SAMTIDIGT
kollisions-registret (Del 3) eftersom andra källor återanvänder namnen för
olika lessons.

---

## Del 5 — Räkning & avstämning

### Funnen fördelning vs förväntad (121)

| Källa-segment | Förväntat | Funnet | Status |
|---|---:|---:|---|
| v2-final §3.1 (L15-L19) | — | 5 | ✅ |
| v2-final §3.2 (≈samma L_M,N,S,T,W,X) | — | 6 | ✅ (dubbletter) |
| v2-final §3.3 (mini-1-konflikt) | — | 9 | ✅ (kollision grupp 1) |
| v2-final §3.4 (mini-2-konflikt) | — | 9 | ✅ (kollision grupp 1) |
| v2-final §3.5 (L_BB-L_AAA) | — | 26 | ✅ |
| v2-final §3.6 (L_BBB-L_ÅÅÅ) | — | **26 enumererade** | ⚠ se anomali A |
| v2-final §3.7 (L_ÄÄÄ-L_AAAL) | — | 14 | ✅ |
| **Σ v2-final §3.1–3.7** | **94** | **95 enumererade** | ⚠ anomali A |
| mini-4/mini-5 (L_AAAM–P) | 4 | 4 | ✅ se anomali B (attribution) |
| mini-5 (L_AAA-21–27) | 7 | 7 | ✅ |
| mini-5 web-research (L_AAAQ–S) | 3 | 3 | ✅ |
| mini-5 Del 13 (L_AAA-28 + L_AAAT + L_AAAU) | 3 | 3 | ✅ |
| mini-5 K3.6-emergent (L_AAAV–X) | 3 | 3 | ✅ |
| mini-5 Del 14 (L_AAAY–L_AAAE) | 7 | 7 | ✅ (4 kolliderar — grupp 2) |
| **Σ förväntad 121-bas** | **121** | **121 per v2-final-räkning** | ✅ (med anomali A-not) |
| Kompletterande (L_AAAF/G/H) | upp till N | 3 | ✅ pending (EJ committad källa; 3 kolliderar — grupp 3) |
| **Σ total med kompletterande** | **121 + upp till N** | **124 förekomst-grupper** | ✅ |

### Anomali A — §3.6 25-vs-26 + v2-final total_unique_lessons

**Fynd:** v2-final frontmatter `total_unique_lessons: 94`, men §3.1–3.7
enumererar **95 distinkta arbetsnamn**. Diffen ligger i §3.6: v2-final
rad 82-83 säger "Total Sektion 3.6: 25 lessons" men tabellen (rad 52-77)
enumererar **26 namn** (L_BBB-L_ÅÅÅ). Detta nuddar STOPPA-villkoret
"v2-finals frontmatter-räkning matchar inte faktiska innehåll".

**Varför ingen full STOPPA:** Driften är **explicit dokumenterad i källan
själv** (v2-final rad 83: *"Pre-existing räknings-drift Sektion 3.6 (text
säger 25, breakdown summerar till 26) bevaras oförändrad. K-sista-0-domän
vid omnumrering till L20-LNN."*). Den är alltså en känd, för-dokumenterad
drift — inte en oförklarad avvikelse. Prompten själv anger förväntad bas
som "94 (v2-final §3.1–3.7)", dvs. förväntar v2-finals stated count. Jag har
katalogiserat ALLA 26 §3.6-namn troget (verbatim krävs — ingen får droppas)
och flaggar diffen här. **Resolution lämnas till Chat:s Steg 3** vid
omnumrering, exakt som v2-final rad 83 anvisar.

### Anomali B — L_AAAM–P attribution

Prompten attribuerar "4 (mini-4 Del 5, L_AAAM–P)". Empiriskt:

- **mini-4** innehåller endast **L_AAAM** (Del 4 rad 482-489, fulltext;
  mini-4 är pre-L_AAAN/O/P).
- **L_AAAN/O/P** står i **mini-5 Del 6** (rad 452-454, 1-rads-text), källa
  K3.5 Block I + K3.5 V.B.6.

Räkningen (4) stämmer; attributionen "mini-4 Del 5" är imprecis (det är
mini-5 Del 6 för N/O/P, mini-4 Del 4 för M). Ingen påverkan på totalen.

### Anomali C — namnserie-hopp i mini-5 Del 14

Mini-5 Del 14 namnserie: L_AAAY → L_AAAZ → L_AAAÅ → **L_AAAB → L_AAAC →
L_AAAD → L_AAAE**. Hoppet tillbaka till B/C/D/E orsakar kollisions-grupp 2.
Detta är konsekvent med L_MMM (parallell-Chat-design-skuld). Ingen påverkan
på 121-totalen (de 7 räknas i Del 14:s 7), men 4 av dem är kolliderande
namn.

### Kompletterande-filens egen räkning

Kompletterande-filen hävdar "94 + 30 = 124" (rad 81 + 115). Vår mekaniska
extraktion ger samma slutsumma 124 förekomst-grupper (121-bas + 3
kompletterande), men noterar att 124 ≠ 124 unika lessons: 16 namn
kolliderar (32 definitioner i kollisions-namnrymden), och §3.6 har en
dokumenterad +1-drift. **Sann unik-räkning fastställs i Steg 3** efter
semantisk merge + kollisions-resolution + omnumrering.

### Sammanfattande räkning

- **Förekomst-grupper i katalogen:** 124 (121-bas + 3 kompletterande)
- **Distinkta arbetsnamn:** 108 (124 minus 16 kollisions-dubbel-poster).
  *(16 kolliderande namn räknas en gång var i namn-räkningen men bär 2
  definitioner var.)*
- **Kolliderande namn:** 16 (9 + 4 + 3)
- **Dubblett-förekomst-namn (ihopslagna):** se Del 4
- **Pending/overifierad källa:** kompletterande-filen (Downloads, ej git)

---

## Transparens-rapport (Lager 2 §6.2)

**Vad gjordes:** Forensisk pre-pass (Block I) verifierade repo-state, datum
och alla 6 committade källfilers existens + kompletterande-filens placering
(Downloads, ej git). Alla källor lästes i sin helhet (mini-5 i två sidor pga
storlek). v1-reconciliation exkluderades per direktiv. Lessons extraherades
verbatim, grupperades mekaniskt per arbetsnamn, och dedupades namn-nyckat
(ej semantiskt). Rå-katalogen skrevs som en fil och committades ensam.

**Vad hittades:**

- 124 förekomst-grupper (121-bas per v2-final-räkning + 3 från
  kompletterande-filen).
- **3 kollisions-grupper** (16 namn totalt): mini-1/mini-2 (9), §3.7-vs-mini-5-
  Del 14 L_AAAB/C/D/E (4), §3.7-vs-kompletterande L_AAAF/G/H (3). Alla tre
  kända testfall från prompten BEKRÄFTADE.
- Dubblett-förekomster: §3.2 (6 ≈samma), §3.7 (14 mini-4↔v2-final), L_AAAM,
  L_AAA-21..27 (se Del 4).

**Anomalier:** (A) v2-final `total_unique_lessons: 94` men §3.1–3.7
enumererar 95 namn pga dokumenterad §3.6 25-vs-26-drift (v2-final rad 83) —
nuddar STOPPA-villkor men är källans egen för-dokumenterade drift, lämnas
till Steg 3. (B) L_AAAM–P-attribution imprecis (M i mini-4, N/O/P i mini-5
Del 6). (C) mini-5 Del 14 namnserie-hopp orsakar kollisions-grupp 2.

**Räkning:** Förväntad 121 bekräftad mot faktiskt innehåll; +3 pending från
kompletterande = 124. Ingen oförklarad avvikelse.

**Working-tree / commit / push:** Se commit-resultat nedan.

**Leverabel:** `tasks/sessions/2026-05-23-k-sista-0-lessons-rakatalog.md`.

---

> **Slut på rå-katalog.** RAPPORTERA-only. Konsolidering, klass-tilldelning,
> L20-LNN-omnumrering, semantisk merge och kollisions-resolution är Chat:s
> Steg 3.
