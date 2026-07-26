# Färgatlas

Nuläget i appens färgsystem, mätt och renderat — plus vad som saknas och hur en
fullständig palett skulle se ut.

Atlasen läser tokens ur `src/styles/tokens/*.css` och räknar användningen i
`src/` i stället för att upprepa dem. En handskriven palettdokumentation börjar
ljuga första gången någon ändrar ett tokenvärde utan att uppdatera doket, och en
palett man inte litar på är värre än ingen alls.

## Filerna

| Fil | Vad den är |
|---|---|
| `farg-atlas.html` | Den visuella atlasen. Öppna i webbläsare. Självständig — inga externa beroenden |
| `farg-atlas.tokens.json` | Maskinläsbar, [DTCG 2025.10](https://www.designtokens.org/tr/drafts/format/). Konsumeras av Figma, Style Dictionary och liknande |
| `farg-atlas.fynd.json` | Auditens fynd. **Den enda handskrivna filen** — allt annat härleds ur koden |

## Bygga om

```bash
npm run atlas
```

Ändras ett tokenvärde i appen följer atlasen med. Kör om efter varje ändring i
`src/styles/tokens/`, så kan de två aldrig hamna i otakt.

## Hur skalorna är gjorda

Skalorna följer [Radix tolvstegsmodell](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale),
där varje steg är en UI-roll och inte en godtycklig nyans: sidbakgrund,
komponentytor, kanter, solida ytor, text.

De genereras i OKLCH därför att lika stora ljushetssteg där också ser lika stora
ut — samma skäl som fick Tailwind att definiera om hela sin palett i den rymden
i version 4. Varumärkesfärgen är ankare och blir steg 9, så identiteten är
oförändrad och resten byggs ut från den.

Ankaret är flyttat i exakt en skala: blå. Skälet står i fynd F10 — den gamla
info-blå låg för nära fokusringen för att gå att skilja från den.

Varje skala prövas mot de kontrakt Radix garanterar för sina egna — att steg 11
når läsbar kontrast mot steg 2, att steg 9 duger som UI-yta, och så vidare.
Kontrakten står under respektive skala med uppmätt värde. Ett kontrakt som
faller döljs inte: guldets steg 9 når 2,57:1 mot vit yta och redovisas som
brutet, eftersom en mättad gul-orange inte kan nå 3:1 vid den ljusheten.

Matematiken bor i `scripts/lib/farg.mjs`, skalgenereringen i
`scripts/lib/skala.mjs`.

## Verifiering

```bash
npm run atlas
```

bygger om, formaterar och kör `scripts/verifiera-farg-atlas.mjs` — drygt tusen
kontroller som prövar varje påstående i atlasen mot källkoden.

Verifieraren är avsiktligt **oberoende** av generatorn: kontrastformeln,
CIE-matematiken, tokenutläsningen och användningsräkningen är skrivna en gång
till ur specifikationerna i stället för importerade. En verifiering som lånar
generatorns kod bekräftar bara att koden är konsekvent med sig själv. Den
ordningen fångade fyra verkliga räknefel första gången den kördes.

## Status

Skalorna ligger i `src/styles/tokens/primitives.css` men **ingen roll pekar på
dem ännu** — appen renderar oförändrad. Det som finns är materialet, färdigt
att väljas ur.

Migreringen av `--mm-*`-rollerna till de nya skalorna är ett eget beslut och
det som ändrar appens utseende.
