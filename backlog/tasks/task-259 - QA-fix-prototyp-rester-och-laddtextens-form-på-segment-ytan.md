---
id: TASK-259
title: 'QA-fix: prototyp-rester och laddtextens form på segment-ytan'
status: Done
assignee: []
created_date: '2026-08-17 09:34'
updated_date: '2026-08-24 13:07'
labels:
  - qa-fix
dependencies: []
ordinal: 477000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus QA-fynd 2026-08-17 (249.8, prod): 1) PrototypNot ('Prototyp. Inget sparas, inget skickas') RIVS helt — syns på utskicksvyn, 'Dela upp i grupper', 'Nytt segment' och verkstaden; komponent + alla monteringsställen + dess ljugande docblock. 2) Sök-hjälpraden under publikens sökruta ('Söker i den redan hämtade publiken – kostar inget serveranrop') TAS BORT. 3) Steg 3-texten 'Ge segmentet ett namn först' TAS BORT. 4) 'Räknar personer…'-laddtexten görs professionell: shimmer-/våganimation genom texten (design-tokens, prefers-reduced-motion → statisk text), samma mönster på ytans alla Räknar-texter. Berörda ariaSnapshot-referenser re-genereras ÖPPET med diff-bevis — Marcus beställning är kvittensen (samma form som 249.6-re-låsningen). Acceptance + hermetik-självtest gröna (ingen skip).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla fyra textfynden åtgärdade och shimmern på plats med reduced-motion-fallback
- [x] #2 Berörda aria-referenser re-genererade med diff-bevis; övriga byte-identiska
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGD (bygg-agent, S104). Modell: Opus 5 (1M context), model-ID claude-opus-5[1m] — Marcus-order 2026-08-17, ADR-089-avvikelse mot Sonnet-defaulten.

PREMISS-PASS (ADR-086), tre premisser prövade:
1) 'Kortet landade i PR #1514, MERGED 09:40Z' — SANN (gh pr view 1514: state MERGED, mergedAt 2026-08-17T09:40:31Z, mergeCommit a0c81b58).
2) 'Text-borttagningarna ändrar DOM:en i låsta scope; berörda ariaSnapshot-referenser FÅR re-genereras' — FALSK. DIVERGENS, se nedan.
3) '249.9:s test page.getByText(/Räknar/).toHaveCount(0) ska bestå' — SANN och opåverkad: texten 'Räknar personer…' står kvar, bara dess CSS ändrades.

DIVERGENS (premiss 2): NOLL aria-referenser behövde re-genereras. Mätt i tre steg, inte antaget. (a) grep över hela tests/visual/__aria__/ efter 'Prototyp|Inget sparas|serveranrop|hämtade publiken|namn först|Räknar|Skickar' → exit 1, noll träffar i samtliga 14 filer. (b) grinden grön både före (14 passed, 18,4 s) och efter ändringen (14 passed, 17,6 s). (c) HUVUDBEVISET, som också täcker TILLAGDA noder (default children:'contain' fäller inte på extra syskon): full regenerering med --update-snapshots=all ur levande DOM → 14 passed, och git diff --stat + git status --porcelain över referenskatalogen båda TOMMA. Alla 14 referenser byte-identiska. Orsaken är strukturell: PrototypNot stod utanför varje testid-scope (249.1-ankarkommentarerna), sök-hjälpraden kräver >10 medlemmar (referenserna har 2), 'Ge segmentet ett namn först' kräver tomt namnfält (referenserna har namn ifyllt), och alla sju tester väntar in vantaInRakningar() FÖRE snapshot så ingen laddtext kan finnas i en referens.

FYND 1 — PrototypNot riven: komponenten (VariantD.tsx:1073) + SJU monteringsställen (segment-listan, detaljvyn, verkstaden, generatorn, mallvyn, utskicksvyns BÅDA grenar) + de nio docblock-passager som beskrev den. AtgardsSida.tsx bär en EGEN, likanämnd PrototypNot med annan text ('Mallar. Ämnesrad och brödtext är hårdkodade stubbar') — den ligger utanför segment-ytan och rördes INTE.
FYND 2 — sök-hjälpraden: Input-propen description borttagen (PublikSektion).
FYND 3 — 'Ge segmentet ett namn först.' borttagen (verkstadens steg 3).
FYND 4 — laddvågen: ny CSS-klass .mm-laddtext (base.css) + token --mm-laddtext-vag (components.css). Applicerad på SEX synliga laddtexter: 'Räknar täckningen…', 'Räknar…' (segmentkortet), 'Räknar personer…' ×3 (detaljvyn/verkstaden/mallvyn), 'Räknar grupperna…', samt 'Skickar utskicket…'. EJ applicerad på sr-only 'Räknar publiken…' (osynlig — animation meningslös) eller på knappetiketten 'Skickar…'.

RIKTAD BUGG FÅNGAD AV SKARPMÄTNINGEN: första formen låste gradientens bas till --mm-text-muted. DOM-probe visade att segmentkortets 'Räknar…' ärver text-text-secondary (#525151), inte muted (#6b6b6b) — vågen hade gjort just den raden LJUSARE, tvärtemot kontrast-garantin. Basen är därför currentColor, och genomskinligheten görs med -webkit-text-fill-color (inte color), annars hade currentColor blivit genomskinlig med den. Skarpmätt utfall, båda riktningar: NORMAL {color: rgb(82,81,81), textFillColor: rgba(0,0,0,0), animationName: mm-laddtext-vag, animationDuration: 2.5s, backgroundClip: text, backgroundImage: linear-gradient(90deg, rgb(82,81,81) 0%, rgb(82,81,81) 40%, rgb(36,36,36) 50%, rgb(82,81,81) 60%, rgb(82,81,81) 100%)} · REDUCE (page.emulateMedia) {mqReduce: true, textFillColor: rgb(82,81,81), animationName: none, backgroundImage: none, backgroundClip: border-box}. Mätfilen var en engångsartefakt och är raderad.

GRINDAR: typecheck exit 0 · biome exit 0 · build exit 0 · aria-grind exit 0 (14 passed) · test:api 873 passed + 1 pre-existerande staging-fel (get-person.staging.test.ts:119, 'ZZ-S103-flagga-sentinel' satt i staging-basen där testet väntar null) — DIFFERENTIALMÄTT: samma test fäller identiskt på ren origin/main 83a98b91 utan denna diff (git stash). Rapporterat till orkestreraren, utanför detta korts scope.

ÖVRIGT FYND, ej åtgärdat (ADR-053, blockerar ej): verkstaden bär en kvarvarande MessageBox 'Prototyp - ingenting sparades' (sparNot, VariantD.tsx ~3300). Annan text än PrototypNot och ej namngiven i kortet — rivning vore ett scope-beslut på eget bevåg.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd (Opus), landad och CI-verifierad via merge-kön (259: PR #1534 MERGED 10:58Z · 264: PR #1546 MERGED 12:09Z); Marcus slutkvittens i prod 'Ser bra ut' 2026-08-17. Done-flippad vid S104 session-end.

S112 bokföringspass (2026-08-24): PR #1534 MERGED 2026-08-17T10:58:28Z, CI SUCCESS (gh pr view 1534). DoD #3 bockad mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
