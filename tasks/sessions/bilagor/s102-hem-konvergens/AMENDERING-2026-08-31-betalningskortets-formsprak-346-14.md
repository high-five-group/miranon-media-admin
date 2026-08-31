# Amendering 2026-08-31 — Betalningskortets formspråk (TASK-346.14)

**Yta:** `hem-vyn V1 "Lugna morgonen"` i
`tasks/sessions/bilagor/s102-hem-konvergens/facit.json`. Skarp källa:
`src/components/hem/BetalningarKort.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 13 (designfynd-doket
`tasks/sessions/bilagor/s113-natt-slutvandring/designfynd-2026-08-31.md`
§ 1a–1d)* — samma B3-mandatsklass som TASK-346.7:s egen amendering av samma
fil (`AMENDERING-2026-08-31-betalningar-kortet.md`), som denna sidofil
kompletterar utan att motsäga.

---

## FÖRST: samma icke-innehållslåsta läge som sibling-posten

`hem-vyn V1`-ytan **saknar `referenser`-nyckeln** (`check-facit.sh` namnger
den på stderr, oförändrat efter denna landning). Invariant (d) är därmed
inert för denna diff, och `scripts/check-facit.sh` kan inte fälla den — se
`AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST för mekanik-belägget,
som gäller identiskt här.

```bash
bash scripts/check-facit.sh   # exit 0, oförändrat före/efter
```

## Vad som ändrades

`BetalningarKort.tsx` (Betalningar-blocket, Morgonkollens fjärde block med
`VITE_FEATURE_BETALNINGAR` på) fick en kortyta och en nyckeltalshierarki som
kopierar formen sina grannblock — `NastaEvent`/`Genvagar` — redan bär, per
designfynd 1a–1d:

1. **Kortyta** (1a): sektionen är nu `rounded-2xl border-transparent
   bg-bg-muted px-4 py-4` — samma skal som `Genvagar.tsx`s
   `HandlingsRadKort` och `DetaljGrupp`s kort, INTE hero-kortets `bg-primary-tint`
   (den tonen är reserverad för Nästa event).
2. **EN primär CTA** (1b): "Registrera betalning" är inte längre en mörk
   fullbreddsknapp — den är NAVIGATION, och navigerar nu med
   `HandlingsRad`-primitivens form (samma primitiv `Genvagar.tsx` delar med
   eventsidan). Den enda kvarvarande fullbreddsknappen är "Skicka
   påminnelse till alla" (`BulkAtgardsknapp`, oförändrad, oförändrat villkorad
   på `harPaminnelser`).
3. **Nyckeltalshierarki** (1c): "N öppna" är nu display-storlek
   (`font-semibold text-3xl`, samma vikt som `NastaEvent`s eventnamn);
   förfallna/kvitton är en ikon-metadatarad under (`Clock`/`Mail`, samma
   `flex flex-wrap gap-x-6 gap-y-1`-grammatik som `NastaEvent`s ort/datum-rad)
   — inte längre en platt mening med tre tal.
4. **Overline** (1d): rubriken "Betalningar" är nu `font-medium text-caption
   uppercase tracking-wide` (samma klass som "NÄSTA EVENT"), inte längre en
   `text-2xl` sektionsrubrik.

**Kongruens-bonus, utöver de fyra punkterna:** "N öppna"/"N förfallna" böjs
nu efter tal (1 öppen/förfallen, N öppna/förfallna) — samma Gunilla-klass
kongruens som skivans språkfynd, gjord i förbifarten eftersom strängen ändå
skrevs om strukturellt. Ordvalen i sig ("öppna"/"förfallna"/"kvitton att
skicka") är ORÖRDA.

## Vad som INTE ändrats

- **Blockordningen** på Hem (Nästa event → Bevakningsrad → Nya anmälningar →
  Betalningar → Genvägar → Senaste aktivitet) — orörd.
- **`onSkickaPaminnelseAlla`/`harPaminnelser`-kontraktet** och
  påminnelsesvepets urval — orört, samma props, samma villkor.
- **Laddläges-/felläges-/tomtläges-anatomin** (`role="status"`/`aria-busy`,
  ETT `.sr-only`-besked, `CircleCheck`-kvittot vid noll öppna) — orörd
  logik, bara flyttad in i den nya kortytan (samma skäl `NastaEvent` alltid
  visar sin kortyta även i tomt läge).
- **`sammanfattaBetalningar`/`jobbDelutfall`** — härledningarna är helt
  orörda; bara PRESENTATIONEN av deras redan färdiga tal.

## Testerna

Ingen e2e-/acceptance-svit riktar sig mot `BetalningarKort.tsx` eller
`hem-betalningar` med miljöflaggan PÅ (mätt: `grep -rl "hem-betalningar"
tests/` ger endast `tests/api/betalningar-ytor.test.ts`, som testar
`sammanfattaBetalningar`s LOGIK, inte JSX:en). `svep-paminnelse-send.
acceptance.test.ts`s `BulkAtgardsknapp`-kontrakt (`role="button"`, namn
"Skicka påminnelse till alla") är oberört av kortytans flytt.

## Omstämplings-läge

**Inget är omstämplat.** `godkand`-fältet i `s102-hem-konvergens/facit.json`
står kvar orört. `bash scripts/check-facit.sh` → exit 0, före och efter.
