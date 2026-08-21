---
owner: marcus803
updated: 2026-08-21
review_by: 2027-02-08
status: stable
---

# DESIGN-SYSTEM-SPEC.md — Teknisk specifikation

*Operativ motpart till DESIGN-MANIFESTO.md*
*Skapad: 2026-04-05 | Gäller: miranon-media-admin*
*Reponamn: miranon-media-admin (inte miranon-media-admin-react)*

> **Äger:** design-tokens tre-lagers-modellen (primitiv/semantisk/komponent)
> och komponentkravens golv (kontrast, reducerad rörelse, print).
> **Kartlägger:** `~/Repon/marcus-system/design-system/DESIGN-FOUNDATION-v1.md`
> (spacing-/typografigrunden) och `docs/specs/KVALITETSDEFINITIONER-11-REACT.md`
> (tillgänglighets-ribban denna spec ska uppfylla). **Vid konflikt vinner:**
> de faktiska token-filerna på disk (`src/styles/tokens/*.css`, ADR-100 §1
> domän 1 — koden äger mekaniken) om detta dok och koden divergerar.

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
  --p-green-500: #606B57; /* sage — Vue-arvets Miranon-gröna (K49 S73; Fas 0-värdet #686648 var feltranskription) */
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
- Chevron 18 px höger, `--mm-navcard-icon`, `aria-hidden` — samma
  grammatik som eventsidans åtgärdsrader (S73 K25/K72); tillagd vid
  2026-07-21-regelrivningen (se regel-sektionen nedan). Länknamnet är
  fortsatt etiketten ENSAM.
- **Hover-bakgrundsändring** (`hover:bg-bg-emphasized
  motion-safe:transition-colors`) — det tidigare M3-beslutet
  ("transparent-i-vila + hover-grå prövad och förkastad", S64) är RIVET
  ÖPPET på Marcus omprövning 2026-08-17 (task-273.2, PRD task-273 beslut
  3): samma bakgrundsplatta + mjuk övergång som eventdetaljens
  åtgärdsrader och hem-vyns Bevakningsrad (redan `hover:bg-bg-emphasized`
  sedan TASK-243.1, samma `--mm-navcard-*`-kortform).
- Fokus: den globala `:focus-visible`-ringen (base.css) — ingen egen
  fokus-styling.
- `prefers-contrast: more`: synlig kantlinje `--mm-navcard-border-contrast`
  (= `--mm-border-strong`). `prefers-reduced-motion`: hover-övergången är
  villkorad med `motion-safe:` (ingen transition vid reducerad rörelse,
  bakgrunden växlar ändå direkt); print: opåverkat (hover gäller aldrig
  papper).

### App-bred regel: chevron betyder att raden leder vidare

