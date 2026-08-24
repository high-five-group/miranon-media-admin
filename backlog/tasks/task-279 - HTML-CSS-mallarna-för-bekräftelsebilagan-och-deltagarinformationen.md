---
id: TASK-279
title: HTML/CSS-mallarna för bekräftelsebilagan och deltagarinformationen
status: Done
assignee: []
created_date: '2026-08-19 09:53'
updated_date: '2026-08-24 13:06'
labels: []
dependencies: []
ordinal: 505000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Första skivan på PDF-vägen (`ADR-119`). **Kräver ingen extern tjänst och ingen
API-nyckel** — den kan därför byggas medan DocRaptor-kontot skapas.

## Varför denna skiva först

`ADR-119` beslut 2 valde HTML/CSS-driven rendering. Mallen är då den bärande
artefakten: den behövs oavsett vilken motor som renderar den, och den kan
verifieras mot förlagan i en vanlig webbläsare långt innan någon renderare
finns på plats. Att vänta på API-nyckeln vore att stå still i onödan.

## Underlaget finns redan

`docs/research/dokumentmallarnas-forlagor-2026-08-17.md` bär förlage-analysen
med **exakta färger uppmätta ur filerna** (t.ex. hyperlänk-blå `#0563C1`,
Words standardhyperlänkfärg). `docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`
§ 2.1–2.2 mäter varje element mot förlagan. Läs BÅDA före du skriver en rad.

Förlagorna själva: `~/Downloads/exempelpdokument/`
(`bekräftelsebilaga-exempel.pdf`, `deltagarinformation-exempel.pdf`). De är
**PowerPoint-exporter** — 17-augusti-passets filer var Word-brev. Roger/Lotta
bygger mallar i minst två Office-verktyg; det påverkar vad "exakt som
förlagan" betyder.

## Den dynamiska ytan — mätt, inte antagen

`ADR-119` beslut 3 slår fast att bilagorna bär **enbart eventdata, ingen
persondata**. Mottagarens namn är dynamiskt i mailKROPPEN, aldrig i bilagan.

- **Bekräftelsebilagan:** kursnamn · datum/veckodagar · plats · pris ·
  anmälningsavgift · resterande belopp · sista betalningsdatum.
- **Deltagarinformationen:** TRE rader — kursnamn · datum/tid · plats.

All brödtext är statisk per kurstyp. Den dynamiska ytan är **infoboxen,
inget annat**.

## Vad som byggs

Två HTML-mallar med CSS, parametriserade på fälten ovan. Ingen
renderings-integration, ingen EF, inget Storage — bara mallarna plus ett sätt
att titta på dem med riktig data.

Fontfrågan är öppen (`Cavolini`-licensen är obelagd, se
`pdf-renderingsvagen`-passet § 4). Välj ett fritt alternativ som håller
formen och **bokför valet** — fonten kan bytas senare utan att mallen skrivs
om, vilket är hela poängen med CSS-vägen.

## Vad som INTE görs här

DocRaptor-integrationen, Edge Function-en, Storage-lagringen,
invalideringen och bilage-lanen. De är egna skivor och flera av dem kräver
Marcus API-nyckel eller prod-deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Två HTML/CSS-mallar finns: bekräftelsebilagan och deltagarinformationen, parametriserade på exakt den dynamiska yta ADR-119 beslut 3 anger
- [x] #2 Ingen persondata förekommer i någon mall — mottagarnamn hör till mailkroppen, aldrig bilagan
- [x] #3 Mallarna går att granska med riktig eventdata utan extern tjänst; hur man gör det är dokumenterat i kortet
- [x] #4 Visuell jämförelse mot förlagorna gjord och redovisad — vad som matchar och vad som avviker, med skäl
- [x] #5 Fontvalet bokfört med motivering; Cavolini-licensen förblir obelagd och antas aldrig
- [x] #6 Ingen DocRaptor-integration, ingen EF, inget Storage — scope hålls
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
## ASSET- OCH TYPOGRAFI-LISTAN — komplett, mätt 2026-08-19

