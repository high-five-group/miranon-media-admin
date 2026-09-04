# Amendering 2026-09-04 — Tomlägets yta: vit platta med streckad ram

**Yta:** `segment-startsidan` i
`tasks/sessions/bilagor/s114-segmentlistan-konvergens/facit.json` (`godkand:
null` — S117-passets tre konvergensvarv, ej ännu Marcus-stämplat i sin
helhet). Ändrad `kallor`-fil: `src/components/segment/prototyp/VariantD.tsx`
(skarpa vyn — B2-flippen, `TASK-379`, promoverade K3-formen dit; manifestets
egen `kallor`-lista pekar fortfarande på prototypfilen
`SegmentListaKonvergens.tsx`, se § Vad `check-facit.sh` faktiskt kan se
nedan).

**Klass:** *ny form* — Marcus egen dom 2026-09-04, S120, på draft-PR #2308
(`feat/segment-tomlage-textur`). Ändringen sitter i skarpa `VariantD.tsx`,
inte i prototypen `SegmentListaKonvergens.tsx` — samma "delad primitiv/skarp
fil rörd, prototyp orörd"-mönster som
`s111-anmalningssidan-konvergens/AMENDERING-2026-09-01-...md` etablerade.

**Ursprungsfrågan (Marcus, 2026-09-04, S120 Del 1 punkt 2, verbatim):**

> "Om du tittar på Segmentsidans startsida … borde inte hela 'Inga sparade
> segment än-blocket' ha en bakgrund? Typ en bakgrund med lite 'textur' så
> det ser proffsigt och snyggt ut?"

Facit.json rad 14 (ytans `not`-fält) sade vid frågans ögonblick: *"tomläge:
'Inga sparade segment än' + text + kapseln 'Skapa ditt första segment',
**ingen grå låda**"* — alltså ett uttryckligt neutralt tomläge, låst av
S114 beslut 3. Frågan öppnade därför en facit-amendering, inte en tyst
ändring.

---

## Iterationshistoriken — två varv i webbläsaren, båda Marcus-dömda

### v1 (underkänd): dot-grid-textur ovanpå `KORT_KLASS`

Container: `KORT_KLASS` (samma tonala grå som "Färdiga grupper"-korten,
`rounded-2xl border border-transparent bg-bg-muted px-4
contrast-more:border-border-strong`) plus en ny komponent-token
`--mm-tomlage-textur` i `components.css` — en `radial-gradient`-dot-grid,
punktfärg `color-mix(in srgb, var(--mm-text) 8%, transparent)`, upprepad var
20:e pixel (`bg-(image:--mm-tomlage-textur) bg-size-[20px_20px]`), med
`contrast-more:bg-none print:bg-none`-fallback.

Marcus dom (verbatim, 2026-09-04):

> "Gillar inte bakgrunden med prickarna. Och jag tycker den är för grå
> liksom, bör vara en ljusare variant så ytan skiljer sig från alla andra
> gråa saker på sidan."

Två fel i ett: (1) texturen i sig, (2) `bg-bg-muted` är exakt samma ton som
"Färdiga grupper"-korten på samma sida — blocket skilde sig alltså INTE från
"alla andra gråa saker", trots att det var hela poängen med en egen yta.

### v2 (stämplad): vit `bg-surface`-platta med streckad ram

Texturtokens (`--mm-tomlage-punkt`, `--mm-tomlage-textur`) **rivna helt** ur
`components.css` — inga döda tokens kvar (verifierat: `grep -rn
"mm-tomlage" src/` träffar bara förklarande kommentarer i `VariantD.tsx`,
ingen faktisk användning).

Ny container, literal Tailwind-klasslista (inte längre `KORT_KLASS` — den
delas med "Färdiga grupper"-korten och skulle ha återfört exakt den ton
Marcus bad om att skilja sig från):

```text
flex flex-col items-center gap-2 rounded-2xl border border-border
border-dashed bg-surface px-4 py-10 text-center
contrast-more:border-border-strong
```

- **`bg-surface`** (→ `--mm-surface` → `--p-neutral-0`, vit) — samma yta
  `InbetalningsLista.tsx` och `PersonDetail.tsx` redan bär för att skilja sig
  från en tonal grå granne, i stället för en ny token.
