# Amendering 2026-08-31 — Registrera återbetalning i hållplats-facitets betalningsblock också (TASK-346.9)

**Yta:** `atgarder` i `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json`
(Marcus 2026-08-10: *"Ser bra ut"*, stämpel-SHA `e25efd05`). Ytans `kallor`:
`src/components/events/detail/Atgarder.tsx` **och**
`src/components/events/atgarder/AtgardsSida.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #3.

---

## Samma ändring, samma divergens-skäl som systerkatalogen

Ändringen är IDENTISK med den som beskrivs i
`s93-atgardssida-promovering/AMENDERING-2026-08-31-registrera-aterbetalning.md`
— den upprepas inte här i sin helhet. Sammanfattat: `PanelBetalningar.tsx`
(monterad av `AtgardsSida.tsx`, som är denna ytas `kallor`) fick en ny knapp,
"Registrera återbetalning", bakom samma `betalningarPa()`-flagga som resten
av betalningsblocket. `src/components/events/detail/Atgarder.tsx` är HELT
ORÖRT — den filen bär ingången till åtgärderna från eventdetaljen, inte
betalningsblocket, och `TASK-346.7`s egen AMENDERING-fil
(`AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md`) bokförde redan
samma avgränsning för `RegistreraYta`.

## Omstämplings-läge

Inget är omstämplat, och inget stämpel-fält är rört. `godkand` står kvar med
Marcus 2026-08-10-kvittens och SHA `e25efd05`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
