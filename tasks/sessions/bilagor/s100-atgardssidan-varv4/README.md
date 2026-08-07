# Åtgärds-sidan — konvergens-varv 4 (S100, 2026-08-07)

Varv 4 ställer om ytan kring en fråga varv 3 aldrig ställde: **hur kom Lotta
hit?** Svaret (Marcus 2026-08-07): hon markerade personkort i Anmälda
deltagare-blocket på eventdetaljen och tryckte Åtgärder. Ur det följer att det
FÖRSTA hon ser måste vara exakt de korten igen, i markeringsläge.

Bilder ur `/event/$eventId/atgarder` mot riktig staging-data
(granskningsfixturen `ZZ-GRANSKNING-FIXTUR`, 16 anmälda, 14 seedade som
markerade), dev-server på `4173`, viewport 430×932 respektive 1280×1000.
Prototyp-växlarens rail är bortdöljd i bilderna.

| Fil | Visar |
|---|---|
| **`v4b-forsta-skarmen.png`** | **Sidan som Lotta möter den** — allt ryms utan scroll: sidhuvud, väljare, räknaren (infälld), hela Åtgärd-menyn, betalningarna |
| `v4b-infalld.png` | Samma, hela sidan |
| `v4b-utfalld-lista.png` | Efter klick på räknaren — de 14 markerade korten |
| `v4b-atgard-vald.png` | En åtgärd vald direkt ur infällt läge |
| `v4b-desktop.png` | Infällt läge i 1280 px |
| `v4-plockare.png` | "Lägg till fler personer från eventet" öppen — de omarkerade som kompakta kort |
| `v4-avmarkerad.png` | Efter avmarkering av ett kort: räknaren 14 → 13, kortet vitt men kvar i listan |
| `v4-utfalld.png` | Bekräftelse-åtgärden utfälld in-place |
| `v4-atgarder-mobil.png` / `v4-atgarder-desktop.png` | Varv 4a, **före** infällningen — listan öppen från start |
| `ref-eventdetalj-markerat-kort.png` | **Förlagan**: ett markerat kort på eventdetaljen |

## Fyra ändringar mot varv 3

1. **Mottagarna bär `Deltagare` § `MarkerbartKort`**, inte gruppdynamikens
   kompakta kort. Varv 3 mötte henne med en annan kortform än den hon just
   klickat på.
2. **Räknaren först** — "14 av 16 deltagare markerade", före listan.
3. **Listan är INFÄLLD från början** (varv 4b, Marcus: *"Så hon direkt kan 'Se'
   åtgärderna och välja en åtgärd"*). Räknar-raden är accordion-huvudet.
4. **Översta blocket bär bara eventväljaren.** Sammanfattningen och
   deadline-pillen sköt ned mottagarlistan; deadline flyttade till Betalningar,
   där den gäller.

Den kompakta `Gruppdynamik`-formen är kvar — men bara i plockaren, där den är
en sökträff.

## Mätt, inte påstått

DOM-mätning av ett **markerat kort på eventdetaljen** mot ett **markerat kort på
åtgärds-sidan**, båda i körande app:

| Egenskap | Båda |
|---|---|
| `border-radius` | 12 px |
| kant | `1px solid rgb(96,107,87)` (`--mm-success`) |
| bakgrund | `rgb(240,253,244)` (`--mm-success-bg`) |
| namn | 16 px / 600 |
| metayta | padding 12/16/0/16 px |
| pill-slot | 120 px (den reserverade bredden — sågtand-skyddet) |

**En skillnad, förväntad och ofarlig:** identitetskolumnen mäter 177 px på
eventdetaljen mot 198 px på åtgärds-sidan. Kortet ligger i olika breda
containrar; pill-slotten är reserverad och identisk, vilket är det som skyddar
mot sågtanden.

**Beteendet mätt:** räknaren gick 14 → 13 vid avmarkering av ett kort, och
kortet låg kvar i listan i vitt läge.

**Infällningen mätt (varv 4b), 430×932:** panelen bär `hidden` vid inladdning
och räknar-knappen `aria-expanded="false"`; alla 14 korten finns i DOM:en (så
`aria-controls` pekar på ett verkligt element) men ritas inte. **Åtgärd-rubriken
står på 430 px och den sista av de sex åtgärdsraderna slutar på 751 px — hela
menyn ryms på första skärmen** (932 px), och sidans totalhöjd är 1101 px mot
varv 4a:s dryga 2000. Klick på räknaren fäller ut samtliga 14 kort.

Noll sidfel. **En avvikelse att känna till:** mot slutet av passet började
stagings Edge Functions svara med CORS-avslag på `4173` (`get-events`,
`get-registrations`, `get-event-notes`). Alla mätvärden och bilder ovan togs
FÖRE det; orsaken är inte utredd och `4173` står som tillåten i portkartan.
