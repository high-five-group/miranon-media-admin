---
id: TASK-285.5
title: >-
  Skiva: Chunk-bannern under sidans rubrik — flytt in i skalet, kortning,
  databesked-varningen
status: To Do
assignee: []
created_date: '2026-08-21 11:06'
updated_date: '2026-08-21 14:09'
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
- [ ] #3 CI grön per jobb på pushad commit
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
<!-- SECTION:NOTES:END -->
