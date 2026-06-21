---
owner: marcus803
updated: 2026-06-21
review_by: 2026-11-15
status: stable
---

# CLAUDE.md — Miranon Media Admin (React)

---

## Vad är detta projekt?

Admin-app för **Miranon Media** (Roger & Lotta). Hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

Detta är en **React-konvertering** av det Vue-byggda systemet i `~/Repon/miranon-media-os/`. Vue-projektet ligger kvar som referens under hela konverteringen — alla 4 komponenter på 11/11/11, 12 composables och hela arkitekturen porteras steg för steg enligt en styrande plan. Vue-repot `~/Repon/miranon-media-os/` är **fryst** referens — inte ett aktivt redigerings-mål.

**Styrande dokument för byggandet:** `docs/byggplan.md` (i detta repo). Vue-repots `react-migration/`-mapp är historiskt referensmaterial — användes som källa under Fas 0 + Fas 1 men ersätts av byggplan.md från och med Fas 2.

---

## Instruktioner — Alltid gäller

- **Styrande dokument för byggandet:** `docs/byggplan.md`. Läs den innan varje fas. Avvik aldrig utan att uppdatera byggplanen först.
- Research före implementation: kolla React Aria, TanStack, Radix, FK Designsystemet INNAN du designar en lösning. Branschledarnas mönster är golvet.
- **Airtable-schema före write:** konsultera `docs/reference/data-model.md` (fält-skrivbarhet, formel/rollup-fält, §Kända fällor, write-fält-IDs) INNAN du designar någon Airtable-fält-operation. Anta aldrig fält-form — verifiera mot referensen eller live via Code. Gäller Chat (prompt-design) och Code (utförande).
- **Samarbetssystemets mekanik:** hur vårt Chat/Code/Marcus-system fungerar och sitter ihop bor i `docs/reference/systemet.md` — den navigerbara mekanik-kartan (roller, hub/spoke-instantiering, disciplin-skills, governing- och distributions-mekanik). Slå upp on-demand när du behöver systemets mekanik; läs inte in den i förväg.
- Testa nytt bibliotek/approach med minimalt test (1 komponent, 1 hook) innan full implementation
- Verifiera per komponent: 11/11/11 (bibliotek) eller 11/10/10 (vyer). Bevisa att det fungerar — "det funkar" ≠ "det är rätt".
- Fånga lärdomar i `tasks/lessons.md` efter varje korrigering. Markera universella med `[UNIVERSAL]`.

---

## Triage av det oväntade — alltid-på (ADR-053)

När något OVÄNTAT uppstår (utanför nuvarande scope — nära eller långt ifrån, men alltid
oväntat), kör denna triage innan du fortsätter. Lita inte på omdöme i stunden — det är den
empiriskt svagaste mekanismen (~9%), samma svaghetsklass ADR-043 kodade bort för lifecycle.
Klassa mot två axlar: närhet till nuvarande scope, och om det BLOCKERAR nuvarande arbete.

- Blockerar + i scope → hantera nu (enabling-detour, egen landning).
- Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
- Blockerar ej + värdefullt → defer till tråd-registret (durabelt, för senare).
- Blockerar ej + lågvärde → förkasta EXPLICIT (noteras kort, aldrig tyst).

Ledstjärna: registrera — förkasta aldrig tyst. Ett oväntat värde som inte fångas dör med
sessionen. Baren för "blockerar" hålls hög: bara det som genuint stoppar nuvarande arbete
eskaleras eller hanteras nu; allt annat defereras eller förkastas, så inte varje småsak blir
en tråd.

Kriteriet ny session vs detour = sessions-paus-distinktionen (ADR-051): fortsätter samma
scope → detour; distinkt scope → egen session.

HUR (ge tråden ett ID, lägg en rad i indexet, skapa ev. tråd-kort): se
tasks/threads/README.md § "Så här registrerar du en ny tråd". Princip här, mekanik där.

---

## Stack

React + TypeScript + Vite + TanStack Router + Biome; se `package.json` för versioner.

---

## Bygg, testa, linta

Kanoniska kommandon (per `CONTRIBUTING.md` Definition of Done):

```bash
npm run test:api            # API-tester gröna
npm run typecheck           # 0 typfel (tsc -b, äkta över project references)
npx @biomejs/biome check .  # 0 lint-fel
npm run build               # bygg grön
```

---

## Filstruktur

För aktuell struktur, kör `tree -L 3 -I 'node_modules|dist|.git|coverage|test-results|playwright/.auth'`.

---

## Synk-horisont och arkiv-åtkomst

claude.ai-projektkunskapen synkar INTE: `tasks/sessions/archive/`,
`docs/archive/` (+ `package-lock.json` om fil-urval stöds). Allt finns
kvar i git — exkluderingen gäller endast Chat-ytans synk (ADR-048).

