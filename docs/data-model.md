> **📎 Kopia finns i:** `~/Repon/psionautics/docs/data-model.md`
> (för psionautics-projektets Claude-chatt under prototyp-fasen)

---

# Datamodell — Miranon Media & Psionautics

*Levande referens. Version 1. Skapad 2026-04-16. Växer när vi lär oss mer.*

---

## Vad det här dokumentet är

En **navigations- och förståelsekarta** över datamodellen. Det här dokumentet duplicerar inte befintlig dokumentation — det pekar på rätt ställen och förklarar det som är svårt att se när man tittar på fälten isolerat.

Läses av Claude Chat (vid strategi och analys) och Claude Code (vid implementation). Människor — Marcus, Roger, Lotta — läser [`hur-systemet-funkar.md`](./hur-systemet-funkar.md) istället.

### Principer

- **Sanningskälla:** detta dokument beskriver bara det som är verifierat. Osäkerheter markeras `⚠️ Oklart`. Saknade bitar listas i avsnittet *Luckor*.
- **Delegera detaljer.** Fältlistor, choice-IDs, vyer och formulärkonfigurationer bor i schema_reference.md. Syftet här är förståelse, inte fullständighet.
- **Uppdateras vid varje förändring.** Nytt fält, ändrad formel, ny automation → uppdatera detta dokument i samma commit.

---

## Karta — Var bor vad?

| Behöver du... | Läs... |
|---|---|
| Fält-för-fält-referens med typer, formler, relationer | `~/Repon/miranon-media-os/docs/schema_reference.md` (1 682 rader) |
| Maskinläsbar fält-ID → namn-mapping | `~/Repon/miranon-media-os/docs/field_lookup.json` (153 fält) |
| Rå automation-JSON (triggers, actions, scripts) | `~/Repon/miranon-media-os/docs/miranon_automations_COMPLETE.json` (15 741 rader) |
| Sammanfattning med TypeScript-interfaces och HAR-metoden | `~/Repon/miranon-media-os/docs/AIRTABLE-REFERENS.md` (298 rader) |
| TypeScript-domänmodeller för React-appen | `~/Repon/miranon-media-admin/src/domain/models/` och `src/domain/schemas/` |
| Förstå *varför* och *hur* systemet fungerar, utan jargong | `~/Repon/miranon-media-admin/docs/hur-systemet-funkar.md` |
| Förstå flöden, beroenden, fällor och backfill-strategier | *Det här dokumentet* |

---

## Snabbreferens — ID:n och nyckelfält

För när Claude Code behöver slå upp snabbt utan att söka.

### Base

```
app8uGPrVCVOm6LfD
```

### Tabell-ID:n

| Tabell | ID |
|---|---|
| Eventplanering | `tblVE3UKWl1CKrphV` |
| Eventformat | `tbl8qhuJQ5ZWPMRk4` |
| Anmälningar | `tbloOcrppVoyrHbrq` |
| Personer | `tbl6ZyCm3V026iFTU` |
| Deltaganden | `tbldWHH6sSHWoQPHH` |
| Väntelista | `tbl2VxMx7JMkIxD4Q` |
| Hämtade erbjudanden | `tblqFpgxEhJ95AEcM` |
| Engagemang | `tbl9H2SoGFfysBj5y` |
| Erbjudanden | `tblcCFGCVrnl1JZfg` |
| Touchpoints | `tbl22SCvlHrgcAiZi` |
| Kontaktlogg (rådata) | `tblzg4DsRzCCXH8Vy` |
| Error-log | `tblnnmWswnRp9gFws` |
| Bulkutskick | `tblWarzSse85NI1Zx` |
| Segment | `tbll2N6JKCj4u6y9o` |
| Utskickslogg | `tblIesjbuSWNp6oxK` |
| Email Opens | `tblXFJyGRahQDhhqc` |

### Aktiva event

| Event | Record ID | Datum |
|---|---|---|
| Medveten Kontakt | `recQ2TPsY69fQXA8a` | 1–3 maj 2026 |

### Kritiska länkfält mellan kärntabellerna

