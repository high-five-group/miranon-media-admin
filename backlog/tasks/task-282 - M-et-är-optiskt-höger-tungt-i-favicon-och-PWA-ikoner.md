---
id: TASK-282
title: 'M:et är optiskt höger-tungt i favicon och PWA-ikoner'
status: To Do
assignee: []
created_date: '2026-08-20 08:42'
updated_date: '2026-08-20 09:25'
labels:
  - ready-for-agent
dependencies: []
ordinal: 508000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus fångst 2026-08-20, MÄTT och bekräftad: M-formen ser höger-förskjuten ut trots att den är perfekt centrerad i sin ram.

MÄTNINGEN (public/pwa-512x512-120d7838.png, alpha-viktad):
- Geometriskt centrum: 255,5
- Optisk tyngdpunkt x: 259,2
- AVVIKELSE: +3,7 px åt höger = 0,72 % av bredden
- Vikt höger halva 26 655 mot vänster 25 939 — höger bär 2,7 % mer visuell massa

Bounding box är alltså exakt centrerad (marginal vänster 24 = höger 24 i 512-formatet), men formens VISUELLA MASSA ligger till höger. Det är skillnaden mellan matematisk och optisk centrering, och ögat läser den senare.

ÄVEN Y-LEDET, ej efterfrågat av Marcus men mätt i samma pass: tyngdpunkten ligger +15,9 px NEDÅT. Det kan vara avsiktligt (vågformens nedåtgående svansar) eller samma klass av fel. Avgör innan du rör y — en obeställd vertikal justering är en scope-utvidgning.

GÄLLER BÅDA YTORNA: Marcus rapporterar samma sak i favicon (public/favicon/favicon.svg) och i PWA-ikonerna. Faviconen har en egen källa och måste mätas separat — anta inte att samma korrigering gäller.

FIXEN SKA SKE I KÄLLAN, inte i utfilerna. public/miranon-m-original.svg är källan som pwa-assets-generatorn läser. Att nudga pixlar i genererade PNG:er är fel lager och överlever inte nästa regenerering.

OBS PÅ INTERAKTION MED TASK-280: ikonernas filnamn bär nu en innehållshash (scripts/pwa-icon-version.ts, sha256 av källan, 8 hex). Ändras källan ändras hashen, och Chrome ser en ny icons-lista — vilket är HELA POÄNGEN med den mekanismen och fungerar av sig självt. Men det betyder också att varje användare får Chromes 'App Update Available'-flöde igen. Det är väntat, inte en defekt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Den optiska tyngdpunkten i x ligger inom ±1,0 px från geometriskt centrum i den genererade 512-ikonen, mätt med alpha-viktad centroid — inte med bounding box
- [ ] #2 Samma mätning är gjord och godkänd för 192-ikonen och den maskable varianten
- [ ] #3 Faviconen (public/favicon/favicon.svg och dess genererade PNG/ICO) är mätt separat och korrigerad om samma avvikelse finns där — mätvärdet före och efter står i kortets notes
- [ ] #4 Korrigeringen är gjord i källfilen (public/miranon-m-original.svg eller favicon-källan), inte i genererade utfiler
- [ ] #5 Maskable-ikonens safe zone är omräknad efter korrigeringen och klarar fortfarande kravet (kvoten låg på 0,912 mot kravet 0,9 vid paddingen 0,55 — marginalen är tunn)
- [ ] #6 Y-ledets +15,9 px avvikelse är antingen åtgärdad eller uttryckligen bedömd som avsiktlig, med motivering i notes — den lämnas aldrig obesvarad
- [ ] #7 Varje genererad ikon är öppnad som bild och visuellt granskad efter korrigeringen, inte bara mätt numeriskt
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
MÄTNING + RESEARCH KLAR — ÄNDRING STOPPAD, DESIGNBESLUT TILL MARCUS (2026-08-20).

Research: docs/research/ikon-optisk-centrering-2026-08-20.md
Mätare: scripts/mat-ikon-centrering.mjs (ny, validerad i båda riktningar)

