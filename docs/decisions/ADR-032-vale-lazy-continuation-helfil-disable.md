<!-- vale Vale.Terms = NO -->
<!-- vale Miranon.Brand = NO -->
<!-- Per ADR-032 (denna fil): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk (Vale.Terms). Miranon.Brand-disable för meta-citat av Brand-pattern (typ "Miranon" → "Miranon Media" som exempel på rule-funktionalitet, ej content-drift). Lift Vale.Terms vid upstream-fix per § Lift-protokoll. -->

# ADR-032: Vale L_X.2 lazy-continuation-quirk — helfil-disable som formaliserad mitigation

- Status: Accepted (Session 6.6.6 K3.5 2026-05-20)
- Datum: 2026-05-20
- Fas: Session 6.6.6 — Vale-cleanup (mellan Fas 2 och Fas 2.5)

## Kontext

Session 6.6.6 K2.6.2.D.4 v2 (2026-05-17) försökte mitigera Vale.Terms-fynd i `tasks/todo.md` och `tasks/lessons.md` via inline-disable + IL-paragraph-disable + dubbel-backtick-wrap. Alla 7 mitigeringsförsök på `todo.md` rad 245 failade. IL-test på `lessons.md` gjorde mätbart värre (12 → 13 fynd). Detta triggade K3-omprioritering (K3 före D.4-rest, L_NNN).

K3.1.b empirisk falsifierings-test (2026-05-17) bevisade systematiskt att tre Vale-mitigerings-familjer alla failar mot ett specifikt quirk-mönster:

| Mitigerings-familj | Mekanism | Test-resultat |
|---|---|---|
| TokenIgnores | Regex-baserad token-exkludering | FALSIFIED — cascade-suppmering träffar inte L_X.2-trigger |
| IgnoredScopes | CommonMark-element-exkludering (`code` etc.) | FALSIFIED — code-spans mis-scopas; element-skipping ger inverterad effekt |
| BlockIgnores | Block-level disable (XPath-likt) | FALSIFIED — triggar inte på inline-cases |

K3.2 strukturell pre-screen (L_WWW) identifierade L_X.2-precondition som **token-i-backtick-span + plain-sibling-fynd av samma token i samma fil**. 5 av 6 D.4/D.5-filer i scope träffade preconditionen.

K3.4 minimal-repro-verifikation (2026-05-17, 11 cases) reproducerade buggen i 4-raders markdown-fil:

- Trigger: flerrads-paragraf med lazy continuation + inline code-span med Vale.Terms-token
- Effekt: Vale mis-scopar inline code-spans → prosa skippas, kod flaggas (inversion av default-beteende)
- Språk-oberoende: case-d6 träffar exakt kolumn 3:30 i både svenska och engelska markdown
- 11 cases krävdes för pinpoint (L_ZZZ: konstrukt-rymden måste varieras systematiskt, inte bara innehåll)

L_JJJ web-research bekräftade Vale 3.14.1 = senaste stabila version. Version-bump-väg är inte möjlig.

## L_X.1 vs L_X.2 — formell distinktion

Två Vale-quirk-klasser dokumenterade empiriskt:

**L_X.1 — IL-mitigerbar quirk.** Vale-quirks där inline-disable (`<!-- vale RULE = NO -->`) eller per-stycke disable fungerar. Lokala mitigeringar räcker. Klass-status: lättare-domän, per-fil eller per-stycke-lösningar tillförlitliga.

**L_X.2 — Intra-fil-state-quirk.** Vale 3.14.1 upstream-bugg där TokenIgnores + IgnoredScopes + BlockIgnores ALLA failar. Trigger: lazy-continuation-paragraf + inline code-span med Vale.Terms-token. Vale mis-scopar inline code-spans → prosa-tokens skippas, code-span-tokens flaggas (invertering av default). Klass-status: helfil-disable är enda deterministiska mitigation tills upstream-fix.

