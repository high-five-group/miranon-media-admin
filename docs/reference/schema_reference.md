# Schema-referens — Miranon Media OS

> **Frusen ögonblicksbild av PROD-basen (`app8uGPrVCVOm6LfD`), mars 2026 —
> projektnära kopia sedan 2026-08-01 (Marcus-beslut).** Original:
> `~/Repon/miranon-media-os/docs/schema_reference.md` i det FRYSTA
> Vue-referensrepot (käll-commit `42e32fe`, 2026-04-03; enda commit som rört
> filen) — källan redigeras aldrig, så kopian kan inte divergera. Ingen tyst
> dubbel-källa: detta är samma dokument, flyttat till ytan som konsumerar det.
> **För fält, fält-ID:n, skrivbarhet och fällor är
> [`data-model.md`](./data-model.md) AUKTORITATIV** — denna fil saknar fälten
> som tillkom i april 2026 och prod-speglingen 2026-07-23. Kopians värde är
> ytorna `data-model.md` medvetet inte täcker: interfaces, vyer per tabell,
> formulär (Elfsight), Zapier-mappningar, Make.com-scenarier och
> automationerna A1–A11 i läsbar form med komplett skriptkod.

*Skapad: 7 mars 2026 | Session 2 | Uppdaterad: 7 mars 2026 (session 3 — vyer + Make.com)*
*Bas-ID: `app8uGPrVCVOm6LfD`*

---

## Tabellöversikt (18 tabeller)

| # | Tabell | ID | Records | Fält | Roll |
|---|---|---|---|---|---|
| 1 | Eventplanering | `tblVE3UKWl1CKrphV` | 24 | 41 | Alla event med datum, ort, beläggning, närvarohantering |
| 2 | Eventformat | `tbl8qhuJQ5ZWPMRk4` | 2 | 3 | Eventtyper (definierar sessionsmallar) |
| 3 | Anmälningar | `tbloOcrppVoyrHbrq` | 183 | 48 | Alla anmälningar med persondata, betalstatus, formulärdata |
| 4 | Personer | `tbl6ZyCm3V026iFTU` | 238 | 87 | Persondatabas (master registry) |
| 5 | Deltaganden | `tbldWHH6sSHWoQPHH` | 353 | 48 | Närvaro per person per session |
| 6 | Hämtade erbjudanden | `tblqFpgxEhJ95AEcM` | 116 | 16 | Nedladdningar av erbjudanden |
| 7 | Engagemang | `tbl9H2SoGFfysBj5y` | 36 | 10 | Aggregerat engagemang per person+erbjudande |
| 8 | Erbjudanden | `tblcCFGCVrnl1JZfg` | 2 | 7 | Erbjudandedefinitioner |
| 9 | Touchpoints | `tbl22SCvlHrgcAiZi` | 303 | 17 | Kontaktpunkter per person (historik) |
| 10 | Kontaktlogg (rådata) | `tblzg4DsRzCCXH8Vy` | 15 | 19 | E-post och annan kontakt |
| 11 | Error-log | `tblnnmWswnRp9gFws` | 0 | 4 | Automatiskt loggade fel |
| 12 | Bulkutskick | `tblWarzSse85NI1Zx` | 9 | 12 | Mailutskick med segment och mallar |
| 13 | Segment | `tbll2N6JKCj4u6y9o` | 9 | 12 | Målgruppssegment med formler |
| 14 | Utskickslogg | `tblIesjbuSWNp6oxK` | 0 | 9 | Logg över skickade mail |
| 15 | Email Opens | `tblXFJyGRahQDhhqc` | 3 | 2 | Öppnade mail |
| 16 | Väntelista | `tbl2VxMx7JMkIxD4Q` | 20 | 12 | Väntelisteregistreringar |
| 17 | Path to Conversion | `tblor5TK8HeryGXIj` | 0 | 1 | (tom/ny) |
| 18 | Instagram Posts | `tblMpQI1crF521Xsp` | 0 | 1 | (tom/ny) |

---

## Relationskarta

### Huvudrelationer (link fields)

```text
Eventplanering ←→ Anmälningar        (via Anmälningar.Event ↔ Eventplanering.Anmälningar (länkat fält))
Eventplanering ←→ Eventformat        (via Eventplanering.Eventtyp ↔ Eventformat.Eventplanering)
Eventplanering ←→ Deltaganden        (via Eventplanering.Närvaro (records) ↔ Deltaganden.Event)
Eventplanering ←→ Anmälningar        (via Eventplanering.Ej betalda (records) ↔ Anmälningar.Ej betalda (records))

Anmälningar ←→ Personer              (via Anmälningar.Person ↔ Personer.Anmälningar (länkat fält))
Anmälningar ←→ Deltaganden           (via Anmälningar.Deltaganden ↔ Deltaganden.Anmälan)

Personer ←→ Touchpoints              (via Personer.Touchpoints ↔ Touchpoints.Person (länkat fält))
Personer ←→ Deltaganden              (via Personer.Deltaganden ↔ Deltaganden.Person (länk))
Personer ←→ Hämtade erbjudanden      (via Personer.Hämtade erbjudanden (länk) ↔ Hämtade erbjudanden.Person)
Personer ←→ Engagemang               (via Personer.Engagemang ↔ Engagemang.Person)
Personer ←→ Kontaktlogg              (via Personer.Mail logg (rådata) ↔ Kontaktlogg.Person)
Personer ←→ Utskickslogg             (via Personer.Utskickslogg ↔ Utskickslogg.Skickat till)

Hämtade erbjudanden ←→ Erbjudanden   (via Hämtade erbjudanden.Erbjudande ↔ Erbjudanden.Hämtade erbjudanden)
Hämtade erbjudanden ←→ Engagemang    (via Hämtade erbjudanden.Engagemang ID ↔ Engagemang.Hämtade erbjudanden ID)

Engagemang ←→ Erbjudanden            (via Engagemang.Erbjudande ↔ Erbjudanden.Engagemang)

Touchpoints ←→ Kontaktlogg           (via Touchpoints.Mail logg (rådata) ↔ Kontaktlogg.Länkad touchpoint)

Bulkutskick ←→ Segment               (via Bulkutskick.Segment ↔ Segment.Mailutskick)
Bulkutskick ←→ Utskickslogg          (via Bulkutskick.Utskickslogg ↔ Utskickslogg.Utskicks-ID)

Utskickslogg ←→ Email Opens          (via Utskickslogg.Antal öppnade mail ↔ Email Opens.Utskickslogg)
```

### Relationernas riktning (detaljerad)

| Från-tabell | Fält | → Till-tabell | Fält | prefersSingle | isReversed |
|---|---|---|---|---|---|
| Eventplanering | Anmälningar (länkat fält) `fldUAjTutSM0fziMT` | → Anmälningar | Event `fldi3enUaMdbuGSlm` | Nej | Nej |
| Eventplanering | Ej betalda (records) `fldjaxY8oWrNvS2El` | → Anmälningar | Ej betalda (records) `fldcPVkGSoVMMJqBP` | Nej | Nej |
| Eventplanering | Närvaro (records) `fldwyD1cheb759YN1` | → Deltaganden | Event `fldaj5mbpU3yPw2np` | Nej | Nej |
| Eventplanering | Eventtyp `fldCAGA9NPnd9kEmi` | → Eventformat | Eventplanering `fldJrYz0crDjRRSi2` | **Ja** | Nej |
| Anmälningar | Person `fldQekqRlLfup8x5K` | → Personer | Anmälningar (länkat fält) `fld8pOivka8YdiywK` | **Ja** | Nej |
| Anmälningar | Deltaganden `fldgKGmudjmdD6eQJ` | → Deltaganden | Anmälan `fldwQdDpRK8vByNhb` | Nej | Nej |
| Deltaganden | Person (länk) `fldiU06kbTxSafkm4` | → Personer | Deltaganden `fld5shm9UER5CMyTl` | **Ja** | Nej |
| Personer | Touchpoints `fldnuqNqlVzt47AAN` | → Touchpoints | Person (länkat fält) `fldLiC0ZiUAdxXu9u` | Nej | Nej |
| Personer | Hämtade erbjudanden (länk) `fld9IM8HnDzutkwf8` | → Hämtade erbjudanden | Person `fldiiSHn41rTti0vL` | Nej | Nej |
| Personer | Engagemang `flddG1tVJyaKBxBYv` | → Engagemang | Person `fld0HvkG5WYoFwcco` | Nej | Nej |
| Personer | Mail logg (rådata) `fldMX5zl7oY3e3ULy` | → Kontaktlogg | Person `fld8cQQyMqwqJBInZ` | Nej | Nej |
| Personer | Utskickslogg `fldFTiLWCWbzoh8vo` | → Utskickslogg | Skickat till `fldnNRJHfhEQLrQkp` | Nej | Nej |
| Hämtade erbjudanden | Erbjudande `fldU1Cv0sWVwAWw5A` | → Erbjudanden | Hämtade erbjudanden `flduRS5mJSLO228dW` | **Ja** | Nej |
| Hämtade erbjudanden | Engagemang ID `fldP6l3cUgB4JYorH` | → Engagemang | Hämtade erbjudanden ID `fldUFQybIcnreW8YP` | Nej | Nej |
| Engagemang | Erbjudande `fldgbiNrK8yiIioSc` | → Erbjudanden | Engagemang `fldPxfyd4TFRcU1hj` | **Ja** | Nej |
| Touchpoints | Mail logg (rådata) `fldcSJPi1Vweh7Gyc` | → Kontaktlogg | Länkad touchpoint `fldVqrMPEOaWgBes2` | Nej | Nej |
| Bulkutskick | Segment `fldPTDQXTTFCARTvt` | → Segment | Mailutskick `fldjUIp0iqRpJWgem` | Nej | Nej |
| Bulkutskick | Utskickslogg `fldIcvLFp3JDeWsap` | → Utskickslogg | Utskicks-ID `fldqK5kGeVjVtJcS0` | Nej | Nej |
| Utskickslogg | Antal öppnade mail `fldmDGQsMv8BbPWok` | → Email Opens | Utskickslogg `fldAwO8sDOSHjCOua` | Nej | Nej |
| Kontaktlogg | Person `fld8cQQyMqwqJBInZ` | → Personer | Mail logg (rådata) `fldMX5zl7oY3e3ULy` | **Ja** | Nej |

---

## Tabell 1: Eventplanering

**ID:** `tblVE3UKWl1CKrphV` | **Records:** 24 | **Primary field:** Eventlabel (formula)

### Fält

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Eventlabel | `fldciUVdjViG4nx9S` | formula | `{Ort} & " – " & {Typ} & " – " & {Event (text)} & " – " & DATETIME_FORMAT({Startdatum}, "YYYY-MM-DD")` → text |
| Event (text) | `fldNIc8I2ynUoLkNn` | formula | `{Event (source)}` → text |
| Typ | `fldkiFRVYG0xTAhJ4` | singleSelect | Utbildning, Föreläsning |
| Ort | `fldRvwXnDsgjwva2L` | singleLineText | — |
| Månad/år | `fld2BjFdBd964TzVb` | singleSelect | November 2025 – December 2026 |
| Startdatum | `fldBYhXEHLCd1o2Je` | date | ISO (YYYY-MM-DD) |
| Slutdatum | `fldUMB4x3OyGQ31aL` | date | ISO (YYYY-MM-DD) |
| Max antal platser | `fldbyEz8djcxCBO5r` | number | heltal |
| Antal anmälningar | `fldU5MCQmagdHtz4G` | count | Räknar records i Anmälningar (länkat fält) |
| Manuella platser | `fld8pUb6x2G3YIovs` | number | heltal. Anmälningar utanför formuläret |
| Extra platser | `fldIHwVr8Wq5tp4o6` | number | heltal. Reserverade av Roger och Lotta |
| Arrangörsplatser | `fldfrlZcRW3PGILiN` | number | heltal |
| Antal anmälda | `fldTQkYOz9O2BGEIZ` | formula | `{Antal anmälningar} + {Manuella platser}` → heltal |
| Anmäld beläggning (%) | `fldqkyeE7cVHMNRpH` | formula | `{Antal anmälda} / {Max antal platser}` → procent |
| Anmälningar (länkat fält) | `fldUAjTutSM0fziMT` | multipleRecordLinks | → Anmälningar (via `fldi3enUaMdbuGSlm`). Spegelfält – ändra alltid från Anmälningar |
| Vi kommer! | `fldKYJ6X1TYoYXAZt` | lookup | Via Anmälningar → Person (lookup av Person-länk) |
| Säsong | `fldBO6FGQeP7Qh8f4` | formula | SWITCH på månad → "❄️ Vinter", "🌱 Vår", "☀️ Sommar", "🍂 Höst" |
| EventKey | `fldhmhaz3ZnouAzDm` | formula | `"Event-" & {Event-nr}` → text. Unik nyckel per event |
| Expresslabel | `fldCPCcfF87fEkUdy` | formula | `{Datum (visas i länk)} & " – " & {Ort}` → text. Matchningsnyckel för expressformulär |
| AnmälningsURL (kopiera denna) | `fldNL35AL2cIKq7UF` | formula | Bygger komplett URL: `https://miranon.se/pages/anmalan?EventKey=...&Event=...&Typ=...&Datum=...&Ort=...` |
| Anmälningssida (knapp) | `fldVV8DPiUX35xB9q` | button | — |
| Nuvarande PDF | `fldkyoyo8uViIIa2T` | button | — |
| Event (source) | `flddlv4JA5C5CeH5R` | singleSelect | Fjärrskådning, Resor i medvetandet 1, Resor i medvetandet, Resor i medvetandet 2, Psionautics |
| PDF (URL) | `fldXIbT08897kV1Oa` | url | — |
| Datum (visas i länk) | `fldc3aWz7CxO4rDdl` | formula | Stor SWITCH-formel som formaterar datum till svenska ("15–16 november 2025"). Hanterar samma dag, samma månad, olika månader |
| Touchpoints | `fldeRc98Xs7XJRCn8` | singleLineText | — |
| Antal mottagna anmälningsavgifter | `fld7x0jguPqgS734u` | rollup | Via Anmälningar → Status (fldWr5cCPNx9HEKtL). Aggregering |
| Antal mottagna slutbetalningar | `fldZckDgPdSmJ0yPu` | rollup | Via Anmälningar → Status (fldWr5cCPNx9HEKtL). Aggregering |
| Bekräftad beläggning (%) | `fldEXx1dcJ7djfeEv` | formula | `IF({Max antal platser}, {Antal mottagna anmälningsavgifter}/{Max antal platser}, 0)` → procent |
| Ej betalt | `fld0vRSHAtOqjVksv` | lookup | Via Anmälningar → Förnamn (fldMZAwDbygfYN5WY) |
| Antal slutbetalning saknas | `fldgv8tekGEbNBZfw` | formula | `{Antal anmälda} - {Antal mottagna slutbetalningar}` → heltal |
| Ej betalda (records) | `fldjaxY8oWrNvS2El` | multipleRecordLinks | → Anmälningar (via `fldcPVkGSoVMMJqBP`) |
| Närvaro (records) | `fldwyD1cheb759YN1` | multipleRecordLinks | → Deltaganden (via `fldaj5mbpU3yPw2np`) |
| Event-nr | `fldl5By2a7jGBPpxF` | autoNumber | Autogenererat löpnummer |
| Eventtyp | `fldCAGA9NPnd9kEmi` | multipleRecordLinks | → Eventformat (via `fldJrYz0crDjRRSi2`). prefersSingle=true |
| Sessionsmall | `fldFSQSopc87UBXpT` | lookup | Via Eventtyp → Format (multipleSelects). Dag 1, Dag 2, Dag 3... Föreläsning, Intro, Q&A etc |
| Check-in session | `fldjX1YN7DOhoKvt1` | singleSelect | Dag 1, Dag 2, Föreläsning |
| Markera alla närvarande | `fldN20OexhRJQr9XY` | checkbox | Triggar A9 (vald session) |
| Markera alla närvarande (alla sessioner) | `fldF5atXm9lV2nAeq` | checkbox | Triggar A10 (alla sessioner) |
| Närvarostatus att sätta | `flddzMrhu30cXoaEf` | singleLineText | Konfigurerbar statustext. Fallback: "Närvarande" |