Allt nedan är MÄTT ur förlagorna eller hämtat från officiell källa. Inget är
antaget. Bygg mot denna lista, inte mot ögonmått.

### Bilder och ikoner — samtliga landade i repot (PR #1629)

| Asset | Fil | Not |
|---|---|---|
| Logotyp | `public/miranon-media-ordmarke-original.svg` | äkta vektor, ORIGINALFÄRGER `#FF0000` + `#548235`. 70 paths, 7,2 kommandon per form — ren geometri, ingen trace |
| Bokomslag | `public/utanfor-verkligheten-omslag.jpeg` | 383×624, originalet som förlagans 378×616 klipptes ur |
| Instagram | `public/instagram-glyf.svg` | Instagrams OFFICIELLA svarta glyf, 1,8 kB ren vektor |
| Instagram (alt) | `public/instagram-glyf-gradient.png` | 512×512. Deras "gradient-SVG" var en 10,9 MB RASTERBILD i SVG-skal — därför PNG |
| Globe | `public/globe-material.svg` | Material Symbols fylld glob, matchar förlagans ikon |

### QR-koderna GENERERAS, kopieras ALDRIG

Båda är statiska URL:er (Marcus verifierade genom att skanna):

- nedre vänstra hörnet → `https://miranon.se/`
- nedre högra hörnet → `https://www.instagram.com/se.miranon/`

Generera dem ur URL-strängarna i mallen. Då står adressen läsbar i koden och
bilden blir härledd. Att klistra in en QR-bild fryser en URL i ett rutnät där
ingen kan se vart den pekar.

Eftersom båda är STATISKA hör de inte till `ADR-119` beslut 3:s dynamiska yta.

### Typografin — mätt med `pdffonts` + `pdftohtml -xml`

| Roll | Förlagan | Storlek | Färg |
|---|---|--:|---|
| Rubrik | `Cavolini-Bold` | 25 px | `#000000` |
| Brödtext | `Calibri` | 15 px | `#000000` |
| Fetade ord i brödtext | `Calibri-Bold` | 15 px | `#000000` |
| E-postlänk | `Calibri` | 15 px | `#0563C1` |
| Innehållslistans meditationer | `Calibri-BoldItalic` | 13 px | `#548235` |
| Tidsangivelser i listan | `Calibri` | 13 px | `#2F5597` / `#4472C4` |
| QR-texter | `Calibri-Bold` | 13 px | `#000000` |

**Innehållslistan bär en SEMANTISK färgkodning** som ska bevaras:
meditationsnamn i loggans egen gröna `#548235`, tider i blått. Det är
genomtänkt, inte slumpmässigt.

**Fetade ord i brödtexten, ordagrant:** "Resor i Medvetandet" · "djupa
meditationer" · "Medvetandet" · "Utanför Verkligheten" · "Additiv meditation"
· "mentala ankare" · "Punktmedvetandet".

### FONTSTRATEGIN — väg B, Marcus beslut 2026-08-19

**Rubrikfonten ska vara en CSS-VARIABEL med två lägen:**

1. **Cavolini-Bold** primärt — den äkta fonten, identisk med förlagan.
2. **Comic Neue Bold** som fallback (`public/fonts/bilagor/ComicNeue-Bold.ttf`).

Skälet till variabeln: den juridiska frågan om var Cavolini får ligga är inte
slutgiltigt avgjord, och mallen ska inte behöva skrivas om om bedömningen
ändras.

**Licensbiten ÄR mätt** (`OS/2`-tabellens `fsType`, alla fyra vikterna):
`0x0008` = **Editable Embedding** — inbäddning i dokument uttryckligen
tillåten, subsetting tillåtet, konturinbäddning tillåten. Det var frågan
`pdf-renderingsvagen`-passet § 4 lämnade öppen; den är nu stängd med mätning.

