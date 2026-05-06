# ADR-002: Tailwind v4 `@theme` CSS-first (ingen `tailwind.config.ts`)

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 0

## Kontext

Tailwind v4 släpptes med en fundamentalt ny arkitektur: **CSS-first configuration**. Istället för en `tailwind.config.ts`/`js`-fil där tokens definieras i JavaScript-objekt kan man nu definiera hela temat direkt i CSS med `@theme`-direktivet:

```css
@import "tailwindcss";
@theme {
  --color-primary: var(--mm-primary);
  --text-body: 1rem;
  /* ... */
}
```

Detta är parsat av `@tailwindcss/vite` (som använder Lightning CSS internt). Ingen `postcss.config.js`, ingen `autoprefixer`-dep, ingen `tailwind.config.ts`.

Initial versionen av `docs/conversion-plan.md` (pre-session 30) hade en full `tailwind.config.ts` utan motivering — den ärvdes tyst från research. Gap-analysen 2026-04-13 (Vue-repo session 30) upptäckte avvikelsen: research §4 rekommenderade `@theme`, men DESIGN-SYSTEM-SPEC §8 hade en config-fil. Detta ledde till en ny version av conversion-plan (behållen) och en arkiverad version (`conversion-plan-v1-sidebar.md`).

## Beslut

Använd **Tailwind v4 `@theme` CSS-first** istället för `tailwind.config.ts`:

- `src/styles/tailwind.css` innehåller `@import "tailwindcss"` + `@theme { ... }`
- Alla token-referenser pekar via `var()` på `--mm-*`-semantiska tokens i `src/styles/tokens/semantic.css`
- `--color-*: initial` / `--font-*: initial` / `--text-*: initial` nollställer Tailwind-defaults så vi äger hela paletten
- `@tailwindcss/vite` är den enda plugin-poängen; Lightning CSS (inbyggt) hanterar vendor prefixing och syntax transforms
- **Ingen `postcss.config.js`, ingen `autoprefixer`, ingen `tailwind.config.ts`**

Det fullständiga `@theme`-blocket specificerades i [DESIGN-SYSTEM-SPEC.md](../DESIGN-SYSTEM-SPEC.md) §8 och kopierades exakt in i `src/styles/tailwind.css`.

## Alternativ som övervägdes

**1. `tailwind.config.ts` (v3-mönstret, fortfarande stött i v4)**

- **Fördelar:** Bekant för alla Tailwind-användare, typsäker config via TypeScript, massvis med dokumentation och Stack Overflow-svar.
- **Nackdelar:** Dubbel sanningskälla (tokens i CSS custom properties + tokens i TS-fil), kräver PostCSS-kedja, JS-baserad config kör i Node-tid vilket ökar build-tid. Går emot v4:s designfilosofi där CSS själv är konfigurationen.

**2. Hybrid: `tailwind.config.ts` + CSS custom properties**

- **Fördelar:** Progressiv migration från v3.
- **Nackdelar:** Värsta av båda världarna. Utility-klasser är inte färgade av CSS custom properties — de är statiska värden. Vi hade behövt dubblera: en för JS (`colors.primary: '#D4960A'`) och en för CSS (`--mm-primary: #D4960A`). Bräckligt.

## Konsekvenser

**Positivt:**

- En sanningskälla per token-lager: primitives.css → semantic.css → `@theme`-blocket
- `--color-primary` → `--mm-primary` → `--p-gold-500` → `#d4960a` i en tydlig kedja
- Tokens är runtime-bytbara via `document.documentElement.style.setProperty('--mm-primary', '#...')` (användbart för temaväxling)
- Ingen `tailwind.config.ts`, ingen `postcss.config.js`, ingen `autoprefixer` i `package.json` → färre dependencies att underhålla
- `@tailwindcss/vite` är dev-dep, plugin i `vite.config.ts` — slut

**Negativt:**

- Dokumentation för `@theme`-mönstret är tunnare än för `tailwind.config.ts` (2026)
- Vissa Tailwind-plugins (`@tailwindcss/typography`, `@tailwindcss/forms`) har inte fullt stöd för `@theme` än — vi använder inte dem ännu
- Biomes CSS-parser krävde `tailwindDirectives: true` för att förstå `@theme`-blocket (extra config)
- Lint-regeln `no-arbitrary-value` (blockera `text-[19px]`) planeras i Fas 7 — den finns inte out-of-the-box i Biome 2.4

**Följdbeslut som denna ADR möjliggjorde:**

- Tre-lagers token-arkitektur kan leva helt i CSS utan JS-duplicering
- [ADR-003](ADR-003-css-custom-property-naming.md) upptäcktes genom Biomes CSS-parser när vi skrev riktiga tokens

## Referenser

- `docs/specs/DESIGN-SYSTEM-SPEC.md` §8 — det fullständiga `@theme`-blocket
- `docs/conversion-plan.md` F.3 — motivering och ändringsspec 2026-04-13
- `src/styles/tailwind.css` — implementationen
- `vite.config.ts` — `@tailwindcss/vite`-pluginet
