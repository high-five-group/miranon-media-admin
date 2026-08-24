---
id: TASK-253
title: 'Depbot-major: motion 12.43.0 → 13.0.0 — migrationen får ett hem'
status: To Do
assignee: []
created_date: '2026-08-17 06:44'
updated_date: '2026-08-24 14:44'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 472000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #1490 (Dependabot 2026-08-17). Major-bump = ADR-031 Lager 4: manuell Marcus-review. Hygien-svepet 2026-08-17: inget kort bar migrationsjobbet. Motion-skillen + animationsytor (WOW-övergången 241.5, Sidbytesindikatorn 233) konsumerar biblioteket; v13:s breaking changes okarterade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 v13:s changelog/breaking changes lästa och omfattningen i VÅR kodbas bokförd (vilka animationsytor, vilka API-brott)
- [x] #2 Marcus-beslut: migrera nu eller parkera med motiv + omprövningsdatum
- [x] #3 Vid migrering: DoD-fyran grön + animationsytor verifierade inkl. prefers-reduced-motion
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC1 — v13:s breaking changes + omfattningen i vår kodbas (kartläggning 2026-08-17)

### Huvudfyndet: exponeringsytan är NOLL — `motion` är en oanvänd dependency

`motion` ligger i `dependencies` (`package.json:71`, `^12.43.0`) som DIREKT beroende (`npm ls motion` → inget mellanled), men **ingen fil i repot importerar den**. Mätt, inte antaget:

- `grep -rn "from ['\"]motion" src/` → **0 träffar** (250 `.ts`/`.tsx`-filer i `src/`)
- Dynamiska importer / `require` / `framer-motion` → **0 träffar** (`src/`, `tests/`, `scripts/`)
- Bibliotekets API-namn (`motion.`, `AnimatePresence`, `useAnimate`, `useMotionValue`, `useTransform`, `useScroll`, `useSpring`, `LayoutGroup`, `useInView`, `animate(`, `scroll(`, `MotionConfig`, `useReducedMotion`) → **0 träffar i `src/`**
- `git log -S "from 'motion" --all` → **tomt**: biblioteket har ALDRIG importerats i repots historia
- Beroendet kom in i `fcc6de33 fas 0: projektsetup + tokens` (`git log -S '"motion"' -- package.json`) och har legat oanvänt sedan dess

**Bundle-påverkan: noll, mätt.** `npm run build` (exit 0) → `grep -rl "motion-dom\|framer-motion\|AnimatePresence\|MotionConfig" dist/` = tomt. Positiv kontroll att greppen fungerar: `grep -rl "react" dist/assets` = 13 filer. Vite tar aldrig in den, eftersom den inte är i modulgrafen.

**Diskkostnad (den enda faktiska kostnaden):** `motion` 772K + `motion-dom` 4,5M + `motion-utils` 312K ≈ **5,6 MB** i `node_modules`.

### v13.0.0:s breaking changes (primärkälla)

Källa: [motion CHANGELOG.md](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md), `[13.0.0] 2026-08-05` — hämtad direkt från `raw.githubusercontent.com`, och identisk med det Dependabot citerar i PR #1490:s body.

**Changed (den enda breaking):**

- Removed optional `@emotion/is-prop-valid` dependency in favour of explicit `<MotionConfig isValidProp={isPropValid}>`

**Fixed (icke-breaking):**

- Hardware-accelerated SVG elements correctly apply final style on animation complete
- `AnimatePresence`: Ensure nodes are marked as safe to remove when rendering `propagate` with no `motion` children

**Vår exponering mot den enda breaking-changen: noll.** `npm ls @emotion/is-prop-valid` → `(empty)`; `grep -rn "MotionConfig\|isValidProp\|is-prop-valid" src/ tests/ scripts/ package.json` → 0 träffar.

### Kartläggningstabell per yta

Alla animationsytor kördes mot koden. **Ingen av dem träffar ett motion-API** — samtliga är Tailwind/CSS.

