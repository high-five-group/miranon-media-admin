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

## Tillägg 2026-09-02 (review-runda 1) — kryss-regelns gräns mot ett historiskt utfall

**Varför detta tillägg står HÄR och inte i en egen fil:** ändringen nedan rör
`BetalningsInkorg.tsx`, som INTE är `kallor` i NÅGOT facit-manifest (mätt:
repo-bred `grep -rl "BetalningsInkorg.tsx" tasks/sessions/bilagor/*/facit.json`
gav noll träffar, innan denna fil skrevs). Ordern ("bokför beslutet + skälet
i AMENDERING-filen") pekade alltså på en fil som inte objektivt existerar för
den här ytan — denna fil är den ENDA AMENDERING-sidofil PR:en producerat, och
tillägget läggs här snarare än att lämnas obokfört. Den fullständiga,
auktoritativa dokumentationen av beslutet bor i koden själv
(`BetalningsInkorg.tsx`s `bekraftelseSynlig`-docblock och sändstatus-slottens
docblock, "[REVIEW RUNDA 1, FYND 1]") — det här är en sammanfattning, inte en
andra källa som kan glida isär från den.

**Beslutet (Marcus mandat, review-runda 1):** kryss-regeln (S109-facit) säger
att en varning försvinner när ORSAKEN är borta, ALDRIG av en obesläktad
handling. Runda 1s första version delade EN flagga (`bekraftelseSynlig`)
mellan success- och warning-utfallet och nollställde den ovillkorligt vid
varje ny registrering/sändning — vilket hade dolt en genuin
"N kvitton misslyckades"-varning bara för att Lotta registrerade en annan
betalning. Rättat: `bekraftelseSynlig` styr ENDAST success-radens synlighet.
`warning` (och, som en egen, explicit flaggad avvägning som utökar SAMMA
princip: `info`, ett pågående utskick) har ingen egen dölj-flagga — de finns
kvar så länge `utfall` beskriver dem, och `utfall` byter bara innehåll när
ETT NYTT jobb faktiskt startar.

**En andra, egen bugg hittades UNDER byggandet av beviset för beslutet ovan**
(inte i uppdraget, mätt av den nya e2e-svitens eget röda utfall): den
FÖRSTA implementationen av rättningen ovan använde fortfarande en
`vantande.length > 0 ? knapp : (warning|status)`-ternary, som gjorde
knappraden och `warning`/`info` ömsesidigt uteslutande — en warning
FÖRSVANN så fort Lotta köade en NY, obesläktad rad (samma symptom som
review-fyndet, fast orsakat av JSX-STRUKTUREN, inte av
`bekraftelseSynlig`). Rättat till tre OBEROENDE `&&`-villkorade grenar
(knapprad, warning, kompakt statusrad) som kan samexistera. Tvåsidigt
bevisat: `tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts`s
FYND 1a/1b-test (en warning överlever en orelaterad registrering OCH
ersätts av ett nytt jobb) och `tests/api/betalningar-inkorg-statusyta-
form.test.ts`s `treOberoendeGrenar`-grind (med den FAKTISKA regressionen
som negativ kontroll).

**"EN statusyta"-löftet håller för DET VANLIGA fallet, med en bokförd
avvikelse:** när en warning/info samexisterar med en nyköad rads knapp
(sällsynt — kräver att Lotta agerar på en annan rad medan ett tidigare
utfall fortfarande är relevant) visas BÅDA samtidigt, och blockets höjd
växer utöver `min-h-22`/`sm:min-h-10`-golvet. Det är samma, redan
dokumenterade undantag som gäller en ensam warning (NN/g:s regel, ett
partiellt misslyckande klämmer inte in i en höjd-låst rad) — inte en ny
regel, bara en till situation den redan täcker.

**Öppen fråga, inte avgjord här:** att `info` fick samma behandling som
`warning` var mitt eget, explicit flaggade beslut under mandatet
("Flaggad för samma grillning som resten av forskningspassets öppna
frågor") — uppdraget adresserade bara success/warning. Grillningsvärdig,
inte en tyst utvidgning.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-12-kvittens och SHA `4648823a`. Ändringen rör en
RIPPLE-yta (`PersonBetalningar.tsx`), inte manifestets `kallor`-filer.

`bash scripts/check-facit.sh` → **exit 0**, före och efter (verifierat).
