# Vue-projektanalys — Miranon Media Admin
*Komplett teknisk analys baserad på faktisk kod, inte dokumentation.*
*Genomförd: 2026-04-05 | 5 parallella research-agenter | Varje fil läst.*

---

## DEL 1: Filinventering

### Komplett fillista

| # | Sökväg | Rader | Typ | Kategori | Migration |
|---|--------|-------|-----|----------|-----------|
| 1 | src/domain/models/Attendance.ts | 10 | TS | Domain | 🟢 |
| 2 | src/domain/models/Engagement.ts | 10 | TS | Domain | 🟢 |
| 3 | src/domain/models/Event.ts | 20 | TS | Domain | 🟢 |
| 4 | src/domain/models/Lead.ts | 13 | TS | Domain | 🟢 |
| 5 | src/domain/models/MailPayload.ts | 31 | TS | Domain | 🟢 |
| 6 | src/domain/models/Person.ts | 24 | TS | Domain | 🟢 |
| 7 | src/domain/models/Registration.ts | 22 | TS | Domain | 🟢 |
| 8 | src/domain/models/WaitlistEntry.ts | 14 | TS | Domain | 🟢 |
| 9 | src/domain/types/Filters.ts | 34 | TS | Domain | 🟢 |
| 10 | src/domain/types/Status.ts | 49 | TS | Domain | 🟢 |
| 11 | src/data/adapters/DataSourceAdapter.ts | 71 | TS | Data | 🟢 |
| 12 | src/data/adapters/AirtableAdapter.ts | 198 | TS | Data | 🟢 |
| 13 | src/data/adapters/SupabaseAdapter.ts | 100 | TS | Data | 🟢 |
| 14 | src/data/config/supabase-client.ts | 86 | TS | Data | 🟡 |
| 15 | src/composables/alertScreenReader.ts | 172 | TS | Composable | 🟢 |
| 16 | src/composables/focusUtils.ts | 90 | TS | Composable | 🟢 |
| 17 | src/composables/useId.ts | 60 | TS | Composable | 🔴 |
| 18 | src/composables/useFocusStack.ts | 202 | TS | Composable | 🟡 |
| 19 | src/composables/useScrollLock.ts | 149 | TS | Composable | 🔴 |
| 20 | src/composables/useControllable.ts | 216 | TS | Composable | 🔴 |
| 21 | src/composables/usePresence.ts | 209 | TS | Composable | 🔴 |
| 22 | src/composables/useFocusScope.ts | 319 | TS | Composable | 🔴 |
| 23 | src/composables/useDismissable.ts | 228 | TS | Composable | 🔴 |
| 24 | src/composables/useCollection.ts | 185 | TS | Composable | 🔴 |
| 25 | src/composables/useRovingFocus.ts | 283 | TS | Composable | 🔴 |
| 26 | src/composables/useTypeAhead.ts | 271 | TS | Composable | 🔴 |
| 27 | src/composables/useResizable.ts | 161 | TS | Composable | 🟡 |
| 28 | src/composables/useAnimatedCounter.ts | 73 | TS | Composable | 🟡 |
| 29 | src/composables/useAsyncData.ts | 21 | TS | Composable | 🔴 |
| 30 | src/composables/useAuth.ts | 82 | TS | Composable | 🟡 |
| 31 | src/composables/useDashboardData.ts | 75 | TS | Composable | 🟡 |
| 32 | src/composables/useDataSource.ts | 19 | TS | Composable | 🟡 |
| 33 | src/composables/useUserDisplayName.ts | 28 | TS | Composable | 🟡 |
| 34 | src/composables/index.ts | 53 | TS | Composable | 🟡 |
| 35 | src/components/library/MmDialog/types.ts | 75 | TS | Library | 🟢 |
| 36 | src/components/library/MmDialog/context.ts | 45 | TS | Library | 🟡 |
| 37 | src/components/library/MmDialog/MmDialog.vue | 268 | Vue SFC | Library | 🟡 |
| 38 | src/components/library/MmDialog/MmDialogTitle.vue | 24 | Vue SFC | Library | 🟡 |
| 39 | src/components/library/MmDialog/MmDialogDescription.vue | 27 | Vue SFC | Library | 🟡 |
| 40 | src/components/library/MmDialog/MmDialogClose.vue | 41 | Vue SFC | Library | 🟡 |
| 41 | src/components/library/MmDialog/mm-dialog.css | 279 | CSS | Library | 🟢 |
| 42 | src/components/library/MmDialog/index.ts | 10 | TS | Library | 🟡 |
| 43 | src/components/library/MmDataTable/types.ts | 137 | TS | Library | 🟡 |
| 44 | src/components/library/MmDataTable/context.ts | 45 | TS | Library | 🟡 |
| 45 | src/components/library/MmDataTable/MmDataTable.vue | 296 | Vue SFC | Library | 🟡 |
| 46 | src/components/library/MmDataTable/MmTableColumn.vue | 109 | Vue SFC | Library | 🟡 |
| 47 | src/components/library/MmDataTable/useTableFeatures.ts | 337 | TS | Library | 🟡 |
| 48 | src/components/library/MmDataTable/mm-data-table.css | 343 | CSS | Library | 🟢 |
| 49 | src/components/library/MmDataTable/index.ts | 11 | TS | Library | 🟡 |
| 50 | src/components/core/AdminShell.vue | 750 | Vue SFC | Core | 🟡 |
| 51 | src/components/core/AppMenu.vue | 811 | Vue SFC | Core | 🟡 |
| 52 | src/components/core/AppMenu.css | 806 | CSS | Core | 🟢 |
| 53 | src/components/core/MmButton.vue | 60 | Vue SFC | Core | 🟡 |
| 54 | src/components/core/MmMessageBox.vue | 59 | Vue SFC | Core | 🟡 |
| 55 | src/components/core/StatusBadge.vue | 78 | Vue SFC | Core | 🟡 |
| 56 | src/components/core/AppMenuLegacy.vue | 698 | Vue SFC | Core (legacy) | ⚪ |
| 57 | src/components/core/AppMenuLegacy.css | 679 | CSS | Core (legacy) | ⚪ |
| 58 | src/components/features/dashboard/EventCard.vue | 268 | Vue SFC | Feature | 🟡 |
| 59 | src/components/features/dashboard/NewRegistrationsList.vue | 158 | Vue SFC | Feature | 🟡 |
| 60 | src/components/features/dashboard/UnpaidSummary.vue | 214 | Vue SFC | Feature | 🟡 |
| 61 | src/components/features/dashboard/StatCard.vue | 131 | Vue SFC | Feature | 🟡 |
| 62 | src/components/features/dashboard/DashboardSkeleton.vue | 105 | Vue SFC | Feature | 🟡 |
| 63 | src/components/features/dashboard/card-section.css | 55 | CSS | Feature | 🟢 |
| 64 | src/views/DashboardView.vue | 286 | Vue SFC | Vy | 🟡 |
| 65 | src/views/MinaSidorView.vue | 358 | Vue SFC | Vy | 🟡 |
| 66 | src/views/LoginView.vue | 129 | Vue SFC | Vy | 🟡 |
| 67 | src/views/PlaceholderView.vue | 33 | Vue SFC | Vy | 🟡 |
| 68 | src/views/EventsView.vue | 19 | Vue SFC | Vy | ⚪ |
| 69 | src/views/AttendanceView.vue | 19 | Vue SFC | Vy | ⚪ |
| 70 | src/views/LeadsView.vue | 19 | Vue SFC | Vy | ⚪ |
| 71 | src/views/MailView.vue | 19 | Vue SFC | Vy | ⚪ |
| 72 | src/views/PaymentsView.vue | 19 | Vue SFC | Vy | ⚪ |
| 73 | src/views/PersonsView.vue | 19 | Vue SFC | Vy | ⚪ |
| 74 | src/views/RegistrationsView.vue | 19 | Vue SFC | Vy | ⚪ |
| 75 | src/views/WaitlistView.vue | 19 | Vue SFC | Vy | ⚪ |
| 76 | src/styles/main.scss | 119 | SCSS | Style | 🟢 |
| 77 | src/presentation/tokens/design-tokens.ts | 127 | TS | Tokens | 🟢 |
| 78 | src/main.ts | 8 | TS | Config | 🔴 |
| 79 | src/router/index.ts | 122 | TS | Config | 🔴 |
| 80 | src/App.vue | 54 | Vue SFC | Config | 🟡 |
| 81 | src/assets/miranon-logo.svg | 16 | SVG | Asset | 🟢 |
| 82 | src/assets/.gitkeep | 0 | — | Asset | ⚪ |
| 83 | src/components/core/AdminShell.README.md | 323 | MD | Docs | ⚪ |
| 84 | src/components/core/AppMenu.README.md | 337 | MD | Docs | ⚪ |
| 85 | src/components/library/MmDialog/README.md | 249 | MD | Docs | ⚪ |
| 86 | src/components/library/MmDataTable/README.md | 278 | MD | Docs | ⚪ |
| — | src/components/features/.gitkeep | 0 | — | — | ⚪ |