---

## Tabell 2: Eventformat

**ID:** `tbl8qhuJQ5ZWPMRk4` | **Records:** 2 | **Primary field:** Namn

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Namn | `fldDLGIg6XnTWi8ge` | singleLineText | T.ex. "Utbildning - 2 dagar" |
| Format | `fld1DsZdImXhyim4o` | multipleSelects | Dag 1–7, Föreläsning, Intro, Kvällspass, Q&A, Bonuspass, Avslut |
| Eventplanering | `fldJrYz0crDjRRSi2` | multipleRecordLinks | → Eventplanering (via `fldCAGA9NPnd9kEmi`) |

---

## Tabell 3: Anmälningar

**ID:** `tbloOcrppVoyrHbrq` | **Records:** 183 | **Primary field:** ID (autoNumber)

### Fält

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fld9ma56IzeckxDfX` | autoNumber | — |
| Person | `fldQekqRlLfup8x5K` | multipleRecordLinks | → Personer. prefersSingle=true |
| Event | `fldi3enUaMdbuGSlm` | multipleRecordLinks | → Eventplanering. prefersSingle=true. Sätts av automation A1 |
| Anmälningsavgift | `fldJtKQ3qLxRKOvR6` | singleSelect | Mottagen, Ej mottagen |
| Slutbetalning | `fldIImadnJUZHr5Qh` | singleSelect | Mottagen, Ej mottagen, Ej relevant (för föreläsningar) |
| Deadline slutbetalning | `fldGlznON7xqR3IE1` | formula | `IF(Slutbetalning="Ej relevant", BLANK(), DATEADD({Startdatum}, -14, 'days'))` → datum |
| Slutbetalning status visuellt | `fldphHILC1eFiVHXD` | formula | Visar Mottagen/Ej relevant/Försenad/Snart dags/Väntar baserat på deadline |
| Status | `fldWr5cCPNx9HEKtL` | singleSelect | Bekräftad (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Obekräftad |
| Rad skapad | `fldet9MU1rJBSpo3y` | createdTime | Stockholm-zon, 24h |
| Namn | `fldCFYtMUs0Kpu8BE` | formula | `{Förnamn} & " " & {Efternamn}` |
| Förnamn | `fldMZAwDbygfYN5WY` | multilineText | Från formuläret |
| Efternamn | `fldUIMY8mjBeem5BE` | multilineText | Från formuläret |
| Vill anmäla sig till | `fld6RC3r0R9tuKgdF` | multipleSelects | RIM 1, RIM 2, Fjärrskådning, Resor i medvetandet, Psionautics |
| Datum | `fldsROcE2FFTGCL3W` | singleLineText | Fritextfält från formulär |
| Typ | `fldGyYPbxkgS3BqVb` | singleSelect | Utbildning, Föreläsning, Psionautics-event |
| Ort | `fldP1LSzbyOJxrOGP` | singleLineText | Från formuläret |
| Startdatum | `fldAHtyo4P7Z08Vuj` | lookup | Via Event → Startdatum (date) |
| Slutdatum | `fldsltWfacFVf18Zq` | lookup | Via Event → Slutdatum (date) |
| Vilka kurser har du deltagit i tidigare? | `fldFFRpBJ3Dhs6eFw` | multilineText | Formulärfält |
| Varför vill du gå? | `fldAv80U5ssqOYguK` | multilineText | Formulärfält (motivering) |
| E-post | `fldVY310IdOIbTkE8` | multilineText | Från formuläret |
| Normaliserad e-post | `fld0CIF2qC7ufa8UD` | formula | `LOWER(TRIM({E-post}))` |
| Mobilnummer | `fldBLxAN1KnOUxNjG` | multilineText | Från formuläret |
| Datum och ort (från expressformulär) | `fldZTZ5Xzni3MCsDG` | singleLineText | T.ex. "15–16 november 2025 – Falköping". Matchas mot Eventplanering.Expresslabel |
| Har du gått steg 1? | `fldE9RwOG42yX4oVA` | multilineText | Formulärfält |
| Villkor godkända | `fldwSsq3ZELmtRHPY` | multilineText | Formulärfält |
| Från formulär | `fldCLVfJIHcuI1l83` | multipleSelects | Huvudformulär, Expressformulär, Obekräftad, Anmälan-Psionautics.se |
| EventKey | `fldPlPLkpqm0X7Xs2` | multilineText | Skickas med som parameter i anmälnings-URL |
| Betalstatus anmälningsavgift (text) | `fld8UBd8SWIJfVukq` | formula | Konverterar singleSelect till text |
| Betalstatus slutbetalning (text) | `fldpk5zqr5Je0k880` | formula | Konverterar singleSelect till text |
| Flagga | `fld6DHDYJZeK2r7OE` | singleSelect | Ny anmälan, Ej mottagen, Mottagen |
| Ej betalda (records) | `fldcPVkGSoVMMJqBP` | multipleRecordLinks | → Eventplanering (via `fldjaxY8oWrNvS2El`) |
| Event (namn) | `fldK1aYEm3iCg8OOh` | formula | `{Vill anmäla sig till}` |
| Skicka betalningspåminnelse | `fldbQ7L6gXslLckG1` | formula | Bygger mailto:-länk med personens namn, event och deadline |
| Dagar kvar till deadline | `fldZKPoOpziYbthYF` | formula | `DATETIME_DIFF({Deadline slutbetalning}, TODAY(), 'days')` → heltal |
| Inskickad | `fldNtSHQivkL26B6L` | dateTime | — |
| Deltaganden | `fldgKGmudjmdD6eQJ` | multipleRecordLinks | → Deltaganden (via `fldwQdDpRK8vByNhb`) |
| Motivering (sammanfattning) | `fldrMT8cWP3NmBc9T` | formula | Kombinerar Event-namn + Ort + Startdatum + Motiveringstext |
| Är aktiv (1/0) | `fld4j7PeckDViTdIB` | formula | `IF(Status="Avbokad/Ombokad", 0, 1)` → heltal |
| Är avbokad/ombokad (1/0) | `fld7KFhNH6vtM1L4A` | formula | `IF(Status="Avbokad/Ombokad", 1, 0)` → heltal |
| Frågor eller funderingar? | `fldtaSHOvGjgu9v39` | multilineText | Formulärfält (psionautics.se) |
| Uppdatera mig om fler event? | `fldeBejosU8PzDtQM` | singleLineText | Formulärfält (psionautics.se) |
| Betalning mottagen (psionautics) | `fldQE6aPiFfwVmJQ3` | checkbox | — |
| Antal platser | `flduwoTPdI8elSNyD` | number | heltal |
| Notering | `fldPMsiRoLWcgUbsv` | multilineText | — |
| Bekräftelse skickad | `fld0jnbkIbuFAumgG` | dateTime | — |
| Betalningspåminnelse skickad | `fldE0cR4r9vI0rKiL` | dateTime | — |
| Plus-one förfrågan skickad | `fld9BkFY8K5pF0xJ2` | dateTime | — |

---

## Tabell 4: Personer

**ID:** `tbl6ZyCm3V026iFTU` | **Records:** 238 | **Primary field:** Namn (formula)
**Beskrivning:** Persondatabas (master registry)

### Kärnfält

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Namn | `fldnYys0Ac3UGOdpe` | formula | `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(Förnamn & " " & Efternamn))` |
| Rad skapad | `fldF1MrcL3KIl0MsV` | createdTime | — |
| E-post | `fldcd5HnYooVZY4Ts` | multilineText | — |
| Telefon | `fldmMYIUhIc1HMnZi` | multilineText | — |
| Förnamn | `fldx4jrCJDOtWUk4O` | multilineText | — |
| Efternamn | `fldjcYkSmJBLRhwsO` | multilineText | — |
| E-post (manuell inmatning) | `fldhp3qXp2E6ekW5D` | email | — |
| Anteckningar | `fldWGlNr3ujRHo85w` | multilineText | — |

### Länkfält (relationer)

| Fält | ID | Typ | → Tabell |
|---|---|---|---|
| Anmälningar (länkat fält) | `fld8pOivka8YdiywK` | multipleRecordLinks | → Anmälningar |
| Touchpoints | `fldnuqNqlVzt47AAN` | multipleRecordLinks | → Touchpoints |
| Deltaganden | `fld5shm9UER5CMyTl` | multipleRecordLinks | → Deltaganden |
| Hämtade erbjudanden (länk) | `fld9IM8HnDzutkwf8` | multipleRecordLinks | → Hämtade erbjudanden |
| Engagemang | `flddG1tVJyaKBxBYv` | multipleRecordLinks | → Engagemang |
| Mail logg (rådata) | `fldMX5zl7oY3e3ULy` | multipleRecordLinks | → Kontaktlogg |
| Utskickslogg | `fldFTiLWCWbzoh8vo` | multipleRecordLinks | → Utskickslogg |

### Anmälnings-rollups

| Fält | ID | Typ | Källa (via Anmälningar) |
|---|---|---|---|
| Anmäld till (kommande) | `fldxVr7PSZbsm2mI7` | rollup | → Vill anmäla sig till |
| Anmäld till antal kommande utb. | `fldDfYF4GffBC9Byw` | rollup | → Typ (antal) |
| Anmäld till antal kommande förel. | `fldZvHFuVGwerfJrF` | rollup | → Typ (antal) |
| Motivering (från anmälningsformulär) | `fldIuuv4orI0DyLro` | rollup | → Varför vill du gå |
| Motiveringar (lista) | `fld58ihHj9MSv6Svu` | rollup | → Motivering (sammanfattning) |
| Antal tidigare genomförda utb. | `fldmPYa7RAyWbU4M0` | rollup | → Vill anmäla sig till (antal) |
| Eventtyp | `fldlyRELdcLKMg0t2` | rollup | → Typ |
| Antal anmälningar (totalt) | `fldsuq7xJepOyYO0w` | rollup | → ID (antal) |
| Antal anmälningar (aktiva) | `fldN8Qv3WCOm3Oheb` | rollup | → Är aktiv (1/0) |
| Antal anmälningar (avbokade) | `fldpzeFVVMyDnQZrN` | rollup | → Är avbokad/ombokad (1/0) |
| Datum | `fld3Kq49h7Po6863s` | lookup | → Datum |
| Ort | `fldBd946g2waLT7NG` | rollup | → Ort |

### Deltagande-rollups

| Fält | ID | Typ | Källa (via Deltaganden) |
|---|---|---|---|
| Genomförda dagar | `fldpgCjzpgtDhqIaQ` | rollup | → Närvaropoäng |
| Kommande event | `fldITyVMA9a4SHdgN` | rollup | → Kommande poäng |
| Senaste deltagande datum | `fldHsZVnerqflbWCp` | rollup | → Deltog datum |
| Senast deltagande (rad) | `fldvAQbWMNoj3oPqm` | rollup | → Deltog sammanfattning |
| Nästa event (rad) | `fldHN2Ar5E6tQWlYF` | rollup | → Kommande sammanfattning |
| Antal genomförda event | `flddymQaYJGVCInzq` | rollup | → Genomfört event (1 rad per event) (antal) |
| Genomförda event (lista) | `fldfopt6vl3ZdOT5W` | rollup | → Genomfört event (1 rad per event) |
| RIM 1 × | `fldUwG9s0x071vOHc` | rollup | → RIM 1 eventkey (antal) |
| RIM 2 × | `fld6JzAkgeERQzLLI` | rollup | → RIM 2 eventkey (antal) |
| Fjärrskådning × | `fldlczklhguSg02H6` | rollup | → Fjärrskådning eventkey (antal) |
| RIM 1 event (lista) | `fld4kuiQrB6bkO35X` | rollup | → RIM 1 genomfört (lista) |
| RIM 2 event (lista) | `fldkFpwQONNyg4fHA` | rollup | → RIM 2 genomfört (lista) |
| Fjärrskådning event (lista) | `fldA0N8lckVJrmtTx` | rollup | → Fjärrskådning genomfört (lista) |
| Utbildningsdagar möjliga | `fldzX0MNxmAzOGOsk` | rollup | → Utbildningsdag (historik) |
| Utbildningsdagar genomförda | `fldbu0YGvu8gXSFHj` | rollup | → Närvaro (historik) |
| Senast genomfört event datekey | `fldNCx2ev2Jt8vhkH` | rollup | → Genomfört event datekey |
| Senast genomförda event | `fldzFWa0z3cwgU1aJ` | rollup | → Kursnamn (lookup) |
| Min dagar sedan (Deltagande) | `fld5997POaT6irhOp` | rollup | → Dagar sedan (nummer) |

### Touchpoint-rollups

| Fält | ID | Typ | Källa (via Touchpoints) |
|---|---|---|---|
| TP sammanfattning (rollup) | `fldgzFXqDGTdKEf60` | rollup | → TP sammanfattning |
| Senast touchpoint datum | `fld8e65ppGbVzaSv4` | rollup | → Datum |
| Totalt antal hämtningar (erbjudande) | `fldd782imiCRtFJ4t` | rollup | → Touchpoint ID (antal) |
| Alla hämtningar | `fldHchJXiIFw3BuFy` | rollup | → Erbjudande + datum |
| Första nedladdning (key) | `fld4kEGqnHd86NkGG` | rollup | → _datekey |
| Första nedladdning (sortkey) | `fldSnKFB3Og3cSh8S` | rollup | → Sortkey |
| Senast nedladdning (key) | `fldAKV3haCxGx0vpI` | rollup | → Sortkey |
| Min dagar sedan (TP) | `fldWiUTbxBpDjlVKq` | rollup | → Dagar sedan (nummer) |

### Beräknade fält (formler)

| Fält | ID | Formel (sammanfattning) |
|---|---|---|
| Erfarenhet (sammanfattning) | `fld8D6B8a23W17VD1` | Kombinerar RIM 1 × + RIM 2 × + Fjärrskådning × med "•" separator |
| Totala deltaganden | `fldBP7xdEmpXDwUpz` | RIM 1 + RIM 2 + Fjärrskådning |
| Erfarenhetsnivå | `fldWSkxHJS2xWav4t` | Komplex IF/AND-logik som klassificerar baserat på antal RIM 1/2 deltaganden |
| Erfarenhetsbadge | `fld04qqDQLgbJbBef` | SWITCH på Erfarenhetsnivå → "Resenär steg 1", "Fjärrskådare" etc |
| Skicka e-post | `fldlo3x4jKHBwvOg5` | `"mailto:" & LOWER(TRIM(ARRAYJOIN({E-post})))` |
| Motivering (text) | `fld4ENxbma679wvcC` | Konverterar rollup till text |
| Nästa event (text) | `fldc0Zdap83E3jMwi` | Tar första raden ur rollup |
| Senast deltagande (text) | `fldcvEZBNvkl1MCN3` | Tar första raden ur rollup |
| Senast touchpoint (text) | `fld8y8pf87Lq09F91` | Tar första raden ur rollup |
| RIM 1 events (pretty) | `fldzd4YElq4zUdePZ` | Formaterar eventlista med parenteser |
| RIM 2 events (pretty) | `fldW3A1dxJ5zHIsVo` | Formaterar eventlista med parenteser |
| Fjärrskådning events (pretty) | `fldqgl9NYPnYUzqCN` | Formaterar eventlista med parenteser |
| Har en aktiv anmälan (Ja/Nej) | `fldMv413mufrfLZnW` | Baserat på Har en aktiv anmälan? |
| Har en aktiv anmälan? | `fld9Yr7aGST29Pbdf` | `IF(utbildningar+föreläsningar>0, "Aktiv", "Ingen aktiv anmälan")` |
| Återkommande? | `fld5npMbl3PaSlm4B` | `IF(AND(tidigare>0, kommande>0), "Ja", "Nej")` |
| Avvikelse (stegordning) | `fldtv9xjLNCbg20XB` | `IF(AND(RIM2>0, RIM1=0), "⚠️ RIM 2 utan RIM 1", "")` |
| Senaste interaktion (text) | `fldRnujWHT3ADToC1` | Jämför senaste TP-datum vs senaste deltagande-datum, visar den senaste |
| Senaste interaktion (datum) | `fldXZyVlSKg5mX8rP` | MAX av TP-datum och deltagande-datum |
| Närvaro (text) | `fldyXhIRaqnBwWG40` | "X/Y (Z%)" |
| Antal hämtningar | `fld4UQOdKTvWixZ9F` | `COUNTA({Engagemang})` |
| Dagar sedan senaste interaktion | `fld6wQp5K9VAcFskd` | Komplex formel: DATETIME_DIFF från MAX(TP-datum, deltagande-datum) |
| Första nedladdning (datum) | `fldN3163pkxdv7xOx` | Parsad från sortkey |
| Senast hämtning (erbjudande) | `fld0NTqm8gx1FnVVp` | Parsad från sortkey |
| Textfält bonus | `fldu6TMim33w14zdU` | "Idag", "Igår", "X dagar sedan" |

### Övriga fält

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Manuella flagga | `fldNtwQt6tOCIdf4f` | singleSelect | (inga val definierade) |
| AI-flagga | `fldgB9iHDTAqd30Uf` | singleSelect | Särskilt stödbehov, Nybörjare, Stabil och mottaglig, Erfaren |
| Inbjuden till community | `flduQ4Luh7XVp61R0` | checkbox | — |
| Skapat konto i community | `fldJzysWhaMGUo16B` | checkbox | — |
| Ej godkänd för mailutskick | `fldbQB9BGJgB1HCg7` | checkbox | Om checked → personen får INTE mail |

---

## Tabell 5: Deltaganden

**ID:** `tbldWHH6sSHWoQPHH` | **Records:** 353 | **Primary field:** ID (autoNumber)

### Kärnfält

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fldRPtbDly1Zdj8L9` | autoNumber | — |
| Anmälan | `fldwQdDpRK8vByNhb` | multipleRecordLinks | → Anmälningar. prefersSingle=true |
| Event | `fldaj5mbpU3yPw2np` | multipleRecordLinks | → Eventplanering |
| Person | `fldF9DORzkIBcRT7F` | lookup | Via Anmälan → Person (link) |
| Session | `fldBPZnsDL0bNIRHx` | singleSelect | Dag 1, Dag 2, Föreläsning |
| Status | `fldRFOzNqVswqZ1mN` | singleSelect | Ej avstämt, Närvarande, Frånvarande, Försenad, Avbröt, Deltog online |
| Noteringar | `fldpCVTUC0C47ci0S` | multilineText | — |
| Avstämt | `fld61tbzc2fqqf116` | dateTime | Sätts av A8 vid statusändring |
| Registrerad av | `fldhx3tludhu1gH7w` | lastModifiedBy | — |
| Person (länk) | `fldiU06kbTxSafkm4` | multipleRecordLinks | → Personer. prefersSingle=true. Sätts av A11 |