| Från | Fält | Till | Fält-ID |
|---|---|---|---|
| Anmälningar | Person | Personer | `fldQekqRlLfup8x5K` |
| Anmälningar | Event | Eventplanering | `fldi3enUaMdbuGSlm` |
| Anmälningar | Medföljande till | Anmälningar (self) | `fld39KEXJxyulXfsN` |
| Personer | Anmälningar | Anmälningar | `fld8pOivka8YdiywK` |
| Personer | Deltaganden | Deltaganden | `fld5shm9UER5CMyTl` |
| Deltaganden | Anmälan | Anmälningar | `fldwQdDpRK8vByNhb` |
| Deltaganden | Event | Eventplanering | `fldaj5mbpU3yPw2np` |
| Deltaganden | Person (länk) | Personer | `fldiU06kbTxSafkm4` |

### Nyckelformula — "lynchpin"-fält

Dessa är broarna som hela rollup-kedjan bygger på. Ändra aldrig utan att förstå konsekvenserna.

| Fält | Fält-ID | Tabell | Roll |
|---|---|---|---|
| Närvaropoäng | `fldwuo94BY46VUOm4` | Deltaganden | 1 om Status = "Närvarande"/"Deltog online", annars 0. **Allt kurshistorik räknas uppåt härifrån.** |
| Är aktiv (1/0) | `fld4j7PeckDViTdIB` | Anmälningar | Boolean för om anmälan ska räknas i aktiva rollups |
| Genomfört event (1 rad per event) | `fldRfc4i7HHfc1dFU` | Deltaganden | Dedup-mekanism för tvådagars-event (filtrerar på Session = "Dag 1" eller "Föreläsning") |

### Session-värden (singleSelect)

`Deltaganden.Session` (`fldBPZnsDL0bNIRHx`) accepterar:
- `Dag 1` — räknas i `Genomfört event`
- `Dag 2` — räknas INTE i `Genomfört event` (undviker dubbelräkning)
- `Föreläsning` — räknas i `Genomfört event`

### Status-värden (singleSelect)

`Deltaganden.Status` (`fldRFOzNqVswqZ1mN`):
- `Ej avstämt` — Närvaropoäng = 0 (default)
- `Närvarande` — Närvaropoäng = 1
- `Deltog online` — Närvaropoäng = 1
- `Frånvarande` — Närvaropoäng = 0
- `Försenad` — Närvaropoäng = 0
- `Avbröt` — Närvaropoäng = 0

---

## Grundarkitektur — Airtable-basen

- **Base ID:** `app8uGPrVCVOm6LfD`
- **18 tabeller** — tre är kärnan, resten är stöd
- **11 automationer** (A1–A11), alla aktiva
- **10 Zapier-zaps** (formulär → Airtable, plus Soundwise-integrationer)
- **2 Make.com-scenarier** (segmentering + bulkmail)
- **Delas av:** Miranon Media (primär ägare) och Psionautics (gäst, delar tabellerna)

### De tre kärntabellerna

```
Personer ─────────┬───────────────── Anmälningar
   (master        │                   (en rad per
   registry)      │                   person × event)
                  │                           │
                  └─── Deltaganden ───────────┘
                     (en rad per person
                     × event × session —
                     där närvaro markeras)
```

**Personer** — en rad per unik person. All kurshistorik och alla rollups samlas här.
**Anmälningar** — en rad per person per event. Datumstämpel, betalstatus, mailhistorik.
**Deltaganden** — en rad per person per sessionsdag. **Detta är platsen där närvaro markeras.** Allt som räknas som "genomförd kurs" utgår härifrån.

### Övriga tabeller

| Kategori | Tabeller |
|---|---|
| Event-domän | Eventplanering, Eventformat |
| Lead-magnet-domän | Erbjudanden, Hämtade erbjudanden, Engagemang |
| CRM/kontakt | Touchpoints, Kontaktlogg (rådata) |
| Bulkmail | Bulkutskick, Segment, Utskickslogg, Email Opens |
| Publik funnel | Väntelista |
| Systemstöd | Error-log, Path to Conversion, Instagram Posts |

Se schema_reference.md rad 7–30 för full tabellöversikt.

### Psionautics-tillägg — fält som saknas i schema_reference.md

