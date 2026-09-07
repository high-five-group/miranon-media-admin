---
id: TASK-431
title: >-
  Fynd: PROD-REGRESSION — långa bilagenamn klipps inte längre på Bilagor-sidan
  (Mer → Bilagor), namnet rinner ut ur kortet; orsak TASK-361 r2:s nya
  etikett-span i Button.tsx saknar min-w-0 och bryter truncate-kedjan
status: Done
assignee: []
created_date: '2026-09-07 16:46'
updated_date: '2026-09-07 18:25'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 759000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Marcus i prod 2026-09-07 (S123 resume 1), verbatim: 'Jag gick in på RIM 1 i Rönninge 12-13 sep, där ligger en bekräftelsebilaga med långt namn, och HELA namnet skrivs ut långt utanför själva kortet!!! Så var det inte förut. Namnet måste ju klippas!!' Forensik (orkestreraren, samma dag): src/components/dokument/DokumentYta.tsx är oförändrad sedan 2026-08-30 och bygger uttryckligen klippningen på min-w-0 i varje flex-led (docblock 'NAMNET TRUNKERAS I STÄLLET FÖR ATT RADBRYTA … min-w-0 på kolumnen, knappen och namn-spannet', rad ~1781; namn-spannet rad ~1905 'min-w-0 truncate'). src/components/primitives/Button.tsx ändrades av TASK-361 (c4c65e40 + ac2143f7, 2026-09-02, PR #2212): r2 renderar children inuti ett NYTT span 'inline-flex items-center justify-center' (rad ~338, 'ETIKETTEN ÄGER MÅTTET, ENSAM') — ett flex-item utan min-w-0 (och utan w-full/max-w-full) mellan knappen och konsumentens truncate-span. Ett flex-item har min-width:auto och kan inte krympa under sitt innehåll, så truncate når aldrig sin gräns och namnet rinner ut. Prod deployades efter 09-02, därav 'så var det inte förut'. Hypotesen är härledd ur diffen, INTE reproducerad — steg 1 är att reproducera hermetiskt. Åtgärd: (1) reproducera i fixturvärlden: DokumentYta (route /mer/dokument) med en bilaga vars namn är längre än kortets bredd, mät med boundingBox att namn-spannets högerkant ligger utanför kortets (rött först); (2) fix i Button.tsx: etikett-spannet får 'min-w-0 max-w-full' (och behåll r2:s invariant att laddläget inte ändrar måttet — kör TASK-361:s befintliga tester); (3) samma test grönt efter fixen (namn-spannets högerkant ≤ kortets, text-overflow synlig via scrollWidth > clientWidth); (4) svep: grep alla Button-konsumenter som skickar truncate/min-w-0-barn (t.ex. AtgardsSida rad ~704, ~1812 om de sitter i Button) och pröva minst två till; (5) mobil viewport 390 px ingår i mätningen. Lotta-blockerare: prioritet HIGH, byggs före allt annat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hermetiskt acceptance-test (fixturvärlden) på /mer/dokument med långt bilagenamn: rött FÖRE fixen (boundingBox: namnets högerkant > kortets högerkant), grönt EFTER, på desktop och mobil 390 px
- [x] #2 Button.tsx: etikett-spannet bär min-w-0 max-w-full; TASK-361:s befintliga tester (laddläget ändrar aldrig måttet) fortsatt gröna, tvåsidigt bevisat
- [x] #3 Svep över Button-konsumenter med truncate-barn bokfört i notes (minst två ytterligare prövade), inga nya överflöden
- [x] #4 DoD-kommandona gröna; hermetik-självtestet grönt för den nya filen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: Reproducerat hermetiskt (dokument-bilagenamn-trunkering.acceptance.test.ts). FORE fix: desktop 1280x800 kort=889px namn=1472.7px (overflod ~584px); mobil 390x844 kort=339px namn=1132.7px (overflod ~794px). EFTER fix: bagge gront, scrollWidth>clientWidth bevisar truncate klipper.

AC2: Button.tsx etikett-spannet fick min-w-0 max-w-full. TASK-361 egen testsvit (button-laddlage-stabil-bredd.test.ts, 4 fall) omkord, gron. a11y/primitives.spec.ts (18 fall) gront, 0 axe violations.

AC3: Sveptes MASKINELLT (python-regex over hela src/**/*.tsx, alla Button-block med truncate). EXAKT EN traff i hela kodbasen (bara buggen som fixas). DIVERGENS: de tva hintade kandidaterna (AtgardsSida.tsx rad ~704, ~1812) sitter INTE i var Button-primitiv (native button resp Checkbox) - verifierat, inte antaget. Minst-tva-kravet kunde inte uppfyllas bokstavligt eftersom fler instanser inte finns; svepet ar uttommande, inte stickprov.

AC4: typecheck EXIT=0, build EXIT=0, check-langa-streck.mjs EXIT=0 (324 filer). biome scopat till mina 5 filer: EXIT=0 efter auto-format (2 formfel fixade). 1 FOREXISTERANDE warning kvar (DokumentYta.tsx suppressions/unused) verifierat identisk i origin/main fore mina andringar. Repo-brett biome EXIT=1 pga 2 errors i tasks/sessions/bilagor/s122-pushback-bank/extrahera-pushbacks.mjs - helt orort av min gren (commit ae55ce11).

test:api: 2300 passed forsta korningen, 3 failed. Omkorning: 2 av 3 grona (flaky: cancel-registration, generate-event-attachment), 1 falls konsekvent 3/3 (send-registration-confirmation GATE-LIVENESS, staging-timeout Request context disposed). Ingen av de tre filerna rors av min diff. Flaggat, ej atgardat (utanfor scope).

hermetik-sjalvtest.mjs scopat till nya filen: EXIT=0 BEVISET HALLER - alla 4 test fallda med OmockadRequestError nar mockarna togs bort.

DEL B (utanfor denna korts AC/DoD - instruerad direkt av orkestreraren, Marcus verbatim-citat, INTE del av kortets ursprungliga formulering): mall-genererade rader visar nu mallnamnet (Bekraftelsebilaga/Deltagarinformation) som rubrik i stallet for filnamnet; fullt filnamn kvar i title-attribut + aria-label; gamla mall-badgen (dubblerade texten) borttagen. Bevisat i 2 nya testfall + 1 befintlig testfil uppdaterad (dokument-event-mallad-inaktuell.acceptance.test.ts, radselektor bytt fran text till title-attribut). Ingen ny AC lagd till pa kortet - bokfort har istallet.

STÄNGNING (S123 resume 1, 2026-09-07): PR #2452 → 790650d5; post-merge 790650d5 GRÖN (hela staging-sviten, efter staging-omdeployen); Vercel prod 790650d5 success 17:58 UTC. Review runda 1 (Sonnet): 1 info (bredd-begränsade Button-konsumenter med ikon+text ej svepta — bedömd CSS-no-op), risk medel (delad primitiv, 64 konsumenter), konvergerad. AC #3 bedömd felställd (premissen 'minst två ytterligare truncate-konsumenter' var falsk — svep över 164 tsx-filer fann exakt en). DEL B (mallnamn som rubrik, Marcus verbatim) byggd utan egen AC, bokfört. Lotta-blockeraren i prod samma kväll. Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
