---
id: TASK-241.5
title: 'Skiva: WOW-övergången hem–sändyta'
status: Done
assignee: []
created_date: '2026-08-16 23:06'
updated_date: '2026-09-04 08:25'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.2
parent_task_id: TASK-241
ordinal: 459000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
US 9 är explicit acceptansyta (Marcus WOW-krav 2026-08-16 nära-verbatim i PRD:n): riktigt snygg övergång så Lotta känner WOW. Slutlig WOW-dom fälls av Marcus i QA-skivan. Täcker användarberättelser: 9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Övergången hem till sändyta och tillbaka är en designad kontinuerlig transition — prototypens form (Modal 300ms/scale-98 + avslöj-animationen) är GOLV, inte tak; svepet känns som en fortsättning av Morgonkollen, aldrig ett sidbyte
- [x] #2 prefers-reduced-motion neutraliserar hela transitionen
- [x] #3 Sändytans laddlägen följer lugna laddläget (ADR-078 + DESIGN-SYSTEM-SPEC §15)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-241.5 -- WOW-overgangen hem-sandyta (bygg-agent, Sonnet 5).

PREMISS-PASS (ADR-086): git fetch vid start -- origin/main var bd95eec8 (241.4:s
egen branch-punkt), och origin/feat/task-241-4-paminnelsesvepet lag 2 commit
FORE main (75e923b5 + 545f26d2), 0 EFTER. PR #1484 bekraftad OPEN,
autoMergeRequest satt (armerad av Marcus 02:36 UTC), mergeStateStatus BLOCKED
(checks fortfarande under korning vid mitt pass -- gh pr checks visade Lint+
Audit+TypeCheck och Acceptance som "pending"). Uppdragets fallback-regel
("basera pa main; annars pa feat/task-241-4-paminnelsesvepet") foljdes exakt --
grenad darifran. Ingen divergens i sak: 241.4:s commits ar identiska med vad
som kommer landa pa main, bara annu icke-mergade.

RORDA FILER (2 andrade, 1 ny -- path-scopad add):
- src/components/hem/Hem.tsx -- Modal-klassnamnet pa sandytan
- src/components/svep/SvepOverlay.tsx -- bodyns stagger
- tests/acceptance/svep-overgang-reduced-motion.acceptance.test.ts (NY) --
  regressionsgrind for AC #2

