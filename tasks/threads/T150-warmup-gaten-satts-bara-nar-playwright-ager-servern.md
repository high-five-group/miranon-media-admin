---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: stable
lifecycle: active
---

# T150 — Warmup-gaten sätts bara när Playwright äger dev-servern

> Registrerad i S107 (2026-08-20) ur staging-E2E-fixen, där den kostade en
> falsk fällning och en felaktig diagnos som fördes vidare en gång innan den
> mättes. Triagerad enligt `ADR-053`: blockerar inte — men den träffar varje
> agent som kör e2e lokalt, och den ser ut som en regression.

## Felet

`playwright.config.ts` sätter `VITE_E2E_WARMUP_TIMEOUT_MS: '50'` på den
webServer den startar själv (rad 411 och 451). Kör man i stället mot en
**redan startad** dev-server — via `PLAYWRIGHT_TEST_BASE_URL`, t.ex. för att
huvudkatalogens server redan håller port 5173 — sätts variabeln **aldrig**.

Följden: warmup-gaten går på sin riktiga timeout, och tester faller på en
progressbar i stället för på sitt faktiska påstående.

## Hur det ser ut när det händer

Felkontexten visar en yta som ser halvfärdig ut:

```text
progressbar "Förbereder ditt administrationsverktyg"
status: 4 av 7 hämtningar klara
```

Testet rapporteras som fällt på sin egen assertion. Ingenting säger
"servern var inte varm". Det ser ut som en regression i den ändrade koden.

## Varför den är värd att bokföra

Fällan träffade S107 **två gånger på en dag**, och kostade mer andra gången:

1. Första agenten fällde på rad 210 och klassade det som en CORS-/portartefakt
   — rimligt, men omätt.
2. Den klassningen fördes vidare i nästa uppdrag som en källmärkt premiss.
   Nästa agent körde på **rätt** port, föll ändå, och mätte då den verkliga
   orsaken.

En omätt diagnos som färdas vidare som premiss är exakt den felklass repot
bokfört flera gånger. Här var kostnaden liten; mekanismen är densamma.

`ci-suite.yml` rad 259 bär redan en kommentar om att variabeln sitter på
e2e-webServern och ingen annanstans — kunskapen finns, men bara där man
redan letar.

## Öppna frågor

- Ska variabeln sättas även när `PLAYWRIGHT_TEST_BASE_URL` pekar bort? Den
  hör logiskt till KÖRNINGEN, inte till vem som startade servern.
- Kan warmup-gaten säga ifrån själv? Ett test som faller mot en progressbar
  borde kunna rapportera "servern var inte varm" i stället för att låta
  assertionen bära skulden.
- Är detta samma familj som `T148` (flake-riggens acceptance-bindning)? Båda
  är fall där ett verktyg tyst kör mot fel miljö och producerar ett
  välformat men osant resultat.

## Belägg

S107 2026-08-20, staging-E2E-fixen (`fix/s107-utloggning-redirect-assertion`).
Rad 210 `Skapa nytt event är RIVEN ur Mer` föll lokalt på port 5173, passerade
i CI och i den gröna lokala körningen. `playwright.config.ts` rad 411/451,
`ci-suite.yml` rad 259.