Dessa fält har skapats via Psionautics-admin-utvecklingen men är ännu inte synkade tillbaka till schema_reference.md. Tills det dokumentet uppdateras är *detta* avsnitt referensen.

**Anmälningar (`tbloOcrppVoyrHbrq`):**

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| Källa | `fldwk2sl7CkBv9epw` | singleSelect | 2026-04-15 | Hur anmälan skapades. Val: `Manuell`, `+1`, `Väntelista`. Formuläranmälningar lämnar fältet tomt. Sätts av Edge Functions (`create-registration`). |
| Medföljande till | `fld39KEXJxyulXfsN` | multipleRecordLinks (self) | 2026-04-15 | Länkar en +1-anmälan till huvudanmälan. Sätts av CompanionModal i admin. |
| Deltagarinfo skickad | `fld3WBS0QQrqLpYtK` | dateTime | 2026-04-16 | Timestamp när deltagarinfo-PDF skickats via Resend-mall `medveten-kontakt-deltagarinformation`. Sätts av `send-email` Edge Function vid `type='participant-info'`. |

**Väntelista (`tbl2VxMx7JMkIxD4Q`):**

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| Flyttad till anmälan | `fldqMpSW5UJIhNdgm` | checkbox | 2026-04-15 | Markeras automatiskt när personen flyttas från väntelistan till Anmälningar. Raden ligger kvar som historik men filtreras bort från aktiv väntelista i admin. |

**TODO — synka till schema_reference.md nästa gång det dokumentet rörs.**

---

## Den kritiska distinktionen — två datakällor, två konsekvenser

**Det här är den viktigaste insikten i hela modellen.** Rollup-fälten på Personer kommer från två olika tabeller, och det avgör helt vad datan faktiskt betyder.

### Spår 1 — Räknar från Anmälningar (kräver INTE närvaro)

| Person-fält | Räknar |
|---|---|
| `Antal anmälningar (aktiva)` (`fldN8Qv3WCOm3Oheb`) | Summa av `Är aktiv (1/0)` på personens anmälningar |
| `Har en aktiv anmälan?` (`fld9Yr7aGST29Pbdf`) | "Aktiv" om kommande utbildning eller föreläsning finns |
| `Återkommande?` (`fld5npMbl3PaSlm4B`) | "Ja" om personen har BÅDE tidigare OCH kommande anmälningar |

Dessa fylls i så fort en Anmälan skapas och får sin Person-länk (via A2).

### Spår 2 — Räknar från Deltaganden (KRÄVER närvaro)

| Person-fält | Räknar |
|---|---|
| `RIM 1 ×` (`fldUwG9s0x071vOHc`) | COUNTA på `Deltaganden.RIM 1 eventkey` |
| `RIM 2 ×` (`fld6JzAkgeERQzLLI`) | COUNTA på `Deltaganden.RIM 2 eventkey` |
| `Fjärrskådning ×` (`fldlczklhguSg02H6`) | COUNTA på `Deltaganden.Fjärrskådning eventkey` |
| `Antal genomförda event` (`flddymQaYJGVCInzq`) | COUNTA på `Deltaganden.Genomfört event (1 rad per event)` |
| `Erfarenhetsnivå` (`fldWSkxHJS2xWav4t`) | Formula utifrån RIM 1/2-antal |
| `Erfarenhetsbadge` (`fld04qqDQLgbJbBef`) | SWITCH av Erfarenhetsnivå |
| `Genomförda event (lista)` (`fldfopt6vl3ZdOT5W`) | ARRAYJOIN av `Genomfört event` |
| `Kommande event` (`fldITyVMA9a4SHdgN`) | SUM av `Kommande poäng` |

Alla dessa är **tomma eller noll** tills `Deltaganden.Status` har satts till `Närvarande` eller `Deltog online`.

### Konsekvenserna i praktiken

- En rapport som visar "Ny/Återkommande" kan byggas **utan backfill** — data finns redan.
- En rapport som visar "Antal genomförda RIM 1-kurser" kräver **att närvaro är markerad** på tidigare event.
- Per 2026-04-16: 487 av 517 Deltaganden-poster har `Status = "Ej avstämt"` (94.2%). Kurshistorikdatan är därmed nästan tom.

