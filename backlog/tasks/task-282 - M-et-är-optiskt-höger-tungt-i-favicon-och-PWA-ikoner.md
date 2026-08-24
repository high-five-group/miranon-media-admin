---
id: TASK-282
title: 'M:et är optiskt höger-tungt i favicon och PWA-ikoner'
status: Done
assignee: []
created_date: '2026-08-20 08:42'
updated_date: '2026-08-24 13:06'
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
- [x] #1 Märket är förskjutet 1 px vänster räknat i 512-formatet (0,195 % av bredden) i KÄLLAN, enligt Marcus visuella val 2026-08-20 på en renderad skala 0/1/2/3/4 px vänster i ram med mittkors — belagt i utfilen som bbox-centrum Δx -1,000 px i 512-ikonen. Alfa-viktad centroid är INTE facit: den är falsifierad som modell för fler-delade former (Denisova/Singh/Kowler 2006, PMID 17076067) och sex definitioner av optiskt centrum gav sex olika svar på just denna form
- [x] #2 Samma mätning är gjord och godkänd för 192-ikonen och den maskable varianten
- [x] #3 Faviconen (public/favicon/favicon.svg och dess genererade PNG/ICO) är mätt separat och korrigerad om samma avvikelse finns där — mätvärdet före och efter står i kortets notes
- [x] #4 Korrigeringen är gjord i källfilen (public/miranon-m-original.svg eller favicon-källan), inte i genererade utfiler
- [x] #5 Maskable-ikonens safe zone är omräknad efter korrigeringen och klarar fortfarande kravet (MÄTT: kvot(hörn) 0,746 före → 0,744 efter, krav ≤ 0,9 — gott om marginal. Kortets ursprungliga premiss 0,912/0,012 var FEL: 0,912 hörde till padding 0.45 som förkastades)
- [x] #6 Y-ledets +15,9 px avvikelse är antingen åtgärdad eller uttryckligen bedömd som avsiktlig, med motivering i notes — den lämnas aldrig obesvarad
- [x] #7 Varje genererad ikon är öppnad som bild och visuellt granskad efter korrigeringen, inte bara mätt numeriskt
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
KORRIGERINGEN ÄR VERKSTÄLLD (2026-08-20). Värdet är MARCUS VISUELLA VAL, inte ett mätvärde.

