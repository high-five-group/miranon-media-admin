---
owner: marcus803
updated: 2026-07-08
review_by: 2026-10-08
status: stable
---

# Execute-log — Airtable-avstämning maj-2026-eventen (Session 60)

> Auktoritativ, kronologisk logg över de **prod-basskrivningar** (`app8uGPrVCVOm6LfD`)
> som utfördes under Session 60 för att stämma av tre genomförda maj-2026-event mot
> faktiska deltagarlistor. Airtable-skrivningar lever i basen, inte i git — denna fil
> är deras enda spårbara artefakt. Systemförståelsen (automationer, fält, fällor)
> bor i [`../reference/data-model.md`](../reference/data-model.md); denna fil bär
> *vad som faktiskt gjordes, i vilken ordning, och med vilken verifiering*.

## Syfte och pivot

Roger & Lotta genomförde tre event vintern/våren 2026 vars deltagare aldrig
avstämts i basen (alla Deltaganden `Ej avstämt` → osynliga för närvaro-gated
segment). Målet: få basen att spegla den **faktiska närvaron** så att
segment-export (Skool-inbjudan via Resend) blir korrekt. Segment-medlemskap är
**källäst** ur Deltaganden (Kursnamn × Typ × `Status = Närvarande`), så
Deltagande-`Status` är den operativa sanningen.

| Event | EventKey | Record | Typ | Deltagarkälla |
|---|---|---|---|---|
| Fjärrskådning, Varberg 14–15 maj | Event-18 | `recvh6QMOkWPDWzJV` | Utbildning | Xlsx-flik (Roger) |
| Resor i medvetandet 1, Varberg 16–17 maj | Event-19 | `reci8SJAdRhSzpWYA` | Utbildning | Xlsx-flik (Roger) |
| Psionautics, Ödeshög 1–3 maj (labeln "Medveten Kontakt" i historiska dok) | Event-17 | `recQ2TPsY69fQXA8a` | Utbildning | CSV-anmälningsexport (Lotta) |

## Fas 4–5 — FJS + RIM1 (Event-18/19), 2026-07-08

Källa: `~/Downloads/2026-06-24 uppdaterade deltagare.xlsx` (2 flikar). GRIND 1
(A/B/C-klassning) Marcus-godkänd före skrivning.

- **20 walk-in-anmälningar skapade** (Marcus, Airtable Scripting; `Från formulär =
  Backfill (historisk)`, Status Obekräftad, ID 916–935). 18/20 rena (Person + 2
  Deltaganden via A3). 2 kantfall fixade via MCP:
  - **Jasmin Haghighi** (namnlös lead `recdea3cmbLQ3kTE8`): A2 Gren 1 fyllde namnet
    men hoppade Gren 2 (länken) → anmälan `recvl22JvgJVyd6TQ` okopplad, 0 Deltaganden.
    Reverse-flow-kompensation: `Anmälan.Person` satt → A3 triggade → 2 Deltaganden.
    **Bekräftar data-model fälla 21 / A2-decision-hypotesen live** (ej bara i script-scenario).
  - **Lene Hay** (dubblett-Person, case-e-post-bug): A2 matchar rå `E-post`
    (`fldcd5HnYooVZY4Ts`) CASE-KÄNSLIGT; gamla Lene bar `Lenehay@gmail.com` (versal) →
    walk-in:ens gemener matchade inte → dubblett skapad (`reclqYPq7sd4isEN2`).
    Konsoliderad (anmälan + 2 Deltaganden + touchpoint re-pekade → gamla
    `rec5Edyvkfo7hHQ8n`; e-post normaliserad till gemener); **dubbletten raderad**.
    → **ny data-model fälla 40**.
- **80 Deltaganden → Närvarande** (40 närvarande × Dag 1+2): FJS 44 + RIM1 36.
  No-shows (9 pers / 18 Delt) lämnade `Ej avstämt` (direkt-markering, ej blanket).
  Verifierat cross-event via Andreas Pettersson: `Fjärrskådning ×1` + `RIM 1 ×1` +
  Närvaro 4/4 + `Antal genomförda event 2`.

