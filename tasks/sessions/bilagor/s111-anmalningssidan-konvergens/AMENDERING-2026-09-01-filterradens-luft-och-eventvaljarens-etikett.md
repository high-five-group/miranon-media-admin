# Amendering 2026-09-01 — FilterRad: mer luft, och "Event"-rubriken sr-only

**Yta:** `anmälningssidan` i
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json` (Marcus
2026-08-23: *"Ser bra ut"*, stämpel-SHA `cb7ad681`). Ändrad `kallor`-fil:
`src/components/primitives/FilterRad.tsx`.

**Klass:** *ny form* — Marcus egna domar 2026-09-01 på grenen
`fix/hem-betalningskort-marcus-iteration`. Domarna föll medan han tittade på
**betalningssidan**; ändringarna sitter i den DELADE primitiven och träffar
därför anmälningssidan också.

**Varför denna fil finns:** bokförings-uppdraget nämnde inte denna katalog.
En körning av samtliga `facit.json`-manifests `kallor` mot
`git diff --name-only main...HEAD` fann `FilterRad.tsx` här. Sidofilen skrivs
därför, och divergensen rapporteras i stället för att byggas vidare på
(ADR-086) — samma klass av upptäckt som
`s93-hallplats-prototyp/AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md`
gjorde 2026-08-31.

---

## FÖRST: ytans `referenser` är en TOM lista — innehållslåset är inert

Denna yta är en av de fyra som **bär** nyckeln `referenser` (till skillnad
från de 23 som saknar den), men värdet är `[]` — mätt 2026-09-01:

```bash
node -e "console.log(require('./tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json').ytor[0].referenser)"
# []
```

Invariant (d) har alltså **ingenting att jämföra** för denna yta, och
`scripts/check-facit.sh` kan inte fälla diffen. Läget skiljer sig från de
övriga katalogerna i detta bokförings-pass i FORM (nyckeln finns) men inte i
VERKAN (inget lås). Skillnaden är värd att se: den som söker efter "saknar
innehållslås" på grindens stderr hittar **inte** denna yta, och kan därför tro
att den är låst.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter
```

Detta dokument är **bokföring**, inte en grind-tvingad sidofil.

---

## Vad som ändrades i primitiven

### 1. `gap-2` → `gap-4` mellan kontrollen och tratt-ingången (`5076ec44`)

Marcus dom (om betalningssidan): *"Mer luft mellan sökrutan och
filter-ikonen."* Sökfältet är en fullbredds-låda med synlig kant och tratten
en rund platta — 8 px mellan dem läste som att de satt ihop. 16 px är nästa
steg i 4 px-basen.

**GÄLLER ALLA `FilterRad`-KONSUMENTER**: betalningssidan, anmälningssidan och
eventlistan. Det är avsikten — samma kontroll ska se likadan ut överallt — men
det gör ändringen bredare än den yta Marcus tittade på. Bokfört i koden; en
yta-lokal variant vore en ratt utan efterfrågan, och en lätt tuning till
`gap-3` är öppen om Marcus vill det.

**Facit-bilderna påverkas:** `facit-anmalningssidan-lista-desktop.png` och
`-mobil.png` visar sökraden med den gamla 8 px-luften. Bilderna är **inte**
omgenererade (stämpeln är Marcus egen och rörs aldrig av en agent); avvikelsen
bokförs här i stället.

### 2. Kontroll-dimensionens etikett blir `sr-only` (`f92cd6a3`)

Marcus, ordagrant: *"ta bort rubriken 'Event' över eventväljaren … på
komponenten, den behövs inte på anmälningssidan heller"* — alltså på
PRIMITIVEN, uttryckligen så att den försvinner på båda ytorna samtidigt.

```diff
- <span className="text-(color:--mm-input-label-text) text-small">{dim.etikett}</span>
+ <span className="sr-only">{dim.etikett}</span>
```