**Cavolini-filen får INTE checkas in i git.** `fsType` reglerar inbäddning i
DOKUMENT, inte distribution av fontfilen. Den lagras i en privat Supabase
Storage-bucket och matas till renderaren vid generering. Källa: Marcus
Office-licens (`~/Library/Group Containers/UBF8T346G9.Office/FontCache/4/CloudFonts/Cavolini/`,
fyra vikter, hämtade 2026-08-19).

**Brödtexten är INTE en variabel — den är Carlito, punkt.**
`public/fonts/bilagor/Carlito-*.ttf` är METRIKKOMPATIBEL med Calibri: samma
teckenbredder och radhöjder, så radbrytningar hamnar där förlagan har dem.
Byt inte utan att mäta radbrytningarna mot förlagan.

`SegoeUI-Bold` förekommer på ett enda ställe i förlagan; använd Carlito Bold
och notera avvikelsen i AC #4:s redovisning.

### AC #5 omtolkas i ljuset av detta

Kriteriet lyder "fontvalet bokfört med motivering; Cavolini-licensen förblir
obelagd och antas aldrig". Licensen är nu BELAGD. Uppfyll AC:t genom att
bokföra fsType-mätningen och tvålägesstrategin — inte genom att upprepa att
frågan är öppen.

## Byggd (denna skiva, S107)

Mallarna: `docs/mallar/bilagor/{bekraftelsebilaga,deltagarinformation}.html` + delad CSS `bilaga-delad.css`. Fullständig dokumentation, granskningsväg och AC #4:s visuella jämförelse (matchar/avviker, med skäl) ligger i `docs/mallar/bilagor/README.md` — läs den för allt detaljerat, återges inte här.

**Granska (AC #3):** `npm run mall:granska -- bekraftelsebilaga` / `npm run mall:granska -- deltagarinformation`, öppna sedan `docs/mallar/bilagor/<mall>.granskning.html` direkt i webbläsaren. Ingen server, ingen extern tjänst. Cavolini lokalt: `ln -s ~/.miranon-fonts docs/mallar/bilagor/lokala-typsnitt` (git-ignorerad, aldrig committad — saknas den faller rubriken avsiktligt till Comic Neue, verifierat med skarpt av/på-test).

**AC #5, oberoende bekräftelse:** fsType lästes själv ur `~/.miranon-fonts/Cavolini-*.ttf` (Python `struct`-parsning av OS/2-tabellen, ingen extern lib) = 0x0008 för alla fyra vikterna — matchar och BEKRÄFTAR notes-avsnittets mätning oberoende.

**Premiss-avvikelse funnen och bokförd (ADR-086):** notes ovan säger sidfotens 'nedre vänstra hörn → miranon.se, nedre högra → instagram'. Den faktiska förlagan (`bekräftelsebilaga-exempel.pdf`, läst direkt) visar motsatsen — Instagram vänster, globe/miranon.se höger. Mallen matchar BILDEN (den högre källan). Se README § Bekräftelsebilagan — avviker, med skäl.

**QR-koderna:** genererade ur URL-strängarna med `qrcode` (npm, MIT, soldair/node-qrcode) i en isolerad scratch-installation (aldrig en projekt-dependency), inbäddade som statisk SVG. Ingen centrerad logo-overlay (skäl + full motivering i README § QR-koderna).

**biome.json:** lade till `!docs/mallar/bilagor/*.html` i files.includes, samma mönster/skäl som befintliga `!supabase/templates` (Biomes HTML-parser stödjer inte `{{ }}`-interpolation utan en config-flagga; exkludering följer redan etablerat precedent, ingen ny ADR bedömd nödvändig — under ADR-baren, samma klass som föregångaren).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1634 (feat/s107-279-bilage-mallar) MERGED 2026-08-19T12:45:24Z, samtliga checks SUCCESS (gh pr view 1634). Filer scopade till docs/mallar/bilagor/, biome.json, package.json, scripts/render-bilage-mall.mjs, .gitignore — konsekvent med kortets scope. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