## Fas 1 (Psionautics) — närvaro-markering + korrektion, 2026-07-08

Event-17 (Psionautics) hade 88 anmälningar, **220 Deltaganden** (alla `Ej avstämt`,
110 Dag 1 + 110 Dag 2). *Identitets-not:* data-model kallar `recQ2TPsY69fQXA8a`
"Medveten Kontakt" (historiskt snapshot 2026-04-16); live-labeln (`Event (text)`,
`Event (source)`) är **"Psionautics"**, EventKey Event-17.

### Steg 1 — A10-bulk (initial, per tidigt Marcus-beslut "markera alla närvarande")

Kryssade `Markera alla närvarande (alla sessioner)` (`fldF5atXm9lV2nAeq = true`) på
Event-17 → **A10 markerade alla 220 Deltaganden → Närvarande**, återställde checkboxen.
Verifierat: stickprov `rectP09uMIFIqoIqc` (Status Närvarande, Närvaropoäng 1,
`Avstämt` A8-satt), rollup-kaskad (Marie Bäcklin 6/8 → 8/8).

### Steg 2 — Källavstämning avslöjade över-markering (Marcus levererade faktisk lista)

Marcus levererade `~/Downloads/alla-anmalda-medveten-kontakt-2026-07-08.csv`
(88 anmälningar) och flaggade att "markera alla" kunde vara fel. Avstämning
(read-only, identitets-säkert per anmälans egna Deltagande-länkar):

- **Anmälnings-lagret speglade redan CSV:n exakt:** 88 ↔ 88, 0 status-avvikelser
  (78 Bekräftad, 9 Avbokad/Ombokad, 1 Flytta till väntelista).
- **Regel (Marcus-bekräftad):** `Bekräftad (mail skickat)` = deltog; övriga = ej där.
- De 220 Deltagandena delade upp sig:

| Kategori | Delt | Ska vara Närvarande? |
|---|---|---|
| 78 Bekräftade (anmälan-länkade, ×2) | 156 | JA |
| 10 icke-Bekräftade (9 avbokade + 1 väntelista, ×2) | 20 | NEJ |
| 44 orphan-Deltaganden utan anmälan-länk | 44 | NEJ (→ fälla 41) |

