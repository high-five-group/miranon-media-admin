---
id: TASK-307
title: >-
  Fynd: offline-notis.test.ts (TASK-285.6) kräver CLS exakt 0 vid 390 px — fick
  0,0024 i merge_group och sparkade ut #1857
status: In Progress
assignee: []
created_date: '2026-08-23 12:01'
updated_date: '2026-08-26 08:12'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 559000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S108 resume 7 (2026-08-23 11:17Z): merge_group-körning `32636138454` för `#1857` (kvittots rättelsevarv — rör enbart `supabase/functions/`, `docs/mallar/`, `tests/api/`) föll på `Test suite / Webblasarbeteende`: `tests/webblasarbeteende/offline-notis.test.ts:207` › "TASK-285.6 — layoutförskjutningen vid offline är 0 (AC #2) › 390 px (mobil)" — `expect(cls).toBe(0)`, received `0.002406863042591828`. Tre försök (`×·×··F`), 104 övriga gröna. PR:en sparkades ur kön med konsumerad armering (fjärde läget, CLAUDE.md § Landning); omarmerad 11:59Z. KORTET SKAPAS, LÖSES INTE HÄR — ägs av notis-spåret.

## Bedömning

Ett exakt-noll-krav på ett flyttal mätt i webbläsaren är en flake-magnet: 0,0024 CLS är under varje mänsklig tröskel (Googles "good" är < 0,1) men faller `toBe(0)`. Antingen är testets tröskel fel (ska vara `toBeLessThan(ε)` med ε bokförd mot AC #2:s avsikt), eller så finns en verklig subpixel-förskjutning vid 390 px som AC:t vill fånga — det avgör ägaren, med riggen i `npm run metrics:flake` (CLAUDE.md § Flakighet), inte med ögat.

## Att göra

1. Kör `npm run metrics:flake` mot testet (interfolierad A/B, `--retries=0`) och läs ut n innan något ändras.
2. Om flake: sätt en bokförd tolerans (t.ex. `toBeLessThan(0.01)`) med hänvisning till AC #2 och mätningen; om äkta: hitta källan till förskjutningen vid 390 px.
3. Bokför i `TASK-285.6`/`ADR-121` § Updates vilket.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flake-riggen körd mot offline-notis.test.ts 390 px, n och utfall bokförda
- [x] #2 Testets tröskel eller förskjutningens källa åtgärdad med hänvisning till mätningen; merge_group grön på en oberoende PR efteråt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROTORSAK (mätt, ej gissad — TASK-307, S112 resume 1, 2026-08-26): CI-fällningarna
(#1857 offline-notis:207, #2000/#1992 app-update-banner:381 — bit-identiskt
0.002406863042591828 vid 390 px i alla tre) är INTE ett formfel i notiserna.
`entry.sources[]` från ursprungsdiagnosen (PR #1702) pekade redan uteslutande på
/dev/primitives-demosidans egna <h2>-rubriker (Google Fonts-swap), aldrig
notiskortet. Lokal tidslinjemätning (task307-diag, borttagen scratch-fil) visade
VARFÖR den redan befintliga document.fonts.ready-väntan ändå är otillräcklig:
Vite dev-läge injicerar base.css via ett JS-genererat <style>-element (inga
<link>-taggar), och fonts.googleapis.com-requesten startar på EXAKT samma
millisekund som domcontentloaded (1120 ms i mätningen) — precis förutsättningen
för en dokumenterad FontFaceSet-race (Mozilla bug 1162850; W3C csswg-drafts
#13538) där document.fonts.ready kan fullgöras FÖRE typsnittsbytet.

FIX: `tests/support/mat-cls.ts` (ny, delad matCLS — duplicerad kod i två filer
var självt en del av rotorsaken). Väntar in page.waitForLoadState('networkidle')
FÖRE document.fonts.ready, vilket är oberoende av FontFaceSet-racet (väntar på
att nätverket, inte webbläsarens API, är klart). Lokalt bevisat: med
typsnitts-nätverket artificiellt fördröjt visar document.fonts.status "loaded"
redan innan fonts.ready anropas, så fort networkidle väntats in först.
INGEN tolerans-tröskel vald — rotorsaken är en fixbar race, inte äkta brus.

BEVIS: repeat-each=10 --retries=0 på båda filerna (310/310 gröna, 40/40
CLS-assertioner). Tvåsidigt: ett planterat, DOM-tvingat verkligt skifte
(el.style.bottom flyttad 6 px på en redan målad box) fällde testet
deterministiskt 10/10 (390 px, båda filerna, värden 0.001625637339682397 resp.
0.0014319085375440802) — bevisar att fixen inte har neutraliserat assertionen.

KÄND GRÄNS: CI:s exakta race (Linux, kall nätverkscache) kunde INTE
100-procentigt replikeras lokalt (macOS) trots artificiell nätverksfördröjning.

AC-STATUS (avsiktligt EJ avbockade, se motivering):
- AC #1 (flake-riggen körd): uppdraget instruerade EXPLICIT att INTE köra
  npm run metrics:flake under fleet-last (S112 resume 1-kontexten), och att i
  stället bokföra att riggen är rätt instrument för en EFTERMÄTNING. Gjort:
  repeat-each=10 lokalt (se ovan) i stället — inte samma instrument som AC:t
  bokstavligen kräver. metrics:flake rekommenderas som uppföljning när
  fleet-lasten tillåter.
- AC #2 (åtgärdad + merge_group grön på en oberoende PR efteråt): rotorsaken
  är åtgärdad och källbelagd (denna notering). "merge_group grön efteråt"
  kräver en framtida, oberoende landning — utanför en bygg-agents mandat
  (CI-svansen ägs av orkestreraren). Kan inte avbockas av mig i detta pass.

Oberoende, orelaterad flake observerad (ej i denna diff): 
tests/webblasarbeteende/forberedelseskarm-hojdkedja.test.ts:166 (login-mounting)
föll 1/105 under 8-worker fleet-körning, men 5/5 grönt isolerat — pre-existing
fleet-contention-flake, ej rört av denna PR.

--- Review-rättelse (PR #2009, review-utlåtande risk medel, 2026-08-26) ---
Källcitaten i tests/support/mat-cls.ts rättades efter granskning: Mozilla bug
1162850 och csswg-drafts #13538 var FEL källor (Gecko-specifik/RESOLVED FIXED
i Firefox 41 resp. motsatt riktning — "aldrig uppfylls", inte "för tidigt").
Ersatta med verifierade källor (lästa via WebFetch, citat exakt): w3c/
csswg-drafts#1082 (cross-browser inkl. Chrome — "the promise can resolve
before anything else interesting happens"), WebKit #174030 + #225790
(Safari-specifika, citerade som belägg för bug-KLASSEN, inte en Chromium-bugg).
Rotorsakstexten skriven om "indikerad" i stället för "bevisad" där CI-racet
inte reproducerats lokalt. Tillagt: Playwright dokumenterar networkidle som
DISCOURAGED för test-readiness (citat verbatim) + varför det ändå är rätt val
här (mätförberedelse, ej generell readiness; klassen pinnar inte Google Fonts
och saknar bakgrundstrafik); document.fonts.load() avvisad som alternativ
(risk: tom FontFaceSet-matchning = tyst no-op, W3C CSS Font Loading Module
Level 3s egen algoritm för FontFaceSet.load()). Endast kommentarer ändrade,
ingen kodrad i funktionskroppen (verifierat med git diff).

ESKALERINGSVÄG om symptomet (0,0024-CLS-fällningen) återkommer en TREDJE
gång: pinna Google Fonts (samma mönster som tests/support/fixturvarld/
hermetic.ts, Inter v20) ENBART för mat-cls.ts-helpern — inte för hela
webblasarbeteende-klassen, som medvetet kör mot riktiga typsnitt/nätverk.
En pinnad font eliminerar racet strukturellt men gör att just denna mätning
slutar pröva mot verkliga Google Fonts-förhållanden.

AC #2 avbockad (stangningsbatch 4, 2026-08-26): merge_group gron pa en OBEROENDE PR EFTERAT verifierad. #2010 (stangningsbatch 3, oberoende av #2009s eget innehall) landade i SAMMA kö-batch som #2009 (TASK-307s fix) - bada mergedAt=2026-08-26T07:28:33Z. Starkare bevis an enbart tidsstampel: #2010s merge_group-korning (databaseId 32942402978, conclusion=success) kor pa den readonly-queue-grenen 'gh-readonly-queue/main/pr-2010-c7a96f4d62e3c112979c0c4ef696f05c9043dfaa' - och c7a96f4d... AR EXAKT #2009s egna merge-commit-SHA (verifierat: gh pr view 2009 --json mergeCommit). Det bevisar att #2010s speculative queue-bygge byggdes OVANPA #2009s fix (TASK-307-andringen) och gick igenom gront. KAND DIVERGENS mot uppdraget: uppdragstexten pastod att korningen skulle vara 'skapad efter 07:28Z' - faktiskt skapad 07:22:01Z (fore bada PR:ernas mergedAt). Det ar FORVANTAT for en merge-queue (speculative build sker fore den faktiska mergen, inte efter) - uppdragets tidsstampel-formulering var fel, men den underliggande AC-substansen (gron merge_group pa en oberoende PR som byggde pa fixen) haller och ar starkare bevisad via SHA-matchningen an via tidsstamplar. Kommandon korda: gh pr view 2009/2010 --json mergeCommit,mergedAt ; gh run list --event merge_group --limit 20 --json conclusion,headBranch,createdAt,databaseId ; gh run view 32942402978/32942124862 --json status,conclusion,createdAt,updatedAt,headBranch.

AC #1 lamnas OBOCKAD (stangningsbatch 4): uppdraget instruerade explicit att INTE kora npm run metrics:flake under pagaende 8-agent-fleet-last i denna session. Riggen ar ratt instrument for matningen (CLAUDE.md § Flakighet) men kors medvetet inte nu - eftermatning nar fleeten ar lugn. Se Implementation Notes ovan (2026-08-26, S112 resume 1) for den lokala repeat-each=10-mätningen (310/310 grona) som redan gjorts som substitut, vilket INTE ar samma instrument som AC:t bokstavligen kraver.
<!-- SECTION:NOTES:END -->
