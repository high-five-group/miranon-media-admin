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

Byggs när ett **konkret inställnings-behov** uppstår (t.ex. notis-preferenser,
default-vyer, tema, konto-uppgifter). Då:

1. Specificera den faktiska funktionen (ingen tom container).
2. Återinför posten i Mer-skalet (`src/routes/_authenticated/mer/index.tsx`) +
   byggplanen.
3. Bedöm mot kvalitetsribban (vy 11/10/10) som vilken annan Mer-yta.

## Spår

- Audit-fynd + Väg 1-beslut: `tasks/sessions/2026-06-29-session-42.md` (Del 2 + Del 4).
- De-scope-markörer: `docs/byggplan.md` §4 (6e-raden + Filer-listan) +
  `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` (Fas 6e-sektionen + Mer-flik-tabellen).
- Blockerar ej: 6e är förstklassigt klar mot ADR-058 utan Inställningar-ytan.
