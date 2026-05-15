# Tillgänglighetsaudit — Miranon Media Admin

Fyll i denna mall vid varje planerad audit. Spara ifylld fil som
`docs/audits/YYYY-MM-DD-audit.md` i repot.

---

## Grundinfo

| Fält | Värde |
|------|-------|
| Datum | |
| Audittyp | [ ] Baseline (första) / [ ] Sprint-audit / [ ] Kvartalsaudit |
| Utförd av | |
| FKUI-version | |
| URL (localhost / staging) | |
| Senaste audit | |

---

## 1. Automatiserade tester

Kör på alla vyer som ändrats sedan senaste audit. Vid kvartals-audit: alla vyer.

### Lighthouse Accessibility

| Vy | Score | Anmärkning |
|----|-------|------------|
| LoginView | | |
| MinaSidorView | | |
| DashboardView (Översikt) | | |
| RegistrationsView | | |
| EventsView | | |
| PaymentsView | | |
| AttendanceView | | |
| PersonsView | | |
| LeadsView | | |
| MailView | | |
| WaitlistView | | |

Mål: 95+ på alla vyer.

### axe DevTools

| Vy | Critical | Serious | Moderate | Minor |
|----|----------|---------|----------|-------|
| LoginView | | | | |
| MinaSidorView | | | | |
| DashboardView | | | | |
| RegistrationsView | | | | |
| EventsView | | | | |
| PaymentsView | | | | |
| AttendanceView | | | | |
| PersonsView | | | | |
| LeadsView | | | | |
| MailView | | | | |
| WaitlistView | | | | |

Mål: 0 critical, 0 serious.

---

## 2. Tangentbordstest

Testa varje flöde med enbart tangentbord (Tab, Shift+Tab, Enter, Escape, piltangenter).

### Navigation och meny

| Test | OK | Problem |
|------|----|---------|
| Kan nå menyknappen med Tab | [ ] | |
| Meny öppnas med Enter | [ ] | |
| Meny stängs med Escape | [ ] | |
| Meny stängs med klick utanför | [ ] | |
| Fokus returneras till menyknappen vid stängning | [ ] | |
| Sektioner expanderas/kollapsas med Enter | [ ] | |
| Kan nå alla menyposter med Tab | [ ] | |
| Fokusordning logisk (uppifrån-ner) | [ ] | |
| Fokusring (sage) synlig på alla element | [ ] | |
| Aktiv sida visuellt markerad | [ ] | |

### Login

| Test | OK | Problem |
|------|----|---------|
| E-postfält nåbart med Tab | [ ] | |
| Lösenordsfält nåbart med Tab | [ ] | |
| Login-knapp nåbar med Tab | [ ] | |
| Enter på lösenordsfält → submit | [ ] | |
| Felmeddelande vid fel inloggning | [ ] | |
| Fokus på felmeddelande | [ ] | |

### Dashboard (Scenario 1 — Morgonöverblick)

| Test | OK | Problem |
|------|----|---------|
| StatCards navigerbara med Tab | [ ] | |
| EventCards navigerbara med Tab | [ ] | |
| Klickbara namn i listor navigerbara | [ ] | |
| "Visa alla"-knappar nåbara | [ ] | |
| Retry-knapp vid error nåbar | [ ] | |

### Datatabeller (V8b+)

| Test | OK | Problem |
|------|----|---------|
| Sökfält nåbart och fungerande | [ ] | |
| Filter-dropdowns nåbara | [ ] | |
| Sorteringskontroller fungerar med tangentbord | [ ] | |
| Paginering navigerbar | [ ] | |
| Radåtgärder (klick på namn, statusändring) nåbara | [ ] | |

### Modaler och detaljvyer (V8a+)

| Test | OK | Problem |
|------|----|---------|
| Modal öppnas med Enter | [ ] | |
| Fokus fångas i modal (focus trap) | [ ] | |
| Modal stängs med Escape | [ ] | |
| Fokus returneras till utlösande element | [ ] | |
| ConfirmDialog: Avbryt och Bekräfta nåbara | [ ] | |