**Strukturell pre-screen-precondition (L_WWW):** L_X.2-risk identifieras pre-implementation som token-i-backtick-span + plain-sibling-fynd av samma token i samma fil. Cascade-test via IL-suppmering är inte tillförlitlig klassificerare (L_VVV); strukturell pre-screen är.

## Beslut

**Helfil-disable formaliseras som mandaterad mitigation för L_X.2-klassade filer tills upstream-fix landar i Vale > 3.14.1.**

### Operativa beslutsregler

1. **Klassificering.** L_X.2-klassificering kräver strukturell pre-screen per L_WWW-precondition. Cascade-IL-test är otillförlitlig.

2. **Mitigation-disciplin.** L_X.2-klassade filer får helfil-disable via topp-av-fil-pattern:

    ```markdown
    <!-- vale Vale.Terms = NO -->
    <!-- Per ADR-032 (Session 6.6.6 K3.5): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->
    ```

3. **Defer-strategi.** L_X.2-klassade filer förblir helfil-disabled tills upstream-fix verifierats landa i ny Vale-version och repo bumpats. Per-fil-state spåras i `tasks/todo.md` "Återkommande disciplin"-sektion.

4. **Lift-protokoll.** När Vale > 3.14.1 publicerats med fix för lazy-continuation-mis-scoping:
   - Bump Vale-version i CI-config (`.github/workflows/ci.yml`)
   - Verifiera upstream-fix via K2.6.2.F minimal-repro test-suite (K3.6, se § Regression-skydd)
   - Per L_X.2-klassad fil: ta bort helfil-disable-block + verifiera prosa rapporteras korrekt + verifiera inga regressioner mot existerande prosa
   - Egen K-fas-leverans i kommande session med atomic-commits per fil

5. **Brand-aktivering bevaras.** Per Alt A (K3.5 design-beslut): content-drift (typ "Miranon" → "Miranon Media") text-fixas FÖRST, sedan helfil-disable. Detta bevarar Brand-rule-aktivering som regression-skydd för framtida content-edits — helfil-disable täcker ENBART L_X.2-strukturell-risk, inte Brand-stilguide.

### Vale-config 4+1-lager-arkitektur (formaliserad i denna ADR)

Vale-config i repo (etablerad via ADR-030 docs-grindvakter + Session 6.6.6 K2.2 atomic config-leverans `cec2fa5`) består empiriskt av fyra mitigerings-lager. Denna ADR formaliserar arkitekturen + adderar 5:e lager för L_X.2-domän. L_X.2-helfil-disable är **5:e lager för L_X.2-domän specifikt**, inte ersättning av lager 1-4. Lager 1-4 hanterar canonical-substitution + brand-enforce + scope-exkludering; lager 5 hanterar specifikt L_X.2-upstream-quirk som ingen av lager 1-4 kan mitigera.

| Lager | Mekanism | Domän |
|---|---|---|
| 1 | exclude-patterns | Fil-/katalog-scope-exkludering (ADR-022 kat 4 frusen-zon) |
| 2 | TokenIgnores | Regex-baserad token-suppmering (L_X.1-domän) |
| 3 | accept.txt-vocab | Canonical-form-substitution (Vale.Terms) |
| 4 | Brand.yml rules | Existence-pattern brand-enforce (Miranon → Miranon Media) |
| **5 (NY)** | **Helfil-disable** | **L_X.2-upstream-quirk-mitigation (denna ADR)** |

## Branschstandard-precedent

Helfil-disable som mitigation för Vale-upstream-quirks är industri-norm för dokumentation-tunga projekt:

