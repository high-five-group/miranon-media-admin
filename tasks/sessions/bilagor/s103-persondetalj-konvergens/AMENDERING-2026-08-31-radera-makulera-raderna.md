# Amendering 2026-08-31 — Inbetalningsraderna får Radera/Makulera (TASK-346.9)

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` — variant D
(Marcus 2026-08-12: *"D är den som gäller exakt som den ser ut och ska funka
just nu."* / *"godkänner"*, stämpel-SHA `4648823a`). Skarp källa:
`src/components/persons/PersonDetail.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #1/#2.

---

## Samma grind-läge som `AMENDERING-2026-08-31-betalningar-sektionen.md` (TASK-346.7)

Den filen bokförde redan varför `check-facit.sh` inte fäller denna klass av
ändring (ytan saknar `referenser`) och varför det VISUELLA facit-lagret
(`tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/`) INTE
träffas: den klassen kör med `betalningarPa()` avstängd
(`playwright.config.ts` § `VITE_FEATURE_BETALNINGAR: 'av'`), så
`PersonBetalningar`-sektionen renderas inte alls i den mätningen. Samma
gäller denna skiva — den lägger inget nytt bakom en egen flagga, den lägger
till knappar INUTI en sektion som redan är villkorad på samma flagga.

## Vad som ändrades

`InbetalningsLista.tsx` (monterad av `PersonBetalningar.tsx`s "Senaste
inbetalningar", i sin tur monterad av `PersonDetail.tsx` § variant D) fick
två nya, villkorade rad-knappar:

- **Radera** — visas när inbetalningen saknar kvitto och är aktiv
  (`kanRadera`, `panel-harledningar.ts`). Öppnar en inline bekräftelse
  ("Radera denna inbetalning? Det går inte att ångra.") i stället för en
  modal.
- **Makulera** — visas när inbetalningen HAR ett kvitto och är aktiv
  (`kanMakulera`). Öppnar ett inline fält för skäl (obligatoriskt, samma
  längdgräns som `hantera-inbetalning/index.ts`).

Ingen av knapparna kan vara synlig samtidigt som den andra på samma rad
(`kanRadera`/`kanMakulera` är ömsesidigt uteslutande — tvåsidigt bevisat i
`tests/api/betalningar-ytor.test.ts` § "RADERA och MAKULERA är ALDRIG båda
sanna för samma rad").

## Vad som INTE ändrats

- Sektionens rubrik, sammanfattningstext, "Registrera betalning"-ytan,
  länken till inkorgen — allt orört.
- Raderna som redan visar "Makulerad: `<skäl>`" (byggda av `TASK-346.7`) är
  ORÖRDA i sin rendering — de nya knapparna döljs helt för en redan
  makulerad rad (`kanRadera`/`kanMakulera` blir båda falska), så en
  resolverad rad ser likadan ut som innan.
- B1–B8-blockordningen i persondetaljen — orörd.

## Testerna

`kanRadera`/`kanMakulera` är rena härledningar, hermetiskt provade i
`tests/api/betalningar-ytor.test.ts` (positivt och negativt per regel, PRD
DoD #5) — samma disciplin som `kvittolage` redan bär i samma fil.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-12-kvittens och SHA `4648823a`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
