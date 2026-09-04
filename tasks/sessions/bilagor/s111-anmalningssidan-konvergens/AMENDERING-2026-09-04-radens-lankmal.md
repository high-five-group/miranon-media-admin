# Amendering 2026-09-04 — radens länkmål: `/anmalda` → `/anmalan/$registrationId`

**Yta:** `anmälningssidan` i
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json` (Marcus
2026-08-23: *"Ser bra ut"*, stämpel-SHA `cb7ad681`).

**Klass:** *länkmål, ingen formändring — TASK-389, Marcus väg A 2026-09-04.*

---

## FÖRST: ytans `referenser` är en TOM lista — innehållslåset är inert

Samma läge som `AMENDERING-2026-09-01-filterradens-luft-och-eventvaljarens-etikett.md`
§ FÖRST bokförde: denna yta bär nyckeln `referenser`, men värdet är `[]` —
mätt igen 2026-09-04:

```bash
node -e "console.log(require('./tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json').ytor[0].referenser)"
# []
```

Invariant (d) i `scripts/check-facit.sh` har alltså ingenting att jämföra för
denna yta — innehållslåset är inert, precis som 2026-09-01. Ändringen nedan
kunde därför göras utan att röra `facit.json`.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter (identisk utdata, diffat)
```

Detta dokument är bokföring, inte en grind-tvingad sidofil.

---

## Vad som ändrades

**Kod:** `src/components/registrations/AnmalningarSida.tsx` — OK-radens
`Link` (`reg.eventId`-grenen) bytte `to` från `/event/$eventId/anmalda` till
`/event/$eventId/anmalan/$registrationId`, med `params={{ eventId: reg.eventId,
registrationId: reg.id }}` i stället för bara `{{ eventId: reg.eventId }}`.

**Varför:** 18.13-skulden. `task-18.13` (2026-07-23, Marcus beslut A)
bokförde rivningen av den gamla `/anmalda`-ytan (eventets hela deltagarlista)
som GATAD på `task-18.17` (anmälans egen detaljsida): *"anmälda-ytan när
task-18.17 (per-anmälan-detaljvyn) kan ta över AnmalningarLists länkmål."*
18.17 landade (`/event/$eventId/anmalan/$registrationId`, `AnmalanDetail`),
men övertagandet gjordes aldrig — S111:s promovering (`TASK-299.5`, den här
ytan) bar det gamla länkmålet vidare oförändrat, eftersom byggnaden av
promoveringen inte rörde länkmålet, bara formen. Marcus fynd 2026-09-04
(S120 Del 1) och vägval A: länkbyte + rivning av den gamla `/anmalda`-ytan i
samma kort (`TASK-389`).

**Aria-referenserna:** `tests/visual/__aria__/anmalningssidan-promoverings-grind.spec.ts/anmalningssidan-lista-visual-{desktop,mobile}.aria.yml` fångar länkens `/url:` som en del av accessibility-trädet. Båda filerna uppdaterades med `npx playwright test ... --update-snapshots` mot exakt de två tester som konsumerar dem
(`listläget — ofiltrerad lista, hela radanatomin` och `?variant=b renderar
identiskt med ingen query alls`). Diffen i båda filerna är **uteslutande**
`/url:`-raden — verifierat med `git diff`, inga andra noder i trädet rörda:

```diff
     - link "Anna Andersson":
-      - /url: /event/recGrindEventKurs1/anmalda
+      - /url: /event/recGrindEventKurs1/anmalan/recGrindAnna00001
```

(Identisk diff i båda `-desktop`/`-mobile`-filerna.)

**En andra, nödvändig fixtur-ändring, upptäckt UNDER detta arbete (ej i det
ursprungliga uppdraget):** `grindRader()` i
`tests/visual/anmalningssidan-promoverings-grind.spec.ts` byggde Anna-raden
utan explicit `id` — `reg()`s default genererar ett `id` av formen
`recGrind` plus en slumpad suffix (`Math.random().toString(36)`), nytt per
testkörning. Det gamla länkmålet (`/anmalda`, bara `eventId`)
läckte aldrig ut det slumpade id:t i `/url:`-raden, så snapshoten var stabil.
Det NYA länkmålet inkluderar `registrationId: reg.id`, vilket gör att
`/url:`-raden nu FÅNGAR det slumpade id:t — och en `--update-snapshots`-körning
utan ett pinnat id ger en snapshot som är garanterat röd på nästa körning
(bevisat: en omkörning direkt efter uppdateringen, utan `--update-snapshots`,
föll 4/4 eftersom ett nytt slumpat id genererades). Åtgärd: `grindRader()`s
Anna-`reg()`-anrop fick ett explicit `id: 'recGrindAnna00001'` — samma mönster
som redan används i `tests/acceptance/mer-anmalningar.acceptance.test.ts` och
`mer-anmalningar-form.acceptance.test.ts` för samma skäl (TASK-389). Detta rör
en testfixtur, aldrig DOM/pixlar/produktionskod, och är verifierat
deterministiskt över tre separata körningar (en `--update-snapshots` + två
vanliga omkörningar, samtliga 4/4 gröna, identisk snapshot-fil varje gång).

## Vad som INTE ändrats

- **Radens FORM** — `InitialAvatar`, namnet som helrads-länk, identitet/status
  på rad 2, chevron — orörd. Endast länkens `to`/`params`-attribut och den
  därav följande `/url:`-textraden i aria-trädet ändrades.
- **`facit.json`** — orört, inget fält skrivet.
- **Facit-bilderna** (PNG) — orörda, ingen av dem visar länkmålet (aria-text
  syns inte i en pixel-snapshot).
- **Övriga rader i aria-snapshoten** (Bo Bengtsson-knappen, Disa
  Danielsson-knappen, rubriker, status-text) — orörda, `git diff` bekräftar.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-23-kvittens och SHA `cb7ad681`.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter denna ändring (identisk utdata)
```