| Källa | Position | Relevans för vår fall |
|---|---|---|
| Vale Markdown-docs | Code spans default-ignorerade | Vårt fall distinkt — L_X.2 är mis-scoping-inversion, inte standard-default |
| [Vale CLI Issue #387](https://github.com/errata-ai/vale/issues/387) (jdkato 2021) | "this is not a bug" för Liquid-template-tags-fall | Vårt fall distinkt — vår trigger är CommonMark lazy-continuation, inte template-tags. jdkato (Vale-maintainer) kräver dock minimal-repro som första steg, vilket K3.4 levererat |
| [GitLab MR #88894](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/88894) (2022) | `scope: raw`-fall | Vårt fall distinkt — Vale.Terms är auto-genererad utan scope: raw |
| Vale 3.14.1 (senaste stabila per L_JJJ) | Ingen version-bump-väg | Bekräftar mitigation-strategi över version-bump-strategi |
| Elastic Docs Vale-config | Helfil-disable för specifika filer | Branschledare-precedent |
| GitLab Vale-config | Helfil-disable för specifika filer | Branschledare-precedent |
| Stream Docs Vale-config | Helfil-disable för external-leverans-filer | Branschledare-precedent |

## Lessons-mönsterförstärkning

ADR-032 operationaliserar följande lessons-kandidater (numreras kanoniskt i Session 6.6.6 K-sista-0):

- **L_X.1 vs L_X.2-distinktion** — formell klass-distinktion mellan IL-mitigerbara quirks och intra-fil-state-quirks
- **L_WWW** — strukturell pre-screen som tillförlitlig L_X.2-klassificerare (vs cascade-IL-test som otillförlitlig)
- **L_YYY** — upstream-bugg-klassning kräver minimal-repro-verifikation FÖRE issue-filande (branschstandard per jdkato #387)
- **L_ZZZ + L_ÅÅÅ** — minimal-repro kräver systematisk konstrukt-rymd-täckning, inte bara innehåll-variation
- **L_JJJ** — upstream-changelog-research FÖRE version-bump-rekommendation
- **L_JJ** — branschstandard-research som 11/10-disciplin

## Alternativ övervägda

| # | Alternativ | Varför avvisad |
|---|---|---|
| A | IL inline-disable per fynd (L_X.1-mitigation applicerad på L_X.2) | K3.1.b empirisk: IL failar på L_X.2-trigger. K2.6.2.D.4 v2-test bevisade L_MM rad-shift + L_X IL-quirk-hypotes |
| B | TokenIgnores regex-pattern för affekterade tokens | K3.1.b empirisk: cascade-suppmering träffar inte L_X.2-trigger |
| C | IgnoredScopes CommonMark-element-tillägg | K3.1.b empirisk: code-spans mis-scopas; element-skipping ger inverterad effekt |
| D | BlockIgnores XPath-baserad block-disable | K3.1.b empirisk: triggar inte på inline-cases |
| E | Version-bump till nästa Vale-version | L_JJJ web-research: Vale 3.14.1 = senaste stabila version. Ingen version-bump-väg |
| F | Per-regel-disable (Vale.Terms = NO) bibehåller Brand-aktivering | Mest granulärt men Vale-config-komplexitet ökar; per-regel-disable kan vara fragil vid framtida config-refactor. **Avvisad till förmån för Alt A + helfil-disable** — Brand-aktivering bevaras via FÖRST text-fix av Brand-drift, SEDAN helfil-disable. Per-fil bedömning vid lift-protokoll |
| **G (vald)** | **Helfil-disable per ADR-032 + Brand-text-fix-disciplin FÖRST** | Bevarar content-renlighet; matchar branschstandard (Elastic/GitLab/Stream); mekanisk lift vid upstream-fix; Brand-text-fix FÖRE disable bevarar regression-skydd för content-domän |

## Konsekvenser

**Positiva:**

- 5 K3-PENDING-filer (`tasks/todo.md`, `tasks/lessons.md`, `docs/decisions/ADR-031-*.md`, `docs/research/react-headless-ui-research.md`, `docs/BUILD-LOG.md`) får formaliserad mitigation. CI-baseline återställs till grön efter K3.5-leverans
- Branschstandard-konformitet (Elastic/GitLab/Stream-precedent)
- Lift-protokoll dokumenterad → mekanisk uppstädning vid upstream-fix
- Brand-aktivering bevarad via Alt A (text-fix först-disciplin) → regression-skydd för future content-drift
- L_X.1 vs L_X.2-distinktion etablerad som klass-pattern för framtida Vale-quirks

**Negativa:**

- 5 filer förblir Vale.Terms-disabled tills upstream-fix → content-drift i de filerna fångas inte av Vale.Terms-rule (men fortfarande av Brand + andra rules om de inte är helfil-disabled)
- Risk att framtida sessions glömmer lift-protokollet → mitigeras via K3.6 K2.6.2.F regression-test-suite (verifierar minimal-repro post-upgrade) + `tasks/todo.md` "Återkommande disciplin"-spårning
- Helfil-disable-block adderar 2 rader prosa-overhead per fil

## Regression-skydd

K3.6 K2.6.2.F (kommande K-fas i Session 6.6.6) levererar test-suite som verifierar:

1. Minimal-repro (`case-d4.md` + `case-d6.md` + `.vale.ini`) reproducerar L_X.2-trigger i nuvarande Vale-version (skydd mot tyst "vi tror upstream-fix funkar")
2. Helfil-disable-pattern suppressar L_X.2-fynd korrekt (skydd mot regression i config-design)
3. Brand-rule + andra Vale-rules ej maskerade av helfil-disable (skydd mot Alt F-fragilitet)

K3.6-test-suite blir lift-trigger: när test 1 går från RED (reproducerar) till GREEN (reproducerar inte), upstream-fix har landat → lift-protokoll aktiveras.

## Upstream-issue-spårbarhet

Issue-text färdigställd 2026-05-17 (filartefakt `vale-upstream-issue-L_X2.md` i Marcus' Downloads). Innehåll: TITLE + BODY med 11-case-bisection, mitigation-uttömning (3 familjer falsifierade), engelsk + svensk variant, references (Vale CLI #387, GitLab MR #88894, branschstandard-config-exempel).

Publicering avvaktar Marcus' filande på GitHub vid lämplig tidpunkt. **Issue-URL fylls i denna ADR retroaktivt vid filande** (se placeholder nedan).

**Upstream-issue-länk:** _[Issue-URL fylls i retroaktivt vid Marcus' filande på `errata-ai/vale`-GitHub. Pre-filande-placeholder per K3.5 Alt α.]_

## Spårbarhet

- **Föregångare:**
  - [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) — docs-grindvakter inkl. Vale (rule-aktivering: Brand.yml + accept.txt + Vale.Terms + exclude-patterns)
  - Session 6.6.6 K2.2 atomic Vale-config-leverans (commit `cec2fa5`) — initial mitigation-försök som identifierade L_X.2-klassen; etablerade de 4 lager som denna ADR formaliserar + utvidgar
- **Drivande observationer:**
  - K2.6.2.D.4 v2 failure 2026-05-17 — 7 mitigerings-försök på `todo.md` rad 245 failade
  - K3.1.b empirisk falsifierings-test — 3 mitigerings-familjer alla falsifierade
  - K3.2 strukturell pre-screen — L_WWW-precondition identifierad
  - K3.4 minimal-repro — 11 cases bevisade L_X.2-trigger reproducerar i 4-raders fil
  - K3.4.5 upstream-issue-text — färdigställd 2026-05-17, publicering avvaktar
- **Etablerad:** Session 6.6.6 K3.5 2026-05-20 (sessionsdok [`tasks/sessions/2026-05-14-session-6-6-6.md`](../../tasks/sessions/2026-05-14-session-6-6-6.md))
- **Implementation:**
  - K3.5 ✅ KLAR 2026-05-20 — ADR-032 Draft → Accepted (denna commit + Brand-text-fix commit per Alt A)
  - K3.6 EJ STARTAD — K2.6.2.F regression-test-suite
  - Lift vid upstream-fix — egen K-fas-leverans i kommande session
- **Verifikation:** empirisk via K3.4 11-case minimal-repro (case-d4.md + case-d6.md + .vale.ini bevarade för upstream-issue-bilaga) + K3.6 K2.6.2.F regression-test-suite (kommande)
