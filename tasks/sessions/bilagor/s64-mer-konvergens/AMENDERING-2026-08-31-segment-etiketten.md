# Amendering 2026-08-31 — Mer-flikens etikett döps om (TASK-348)

**Yta:** Mer-landningen (`/mer`), M6-facitet låst i S64 Del 3
(`tasks/sessions/archive/2026-07/2026-07-12-session-64.md`, Marcus: *"Vi kör på
detta. Vi låser."*). Källa: `src/routes/_authenticated/mer/index.tsx:116`.

**Klass:** ren etikett-ändring — S114 Del 1 väg A punkt 1 (Marcus S114-scope
punkt 1, kvitterad 2026-08-31), `TASK-348`.

---

## FÖRST: samma icke-manifest-läge som `AMENDERING-2026-08-31-betalningar-raden.md`

Denna katalog (`s64-mer-konvergens`) bär **inget `facit.json`** — mätt på
denna gren:

```bash
find tasks -name 'facit.json'    # 16 träffar, ingen under s64-mer-konvergens
ls tasks/sessions/bilagor/s64-mer-konvergens/
# AMENDERING-2026-08-31-betalningar-raden.md  m6-facit-desktop.png
# m6-facit-mobil.png  steg-m1-baslinje.png … steg-m6.png
```

Skälet är samma som sibling-amenderingen ovan redan bokfört samma dag:
konvergens-passet (S64, 2026-07-12) föregick facit-manifestets mekanik
(`ADR-102`/`ADR-104`), så Mer-ytan blev aldrig ett STÄMPLAT facit i den
mekanismens mening. `.facit-policy.conf`s `FACIT_BILD_GLOB="facit-*"` matchar
inte `m6-facit-*.png` (fel prefix), så invariant (a) fyrar aldrig för
katalogen — mätt oförändrat efter denna ändring:

```bash
bash scripts/check-facit.sh   # exit 0
```

**Följden är densamma som sibling-posten drog:** inget manifest att amendera,
ingen `godkand`-stämpel att respektera, ingen `referenser`-hash att
uppdatera. `ADR-104`-hooken har ingenting att neka här. Detta dokument är ren
bokföring, inte den grind-tvingade sidofil `ADR-102` § A3 beskriver — formen
följs ändå av samma skäl sibling-posten anger: nästa läsare av katalogen ska
hitta ändringen där den letar.

---

## Vad som ändrades

**Endast etiketten**, på `NavCard`-raden i grupp 2 (handling/verktyg),
FÖRSTA raden i den gruppen — positionen och routen är oförändrade:

```tsx
<NavCard to="/mer/segment" icon={Filter} label="Segment" />
```

Tre strängföljder i samma commit (samtliga historiska referenser till den
gamla etiketten i `src/` och `tests/` — grep bekräftar noll kvarvarande
förekomster i båda katalogerna efter ändringen):

1. `src/routes/_authenticated/mer/index.tsx` — filhuvudets ikon-motivering
   (rad ~40) och Betalningar-radens ikon-kommentar (rad ~102), båda
   omformulerade för att inte längre citera den gamla etiketten ordagrant
   (samma AC #2-krav som gäller `src/` i sin helhet, ingen "kommentar"-
   dispens).
2. `tests/e2e/mer-index.staging.test.ts` — filhuvudets "TILLKOM"-not (rad
   ~44), gruppuppräkningens kommentar (rad ~249) och `toHaveText`-
   assertionen (rad ~264), med en footnote i SAMMA form som T176-precedentet
   för "Dokument" → "Bilagor" strax under (rad ~265).
3. `tests/acceptance/mer-segment.acceptance.test.ts` — filhuvudets historiska
   beskrivning av den RIVNA `SegmentBuilder`-ytans EGEN, separata sidrubrik
   (rad ~19). Detta är INTE samma referent som NavCard-etiketten — det är den
   gamla, numera avlägsnade prototyp-sidans eget `<h1>` — men bar exakt samma
   ord och föll därför under AC #2:s bokstavliga grep-krav. Omformulerad för
   att bevara den historiska sakuppgiften (den sidan HETTE så) utan att
   återge frasen ordagrant.

## Klassning: **(c)-analog** — texten ändras faktiskt, användar-synligt, i ALLA miljöer

`ADR-102` § A2 steg 2: **Ja**, ändringen påverkar vad en användare ser i
prod — etiketten är ovillkorlig (ingen miljöflagga, till skillnad från
Betalningar-radens `betalningarPa()`-gate), så varje besökare på `/mer` ser
den nya texten från och med denna landning i samtliga miljöer.

Skillnaden mot en riktig klass (c) enligt `ADR-102` § A1 är att steg 1 aldrig
blir aktuellt: det finns ingen `godkand`-stämpel att pröva `null` mot (se
§ FÖRST ovan), så det finns heller ingen omstämpling att lämna till Marcus
kanal. Klassningen görs ändå här, utskriven, i linje med `TASK-348` AC #3:s
krav ("Ev. berörda facit-referenser amenderade per ADR-102 med utskriven
klassning") — spirit-uppfyllelse av en mekanism som formellt inte har något
att haka i för denna specifika, manifestlösa yta.

## Vad som INTE ändrats — mekaniskt mätt, inte resonerat

`tests/e2e/mer-index.staging.test.ts` låser Mer-listans form och är
uppdaterad i samma commit. Det som står kvar orört:

- **Tre grupper**, elva rader totalt — oförändrat räknat.
- **Grupp 1:s ordning och innehåll** (Anmälningar, Väntelista, Intresserade,
  Maillogg, Aktivitetshistorik, Betalningar) — orört.
- **Grupp 2:s ORDNING** (Segment, Bilagor, Eventinnehåll, Platser) — orört;
  endast den FÖRSTA radens TEXT bytt, positionen och `to="/mer/segment"` är
  identiska med före.
- **Grupp 3** (Installera appen) — orört.
- **Radanatomin, ikonen (`Filter`, oförändrad), måtten, chevron-regeln,
  Logga ut-blocket, frånvaron av en Inställningar-post** — samtliga orörda;
  ingen av dessa rör en strängföljd av etikettbytet.

**PNG-dumparna i katalogen är redan en generation bakom** (dokumenterat av
sibling-amenderingen: de visar tio rader, från FÖRE Betalningar-raden) och
blir nu en till: de visar fortfarande texten "Bygg segment" på den rad som i
koden sedan denna landning heter "Segment". De förblir korrekta referenser
för allt annat (gruppering, radanatomi, chevron-regel, typografi, mått) —
samma undantag sibling-posten redan gjorde för sin egen radtillökning.

## Omstämplings-läge

**Inget att stämpla om** — samma skäl som sibling-posten: ytan bär inget
manifest och därmed ingen stämpel. `scripts/check-facit.sh` är oförändrat
grönt efter denna ändring, mätt på denna gren (se § FÖRST ovan).