### Totaler per kategori

| Kategori | Filer | Rader | 🟢 | 🟡 | 🔴 | ⚪ |
|----------|-------|-------|-----|-----|-----|-----|
| Domain | 10 | 227 | 10 | 0 | 0 | 0 |
| Data | 4 | 455 | 3 | 1 | 0 | 0 |
| Composable | 20 | 2 886 | 2 | 8 | 10 | 0 |
| Library (MmDialog) | 8 | 769 | 2 | 5 | 0 | 0 |
| Library (MmDataTable) | 7 | 1 278 | 1 | 6 | 0 | 0 |
| Core-komponent | 8 | 3 564 | 1 | 4 | 0 | 2 |
| Feature-komponent | 6 | 931 | 1 | 5 | 0 | 0 |
| Vy | 12 | 958 | 0 | 4 | 0 | 8 |
| Style/Tokens | 2 | 246 | 2 | 0 | 0 | 0 |
| Config | 3 | 184 | 0 | 1 | 2 | 0 |
| Asset/Docs/gitkeep | 7 | 1 203 | 1 | 0 | 0 | 6 |
| **TOTALT** | **87** | **12 701** | **23** | **34** | **12** | **16** |

### Totaler per migrationstyp

| Typ | Filer | Rader | Andel |
|-----|-------|-------|-------|
| 🟢 RAKT AV — kopieras utan ändring | 23 | 2 176 | 17% |
| 🟡 PORTAS — skrivs om Vue → React | 34 | 7 122 | 56% |
| 🔴 ERSÄTTS — React-ekosystem hanterar | 12 | 2 200 | 17% |
| ⚪ ELIMINERAS — behövs inte | 16 | 3 203 | 10% av filerna, inkl docs + legacy |

Exkluderar docs/README/legacy/gitkeep (1 203 + 1 377 rader), kvar: **~10 121 rader produktionskod**.

---

## DEL 2: Beroendegrafer

### 2a: Composable-användning

#### Tabell

| Composable | Rader | Importerar internt | Importeras av | Typ |
|------------|-------|--------------------|---------------|-----|
| alertScreenReader | 172 | — | MmDialog, AppMenu, AdminShell, useTableFeatures | Utility |
| focusUtils | 90 | — | useFocusScope | Utility |
| useId | 60 | — | MmDialog, MmDataTable | Utility |
| useFocusStack | 202 | — | useFocusScope | Beteendeprimitiv |
| useScrollLock | 149 | — | MmDialog | Beteendeprimitiv |
| useControllable | 216 | — | MmDialog, MmDataTable (×3), AppMenu (×2), AdminShell | Beteendeprimitiv |
| usePresence | 209 | — | MmDialog, AppMenu (×2) | Beteendeprimitiv |
| useFocusScope | 319 | focusUtils, useFocusStack | MmDialog, AppMenu | Beteendeprimitiv |
| useDismissable | 228 | — | MmDialog, AppMenu (×2), AdminShell | Beteendeprimitiv |
| useCollection | 185 | — | MmDataTable, useRovingFocus (typ), useTypeAhead (typ) | Beteendeprimitiv |
| useRovingFocus | 283 | useCollection (typ) | useTableFeatures | Beteendeprimitiv |
| useTypeAhead | 271 | useCollection (typ) | useTableFeatures, AppMenu | Beteendeprimitiv |
| useResizable | 161 | — | AppMenu | App-specifik |
| useAnimatedCounter | 73 | — | StatCard | App-specifik |
| useAsyncData | 21 | — | DashboardView, MinaSidorView | App-specifik |
| useAuth | 82 | — | App.vue, LoginView, router, useUserDisplayName | App-specifik |
| useDashboardData | 75 | — | DashboardView, MinaSidorView | App-specifik |
| useDataSource | 19 | — | App.vue, DashboardView, MinaSidorView | App-specifik |
| useUserDisplayName | 28 | useAuth | App.vue, DashboardView, MinaSidorView | App-specifik |
| index.ts | 53 | (barrel export) | — | Utility |

#### Beroendediagram

```
useFocusScope
├── använder: focusUtils.findTabbableElements, useFocusStack.pushFocus/popFocus
├── används av: MmDialog, AppMenu
└── typ: Beteendeprimitiv

useDismissable
├── använder: (inget internt — global layerStack)
├── används av: MmDialog, AppMenu (×2), AdminShell
└── typ: Beteendeprimitiv

useControllable
├── använder: (inget internt — getCurrentInstance)
├── används av: MmDialog, MmDataTable (×3 via useTableFeatures), AppMenu (×2), AdminShell
└── typ: Beteendeprimitiv — MEST ANVÄNDA COMPOSABLE (8 instanser)

usePresence
├── använder: (inget internt — getComputedStyle)
├── används av: MmDialog, AppMenu (×2)
└── typ: Beteendeprimitiv

useCollection
├── använder: (inget internt — provide/inject + compareDocumentPosition)
├── används av: MmDataTable, useRovingFocus (typ), useTypeAhead (typ)
└── typ: Beteendeprimitiv

useRovingFocus
├── använder: useCollection (CollectionItem typ)
├── används av: useTableFeatures
└── typ: Beteendeprimitiv

useTypeAhead
├── använder: useCollection (CollectionItem typ)
├── används av: useTableFeatures, AppMenu
└── typ: Beteendeprimitiv

useAuth (singleton)
├── använder: supabase-client.ts
├── används av: App.vue, LoginView, router/index.ts, useUserDisplayName
└── typ: App-specifik — MODULE-LEVEL STATE (refs utanför funktionen)
```

