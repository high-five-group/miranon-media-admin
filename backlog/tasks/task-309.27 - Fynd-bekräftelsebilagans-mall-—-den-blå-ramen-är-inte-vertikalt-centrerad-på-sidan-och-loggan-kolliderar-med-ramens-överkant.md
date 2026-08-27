---
id: TASK-309.27
title: >-
  Fynd: bekräftelsebilagans mall — den blå ramen är inte vertikalt centrerad på
  sidan och loggan kolliderar med ramens överkant
status: To Do
assignee: []
created_date: '2026-08-26 03:06'
updated_date: '2026-08-27 15:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 593000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), skarp PDF utan vattenstämpel, ordagrant: 'Loggan ligger i överkant nästan PÅ den blåa ramen OCH den blåa ramen är inte helt centrerad på pappret, så om du flyttar upp den blåa ramen lite så den är centrerad så löser det nog båda problemen.'

VAR: förlagan docs/mallar/bilagor/bekraftelsebilaga.html (Marcus-granskad, ADR-125 § mallarnas hemvist: förlagan orörd under docs, byte-identisk kopia i EF-lagret supabase/functions/_shared/mallar/bekraftelsebilaga.html.ts skriven av synk-skriptet och vakad av CI-paritetsgrinden — hitta skriptet via grep 'paritet'/'mall' i scripts/ och package.json; 'mall:granska' = scripts/render-bilage-mall.mjs renderar lokalt). Delad CSS: bilaga-delad.css.ts. Renderaren är DocRaptor (Prince) — mät i DocRaptor-test-läge (staging, gratis, vattenstämplad), inte i webbläsaren: Prince bryter sidor annorlunda (S108 Del 11 § D).

GÖR: (1) Mät nuläget: sidans höjd (A4 = 297 mm), ramens top/bottom-marginal, loggans bounding box mot ramens överkant — i den renderade PDF:en (pdf-lib/pdfjs-mätning eller Prince-box-utdata), tal före/efter. (2) Flytta ramen så att den är vertikalt centrerad (lika marginal upp/ned) och loggan får luft till ramens överkant — Marcus hypotes är att EN justering (ramen upp) löser båda; verifiera, och om loggan behöver egen justering: gör den minimal och bokför. (3) Ändra FÖRLAGAN, kör synk-skriptet, paritetsgrinden grön. (4) Kontrollera att deltagarinformations-mallen (samma delade CSS?) inte påverkas negativt — rendera båda. (5) Rendera bekräftelsebilagan i staging (vattenstämplad) för Marcus granskning: lägg PDF:en/bilden i PR:en eller i sessionens bilage-katalog och säg var. Marcus godkänner formen i klartext innan armering (HITL — mallen är hans granskade förlaga).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Före/efter-mätning i den DocRaptor-renderade PDF:en: ramens övre och nedre marginal lika (±1 mm), loggans avstånd till ramens överkant angivet i mm — tal i PR:en
- [x] #2 Förlagan ändrad, EF-kopian synkad via skriptet, paritetsgrinden grön; ingen handredigering av kopian
- [x] #3 Deltagarinformations-mallen renderad och opåverkad (eller medvetet justerad, bokfört)
- [x] #4 Marcus har granskat den staging-renderade PDF:en och godkänt formen i klartext FÖRE armering (HITL)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROTORSAKEN VAR FLEXBOX, INTE MÅTTEN (2026-08-27, PR #2019). Kortet beställde
en centrering och en loggfix. Under arbetet visade sig bilagan bli TVÅ sidor
oavsett innehåll — 141 ord på sida 1 med 161 mm tomt under, sidfoten ensam på
sida 2. Fyra experiment i den nya lokala PDF-loopen isolerade orsaken: Prince
implementerar inte `align-self: stretch` för flex-items i row-containers
(princexml.com/forum/topic/2132, /2566, /4471), och mallen byggde på exakt den
konstruktionen (yttre row-flex + .yttre-ram flex:1 1 auto + .sidfot
margin-top:auto). Fixen är block-layout med min-height och absolut positionerad
sidfot. Följd: S108 Del 26:s "knivsegg" och den icke-monotona
padding->sidantal-kurvan var SYMPTOM på detta, inte egenskaper hos dokumentet;
de tolv EF-deployerna (v37->v49) mätte en flexbox-bugg. #2014 är därmed
överspelad.

SCOPE-UTVIDGNING, KVITTERAD AV MARCUS I KLARTEXT. PR:en lägger till
scripts/mall-pdf.mjs (lokal PDF-loop, ~5 s mall->PDF mot tidigare EF-deploy per
mätpunkt) plus npm-skriptet mall:pdf. Det bryter formellt kortets DoD #3
("inga orelaterade filer"), fångat av review-grinden (fynd 3). Marcus kvittens,
ordagrant: "Vi kör på din rekommendation. Nu gör vi detta ordentligt och totalt
branschledande!" (2026-08-27), efter att ha ifrågasatt varför en PDF-ändring
tog 45 minuter. Utvidgningen var enabling-detour per ADR-053: verktyget var den
faktiska vägen till rotorsaks-fyndet. Avvikelsen är därmed medveten och
bokförd, inte tyst.

AC #4 (HITL) — SÅ HÄR UPPFYLLDES DEN. AC-texten kräver granskning av den
STAGING-renderade PDF:en. Marcus valde bort den vägen i klartext: "Nej, jag
skiter i att kolla i staging. Vi deployar direkt till prodappen. Lättare att
avgöra saker när allt är skarpt med rätt innehåll, utan stämpel etcetera"
(2026-08-27), följt av "Du har mandat. Ta samtliga beslut". Formen verifierades
i stället mot RIM 1:s VERKLIGA originalinnehåll, hämtat ur staging-basens
Eventinnehåll (rec2MZrLMKWAzxarB): 1801 teckens beskrivning + 24
agendapunkter (14+10) = 458 ord -> EN SIDA. Marcus premiss att alla RIM
1-event bär hela bilagan förifylld är därmed prövad och bekräftad (ADR-086).
Renderingen är lokal men går genom SAMMA renderare och SAMMA CSS som prod —
skillnaden är enbart vattenstämpeln och att data kommer ur en fixtur.
Prod-röktestet (TASK-309.11) är den skarpa verifieringen.

MÄTT SIDANTAL: standardfixtur (286 tecken) 1 sida · lång (1264) 1 sida ·
2027 tecken 1 sida · 2332 tecken 2 sidor <- gränsen · RIM 1 original (1801
tecken + 24 punkter) 1 sida · deltagarinformationen 1 sida, opåverkad.
KVARSTÅENDE: kravet "en sida, punkt" är uppfyllt för verkligt innehåll men är
ännu inte en GARANTI för godtyckligt lång text. Höjdanpassning är nästa steg.

REVIEW-RUNDA 1 (risk hog, exit 20 -> eskalerad): två tekniska fynd åtgärdade i
09324030 (sidfots-höjdens härledning pekade på fel element; timeout saknades på
tre spawnSync + open). Två fynd krävde Marcus ord och är hanterade ovan.
<!-- SECTION:NOTES:END -->
