---
id: TASK-59.1
title: 'Skiva: Prefaktorering — fixturvärlden till delad hemvist'
status: Done
assignee: []
created_date: '2026-07-27 20:40'
updated_date: '2026-07-29 11:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-59
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fixturvärlden (handlers mot EF-protokollet, seedad session, frusen klocka, pinnade typsnitt, hermetik-vakten och dess tillgångar) flyttas ut ur sin visual-hemvist till en hemvist som är delad mellan testklasser. De sju visuella spec-filerna följer med i sina imports.

BETEENDET ÄNDE-TILL-ÄNDE: ingenting ändras. En utvecklare som kör den visuella sviten före och efter flytten ska få exakt samma utfall — samma antal tester, samma bilder, noll baseline-avvikelse. Skivan gör nästa skiva enkel; den levererar ingen ny förmåga och ska inte låtsas göra det.

VARFÖR EGEN SKIVA: korrekthetsbeviset är att baselines är oförändrade. Det är ett skarpt mekaniskt påstående som grumlas om flytten buntas med nybygge, och flytten är återställbar ensam.

FÄLLA ATT KÄNNA TILL: snapshot-sökvägarnas mall är byggd på testkatalogen. Spec-filerna flyttar INTE, bara stödmodulerna — men den som frestas flytta även specarna river baseline-sökvägarna. Verifiera mot mallen innan något spec-läge rörs.

Täcker användarberättelser: 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fixturvärldens stödmoduler bor i en hemvist som inte är visual-specifik, och namnet säger att den är delad
- [x] #2 Samtliga sju visuella spec-filer importerar från den nya hemvisten; ingen kvarvarande referens pekar på den gamla
- [x] #3 Den visuella sviten är GRÖN med NOLL baseline-avvikelse — mätt före och efter, inte antaget
- [x] #4 Referenser till den gamla sökvägen i konfiguration och docblock är uppdaterade, så nästa läsare inte skickas fel
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
REN FLYTT — noll beteendeändring, bevisad med mätning före och efter.

VALD HEMVIST: `tests/support/fixturvarld/`. Två skäl. (1) POSITIONEN säger
delad: katalogen är syskon till testklasserna (`visual/`, `e2e/`, `a11y/`,
`api/`, `preview/`), alltså finns inget klass-segment kvar i sökvägen som
kan läsas som ägarskap — och den speglar repots egen `tests/e2e/support/`
en nivå upp, där "en nivå upp" är precis vad klassdelad betyder strukturellt.
(2) NAMNET namnger saken, inte konsumenten: "fixturvärlden" är termen ADR-080,
PRD-59 och modulernas egna docblock redan använder. Alternativet
`tests/fixturvarld/` förkastades — `tests/`-roten bär bara testklasser, och en
katalog utan tester där hade läst som en klass till.

FLYTTAT (git mv, historiken bevarad): fixture-data.ts, handlers.ts,
hermetic.ts, hermetik-vakt.ts + assets/ (7 woff2 + inter.css).
`tests/visual/support/` finns inte längre.

SPECARNA FLYTTADE INTE — snapshot-mallen `{testDir}/__screenshots__/...`
bygger på projektets testDir (`./tests/visual`), så de tolv bilderna behöll
sina sökvägar. Verifierat mot mallen före flytt, och mätt efteråt.

REFERENSER UPPDATERADE: playwright.config.ts (import + två kommentarer) ·
sju visuella spec-filer · hermetik-vaktens felmeddelande (raden som pekar ut
var handlers bor) + spec-assertionen som prövar att en FRÄMMANDE domän inte
får den raden · hermetic.ts docblock-exempel · tests/e2e/support/test-bas.ts
docblock · CONTRIBUTING.md § Visuell regression · T87:s aktiverings-YAML
(kommentarrad i ett block som ska klistras in i ci-suite.yml — framåtriktad
konfiguration, ej historik). Historiska poster (BUILD-LOG, sessionsdok,
research, ADR-080, kort 57/58) lämnades ORÖRDA: de beskriver vad som var sant
då. hermetic.ts bär i stället en bakåtpekare till den gamla hemvisten.

MÄTNING FÖRE/EFTER (`npm run test:visual`):
  före  — 28 passed (18,3 s)
  efter — 28 passed (15,5 s)
  NOLL baseline-avvikelse, bevisad tre vägar: identiskt testantal ·
  md5 på samtliga 24 baseline-PNG oförändrade före/efter ·
  `git status` på tests/visual/__screenshots__ = 0 rader.
  (Tidsskillnaden är körningsbrus, inte en effekt av flytten.)

ÖVRIGA GRINDAR: typecheck 0 fel · biome exit 0, 0 errors (6 warnings +
26 infos, samtliga i orörda filer) · build grön · test:api:pure 208 passed ·
check:docs 9/9 gröna · markdownlint 0 errors på de två rörda .md-filerna.

DoD #5 (zod-fogen) HÅLLER OCH ÄR VERIFIERAD, inte antagen: AirtableAdapter
anropar `.parse()` (kastande) på varje EF-svar via samma scheman som parsar
skarpa svar. Ett fixtursvar som föll på schemat hade kastat och gett felvy
i stället för facit-vy — alltså en baseline-avvikelse. Tolv oförändrade
bilder är beviset. Fogen är dessutom orörd av flytten.

DoD #3 (CI grön per jobb) återstår och ägs av orkestreraren.

BOKFÖRINGS-RÄTTNING 2026-07-29 (S91 femtonde resumen). Kortet stod `Done` med obockad DoD — arbetet var gjort men rutorna aldrig satta.

VERIFIERAT: arbetet är landat på `main`; 7 commits refererar kortet, senast `3cc9edb`. Landningen gick genom merge-grinden, vilket förutsätter grön required check.

INTE OMVERIFIERAT: DoD-posterna om lokala grindar och diff-omfång bockas som BOKFÖRING, inte som ny mätning. De var uppfyllda i sak när kortet stängdes; det som saknades var kvittensen. Att påstå en färsk verifiering hade varit oärligt.

VARFÖR NU: `scripts/check-backlog-closure.sh` grindar från i dag invarianten `Done ⟹ allt avbockat`. Obockad DoD på ett stängt kort är därefter en fällning, inte en tyst avvikelse.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
