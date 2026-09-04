# Amendering 2026-09-01 — TRE ytor under hållplats-facitet berörda

**Ytor:** `atgarder`, `betalningar` och `register` i
`tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json` (Marcus 2026-08-10:
*"Ser bra ut"*, stämpel-SHA `e25efd05`). Skarpa källor, som de står i
manifestets `kallor`:

| Yta | Ändrad `kallor`-fil |
|---|---|
| `atgarder` | `src/components/events/atgarder/AtgardsSida.tsx` |
| `betalningar` | `src/components/events/detail/Betalningar.tsx` |
| `register` | `src/components/events/detail/Deltagare.tsx` |

Ytorna `anteckningar` och `gruppdynamik` är **orörda** (mätt: ingen av deras
`kallor` finns i `git diff --name-only main...HEAD`).

**Klass:** *ny form* — Marcus egna domar i iterationsloopen 2026-09-01 på
grenen `fix/hem-betalningskort-marcus-iteration`.

---

## FÖRST: samma icke-innehållslåsta läge, och en mätning som gjordes om

**Ingen av manifestets fem ytor bär `referenser`-nyckeln** (mätt 2026-09-01;
`check-facit.sh` namnger alla fem på stderr). Invariant (d) är inert, och
grinden kan inte fälla denna diff. Mekanik-belägget:
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter
```

**Touch-mängden är MÄTT, inte ärvd från uppdraget.** Uppdraget till detta
bokförings-pass namngav två kataloger (`s102-hem-konvergens` och
`s93-*`) och beskrev Åtgärds-sidans rivning. En körning av manifestens
`kallor` mot diffen fann **två ytterligare berörda ytor i just detta
manifest** — `betalningar` och `register` — plus två kataloger uppdraget inte
nämnde alls (`s103-persondetalj-konvergens`, `s111-anmalningssidan-konvergens`,
som har egna sidofiler). Samma klass av upptäckt som
`AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md` gjorde 2026-08-31
("Det är en katalog för lite"); divergensen rapporteras i stället för att
byggas vidare på (ADR-086).

---

## Ytan `atgarder` — samma ändring som systermanifestet, refererad

Ändringen i `AtgardsSida.tsx` är **densamma** som beskrivs i
`s93-atgardssida-promovering/AMENDERING-2026-09-01-pricka-av-vertikalen-riven.md`
— den upprepas inte här:

1. Pricka av-vertikalen (fällknappen, kryssen, "Ej relevant"-raden i sin
   gamla form) **riven** i flagg-PÅ-världen.
2. Sektionen bär i stället den delade `PanelBetalningar` — statuskort,
   Registrera betalning, Registrera återbetalning, inbetalningshistorik.
3. Noteringsfälten **bevarade**, utbrutna till `NoteringsFalt`.
4. "N saknar" flyttad till sektionsrubriken "Betalningar".

Allt fyra gäller **enbart** med `betalningarPa()` sann. Med flaggan av — prod
i dag — är filen byte för byte dagens.

**`src/components/events/detail/Atgarder.tsx` (ytans andra `kallor`-fil,
ingången från eventdetaljen) är helt orörd.** Ingen rad, ingen import, ingen
prop.

## Ytan `betalningar` — "Obekräftad" byter ton, resten står

`src/components/events/detail/Betalningar.tsx` har **en enda ändring**
(`7f2f11a7`): `StatusBadge ton="warning"` → `ton="neutral"` för pillen
"Obekräftad".

**Varför:** samma ord bar TRE former i appen samtidigt — kopparfärgad
`warning`-pill här och på anmälans detaljsida, och en handrullad RÖD span
(`bg-error-bg`/`text-error`) i deltagarregistret och på Åtgärds-sidan. Denna
fil bokförde konflikten redan 2026-08-06 (*"Ett ord, en färg, hela appen"*)
men konverterade bara sin egen yta. Regeln som nu gäller: **max en
varningssignal per rad** — `warning` reserveras för äkta brådska (Förfallen,
som behåller koppar och sin klocka), `neutral` bär ett tillstånd som har ett
eget flöde. "Obekräftad" är det NORMALA läget för en ny anmälan.

Mätvärden (WCAG 2, sRGB): `text-secondary` `#525151` på `bg-muted` `#f5f5f3`
= **7,25:1** ✓ AA. Den ersatta röda formen låg på 7,14:1 — ingen försämring.
WCAG 1.4.1 är oberörd av att ikonen utgår: texten bar alltid hela utsagan,
ikonen var `aria-hidden` dekor.

**Vad som INTE ändrats på denna yta, och som fortfarande är en öppen fråga:**
`BetalningsLasRad`s disablade kryss står kvar och bär härledningens spegel
(ADR-128 beslut 5). Höger-slotten "Saknas" är fortfarande riven på Marcus
order 2026-08-06, och det negativa beviset håller:

```ts
// tests/e2e/mark-paid.staging.test.ts:461
await expect(arbetsytan(page).getByText('Saknas', { exact: true })).toHaveCount(0);
```

**Terminologi-svepet rörde inte denna yta, och kan inte göra det.** Bytet
"Saknas" → "Kvar att betala" (`776250a8`) gäller de ytor som FAKTISKT visar
ett restbelopp; här finns inget sådant belopp att döpa om, eftersom slotten är
riven. Den öppna frågan från
`AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md` § Systerytan
kvarstår därför oförändrad: räcker de disablade kryssen som "härlett läge
läsande" på eventsidan, eller vill Marcus ha ett belopp just där — och i så
fall som en NY form, inte som en återställning av den rivna slotten?

## Ytan `register` — den röda "Obekräftad"-pillen riven

`src/components/events/detail/Deltagare.tsx` (`7f2f11a7`): den handrullade
röda pillen

```tsx
<span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
```

är ersatt av `<StatusBadge ton="neutral" storlek="sm">`. **Rött sade "fel har
inträffat" om något som inte är ett fel** — en obekräftad anmälan är det
normala läget med ett eget bekräftelseflöde.

**En mätning som INTE skrevs om utan ommätning, bokförd i filen själv:** kortets
pill-slot är 7,5 rem = 120 px, dimensionerad efter uppmätta naturliga
bredder ("Från väntelistan" 110,95 · "Manuellt tillagd" 107,42 ·
"Medföljande" 90,09 · "Obekräftad" 82,67). Obekräftad-talet är nu **~2 px
lågt**, eftersom `StatusBadge` bär `border border-transparent` — den
reserverade pixeln som gör att `contrast-more` inte hoppar. Marginalen till
120 px är oförändrat god, så slot-bredden är **inte** rörd; talet står kvar
med sin avvikelse noterad i stället för att skrivas om utan ommätning.

**Vad som INTE ändrats i registret:** steg-märkets företräde framför pillen
(`hallplatsMarke`), markerings-kortets form, radhöjder, det avsiktliga
390-px-beteendet där två pillar staplas. Bara pillens ton och anatomi.

## Ytorna `anteckningar` och `gruppdynamik`

Orörda, mätt. Ingen fil under deras `kallor` finns i diffen.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-10-kvittens och SHA `e25efd05`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