### Lookups

| Fält | ID | Via → Fält |
|---|---|---|
| Event (format) | `fldtyZJW50f5ezVDM` | Via Event → Eventtyp (link) |
| Eventkey (lookup) | `fldGC2MziEfqIPeZP` | Via Event → EventKey |
| Kursnamn (lookup) | `fldJyjymEoo514AgN` | Via Event → Event (text) |
| Eventlabel | `fldfOkyENnKgQQos2` | Via Event → Eventlabel |
| Event startdatum | `fldExIP1zw5o6ib63` | Via Event → Startdatum (rollup) |
| Event slutdatum | `fldhvFOFV7O0hNIaY` | Via Event → Slutdatum (rollup) |
| Event ort | `fldbV3oTRW9i6w13U` | Via Event → Ort |
| Event typ | `fldiDF6PWfYa8afMr` | Via Event → Typ (singleSelect) |
| Slutdatum (from Event) | `fldVt6J3qAa7JAzjD` | Via Event → Slutdatum |
| Person - senast genomfört datekey | `fldgPTGOeZQtXEOr9` | Via Person (länk) → Senast genomfört event datekey |

### Beräknade fält

| Fält | ID | Formel (sammanfattning) |
|---|---|---|
| Närvaropoäng | `fldwuo94BY46VUOm4` | `IF(Status="Närvarande" OR "Deltog online", 1, 0)` |
| Kommande poäng | `fldahsniYiJ7JVNql` | `IF(Startdatum >= TODAY(), 1, 0)` |
| Deltog datum | `fldvYGItTZkfc2yPZ` | `IF(Närvaropoäng=1, Startdatum, BLANK())` |
| Utbildningsdag (historik) | `fldzT31hkUGuGbjoz` | `IF(Startdatum < TODAY(), 1, 0)` |
| Närvaro (historik) | `fldyqIHDQHQmTUG53` | `IF(Startdatum < TODAY(), Närvaropoäng, BLANK())` |
| Event sammanfattning | `fldowG8oh8PtB8M19` | `ARRAYJOIN({Eventlabel}, "")` |
| Deltog sammanfattning | `fldKaxHf6UzcHN94v` | Visar eventlabel om närvaropoäng=1 |
| Kommande sammanfattning | `fldY2qYntd59jI1Iv` | Visar eventlabel om framtida & ej deltog |
| Event (text) | `flddYfDnxRNV3X4O1` | Eventformat som text |
| RIM 1 eventkey | `fldyvWn5aJtQVxL5I` | EventKey om deltog & kursnamn="RIM 1" |
| RIM 2 eventkey | `fldS8Ujzm5de0XSoz` | EventKey om deltog & kursnamn="RIM 2" |
| Fjärrskådning eventkey | `fldLLmr2QjcPNlBBm` | EventKey om deltog & kursnamn="Fjärrskådning" |
| Genomfört event (1 rad per event) | `fldRfc4i7HHfc1dFU` | Eventlabel om deltog & (Dag 1 eller Föreläsning) |
| RIM 1/2/FS genomfört (lista) | diverse | Filtrerar per kurstyp |
| Genomfört event datekey | `fldb516eqHHKEskQK` | YYYYMMDD-nyckel om deltog & (Dag 1 / Föreläsning) |
| Är senast genomförda event? | `fldn7E0xwQJN3S4w8` | Jämför datekey med personens max datekey |
| Dagar sedan (nummer) | `fld37Qbyf2CEPjXBy` | `MAX(0, DATETIME_DIFF(TODAY(), Slutdatum, 'days'))` |
| När | `fldjqBoR9LTJISIFz` | "Idag"/"Igår"/"X dagar sedan"/"om X dagar" |
| Närvaro (nyckel) | `fldra8QclmAyG4dKU` | `Anmälan-ID \| Event-ID \| Session` |
| Anmälan (ID) | `fldkTS2S8IDTsHibj` | `RECORD_ID({Anmälan})` |
| Event (ID) | `fld1PV4JDU0xkFrQ2` | `RECORD_ID({Event})` |
| Eventlabel (text) | `fld2pOnpyDl9tVtZd` | `ARRAYJOIN({Eventlabel}, "")` |
| Genomfört event sortkey | `fldXGpBAnEKeXwCiI` | YYYYMMDD + eventlabel |
| Deltog sortkey | `fldGJ96lIhsFR3xwN` | YYYYMMDD + eventlabel |

---

## Tabell 6: Hämtade erbjudanden

**ID:** `tblqFpgxEhJ95AEcM` | **Records:** 116 | **Primary field:** ID (autoNumber)
**Beskrivning:** Alla som hämtat hem era erbjudanden

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fldezAV1MUXr4pJY7` | autoNumber | — |
| E-post | `fldcTXSJXQR3d3zoG` | formula | `LOWER(TRIM({E-post (rå)}))` |
| Förnamn | `fldUFcUyXJpiapHZh` | formula | Konverterar råfält till text |
| Efternamn | `fldcVggunbIwVKnmN` | formula | Konverterar råfält till text |
| Erbjudande | `fldU1Cv0sWVwAWw5A` | multipleRecordLinks | → Erbjudanden. prefersSingle=true |
| Datum | `fldFvqVJcLEB8AIeS` | createdTime | — |
| Person | `fldiiSHn41rTti0vL` | multipleRecordLinks | → Personer. prefersSingle=true. Sätts av A4 |
| Engagemang ID | `fldP6l3cUgB4JYorH` | multipleRecordLinks | → Engagemang. Sätts av A5 |
| E-post (rå) | `fld8WVM0PwUazElUY` | singleLineText | — |
| Förnamn (rå) | `fldkiIPw23R04KFhY` | singleLineText | — |
| Efternamn (rå) | `fld5ybDduW8gZxOCU` | singleLineText | — |
| Erbjudande (source) | `fldtJ7yWGhN2vcCMN` | singleSelect | Meditationen Kraftfältet, Pyramidernas Vajrar |
| Källa (formulärkälla) | `fldF9SgJS1Zv5kmtr` | singleSelect | Hash-nycklar |
| Hämtnings-ID | `fldTWeVgO9YHNyJN4` | formula | `{E-post} & "\|" & {Erbjudande (namn)}` |
| Erbjudande (namn) | `fldyPxC6Z8RFguivM` | lookup | Via Erbjudande → Namn |
| Source key | `fldxBGxFRu7PZEl5A` | formula | `LOWER(TRIM({Erbjudande (source)}))` |

---

## Tabell 7: Engagemang

**ID:** `tbl9H2SoGFfysBj5y` | **Records:** 36 | **Primary field:** ID (autoNumber)
**Beskrivning:** Aggregerat engagemang per person + erbjudande

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fldDWOuZBq1tlP9WG` | autoNumber | — |
| Person | `fld0HvkG5WYoFwcco` | multipleRecordLinks | → Personer. prefersSingle=true |
| Erbjudande | `fldgbiNrK8yiIioSc` | multipleRecordLinks | → Erbjudanden. prefersSingle=true |
| Första hämtning | `fld9tRjnvHMmIQJfR` | dateTime | — |
| Senaste hämtning | `fldApcqiNXrrf3LAR` | dateTime | — |
| Totalt antal hämtningar | `fldx5WBq9Yom59O0T` | rollup | Via Hämtade erbjudanden ID → ID (antal) |
| Hämtade erbjudanden ID | `fldUFQybIcnreW8YP` | multipleRecordLinks | → Hämtade erbjudanden |
| Normaliserad e-post | `fldlWVOvbY2SdHSfr` | lookup | Via Hämtade erbjudanden ID → E-post |
| Erbjudande (namn) | `fld4eZrMuxXsu0aIm` | lookup | Via Erbjudande → Namn |
| Engagemang (nyckel) | `fld3zrl8rD32xTWEu` | formula | `{Normaliserad e-post} & "\|" & {Erbjudande (namn)}` |

