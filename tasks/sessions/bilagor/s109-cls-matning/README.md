---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
---

# CLS-mätning — uppdateringsbannern på datatäta, autentiserade vyer (S109, 2026-08-21)

> **Varför passet finns.** Research-passet
> [`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](../../../../docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md)
> § *Vad jag inte kunde belägga* deklarerar öppet att dess CLS-tal är mätta på
> **inloggningsvyn** — den enda route som nås utan autentisering — och att
> *"talen för en datatät, autentiserad vy är **inte mätta**. De bör rimligen
> ligga i samma härad eller högre, men det är tolkat."* Samma pass listar
> mätningen som **första sak att göra före bygget**.
>
> Detta stänger den luckan. Tolv mätningar, tre vyportar × två lägen × två
> autentiserade vyer, mot den hermetiska fixturvärlden.

## Resultat — MÄTT 2026-08-21

Varje cell: `CLS` / bannerhöjd = nedknuffning av `<main>`. Samtliga tolv
mätningar gav **exakt ett** `layout-shift`-event med **`hadRecentInput: false`**.

| Vyport | Läge *info* ("nyare version finns") | Läge *chunk-fel* ("kunde inte laddas") |
|---|---|---|
| 1440 × 900 | **0,0142** / 49 px | **0,0142** / 49 px |
| 1280 × 800 | **0,0179** / 49 px | **0,0300** / 82 px |
| 390 × 844 | **0,1469** / 124 px | **0,1718** / 145 px |

`/personer` (50 rader ur fixturvärlden) och `/hem` gav **identiska tal i
samtliga tolv celler** — inte närliggande, identiska.

## Fyra fynd

### 1. Vyns datatäthet spelar ingen roll alls

Bannern är monterad i `__root.tsx`, ovanför `<main>`. Den förskjuter därför
hela sidan likformigt, och skiftets storlek bestäms av bannerns höjd mot
vyportens, inte av hur mycket innehåll som ligger under. Det är därför
`/personer` och `/hem` mäter lika.

### 2. Research-passets förväntan är HALVT FALSIFIERAD

Passet gissade *"samma härad eller högre"*. Utfallet:

| Bredd | Research (inloggningsvyn) | Denna mätning (autentiserat) | Utfall |
|---|---|---|---|
| 1440 px | 0,0335 | **0,0142** | **cirka hälften — "eller högre" faller** |
| 1280 px | 0,0376 | **0,0179** | **cirka hälften** |
| 390 px | 0,1469 | **0,1469** | **identiskt på fyra decimaler** |

**Den troliga mekanismen** (tolkad, ej mätt): CLS = *impact fraction* ×
*distance fraction*. Vid 390 × 844 ger 124 px nedknuffning en distance fraction
på `124 / 844 = 0,1469` med impact fraction ≈ 1,0 — hela vyporten påverkas, och
talet blir exakt nedknuffningens andel. På desktop täcker det förskjutna
området bara ~42 % av vyporten i de autentiserade vyerna mot ~99 % på
inloggningsvyn, sannolikt för att fasta element (app-huvud, TabBar) upptar yta
som inte rör sig. **Detta är en härledning ur talen, inte en mätning av impact
fraction.**

**Slutsatsen ändras inte:** vid 390 px spränger en enda visning fortfarande
`PERFORMANCE-BUDGET.md`:s mål (`<0,1`), och `ADR-078` beslut 4:s *"hopp i
layouten är absolut förbjudet i denna app"* gäller vid varje bredd. Men
desktop-fallet är **mätbart mindre allvarligt** än underlaget angav.

### 3. Chunk-fel-läget är det dyrare av de två — och det är läget rekommendationen behåller i flödet

| Bredd | info | chunk-fel | skillnad |
|---|---|---|---|
| 1440 px | 0,0142 | 0,0142 | ingen — strängen ryms på en rad |
| 1280 px | 0,0179 | **0,0300** | **+68 %** |
| 390 px | 0,1469 | **0,1718** | **+17 %** |

Orsaken är strängens längd: chunk-textens 148 tecken bryts till två rader vid
1280 px (49 → 82 px) och till fem vid 390 px (145 px, alltså **17 % av
vyporthöjden**).

Research-passets huvudförslag behåller **just detta läge** som banner i flödet,
med motiveringen att det redan står i vägen för användaren. Den avvägningen är
rimlig men var **okvantifierad**; den kostar nu ett känt tal.

### 4. Instrumentet bar en bugg som rättades före rapportering

Första körningen läste `firstElementChild` för att få bannerhöjden. För
info-läget är det rätt (den alltid monterade `role="status"`-wrappern har en
inre div), men för chunk-läget är elementet självt bannern, så mätningen
returnerade `<p>`-taggens höjd — 21 px där bannern är 82 px. **CLS-talen
påverkades aldrig**, men höjdkolumnen var falsk och gjorde chunk-läget att se
ut som ett *lägre* skift med ett *högre* CLS, vilket är fysiskt omöjligt.

Rättad genom att mäta bannerelementet självt **och** oberoende mäta
`<main>`:s topp före/efter. De två kolumnerna är nu identiska i alla tolv
celler, vilket är korsvalideringen: två oberoende vägar till samma tal.

## Metod

- **Klass:** `acceptance` (hermetisk fixturvärld, `tests/support/fixturvarld/`),
  som ger en seedad session och därmed **autentiserade** vyer med riktig data.
- **Triggern** är appens EGET window-event, inte en service worker:
  `mm:app-uppdatering-tillganglig` respektive `vite:preloadError`. `vite.config.ts`
  sätter `devOptions.enabled: false`, så SW:n existerar inte i dev-servern —
  samma form och samma skäl som `tests/webblasarbeteende/app-update-banner.test.ts`.
  Dispatchen sker i en retry-loop eftersom en engångsdispatch racar mot att
  app-bundeln registrerat sin lyssnare.
- **Observatören startas efter 1500 ms stilla sida**, så sidladdningens egna
  skift aldrig räknas in. Det som mäts är enbart bannerns bidrag.
- **`buffered: false`** — inga historiska entries.

## Ärliga begränsningar

- **Dev-server, inte produktionsbygge.** Samma begränsning som research-passet
  bar. Layoutgeometrin är densamma, men det är inte verifierat mot ett
  `vite build`.
- **Impact fraction är härledd ur talen, inte avläst.** Fynd 2:s förklaring är
  en tolkning. Att verifiera den kräver att `LayoutShift.sources` läses per
  entry, vilket inte gjordes.
- **Två vyer, inte alla.** `/personer` och `/hem`. Att de mäter identiskt gör
  det osannolikt att en tredje skulle avvika, men det är inte mätt.
- **Instrumentet är rivet ur `tests/`.** Det var en mätning, inte en grind, och
  hörde aldrig hemma i en klass som körs på varje PR. Källan ligger bevarad
  bredvid denna fil som [`instrument.ts.txt`](instrument.ts.txt) — kopiera till
  `tests/acceptance/` och kör `npm run test:acceptance -- ZZ-matning-cls`
  för att reproducera.