---

## Insiktskedjan — från Status till Erfarenhetsbadge

Detta är DAG:en som gör att närvaromarkering på Deltaganden blir till en badge på Personer. Varje pil är ett beroende.

```
Deltaganden.Status
       │
       ▼
Deltaganden.Närvaropoäng (formula)
       IF(Status IN ["Närvarande","Deltog online"], 1, 0)
       │
       ├─────────────┬────────────────┬───────────────────┐
       ▼             ▼                ▼                   ▼
Deltaganden.    Deltaganden.     Deltaganden.       Deltaganden.
RIM 1 eventkey  RIM 2 eventkey   Fjärrskådning      Genomfört event
(formula +      (formula +       eventkey           (1 rad per event)
Kursnamn-filter) Kursnamn-filter) (formula +        (formula +
                                  Kursnamn-filter)   Session-filter)
       │             │                │                   │
       │ COUNTA      │ COUNTA         │ COUNTA            │ COUNTA
       ▼             ▼                ▼                   ▼
Personer.       Personer.        Personer.          Personer.
RIM 1 ×         RIM 2 ×          Fjärrskådning ×    Antal genomförda event
       │             │                │
       └─────────────┴────────────────┘
                     │
                     ▼ (via Totala deltaganden och IF-kedja)
       Personer.Erfarenhetsnivå (formula)
                     │
                     ▼ (via SWITCH)
       Personer.Erfarenhetsbadge (formula)
```

### Varje steg i klartext

**1. Status → Närvaropoäng**
```
IF(Status="Närvarande" OR Status="Deltog online", 1, 0)
```
Alla statusar som inte innebär närvaro (Ej avstämt, Frånvarande, Försenad, Avbröt) ger 0.

**2. Närvaropoäng → Eventkey-formler**
Tre parallella formler som filtrerar på kursnamn:
```
RIM 1 eventkey     = IF(Närvaropoäng=1 AND Kursnamn="Resor i medvetandet 1", Eventkey, BLANK)
RIM 2 eventkey     = IF(Närvaropoäng=1 AND Kursnamn="Resor i medvetandet 2", Eventkey, BLANK)
Fjärrskådning ek.  = IF(Närvaropoäng=1 AND Kursnamn="Fjärrskådning", Eventkey, BLANK)
```

**3. Närvaropoäng → Genomfört event (1 rad per event)**
```
IF(Närvaropoäng=1 AND (Session="Dag 1" OR Session="Föreläsning"), Eventlabel, BLANK)
```
Session-filtret är kritiskt: det hindrar att ett tvådagars-event räknas dubbelt (eftersom både Dag 1 och Dag 2 är separata Deltaganden-poster).

**4. Eventkey-formler → Personer.RIM 1 × / RIM 2 × / Fjärrskådning ×**
COUNTA (antal non-blank) på vardera rollup.

**5. Personer.Erfarenhetsnivå**
Klassificerar personen utifrån RIM 1 × och RIM 2 × (full formel i schema_reference.md). Resultat i ordning från lägst till högst engagemang:

| Nivå | Villkor |
|---|---|
| Ej påbörjat | Totala deltaganden = 0 |
| Fjärrskådning | Fjärrskådning × > 0, inga RIM |
| RIM steg 1 | RIM 1 × = 1, RIM 2 × = 0 |
| RIM steg 1 – upprepat | RIM 1 × ≥ 2, RIM 2 × = 0 |
| Genomfört RIM steg 1–2 | RIM 1 × > 0 AND RIM 2 × > 0, totalt < 3 |
| Genomfört RIM steg 1–2 (upprepat) | RIM 1 × > 0 AND RIM 2 × > 0, totalt ≥ 3 |
| Avvikelse: RIM 2 utan RIM 1 | RIM 2 × > 0 AND RIM 1 × = 0 — fångar felordning |

**6. Personer.Erfarenhetsbadge**
Översätter teknisk nivå till human-readable badge:

| Erfarenhetsnivå | Badge |
|---|---|
| Ej påbörjat | Ej påbörjat |
| Fjärrskådning | Fjärrskådare |
| RIM steg 1 | Resenär steg 1 |
| RIM steg 1 – upprepat | Resenär steg 1 (upprepat) |
| Genomfört RIM steg 1–2 | Resenär steg 1–2 |
| Genomfört RIM steg 1–2 (upprepat) | Resenär steg 1–2 (upprepat) |
| Avvikelse: RIM 2 utan RIM 1 | Avvikelse |

### ⚠️ Kända buggar i insiktskedjan

**Dead branches i Erfarenhetsbadge.** SWITCH-formeln mappar också:
- `"Genomfört alla"` → `"Miranon Media stjärna"`
- `"Genomfört alla (upprepat)"` → `"Hängiven utforskare"`

Men `Erfarenhetsnivå`-formeln returnerar aldrig de värdena. Grenarna är döda. För att aktivera dem behöver Erfarenhetsnivå utökas med en nivå för "alla tre kurstyper genomförda" (RIM 1 + RIM 2 + Fjärrskådning).

---

## Anmälningskedjan — parallellt flöde

Detta är det snabbare flödet som inte kräver närvaro. Det är det vi kan exportera idag.

```
Anmälan skapas
       │
       ▼
A1 sätter Event-länk (via EventKey/Expresslabel-match)
       │
       ▼
A2 sätter Person-länk (söker via normaliserad e-post, skapar om ny)
       │
       ├─────────────────────────┬────────────────────────┐
       ▼                         ▼                        ▼
Anmälningar.             Anmälningar.             Anmälningar.
Är aktiv (1/0)           "Vill anmäla sig till"   Typ
(formula)                (multipleSelects)         (singleSelect)
       │                         │                        │
       │ SUM                     │ (rollup till Personer) │ (rollup till Personer)
       ▼                         ▼                        ▼
Personer.                Personer.                 Personer.
Antal anmälningar        Antal tidigare            Anmäld till antal
(aktiva)                 genomförda utbildningar   kommande utbildningar
       │                         │                        │
       │                         └─────────┬──────────────┘
       │                                   ▼
       │                         Personer.Återkommande?
       │                         IF(tidigare>0 AND kommande>0, "Ja", "Nej")
       │
       │                         Personer.Har en aktiv anmälan?
       └────────────────────────▶ IF(kommande utb. + kommande förel. > 0,
                                     "Aktiv", "Ingen aktiv anmälan")
```

### ⚠️ `Återkommande?` — missvisande namn

Formeln är:
```
IF(tidigare genomförda utbildningar > 0 AND kommande utbildningar > 0, "Ja", "Nej")
```

**Detta mäter INTE "har personen gått kurs tidigare".** Det mäter **"är personen en aktiv återkommande kund som bokat om"**. En person som gått RIM 1 2024 men inte har någon kommande bokning → `Återkommande? = Nej`.

För en "Ny/Återkommande"-badge i admin-tabellen som betyder "har gått kurs tidigare" räcker *inte* det här fältet. Man behöver antingen:
- `Antal tidigare genomförda utbildningar > 0` direkt, eller
- `Antal genomförda event > 0` (som dock kräver närvaro-backfill)

### ⚠️ Självrapporterade tidigare kurser

`Antal tidigare genomförda utbildningar` på Personer är en rollup från Anmälningar-fältet `Vill anmäla sig till` (fld6RC3r0R9tuKgdF). Det räknar alltså vad personen *själv angett i formuläret* — inte vad som är verifierat i Deltaganden. Stämmer ofta men inte alltid.

---

## Automationssekvenser

### Sekvens 1 — Ny anmälan (A1 → A2 → A3 → A11)

När en ny rad skapas i Anmälningar:

```
Anmälan skapas
      │
      ▼
A1: Matcha event
      → Sätter Anmälningar.Event via EventKey eller Expresslabel
      │
      ▼ (parallellt)
A2: Koppla/skapa person
      → Matchar Person via e-post (eller skapar ny)
      → Sätter Anmälningar.Person
      → Skapar Touchpoint
      │
      ▼
A3: Förskapa deltaganden (villkor: Person + Event + tom Deltaganden)
      → Läser Event.Sessionsmall (lookup via Eventtyp → Eventformat.Format)
      → Skapar en Deltaganden-rad per session (ex: ["Dag 1", "Dag 2"])
      → Alla med Status = "Ej avstämt"
      │
      ▼
A11: Koppla Deltagande till Person
      → Kopierar Anmälan.Person-länk till Deltaganden.Person (länk)
```