---

## Tabell 8: Erbjudanden

**ID:** `tblcCFGCVrnl1JZfg` | **Records:** 2 | **Primary field:** ID (formula)

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fldCIIuGRgiwdtBuD` | formula | `{Nummer} & " – " & {Namn}` |
| Nummer | `fldj4LfpUKDQ0yG5t` | number | heltal |
| Namn | `fld3pQNv0z1isXlIl` | singleLineText | T.ex. "Meditationen Kraftfältet" |
| Engagemang | `fldPxfyd4TFRcU1hj` | multipleRecordLinks | → Engagemang |
| Hämtade erbjudanden | `flduRS5mJSLO228dW` | multipleRecordLinks | → Hämtade erbjudanden |
| Lanseringsdatum | `fldzLnT59S9wxrpuJ` | date | — |
| Source key | `fldLNhX72aU79DqW1` | formula | `LOWER(TRIM({Namn}))` |

---

## Tabell 9: Touchpoints

**ID:** `tbl22SCvlHrgcAiZi` | **Records:** 303 | **Primary field:** Touchpoint ID (autoNumber)

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Touchpoint ID | `fldv9JUvqCmnxh4wy` | autoNumber | — |
| Person (länkat fält) | `fldLiC0ZiUAdxXu9u` | multipleRecordLinks | → Personer. prefersSingle=true |
| Kanal | `fldD3LIpvbTOMnj1X` | singleLineText | — |
| Typ | `fldL8gMBzkMHyUoiK` | singleSelect | Angett e-post för erbjudande, Soundwise-konto, Soundwise-lyssna, Inskickad anmälan, Avbokad anmälan, Närvaro registrerad, Öppnat e-post |
| Erbjudande | `fldpgd7ayzjcbKL98` | singleSelect | Meditationen Kraftfältet, Pyramidernas Vajrar, Annat |
| Datum | `fldcq8oJWTyc8p8dA` | dateTime | — |
| TP sortkey | `fldEVwwgWtEJcwbBq` | formula | `DATETIME_FORMAT + "\|" + Typ + "\|" + Kanal` |
| TP sammanfattning | `fldO3G3hY0iFLKopR` | formula | `"YYYY-MM-DD HH:mm – Typ – Kanal"` |
| Dagar sedan (nummer) | `fld8DtzhTvy2bVRtz` | formula | `DATETIME_DIFF(NOW(), Datum, "days")` |
| Dagar sedan (text) | `fldAXfFqNAdc9gIwV` | formula | "X dagar sedan" |
| Dagar sedan (text2) | `fldlhNTEHbyg3C1tK` | formula | "Idag"/"Igår"/"X dagar sedan" |
| Systemkälla | `fldSXO9yRrxVceBkp` | singleSelect | (inga val definierade) |
| Metadata | `fldUfTA3gJoDxi5PS` | multilineText | — |
| Erbjudande + datum | `fldDnTtO1KgXEMLO5` | formula | `Erbjudande + " (YYYY-MM-DD)"` |
| Sortkey | `fldppJAY8VYyyY9fP` | formula | `YYYYMMDD§Erbjudande (YYYY-MM-DD)` |
| _datekey | `fldanCka7M9dgBRRO` | formula | `YYYYMMDDHHmmss \| YYYY-MM-DD` |
| Mail logg (rådata) | `fldcSJPi1Vweh7Gyc` | multipleRecordLinks | → Kontaktlogg |

---

## Tabell 10: Kontaktlogg (rådata)

**ID:** `tblzg4DsRzCCXH8Vy` | **Records:** 15 | **Primary field:** ID (autoNumber)

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| ID | `fldoFvu7KDfIY2OaK` | autoNumber | — |
| Förnamn | `fldbnVcgykjsyEofs` | formula | Capitalizes Förnamn (rå) |
| Efternamn | `fldKEsfgVdVIqEllA` | singleLineText | — |
| Datum | `flduSMkQk7MMWlKLe` | dateTime | — |
| Källa | `fldlsrjLHVLpBJhia` | singleSelect | Kontaktformulär, Direkt mail |
| Riktning | `fld5LAsRBZbIB5jUE` | singleSelect | In, Ut |
| Från e-post | `fld2wQKC14bsxZu78` | email | — |
| Angivet telefonnummer | `fldIv9p1CPzVf07at` | formula | Normaliserar svenskt telefonnummer till +46-format |
| Till e-post | `fldLzrEQ4h381cx0P` | email | — |
| Ämne | `fld8agIGtC5TqB7pW` | singleLineText | — |
| Body | `fldQxdLL4C3S9DaBs` | multilineText | — |
| Bilagor | `fldBW1kPLxBxPsK39` | multipleAttachments | — |
| Person | `fld8cQQyMqwqJBInZ` | multipleRecordLinks | → Personer. prefersSingle=true |
| Touchpoint trigger | `fld6Kdd8a0kWt2ko6` | formula | `AND(Riktning="In", Källa="Kontaktformulär", LEN(Body)>30)` → 1/0 |
| Touchpoint skapad | `fldiDRPgDNLDqOMKq` | checkbox | — |
| Länkad touchpoint | `fldVqrMPEOaWgBes2` | multipleRecordLinks | → Touchpoints |
| Förnamn (rå) | `fldwiOUhL0dof2Eq4` | singleLineText | — |
| Telefon (raw) | `fld2Zpt3O0F6y6kjy` | phoneNumber | — |
| Telefon (siffror) | `fldQ2kuxc9VUG78w6` | formula | `REGEX_REPLACE(Telefon, "[^0-9]", "")` |

---

## Tabell 11: Error-log

**ID:** `tblnnmWswnRp9gFws` | **Records:** 0

| Fält | ID | Typ |
|---|---|---|
| Felmeddelande | `fldUc9PT7DplbJc9J` | singleLineText |
| Datum | `fldgxASAapxei4z2n` | date |
| E-post | `fld35luq7I862KUAC` | email |
| Relaterar till | `fldUut084o8F2XbSU` | multilineText |

---

## Tabell 12: Bulkutskick

**ID:** `tblWarzSse85NI1Zx` | **Records:** 9 | **Primary field:** Namn på utskick

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Namn på utskick | `fld5DBQe6yP1iHmrt` | singleLineText | — |
| Status | `fldW7k60IHE0Kpj1W` | singleSelect | Skickad, Redo att skickas, Under begrundande, Test, Arkiverad |
| Segment | `fldPTDQXTTFCARTvt` | multipleRecordLinks | → Segment |
| Antal i segment | `fldY8GNqwO36rqweZ` | number | heltal |
| Förhandsgranskning | `fld39isdUf1P0LLBn` | formula | `"Hej [FÖRNAMN], " & {Mailtext}` |
| Ämne | `fldWDLug4uNSBDK7w` | singleLineText | — |
| Mailtext | `fld4YLRFZ6YeKRZAh` | multilineText | — |
| Testad | `fld6sO2Pg8idE2qLf` | checkbox | — |
| Skicka | `fldpdGQpbQlmxWFum` | button | — |
| Senast skickat | `fldNjpGUW85kFFV81` | dateTime | — |
| Mottaget av antal | `fldzjsV0kYW8n4IRg` | number | heltal |
| Utskickslogg | `fldIcvLFp3JDeWsap` | multipleRecordLinks | → Utskickslogg |

---

## Tabell 13: Segment

**ID:** `tbll2N6JKCj4u6y9o` | **Records:** 9 | **Primary field:** Namn på segment

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Namn på segment | `flduvXn5oW00Z5TBk` | singleLineText | — |
| Antal i segment | `fldn02khOce58O3oQ` | number | heltal |
| Beskrivning | `fldvixirTWlP912KR` | multilineText | — |
| Används för utskick | `fldvkazGywtclqXV6` | checkbox | — |
| Segmentformel | `fld3jcCTY2FQ4vUTk` | multilineText | Make tittar på denna och gör segmenteringen |
| Beräkna antal i segment | `fldfng79bMW42UOiV` | button | — |
| Senast beräknat | `flddzGVqP8vrmOSXS` | dateTime | — |
| Senast uppdaterad | `fldzIfZeqeHjVb0vZ` | lastModifiedTime | — |
| Senast uppdaterad av | `fldvkhCqxDyMezMAx` | lastModifiedBy | — |
| Färgkod | `fldeLZnObhQBhfqFk` | singleSelect | 9 färgval |
| Mailutskick | `fldjUIp0iqRpJWgem` | multipleRecordLinks | → Bulkutskick |
| Segmentdefinition | `fldED0CiIINac9DRB` | multilineText | — |

---

## Tabell 14: Utskickslogg

**ID:** `tblIesjbuSWNp6oxK` | **Records:** 0 | **Primary field:** Namn på utskick

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Namn på utskick | `fldWRz9ap7fxHAMkW` | singleLineText | — |
| Utskicks-ID | `fldqK5kGeVjVtJcS0` | multipleRecordLinks | → Bulkutskick |
| Skickat till | `fldnNRJHfhEQLrQkp` | multipleRecordLinks | → Personer |
| Antal skickade | `fldqJBTOwErzMdCAO` | formula | `COUNTA({Skickat till})` |
| Datum | `fldBQjiy2KhuEFIfi` | createdTime | — |
| Antal öppnade mail | `fldmDGQsMv8BbPWok` | multipleRecordLinks | → Email Opens |
| Öppningsgrad (%) | `fldmrf9SaBcXLNJUl` | formula | `{Antal öppnade mail}/{Antal skickade}` → procent |
| Filter snapshot | `fldM7DTUDljK3POWP` | multilineText | — |
| Mailutskick copy | `fldPCrRxwjuUa7J2R` | singleLineText | — |

---

## Tabell 15: Email Opens

**ID:** `tblXFJyGRahQDhhqc` | **Records:** 3

| Fält | ID | Typ | Detalj |
|---|---|---|---|
| Name | `fldZya842Ie2bJUh8` | singleLineText | — |
| Utskickslogg | `fldAwO8sDOSHjCOua` | multipleRecordLinks | → Utskickslogg |

---

## Tabell 16: Väntelista

**ID:** `tbl2VxMx7JMkIxD4Q` | **Records:** 20 | **Primary field:** ID (autoNumber)

| Fält | ID | Typ |
|---|---|---|
| ID | `fldbRr0mOveUvfVW7` | autoNumber |
| Förnamn | `fldhcXiiLNY8JEDgR` | singleLineText |
| Efternamn | `fldWKbMYRKlwOmg89` | singleLineText |
| E-post | `fldbn9SyKemmI31H3` | singleLineText |
| Telefonnummer | `fldysS1swV4xpUsH5` | singleLineText |
| Event | `fldC01Nf3lVWrOgdw` | singleLineText |
| Eventdatum-start | `fld86BydfvliidRBX` | singleLineText |
| Eventdatum-slut | `fldNSwatG61UaemCt` | singleLineText |
| utm_source | `fldouEa5AKkfjm7vf` | singleLineText |
| utm_medium | `fld2Mqil2Tm4N0SwS` | singleLineText |
| utm_campaign | `fldac61BD71mK16nJ` | singleLineText |
| utm_content | `fldBBGz0UT815UaQT` | singleLineText |

---

## Tabell 17: Path to Conversion

**ID:** `tblor5TK8HeryGXIj` | **Records:** 0 | Tom/ny tabell

| Fält | ID | Typ |
|---|---|---|
| Name | `fldKXtf61itHTfmMS` | singleLineText |

---

## Tabell 18: Instagram Posts

**ID:** `tblMpQI1crF521Xsp` | **Records:** 0 | Tom/ny tabell

| Fält | ID | Typ |
|---|---|---|
| Name | `fldppDLRJPGCZfgho` | singleLineText |

---

## Select-valsöversikt (viktiga fält)

### Eventplanering

- **Typ:** Utbildning, Föreläsning
- **Event (source):** Fjärrskådning, Resor i medvetandet 1, Resor i medvetandet, Resor i medvetandet 2, Psionautics
- **Check-in session:** Dag 1, Dag 2, Föreläsning

### Anmälningar

- **Anmälningsavgift:** Mottagen (`selifkkIZPj0j7dgn`), Ej mottagen (`selk5OrO63H7sVZVe`)
- **Slutbetalning:** Mottagen (`selifkkIZPj0j7dgn`), Ej mottagen (`selk5OrO63H7sVZVe`), Ej relevant (för föreläsningar) (`seljLR0FhWMMGSZRh`)
- **Status:** Bekräftad (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Obekräftad
- **Typ:** Utbildning, Föreläsning, Psionautics-event
- **Från formulär:** Huvudformulär, Expressformulär, Obekräftad, Anmälan-Psionautics.se
- **Flagga:** Ny anmälan, Ej mottagen, Mottagen
- **Vill anmäla sig till:** RIM 1, Fjärrskådning, RIM 2, Resor i medvetandet, Psionautics

### Deltaganden

- **Session:** Dag 1, Dag 2, Föreläsning
- **Status:** Ej avstämt (`sel6U4DjySnASdN8C`), Närvarande (`selL6dOK1XDN8UmKQ`), Frånvarande (`selhXfNgpF7dCoFn4`), Försenad (`selckiXY869eiLmrX`), Avbröt (`selJ1f9Yv9J7jjqrH`), Deltog online (`selWGhz7v8MPTVpT8`)

### Touchpoints

- **Typ:** Angett e-post för erbjudande, Soundwise-konto, Soundwise-lyssna, Inskickad anmälan, Avbokad anmälan, Närvaro registrerad, Öppnat e-post
- **Erbjudande:** Meditationen Kraftfältet, Pyramidernas Vajrar, Annat

### Hämtade erbjudanden

- **Erbjudande (source):** Meditationen Kraftfältet, Pyramidernas Vajrar

### Eventformat

- **Format:** Dag 1–7, Föreläsning, Intro, Kvällspass, Q&A, Bonuspass, Avslut

### Bulkutskick

- **Status:** Skickad, Redo att skickas, Under begrundande, Test, Arkiverad

### Personer

- **AI-flagga:** Särskilt stödbehov, Nybörjare, Stabil och mottaglig, Erfaren

---

## Interfaces (2 st)

### Översikt

| Interface | Sidor | Senast publicerad | Status |
|---|---|---|---|
| Interface 1 | Verksamhetspuls, Lägga till ett nytt event, Mailutskick | 16 dec 2025 | Byggd |
| Interface 2 | Eventmanager, Personöversikt + 6 ej byggda sidor | 12 jan 2026 | Delvis byggd |

---

### Interface 1

#### Sida: Verksamhetspuls

**Page ID:** `pag28y1JlgUIpFtjx` | **40 element**

Stor dashboard med tre datakällor: Eventplanering, Hämtade erbjudanden och Personer. Filter: Eventtyp, Datumintervall, Eventkategori.

**Element:**

- 8 KPI-rutor (bigNumber): Totalt antal planerade event, Totalt antal anmälningar, Genomsnittlig beläggning, Totalt antal leads, Meditationen Kraftfältet, Pyramidernas Vajrar, Totalt antal deltagare, Genomsnittligt antal genomförda utbildningar
- 7 diagram (chart): Spridning registrerade anmälningar (per månad), Fördelning av eventtyp, Antal event per ort, m.fl.
- 1 pivottabell
- 3 dashboards (tabellvyer)
- 3 queryContainers med datakällor: Eventplanering, Hämtade erbjudanden, Personer

#### Sida: Lägga till ett nytt event

**Page ID:** `pagBOAafqx17qJ9A1` | **16 element**

Formulärsida för att skapa nya event direkt i interfacet.

**Element:**

- 1 formContainer (formulär)
- 7 cellEditors (alla EDIT): Bland annat fält för Event, Datumperiod m.fl.

#### Sida: Mailutskick

**Page ID:** `paggfSsQYKv4KTX0d` | **2 element** | Listvyn

Inbox-vy som listar alla Bulkutskick.

**Element:**

- 1 queryContainer → Bulkutskick (`tblWarzSse85NI1Zx`)
- 1 inbox → Bulkutskick, kolumner: [Namn på utskick], rowPage = `pagsy9I2z1WugtUyz`

##### Detaljsida: Mailutskick-detalj

**Page ID:** `pagsy9I2z1WugtUyz` | **29 element**

Visar detaljer för ett valt utskick med 12 read-only fält + datakälla från Segment.

**Element:**

- 1 queryContainer → Segment (`tbll2N6JKCj4u6y9o`) med label "Segment"
- 12 cellEditors (alla RO): Visar utskicksinformation

---

### Interface 2

#### Sida: Eventmanager

**Page ID:** `pagrw7zLFkdI0zhrS` | **2 element** | Listvyn

Inbox-vy som listar alla event med Event (text), Ort och Startdatum.

**Element:**

- 1 queryContainer → Eventplanering (`tblVE3UKWl1CKrphV`)
- 1 inbox → Eventplanering, kolumner: [Event (text), Ort, Startdatum], rowPage = `pag0gKkpkDr5I96EL`

##### Detaljsida: Event Detail

**Page ID:** `pag0gKkpkDr5I96EL` | **48 element**

Visar all information om ett valt event. Tre sektioner med data från Anmälningar och Deltaganden.

**Element:**

- 2 queryContainers: Anmälningar (`tbloOcrppVoyrHbrq`) med label "Ej skickat full beta...", Deltaganden (`tbldWHH6sSHWoQPHH`) med label "Närvaro specifi..."
- 17 cellEditors — bland annat:
  - Eventinfo: Session (EDIT), Bekräftad (RO), Anmäld beläggning (RO)
  - Kapacitet: Max antal platser, Antal anmälningar, Antal mottagna anmälningsavgifter, Antal slutbetalning saknas, Anmäld beläggning, Bekräftad beläggning
  - Inmatning: Manuella platser (EDIT), Extra platser (EDIT), Närvarostatus att sätta (EDIT)

#### Sida: Personöversikt

**Page ID:** `pagGjTvd2Uq6wz6b5` | **2 element** | Listvyn

Inbox-vy som listar alla personer.

**Element:**

- 1 queryContainer → Personer (`tbl6ZyCm3V026iFTU`)
- 1 inbox → Personer, kolumner: [Namn], rowPage = `pagdNoliSQGxTAuR4`

##### Detaljsida: Person Detail

**Page ID:** `pagdNoliSQGxTAuR4` | **79 element**

Den mest detaljerade sidan i systemet. Visar all information om en vald person med data från Anmälningar, Deltaganden och Touchpoints.

**Element:**

- 5 queryContainers: Anmälningar (×2) med labels "Motiveringar" / "Anmäld till kom...", Deltaganden (×2) med labels "Genomförda even..." / "Närvaro", Touchpoints med label "Lista alla interakti..."
- 1 gallery → Anmälningar
- 26 cellEditors (25 RO, 1 EDIT) — bland annat:
  - Identitet/kontakt: Namn, E-post, Telefon, Relation skapad
  - Anmälningsdata: Alla anmälningar, Antal anmälningar, Alla motiveringar
  - Erfarenhet: Deltagit i, Genomförda utbildningar, Antal hämtningar, Alla hämtningar
  - Aktivitet: Har en aktiv anmälan, Senaste interaktion, Dagar sedan senaste, Senaste hämtning, Första hämtning
  - Redigerbart: Anteckningar om person (EDIT)

#### Ej byggda sidor (6 st, platshållare)

| Sida | Page ID | Status |
|---|---|---|
| Verksamhetspuls | `pag21SK0Br7bg9R7w` | Ej byggd (defaultmall med 12 element, pekar på Eventplanering) |
| Ekonomi och betalningar | (ej identifierad) | Ej byggd |
| Deltagare och grupper | (ej identifierad) | Ej byggd |
| Automatisering och systemhälsa | (ej identifierad) | Ej byggd |
| Marknadsföring och community | (ej identifierad) | Ej byggd |
| KPI | (ej identifierad) | Ej byggd |

**Notering:** De ej byggda sidorna har en defaultmall med 12 element (1 bigNumber, 1 chart, 1 pivotTable, 1 dashboard, 1 queryContainer) — troligen autogenererade av Airtable vid skapande. Sidorna pekar på Anmälningar eller Personer beroende på vilken.

---

## Vyer per tabell (kartlagt session 3)

Vyer kan inte läsas via MCP eller HAR — kartlagda via screenshots från Marcus.

### Översikt

| # | Tabell | Antal vyer | Har konfiguration? |
|---|---|---|---|
| 1 | Eventplanering | 11 | Ja (1 vy med filter) |
| 2 | Eventformat | 1 | Nej |
| 3 | Anmälningar | 7 | Ja (3 vyer med filter/sort/group) |
| 4 | Personer | 11 | Ja (6 vyer med filter/sort) |
| 5 | Deltaganden | 1 | Nej |
| 6 | Hämtade erbjudanden | 1 (Vy 1) | Nej |
| 7 | Engagemang | 1 | Nej |
| 8 | Erbjudanden | 1 | Nej |
| 9 | Touchpoints | 1 | Nej |
| 10 | Kontaktlogg (rådata) | 1 | Nej |
| 11 | Error-log | 1 | Nej |
| 12 | Bulkutskick | 1 | Nej |
| 13 | Segment | 1 | Nej |
| 14 | Utskickslogg | 1 | Nej |
| 15 | Email Opens | 1 | Nej |
| 16 | Väntelista | 1 | Nej |
| 17 | Path to Conversion | 1 | Nej |
| 18 | Instagram Posts | 1 | Nej |

### Eventplanering (11 vyer)

| Vy | Typ | Filter | Sort | Group |
|---|---|---|---|---|
| Master | Grid | — | — | — |
| Sammanställning 1 | Grid | `Startdatum` is after today | — | — |
| Sammanställning 2 | Grid | — | — | — |
| Sammanställning 3 | Grid | — | — | — |
| URL:er | Grid | — | — | — |
| Timeline | Timeline | — | — | — |
| Calendar | Calendar | — | — | — |
| Kanban | Kanban | — | — | — |
| Kanban copy | Kanban | — | — | — |
| Gallery | Gallery | — | — | — |
| Gantt | Gantt | — | — | — |

**Notering:** Bara Sammanställning 1 har konfiguration (visar framtida event). Övriga 10 vyer har bara olika dolda fält och vytyper för olika perspektiv.

### Personer (11 vyer)

| Vy | Filter | Sort |
|---|---|---|
| Alla personer | — | Rad skapad → Earliest→Latest |
| Har en aktiv anmälan | `Har en aktiv anmälan` is "Aktiv" | — |
| Har ingen aktiv anmälan | `Har en aktiv anmälan` is "Ingen aktiv anmälan" | — |
| Nya deltagare | `Totala deltaganden` = 0 AND `Har en aktiv anmälan` is "Aktiv" | — |
| Återkommande deltagare | `Återkommande` is "Ja" | — |
| Leads | `Anmäld till antal` = 0 AND `Anmäld till antal` = 0 AND `Antal tidigare genomförda utbildningar` = 0 | — |
| Ej godkända för mailutskick | — (bara dolda fält) | — |
| Motiveringar | `Motivering (text)` is not empty | — |
| Avvikelser | — (bara dolda fält) | — |
| Hämtade erbjudanden | `Totalt antal hämtningar (erbjudande)` > 0 | Totalt antal hämtningar (erbjudande) → 9→1 |
| Fält med datum och tid (kontroll) | — (bara dolda fält) | — |

**Segmentlogik:**

- **Nya deltagare** = aldrig deltagit förut + har en aktiv anmälan nu (förstagångsdeltagare)
- **Återkommande deltagare** = har deltagit tidigare och kommer igen
- **Leads** = aldrig anmält sig + aldrig deltagit (rena erbjudande-leads via Hämtade erbjudanden)

### Anmälningar (7 vyer)

Vyerna är organiserade i grupper:

**⭐ My favorites:**

- Inskickade anmälningar (favorit)

**📁 Betalning:**

- Obetalda anmälningar per event
- Sammanställning
- Sammanställning 2

**📁 Fler vyer:**

- Inskickade anmälningar (kopia)
- Rådata från formulär
- Psionautics.se
- Allt

| Vy | Filter | Sort | Group |
|---|---|---|---|
| ⭐ Inskickade anmälningar | — | Rad skapad → Earliest→Latest | — |
| Obetalda anmälningar per event | `Status` is not "Betalningspåminnelse skickad" | Startdatum → Earliest→Latest | Event A→Z |
| Sammanställning | — (bara dolda fält) | — | — |
| Sammanställning 2 | `Startdatum` is after today | — | Event A→Z |
| Inskickade anmälningar (Fler vyer) | — | Rad skapad → Earliest→Latest | — |
| Rådata från formulär | — (bara dolda fält) | — | — |
| Psionautics.se | `Vill anmäla sig till` is exactly "Psionautics" | — | — |
| Allt | — (bara dolda fält) | — | — |

**Notering:** Obetalda-vyn filtrerar bort de som redan fått betalningspåminnelse, grupperar per event (A→Z) och sorterar på startdatum — så närmaste event kommer först. Sammanställning 2 visar bara framtida event grupperade per event.

---

## Formulär (7 st, Elfsight) + Zapier-kopplingar (10 Zaps)

Alla formulär är byggda i **Elfsight** och inbäddade på **miranon.se** (Shopify-sida byggd av Marcus). Data skickas till Airtable via **Zapier** (Elfsight → Zapier → Airtable Create Record).

Det finns även ett internt formulär byggt direkt i Airtable Interfaces ("Lägga till ett nytt event"), se Interface 1.

### Formuläröversikt

| # | Formulär | Elfsight-typ | Skapad | → Airtable-tabell | Fält |
|---|---|---|---|---|---|
| 1 | För-ifyllt formulär (huvudformulär) | Form Builder | 21 sep 2025 | Anmälningar | 14 (2 sidor) |
| 2 | Expressformulär (på startsida) | Form Builder | 21 sep 2025 | Anmälningar | 12 (2 sidor) |
| 3 | Anmälan - Psionautics | Form Builder | 13 feb 2026 | Anmälningar | 6 (1 sida) |
| 4 | Kontaktformulär | Contact Form | 2 okt 2025 | Kontaktlogg (rådata) | 6 |
| 5 | Meditationen Kraftfältet | Subscription Form | 16 sep 2025 | Hämtade erbjudanden | 2 |
| 6 | Pyramidernas vajrar | Subscription Form | 15 sep 2025 | Hämtade erbjudanden | 1 |
| 7 | Väntelista - Psionautics | Form Builder | 21 feb 2026 | Väntelista | 8 |

---

### Formulär 1: För-ifyllt formulär (huvudformulär)

**URL:** miranon.se/pages/anmalan (med URL-parametrar)
**Pre-fill parametrar:** Event, Datum, Ort, Typ, EventKey — fylls i automatiskt via AnmälningsURL-formeln i Eventplanering

**Sida 1: "Du anmäler dig till följande event"** (7 fält)

- EventKey (dolt, pre-filled)
- Image Choice (Fjärrskådning, Resor i medvetandet 1, Resor i medvetandet 2)
- Event (text, pre-filled)
- Typ (text, pre-filled)
- Datum (text, pre-filled)
- Ort (text, pre-filled)
- Har du gått steg 1? (checkbox, conditional)

**Sida 2: "Dina uppgifter"** (7 fält)

- Förnamn (text)
- Efternamn (text)
- E-post (email)
- Mobilnummer (phone)
- Vilka kurser från Roger och Lotta har du deltagit i tidigare? (checkbox)
- Varför vill du gå den här utbildningen? (textarea)
- Consent (checkbox — villkorsgodkännande)

---

### Formulär 2: Expressformulär (på startsida)

**URL:** miranon.se (startsidan)
**Pre-fill:** Ingen — användaren väljer allt själv

**Sida 1: "Vilken utbildning vill du gå?"** (6 fält)

- Image Choice (Fjärrskådning, Resor i medvetandet 1, Resor i medvetandet 2)
- Har du gått Resor i medvetandet 1? (checkbox, conditional)
- Vilka kurser från Roger och Lotta har du deltagit i tidigare? (checkbox)
- Vilket utbildningstillfälle vill du anmäla dig till? (dropdown, conditional) × 3 st — ett per kurstyp

**Sida 2: "Dina uppgifter"** (6 fält)

- Förnamn, Efternamn, E-post, Mobilnummer
- Varför vill du gå den här utbildningen? (textarea)
- Consent (checkbox)

**Notering:** "Datum och ort"-fältet i Airtable fylls från dropdown-valet ("Vilket utbildningstillfälle..."), som matchar Expresslabel i automation A1.

---

### Formulär 3: Anmälan - Psionautics

**URL:** psionautics.se
**Pre-fill:** Ingen — eventdata sätts statiskt i Zapier

**1 sida** (6 fält):

- Förnamn (text)
- Efternamn (text)
- E-post (email)
- Mobilnummer (phone)
- Frågor eller funderingar? (textarea)
- Choice (checkbox — "Uppdatera mig om fler event i framtiden via e-post")

---

### Formulär 4: Kontaktformulär

**URL:** miranon.se (kontaktsida)

**1 sida** (6 fält):

- Förnamn (text)
- Efternamn (text)
- E-post (email)
- Telefon (phone)
- Ditt meddelande (textarea)
- Bilagor (file upload)

**Notering:** Skickas till Kontaktlogg (rådata), inte Anmälningar. Zapier-kopplingen för detta formulär finns inte bland de 6 aktiva → kan vara direkt via Elfsight webhook eller annat.

---

### Formulär 5: Meditationen Kraftfältet

**URL:** miranon.se (erbjudandesida)

**1 sida** (2 fält):

- Förnamn (text)
- E-post (email)

---

### Formulär 6: Pyramidernas vajrar

**URL:** miranon.se (erbjudandesida)

**1 sida** (1 fält):

- E-post (email)

---

### Formulär 7: Väntelista - Psionautics

**URL:** psionautics.se (väntelista)

**1 sida** (8 fält):

- Förnamn (text)
- Efternamn (text)
- E-post (email)
- Mobilnummer (phone)
- utm_source (dolt, pre-filled från URL)
- utm_medium (dolt, pre-filled från URL)
- utm_campaign (dolt, pre-filled från URL)
- utm_content (dolt, pre-filled från URL)

---

### Zapier-kopplingar (10 Zaps)

Alla Zaps ägs av Roger Gotthardsson (Personal). Alla aktiva Zaps har Elfsight som trigger (step 1) och Airtable Create Record som action (step 2).

#### Aktiva Zaps (8 st)

**Zap 1: anmälan-psionautics.se → Airtable** (feb 2026)
→ Anmälningar

| Airtable-fält | Källa | Värde |
|---|---|---|
| Status | Statiskt | "Obekräftad" |
| Rad skapad | Zapier | Current time |
| Förnamn | Elfsight | 1. Förnamn |
| Efternamn | Elfsight | 1. Efternamn |
| Vill anmäla sig till | Statiskt | "Psionautics" |
| Datum | Statiskt | "1-3 maj 2026" |
| Typ | Statiskt | "Psionautics-event" |
| Ort | Statiskt | "Ödeshög" |
| E-post | Elfsight | 1. E-post |
| Mobilnummer | Elfsight | 1. Phone |
| Från formulär | Statiskt | "Anmälan-Psionautics.se" |
| EventKey | Statiskt | "Event-17" |
| Inskickad | Zapier | Current time |
| Frågor eller funderingar? | Elfsight | 1. Frågor eller funderingar? |
| Uppdatera mig om fler event? | Elfsight | 1. Choice |

**OBS:** Datum, Ort, EventKey, Typ är hårdkodade för ett specifikt event — Zappen behöver uppdateras manuellt vid nytt Psionautics-event.

**Zap 2: väntelista-psionautics.se → Airtable** (feb 2026)
→ Väntelista

| Airtable-fält | Källa | Värde |
|---|---|---|
| Förnamn | Elfsight | 1. Förnamn |
| Efternamn | Elfsight | 1. Efternamn |
| E-post | Elfsight | 1. E-post |
| Telefonnummer | Elfsight | 1. Mobilnummer |
| Event | Statiskt | "Psionautics" |
| Eventdatum-start | Statiskt | "2026-05-01" |
| Eventdatum-slut | Statiskt | "2026-05-03" |
| utm_source | Elfsight | 1. utm_source |
| utm_medium | Elfsight | 1. utm_medium |
| utm_campaign | Elfsight | 1. utm_campaign |
| utm_content | Elfsight | 1. utm_content |

**Zap 3: Expressformulär → Airtable** (nov 2025)
→ Anmälningar (Base: "Anmälningar", Table: "Table 1")

| Airtable-fält | Källa | Värde |
|---|---|---|
| Anmälningsavgift | Statiskt | "Ej mottagen" |
| Slutbetalning | Statiskt | "Ej mottagen" |
| Status | Statiskt | "Obekräftad" |
| Rad skapad | Zapier | Current time |
| Förnamn | Elfsight | 1. Förnamn |
| Efternamn | Elfsight | 1. Efternamn |
| Vill anmäla sig till | Elfsight | 1. Field (Image Choice) |
| Typ | Statiskt | "Utbildning" |
| Varför vill du gå? | Elfsight | 1. Varför vill du gå den här utbildningen? |
| E-post | Elfsight | 1. E-post |
| Mobilnummer | Elfsight | 1. Mobilnummer |
| Datum och ort (från expressformulär) | Elfsight | 1. Vilket utbildningstillfälle... (×3 sammanlänkade) |
| Har du gått steg 1? | Elfsight | 1. Har du gått Resor i medvetandet 1? |
| Villkor godkända | Elfsight | 1. Consent |
| Från formulär | Statiskt | "Expressformulär" |
| Flagga | Statiskt | "Ny anmälan" |

**Zap 4: Huvudformulär → Airtable** (nov 2025)
→ Anmälningar (Base: "Anmälningar", Table: "Table 1")

| Airtable-fält | Källa | Värde |
|---|---|---|
| Anmälningsavgift | Statiskt | "Ej mottagen" |
| Slutbetalning | Statiskt | "Ej mottagen" |
| Status | Statiskt | "Obekräftad" |
| Rad skapad | Zapier | Current time |
| Förnamn | Elfsight | 1. Förnamn |
| Efternamn | Elfsight | 1. Efternamn |
| Vill anmäla sig till | Elfsight | 1. Event (pre-filled från URL) |
| Datum | Elfsight | 1. Datum (pre-filled) |
| Typ | Elfsight | 1. Typ (pre-filled) |
| Ort | Elfsight | 1. Ort (pre-filled) |
| Vilka kurser... | Elfsight | 1. Vilka kurser... |
| Varför vill du gå? | Elfsight | 1. Varför vill du gå... |
| E-post | Elfsight | 1. E-post |
| Mobilnummer | Elfsight | 1. Mobilnummer |
| Har du gått steg 1? | Elfsight | 1. Har du gått steg 1? |
| Villkor godkända | Elfsight | 1. Consent |
| Från formulär | Statiskt | "Huvudformulär" |
| EventKey | Elfsight | 1. EventKey (pre-filled) |
| Flagga | Statiskt | "Ny anmälan" |

**Notering:** Till skillnad från Psionautics-Zappen kommer EventKey, Datum, Typ, Ort dynamiskt via pre-fill params — Zappen behöver INTE uppdateras per event.

**Zap 5: Meditationen Kraftfältet → Airtable** (nov 2025)
→ Hämtade erbjudanden ("Leads (rådata)" i Zapier)

| Airtable-fält | Källa | Värde |
|---|---|---|
| E-post (rå) | Elfsight | 1. E-post |
| Förnamn (rå) | Elfsight | 1. Förnamn |
| Erbjudande (source) | Statiskt | "Meditationen Kraftfältet" |
| Källa (formulärkälla) | Statiskt | `ae9a4975a6f8e77121ae6b8973e1e31411f49d45293638001a448de424a54d10` |

**Zap 6: Pyramidernas vajrar → Airtable** (nov 2025)
→ Hämtade erbjudanden ("Leads (rådata)" i Zapier)

| Airtable-fält | Källa | Värde |
|---|---|---|
| E-post (rå) | Elfsight | 1. E-post |
| Erbjudande (source) | Statiskt | "Pyramidernas Vajrar" |
| Källa (formulärkälla) | Statiskt | `58947ba345f0013563663ba7916d05637403bcced327adb91dd81cd9c69fea9a` |

**Notering:** Inget Förnamn mappas — formuläret har bara E-post.

**Zap 7: Meditationen Kraftfältet** (sep 2025) — Elfsight → Soundwise (annan integration, ej Airtable)

**Zap 8: Pyramidernas vajrar** (sep 2025) — Elfsight → Soundwise (annan integration, ej Airtable)

#### Inaktiva Zaps (2 st)

**Zap 9: Bekräftelse på anmälan - huvudformulär** (okt 2025, OFF) — Elfsight → Gmail
**Zap 10: Bekräftelse på anmälan - expressformulär** (okt 2025, OFF) — Elfsight → Gmail

Dessa skickade bekräftelsemail via Gmail men är avaktiverade.

---

## Make.com-integrationer (2 scenarier, kartlagt session 3)

Make.com används för segmentering och bulkmail — funktioner som Airtable inte klarar nativt.

### Översikt

| # | Scenario | Status | Trigger | Steg | Syfte |
|---|---|---|---|---|---|
| 1 | Beräkna antal i segment | **Aktivt** | Custom webhook (knapp i Airtable) | 4 | Räknar hur många personer som matchar ett segment |
| 2 | Skicka mail från Airtable - Miranon Media OS | **Inaktivt** (medvetet) | Custom webhook (knapp i Airtable) | 5 | Skickar bulkmail till segmentets mottagare |

### Scenario 1: Beräkna antal i segment

**Trigger:** Knappen "Beräkna antal i segment" i Segment-tabellen (`fldfng79bMW42UOiV`)

| Steg | Modul | Typ | Vad den gör |
|---|---|---|---|
| 1 | Starta beräkning | Custom webhook | Tar emot anropet från Airtable-knappen |
| 2 | Hämta aktuellt utskick | Airtable: Get a Record | Hämtar Bulkutskick-posten kopplad till segmentet |
| 3 | Hitta personer som matchar | Airtable: Search Records | Söker i Personer-tabellen baserat på Segmentformel-fältet |
| 4 | Leverera antal | Airtable: Update a Record | Skriver tillbaka antalet matchande personer till fältet "Antal i segment" |

**Koppling till Airtable:** Segment (`tbll2N6JKCj4u6y9o`) → Make räknar → skriver till Antal i segment (`fldn02khOce58O3oQ`)

### Scenario 2: Skicka mail från Airtable (INAKTIVT)

**Trigger:** Knappen "Skicka" i Bulkutskick-tabellen (`fldpdGQpbQlmxWFum`)
**Status:** Medvetet inaktivt — testversion med Gmail. Pausat i väntan på beslut om Klaviyo eller annan mailtjänst.

| Steg | Modul | Typ | Vad den gör |
|---|---|---|---|
| 1 | Klickar på "Skicka mail" | Custom webhook | Tar emot anropet från Airtable-knappen |
| 2 | Hämta valt utskick | Airtable: Get a Record | Hämtar utskickets data (Ämne, Mailtext) |
| 3 | Hämta personer i segmentet | Airtable: Search Records | Söker fram alla mottagare baserat på segment |
| 4 | Skicka mail till mottagare | Gmail: Send an email | Skickar mail till varje mottagare |
| 5 | Markera utskicket som skickat | Airtable: Update a Record | Uppdaterar Status och Senast skickat |

**Koppling till Airtable:** Bulkutskick (`tblWarzSse85NI1Zx`) → Make hämtar mottagare via Segment → skickar mail → uppdaterar status

**Notering:** Gmail-modulen var Marcus test. Den slutgiltiga lösningen kan bli Klaviyo, Mailgun, eller annan mailtjänst.

---

## Automationer (11 st, alla aktiva)

### Översikt

| Grupp | Automationer | Syfte |
|---|---|---|
| Anmälningsflödet | A1 → A2 → A3 | Ny anmälan → matcha event → hitta/skapa person → skapa deltaganden |
| Lead-flödet | A4 → A5 | Ny lead → koppla erbjudande → hitta/skapa person → skapa engagemang |
| Övervakningsflödet | A6–A11 | Fullbokad-notis, synka betalningar, närvaro, personkoppling |

### Anmälningsflödet: A1 → A2 → A3

Alla tre triggas av samma händelse (ny rad i Anmälningar) men gör olika saker.

---

### A1 — Matcha anmälan mot event

**ID:** `wflDCKPAv2P6Yu9U6`
**Trigger:** When a record is created → Anmälningar

**Steg:**

1. **Find records** i Eventplanering — "Leta efter en match"
   - Filter: EventKey (`fldhmhaz3ZnouAzDm`) = trigger.EventKey (`fldPlPLkpqm0X7Xs2`)
2. **Update record** i Anmälningar — "Koppla anmälan till eventet"
   - Sätter Event-länken (`fldi3enUaMdbuGSlm`) till det hittade eventet
3. **IF-BLOCK** — "Om anmälan kommer från snabbformuläret"
   - Villkor: Find records i steg 1 hittade 0 resultat (Length = 0)
   - **Gren: Om anmälan kommer från snabbformuläret**
     - 3a. **Find records** i Eventplanering — "Matcha på Label"
       - Filter: Expresslabel (`fldCPCcfF87fEkUdy`) = trigger.Datum och ort (`fldZTZ5Xzni3MCsDG`)
     - 3b. **Update record** i Anmälningar — "Koppla anmälan till eventet"
       - Sätter Event-länken till det hittade eventet via Expresslabel

**Logik:** Försöker först matcha via EventKey (huvudformuläret). Om ingen match → försöker matcha via Expresslabel (snabbformuläret).

> **MÄTNOT 2026-08-21 (S110, `T158`) — två punkter ovan är FALSIFIERADE mot
> prod.** Denna fil är en frusen ögonblicksbild (mars 2026) och skrivs inte
> om; noten står här för att den som läser stegbeskrivningen annars tror sig
> veta A1:s villkor. Mätt live via `get_automation` mot
> `wflDCKPAv2P6Yu9U6` (`deploymentStatus: deployed`):
>
> 1. **IF-blockets villkor testar TRIGGER-FÄLTET, inte träffmängden.** Ovan
>    står *"Find records i steg 1 hittade 0 resultat (Length = 0)"*. Det
>    verkliga villkoret är `EventKey isEmpty` **AND** `Datum och ort
>    isNotEmpty`. Skillnaden är avgörande: en anmälan med `EventKey="10"`
>    har ett icke-tomt fält, så expressgrenen körs **aldrig** för den — raden
>    blir orphan av steg 2, inte av en utebliven match.
> 2. **Steg 2 (`updateRecord`) är OVILLKORLIGT.** Vid noll träffar kör det
>    ändå och sätter `Event` till en **tom lista** — en aktiv skrivning av
>    tomt värde, inte en utebliven skrivning. Det finns alltså inget
>    villkorssteg att haka i före kopplingen, vilket är skälet till att
>    [`ADR-122`](../decisions/ADR-122-eventlankens-vakt-och-atgardskon.md)s
>    vakt måste **ERSÄTTA** steg 1–2 i stället för att läggas före dem: en
>    validering före en kvarvarande ovillkorlig koppling är fail-**open**.
>
> För automations-mekanik gäller alltså samma regel som filens huvud redan
> anger för fält-data: **mät artefakten, härled den inte.**

---

### A2 — Uppdatera/skapa person + skapa Touchpoint

**ID:** `wflRPMp5QNGEa7wH1`
**Trigger:** When a record is created → Anmälningar

**Steg:**

1. **Find records** i Personer — "Finns person redan?"
   - Filter: E-post (`fldcd5HnYooVZY4Ts`) = trigger.Normaliserad e-post (`fld0CIF2qC7ufa8UD`)
2. **Find records** i Personer — "Saknar personen ett namn?"
   - Filter: E-post = trigger.E-post (`fldVY310IdOIbTkE8`) OCH Förnamn isEmpty
3. **IF-BLOCK** — 4 grenar:
   - **Gren 1: Om person utan namn hittades**
     - 3a. **Update record** i Personer — Uppdatera namn
   - **Gren 2: Om personen redan finns**
     - 3b. **Update record** i Anmälningar — Koppla anmälan till personen (sätter Person-länk `fldQekqRlLfup8x5K`)
     - 3c. **Create record** i Touchpoints — Registrera händelsen (Typ: "Inskickad anmälan")
   - **Gren 3: Om flera personer hittades**
     - 3d. **Create record** i Error-log — Registrera dubblett
   - **Gren 4: Om personen inte finns**
     - 3e. **Create record** i Personer — Lägg till personen (Förnamn, Efternamn, E-post, Telefon)
     - 3f. **Update record** i Anmälningar — Koppla anmälan till den nya personen
     - 3g. **Create record** i Touchpoints — Registrera händelsen

**Logik:** Söker på normaliserad e-post. Hanterar fyra scenarion: person utan namn, existerande person, dubbletter, ny person. Skapar alltid en touchpoint (utom vid dubletter).

---

### A3 — Förskapa deltaganden vid anmälan

**ID:** `wfl4qb2eP28SfKlck`
**Trigger:** When a record matches conditions → Anmälningar
**Villkor:** Person isNotEmpty OCH Event isNotEmpty OCH Deltaganden isEmpty

**Steg:**

1. **Run a script** (2 398 tecken)

**Script-logik:**

- Input: `anmId`, `eventplaneringIds` (från trigger)
- Hämtar Sessionsmall (lookup) från Eventplanering → t.ex. ["Dag 1", "Dag 2"]
- Kontrollerar vilka deltaganden som redan finns för denna anmälan
- Skapar en Deltaganden-rad per session som saknas
- Varje rad: Anmälan-länk, Event-länk, Session (single select), Status = "Ej avstämt"
- Batch-skapar i grupper om 50

**Fält som berörs:**

- Eventplanering.Sessionsmall (`fldFSQSopc87UBXpT`)
- Deltaganden.Anmälan (`fldwQdDpRK8vByNhb`), Event (`fldaj5mbpU3yPw2np`), Session (`fldBPZnsDL0bNIRHx`), Status (`fldRFOzNqVswqZ1mN`)

**OBS:** Använder fältnamn (inte field IDs) — ej rename-säkert.

---

### Lead-flödet: A4 → A5

---

### A4 — Koppla lead till person

**ID:** `wflaICTnroTIY4dfP`
**Trigger:** When a record is created → Hämtade erbjudanden

**Steg:**

1. **Find records** i Erbjudanden — "Hitta erbjudandet"
   - Filter: Source key (`fldLNhX72aU79DqW1`) = trigger.Source key (`fldxBGxFRu7PZEl5A`)
2. **Update record** i Hämtade erbjudanden — "Koppla erbjudandet"
   - Sätter Erbjudande-länken (`fldU1Cv0sWVwAWw5A`)
3. **Find records** i Personer — "Finns personen redan?"
   - Filter: E-post (`fldcd5HnYooVZY4Ts`) = trigger.E-post (`fldcTXSJXQR3d3zoG`)
4. **IF-BLOCK** — 3 grenar:
   - **Gren 1: Om personen redan finns**
     - 4a. **Update record** i Hämtade erbjudanden — Matcha mot person (sätter Person-länk `fldiiSHn41rTti0vL`)
     - 4b. **Create record** i Touchpoints — Registrera händelsen (Typ: "Angett e-post för erbjudande")
   - **Gren 2: Om fler personer hittades**
     - 4c. **Create record** i Error-log — Registrera dubblett
   - **Gren 3: Om personen inte finns**
     - 4d. **Create record** i Personer — Lägg till personen
     - 4e. **Update record** i Hämtade erbjudanden — Matcha mot den nya personen
     - 4f. **Create record** i Touchpoints — Registrera händelsen

**Logik:** Identisk struktur som A2 men för leads istället för anmälningar. Matchar först erbjudande via Source key, sedan person via e-post.

---

### A5 — Skapa/uppdatera engagemang

**ID:** `wfljTHq2P4gimMf29`
**Trigger:** When a record is updated → Hämtade erbjudanden

**Steg:**

1. **IF-BLOCK (yttre)** — "Säkerställer att Person och Erbjudande inte är tomt"
   - Villkor: Person isNotEmpty OCH Erbjudande isNotEmpty
   - **Inuti grenen:**
     - 1a. **Find records** i Engagemang — "Har personen redan laddat ner detta erbjudande?"
       - Filter: Engagemang (nyckel) (`fld3zrl8rD32xTWEu`) = trigger.Hämtnings-ID (`fldTWeVgO9YHNyJN4`)
     - 1b. **IF-BLOCK (inre)** — 2 grenar:
       - **Gren 1: Om engagemang redan finns**
         - **Update record** i Engagemang — Uppdatera Senaste hämtning, koppla hämtningen
       - **Gren 2: Om engagemanget inte finns**
         - **Create record** i Engagemang — Skapa nytt (Person, Erbjudande, Första hämtning, Senaste hämtning, koppla hämtningen)
         - **Update record** i Hämtade erbjudanden — Dubbelriktar engagemanget (sätter Engagemang ID-länk)

**Logik:** Nästade IF-block. Yttre: säkerställ att data finns. Inre: skapa nytt eller uppdatera befintligt engagemang.

---

### Övervakningsflödet: A6–A11

---

### A6 — Fullbokat-notis

**ID:** `wfl0filPx4wyAcaQ8`
**Trigger:** When a record matches conditions → Eventplanering
**Villkor:** Anmäld beläggning (%) (`fldqkyeE7cVHMNRpH`) = 1 (dvs 100%)

**Steg:**

1. **Send email** — Skickar mail till Roger/Lotta om att eventet är fullbokat

---

### A7 — Synka ej mottagna slutbetalningar per event

**ID:** `wflDxN31sRJNWCqfu`
**Trigger:** When a record is updated → Anmälningar

**Steg:**

1. **Find records** i Anmälningar — "Hitta alla anmälningar för samma event där slutbetalning = Ej mottagen"
   - Filter: Event = trigger.Event (`fldi3enUaMdbuGSlm`) OCH Slutbetalning = "Ej mottagen" (`selk5OrO63H7sVZVe`)
2. **Update record** i Eventplanering — "Uppdatera rätt event med listan över alla obetalda anmälningar"
   - Sätter Ej betalda (records) (`fldjaxY8oWrNvS2El`)

**Logik:** Varje gång en anmälan uppdateras, räknas alla obetalda om och skrivs till eventet.

---

### A8 — Tidstämpel vid närvaroändring

**ID:** `wfl1iYPrEmlKpEsRU`
**Trigger:** When a record is updated → Deltaganden

**Steg:**

1. **Update record** i Deltaganden — Sätter Avstämt (`fld61tbzc2fqqf116`) till NOW() vid statusändring

**Logik:** Simpel tidsstämpling. Triggas vid varje uppdatering av ett deltagande.

---

### A9 — Markera närvaro (vald session)

**ID:** `wflgIhQ6Qo0zV50NH`
**Trigger:** When a record matches conditions → Eventplanering
**Villkor:** Markera alla närvarande (`fldN20OexhRJQr9XY`) = True OCH Check-in session (`fldjX1YN7DOhoKvt1`) isNotEmpty

**Steg:**

1. **Run a script** (4 417 tecken)

**Script-logik (rename-säkert med field IDs):**

- Input: `recordId`
- Läser vald session från Check-in session
- Läser konfigurerbar status från Närvarostatus att sätta (fallback: "Närvarande")
- Hämtar alla Deltaganden som matchar eventet + vald session
- Sätter Status + Avstämt-tidstämpel på varje match
- Resettar checkboxen efteråt
- Output: `updatedCount`, `statusSet`, `sessions`

**Fält som berörs:**

- Eventplanering: Check-in session (`fldjX1YN7DOhoKvt1`), Markera alla närvarande (`fldN20OexhRJQr9XY`), Markera alla närvarande alla sessioner (`fldF5atXm9lV2nAeq`), Sessionsmall (`fldFSQSopc87UBXpT`), Närvarostatus att sätta (`flddzMrhu30cXoaEf`)
- Deltaganden: Event (`fldaj5mbpU3yPw2np`), Session (`fldBPZnsDL0bNIRHx`), Status (`fldRFOzNqVswqZ1mN`), Avstämt (`fld61tbzc2fqqf116`)

---

### A10 — Markera närvaro (alla sessioner)

**ID:** `wfl4rswJuGt9hVqF3`
**Trigger:** When a record matches conditions → Eventplanering
**Villkor:** Markera alla närvarande (alla sessioner) (`fldF5atXm9lV2nAeq`) = True

**Steg:**

1. **Run a script** (4 417 tecken — samma script som A9)

**Script-logik:** Identisk med A9, men istället för en vald session hämtar den alla sessioner från Sessionsmall (lookup). Om Sessionsmall är tom, fallback: samlar unika sessionsnamn från befintliga deltaganden.

---

### A11 — Koppla deltagande till person

**ID:** `wflIHsSbUvoc4BmP5`
**Trigger:** When a record matches conditions → Deltaganden
**Villkor:** Anmälan isNotEmpty OCH Person (länk) isEmpty

**Steg:**

1. **Run a script** (1 187 tecken)

**Script-logik (rename-säkert med field IDs):**

- Input: `recordId`
- Hämtar Deltaganden-recordet
- Läser Anmälan-länken (`fldwQdDpRK8vByNhb`)
- Hämtar Anmälningens Person-länk (`fldQekqRlLfup8x5K`)
- Sätter Person (länk) (`fldiU06kbTxSafkm4`) på Deltagandet

**Fält som berörs:**

- Deltaganden: Anmälan (`fldwQdDpRK8vByNhb`), Person (länk) (`fldiU06kbTxSafkm4`)
- Anmälningar: Person (`fldQekqRlLfup8x5K`)

---

### Automations-scripts (komplett kod)

#### A3-script: Förskapa deltaganden

```javascript
// ================= CONFIG =================
const TABLE_EVENT = "Eventplanering";
const TABLE_DEL = "Deltaganden";