| Yta | Fil | Träffat motion-API | Faktisk mekanik | v13-förändring | Insats |
|---|---|---|---|---|---|
| WOW-övergången (TASK-241.5) | `src/components/hem/Hem.tsx` | **inget** | CSS-transitions, `data-entering`/`data-exiting`, asymmetrisk 300/200 ms | — | **Ingen** |
| WOW-övergången (TASK-241.5) | `src/components/svep/SvepOverlay.tsx` | **inget** | `motion-safe:animate-mm-avsloj` (Tailwind-token) | — | **Ingen** |
| Sidbytesindikatorn (TASK-233) | `src/components/AppShell/Sidbytesindikator.tsx` | **inget** — filen har **noll importer** | `motion-safe:animate-skeleton-shimmer` | — | **Ingen** |
| Förberedelseskärmen | `src/components/AppShell/Forberedelseskarm.tsx` | **inget** | `motion-safe:transition-[width]`, `motion-safe:animate-pulse` | — | **Ingen** |
| Skeleton-primitiven | `src/components/primitives/Skeleton.tsx` | **inget** | `motion-safe:after:animate-skeleton-shimmer` | — | **Ingen** |
| Button (laddspinner) | `src/components/primitives/Button.tsx` | **inget** | `motion-safe:animate-spin` | — | **Ingen** |
| SlideToConfirm | `src/components/primitives/SlideToConfirm.tsx` | **inget** | `motion-safe:transition-[left]` | — | **Ingen** |
| Entréanimationen | `src/main.tsx` | **inget** | `motion-safe:animate-mm-tona-in` | — | **Ingen** |
| ToggleButtonGroup | `src/components/primitives/ToggleButtonGroup.tsx` | **inget** | `motion-safe:transition-[background-color]` | — | **Ingen** |
| Övriga 31 filer med `motion-safe:` | (40 filer, 101 träffar totalt i `src/`) | **inget** | Tailwind `motion-safe:`-varianten | — | **Ingen** |

**Ordet `motion` i kodbasen är Tailwinds `motion-safe:`-variant och CSS-mediefrågan `prefers-reduced-motion` — inte biblioteket.** Det är den förväxling som gjorde att kortet antog en konsumtion som inte finns.

### Särskild notering: prefers-reduced-motion-vägarna berörs INTE

Uttryckligen prövat, eftersom AC3 pekar ut det:

- 29 rader `prefers-reduced-motion` i 23 filer under `src/`, plus den globala neutraliseringen i `src/styles/base.css:313–314` — **samtliga går via CSS/Tailwind**, inte via biblioteket
- Bibliotekets egna reduced-motion-vägar (`useReducedMotion`, `<MotionConfig reducedMotion>`) används **inte någonstans** (0 träffar)
- Regressionsgrinden `tests/acceptance/svep-overgang-reduced-motion.acceptance.test.ts` (från TASK-241.5) importerar `msw`, `zod`, domänscheman och acceptance-basen — **ingen motion-import**; den bevisar CSS-vägen

**Slutsats:** en v13-bump kan strukturellt inte röra reduced-motion-beteendet, eftersom biblioteket inte deltar i det.

### Divergenser mot uppdragets/kortets premisser (premiss-pass, ADR-086)

1. **"Animationsytorna (WOW-övergången 241.5, Sidbytesindikatorn 233) konsumerar biblioteket" — FALSKT.** Ingen av dem importerar `motion`. TASK-241.5:s egen commit (`5c164bcb`) säger tvärtom rakt ut: *"inom husets egen CSS-transition-mekanik (data-entering/data-exiting, **inget nytt bibliotek**)"* — och avfärdade dessutom medvetet react-aria-components' `SharedElementTransition`. `Sidbytesindikator.tsx` har noll importrader överhuvudtaget.
2. **"Motion-skillen … konsumerar biblioteket" — kategorifel + fel plats.** Skillen ligger i `/Users/marcus/.claude/skills/motion/` (**användar-global, alla projekt**), inte i repot — `find` över repot ger noll träffar. En agent-skill är instruktionsmaterial, inte en runtime-konsument av ett npm-paket; den kan inte skapa migrationsyta. Skillen ska ligga kvar (den bär andra projekt) — men dess existens är inget belägg för att detta repo använder biblioteket.
3. **Kortets ram "migrationen får ett hem" bygger på en migration som inte finns.** Det finns noll kod att migrera.

