---
owner: marcus803
updated: 2026-08-24
review_by: 2026-11-24
status: stable
---

# Execute-log — skarpa prod-basskrivningar

> Auktoritativ, kronologisk logg över **skarpa skrivningar mot prod-basen**
> (`app8uGPrVCVOm6LfD`). Airtable-skrivningar lever i basen, inte i git — denna fil
> är deras enda spårbara artefakt. Systemförståelsen (automationer, fält, fällor)
> bor i [`../reference/data-model.md`](../reference/data-model.md); denna fil bär
> *vad som faktiskt gjordes, i vilken ordning, och med vilken verifiering*.
>
> **Poster:** Session 60 (2026-07-08/09) — närvaroavstämning av tre maj-2026-event
> mot faktiska deltagarlistor · Session 102 (2026-08-17) — backfill av tidsfältet
> `Inskickad` på 294 rader · Session 107 (2026-08-17) — länkning av 26
> anmälningar utan Event-länk · Session 110 (2026-08-21) — omlänkning av 61
> felmatchade anmälningar (Elfsight-URL-buggen) · Session 112 (2026-08-24) —
> touchpoint-backfill för 8 manuellt Person-länkade anmälningar
> (`TASK-229.2`). Varje post bär sitt eget mandat och sin egen verifiering;
> en ny post läggs sist, tidigare poster skrivs inte om.

## Session 60 — syfte och pivot

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

### Steg 4 — 2026-07-09: ett INFÖRT fel, upptäckt och återställt samma dag

> **Slutstate är oförändrat: 156 Närvarande + 64 Ej avstämt = 220.** Steg 3 hade rätt.
> Detta avsnitt bevaras som forensisk trail, inte som en korrigering av siffrorna.

Under segment-exporten klassades Person `rectU34rbPfo6VD10` som en testidentitet —
enbart för att dess anmälan (`recbW1xZBot0MXumQ`) bär `highfive.epost@gmail.com`, en
adress Marcus uppgett att han använder för tester. Dess 2 `Närvarande`-Deltaganden
(`rec5dXdn1wRt1n28E`, `recYykKvJFZAZqtyh`) reverterades till `Ej avstämt`, och
Event-17 skrevs om till 154/66.

**Det var fel.** Marcus påpekade att adressen även är hans riktiga privatadress.
Kontroll mot den auktoritativa CSV:n (`alla-anmalda-medveten-kontakt-2026-07-08.csv`)
gav omedelbart facit:

```text
"Marcus Johansson","highfive.epost@gmail.com",…,"Bekräftad (mail skickat)","Ja","Formulär","2026-02-21 kl 23:17"
```

En riktig formuläranmälan, betald, med bekräftelse och deltagarinfo. **Återställt
samma dag** → `Närvarande`; Event-17 live-verifierat tillbaka på **156 + 64 = 220**.

**Rot till felet:** CSV:n — samma fil som var facit i Steg 2 — lästes aldrig före
reverteringen. Klassificeringen byggde på adress-match, inte på anmälnings-status.
Diskriminanten som faktiskt skiljer skräp från verklighet är **orphan-egenskapen**
(saknad `Anmälan`-länk), och `rectU34rbPfo6VD10`:s Deltaganden var korrekt länkade.

**Varför avstämningen inte fångade det (viktigt för framtida pass):** kontrollen
`Närvarande + Ej avstämt = 220` är en **konserveringskontroll**. Den bevaras exakt när
en rad flyttas mellan de två kategorierna — `156 + 64` och `154 + 66` summerar båda
till 220. Den fångar rader som tappats, dubblerats eller saknar status; den är per
konstruktion **blind för att en rad hamnat i fel kategori**, alltså för precis den
felklass en omklassificering kan införa. Kategori-korrekthet kan bara verifieras mot
en extern källa som bär kategorin — här CSV:ns `Status` och `Betalning` per person,
med per-post-diff (vem bytte kategori, och står det i källan?), inte mot aggregatet.
Se [L259](../../tasks/lessons.md).

Kodifierat som [fälla 44](../reference/data-model.md) + [L258](../../tasks/lessons.md).
Roll-listan över interna identiteter: [`../reference/testkonton.md`](../reference/testkonton.md).

### Steg 5 — Faktiska korrektioner 2026-07-09 (dessa står)