### 2b: Komponentberoenden

| Komponent | Rader | Composables | Importerar komponenter | Props | Emits | Slots |
|-----------|-------|-------------|------------------------|-------|-------|-------|
| **MmDialog** | 268 | useId ×3, useControllable, usePresence, useScrollLock, useFocusScope, useDismissable, alertScreenReader | MmDialogTitle, MmDialogDescription, MmDialogClose (via provide/inject) | 9 | 3 | 1 (default, scoped: `{open}`) |
| **MmDataTable** | 296 | useId, useCollection, useTableFeatures (intern: useControllable ×3, useRovingFocus, useTypeAhead, alertScreenReader) | MmTableColumn (via Collection) | 20 | 10 | 3 (default, expand, empty) |
| **AdminShell** | 750 | useControllable, useDismissable, alertScreenReader | AppMenu, Lucide-ikoner ×5 | 19 | 4 | 2 (default, footer) |
| **AppMenu** | 811 | useControllable ×2, usePresence ×2, useTypeAhead, useFocusScope, useDismissable ×2, useResizable, alertScreenReader | Lucide-ikoner ×5 | 24+ | 4 | 1 (footer) |
| **DashboardView** | 286 | useDataSource, useAsyncData ×2, useDashboardData, useUserDisplayName | StatCard, EventCard, NewRegistrationsList, UnpaidSummary, DashboardSkeleton, MmMessageBox, MmButton, Lucide ×4 | 0 | 0 | 0 |
| **MinaSidorView** | 358 | useDataSource, useAsyncData ×2, useDashboardData, useUserDisplayName | MmMessageBox, MmButton, Lucide ×3 | 0 | 0 | 0 |
| **LoginView** | 129 | useAuth | MmMessageBox, MmButton | 0 | 0 | 0 |
| **EventCard** | 268 | — | (router-link) | 1 | 0 | 0 |
| **StatCard** | 131 | useAnimatedCounter | (router-link) | 4 | 1 | 0 |
| **NewRegistrationsList** | 158 | — | StatusBadge, MmMessageBox | 3 | 0 | 0 |
| **UnpaidSummary** | 214 | — | MmMessageBox | 2 | 0 | 0 |
| **DashboardSkeleton** | 105 | — | — | 2 | 0 | 0 |
| **MmButton** | 60 | — | — | 3 | 0 | 1 |
| **MmMessageBox** | 59 | — | — | 1 | 0 | 1 |
| **StatusBadge** | 78 | — | — | 2 | 0 | 0 |
| **PlaceholderView** | 33 | — | — | 0 | 0 | 0 |

### 2c: Token-flöde

#### Token-systemets tre lager

```
Lager 1: Foundation tokens (main.scss rad 71–89)
  --miranon-primary: #D4960A
  --miranon-copper: #A3491C
  --miranon-ink: #242424
  ... (19 st)
         │
         ▼
Lager 2: Semantiska tokens (main.scss rad 26–62)
  --fkds-color-text-primary: var(--miranon-ink)
  --fkds-color-action-text-primary-default: var(--miranon-primary)
  --focus-ring-color: var(--miranon-focus-ring)
  ... (21 st --fkds-*, 4 st alias)
         │
         ▼
Lager 3: Komponent-tokens (i respektive CSS-fil)
  --mm-dialog-content-bg: #ffffff         (mm-dialog.css)
  --mm-table-row-hover-bg: #f3f6ef       (mm-data-table.css)
  --section-border: #D4960A               (AppMenu.css, per kategori)
         │
         ▼
Konsumenter: var(--token) i template/style
```

**Tre prefix-namespaces (inkonsekvens):**
- `--f-*` (9 st) — font-tokens, arv från FK
- `--fkds-*` (21 st) — semantiska tokens, arv från FK
- `--miranon-*` (19 st) — egna brand-tokens

**Totalt 48 custom properties i :root** + komponent-scopade tokens i MmDialog (17 st), MmDataTable (16 st), AppMenu (~12 st), AdminShell (~10 st).

#### design-tokens.ts (TS-representationen)

Exporterar 3 `as const` objekt: `colors` (30 värden), `typography` (3), `spacing` (4). **Bara importerad av AppMenu.vue och AppMenuLegacy.vue** (för JS-beräkningar av menuMinWidth/menuMaxWidth/menuDefaultWidth). Resten av projektet använder CSS custom properties direkt.

**Klassificering:** 🟢 RAKT AV — ren TypeScript, noll Vue-beroenden.

#### Hårdkodade färger utanför tokens

| Fil | Värde | Kontext | Bör vara token? |
|-----|-------|---------|-----------------|
| AppMenu.css | `#606B57` (×3) | Sage/user-sektion | Ja — `--miranon-category-user-sage` |
| AppMenu.css | `#898989` (×2) | Tagline-färg | Ja — `--miranon-text-muted` |
| AppMenu.css | `#4a52b6` | Plus-ikon (bluebell) | Ja — `--miranon-action-icon` |
| AppMenu.css | `#6B6B6B` | User-name text | Ja — `--miranon-text-muted-dark` |
| MmMessageBox.vue | `#ffbe10` | Warning border | Ja — avviker från `--miranon-primary` |
| MmButton.vue | `#ffffff` | Primary-knapptext | Ja |
| AdminShell.vue | `#FAFAF8`, `#ffffff` | Content-area bakgrund | Delvis — `#FAFAF8` = `bgSubtle` i tokens.ts men ej CSS var |

#### Hårdkodade font-sizes (massivt problem)

16+ hårdkodade font-size-värden spridda i komponenterna. Alla har TODO-kommentarer `/* TODO: ingen FK-token under standard (1rem) */`:

| Storlek | Förekommer i |
|---------|-------------|
| `0.875rem` (14px) | EventCard ×5, MinaSidorView ×3, card-section, UnpaidSummary ×2 |
| `0.8125rem` (13px) | EventCard, NewRegistrationsList, UnpaidSummary ×2 |
| `0.9375rem` (15px) | NewRegistrationsList, UnpaidSummary |
| `0.75rem` (12px) | EventCard, StatusBadge, UnpaidSummary |
| 12–20px (px-värden) | AppMenu.css, AdminShell |

**Saknade tokens:** `--f-font-size-small`, `--f-font-size-xs`, `--f-font-size-h3`.

`font-weight: 500` används 13 gånger med TODO — token-systemet definierar bara 400/600/700.

---

## DEL 3: Djupanalys per lager

### 3a: Domain-lagret

**10 filer, 227 rader. 100% framework-agnostiskt.**

