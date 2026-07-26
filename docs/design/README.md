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

## Hur skalförslagen är gjorda

De föreslagna skalorna följer [Radix tolvstegsmodell](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale),
där varje steg är en UI-roll och inte en godtycklig nyans: sidbakgrund,
komponentytor, kanter, solida ytor, text.

Skalorna genereras i OKLCH därför att lika stora ljushetssteg där också ser lika
stora ut — samma skäl som fick Tailwind att definiera om hela sin palett i den
rymden i version 4. Varumärkesfärgen är alltid ankare och flyttas aldrig: steg 9
är exakt den kulör appen redan bär, och resten byggs ut från den.

Varje förslag prövas mot de kontrakt Radix garanterar för sina egna skalor —
att steg 11 når läsbar kontrast mot steg 2, att steg 9 duger som UI-yta, och så
vidare. Kontrakten står under respektive skala i atlasen, med uppmätt värde.
Ett kontrakt som faller döljs inte.

Matematiken bor i `scripts/lib/farg.mjs`, skalgenereringen i
`scripts/lib/skala.mjs`.

## Status

Förslagen är **förslag**. Ingenting av det är implementerat i appen, och
`src/styles/tokens/` är orört. Atlasen dokumenterar och föreslår; besluten är
inte fattade.
