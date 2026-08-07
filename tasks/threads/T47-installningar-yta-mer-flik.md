# T47 — Inställningar-yta för Mer-fliken (6e-de-scopad)

- **Tillstånd:** `paused` (parkerad — byggs när konkret behov uppstår)
- **Uppstod:** Session 42 (Fas 6e arch-audit, ADR-058 fynd iv-1 / Väg 1)
- **Commit-tagg:** `git log --grep "\[T47\]"`

## Varför denna tråd

Fas 6e:s ursprungliga skal-scope (byggplan.md §4 + BYGGPLAN-LÄTTLÄST-v3.md)
listade "inställningar/logga ut" på Mer-fliken. Session 42:s arch-audit
([ADR-058](../../docs/decisions/ADR-058-arkitektur-fitness-audit-mekanism.md))
fann att skalet saknade BÅDA (fynd iv-1, golv-lucka). Marcus beslutade **Väg 1**:

- **Logga ut** är ett golv (en inloggad admin måste kunna avsluta sin session ur
  appen) → **byggd** Session 42 (`d24d95e`).
- **Inställningar** har **ingen specificerad funktion** vid 6e. Att bygga en tom
  inställnings-sida "ifall" vore spekulation över golvet (dubbelriktad
  över-engineering-vakt) → **de-scopad** från 6e, registrerad här.

## Vad som väntar

> **BEHOVET KOM — S95 (2026-08-02):** "Installera appen"-ytan (T95 Spår A) är
> det konkreta inställnings-behovet; ytan byggs i skiva `TASK-126.3` som
> aktiverar denna hemvist. Konto-uppgifts-visningen (T69-B2-deferralen nedan)
> följer med om skivningen finner den billig — annars kvarstår den här.
> Tråden stängs när ytan är byggd och Marcus-godkänd (QA `TASK-126.5`).

Byggs när ett **konkret inställnings-behov** uppstår (t.ex. notis-preferenser,
default-vyer, tema, konto-uppgifter). Då:

> **Deferrerat hit från T69 (S64, 2026-07-12):** konto-uppgifts-visningen
> (inloggat namn + e-post ur befintlig auth-state, key-value-rader per
> IMG_1542-mönstret) — var T69-B2:s `/mer/mina-sidor`-v1-innehåll; B2 revs
> när "Mina sidor"-destinationen upplöstes (T69 § Revision S64 punkt 2).
> Notis-preferenser relaterar till `T77` (notis-centret).

1. Specificera den faktiska funktionen (ingen tom container).
2. Återinför posten i Mer-skalet (`src/routes/_authenticated/mer/index.tsx`) +
   byggplanen.
3. Bedöm mot kvalitetsribban (vy 11/10/10) som vilken annan Mer-yta.

## Spår

- Audit-fynd + Väg 1-beslut: `tasks/sessions/archive/2026-06/2026-06-29-session-42.md` (Del 2 + Del 4).
- De-scope-markörer: `docs/byggplan.md` §4 (6e-raden + Filer-listan) +
  `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` (Fas 6e-sektionen + Mer-flik-tabellen).
- Blockerar ej: 6e är förstklassigt klar mot ADR-058 utan Inställningar-ytan.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Inställningar-yta för Mer-fliken — 6e-de-scopad (ingen specificerad funktion vid 6e; tom "ifall"-sida vore spekulation över golvet, ADR-058 iv-1/Väg 1). **Behovet kom S95:** "Installera appen"-ytan är det konkreta inställnings-behov tråden väntade på — aktiveras via skiva `TASK-126.3` (T95 Spår A)

**Ingång (fullständig, ursprunglig):**
[T47-installningar-yta-mer-flik.md](T47-installningar-yta-mer-flik.md) — uppstod Session 42 (6e arch-audit iv-1/Väg 1 de-scope); aktivering S95 via `TASK-126.3`, tråden stängs när ytan är byggd