| Fil | Exporterat | Members | Vue-import | Logik | 🟢? |
|-----|-----------|---------|------------|-------|-----|
| Attendance.ts | `interface Attendance` | 9 | Nej | Nej | 🟢 |
| Engagement.ts | `interface Engagement` | 9 | Nej | Nej | 🟢 |
| Event.ts | `interface Event` | 19 | Nej | Nej | 🟢 ¹ |
| Lead.ts | `interface Lead` | 12 | Nej | Nej | 🟢 |
| MailPayload.ts | `MailPayload` (4), `MailLogEntry` (6), `BulkMail` (10) | 20 | Nej | Nej | 🟢 |
| Person.ts | `interface Person` | 23 | Nej | Nej | 🟢 |
| Registration.ts | `interface Registration` | 21 | Nej | Nej | 🟢 |
| WaitlistEntry.ts | `interface WaitlistEntry` | 13 | Nej | Nej | 🟢 |
| Filters.ts | 6 filter-interfaces | ~13 | Nej | Nej | 🟢 |
| Status.ts | 5 `as const` + 5 typer | ~25 | Nej | Nej | 🟢 |

¹ `Event` krockar med DOM:ens globala `Event`. I React/TSX kan explicit import eller alias (`MiranonEvent`) behövas.

**Ingen fil importerar Vue, Supabase eller Airtable. Noll logik — bara typer. Hela lagret kopieras rakt av.**

### 3b: Data-lagret

**4 filer, 455 rader.**

#### DataSourceAdapter.ts — 15 metoder

```typescript
interface DataSourceAdapter {
  fetchEvents(): Promise<Event[]>
  fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]>
  fetchPersons(filters?: PersonFilters): Promise<Person[]>
  updateRecord(tableId: string, recordId: string, fields: Record<string, unknown>): Promise<void>
  fetchEvent(id: string): Promise<Event>
  fetchPerson(id: string): Promise<Person>
  updateRegistration(id: string, fields: Partial<Registration>): Promise<void>
  createRegistration(data: Omit<Registration, "id">): Promise<Registration>
  fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]>
  updateAttendance(id: string, status: string): Promise<void>
  fetchWaitlist(filters?: WaitlistFilters): Promise<WaitlistEntry[]>
  fetchLeads(filters?: LeadFilters): Promise<Lead[]>
  fetchEngagements(personId?: string): Promise<Engagement[]>
  sendEmail(payload: MailPayload): Promise<void>
  fetchMailLog(filters?: MailLogFilters): Promise<MailLogEntry[]>
}
```

🟢 RAKT AV — ren TypeScript-interface, noll framework-beroenden.

#### AirtableAdapter.ts — Edge Function-anrop

| Metod | Edge Function | HTTP | Status |
|-------|---------------|------|--------|
| fetchEvents | `get-events` | GET | ✅ Fungerar |
| fetchRegistrations | `get-registrations` | GET | ✅ Fungerar |
| fetchPersons | `get-persons` | GET | ✅ Fungerar |
| updateRecord | `update-record` | POST | ✅ Fungerar |
| updateRegistration | via `update-record` | POST | ✅ Wrapper |
| updateAttendance | via `update-record` | POST | ✅ Wrapper |
| fetchEvent | `get-event` | GET | ❌ TODO |
| fetchPerson | `get-person` | GET | ❌ TODO |
| createRegistration | `create-registration` | POST | ❌ TODO |
| fetchAttendance | `get-attendance` | GET | ❌ TODO |
| fetchWaitlist | `get-waitlist` | GET | ❌ TODO |
| fetchLeads | `get-leads` | GET | ❌ TODO |
| fetchEngagements | `get-engagements` | GET | ❌ TODO |
| sendEmail | `send-email` | POST | ❌ TODO |
| fetchMailLog | `get-mail-log` | GET | ❌ TODO |

**6 av 15 metoder fungerar. 9 har TODO — Edge Functions ej deployade.**

URL-mönster: `${supabaseUrl}/functions/v1/${functionName}?${queryParams}`
Auth: Session-token via `supabase.auth.getSession()`, fallback till anon key.

🟢 RAKT AV — noll Vue-importer. Använder bara `fetch` och domain-typer.

#### SupabaseAdapter.ts — Alla stubs

Alla 15 metoder kastar: `throw new Error("SupabaseAdapter: Not implemented")`.

🟢 RAKT AV — ren TypeScript.

#### supabase-client.ts — Vite-specifik

Använder `import.meta.env.VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`. Exporterar `supabase` (klient), `callEdgeFunction<T>()` (GET), `postEdgeFunction<T>()` (POST).

🟡 PORTAS — Om React-projektet använder Vite: noll ändringar. Om Next.js: byt `VITE_*` till `NEXT_PUBLIC_*`.

#### Saknad fil

CLAUDE.md refererar till `src/data/config/airtable-config.ts` (fältmappning). **Filen existerar inte.** Fältmappningen är implicit — tabell-ID:n hårdkodas i AirtableAdapter.ts, fältmappning sker i Edge Functions serverside.

### 3c: Composable-djupanalys (7 nyckel-composables)

#### useFocusScope (319 rader)

**Fokus-fällan:** Tab-cycling via global `keydown`-handler på `document`. Vid Tab: hämtar tabbable elements dynamiskt (ny sökning varje gång — hanterar dynamiskt innehåll), wrappas: sista → första (Tab), första → sista (Shift+Tab) via `e.preventDefault()` + `focus()`.

**Inert-hantering:** `applyInert()` itererar containerns förälders barn (siblings). Feature detection: `'inert' in HTMLElement.prototype` — om stöds: `sibling.inert = true`, annars fallback: `aria-hidden="true"`. Sparar originalvärden, `restoreInert()` återställer exakt.

**Aktiveringsordning:** (1) pushFocus (sparar trigger), (2) applyInert, (3) focusInitialElement (initialFocusRef > [data-autofocus] > första tabbable > container med tabindex=-1), (4) bind Tab-trap.

**Vue-specifikt:** `watch` på `active` och `containerRef`, `onUnmounted` cleanup.

**React-motsvarighet:** 🔴 React Aria `FocusScope` + `@react-aria/focus`. Alternativt `focus-trap-react`.

#### useDismissable (228 rader)

**Lager-stack:** Global LIFO `layerStack: DismissLayer[]` (modul-level). Unikt `id` via counter. Bara översta lagrets `onDismiss` anropas vid Escape. Click-outside: `pointerdown` (inte click) — snabbare, fångar touch. `container.contains(target)` = innanför = ignorera. `[data-mm-dismiss-ignore]` stöds.

**Nestlade element:** Om popover inuti dialog: dialog = lager 1, popover = lager 2. Escape stänger bara popovern. Click utanför popovern men innanför dialogen: popoverns container.contains = false → popovern stängs, dialogen reagerar inte (inte toppen).

**Timing-fix:** Watch på `[active, containerRef.value]` — registrerar först när BÅDA är truthy. Löser Teleport/v-if-timing.

**Vue-specifikt:** `watch`, `onScopeDispose`.

**React-motsvarighet:** 🔴 `@radix-ui/react-dismissable-layer` eller `@floating-ui/react` `useDismiss`.

#### useControllable (216 rader)

**Vue 3 boolean-casting-buggen:** Vue 3:s kompilator castar frånvarande boolean-props till `false` istället för `undefined`. `isExplicitProp(key)` löser detta via `getCurrentInstance().vnode.props` — ett internt Vue-objekt som BARA innehåller props föräldern explicit skickade. Kollar både camelCase och kebab-case.

