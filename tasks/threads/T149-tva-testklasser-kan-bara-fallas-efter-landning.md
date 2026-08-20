---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: stable
lifecycle: active
---

# T149 — Två testklasser kan bara fällas EFTER landning, och deras enda bevakare är larm ingen läser

> Registrerad i S107 (2026-08-20) ur staging-E2E-regressionen, som levde
> obruten i tre dygn. Triagerad enligt `ADR-053`: blockerar inte — båda
> regressionerna är nu åtgärdade — men mekanismen som lät dem leva står kvar
> orörd.

## Mätt tillstånd

`ci.yml` rad 1439–1440 skickar **villkorslöst**:

```yaml
run_staging: false
run_a11y: false
```

`Staging (API + E2E)` och `A11y (axe-runner)` **instansieras därmed aldrig i
PR-grinden**. De körs i post-merge och i nattnätet — alltså först när koden
redan ligger i `main`.

Det är ett medvetet designval med utskriven motivering (`TASK-70.3`,
`TASK-70.4`, A7:6), inte ett slarv. Tråden ifrågasätter inte valet.

## Vad valet kostar, mätt

Kombinationen av två egenskaper skapade en blind fläck:

1. **Ingen kan verifiera de två klasserna före landning.** En agent som
   bygger något dessa jobb täcker har inget CI-bevis att vänta på — bara ett
   lokalt.
2. **Den enda bevakaren efter landning är ett larm-ärende.** Post-merge går
   rött, ett `ci-post-merge`-ärende skapas, och där stannar det tills någon
   läser det.

Utfallet blev mätt: **16 öppna larm-ärenden obrutet sedan `#1428`**
(2026-08-16), tre röda nätter i rad, och två äkta regressioner som levde
i tre dygn:

| Regression | Införd | Upptäckt |
|---|---|---|
| `tests/a11y/NavCard.spec.ts` — `b09e0732` (task-273.2) | 2026-08-17 15:33 | 2026-08-20 |
| `tests/e2e/mer-index.staging.test.ts` — `5d2d0735` | 2026-08-17 | 2026-08-20 |

Den andra är den skarpaste illustrationen: commiten landade en **e2e-assertion**
och bokförde sin verifiering som
<!-- vale Vale.Terms = NO -->
*"typecheck 0 fel · biome exit 0 · build grön · test:a11y Forberedelseskarm
9/9"* (verbatim ur commiten — citatet står orört, inklusive gemenerna).
<!-- vale Vale.Terms = YES --> E2E kördes aldrig — och kunde heller inte
köras i PR-grinden. Testet var rött från första sekunden.

## Varför tråden och inte ett kort

Frågan är inte "kör e2e i PR-grinden" — det valet är redan taget och motiverat
(kostnad, staging-mutex, flakighet). Frågan är vad som ska bevaka de två
klasserna när de bara kan fällas efter landning.

Kandidater, ingen vald:

- **Larm-ärendena får en ägare med en tröskel.** Grinden
  `check-obesvarade-larm.sh` finns redan och larmar vid 24 h — men den larmar
  i samma kanal som ingen läste. Vem läser larmet om larmet?
- **Landnings-svepet läser post-merge-utfallet.** Orkestreraren äger redan
  landningsverifikat (`T112`); post-merge är i dag utanför den slingan.
- **Bygg-agentens DoD erkänner att beviset inte finns än.** Besläktat med
  `TASK-281` men inte samma sak: `281` handlar om vem som bockar rutan, denna
  tråd om att rutan för dessa två klasser inte KAN bockas före landning.

## Belägg

- `ci.yml` rad 1344–1440 (`run_staging`/`run_a11y`-motiveringarna)
- Larm `#1588` (2026-08-17T19:52) — äldsta belägg för `mer-index.staging`
- Post-merge `32042500298` (grön) → `32042688084` (röd), fyra minuter isär
- S107 Del 18 (nattnätets diagnos)
