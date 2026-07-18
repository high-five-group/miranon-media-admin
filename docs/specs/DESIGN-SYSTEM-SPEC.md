
# DESIGN-SYSTEM-SPEC.md — Teknisk specifikation

*Operativ motpart till DESIGN-MANIFESTO.md*
*Skapad: 2026-04-05 | Gäller: miranon-media-admin*
*Reponamn: miranon-media-admin (inte miranon-media-admin-react)*

---

## 1. Token-arkitektur

### Tre lager

```text
PRIMITIV          → Råa värden. Aldrig refererade direkt i komponenter.
    ↓
SEMANTISK         → Mening. Vad värdet *gör*. Refereras i @theme-blocket i tailwind.css.
    ↓
KOMPONENT         → Komponentspecifik. Refereras i komponentens CSS/Tailwind.
```

Regeln: **En komponent får aldrig referera en primitiv token.**
Om du skriver `text-gold-500` i en komponent har du brutit arkitekturen.
Du skriver `text-primary` som pekar på `--mm-primary` som pekar på `#D4960A`.

### Primitiva tokens (tokens/primitives.css)

```css
:root {
  /* ── Guld/Amber-skala ── */
  --p-gold-100: #FBF3E0;
  --p-gold-200: #F5E6BC;
  --p-gold-300: #F0D68A;
  --p-gold-400: #C4A840;
  --p-gold-500: #D4960A;
  --p-gold-600: #B8800A;
  --p-gold-700: #96680A;

  /* ── Copper-skala ── */
  --p-copper-100: #FDF4EE;
  --p-copper-200: #F5D8C4;
  --p-copper-400: #C46A3A;
  --p-copper-500: #A3491C;
  --p-copper-600: #8A3D17;

  /* ── Neutrala ── */
  --p-neutral-0: #FFFFFF;
  --p-neutral-25: #FAFAF8;
  --p-neutral-50: #F5F5F3;
  --p-neutral-100: #EDEEE9;
  --p-neutral-200: #E1E3E1;
  --p-neutral-300: #C4C4C2;
  --p-neutral-400: #898989;
  --p-neutral-500: #6B6B6B;
  --p-neutral-600: #525151;
  --p-neutral-700: #3A3A3A;
  --p-neutral-800: #282928;
  --p-neutral-900: #242424;
  --p-neutral-1000: #1A1A1A;

  /* ── Semantiska färger (primitiva) ── */
  --p-blue-700: #1B4965;  /* Fokusring — exklusiv färg, används inte till något annat */
  --p-red-500: #A90000;
  --p-red-100: #FEF2F2;
  --p-blue-500: #4A6B8A;
  --p-blue-100: #EFF6FF;
  --p-green-500: #686648;
  --p-green-100: #F0FDF4;

  /* ── Typsnitt ── */
  --p-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --p-font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* ── Typografiskala (modular, ratio 1.25) ── */
  --p-text-xs: 0.75rem;    /* 12px */
  --p-text-sm: 0.875rem;   /* 14px */
  --p-text-base: 1rem;     /* 16px */
  --p-text-lg: 1.125rem;   /* 18px */
  --p-text-xl: 1.25rem;    /* 20px */
  --p-text-2xl: 1.5rem;    /* 24px */
  --p-text-3xl: 1.875rem;  /* 30px */
  --p-text-4xl: 2.25rem;   /* 36px */
  --p-text-5xl: 2.5rem;    /* 40px */

  /* ── Line-heights (avrundade till 4px-grid) ── */
  --p-leading-tight: 1.2;    /* rubriker */
  --p-leading-snug: 1.375;   /* underrubriker */
  --p-leading-normal: 1.5;   /* brödtext */
  --p-leading-relaxed: 1.625; /* liten text */

  /* ── Font-vikter ── */
  --p-weight-normal: 400;
  --p-weight-medium: 500;
  --p-weight-semibold: 600;
  --p-weight-bold: 700;

  /* ── Spacing (4px-bas) ── */
  --p-space-0: 0;
  --p-space-0-5: 0.125rem;  /* 2px */
  --p-space-1: 0.25rem;     /* 4px */
  --p-space-1-5: 0.375rem;  /* 6px */
  --p-space-2: 0.5rem;      /* 8px */
  --p-space-3: 0.75rem;     /* 12px */
  --p-space-4: 1rem;        /* 16px */
  --p-space-5: 1.25rem;     /* 20px */
  --p-space-6: 1.5rem;      /* 24px */
  --p-space-8: 2rem;        /* 32px */
  --p-space-10: 2.5rem;     /* 40px */
  --p-space-12: 3rem;       /* 48px */
  --p-space-16: 4rem;       /* 64px */
  --p-space-20: 5rem;       /* 80px */

  /* ── Radier ── */
  --p-radius-none: 0;
  --p-radius-sm: 0.25rem;   /* 4px */
  --p-radius-md: 0.5rem;    /* 8px */
  --p-radius-lg: 0.75rem;   /* 12px */
  --p-radius-xl: 1rem;      /* 16px */
  --p-radius-full: 9999px;

  /* ── Skuggor ── */
  --p-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --p-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --p-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
  --p-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.04);
  --p-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04);

  /* ── Transitions ── */
  --p-duration-fast: 100ms;
  --p-duration-normal: 200ms;
  --p-duration-slow: 300ms;
  --p-duration-slower: 500ms;
  --p-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --p-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --p-ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

### Semantiska tokens (tokens/semantic.css)

```css
:root {
  /* ── Primär ── */
  --mm-primary: var(--p-gold-500);
  --mm-primary-hover: var(--p-gold-600);
  --mm-primary-tint: var(--p-gold-100);
  --mm-primary-pale: var(--p-gold-300);
  --mm-primary-muted: var(--p-gold-400);

  /* ── Accent (CTA / handling) ── */
  --mm-accent: var(--p-copper-500);
  --mm-accent-hover: var(--p-copper-600);
  --mm-accent-tint: var(--p-copper-100);

  /* ── Text ── */
  --mm-text: var(--p-neutral-900);
  --mm-text-secondary: var(--p-neutral-600);
  --mm-text-muted: var(--p-neutral-400);
  --mm-text-inverse: var(--p-neutral-0);

  /* ── Ytor ── */
  --mm-bg: var(--p-neutral-0);
  --mm-bg-subtle: var(--p-neutral-25);
  --mm-bg-muted: var(--p-neutral-50);
  --mm-surface: var(--p-neutral-0);
  --mm-surface-raised: var(--p-neutral-0); /* + shadow */
  --mm-surface-overlay: var(--p-neutral-0); /* + shadow-xl */

  /* ── Borders ── */
  --mm-border: var(--p-neutral-200);
  --mm-border-light: var(--p-neutral-100);
  --mm-border-strong: var(--p-neutral-300);
  --mm-border-focus: var(--p-gold-500);

  /* ── Feedback ── */
  --mm-success: var(--p-green-500);
  --mm-success-bg: var(--p-green-100);
  --mm-error: var(--p-red-500);
  --mm-error-bg: var(--p-red-100);
  --mm-info: var(--p-blue-500);
  --mm-info-bg: var(--p-blue-100);
  --mm-warning: var(--p-copper-500);
  --mm-warning-bg: var(--p-copper-100);

  /* ── Kategori (meny) ── */
  --mm-cat-personal: var(--p-gold-500);
  --mm-cat-event: var(--p-gold-500);
  --mm-cat-people: var(--p-copper-500);
  --mm-cat-comm: var(--p-blue-500);
  --mm-cat-system: var(--p-neutral-400);

  /* ── Knappar ── */
  --mm-btn-primary-bg: var(--p-neutral-800);
  --mm-btn-primary-text: var(--p-neutral-0);
  --mm-btn-primary-hover: var(--p-neutral-700);
  --mm-btn-secondary-bg: transparent;
  --mm-btn-secondary-text: var(--p-neutral-800);
  --mm-btn-secondary-border: var(--p-neutral-200);
  --mm-btn-cta-bg: var(--p-copper-500);
  --mm-btn-cta-text: var(--p-neutral-0);
  --mm-btn-cta-hover: var(--p-copper-600);

  /* ── Fokus ── */
  --mm-focus-ring: var(--p-blue-700);  /* Exklusiv färg #1B4965 — aldrig använd till annat */
  --mm-focus-ring-width: 2px;
  --mm-focus-ring-offset: 2px;
  --mm-focus-ring-offset-inset: -2px; /* barn i interna rullningsytor — .focus-ring-inset på scrollcontainern (task-4.7) */
}
```

### Komponent-tokens (exempel)

```css
:root {
  /* ── StatCard ── */
  --mm-stat-card-bg: var(--mm-surface);
  --mm-stat-card-border: var(--mm-border);
  --mm-stat-card-radius: var(--p-radius-lg);
  --mm-stat-card-padding: var(--p-space-5);
  --mm-stat-card-shadow: var(--p-shadow-xs);
  --mm-stat-card-title-size: var(--p-text-sm);
  --mm-stat-card-title-color: var(--mm-text-muted);
  --mm-stat-card-value-size: var(--p-text-3xl);
  --mm-stat-card-value-weight: var(--p-weight-bold);

  /* ── DataTable ── */
  --mm-table-header-bg: var(--mm-bg-muted);
  --mm-table-header-text: var(--mm-text-secondary);
  --mm-table-header-weight: var(--p-weight-semibold);
  --mm-table-header-size: var(--p-text-xs);
  --mm-table-cell-padding-x: var(--p-space-4);
  --mm-table-cell-padding-y: var(--p-space-3);
  --mm-table-row-hover: var(--p-gold-100);
  --mm-table-row-active: var(--p-gold-200);
  --mm-table-border: var(--mm-border-light);

  /* ── AppMenu ── */
  --mm-menu-bg: var(--mm-surface);
  --mm-menu-width: 320px;
  --mm-menu-item-padding: var(--p-space-3) var(--p-space-4);
  --mm-menu-item-hover: var(--p-gold-100);
  --mm-menu-item-active: var(--p-gold-200);
  --mm-menu-border-width: 3px;
  --mm-menu-category-radius: var(--p-radius-sm);
}
```

---

## 2. Typografiskala

### Komplett skala

| Namn | Storlek | Vikt | Line-height | Letter-spacing | Användning |
|------|---------|------|-------------|----------------|-----------|
| `display` | 40px (2.5rem) | 700 | 1.2 | -0.02em | Sidrubrik (en per sida) |
| `h1` | 36px (2.25rem) | 700 | 1.2 | -0.02em | Huvudrubrik |
| `h2` | 30px (1.875rem) | 600 | 1.2 | -0.01em | Sektionsrubrik |
| `h3` | 24px (1.5rem) | 600 | 1.25 | -0.01em | Underrubrik |
| `h4` | 20px (1.25rem) | 600 | 1.3 | 0 | Kortrubrik |
| `h5` | 18px (1.125rem) | 600 | 1.375 | 0 | Etikett / mini-rubrik |
| `body` | 16px (1rem) | 400 | 1.5 | 0 | Brödtext |
| `body-medium` | 16px (1rem) | 500 | 1.5 | 0 | Betonad brödtext |
| `small` | 14px (0.875rem) | 400 | 1.5 | 0 | Hjälptext, metadata |
| `small-medium` | 14px (0.875rem) | 500 | 1.5 | 0 | Tabellrubriker |
| `caption` | 12px (0.75rem) | 400 | 1.5 | 0.02em | Bildtexter, timestamps |
| `caption-medium` | 12px (0.75rem) | 500 | 1.5 | 0.04em | Badge, overline |
| `mono` | 14px (0.875rem) | 400 | 1.6 | 0 | Kod, teknisk data |

### Regler

1. **Aldrig under 12px.** WCAG-minimum för läsbarhet.
2. **Max två vikter per vy.** Normal (400) + Semibold (600) räcker nästan alltid. Bold (700) reserverat för display/h1.
3. **Line-height avrundas till 4px-grid.** 16px × 1.5 = 24px ✓. 14px × 1.5 = 21px → avrundas till 20px (1.43) eller 24px (1.71). Vi väljer 21px (nära nog).
4. **Rubriker har negativ letter-spacing.** -0.02em till -0.01em. Brödtext har 0. Captions har positiv.
5. **En font-familj.** Inter för allt utom kod (JetBrains Mono).

### Tailwind-mappning

Typografin definieras i `@theme`-blocket i `src/styles/tailwind.css` (se §8 för komplett
konfiguration). Utdrag:

```css
/* src/styles/tailwind.css */
@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --text-caption: 0.75rem;
  --text-caption--line-height: 1.5;
  --text-caption--letter-spacing: 0.02em;

  --text-small: 0.875rem;
  --text-small--line-height: 1.5;

  --text-body: 1rem;
  --text-body--line-height: 1.5;

  --text-lg: 1.125rem;
  --text-lg--line-height: 1.375;

  --text-xl: 1.25rem;
  --text-xl--line-height: 1.3;

  --text-2xl: 1.5rem;
  --text-2xl--line-height: 1.25;
  --text-2xl--letter-spacing: -0.01em;

  --text-3xl: 1.875rem;
  --text-3xl--line-height: 1.2;
  --text-3xl--letter-spacing: -0.01em;

  --text-4xl: 2.25rem;
  --text-4xl--line-height: 1.2;
  --text-4xl--letter-spacing: -0.02em;

  --text-5xl: 2.5rem;
  --text-5xl--line-height: 1.2;
  --text-5xl--letter-spacing: -0.02em;
}
```

---

## 3. Spacing-system

### 4px-bas, icke-linjär skala

```text
0   →   0px       Noll
0.5 →   2px       Mikroavstånd (borders, inline-gaps)
1   →   4px       Minimum
1.5 →   6px       Tight padding
2   →   8px       Elementnära avstånd
3   →  12px       Tight sektions-gap
4   →  16px       Standard padding, gap
5   →  20px       Rymlig padding
6   →  24px       Sektionsavstånd
8   →  32px       Stor sektion
10  →  40px       Vy-margin
12  →  48px       Sektionsseparering
16  →  64px       Huvudsektioner
20  →  80px       Sidmarginaler
```

### Regler

1. **Spacing är aldrig godtycklig.** Varje avstånd kommer från skalan. Inga `p-[13px]`.
2. **Vertikal rytm: 4px-grid.** Varje elements totalhöjd (innehåll + padding + border) ska landa på 4px-multipel.
3. **Horisontella gap: konsekvent per kontext.** Kort-grid: `gap-4` (16px). Tabell-celler: `px-4 py-3` (16px / 12px). Formulärfält: `gap-2` (8px).
4. **Luft ökar med hierarki.** Avstånd mellan rubrik och brödtext: `mb-2`. Avstånd mellan sektioner: `mb-8`. Avstånd mellan huvudsektioner: `mb-16`.

---

## 4. Lint-konfiguration

### [GA] Biome 2.0 (ersätter ESLint + Stylelint)

Projektet använder **Biome 2.0** som enda lint- och formatverktyg. Biome är 42–65x
snabbare än ESLint+Prettier och hanterar både JS/TS och CSS i en config-fil.
Stack-beslutet är fattat i gap-analysen (se `gap-analysis.md` Fas 0).

Konfiguration: `biome.json` i repo-roten. Genereras initialt via
`npx @biomejs/biome init` och anpassas med:

- `recommended` regler aktiverade
- Tailwind-plugin för `classnames-order`
- `organizeImports` aktiverat
- Formatindrag: 2 spaces

### Regler vi förväntar oss (Biome + custom)

| Regel | Vad den fångar | Prioritet | Källa |
|-------|---------------|-----------|-------|
| `tailwindcss/classnames-order` | Inkonsekvent Tailwind-klassordning | Hög | Biome-plugin |
| `noArbitraryValue` (Biome, custom) | `text-[19px]`, `bg-[#D4960A]` | Hög | Biome custom |
| CSS `color-no-hex` | Hex-värden i komponent-CSS (tvinga CSS custom properties) | Hög | Biome CSS lint |
<!-- markdownlint-disable-next-line MD056 -->  <!-- tabell-cell-överskott (Vue-referens-doc, frusen) -->
| CSS `custom-property-pattern` | Custom properties utanför `^(p-|mm-).*` | Medel | Biome CSS lint |
| CSS `declaration-no-important` | `!important` i komponent-CSS | Medel | Biome CSS lint |
| `mm/no-hardcoded-colors` | Hex-värden direkt i `className`/`style` | Hög | Custom (Fas 7) |
| `mm/no-hardcoded-font-size` | Inline `fontSize` eller `text-[19px]` | Hög | Custom (Fas 7) |
| `mm/no-raw-spacing` | `p-[13px]`, `gap-[7px]` | Hög | Custom (Fas 7) |
| `mm/consistent-heading-order` | h3 före h2 i samma komponent | Medel | Custom (Fas 7) |
| `mm/no-ai-hover-translate` | `hover:-translate-y-1` (jitter-bugg) | Medel | Custom (Fas 7) |

Not: `tailwindcss/classnames-order` refererar Biomes Tailwind-plugin, inte ESLints
`eslint-plugin-tailwindcss`. Custom `mm/*`-regler skrivs som Biome-plugins i Fas 7.

---

## 5. Design-audit skill — teknisk spec

### Syfte

En Claude Code skill som tar en screenshot av en vy, analyserar den
mot designsystemets tokens och manifesto, och producerar en strukturerad
auditrapport.

### Varför inte pixel-jämförelse

Pixel-jämförelse (Playwright, Percy) svarar på: "Ser det likadant ut
som förra gången?" Det svarar INTE på: "Följer det designsystemet?"
eller "Är typografin konsekvent?" eller "Har varje element ett jobb?"

Vår skill svarar på designintention, inte pixelparitet.

### Filstruktur

```text
~/.claude/skills/design-audit/
├── SKILL.md              ← Skill-definition
├── audit-template.md     ← Output-mall
└── prompts/
    └── visual-analysis.md  ← System-prompt för bildanalys
```

### SKILL.md

```markdown
---
name: design-audit
description: >
  Analyserar en screenshot av en vy mot designsystemets tokens,
  typografiskala, spacing-system och DESIGN-MANIFESTO.md.
  Producerar en strukturerad auditrapport med 11/11/11/11-bedömning.
trigger: >
  Använd när Marcus säger "audit", "designgranskning", "visuell check"
  eller "kontrollera designen" på en vy eller komponent.
effort: max
---

# Design Audit Skill

## Steg

1. **Läs designsystemet**
   - Läs `src/styles/tokens.css` (alla tre lager)
   - Läs `DESIGN-MANIFESTO.md` (principer + kvalitetsramverk)
   - Läs `DESIGN-SYSTEM-SPEC.md` (typografiskala, spacing-regler)

2. **Ta screenshot**
   ```bash
   npx playwright screenshot --url http://localhost:5173/{route} \
     --viewport-size 1440x900 \
     --output /tmp/audit-screenshot.png
   ```

   Ta även en mobilvy:

   ```bash
   npx playwright screenshot --url http://localhost:5173/{route} \
     --viewport-size 375x812 \
     --output /tmp/audit-screenshot-mobile.png
   ```

1. **Analysera mot tokens**
   Skicka screenshots + token-filer till Claude API (vision):

   Prompt-struktur:

   ```text
   Du är en world-class designgranskare. Analysera denna screenshot
   mot det bifogade designsystemet.

   DESIGNSYSTEM:
   [tokens.css innehåll]

   TYPOGRAFISKALA:
   [skalan från DESIGN-SYSTEM-SPEC.md]

   SPACING-REGLER:
   [reglerna från DESIGN-SYSTEM-SPEC.md]

   PRINCIPER:
   [de 9 principerna från DESIGN-MANIFESTO.md]

   SCREENSHOT:
   [bilden]

   Analysera:
   1. TYPOGRAFI — Är alla textstorlekar från skalan? Är vikter
      konsekventa? Rätt hierarki (h1 > h2 > h3)?
   2. SPACING — Följer alla avstånd 4px-grid? Konsekvent padding?
      Luft ökar med hierarki?
   3. FÄRG — Används bara semantiska tokens? Rätt färg för rätt syfte?
      (Guld = primär, Copper = CTA/handling, Neutrala = text)
   4. LAYOUT — Visuell balans? Alignment? Konsekvent grid?
   5. CRAFT — Alla states synliga (loading, empty, error)?
      Feedback på handlingar? Hover-states?
   6. TILLGÄNGLIGHET — Kontrastförhållanden? Fokusindikatorer synliga?
      Touch targets ≥ 44px?
   7. MANIFESTET — Har varje element ett jobb? Kan något tas bort?
      Stämmer intentionen?

   8. [GA] PERFORMANCE — web-vitals-mätvärden (FCP, LCP, INP, CLS) inom budget?
      Bundle-storlek per route inom budget? Se PERFORMANCE-BUDGET.md
   9. [GA] SÄKERHET — CSP-header korrekt? Trusted Types aktivt?
      Inga hårdkodade tokens/secrets? Se SECURITY-SPEC.md
   10. [GA] ARIA 1.3 — aria-errormessage på formulärfält? aria-description?
       Se ARIA-UPGRADE.md
   11. [GA] EAA — European Accessibility Act-checklista (i kraft sedan juni 2025).
       Se ARIA-UPGRADE.md
   12. [GA] FEM KVALITETER — Omedelbarhet, Kontinuitet, Transparens,
       Odödlighet, Profetia. Se §13

   Bedöm varje dimension 1-11 med motivering.
   Lista konkreta åtgärdspunkter.
   ```

2. **Generera rapport**
   Skriv rapport till `docs/audits/YYYY-MM-DD-{vy}-design-audit.md`

3. **Sammanfatta till Marcus**
   Visa 11/11/11/11-poäng och topp-3 åtgärder.

```text

### Output-mall (audit-template.md)

```markdown
# Design Audit — {Vy}

*Datum: {YYYY-MM-DD} | Vy: {route} | Viewport: 1440×900 + 375×812*

## Bedömning

| Dimension | Poäng | Motivering |
|-----------|-------|-----------|
| Tillgänglighet (♿) | /11 | |
| Teknisk kvalitet (⚙) | /11 | |
| Återanvändbarhet (♻) | /11 | |
| Craft (✦) | /11 | |

## Typografi

| Element | Förväntat | Uppmätt | Status |
|---------|-----------|---------|--------|
| H1 | 36px / 700 / -0.02em | | ✅/⚠️/❌ |
| Body | 16px / 400 / 1.5 | | ✅/⚠️/❌ |
| ... | | | |

## Spacing

| Område | Förväntat | Uppmätt | Status |
|--------|-----------|---------|--------|
| Card padding | 20px (space-5) | | ✅/⚠️/❌ |
| Section gap | 32px (space-8) | | ✅/⚠️/❌ |
| ... | | | |

## Färg

| Användning | Token | Förväntat | Uppmätt | Status |
|-----------|-------|-----------|---------|--------|
| Primär accent | --mm-primary | #D4960A | | ✅/❌ |
| Brödtext | --mm-text | #242424 | | ✅/❌ |
| ... | | | | |

## Manifestcheck

| Princip | Uppfylld? | Kommentar |
|---------|-----------|----------|
| I. Eliminera, sedan designa | | |
| V. Varje element har ett jobb | | |
| IX. Weniger, aber besser | | |

## Åtgärdspunkter

1. [ ] {Konkret åtgärd}
2. [ ] {Konkret åtgärd}
3. [ ] {Konkret åtgärd}

## Screenshots

### Desktop (1440×900)
![Desktop]({sökväg})

### Mobil (375×812)
![Mobil]({sökväg})
```

---

## 6. Playwright baseline-konfiguration

```ts
// playwright.config.ts (utdrag)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Tolerans för anti-aliasing
      maxDiffPixelRatio: 0.01,
      // Threshold per pixel (0 = exakt, 1 = allt tillåtet)
      threshold: 0.2,
      // Animationer ska vara klara
      animations: 'disabled',
    },
  },
  use: {
    // Konsekvent rendering
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
  ],
});
```

### Visuella tester

```ts
// tests/visual/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard — morgonöverblick', async ({ page }) => {
  await page.goto('/oversikt');
  await page.waitForSelector('[data-testid="stat-card"]');

  // Fullsida
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    fullPage: true,
  });

  // Enskilda komponenter
  const statCards = page.locator('[data-testid="stat-card"]');
  await expect(statCards.first()).toHaveScreenshot('stat-card.png');
});
```

---

## 7. Verifieringsprocess per fas

| Fas | Automatiskt (CI) | Manuellt (skill) |
|-----|-------------------|-------------------|
| Fas 0: Setup | Lint passerar, inga TS-fel | — |
| Fas 3: UI-grund | Playwright baselines skapade | `design-audit` på Button, Dialog |
| Fas 4: DataTable | Playwright baselines | `design-audit` på DataTable (alla states) |
| Fas 5: App-shell | Playwright baselines | `design-audit` på AdminShell + AppMenu |
| Fas 6: Dashboard | Playwright full-page | `design-audit` på DashboardView |
| Varje PR | Lint + Playwright regression | — |
| Varje fas-avslut | — | `design-audit` + friction log |

---

## 8. Tailwind @theme-konfiguration (komplett)

Beslut 2026-04-13: Projektet använder Tailwind v4:s CSS-first-approach via
`@theme`-direktivet. Ingen `tailwind.config.ts`, ingen `postcss.config.js`.
Lightning CSS (inbyggt i `@tailwindcss/vite`) hanterar vendor prefixing och
syntax transforms. Se `conversion-plan.md` fotnot och ändringsspec 2026-04-13
för full motivering.

Varje entry är verifierad mot Tailwind v4:s namespace-dokumentation. Alla
utility-klasser (`bg-primary`, `text-text-secondary`, `text-caption`, `font-sans`
etc.) är identiska med vad den tidigare `tailwind.config.ts` skulle ha genererat.

Placering: `src/styles/tailwind.css`.

```css
/* src/styles/tailwind.css */
@import "tailwindcss";

/* ══════════════════════════════════════════
   Miranon Media Admin — Tailwind v4 @theme
   Ersätter tailwind.config.ts (CSS-first)
   Alla värden refererar semantiska tokens från semantic.css
   ══════════════════════════════════════════ */

@theme {
  /* ── Nollställ defaults — vi äger hela paletten ── */
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;

  /* ── Färger (--color-* → bg-*, text-*, border-*, ring-*) ── */

  /* Systemfärger */
  --color-transparent: transparent;
  --color-current: currentColor;

  /* Primär */
  --color-primary: var(--mm-primary);
  --color-primary-hover: var(--mm-primary-hover);
  --color-primary-tint: var(--mm-primary-tint);
  --color-primary-pale: var(--mm-primary-pale);
  --color-primary-muted: var(--mm-primary-muted);

  /* Accent (CTA / handling) */
  --color-accent: var(--mm-accent);
  --color-accent-hover: var(--mm-accent-hover);
  --color-accent-tint: var(--mm-accent-tint);

  /* Text */
  --color-text: var(--mm-text);
  --color-text-secondary: var(--mm-text-secondary);
  --color-text-muted: var(--mm-text-muted);
  --color-text-inverse: var(--mm-text-inverse);

  /* Bakgrund */
  --color-bg: var(--mm-bg);
  --color-bg-subtle: var(--mm-bg-subtle);
  --color-bg-muted: var(--mm-bg-muted);

  /* Ytor */
  --color-surface: var(--mm-surface);
  --color-surface-raised: var(--mm-surface-raised);
  --color-surface-overlay: var(--mm-surface-overlay);

  /* Borders */
  --color-border: var(--mm-border);
  --color-border-light: var(--mm-border-light);
  --color-border-strong: var(--mm-border-strong);
  --color-border-focus: var(--mm-border-focus);

  /* Feedback */
  --color-success: var(--mm-success);
  --color-success-bg: var(--mm-success-bg);
  --color-error: var(--mm-error);
  --color-error-bg: var(--mm-error-bg);
  --color-info: var(--mm-info);
  --color-info-bg: var(--mm-info-bg);
  --color-warning: var(--mm-warning);
  --color-warning-bg: var(--mm-warning-bg);

  /* Kategori (meny) */
  --color-cat-personal: var(--mm-cat-personal);
  --color-cat-event: var(--mm-cat-event);
  --color-cat-people: var(--mm-cat-people);
  --color-cat-comm: var(--mm-cat-comm);
  --color-cat-system: var(--mm-cat-system);

  /* ── Typsnitt (--font-* → font-*) ── */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* ── Typografiskala (--text-* → text-*) ── */
  --text-caption: 0.75rem;
  --text-caption--line-height: 1.5;
  --text-caption--letter-spacing: 0.02em;

  --text-small: 0.875rem;
  --text-small--line-height: 1.5;

  --text-body: 1rem;
  --text-body--line-height: 1.5;

  --text-lg: 1.125rem;
  --text-lg--line-height: 1.375;

  --text-xl: 1.25rem;
  --text-xl--line-height: 1.3;

  --text-2xl: 1.5rem;
  --text-2xl--line-height: 1.25;
  --text-2xl--letter-spacing: -0.01em;

  --text-3xl: 1.875rem;
  --text-3xl--line-height: 1.2;
  --text-3xl--letter-spacing: -0.01em;

  --text-4xl: 2.25rem;
  --text-4xl--line-height: 1.2;
  --text-4xl--letter-spacing: -0.02em;

  --text-5xl: 2.5rem;
  --text-5xl--line-height: 1.2;
  --text-5xl--letter-spacing: -0.02em;
}
```

### Utility-klasser som genereras (verifierade)

| @theme-variabel | Utility-klass |
|---|---|
| `--color-primary` | `bg-primary`, `text-primary`, `border-primary` |
| `--color-text` | `text-text` (färg), `bg-text` |
| `--color-text-secondary` | `text-text-secondary`, `bg-text-secondary` |
| `--color-surface-raised` | `bg-surface-raised` |
| `--color-cat-personal` | `bg-cat-personal`, `text-cat-personal` |
| `--font-sans` | `font-sans` |
| `--text-caption` | `text-caption` (font-size + line-height + letter-spacing) |
| `--text-body` | `text-body` (font-size + line-height) |

Ingen utility-klass ändrar namn jämfört med den tidigare `tailwind.config.ts`.
Alla `className`-värden i framtida komponenter fungerar likadant.

### Tokens som ännu saknas i @theme (spacing, radius, shadows, motion)

Primitiva tokens för `--p-space-*`, `--p-radius-*`, `--p-shadow-*`,
`--p-duration-*` och `--p-ease-*` är redan definierade i `primitives.css` och
används via `var()` i komponent-CSS. Om de behöver exponeras som Tailwind-
utilities (`rounded-lg`, `shadow-sm`, `duration-fast` etc.) läggs de till som
`--radius-*`, `--shadow-*`, `--duration-*` och `--ease-*` i `@theme`-blocket
senare. De utelämnas nu eftersom Tailwind v4 redan har användbara defaults för
spacing-skalan via `--spacing`-basen.

---

## [GA] 9. View Transitions

### Princip

View Transitions är inte animation — det är **kontinuitet**. När Lotta klickar på ett event i listan och det "expanderar" till detaljsidan behåller hon kontexten. Utan det: flash av vit skärm → ny sida → kognitiv belastning.

### CSS-grund

```css
/* base.css — opt-in för cross-document transitions */
@view-transition {
  navigation: auto;
}
```

### Namngivningskonvention

`view-transition-name` följer mönstret `{komponent}-{id}`:

- Event-kort i lista: `view-transition-name: event-{eventId}`
- Event-detalj: `view-transition-name: event-{eventId}` (samma namn = shared transition)
- Tab bar pill: `view-transition-name: tab-pill`

### Navigeringar med transition

| Från | Till | Typ | Element |
|------|------|-----|---------|
| Event-lista | Event-detalj | Shared element | Event-kort → hero |
| Tab-byte | Tab-byte | Pill-glid | Aktiv tab-markering |
| Hem → undervy | Back | Cross-fade | Hela content-area |

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

---

## [GA] 10. Stale-data-indikatorer

### Komponent: SyncIndicator

Visar när data senast hämtades. Placeras i page-header eller som subtil text under rubriken.

**Design:**

- Text: "Senast uppdaterat: {HH:MM}" i `text-muted` (14px)
- Online + färsk data: ingen indikator (inget visuellt brus)
- Online + stale data (>5 min): "Uppdaterar..." med subtil puls
- Offline + cachad data: "Offline — visar data från {HH:MM}" med ikon
- Fel + cachad data: "Kunde inte hämta ny data. Visar version från {HH:MM}."

**Tokens:**

```css
:root {
  --mm-sync-text: var(--mm-text-muted);
  --mm-sync-offline-bg: var(--p-gold-100);
  --mm-sync-error-bg: var(--p-red-100);
}
```

---

## [GA] 11. Error boundary-meddelanden

### Ton och formulering

Error boundaries ska vara **lugnande, förklarande och handlingsinriktade**. Lotta ska aldrig se "Något gick fel" utan kontext.

| Nivå | Meddelande | Åtgärd |
|------|-----------|--------|
| Widget | (inget — tyst degradering) | Komponenten försvinner |
| Sektion | "Den här delen kunde inte laddas just nu." | Retry-knapp |
| Sektion + stale data | "Vi kunde inte hämta nya {data}. Senaste versionen (från kl {HH:MM}) visas nedan. Vi försöker igen automatiskt." | Automatisk retry + manuell knapp |
| App | "Något oväntat hände. Prova att ladda om sidan." | Ladda om-knapp |

### Design

- Sektion-fel: `border-left: 3px solid var(--mm-warning)`, `bg: var(--mm-warning-bg)`, `padding: space-4`, `radius: radius-md`
- App-fel: Centrerat, stor text, tydlig knapp

---

## [GA] 12. Systemhälso-indikator

### Vad den är

En komponent i Hem-vyn som bevisar att systemet arbetar. Lottas rädsla (#3: "tappa kontrollen") löses av **bevis**, inte av bra UX.

### Design

- Placering: under hälsningen i Hem-vyn
- Normal: "Allt fungerar. 234 anmälningar sedan start. 0 tappade." — text i `text-muted`
- Problem: "1 sak behöver uppmärksamhet" — orange rad med ikon

### Data

```typescript
interface SystemHealth {
  totalRegistrations: number;
  totalEventsHandled: number;
  emailsSent: number;
  emailsFailed: number;
  lastSync: Date;
  status: 'healthy' | 'attention' | 'error';
}
```

---

## [GA] 13. Fem kvaliteter — den osynliga skillnaden

Dessa fem kvaliteter ska vara testbara principer i design-audits. De skiljer "bra" från "magi".

### 1. Omedelbarhet

Appen ska kännas som om all data redan finns lokalt.

- **Mekanism:** Service worker (cache-first för shell) + TanStack Query `staleTime` + Speculation Rules (prerender)
- **Test:** Mät tid från app-öppning till "Hej Lotta" synlig. Budget: <500ms (cachad), <1.5s (kall start)

### 2. Kontinuitet

Navigering ska inte vara "byta sida" utan "flytta fokus".

- **Mekanism:** View Transitions + shared elements + route announcer
- **Test:** Klicka event i lista → detaljsida. Finns spatial koppling (element "expanderar")?

### 3. Transparens

Systemet bevisar sig. "0 tappade."

- **Mekanism:** Systemhälso-indikator (§12) + aktivitetslogg som berättelse
- **Test:** Finns "senast synkroniserat"-text? Finns "X anmälningar hanterade"-text?

### 4. Odödlighet

Appen dör aldrig.

- **Mekanism:** Service worker (offline fallback) + error boundaries (stale data) + Background Sync (köade mutationer)
- **Test:** Sätt flygplansläge → öppna appen → ska visa cachad data, inte blank skärm

### 5. Profetia

Appen vet vad Lotta ska göra härnäst.

- **Mekanism:** Speculation Rules + `preload="intent"` + TanStack Router loaders
- **Test:** Hovra över "Se alla event" → navigera → laddar sidan instant?

---

## 14. NavCard — navigationsrads-primitiven

Återanvändbar kort-rad för navigationslistor (Mer-vyn och framtida
produkters landningsmenyer). Byggd på react-aria-components `Link`
(ADR-044) wrappade i TanStack Routers `createLink` — `to` är typad mot
routerns registrerade routes (obefintlig route = typfel). Facit-källa:
M6-konvergenspasset, sessionsdok S64 Del 3 (task-9.1).

### API (medvetet minimalt)

```tsx
<NavCard to="/mer/anmalningar" icon={ClipboardList} label="Anmälningar" />
```

| Prop | Typ | Roll |
|---|---|---|
| `to` | router-typad route | Länkmålet — hela radytan är EN länk |
| `icon` | `NavCardIcon` (strukturell: `size`/`aria-hidden`/`className`) | Dekorativ radikon, 20 px i sekundärfärgen, `aria-hidden` |
| `label` | `string` | Etiketten, 16/600 — bär länknamnet ENSAM |

**INTE i API:t** (över-engineering-vakten — växer additivt vid verkligt
behov): badge (T68), beskrivningsrad, disabled, knapp-variant, `className`.
Formen är facit-låst; konsumenter komponerar inte om raden.

### Anatomi

NavCard är själva raden. List- och landmärkes-semantiken ägs av
konsumenten: `<nav aria-label>` → `<ul>` → `<li><NavCard /></li>`.
Radgap inom grupp: 10 px (`gap-2.5`); mellan grupper: 32 px (`gap-8`).

### Form (M6-facitet, computed-låst)

- Hela ytan `Link`; `rounded-2xl`; tonal kortyta `--mm-navcard-bg`
  (= `--mm-bg-muted`); `border-transparent` i vila; `px-4 py-4`
  ≈58 px radhöjd (≥44 px träffyta).
- Ikon 20 px `--mm-navcard-icon` (= `--mm-text-secondary`) —
  tabbar-paritet i storlek och familj; ett steg tystare än etiketten
  (M3-listmönstrets research-belägg).
- Etikett 16/600 (`text-body` + semibold), `--mm-navcard-text`.
- **Ingen hover-bakgrundsändring** — transparent-i-vila + hover-grå
  är PRÖVAD OCH FÖRKASTAD (M3, S64); återinförs inte utan nytt
  facit-beslut.
- Fokus: den globala `:focus-visible`-ringen (base.css) — ingen egen
  fokus-styling.
- `prefers-contrast: more`: synlig kantlinje `--mm-navcard-border-contrast`
  (= `--mm-border-strong`). Statisk rad — reduced-motion/print utan
  specialfall (globala neutraliseringen täcker).

### App-bred regel: navigationsrader bär inte chevron

Navigationsrader (NavCard och alla kommande rad-navigationsytor) bär
**ingen chevron** — "desto mindre saker desto renare" (M4-varvet,
D-reviderad; öppet bokförd revision av samsyn D). Dropdown-indikatorer
(t.ex. `Select`:s `ChevronDown`) är en ANNAN mönsterklass och berörs
inte av regeln.

### Komponent-tokens (components.css)

```css
--mm-navcard-bg: var(--mm-bg-muted);
--mm-navcard-text: var(--mm-text);
--mm-navcard-icon: var(--mm-text-secondary);
--mm-navcard-border: transparent;
--mm-navcard-border-contrast: var(--mm-border-strong);
```

---

## 15. Lugnt laddläge — laddprincipen + Skeleton-primitiven

App-bred laddprincip (ORDLISTA "Lugnt laddläge"; task-7-grillningen S63
Del 2, käll-verifierad research: NN/g Skeleton Screens 101, Chung-empirin
om shimmer-tempo, Adrian Rosellis skeleton-a11y-mönster). Mekaniken bor i
PRD TASK-8; Hem är första implementationsyta — övriga vyer migreras via
egna kort och ärver principen härifrån utan nya beslut.

### Principen (gäller varje vy)

- **Slutgeometri från första bildrutan.** Inget växer, hoppar eller byter
  plats när data landar — layout-skift ≈ 0 är grindkravet och bevisas med
  renderad mätning (boundingBox under/efter laddning).
- **I första hand syns ingen laddning alls:** senast kända data visas
  direkt ur persist-cachen (ADR-072) och byts tyst mot färsk.
- **Måste laddning synas** renderas riktiga rubriker och riktig kort-chrome
  direkt (de är statiskt kända); ENDAST datakropparna får förenklade
  skeleton-block som speglar det innehåll som kommer (lika många rader,
  samma proportioner).
- **Under 1 sekund visas ingen indikation alls** (NN/g-tröskeln 0,1/1/10 s;
  FK FLoader 1 s). Framträdande-formen är mätlåst per task-8.1: det
  uppmätta kallstartsfönstret ligger klart över 1 s → skeleton från första
  bildrutan, ingen framträdande-fördröjningsmekanism.
- **"Laddar…"-textrader och spinners används inte.** Designen går medvetet
  över FK-golvet (FK saknar skeleton; spinner efter 1 s är deras mönster) —
  öppet bokfört med research-stöd i PRD TASK-8.

### Skeleton — API (medvetet minimalt)

```tsx
<Skeleton variant="text" />
<Skeleton variant="number" className="text-3xl" />
<Skeleton variant="listRow" />
```

| Prop | Typ | Roll |
|---|---|---|
| `variant` | `'text' \| 'number' \| 'listRow'` | Block-formen: textrad (1 line-box, full bredd), tal (1 line-box, ~2ch), listrad (3 line-boxar, radie som zebra-raderna) |
| `className` | `string` | Bredd/typografi-styrning (merge:as efter varianten) |

Höjderna är **lh-baserade** och följer omgivande typografi — blocken
reserverar det kommande innehållets slutdimensioner i varje textskala
(ett `number`-block i `text-3xl`-kontext blir talets exakta line-box,
36 px). Ingen framträdande-fördröjnings-prop och ingen animations-ratt
(över-engineering-vakten; formbeslutet är mätlåst).

### Anatomi — Roselli-mönstret

Blocket är ALLTID `aria-hidden` (dekorativt, utan roll och text).
Konsumenten äger innehålls-containern som laddar och sätter:

- `aria-busy="true"` på containern under laddning, och
- ett visuellt dolt textbesked (`sr-only`) i containern — `aria-busy`
  kompletteras ALLTID med textbeskedet; få skärmläsare honorerar busy
  ensam.

```tsx
<div aria-busy={isPending}>
  {isPending ? (
    <>
      <span className="sr-only">Laddar nästa event…</span>
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-3/5" />
    </>
  ) : (
    <EventMeta … />
  )}
</div>
```

### Form

- Blockfärgen ligger i **branschens lugna band** (≈1,3:1 mot kortytan
  via `--mm-bg-placeholder`/neutral-200; jämför MUI 11 %-alpha ≈1,3:1 ·
  Carbon #e5e5e5 ≈1,25:1 · shadcn `bg-accent` ≈1,1:1). WCAG 1.4.11 är
  INTE tillämplig på blocken — de är `aria-hidden`-dekorativa och
  laddinformationen bärs av sr-only-beskedet (Understanding 1.4.11,
  "aesthetic purposes"-undantaget). Ursprungsformens ≥3:1 via
  `--mm-border-field`-arvet var en feltillämpning — korrigerad efter
  design-review-fynd (task-8.6, S67); fältkantens 3:1-krav i
  semantic.css står orört (rätt för fält, fel för platshållare).
  `prefers-contrast: more` mörknar blocket till `--mm-text-secondary`
  (≈7:1) — uttalat användarval om urskiljbarhet. Kontrast-kontraktet
  testas dubbelriktat: normalläget INOM bandet (1,15–2:1),
  contrast-more ≥4,5:1.
- **Långsam shimmer vänster→höger** (2,5 s per svep — Chung-empirin:
  långsam upplevs kortare än puls) som `::after`-svep. Animationen är
  deklarerad ENDAST under `prefers-reduced-motion: no-preference`
  (`motion-safe:`-varianten; WCAG 2.2.2-noten) — statiska block annars;
  base.css-neutraliseringen står kvar som dubbelbälte. Keyframes:
  `tailwind.css` `@theme` (`--animate-skeleton-shimmer`).
- **Print:** bakgrundsfärger skrivs ofta inte ut — konturen i
  `--mm-border-strong` bär urskiljbarheten (border-transparent-mönstret
  håller dimensionen identisk i alla lägen).
- Beteendekontraktet är computed-style-testat i `tests/a11y/Skeleton.spec.ts`
  (token-paritet, kontrastkvot, emulateMedia-lägena, lh-dimensionerna);
  axe-skanningen av demo-sektionen bor i `tests/a11y/primitives.spec.ts`.

### Komponent-tokens (components.css)

```css
--mm-skeleton-block: var(--mm-bg-placeholder);
--mm-skeleton-block-contrast: var(--mm-text-secondary);
--mm-skeleton-shimmer: color-mix(in srgb, var(--mm-bg) 75%, transparent);
```

---

## Ändringslogg

| Datum | Förändring |
|-------|-----------|
| 2026-04-05 | Initialt dokument. Token-arkitektur, typografiskala, spacing-system, lint-config, design-audit skill-spec, Playwright-config, Tailwind-mappning. |
| 2026-04-07 | [GA] Integrerat gap-analys: View Transitions (§9), stale-data-indikatorer (§10), error boundary-meddelanden (§11), systemhälso-indikator (§12), fem kvaliteter (§13). Audit-prompt uppdaterad med performance/säkerhet/ARIA/EAA-kontroller. |
| 2026-07-12 | §14 NavCard — navigationsrads-primitiven (M6-facitet, S64 Del 3): API, anatomi, form, komponent-tokens + app-breda regeln "navigationsrader bär inte chevron" (task-9.1). |
| 2026-07-12 | §15 Lugnt laddläge — laddprincipen (app-bred, S63 Del 2-samsynen + task-8.1:s mätlåsta framträdande-form) + Skeleton-primitiven: API, Roselli-anatomin, form, komponent-tokens (task-8.2). |
| 2026-07-18 | §15 Form: skeleton-tonen till branschbandet — 1.4.11-feltillämpningen korrigerad (dekorativt undantag per Understanding 1.4.11; MUI/Carbon/shadcn-värden citerade), ny semantisk roll-token `--mm-bg-placeholder` (neutral-200), shimmer 45→75 %, kontrast-kontraktet dubbelriktat i Skeleton.spec (task-8.6; S67 QA-fynd, L269-klassen). |
| 2026-04-13 | Migrerat från `tailwind.config.ts` till Tailwind v4 `@theme`-direktivet (CSS-first). §8 innehåller nu komplett `@theme`-block i stället för JS-config. §4 Lint: ESLint+Stylelint-kodexempel borttagna, Biome 2.0 införd som enda lint/format-verktyg. §2 Tailwind-mappning: typografi uttryckt som `@theme`-variabler. §1 Token-lager: semantiska tokens refereras nu i `@theme`-blocket i `tailwind.css`. Se `conversion-plan.md` fotnoter och ändringsspec 2026-04-13. |
