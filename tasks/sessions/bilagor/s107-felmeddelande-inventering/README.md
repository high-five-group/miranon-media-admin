---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: stable
---

# Visuell inventering — appens fel- och statusmeddelanden (S107, 2026-08-20)

> Framkallad i den körande appen och mätt med `getComputedStyle` /
> `getBoundingClientRect`, aldrig uppskattad. Underlag till Marcus dom
> 2026-08-20: *"Vi har samma problem med alla felmeddelanden ... det är så
> rigoröst fula."*
>
> **Detta är NULÄGET, inte en rekommendation.** Måttstocken kommer ur
> research-passet om notis- och felmeddelandeformer; denna fil säger bara vad
> vi har.

**Devtools-artefakt i bilderna:** cirkel-ikonen uppe till vänster och
`TanStack Router`-badgen uppe till höger är dev-only
(`src/routes/__root.tsx` rad 62, gated bakom `import.meta.env.DEV`). De finns
inte i produktion — bortse från dem.

> **Systerdokument — läs båda.** Denna fil mäter vad VI har. Vad BRANSCHEN
> gör, med CLS-mätningar och tre vägval, ligger i
> [`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](../../../../docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md).
> Ingen av filerna är självbärande utan den andra.

## Fem ytor, fyra designspråk

| # | Yta | Fil | Form | Layoutförskjutning |
|---|---|---|---|---|
| 1 | Uppdatering, info | `AppShell/AppUpdateBanner.tsx` | blå helbreddsrad, knapp i samma rad | **49 px** |
| 2 | Uppdatering, fel | samma komponent | orange helbreddsrad, två rader text | **82 px** |
| 3 | Offline | `AppShell/OfflineIndicator.tsx` | orange helbreddsrad, **ingen knapp** | **38 px** |
| 4 | MessageBox / SectionError | `primitives/MessageBox.tsx`, `ErrorBoundary/SectionError.tsx` | inline-ruta, 1px ram, 4px hörn, knapp under texten | ärver bredd blint |
| 5 | Appfel | `ErrorBoundary/AppError.tsx` | **ostylad inline-HTML, inga tokens** | 448 px kolumn |

## Mätvärden

**Uppdateringsbannern, info:** bakgrund `rgb(239,246,255)`, underkant 1px
`rgb(74,107,138)`, text `rgb(36,36,36)` 14px. Knappen mörk
(`rgb(40,41,40)`), 32px hög.

**Uppdateringsbannern, fel:** varning-orange, `role="alert"` i stället för
`role="status"`. Nästan dubbel höjd eftersom texten radbryts vid 1280px.
Lägena utesluter varandra — verifierat live (`infoStillRendered: false`).

**Offline:** bakgrund `rgb(253,244,238)`, underkant 1px `rgb(163,73,28)`.

**MessageBox:** 1px ram, `border-radius: 4px`, padding `12px 16px`,
brödtext 16px. Fyra intents; `error` mäter border `rgb(169,0,0)`, bakgrund
`rgb(254,242,242)`. Rubriken bär intent-färgen, brödtexten är **alltid**
neutral — medvetet designval per komponentens docblock.

**SectionError:** är internt en `MessageBox intent="error"`. Skalet överlever
(bottennav intakt, ingen header — app-regeln S73).

## Tre fynd

**Knappen hoppar med textlängden.** Uppdateringsbannerns knapp mättes till
`x:1021` i en 1280px vy — inte för att någon placerat den där, utan för att
den följer efter textens slut i en `justify-center`-rad. Längre text, längre
ut. Ögat måste läsa hela raden innan det vet var handlingen finns.

**Banderoller kan stapla sig.** Uppdateringsnotisen och offline-indikatorn
har **ingen spärr mot varandra** (till skillnad från uppdateringsbannerns egna
två lägen, som utesluter varandra explicit). Framkallade samtidigt: 49px +
38px = **87px** nedknuffat innehåll, två färgade rader ovanpå varandra.

**Bredden ärvs blint.** Samma `MessageBox` mäter 448px på `/glomt-losenord`
(`max-w-md`) och 600px på en route-yta. Ingen gemensam meddelande-bredd finns.

## Tre knappformer, tre breddregimer

Åtgärdsknappen placeras på tre olika sätt: bredvid texten med
textlängdsberoende position (1, 2), under texten vänsterjusterad (4), och
webbläsarens default (5). Yta 3 har ingen knapp alls.

Bredderna: helbredd (1, 2, 3), ärvd (4), 28rem (5).

## Sämst, och varför

**`AppError`** — men inte för att den är trasig. Den renderar med inline
styles, systemfont, ren `<button>` och noll design-tokens **med avsikt**: den
ska överleva ett dött stylesheet, vilket dess docblock motiverar korrekt.

Följden är ändå att den enda yta där något verkligen gått fel är den enda som
**inte ser ut som Miranon Media Admin**.

**Ej reproducerad live.** Den ligger ovanför routern i `main.tsx`, så ingen
route kan nå den. Vägen via korrupt `localStorage` prövades i källan och
avfärdades: `PersistQueryClientProvider`s restore ligger i en `useEffect` med
egen `.catch()` och blir aldrig ett render-fel. Beskrivningen ovan är läst ur
koden, inte fabricerad.

## Bilderna

| Fil | Visar |
|---|---|
| `00-baseline-hem.png` | `/hem` utan feltillstånd — referens |
| `01-appupdatebanner-info.png` | Uppdatering, info-läget |
| `02-appupdatebanner-reload-required.png` | Uppdatering, fel-läget |
| `03-offlineindicator.png` | Offline-indikatorn ensam |
| `04-messagebox-alla-intents-dev.png` | Alla fyra intents + avvisningsbar variant |
| `05-sectionerror.png` | Sektionsfel i Outlet-positionen, skalet intakt |
| `06-messagebox-real-glomt-losenord.png` | `MessageBox` i levande vy, äkta valideringsfel |