**Controlled vs uncontrolled:** `isControlled` sätts vid mount via `isExplicitProp`. I controlled mode: `setValue` anropar bara `onChange`, ändrar aldrig internt. I uncontrolled mode: `setValue` uppdaterar intern ref OCH anropar `onChange`. DEV-watcher detekterar mode-byte (alltid en bugg).

**Vue-specifikt:** `ref`, `toRef`, `computed`, `readonly`, `watch`, `getCurrentInstance`.

**React-motsvarighet:** 🔴 ERSÄTTS helt. Problemet existerar inte i React — React har inte boolean casting. `undefined`-check räcker: `const isControlled = prop !== undefined`. Se `@radix-ui/react-use-controllable-state`.

#### usePresence (209 rader)

**Animation-end-detektering:** `getComputedStyle` parsning av `animationDuration` + `transitionDuration`, splittar kommaseparerade värden, kollar om någon > 0. Binder `animationend` + `transitionend` listeners. Fallback-timeout (5000ms).

**Snabb toggle:** Om `present` går `true` igen under pågående exit-animation: `cleanup()` tar bort alla listeners och timers, `isPresent = true` direkt.

**Reduced motion:** `matchMedia('prefers-reduced-motion')` listener — vid reduced motion skippas all animation-väntan.

**Vue-specifikt:** `ref`, `readonly`, `watch`, `onUnmounted`.

**React-motsvarighet:** 🔴 `@radix-ui/react-presence` (identisk logik) eller Framer Motion `AnimatePresence`.

#### useCollection (185 rader)

**DOM-ordning:** `sortByDomOrder()` via `compareDocumentPosition()` — nativ DOM-API. Sortering körs lat (vid `items.value`-läsning). Ingen MutationObserver. Barn anropar `register(item)` i onMounted, `unregister(item)` i onUnmounted. Items måste ha `ref: HTMLElement`.

**Provide/inject:** `createCollectionKey<T>()` skapar typad `InjectionKey<CollectionContext<T>>` (Symbol). Förälder: `provideCollection(key, { register, unregister })`. Barn: `injectCollection(key, 'ComponentName')` — kastar om context saknas.

**Vue-specifikt:** `ref`, `readonly`, `computed`, `provide`, `inject`, `InjectionKey`.

**React-motsvarighet:** 🔴 `@radix-ui/react-collection` med `React.createContext`.

#### useRovingFocus (283 rader)

**Tangenter:** ArrowDown/Up (vertical/both), ArrowRight/Left (horizontal/both), Home (första enabled), End (sista enabled).

**Wrapping:** `findNextEnabled(fromIndex, direction)` loopar max `len` gånger. `wrap: true`: modulo-aritmetik. `wrap: false`: returnerar nuvarande index.

**Disabled-items:** Kollar `disabled`-attribut, `data-disabled`, `aria-disabled="true"`. Hoppas över.

**Tabindex-hantering:** Aktiv = `tabindex="0"`, övriga = `tabindex="-1"`. Uppdateras vid navigering och när items-längd ändras.

**Vue-specifikt:** `ref`, `watch`, `onUnmounted`.

**React-motsvarighet:** 🔴 `@radix-ui/react-roving-focus` eller React Aria `useFocusManager`.

#### useTypeAhead (271 rader)

**Buffert:** Varje tangenttryckning appendar till sträng + återställer 500ms timer. Vid timeout: rensas.

**Cykling:** `isSingleCharRepeated(buffer)` detekterar "aaa" → söker från `currentIndex + 1` med bara första tecknet (hoppar till nästa match).

**Unicode:** `toLocaleLowerCase('sv-SE')` för key + textinnehåll. `event.key.length === 1` accepterar alla unicode-tecken. IGNORE_KEYS set (Enter, Escape, Tab, pilar, F-tangenter). Modifier-kombinationer ignoreras.

**Text-extraktion:** Default: `aria-label` > `textContent` > `''`. Konfigurerbar via `textExtractor`.

**Vue-specifikt:** `ref`, `readonly`, `onUnmounted`.

**React-motsvarighet:** 🔴 Inbyggd i Radix-komponenter. React Aria `useTypeSelect`.

### 3d: Bibliotekskomponenter

#### MmDialog — Composable-komposition

Initialiseringsordning:
1. `useId` ×3 → dialogId, titleId, descriptionId
2. `useControllable` → isOpen (controlled/uncontrolled dual-mode)
3. `usePresence` → isPresent + presenceRef (animerad mount/unmount)
4. `useScrollLock` → lock/unlock body scroll
5. `useFocusScope` → fokus-fälla + inert + auto-fokus
6. `useDismissable` → Escape + click-outside + lager-stack
7. `alertScreenReader` → annonserar title-text vid öppning (via watch)
8. `useFocusStack` → (indirekt via useFocusScope)

**presenceRef-synk:** `watch(containerRef, (el) => { presenceRef.value = el })` — synkar presence-elementet med det faktiska DOM-elementet för att detektera exit-animation.

**afterOpen/afterClose:** Watch på `isPresent` — emittar `afterOpen` när `isPresent && isOpen`, `afterClose` när `!isPresent && !isOpen`. Dubbelvillkor hanterar snabb toggle.

**Provide/inject:** Providear `{ dialogId, titleId, descriptionId, close }`. Konsumeras av MmDialogTitle (h2 id), MmDialogDescription (p id), MmDialogClose (close callback).

**Teleport:** `<Teleport to="body">` — hela dialog-trädet (backdrop + positioner + content) till body. Vue Teleport bevarar provide/inject-kedjan.

**Bottom-sheet:** Ren CSS — `@media (max-width: 639px)`: positioner `align-items: flex-end`, content `max-width: 100%`, rundning bara topp, max-height 85vh.

**Props (9 st):**

| Prop | Typ | Default |
|------|-----|---------|
| modelValue | `boolean \| undefined` | undefined |
| defaultOpen | boolean | false |
| closeOnEscape | boolean | true |
| closeOnBackdrop | boolean | true |
| trapFocus | boolean | true |
| restoreFocus | boolean | true |
| autoFocus | boolean | true |
| modal | boolean | true |
| onOpenChange | `(payload) => boolean` | undefined |

**CSS custom properties (17 st):** `--mm-dialog-backdrop-bg`, `--mm-dialog-content-bg`, `--mm-dialog-content-radius`, `--mm-dialog-content-shadow`, `--mm-dialog-content-padding`, `--mm-dialog-content-max-width`, `--mm-dialog-z-index`, `--mm-dialog-enter-duration`, `--mm-dialog-exit-duration`, `--mm-dialog-title-font-size`, `--mm-dialog-title-font-weight`, `--mm-dialog-title-margin`, `--mm-dialog-description-color`, `--mm-dialog-description-margin`, `--mm-dialog-close-size`, `--mm-dialog-close-hover-bg`, `--mm-dialog-positioner-padding`.

#### MmDataTable — Kolumnregistrering och features

**Kolumnregistrering:** MmTableColumn renderar dold `<span ref="colRef" hidden>` i DOM. I onMounted: skapar `MmTableColumnDef` från props + slots, anropar `register(columnDef)`. useCollection sorterar via `compareDocumentPosition()` — DOM-ordning = kolumnordning.