const FLD_EVENT_PASSES = "Sessionsmall";
const FLD_DEL_ANM_LINK = "Anmälan";
const FLD_DEL_EVENT_LINK = "Event";
const FLD_DEL_SESSION = "Session";
const FLD_DEL_STATUS = "Status";
const DEFAULT_STATUS = "Ej avstämt";

const { anmId, eventplaneringIds } = input.config();
if (!anmId) throw new Error("Missing anmId");
if (!eventplaneringIds || eventplaneringIds.length === 0) {
  throw new Error("Missing eventplaneringIds");
}
const eventId = eventplaneringIds[0];

const eventTbl = base.getTable(TABLE_EVENT);
const delTbl = base.getTable(TABLE_DEL);

const eventRec = await eventTbl.selectRecordAsync(eventId);
if (!eventRec) throw new Error(`Event not found: ${eventId}`);

const passVals = eventRec.getCellValue(FLD_EVENT_PASSES) || [];
const sessions = passVals
  .map(p => (typeof p === "string" ? p : (p?.name ?? p)))
  .filter(Boolean);

if (sessions.length === 0) {
  console.log("No Eventpass on event. Nothing to create.");
  return;
}

const delQuery = await delTbl.selectRecordsAsync({
  fields: [FLD_DEL_ANM_LINK, FLD_DEL_SESSION]
});