Efter sekvensen:
- Anmälan är kopplad till event och person
- Deltaganden-rader finns (en per sessionsdag), men närvaro är inte markerad
- Personer-rollups uppdateras: Anmälningar-baserade fylls i direkt, Deltaganden-baserade förblir noll tills A9/A10 körs

### Sekvens 2 — Närvaromarkering (A9/A10 → A8)

Två ingångar — en session eller alla:

```
Alternativ A (vald session):
Eventplanering."Markera alla närvarande" = TRUE AND Check-in session != tom
      │
      ▼
A9: Markera närvaro (vald session)
      → Läser "Check-in session" + "Närvarostatus att sätta"
      → Uppdaterar Status + Avstämt på matchande Deltaganden
      → Resettar checkboxen

Alternativ B (alla sessioner):
Eventplanering."Markera alla närvarande (alla sessioner)" = TRUE
      │
      ▼
A10: Markera närvaro (alla sessioner)
      → Läser Sessionsmall (eller fallback: unika Session-värden i Deltaganden)
      → Identisk logik som A9 men för alla sessioner
      → Resettar checkboxen
```

Båda triggar i sin tur A8:

```
Deltaganden.Status uppdateras
      │
      ▼
A8: Tidstämpel
      → Sätter Avstämt = NOW()
```

När A9/A10 kört färdigt fylls alla Deltaganden-baserade rollups på Personer i automatiskt (via Airtables formelmotor).

### Sekvens 3 — Lead-magnet (A4 → A5)

```
Rad skapas i Hämtade erbjudanden
      │
      ▼
A4: Koppla lead till person
      → Matchar erbjudande via Source key
      → Matchar/skapar Person via e-post
      → Sätter länkar, skapar Touchpoint ("Angett e-post för erbjudande")
      │
      ▼ (vid uppdatering)
A5: Skapa/uppdatera engagemang
      → Yttre IF: säkerställ Person + Erbjudande är satta
      → Inre IF: om Engagemang finns → uppdatera Senaste hämtning
                 annars → skapa nytt Engagemang
```

### Övriga automationer

| # | Trigger | Effekt |
|---|---|---|
| A6 | Eventplanering: `Anmäld beläggning (%) = 1` | Skickar fullbokat-notis till Roger/Lotta |
| A7 | Anmälningar updated | Synkar `Ej betalda (records)` på eventraden. OBS: triggas vid VARJE uppdatering, inte bara betalningsändring |

---

## Edge Functions (Psionautics)

Lever i `~/Repon/psionautics/supabase/functions/`. Läser och skriver mot Airtable på uppdrag av admin-appen.

| Function | Syfte |
|---|---|
| `get-event-bookings` | Hämtar anmälningar + platsberäkning för eventet |
| `get-all-registrations` | Admin-vyn — alla fält |
| `update-registration` | Status, Betalning, waitlist, maxPlatser |
| `create-registration` | Ny Anmälan + Källa + Medföljande till + dubblettskydd (409) |
| `create-waitlist-entry` | Ny rad i Väntelista |
| `send-email` | Resend — confirmation/payment/plus-one/participant-info |
| `get-waitlist` | Filtrerar bort "Flyttad till anmälan" |
| `get-waitlist-stats` | Väntelista per utm_content/medium |
| `generate-template-image` | ScreenshotOne PNG-export |
| `create-admin-user` | Skapar admin-konton |

För Miranon Media-appen: 4 implementerade, 8 planerade i `miranon-media-admin/src/data/adapters/AirtableAdapter.ts` (TODO).

---

## Kända fällor

Detta är saker som har bitit oss eller sannolikt kommer att bita oss.

1. **Anmälan ≠ Deltagande.** Att någon är anmäld betyder inte att de har gått kursen. Kurshistorik-rollups är nollade tills `Deltaganden.Status = "Närvarande"` har satts via A9/A10.