**3× useControllable (i useTableFeatures.ts):**
- Sort: `sortState` / `defaultSortState` → dual-mode
- Selection: `modelValue` → dual-mode (single/multi)
- Expand: `expanded` / `defaultExpanded` → dual-mode

**Roving focus:** `useRovingFocus` på `<tbody>` med `rowItems` (CollectionItem[] från `rowRefs`). Vertical orientation, wrap: true. Aktiv rad: `tabindex="0"`, övriga `tabindex="-1"`.

**Sorterings-annonsering:** `alertScreenReader("Sorterat efter ${col.title}, ${SORT_LABELS[nextDir]}")` med svenska labels (stigande/fallande/osorterat).

**useTableFeatures.ts exporterar:** `hasSortableColumns`, `sortState`, `getSortDirection`, `toggleSort`, `selectedRows`, `isSelected`, `toggleSelect`, `toggleSelectAll`, `allSelected`, `someSelected`, `isExpanded`, `toggleExpand`, `tbodyRef`, `activeIndex`, `handleTbodyKeydown`, `setRowRef`, `totalColumns`.

**Props (MmDataTable: 20, MmTableColumn: 9), Emits (10):** Se DEL 2b.

**CSS custom properties (16 st):** `--mm-table-border-color`, `--mm-table-header-bg`, `--mm-table-header-font-weight`, `--mm-table-row-hover-bg`, `--mm-table-row-stripe-bg`, `--mm-table-row-active-bg`, `--mm-table-row-selected-bg`, `--mm-table-cell-padding`, `--mm-table-font-size`, `--mm-table-empty-color`, `--mm-table-focus-outline`, `--mm-table-sort-icon-size`, `--mm-table-sort-icon-color`, `--mm-table-sort-button-hover-bg`, `--mm-table-expand-icon-size`, `--mm-table-expanded-bg`.

### 3e: App-shell

#### AdminShell (750 rader)

**Skip-to-content:** `<a href="#main-content">` absolut-positionerad utanför viewport (`top: -100%`), glider ner vid `:focus` (`top: 0`, transition 0.2s). Reducerad motion: `transition: none`.

**Route announcer:** Watch på `props.pageTitle` → `alertScreenReader(announceTemplate.replace('{title}', newTitle))`. Template-sträng konfigurerbar via prop (default: `"Navigerade till {title}"`).

**Inert vid meny öppen:** `setAttribute("inert", "")` / `removeAttribute("inert")` på breadcrumbBarRef + mainRef. Vid stängning: `nextTick(() => menuBtnRef.value?.focus())`.