BESLUTET: märket förskjutet 1 px vänster räknat i 512-formatet = 0,195 % av
ikonens bredd, tillämpat i källan så alla storlekar följer proportionellt.
Marcus fick en renderad skala 0/1/2/3/4 px vänster, var och en i ram med
mittkors, och pekade ut 1 px efter att oberoende ha bisekterat intervallet
(0 px lutade höger, 4 px lutade vänster). Föregående pass
(docs/research/ikon-optisk-centrering-2026-08-20.md, PR #1657 MERGED) visade
att sex definitioner av optiskt centrum ger sex olika svar (-1,91 … +7,615) —
det finns inget objektivt facit att pröva valet mot. En variant av väg C i
research § 7.

KÄLLÄNDRINGEN (AC #4 — i källan, aldrig i utfilerna):
  public/miranon-m-original.svg   translate x 65.0 -> 64.73273
    (-0,2672697 källenheter; viewBox 130 ritas till 512*(1-0.05)=486,4 px,
     skala 3,741538 px/enhet -> exakt 1,000 px i 512-formatet)
  public/favicon/favicon.svg      translate x 200 -> 199.21875
    (-0,78125 viewBox-enheter av 400 = 0,195 % -> exakt 1,000 px i 512-format;
     0,031 px vid 16, 0,063 vid 32, 0,094 vid 48, 0,188 vid 96, 0,352 vid 180)
  Ny ikon-hash (TASK-280-mekanismen): 120d7838 -> bf299cce.

MÄTT FÖRE -> EFTER, alla mått mätaren rapporterar (scripts/mat-ikon-centrering.mjs).
Δx från geometriskt centrum, px:

pwa-512x512 (alpha)      FÖRE      EFTER     flytt
  bbox-centrum          +0,000    -1,000    -1,000   <- exakt 1 px, AC #1
  centroid              +3,667    +2,663    -1,004
  hull-centroid         -0,483    -1,483    -1,000
  kant-centroid         -0,318    -1,317    -0,999
  viktad median         +7,615    +6,594    -1,021
  Δy centroid          +15,912   +15,909    -0,003   (y orört, AC #6)
  bbox-marginal v/h      24/24     23/25

pwa-192x192 (alpha)      FÖRE      EFTER     flytt   (förväntat -0,375)
  bbox-centrum          +0,000    +0,000     0,000   (sub-pixel, kvantiserad)
  centroid              +1,377    +0,998    -0,379
  hull-centroid         -0,201    -0,477    -0,276
  kant-centroid         +0,228    -0,269    -0,497
  viktad median         +2,822    +2,412    -0,410
  Δy centroid           +5,962    +5,977    +0,015

maskable-512 (ink)       FÖRE      EFTER     flytt   (förväntat -0,474)
  bbox-centrum          +0,000    -0,500    -0,500
  centroid              +2,292    +1,818    -0,474
  hull-centroid         -0,161    -0,782    -0,621
  kant-centroid         +0,300    -0,166    -0,466
  viktad median         +4,583    +4,111    -0,472
  Δy centroid           +7,449    +7,448    -0,001

favicon-96x96 (ink)      FÖRE      EFTER     flytt   (förväntat -0,188)
  bbox-centrum          +0,000    +0,000     0,000   (sub-pixel)
  centroid              +0,672    +0,487    -0,185
  hull-centroid         -0,066    -0,110    -0,044
  kant-centroid         +0,209    +0,113    -0,096
  viktad median         +1,282    +1,125    -0,157
  Δy centroid           +2,235    +2,238    +0,003

apple-touch-icon 180 (ink) FÖRE    EFTER     flytt   (förväntat -0,352)
  bbox-centrum          +0,000    +0,000     0,000   (sub-pixel)
  centroid              +1,306    +0,953    -0,353
  hull-centroid         -0,179    -0,448    -0,269
  kant-centroid         +0,953    +0,554    -0,399
  viktad median         +2,601    +2,250    -0,351
  Δy centroid           +4,179    +4,177    -0,002

PROPORTIONALITETEN ÄR KVITTOT PÅ "ETT MÄRKE, INTE TVÅ": centroid-flytten per
ikon (-1,004 / -0,379 / -0,474 / -0,185 / -0,353) matchar den förväntade
skalningen (-1,000 / -0,375 / -0,474 / -0,188 / -0,352) inom 0,02 px överallt.
PWA-källan och favicon-källan är alltså förskjutna exakt lika mycket relativt
sin ram, trots att de är två separata filer med olika viewBox och olika skala.

AC #3 — FAVICONEN FÖLJDE MED, som beslutat. Föregående pass mätte identisk
formavvikelse (+0,982 källenheter) i båda källorna, så de kräver inte motsatta
korrigeringar. Vid 16 px är korrigeringen 0,031 px och alltså visuellt
oskiljbar — väntat, och inget skäl att avstå: syftet är att de två märkena
inte ska divergera. Ikonformat saknar hintingens grid-fitting, så en
sub-pixelförskjutning återges som omsampling, inte som förflyttning
(research § 3). Vill man förbättra faviconen VID 16 px är den belagda vägen en
egen småstorleksritning.

AC #5 — SAFE ZONE, OMRÄKNAD EFTER KORRIGERINGEN:
  maxAvst        142,921 -> 142,241     safeR = 204,8
  bbox-hörnradie 152,761 -> 152,402
  kvot(maxAvst)    0,698 -> 0,695
  kvot(hörn)       0,746 -> 0,744       krav <= 0,9  ->  KLARAR
Kvoten SJÖNK marginellt — förskjutningen minskade maxavståndet i stället för
att öka det. Marginal efter: 204,8 - 142,241 = 62,6 px.
KORTETS URSPRUNGLIGA PREMISS VAR FEL och är rättad i AC #5: 0,912 hörde till
padding 0.45 som FÖRKASTADES; vid nuvarande 0.55 är värdet 0,746, inte 0,912,
och marginalen 0,154 i kvot — inte 0,012. Belagt tre gånger oberoende
(pwa-assets.config.ts egen kommentar, föregående passets mätning, denna
mätning).

AC #6 — Y-LEDET LÄMNAS OFÖRÄNDRAT, avsiktligt; utredningen är gjord och
upprepas inte. (1) Föregående pass renderade korrigeringen: marginalerna blir
17 px över / 49 px under — tydligt sämre. (2) Den enda kvantifierade klassiska
regeln ger för vår fyllnadsgrad ca 2,1 px uppåt, inte 15,9. (3) Vårt +3,57 %
ligger inom spannet för åtta referenstypsnitt (Verdana -5,39 % … Futura
+5,35 %). Mätt här: Δy ändrades med högst 0,015 px på någon ikon, dvs
rasteriseringsbrus — y är orört.

AC #7 — VISUELLT GRANSKAD, varje genererad ikon öppnad som bild på grå platta
med rött mittkors, uppskalad nearest-neighbour:
  pwa-512x512-bf299cce.png       formen intakt, släta kanter, balanserad
  pwa-192x192-bf299cce.png       släta diagonaler, ingen palettkvantisering
  maskable-icon-512x512-bf299cce.png  gott om luft, safe zone rejält uppfylld
  favicon/favicon-96x96.png      rund platta, transparenta hörn, märket läsbart
  favicon/apple-touch-icon.png   vit platta, formen intakt
  favicon/favicon.ico (48 px)    PNG-datan extraherad ur ICO:n, märket läsbart
Dessutom favicon.svg renderad i 16/24/32 px (källfilens egen instruktion
"Ändras detta — mät i 16 px först"): M-formen läsbar i alla tre, ingen
kapning, ingen degradering mot tidigare — tunnheten vid 16 px är den kända,
medvetna S107-avvägningen, inte något denna ändring införde.

VÄNTAD BIEFFEKT, EJ DEFEKT: hashen ändras (120d7838 -> bf299cce), Chrome ser
en ny icons-lista och användare får "App Update Available". Det är hela
poängen med TASK-280:s mekanism. dist/manifest.webmanifest verifierad: bär de
tre nya namnen, noll träffar på den gamla hashen i dist/.

KÄLLORNA BÄR NU SIN EGEN HÄRLEDNING: båda SVG-filerna har fått ett kommentars-
block som säger vad talet är, att det är Marcus visuella val och inte ett
mätvärde, och varför det inte ska "rättas tillbaka" för att något mått säger
något annat.

GRINDAR (nakna, exitkod läst separat): test:api 0 (924 passerade),
typecheck 0, biome 0 (567 filer), build 0, verify:manifest 0, check:docs 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1658 (fix/s107-282-optisk-centrering-1px) MERGED 2026-08-20T10:18:20Z, samtliga checks SUCCESS (gh pr view 1658). Filer scopade till ikon-källorna + genererade varianter, konsekvent med kortets scope. DoD #3 bockad mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
