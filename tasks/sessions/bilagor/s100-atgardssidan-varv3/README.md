# Åtgärds-sidan — konvergens-varv 3 (S100, 2026-08-07)

Bilder ur `/event/$eventId/atgarder` mot **riktig staging-data** (16 anmälda på
granskningsfixturen `ZZ-GRANSKNING-FIXTUR`), dev-server på `4173`, viewport
430×932 (mobil) respektive 1280×1000 (desktop). Prototyp-växlarens rail är
bortdöljd i bilderna så ytan syns — den finns kvar i appen.

Varv 3 rättar varv 2:s underleverans mot **fyra Marcus-krav** (2026-08-07); alla
fyra är kopieringar ur befintliga ytor, inte nya påfund. Se sessionsdok S100
Del 3 för kraven i sin helhet och `AtgardsSida.tsx`s docblock för var varje form
är hämtad.

| Fil | Visar |
|---|---|
| `v3-atgarder-mobil.png` | Hela sidan: sidhuvud med rund chevron + linje, översta blocket, mottagar-personkorten, åtgärdsmenyn, betalningsingången |
| `v3-plockare.png` | Sökningen öppen — träffarna listas som PERSONKORT, inte rader |
| `v3-utfalld.png` | Bekräftelse-åtgärden utfälld in-place med de övriga raderna kvar |
| `v3-atgarder-desktop.png` | Samma sida i 1280 px |
| `v3-tomt.png` | Tomma läget (`/atgarder`) — eventväljaren fristående |
| `ref-manuell-anmalan.png` | **Förlagan**: Manuell anmälan, som sidhuvudet och översta blocket är kopierade ur |

## Mätt, inte påstått

Två DOM-mätningar kördes mot körande app, inte mot koden:

**Personkortet vs eventdetaljens (`Gruppdynamik`):** identiskt på samtliga
uppmätta egenskaper — `border-radius` 12 px, `background` `rgb(255,255,255)`,
`padding` 10/12/10/12 px, transparent 1 px-kant, `row-gap` 8 px;
initial-cirkeln 36×36 px i `rgb(237,238,233)` med 14 px/600; namnet 16 px/500 i
`rgb(36,36,36)`.

**Sidhuvudet vs Manuell anmälans:** identiskt — `border-bottom`
`1px solid rgb(225,227,225)`, `padding` 0/16/20/16 px, `row-gap` 6 px; `h1`
30 px/600 med `line-height` 36 px; tillbaka-chevronen 44×44 px, rund, i
`rgb(245,245,243)`, `margin` 16 px, ikonen 26×26 px.

Noll sidfel, noll konsolfel, noll 4xx-svar under passet.
