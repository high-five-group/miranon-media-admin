---
id: TASK-283.4
title: 'Skiva: Facit amenderas — låset sätts om mot den nya formen'
status: To Do
assignee: []
created_date: '2026-08-21 08:55'
updated_date: '2026-08-22 16:18'
labels:
  - ready-for-human
dependencies:
  - TASK-283.3
parent_task_id: TASK-283
ordinal: 513000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Facit amenderas så att den låsta ytan beskriver den yta som faktiskt finns.

DENNA SKIVA FÅR INTE PLOCKAS SOM EN VANLIG POST I KÖN. Den är spärrad bakom Marcus visuella godkännande av bokstavsraden, och ordningen är enkelriktad.

ÄNDE TILL ÄNDE: Marcus tittar på den färdiga raden i den körande appen. Godkänner han den — och FÖRST då — regenereras promoverings-grindens sex referenser, och hans ord skrivs in i facit-manifestet som en daterad amendering som beskriver vad som lagts till och vad som lämnats orört. Därefter är låset satt igen, mot den nya formen.

VARFÖR ORDNINGEN INTE FÅR KASTAS OM: låt bygget regenerera referenserna själv och låset återställs av samma arbete som bröt det. Då kan det per definition aldrig fånga den förändring det finns för. Detta är väg A av tre, valt av Marcus 2026-08-21; den generella mekaniken för att amendera ett stämplat facit saknas fortfarande i repot och är en egen öppen tråd.

Det röda fönster som öppnades i skiva två stängs här. Skivan är inte klar förrän samtliga sex referenser är gröna igen.

Täcker användarberättelser: inga nya — säkrar formen som skiva 2 och 3 byggde.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har SETT den färdiga bokstavsraden i körande app och godkänt den i klartext
- [x] #2 FÖRST därefter regenereras promoverings-grindens sex ARIA-referenser
- [ ] #3 Facit-manifestet tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json bär en daterad amendering med Marcus citat, som säger vad som lagts till och vad som lämnats orört
- [x] #4 Samtliga sex referenser är gröna igen — det röda fönstret från skiva 2 är stängt
- [x] #5 Regenereringen ligger i EGEN commit, aldrig i samma landning som formändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-manifestet amenderat med Marcus citat FÖRE ARIA-referenserna regenereras (ADR-102 väg A, T157)
- [ ] #6 Personlistans rad- och listform granskad mot facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — bokstavsraden är ett TILLÄGG ovanför listan och rör inget låst formbeslut
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ÖVERLÄMNING FRÅN TASK-285.11 (2026-08-22, S109 resume 3) — visual-baslinjen hör hit.

TASK-285.11 kunde inte ta sin AC #4 (visual-baslinje för notis, offline, chunk-banner, meddelanderutan) utan att samtidigt skriva om personlistans pixel-lås. Skälet är mätt: visual-baselines.yml kör hela sviten med --update-snapshots, personer.spec.ts bär fyra baselines (två linux), och TASK-286.3 (1b226272) har redan ändrat personlistans sortering. TASK-283.2 ändrar samma yta igen.

Att ta baslinjen före denna skiva vore samma felklass som detta korts egen text förbjuder på struktur-axeln: låset får inte återställas av arbetet som bröt det.

