---
id: TASK-285.5
title: >-
  Skiva: Chunk-bannern under sidans rubrik — flytt in i skalet, kortning,
  databesked-varningen
status: Done
assignee: []
created_date: '2026-08-21 11:06'
updated_date: '2026-08-22 08:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.1
parent_task_id: TASK-285
ordinal: 520000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när appen uppdaterats medan Lotta hade den öppen och en del av sidan därför inte kan laddas, ser hon ett kort besked direkt under sidans rubrik, i innehållets bredd — inte överst i vyporten över hela skärmen. Det säger 'Sidan behöver laddas om', en mening om varför, att hon bör kopiera osparad text först, och har knappen 'Ladda om'. Det ersätter uppdateringsnotisen, staplas aldrig på den, och annonseras direkt för skärmläsare. Det får förskjuta layout — det blockerar redan arbetet (ADR-121 beslut 3, frekvensargumentet).

FORMEN: familjeformen — ingen kontur, 4 px vänsterkant i varning-färg, tonad bakgrund, rubrik + en mening, knappen högerställd under texten. Facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan chunk-banner har bilder: [] (deklaration: ingen bild låstes; beslut 3 är spec-materia) — bygg mot meddelanderutans låsta form i tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json och ADR-121 beslut 3, och ta skärmdump som bevis i PR:en. Databesked-varningen ('har du skrivit något som inte är sparat, kopiera det först') bor HÄR och ingen annanstans (ADR-121 § 8, Marcus 2026-08-21). role=alert och villkorad montering behålls oförändrade.

PLACERINGEN: chunk-grenen flyttar från den globala roten in i det inloggade skalet som första barn i innehållsytan (main), så den ärver innehållets bredd och hamnar omedelbart före varje sidas h1. Info-grenen (den överlagrade notisen) bor kvar globalt. Konsekvens för testerna: chunk-sviten i webbläsarbeteende-klassen kör i dag mot en dev-sida utanför skalet — komponentens beteende (ersätter, staplas inte; ingen tom alert-region; eventet sväljs inte) prövas fortfarande där via primitiv-sidan, men PLACERINGEN under h1 prövas i acceptance-klassen på en fixtur-vy. Fäller hermetik-självtestet det testet (noll databeteende) är fallbacken en visual-baslinje i härdnings-skivan — skriv vilken väg som togs och varför i PR:en.

Täcker användarberättelser: 5, 6, 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Chunk-bannern renderas som första barn i innehållsytan i det inloggade skalet, före sidans h1, i innehållets bredd — verifierat på minst en fixtur-vy
- [x] #2 Formen följer meddelanderutans facit i tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (ingen kontur, vänsterkant i varning-färg, tonad bakgrund, rubrik, en mening, knapp högerställd) — skärmdump bilagd
- [x] #3 Copyn: rubrik 'Sidan behöver laddas om' utan punkt, en mening, databesked-varningen, knappen 'Ladda om' — inga långa streck; strängarna testade exakt
- [x] #4 role=alert behålls och regionen monteras villkorat; chunk-läget ersätter den överlagrade notisen och lämnar ingen tom alert-region — chunk-sviten grön
- [x] #5 Placeringstestet finns i acceptance-klassen, eller — om hermetik-självtestet fäller det — är fallbacken dokumenterad i PR:en och överlämnad till härdnings-skivan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DoD #6 (ariaSnapshot-paret) lämnas OKRYSSAD, avsiktligt: chunk-bannern gick aldrig igenom en `?variant`-prototyp/konvergens (facit s109-uppdateringsnotis-konvergens.json yta chunk-banner har `bilder: []`, och DESIGN-SYSTEM-SPEC.md §21 säger uttryckligen att ytan "har ingen låst pixel-form") — det finns inget variant-läge att snapshotta FÖRE för att jämföra mot EFTER. N/A, inte glömt.

