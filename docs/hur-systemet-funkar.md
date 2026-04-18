> **📎 Kopia finns i:** `~/Repon/psionautics/docs/hur-systemet-funkar.md`
> (för psionautics-projektets Claude-chatt under prototyp-fasen)

---

# Hur systemet funkar

*Guide till Miranon Medias och Psionautics bakomliggande system.*
*För Marcus, Roger, Lotta. Version 2 · 2026-04-16.*

---

## Snabbfakta

| | |
|---|---|
| Databas | Airtable (molntjänst) |
| Antal tabeller | 18 (3 kärn + 15 stöd) |
| Automationer | 11 (A1–A11, alla aktiva) |
| Formulär | 7 (Elfsight-baserade) |
| Psionautics-admin | Används skarpt sedan april 2026 |
| Miranon Media-admin | Under uppbyggnad |

---

## Ordlista

| Ord | Betyder |
|---|---|
| **Airtable** | Molndatabas. Som Excel, fast tabellerna kan länka till varandra. |
| **Tabell** | En lista. T.ex. Personer, Anmälningar, Event. |
| **Rad / post** | En enskild anmälan, person eller händelse. |
| **Fält** | En kolumn. T.ex. Förnamn, Status. |
| **Länk** | När en rad pekar på en annan rad i en annan tabell. |
| **Automation** | En regel Airtable kör automatiskt. Exempel: "När ny anmälan kommer → koppla till rätt kurs". |
| **Rollup / formula** | Uträkning som uppdateras automatiskt när underliggande data ändras. |
| **Edge Function** | Programkod som admin-appen använder för att prata med databasen. |
| **Admin** | Verktyget Lotta använder för daglig drift. Psionautics har en idag. |
| **Backfill** | Fylla i data retroaktivt för historiska händelser. |

---

## Systemöversikt

```
   Formulär på webben          Admin-appen
          │                            │
          │ "Anna anmäler sig"         │ "Skicka mail"
          │                            │
          └──────────┬─────────────────┘
                     ▼
                 Airtable
        (18 tabeller, 11 automationer)
                     │
            ─────────┴─────────
            ▼                 ▼
       Mail skickas      Rapporter räknas om
```

---

## De tre kärntabellerna

| Tabell | Vad den innehåller | En rad per... |
|---|---|---|
| **Personer** | Personregister. All historik samlas här. | Unik person (matchas på e-post) |
| **Anmälningar** | Vem har anmält sig till vad. | Person × event |
| **Deltaganden** | Vem dök faktiskt upp. **Närvaro markeras här.** | Person × event × dag |

**Viktig distinktion:** Anmälan = löfte att komma. Deltagande = verifierad närvaro. Rapporter om "har gått kurs" bygger på Deltaganden, inte Anmälningar.

---

## Scenario 1 — En person anmäler sig

Anna fyller i formuläret på psionautics.se.

| Steg | Vad som händer | Automation |
|---|---|---|
| 1 | Ny rad skapas i Anmälningar | — |
| 2 | Rätt event kopplas på | A1 |
| 3 | Person matchas på e-post (skapas om ny) | A2 |
| 4 | Deltaganden-rader skapas (en per sessionsdag), alla "Ej avstämt" | A3 |
| 5 | Person-länk kopieras till Deltaganden-raderna | A11 |
| 6 | Bekräftelsemail skickas (separat flöde) | Resend |

**Efter några sekunder:**
- Annas anmälan är komplett kopplad
- Deltaganden-rader ligger och väntar på närvaromarkering
- Personer-rollups uppdateras: +1 anmälning

---

## Scenario 2 — Eventet blir fullbokat

| Steg | Vad som händer |
|---|---|
| 1 | Beläggning räknas om när ny anmälan kommer in |
| 2 | Nås 100% → A6 skickar mail till Roger/Lotta |
| 3 | Nya anmälningar → erbjuds väntelista |

---

## Scenario 3 — En person går kursen

**Det här är där systemet oftast används fel idag.**

Kursen äger rum. Anna är där. Kursen är slut.

Nu måste någon ändra Status på Annas Deltaganden-rader från "Ej avstämt" till "Närvarande".

### Två snabba vägar

| Metod | Hur | Automation |
|---|---|---|
| Markera en session | Välj session på eventet → bocka "Markera alla närvarande" | A9 |
| Markera hela eventet | Bocka "Markera alla närvarande (alla sessioner)" | A10 |

### Vad händer när Status ändras

```
Status = "Närvarande"
        ▼
Närvaropoäng = 1
        ▼
Räknas som genomförd RIM 1 (eller RIM 2 eller Fjärrskådning)
        ▼
Personens siffror uppdateras automatiskt:
  • RIM 1 × räknare +1
  • Antal genomförda event +1
  • Erfarenhetsnivå ändras
  • Erfarenhetsbadge ändras
```

