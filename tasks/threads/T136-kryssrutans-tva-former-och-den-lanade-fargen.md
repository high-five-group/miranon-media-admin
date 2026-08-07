---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T136 — Kryssrutorna hade två former, och den ena färgen var webbläsarens

> Tråd-kort (ADR-053), fött i S100 varv 14 på Marcus order efter att två
> kryssformer hamnade bredvid varandra på åtgärds-sidan. Registrerad som
> **defer**: den blockerar inte pågående arbete, men app-svepet är eget arbete
> och mätningarna är för substantiella för en indexrad.

Marcus, verbatim:

<!-- vale Vale.Repetition = NO -->
<!-- Citatet är ORDAGRANT och behåller sitt "kan kan"; Vale.Repetition fäller
     på det, men ett citat rättas inte åt talaren. Undantaget är radlokalt. -->
> *"nu har vi också flera olika typer av checkboxar. En blå och en svart. Jag
> gillar den blåa mer faktiskt. Vi kan kan införa den i hela appen. Men samma
> sak här som med pills och knappar, inventera och kolla."*
<!-- vale Vale.Repetition = YES -->

Det är samma klass som `T125` (knapparna) och `T130` (pillarna): en form som
drivit isär, upptäckt först när två varianter mötte varandra på en yta.

## Inventeringen

Grep över `src/` — **fem** kryss i **två** former:

| Form | Antal | Var |
|---|---|---|
| RAC, exakt samma klassrad | **4** | `Betalningar.tsx:216` · `Deltagare.tsx:1167` · `CheckinPrototyp.tsx:676` · `AtgardsSida.tsx` |
| native `<input type="checkbox">` | **1** | `AtgardsSida.tsx`, bilageväljaren |

De skilde sig i **tre** mått samtidigt: 16 mot 20 px, radie 0 mot 4 px, och
färg.

## Den blåa var en bugg, inte ett val

Native-krysset bar `accent-[var(--mm-color-primary)]` — och
`--mm-color-primary` finns **ingenstans** i `src/styles/`. DOM-mätt löser
variabeln till tom sträng, `accent-color` föll därmed till `auto`, och blått var
**webbläsarens default**: på macOS användarens egen systemaccent, ändringsbar i
Systeminställningar.

Kontrollmätningen avgjorde det: ett kryss **helt utan** accent-klass renderade
identiskt blått.

Färgen var alltså inte reproducerbar — Lotta hade kunnat se en annan färg än
Marcus på samma skärmbild. Buggen kom in i varv 10, i denna session.

## RAC vann över native, av mätbara skäl

`accent-color` kan bara styra **färg** — aldrig radie, storlek eller bockens
form. Native hade därför aldrig kunnat matcha de fyra andra. RAC är dessutom
appens etablerade (4 av 5).

## Färgen landade i fyra hugg

Varje steg är Marcus val, och varje avvisning är en mätning.

**1 · Blå (`--p-blue-9`).** Varv 14. Höll 5,48:1 på båda axlarna. Blå-valet var
palettens eget: steget flyttades 2026-07-26 medvetet till perceptuellt avstånd
**27,3** från fokusringens `#1B4965` — *"fokusringen är den DOVA mörkblå, info
är den KLARA"* — vilket är exakt vad en fokuserad kryssruta behöver.

**2 · Guld.** Marcus: *"jag tror vi ska byta färg till typ gul/guld eller vad vi
har i paletten."* Guld tvingade fram **två** ändringar, inte en — bocken kunde
inte förbli vit. Paletten hade förutsett risken och skrivit den som varning
(`primitives.css` rad 21–24, fynd F9):

> *"Guld steg 9 når 2,57:1 mot vit yta och klarar alltså inte WCAG 1.4.11 (3:1)
> som UI-yta. Det är fysiken hos en mättad gul-orange, inte ett fel i skalan —
> behövs guld som yta mot vitt är steg 10 den ljusaste som duger."*

Hela fältet DOM-mätt med **plattan som ensam bärare** (bock/platta ·
platta/vit):

