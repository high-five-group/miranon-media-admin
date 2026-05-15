<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# ARIA-UPGRADE — ARIA 1.3 och tillganglighetsuppgradering

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Fas 3, punkt 3-4 + Fas 7, punkt 4)*
*Galler: miranon-media-admin (React 19 SPA)*

---

## Oversikt

Konverteringsplanen refererar WCAG 2.2 AA men adresserar inte ARIA 1.3-attribut,
EAA-krav (European Accessibility Act, i kraft sedan 28 juni 2025), eller kognitiva
tillganglighetskriterier fran WCAG 2.2. Detta dokument specificerar exakt vilka
attribut, monster och tester som implementeras per komponent och per vy.

---

## 1. ARIA 1.3-attribut per komponent

### Button (`button.tsx`)

- **`aria-description`**: Kontextuell info nar label inte racker. Skarmlasar hor labeln forst, sedan beskrivningen.
- **`aria-keyshortcuts`**: Dokumenterar kortkommandon (t.ex. `Control+S`). Lagg ALDRIG till utan implementerat kommando.

```tsx
<Button
  aria-label="Markera som betald"
  aria-description={`Markera betalning for ${personName}, ${amount} kr`}
  onPress={handleMarkPaid}
>
  Markera som betald
</Button>
```

### Dialog (`dialog.tsx`)

React Aria Dialog hanterar fokus-trapping, Escape och `role="dialog"` automatiskt. Lagg till:

- **`aria-description`**: Kontext utover rubriken for skarmlasar-anvandare.
- **Verifiering:** `aria-labelledby` pekar pa rubrik, fokus till forsta interaktiva element vid oppning, fokus atergar till trigger vid stangning.

### Formularfalt (TextField, NumberField, Select, Checkbox)

**`aria-errormessage`** lankar felmeddelandet via ID. Annonseras BARA nar `aria-invalid="true"`.

```tsx
<Input
  id={id}
  aria-invalid={hasError || undefined}
  aria-errormessage={hasError ? `${id}-error` : undefined}
  aria-describedby={`${id}-help`}
/>
<p id={`${id}-help`}>Ange personens fullstandiga namn</p>
{hasError && <p id={`${id}-error`}>Namn far inte vara tomt</p>}
```

**Kritiskt:** `aria-describedby` lases alltid (hjalpsam instruktion). `aria-errormessage` lases bara vid `aria-invalid="true"` (felinformation). De ar INTE utbytbara.

### TabGroup (`tab-group.tsx`)

- **`aria-keyshortcuts`**: Dokumenterar `ArrowLeft ArrowRight Home End` for skarmlasar-anvandare.
- React Aria TabList implementerar tangentbordskommandon automatiskt — attributet dokumenterar dem.

### ListItem (`list-item.tsx`)

- **`aria-description`**: Kontextuell info utover label. VoiceOver laser: "Rongne Retreat — Event om 12 dagar, 14 anmalda".

### StatusBadge (`status-badge.tsx`)

Farg ar aldrig ensam informationsbarare. Text-label alltid synlig. Verifiera:

- [ ] Varje StatusBadge har synlig text (inte bara bakgrundsfarg)
- [ ] Kontrast 4.5:1 for normal text mot bakgrund
- [ ] I `prefers-contrast: more` — forstarkta kanter + okad kontrast

---

## 2. EAA-checklista (European Accessibility Act)

EAA tradde i kraft **28 juni 2025**. Boter upp till 100 000 EUR / 4% av omsattning.

### Krav-tabell

| # | Krav | Fas |
|---|------|-----|
| E1 | Alla interaktiva element: tangentbordsatkomliga | 3 |
| E2 | Alla formularfalt: synliga labels | 3 |
| E3 | Alla bilder: alt-text eller `aria-hidden` | 5-6 |
| E4 | Allt dynamiskt innehall: `aria-live` announcements | 6 |
| E5 | Alla fel: programmatiskt fastallbara (`aria-errormessage`) | 3 |
| E6 | Fokushantering: logisk ordning + synlig fokusindikator | 0 |
| E7 | Tidsbegransningar: justerbara eller forlangningsbara | 5 |
| E8 | Drag-operationer: alternativ med enstaka pekare | 7 |
| E9 | Malstorlek: 24x24px minimum (44px rekommenderat) | 7 |
| E10 | Sprakmarkering: `<html lang="sv">` | 0 |
| E11 | Rubrikhierarki: en h1 per vy, h2 > h3, aldrig hoppa | 5-6 |
| E12 | Farg aldrig ensam informationsbarare | 3 |
| E13 | Textstorlek: skalbar till 200% utan funktionsforlust | 7 |
| E14 | Automatisk uppspelning: pausbar | 7 |

### Audit-checklista (Fas 7)

Varje punkt testas manuellt. Dokumenteras i `docs/audits/YYYY-MM-DD-eaa-audit.md`.

