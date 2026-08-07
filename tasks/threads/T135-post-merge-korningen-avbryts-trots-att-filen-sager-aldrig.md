---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T135 — Post-merge-körningen avbryts trots att filen säger att den aldrig gör det

> Tråd-kort (ADR-053), fött i S93 när ett försök att hämta färskt
> karantän-underlag för `main`-rödan avbröts mitt i staging-jobbet.
> Registrerad som **defer**: den blockerar inte pågående arbete — en omkörning
> är alltid möjlig — men påståendet i filen är falskt och bör inte stå kvar
> oemotsagt.

## Vad filen påstår

`.github/workflows/post-merge.yml`, verbatim ur dess `concurrency`-block:

> ```yaml
> # Per-SHA-grupp, cancel-in-progress OSATT: en post-merge-körning avbryts
> # ALDRIG. En serialiserande grupp (som nightly.yml:s `nightly`) vore FEL här —
> # GitHubs default-concurrency håller bara EN väntande körning, så en tredje
> # landning hade avbrutit den andras väntande körning och tyst tappat dess
> # täckning. Per-SHA ger en körning per landat träd, alltid.
> concurrency:
>   group: post-merge-${{ github.sha }}
>   cancel-in-progress: false
> ```

## Vad som mättes

Körning `31196593426` (2026-08-07, `workflow_dispatch` mot `--ref main`,
`sha=f0171117`) avbröts. Sju av åtta jobb blev `success`; endast
**`Verifierande svit på det mergade trädet / Staging (API + E2E)`** avbröts —
och inuti det steget:

| Steg | Utfall |
|---|---|
| `API tests (staging)` | `success` |
| `E2E tests (staging)` | **`cancelled`** |

Loggen, verbatim: `##[error]The operation was canceled.` vid
`2026-08-07T16:27:11Z`, följt av `Terminate orphan process` för
`npm run test:e2e:staging`. Alltså en EXTERN avbrytning, inte en timeout.

**Den uppenbara misstänkta är utesluten.** Push-körningen som startade 16:26
för `6756bb92` **skippade** hela sviten (docs-only-landning, `T134`) — den tog
därmed aldrig `staging-tests`-mutexen och kan inte ha trängt undan
dispatch-körningen. Orsaken är alltså **inte fastställd**.

Kandidater, ingen verifierad:

1. Den globala `concurrency: group: staging-tests` i `ci-suite.yml` (~rad 520),
   som är en global sträng oavsett anropare — någon annan workflow kan ha tagit
   den. `CI [main]` startade 16:26 och `CI [gh-readonly-queue/…pr-925…]` 16:27.
2. GitHubs enkelplats-kö för väntande körningar — samma mekanism
   `post-merge.yml`:s egen kommentar beskriver, men applicerad på ett lager
   kommentaren inte täcker.
3. Något tredje.

**Samma mönster finns på flera landningar samma dygn:** post-merge-körningarna
för `0682a5b0` (`TASK-145.2`), `1af3299d` (`TASK-145.4`) och `57f8d143` står
alla `cancelled`.

## Vad som INTE är fel — rättelse av en första hypotes

Den första hypotesen var att en avbruten körning tappar täckningen **tyst**.
**Det är falskt, och verifierat falskt.** Larmkedjan fyrar på `cancelled`
likaväl som på `failure`:

```yaml
if: ${{ always() && (contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')) }}
```

med kommentaren *"Fyrar vid RÖTT (eller cancelled — utebliven dom är inte
grön…)"*. Mätt: ärende **`#926`** skapades `16:27` för `f0171117`, alltså för
just den avbrutna körningen. Mekanismen gör exakt vad den ska.

Luckan är därmed **prosan, inte skyddet**.

## Varför det spelar roll ändå

Sedan A7:5 (`TASK-70.3`) skickar `ci.yml` `run_staging: false` villkorslöst.
`post-merge.yml`:s egen header säger då att lagret *"gick från skyddsnät till
primär bärare av staging-kontrollen"*. När den bäraren avbryts landar ett
kod-träd på `main` utan fullständig staging-täckning — bokfört i ett larm, men
utan dom. Med parallella sessioner som landar löpande (S99, S100) är det inte
ett kantfall utan ett återkommande läge: **sex öppna post-merge-larm på ett
dygn**, varav flera `cancelled` snarare än genuint röda.

Operativ följd: den som behöver ett färskt staging-utfall mot `main` kan inte
räkna med att en dispatch går igenom orörd medan andra sessioner landar.

## Vad tråden ska avgöra

- **Fastställ orsaken** innan något ändras. Kandidat 1 (den globala
  `staging-tests`-gruppen) är billigast att pröva: korrelera tidsstämplarna för
  de fyra `cancelled`-körningarna mot vilka andra körningar som höll gruppen.
- **Rätta prosan oavsett utfall.** Raden *"en post-merge-körning avbryts
  ALDRIG"* är falsifierad. Antingen är den fel, eller så avser den bara sin
  egen concurrency-grupp och inte de grupper jobben ärver — i båda fallen ska
  texten säga vad som faktiskt gäller. Samma ADR-083-klass som `CLAUDE.md`
  § `verify:ci-parity` river i sin egen historik: prosa som lovar en täckning
  ingen mekanism håller.
- **Avgör om `cancelled` ska särskiljas från `failure` i larmtexten.** De
  behandlas idag lika (korrekt — utebliven dom är inte grön), men ett ärende
  som säger "rött" när jobbet i själva verket aldrig fick köra klart leder
  läsaren fel. Sex larm på ett dygn med blandade orsaker är svårare att triera
  än de behöver vara.

## Ingång

- Körning `31196593426` (avbruten dispatch) · `31197538141` (den skippade
  push-körningen) · larm-ärende `#926`.
- `.github/workflows/post-merge.yml` § concurrency + § LARMKEDJAN.
- `.github/workflows/ci-suite.yml` ~rad 504–521 (`staging-tests`-gruppen).
- Besläktad: `T134` (agent-apparatens genomloppstid) rör samma pass men en
  annan axel.
