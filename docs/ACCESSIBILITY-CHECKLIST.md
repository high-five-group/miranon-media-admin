# Tillgänglighetschecklista — Miranon Media Admin

Denna checklista säkerställer att projektet följer WCAG 2.2 AA, i linje med
FK Designsystemets (FKUI) krav. Admin är en intern Vue 3 SPA — inte en publik
sajt — men tillgänglighet är lika viktig: Lotta ska kunna använda appen
effektivt oavsett enhet, situation eller eventuella funktionsvariationer.

Använd checklistan vid varje ny vy, komponent eller leveranssteg.

---

## Fas 1 — Innan du bygger

- [ ] Finns det en FKUI-komponent för detta? Kolla komponentbiblioteket FÖRST
- [ ] Vilken status har komponenten? Använd bara **Produktionsklar** i leverans
- [ ] Används komponenten som FK tänkt, utan CSS-overrides eller wrapper-hack?
- [ ] Är sidans struktur skissad med rätt rubriknivåer (h1 > h2 > h3, aldrig hoppa)?
- [ ] Har du kollat FK:s senaste release? (Se "Underhåll av FKUI-fork" nedan)
- [ ] Har du kollat vue-byggplan-v2.md för vilka FK-komponenter som ska användas i denna vy?

## Fas 2 — Under byggandet

### Kod och komponenter

- [ ] Används FKUI:s egna komponent, inte generisk HTML eller egenbyggd variant?
- [ ] Skrivs koden med Composition API och `<script setup>` (Vue 3)?
- [ ] Har custom-element korrekta ARIA-attribut (`aria-label`, `aria-describedby`, `role`)?
- [ ] Har dynamiskt innehåll (modaler, alerts, laddning) rätt `aria-live`-region?
- [ ] Har laddningstillstånd `aria-busy="true"` på containern som uppdateras?
- [ ] Har skeleton-loading ett `aria-label="Laddar..."` eller liknande?
- [ ] Är alla interaktiva element minst 24x24 pixlar (WCAG 2.5.8)?
- [ ] Är `<html lang="sv">` satt i index.html?

### Tangentbord

- [ ] Fungerar alla interaktioner utan mus (Tab, Shift+Tab, Enter, Escape, piltangenter)?
- [ ] Syns fokusmarkering (FK focus-ring med sage) tydligt på alla interaktiva element?
- [ ] Fastnar fokus aldrig i en "fälla" (utom i modaler, där det ska vara avsiktligt)?
- [ ] Stängs modaler och slide-in-menyn med Escape?
- [ ] Returneras fokus till utlösande element när modal/meny stängs?

### Formulär

- [ ] Har varje fält ett synligt, kopplat label-element (FKUI-komponent)?
- [ ] Visas felmeddelanden vid varje fält som har fel (inte bara generell lista)?
- [ ] Flyttas fokus till första felet vid submit?
- [ ] Beskriver felmeddelandet vad som är fel OCH hur man fixar det?
- [ ] Har fält för namn, e-post, telefon rätt `autocomplete`-attribut (WCAG 1.3.5)?
- [ ] Markeras obligatoriska fält med text "(obligatorisk)", inte bara asterisk?

### Datatabeller (FInteractiveTable)

- [ ] Har tabeller korrekta `<th>`-element med `scope="col"` eller `scope="row"`?
- [ ] Har tabellen en `<caption>` eller `aria-label` som beskriver innehållet?
- [ ] Är sorteringskontroller markerade med `aria-sort`?
- [ ] Har paginering `aria-label` och `aria-current="page"` på aktiv sida?
- [ ] Meddelas filtrerings-/sökresultat via `aria-live`?

### Navigation (slide-in-menyn)

- [ ] Har menyn `role="navigation"` och `aria-label="Huvudmeny"`?
- [ ] Har menyknappen `aria-expanded="true/false"`?
- [ ] Har sektionsheaders `aria-expanded` för accordion-state?
- [ ] Markeras aktiv sida med `aria-current="page"`?
- [ ] Stängs menyn med Escape och klick utanför?
- [ ] Returneras fokus till menyknappen vid stängning?
- [ ] Är touch targets minst 44px på mobil?

### Felsidor och undantagstillstånd

- [ ] Har tomma tillstånd ("Inga obetalda just nu") förklarande text?
- [ ] Har error-state en retry-knapp och beskrivande meddelande?
- [ ] Hanteras nätverksfel (Edge Function timeout) med tydligt meddelande?

### Session och autentisering

- [ ] Fungerar login med tangentbord?
- [ ] Hanteras session timeout med tydligt meddelande + redirect till login?

## Fas 3 — Verifiering efter bygge

### Automatiserade tester

- [ ] Lighthouse Accessibility score 95+ (Chrome DevTools > Lighthouse)
- [ ] Inga kritiska fel i axe DevTools (webbläsartillägg)

### Manuella tester

- [ ] Tabba igenom hela sidan — logisk ordning uppifrån och ner?
- [ ] Zooma till 200% — inget försvinner, överlappar eller kräver horisontell scroll?
- [ ] Testa med enbart tangentbord i minst 2 minuter — kan du utföra alla uppgifter?
- [ ] Kontrollera kontrast på all text (minst 4.5:1 normal, 3:1 stor)
- [ ] Kontrollera att alla interaktiva element är minst 24x24px

### Responsivitet

- [ ] Fungerar sidan på 320px bredd utan horisontell scroll?
- [ ] Fungerar sidan med textförstoring (browser font size 200%)?
- [ ] Respekteras `prefers-reduced-motion` för animationer?

---

## Underhåll av FKUI-fork

| Aktivitet | Frekvens |
|-----------|----------|
| Kolla FK:s changelog för nya releaser | Varannan vecka |
| Granska om releaser innehåller tillgänglighetsfixar | Vid varje ny release |
| Uppdatera fork och testa att Miranon-tema fungerar | Vid relevanta releaser |
| Dokumentera FKUI-version i package.json | Alltid |

Changelog: https://designsystem.forsakringskassan.se/latest/gettingstarted/about/release-notes.html

---

## Prompt-tillägg för Claude Code

Kopiera och använd vid kodgenerering:

```
VIKTIGT: Läs ACCESSIBILITY-CHECKLIST.md innan du genererar nya komponenter
eller vyer. Följ dess krav för FKUI-användning, ARIA-attribut,
tangentbordsnavigering och formulärhantering.

Använd FKUI:s Vue-komponenter (FTextField, FSelectField, FButton etc.)
istället för generiska HTML-element. Skriv Composition API med <script setup>.
Säkerställ att alla interaktiva element har tangentbordsnavigering och
ARIA-attribut enligt WCAG 2.2 AA.
Alla interaktiva element ska vara minst 24x24px.
Formulärfält för persondata ska ha autocomplete-attribut.
Laddningstillstånd ska använda aria-busy="true".
Datatabeller ska ha <th> med scope och <caption>.
Slide-in-menyn ska ha role="navigation", aria-expanded, aria-label.
Tomma tillstånd ska ha förklarande text, aldrig tom skärm.
```

---

## Resurser

- FK Designsystem: https://designsystem.forsakringskassan.se/latest/
- FK GitHub: https://github.com/Forsakringskassan/designsystem
- WCAG 2.2 snabbguide: https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa
- axe DevTools: https://www.deque.com/axe/devtools/
- DIGG: https://www.digg.se/webbriktlinjer
- autocomplete-värden: https://www.w3.org/TR/WCAG22/#input-purposes

---

*Senast uppdaterad: 2026-04-01*