const existing = new Set();
for (const r of delQuery.records) {
  const anmLinks = r.getCellValue(FLD_DEL_ANM_LINK) || [];
  if (!anmLinks.some(x => x.id === anmId)) continue;
  const sess = r.getCellValue(FLD_DEL_SESSION);
  if (sess?.name) existing.add(sess.name);
}

const toCreate = [];
for (const s of sessions) {
  if (existing.has(s)) continue;
  toCreate.push({
    fields: {
      [FLD_DEL_ANM_LINK]: [{ id: anmId }],
      [FLD_DEL_EVENT_LINK]: [{ id: eventId }],
      [FLD_DEL_SESSION]: { name: s },
      [FLD_DEL_STATUS]: { name: DEFAULT_STATUS }
    }
  });
}

while (toCreate.length) {
  await delTbl.createRecordsAsync(toCreate.splice(0, 50));
}
console.log(`Created missing sessions: ${sessions.length - existing.size}`);
```

#### A9/A10-script: Markera närvaro (delad kod)

```javascript
// Trigger: Eventplanering | Input variable: recordId
const { recordId } = input.config();
if (!recordId) throw new Error("Missing input variable: recordId");

const T_EVENT = "tblVE3UKWl1CKrphV";
const T_DEL   = "tbldWHH6sSHWoQPHH";
const tEvent = base.getTable(T_EVENT);
const tDel   = base.getTable(T_DEL);

