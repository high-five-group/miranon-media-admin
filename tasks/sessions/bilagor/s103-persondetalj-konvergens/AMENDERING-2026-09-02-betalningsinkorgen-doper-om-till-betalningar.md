# Amendering 2026-09-02 — "Öppna betalningsinkorgen" → "Öppna betalningar"

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` (Marcus
2026-08-12: *"godkänner"*, stämpel-SHA `4648823a`). Skarp källa för
ändringen: `src/components/betalningar/PersonBetalningar.tsx` rad ~172 — en
RIPPLE, inte en `kallor`-fil. `PersonDetail.tsx` (som ÄR `kallor` i detta
manifest) monterar `PersonBetalningar`, precis som
`AMENDERING-2026-09-01-just-nu-utan-guld-och-betalningssektionens-nya-form.md`
§ 2 redan bokför för samma komponents Betalningar-sektion; samma mönster
här.

**Klass:** *ren terminologi* — Marcus egen order (TASK-362-uppdraget,
2026-09-02, verbatim): *"ändra namn på 'Öppna betalningsinkorgen' till …
'Öppna betalningar', ja så gör vi, det är ännu renare."*

**Varför denna fil finns, och en DIVERGENS öppet bokförd (ADR-086):**
uppdraget som gav order om namnbytet påstod att "Hem-kortets knapp är en
facit-stämplad yta (`tasks/sessions/bilagor/s102-hem-konvergens`)" och bad
att AMENDERING-filen skulle skrivas där. **Det stämmer inte, mätt mot
disk innan denna fil skrevs:**

- `s102-hem-konvergens/facit.json`s `kallor` är uteslutande
  `src/routes/dev/hem-prototyp.tsx` + `src/components/dev/hem-prototyp/*`
  (prototyp-substratet för Hem-vyns V1-facit) — noll koppling till
  betalningsdomänen.
- Repo-bred grep (`grep -rn -i "betalningsinkorgen"`) hittar EXAKT EN
  användarsynlig förekomst i `src/`: `PersonBetalningar.tsx`s länktext
  "Öppna betalningsinkorgen" (persondetaljsidans "Öppna betalningar"-länk
  under "Senaste inbetalningar"). Hem-sidans egen betalningsrad
  (`src/components/hem/Genvagar.tsx`, texten "Registrera betalning") bar
  ALDRIG ordet "betalningsinkorgen" — den knappen fanns i det RIVNA
  `BetalningarKort`-blocket (se `Genvagar.tsx`s eget docblock, "revs 2026-09-01"),
  och det blocket är inte facit-stämplat under s102 heller (dess källor är
  uteslutande dev-prototyp-filerna ovan, aldrig `Hem.tsx`/`Genvagar.tsx`).

Uppdragets premiss var alltså en HYPOTES som inte höll (ADR-086: "obelagda
påståenden behandlas av mottagaren som HYPOTES"). Den rätta facit-ytan är
`persondetaljen` (denna katalog), inte Hem. Divergensen byggs INTE tyst
förbi — den bokförs här, i den katalog som faktiskt äger ytan.

## Ändringen

`src/components/betalningar/PersonBetalningar.tsx` rad ~171–177:

```diff
- <Link to="/mer/betalningar" className="text-small underline">
-   Öppna betalningsinkorgen
- </Link>
+ <Link to="/mer/betalningar" className="text-small underline">
+   Öppna betalningar
+ </Link>
```

**Kodidentifierare orörda**, i linje med uppdragets egen regel: komponentnamnet
`BetalningsInkorg`, filnamnet `BetalningsInkorg.tsx`, `queryKeys.betalningar.*`
och samtliga interna kommentarers referenser till `BetalningsInkorg.tsx` som
filnamn (inte som UI-text) är EXAKT SOM FÖRUT.

**ORDLISTA.md kontrollerad, ingen ändring gjord.** Termen "betalningsinkorg"
förekommer på TVÅ ställen i `ORDLISTA.md`: rad 639 ("**Granskningsblocket** —
betalningsinkorgens block …", beskrivande prosa, ingen egen postrubrik) och
rad 656 (`BetalningsInkorg.tsx`, en kodidentifierare-referens). Ingen av de
två är en EGEN glossary-post för "Betalningsinkorgen" som termen — uppdragets
villkor ("bär den termen ska posten uppdateras") är därför falskt, och ingen
ändring gjordes. Prosan på rad 639 är intern dokumentation, inte
användarsynlig UI-text, och rörs inte av namnbytesordern.

**Test:** `src/components/betalningar/PersonBetalningar.tsx` har inget eget
test som matchar på länktexten (verifierat med repo-bred grep före ändringen
— `tests/e2e/atgarder-betalningar.staging.test.ts` § note-block); ingen
testuppdatering behövdes för själva namnbytet.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-12-kvittens och SHA `4648823a`. Ändringen rör en
RIPPLE-yta (`PersonBetalningar.tsx`), inte manifestets `kallor`-filer.

`bash scripts/check-facit.sh` → **exit 0**, före och efter (verifierat).
