# Amendering 2026-08-17 — genvägarnas hover + etiketten "Gå till åtgärder"

**Pass:** task-273.2 (Skiva: Genvägarnas hover + etiketten "Gå till åtgärder"),
barn av PRD task-273 (UI-fixpaketet S107).

**Berört manifest:** `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`,
yta `hem-vyn V1 "Lugna morgonen"` (godkänd 2026-08-17, citat "Hem-vyn ser bra
ut, precis som prototypen.").

**Skäl för sidofilen:** ADR-102 B3/R3 kräver att avvikelser från ett låst
facit bokförs explicit i stället för att glida in tyst. Manifestets
`godkand`-fält är agent-fryst (ADR-104) — denna fil beskriver avvikelserna
och lämnar omstämpling till Marcus via `!`-kanalen; agenten skriver aldrig
`godkand` själv.

## De två avvikelserna

### 1. Genvägskortens hover

**Facit visar:** ingen synlig hover-bakgrundsändring på genvägs-raderna
("Lägg till manuell anmälan" / "Öppna Åtgärds-sidan") — `NavCard`-primitivens
M3-beslut (S64, "prövad och förkastad") var i kraft när bilderna togs
2026-08-16.

**Skarpt bygge visar (efter denna skiva):** genvägskorten bär nu samma
hover-grammatik som eventdetaljens åtgärdsrader (`Atgarder.tsx` `RAD_KLASS`)
och hem-vyns egen Bevakningsrad (`Bevakningsrad.tsx`, redan
`hover:bg-bg-emphasized motion-safe:transition-colors` sedan TASK-243.1) —
en synlig bakgrundsplatta (`--mm-bg-emphasized`) med mjuk övergång
(`motion-safe:transition-colors`, respekterar `prefers-reduced-motion`).

Insetten är INTE `Atgarder.tsx`s `-mx-2 px-2 rounded-lg`-form ordagrant:
`NavCard`s länk-element ÄR redan hela det rundade kortet (`rounded-2xl`,
egen bakgrund `--mm-navcard-bg`, egen padding `px-4 py-4`) — till skillnad
från `Atgarder.tsx`s `RAD_KLASS`, som är en rad INUTI ett separat kort och
därför behöver ett negativt-margin-trick för att plattan ska nå kortets
kant. `Bevakningsrad.tsx` löser samma `--mm-navcard-*`-formade kort utan
inset-trick — hovern läggs direkt på det befintliga rundade elementet. Den
synliga KONSTRUKTIONEN (platta + mjuk övergång) är densamma; det exakta
pixelvärdet för insetten är det inte, med avsikt (Genvägarna hade inget
inset-behov att lösa).

**Beslut:** Marcus omprövade M3-beslutet 2026-08-17 (uppdragstext till
byggagenten, task-273 implementationsbeslut 2 — "Det tidigare M3-beslutet
… RIVS ÖPPET på Marcus omprövning 2026-08-17"). Kodkommentaren i
`src/components/primitives/NavCard.tsx` är uppdaterad i samma commit så
trailen bokför rivningen i stället för att tystna om den (AC #2).

**Rörda filer:** `src/components/primitives/NavCard.tsx` (className +
kommentar), `docs/specs/DESIGN-SYSTEM-SPEC.md` §14 (facit-formens
hover-rad, hölls i synk med koden av samma skäl).

### 2. Genvägsknappens etikett

**Facit visar:** knappen heter "Öppna Åtgärds-sidan".

**Skarpt bygge visar (efter denna skiva):** knappen heter "Gå till
åtgärder" — matchar `AtgarderKort`s etikett på eventdetaljsidan
(`src/components/events/detail/Atgarder.tsx`), samma handling beskriven med
samma ord på båda ytorna.

**Beslut:** PRD task-273 användarberättelse 4 + implementationsbeslut
("Knappetiketten … byts till 'Gå till åtgärder'"). Ändrad i tre filer i
samma commit: `src/components/hem/Genvagar.tsx` (skarp yta),
`src/components/dev/hem-prototyp/ui.tsx` (facit-källan för dev-prototypen —
samma sträng, hålls konsekvent), `tests/acceptance/hem.acceptance.test.ts:851`
(strängläset test).

## Föreslagen omstämpling

Bilderna i `facit.json` (`facit-hem-v1-*-desktop/mobil.png`) är INTE
omtagna av denna skiva — de visar fortsatt den ohovrade, gamla-etiketterade
ytan och blir därmed en känd, dokumenterad avvikelse mellan bild och skarp
kod tills nästa bildtagning. De två avvikelserna ovan är de ENDA
avsiktliga avstegen från facit i denna skiva (DoD #5 — noll oplanerade
avvikelser).

Marcus väg framåt (via `!`-kanalen, `npm run facit:godkann`): antingen (a)
godkänna avvikelserna som en ny, mindre iteration av samma yta utan ny
bildtagning (fältet `lasning` kan uppdateras för att notera att bilderna nu
är en generation bakom kodens hover/etikett), eller (b) beställa en ny
bildtagning som fångar hover-tillståndet och den nya etiketten innan
manifestet stämplas om. Agenten tar inte detta beslut åt Marcus.
