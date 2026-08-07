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
| `v4-atgarder-mobil.png` | Hela sidan: sidhuvud · översta blocket med BARA väljaren · räknaren · de gröna deltagarkorten · plockar-ingången · åtgärdsmenyn · betalningarna |
| `v4-plockare.png` | "Lägg till fler personer från eventet" öppen — de omarkerade som kompakta kort |
| `v4-avmarkerad.png` | Efter avmarkering av ett kort: räknaren 14 → 13, kortet vitt men kvar i listan |
| `v4-utfalld.png` | Bekräftelse-åtgärden utfälld in-place |
| `v4-atgarder-desktop.png` | Samma sida i 1280 px |
| `ref-eventdetalj-markerat-kort.png` | **Förlagan**: ett markerat kort på eventdetaljen |

## Tre ändringar mot varv 3

1. **Mottagarna bär `Deltagare` § `MarkerbartKort`**, inte gruppdynamikens
   kompakta kort. Varv 3 mötte henne med en annan kortform än den hon just
   klickat på.
2. **Räknaren först** — "14 av 16 deltagare markerade", före listan.
3. **Översta blocket bär bara eventväljaren.** Sammanfattningen och
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

Noll sidfel. **En avvikelse att känna till:** mot slutet av passet började
stagings Edge Functions svara med CORS-avslag på `4173` (`get-events`,
`get-registrations`, `get-event-notes`). Alla mätvärden och bilder ovan togs
FÖRE det; orsaken är inte utredd och `4173` står som tillåten i portkartan.