- **Ulrika Arvas + Stefan Martinsson:** dubblett-Personer konsoliderade (fälla 42 —
  anmälan utan e-post → A2 Gren 4 skapar omatchbar Person). Anmälan + Deltaganden +
  touchpoint re-pekade; dubbletterna raderade. Påverkar inte Event-17:s närvaro-tal.
- **Ann-Marie Martinsson** (`recsqD7ZxM6c13KbC`): saknar e-post helt → **77
  mottagare** i Psionautics-materiallistan (av 78 deltagare). Hennes `Medföljande
  till` pekade på Stefans **avbokade** anmälan och pekades om till den bekräftade
  (`recoihpXidEHFry74`).

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
| Event-17 (Psionautics) | Genomfört | 156 (78 pers × 2) | 10 icke-bekr + 44 orphan `Ej avstämt` |

> Event-17-raden stod emot en felaktig omskrivning 2026-07-09 (78→77 / 156→154) som
> återställdes samma dag — se §Steg 4. Siffrorna ovan är och förblir korrekta.

## Uppföljning → T16 (bas-maximering, [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md))

- **Radera** de 44 orphan-Deltagandena + de 3 testpersonerna (+ deras
  touchpoints/engagemang) — destruktiv städning, deliberat i bas-maximerings-spåret,
  ej mitt i en avstämning (path A valdes medvetet icke-destruktivt).
- **Fälla 40** (case-e-post-dubbletter) + **fälla 41** (orphan-Deltaganden) — se data-model.
- Ingen `Psionautics ×`-rollup på Personer (re-verifierat live) — redan känt via
  **fälla 4 + fälla 33 (Lucka C)**; segment påverkas ej (källäst).
- **Jessica Karlsson** (Event-19): inbjudan → senaste anmälans e-post
  (`jesshundteam@gmail.com`); `@live.se` läggs i hennes Persons `Anteckningar` — EJ GJORT.

## 2026-08-17 — Backfill av `Inskickad` (294 rader), Session 102

Andra skarpa prod-skrivningen i denna logg, och en annan klass än ovanstående:
inte en avstämning mot en extern deltagarlista, utan ifyllnad av ett **tidsfält
som aldrig sattes vid källan**. Mandat: Marcus 2026-08-17, verbatim *"Det är GO
på tid-åtgärden"* — avgränsat till att skriva `Inskickad` där fältet var tomt.
Kort: `TASK-248`. Fälla: [fälla 49](../reference/data-model.md).

### Rotorsak

`Inskickad` (`fldNtSHQivkL26B6L`, dateTime, skrivbar) sätts bara av vägar som
uttryckligen mappar det: EF `create-registration` och Zap 1
(`Anmälan-Psionautics.se`). **Zap 4 (`Huvudformulär`) mappar det inte** — därför
saknade dess anmälningar inskickstid. Zap 3 (`Expressformulär`) saknar
mappningen likaledes men har **noll rader** i prod och är alltså en latent, aldrig
materialiserad rotorsak.

| Formulärklass | Rader totalt | Varav utan `Inskickad` | Andel |
|---|---|---|---|
| Huvudformulär | 302 | **273** | 90,4 % |
| Backfill (historisk) | 479 | 20 | 4,2 % |
| Anmälan-Psionautics.se | 49 | **0** | 0 % |
| Expressformulär | 0 | 0 | — |
| *(utan `Från formulär`)* | 1 | 1 | `rec8H1aVug1RMw3hq` |

Att Zap 1-klassen står på 0 och Huvudformulär på 273 är det som isolerar
rotorsaken till den saknade mappningen — inte till något i basen.

### Källvalet

Backfillat värde = `Rad skapad` (`fldet9MU1rJBSpo3y`). Fältet är av typen
**`createdTime`** — Airtables egen skapelsetidstämpel, inte ett Zapier-skrivet
värde. Det ger två egenskaper som gör valet exakt snarare än ungefärligt: det kan
aldrig vara tomt, och det är per konstruktion identiskt med `record.createdTime`
(verifierat på alla 294 rader, 0 avvikelser). Uppdragets planerade fallback
"`createdTime` när `Rad skapad` saknas" var därför en distinktion utan skillnad.

### Automations-inertitet — bevisad FÖRE full körning

| Automation | Trigger | Utfall |
|---|---|---|
| A1, A2 | record **created** → Anmälningar | Kan inte fyra på en PATCH |
| A7 (`wflDxN31sRJNWCqfu`) | record updated → Anmälningar | `watchFields = [Slutbetalning, Event]` — `Inskickad` står inte där |
| A3 (`wfl4qb2eP28SfKlck`) | matches conditions → Anmälningar | 26 av raderna matchade villkoret → **mätt med kanariefågel** |