### PR #1490 som datapunkt (ej rörd)

`gh pr checks 1490`: **allt grönt eller skippat** — Acceptance (hermetisk) pass 11m44s, Pure + Build pass 36s, Webblasarbeteende pass 1m19s, Lint + Audit + TypeCheck pass 1m53s, Vercel pass. `mergeStateStatus: CLEAN`, `isDraft: false`, state OPEN. Diffen rör **endast** `package.json` + `package-lock.json`. Grönt CI är här ett svagt positivt besked: det bekräftar att inget bryts, vilket är väntat när noll kod importerar paketet.

### Rekommendation (UNDERLAG — beslutet är Marcus, AC2)

Kortet erbjuder två alternativ; kartläggningen pekar på ett tredje som inte fanns i ramen.

**A) Migrera nu (merga #1490)** — riskfri men verkningslös. Bumpar ett paket ingen importerar; noll bundle-effekt. Kostar en merge, tystar Dependabot tills v14.

**B) Parkera med motiv** — lämnar 5,6 MB oanvänt beroende kvar plus återkommande major-brus i Lager 4 (ADR-031 manuell review) vid varje ny major.

**C) Ta bort `motion` ur `dependencies` helt — REKOMMENDERAS som utgångspunkt för Marcus beslut.** Skälen är mätta, inte tyckta:

- Aldrig importerad i repots historia; inkom som fas 0-setuprest (`fcc6de33`)
- Noll bundle-påverkan att förlora, 5,6 MB installationskostnad att vinna
- Husets animationsdoktrin är uttalat CSS/Tailwind `motion-safe:` — 101 träffar i 40 filer — och TASK-241.5 avvisade aktivt att införa nytt animationsberoende
- Tar bort hela klassen framtida Dependabot-majors för ett paket vi inte använder
- Återinförande är billigt om ett framtida behov uppstår (`npm i motion`) — och skulle då börja på v13+ i stället för att ärva en v12-rest

**Om C väljs:** stäng #1490 med `@dependabot ignore this dependency` och landa borttagningen som eget kort. **Om C avvisas** (t.ex. för att biblioteket är avsett för kommande animationsarbete) är **A** bättre än B — bumpen är gratis och håller resten färsk.

**Caveat att väga in:** jag har inte prövat om något planerat kort förutsätter `motion` (t.ex. kommande WOW-/prototyparbete). Den frågan ligger utanför AC1 och är en premiss för AC2-beslutet.

### Grindar körda