**Named slots:** `default` (sidans huvudinnehåll), `#footer` (vidarebefordras till AppMenu#footer — logga ut-knapp).

**Responsivt:** `@media (max-width: 768px)`: padding minskas, sökfält döljs, menyknapptext döljs. Sticky header. Content centreras med `max-width: var(--content-max-width)` (1200px).

**19 props, 4 emits.** Se DEL 2b.

#### AppMenu (811 + 806 rader CSS)

**Slide-in:** `role="dialog"` + `aria-modal="true"` + `<Teleport to="body">`. Fixed-positionerad med `transform: translateX(100%)` → translateX(0). `void el.offsetHeight` tvingar reflow.

**Sektionsfärger:** CSS custom property `--section-border` sätts per kategori-klass (`.fk-menu__section--daily`, etc.): daily (#D4960A), event (#8E5F07), people (#A3491C), comm (#4A6B8A), stats (#8E5F07), system (#5E5D59). Hover/aktiv: `color-mix(in srgb, var(--section-border) 6-8%, transparent)`.

**3 sektionslägen:** A: label + items (expand/collapse), B: label utan items (direkt-navigation), C: ingen label (items alltid synliga).

**Typewriter-effekt:** JS — skriver ut `"Lottas superpower portal"` med 40-80ms delay + jitter. 3 cursor-blinks (400ms interval), fade-out via CSS-klass. `prefers-reduced-motion`: text visas direkt.

**Scroll-track:** `::after` (track, 3px, 10% section-border), `::before` (thumb, 35%, 44px höjd, `--thumb-index` CSS var). Döljs vid enstaka sub-item.

**Collapse-animation:** Klassbaserad med `max-height: 500px` → `max-height: 0` transition (0.2s).

**User-sektion:** Eget element utanför sections-loopen. Sage-färg (#606B57), initialer-cirkel. Egna props: `userRoute`, `userLabel`.

**7+ composables, 24+ props, 8 i18n-props, 4 emits.** Se DEL 2b.

### 3f: Vyer

| Vy | Data | Composables | States | Computed | Side effects | Migration |
|----|------|-------------|--------|----------|-------------|-----------|
| **DashboardView** | events + registrations via useAsyncData ×2 | useDataSource, useAsyncData ×2, useDashboardData, useUserDisplayName | loading, error, data | isLoading, hasError, datumText | onMounted (execute ×2) | 🟡 |
| **MinaSidorView** | events + registrations via useAsyncData ×2 | useDataSource, useAsyncData ×2, useDashboardData, useUserDisplayName | loading, error, data | isLoading, hasError, nästaEvent, datumText | onMounted (execute ×2) | 🟡 |
| **LoginView** | — | useAuth (login + error), useRouter | default, loading, error | — | watch(authError) → fokus till felmeddelande | 🟡 |
| **PlaceholderView** | — | useRoute (meta.title) | — | — | — | 🟡 |
| **8 placeholder-vyer** | — | — | — | — | — | ⚪ Identiska, ersätts av PlaceholderView |

---

## DEL 4: Stilanalys

### main.scss — rad-för-rad-analys

**Import:** Google Fonts Inter (variabel font, opsz 14–32, wght 300–700).

**48 custom properties i :root:**
- 9 font-tokens (`--f-*`)
- 1 border-token (`--f-border-radius-medium: 4px`)
- 2 text (`--fkds-color-text-primary: var(--miranon-ink)`, `--fkds-color-text-secondary: #636363`)
- 3 bakgrund (`--fkds-color-background-primary/secondary/tertiary`)
- 4 border (`--fkds-color-border-primary/strong/weak/default`)
- 4 action (`--fkds-color-action-*: var(--miranon-primary/primary-dark/primary-tint)`)
- 2 header (`--fkds-color-header-*: var(--miranon-copper)`)
- 6 feedback (`--fkds-color-feedback-*`)
- 1 interactive (`--fkds-color-interactive-surface-*`)
- 1 fokus (`--focus-ring-color: var(--miranon-focus-ring)`)
- 4 alias (`--miranon-info/info-tint/feedback-text-warning/text-warm`)
- 19 foundation (`--miranon-primary/copper/ink/...`)

**FK-rester:** Noll `@fkui`-importer. Prefixet `--fkds-*` är kvar men definieras helt av projektet.

**Global fokusregel:**
```css
*:focus:not(:focus-visible) { outline: none; }
*:focus-visible { outline: 2px solid var(--focus-ring-color, #1B4965); outline-offset: 0; }
```
Framework-agnostisk — kopieras rakt av.

### CSS per komponent

| Komponent | Scoped? | BEM? | Media queries |
|-----------|---------|------|---------------|
| AdminShell | Scoped | Delvis (admin-shell__*) | reduced-motion, contrast:more, print, 768px |
| AppMenu | **Global** | Ja (fk-menu__*) | reduced-motion, contrast:more, print, 768px |
| MmDialog | **Global** | Ja (mm-dialog__*) | reduced-motion, contrast:more, print, 639px |
| MmDataTable | **Global** | Ja (mm-data-table__*) | reduced-motion, contrast:more, print |
| EventCard | Scoped | Nej | reduced-motion, contrast:more, print |
| DashboardSkeleton | Scoped | Nej | reduced-motion, contrast:more, print |
| DashboardView | Scoped | Nej | contrast:more, print |
| MinaSidorView | Scoped | Nej | reduced-motion, contrast:more, print |
| LoginView | Scoped | Nej | — |
| StatCard | Scoped | Nej | contrast:more, print |
| MmButton | Scoped | Nej | — |
| MmMessageBox | Scoped | Nej | — |
| StatusBadge | Scoped | Nej | — |

**4 globala CSS-filer** (AppMenu, MmDialog, MmDataTable + card-section) använder BEM som namespacing — fungerar utan Vue scoped.

**Lucka:** DashboardView, LoginView, MmButton, MmMessageBox, StatusBadge saknar `prefers-reduced-motion`. Inte kritiskt — de har minimala animationer.

### Typografi-inventering

Token-systemet definierar: h1 (2.5rem), h2 (1.75rem), h4 (1.25rem), large (1.125rem), standard (1rem), xxx-large (1.5rem).

**Saknas:** h3, small (0.875rem), xs (0.75rem), font-weight 500.

**Anomali:** `--f-font-size-xxx-large` (1.5rem) är *mindre* än `--f-font-size-h2` (1.75rem).

---

## DEL 5: Edge cases och buggfixar

### void el.offsetHeight — Tvingad reflow

**Fil:** `AppMenu.vue:450`, `AppMenuLegacy.vue:355`
```javascript
void el.offsetHeight; // tvinga reflow → transition från closed → open
```
Framtvingar layout-beräkning för att starta CSS-transition. Samma trick behövs i React.

### getCurrentInstance — Vue-intern API

**Fil:** `useControllable.ts:37, 116`
```typescript
const instance = getCurrentInstance();
// Läser instance.vnode.props för att detektera explicit satta props
```
**KRITISK.** Hela controlled/uncontrolled-detekteringen bygger på denna Vue-interna API. I React ersätts med enkel `undefined`-check. Se DEL 3c.

### nextTick — 12 förekomster

| Fil | Syfte |
|-----|-------|
| LoginView.vue:19 | Fokusera felruta efter inloggningsfel |
| AppMenu.vue:266, 336 | Fokusera brand-knapp/sektion efter stängning/navigation |
| AdminShell.vue:190, 197, 233 | Fokusera actions-knapp, dropdown, menyknapp |
| MmDialog.vue:121, 192 | Fokusera dialog-content, annonsera title |

**React-migrering:** `useEffect` med refs, alternativt `queueMicrotask` eller `requestAnimationFrame`.

### console.warn — 17 defensiva gränser

Alla bakom `import.meta.env.DEV` guards. Composables: useControllable (2), useFocusScope (2), useCollection (1), useScrollLock (2), useFocusStack (1), useDismissable (1), alertScreenReader (1), useId (1). Komponenter: AppMenu (2), AdminShell (2).

**React-migrering:** Byt till `process.env.NODE_ENV !== 'production'`.

### setTimeout — 13 förekomster

| Fil | Syfte | Risk |
|-----|-------|------|
| alertScreenReader.ts | append (0ms) + remove (1000ms) | Låg |
| useTypeAhead.ts | Debounce-timer (500ms) | Låg |
| usePresence.ts | Fallback-timeout (5000ms) | Medel |
| AppMenu.vue ×4 | Typewriter + blink | Låg |

Alla timers måste rensas i `useEffect` cleanup.

### Browser-specifik kod

**Ingen.** Noll vendor-prefix. Noll UA-sniffning. `color-mix()` (8 förekomster i AppMenu.css) kräver moderna browsers (alla sedan 2023).

### TODOs i koden

- **9 Edge Functions ej deployade** (AirtableAdapter)
- **15+ font-size-tokens saknas** (EventCard, NewRegistrationsList, UnpaidSummary)
- **`useUserDisplayName.ts:9`** — "TODO: Ersätt med Supabase user_metadata.display_name"

---

## DEL 6: Konfiguration och infrastruktur

### package.json — Dependencies

| Paket | Version | React-migration |
|-------|---------|-----------------|
| `vue` | ^3.5.30 | 🔴 Ersätts av `react` + `react-dom` |
| `vue-router` | ^4.6.4 | 🔴 Ersätts av TanStack Router |
| `@supabase/supabase-js` | ^2.100.1 | 🟢 Framework-agnostisk |
| `lucide-vue-next` | ^1.0.0 | 🔴 Ersätts av `lucide-react` |
| `sass` | ^1.98.0 | 🟡 Kan behållas eller bytas till PostCSS |
| `@fkui/*` | ^6.40.0 (6 paket) | ⚪ Elimineras — referensbibliotek, ej importerat |

| DevDependency | Version | React-migration |
|---------------|---------|-----------------|
| `@vitejs/plugin-vue` | ^6.0.5 | 🔴 Ersätts av `@vitejs/plugin-react` |
| `@vue/tsconfig` | ^0.9.0 | 🔴 Ersätts |
| `vue-tsc` | ^3.2.5 | ⚪ Elimineras |
| `typescript` | ~5.9.3 | 🟢 Behålls |
| `vite` | ^8.0.1 | 🟢 Behålls |
| `@types/node` | ^24.12.0 | 🟢 Behålls |

### vite.config.ts

Minimal:
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()] })
```
Inga path aliases. Ingen proxy. I React: byt `@vitejs/plugin-vue` mot `@vitejs/plugin-react`.

### tsconfig

Strikta flaggor redan på: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`. `.tsx` i include. Inga path aliases.

### Miljövariabler