De 44 orphans: 18 dubbletter hos 7 riktiga personer (som ÄVEN har korrekt
anmälan-länkade Delt) + 26 hos **3 testpersoner** (`marcus@h5gruppen.se` "Marcus
(test)" med 22 Delt, `test-kalla-delete@example.com`, `highfive.epost@gmail.com`).

### Steg 3 — Korrektion (path A: icke-destruktiv revert), Marcus-kvitterad

**64 fel-markerade Deltaganden återställda → `Ej avstämt`** (20 icke-Bekräftade +
44 orphan), i 7 batchar via MCP. Verifierat authoritative post-state:

- **156 Närvarande + 64 Ej avstämt = 220** (0 avvikelser i endera riktning).
- Alla 26 testperson-Deltaganden → Ej avstämt.
- Basen speglar nu CSV:n: exakt de **78 Bekräftade** (156 Deltaganden) är närvarande.

*Rest-not:* de 64 reverterade bär en `Avstämt`-timestamp från flippen (A8 sätter den
vid varje status-ändring) fast de är `Ej avstämt` — kosmetiskt; städas vid
orphan-raderingen (T16).

### Steg 4 — Efterkorrektion 2026-07-09: 78 → 77, 156 → 154

Segment-exporten (S60 Steg 4) avtäckte att **en av de "78 Bekräftade" var en
testidentitet**: Person `rectU34rbPfo6VD10` (namnlös dubblett; dess anmälan
`recbW1xZBot0MXumQ` bär `highfive.epost@gmail.com` + "Marcus Johansson").

Varför Steg 3 missade den: orphan-passet letade Deltaganden **utan anmälan-länk**.
Denna record bar en Bekräftad, korrekt länkad anmälan och var därför osynlig för det
urvalet — dessutom är dess `Personer.E-post` tom (fälla 42), så en kontroll mot
Person-tabellens e-postfält gav falskt negativt. Identiteten bodde på anmälan.

**Åtgärd 2026-07-09 (Marcus-kvitterad):** dess 2 Deltaganden (`rec5dXdn1wRt1n28E`,
`recYykKvJFZAZqtyh`) → `Ej avstämt`.

**Korrigerat slutstate för Event-17, live-verifierat:**

| | Före | Efter |
|---|--:|--:|
| Bekräftade personer (riktiga) | 78 | **77** |
| Närvarande Deltaganden | 156 | **154** |
| Ej avstämt | 64 | **66** |
| Totalt | 220 | 220 |

Av de 77 saknar **Ann-Marie Martinsson** (`recsqD7ZxM6c13KbC`) e-post helt → **76
mottagare** i Psionautics-materiallistan. Hon var medföljande till Stefan Martinsson;
hennes `Medföljande till` pekade felaktigt på hans **avbokade** anmälan och pekades
2026-07-09 om till den bekräftade (`recoihpXidEHFry74`).

Kanonisk testkonto-lista: [`../reference/testkonton.md`](../reference/testkonton.md).

## Fas 6 — Status-flip → Genomfört, 2026-07-08

Verifierat inert mot automations-källan (`miranon_automations_COMPLETE.json`): endast
A6/A9/A10 triggar på Eventplanering; **ingen triggar på `Status`-fältet**. Flippade
`Status` (`fld2nXlS1UG0aOHLt`) `Planerat → Genomfört` på Event-17/18/19 (en atomär
update). Verifierat i svaret.

## Slutstate (verifierat 2026-07-08)

| Event | Status | Närvarande Deltaganden | Not |
|---|---|---|---|
| Event-18 (FJS) | Genomfört | 44 (22 pers × 2) | 3 no-show `Ej avstämt` |
| Event-19 (RIM1) | Genomfört | 36 (18 pers × 2) | 6 no-show `Ej avstämt` |
| Event-17 (Psionautics) | Genomfört | **154** (77 pers × 2) | 10 icke-bekr + 44 orphan + 2 testperson `Ej avstämt` (66 totalt) |

> Event-17-raden korrigerad 2026-07-09 (78→77 / 156→154) — se §Steg 4 ovan.

## Uppföljning → T16 (bas-maximering, [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md))

- **Radera** de 44 orphan-Deltagandena + de 3 testpersonerna (+ deras
  touchpoints/engagemang) — destruktiv städning, deliberat i bas-maximerings-spåret,
  ej mitt i en avstämning (path A valdes medvetet icke-destruktivt).
- **Fälla 40** (case-e-post-dubbletter) + **fälla 41** (orphan-Deltaganden) — se data-model.
- Ingen `Psionautics ×`-rollup på Personer (re-verifierat live) — redan känt via
  **fälla 4 + fälla 33 (Lucka C)**; segment påverkas ej (källäst).
- **Jessica Karlsson** (Event-19): inbjudan → senaste anmälans e-post
  (`jesshundteam@gmail.com`); `@live.se` läggs i hennes Persons `Anteckningar` — EJ GJORT.

## Källor

- CSV: `~/Downloads/alla-anmalda-medveten-kontakt-2026-07-08.csv` (Psionautics, 88 anm).
- Xlsx: `~/Downloads/2026-06-24 uppdaterade deltagare.xlsx` (FJS + RIM1).
- Sessionsdok: [`../../tasks/sessions/2026-07-08-session-60.md`](../../tasks/sessions/2026-07-08-session-60.md).
