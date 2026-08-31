# Amendering 2026-08-31 — Registrera återbetalning läggs till i betalningsblocket (TASK-346.9)

**Yta:** `atgarder-mottagarurval` och `atgarder-granskning` i
`tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` (Marcus
2026-08-11: *"ser okej ut"*, stämpel-SHA `efc4091aa4284d29246aa5a53bcd8f10d2250a04`).
Ytornas `kallor`: `src/components/events/atgarder/AtgardsSida.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #3.

---

## Varför denna fil finns

`AtgardsSida.tsx` monterar `PanelBetalningar` (tillkommen i `TASK-346.7`, se
`s93-atgardssida-promovering/AMENDERING-2026-08-31-lasande-kryss-och-betalningsblock.md`
och `s93-hallplats-prototyp/AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md`).
Denna skiva ändrar INTE `AtgardsSida.tsx` självt — filen som faktiskt ändras
är `src/components/betalningar/PanelBetalningar.tsx`, en komponent
`AtgardsSida.tsx` redan renderade innan denna skiva. Ändringen är ändå ett
NYTT synligt element i den stämplade ytans faktiska utseende, och
ADR-102-disciplinen ("varje ändring vars resultat syns under ett stämplat
facit bär en sidofil") gäller innehållet Lotta ser, inte bara listan
`kallor` råkar räkna upp. Divergensen bokförs därför här (`ADR-086`) i
stället för att tystas.

## Vad som ändrades

`PanelBetalningar.tsx` monterar nu `<AterbetalningsYta anmalanRecordId={anmalanRecordId} />`
direkt under den befintliga `RegistreraYta`-raden — en knapp, "Registrera
återbetalning", som öppnar ett eget formulär inline (belopp, betalsätt,
datum, kryssrutan "Skicka kreditkvitto" förbockad). Se `AterbetalningsForm.tsx`
och `AterbetalningsYta.tsx` för hela mekaniken.

**Knappen visas ALLTID, oavsett `rad`** — till skillnad från `RegistreraYta`
(som bara monteras när `rad !== null`, alltså när basen visar ett öppet
belopp). En återbetalning gäller ofta en anmälan som redan är FULLBETALD och
nu avbokas — precis det läge `rad` är `null` i. Se `AterbetalningsForm.tsx`s
docblock för det fulla resonemanget.

**Bakom `betalningarPa()` — orört villkor.** `PanelBetalningar` monteras bara
när flaggan är på (samma gate som hela betalningsblocket sedan `TASK-346.7`);
`AterbetalningsYta` ärver den gaten genom att bo INUTI den monterade
komponenten, precis som `RegistreraYta` redan gör. Ingen ny flagg-kontroll
behövdes.

## Vad som INTE ändrats

- `AtgardsSida.tsx` self — noll rader ändrade.
- Kryssen, noteringarna, saknas-beloppet, `InbetalningsLista`s befintliga
  Visa/Skicka igen-knappar — alla orörda.
- `atgarder-tomt-lage` (ingen event vald, panelen renderas aldrig) berörs
  inte alls.

## Grinden

`scripts/check-facit.sh` fäller inte detta (samma mätning som
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST:
ytorna saknar `referenser`-nyckeln). `bash scripts/check-facit.sh` → **exit 0**,
före och efter — ingen stämpel rörd.