```
VITE_SUPABASE_URL=https://lvjsfnphlauldxqlncpl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Supabase Edge Functions (5 st + shared)

| Funktion | Rader | Vad |
|----------|-------|-----|
| `_shared/airtable-client.ts` | 121 | Airtable REST-klient med pagination + rate-limit-retry |
| `_shared/cors.ts` | 13 | CORS-headers + OPTIONS |
| `get-events/index.ts` | 61 | Hämtar events, mappar fält |
| `get-registrations/index.ts` | 86 | Hämtar anmälningar med filter |
| `get-persons/index.ts` | 83 | Hämtar personer med sökning |
| `create-admin-user/index.ts` | 47 | Skapar admin via service_role |
| `update-record/index.ts` | 82 | Uppdaterar record med table allowlist |

**Alla Deno-baserade. Helt framework-agnostiska. Noll ändringar vid React-migrering.**

---

## DEL 7: Router-inventering

18 routes + 3 redirects + 1 catch-all:

| Path | Component | Meta title | Auth | Status |
|------|-----------|------------|------|--------|
| `/login` | LoginView | — | Nej | Fungerar |
| `/` | — | — | — | Redirect → `/mina-sidor` |
| `/mina-sidor` | MinaSidorView | "Mina sidor" | Ja | Fungerar |
| `/oversikt` | DashboardView | "Översikt" | Ja | Fungerar |
| `/miranon-media` | — | — | — | Redirect → `/oversikt` |
| `/anmalningar` | RegistrationsView | "Anmälningar" | Ja | Placeholder |
| `/event` | EventsView | "Event" | Ja | Placeholder |
| `/betalningar` | PaymentsView | "Betalningar" | Ja | Placeholder |
| `/deltagare` | PlaceholderView | "Deltagare" | Ja | Placeholder |
| `/intresserade` | PlaceholderView | "Intresserade" | Ja | Placeholder |
| `/personer` | PersonsView | "Deltagare" | Ja | Placeholder ¹ |
| `/leads` | LeadsView | "Intresserade" | Ja | Placeholder ¹ |
| `/utskick` | PlaceholderView | "Utskick" | Ja | Placeholder |
| `/mail` | — | — | — | Redirect → `/utskick` |
| `/statistik` | PlaceholderView | "Statistik" | Ja | Placeholder |
| `/kalender` | PlaceholderView | "Kalendervy" | Ja | Placeholder |
| `/vantelista` | WaitlistView | "Väntelistor" | Ja | Placeholder |
| `/psionautics` | PlaceholderView | "Psionautics" | Ja | Placeholder |
| `/:pathMatch(.*)*` | — | — | — | Catch-all → `/mina-sidor` |

¹ `/personer` och `/deltagare` har samma title "Deltagare". `/leads` och `/intresserade` har samma title "Intresserade". Oklart om de gamla ska vara redirects.

**Auth guard:** `router.beforeEach` — `waitForInit()`, redirect till login om ej autentiserad, redirect bort från login om redan inloggad.

---

## DEL 8: Sammanfattning

### Kvantitativ översikt

| Mått | Värde |
|------|-------|
| Filer totalt (src/) | 87 |
| Rader kod totalt | 12 701 |
| Rader produktionskod (exkl docs/legacy/gitkeep) | ~10 121 |
| Vue SFC-filer | 29 |
| TypeScript-filer | 36 |
| CSS/SCSS-filer | 6 |
| Composables | 19 + 1 barrel |
| Bibliotekskomponenter | 2 (MmDialog + MmDataTable) |
| Composable-instanser i komponenter | ~30 |
| CSS custom properties i :root | 48 |
| Komponent-scopade CSS tokens | ~55 |
| Supabase Edge Functions | 5 + shared |
| Routes | 18 + 3 redirects + catch-all |

### Migrationsfördelning

```
🟢 RAKT AV    23 filer   2 176 rader   Kopieras utan ändring
🟡 PORTAS     34 filer   7 122 rader   Skrivs om Vue → React idiom
🔴 ERSÄTTS    12 filer   2 200 rader   React-ekosystemet hanterar
⚪ ELIMINERAS  16 filer   3 203 rader   Behövs inte (legacy, docs, placeholders)
```

### De 5 mest komplexa porterings-utmaningarna

**1. AppMenu (1 617 rader Vue + CSS)**
7 composables, typewriter-effekt, scroll-track pseudo-element, collapse-animation, resize, 3 sektionslägen, blink-animation, user-sektion med sage-styling. Mest komplex komponent.

**2. useControllable → React-idiom (216 rader, 8 instanser)**
Hela composablen bygger på `getCurrentInstance().vnode.props` — en Vue-intern API utan React-motsvarighet. Problemet (boolean casting) existerar inte i React, men alla 8 konsumenter måste refaktoreras till React-idiomatisk controlled/uncontrolled.

**3. MmDataTable-ekosystemet (1 278 rader, 7 filer)**
Kolumnregistrering via Collection + provide/inject, 3× useControllable, roving focus, type-ahead, sort-annonsering. Hela registreringsmönstret (MmTableColumn → Collection → DOM-ordning) måste designas om — React har inte provide/inject som auto-propagerar genom Teleport.

**4. MmDialog composable-orkestrering (268 rader + 8 composables)**
8 composables i specifik initialiseringsordning, presenceRef ↔ containerRef-synk, afterOpen/afterClose via watch-kedja, Teleport-till-body med provide/inject-bevarad kontext. I React: `createPortal` bevarar INTE Context automatiskt — kräver explicit Provider-wrapping.

**5. Fokus-hanteringsstacken (useFocusScope + useFocusStack + useDismissable)**
Tre sammankopplade composables som bildar en fokus-hanteringsstack med inert-support, Tab-cycling, lager-baserad dismiss och fokusåterställning. Hela stacken måste antingen portas som enhet eller ersättas av React Aria FocusScope + Floating UI — men beteendet måste vara identiskt.

### De 5 saker som blir ENKLARE i React

**1. Controlled/uncontrolled — inget boolean-casting-problem**
React har inte Vue 3:s boolean-casting. `value !== undefined` räcker. useControllable:s 216 rader reduceras till ~30 rader. 8 instanser förenklas dramatiskt.

**2. Data-fetching med TanStack Query**
useAsyncData (21 rader, manuell) ersätts av TanStack Query med caching, prefetching, mutations, optimistic updates, DevTools. useDashboardData:s computed → TanStack Query `select`. Ingen manuell `onMounted(() => execute())`.

**3. Routing med type-safe search params**
TanStack Router: Zod-validerade search params med hierarkiskt arv. Filter/paginering/sortering i URL med full TypeScript-inferens — Vue Router kräver manuell parsning.

**4. Context istället för provide/inject**
React Context är explicit och typat. Inget magiskt Symbol-baserat provide/inject. Varje konsument deklarerar sitt beroende. Tooling och debugging är bättre.

**5. Headless UI-primitiver (React Aria)**
10 composables (2 035 rader) markerade 🔴 ERSÄTTS av React Aria-hooks som redan är testade i produktion av Adobe. Menos kod att underhålla, mer standardiserat, bättre internationalisering.

### Kritiska observationer

1. **airtable-config.ts saknas** — CLAUDE.md refererar till filen men den existerar inte. Fältmappning sker implicit i Edge Functions.
2. **9 av 15 adapter-metoder har TODO** — Edge Functions ej deployade. Oberoende av frontend-framework.
3. **Tre token-prefix** (`--f-*`, `--fkds-*`, `--miranon-*`) — bör konsolideras till ett prefix vid migrering.
4. **15+ saknade font-size-tokens** — hårdkodade värden utspridda i feature-komponenter.
5. **font-weight: 500 saknar token** — används 13 gånger.
6. **`Event`-namnkollision** med DOM:ens globala `Event` — kräver alias i React/TSX.
7. **Module-level singleton i useAuth** — refs utanför funktionen, fungerar som global state. I React: Context Provider eller extern state (Zustand).
8. **AppMenuLegacy finns som backup** — 1 377 rader som kan tas bort vid migrering.

---

*Analys genomförd med 5 parallella agenter. Varje fil i src/ läst. Alla importer, beroenden, tokens och edge cases dokumenterade.*