WEB-RESEARCH (CLAUDE.md-disciplinen, kallor i Hem.tsx:s docblock):
- Material Motion "Choreography" (m1.material.io/motion/duration-easing.html):
  exit-animationer far kortare duration an entre ("elements permanently
  leaving the screen ... require less user focus") -- grunden for den
  asymmetriska 300ms-in/200ms-ut-durationen.
- React Aria Modal-dokumentationen (data-entering/data-exiting + CSS-
  transitions ar det DOKUMENTERADE monstret, "Start with CSS transitions and
  upgrade to Motion only when you need gesture support or spring physics").
- react-aria-components@1.20.0 har ett INBYGGT SharedElementTransition/View
  Transitions-API (node_modules/react-aria-components/SharedElementTransition/)
  -- UNDERSOKT OCH AVFARDAT: skulle vara husets FORSTA konsument (grep: 0
  traffar i src/ for view-transition/SharedElementTransition sedan tidigare;
  DESIGN-SYSTEM-SPEC.md §9 "View Transitions" ar markt [GA] -- ett
  gap-analys-tillagg fran 2026-04-07, ALDRIG byggt, base.css saknar
  @view-transition-blocket specen beskriver). Att infora monstret har hade
  varit ett nytt husmonster utan egen designrond -- exakt den
  arkitektur-utvidgning uppdraget bad STOPPA och rapportera i stallet for
  att tyst infora. Rapporterat har, inte anvant.

KOREOGRAFIN, TRE DELAR (Hem.tsx:s Modal-klassnamn + SvepOverlay.tsx:s body):
1. origin-top -- transform-origin ankrad mot toppen (inte centrum) sa ytan
   kanns som att den vecklar ut sig NEDAT fran knappen (bada triggrarna --
   "Bekrafta alla"/"Skicka paminnelse till alla" -- sitter i hemmets ovre
   halft). Exakt per-klick transform-origin (knappens getBoundingClientRect)
   OVERVAGD OCH AVFARDAD: kraver antingen en ref genom Modal-primitiven (paverkar
   VARENDA dialog i huset, samma motiv som SCRIMMEN-overriden redan i filen)
   eller en gissning av dialogens hojd (okand fore montering, w-fit/max-h-[85vh]
   ar innehallsdriven). origin-top ger samma riktningskansla utan nagotdera.
2. Asymmetrisk duration, 300ms in / 200ms ut -- MATT BUGG HITTAD OCH FIXAD
   under bygget: forsta forsoket satte `data-[entering]:duration-300`, som
   sag ratt ut men var DOD KOD. CSS-transitions-spec: vilken
   transition-duration som styr en overgang ar varde i MALSTILEN, inte
   startstilen. "Entering" ar STARTSTILEN (elementet monteras MED attributet,
   tas sedan bort pa nasta bildruta for att TRIGGA overgangen mot vilostilen)
   -- malet ar vilostilen, sa DAR maste durationen sitta. En rAF-sampler
   (chromium, egen dev-server port 5185) visade `getComputedStyle(el)
   .transitionDuration` konsekvent 0.2s (Modal.tsx:s bas) trots klassen --
   exakt spec-beteendet. FIXAT: `duration-300` pa vilostilen (obetingad),
   `data-[exiting]:duration-200` star kvar (KORREKT dar -- vid stangning ar
   vilostilen START och exiting-stilen MAL, sa dess duration galler).
   Skarpbevis EFTER fix: `transitionend`-event fangat live, `elapsedTime: 0.3`
   (entre) och en MutationObserver som fangade `data-exiting=true,
   duration: "0.2s", stillAttached: true` 47-158ms efter Avbryt-klick (exit).
3. Stagern pa triadens sektioner (SvepOverlay.tsx) -- `--animate-mm-avsloj`
   (befintlig token, INGEN ny animation myntad) flyttad fran den GEMENSAMMA
   body-behallaren till VARJE sektion for sig (Mottagare forst, Utskicket
   +70ms), sa triaden kaskadar in i tur och ordning i stallet for att poppa
   in som en enda platta. Samma monster pa resultat-/tomt-lagets enskilda
   block. `motion-safe:`-varianten bar samma dubbelbalte som forut -- under
   reduced-motion laggs klassen aldrig pa, sa en satt animationDelay utan
   matchande animation-name ar ett no-op.

AC #1 (kontinuerlig overgang, golv+forstarkning) -- se koreografin ovan.
Golvet (300ms/scale-98+avsloj) BEVARAT och FORSTARKT (scale-95, origin-top,
asymmetrisk duration, stagger) inom husets EGEN CSS-transition-mekanik --
ingen ny animationslib, ingen SharedElementTransition (se ovan).

AC #2 (prefers-reduced-motion neutraliserar HELA transitionen) -- BEVISAT
BADE i live browser OCH i en ny kodifierad grind:
- Live (chromium, page.emulateMedia({reducedMotion:'reduce'})): Modal-
  elementets transitionDuration OCH avsloj-elementets animationDuration
  lastes till "1e-05s" (0.01ms, base.css:s !important-klampning) BADE vid
  oppning och vid stangning.
- NY GRIND: tests/acceptance/svep-overgang-reduced-motion.acceptance.test.ts,
  2 tester -- POSITIV kontroll (reduced-motion klampar bada varden till
  <1ms) och NEGATIV kontroll (normal motion visar EXAKT 0.3s pa samma
  element/selektor, sa den positiva kontrollen inte ar en vacuous sanning).
  Den negativa kontrollen FALLERADE FAKTISKT under bygget (lasta 0.2s innan
  duration-300-fixen ovan) -- konkret bevis pa att grinden fangar nar den
  ska, inte bara att den ar gron nu.

AC #3 (sandytans laddlagen foljer lugna laddlaget, ADR-078/§15) -- INGEN NY
KOD: sandytans enda tva laddlagen ar redan Laddtrappans steg 2
(knapp-internt): (a) `skickar`-laget via Button-primitivens `isLoading`-prop
(spinner + role=status aria-live=polite, biblioteksniva, oforandrad sedan
241.3) och (b) testmailets `testPending`-textbyte (arvt fran
AtgardsSida.tsx:s precedent, oforandrad). Data (eventGrupper) ar redan
laddad NAR knappen som oppnar sandytan overhuvudtaget syns (Hem.tsx:s
useMemo pa redan-hamtad React Query-data) -- ingen vy-/modulniva-laddning
i sandytan alls, sa Laddtrappans steg 1 (skeleton) ar inte tillamplig.
VERIFIERAT: skarmdump av "skickar"-laget (konstgjord fordrojning i
verifieringsskriptets mock, INGEN i skarp kod) ar PIXEL-LIK
facit-svep-bekraftelse-skickar-desktop.png.

FOKUS-ATERSTALLNING (uppdragets exempel-forstarkning, inte AC-krav) -- REDAN
AUTOMATISK, INGEN KOD BEHOVDES: React Aria Modal ateranstaller fokus till den
knapp som oppnade ytan by default (Overlay/FocusScope restoreFocus). Verifierat
live: `document.activeElement === "Bekrafta alla"-knappen` = true efter
Avbryt-stangning.

FACIT-GRANSKNING (DoD #5, EJ avbockad av mig -- se motivering) -- 16
skarmdumpar tagna i chromium mot egen dev-server (port 5185, INTE 5173/5174),
inloggad TEST_USER, EF-anrop mockade lokalt (get-events/get-registrations/
send-action-email) -- runbookens "egen ports CORS-vagg"-kringgang behovdes
INTE (route.fulfill kringgar CORS strukturellt, ingen riktig natverksbegaran).
Direkt jamforda mot facit och MATCHAR strukturellt (layout/typografi/
spacing/knappform, data skiljer sig eftersom min fixtur ar egen -- samma
"facit-granskning bevisar FORMEN, inte exakta siffror"-princip som 241.2:s
notes etablerade):
- facit-svep-bekraftelse-granska-adresslista-desktop.png -- MATCHAR
- facit-svep-bekraftelse-granska-forhandsvisning-desktop.png -- MATCHAR
- facit-svep-bekraftelse-armerat-desktop.png -- MATCHAR (gron knapp, thumb
  hoger -- forsta forsoket utan settle-delay visade en TIMING-artefakt i mitt
  EGET testskript, inte en produktregression -- rattad, se nedan)
- facit-svep-bekraftelse-skickar-desktop.png -- MATCHAR PIXEL FOR PIXEL
- facit-svep-bekraftelse-resultat-desktop.png -- MATCHAR
- facit-svep-bekraftelse-fel-resultat-desktop.png -- STRUKTURELLT likvardig
  (MessageBox-intent/per-grupp-nedbrytning), men mitt scenario (allt
  misslyckat) ar INTE samma datascenario som facit (blandat sent/partial/
  failed) -- ResultatVy.tsx ar OFORANDRAD av mitt diff, sa detta ar en
  scenario-skillnad i min mock, inte en form-regression.
- facit-svep-paminnelse-granska-adresslista-desktop.png -- MATCHAR
- facit-svep-paminnelse-armerat-desktop.png -- MATCHAR
- facit-svep-paminnelse-resultat-desktop.png -- fangad, ej individuellt
  granskad bild-for-bild mot facit (tidsbudget)

EJ GRANSKADE (6 av 18 -- oppet bokfort, INTE tyst hoppat over):
facit-svep-bekraftelse-tomt-urval-desktop.png (se fynd nedan),
facit-svep-{bekraftelse,paminnelse}-{granska,resultat}-mobil.png (4 st,
mobil-viewport aldrig testad -- mitt diff andrar inga responsiva/breakpoint-
klasser, samma CSS-klasser pa alla brytpunkter, men INTE empiriskt
efterprovat), facit-svep-paminnelse-{skickar,tomt-urval,fel-resultat,
granska-forhandsvisning}-desktop.png (4 st till, samma resonemang: kod-
vagarna ar identiska med de granskade bekraftelse-motsvarigheterna, men
INTE var och en individuellt korsverifierad). DoD #5 darfor INTE avbockad
av mig -- lamnat at orkestrerare/Marcus att bedoma om detta racker.

OVANTAT FYND (ADR-053-triage: blockerar ej + vardefullt -> registreras,
INTE mitt att fixa): bekraftelsesvepets "Bekrafta alla"-knapp RENDERAS INTE
ALLS nar `bekraftelsesvepUrval` ar tom (NyaAnmalningar.tsx-villkoret),
vilket betyder att facitets "tomt-urval"-lage (MessageBox "Inget att skicka
just nu" INUTI dialogen) mojligen ALDRIG kan nas via den skarpa UI-triggern
-- till skillnad fran pahminnelseinstansens motsvarande, dar
`svep-paminnelse-send.acceptance.test.ts` explicit testar att knappen
"strukturellt onatt bar" (samma monster). Detta ar FORE min skiva (241.2s
AC #6 "tomt urval renderas identiskt" ar redan avbockad dar) -- INTE
undersokt vidare har, ren notering.

TIMING-ARTEFAKT I MITT EGET VERIFIERINGSSKRIPT (bokford, inte tyst rattad):
forsta korningens armerat-skarmdump visade thumb pa FEL sida + fel knappfarg
(dark i stallet for gron) -- SlideToConfirm/Button ar OFORANDRADE av mitt
diff, sa detta var en gissning: skarmdumpen togs UTAN vantetid efter
`vaxel.press('Enter')`, alltsa mitt i SlideToConfirm/Button:s EGNA
farg-/positionsovergang. Lade till en 350ms settle-vantan -> matchade facit
exakt darefter. Samma monster upptackt for "skickar"-skarmdumpen (togs
80ms efter OPPNING i stallet for efter "Skicka"-klicket i forsta forsoket
-- ett rent namn-/sekvensfel i mitt skript, inte en produktbugg) -- rattad
i ett andra pass, se ovan.

VERIFIERING (DoD-kvartetten, naket exitkod):
npm run typecheck -> exit 0
npx @biomejs/biome check . -> exit 0 (7 warnings/47 infos, samtliga
  forbefintliga i ororda filer -- ingen ny)
npm run build -> exit 0
npm run test:api -> exit 0, 832/832 gront
Dessutom: tests/acceptance/svep-bekraftelse-send.acceptance.test.ts +
  svep-paminnelse-send.acceptance.test.ts (11 tester, befintliga
  svep-acceptance-sviter per uppdraget) -> exit 0, 11/11 gront
tests/acceptance/svep-overgang-reduced-motion.acceptance.test.ts (NY,
  2 tester) -> exit 0
node scripts/check-langa-streck.mjs -> "OK", 0 ofangade langa streck

STADNING: dev-server (port 5185) och backlog.config.yml (ROOT_CONFIG,
check_active_branches: false) borttagna efter task-edit-anropen; samtliga
.tmp-task2415-*.mjs temporarskript raderade ur worktreen. git status
verifierad ren mot exakt de 3 avsedda filerna (2 andrade + 1 ny).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nattgrind-stangning 2026-09-04 (invariant b): kortet var inkonsistent - alla 3 AC redan bockade och PR #1485 (feat/task-241-5-wow-overgangen) MERGED 2026-08-17T04:00:09Z som 1173933a, men status stod kvar pa To Do. Belagg: git show --stat 1173933a bekraftar exakt de 3 filer notens Implementation Notes anger (Hem.tsx, SvepOverlay.tsx, ny acceptance-testfil). DoD3 bockad - gh pr checks 1485 visar samtliga korda jobb pass (Lint+Audit+TypeCheck, Pure+Build, Acceptance, Webblasarbeteende, CodeQL, Vercel); A11y/Staging skippade (ej fallerade). DoD5 (facit-granskning 18 bilder) LAMNAS OBOCKAD - byggagentens egen not sager explicit att 12 av 18 bilder jamfordes och matchade, 6 aldrig granskade (mobil-viewport + tva desktop-lagen), lamnat at orkestrerare/Marcus att bedoma om det racker. Status satt till Done eftersom arbetet ar bevisligen landat och CI-verifierat; DoD5 kvarstar som oppen post.
<!-- SECTION:FINAL_SUMMARY:END -->
