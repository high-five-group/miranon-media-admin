# ADR-008: FILE-INVENTORY selektiv körning (skydda Fas 0-filer)

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

## Kontext

Fas 1-prompten specificerade:

> 0. [FI] Kopiera docs, tasks och settings (kopieringsscriptet från FILE-INVENTORY.md):
>    Kör bash-scriptet i sektion "Kopieringslista" i FILE-INVENTORY.md med DRY_RUN=0:
>    `DRY_RUN=0 bash ~/Repon/miranon-media-os/docs/react-migration/FILE-INVENTORY.md`

Scriptet är designat för ett **tomt React-repo**: det kopierar docs, tasks, settings, supabase och domain-filer från Vue-repot. Designen förutsatte att `miranon-media-admin/` inte hade några filer innan Fas 1.

**Men Fas 0 hade redan körts** och skapat:

- `tasks/lessons.md` — med **2 nya `[UNIVERSAL]`-lärdomar** tillagda vid Fas 0-avslutet (CSS custom property-namngivning + versionsverifiering). Dessa **finns inte** i Vue-repots `tasks/lessons.md`.
- `tasks/todo.md` — React-specifik version med Fas 0-filstruktur, Tailwind v4 `@theme`-migration, [GA]-markeringar. Vue-repots version innehåller Vue-byggplanen (V8b-vyer, sökfält, Eventläge-scenarier) som är helt irrelevant för React-projektet.
- `.claude/settings.json` — uppdaterad med rätt sökväg (`~/Repon/miranon-media-admin`). Vue-repots version pekade på gamla namnet `miranon-media-admin-react`.
- `.claude/settings.local.json` — finns inte i React-repot (Vue-repot har en 8-rads fil med okänt innehåll).

Om scriptet kördes rakt av skulle **alla fyra filer skrivas över**, inklusive de 2 nya universella lärdomarna från Fas 0.

## Beslut

**Kör inte scriptet.** Extrahera istället de säkra sektionerna manuellt och exekvera dem som separata `cp`-kommandon:

**Kopierade (icke-destruktiva — filerna finns inte i React-repot ännu):**

- Alla 15 docs-filer från `docs/react-migration/` → `docs/` (platt, inte under `react-migration/`)
- Alla 2 research-filer från `docs/research/`
- Alla 5 a11y/kvalitet-docs (`ACCESSIBILITY-CHECKLIST.md`, `ACCESSIBILITY-AUDIT-MALL.md`, `KVALITETSDEFINITIONER-11.md`, `DOKUMENTATIONSSTANDARD.md`, `features/FEATURE-ACTIVITY-LOG.md`)
- `BYGGPLAN-LÄTTLÄST.md` + `BYGGPLAN-LÄTTLÄST-v2.md`
- Alla 7 Supabase Edge Functions (`supabase/functions/**`)

**Skippade (destruktiva — finns redan med nyare innehåll):**

- `tasks/lessons.md` — React-versionen har Fas 0-lärdomarna som Vue-versionen saknar
- `tasks/todo.md` — React-versionen är aktuell, Vue-versionen är irrelevant
- `.claude/settings.json` — React-versionen har rätt sökväg
- `.claude/settings.local.json` — behövs inte, okänt innehåll

Källfilerna till de manuella kopieringarna specificerades explicit i en bash-block i Fas 1-sessionen, inte via scriptets entry points.

## Alternativ som övervägdes

**1. Kör scriptet rakt av, låt det skriva över**

- **Fördelar:** Följer prompten bokstavligt.
- **Nackdelar:** Förstör de 2 nya `[UNIVERSAL]`-lärdomarna från Fas 0. Dessa lärdomar är resultatet av konkret friction och måste bevaras. Förstör också React-specifik todo.md.

**2. Kör scriptet, återställ sedan de skippade filerna från git**

- **Fördelar:** Följer scriptets entry point.
- **Nackdelar:** Farligare — ett misstag (glömma återställa) förstör data. Fler steg, fler chansen för fel. Saknar revert-cred om något går snett mitt i.

**3. Modifiera scriptet i Vue-repot för att respektera React-repots versioner**

- **Fördelar:** Generaliserbart för framtida fas-körningar.
- **Nackdelar:** Scope-creep — kräver ändring i Vue-repot bara för Fas 1 i React-repot. Båda repos skulle behöva synkas.

**4. Kör scriptet med `--exclude tasks --exclude .claude`**

- **Fördelar:** Teoretiskt enklast.
- **Nackdelar:** Scriptet stödjer inte exclude-flaggor. Skulle kräva en hack-patch.

## Konsekvenser

**Positivt:**

- De 2 nya `[UNIVERSAL]`-lärdomarna bevaras intakt i `tasks/lessons.md`
- React-specifik `tasks/todo.md` rörs inte — den uppdateras manuellt i slutet av Fas 1 för att markera Fas 0 + Fas 1 som klara
- `.claude/settings.json` behåller rätt sökväg (`miranon-media-admin`)
- Explicit bash-block för kopieringen är granskningsbar i commit `c91bfa0` ("fas 1: domäntransplant")

**Negativt:**

- Bryter "kör scriptet"-flödet som prompten specificerade. Motiveringen måste dokumenteras (denna ADR) så framtida läsare förstår varför scriptet inte användes
- Om Vue-repots docs uppdateras senare måste vi manuellt synka — scriptets entry point är inte längre den officiella kanalen för docs-sync

**Universell lärdom för framtida sessioner:**

- Kopieringsscripter som inte har idempotens-skydd (varken dry-run-först eller backup-först) ska **alltid** verifieras mot target-repots nuvarande state innan körning. Även "tomt" repo kan ha viktiga filer från tidigare sessioner.
- För framtida scripter i projektet bör vi lägga på idempotens-flagga (t.ex. `--skip-existing`) så samma problem inte uppstår igen.

## Referenser

- `docs/react-migration/FILE-INVENTORY.md` (Vue-repo) — scriptet
- `tasks/lessons.md` — de skyddade `[UNIVERSAL]`-lärdomarna
- Commit `c91bfa0` — den selektiva Fas 1-kopieringen