A3 var den enda reella risken (den skapar Deltaganden — en annan tabell, utanför
mandatet). I stället för att anta Airtables trigger-semantik skrevs **en** rad ur
just den exponerade klassen (`rec1g6TqK9yKOpa5V`, Elnaz Mohajer), följt av
mätning: Deltaganden **1716 → 1716**, kanariefågelns egna Deltaganden 0 → 0.
Först därefter kördes resterande 293.

### Körning och verifiering

293 skrivna + 1 överhoppad (kanariefågeln, av skriptets idempotensfilter) = 294.
Batchar om 10, endast fältet `Inskickad`, med spärr som kastar om ett annat fält
eller ett record-ID utanför dry-run-listan förekommer.

| Kontroll | Utfall |
|---|---|
| (a) re-count `{Inskickad} = BLANK()` | **0** (förväntat 0) |
| (b) read-back av hela listan, `Inskickad == Rad skapad` | **294/294**, 0 felaktiga |
| (c) rader utanför listan | 574 (= 868 − 294), varav **0** saknar värde |
| (c) rader utanför listan med `Inskickad == Rad skapad` | **0** |
| Konservering: Deltaganden | 1716 → **1716** |

Kontroll (c):s andra rad är det tvåvägs-beviset: signaturen `Inskickad == Rad
skapad` är unik för de rader som skrevs. Hade en rad utanför listan rörts skulle
den bära samma signatur — ingen gör det. Detta är medvetet en annan bevisform än
Session 60:s konserveringskontroll, som §Steg 4 visade är blind för kategori-fel.

### Öppet efter denna post

- **Framåtgarantin är skapad men ännu inte i drift.** Senaste raden utan
  `Inskickad` skapades 2026-08-16, dagen före backfillen; spannet löper
  2025-11-27 → 2026-08-16. Automationen **A12** (`wflVeU33Etsi8g8wh`) skapades
  2026-08-17 av orkestreraren — trigger `recordCreated` på Anmälningar, villkor
  `Inskickad isEmpty`, sätter `getWorkflowExecutionIsoDateTime()` (A8-formen) —
  med `configurationStatus: valid` men **`deploymentStatus: undeployed`**.
  Airtable tillåter ingen agent-aktivering, så Marcus slår på den i UI:t. Tills
  det skett är hålet öppet. Kollisionskontrollen (sex celler mot A1–A11)
  rapporteras PASS av orkestreraren; av dessa kunde denna post pröva **en**
  oberoende — att A7:s `watchFields` är `[Slutbetalning, Event]` — och den
  håller, samma mätning som friade backfillens egen PATCH. Övriga fem är
  obelagda härifrån: claude.ai-connectorn nekade läsning med `permission_error`,
  och PAT-servern ser inte automationer.
- **Bifynd, ÅTGÄRDADE i senare poster [rättat 2026-08-24, `TASK-229`]** (fält-mandatet
  var avgränsat till `Inskickad`, så denna post skrev det inte): 26 rader bar
  `EventKey` utan `Event-`-prefix (`"11"` ×17, `"10"` ×9), samtliga `Huvudformulär`,
  spann 2026-04-26 → 2026-08-15 → bokfört på `TASK-232`. Rotorsaken (Elfsight-
  kalenderwidgeten på miranon.se) och åtgärden ligger i posterna **2026-08-17
  (Session 107)** och **2026-08-21 (Session 110)** nedan — se dem för fullständig
  logg. En rad saknar `Från formulär` helt (`rec8H1aVug1RMw3hq`) och är fortsatt
  oåtgärdad (utanför bägge posternas scope).

## 2026-08-17 — Länkning av 26 anmälningar utan Event-länk, Session 107

Tredje skarpa prod-skrivningen i denna logg. Rotorsak (bekräftad i skärpa av
Session 110 nedan): Elfsight-kalenderwidgeten på miranon.se — Roger duplicerar
gamla kalenderposter och redigerar kurstext men inte URL-parametrarna, så nya
anmälningar bär en äldre events `EventKey`. 26 anmälningar hade `{Event} =
BLANK()`, i tre kluster: Fjärrskådning Rönninge 25–26 juli ×17 · Fjärrskådning
Rönninge 17–18 okt ×8 · RIM 1 Rönninge 14–15 nov ×1. Mandat: Marcus per-operation
GO, 2026-08-17 (nio-punktslistans spår 2). Kort: `TASK-273` (spåret) / `TASK-232`
(EventKey-instansen, ID 868).

