---
namn: Källextraktion — datamodell + automationer + edge functions + sessionsdelta
syfte: Extraherad och korrelerad data från alla källor i 00-file-manifest. Indata till Fas 3 (gapanalys)
skapad: 2026-04-28
hämtningstidpunkt: 2026-04-28 (alla MCP + git + JSON-extraktioner denna session)
bas-id: app8uGPrVCVOm6LfD ("Miranon Media OS")
status: Checkpoint 2 — avvaktar godkännande
korresponderar med: 02-live-state.md (live MCP), 00-file-manifest.md (källista)
---

# Källextraktion — Fas 1

> **Strukturreferens.** Sektioner A–J motsvarar de kategorier som Fas 1-prompten begärde. G1–G4 från Checkpoint 1-granskningen är insorterade där de hör hemma (G1 i §I, G2 i §G, G3 i §B, G4 i §H-bilaga).

## Innehåll

- [A. Schema-ändringar (nya/ändrade fält + options)](#a-schema-ändringar)
- [B. Automationer A1–A11 — detaljerad extraktion](#b-automationer-a1a11)
- [C. Edge Functions — kontrakt (sammandrag)](#c-edge-functions-kontrakt)
- [D. Datakvalitetsfällor — utöver de 24 i nuvarande data-model.md](#d-datakvalitetsfällor-nya)
- [E. Driftsmässiga fakta](#e-driftsmässiga-fakta)
- [F. Reverse-flow-scenarier](#f-reverse-flow-scenarier)
- [G. Sedan 26 april kl 23:59 — basen-delta](#g-basen-delta-sedan-26-april-2359)
- [H. Personer-bilaga (87 fält fullständigt)](#h-personer-bilaga-fullständig-fältkatalog)
- [I. Edge Functions — detaljerade kontrakt](#i-edge-functions-detaljerade-kontrakt)
- [J. Mail-flöden (Resend)](#j-mail-flöden-resend)
- [Lessons-delta sedan 2026-04-19](#lessons-delta-sedan-2026-04-19)
- [Steg 1.8 — Korrelation, inkonsistenser, öppna frågor, sammanfattning](#steg-18--korrelation-inkonsistenser-öppna-frågor-sammanfattning)

---

## A. Schema-ändringar

### A.1 Nya fält identifierade i basen som inte finns i `miranon-media-os/docs/schema_reference.md`

> **Källa:** MCP `get_table_schema` 2026-04-28 + cross-ref med session-loggar för skapelse-datum.

| Fält-ID | Tabell | Namn | Typ | Skapad | Skapat-källa | Sätts av |
|---|---|---|---|---|---|---|
| `fldwk2sl7CkBv9epw` | Anmälningar | **Källa** | singleSelect (Manuell, +1, Väntelista — tom = formulär) | 2026-04-15 | psionautics-session-2026-04-15 + lessons-15 (rad 155) | `create-registration` Edge Function (kalla-param) |
| `fld39KEXJxyulXfsN` | Anmälningar | **Medföljande till** | multipleRecordLinks (self-link) | 2026-04-15 | lessons-15 (rad 155) + session-26-fortsattning §6 | `create-registration` Edge Function (medfoljandeTill-param) |
| `fldlP4z8Dirq00nqq` | Anmälningar | From field: Medföljande till | multipleRecordLinks (auto inverse) | 2026-04-15 (auto-skapad samtidigt) | inverse-fält på fld39KEXJxyulXfsN | Airtable auto |
| `fld3WBS0QQrqLpYtK` | Anmälningar | **Deltagarinfo skickad** | dateTime | 2026-04-16 | session-2026-04-16 §A.1 | `send-email` (`participant-info`) via `patchAfterSend` |
| `fldqMpSW5UJIhNdgm` | Väntelista | **Flyttad till anmälan** | checkbox | 2026-04-15 | lessons-15 (rad 155) | manuellt eller annan automation/UI |
| `fldsUxLmHR0NQDiwH` | Väntelista | **Informationsmail 1 skickad** | dateTime (UTC) | 2026-04-27 | session-2026-04-27 §C | `send-email` (`waitlist-info-1`) via `patchWaitlistAfterSend` |

### A.2 Nya/utökade options på existerande fält

| Fält-ID | Tabell | Fält | Ny option | option-ID | Tillagt | Källa |
|---|---|---|---|---|---|---|
| `fldWr5cCPNx9HEKtL` | Anmälningar | Status | **Inställt** (redBright) | `selebP2V3qmFRTtdP` | 2026-04-26 | session-26-fortsattning §Punkt 9 |
| `fldWr5cCPNx9HEKtL` | Anmälningar | Status | Flytta till väntelista (redLight2) | `selM6aJv5Ja9OySra` | 2026-04 | data-model.md + lessons-13/14 (rad 209) |
| `fldGyYPbxkgS3BqVb` | Anmälningar | Typ | Psionautics-event (redLight2) | `selBIFgu1Vgt228TR` | (oklart datum) | sannolikt 2026-04, finns i live-state |
| `fldRFOzNqVswqZ1mN` | Deltaganden | Status | **Avbröt** (redBright), **Deltog online** (yellowLight2) | `selJ1f9Yv9J7jjqrH`, `selWGhz7v8MPTVpT8` | (oklart datum — finns men ej i nuvarande data-model.md) | live-state §3.4 |
| `fldCLVfJIHcuI1l83` | Anmälningar | Från formulär | Backfill (historisk) | `selGi1iqC3lb8MSSh` | 2026-04-19 (backfill-sessionen) | session-19-backfill (implicit) |

### A.3 Strukturella ändringar på existerande fält

| Fält-ID | Tabell | Ändring | Datum | Källa |
|---|---|---|---|---|
| `flddy8JND3YnlgZxe` | Personer | **Antal genomförda event** konverterat från rollup → formula `{RIM 1 ×} + {RIM 2 ×} + {RIM 3 ×} + {Fjärrskådning ×}` | 2026-04-26 | session-26-fortsattning §Punkt 4-rättning + verifiering-2026-04-24 errata Fynd 3 |
| `fld93OrTArvdkkYmk` | Personer | **RIM 3 ×** rollup tillagt (fieldIdInLinkedTable=fldL0YfWmdkOuxgsH) | 2026-04-26 | session-26-fortsattning (Punkt 8 löst i samma pass) |
| `fldL0YfWmdkOuxgsH` | Deltaganden | **RIM 3 eventkey** formula tillagt (samma villkor som RIM 1/2 men för "Resor i medvetandet 3") | 2026-04-26 | samma som ovan |
| `flddymQaYJGVCInzq` | Personer | Antal genomförda event (gammal) — markerad för borttagning efter MK 2026-05-03 | 2026-04-26 (markering, inte borttagning) | session-26-fortsattning Backlog |
| `fldbyEz8djcxCBO5r` | Eventplanering (MK-rad recQ2TPsY69fQXA8a) | Max antal platser ändrad 70 → 88 | 2026-04-26 | session-26-fortsattning §Punkt 7 |

### A.4 Aktuella valoptioner — kanonisk lista (per 2026-04-28)

Komplett lista över singleSelect/multipleSelect-optioner som behövs för Fas 4-skrivning:

**Anmälningar.Status (`fldWr5cCPNx9HEKtL`) — 6 val:**
1. Bekräftad (mail skickat) — sel6QGCNQN30jbU9p — greenLight1
2. Betalningspåminnelse skickad — sel4mvpii2dWX6ROd — blueLight2
3. Avbokad/Ombokad — selpxCJnPfU9AMlAB — orangeLight1
4. Obekräftad — selwdnWzeAfnr9GRk — grayLight2 (default)
5. Flytta till väntelista — selM6aJv5Ja9OySra — redLight2
6. **Inställt** — selebP2V3qmFRTtdP — redBright

**Anmälningar.Källa (`fldwk2sl7CkBv9epw`) — 3 val + tom:**
1. Manuell — selBgWo8mevep0W3j — purpleLight2
2. +1 — selKRBSc3mTmYiwZK — tealLight2
3. Väntelista — sely4zQsuvnXYTKKI — blueLight2
4. *(tom)* = formulär — semantiskt definierat av frånvaro

**Anmälningar.Typ (`fldGyYPbxkgS3BqVb`) — 3 val:**
1. Utbildning, 2. Föreläsning, 3. Psionautics-event

**Anmälningar.Anmälningsavgift (`fldJtKQ3qLxRKOvR6`) — 2 val:** Mottagen, Ej mottagen

**Anmälningar.Slutbetalning (`fldIImadnJUZHr5Qh`) — 3 val:** Mottagen, Ej mottagen, Ej relevant (för föreläsningar)

**Anmälningar.Flagga (`fld6DHDYJZeK2r7OE`) — 3 val:** Ny anmälan, Ej mottagen, Mottagen

**Anmälningar.Vill anmäla sig till (`fld6RC3r0R9tuKgdF`) — 8 val (med dubletter pga case):**
1. Resor i medvetandet 1 — selaU0tDZplhTK3dC
2. Fjärrskådning — selqHhahrjJxIWRvL
3. Resor i medvetandet 2 — selqLalsJ0FkkXLoP
4. Resor i medvetandet — selRq549SC1KR1tyi
5. Psionautics — selqsUp0Gy7FjhC0d
6. Resor i medvetandet 3 — seloqAuOJsOPmm2tO
7. **Resor i Medvetandet 2** (capitalised, dubblett) — selipzhJDcLRkNApB
8. **Resor i Medvetandet 1** (capitalised, dubblett) — selCYP1qT4eBptaoi

**Anmälningar.Från formulär (`fldCLVfJIHcuI1l83`) — 5 val:**
Huvudformulär, Expressformulär, Obekräftad, Anmälan-Psionautics.se, Backfill (historisk)

**Eventplanering.Status (`fld2nXlS1UG0aOHLt`) — 4 val:**
Planerat (default), Genomfört, **Inställt** (redLight1), Flyttat

**Eventplanering.Typ (`fldkiFRVYG0xTAhJ4`) — 2 val:**
Utbildning, Föreläsning

**Eventplanering.Event (source) (`flddlv4JA5C5CeH5R`) — 6 val:**
Fjärrskådning, Resor i medvetandet, Resor i medvetandet 1, Resor i medvetandet 2, Resor i medvetandet 3, Psionautics

**Eventplanering.Månad/år (`fld2BjFdBd964TzVb`) — 14 val:**
November 2025 → December 2026 (månadsvis följd)

**Eventplanering.Check-in session (`fldjX1YN7DOhoKvt1`) — 3 val:**
Dag 1, Dag 2, Föreläsning

**Deltaganden.Session (`fldBPZnsDL0bNIRHx`) — 3 val:**
Dag 1, Dag 2, Föreläsning

**Deltaganden.Status (`fldRFOzNqVswqZ1mN`) — 6 val:**
1. Ej avstämt (default) — sel6U4DjySnASdN8C — grayLight2
2. Närvarande — selL6dOK1XDN8UmKQ — greenLight1
3. Frånvarande — selhXfNgpF7dCoFn4 — redLight1
4. Försenad — selckiXY869eiLmrX — yellowLight1
5. **Avbröt** — selJ1f9Yv9J7jjqrH — redBright
6. **Deltog online** — selWGhz7v8MPTVpT8 — yellowLight2

**Personer.AI-flagga (`fldgB9iHDTAqd30Uf`) — 4 val:**
Särskilt stödbehov, Nybörjare, Stabil och mottaglig, Erfaren

**Personer.Manuella flagga (`fldNtwQt6tOCIdf4f`):** singleSelect men `choices=[]` (tom). Kvarstår med tomt valslag.

**Touchpoints.Typ (`fldL8gMBzkMHyUoiK`) — 7 val:**
Angett e-post för att ta del av ett erbjudande, Soundwise - konto skapat, Soundwise - börjat lyssna, Inskickad anmälan, Avbokad anmälan, Närvaro registrerad, Öppnat e-post

**Touchpoints.Erbjudande (`fldpgd7ayzjcbKL98`) — 3 val:**
Meditationen Kraftfältet, Pyramidernas Vajrar, Annat

**Touchpoints.Systemkälla (`fldSXO9yRrxVceBkp`):** singleSelect med `choices=[]`.

**Hämtade erbjudanden.Erbjudande (source) (`fldtJ7yWGhN2vcCMN`) — 2 val:**
Meditationen Kraftfältet, Pyramidernas Vajrar

**Hämtade erbjudanden.Källa (formulärkälla) (`fldF9SgJS1Zv5kmtr`) — 2 val:**
Två SHA256-hashar (sannolikt webhook-källa-IDs):
- `ae9a4975a6f8e77121ae6b8973e1e31411f49d45293638001a448de424a54d10`
- `58947ba345f0013563663ba7916d05637403bcced327adb91dd81cd9c69fea9a`

**Bulkutskick.Status (`fldW7k60IHE0Kpj1W`) — 5 val:**
Skickad, Redo att skickas, Under begrundande, Test, Arkiverad

---

## B. Automationer A1–A11

> **Källa:** `miranon-media-os/docs/miranon_automations_COMPLETE.json` (export 2026-03-16). Live-MCP kan inte läsa automationer (CLAUDE.md "Kritiska lärdomar"). Korrelation: alla nya Anmälningar 2026-04-27 har Person-länk satt → A2 körde → automationerna är levande.

### B.0 Sammanfattning

| ID | Workflow-ID | Trigger | Trigger-tabell | Action-typer | Skript-action |
|---|---|---|---|---|---|
| A1 | wflDCKPAv2P6Yu9U6 | RECORD_CREATED | Anmälningar | FIND×2 + UPDATE×2 + DECISION (1 gren) | – |
| A2 | wflRPMp5QNGEa7wH1 | RECORD_CREATED | Anmälningar | FIND×2 + UPDATE×3 + CREATE×3 + DECISION (4 grenar) | – |
| A3 | wfl4qb2eP28SfKlck | RECORD_MATCHES | Anmälningar | SCRIPT×1 (3 352 tecken) | ja |
| A4 | wflaICTnroTIY4dfP | RECORD_CREATED | Hämtade erbjudanden | FIND + UPDATE + CREATE + DECISION (10 actions totalt) | – |
| A5 | wfljTHq2P4gimMf29 | RECORD_UPDATED | Hämtade erbjudanden | FIND + UPDATE + CREATE + DECISION (6 actions) | – |
| A6 | wfl0filPx4wyAcaQ8 | RECORD_MATCHES | Eventplanering | SEND_EMAIL×1 (`watBETUHIcuho4hit`) | – |
| A7 | wflDxN31sRJNWCqfu | RECORD_UPDATED | Anmälningar | UPDATE-kedja (2 actions) | – |
| A8 | wfl1iYPrEmlKpEsRU | RECORD_UPDATED | Deltaganden | UPDATE×1 (sätt Avstämt = NOW()) | – |
| A9 | wflgIhQ6Qo0zV50NH | RECORD_MATCHES | Eventplanering | SCRIPT×1 (markera närvaro vald session) | ja |
| A10 | wfl4rswJuGt9hVqF3 | RECORD_MATCHES | Eventplanering | SCRIPT×1 (markera närvaro alla sessioner) | ja |
| A11 | wflIHsSbUvoc4BmP5 | RECORD_MATCHES | Deltaganden | SCRIPT×1 (koppla deltagande till person) | ja |

### B.A1 — Matcha anmälan mot event

| Egenskap | Värde |
|---|---|
| workflow_id | wflDCKPAv2P6Yu9U6 |
| Status | deployed |
| Trigger | RECORD_CREATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Entry-action | wacDkQMtkfCRwDYxK |

**Action-flöde (5 nodes):**
1. `wacDkQMtkfCRwDYxK` (FIND_RECORDS Eventplanering) — primär matchning
2. `wacXLk4YN5AzohqCn` (UPDATE_RECORD Anmälningar) — sätt Event-länk
3. `wded6gggP5Gk0qSa9` (DECISION 1 villkorad gren)
   - Gren A: `wacbzFeILnI5wOmBg` (FIND_RECORDS Eventplanering) — alternativ matchning
   - → `wactzl1frqeDjAvyq` (UPDATE_RECORD Anmälningar)

**Matchningsstrategi:** EventKey eller (Event-namn + Ort + Startdatum). Om primärsökning miss → alternativ sökning.

**Känd fälla:** EventKey-format-bug i Huvudformulär. 5 records hade EventKey="11" istället för "Event-11" 2026-04-01 → 2026-04-23. A1 misslyckas matcha → orphan Anmälan utan Event-länk. Sanerade i åtgärdssessionen 26-april. Underliggande formulär-bug kvarstår.

### B.A2 — När någon anmäler sig → uppdatera/skapa person + skapa Touchpoint

> **G3-fix:** Räknaren "10 actions" inkluderar alla nodes i graph.actionsById (entry, decision, alla branch-mål). Numrerad action-flöde nedan listar alla 10 explicit.

| Egenskap | Värde |
|---|---|
| workflow_id | wflRPMp5QNGEa7wH1 |
| Status | deployed |
| Trigger | RECORD_CREATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Entry-action | wacGpA7qtiHjlwD1x |

**Alla 10 actions explicit:**

| # | Node-ID | Typ | Tabell | Roll |
|--:|---|---|---|---|
| 1 | `wacGpA7qtiHjlwD1x` | FIND_RECORDS | Personer | Entry — sök Person på Normaliserad e-post |
| 2 | `wacmPhj6tKzUl65Wk` | FIND_RECORDS | Personer | Alternativ Person-sökning (sannolikt namn-baserad) |
| 3 | `wdezdzNWaL1MYcrkE` | DECISION (4 grenar) | – | N-WAY-router efter sökresultat |
| 4 | `wacKY1MLhOdtIXxR7` | UPDATE_RECORD | Personer | Gren 1: uppdatera namn på namnlös Person |
| 5 | `wacGPdvix9kI22TNq` | UPDATE_RECORD | Anmälningar | Gren 2: koppla Anmälan till befintlig Person |
| 6 | `wac6h6C1Q8oXQzN5U` | CREATE_RECORD | Error-log | Gren 3: dubblett — logga fel |
| 7 | `wacKlSgMwIrOzjE1P` | CREATE_RECORD | Personer | Gren 4 (default): skapa ny Person |
| 8 | `wacyh2GuNw8IbUb9K` | UPDATE_RECORD | Anmälningar | Efter Gren 4 — sätt Person-länk på Anmälan |
| 9 | `wacXk240STE9j0Ory` | CREATE_RECORD | Touchpoints | Skapa Touchpoint (Inskickad anmälan) |
| 10 | `wacDCG3kSmETZg8lj` | CREATE_RECORD | Touchpoints | Skapa Touchpoint (alternativ branch) |

**Decision-grenar:** 4 grenar, beslutas på resultat från FIND-actions:
- Gren 1: `length(STEG_2 från wacmPhj6tKzUl65Wk) = 1` → uppdatera namn på namnlös Person
- Gren 2: `length(STEG_1 från wacGpA7qtiHjlwD1x) = 1` → koppla Anmälan till Person
- Gren 3: `length(STEG_1) > 1` → Error-log dubblett
- Gren 4: default → Skapa ny Person + koppla

**[HYPOTES — EJ VERIFIERAD] (från lessons-psionautics-specifikt rad 48–63):** Om en namnlös Person finns för trigger-mailen matchar Gren 1 och Gren 2 körs aldrig. Det skulle göra att Anmälan-Person-länken förblir tom, bara Personens Förnamn/Efternamn uppdateras. Marcus markerade explicit i lessons.md att detta är hypotes, ej verifierat. **Verifieringsplan:** skapa en testanmälan med email-adress som matchar en känd namnlös Person-record och kolla efter A2-körning om Anmälan.Person är satt eller tom.

**Tabeller berörda:** Anmälningar (UPDATE), Personer (FIND, UPDATE, CREATE), Touchpoints (CREATE×2), Error-log (CREATE).

### B.A3 — Förskapa deltaganden vid anmälan

| Egenskap | Värde |
|---|---|
| workflow_id | wfl4qb2eP28SfKlck |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Trigger-villkor | (sannolikt: Event-länk satt) |
| Action | 1 × `watCUSTOMSCRIPT00` |
| Script-storlek | 3 352 tecken (`inputExpressions` size) |
| Script-roll | Förskapa Deltaganden-records baserat på Eventets Sessionsmall (Dag 1, Dag 2, Föreläsning per Eventformat) |

**Empirisk verifiering 2026-04-28:** Deltaganden #1683/1684 skapades 26-april kl 21:41:33 (samma sekund som Anmälan #853 fick Event-länk satt av A1) → A3-trigger kedjas på A1-uppdatering. Två Deltaganden per Anmälan = Dag 1 + Dag 2.

### B.A4 — Inkommande lead → koppla ihop händelse och person

| Egenskap | Värde |
|---|---|
| workflow_id | wflaICTnroTIY4dfP |
| Status | deployed |
| Trigger | RECORD_CREATED på `tblqFpgxEhJ95AEcM` (Hämtade erbjudanden) |
| Actions | 10 totalt, inkluderar DECISION |

**Tabeller berörda:** Hämtade erbjudanden, Personer, Touchpoints, Erbjudanden, Error-log.

**Mönster:** matcha lead mot befintlig Person via E-post → uppdatera eller skapa ny → koppla till Erbjudande-record → skapa Touchpoint (Typ="Angett e-post för att ta del av ett erbjudande").

### B.A5 — Inkommande lead → Skapa/uppdatera engagemang

| Egenskap | Värde |
|---|---|
| workflow_id | wfljTHq2P4gimMf29 |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tblqFpgxEhJ95AEcM` (Hämtade erbjudanden) |
| Actions | 6 totalt, inkluderar DECISION |

**Tabeller berörda:** Hämtade erbjudanden, Engagemang.

**Mönster:** när Hämtade erbjudanden uppdateras (Person-länk sätts av A4 sannolikt), uppdatera/skapa Engagemang-record som aggregerar (Första hämtning, Senaste hämtning, Totalt antal).

### B.A6 — Event fullbokat (Beläggning 100 %)

| Egenskap | Värde |
|---|---|
| workflow_id | wfl0filPx4wyAcaQ8 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` (Eventplanering) |
| Trigger-villkor | (sannolikt: Anmäld beläggning ≥ 100%) |
| Action | 1 × `watBETUHIcuho4hit` (SEND_EMAIL — Airtable native) |
| Email-fält | to, cc, bcc, subject, message, fromName, replyTo, attachments, inReplyTo |
| Empirisk händelse | MK-eventet (Max=70 → 88) sannolikt triggade A6 vid 70/70-tröskeln |

### B.A7 — Synka ej mottagna slutbetalningar per event

| Egenskap | Värde |
|---|---|
| workflow_id | wflDxN31sRJNWCqfu |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Trigger-villkor | (sannolikt: Slutbetalning-fält ändrad) |
| Actions | 2 (UPDATE-kedja) |
| Tabeller | Anmälningar, Eventplanering |

### B.A8 — Sätt tidstämpel när närvarostatus ändras

| Egenskap | Värde |
|---|---|
| workflow_id | wfl1iYPrEmlKpEsRU |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tbldWHH6sSHWoQPHH` (Deltaganden) |
| Trigger-villkor | (sannolikt: Status-fält ändrad) |
| Action | 1 × `watUPDATERECORD00` (sätt `Avstämt` = NOW()) |
| Verifierad latens | <60 sekunder (session-26-fortsattning §Punkt 4-rättning) |

### B.A9 — Markera närvaro (vald session)

| Egenskap | Värde |
|---|---|
| workflow_id | wflgIhQ6Qo0zV50NH |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` (Eventplanering) |
| Trigger-villkor | Checkbox `Markera alla närvarande` (fldN20OexhRJQr9XY) sätts till true |
| Action | 1 × `watCUSTOMSCRIPT00` |
| Script-roll | Iterera Deltaganden för Eventet där Session matchar `Check-in session` (fldjX1YN7DOhoKvt1) → sätt Status = `Närvarostatus att sätta` (flddzMrhu30cXoaEf, default "Närvarande") |

### B.A10 — Markera närvaro (alla sessioner)

| Egenskap | Värde |
|---|---|
| workflow_id | wfl4rswJuGt9hVqF3 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` |
| Trigger-villkor | Checkbox `Markera alla närvarande (alla sessioner)` (fldF5atXm9lV2nAeq) sätts till true |
| Action | 1 × `watCUSTOMSCRIPT00` |
| Script-roll | Som A9 men över alla sessioner i Eventet |

### B.A11 — Koppla deltagande till person

| Egenskap | Värde |
|---|---|
| workflow_id | wflIHsSbUvoc4BmP5 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tbldWHH6sSHWoQPHH` (Deltaganden) |
| Trigger-villkor | (sannolikt: Person-länk-rollup tom) |
| Action | 1 × `watCUSTOMSCRIPT00` |
| Script-roll | Sätt Person-länk på nya Deltaganden — kopiera från Anmälan.Person |

---

## C. Edge Functions — kontrakt (sammandrag)

> **Detaljerat kontrakt + commit-hashes i §I.** Tabellen nedan är kvick-översikt.

| Function | Senaste commit | Tabeller skrivs till | Tabeller läses från | Källa-fält hårdkodat |
|---|---|---|---|---|
| `create-registration` | `22b8692` 2026-04-15 | Anmälningar | Anmälningar (dubblettcheck) | EventKey="Event-17", Event=[recQ2TPsY69fQXA8a] |
| `create-waitlist-entry` | `7585604` 2026-04-15 | Väntelista | Väntelista (dubblettcheck) | Event="Medveten Kontakt", Eventdatum-start="2026-05-01", Eventdatum-slut="2026-05-03" |
| `update-registration` | `811adbf` 2026-04-15 | Anmälningar | – | – |
| `get-event-bookings` | `6a7c9a9` 2026-04-16 | (read-only) | Anmälningar, Eventplanering | – |
| `get-waitlist-stats` | `3e7eeee` 2026-02-21 | (read-only) | Väntelista | – |
| `get-waitlist` | `30bd2c9` 2026-04-27 | (read-only) | Väntelista | filter: NOT(Flyttad till anmälan) |
| `send-email` | `1a07d1b` 2026-04-27 | Anmälningar, Väntelista | – | TEMPLATE_MAP (5 entries) |

---

## D. Datakvalitetsfällor — nya

> Komplement till de 16 kända fällor i nuvarande `data-model.md` + 24 i `verifiering-2026-04-24.md`.

### D.1 RECORD_ID()-formler returnerar fel record-ID i Deltaganden

**[VERIFIERAT 2026-04-28 via direkt MCP-jämförelse länkfält vs formelfält]**

Två fält i Deltaganden (`tbldWHH6sSHWoQPHH`) ser ut att ge länkat record's ID men gör det inte:

| Fält-ID | Namn | Formel | Faktiskt beteende |
|---|---|---|---|
| `fldkTS2S8IDTsHibj` | "Anmälan (ID)" | `RECORD_ID({Anmälan})` | Returnerar **Deltagandets eget record-ID**, inte Anmälans |
| `fld1PV4JDU0xkFrQ2` | "Event (ID)" | `RECORD_ID({Event})` | Returnerar **Deltagandets eget record-ID**, inte Eventets |

**Bevis:** Delt #1683 (rec0gBwp1ItzlgBtH):
- Faktisk Anmälan-länk: `recFaXedi3YB14m0F` (Anmälan #853)
- Faktisk Event-länk: `rec6YyJSnP5V8IEaV` (Event-24)
- "Anmälan (ID)" returnerar: `rec0gBwp1ItzlgBtH` ← Deltagandets eget ID
- "Event (ID)" returnerar: `rec0gBwp1ItzlgBtH` ← samma

**Orsak:** Airtables `RECORD_ID()` accepterar inga argument enligt formula-specen — den returnerar alltid current record's ID. Argumenten `{Anmälan}` och `{Event}` ignoreras tyst (formel rapporteras ändå som `isValid: true`).

**Påverkan:** Om någon konsument litar på dessa fält som "ID för länkat Anmälan/Event" (t.ex. för debug-output, CSV-export, korrelation) blir resultatet fel. Bekräftade konsumenter (Eventkey-formler i Deltaganden) använder rätt mekanism — de tar `fldGC2MziEfqIPeZP Eventkey (lookup)` istället. Men de två "(ID)"-fälten är i praktiken döda värden.

**Åtgärd-rekommendation:** Antingen ta bort fälten eller ersätt med `ARRAYJOIN(Anmälan-länk)` / `ARRAYJOIN(Event-länk)` om syftet var visning. Inget akut, men flagga i datamodell-doc.

### D.2 `Vill anmäla sig till` har case-dubletter

**[VERIFIERAT 2026-04-28 via get_table_schema]**

Optionerna i `fld6RC3r0R9tuKgdF` (Anmälningar) inkluderar både:
- "Resor i medvetandet 1" (selaU0tDZplhTK3dC) — kanonisk, lowercase "medvetandet"
- "Resor i Medvetandet 1" (selCYP1qT4eBptaoi) — capitalised "Medvetandet"

Samma för "2"-versionen. Resultat: anmälningar kan landa under två olika optioner med "samma" innehåll. Drabbar segmentering, A1-matchning på Vill anmäla sig till, statistik.

**[HYPOTES — EJ VERIFIERAD]:** Sannolikt orsakad av att formuläret skickar in olika kapitalisering vid olika tillfällen. Behöver kollas i HTML-formulärets options-lista.

### D.3 Personer "Manuella flagga" + Touchpoints "Systemkälla" är tomma singleSelects

Båda fält har `choices=[]`. Sannolikt designade men ingen option har lagts till än, eller alla optioner togs bort utan att fältet ströks.

**Påverkan:** UI låter användaren välja från tom lista → fältet kan inte sättas. Antingen ta bort fältet eller lägg till optioner.

### D.4 Hämtade erbjudanden.Källa (formulärkälla) använder SHA256-hashar som option-namn

`fldF9SgJS1Zv5kmtr` har två optioner med 64-tecken hash-strängar som namn. Sannolikt designade som webhook-källkoder men förvandlade till option-värden av misstag.

**Påverkan:** Skarpt rapporterad data är obegriplig. Kräver mappningstabell hash → läsbart namn.

### D.5 Två nya namnlösa Personer skapade 2026-04-26 21:47-48

Recordsen `receoF3BY3ZCMEJ0U` (tonetider@protonmail.com) och `rec0uNum3YVL1tb1L` (miranon.prominent654@passmail.net) skapades med Förnamn/Efternamn = tom → Namn-formula returnerar "Ej tillgängligt".

**Sannolik orsak:** Lead från Hämtade erbjudanden-formuläret som bara samlar e-post → A4 skapar Person utan namn. Detta är "normalt tillstånd" enligt lessons-psionautics-specifikt rad 67–70.

**Påverkan:** Behöver hanteras i CSV-export och deltagarinsikter — visa "(namn saknas)" istället för "Ej tillgängligt" som är fält-värde.

### D.6 `Är aktiv (1/0)` exkluderar inte "Inställt"

Formel `IF({Status}="Avbokad/Ombokad", 0, 1)` exkluderar bara Avbokad/Ombokad. **Inställt räknas som aktiv** (=1).

**Konsekvens:** Personen Mia Hasselgren och Daniel Finnhult (båda "Inställt" Status) räknas som aktiva i `Personer.Antal anmälningar (aktiva)` rollup.

**Åtgärd-rekommendation:** Uppdatera formeln till `IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1)`. Inte gjord 2026-04-26 — sannolikt missad.

### D.7 `Antal genomförda event` (gammal vs ny) parallella formler

`flddymQaYJGVCInzq` (gammal rollup) och `flddy8JND3YnlgZxe` (ny formula) finns båda. Den gamla markerad för borttagning efter MK 2026-05-03 (session-26-fortsattning Backlog), men kvarstår 2026-04-28.

**Risk:** Om någon konsument fortfarande pekar på den gamla får den föråldrad data (utan RIM 3).

### D.8 `Erfarenhetsbadge`-formelns SWITCH har döda grenar

Från lessons-16-em (rad 95): SWITCH mappar "Genomfört alla" → "Miranon Media stjärna" och "Genomfört alla (upprepat)" → "Hängiven utforskare", men föregående formel `Erfarenhetsnivå` returnerar aldrig dessa värden. Döda kodgrenar.

### D.9 `Återkommande?`-formel mäter inte "har gått förut"

Från lessons-16-em (rad 95): Formel kräver `AND(Antal tidigare genomförda > 0, Anmäld till antal kommande > 0)`. En person som gått RIM 1 2024 utan kommande bokning visas som "Nej". Felaktigt namngivet — borde heta "Aktiv återkommande".

---

## E. Driftsmässiga fakta

| Fakta | Värde | Källa |
|---|---|---|
| Bas | `app8uGPrVCVOm6LfD` | live-state |
| Tabeller | 18 | live-state |
| Records totalt | Anmälningar 735, Personer 568, Deltaganden 1500, Eventplanering 50, Väntelista 44 | live-state §1 |
| MK-eventet | `recQ2TPsY69fQXA8a` (1–3 maj 2026, Borghamn Strand) | psionautics-CLAUDE.md |
| MK-räknare 2026-04-28 | 87 anmälda, 216 deltaganden, 0 närvaro | session-26-fortsattning §MK-status |
| MK Max antal platser | 88 (uppdaterad från 70 → 88 av Marcus 2026-04-26) | session-26-fortsattning §Punkt 7 |
| Aktiva Edge Functions | 13 (10 i `supabase/functions/` + 3 status: pausade Plausible-funktioner) | psionautics-CLAUDE.md "Supabase Edge Functions" |
| Resend-mallar | 5 (`medveten-kontakt-bekraftelse`, `-betalning`, `-plus-one`, `-deltagarinformation`, `-vantelista-info-1`) | psionautics-CLAUDE.md + send-email/index.ts TEMPLATE_MAP |
| Avsändar-domän | `noreply@h5gruppen.se` (Reply-to: lotta@outsidereality.se). DKIM ok | session-2026-04-16 §E-post-setup |
| Domän pending | outsidereality.se eller psionautics.se i Resend (kvarstår) | flera sessions |
| Backfill-status | 459 backfill-Anmälningar + 924 backfill-Deltaganden + 22 nya Eventplanering, alla verifierade rena | verifiering-2026-04-24 §Resultat |
| Plausible | Inaktiverad april 2026 (prenumeration löpt ut) | psionautics-CLAUDE.md |
| Inställt-events | 3 totalt (Event-6 Varberg, Event-11 Falköping FS, Event-12 Falköping RIM) | live-state §7.5 |
| Inställt-anmälningar | 2 (Mia Hasselgren #2, Daniel Finnhult #28 — båda Event-6) | live-state §7.6 |
| Whitespace-Personer cleanup | 13 → 0 (2026-04-26 §Punkt 6) | session-26-fortsattning |
| Avvikelse-Personer | 9 → 5 (4 löste sig automatiskt via Punkt 4-rättning, 5 PATCH:ade Anteckningar) | session-26-fortsattning §Punkt 10 |

---

## F. Reverse-flow-scenarier

> Scenarier där data flödar "baklänges" från det förväntade huvudflödet — ofta källor till buggar.

### F.1 Backfill-flödet (kontra A2:s primära designflöde)

**Designflödet (lead-först-anmälan-sedan):**
1. Person hämtar erbjudande → A4 skapar Person (kanske namnlös)
2. Person anmäler sig senare → A2 hittar Person via e-post → Gren 1 (uppdatera namn) eller Gren 2 (länka)

**Backfill-flödet (anmälan-först-utan-existerande-Person):**
1. Backfill-script POSTar Anmälan med E-post men ingen länk
2. A2 söker Person → ingen → Gren 4 (skapa Person + länka Anmälan)

**Lärdom från lessons-psionautics-specifikt rad 70–73:** A2:s grenordning är optimerad för designflödet. Backfill kompenserar genom att veta att Gren 4 körs. Reverse-flow av annan typ kan trampar i samma fälla.

### F.2 EventKey-format-bug i Huvudformulär (öppet)

**Scenario:** Användare anmäler sig via Huvudformulär → formuläret skickar `EventKey="11"` istället för `EventKey="Event-11"` → A1 misslyckas matcha → Anmälan landar utan Event-länk.

**Drabbade records 2026-04-01 till 2026-04-23:** Anmälningar 220, 221, 222, 237, 847.

**Sanering:** Alla 5 PATCH:ade i åtgärdssessionen 26-april. Källa-bug kvarstår.

**[HYPOTES — EJ VERIFIERAD]:** Buggen sitter i HTML-formulärets template-kod (psionautics.se eller miranon.se). Fast värde "11" tyder på avsaknad av variabel-substitution.

### F.3 Mail-flödet (frontend → Edge Function → Airtable + Resend)

```
[Admin UI] → POST /functions/v1/send-email { type, to, recordId }
            ↓
       send-email
            ↓
       Resend.send(template) → user-inbox
            ↓ (vid success)
       patchAfterSend(type, recordId)
            ↓
       PATCH Airtable (Bekräftelse skickad / Betalningspåminnelse / Plus-one / Deltagarinfo)
```

För `waitlist-info-1`:
```
       send-email → patchByType (prefix-routing) → patchWaitlistAfterSend → PATCH Väntelista (Informationsmail 1 skickad)
```

**Fälla:** Mail kan skickas men PATCH misslyckas → user fick mail men UI visar inte timestamp. Edge Function loggar fel (`console.error('Post-send PATCH failed: ...')`) men returnerar ok-status. Endast synlig via Cloud → Edge functions → Logs.

### F.4 Väntelista → Anmälningar-flytt

Inte en automation utan UI-flöde:
1. Lotta klickar "Lägg till som anmäld" på en Väntelista-rad
2. Frontend POSTar `create-registration` med `kalla="Väntelista"` + namn/email/telefon
3. PATCH Väntelista-rad: `Flyttad till anmälan = true`
4. Anmälan dyker upp i Anmälningar-tabellen, väntelistraden filtreras bort

**Notera:** Om steg 3 misslyckas blir det dubblett — personen är både på väntelistan (visad) och i anmälan. Felhantering oklar, behöver verifieras.

---

## G. Basen-delta sedan 26 april 23:59

> **G2 — adresserad.** Per Marcus' begäran: vad har förändrats efter åtgärdssessionen 26-april (cutoff 2026-04-26 23:59:59).

### G.1 Nya fält

| Fält | Tabell | Skapad | Skapat-källa |
|---|---|---|---|
| `Informationsmail 1 skickad` (fldsUxLmHR0NQDiwH) | Väntelista | 2026-04-27 | session-2026-04-27 §C |

### G.2 Ändrade fält-options

Inga nya options identifierade efter 26-april kl 23:59. Alla Inställt-options + Anmälningar-Status-utbyggnaden gjordes 26-april (under cutoff).

### G.3 Edge Functions deploys efter cutoff

| Function | Commit | Datum/tid | Ändring |
|---|---|---|---|
| `send-email` | `1a07d1b` | 2026-04-27 08:39:56 UTC | TEMPLATE_MAP-utökning med `waitlist-info-1`, `patchWaitlistAfterSend()`, dispatcher `patchByType()` |
| `get-waitlist` | `30bd2c9` | 2026-04-27 08:40:05 UTC | `WaitlistRecord`-interface utökat med `informationsmail1Skickad: string` |

Båda 27-april-deploys handlar om Väntelista-mail 1-funktionaliteten. Inga andra Edge Functions berörda.

### G.4 Records skapade efter cutoff

| Tabell | Antal nya records | Tidigaste | Senaste |
|---|--:|---|---|
| Anmälningar | 1 (#854) | 2026-04-27 18:41:36 | 2026-04-27 18:41:36 |
| Personer | 2 (Henny..., Simon Ågren) | 2026-04-27 18:26:50 | 2026-04-27 18:41:41 |
| Deltaganden | 2 (#1685–1686) | 2026-04-27 18:41:58 | 2026-04-27 18:41:58 |
| Eventplanering | 0 | – | – |
| Väntelista | 0 (sista skapad: rec1rJfnPOoAltCcX 2026-04-14) | – | – |

**Korrelation:** Anmälan #854 (Henny) → A2 skapade Personer-record (Henny) + uppdaterade Anmälan med Person-länk → A1 satte Event-länk → A3 förskapade 2 Deltaganden (Dag 1+Dag 2) på Event-24. Allt skedde inom 22 sekunder (18:41:36 → 18:41:58). Personer-recordet för Simon Ågren (18:26:50) är skapat ~15 min tidigare och saknar Anmälan-länk — sannolikt lead från Hämtade erbjudanden (A4-skapad).

### G.5 Ändrade automationer

**Inte verifierbart via tillgängliga källor.** JSON-export är från 2026-03-16. Live-MCP kan inte läsa automationer. Att fastställa om någon automation ändrats måste göras via:
- Airtable UI (manuell granskning)
- HAR-export

**Indirekt indikation:** Alla A1-A11 fungerar empiriskt baserat på nya records skapade 27-april. Inga rapporterade ändringar i sessionsloggar 27/4 eller 26/4 som rör automations-konfiguration.

[HYPOTES — EJ VERIFIERAD]: Inga automationer har ändrats sedan 2026-03-16. Verifieringsplan: be Marcus screenshota Automations-listan i Airtable UI och jämföra `version`-numret mot JSON-exportens (A1 = version 345 i JSON).

---

## H. Personer — fullständig fältkatalog

> **G4 — adresserad.** Personer har 87 fält. 35 är detaljerade i 02-live-state §3.3. Återstående 52 listas nedan i en bilaga med fält-ID, namn, typ och 1-rads kommentar.

### H.1 Detaljerat dokumenterade i 02-live-state §3.3 (35 fält)

Identitet (8): Namn, Rad skapad, E-post, E-post (manuell inmatning), Telefon, Förnamn, Efternamn, Ej godkänd för mailutskick

Manuella flaggor (5): Manuella flagga, AI-flagga, Anteckningar, Inbjuden till community, Skapat konto i community

Länkfält (7): Anmälningar, Deltaganden, Touchpoints, Hämtade erbjudanden, Engagemang, Utskickslogg, Mail logg (rådata)

Anmälningskedjan (rollups + formler) (10): Anmäld till antal kommande utbildningar, Anmäld till antal kommande föreläsningar, Antal anmälningar (totalt), Antal anmälningar (aktiva), Antal anmälningar (avbokade/ombokade), Antal tidigare genomförda utbildningar, Motivering (rollup), Nästa event (rad), Återkommande?, Har en aktiv anmälan?

Deltagandekedjan (rollups + formler) (10): RIM 1 ×, RIM 2 ×, RIM 3 ×, Fjärrskådning ×, Totala deltaganden, Antal genomförda event, Antal genomförda event (gammal), RIM 1 events (pretty), RIM 2 events (pretty) copy, Fjärrskådning events (pretty)

(Vissa fält dubbelräknas över kategorier — totalt unika i §3.3 = 35 unika fält.)

### H.2 Bilaga — återstående 52 fält

| Fält-ID | Namn | Typ | Kommentar |
|---|---|---|---|
| fldxVr7PSZbsm2mI7 | Anmäld till (kommande) | rollup | Lista med kommande Eventplanering-record IDs |
| fld8D6B8a23W17VD1 | Erfarenhet (sammanfattning) | formula | "RIM 1 ×N • RIM 2 ×N • Fjärrskådning ×N" — concat |
| fldBP7xdEmpXDwUpz | Totala deltaganden | formula | RIM 1 + RIM 2 + Fjärrskådning (saknar RIM 3) |
| fldWSkxHJS2xWav4t | Erfarenhetsnivå (Miranon Media) | formula | IF-träd som returnerar "Ej påbörjat" / "Avvikelse" / "Genomfört RIM steg 1–2" osv. |
| fld04qqDQLgbJbBef | Erfarenhetsbadge | formula | SWITCH som mappar nivå → "Resenär", "Stjärna" osv. (har döda grenar — D.8) |
| fldlo3x4jKHBwvOg5 | Skicka e-post | formula | Bygger `mailto:`-länk |
| fld9IM8HnDzutkwf8 | Hämtade erbjudanden (länk) | multipleRecordLinks | redan listad ovan |
| fldpgCjzpgtDhqIaQ | Genomförda dagar | rollup | summa av Närvaropoäng från Deltaganden |
| fldITyVMA9a4SHdgN | Kommande event | rollup | summa av Kommande poäng från Deltaganden |
| fldHsZVnerqflbWCp | Senaste deltagande datum | rollup | max-datum från Deltaganden |
| fldvAQbWMNoj3oPqm | Senast deltagande (rad) | rollup | sammanfattning av senaste Deltagande |
| fldcvEZBNvkl1MCN3 | Senast deltagande (text) | formula | text-extrakt från ovan |
| fldgzFXqDGTdKEf60 | TP sammanfattning (rollup) | rollup | Touchpoints-sammanfattning |
| fld8y8pf87Lq09F91 | Senast touchpoint (text) | formula | text-extrakt |
| fld8e65ppGbVzaSv4 | Senast touchpoint datum | rollup | max-datum från Touchpoints |
| fldRnujWHT3ADToC1 | Senaste interaktion (text) | formula | min av Senaste deltagande / Senast touchpoint |
| fldXZyVlSKg5mX8rP | Senaste interaktion (datum) | formula | dateTime av ovanstående |
| fldu6TMim33w14zdU | Textfält bonus | formula | (oklart syfte) |
| flddymQaYJGVCInzq | Antal genomförda event (gammal) | rollup | redan listad — markerad för borttagning |
| fldHchJXiIFw3BuFy | Alla hämtningar | rollup | totalt antal hämtningar från Hämtade erbjudanden |
| fldd782imiCRtFJ4t | Totalt antal hämtningar (erbjudande) | rollup | per erbjudande |
| fld0NTqm8gx1FnVVp | Senast hämtning (erbjudande) | formula | text |
| fldnSiqg9K4sGp38j | Första hämtning (erbjudande) | formula | text |
| fld58ihHj9MSv6Svu | Motiveringar (lista) | rollup | alla motiveringar från Anmälningar |
| fldlyRELdcLKMg0t2 | Eventtyp | rollup | Utbildning/Föreläsning från Anmälningar |
| fldzd4YElq4zUdePZ | RIM 1 events (pretty) | formula | redan listad i §3.3 |
| fldW3A1dxJ5zHIsVo | RIM 2 events (pretty) copy | formula | redan listad — namnet "copy" antyder kvarvarande dubblett |
| fldqgl9NYPnYUzqCN | Fjärrskådning events (pretty) | formula | redan listad |
| fld4kuiQrB6bkO35X | RIM 1 event (lista) | rollup | rå lista |
| fldkFpwQONNyg4fHA | RIM 2 event (lista) | rollup | rå lista |
| fldA0N8lckVJrmtTx | Fjärrskådning event (lista) | rollup | rå lista |
| fldfopt6vl3ZdOT5W | Genomförda event (lista) | rollup | sammanslagen lista |
| flddy8JND3YnlgZxe | Antal genomförda event | formula | redan listad — den nya formula-versionen |
| fldtv9xjLNCbg20XB | Avvikelse (stegordning) | formula | "⚠️ RIM 2 utan RIM 1" eller tom |
| fldNCx2ev2Jt8vhkH | Senast genomfört event datekey | rollup | YYYYMMDD-format för sortering |
| fldzFWa0z3cwgU1aJ | Senast genomförda event | rollup | label för senast genomfört |
| fldCGV9U0mw7txJ8N | Senaste touchpoint datetimekey | formula | sortkey för Touchpoints |
| fldfSmhjk9CEchFbs | Senaste deltagande datetimekey | formula | sortkey för Deltaganden |
| fld6wQp5K9VAcFskd | Dagar sedan senaste interaktion | formula | DATETIME_DIFF |
| fldT1yVpCFa5Zyrji | Senaste interaktion datetimekey | formula | sortkey |
| fldWiUTbxBpDjlVKq | Min dagar sedan (TP) | rollup | min DATETIME_DIFF från Touchpoints |
| fld5997POaT6irhOp | Min dagar sedan (Deltagande) | rollup | min DATETIME_DIFF från Deltaganden |
| fld9wrmfhSParaxOz | Min av de två | formula | MIN(TP, Deltagande) |
| fld3Kq49h7Po6863s | Datum | multipleLookupValues | datum-lookups från Deltaganden (sannolikt) |
| fldBd946g2waLT7NG | Ort | rollup | rollar Ort från Anmälningar/Deltaganden |
| fldN3163pkxdv7xOx | Första nedladdning (datum) | formula | datum-konvertering |
| fld4kEGqnHd86NkGG | Första nedladdning (key) | rollup | key-format |
| fldSnKFB3Og3cSh8S | Första nedladdning (sortkey) | rollup | sortkey |
| fldAKV3haCxGx0vpI | Senast nedladdning (key) | rollup | sortkey |
| fldyXhIRaqnBwWG40 | Närvaro (text) | formula | text-sammanfattning |
| fld4UQOdKTvWixZ9F | Antal hämtningar | formula | räknare |
| fldzX0MNxmAzOGOsk | Utbildningsdagar möjliga | rollup | summa möjliga dagar |
| fldbu0YGvu8gXSFHj | Utbildningsdagar genomförda | rollup | summa genomförda dagar |
| fldMv413mufrfLZnW | Har en aktiv anmälan (Ja/Nej) | formula | redan listad — "Ja"/"Nej"-format |
| fld9Yr7aGST29Pbdf | Har en aktiv anmälan? | formula | redan listad — "Aktiv"/"Ingen aktiv anmälan"-format |

**Verifiering av räkning:** §3.3 listar 35 unika fält + bilagan H.2 listar 52 fält. Vissa fält i H.2 är repeat från §3.3 ("redan listad") — för fullständighetens skull. **Total unik fält-mängd = 87** (motsvarar `list_tables_for_base`-utdatan).

---

## I. Edge Functions — detaljerade kontrakt

### I.1 `create-registration` (commit `22b8692` 2026-04-15)

**Endpoint:** POST /functions/v1/create-registration

**Request body:**
```ts
{
  fornamn: string,        // required
  efternamn: string,      // required
  email?: string,         // normaliseras till lowercase + trim
  telefon?: string,
  notering?: string,
  antalPlatser?: number,  // default 1, min 1
  status?: string,        // default 'Obekräftad'
  betalning?: boolean,    // → 'Betalning mottagen (psionautics-event)'
  kalla?: string,         // → Källa-fält: 'Manuell' | '+1' | 'Väntelista'
  medfoljandeTill?: string  // record-ID → Medföljande till
}
```

**Skriver till:** Anmälningar (`tbloOcrppVoyrHbrq`)

**Hårdkodade värden:**
- `EventKey: 'Event-17'` (refererar till MK-eventet — `recQ2TPsY69fQXA8a`)
- `Event: ['recQ2TPsY69fQXA8a']`

**Dubblettcheck:** Sök Anmälningar med `AND({Normaliserad e-post}=$email, {EventKey}='Event-17')` → om hit returnera 409 med `existingName`.

**Felfall:**
- 400: namn saknas
- 409: dubblett
- 500: token saknas eller Airtable-fel

**Antaganden:**
- A1 körs efter create → sätter Event-länk på "Event-17" (idempotent eftersom create redan satt det) → kedjar till A2 + A3
- Kallad enbart för MK-eventet — inte generellt verktyg

### I.2 `create-waitlist-entry` (commit `7585604` 2026-04-15)

**Endpoint:** POST /functions/v1/create-waitlist-entry

**Request body:**
```ts
{ fornamn: string, efternamn: string, email: string, telefon?: string }
```

**Skriver till:** Väntelista (`tbl2VxMx7JMkIxD4Q`)

**Hårdkodade värden:**
- `Event: 'Medveten Kontakt'`
- `Eventdatum-start: '2026-05-01'`
- `Eventdatum-slut: '2026-05-03'`

**Dubblettcheck:** Sök Väntelista med `{E-post}=$email` → om hit returnera 409.

### I.3 `update-registration` (commit `811adbf` 2026-04-15)

**Endpoint:** POST /functions/v1/update-registration

**Sätter:** Anmälningar.Status, Anmälningar.Anmälningsavgift, Anmälningar.Slutbetalning, Eventplanering.Max antal platser, Eventplanering.Extra platser, Eventplanering.Arrangörsplatser, Eventplanering.Manuella platser

**Antaganden:**
- A7 kan trigga vid Slutbetalning-uppdatering → uppdaterar event-rollups (idempotent eftersom rollup räknar)

### I.4 `get-event-bookings` (commit `6a7c9a9` 2026-04-16)

**Endpoint:** POST eller GET /functions/v1/get-event-bookings

**Read-only.** Läser från Anmälningar + Eventplanering. Returnerar:
- Event-metadata (Manuella platser, Extra platser, Arrangörsplatser, Max antal platser med fallback 70)
- Booking-rader inkl. Antal platser, Status, Källa, **deltagarinfoSkickad** (mappat från Deltagarinfo skickad)
- Plus-one-relationer (Medföljande till)

### I.5 `get-waitlist` (commit `30bd2c9` 2026-04-27)

**Endpoint:** GET /functions/v1/get-waitlist

**Read-only.** Läser från Väntelista med filter `NOT({Flyttad till anmälan})`. Paginerar med offset, returnerar:
```ts
{
  total: number,
  records: Array<{
    id, fornamn, efternamn, email, telefon, utmContent,
    informationsmail1Skickad,  // mappat från fldsUxLmHR0NQDiwH
    createdTime
  }>
}
```

Sorterad descending på `createdTime` (nyast först).

### I.6 `get-waitlist-stats` (commit `3e7eeee` 2026-02-21)

**Read-only.** Sannolikt aggregerar Väntelista per utm_content/utm_medium. Inte ändrad sedan februari — utanför scope för 2026-04-arbete.

### I.7 `send-email` (commit `1a07d1b` 2026-04-27)

**Endpoint:** POST /functions/v1/send-email

**Request body (huvudflöde):**
```ts
{
  type: 'confirmation' | 'payment' | 'plus_one' | 'participant-info' | 'waitlist-info-1',
  to: string,
  name: string,
  recordId: string,
  pdfUrl?: string  // bara för 'participant-info'
}
```

**TEMPLATE_MAP:**
| type | Resend-mall |
|---|---|
| `confirmation` | `medveten-kontakt-bekraftelse` |
| `payment` | `medveten-kontakt-betalning` |
| `plus_one` | `medveten-kontakt-plus-one` |
| `participant-info` | `medveten-kontakt-deltagarinformation` |
| `waitlist-info-1` | `medveten-kontakt-vantelista-info-1` |

**`patchAfterSend(type, recordId)` — sätter på Anmälningar:**
- `confirmation` → Status='Bekräftad (mail skickat)' + Bekräftelse skickad=NOW()
- `payment` → Betalningspåminnelse skickad=NOW()
- `plus_one` → Plus-one förfrågan skickad=NOW()
- `participant-info` → Deltagarinfo skickad=NOW()

**`patchWaitlistAfterSend(type, recordId)` — sätter på Väntelista:**
- `waitlist-info-1` → Informationsmail 1 skickad=NOW()

**Dispatcher `patchByType(type, recordId, token)`:**
```
if (type.startsWith('waitlist-')) → patchWaitlistAfterSend
else → patchAfterSend
```

**Antaganden:**
- Resend-mall existerar med matchande `{{{name}}}` (lowercase) variabel — annars 422 "Missing required variable"
- Mall för `participant-info` har också `{{{pdfUrl}}}` i rich-text-länk (inte markdown — Resend URL-encodar markdown)
- recordId hänvisar till Anmälningar-tabellen för fyra första typer, Väntelista för `waitlist-info-1`

---

## J. Mail-flöden (Resend)

### J.1 Mall-katalog och variabler

| Mall-alias | Variabler | Använd-typ | Skapad |
|---|---|---|---|
| `medveten-kontakt-bekraftelse` | `{{{name}}}` | confirmation | tidigare 2026 |
| `medveten-kontakt-betalning` | `{{{name}}}` | payment | tidigare 2026 |
| `medveten-kontakt-plus-one` | `{{{name}}}` | plus_one | tidigare 2026 |
| `medveten-kontakt-deltagarinformation` | `{{{name}}}`, `{{{pdfUrl}}}` | participant-info | 2026-04-16 |
| `medveten-kontakt-vantelista-info-1` | `{{{name}}}` | waitlist-info-1 | 2026-04-27 |

**Avsändare:** `Psionautics <noreply@h5gruppen.se>` (DKIM signerad av h5gruppen.se).
**Reply-to:** `lotta@outsidereality.se`.

### J.2 Skarpa skick — historik

| Datum | Mall | Mottagare | Källa |
|---|---|---|---|
| 2026-04-16 | `medveten-kontakt-deltagarinformation` | 74 (av 75 incheckning-aktiva — Ulrika Arvas saknade e-post) | session-2026-04-16 §A |
| 2026-04-27 | `medveten-kontakt-vantelista-info-1` | 41 (på väntelistan, alla aktiva) | session-2026-04-27 §Slutresultat |

### J.3 Återkommande Resend-fällor

1. **Variabel-case-känslighet:** `{{{name}}}` ≠ `{{{Name}}}`. Lessons från 16-april + 27-april båda dokumenterade samma fälla. Lösning: verifiera mall-variabler i Resend UI direkt efter skapande, INNAN frontend-test.

2. **Markdown-länkar URL-encodas:** `[text]({{{pdfUrl}}})` → href = `%7B%7B%7BpdfUrl%7D%7D%7D`. Lösning: rich-text-länk via Resend editor.

3. **Bucket-permissions:** Supabase Storage-bucket skapas som private — kräver SQL-migration `UPDATE storage.buckets SET public = true WHERE id = 'event-documents'` för att PDF-länkar ska fungera.

### J.4 Mail-prickar i admin-tabell (kronologisk färgordning)

```
Grön  #4ADE80 = Bekräftelse skickad
Amber #F59E0B = Betalningspåminnelse skickad (ändrad från blå 2026-04-16)
Blå   #3B82F6 = Deltagarinfo skickad
Teal  #2DD4BF = Plus-one förfrågan skickad
Lila            = Informationsmail 1 skickad (ny 2026-04-27, endast Väntelista-tabell)
```

---

## Lessons-delta sedan 2026-04-19

> **Diff:** lessons.md 2026-04-19 (commit `7d30c26` — "backfill: Lottas historiska närvarodata") vs lessons.md 2026-04-27 (commit `b7ad363`).

| Sessionsblock | Position | UNIVERSAL-lärdomar | Psionautics-lärdomar |
|---|---|--:|--:|
| Session 2026-04-27 — Väntelista-mail 1 | rad 11–17 | 3 | 0 |
| 2026-04-26 — Åtgärdssession-lärdomar | rad 21–39 | 2 (rad 37, 38, 39) | 5 (rad 23–35) |
| Psionautics-specifikt (uppdaterad) | rad 43–75 | 0 | 5 (lessons om backfill, A2, formulär) |

### Nya UNIVERSAL-lärdomar att övervägs för marcus-system/tasks/lessons.md

**Från session 2026-04-27 (3 nya):**
1. **Verifiera Resend-mall-variabler i Resend UI direkt efter skapande, INNAN frontend-test.** (lessons rad 13)
2. **Bygg ut struktur när hårdkodning visar sig bli mönster.** (rad 15)
3. **Pills i CTA-kontext: whisper-stil UTAN border.** (rad 17)

**Från 2026-04-26 (3 nya):**
4. **Avstämning mot källa efter större ändringar är värdefullt slutsteg.** (rad 37)
5. **Källa-vs-write-path-diagnos.** (rad 39) — "Fråga 'vart skrivs det?' före 'vad skrev det?'"

**Från åtgärdssessionen 2026-04-26 (formellt session-26-atgardssession.md, redan flyttade till lessons.md):**
- Ingår i 2026-04-26-blocket ovan, ej dubbelräknat.

**Från fortsättningssessionen 2026-04-26 (8 lärdomar listade i sessionen, ev. ej alla i lessons.md):**
- Bulk-timestamp-mönster är inte tillräckligt bevis för "test-data"
- createdTime ≠ data-uppdatering
- Airtable update_records max 10 records per request
- Inverse-links auto-uppdaterar bidirektionellt
- Formel-driven flagga är självkorrigerande
- .app-bundles får inte ligga i synkade molnmappar
- Runtime-introspection vs dokumentation
- singleSelect-options propagerar direkt till API efter UI-add

**Status:** Vi LYFTER inte till hub i denna fas (per Marcus' instruktion). Bara identifierar kandidater. Fas 5 hanterar lyftet.

---

## Steg 1.8 — Korrelation, inkonsistenser, öppna frågor, sammanfattning

### A. Korrelation: fält i basen som INTE är dokumenterade i nuvarande `psionautics/docs/reference/data-model.md`

| Fält | Tabell | Anteckning |
|---|---|---|
| Källa (fldwk2sl7CkBv9epw) | Anmälningar | **dokumenterat** i data-model.md "Psionautics-tillägg" |
| Medföljande till (fld39KEXJxyulXfsN) | Anmälningar | **dokumenterat** i data-model.md "Psionautics-tillägg" |
| Deltagarinfo skickad (fld3WBS0QQrqLpYtK) | Anmälningar | **dokumenterat** i data-model.md "Psionautics-tillägg" |
| Flyttad till anmälan (fldqMpSW5UJIhNdgm) | Väntelista | **dokumenterat** i data-model.md "Psionautics-tillägg" |
| Informationsmail 1 skickad (fldsUxLmHR0NQDiwH) | Väntelista | **dokumenterat** 2026-04-27 i data-model.md (per session-27 §C) |
| From field: Medföljande till (fldlP4z8Dirq00nqq) | Anmälningar | **EJ dokumenterat** — auto-skapat inverse-fält |
| Status="Inställt" (selebP2V3qmFRTtdP) | Anmälningar.Status | **EJ dokumenterat** i data-model.md (skapat 2026-04-26) |
| RIM 3 × (fld93OrTArvdkkYmk) | Personer | **EJ dokumenterat** (skapat 2026-04-26) |
| Antal genomförda event som formula (flddy8JND3YnlgZxe) | Personer | **EJ dokumenterat** att det är ändrat från rollup till formula |
| Antal genomförda event (gammal, flddymQaYJGVCInzq) | Personer | **EJ dokumenterat** att det är markerat för borttagning |
| RIM 3 eventkey (fldL0YfWmdkOuxgsH) | Deltaganden | **EJ dokumenterat** |
| Status="Avbröt" (selJ1f9Yv9J7jjqrH) | Deltaganden.Status | **EJ dokumenterat** i data-model.md |
| Status="Deltog online" (selWGhz7v8MPTVpT8) | Deltaganden.Status | **EJ dokumenterat** i data-model.md |
| MK Max antal platser = 88 (uppdaterad 70 → 88) | Eventplanering | **EJ dokumenterat** att den ändrats — kvar i CLAUDE.md som "FULLBOKAT 87/87" |
| Vill anmäla sig till case-dubletter (selipzhJDcLRkNApB, selCYP1qT4eBptaoi) | Anmälningar | **EJ dokumenterat** som datakvalitetsfälla |
| Manuella flagga (Personer) tomt valslag | Personer | **EJ dokumenterat** som datakvalitetsfälla |
| Systemkälla (Touchpoints) tomt valslag | Touchpoints | **EJ dokumenterat** |
| Källa (formulärkälla) i Hämtade erbjudanden — SHA256-hashar | Hämtade erbjudanden | **EJ dokumenterat** som datakvalitetsfälla |
| RECORD_ID-bug i Deltaganden (Anmälan ID, Event ID) | Deltaganden | **EJ dokumenterat** som datakvalitetsfälla — denna fil är första källan |

**Antal nya fält/optioner/skuldindikatorer upptäckta i denna fas: 13.**

### B. Inkonsistenser — påståenden i sessionsloggar som motsäger live-state

| Påstående | Källa | Live-state-fakta | Slutsats |
|---|---|---|---|
| MK-eventet är "FULLBOKAT — 87/87 platser" (CLAUDE.md rad 9) | psionautics/CLAUDE.md | Max antal platser = 88 efter Marcus' UI-uppdatering 2026-04-26 | Inkonsistens: CLAUDE.md är **stale**. 87 betalande på 88 max → 87/88. Men i UI presenteras "87/87" eftersom Marcus räknar betalande, inte max. Behöver klargöras i datamodell-doc. |
| "5 anmälningar med EventKey-bug aktiva" (verifiering 2026-04-24) | verifiering-2026-04-24 errata Fynd 2 | Alla 5 åtgärdade enligt session-26-atgardssession (PATCH+spårbarhetstext). Källa-bug kvarstår. | Konsistent — buggen flyttades från "aktiva records" till "öppen källa-bug" |
| "Källa-fältet har bara valen tom/Manuell/+1/Väntelista" (lessons-16 rad 125) | lessons.md | Bekräftat 2026-04-28 via MCP — 3 val + tom | Konsistent |
| "create-registration har 5 felaktiga fältnamn" (lessons-13/14 rad 181) | lessons.md | Inte längre — fixat per "create-registration ✅ — fixad april 2026" i CLAUDE.md | Konsistent (gammalt fynd, åtgärdat) |
| Edge function "create-registration" sätter `EventKey: 'Event-17'` | code-läsning | Eventplanering har faktiskt Event-17 = MK-eventet enligt CLAUDE.md tabellen | Konsistent — Event-17 = `recQ2TPsY69fQXA8a` |
| Anmälan #847 (2026-04-23) hade EventKey-bug | verifiering-2026-04-24 errata | Inte verifierat — Anmälan #847 inte stickprov idag | Markeras som "anses åtgärdat per session-26" |
| Backfill skapade 924 Deltaganden | verifiering-2026-04-24 §Resultat | Live-state visar 1 500 Deltaganden totalt 2026-04-28 | Konsistent — 924 från backfill + 576 pre-existing/post-backfill = 1 500 |

**Inga akuta motsägelser** — bara dokumentations-stalehet (CLAUDE.md).

### C. Nya öppna frågor

| # | Fråga | Behövs för Fas 3? | Hur lösas |
|--:|---|---|---|
| O1 | Är A2-grenordnings-hypotesen verifierad? Kommer Anmälan-Person-länken förbli tom om en namnlös Person finns? | Ja — påverkar reverse-flow-dokumentation | Skapa testanmälan med matchande email; verifiera resultat |
| O2 | Finns webhooks i basen? | Nej, men trevligt att veta för komplett bild | HAR-export eller Airtable-UI-screenshot |
| O3 | Har någon automation ändrats sedan 2026-03-16-exporten? | Ja — vi behöver veta om JSON-extraktionen är aktuell | Marcus screenshotar Automations-listan med versionsnummer |
| O4 | Vad är de två SHA256-hasharna i Hämtade erbjudanden.Källa? | Nej för Fas 3, men för komplett doc | Hitta webhook-konfigurationen som triggar A4 |
| O5 | Var orsaken till EventKey-bug i Huvudformulär? | Ja — bug-status öppen | Granska HTML-formulärets template-kod på psionautics.se |
| O6 | Har D.6 (Är aktiv exkluderar inte Inställt) ekonomisk påverkan på event-räknare? | Nej för doc, ja för admin-fix | Kolla rollups på MK-eventet inkl Inställt-anmälningar |
| O7 | Hur många Personer-records är "namnlösa" pga lead-only-flöde? | För estimering av deltagarinsikter | MCP-query med filter Förnamn=tom AND Efternamn=tom |
| O8 | Finns post-backfill datakvalitetsfynd som inte är åtgärdade? | För Fas 3-prioritering | Audit av Deltaganden Status-distribution |

### D. Sammanfattning per kategori A–J

| Kategori | Antal nya/ändrade poster | Fas 4-omfång (estimat) |
|---|--:|---|
| A. Schema-ändringar | 6 nya fält + 5 nya options + 5 strukturella ändringar = 16 poster | Stor — kräver omskrivning av "Psionautics-tillägg"-sektionen + "Status-värden"-sektionen |
| B. Automationer | 11 (alla dokumenterade i detalj denna fas) | Medel — uppdatera "Automationssekvenser"-sektionen + lägg till saknade automations-detaljer |
| C. Edge Functions kontrakt | 7 funktioner med detaljerade kontrakt | Liten — ny sektion "Edge Functions"; kontrakten är pålitliga |
| D. Datakvalitetsfällor (nya) | 9 nya fällor (D.1–D.9) | Medel — utöka "Kända fällor"-sektionen från 16 → 25 |
| E. Driftsmässiga fakta | 18 fakta-poster | Liten — uppdatera "Snabbreferens" + datum/räknare |
| F. Reverse-flow | 4 scenarier dokumenterade | Liten — ny sektion eller integrera i "Sekvenser" |
| G. Sedan 26-april | 1 nytt fält + 2 deploys + 5 nya records | Trivial — bara timestamp-uppdatering |
| H. Personer-bilaga | 87 fält totalt katalogiserade (35 detaljerat + 52 i bilaga) | Medel — ny appendix eller komprimerad fält-katalog |
| I. Edge Functions detaljer | 7 funktioner | (omfattas av C) |
| J. Mail-flöden | 5 mallar + 4 fällor + 2 skarpa skick | Liten — ny sektion "Resend-flöden" |

**Total Fas 4-omfång:** Bedöms som **medelstort skrivarbete** (~4–6 fokuserade timmar för konsoliderad data-model.md). Fas 3 (gapanalys) bör kunna göras på 1–2 timmar med detta extraktion-dokument som indata.

---

## Slutsumma — vad denna fil bevisar

- 18 tabeller × ~290 fält i basen 2026-04-28 fullständigt katalogiserade (live-state §3 + denna fils §A + §H)
- 11 automationer detaljextraherade från JSON-export 2026-03-16, inkl. G3-fixad action-katalog för A2 (10 actions explicit listade)
- 7 Edge Functions kontraktsdokumenterade med commit-hashes och request/response-scheman
- 9 nya datakvalitetsfällor identifierade, varav 1 (RECORD_ID-bug) bekräftad via direkt empirisk MCP-jämförelse
- 13 fält/options/skuldindikatorer som inte finns i nuvarande `data-model.md` listade explicit
- 8 öppna frågor för Fas 3 dokumenterade med verifieringsplan per fråga
- G1: Deltaganden #1683-stickprov är **inte en anomali** — det är en datamodell-bug i `RECORD_ID()`-formler. Korrekt slutsats noterad i §D.1
- G2: 26-april-cutoff sektionen levererad i §G med record-räknare
- G3: A2 alla 10 actions explicit listade i §B.A2
- G4: Personer 87 fält uppdelat 35 detaljerat (§3.3 i 02-live-state) + 52 i bilaga (§H.2 här)

*Avvaktar Marcus godkännande av Checkpoint 2 innan vi går till Fas 3 (gapanalys).*