- `npm run build` → **exit 0** (använd för bundle-mätningen ovan)

Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Marcus-beslut (AC#2): alternativ (B) — ta bort paketet (motion). Kortets egen alternativ-bokstav skiljer sig från TASK-252:s: här är borttagningen ALTERNATIV (C) i kortets AC1-kartläggning ('Ta bort motion ur dependencies helt — REKOMMENDERAS'), inte (B); mandatets 'alternativ B' läses därför som SAKINNEHÅLLET (borttagning), inte bokstaven, eftersom de två korten numrerar sina alternativ olika. Skäl (ur AC1-kartläggningen ovan): 0 källfiler importerar motion i repots hela historia (git log -S), 0 bundle-påverkan, samtliga animationsytor (WOW-övergången, Sidbytesindikatorn m.fl.) går via Tailwinds motion-safe:/CSS — kortets egen ursprungspremiss att de 'konsumerar biblioteket' var falsifierad redan i AC1-passet. Beslutskriteriet (AC#2) bockas här. Själva borttagningen (paketets faktiska removal ur package.json/package-lock.json + '@dependabot ignore this dependency' + stängning av PR #1490) utförs av en PARALLELL agent i samma S112-mandatpass, inte av detta kort/denna landning — noll kod ändras härifrån. AC#3 ('Vid migrering: ...') gäller inte längre bokstavligt: beslutet är BORTTAGNING, inte migrering, och AC#3:s text ger ingen uttrycklig grund för att låta en systerkorts/parallell-PR:s arbete räknas som fullbordande av DENNA korts DoD. Status lämnas därför TO DO i väntan på att borttagningen landar — flippas inte till Done i detta pass. Rapporteras till orkestreraren för uppföljning.

## Borttagning genomförd (2026-08-24, S112 mandatpass beslut 5 — Marcus-mandat alternativ B)

Premiss-pass (ADR-086): grep av 'from motion'-importer över src/, tests/, playwright/, scripts/ omkört före åtgärd (kombinerat med TASK-252:s grep i samma körning) → 0 träffar (bekräftar AC1:s fynd, ingen divergens). PR #1490 verifierad OPEN/CLEAN/dependabot innan stängning.

Åtgärd: npm uninstall @tanstack/react-table motion (delat kort-par TASK-252/253, en operation). package.json/package-lock.json diff är minimal — enbart de två raderna borta, inga orelaterade ändringar.

Grindar (fulla DoD-fyran, mätta exitkoder): npm run typecheck exit 0, npx @biomejs/biome check . exit 0, npm run build exit 0, npm run test:api (staging) — första körningen stoppades av staging-preflighten (post-merge.yml körning 32738556092 höll staging, väntade ut den cirka 11 min); andra körningen 1163 passed / 1 failed (generate-event-attachment.staging.test.ts, Bilagor-radräkning 34 till 35 — delad-stagingfixturkollision, orelaterad till borttagningen); isolerad omkörning av exakt det testet: 2 passed. npx audit-ci --config audit-ci.jsonc exit 0 (extra krav i uppdraget).

Bundle-bevis: grep efter motion-dom/framer-motion/AnimatePresence/MotionConfig i dist/ efter build gav 0 träffar (kontrollgrep mot 'react' gav träffar, så metoden fungerar). prefers-reduced-motion-vägarna är CSS/Tailwind-baserade (kartlagt i AC1) och strukturellt opåverkade av borttagningen.

AC3-tolkning (flaggad, ej blockerande): kriteriet är ordagrant skrivet för alternativ A (Vid migrering: DoD-fyran grön plus animationsytor verifierade) men beslutet blev alternativ C i kortets egen bokstavering (borttagning, kallad alternativ B i uppdragstexten — se avvikelse nedan). Bockat eftersom den underliggande avsikten, DoD-fyran grön, är uppfylld, och animationsytorna är vakuöst opåverkade (0 konsumenter). AC2 (beslutskriteriet) rörs INTE av denna leverans — annan agent äger den rutan.

Avvikelse mot uppdragstexten (ADR-086, ej blockerande): uppdraget kallade åtgärden 'alternativ B i TASK-252/TASK-253'. I TASK-252:s egen bokstavering är borttagning B (matchar). I TASK-253:s egen bokstavering är borttagning C (Marcus rekommenderade C i AC1-noten, B är där 'parkera med motiv'). Bokstaven stämmer alltså inte för TASK-253, men den konkreta instruktionen i uppdraget (npm uninstall) var entydig och oberoende av bokstaven, och matchar TASK-253:s egen C-rekommendation. Genomfört enligt den konkreta instruktionen.

Not: npm uninstall konverterade denna worktrees symlänkade node_modules till en riktig katalog (npm reify tog bort symlänken). Huvudrepots node_modules overifierat orört (kontrollerat filsystem-tidsstämpel).

Commit-referens: se PR (fylls i separat commit strax innan push).

Commit-referens (uppdaterad): c735bb35b2f9a222e257b8360701033132305bb0 (chore(deps): ta bort oanvända @tanstack/react-table + motion).
<!-- SECTION:NOTES:END -->