### Om ingen markerar närvaro

| | |
|---|---|
| Deltaganden-rader | Ligger kvar som "Ej avstämt" |
| Personens siffror | 0 genomförda event |
| Erfarenhetsnivå | "Ej påbörjat" |
| Rapporter om kurshistorik | Tomma |

**Nuläge (2026-04-16):** 487 av 517 Deltaganden-rader är "Ej avstämt". Systemet fungerar — steget "markera närvaro" har bara inte körts.

---

## Scenario 4 — "Vilka har gått kurs tidigare?"

Lotta vill segmentera mail. Hon vill veta vilka av de 75 anmälda till Medveten Kontakt som gått RIM 1 förut.

| | |
|---|---|
| **Teoretiskt** | Data finns — varje Person har fält "RIM 1 ×" |
| **I praktiken** | Siffran är bara korrekt om närvaro markerats på alla tidigare RIM 1-kurser |
| **Lösning** | Backfill — gå igenom genomförda kurser, markera närvaro retroaktivt |

---

## Scenario 5 — Lead-magnet (gratismaterial)

Någon hämtar "Kraftfältet" mot sin e-post.

| Steg | Vad som händer | Automation |
|---|---|---|
| 1 | Ny rad i Hämtade erbjudanden | — |
| 2 | E-post matchas mot Personer, skapas om ny | A4 |
| 3 | Engagemang uppdateras (eller skapas) | A5 |

**Engagemang** håller koll på intresse: flera hämtningar = mer engagerad person.

---

## Vanliga missförstånd

| Det man tror | Så är det faktiskt |
|---|---|
| "Anmäld = deltog" | Nej. Anmälan är löfte. Deltagande kräver markerad närvaro. |
| "Återkommande?-fältet = har gått kurs förut" | Nej. Fältet betyder "aktiv återkommande kund med både tidigare OCH kommande bokning". |
| "Ny person = ny Person-rad varje gång" | Nej. Matchas på e-post. Samma e-post → samma Person-rad. |
| "Fjärrskådning är egen kategori i Erfarenhetsnivå" | Delvis. Fjärrskådning visas bara om personen INTE gått RIM. Blandning döljs. |
| "Det räcker att skapa en rad manuellt i Airtable" | Nej. Utan EventKey triggas inte A1 och anmälan blir föräldralös. |
| "A3 skapar alltid Deltaganden-rader" | Nej. Kräver att Sessionsmall är satt på eventet. |

---

## Vad kan gå fel

| Symptom | Trolig orsak | Åtgärd |
|---|---|---|
| Person visar 0 genomförda kurser | Närvaro ej markerad på kursen | Bocka "Markera alla närvarande (alla sessioner)" |
| Anmälan kopplas inte till event | Saknar EventKey (manuellt skapad) | Välj event manuellt i fältet Event |
| Deltaganden-rad räknas inte | Sessionsmall saknas på eventet | Fyll i Sessionsmall (bor i Eventformat-tabellen) |
| Beläggningsprocent stämmer inte | Status på anmälningar är fel | Kolla att aktiva har korrekt Status |
| Mail gick inte ut till alla | Dublett-person orsakar fel | Kolla Error-log-tabellen |
| Väntelista visar redan flyttade | Markering saknas | Kryssa i "Flyttad till anmälan" |

---

## Hur man rättar vanliga fel

### Markera alla närvarande på en kurs

1. Öppna Eventplanering-tabellen
2. Gå till kursens rad
3. Bocka "Markera alla närvarande (alla sessioner)"
4. Vänta några sekunder — rutan bockas av själv när klart
5. Verifiera att Deltaganden nu har Status = "Närvarande"

### Koppla en anmälan till rätt event

1. Öppna Anmälningar-tabellen
2. Hitta raden
3. Fältet Event → välj rätt event
4. Deltaganden-rader skapas automatiskt (A3)

### Ångra flytt till väntelista

1. Öppna Väntelista-tabellen
2. Hitta raden
3. Bocka av "Flyttad till anmälan"

---

## Vägen framåt

| Vad | Status |
|---|---|
| Psionautics-admin | Aktivt i drift |
| Miranon Media-admin | Under uppbyggnad |
| Backfill av historisk närvaro | Ska köras före deltagarinsikter-rapporten |
| Deltagarinsikter-rapport i admin | Planerad |
| Fullständig övergång Lotta → admin | När Miranon-admin är klar |

---

## Om dokumentet

| | |
|---|---|
| Ägare | Uppdateras vid varje systemförändring |
| Teknisk version | `data-model.md` (samma mapp) |
| Fel eller otydligheter | Säg till Marcus — det är dokumentets fel, inte ditt |

---

## Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-04-16 | Version 2 — omstrukturerad till tabell-format. Samma innehåll, tätare presentation. |
| 2026-04-16 | Version 1 — scenariodriven prosa (ersatt). |