DENNA SKIVA BÄR DÄRFÖR TVÅ LÅS, INTE ETT:
1. ariaSnapshot-referenserna (kortets ursprungliga scope) — sex referenser, brutna sedan TASK-286.3
2. Pixel-baslinjerna — notisfamiljens fyra ytor (TASK-285.11 AC #4) plus personlistans egna

Båda regenereras EFTER Marcus godkännande av den färdiga formen, aldrig före. En dispatch, ett granskningstillfälle.

FÖRKRAV ATT MÄTA FÖRE DISPATCH: 'Allow GitHub Actions to create and approve pull requests' är en tre-nivåers kedja (enterprise → org → repo) som slogs AV när repot flyttades till org 2026-07-27. Utan den failar workflowen på gh pr create (empiriskt: run 30079692827, run 30292488425). Se visual-baselines.yml filhuvud. Mät den INNAN dispatchen avfyras — inte mitt i.

---

RÄTTELSE 2026-08-22 — punkt 1 ovan sade tidigare 'brutna sedan TASK-286.3 OCH VIDGADE AV TASK-283.2'. Andra halvan är falsifierad, mätt av TASK-283.2:s bygg-agent med samma kommando på samma maskin:

  main före skivan:  10 passerade, 6 fällda
  efter skivan:      10 passerade, 6 fällda

SAMMA sex fall båda gångerna (listläget + två ?variant=-degraderingar × två vyporter). Bokstavsraden tillför NOLL nya fällningar. Mekanismen: toMatchAriaSnapshot matchar PARTIELLT — extra syskonnoder tolereras så länge referensens egna noder står i samma inbördes ordning. Raden är en sådan nod; de sex fallen fäller på ORDNING (sentinel-flytten i TASK-286.3), aldrig på tillägget. TASK-283.2:s eget AC #10 påstod samma sak och är också falsifierat.

DEN EGENTLIGA SKULDEN ÄR SKARPARE, INTE MILDARE: alla sex referenserna saknar numera bokstavsraden och beskriver inte längre ytan. De är GRÖNA MEN OFULLSTÄNDIGA — ett svagare lås än det Marcus stämplade 2026-08-10, och svagheten syns INTE i en röd grind. En regression i raden fångas av ingenting.

Konsekvens: regenereringen av de sex referenserna är inte en reparation av något rött, utan en ÅTERSTÄLLNING AV LÅSETS TÄCKNING. Den får inte hoppas över för att grinden råkar vara grön.

---

VERKTYGSFÄLLA, mätt 2026-08-22: 'npm run bl -- task edit <id> --notes' ERSÄTTER hela notes-sektionen, den lägger inte till. Rättelsen ovan raderade först både denna överlämning och TASK-283.2:s egen kortkommentar; båda återställda ur git (8ebfab2c). Läs alltid ut befintlig notes och skicka in den kompletta texten.

---

UTFÖRT 2026-08-22 (TASK-283.4:s bygg-agent) — regenereringen är gjord.

MARCUS GODKÄNNANDE, VERBATIM: "Ser ju skitbra ut! Bra jobb Claude!" — sagt efter att han sett den färdiga bokstavsraden i körande app (localhost:5173/personer, main a7dd94c5). AC #1 därmed uppfylld, och kortets enkelriktade ordning hållen: FÖRST hans ord, DÄREFTER regenereringen.

REGENERERINGSVÄGEN, och varför den vanliga flaggan INTE räckte:

  npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts --update-snapshots=all

Playwrights '--update-snapshots' utan värde har preset 'changed' (mätt: npx playwright test --help), som bara skriver om en referens som FÄLLER. Fyra av de sex passerade PARTIELLT utan att innehålla bokstavsraden och skrevs därför inte om:

  --update-snapshots (changed): 2 av 6 filer omskrivna
  --update-snapshots=all:       6 av 6 filer omskrivna

Hade standardflaggan använts vore fyra referenser kvar i sitt gröna-men-ofullständiga läge, och kortets egen rättelse (ÅTERSTÄLLNING AV LÅSETS TÄCKNING) obetald utan att någon grind visat det. Detta är kortets kärnpoäng, mekaniskt bekräftad.

GRINDENS UTFALL:
  före  (main a7dd94c5, om-mätt): 10 passerade, 6 fällda (exit 1)
  efter (regenererat):            16 passerade, 0 fällda (exit 0)

De sex fällda före var exakt de bokförda: listläget + ?variant=a + ?variant=z, på båda vyporterna.

TVÅSIDIGT BEVIS — täckningen är återställd, inte bara grön: en provokation som döpte om 'Visa personer som börjar på Ö' i tomlägets referens FÄLLDE grinden (exit 1). Före regenereringen kunde samma provokation inte fälla någonting, eftersom referensen inte innehöll raden alls. Provokationen är återställd.

REGEX-MÖNSTREN ÖVERLEVDE, och det var inte givet. De nio text-regexarna (mönstret \d+ dagar sedan) plus status-regexen (Visar \d+ av \d+ personer) är handskrivna sedan den ursprungliga låsningen (301d17af, 2026-08-10). Playwright bevarade dem i stället för att skriva literaler — räknat efteråt bär båda listlage-referenserna fortfarande 9 text-regexar och sin status-regex. Hade de rivits vore låset en generation svagare på en axel ingen bett om.

RAD- OCH LISTFORMEN ÄR ORÖRD, mekaniskt mätt i stället för resonerat: listblocket extraherades ur referensen före och efter, sorterades och jämfördes med diff — exit 0 på båda vyporterna. Nodmängden inuti list "Personer" är byte-identisk. Ingen nod tillagd, borttagen eller omdöpt; bara sentinel-radens POSITION skiljer (TASK-286.3:s redan bokförda ändring).

SIDOFILERNA (ADR-102 § A3, klass (c)) — alla fyra uppdaterade med Marcus citat + datum:
- AMENDERING-2026-08-22-bokstavsraden-ovanfor-listan.md (TASK-283.2) — OMSTÄMPLING BEGÄRD
- AMENDERING-2026-08-22-tomma-bokstaver-nedtonade.md (TASK-283.3) — OMSTÄMPLING BEGÄRD
- AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md (TASK-286.3) — OMSTÄMPLING BEGÄRD
- AMENDERING-2026-08-22-task-286-2-referenser.md (TASK-286.2) — se DIVERGENS nedan

Var och en säger vad som lagts till (bokstavsraden / nedtoningens disabled-markör / sentinel-positionen / referens-uppdateringen) OCH vad som lämnats orört (de fem låsta formbesluten, listans nodmängd, regexarna, pixel-baslinjerna). Samtliga bär de sex referensernas nya sha256 i klartext, så bokföringen är maskinläsbar den dag ytan deklarerar 'referenser'.

DIVERGENS MOT UPPDRAGET, bokförd (ADR-086): uppdraget sade att SAMTLIGA fyra sidofiler säger "väntar Marcus omstämpling". Mätt med grep: bara TRE gör det. Den fjärde, AMENDERING-2026-08-22-task-286-2-referenser.md, är klass (b) — Marcus väg B-beslut, stämpeln 2026-08-10 behålls med avsikt — och saknar helt en Omstämplings-läge-sektion. Att skriva om den till "omstämpling begärd" hade omklassat hans beslut från (b) till (c). Den fick i stället ett tillägg som säger att dess klassning STÅR FAST, att ytan stämplas om av de tre ANDRA amenderingarnas skäl, och att dess § Föreslagen inbakning därmed blir överspelad när den nya stämpeln landar.

AC #3 LÄMNAD OBOCKAD, med avsikt. Dess bokstav ("facit-manifestet ... bär en daterad amendering") är strukturellt omöjlig för en agent: ADR-102 § A3 slår fast att en 'amendering'-nyckel i JSON:en "inte är en möjlig form" (check-facit T25 FÄLLER på den), och deny-facit-godkand-skrivning.sh fryser hela det stämplade manifestet. Min halva — sidofilerna med citat, datum, tillagt och orört — är klar. Manifest-halvan kräver Marcus omstämpling i hans egen !-kanal:

  npm run facit:godkann -- --pass s90-personlistan-konvergens --citat "Ser ju skitbra ut! Bra jobb Claude!" --ersatt

Kortet kan därför inte stängas förrän han kört den. facit.json och godkand är ORÖRDA av denna landning (git diff --stat på filen: tom; godkand står kvar på 2026-08-10 / "Ser bra ut, godkänner").

PIXEL-BASLINJERNA (låset 2 i överlämningen ovan) är INTE tagna här — de föds i CI via workflow_dispatch mot visual-baselines.yml, aldrig lokalt, och är ett separat moment efter denna landning. Förkravet är mätt av orkestreraren: can_approve_pull_request_reviews: true.

GRINDAR, exitkoder mätta separat: test:visual (grinden) 0 · check-facit.sh 0 · check:docs 0 (14 gröna) · biome 0 · typecheck 0. Diffen rör INGEN src/-fil, så check-langa-streck.mjs är inte tillämplig. test:api ej körd — känd främmande röd på main (13 i api-staging, TASK-284-spåret).
<!-- SECTION:NOTES:END -->
