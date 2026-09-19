# TASK-475 — spegel-beskedets nya form, för ögonmätning

Skärmbilder tagna 2026-09-19 mot den kod som ligger i PR:en för `TASK-475`.
De finns här, och inte i en sessions-temporär katalog, därför att kortets
AC #6 ("Marcus ögonmäter i dev-server innan Done") är obockad med avsikt —
bilderna ska överleva tills den mätningen är gjord.

## Vad Marcus ska titta efter

**Orden är INTE stämplade än.** Marcus formulering 2026-09-19 var *"typ
'Databasen har inte hunnit uppdateras för två betalningar. Beloppen här i
appen stämmer.'"* — och "typ" betyder att ordalydelsen gäller först när den
setts på plats. `ORDLISTA.md` är därför orörd i denna PR, och kortets AC #1
står obockad.

Tre saker att döma av:

1. **Meningen överst** — står den på rätt ställe, och säger den rätt sak?
   Den visas en gång per lista, bara när minst en rad berörs.
2. **Talet i meningen** — siffra (`2 betalningar`) i stället för utskrivet
   räkneord (`två betalningar`). Valet följer husets befintliga mönster för
   antal i löpande text (`1 person väntar på plats.`, `1 dag kvar`,
   `3 träffar`); förlagan skrev ut ordet.
3. **Timglaset på raden** — syns det utan att larma? Varningstriangeln är
   borta med avsikt: inget är fel, och ingen åtgärd krävs.

## Bilderna

Varje bild finns i fyra varianter: gruppvy/sökläge × 390/1280 px, i en
version **med** berörda rader och en **utan** (samma antal kort i båda, så
enda skillnaden är beskedet).

| Fil | Läge | Bredd | Berörda rader |
|---|---|---|---|
| `gruppvy-390-med.png` | gruppvy | 390 | ja |
| `gruppvy-390-utan.png` | gruppvy | 390 | nej |
| `gruppvy-1280-med.png` | gruppvy | 1280 | ja |
| `gruppvy-1280-utan.png` | gruppvy | 1280 | nej |
| `soklage-390-med.png` | sökläge | 390 | ja |
| `soklage-390-utan.png` | sökläge | 390 | nej |
| `soklage-1280-med.png` | sökläge | 1280 | ja |
| `soklage-1280-utan.png` | sökläge | 1280 | nej |

Fixturen är extremfallet med avsikt: ett realistiskt långt eventnamn
("Retreat för kropp och sinne i Rongne, hösten 2026") och ett sexsiffrigt
belopp (123 456 kr) på samtliga rader, så beskedet är den enda skillnaden
mellan korten.

## Mätvärden bakom formen

Korthöjd, kort **utan** markör mot kort **med** markör:

| Läge | Bredd | Före (`origin/main`) | Efter |
|---|---|---|---|
| sökläge | 390 px | 162 / **180** px | **166 / 166** px |
| sökläge | 1280 px | 100 / 100 px, men beloppet **bortklippt** | **122 / 122** px, beloppet synligt |
| gruppvy | 390 px | 144 / 144 px | 144 / 144 px |
| gruppvy | 1280 px | 100 / 100 px | 100 / 100 px |

Två fel rättades alltså, inte ett:

- **18 px höjdskillnad i sökläget @ 390 px** — det fynd granskningens runda 3
  på PR #2541 flaggade utan att kunna bevisa (inget test övade sökläget).
- **Beloppet klipptes bort @ 1280 px** — beloppsraden bar `eventnamn · belopp
  · besked` i en `sm:truncate`-span, och innehållet var 458 px mot 306 px
  tillgängligt. Raden slutade i "… hösten 202…" och varken beloppet eller
  beskedet syntes. Det felet fanns på `main` före denna skiva och är
  oberoende av spegel-beskedet; eventnamnet har därför fått egen rad.

Korten är 22 px högre i sökläget @ 1280 px och 4 px högre @ 390 px än
tidigare — priset för den extra raden, och det är samma för alla kort.

Talen kommer ur en mätrigg som kördes mot dev-servern med allt nätverk
`page.route`-mockat; riggen raderades efter mätningen, och kraven den mätte
bärs vidare av `tests/e2e/betalningar-inkorg-spegelbesked.staging.test.ts`.
