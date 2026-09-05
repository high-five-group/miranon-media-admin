# Amendering 2026-09-05 — EventValjare: `'fristaende'` blir DEFAULT, `'kontextrad'` riven

**Yta:** `anmälningssidan` i
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json` (Marcus
2026-08-23: *"Ser bra ut"*, stämpel-SHA `cb7ad681`). Ändrad `kallor`-fil:
`src/components/events/EventValjare.tsx`.

**Klass:** *bekräftande (no-op)* — TASK-394, Marcus 2026-09-04 fynd om
åtgärdssidans pill, fällt till regel för hela appen: *"Jag stör mig på att
åtgärdssidan har den 'lilla' eventväljaren. Vi har infört den 'stora' på typ
alla ställen, eller det SKA vara den stora på alla ställen."* Stämpel på
själva ändringen (draft-PR `#2319`, samtliga sju berörda ytor), Marcus
2026-09-05: *"Eventväljaren ser bra ut."*

**Varför denna fil finns:** uppdraget namngav åtgärdssidan
(`s93-atgardssida-promovering`, `s100-atgardssidan-varv3/varv4`),
hem/inkorgen (`s102-hem-konvergens`) och anmälningssidan (`s111`, denna
katalog) som kandidat-facit. En körning av samtliga `facit.json`-manifests
`kallor` mot `git diff origin/main --name-only` (samma metod som
`AMENDERING-2026-09-01` i denna katalog) gav ett SNÄVARE och ett BREDARE
resultat än uppdragets lista, båda värda att bokföra:

- **`s93-atgardssida-promovering`** bär `AtgardsSida.tsx` som `kallor` —
  ALDRIG `EventValjare.tsx` — trots att den fysiska ytan (åtgärdssidans
  eventväljare) faktiskt bär den nya default-formen. `AtgardsSida.tsx` finns
  inte i diffen (ingen kod ändrad i den filen; den ärver bara den nya
  defaulten). Per uppdragets egen regel ("amendering skrivs bara för de
  facit vars kallor-filer faktiskt rörs av diffen") kvalificerar den
  INTE. Katalogens tre ytor är dessutom låsta uteslutande via ariaSnapshot
  (`"bilder": []` på alla tre) — rollen/namnet/strukturen i triggerns
  `<AriaButton>` är oförändrad (samma `data-testid`, samma text, samma
  disabled-state), bara `className` bytte, så en ariaSnapshot kan strukturellt
  aldrig se skillnaden. Bekräftat körande: `tests/visual/atgardssida-
  promoverings-grind.spec.ts` — 40/40 gröna, båda viewports, efter ändringen.
- **`s100-atgardssidan-varv3`/`s100-atgardssidan-varv4`** är inte
  `facit.json`-manifest (bara `README.md` + PNG:er från designiterationen) —
  ingen kallor-korsläsning är möjlig, inget att amendera.
- **`s102-hem-konvergens`** har noll ytor vars `kallor` matchar
  `EventValjare.tsx`, `AtgardsSida.tsx` eller `BetalningsInkorg.tsx` — ordet
  "pill" i den filen syftar på en orelaterad räknar-pill (`RaknarChip`), inte
  eventväljaren. Ingen amendering.
- **`s108-dokumentytan`** (INTE namngiven av uppdraget) matchar
  kallor-kriteriet ordagrant — dess enda eventväljar-yta listar BÅDE
  `DokumentYta.tsx` OCH `EventValjare.tsx`. Manifestet är dock **inte
  stämplat**: `"godkand": null` på hela filen (dess egen `"lasning"`-text
  säger uttryckligen att TASK-309.8 AC #4 aldrig bockades och att stämpeln
  väntar Marcus egen kanal). AC #5 kräver en amendering per "stämplad yta" —
  ett ostämplat manifest har inget fruset facit att amendera (ADR-104 låser
  bara stämplade manifest), så ingen amendering skrivs här heller. Bokfört
  som funnen-men-utesluten divergens, inte tyst hoppad över.

Resultatet: av de FYRA kandidaterna uppdraget namngav plus den EN till
kallor-korsläsningen hittade, är **DENNA fil den enda amendering AC #5
kräver**.

---

## Vad som ändrades i `EventValjare.tsx`

1. **Default-värdet för `form`-propen** bytte från `'kontextrad'` till
   `'fristaende'`.
2. **`'kontextrad'`-formen revs helt**: typ-unionen (`'kontextrad' | 'rubrik'
   | 'fristaende'` → `'rubrik' | 'fristaende'`), dess unika render-gren
   (`rounded-full`, `px-3.5 py-2`, `text-small`) och docblocket. Grunden:
   `grep -rn 'form="kontextrad"' src/` gav noll träffar — över-engineering-
   vakten (en form utan konsumenter rivs).
3. **`storForm`-beräkningen** (`tomtLage || form === 'fristaende'`) föll bort
   — det finns bara EN icke-rubrik-form kvar, så villkoret är alltid sant i
   den grenen.

## Varför DENNA yta (`anmälningssidan`) är opåverkad, bit för bit

`AnmalningarSida.tsx:525` skickar **redan** `form="fristaende"` explicit
(sedan S111:s egen konvergens 2026-08-23 — se manifestets `"not"`-fält:
*"EventValjare i 'fristående'-form (dokumentsidans stora luftiga ruta, inte
kontextradens pill)"*). Konsekvensen av att ändra en DEFAULT rör bara anrop
som INTE redan skickar propen explicit — den här ytan gjorde det redan.

Klass-strängen för `'fristaende'`-grenen är dessutom BOKSTAVLIGEN OFÖRÄNDRAD,
före och efter (`git diff` visar strängen flyttad ut ur en ternary till en
ovillkorad `className`, aldrig omskriven):

```
flex w-full items-center gap-2.5 rounded-2xl border border-border bg-surface
px-4 py-4 text-body hover:bg-bg-muted motion-safe:transition-colors
```

Alltså: samma DOM-roll, samma tillgängliga namn, samma CSS-klasser, samma
pixlar. Bilderna
(`facit-anmalningssidan-lista-{desktop,mobil}.png`,
`facit-anmalningssidan-atgardskon-{desktop,mobil}.png`,
`facit-anmalningssidan-tomt-{desktop,mobil}.png`,
`facit-anmalningssidan-filterpanel-desktop.png`) är **inte omgenererade** —
det finns inget pixel-facit att regenerera eftersom inget pixel-värde ändras.

## Referenser (`"referenser": []`)

Samma läge som `AMENDERING-2026-09-01` dokumenterade: nyckeln bär en TOM
lista (deklarerad frånvaro, inte en odeklarerad lucka). Invariant (d) i
`scripts/check-facit.sh` har alltså ingenting att jämföra för denna yta —
grinden kan inte fälla på denna ändring, och detta dokument är BOKFÖRING, en
Marcus-läsbar not, inte en grind-tvingad sidofil.

```bash
node -e "console.log(require('./tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json').ytor[0].referenser)"
# []
```

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält i `facit.json` är rört.**
`godkand` står kvar med Marcus 2026-08-23-kvittens och SHA `cb7ad681`. Denna
yta beskrivs alltjämt korrekt av det manifestet — TASK-394-stämpeln
2026-09-05 gäller EventValjare-komponentens nya default för de ANDRA sex
anropsplatserna (åtgärdssidan, manuell anmälan), inte denna redan-
`fristaende`-yta.

`bash scripts/check-facit.sh` → körd före och efter denna fil skrevs, exit 0
båda gångerna (se PR-kroppens grindtabell).