FÖRE-VÄRDEN, pwa-512x512-120d7838.png, Δx från geometriskt centrum:
  bbox-centrum              0,000 px
  kant-viktad centroid     -0,318 px
  konvext höljes centroid  -0,483 px
  dominerande delens COG   -1,91 px   (grön, 64 % av massan)
  kant-centroid (luminans) +1,847 px
  alfa-viktad centroid     +3,667 px  <- kortets AC #1-mått
  viktad median            +7,615 px
Kortets mätning (+3,7 px, höger halva 2,7 % tyngre) är REPRODUCERAD exakt.

EFTER-VÄRDEN (probe, dx=-0,982 källenheter, regenererad hash 55147f9b):
  alfa-centroid  +3,667 -> -0,008 px   (AC #1 skulle uppfyllas)
  kant-centroid  -0,318 -> -3,958 px   (blir FEL åt andra hållet)
  hull-centroid  -0,483 -> -4,306 px
  bbox-marginal  24/24  -> 20/28
  192-ikonen     +1,377 -> -0,000 px
  maskable       +2,292 -> +0,552 px (ink-mått, färgpartiskt)

VARFÖR STOPPAT: AC #1 föreskriver homogen alfa-viktad centroid. Tre
peer-reviewade studier (abstrakt verifierade mot NCBI E-utilities) visar att
homogen massviktning är fel modell för FLER-DELADE former. Vårt M ÄR
fler-delat: grön våg (64 % av massan, COG -0,51 källenh.) plus röd eko-våg
(36 %, COG +3,91) förskjuten åt höger. Denisova/Singh/Kowler 2006 (Perception
35(8), PMID 17076067): referenspunkten ligger vid DEN STÖRRE DELENS COG, inte
vid helhetens — vilket för oss ger -1,91 px, alltså redan vänster om centrum.
Fem av sju mått säger att ikonen är centrerad eller vänstertung.
Marcus upplevda höger-tyngd är sannolikt EKOTS offset, inte centreringen —
åtgärden på rätt nivå vore att ändra märket, vilket ägs av Marcus.

AC #5 — SAFE ZONE, OMRÄKNAD: kvot(hörn) 0,746 före OCH efter (förskjutning
ändrar läge, inte storlek). Kravet är <= 0,9. Marginal 0,154 i kvot = 61,9 px.
KORTETS PREMISS ÄR FEL: 0,912 hör till padding 0.45 som FÖRKASTADES; vid
nuvarande 0.55 är värdet 0,746. Belagt två gånger — pwa-assets.config.ts egen
kommentar OCH oberoende mätning av utfilen (bbox 220x212). Kortets parentes är
dessutom självmotsägande (0,912 > 0,9 = fälld, samtidigt som AC:t ber om att
kravet ska klaras).

AC #3 — FAVICON, MÄTT SEPARAT: samma path och samma centreringskonstant som
PWA-källan; färgneutralt mätt är avvikelsen IDENTISK (+0,982 källenheter).
Favicon och PWA kräver alltså INTE motsatta korrigeringar. Men korrigeringen
är 0,087 px vid 16 px, 0,174 vid 32, 0,261 vid 48 — sub-pixel överallt, och
renderad jämförelse är visuellt oskiljbar. Den kan inte återges som
förflyttning, bara som omsampling (ikonformat saknar hinting).

AC #6 — Y-LEDET, STÄLLNINGSTAGANDE: LÄMNAS OFÖRÄNDRAT, avsiktligt. (1) En
korrigering ger marginalerna 17 px över / 49 px under — renderat, ser tydligt
sämre ut. (2) Den enda kvantifierade klassiska regeln ger for vår fyllnadsgrad
ca 2,1 px uppåt, inte 15,9. (3) Referensmätning av versalt M i åtta typsnitt
spänner -5,39 % (Verdana) till +5,35 % (Futura); vårt +3,57 % ligger inom
spannet. Marcus rapporterade höger-tyngd, inte låg placering.

VÄGVAL FÖR MARCUS (research § 7): A lämna orört (rekommenderas) · B korrigera
fullt per AC #1 · C halv korrigering. Väljs A bör AC #1 skrivas om.

INGEN AC AVBOCKAD: fixen är inte gjord, och AC #1 är självt det som prövas.
Lokala grindar gröna på det som landar: biome 0, typecheck 0, build 0,
test:api 0 (924 passerade), verify:manifest 0, check:docs 0 (14/14).
<!-- SECTION:NOTES:END -->