- **`border border-dashed border-border`** (→ `--mm-border`,
  `--p-neutral-200`) — den streckade ramen ÄR tomläges-affordansen, i
  stället för en bakgrundston. Samma mönster Tailwind UI och GitHub Primer
  Blankslate använder för "detta är en tom platshållare, inte ett fel"
  (källor: PR #2308:s kropp, § Research).
- **`rounded-2xl`** — husets kort-radie, oförändrad från v1/`KORT_KLASS`.
- **`py-10`** — oförändrad från v1 (`px-4` behållet från `KORT_KLASS`,
  skrivet ut literalt nu eftersom containern inte längre delar klassen).
- **`contrast-more:border-border-strong`** (→ `--mm-border-strong`,
  `--p-neutral-300`) — samma härdning `KORT_KLASS` redan gav, bevarad.

Ingen ny komponent-token behövdes: `--mm-border`/`--mm-border-strong` fanns
redan i `semantic.css` och mappar till Tailwind-klasserna `border-border`/
`border-border-strong` via `tailwind.css`s `@theme`-block
(`--color-border: var(--mm-border)` osv).

Marcus STÄMPEL (verbatim, 2026-09-04):

> "Agenten har redan byggt om. Nu blev det en streckad kontur bara. Ser
> jättebra ut. Kör på den."

Text och kapsel ("Inga sparade segment än" / brödtexten / "Skapa ditt första
segment") är BYTE-IDENTISKA genom båda varven — ordvalet var redan stämplat
före denna amendering och rördes aldrig.

---

## Vad som ändrats mot facit.json rad 14

Facitets `not`-fält sade *"tomläge: ... ingen grå låda"*. Skarpa vyns
tomläge har nu en egen yta — men INTE en grå låda: en vit (`bg-surface`)
platta med streckad kant, medvetet vald för att INTE vara ännu en grå ton på
sidan. Amenderingen är alltså en precisering av "ingen grå låda", inte en
rivning av principen — tomläget är fortfarande neutralt, bara med en
avgränsad yta i stället för att stå direkt på sidans bakgrund.

`facit.json` självt är **orört** av denna amendering — `godkand`-fältet ägs
av stämpel-PR #2293, inte av detta dokument (samma gräns
`s111`-amenderingen och `s93`-amenderingen redan höll).

---

## Bilder

Nya skärmdumpar av v2-formen, tagna mot den hermetiska fixturvärlden
(`tests/support/fixturvarld/hermetic.ts`; `get-segments` defaultar till
`{ segments: [] }`, så tomläget kräver ingen extra mockning):

- `segmentlistan-tomlage-v2-desktop.png` — 1440×900 (`visual-desktop`,
  `deviceScaleFactor: 2`)
- `segmentlistan-tomlage-v2-mobil.png` — 375×812 (`visual-mobile`,
  `deviceScaleFactor: 2`)

**Namngivning, avvikelse från uppdragets förslag — mätt, inte antaget:**
uppdraget föreslog `facit-segmentlistan-tomlage-{desktop,mobil}.png`. Det
namnet trippade FAKTISKT `check-facit.sh` (`scripts/lib/facit-validera.mjs`
§ "Föräldralösa facit-bilder", R4): `.facit-policy.conf`s `FACIT_BILD_GLOB=
"facit-*"` flaggar VARJE fil i katalogen som börjar på `facit-` som en
orphan-bild om den inte är deklarerad i manifestets `bilder`-lista — mätt
`exit 1` med den föreslagna namngivningen. Uppdraget bär samtidigt TVÅ
formella AC (`TASK-392` #2 och #3): "facit.json orört" och "check-facit
passerar" — dessa kan inte båda hålla med `facit-`-prefixade, odeklarerade
filer. Jag löste konflikten till förmån för de skrivna AC (kortets
landningskontrakt väger tyngre än den friare formulerade
uppdragstext-namngivningen) genom att döpa bilderna UTAN `facit-`-prefix i
stället för att lägga till dem i manifestets `bilder`-lista. Bilderna
ersätter INTE `facit-segment-listan-tomlage.png` (facitets egen, stämplade
K3-bild av PROTOTYPENS tomläge — orörd) utan dokumenterar SKARPA vyns nya
v2-form vid sidan av.

---

## Vad `check-facit.sh` faktiskt kan se

```bash
bash scripts/check-facit.sh
```

**Exit 0**, verifierat efter namn-korrigeringen ovan (mätt två gånger: en
första körning med de `facit-`-prefixade filnamnen gav `exit 1` med FEL-rad
"matchar facit-mönstret men är inte deklarerad"; efter döpningen gav samma
kommando `exit 0`, ingen FEL-rad för `s114-segmentlistan-konvergens/
facit.json`). Grinden validerar fyra invarianter (manifest-adresserbarhet,
struktur-konsistens disk↔manifest, prototyp-markörer orörda så länge
`godkand: null`, och för STÄMPLADE manifest ett content-lock via
`referenser[].sha256`). `s114-segmentlistan-konvergens/facit.json` har
`godkand: null` — invariant (c)/(d) är alltså inaktiva för denna yta (ingen
`referenser`-nyckel finns i ytans objekt, och prototyp-markören `"K3 -
brickor, korthöjd låst"` i `src/routes/_authenticated/mer/segment.tsx` är
oförändrad, verifierat med `grep -n "K3 - brickor" src/routes/_authenticated/
mer/segment.tsx`). Grinden ser att katalogen är strukturellt hel, men den
kan INTE se att v2-formen faktiskt matchar det som är i koden — det är
precis det denna amendering bokför i stället.

---

## Vad som INTE ändrats

- **Rubrik, brödtext, kapseltext** i tomläget — orörda, stämplade sedan
  tidigare.
- **`KORT_KLASS`** som konstant — orörd (fortfarande använd av "Färdiga
  grupper"-korten och `Personer i publiken`-listan m.fl.); tomläges-blocket
  slutade konsumera den, men definitionen är intakt.
- **Prototypfilen `SegmentListaKonvergens.tsx`** — orörd; formen bor i
  skarpa `VariantD.tsx` sedan B2-flippen (`TASK-379`), i linje med
  `ADR-103`.
- **`facit.json`** — orört, `godkand` fortsatt `null`.
- **ariaSnapshot-referenserna** i `segment-promoverings-grind.spec.ts` — 14/14
  gröna, ingen drift (en bakgrunds-/ramändring på en `<div>` tillför ingen ny
  landmark till a11y-trädet).

## Omstämplings-läge

Inget stämpel-fält är rört. `s114-segmentlistan-konvergens/facit.json`s
`godkand` står kvar som `null` — den övergripande S114-stämpeln väntar
fortfarande, oberoende av denna amendering.