- [ ] E1: Tab igenom hela appen — alla interaktiva element nas
- [ ] E2: Varje formularfalt har synlig `<label>` (inte bara placeholder)
- [ ] E3: `img` utan alt → lagg till. Dekorativa → `aria-hidden="true"`
- [ ] E4: Dynamiska listor har `aria-live="polite"` pa container
- [ ] E5: `aria-invalid` + `aria-errormessage` pa alla falt med validering
- [ ] E6: Fokusring synlig pa alla interaktiva element
- [ ] E7: Supabase auth-timeout: varna 60s fore, tillat forlangning
- [ ] E8: Inga drag-operationer i v1 (dokumentera for framtid)
- [ ] E9: Mata alla interaktiva element — minimum 24x24px, tab bar 44px
- [ ] E10: `<html lang="sv">` i index.html
- [ ] E11: En h1 per vy, rubrikhierarki aldrig bruten
- [ ] E12: StatusBadge + indikatorer — text/ikon kompletterar farg
- [ ] E13: Zoom 200% — inget overflappar, inget forsvinner
- [ ] E14: Inga auto-playing element
- [ ] E15: Skip-link forst i DOM, synlig vid Tab-fokus
- [ ] E16: `prefers-reduced-motion: reduce` — transitions bortagna
- [ ] E17: `prefers-contrast: more` — forstarkt kontrast
- [ ] E18: Felmeddelanden forstaliga (Gunilla-principen)
- [ ] E19: Landmarker (`<main>`, `<nav>`, `<header>`) definierade
- [ ] E20: Alla lankar har diskriminerande text (aldrig "Klicka har")
- [ ] E21: Scrollbar area navigerbar med tangentbord
- [ ] E22: Inga tangentbordsfallor

---

## 3. Kognitiv tillganglighet (WCAG 2.2)

### SS2.2.1 Tidsjusterbar (A)

Supabase auth-timeout far aldrig resultera i blank skarm. Visa dialog 60s fore
timeout, tillat forlangning, spara ofardigt arbete lokalt.

### SS2.4.11 Fokus inte dolt (AA) — NY i WCAG 2.2

Sticky headers och tab bar far INTE tacka fokuserade element:

```css
*:focus-visible {
  scroll-margin-top: 80px;    /* page-header */
  scroll-margin-bottom: 80px; /* tab bar (mobil) */
}
```

### SS2.5.7 Drag-rorelser (AA) — NY i WCAG 2.2

Miranon Media Admin v1 har INGA drag-operationer. Resizable sidebar fran Vue
portas INTE till React (tab bar ersatter desktop-sidebar). Om drag laggs till
i framtiden — implementera alltid knappar ("Flytta upp"/"Flytta ner") som alternativ.

### SS2.5.8 Malstorlek minimum (AA) — NY i WCAG 2.2

| Element | Minimikrav | Implementation |
|---------|------------|----------------|
| Button | 24x24px (44px rekom.) | `min-height: 44px` |
| Tab bar-ikoner | 44px | tab-bar.tsx, Fas 5 |
| ListItem | Full bredd, min-height 44px | list-item.tsx |
| Checkbox/Radio | 24x24px (44px touch) | Overrida React Arias 20px default |
| Pagination-knappar | 44px | personer-vy, Fas 6 |
| Sokfalt | 44px hojd | page-header.tsx |
| Dialog-knappar | 44px | dialog.tsx |

### SS2.2.2 Pausa, stoppa, dolj (A)

Inga auto-playing element i v1. Om animationer laggs till (Motion/Framer Motion):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Alla Motion-animationer wrappas i `useReducedMotion()` fran `motion/react`.

---

## 4. Manuell skarmlasar-test (Fas 7)

Automatiserade verktyg (Lighthouse, axe) fangar bara 30-40% av problem.
Manuell VoiceOver-testning ar obligatorisk.

### VoiceOver (macOS) testprotokoll

For varje av de 4 flikarna (Hem, Event, Personer, Mer) + inloggningssidan:

1. **Navigering:** Oppna med VoiceOver (Cmd+F5), navigera till flik, verifiera route announcement
2. **Rubrikhierarki:** Navigera rubrik for rubrik (VO+Cmd+H), verifiera h1 > h2 > h3
3. **Interaktiva element:** Tab igenom alla, verifiera label + roll + tillstand per element
4. **Live regions:** Utfor filtrering/sokning, verifiera `aria-live` announcements
5. **Felmeddelanden:** Trigga valideringsfel, verifiera `aria-errormessage` + Gunilla-principen
6. **Tomma tillstand:** Navigera till vy utan data, verifiera forklarande meddelande (aldrig tyst)
7. **Dialog:** Oppna dialog, verifiera fokus-trap + Escape + fokus-retur till trigger

### Testmatris

| Vy | 1 Nav | 2 Rubrik | 3 Element | 4 Live | 5 Fel | 6 Tom | 7 Dialog |
|----|-------|----------|-----------|--------|-------|-------|----------|
| Login | | | | | | | n/a |
| Hem | | | | | | | |
| Event-lista | | | | | | | |
| Event-detalj | | | | | | | |
| Personer | | | | | | | |
| Person-detalj | | | | | | | n/a |
| Mer | | | | n/a | n/a | | n/a |

Varje cell: PASS / FAIL / PARTIAL + kommentar.

### Dokumentation

Resultat i `docs/audits/YYYY-MM-DD-voiceover-audit.md`. Formatet per vy:

```markdown
## Hem-fliken
### Route announcement
**Resultat:** PASS / FAIL
**Detalj:** VoiceOver meddelade "Hem — Miranon Media Admin"
### Interaktiva element
**Resultat:** FAIL
**Problem:**
- [ ] StatCard saknar aria-label
- [ ] CTA-knappen laser bara "knapp" (fix: lagg till label)
```

Varje FAIL genererar ett issue i `tasks/todo.md` med referens till auditfilen.

---

## Sammanfattning: Implementation per fas

| Fas | Vad som implementeras |
|-----|----------------------|
| 0 | Fokusregel, `<html lang="sv">`, scroll-margin, CSS prefers-reduced-motion |
| 3 | `aria-errormessage` pa formularfalt, `aria-description` pa Button/Dialog, target-size |
| 5 | Skip-link, landmarker, rubrikhierarki, session-timeout-varning, tab bar 44px |
| 6 | `aria-live` pa dynamiska listor, `aria-description` pa ListItem, debounced sok |
| 7 | EAA-checklista (22 punkter), VoiceOver-audit (7 steg x 7 vyer), kognitiva kriterier |
