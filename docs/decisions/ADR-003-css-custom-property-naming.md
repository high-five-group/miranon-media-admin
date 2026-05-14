# ADR-003: CSS custom property-namnkonvention (bindestreck, inga perioder)

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 0

## Kontext

[DESIGN-SYSTEM-SPEC.md](../specs/DESIGN-SYSTEM-SPEC.md) §1 specificerade ursprungligen spacing-tokens med punktnotation för halvsteg:

```css
--p-space-0: 0;
--p-space-0.5: 0.125rem;  /* 2px */
--p-space-1: 0.25rem;     /* 4px */
--p-space-1.5: 0.375rem;  /* 6px */
```

Detta ärvdes från Tailwinds spacing-skala där utility-klasserna heter `p-0.5`, `m-1.5` etc. Notationen ser bekant och naturlig ut.

**Men:** när vi kopierade tokens till `src/styles/tokens/primitives.css` och körde `biome check` i Fas 0, exploderade parsern:

```
src/styles/tokens/primitives.css:73:23 parse
  × expected `,` but instead found `rem`
  > 73 │   --p-space-1.5: 0.375rem;  /* 6px */
       │                       ^^^
```

244 cascading parse-fel. Biomes CSS-parser (och Lightning CSS i `@tailwindcss/vite`) tolkade `--p-space-1.5` som `--p-space-1` följt av `.5` (en orphan decimal). Resten av filen gick sönder eftersom parsern aldrig återhämtade sig.

**Formell CSS-spec:** Custom property-namn följer `<dashed-ident>`-grammatiken, som ärver från `<ident-token>`. Perioder är inte tillåtna i identifierare utan escaping (`\.`). Browsers är permissiva och accepterar `--p-space-1.5` i praktiken, men strikta parsers som Biome och Lightning CSS följer speccen.

## Beslut

Använd **bindestreck** för decimal-platser i CSS custom property-namn:

```css
--p-space-0: 0;
--p-space-0-5: 0.125rem;  /* 2px */
--p-space-1: 0.25rem;     /* 4px */
--p-space-1-5: 0.375rem;  /* 6px */
```

Uppdaterade **både** [DESIGN-SYSTEM-SPEC.md](../specs/DESIGN-SYSTEM-SPEC.md) §1 (i Vue-repot, committad + pushad) och `src/styles/tokens/primitives.css`.

## Alternativ som övervägdes

**1. Escapa punkten (`--p-space-0\.5`)**

- **Fördelar:** Bevarar original-notationen, följer CSS-specens regler för identifiers med specialtecken.
- **Nackdelar:** Ful att läsa, fel-prone vid copy-paste, och — kritiskt — Biomes parser accepterar det inte ändå (testat). Lightning CSS skulle troligen också haft problem.

**2. Underscore (`--p-space-0_5`)**

- **Fördelar:** Tydligt skiljer från siffer-bindestreck (`--p-space-1` är inte relaterad till `--p-space-2`).
- **Nackdelar:** Avviker från Tailwinds egen konvention (alla primitiva tokens i Tailwind v4 själv använder bindestreck: `--spacing-0-5`). Skulle skapa två stilar i projektet.

**3. Bara heltal (`--p-space-0`, `--p-space-1`, hoppa över 2px/6px)**

- **Fördelar:** Enklast, inga konflikter.
- **Nackdelar:** 4px-basen kräver halvsteg för fine-tuning (ikon-padding, divider-gaps). Att eliminera dem skulle kräva omarbetning av hela spacing-skalan.

**4. Ignorera Biome-felet och köra med lint-warning**

- **Fördelar:** Ingen förändring i spec.
- **Nackdelar:** Lightning CSS i `@tailwindcss/vite` skulle fortfarande krascha vid dev/build. Inte ett alternativ — det fungerar bokstavligen inte.

## Konsekvenser

**Positivt:**

- `biome check` passerar på hela `src/styles/`
- `@tailwindcss/vite` bygger utan parser-fel
- Namnen är läsbara (`--p-space-0-5` = "0.5" steg)
- Överensstämmer med Tailwinds egen token-konvention
- Universell lärdom: `[UNIVERSAL]` i `tasks/lessons.md` — "CSS custom properties: undvik perioder i namn"

**Negativt:**

- `--p-space-1-5` kan förväxlas med `--p-space-1` följt av `-5` vid snabb läsning, men kontexten (spacing-sektion) gör det tydligt
- DESIGN-SYSTEM-SPEC.md i Vue-repot måste synkas till denna notation — gjordes som en separat commit i miranon-media-os: `fix: --p-gold-700 #96680A + --p-space-0-5 namnfix (synk med React-repo)`

**Följdbeslut som denna ADR möjliggjorde:**

- Vi upptäckte två buggar i DESIGN-SYSTEM-SPEC samtidigt: `--p-gold-700` hade fel värde (#8E5F07 istället för #96680A, se conversion-plan fotnot 10) och spacing-namnen. Båda fixades i samma Vue-repo-commit.

## Referenser

- `tasks/lessons.md` — universell lärdom tillagd i Fas 0-avslutet
- `docs/specs/DESIGN-SYSTEM-SPEC.md` §1 — uppdaterad spec
- `src/styles/tokens/primitives.css` — implementationen
- Vue-repo commit `7013896` — synkning av DESIGN-SYSTEM-SPEC.md