**BARA DEN VISUELLA RUBRIKEN GÅR.** Texten står kvar i tillgänglighetsträdet,
så en skärmläsare som läser panelen i ordning fortfarande hör vilken axel
kontrollen gäller. Det är också varför det **inte** är en a11y-regression:
spannet var aldrig ett `label`-element och namngav aldrig kontrollen
programmatiskt — `EventValjare` bär sitt eget tillgängliga namn. Det som tas
bort är exakt den visuella dubbleringen.

**Endast kontroll-dimensionen, inte dropdown-dimensionerna.** Skälet står i
koden: en `Select` visar bara sitt VALDA värde ("Kurs"), medan `EventValjare`s
stängda trigger säger vad den är ("Alla event", eller eventets namn med ikon).
Rubriken upprepade alltså vad kontrollen redan sa — vilket bara gäller den
senare.

**INGA SNAPSHOTS ELLER TESTER BEHÖVDE UPPDATERAS, disk-verifierat vid
ändringen:**

- anmälningssidans sex aria-snapshots fångar bara `button "Visa filter"`
  (panelen är stängd i alla sex);
- den enda testen som öppnar panelen
  (`anmalningssidan-promoverings-grind.spec.ts:369`) är en axe-koll utan
  screenshot/ariaSnapshot, och `sr-only` ger inga axe-överträdelser;
- `filter-event`-testid:t och dess `toBeVisible` i
  `mer-anmalningar-form.acceptance.test.ts:795` är oberörda;
- aktivitetshistoriken har en EGEN lokal `FilterRad` (Select-baserad) och
  påverkas inte.

`facit-anmalningssidan-filterpanel-desktop.png` visar den öppna panelen med
den synliga "Event"-rubriken och är alltså överspelad på samma villkor som
bilderna ovan.

## Vad som ändrades UTANFÖR manifestets `kallor`

`src/components/registrations/AnmalningarSida.tsx` fick `-mx-4` på sin
`FilterRad` (`8dd1ec28`, Marcus: *"hela listan är för smal, det ska vara lika
bred som menybaren … även på anmälnings-sidan"*). Filen är **inte** `kallor` i
detta manifest — ytan låstes mot prototypen (`dev/anmalningar-prototyp/VariantB.tsx`)
plus primitiven — men den syns på den skarpa sidan och bokförs därför:

Mätt först, felet låg en nivå under bredd-auktoriteten: `<main>` bär
`max-w-[600px] px-4` ⇒ inre kolumn 568 px, `TabBar` bär `max-w-[568px]` och
speglar den pixel för pixel. Anmälningssidans LISTA flydde redan med `-mx-4`;
dess FILTERRAD gjorde det inte, och stod därför **32 px smalare än listan den
filtrerar**. `-mx-4` tar bort exakt det andra padding-lagret och aldrig det
första — ingen ny hårdkodad siffra införs.

`FilterRad` själv är korrekt bredd-agnostisk (`flex flex-col`, ingen egen
`max-w`) och exponerar redan `className` på roten; bredd-beslutet hör hos
konsumenten och lämnades där.

**AVVIKELSE ATT VETA OM:** sidrubriken och tomlägena ligger kvar på 536 px.
Det är anmälningssidans befintliga form (lista 568, rubrik 536), och Marcus
pekade ut listan och filtreringen — inte rubriken.

## Vad som INTE ändrats

- **Tratt-ingångens egen form** (öppen/aktiv bär `bg-text`-svärtan, facit
  k02; badgen är `aria-hidden` och `sr-only`-namnet bär antalet) — orörd.
- **Panelens rutnät, "Rensa filter"-vägen, fokusflytten till tratt-knappen** —
  orörda.
- **Radanatomin** (`InitialAvatar`, namnet som helrads-länk, chevron 18 px)
  och statusernas form — orörda. Anmälningssidans radanatomi-golv
  (namnkolumn ≥ 80 px, `mer-anmalningar-form.acceptance.test.ts`) är inte rört:
  listans bredd är oförändrad, bara filterraden växer.
- **`EventValjare.tsx`** — orörd fil.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-23-kvittens och SHA `cb7ad681`. Facit-bilderna är
**inte** omgenererade — se noterna ovan om vilka två av dem som visar överspelad
form.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