FYND UTANFÖR SCOPE (rapporterat, inte byggt): TASK-285.7 (#1718, öppen) gör SectionError chunk-medveten via samma src/lib/chunk-laddningsfel.ts-flagga som min ChunkBanner läser. Läst diff av #1718: när en lazy route-chunk faktiskt failar (den vanliga vägen in i detta läge, inte ett syntetiskt testfall) monteras BÅDA samtidigt — min ChunkBanner (global i AppShells main, role=alert, knapp "Ladda om") OCH SectionErrors egen MessageBox intent=error (role=alert, samma knapptext "Ladda om") i Outlet-positionen under. Två samtidigt FYLLDA alert-regioner med identiskt tillgängligt namn — inte bara tomma-region-fallet AC #4/berättelse 15 skyddar mot. Rör INTE SectionError.tsx eller chunk-laddningsfel.ts (utanför mitt kort och explicit förbjudet av uppdraget) — disambiguering är ett designbeslut (vem äger 'Ladda om' vid en chunk-krasch: bannern, sektionsfelet, eller båda med olika text?) som kräver Marcus.

REBAS mot main efter att TASK-285.3 (#1703) landade och gjorde PR #1719 DIRTY (orkestrerarens svep). Kollisionsfilerna var TVÅ, inte en: src/routes/dev/primitives.tsx (textkonflikt, löst — enda konflikten var en import-rad: 285.3 la till AppErrorFallback-importen, jag ChunkBanner-importen, sammanslaget till en gemensam import-sats från @/components/AppShell) och tests/webblasarbeteende/app-chunk-laddningsfel.test.ts (auto-mergad UTAN textkonflikt av git, verifierad semantiskt ändå: 285.3s .first()-scopingar och FEL_BANNER-scopade knapplokatorer förblir korrekta eftersom ChunkBanner renderar null i vilostate och mina egna assertioner redan var scopade till FEL_BANNER-containern).

Kört om brett EFTER rebasen (alla exitkoder mätta separat): typecheck 0, biome 0 (inga nya fynd i min diff), check-langa-streck.mjs 0 (250 filer), build 0, check:docs 0 (14/14), check-facit.sh 0 (12 manifest, 27 ytor, 2 ogodkända). PLAYWRIGHT_WEBBLASARBETEENDE_DEV_SERVER=1 webblasarbeteende --workers=1: 76/76 (inkl. alla 8 chunk-laddningsfel-tester + 285.3s nya app-error-fallback-tester). PLAYWRIGHT_A11Y_DEV_SERVER=1 a11y --workers=1: 110/110 (inkl. scroll-lock.spec.ts 4/4 — .first()-invarianten på h1 håller med ChunkBanner monterad). Acceptance (hem.acceptance.test.ts): 28/28. hermetik-sjalvtest.mjs: 28/28 fällda med OmockadRequestError.

test:api KUNDE INTE re-verifieras fullt ut: staging-preflighten (TASK-77) stoppade api-staging/kontraktsvakt-grenen upprepade gånger — ett post-merge.yml-jobb (run 32491277264, main-SHA 67912bc1-eran) stod kvar som 'in_progress' i GitHub Actions-API:t långt efter att senare post-merge-körningar redan hade completat, vilket fick semaforen (scripts/staging-semaphore.sh) att fortsätta blockera lokala staging-anrop. INGEN override (MM_STAGING_PREFLIGHT=off) användes — guarden är ett medvetet val, inte en bugg, och en override hade race:at mot en pågående CI-verifiering av samma delade Airtable-bas. Bevis att koden ändå är oberörd: (1) FÖRE rebasen körde test:api rent, 930/930 passed, på exakt samma src-diff (rebasen rörde bara primitives.tsx + en testfils dockblock/copy, ingen data-/API-yta). (2) comm -12 mellan min ändrade fil-lista och 285.7s (#1718) ändrade fil-lista gav NOLL överlapp. api-pure-delen (574 tester, ingen staging-beroende) passerade grönt i BÅDA försöken efter rebasen.

STÄNGNINGSPASS (kortstängnings-agent): DoD #1-#5,#7,#8 var redan korrekt bockade i main (PR #1739-passet), DoD #6 lämnades öppen — matchar uppdragets premiss exakt. Adjudikerar tillämpligheten oberoende, inte bara byggagentens/registerpassets påstående: (1) facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json yta chunk-banner har bilder: [] med noten "prototypen visade chunk-bannern OFÖRÄNDRAD (data=chunk) enbart som kontrast ... spec-materia, inte denna prototyps fråga". (2) docs/specs/DESIGN-SYSTEM-SPEC.md rad cirka 1758: "Chunk-bannern har medvetet INGEN egen facit-bild ... Den delar familjens ingen-kontur-regel men har ingen låst pixel-form." (3) gh pr diff 1719: ChunkBanner.tsx återanvänder MessageBox-primitiven (redan promoverad via meddelandefamiljens konvergens, s109-meddelandefamiljen-konvergens/facit.json) ordagrant för formen; variant=1&data=chunk-parametrarna är en DATAVÄG (ADR-103 B2 steg 1: "skarpas DATAVÄGAR behålls ... datakälla, inte form"), inte en formvariant. Ingen egen variant-formgren för chunk-bannern existerar någonstans i kodbasen eller något manifest — kravets förutsättning (variant-läge FÖRE att jämföra mot promoverad EFTER) existerar inte för denna yta. DoD #6 lämnas OBOCKAD, otillämplig. Kortet sätts Done.

(Notera: ett tidigare försök i denna session byggde på en stale lokal worktree-checkout som felaktigt visade DoD #3 som obockad och som drog en falsk slutsats om att jag skulle behöva bocka den — rättat via git reset --hard origin/main innan detta försök. DoD #3 var redan korrekt bockad av PR #1739-passet och rörs inte här.)
<!-- SECTION:NOTES:END -->