2. **Formula-fält går inte att skriva till.** `Namn`, `Normaliserad e-post`, `Erfarenhetsnivå` med flera är computed. Skriv till källfälten (Förnamn, Efternamn, E-post osv) istället.

3. **Spegelfält skapar inga relationer.** `Eventplanering.Anmälningar (länkat fält)` är read-only — det speglar länkar som skapats från Anmälningar-sidan. Skriv alltid från "ägar-sidan".

4. **Psionautics-event räknas inte in i RIM/FS-rollupsen.** Rollup-formlerna filtrerar på `Kursnamn = "Resor i medvetandet 1" | "Resor i medvetandet 2" | "Fjärrskådning"`. Psionautics-eventet heter "Psionautics" → ingen träff. Avsiktligt.

5. **`Återkommande?` är missvisande.** Se avsnittet *Anmälningskedjan*.

6. **Dead branches i Erfarenhetsbadge.** Se avsnittet *Insiktskedjan*.

7. **Självrapporterade tidigare kurser.** `Antal tidigare genomförda utbildningar` räknar från formuläret, inte Deltaganden.

8. **Fjärrskådning är en fallback i Erfarenhetsnivå, inte en egen gren.** Formelns sista IF-gren returnerar `"Fjärrskådning"` bara om RIM 1 × = 0 AND RIM 2 × = 0 — dvs. personen har inga RIM-kurser alls. Om någon gått både RIM 1 och Fjärrskådning visas deras Erfarenhetsnivå som `"RIM steg 1"` och fjärrskådningen syns endast i `Fjärrskådning ×`-räknaren, inte i Erfarenhetsnivå eller Erfarenhetsbadge. Detta förklarar också de döda SWITCH-grenarna (`Genomfört alla`).

9. **A1 överskriver Event-fältet.** A1 triggas vid `Record created` men matchar varje gång — om en Edge Function skapat Event-länken direkt kan A1 nollställa den. Lösning (etablerad i `create-registration`): sätt EventKey OCH Event direkt. A1 matchar samma värde = idempotent.

10. **A7 triggas vid varje uppdatering av Anmälningar.** Inte bara betalningsförändringar. Kostsamt vid massuppdateringar.

11. **Manuella Deltaganden-poster länkas inte automatiskt.** Rader skapade direkt i Airtable (inte via A3) får ingen Event-länk om Sessionsmall inte är satt.

12. **A3 skapar inget om Sessionsmall är tom.** Det är då ingen närvaro kan markeras på eventet.

13. **Sessionsmall bor på Eventformat, inte Eventplanering.** `Eventplanering.Sessionsmall` (`fldFSQSopc87UBXpT`) är en lookup via `Eventtyp` → `Eventformat.Format`. För att ändra sessionsstrukturen för en eventtyp: gå till Eventformat-tabellen, inte till enskilda eventrader.

14. **Väntelistan flyttas inte — den kopieras.** En "flytt" från väntelista till Anmälningar skapar ny Anmälnings-rad + sätter checkboxen `Flyttad till anmälan` på väntelisteposten. Gamla raden ligger kvar som historik.

15. **Källa-fältet har ingen "Arrangör"-option.** Frontend-filter som `b.kalla !== "Arrangör"` är dead code.

16. **Manuella rader i Anmälningar kopplas inte automatiskt till eventet via formulärmatchning.** Skapad direkt i Airtable utan EventKey → A1 matchar inte → Event förblir tom → A3 triggas aldrig.

---

## Datakvalitetsstatus (2026-04-16)

### Deltaganden-tabellen — hela basen

| Status | Antal | Andel |
|---|---|---|
| Ej avstämt | 487 | 94.2% |
| Närvarande | 30 | 5.8% |
| Frånvarande | 0 | 0% |
| Försenad | 0 | 0% |
| Avbröt | 0 | 0% |
| Deltog online | 0 | 0% |
| **Totalt** | **517** | **100%** |

**94.2% saknar närvaromarkering.** Detta är huvudanledningen till att kurshistorik-rapporter är nästan tomma idag.