// Field IDs (rename-säkert)
const F_CHECKIN_SESSION = "fldjX1YN7DOhoKvt1";
const F_MARK_SINGLE     = "fldN20OexhRJQr9XY";
const F_MARK_ALL        = "fldF5atXm9lV2nAeq";
const F_SESSIONSMALL    = "fldFSQSopc87UBXpT";
const F_SET_STATUS_TEXT = "flddzMrhu30cXoaEf";
const F_DEL_EVENT   = "fldaj5mbpU3yPw2np";
const F_DEL_SESSION = "fldBPZnsDL0bNIRHx";
const F_DEL_STATUS  = "fldRFOzNqVswqZ1mN";
const F_DEL_AVSTAMT = "fld61tbzc2fqqf116";

const fCheckin    = tEvent.getField(F_CHECKIN_SESSION);
const fMarkSingle = tEvent.getField(F_MARK_SINGLE);
const fMarkAll    = tEvent.getField(F_MARK_ALL);
const fMall       = tEvent.getField(F_SESSIONSMALL);
const fSetStatus  = tEvent.getField(F_SET_STATUS_TEXT);
const fDelEvent   = tDel.getField(F_DEL_EVENT);
const fDelSession = tDel.getField(F_DEL_SESSION);

const eventRec = await tEvent.selectRecordAsync(recordId);
if (!eventRec) throw new Error(`Event not found: ${recordId}`);