| Kandidat | Bock | Platta |
|---|---|---|
| `gold-9` + vit bock | 2,57 ✗ | 2,57 ✗ |
| `gold-9` + mörk bock | 6,04 ✓ | 2,57 ✗ |
| `gold-10` + mörk bock | 5,08 ✓ | 3,06 ✓ |
| `gold-10` + vit bock | 3,06 ✓ | 3,06 ✓ |
| `gold-11` + vit bock | 4,91 ✓ | 4,91 ✓ |
| *(blå, referens)* | *5,48* | *5,48* |

**3 · Steg 9, med kanten som bärare.** Marcus efter att ha sett fältet: *"Jag
gillade mest gold 9, den översta, syntes ju supertydligt."* Steg 9 är precis det
paletten varnar för — men **varningen gäller plattan som ensam bärare**.
Appens etablerade lösning står i `Deltagare.tsx` rad 1068 och i åtgärds-sidans
eget markerbara kort:

> *"KANTEN ÄR WCAG 1.4.1-BÄRAREN — inte den gröna plattan … Plattan mäter
> 1,05:1 mot vitt och bär i praktiken ingenting för den färgblinde. Tona aldrig
> ned kanten."*

Markeringskorten på **samma sida** kör alltså redan en platta på 1,05:1.
Gold-9:s 2,57 är dubbelt så stark som den. Mätt med kanten som bärare
(bock/platta · kant/vit): `gold-11` kant **6,04 · 4,91** · `gold-12` kant
**6,04 · 11,07** · mörk kant **6,04 · 15,52**.

**4 · Steg 10 med vit bock — slutligt val.** Marcus: *"Det gick inte att få en
vit bock inuti checkboxen? Skulle bli mycket snyggare."* Det gick, men inte på
steg 9, och skälet skiljer sig från hugg 3:

**Bocken mäts mot plattan den ligger på, oberoende av kanten.** Kant-tricket
löser plattan mot *bakgrunden* — det gör ingenting för bocken mot plattan. Enda
vägen till en laglig vit bock var att flytta plattan ett steg.

Skillnaden `#d4960a` → `#c28900` syns knappt sida vid sida; skillnaden mörk →
vit bock syns direkt.

## Slutlig form

| Token | Värde | Mätning |
|---|---|---|
| `--mm-checkbox-selected-bg` | `--p-gold-10` | platta mot sida **3,06:1** |
| `--mm-checkbox-selected-border` | `--p-gold-11` | kant mot sida **4,91:1** |
| `--mm-checkbox-check` | vit | bock mot platta **3,06:1** |

Storlek **16×16**, radie 4 px. Alla tre över WCAG 1.4.11:s 3:1.

**Plattans marginal är två hundradelar.** Kanten står därför kvar som otvetydig
bärare och får aldrig tonas ned. Ändras plattans ton måste både bocken och
kanten mätas om; `gold-11` (4,91:1) är reservvalet.

## Kvarstår för svepet

- **De tre andra kryssen** bär fortfarande `bg-text` (svart) och 20 px. De bor i
  filer S93 äger och rördes inte härifrån.
- **Måttet är en öppen fråga.** Åtgärds-sidan gick till 16 px på Marcus *"Kan vi
  göra checkboxen lite mindre? Känns ganska stor"*; de andra står på 20. Vilket
  som blir appens avgörs när svepet tas — avvikelsen är medveten och bokförd,
  inte drift.
- **Frågan RAC kontra native är avgjord** för vår del (se ovan) och behöver inte
  tas om.

## Numret flyttade vid landning

Tråden mintades som `T134` efter re-verifiering mot `origin/main` i
mint-ögonblicket. Mellan mint och paus-landning hann en parallell session ta
både `T134` och `T135`, och raden flyttades därför till `T136` vid
konfliktlösningen. Commits från varv 14–18 bär taggen `[T134]` i sina
meddelanden — den historiken kan inte skrivas om, och noteras här i stället.

Det är andra gången samma dag numret rörde sig under passet; resume-handoffen
varnade uttryckligen för att `S93` och `S99` mintar snabbt.

Besläktad: `T125` (samma klass, knappar) · `T130` (samma klass, pillar — dess
"primitiven finns, uppgiften är migrering"-analys gäller ordagrant här) ·
`T119` (mekaniserings-programmet).
