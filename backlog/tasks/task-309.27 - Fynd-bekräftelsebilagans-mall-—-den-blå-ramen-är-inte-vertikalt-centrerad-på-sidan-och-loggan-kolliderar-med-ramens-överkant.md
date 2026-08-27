---
id: TASK-309.27
title: >-
  Fynd: bekräftelsebilagans mall — den blå ramen är inte vertikalt centrerad på
  sidan och loggan kolliderar med ramens överkant
status: To Do
assignee: []
created_date: '2026-08-26 03:06'
updated_date: '2026-08-27 17:42'
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
FORTSÄTTNING 2026-08-27 — FYRA FYND TILL, ALLA MARCUS FÅNGSTER.

FYND 1: SEX AGENDAPUNKTER SAKNADES I BÅDA BASERNA. Originalbilagan
(~/Desktop/Miranon Media/exempelpdokument/bekräftelsebilaga-exempel.pdf) har
Dag Ett 14 + Dag Två 16 = 30 punkter. Staging OCH prod hade båda 14+10 = 24.
Saknades: Tanke respektive medvetande · Meditation: Kristallvägen 41 min ·
Upplevelser utanför verkligheten · Tid, Affirmationer, Altruism ·
Själshämtning · Meditation: Spegeln 40 min. Marcus premiss att RIM 1 bär hela
bilagan förifylld var därmed FALSIFIERAD i båda baserna (ADR-086). ÅTGÄRDAT:
alla sex skapade i staging (tblgEItD0UM1oJVI9) och prod (tblB1wu9Qm9SWpF0T).

FYND 2: MALLEN SPRACK VID KOMPLETT AGENDA — MITT FEL. Med 30 punkter blev det
2 sidor. .yttre-ram:s padding-bottom reserverade 6 mm luft åt sidfoten som
originalet inte har. Rättat, och sid-paddingen sänkt 7,89 -> 6,5 mm, MÄTT fram
(7,89/7,5/7,0 gav alla 2 sidor; 6,5 gav 1). Resultatet ligger inom 0,5 mm från
originalet på varje sektion. PR #2020.

FYND 3: FETSTILEN — REGRESSION FRÅN TASK-309.4, FYRA DAGAR GAMMAL. Marcus:
"den saknar även fetstilt och sådant på ord i kursbeskrivningen, allt sådant
var på plats förut." Git bekräftar: <strong> var hårdkodat i mallen fram till
10f006b6 (2026-08-23 19:01), som gjorde stycket datadrivet. Förlagan har SJU
fetstilta ord; vi hade noll. ÅTGÄRDAT (PR #2025): fetMarkera() i
_shared/fet-markering.ts — whitelist i två steg (escapa allt, återinför sedan
enbart <strong> där **…** matchar), 12 tvåsidiga tester, paritetsvakt mot den
lokala render-vägen. Airtable-texten i BÅDA baserna bär nu **-markörer, satta
EFTER prod-deployen (annars hade '**Resor i Medvetandet**' visats literalt).

FYND 4: RUBRIKEN ÄR I FEL TYPSNITT — ÖPPET, KRÄVER MARCUS. pdffonts visar att
förlagan sätter rubriken i Cavolini-Bold medan vår PDF använder
ComicNeue-Bold (fallbacken). Mätt: vår rubrik är 80 % av förlagans bredd och
89,5 % av höjden, i BÅDA bilagorna. Cavolini finns inte på maskinen och får
inte committas (fsType=0x0008 tillåter dokumentinbäddning, inte
fil-distribution). Vägen: git-ignorerad symlänk från en Office-installation,
se bilaga-delad.css § FONTSTRATEGIN. EGET KORT.

HÖJDANPASSNINGEN (PR #2028) — SCOPE-UTVIDGNING PÅ MARCUS ORDER. Han fällde
mitt första förslag (en CI-vakt): "Vi kan inte ha en vakt på endast RIM 1, det
kommer ju finnas bilagor för RIM 2, RIM 3 och Fjärrskådning också." Korrekt —
en vakt larmar EFTER, och bara för innehåll som finns. Mätt: 7
Eventinnehåll-kombinationer existerar, bara RIM 1 har text. Lösningen är i
stället att mallen skalar innehållet: renderaMallPdf renderar, räknar sidorna
i PDF-strömmen (/Count, läsbar även med komprimerade objektströmmar), och
renderar om mindre. Trappa [1, 0,88, 0,8], golv som loggar. RIM 1 klarar sig
på ETT pass — normalfallet betalar ingenting.

DELTAGARINFORMATIONEN: PRÖVAD, INGEN ÅTGÄRD BEHÖVDES. Marcus ville ha den
identisk i grundform. Mätt mot dess förlaga: vertikalt inom 0,2 mm på varje
sektion, och förlagan har INGEN blå ram — CSS-kommentaren hade rätt. Marcus
kvitterade: "Har inte originalet blå ram så ska inte vår mall ha det heller."

FÖRLAGORNAS SÖKVÄG BOKFÖRD (PR #2022) efter Marcus: "Varför har du inte
sparat ref till originalbilagorna någonstans... orkar inte." README pekade på
~/Downloads/exempelpdokument/ — en katalog som inte finns. Nu i README §
Förlagorna OCH CLAUDE.md § Verktygsfakta (den senare auto-laddas varje
session). Med Marcus regel: "Om vårt innehåll sitter RAKT och i originalet så
är det snett så ska vi behålla RAKT."

ORKESTRERARFEL BOKFÖRDA: (a) fetstils-commiten hamnade på lokal main efter att
ett bakgrundsjobb körde git checkout under pågående arbete — PR #2024:s
beskrivning påstod en fix som inte fanns i diffen; review-agenten fångade det
och PR:en rättades. (b) Jag påstod "tre veckor" om fetstils-regressionen;
Marcus fällde det, git visade fyra dagar. (c) Jag committade en gång med biome
röd, fångade det själv och amendade.

PROD-DEPLOY 2026-08-27 17:35:45 UTC (Marcus egen kanal): 45 EF:er,
generate-event-attachment v10 -> v11. Förkraven verifierade före: DOCRAPTOR_API_KEY
finns, ENVIRONMENT = production (hash-matchad), bucket konvergerad. Nyckeln är
IDENTISK i prod och staging — rotationen måste göras i båda.
<!-- SECTION:NOTES:END -->