### Vad som skrevs

Tre Eventplanering-rader skapade: **Event-59** (RIM 1, Arboga, 31 okt–1 nov,
`recqA2Us1FByBnibz`) · **Event-60** (Fjärrskådning, Rönninge, 25–26 juli,
Genomfört — retroaktivt satt, Marcus bekräftade att eventet hölls) · **Event-61**
(Fjärrskådning, Rönninge, 17–18 okt, Planerat). De 26 orphan-anmälningarna
länkade till respektive event (17 juli + 8 okt, inkl. Maud + 1 nov), plus
Agnetas separat felmatchade anmälan (`reczi2qUFpS1eiyYm`) → Event-59 och Maria
Karlsson → Event-56.

### Verifiering

`{Event} = BLANK()` mätt **26 → 0** i prod efter länkningen. ID 868 (Allan
Nieminen, `TASK-232`s namngivna instans, `EventKey = "11"` sedan raden skapades
2026-05-12) låg i juli-klustret → länkad till Event-60 — Event-länken datafixad;
`EventKey`-textfältet självt rördes inte i detta steg (fält-mandatet var
Event-länken, inte texten — normaliseringen av `EventKey`-fältet hör till
2026-08-21-posten nedan).

Källa: [`../../tasks/sessions/2026-08-17-session-107.md`](../../tasks/sessions/2026-08-17-session-107.md)
§ Del 2 + `TASK-232`-kortets Implementation Notes.

## 2026-08-21 — Omlänkning av 61 felmatchade anmälningar (Elfsight-URL-bugg), Session 110

Fjärde skarpa prod-skrivningen i denna logg. `TASK-232`s enrads-hypotes (ID 868)
breddades kraftigt: rotorsaken är Elfsight Event Calendar-widgeten på
miranon.se (`8d8c059d-…`) — Roger duplicerar gamla kalenderposter och redigerar
kurstext men glömmer URL-parametrarna, så nya anmälningar länkas mot ETT FEL,
äldre event. Sex kalenderposter bar fel nyckel (fem kommande event + 25–26
juli-posten). Mandat: Marcus GO per steg, 2026-08-21. Kort: `TASK-232` (AC 1–3
bockade, Done i stängningscommit), tråd `T158`.

### Vad som skrevs (Marcus GO per steg, spårbarhetsrad i varje `Notering`)

| Steg | Operation | Antal | Verifierat |
|---|---|---|---|
| 1 | Event skapade: **Event-62** (RIM 1, Rönninge, 12–13 sep, `recPSBvKXcjDUpnkF`) · **Event-63** (RIM 1, Bredaryd, 10–11 okt, `rectqoBHIXQpOcmUY`) · **Event-64** (RIM 2, Rönninge, 24–25 okt, `recfCJJozYm4IN118`) | 3 | `AnmälningsURL` + Sessionsmall Dag 1/Dag 2 lästa tillbaka |
| 2a–2f | Anmälningar omlänkade (`Event` + `EventKey` + `Notering`): 18 → 62 · 19 → 63 · 15 → 59 · 1 → 61 · 3 → 64 · 5 → 60 | 61 | `Antal anmälningar` per event = förväntat, nio räkningar |
| 3 | Deltaganden flyttade/skapade (112 flyttade + Agnetas 2 S107-rest + 5+5 nya Dag 1/Dag 2 för 2f:s Föreläsning-rader + Fredriks 2 av A3) | 124 | 304/304 anmälningar konsistenta · 1 777/1 777 Deltaganden `Event` = lookup |
| 4 | A7:s `Ej betalda (records)` räknad om på Event-10, Event-11, Event-55 | 3 | fältet läst tillbaka |
| 5 | Kontrollsvep, samma metod som före | — | **MISMATCH 65 → 4 · ORPHAN 1 → 0** |

Fyra kvarvarande vid passets stängning: ID 21/22/23 (väntade på Lottas besked —
formulärtexten och kalenderlänken pekade mot olika RIM-nivåer, ingen närvaro
bokförd någonstans som kunde avgöra det) och ID 960 (rätt event, ingen åtgärd).