const markSingle = !!eventRec.getCellValue(fMarkSingle);
const markAll    = !!eventRec.getCellValue(fMarkAll);
if (!markSingle && !markAll) {
  output.set("info", "No checkbox checked.");
  return;
}

const statusToSet = (eventRec.getCellValue(fSetStatus) || "").trim() || "Närvarande";
const sessionSingle   = eventRec.getCellValue(fCheckin);
const sessionsMallRaw = eventRec.getCellValue(fMall) || [];

const normalizeSessionName = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v.name) return v.name;
  if (typeof v === "object" && v.value) return v.value;
  return String(v);
};

let sessionNames = [];
if (markAll) {
  sessionNames = sessionsMallRaw.map(normalizeSessionName).filter(Boolean);
} else {
  if (!sessionSingle) throw new Error("Check-in session is empty.");
  sessionNames = [sessionSingle.name];
}

const q = await tDel.selectRecordsAsync({ fields: [fDelEvent, fDelSession] });

if (markAll && sessionNames.length === 0) {
  const set = new Set();
  for (const r of q.records) {
    const evLinks = r.getCellValue(fDelEvent) || [];
    if (!evLinks.some((l) => l.id === recordId)) continue;
    const sess = r.getCellValue(fDelSession);
    if (sess?.name) set.add(sess.name);
  }
  sessionNames = [...set];
  if (sessionNames.length === 0) throw new Error("No sessions found.");
}

const now = new Date().toISOString();
const targets = q.records.filter((r) => {
  const evLinks = r.getCellValue(fDelEvent) || [];
  if (!evLinks.some((l) => l.id === recordId)) return false;
  const sess = r.getCellValue(fDelSession);
  return sess?.name && sessionNames.includes(sess.name);
});

const updates = targets.map((r) => ({
  id: r.id,
  fields: {
    [F_DEL_STATUS]: { name: statusToSet },
    [F_DEL_AVSTAMT]: now,
  },
}));

while (updates.length) {
  await tDel.updateRecordsAsync(updates.slice(0, 50));
  updates.splice(0, 50);
}

const resetFields = {};
if (markSingle) resetFields[F_MARK_SINGLE] = false;
if (markAll)    resetFields[F_MARK_ALL] = false;
await tEvent.updateRecordAsync(recordId, resetFields);

output.set("updatedCount", targets.length);
output.set("statusSet", statusToSet);
output.set("sessions", sessionNames.join(", "));
```

#### A11-script: Koppla deltagande → person

```javascript
// Input: recordId
const { recordId } = input.config();
if (!recordId) throw new Error("Missing recordId");

const T_DEL = "tbldWHH6sSHWoQPHH";
const T_ANM = "tbloOcrppVoyrHbrq";
const tDel = base.getTable(T_DEL);
const tAnm = base.getTable(T_ANM);

const F_DEL_ANMALAN     = "fldwQdDpRK8vByNhb";
const F_DEL_PERSON_LINK = "fldiU06kbTxSafkm4";
const F_ANM_PERSON      = "fldQekqRlLfup8x5K";

const del = await tDel.selectRecordAsync(recordId);
if (!del) throw new Error("Deltagande not found");

const anmLinks = del.getCellValue(F_DEL_ANMALAN) || [];
if (anmLinks.length === 0) return;

const anm = await tAnm.selectRecordAsync(anmLinks[0].id);
if (!anm) return;

const personLinks = anm.getCellValue(F_ANM_PERSON) || [];
if (personLinks.length === 0) return;

await tDel.updateRecordAsync(recordId, {
  [F_DEL_PERSON_LINK]: [{ id: personLinks[0].id }],
});
```

---

## Scripts i Script Extension (3 st)

Dessa script körs manuellt via Airtables Script Extension (under fliken "Extensions"). De är separata från automationsscripten (A3, A9, A10, A11) som körs automatiskt.

### Extension Script 1: Backfill Person (länk) i Deltaganden

**Syfte:** Fyller i fältet `Person (länk)` (`fldiU06kbTxSafkm4`) på Deltaganden-rader som saknar det, genom att hämta person-ID:t via Anmälan → Person-länken. Gör samma sak som automation A11, men i bulk för befintliga rader.

**När det används:** Engångsscript / vid behov. T.ex. om man lagt in deltaganden manuellt eller om A11 missade några rader.

**Fält som berörs:**

- `fldwQdDpRK8vByNhb` — Deltaganden.Anmälan (link)
- `fldiU06kbTxSafkm4` — Deltaganden.Person (länk) (link)
- `fldQekqRlLfup8x5K` — Anmälningar.Person (link)

**Logik:**

1. Bygger en map: Anmälan-ID → Person-ID (från Anmälningar-tabellen)
2. Hittar alla Deltaganden där Person (länk) är tom men Anmälan finns
3. Sätter Person (länk) från anmälans personkoppling
4. Har DRY_RUN-läge (true = visa antal, false = kör uppdateringen)
5. Kör i 50-batchar

**Rename-säkert:** Ja (använder field IDs)

```javascript
// Backfill Person (länk) i Deltaganden från Anmälningar -> Person
// Kör först DRY_RUN = true, sen false.

const DRY_RUN = false;

const tDel = base.getTable("Deltaganden");
const tAnm = base.getTable("Anmälningar");

// Field IDs (rename-säkert)
const F_DEL_ANMALAN = "fldwQdDpRK8vByNhb";      // Deltaganden -> Anmälan (link)
const F_DEL_PERSON_LINK = "fldiU06kbTxSafkm4";  // Deltaganden -> Person (länk)
const F_ANM_PERSON = "fldQekqRlLfup8x5K";       // Anmälningar -> Person (link)

// 1) Bygg upp map: AnmälanId => PersonId
const anmQ = await tAnm.selectRecordsAsync({ fields: [F_ANM_PERSON] });
const anmToPerson = new Map();

for (const r of anmQ.records) {
  const ppl = r.getCellValue(F_ANM_PERSON) || [];
  if (ppl[0]?.id) anmToPerson.set(r.id, ppl[0].id);
}

// 2) Hitta deltaganden som saknar Person (länk) men har Anmälan
const delQ = await tDel.selectRecordsAsync({ fields: [F_DEL_ANMALAN, F_DEL_PERSON_LINK] });

const updates = [];
for (const d of delQ.records) {
  const hasPerson = (d.getCellValue(F_DEL_PERSON_LINK) || []).length > 0;
  if (hasPerson) continue;

  const anmLinks = d.getCellValue(F_DEL_ANMALAN) || [];
  if (anmLinks.length === 0) continue;

  const personId = anmToPerson.get(anmLinks[0].id);
  if (!personId) continue;

  updates.push({
    id: d.id,
    fields: { [F_DEL_PERSON_LINK]: [{ id: personId }] },
  });
}

output.text(`Hittade ${updates.length} deltaganden att backfilla.`);

if (DRY_RUN) {
  output.text("DRY RUN: Ingen uppdatering gjord. Sätt DRY_RUN=false och kör igen.");
  return;
}

// 3) Uppdatera i batchar (50 åt gången)
let updatedCount = 0;
while (updates.length) {
  const batch = updates.slice(0, 50);
  await tDel.updateRecordsAsync(batch);
  updates.splice(0, 50);
  updatedCount += batch.length;
}

output.text(`Klart. Uppdaterade ${updatedCount} rader.`);
```

---

### Extension Script 2: Hitta fält-ID

**Syfte:** Utility-script för att slå upp ett fälts ID via namn. Används under utveckling för att hitta rätt field ID när man bygger automationer och script som ska vara rename-säkra.

**Rename-säkert:** Nej (men behöver inte vara det — det är poängen med scriptet)

```javascript
const t = base.getTable("Eventplanering");
const f = t.getField("Närvarostatus att sätta");
output.text(f.id);
```

**Användning:** Ändra tabellnamn och fältnamn efter behov. Kör scriptet → får tillbaka fält-ID:t.

---

### Extension Script 3: Bulk-import anmälningar (Psionautics)

**Syfte:** Engångsscript för att manuellt importera anmälningar som kommit in via Psionautics.se-formuläret. Skapar records i Anmälningar-tabellen med hårdkodad data.

**När det används:** Engångsimport. I det här fallet importerades 40 anmälningar för Psionautics-eventet (Event-17, Ödeshög, 1–3 maj 2026).

**Fält som sätts per record:**

- Status = "Obekräftad"
- Förnamn, Efternamn
- Vill anmäla sig till = "Psionautics"
- Datum = "1–3 maj 2026"
- Typ = "Psionautics-event"
- Ort = "Ödeshög"
- E-post, Mobilnummer
- Från formulär = "Anmälan-Psionautics.se"
- EventKey = "Event-17"
- Frågor eller funderingar? (valfritt)
- Uppdatera mig om fler event i framtiden? (valfritt)

**Rename-säkert:** Nej (använder fältnamn, men det är ett engångsscript)

**Logik:** Loopar genom en array med record-objekt och kör `createRecordAsync` en åt gången med console.log per rad.

```javascript
const table = base.getTable("Anmälningar");

const records = [
  {
    "Status": { "name": "Obekräftad" },
    "Förnamn": "Marcus",
    "Efternamn": "Johansson",
    "Vill anmäla sig till": [{ "name": "Psionautics" }],
    "Datum": "1–3 maj 2026",
    "Typ": { "name": "Psionautics-event" },
    "Ort": "Ödeshög",
    "E-post": "highfive.epost@gmail.com",
    "Mobilnummer": "+46 76 140 03 44",
    "Från formulär": [{ "name": "Anmälan-Psionautics.se" }],
    "EventKey": "Event-17",
    "Frågor eller funderingar?": "Hur bokar jag boende?",
    "Uppdatera mig om fler event i framtiden?": "Uppdatera mig om fler event i framtiden via e-post"
  },
  // ... 39 fler records med samma struktur ...
];

let created = 0;
for (const record of records) {
  await table.createRecordAsync(record);
  created++;
  console.log(`Skapade rad ${created}/${records.length}: ${record["Förnamn"]} ${record["Efternamn"]}`);
}

console.log("Klart! " + created + " rader skapade.");
```

**Notering:** Fullständig data för alla 40 records finns i Marcus sessionsfiler. Ovanstående visar strukturen med första recorden som exempel.

---

*Dokumentet uppdateras vid behov. Senast verifierat mot live-data: 7 mars 2026 (session 3).*
