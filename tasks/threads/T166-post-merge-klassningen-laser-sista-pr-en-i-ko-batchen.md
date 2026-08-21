---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
lifecycle: paused
---

# T166 — Post-merge-klassningen läser sista PR:en i kö-batchen, inte hela pushen

> Registrerad i S110 (2026-08-21) vid CI-verifieringen av `TASK-284.4`.
> Mätt, inte befarad — instansen står nedan med SHA:n.

## Mekanismen

`post-merge.yml`s `klassning`-jobb kör `scripts/classify-post-merge.sh "${SHA}"`
och besvarar EN fråga: *körde PR-grinden hela testsviten för det landade
trädet?* Svaret hämtas ur `ci.yml`:s körning på **`HEAD^2`** — den andra
föräldern, alltså den PR-gren som mergades.

Är svaret "PR-grinden klassade D0 och körde ingen svit" sätts
`docs_only=true`, och `suite`-jobbet hoppas: `if: needs.klassning.outputs.docs_only != 'true'`.

Jobbets eget huvud beskriver mekanismen som fail-closed hela vägen — API-fel,
träd-avvikelse, ingen andra förälder, ingen grön PR-körning ger alla
`docs_only=false` och full svit. **Kö-batchen är den avvikelse listan inte
nämner.**

## Instansen

Merge queue landade två poster i EN push, `aefe87f6 → fb1c7fa4`:

| Ordning | PR | Merge-SHA | Klass |
|---|---|---|---|
| först | `#1711` (`TASK-284.4`) | `8b361ff0` | **kod** — 7 källfiler |
| sist | `#1713` | `fb1c7fa4` | docs-only |

`HEAD^2` för `fb1c7fa4` är `#1713`:s gren. Klassningen ärvde därför D0 —
korrekt **för `#1713`** — och hela verifierande sviten hoppades, trots att
pushen innehöll sju källfiler.

## Vad det faktiskt kostade

Inget står overifierat i sak. `TASK-284.4` täcktes av sin EGEN
merge_group-körning (`32487146248`): Acceptance (hermetisk), Acceptance
tvåsidigt bevis, Pure + Build, Webblasarbeteende, Lint/TypeCheck — alla
gröna.

**Men två jobb kördes aldrig, någonstans:** `A11y (axe-runner)` och
`Staging (API + E2E)`. Båda skippas med avsikt i PR- och merge_group-ytan
(`run_a11y`/`run_staging` villkorslöst `false`, `TASK-70.3`/`70.4`) och bor
i post-merge — som alltså hoppade dem här.

För just den skivan spelade det ingen roll: AC 5:s axe-bevis ligger INUTI
acceptance-testerna, som kördes gröna, och skivan la inga staging-tester.
**Det är tur, inte design.**

## Varför det ändå registreras

Täckningen återkommer av sig själv vid nästa KOD-landning, eftersom
post-merge då kör full svit på det mergade trädet — som innehåller den
tidigare batchens kod. Fönstret är alltså tillfälligt, inte permanent.

Men det gör kanten svårare att se, inte ofarligare: en kod-landning kan
sakna a11y- och staging-täckning i timmar utan att något larmar, och det enda
som stänger fönstret är att någon ANNAN landar kod. Under en lugn helg gör
ingen det.

## Vad som behöver avgöras

1. Ska klassningen läsa **hela push-spannet** (`before..after` ur push-eventet)
   i stället för `HEAD^2`? Det är den uppenbara formen, men den gör
   dedup-besparingen mindre — varje batch som innehåller en enda kod-PR kör
   full svit.
2. Eller ska den fälla fail-closed när pushen har **fler än en merge-commit**
   — alltså behandla batchen som "kan inte avgöras" och köra full svit?
   Billigare att implementera, samma riktning som listans övriga poster.
3. Eller är fönstret acceptabelt givet att nästa kod-landning stänger det?

Ingen avgörs här. Punkt 2 ligger närmast mekanismens egen deklarerade
fail-closed-princip.

## Besläktat

- `ADR-077` § Beslut 2 — "en besparing får aldrig bli ett hål".
- `L321`/`L322` — skippbar required check är fail-open; deferral-bärare.
- `CLAUDE.md` § Kvalitetsgrind — `run_staging`/`run_a11y` villkorslöst false
  i PR-grinden, kontrollen flyttad till post-merge.
