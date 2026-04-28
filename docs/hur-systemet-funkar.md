> **Primär version. Senast uppdaterad 2026-04-28.**
>
> Kopia för psionautics-projektets Claude-chatt synkas separat till
> `~/Repon/psionautics/docs/hur-systemet-funkar.md` efter varje uppdatering här.

---

# Hur systemet funkar

*Guide till Miranon Medias och Psionautics bakomliggande system.*
*För Marcus, Roger, Lotta. Version 3 · 2026-04-28.*

---

## Snabbfakta

| | |
|---|---|
| Databas | Airtable (molntjänst) |
| Antal tabeller | 18 (3 kärn + 15 stöd) |
| Automationer | 11 (A1–A11, alla aktiva) |
| Formulär | 7 (Elfsight-baserade) |
| Psionautics-admin | Aktivt i drift sedan april 2026 |
| Miranon Media-admin | Under uppbyggnad (React-konvertering pågår) |
| Backfill av historisk närvaro | Klar 2026-04-19 |

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
| 4 | Deltaganden-rader skapas (en per session enligt Sessionsmall), alla "Ej avstämt" | A3 |
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

**Det här är där systemet oftast användes fel — fram till backfillen 2026-04-19.**

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
Räknas som genomförd RIM 1 (eller RIM 2 eller RIM 3 eller Fjärrskådning)
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

**Nuläge (2026-04-28):** 1 012 av 1 500 Deltaganden-rader är "Närvarande" (67.5%) — backfillen 2026-04-19 markerade Lottas historiska kurshistorik. Resterande 488 är framtida event som ännu inte ägt rum (varav 218 ligger på Medveten Kontakt 1–3 maj 2026). Pre-backfill var bara 30 av 517 rader markerade (5.8%).

---

## Scenario 4 — "Vilka har gått kurs tidigare?"

Lotta vill segmentera mail. Hon vill veta vilka av de anmälda till Medveten Kontakt som gått RIM 1 förut.

| | |
|---|---|
| **Teoretiskt** | Data finns — varje Person har fält "RIM 1 ×" |
| **I praktiken (pre-backfill)** | Siffran var bara korrekt om närvaro markerats på alla tidigare RIM 1-kurser |
| **Lösning** | **Backfill genomförd 2026-04-19.** 924 historiska Deltaganden importerade. Rapporter om kurshistorik fungerar nu. Se data-model.md §Backfill — historik. |

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

## Personens tillstånd — vad namnlös Person betyder

En Person kan vara i olika tillstånd beroende på hur långt relationen gått. Det är inte ett fel att en Person saknar namn — det är ett normalt tillstånd i livscykeln.

| Tillstånd | Vad finns i Personer | Vad finns kopplat | Hur hamnar man här |
|---|---|---|---|
| Leads | Förnamn/Efternamn tomt, bara e-post | Touchpoints, Hämtade erbjudanden | A4 skapar via Lead-tabellen (rad skapad från miranon.se) |
| Anmäld kurs | Förnamn/Efternamn ifyllt | + Anmälningar | A2 Gren 1 fyller i namn vid första kursanmälan, eller Gren 4 skapar med namn från första anmälan |
| Deltagare | Samma som ovan | + Deltaganden med Närvaropoäng = 1 | Närvaro markerad via A9/A10 |
| Alumn | Samma + rollups (RIM 1 ×, RIM 2 × osv) | (räknas från Deltaganden-historiken) | Rollup-beräkning |
| Återkommande | Samma + Har aktiv anmälan? = "Ja" | + ytterligare Anmälningar | Ny anmälan efter tidigare genomförd kurs |

### Operationella konsekvenser

- **Personer med tomt Förnamn är leads** — inte skräp. De kan ha värdefull historik (Touchpoints, Hämtade erbjudanden) och representerar faktiska människor som visat intresse.

- **Radera ALDRIG Personer.** Inte ens de som ser "tomma" ut. Kopplade Touchpoints/Hämtade erbjudanden går förlorade och framtida matchning mot e-post bryts.

- **Fyll ALDRIG i placeholder-värden** som "Okänd" i Förnamn. Det bryter A2 Gren 1:s villkor `isEmpty(Förnamn)` och förhindrar att namnet senare fylls i automatiskt när personen anmäler sig till kurs.

- **Vid normal drift** bör antal namnlösa Personer ungefär motsvara antal leads som ännu inte anmält sig till kurs.

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
| Mail skickades men UI visar inte timestamp | Bakomliggande sparning misslyckades efter mail-skick | Kolla Cloud → Edge functions → Logs i Lovable. Möjligen behöver fältet sättas manuellt i Airtable. |
| Inställd anmälan visas som aktiv i rapporter | Datamodell-skuld i "Är aktiv"-formeln | Förvänta detta tills formeln uppdateras. Påverkar bara rapporter, inte själva flödet. |

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
| Miranon Media-admin | Under uppbyggnad (React-konvertering — Fas 2 pågår) |
| Backfill av historisk närvaro | **Klar 2026-04-19.** 924 historiska Deltaganden importerade. |
| Deltagarinsikter-rapport i admin | Planerad |
| Fullständig övergång Lotta → Miranon Media-admin | När Miranon-admin är klar |

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
| 2026-04-28 | **Version 3.** Snabbfakta uppdaterad (Psionautics-admin "i drift", Miranon Media-admin "under uppbyggnad", backfill markerad klar). Scenario 3 nuläge-not uppdaterad till live-state 2026-04-28 (1 012 av 1 500 Närvarande, 67.5%). Scenario 3 + 4: backfill markerad genomförd 2026-04-19. Scenario 4 lösning rättad från "ska köras" till "klar — 924 historiska Deltaganden importerade". "Vad kan gå fel"-tabell utökad med 2 rader (mail-PATCH-tystnad, Inställt räknas som aktiv). Vägen framåt: backfill markerad klar, Miranon Media-admin status preciserad. Insiktskedjan: RIM 3 tillagd i exempel-listan (RIM 1 / RIM 2 / RIM 3 / Fjärrskådning). |
| 2026-04-16 | Version 2 — omstrukturerad till tabell-format. Samma innehåll, tätare presentation. |
| 2026-04-16 | Version 1 — scenariodriven prosa (ersatt). |
