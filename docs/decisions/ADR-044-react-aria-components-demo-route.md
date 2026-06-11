# ADR-044: react-aria-components som primitiv-bas + demo-route i stället för Storybook

- Status: Accepted
- Datum: 2026-06-10
- Fas: 3 (UI-primitiver)

## Kontext

Byggplanens §4 Fas 3-scope angav "React Aria-hooks som bas (useButton,
useTextField, etc.)". Vid Fas 3-start (Session 14) visade orienterings-passet
att paketläget redan divergerade: react-aria-components ^1.16.0 installerat,
umbrella-paketet `react-aria` saknas (endast tre scopade hook-paket finns som
transitiva beroenden). Samtidigt är ACCESSIBILITY-CHECKLIST.md §6
(React Aria-mönsterbiblioteket som Fas 6 konsumerar) och §9
(Code-promptmallen) helt skrivna mot components-API:t. Byggplanen lämnade
också demo-ytan öppen: "Storybook om det inte introducerar för stor
build-time-kostnad — annars /dev/primitives-route".

Per projektregeln "avvik aldrig utan att uppdatera byggplanen först" och
web-research-disciplinen (hub-CLAUDE.md) gjordes research med förstapartskälla
före beslut.

## Beslut

1. **react-aria-components är bas för samtliga Fas 3-primitiver.** Adobes
   egen dokumentation rekommenderar React Aria Components som startpunkt för
   nya komponenter, med nedstigning till hooks endast när ytterligare
   flexibilitet krävs
   (`react-spectrum.adobe.com/react-aria/react-aria-components.html`).
   Komponenterna bygger på hooksen och kan
   blandas per komponent — reservutgången finns kvar utan arkitekturbyte.
2. **Demo-yta = /dev/primitives-route, inte Storybook.** Routen
   render-guardas till dev-läge (import.meta.env.DEV). Storybook omprövas
   om primitiverna paketeras som fristående Mm Component Library.
3. Byggplanens §4 Fas 3-scope-text korrigeras i samma commit som denna ADR.

## Alternativ som övervägdes

**Alt 1 — Scopade React Aria-hooks per byggplanens ursprungstext.** Avvisat:
mot förstapartskällans explicita rekommendation för nya komponentbibliotek;
hade krävt fler paket än components-vägen (umbrella-paketet saknas); hade
gett två API-stilar i kodbasen eftersom ACCESSIBILITY-CHECKLIST §6/§9 redan
är skrivna mot components.

**Alt 2 — Storybook som demo-yta.** Avvisat på byggplanens eget villkor
(kostnad): stort @storybook/*-devdependency-träd ger större audit-ci-yta och
löpande underhållsbörda, oproportionerligt för 6 primitiver. /dev/primitives
renderar dessutom primitiverna i appens riktiga kontext (samma tokens,
Tailwind-pipeline) och blir direkt körbar mot Fas 3.5:s kommande
Playwright/axe-runner. Omprövningsvillkor: fristående komponentbiblioteks-
paketering.

**Alt 3 — Bygga mot hooks men dokumentera mot components.** Avvisat utan
djupare analys: permanent inkonsistens mellan kod och spec-lager.

## Konsekvenser

- Alla 6 primitiver (Button, Input, Select, MessageBox, Modal, Dialog) byggs
  med react-aria-components + CVA-varianter; enhetligt API med Fas 6:s
  mönsterbibliotek.
- Inga nya runtime-beroenden; inga Storybook-devberoenden.
- Fas 3.5:s a11y-runner får en stabil måltavla (/dev/primitives) i appens
  egen build.
- Byggplanens scope-text och faktiskt bygge är åter konsistenta; framtida
  läsare ser beslutsspåret här i stället för tyst drift.