---

## 3. Visuell granskning

| Test | OK | Problem |
|------|----|---------|
| Kontrast: All text uppfyller 4.5:1 (normal) / 3:1 (stor) | [ ] | |
| Zoom 200%: Inget försvinner eller överlappar | [ ] | |
| Textförstoring (browser 200%): Layout intakt | [ ] | |
| 320px bredd: Ingen horisontell scroll | [ ] | |
| prefers-reduced-motion: Animationer respekterar inställningen | [ ] | |
| Färg aldrig ensam informationsbärare | [ ] | |
| Interaktiva element minst 24x24px | [ ] | |
| Touch targets minst 44px på mobil | [ ] | |

---

## 4. ARIA och semantik

| Test | OK | Problem |
|------|----|---------|
| `<html lang="sv">` satt | [ ] | |
| En `<h1>` per vy | [ ] | |
| Rubrikhierarki korrekt (h1 → h2 → h3, inga hopp) | [ ] | |
| Landmärken: `<header>`, `<nav>`, `<main>` finns | [ ] | |
| Menyn har `role="navigation"` + `aria-label` | [ ] | |
| Menyknapp har `aria-expanded` | [ ] | |
| Accordion-sektioner har `aria-expanded` | [ ] | |
| Aktiv menysida har `aria-current="page"` | [ ] | |
| Laddningstillstånd har `aria-busy="true"` | [ ] | |
| Dynamiska uppdateringar har `aria-live` | [ ] | |
| Tomma tillstånd har förklarande text | [ ] | |
| Ikoner: meningsbärande har `aria-label`, dekorativa har `aria-hidden` | [ ] | |

---

## 5. Komponent-specifik granskning

### Egna komponenter (ej FK)

| Komponent | Tangentbord | ARIA | Kontrast | Touch 44px | Problem |
|-----------|-------------|------|----------|------------|---------|
| Slide-in-meny (AppMenu) | [ ] | [ ] | [ ] | [ ] | |
| StatCard | [ ] | [ ] | [ ] | [ ] | |
| EventCard | [ ] | [ ] | [ ] | [ ] | |
| ProgressRing | [ ] | [ ] | [ ] | [ ] | |
| StatusBadge | [ ] | [ ] | [ ] | [ ] | |
| NewRegistrationsList | [ ] | [ ] | [ ] | [ ] | |
| UnpaidList | [ ] | [ ] | [ ] | [ ] | |
| PlaceholderView | [ ] | [ ] | [ ] | [ ] | |

### FK-komponenter (verifiering)

| FK-komponent | Används korrekt | Inga overrides som bryter a11y |
|-------------|-----------------|-------------------------------|
| FButton | [ ] | [ ] |
| FMessageBox | [ ] | [ ] |
| FNavigationMenu (om använd) | [ ] | [ ] |
| FInteractiveTable (V8b+) | [ ] | [ ] |
| FModal (V8a+) | [ ] | [ ] |
| FBadge | [ ] | [ ] |

---

## Sammanfattning

### Hittade problem

| # | Allvarlighet | Vy/Komponent | Beskrivning | WCAG-kriterium |
|---|-------------|--------------|-------------|----------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Allvarlighet: **Kritisk** (blockerar) / **Allvarlig** (svåranvänt) / **Medel** (besvärligt) / **Låg** (kosmetiskt)

### Åtgärder

| # | Problem | Deadline | Status |
|---|---------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

Status: Öppen / Pågår / Åtgärdad / Accepterad risk

### Övergripande bedömning

| Fråga | Svar |
|-------|------|
| Uppfyller appen WCAG 2.2 AA? | [ ] Ja / [ ] Ja, med kända undantag / [ ] Nej |
| Kända undantag | |
| Nästa audit | |

---

<!-- markdownlint-disable-next-line MD036 -->
*Mall version: 1.0 — 2026-04-01*