### Medveten Kontakt (`recQ2TPsY69fQXA8a`) — fungerar som förväntat

| Mått | Värde |
|---|---|
| Totalt antal Deltaganden-poster | 202 |
| Dag 1-poster | 101 |
| Dag 2-poster | 101 |
| Status "Ej avstämt" | 202 (100%) |

A3 har skapat 2 poster per anmälan (Dag 1 + Dag 2). Sessionsmallen fungerar. Närvaro kommer att markeras efter eventet (1–3 maj 2026).

### De 30 verifierade "Närvarande"-posterna

Kommer från tre specifika event:
- RIM 1 Falköping 2026-03-21
- RIM 1 Rönninge 2025-12-13
- Fjärrskådning Rönninge 2025-11-29

### ~285 "Ej avstämt" på genomförda event

Resterande ≈285 Deltaganden-poster (`517 − 202 Medveten Kontakt − 30 Närvarande`) hör till andra genomförda event där närvaro aldrig markerats via A9/A10. Detta är backfill-volymen.

---

## Backfill-strategier

För att kurshistorik-rollups ska få meningsfulla värden retroaktivt:

### Scenario A — Ingen backfill

Bygg rapporter enbart på Anmälningskedjan (Återkommande?, Har aktiv anmälan?, Antal anmälningar aktiva). Kurshistorik förblir tom. Snabbt men begränsat.

### Scenario B — Batch-markera alla avslutade event som "Närvarande"

Anta: alla anmälda till avslutade event deltog. Kräver bekräftelse från Lotta per event. Två tekniska vägar:

- **Via UI** — öppna varje genomfört event → bocka `Markera alla närvarande (alla sessioner)` → A10 fixar resten
- **Via API** — batch-PATCH `Status = "Närvarande"` på berörda Deltaganden. Snabbare men mer riskfyllt om antagandet är fel

Uppskattning: ~285 poster, uppskattningsvis 10–20 event. 30–60 minuter arbete beroende på väg.

### Scenario C — Event-för-event granskning

Lotta går igenom faktiska deltagarlistor (papper, Docs, minne) per event och markerar individuell närvaro (Närvarande vs Frånvarande). Ger sanning men tar tid.

### Hybrid

Batch-markera de event där antagandet är rimligt, granska de osäkra. Sannolikt den realistiska vägen.

---

## Luckor — vad vi inte verifierat än

Code kan ta dessa när de blir relevanta för en specifik uppgift.

1. **Touchpoints-tabellens konsumenter.** A2 och A4 skapar Touchpoints — men vem läser dem? Används de i rapporter? Bulkmail? CRM-analys?

2. **Make.com-scenarierna i detalj.** Kartlagda på hög nivå ("Beräkna antal i segment", "Skicka mail" — inaktiv), men exakta datamappningar och error-hantering är odokumenterade.

3. **Zapier-zaps i produktionskontext.** 10 zaps dokumenterade i schema_reference.md — men vilka är aktuella, vilka kan arkiveras, och finns det överlapp med Edge Functions?

4. **Path to Conversion-tabellens syfte.** Finns i basen men ingen dokumentation om vad den används till.

5. **Instagram Posts-tabellens syfte.** Samma som ovan. Kan vara tom.

6. **Miranon Media Admin — utbytbar datakälla.** React-projektet har `DataSourceAdapter`-mönstret förberett för Airtable → Supabase-migration. Exakt migrationsplan och trigger bor i `miranon-media-admin/docs/conversion-plan.md`.

7. **Datamodell-research för världsklass.** Separat uppdrag som ska köras i miranon-media-admin: identifiera principer för toppklass-datamodeller → gapanalys mot nuvarande modell → migrationsplan. Se `miranon-media-admin/tasks/todo.md`.

---

## Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-04-16 | Första version. Snabbreferens, två datakällor, insiktskedja, anmälningskedja, automationssekvenser, 16 kända fällor, datakvalitet, backfill-strategier. Baserat på Code-extraktion ur schema_reference.md + Airtable MCP-verifiering. Dokumenterar 4 Psionautics-fält som saknas i schema_reference.md (ska synkas tillbaka). |