**Per-post-beviset är durabelt, per-ID-tabellen ovan är det inte.** Varje
omlänkad rad bär stämpeln **`[Omlänkad 2026-08-21, S110]`** i sin `Notering` i
prod-basen — det är källan att slå upp för en specifik rad i efterhand.
Rådata/klassning/skrivlogg låg i sessionens scratchpad (`svep/`, `svep/efter/`)
och är efemär; ID-listan i tabellen ovan är rekonstruerad ur sessionsdoket för
läsbarhet, inte en levande frågekälla.

Källa: [`../../tasks/sessions/2026-08-21-session-110.md`](../../tasks/sessions/2026-08-21-session-110.md)
§ Del 2 B + Paushistorik § TILLSTÅND.

## 2026-08-24 — Touchpoint-backfill: 8 manuellt lagade anmälningar, Session 112

Sjätte skarpa prod-skrivningen i denna logg. Rotorsak (`TASK-229` § Del 5,
falsifiering av Del 3:s tidigare "obestämbar"-slutsats): A2 Gren 1 sätter
aldrig Person-länk eller Touchpoint för en namnlös Person — konstruktionen,
inte ett körningsfel. De 8 anmälningarna (ID 868/877/884/899/910/911/941/981)
fick sin Person-länk manuellt patchad via `TASK-229` § Del 1+4 (2026-08-16),
men Gren 2:s `createRecord` för `Inskickad anmälan`-touchpointen uteblev
samtidigt — CRM-historiken (`Senaste interaktion`, TP-sammanfattning) stod
ofullständig för de 8 personerna tills denna backfill. Mandat: Marcus GO
2026-08-24, klartext ("Det är absolut GO på 1+2"). Kort: `TASK-229.2`.
Scope: EXAKT 8 `createRecord` i `Touchpoints` (`tbl22SCvlHrgcAiZi`) — inga
uppdateringar, inga raderingar.

### Fältkontrakt (verifierat mot prod-schemat före skrivning)

Tre fält per post, matchat exakt mot `describe_table` innan första skrivning:
`Person (länkat fält)` (`fldLiC0ZiUAdxXu9u`, länk → `tbl6ZyCm3V026iFTU`) ·
`Typ` (`fldL8gMBzkMHyUoiK`, singleSelect) = `"Inskickad anmälan"`
(`sel8DlybaDi9slhD3`) · `Datum` (`fldcq8oJWTyc8p8dA`, dateTime) = anmälans
`Inskickad`-tidsstämpel. Övriga fält (formler, `Erbjudande`, `Kanal`) rörda
aldrig — de är formelfält eller hör hämtningar till, inte anmälningar.

### För-verifiering och dedup (per post, före varje skrivning)

Samtliga 8 anmälningar lästa mot `tbloOcrppVoyrHbrq` (Anmälningar): `Person`
och `Inskickad` matchade spec-tabellen **exakt**, 0 avvikelser — inget
skäl att hoppa över någon post. Dedup kördes därefter per person
(`tbl6ZyCm3V026iFTU`s `Touchpoints`-array läst ut, varje länkad post hämtad):
ingen av de 8 personerna bar en befintlig `Typ="Inskickad anmälan"`-touchpoint
inom ±5 min av respektive måldatum — närmaste kollisionskandidat var Allan
Nieminens `recOStoMeytYbeHIv` (2026-05-14T09:47, mot måldatum
2026-05-12T21:39 — ca 1 dygn 12 tim bort, långt utanför fönstret). 0 poster
hoppades över.

### Vad som skrevs

| # | Anmälan (ID) | Person | Ny touchpoint | Datum |
|---|---|---|---|---|
| 1 | recNbJwwt8nlFtasL (868) | rec5fF7QD16Qpr0C9 (Allan Nieminen) | `recRZ8xLB3HwxvZzn` (TP 1087) | 2026-05-12T21:39:15.000Z |
| 2 | rec4QfGSOjwljAbKV (877) | recZ8qJn3iOquLXC8 (Elin Melwinsson) | `recAiFxc3V2xGTVgj` (TP 1088) | 2026-05-18T18:56:59.000Z |
| 3 | recViNdItldmL6O8l (884) | recT8y8DvaZz09gtW (Ulrika Arvas) | `recVEpBSnxtK1KAPZ` (TP 1089) | 2026-05-29T15:05:48.000Z |
| 4 | rec1SD7i2467gPrJ9 (899) | rectj3ixgMylQYAGH (Lena Maria Olsson) | `recrQO0193gPayvEI` (TP 1090) | 2026-06-15T05:09:16.000Z |
| 5 | rec3A0IJir34yoekd (910) | recAZF4Y7Y0AyKFNq (maria lejdeby) | `recvZvsKJ2jInu5Rv` (TP 1091) | 2026-06-28T07:38:56.000Z |
| 6 | rec1ft7CDqLJwZw9V (911) | recoFAXvbggTQ8WrL (Helena Skoglund) | `recF10FuDa0NEKFEK` (TP 1092) | 2026-06-29T18:28:11.000Z |
| 7 | rechDOujWs8FdnrCL (941) | recAc3ToqnjYUWEHq (Karl Areskough) | `recnlsDTWAt3qCAwx` (TP 1093) | 2026-07-15T18:15:54.000Z |
| 8 | reczi2qUFpS1eiyYm (981) | recM5CHah9vqFh3fb (Agneta Lindell) | `recALBd4SUmGERO2Q` (TP 1094) | 2026-08-11T08:23:24.000Z |

