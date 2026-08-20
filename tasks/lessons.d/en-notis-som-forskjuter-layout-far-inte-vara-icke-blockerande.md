# En notis som förskjuter layout får inte vara icke-blockerande

Mätt, inte tyckt. Vår uppdateringsbanner kostar per visning:

| Bredd | Bannerhöjd | CLS | `hadRecentInput` |
|---|---|---|---|
| 1440 | 49 px | 0,0335 | `false` |
| 1024 | 49 px | 0,0468 | `false` |
| 390 | **124 px** | **0,1469** | `false` |

Samma budskap överlagrat: **0,0000**, noll skiften.

`hadRecentInput: false` betyder att förskjutningen räknas fullt ut som oväntad
enligt web.devs definition (undantaget kräver inmatning inom 500 ms). **Vid
390 px spränger en enda visning hela prestandabudgetens CLS-mål.**

**Långtextsträngen är mätbart halva problemet:** 118 tecken bryts till tre rader
under 1024 px och dubblar höjden. "Den trycker ner innehållet" och "texten är
för lång" var samma invändning.

**Regeln, från designsystemen:** förskjut aldrig layout för något som inte
kräver handling nu. Carbon och Material tillåter banner i flödet för
system-budskap, men kräver placering **under app-huvudet**, inte som en remsa
över viewportens topp — och Carbon säger rakt ut *"Do not cover other content
with a banner notification."*

**Regeln, hos oss, är hårdare:** `ADR-078` beslut 4 — *"hopp i layouten är
absolut förbjudet i denna app"*. Där branschen tillåter två former väljer vår
egen regel bort den ena.

Instans: S107 2026-08-20,
`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`.
