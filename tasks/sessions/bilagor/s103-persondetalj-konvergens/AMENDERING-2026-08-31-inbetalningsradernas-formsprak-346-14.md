# Amendering 2026-08-31 — Inbetalningsradernas hårlinjeform (TASK-346.14, ripple)

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` (Marcus
2026-08-12: *"D är den som gäller exakt som den ser ut och ska funka just
nu."*, stämpel-SHA `4648823a`). Skarp källa: `src/components/betalningar/
InbetalningsLista.tsx`, monterad i `PersonBetalningar.tsx`s
Betalningar-sektion (byggd av TASK-346.7,
`AMENDERING-2026-08-31-betalningar-sektionen.md`).

**Klass:** *ripple-ändring, samma B3-mandat som design-polish-skivan.*
`PersonDetail.tsx`/`PersonBetalningar.tsx` är INTE själva redigerade av
denna skiva — ändringen sitter i en DELAD komponent
(`InbetalningsLista.tsx`) som `PersonBetalningar.tsx` monterar oförändrat,
och den delade komponentens nya form syns därför här också.

---

## FÖRST

Samma icke-innehållslåsta läge som TASK-346.7:s egen amendering av denna
yta (`AMENDERING-2026-08-31-betalningar-sektionen.md` § FÖRST): `persondetaljen`
saknar `referenser`-nyckeln, och de fyra `.aria.yml`-referenserna under
`tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/` renderas
med miljöflaggan AV (Betalningar-sektionen visas därför inte i den
mekaniska grinden alls). `bash scripts/check-facit.sh` → exit 0, oförändrat.

## Vad som ändrades

`InbetalningsLista.tsx`s radform (designfynd 3d/4, delad av inkorgen,
anmälans detaljvy, Åtgärds-panelen OCH personkortet):

- Listcontainerns egna per-rad `rounded bg-bg-muted px-3 py-2`-kort är
  rivna. Raderna delar nu en `divide-y divide-border`-hårlinjelista, samma
  grammatik som `DetaljGrupp`s `EtikettVardeRad`.
- Varje rad delas i TVÅ underrader: en textrad (belopp/betalsätt/datum +
  kvittostatus) och en EGEN, högerställd handlingsrad (Visa/Skicka igen/
  Radera/Makulera) — tidigare låg knapparna inline i löptexten och landade
  på olika X-position beroende på textens längd.

Personkortets `PersonBetalningar.tsx` monterar `InbetalningsLista` OFÖRÄNDRAT
(`kalla={{ personId }}`) — ingen egen kod där ändrad, bara den delade
radformen den redan konsumerar.

## Vad som INTE ändrats

- **Härledningen** (`kvittolage`, `panel-harledningar.ts`) — helt orörd,
  bara presentationen av dess redan färdiga resultat.
- **`PersonBetalningar.tsx`s egna sammanfattningsrad och `RegistreraYta`** —
  oberörda av denna specifika ändring (knappbredden på `RegistreraYta`/
  `AterbetalningsYta` är en SEPARAT, redan bokförd fix — se
  `s93-atgardssida-promovering/AMENDERING-2026-08-31-design-polish-346-14.md`
  punkt 3, som gäller personkortet lika mycket eftersom komponenten delas).

## Testerna

`tests/e2e/persondetalj-betalningar-fellage.staging.test.ts` asserterar
`sektion.getByText(/1\s500\skr.*Swish/)` — en regex-substrängmatchning mot
`inbetalningsText(inbetalning)`s ORÖRDA sträng, i sin egen `<span>`. Radens
ombyggnad flyttar bara SIBLING-innehåll (handlingsknapparna) till en egen
rad under, texten den matchar är opåverkad. Ingen `InbetalningsLista`-rad
testas i e2e/acceptance med verkligt innehåll i personkorts- eller
Åtgärds-kontexten (mätt: `grep -rl InbetalningsLista tests/` ger tre filer,
ingen fyller radens knappar med verklig data i den kontexten).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står
kvar med Marcus 2026-08-12-kvittens och SHA `4648823a`. `bash
scripts/check-facit.sh` → exit 0, före och efter.