### Verifiering

Read-back per post: samtliga 8 nya touchpoints hämtade tillbaka individuellt
— alla tre fält (Person-länk, Typ, Datum) matchade exakt vad som skickades.
Samtliga 8 personers `Touchpoints`-array läst tillbaka: växte med **exakt 1**
i varje fall (Allan 5→6, Elin 1→2, Ulrika 2→3, Lena Maria 1→2, maria lejdeby
1→2, Helena 2→3, Karl 1→2, Agneta 1→2).

Slutsvep kört som en **oberoende serverfrågad räkning** (`filterByFormula`
mot `Touchpoints` direkt, `Typ='Inskickad anmälan'` + `OR(FIND(personnamn,
ARRAYJOIN({Person (länkat fält)})), …)` över de 8 namnen — inte en manuell
räkning av arrayerna) → **15 poster**, exakt det förväntade (7 befintliga + 8
nya). Fördelning per person i svepet: Allan 4 (3+1), Elin 1 (0+1), Ulrika 3
(2+1), Lena Maria 2 (1+1), maria lejdeby 2 (1+1), Helena 1 (0+1), Karl 1
(0+1), Agneta 1 (0+1) — summan matchar både den manuella tallyn och
person-array-räkningen, tre oberoende metoder som konvergerar på samma tal.

### Sidoeffekt (känd i förväg, observerad — inte åtgärdad)

`Senast touchpoint datum` (formel över `Touchpoints`) flyttades framåt för de
personer vars nya touchpoint blev den SENASTE i deras historik (7 av 8: Elin
2026-05-15→2026-05-18, Ulrika 2026-04-19→2026-05-29, Lena Maria
2026-04-19→2026-06-15, maria lejdeby 2026-04-19→2026-06-28, Helena
2025-12-26→2026-06-29, Karl 2026-04-26→2026-07-15, Agneta
2026-05-10→2026-08-11). Allan opåverkad — hans senaste touchpoint
(2026-08-24, dagens anmälan) var redan nyare än den backfillade
2026-05-12-posten. Korrekt utfall per kortets spec, ingen åtgärd.

### Öppet efter denna post

A2 Gren 1-fixen som förhindrar återfallet (namnlösa Personer missar samma
Touchpoint-createRecord vid framtida anmälningar) är `TASK-229.1`
(staging) + `TASK-229.3` (prod-utrullning) — ej del av detta kort. Denna post
städar historik, den hindrar inte återfall.

Källa: `TASK-229`-kortet § Del 5 (rotorsaks-falsifieringen + spec-underlaget)
och `TASK-229.2`-kortet (AC + mandat).

## Källor

- CSV: `~/Downloads/alla-anmalda-medveten-kontakt-2026-07-08.csv` (Psionautics, 88 anm).
- Xlsx: `~/Downloads/2026-06-24 uppdaterade deltagare.xlsx` (FJS + RIM1).
- Sessionsdok: [`../../tasks/sessions/archive/2026-07/2026-07-08-session-60.md`](../../tasks/sessions/archive/2026-07/2026-07-08-session-60.md).
- Sessionsdok: [`../../tasks/sessions/2026-08-17-session-107.md`](../../tasks/sessions/2026-08-17-session-107.md) § Del 2.
- Sessionsdok: [`../../tasks/sessions/2026-08-21-session-110.md`](../../tasks/sessions/2026-08-21-session-110.md) § Del 2.
- Kort: `TASK-232` (Fynd EventKey 11 på anmälan ID 868 — återfall av sanerad fälla 10/F.2).