**REGELRIVNING ÖPPET BOKFÖRD (2026-07-21, task-18.3).** Den tidigare
regeln på denna plats — "navigationsrader bär inte chevron" ("desto
mindre saker desto renare", M4-varvet, D-reviderad) — är RIVEN som
Marcus-kvitterad konsekvens av S73:s K25-prövning: eventsidans
åtgärdsrader LÅSTES med chevroner i facitet, och prövnings-kontraktet
krävde då att app-regeln rivs öppet och att Mer-menyn följer med för
koherens (PRD task-18 implementationsbeslut 15; facit-bilagan
`s73-eventsida-konvergens/` §Öppet bokfört).

Ny regel: **chevron betyder att raden leder vidare.** Rader som tar
användaren till en annan yta eller in i ett flöde (NavCard, eventsidans
åtgärds- och check-in-rader) bär chevron 18 px höger i sekundärfärgen,
`aria-hidden` (etiketten bär namnet ensam). Dropdown-indikatorer
(t.ex. `Select`:s `ChevronDown`) är fortsatt en ANNAN mönsterklass;
tab-baren är inte en rad-klass och berörs inte.

### Komponent-tokens (components.css)

```css
--mm-navcard-bg: var(--mm-bg-muted);
--mm-navcard-text: var(--mm-text);
--mm-navcard-icon: var(--mm-text-secondary);
--mm-navcard-border: transparent;
--mm-navcard-border-contrast: var(--mm-border-strong);
```

---

## 15. Lugnt laddläge — Laddtrappan + Skeleton-primitiven

App-bred laddprincip (ORDLISTA "Lugnt laddläge" + "Laddtrappan"; task-7-
grillningen S63 Del 2, käll-verifierad research: NN/g Skeleton Screens 101,
Chung-empirin om shimmer-tempo, Adrian Rosellis skeleton-a11y-mönster).
Sedan [ADR-113](../decisions/ADR-113-laddtrappan-yttrappa-for-laddindikatorer.md)
(S102 Del 7, källbelagd branschprövning:
[`loading-indikator-branschpraxis-2026-08-15.md`](../research/loading-indikator-branschpraxis-2026-08-15.md))
bär §15 Laddtrappans fyra steg i stället för det tidigare ovillkorade
indikator-förbudet — Lugnt laddläge är trappans ORÖRDA överordnade princip:
slutlig geometri från första bildrutan rivs inte av trappan, den styr VAL av
indikator när laddning väl syns (ADR-078 komponerar oförändrat ovanpå).
Mekaniken bor i PRD TASK-8 (skeleton) + PRD TASK-219 (trappan); Hem är
första implementationsyta för skeleton-steget — övriga vyer migreras via
egna kort och ärver principen härifrån utan nya beslut.

### Laddtrappan — fyra steg (ADR-113)

Stegen är inte en preferensordning — varje steg är golvet för sin egen
yttyp, inte ett alternativ till de andra:

1. **Skeleton** — vyer och moduler med KÄND geometri. "Principen"-avsnittet
   nedan är detta stegs fullständiga regelverk.
2. **Spinner** — ENDAST knapp-internt, i arbetande knappar (submit,
   mutation). Levereras via Button-primitivens `isLoading`-prop (spinner +
   spärrat klickläge + skärmläsarbesked byggt EN gång på biblioteksnivå —
   TASK-219.2). Aldrig som sid- eller modulladdning.
3. **Determinate progress-bar** — längre kända flerstegsförlopp.
   Förberedelseskärmen
   ([ADR-112](../decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md))
   är appnivå-instansen.
4. **ALDRIG naken "Laddar…"-textrad** som enda laddbesked, oavsett vilket av
   de tre andra stegen som bär det faktiska beskedet — Marcus S62-beslut
   (kollapsade Hem-kort med växande text = layout-skift) är trappans orörda
   golv. Sr-only-besked parat med en synlig indikator är fortsatt
   normformen.

**Artighetsnivå:** laddbesked bärs av `role="status"` (`aria-live="polite"`)
— aldrig `role="alert"`. FK:s eget FLoader-mönster använder `role="alert"`
för sin laddtext, men det är FK:s egen avvikelse från WAI-ARIA-praxis
(W3C WAI ARIA22), inte ett mönster appen följer
(`loading-indikator-branschpraxis-2026-08-15.md` § 4). Laddning är rutin,
inte ett avbrott som ska tränga sig före det en skärmläsaranvändare redan
gör.

### Principen (trappsteg 1 — gäller varje vy/modul med känd geometri)

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
- **Aldrig naken "Laddar…"-textrad som enda besked** (trappans golv, steg 4
  ovan) — men spinner är inte generellt förbjudet på appnivå: utanför detta
  steg är det reserverat för Laddtrappans steg 2 (knapp-internt), aldrig
  för den sid- eller modulladdning detta avsnitt beskriver. Designen går
  medvetet över FK-golvet för just SKELETON-steget (FK saknar skeleton;
  spinner efter 1 s är deras enda mönster) — öppet bokfört med
  research-stöd i PRD TASK-8 och ADR-113.

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

## 16. ToggleButtonGroup — pill-toggel-primitiven

Kapselformad växlare där exakt ETT alternativ alltid är valt. Byggd på
react-aria-components `ToggleButtonGroup`/`ToggleButton` (ADR-044).
Facit-källa: S72-konvergensens pill-form (bilagan
`tasks/sessions/bilagor/s72-event-lista-konvergens/`, FACIT-listvyn).
Belagda konsumenter: event-listans period-toggel och vy-ikon-toggel
(task-17.2) samt eventsidans flik-kapslar (TASK-18-familjen).

### API (medvetet minimalt)

```tsx
<ToggleButtonGroup label="Period" spread defaultSelectedKey="upcoming"
  onSelectionChange={(key) => setPeriod(key)}>
  <ToggleButton id="upcoming">Kommande</ToggleButton>
  <ToggleButton id="past">Tidigare</ToggleButton>
</ToggleButtonGroup>
```

| Prop | Typ | Roll |
|---|---|---|
| `label` | `string` | Gruppens tillgängliga namn (radiogroup) — visas aldrig visuellt |
| `spread` | `boolean` | Likbreda segment som fyller bredden (period-formen); default inline kapsel |
| `selectedKey` / `defaultSelectedKey` | `K extends string` | Vald pill (controlled/uncontrolled) |
| `onSelectionChange` | `(key: K) => void` | Ny nyckel — aldrig "inget val" (alltid-ett-val) |
| `ToggleButton.id` | `K` | Pillens nyckel |
| `ToggleButton.size` | `'sm' \| 'md'` | `md` = period-formen (text-body, px-5); `sm` = flik-kapseln (text-small, px-2.5) |
| `className` | `string` | Merge:as efter variant-klasserna (Button-precedenten; ikon-pillen justerar `px-3.5`) |

**Förseglade beslut** (inte utelämnanden): `selectionMode="single"` +
`disallowEmptySelection` — React Aria ger då radiogroup/radio-semantik
(`role="radiogroup"`, `role="radio"` + `aria-checked`) och pill-toggelns
kontrakt är att en tidshorisont/vy alltid är aktiv. Orientering
horisontell (ingen vertikal konsument — över-engineering-vakten; växer
additivt vid verkligt behov).

### Anatomi och tangentbord

- Gruppen är EN tabbstopp (toolbar-mönstret): pilnavigering
  Vänster/Höger flyttar fokus inom gruppen, Enter/Space väljer, Tab
  lämnar gruppen.
- Ikon-piller: namnet bärs av `aria-label` på `ToggleButton`, ikonen är
  `aria-hidden` (vy-toggelns form).
- Fokusring via den globala `:focus-visible`-regeln (base.css) — ingen
  egen fokus-styling.

### Form (S72-facitet, computed-låst)

- Track: `rounded-full`, `--mm-bg-muted`, 4 px inre luft (`p-1`).
- Vald pill: `--mm-bg` (vit), semibold, `shadow-sm`, `--mm-text`.
- Ovald pill: transparent, medium, `--mm-text-secondary`.
- Ingen animation. Enda övergången är hover-plattans
  `motion-safe:transition-[background-color]` (se nedan) —
  reduced-motion/print utan specialfall (globala neutraliseringen täcker).
- Träffyta: md-pillen ≈40 px hög, tracket ≥44 px.

### Hover-återkoppling

Hover är inte ett TILLSTÅND utan ÅTERKOPPLING på att ytan går att klicka.
Tillstånden (vald/disabled) bärs av data-attributen; hovern ligger vid
sidan av dem och rör bara ovald pill. Infört efter Marcus design-review
2026-07-26 (S91) — flikarna saknade affordansen som resten av repots
chip- och pill-ytor har.

- Bärare: `data-[hovered]` (React Arias `useHover`, Button/Input-
  precedenten) — inte Tailwinds `hover:`. `useHover` sätter attributet
  endast för mus/penna (`pointerType === 'touch'` returnerar tidigt) och
  kopplas bort när knappen är disabled. Touch- och disabled-golvet blir
  därmed STRUKTURELLT, inte en override som kan glida. Strikt starkare än
  `@media (hover:hover)`, som är enhets-förmåga och ger klibbig hover på
  hybrid-enheter.
- Platta: `--mm-state-hover` på ovald pill
  (`not-data-[selected]:data-[hovered]`). Vald pill står ORÖRD — den är
  redan upplyft, och en platta ovanpå hade suddat gränsen mellan "vald"
  och "muspekaren är här". Riktningarna går isär: vald går ljusare än
  tracket, hover går mörkare.
- **Plattan är ett genomskinligt SKRIM, inte en opak ton.** Tracket ägs av
  konsumenten (`className` på gruppen) — Betalningar sätter
  `bg-bg-emphasized` på sitt. Med en opak `bg-bg-emphasized`-platta blev
  hovern på just den ytan uppmätt ΔE00 **0,00**: den försvann helt. Ett
  skrim mörknar i stället vilken bakgrund som helst med ett konstant steg.
  Regeln generaliserar: **återkoppling på en yta vars bakgrund du inte
  äger ska vara ett alfa-lager, aldrig en fast ton.** Branschmönstret är
  Material 3:s state layers och Radix alpha-skalor.
- `prefers-contrast: more`: plattan växlar till
  `--mm-state-hover-contrast` (dubbla alfat).
- Övergång: `motion-safe:transition-[background-color]`. MEDVETET smalare
  än precedentens `transition-colors` — den listan omfattar i Tailwind v4
  även `outline-color`, vilket hade tonat in den globala
  `:focus-visible`-ringen över 150 ms. Fokusindikatorn ska stå direkt.
- Tangentbordet får sin likvärdiga återkoppling ur fokusringen, inte ur
  plattan; kanalerna är åtskilda, inte dubblerade.

Uppmätt (sRGB, skrimmet KOMPOSITERAT över respektive track; WCAG 2.x +
CIEDE2000):

| Track | Platta | Steg mot track (ΔE00) | Etikett på plattan |
|---|---|---|---|
| `bg-muted` (standard) | rgb(232,232,231) | 2,77 | 6,45:1 (AA ✓) |
| `bg-emphasized` (Betalningar) | rgb(225,226,221) | 2,60 | 6,07:1 (AA ✓) |
| `bg` (vit, hypotetisk) | rgb(242,242,242) | 2,63 | 7,07:1 (AA ✓) |
| `bg-muted` + `contrast-more` | rgb(220,220,218) | 5,39 | 5,76:1 (AA ✓) |
| `bg-emphasized` + `contrast-more` | rgb(213,214,209) | 5,33 | 5,41:1 (AA ✓) |

Referens: komponentens egen vald/ovald-skillnad (vit pill mot `bg-muted`)
är ΔE00 **2,30**. Plattan ligger alltså på samma urskiljbarhetsnivå som
den redan godkända vald-signalen — men åt motsatt håll, så "hovrad ovald"
och "vald" kan inte förväxlas — och håller det steget oberoende av vilken
ton tracket bär. Kontrast-gränserna och track-oberoendet vaktas som
computed-assertioner i sviten, inte som påstående.

### Tokens

Inga egna komponent-tokens: formen konsumerar semantiska tokens direkt
via Tailwind-mappningen (`bg-bg-muted` → `--mm-bg-muted` osv.) —
RadioGroup-precedentens token-konsumtion. Komponent-tokens införs först
när ett tema-behov kräver omdirigering per komponent.

Hover-skrimmet bor i SEMANTISKA lagret som `--mm-state-hover` /
`--mm-state-hover-contrast` — en roll ("interaktions-lager"), inte en
komponent-token: rollen är generell för varje yta som behöver återkoppling
mot en bakgrund den inte äger, och är därmed återanvändbar av nästa
primitiv utan ändring.

Beteendekontraktet är computed-style-testat i
`tests/a11y/ToggleButtonGroup.spec.ts`; axe-skanningen av demo-sektionen
bor i `tests/a11y/primitives.spec.ts`.

---

## 17. Kursfärger — ADR-064-taxonomins semantiska tokens

Kursfärgerna ger varje kurs i event-taxonomin (ADR-064) en fast färg —
S72-facitets legend (kalendervyns dag-plattor, legend-prickar och
månadssummeringens streck; Gruppdynamikens kurshistorik i
TASK-18-familjen). Facit-källa: bilagan
`tasks/sessions/bilagor/s72-event-lista-konvergens/`, FACIT-kalendervyn
(K11/K12: solida 500-kulörer — legendens och dag-plattornas kulör är
SAMMA token).

### Tokens (semantiska lagret)

| Token | Primitiv | Legend-etikett |
|---|---|---|
| `--mm-kurs-fjarrskadning` | `--p-blue-500` | Fjärrskådning |
| `--mm-kurs-rim1` | `--p-green-500` | RIM 1 |
| `--mm-kurs-rim2` | `--p-copper-500` | RIM 2 |
| `--mm-kurs-rim3` | `--p-red-500` | RIM 3 |
| `--mm-kurs-annat` | `--p-neutral-500` | Annat |

Alla fem kulörer fanns redan som primitiver — primitivlagret är orört
(task-17.3). Riktvärdet är ≤5–7 färger med **Annat som uppsamling**:
Psionautics, nakna "Resor i medvetandet" (fälla 35), saknat kursnamn och
framtida kurser landar i Annat utan kod-ändring. En ny kurs får egen
färg först genom nytt designbeslut (token + mappningspost), aldrig
implicit.

### Mappningen (ett uppslag, ingen namn-matchning i vyer)

Uppslaget kurs → färg bor i `src/lib/kursfarg.ts`
(segment-taxonomy-prejudikatets placering): `kursfargForKurs(kurs)` tar
basens exakta kursnamn (`Event (source)`-värdet — teckenexakt, samma
JOIN-nyckel-klass som segment-taxonomin) och ger `{ klass, etikett,
token, bgClass }`; `KURSFARGER` bär legendens ordning. Prototypens
regex-matchning på visningsnamn är ersatt — vyer gör ALDRIG egen
namn-matchning. Tailwind-literalerna (`bgClass`-fälten, kompletta
klass-strängar) bor i modulen eftersom JIT:s statiska scanning kräver
literaler i källan — Tailwinds källskanning läser för övrigt även
markdown, så klass-formade exempel i docs emitterar utilities; därför
stavas klassmönstret inte ut här.

### Erfarenhetsmixens sekventiella skala (task-18.10 — gruppdynamik)

Eventsidans Gruppdynamik-avsnitt bär en **sekventiell** skala
(mätar-segment plus nivåstreck) som svarar på *hur mycket* erfarenhet en
deltagare har — till skillnad från kursfärgernas **kvalitativa** kulörer,
som svarar på *vilken* kurs. De två får därför medvetet olika färgrymd.

| Token | Primitiv | Nivå |
|---|---|---|
| `--mm-erfarenhet-ny` | `--p-neutral-300` | Första eventet |
| `--mm-erfarenhet-mellan` | `--p-neutral-500` | 1–2 tidigare event |
| `--mm-erfarenhet-erfaren` | `--p-neutral-700` | 3+ tidigare event |

En **neutral lightness-ramp** (ljus → mörk = ny → erfaren): kromatiskt
distinkt från samtliga kurs-/kategori-kulörer (blå/grön/koppar/röd/guld) och
respekterar fokusringens exklusiva `#1B4965` (`--p-blue-700` rörs aldrig, och
en tredje mörk *blå* saknas i primitivlagret — som är läs-yta i denna skiva).
Segmenten och strecken är dekorativa (`aria-hidden`); nivåns antal står som
**text** i etiketten — färg är aldrig ensam bärare (WCAG 1.4.1).

Nivå-BUCKETarna härleds ur `antalGenomfordaEvent` (basens RIM-3-inkluderande
räknare) — 0 / 1–2 / 3+. Deltagarens kanoniska `Erfarenhetsbadge` (formel,
RIM-3-BLIND) visas RÅ på personkortet: när den avviker från räknaren är just
den divergensen den kända badge-luckan (T16) visad som den är, aldrig
bortdesignad.

---

## 18. SlideToConfirm — dra-till-bekräfta-primitiven

Handtag för tunga, avsiktliga handlingar: DRAGET är bekräftelsen
(Resend Broadcasts-klassen) — ett råkat klick kan aldrig utlösa valet.
Byggd för hand som APG-switch (se förseglade beslut). Facit-källa:
S73-facit-utökningen K77–K84 (bilagan
`tasks/sessions/bilagor/s73-eventsida-konvergens/`,
FACIT-skapa-sidan.png + FACIT-skapa-handtag-armad.png). Belagd
konsument: skapa-sidans publicerings-handtag (task-19.3/19.4).

### API (medvetet minimalt)

```tsx
<SlideToConfirm
  label="Publicera på miranon.se"
  prompt={<>Dra för att publicera på <Domän /></>}
  confirmedLabel={<>Publiceras på <Domän /></>}
  isSelected={publicera}
  onChange={setPublicera}
/>
```

| Prop | Typ | Roll |
|---|---|---|
| `label` | `string` | Switchens tillgängliga namn — visas aldrig visuellt (instruktions-texten är aria-hidden och tillstånds-växlande) |
| `prompt` | `ReactNode` | Instruktionstext i oarmerat läge (tonar ut under draget) |
| `confirmedLabel` | `ReactNode` | Text i armerat läge, bredvid bocken |
| `isSelected` / `defaultSelected` | `boolean` | Armerat läge (controlled/uncontrolled) |
| `onChange` | `(isSelected: boolean) => void` | Anropas ENDAST när värdet faktiskt ändras |
| `sound` | `boolean` | Diskret pling vid armering (default på) — konsument-preferensens säte; `prefers-reduced-motion` respekteras alltid oavsett värde |
| `className` | `string` | Merge:as efter formklasserna (Button-precedenten) |

Domän-/monotexten är KONSUMENT-ägd (K81:s adress-grammatik bor i
`prompt`/`confirmedLabel`-noderna) — primitiven har ingen åsikt om
textens typografi.

**Förseglade beslut** (inte utelämnanden): byggd som APG-switch för
hand, INTE på react-aria-components/Radix `Switch` — de togglar på
klick, vilket river avsikts-mekaniken (K79: draget kräver grepp och
håll). Släpp-trösklarna 90/10 och grepp-vakterna är
konvergens-låsta (K77–K79). Inget `isDisabled` (ingen belagd
konsument — över-engineering-vakten; växer additivt vid verkligt
behov).

### Anatomi och tangentbord

- Roten är EN fokuserbar `role="switch"` med `aria-checked` —
  oarmerat/armerat annonseras som av/på; `label` bär namnet.
- Space/Enter togglar samma val — draget är FÖRSTÄRKNING, aldrig enda
  vägen (11-ribban; PRD TASK-19 användarberättelse 9–10).
- Drag-vakterna (K79): endast primärknapp · greppet måste ligga PÅ
  cirkeln (klick på rännan teleporterar inte) · grepp-offseten bevaras
  (kant-grepp = kant-följ) · släppt knapp utan pointerup avslutar
  draget (ingen hovring-följning). Drag-tillståndet är REF-buret
  (L300).
- Släpp: ≥90 % armerar (pling), ≤10 % avarmerar, däremellan fjädrar
  cirkeln tillbaka (`motion-safe`; globala reduced-motion-
  neutraliseringen täcker dessutom).
- Fokusring via den globala `:focus-visible`-regeln (base.css).

### Form (S73-facitet, computed-låst)

- Ränna: `rounded-full`, `--mm-bg-emphasized`, höjd 48 px, INGEN
  kontur (K78-rivningen: tonad yta bär formen själv).
- Cirkel: 48×48 px — täcker EXAKT rännans höjd, ingen inset (K78);
  `--mm-surface` + `shadow-md`; tom i vila — bocken är målets belöning.
- Armerat läge: bock i `--mm-success` + `confirmedLabel` i medium —
  INGEN fyllnad i något läge (K82-rivningen: armad-signalen bärs av
  bock + text, aldrig av grön yta).
- Instruktionstexten (`--mm-text-muted`, text-small) tonar ut linjärt
  med drag-positionen.
- Pling: kort tvåtons-chime via Web Audio (inga assets); spelas ENDAST
  vid armering; tystnad under `prefers-reduced-motion: reduce` och vid
  `sound={false}`; ljud är förstärkning, aldrig bärare.
- `prefers-contrast: more` och print: synlig kontur via **outline**
  (layout-neutral — en border hade flyttat cirkelns positioneringsbox
  och brutit ingen-inset-formen).

### Tokens

Inga egna komponent-tokens: formen konsumerar semantiska tokens direkt
via Tailwind-mappningen (§16-precedenten). Komponent-tokens införs
först när ett tema-behov kräver omdirigering per komponent.

Beteende- och formkontraktet är computed-testat i
`tests/a11y/SlideToConfirm.spec.ts` (a11y-mönster-specen: semantik,
tangentbord, drag-vakter, pling-preferenser, axe-0 i båda tillstånden);
sektions-skanen i runnern bor i `tests/a11y/primitives.spec.ts`.

---

## 19. Button — den TVÅDIMENSIONELLA knapp-standarden (intent × emphasis + storlek)

Primitiven bor i `src/components/primitives/Button.tsx` (RAC-bas per
ADR-044, CVA-varianter, komponent-tokens `--mm-button-*`). Denna sektion
kodifierar ANVÄNDNINGS-reglerna — vilken intent, emphasis och storlek en
knapp får bära var.

> **ÖPPEN REVIDERINGSNOT (Marcus beslut A, 2026-07-25 — morgongranskningen
> av 18.16):** §19:s ursprungsform (endimensionell — intent-regeln utan
> emphasis-dimension, allt renderat solid) rivs öppet och ersätts av den
> tvådimensionella regeln nedan: INTENT styr färgen, EMPHASIS styrs av
> YTKLASSEN. Beslutsgrund (research-belagd): Shopify Polaris skiljer
> `tone` × `variant` som ortogonala axlar · IBM Carbon bär danger i tre
> viktnivåer (primary/tertiary/ghost) · Material 3 föreskriver text-/
> outline-knappar inuti kort · FK:s "en primär handling per del".
> K77-rivningen (nedan) står kvar oförändrad.

### Dimension 1 — INTENT styr färgen

Semantisk färgregel utan ad-hoc-undantag. **Intenten följer HANDLINGEN,
aldrig platsen:**

| Intent | Regel |
|---|---|
| `success` (sage-grön) | Handlingar som **NÅR UTOMSTÅENDE** — mail/SMS till deltagare o.dyl. (Skicka bekräftelse, Bekräfta alla, segment-utskickets Skicka, armerad publicering). |
| `primary` (mörkgrå) | **Interna** huvudhandlingar — skriver bara i systemet (Spara, Skapa anmälan, Räkna antal, Exportera). |
| `danger` (röd) | **Destruktions-klassen** — tar bort eller förstör (Ta bort). ALDRIG som "viktigt/oåterkalleligt": skydd mot oåterkallelighet bärs av confirm-grinder (skriv-för-att-bekräfta, kontrollfråga), inte av rött. |
| `secondary` | Neutral stödform: sekundär handling bredvid en huvudhandling (Avbryt i formulär, Redigera, Hämta fler). Står UTANFÖR emphasis-dimensionen (är i sig en neutral outline). |
| `ghost` | Neutral stödform: lågviktade handlingar i trängre ytor (dialog-Avbryt, dismiss, Rensa). Står UTANFÖR emphasis-dimensionen (är i sig en neutral subtle). |

- **Dynamisk intent** när knappens FAKTISKA semantik i stunden växlar:
  skapa-sidans "Skapa event" är `primary` oarmerad och `success` vid
  armerad publicering (publiceringen når utomstående; oarmerat skapande
  är internt). Mönstret gäller generellt — intenten följer vad trycket
  GÖR, inte vad ytan heter.
- **K77-rivningen, öppet bokförd:** S73-facitets K77 (statiskt grön
  "Skapa event") revs i två steg — 18.16-beslutet A (regeln vinner →
  statiskt `primary`) amenderades i review-våg 5 (PR #94) till
  dynamisk intent ovan. Återvändo-not: upplevs helheten för tung/för
  grön hanteras det på TOKEN-nivå (`--mm-button-*`), aldrig per
  undantag; lätt återvändo = flippa intent-attributet.
- Texten bär alltid — färgen är förstärkning (WCAG 1.4.1).

### Dimension 2 — EMPHASIS styrs av YTKLASSEN

Emphasis-skalan `solid`/`outline`/`subtle` (primitivens `emphasis`-prop,
default `solid`) väljs av ytan knappen sitter i — aldrig av handlingen:

| Ytklass | Emphasis |
|---|---|
| **Sidnivå / primär handlingsyta** (formulärens knapprader, dialog-actions, sektionens eget redigeringsflöde) | `solid`. Max EN solid per yta; en sida med självständiga sektioner bär max en solid per sektion. |
| **Kort och listrader** (deltagar-/personkort, instans-kort i listor) | `outline` eller `subtle` — intent-färgen bärs av **text + kant**, ALDRIG solid fyllnad inuti kort. |
| **Tabellrader / toolbars** (grupp-rubrikrader, rad-verktyg) | `subtle` kompakt (`size="sm"`). **Undantag — lägesöppnaren:** en knapp som försätter hela sektionen i ett annat läge (markera-läge, redigeringsläge) är sektionens primära kontroll, inte ett rad-verktyg, och bär `solid`. Utgången ur läget bär `subtle` på samma plats. |

- Emphasis ändrar ALDRIG intenten. Greta-fallets kortfots-knapp *var*
  `success` (når utomstående) viktad för kortets ytklass
  (`emphasis="outline"`) — **knappen är riven 2026-07-26 (task-48), se
  rivnings-noten nedan**; principen den illustrerade gäller oförändrad.
  Levande exempel på samma princip: markera-lägets batch-bar bär
  `success` **solid** i sidnivå-ytklassen medan intenten är densamma —
  emphasis följde ytan, inte handlingen.
- AA-golvet i textbärarna: success-textbäraren för outline/subtle mörkas
  15 % på token-nivå (rå #606B57 mäter ≈ 4,2:1 mot subtle-plattan över
  emphasized-raden — mörkad ≈ 5,4:1; kanten behåller råa intent-kulören).
  `subtle` tänder en kant i intent-färgen under `prefers-contrast: more`.
- Prejudikat flippade vid emphasis-införandet (fix-vågen 2026-07-25):
  deltagarkortens Skicka bekräftelse (solid → `success`/`outline`,
  Greta-fallet) och Bekräfta alla-pillen på grupp-rubrikraden (solid →
  `success`/`subtle`; dialogens bekräfta-knapp är dialog-actions och
  förblir solid). Sidnivå-solids står orörda: AnmalanDetails Skicka
  bekräftelse (sidans enda primära handling), morf-lägenas Spara
  (sektionens redigeringsflöde), formulärens knapprader.
- **BÅDA de två prejudikaten ovan UPPHÖRDE 2026-07-26 (task-48)** — de
  beskriver knappar som inte längre finns. Greta-fallets kortfots-knapp
  (K46) och Bekräfta alla-pillen (K47/K48) revs när markera-läget
  ersatte hela hantera-flödet i Anmälda deltagare. Raderna står kvar som
  BESLUTSHISTORIK (emphasis-regeln härleddes ur dem och gäller
  oförändrad), men de är inte längre en karta över levande kod: läser du
  §19 för att hitta ett levande exempel på `success`/`outline` i
  kort-ytklassen, leta någon annanstans. Nya prejudikat ur samma
  landning: markera-lägets batch-bar bär `success` **solid** — baren är
  blockets primära handlingsyta (inte en kort- eller radyta), vilket är
  emphasis-regeln tillämpad, inte ett undantag från den — och
  Markera/Avbryt-paret på grupp-rubrikraden bär `primary` `sm` i
  emphasis-paret **solid** (Markera) / **subtle** (Avbryt), per
  lägesöppnar-undantaget i ytklass-tabellen ovan.
- **KORRIGERING 2026-07-26 (S91, Marcus design-review):** raden ovan löd
  först att Markera-knappen är `primary`/`subtle` `sm` med hänvisning till
  toolbar-ytklassen. Det var fel, och felet är värt att bevara som varning:
  S86-facit — Marcus-låst med orden "Lås denna" — visar en MÖRK SOLID knapp
  (`--mm-btn-primary-bg` = `#282928`). Bygget läste §19:s toolbar-rad,
  fann en kollision mot facit, löste den tyst till regelns fördel och
  skrev sedan in sin egen lösning här som nytt prejudikat. **En skriven
  regel väger aldrig tyngre än en Marcus-låst form; kollisionen ska
  lyftas, inte avgöras av den som bygger.** Lägesöppnar-undantaget ovan
  är den principiella upplösningen — det var den distinktion som saknades
  i regeln, inte facit som hade fel.

### Storleks-reglerna

Skalan `sm`/`md`/`lg` = 32/40/48 px min-höjd (ACCESSIBILITY-CHECKLIST
§2-golvet: aldrig under 24×24; 44×44 rekommenderas i primärflöden):

| Storlek | Ytklass |
|---|---|
| `md` (40 px, default) / `lg` (48 px) | Primärflöden: formulärens knapprader, sid-nivåns huvudhandlingar, dialog-actions. |
| `sm` (32 px) | Kort, rader och inline-ytor: morf-lägenas Spara/Avbryt, kort-verktyg (Redigera/Rensa), list-pillar (Bekräfta alla). |

Egen geometri uttrycks via primitivens `className`
(tailwind-merge-precedenten) — t.ex. personkortets kortfots-knapp
Skicka bekräftelse (`w-full rounded-t-none rounded-b-xl`). Handvirade
token-kopior utanför primitiven är anti-mönster (duplicerad wiring
driver isär tyst); tillåts ENDAST där primitivens form genuint inte
kan uttrycka facit-geometrin ens via className, och då med skälet
bokfört i kod-kommentaren.

Länkar och rad-grammatiken (§14 NavCard, åtgärds-/handlingsrader) står
utanför intent-regeln av FORM-skäl: rader bär inte knapp-intents —
intent-regeln träffar knapparna i det flöde raden leder till.
Prejudikat flippade vid intent-regelns införande (task-18.16):
personkortets Skicka bekräftelse (grå kortfot → success) och
segment-utskickets "Skicka till N personer" (`danger` → `success`).

---

## 20. Låst korthöjd — app-bred kortgeometri-regel

**Regel (Marcus-order 2026-08-10, S104 Del 6 "Tre-fynd-varvet"):** varje
list-/innehållskort reserverar höjden för sitt MAXINNEHÅLL och får ALDRIG
växa eller krympa med det faktiska innehållet. Geometrin ligger fast när
data landar, när skalprovet växlas, när namnet är kort.

### Mekanismen

Varje textrad som kan variera i längd (namn, beskrivning) får
`line-clamp-2 min-h-[2lh]`: `min-h-[2lh]` reserverar två radhöjder i
elementets EGEN typografi (CSS `lh`-enheten — line-height, inte ett
hårdkodat pixeltal), kombinerat med `line-clamp-2` som klipper vid två
rader om innehållet är längre. Antal-/metaraden får sin egen fasta
`min-h-8`. Samma grepp som personlistans låsta radhöjd (S103) — ett
generellt mönster för likformiga kort/rader, inte en engångslösning.

### Belägg

Mätt på `SegmentKort` (segmentprototypens listrad,
`src/components/segment/prototyp/VariantD.tsx`): **samtliga 14 genererade
kort exakt 168 px**, oavsett att namn- och beskrivningstexterna varierar
kraftigt i längd (commit `16c25de6`, S104 Del 6-tabellens
"Tre-fynd-varvet"-rad, `tasks/sessions/2026-08-10-session-104.md`).
Mönstret hade redan produktionsprecedent i `EventCard` (task-17.2,
S72-facitet — §14 ovan bygger på samma NavCard-generation): S104:s fynd
höjer det uttryckligen till en APP-GLOBAL regel i stället för att förbli
ett enskilt komponentmönster.

### Vad regeln INTE är

168 px är det MÄTTA utfallet för `SegmentKort`s specifika textmängd, inte
ett pixeltal andra kort ska matcha. Regeln låser att höjden är en FUNKTION
av komponentens eget maxinnehåll, beräknad en gång i dess egen typografi —
och att den geometrin sedan aldrig rör sig. Nya kort-komponenter räknar ut
sitt eget `min-h-[Nlh]` utifrån sitt eget maxinnehåll; talet 168 px är inte
en app-bred konstant.

---

## 21. Notistrappan — form per klass i notis- och felmeddelande-familjen

App-bred meddelandeprincip, införd av
[ADR-121](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)
(S109, 2026-08-21). Fram till dess hade denna spec **noll träffar** på banner,
notis, toast eller `MessageBox` — familjen saknade styrande yta helt, vilket
research-passet
([`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](../research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md))
dömde som den verkliga luckan, inte antalet ytor.

Trappan är systerstruktur till § 15 Laddtrappan och delar dess logik: **varje
steg är golvet för sin egen klass, inte ett alternativ till de andra.**

### Indelningen sker på TVÅ axlar — aldrig på var i koden felet uppstod

Appens fem ytor var indelade efter kodhemvist (AppShell, primitiv,
ErrorBoundary), vilket är en implementationsaxel. Varje undersökt designsystem
delar i stället på:

1. **Orsakade användaren detta?** (uppgiftsgenererat kontra systemgenererat —
   Carbons task-generated/system-generated, NN/g:s validation/notification)
2. **Kräver det handling nu?** (Carbons optional action/required action,
   NN/g:s passive/action-required)

**Regeln, i en mening:** *förskjut layout när meddelandet redan står i vägen
för det användaren försökte göra; överlagra när det inte gör det.*

### Notistrappan — åtta klasser

| Klass | Exempel | Form | Förskjuter layout? |
|---|---|---|---|
| Systemnivå, ingen handling krävs nu | "en ny version finns" · "du är offline" | Överlagrad passiv notis | **Nej** |
| Systemnivå, handling krävs för att fortsätta | "en del av sidan kunde inte laddas" | Banner i flödet, **under app-huvudet**, ej stängbar | **Ja, får** |
| Uppgiftsgenererat fel, knutet till en yta | "Bilagorna kunde inte hämtas" | Inline, intill det som gick fel | Ja |
| Uppgiftsgenererat fel, knutet till ett fält | valideringsfel i formulär | Fältfel + felsammanfattning överst, fokus dit | Ja |
| Uppgiftsgenererad bekräftelse | "Anmälan sparad" | Toast, överlagrad, får auto-döljas | **Nej** |
| Delyta kraschade | `SectionError` | Inline i den yta som kraschade | Ja, lokalt |
| Hela appen kraschade | `AppError` | Helsida | Ej tillämpligt |
| Kritiskt, kräver beslut nu | ingen instans idag | Modal | Blockerar |

### Fyra app-breda regler

- **Fel blir ALDRIG toast. Bekräftelser får bli det.** NN/g, verbatim: *"a
  toast ... while appropriate for passive notifications, **would be a bad way
  to implement an error message**"*. Källan bär också instansen: en användare
  väntade fem minuter på innehåll som redan fallerat, eftersom felet tonat bort
  efter fem sekunder.
- **En passiv notis får ingen timer** när dess knapp är enda vägen till
  åtgärden (WCAG 2.2.1 + Carbon, samstämmiga). Den stängs av användaren och
  återkommer vid nästa **nya** anledning, aldrig periodiskt.
- **Överlagrade notiser har FAST bredd**, aldrig full bredd. Carbon: *"Toast
  notifications have a fixed width and should not be expanded to fit the
  content area."*
- **Live-regionen är alltid monterad, bara innehållet växlar** — för
  `role="status"`. MDN: *"Start with an empty live region, then – in a separate
  step – change the content inside the region."* `role="alert"` har motsatt
  egenskap och monteras villkorat; en tom alert-region som ligger kvar är en
  andra alert-region i varje vy (mätt: tre orelaterade tester föll på
  `strict mode violation: getByRole('alert') resolved to 2 elements`).

### Copy-golvet — problem, orsak, lösning

Måttstocken är Microsofts checklista (*"good error messages have: A problem.
... A cause. ... A solution."*) plus GOV.UK:s mönster *"There is a problem with
the service"*, som kräver besked om **vad som hänt med det användaren skrev**,
samt kontaktväg eller alternativ väg när sådan finns.

- **Generiska fel är förbjudna.** GOV.UK, verbatim: *"**Be specific.** ...
  Avoid messages like: **'An error occurred'**"* och *"Do not use ...
  **'unspecified error'**"*. `"Något gick fel. Försök igen."` och
  `"Okänt fel. Försök igen."` är de svenska motsvarigheterna och faller båda.
- **Bevarandet av inmatning ligger på systemet, inte på användaren** (NN/g
  *"Preserve the user's input"*, GOV.UK *"Do not clear any form fields"*).
- **"Ladda om", inte "Uppdatera"** — Försäkringskassans och Arbetsförmedlingens
  designsystem skriver "ladda om sidan", WordPress svenska i 17 av 17 strängar.
  "Uppdatera" kolliderar mätt med domänspråket ("uppdatera en anmälan").
- **Klassen avgör, inte ordet.** GOV.UK förbjuder "sorry" i fältvalidering men
  **föreskriver** det i H1 på sin systemfels-sida.

### Öppna poster (ADR-121 § Öppet)

- Var databesked-varningen tar vägen är **inte** beslutat — dialog-formen
  kräver osparad-detektion, samma mekanik som vägde mot ett förkastat
  alternativ.
- `SectionError`:s *"Försök igen"* är **mätt trasigt** vid chunk-fel (kör om
  samma import mot samma saknade fil) och är inte åtgärdat av trappan.
- `AppError` är medvetet ostylad för att överleva ett dött stylesheet.

## 22. Åtgärdskön — arbetsobjekt är INTE notiser

App-bred klassregel, införd av
[ADR-122](../decisions/ADR-122-eventlankens-vakt-och-atgardskon.md) (S110,
2026-08-21). Paragrafen finns för att dra **familjegränsen** mot § 21: utan
den kommer nästa läsare att försöka pressa in arbetsobjekt i notistrappan,
eller bygga ett notiscenter för dem.

### Gränsen: händelsebunden kontra tillståndsbunden

`§ 21`s åtta klasser är **händelsebundna** — något hände nyss, och beskedet
hör till det ögonblicket. Ett **arbetsobjekt** är **tillståndsbundet**: det
ligger kvar tills någon åtgärdar det, och det är sant oavsett vem som tittar
eller när.

| | Notis (§ 21) | Arbetsobjekt (§ 22) |
|---|---|---|
| Uppstår ur | en händelse i sessionen | ett tillstånd i datan |
| Överlever omladdning | nej | **ja** |
| Försvinner av | tid, eller att användaren stänger | **en handling som löser det** |
| Rätt form | notistrappans klass | åtgärdskö |

**Regeln, i en mening:** *kan beskedet vara sant för en användare som loggar
in i morgon, är det inte en notis.*

### En åtgärdskö har alltid TRE delar

Branschmönstret (exception queue / review queue — Stripe Radar, Shopify Order
risk, UiPath Orchestrator) bär tre delar som samverkar. Två av tre är en
halvmesyr:

1. **Kön** — en räknad, filtrerbar samling. På Hem är formen en
   **`Bevakningsrad`** (se ORDLISTA + `src/components/hem/Bevakningsrad.tsx`),
   inte en ny yta: helt osynlig vid noll träffar, klickbar uppgiftsrad vid
   träff.
2. **Markören** — en indikator på den enskilda posten, i den lista där posten
   bor. NN/g föreskriver indicators *"associated with a UI element or with a
   piece of content"*, visade *"in close proximity to that element."*
3. **Resolution** — en väg att lösa felet **i appen**. Posten lämnar kön genom
   en handling, aldrig genom att någon går till Airtable. Operations-
   litteraturens bärande regel: *direct links to the work item so the user can
   resolve the issue without hunting through another system.*

### Två regler

- **Ett notiscenter är aldrig svaret.** NN/g: en notis som skickas oberoende
  av vad användaren håller på med *"would likely be ignored, and may even
  annoy users."* Arbetsobjekt hör hemma där arbetet görs, inte i en separat
  logg.
- **Bygg aldrig kön utan resolution.** Det gör Airtable till en yta Lotta
  måste kunna — motsatsen till appens syfte — och lämnar en kö hon inte kan
  tömma.

### Instanser

| Kö | Datakälla | Status |
|---|---|---|
| Anmälningar vars eventlänk inte kunde verifieras | `Anmälningar.Eventmatchning` (formelfält, `ADR-122` beslut 3) | Speccas |

## Ändringslogg

| Datum | Förändring |
|-------|-----------|
| 2026-08-21 | §22 Åtgärdskön — arbetsobjekt är INTE notiser ([ADR-122](../decisions/ADR-122-eventlankens-vakt-och-atgardskon.md), S110). Dragen som familjegräns mot §21 dagen efter att §21 skrevs: notistrappans åtta klasser är alla händelsebundna, och en post som ligger kvar tills någon åtgärdar den har ingen klass där. Regeln i en mening: kan beskedet vara sant för en användare som loggar in i morgon är det inte en notis. Tre delar krävs alltid (kö · markör · resolution i appen) — två av tre är en halvmesyr som gör Airtable till en yta Lotta måste kunna. Notiscenter förkastat på NN/g:s grund. Formen på Hem är den befintliga `Bevakningsrad`, inte en ny yta. |
| 2026-08-21 | §21 Notistrappan — familjens FÖRSTA styrande yta ([ADR-121](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md), S109). Fram till nu hade specen noll träffar på banner/notis/toast/`MessageBox`; fem ytor bar fyra separata designspråk utan att någon regel band dem. Trappan delar på TVÅ axlar (orsakade användaren detta? kräver det handling nu?) i stället för på kodhemvist, med åtta klasser och kolumnen "förskjuter layout". Fyra app-breda regler: fel blir aldrig toast · ingen timer när knappen är enda vägen till åtgärden (WCAG 2.2.1) · överlagrade notiser har fast bredd · `role="status"` alltid monterad medan `role="alert"` monteras villkorat. Copy-golvet problem/orsak/lösning mot GOV.UK + NN/g + Microsoft; "Ladda om" låst framför "Uppdatera" (mätt domänkollision). Systerstruktur till §15 Laddtrappan, samma form som `ADR-113` etablerade. |
| 2026-04-05 | Initialt dokument. Token-arkitektur, typografiskala, spacing-system, lint-config, design-audit skill-spec, Playwright-config, Tailwind-mappning. |
| 2026-04-07 | [GA] Integrerat gap-analys: View Transitions (§9), stale-data-indikatorer (§10), error boundary-meddelanden (§11), systemhälso-indikator (§12), fem kvaliteter (§13). Audit-prompt uppdaterad med performance/säkerhet/ARIA/EAA-kontroller. |
| 2026-07-12 | §14 NavCard — navigationsrads-primitiven (M6-facitet, S64 Del 3): API, anatomi, form, komponent-tokens + app-breda regeln "navigationsrader bär inte chevron" (task-9.1). |
| 2026-07-12 | §15 Lugnt laddläge — laddprincipen (app-bred, S63 Del 2-samsynen + task-8.1:s mätlåsta framträdande-form) + Skeleton-primitiven: API, Roselli-anatomin, form, komponent-tokens (task-8.2). |
| 2026-07-18 | §15 Form: skeleton-tonen till branschbandet — 1.4.11-feltillämpningen korrigerad (dekorativt undantag per Understanding 1.4.11; MUI/Carbon/shadcn-värden citerade), ny semantisk roll-token `--mm-bg-placeholder` (neutral-200), shimmer 45→75 %, kontrast-kontraktet dubbelriktat i Skeleton.spec (task-8.6; S67 QA-fynd, L269-klassen). |
| 2026-07-21 | §16 ToggleButtonGroup — pill-toggel-primitiven (S72-facitet): API, förseglade beslut (singel-val + alltid-ett-val → radiogroup-semantik), anatomi/tangentbord, computed-låst form, semantisk token-konsumtion utan komponent-tokens (task-17.1). |
| 2026-07-21 | §17 Kursfärger — ADR-064-taxonomins semantiska tokens (S72-facitets legend, solida 500-kulörer): fem `--mm-kurs-*`-roller mot befintliga primitiver + uppslaget `src/lib/kursfarg.ts` (teckenexakta basvärden, Annat som uppsamling; ersätter prototypens namn-matchning) (task-17.3). |
| 2026-07-21 | §14 REGELRIVNING: "navigationsrader bär inte chevron" riven öppet (S73 K25-prövningens Marcus-kvitterade konsekvens; PRD task-18 beslut 15) → ny regel "chevron betyder att raden leder vidare"; NavCard-formen får chevron 18 px höger i sekundärfärgen, Mer-menyn följer med för app-koherens (task-18.3). |
| 2026-07-22 | §18 SlideToConfirm — dra-till-bekräfta-primitiven (S73-facit-utökningen K77–K84): API, förseglade beslut (hand-byggd APG-switch — klick-toggle river avsikts-mekaniken; 90/10-trösklar; inget isDisabled), K79-drag-vakterna + L300-ref-tillståndet, computed-låst form utan fyllnad (K82), pling med preferens-respekt, semantisk token-konsumtion utan komponent-tokens (task-19.1). |
| 2026-07-25 | §19 Button — intent- och storleks-reglerna (task-18.16, Marcus review-våg 2): grön-knapp-regeln (når-utomstående ⇒ success, internt ⇒ primary; danger = destruktions-klassen, aldrig "oåterkalleligt"), dynamisk-intent-mönstret, K77-rivningen öppet bokförd med återvändo-not, storleksskalan sm/md/lg per ytklass, app-bred audit bokförd (personkortets Skicka bekräftelse + segment-utskickets faro-knapp flippade till success). |
| 2026-07-26 | §19 PREJUDIKAT-RIVNING (task-48): de två prejudikaten ur 18.16:s fix-våg — deltagarkortens Skicka bekräftelse (`success`/`outline`, Greta-fallet) och Bekräfta alla-pillen (`success`/`subtle`) — upphörde att existera när markera-läget ersatte hantera-flödet i Anmälda deltagare. Raderna behålls som beslutshistorik med öppen not; emphasis-regeln själv är oförändrad. Nya prejudikat: batch-barens `success` solid (blockets primära handlingsyta) + Markera-knappens `primary`/`subtle` `sm` på grupp-rubrikraden. **KORRIGERAD 2026-07-26 (S91) — se raden nedan.** |
| 2026-07-26 | §19 LÄGESÖPPNAR-UNDANTAGET + korrigering av samma dags prejudikat (task-48 fix-våg 1, Marcus design-review S91): Markera-knappen är `primary` **solid** `sm` = S86-facit, INTE `subtle` som landningen tidigare samma dag skrev in; Avbryt ärver `primary`/`subtle` på samma plats (ghost saknade bakgrund och läste som textlänk). Ytklass-tabellens toolbar-rad bär nu undantaget: en lägesöppnare är sektionens primära kontroll, inte ett rad-verktyg. Processnoten bevarad i §19-kroppen — en skriven regel väger aldrig tyngre än en Marcus-låst form, och kollisionen ska lyftas i stället för att avgöras av den som bygger. |
| 2026-07-26 | §16 MOTIVERINGS-RIVNING + hover-återkoppling (Marcus design-review S91: "borde inte 'Manuella' och 'Medföljande' i översta togglen där ha hover?"). Den gamla koden motiverade frånvaron med att pekare/tangentbord/touch skulle få "identisk semantik" — den motiveringen blandade ihop TILLSTÅND med ÅTERKOPPLING och är riven, inte kompletterad. Ovald pill får hover-skrimmet `--mm-state-hover` via `not-data-[selected]:data-[hovered]`; vald pill står orörd; `prefers-contrast: more` växlar till `--mm-state-hover-contrast`. Bäraren är React Arias `data-hovered` (Button/Input-precedenten) — touch och disabled utesluts strukturellt av `useHover`, inte av en override. Övergången är MEDVETET smalare än precedentens `transition-colors` (den drar med `outline-color` och hade tonat in fokusringen). NYA SEMANTISKA TOKENS: `--mm-state-hover` / `--mm-state-hover-contrast` (interaktions-lager, alfa-skrim) — en opak platta mätte ΔE00 0,00 mot Betalningars egna `bg-bg-emphasized`-track, dvs. hovern försvann på den ytan; skrim mörknar valfri bakgrund med konstant steg. Kontrast + ΔE00 uppmätt och computed-vaktat i sviten på båda tracken. |
| 2026-07-25 | §19 REVIDERAD till TVÅDIMENSIONELL regel (Marcus beslut A, morgongranskningen — 18.16 facit-revidering): intent styr färgen × emphasis styrs av ytklassen (solid = sidnivå/primär handlingsyta, max en per yta/sektion · outline/subtle = kort och listrader, aldrig solid fyllnad inuti kort · subtle kompakt = tabellrader/toolbars). Ursprungsformens endimensionella regel riven öppet (revideringsnot i §19); K77-rivningen står kvar. Button-primitiven får emphasis-varianter + `--mm-button-*-outline/subtle-*`-tokens (success-textbäraren AA-mörkad 15 %). Flippar: deltagarkortens Skicka bekräftelse → success/outline (Greta-fallet) · Bekräfta alla-pillen → success/subtle. Research-grund: Polaris tone×variant · Carbon danger i tre viktnivåer · M3 text-buttons-i-kort · FK "en primär per del". |
| 2026-04-13 | Migrerat från `tailwind.config.ts` till Tailwind v4 `@theme`-direktivet (CSS-first). §8 innehåller nu komplett `@theme`-block i stället för JS-config. §4 Lint: ESLint+Stylelint-kodexempel borttagna, Biome 2.0 införd som enda lint/format-verktyg. §2 Tailwind-mappning: typografi uttryckt som `@theme`-variabler. §1 Token-lager: semantiska tokens refereras nu i `@theme`-blocket i `tailwind.css`. Se `conversion-plan.md` fotnoter och ändringsspec 2026-04-13. |
| 2026-08-15 | §15 SKRIVS OM till Laddtrappan (task-219.1, ADR-113, S102 Del 7): det tidigare ovillkorade "'Laddar…'-textrader och spinners används inte"-förbudet ersätts av en fyrstegs yttrappa (skeleton för känd geometri · spinner ENDAST knapp-internt via kommande Button `isLoading` · determinate progress-bar för längre förlopp, appinstans Förberedelseskärmen/ADR-112 · aldrig naken "Laddar…"-textrad som enda besked) med Lugnt laddläge kvar som orörd överordnad princip. Ny artighetsnivå-not: laddbesked är `role="status"`/polite, aldrig `role="alert"` — FK:s FLoader-avvikelse bokförd öppet mot WAI-ARIA-praxis. Källbelagt i `loading-indikator-branschpraxis-2026-08-15.md`. |
| 2026-08-17 | §20 Låst korthöjd — app-bred kortgeometri-regel (S104 Del 6, Marcus-order 2026-08-10): `line-clamp-2 min-h-[2lh]` per variabel textrad reserverar höjden för kortets maxinnehåll, geometrin rör sig aldrig; mätt på `SegmentKort` — 14 genererade kort exakt 168 px trots varierande textlängd (commit `16c25de6`). Produktionsprecedent i `EventCard` (§14, task-17.2) höjs uttryckligen till app-bred regel. Ordlistans fyra S104-begrepp (Grupp/Uppsättning/Alternativ/Urval av personer) skördade samma pass (task-249.7). |
