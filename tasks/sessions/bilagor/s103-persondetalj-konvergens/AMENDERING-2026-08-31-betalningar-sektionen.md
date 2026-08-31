# Amendering 2026-08-31 — Personkortet får en Betalningar-sektion (TASK-346.7)

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` — variant D,
sju block i Marcus egen ordning (Marcus 2026-08-12: *"D är den som gäller
exakt som den ser ut och ska funka just nu."* / *"godkänner"*, stämpel-SHA
`4648823a`). Skarp källa: `src/components/persons/PersonDetail.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #4.

---

## FÖRST: grinden, och det mekaniska facit som FAKTISKT berörs

**Ytan saknar `referenser`-nyckeln** (mätt; `check-facit.sh` namnger den på
stderr). Invariant (d) är inert, och `scripts/check-facit.sh` kan inte fälla
denna diff. Mekanik-belägget står i
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST.

**Men till skillnad från Hem-ytan finns här ett mekaniskt facit som VERKLIGEN
träffas.** Manifestets `not` pekar ut ariaSnapshot-referenserna under
`tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/`
(`persondetalj-rik` / `persondetalj-tunn`, desktop + mobil) som "DET MEKANISKA
FACIT", och de tas mot `getByTestId('persondetalj-yta')` — alltså **hela**
VariantD. En ny sektion i den ytan ändrar snapshoten.

**Referenserna är INTE uppdaterade av denna skiva, och det är ett medvetet
val.** Skälen, i ordning:

1. **`tests/visual/` körs inte av blockerande CI.** Sviten körs enbart via
   `visual-baselines.yml` (`workflow_dispatch`), och husets väg för att
   uppdatera baselines går genom det jobbet — inte genom en lokal
   `--update-snapshots` i en agents worktree.
2. **Visual-klassen kör med flaggan `av`** (`playwright.config.ts` §
   `VITE_FEATURE_BETALNINGAR: 'av'` i fixturvärldens webServer-gren). Sektionen
   renderas alltså **inte** i den klassen, och referenserna är fortfarande
   sanna för det den mäter.

Punkt 2 är det som gör frånvaron av uppdatering korrekt i dag och till en
**skuld i morgon**: den dag flaggan flippas till `pa` i den config-raden
(vilket kräver betalnings-EF-mockar i `tests/support/fixturvarld/handlers.ts`
och ett svar på WebSocket-vakten) måste de fyra `.aria.yml`-filerna födas om i
samma landning. Bokfört här, inte lämnat åt någon att återupptäcka.

Testnamnet `'rik person — alla sju block med innehåll'` blir dessutom osant
när flaggan är på (åtta block). Namnet ska följa med i den landningen.

---

## Vad som ändrades

En **ny `Sektion`** (`id="proto-d-betalningar"`, rubrik "Betalningar") i
`VariantD`, renderad **enbart** när `betalningarPa()` är sann. Med flaggan av
renderas ingenting — persondetaljen är då byte för byte den promoverade
formen.

**Innehållet** (`src/components/betalningar/PersonBetalningar.tsx`):

- En sammanfattning: *"Saknas X kr på N anmälningar, varav M förfallna."*
- **En rad per öppen anmälan**, var och en med eventnamn, saknas-belopp och
  sin egen **Registrera betalning** (`RegistreraYta` → samma `RegistreraForm`
  som inkorgen, med anmälan förvald).
- **Senaste inbetalningar** (högst fem) över alla event, med kvittostatus och
  Visa / Skicka igen per rad.
- En länk till betalningsinkorgen.

**En rad per anmälan, inte ett gemensamt formulär:** en inbetalning hör alltid
till exakt EN anmälan (ADR-128), och personen kan ha öppet på flera event
samtidigt. Ett gemensamt formulär hade tvingat Lotta att välja event i en
rullgardin som ytan inte behöver.

## PLACERINGEN är den öppna formfrågan

Sektionen står **efter "Just nu" och före "Flagga"**.

Motivet: en öppen betalning hör till personens **nuläge** — samma fråga som
"Just nu" svarar på ("vad pågår med den här personen"), fast i pengar i
stället för i anmälningar.

Facitet låser sju block i din egen ordning och känner inte detta. Placeringen
är alltså **min bedömning under B3-mandatet, inte ett facit-beslut** — och
det är den punkt jag helst vill ha din blick på i morgongranskningen. Rimliga
alternativ, om du vill flytta den: sist (efter Anteckningar, som "arkiv"),
eller direkt efter Kontakten (om betalning läses som en egenskap hos personen
snarare än som nuläge).

## Urvalet görs på anmälnings-ID, aldrig på namn

`OppenBetalning` bär inget person-ID (`Betalningar.schema.ts`), och inkorgens
sökläge löser det med en namn-matchning som den **själv** kallar "en känd
grovhet" — en namne kan filtreras bort.

Personkortet behöver inte ta den grovheten: persondetaljen känner sina egna
anmälnings-record-ID:n (`motiveringar[].id` är Anmälningar-poster,
`historik[].registrationId` är anmälnings-länken ur Deltaganden), och ett
record-ID kan inte råka vara en namne. **Båda** källorna läses — en anmälan
utan deltagande-rad finns bara i den första, en gammal anmälan utan länk bara
i den andra.

Regeln har ett tvåsidigt test:
`tests/api/betalningar-ytor.test.ts` § *"personens rader väljs på
ANMÄLNINGS-ID, aldrig på namn"* visar att den trasiga namn-varianten drar in
namnens betalning på fel persons kort.

## Vad som INTE ändrats

- **B1–B8 i din ordning** — namnet, kontaktraderna, "Just nu", flaggan,
  interaktionsströmmen, eventhistoriken, hämtningarna, motiveringarna och
  anteckningarna är samtliga orörda, i oförändrad inbördes ordning.
- **`PersonFlagEditor`, `PersonAnteckningar`, `byggStrom`, `grupperaPerEvent`**
  — orörda.
- **Ingen befintlig sektion har bytt `id`, rubrik eller innehåll.**

## Testerna

`tests/acceptance/person-detail.acceptance.test.ts` kör med flaggan `av` och
ser därför ingen ny sektion — inklusive dess axe-svep och det gles-data-fall
vars kommentar pekar ut `definition-list`/`only-dlitems`. Den fällan är ändå
undviken i konstruktionen: `PersonBetalningar` monteras i `Sektion`s egen
`div`, aldrig inuti en `<dl>`.

Härledningen (`personOversikt`, ören-summering, sortering, förfallo-räkning)
prövas hermetiskt i `tests/api/betalningar-ytor.test.ts`, varje regel med sin
negativa kontroll (PRD DoD #5).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med din 2026-08-12-kvittens och SHA `4648823a`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