Regel för Chat: noll träffar i projektkunskapen på historiskt material
(arkiverade sessionsdok, superceded specs, frusna analyser) betyder INTE
att det saknas. Historik utanför synk-horisonten hämtas VIA CODE
(LÄS→RAPPORTERA mot lokal disk/git) eller genom att Marcus klistrar
innehållet — anta aldrig att materialet inte existerar.

`docs/research/` ligger kvar i synken tills Fas 6 är avslutad
(konsumeras aktivt av Fas 6) och exkluderas därefter (ADR-048 punkt 3).

---

## Design-system

**FK-inspirerat 3-lagers token-system** (DESIGN-SYSTEM-SPEC.md §1):

1. **Primitiv** (`src/styles/tokens/primitives.css`) — råa värden: `--mm-amber-500: #FFBA05`, `--mm-blue-900: #1B4965`, etc.
2. **Semantisk** (`src/styles/tokens/semantic.css`) — roller: `--mm-color-primary`, `--mm-color-focus-ring`, `--mm-color-text-default`.
3. **Komponent** (`src/styles/tokens/components.css`) — komponentspecifikt: `--mm-button-primary-bg`, `--mm-dialog-overlay-bg`.

**Regler:**

- Inga hårdkodade färger i komponenter — allt via CSS custom properties
- Inga komponentspecifika tokens utanför components.css
- Foundation: `~/Repon/marcus-system/design-system/DESIGN-FOUNDATION-v1.md` (4px spacing-bas, Inter, FK-inspirerat)
- Varje komponent ska klara prefers-contrast: more, prefers-reduced-motion, print

Fullständig spec: [`docs/specs/DESIGN-SYSTEM-SPEC.md`](docs/specs/DESIGN-SYSTEM-SPEC.md) (lokalt sedan ADR-021, ursprungligen i Vue-referensens `docs/react-migration/`).

---

## Arbetsflöde

**Verktyg:**

| Verktyg | Används för |
|---|---|
| Claude Chat (projekt) | Planering, arkitektur, prompts, FK-research |
| Claude Code (terminal) | Kodning, git, filhantering, verifiering |
| Vite dev-server | Lokal utveckling med hot reload |
| Playwright | Visuell QA, screenshots, accessibility-tester |
| Airtable MCP | Verifiera fält, records, relationer live |

**Metod:** Marcus och Claude planerar i Chat → Claude Code bygger fas för fas → Marcus verifierar i browsern → feedback → nästa steg.

**Fasordning och fas-status:** se `docs/byggplan.md` §4 (styrande).

---

## Kvalitetsribba

| Typ | Tillgänglighet | Teknik | Återanvändbarhet |
|---|---|---|---|
| **Bibliotek** (komponenter, hooks) | **11** | **11** | **11** |
| **Vyer** (produktspecifika) | **11** | **10** | **10** |

Tillgänglighet är alltid 11 — inga undantag. Bibliotekskod ska bära flera produkter.

Fullständiga checklistor: [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md) (lokalt sedan ADR-021; React-versionen ersätter Vue-eran per ADR-027 stack-skifte 2026-05-11).

---

## Vision: Dubbel output

1. **Miranon Media Admin** — produkten Lotta använder dagligen. Event, anmälningar, betalningar, personer, leads, närvaro, mail.
2. **Mm Component Library** — komponentbiblioteket som bär framtida produkter (Passionslyftet, Maxat Event, kommande SaaS). Hooks, primitiver och komponenter byggda för återanvändning utan ändringar.

Allt som byggs bedöms utifrån båda perspektiven:

- Löser det Lottas behov? (produkt)
- Kan det återanvändas i nästa produkt utan ändringar? (bibliotek)

---

## Operativ procedur

Operativa rutiner — sessionsstart, sessionsavslut, fas-avslut — bor i
`marcus-system`-pluginets disciplin-skills och triggas automatiskt via sin
`description`. Pluginet aktiveras via **user-scope install-record**
(`~/.claude/plugins/installed_plugins.json`) som kanonisk mekanism och laddas
därmed i varje Code-session oavsett repo — se
[ADR-035](docs/decisions/ADR-035-plugin-aktivering-user-scope.md). Spoke
`.claude/settings.json` (`extraKnownMarketplaces.marcus-hub` +
`enabledPlugins`) behålls som sekundär portabilitets-deklaration, inte primär
källa. Saknas pluginet (`claude plugin list` visar inte
`marcus-system@marcus-hub`, eller färre än 4 skills aktiva) — flagga det;
scope-migrering görs inte via plugin-CLI:t (#38271). Konstitutionen ovan slår
fast PROJEKT-SPECIFIKA regler; generella sessions-HUR-steg bor i pluginet.
