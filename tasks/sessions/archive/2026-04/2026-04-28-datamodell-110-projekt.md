# Datamodell-dokumentation 11/10 — Arbetsdokument

> **STATUS: ARKIVERAT 2026-04-28** — projektet komplett (Fas 0–5).
>
> Slutdokument: `~/Repon/miranon-media-admin/docs/reference/data-model.md` (1 334 r, primär) + `docs/reference/hur-systemet-funkar.md` (282 r). Synkade kopior i psionautics. 6 universal-lärdomar lyfta till `marcus-system/tasks/lessons.md` sektion "2026-04-28 — Datamodell-doc-projekt" (3 till var redan i hub sedan tidigare synk).
>
> Detta dokument bevaras som projekthistorik. Inga ändringar från och med arkiveringsdatumet.

---

> Levande projektdokument för arbetet med att lyfta `data-model.md` och `hur-systemet-funkar.md` i `miranon-media-admin` till exceptionellt skick.
>
> **Skapad:** 2026-04-27
> **Status:** Fas 4 KOMPLETT (M1+M2+M3 godkänt). Inväntar Code:s commit. Sedan Fas 5 (verifiering & UNIVERSAL-lyft).
> **Senast uppdaterad:** 2026-04-28 (efter M3-leverans, 1 334 + 282 r)

---

## 1. Vad detta dokument är

Det här är arbets- och beslutsloggen för datamodell-dokumentations-projektet. Det följer arbetet från Fas 0 (inventering) till Fas 5 (verifiering & synk). Allt vi bestämmer, allt vi upptäcker, varje öppen fråga och varje hypotes lever här tills den antingen besvaras eller flyttas till slutdokumenten.

Dokumentet ska kunna läsas av:
- Marcus, för att se var vi är och vad nästa steg är
- Claude Chat (vi själva), vid sessionsbyte för att snabbt återta kontexten
- Claude Code, vid prompt-givning för att förstå scopet

När projektet är klart blir detta dokument arkiverat i `miranon-media-admin/tasks/sessions/` som projekthistorik.

---

## 2. Mål

`data-model.md` och `hur-systemet-funkar.md` i `~/Repon/miranon-media-admin/docs/` ska efter detta arbete vara **11/10**: korrekt, fullständig, motsägelsefri, läsbar, och spårbar till källor.

## 3. Framgångskriterier

Tre tester ska gå igenom innan vi anser arbetet klart.

| # | Test | Vad det betyder |
|---|---|---|
| 1 | Discovery-test | Claude Code ska kunna utföra valfri PATCH/POST mot Airtable-basen utan att först behöva köra `get_table_schema`. Alla fält-IDs och optioner finns dokumenterade. |
| 2 | Reverse-flow-test | Den som läser `hur-systemet-funkar.md` ska förstå vilka antaganden A1–A11 gör, vilka som bryter vid backfill, och vad konsekvensen blir. Inget tyst beteende får vara odokumenterat. |
| 3 | Onboarding-test | En ny utvecklare (eller Lotta för affärsdelen) ska kunna läsa de två filerna och förstå hela systemet utan extern hjälp. |

---

## 4. Principer för arbetet

Detta är ett dokumentations-projekt med högre kvalitetskrav än vanligt eftersom output blir sanningskälla för efterföljande arbete (Code-operationer, datamodell-research, Supabase-migration). Felaktiga antaganden förgiftar allt som byggs ovanpå.

| # | Princip |
|---|---|
| P1 | **Inga antaganden.** Varje påstående i slutdokumenten ska vara spårbart till antingen MCP-anrop med datum, läst kodfil med commit-hash, eller läst dokumentation med commit-hash. |
| P2 | **Live-state vinner över dokumenterad state.** Sessionsloggar och tidigare versioner kan vara inaktuella. MCP mot Airtable är sanningen för "vad finns nu". |
| P3 | **Konsistens mellan dokument är inte verifiering.** Om flera källor säger samma sak kan de alla ha ärvt samma fel utgångspunkt. Verifiera mot levande basen, inte mot andra dokument. |
| P4 | **Hypoteser markeras alltid.** Använd `[HYPOTES — EJ VERIFIERAD]` enligt befintlig precedent (t.ex. A2-grenordnings-hypotesen). Hypoteser har explicit verifieringsplan. |
| P5 | **Kod kan ljuga, basen ljuger inte.** Edge Functions kan ha 422-fall som gör att deras avsedda skrivning aldrig hamnar i basen. Verifiera kod *och* stickprov i basen. |
| P6 | **Tvivel löses genom verifiering, inte gissning.** Om jag (Chat) vill säga något konkret och inte har direkt källa — be Code verifiera eller flagga som öppen fråga. |

---

## 5. Beslut

| # | Datum | Beslut | Konsekvens |
|---|---|---|---|
| B1 | 2026-04-27 | Edge Functions dokumenteras som del av datamodellen — deras *kontrakt* (fält, val, 422/409-fall, automation-kaskad efter skrivning) hör hemma i `data-model.md`. | Ny sektion `I. Skrivvägar` läggs till i Fas 1-extraktionen och blir egen sektion i `data-model.md` (Fas 4). |
| B2 | 2026-04-27 | `schema_reference.md` är stale för april-fält (verifierat 2026-04-28: 5 nya fält + 1 inverse-fält saknas — Källa, Medföljande till, Deltagarinfo skickad i Anmälningar; Flyttad till anmälan, Informationsmail 1 skickad i Väntelista). Bekräftat alternativ (b)/(c) — den uppdateras *inte* i miranon-media-os (frozen). | I Fas 4 skapas en kompakt "Schema cheat sheet"-sektion i nya `data-model.md`. MCP blir live-källa. `schema_reference.md` arkiveras med tydlig "se data-model.md för aktuell sanning"-not. |
| B3 | 2026-04-27 | Miranon Media Admin är slutprimärkälla. **Justering:** Utgångspunkten i Fas 4 är psionautics-versionerna av `data-model.md` och `hur-systemet-funkar.md` (de är master fram till 27 april) — inte miranon-media-admin-kopiorna (från 19 april). | Fas 4 startar genom att kopiera psionautics-versionerna till miranon-media-admin/docs/ och bygger vidare därifrån. |
| B4 | 2026-04-27 | `miranon_automations_COMPLETE.json` (15 741 rader) läses programmatiskt via jq/grep i Fas 1 — inte i sin helhet. | Specifik extraktionsstrategi i Fas 1-prompten: "vad triggar A1–A11 → vilka fält rörs → vilka decision-grenar finns". |
| B5 | 2026-04-27 | Transcripts (4 st, ~2,7 MB) används bara för punktverifiering av enskilda påståenden i sessionsloggar — inte heltäckande läsning. | Reducerar Fas 1-volymen avsevärt. Sessionsloggar är primär; transcripts sekundär. |
| B6 | 2026-04-28 | Fas 2 (live-state-verifiering) körs ihop med Fas 1.1 — `02-live-state.md` levererad parallellt med start av extraktion. Live-state är referens för all senare extraktion. | Q1, Q5 lösta. Q2 delvis löst (genomgång krävs i 1.4). Tids-effektivisering: separat Fas 2 borttagen från planen. |
| B7 | 2026-04-28 | Fyra mindre påpekanden från Checkpoint 1-granskning adresseras inte som retroaktiva edits i `02-live-state.md` utan som arbetsuppgifter i 1.4–1.6. Se "Granskningspunkter Fas 1.1" nedan. | Vi sparar cykler genom att inte skicka tillbaka filen för revision. |
| B8 | 2026-04-28 | **Fas 3 (gapanalys) kan starta direkt — Chat-only.** Den är värdefull även om automations-data senare visar sig behöva uppdateras, eftersom den jämför extraktion mot nuvarande `data-model.md` och bygger en åtgärdsplan. | Vi startar Fas 3 parallellt med H1-verifieringen. |
| B9 | 2026-04-28 | **Fas 4 (skriv) gating-låst tills H1 är klargjort.** Hela B-extraktionen bygger på `miranon_automations_COMPLETE.json` från 2026-03-16. Om någon automation ändrats sedan dess bygger vi 11/10-doc på 6 veckor gammal data — det är oacceptabelt. | Marcus screenshotar Automations-listan i Airtable UI. Om alla är ≤ 2026-03-16: green light. Om någon är nyare: B-extraktionen körs om för den automationen. |

---

## 6. Öppna frågor

Frågor som behöver svar innan vi går vidare. Flyttas till "Beslut" eller "Lärdomar" när lösta.

| # | Fråga | Status | Var avgörs det |
|---|---|---|---|
| Q1 | Är `schema_reference.md` fortfarande korrekt och komplett? | **Löst 2026-04-27.** Stale för 5 april-fält. Se B2. | — |
| Q2 | Har Lotta/Roger ändrat något i basen sedan 26 april? | **Löst 2026-04-28.** Levererat i 01-extraction §G: 1 nytt fält (Informationsmail 1 skickad), 2 Edge Function-deploys, 5 nya records, inga manuella ändringar. | — |
| Q3 | Är A2:s grenordnings-hypotesen verifierad? | **Kvar som hypotes.** Markerad i 01-extraction §B.A2 med verifieringsplan. Ej blockerande för Fas 3. | O1 / framtida testanmälan |
| Q4 | EventKey-format-bug i Huvudformulär | **Kvarstår — källa-bug öppen.** 5 affected records sanerade. | O5 / HTML-formulär-granskning |
| Q5 | Vilken tabell är `tblVE3UKWl1CKrphV`? | **Löst 2026-04-28.** = Eventplanering. | — |
| Q6 | Vad gjordes i `psionautics-session-2026-04-27.md`? | **Löst.** Väntelista-mail 1: nytt fält + Edge Function-deploys + 41 mail skickade. Dokumenterat i 01-extraction §J. | — |
| Q7 | Vad innehåller `verifiering-2026-04-24.md` + bilaga? | **Delvis löst.** Refererat i 01-extraction §F.2 (EventKey-bug records) + §B (inkonsistens-tabell). Övriga fynd från verifieringen integrerade. | — |
| Q8 | Lessons.md-delta sedan 19 april — nya UNIVERSAL-lärdomar? | **Löst.** 5 UNIVERSAL-kandidater identifierade i 01-extraction "Lessons-delta". Lyfts i Fas 5. | — |
| Q9 | Webhooks i basen — kan ej läsas via MCP. | Öppen — påverkar inte Fas 3-progress. | Senare i Fas 4 eller deferred (O2). |
| Q10 | Personer 87 fält — uthärdligt eller behöver splittras? | Öppen — designdiskussion. | Lyfts till datamodell-research-projektet (efter 11/10-doc). |
| Q11 | Har någon automation ändrats sedan 2026-03-16? | **Löst 2026-04-28.** Alla 11 senast ändrade 2026-01-11 eller tidigare. JSON-exporten är aktuell. Fas 4 upplåst. | — |
| Q12 | Bulkutskick.Status fält-ID `fldW7k60IHE0Kpj1W` — verifiera spårbarhet. | Ej blockerande — verifieras i Fas 3 eller Fas 4. | Code |
| Q13 | Fält-totalsumma "~290" vs faktisk summa 358 — precisera till exakt tal. | Ej blockerande — Fas 4. | Code |
| Q14 *(NY)* | Tre kategorier i Automations-UI:t (När någon anmäler sig / Annat engagemang / Övervakning) — ska denna gruppering återspeglas i `hur-systemet-funkar.md`? | Designbeslut för Fas 3. **Mitt förslag: ja** — det är Marcus mentala modell och passar pedagogiskt. | Fas 3 |

## 6b. Granskningspunkter Fas 1.1 → adresserade i Checkpoint 2

| # | Sak | Status |
|---|---|---|
| G1 | Sektion 7.3 (Deltaganden 1682–1686) hypotes om "Anmälan-ID = Event-ID". | **Löst 2026-04-28.** Inte en anomali — det är en datamodell-bug i RECORD_ID()-formler. Argumenten ignoreras tyst. Lyft som ny fälla D.1 i 01-extraction. |
| G2 | Q2 saknar systematisk genomgång. | **Löst 2026-04-28.** 01-extraction §G levererad: 1 nytt fält + 2 deploys + 5 nya records efter cutoff. |
| G3 | A2 säger "10 actions" men listar 6. | **Löst 2026-04-28.** 01-extraction §B.A2 listar alla 10 actions explicit. Räknarens logik förklarad. |
| G4 | Personer 87 fält — kategorisera explicit. | **Löst 2026-04-28.** 35 detaljerat (02-live-state §3.3) + 52 i bilaga (01-extraction §H.2). Räkning verifierad. |

## 6c. Hanteringspunkter Checkpoint 2 (H-serien)

| # | Sak | Hantering |
|---|---|---|
| H1 | O3 — Har någon automation ändrats sedan 2026-03-16? | **Löst 2026-04-28.** Alla 11 senast ändrade ≤ 2026-01-11. JSON-exporten är aktuell. Fas 4 upplåst. |
| H2 | Bulkutskick.Status fält-ID `fldW7k60IHE0Kpj1W` saknar spårbarhet. | Code verifierar i Fas 3 (när han ändå läser nuvarande data-model.md). |
| H3 | Fält-totalsumma "~290" vs 358. | Precisera i Fas 4. |
| P1 | §A.2 "Flytta till väntelista" — vagt datum "2026-04". | Fas 4-precisering om viktigt. |
| P2 | §D.4 SHA256-hashar — sannolikt-spekulation. | Markera tydligare som hypotes i Fas 4. |

---

## 7. Källkartan

Var fakta extraheras från i Fas 1. Uppdaterad efter Fas 0-manifest (2026-04-27).

### Sessionsloggar (psionautics/tasks/sessions/)

| Fil | Storlek | Vad den ger |
|---|---|---|
| `psionautics-session-2026-04-15.md` | 14 kB | Källa-fält, Medföljande till, Flyttad till anmälan, dubblettskydd, +1-länkning |
| `psionautics-session-2026-04-16.md` *(NY i kartan)* | 8 kB | Deltagarinformation-mail + UX-modernisering av admin |
| `psionautics-session-2026-04-16-em.md` | 7 kB | v1 av data-model.md + hur-systemet-funkar.md, A2 Gren 1-hypotes |
| `psionautics-session-2026-04-19-backfill.md` | 36 kB | Backfill — 459 Anmälningar, fällor #17–22, A2-grenordning |
| `retrospektiv-2026-04-19-backfill.md` | 41 kB | Klassning av systemet, 6 nya fällor analyserade |
| `psionautics-session-2026-04-26-atgardssession.md` | 83 kB | EventKey-bug (16 records), rollup-divergens, ARRAYUNIQUE, MCP-begränsningar |
| `psionautics-session-2026-04-26-fortsattning.md` *(NY i kartan)* | 16 kB | Punkt 6, 7, 9, 10 + Punkt 4-rättning |
| `psionautics-session-2026-04-27.md` *(NY i kartan, skapad idag)* | 7 kB | Väntelista-mail 1 (kopplat till `Informationsmail 1 skickad`-fältet) |

### Backfill-katalog (psionautics/docs/backfill/)

| Fil | Storlek | Vad den ger |
|---|---|---|
| `README.md` | 15 kB | Backfill-strategier, multi-match, skyddade records |
| `verifieringsrapport.md` | 40 kB | Pre-flight-kontroller före backfill |
| `verifiering-2026-04-24.md` *(NY i kartan)* | 30 kB | Verifieringssession som åtgärdssession 26 agerade på |
| `verifiering-atgardsbilaga-2026-04-24.md` *(NY i kartan)* | 24 kB | Åtgärdsbilaga till verifiering 24 april |
| `a2-analys.md` | 9 kB | Code:s rådata-extract av A2-konfiguration |

### Aktiva dokument (master)

| Fil | Repo | Storlek | Senast ändrad | Status |
|---|---|---|---|---|
| `docs/reference/data-model.md` | psionautics | 32 kB / 641 r | 2026-04-27 10:11 | **MASTER** — utgångspunkt för Fas 4 |
| `docs/reference/hur-systemet-funkar.md` | psionautics | 10 kB / 282 r | 2026-04-19 18:52 | Master (oförändrad sedan backfill) |
| `docs/reference/data-model.md` | miranon-media-admin | 31 kB / 634 r | 2026-04-19 18:53 | Äldre kopia (10–11 r diff) |
| `docs/reference/hur-systemet-funkar.md` | miranon-media-admin | 10 kB / 276 r | 2026-04-19 18:52 | Äldre kopia (10 r diff) |

### Schema- och automations-källor (miranon-media-os)

| Fil | Storlek | Status |
|---|---|---|
| `docs/schema_reference.md` | 84 kB / 1 845 r | **STALE för april-fält** (B2). Användbar för stabila tabeller (Eventplanering, Eventformat). |
| `docs/miranon_automations_COMPLETE.json` | 638 kB / 15 741 r | Auktoritativ A1–A11-export. Läs via jq/grep (B4). |
| `docs/field_lookup.json` | 7 kB | Fält-ID-uppslag |

### Edge Functions (psionautics/supabase/functions/)

10 funktioner, totalt 1 436 rader. 7 har rörts i april. Skriver till tabellerna `tbloOcrppVoyrHbrq` (Anmälningar), `tbl2VxMx7JMkIxD4Q` (Väntelista) och `tblVE3UKWl1CKrphV` (Q5 — verifieras).

| Funktion | Rader | Senast ändrad | Skriver till |
|---|---|---|---|
| `create-registration/` | 128 | 2026-04-15 | Anmälningar |
| `create-waitlist-entry/` | 108 | 2026-04-15 | Väntelista |
| `update-registration/` | 91 | 2026-04-15 | Anmälningar, Väntelista, tblVE3UKWl1CKrphV |
| `get-event-bookings/` | 129 | 2026-04-16 | (read) Anmälningar, tblVE3UKWl1CKrphV |
| `send-email/` | 199 | **2026-04-27** | Anmälningar, Väntelista |
| `get-waitlist/` | 84 | **2026-04-27** | Väntelista |
| `get-waitlist-stats/` | 82 | 2026-03-20 | Väntelista |
| `create-admin-user/` | 84 | 2026-03-20 | (auth, ej Airtable) |
| `generate-template-image/` | 77 | 2026-03-20 | (ej Airtable) |
| `get-plausible-stats/` | 454 | 2026-03-20 | (Plausible) |

### Levande källor

| Källa | Vad den ger |
|---|---|
| Airtable MCP (bekräftat fungerande, `app8uGPrVCVOm6LfD`) | Sanningskälla för aktuellt schema, fält, optioner, automationer |
| `marcus-system/tasks/lessons.md` | UNIVERSAL-lärdomar (jämfört med psionautics-versionen) |
| `psionautics/tasks/lessons.md` (uppdaterad **idag** 12:30) | Operativa lärdomar — kan ha nya UNIVERSAL-poster (Q8) |
| `psionautics/tasks/todo.md` (uppdaterad **idag** 12:06) | Aktuell teknisk skuld + planerade åtgärder |

### Kategorier för extraktion

| Kat. | Innehåll |
|---|---|
| A | Schema-ändringar (nya fält, ändrade optioner, raderade fält) |
| B | Automations-beteenden (A1–A11, edge cases, tysta fails) |
| C | Edge Function-beteenden (write-paths) |
| D | Datakvalitetsfällor (#1–24 + nya) |
| E | Driftsmässiga fakta (manuella anmälningar, +1, väntelista, deltagarinfo, betalstatus) |
| F | Reverse-flow / backfill-scenarier |
| G | Nya tabeller eller relationer |
| H | Operationella fält-IDs (för PATCH-discovery) |
| I | Skrivvägar — Edge Function-kontrakt (B1) |
| J *(ny)* | Sessions-aktivitet 16 + 27 april (mail-flöden) |

---

## 8. Plan — sex faser (Fas 2 ihopslagen med 1.1)

| Fas | Vem | Output | Status | Estimat |
|---|---|---|---|---|
| 0 — Inventering | Code | `docs/research/datamodell-research/00-file-manifest.md` | **Klar 2026-04-27** | ~30 min |
| 1 — Källextraktion | Code+Chat | `docs/research/datamodell-research/01-extraction.md` (964 r) + `docs/research/datamodell-research/02-live-state.md` (726 r) | **Klar 2026-04-28** | ~3,5 h |
| 1.1 Live-state-pull | Code (MCP) | `docs/research/datamodell-research/02-live-state.md` | **Klar 2026-04-28** | 45 min |
| 1.2 Verifiera Q5 | Code | inline | **Klar** (tblVE3UKWl1CKrphV = Eventplanering) | parallellt |
| 1.3 Verifiera Q2 | Code | inline | **Klar** (01-extraction §G) | — |
| 1.4 A1–A11 från JSON | Code | `01-extraction.md` §B | **Klar** | 60 min |
| 1.5 Edge Functions | Code | `01-extraction.md` §C+I | **Klar** | 45 min |
| 1.6 Nya sessionsfiler | Code | `01-extraction.md` §A,D,E,F,J | **Klar** | 45 min |
| 1.7 Lessons.md-delta | Code | `01-extraction.md` "Lessons-delta" | **Klar** | 15 min |
| 1.8 Korrelation + öppna frågor | Code | `01-extraction.md` slutsektion | **Klar** | — |
| ~~2 — Live-state~~ | ~~Code~~ | ~~separat fil~~ | **Slogs ihop med 1.1 (B6)** | — |
| 3 — Gapanalys | Chat | `docs/research/datamodell-research/03-gap-analysis.md` | **Klar 2026-04-28** (~600 r) | 1,5 h |
| H1 — Automations-versionsverifiering | Marcus | versionsdata per A1–A11 | **Klar 2026-04-28** ✅ | 5 min |
| 4 — Skriv | Chat (design) + Code (impl.) | Uppdaterade `data-model.md` + `hur-systemet-funkar.md` | Pågår — M1 klar | 9 h totalt fördelat på 3 milstolpar |
| 4.M1 | Code (steg 4.1–4.7) | data-model.md (642 → 835 r) | **Klar 2026-04-28** | ~3,5 h faktisk |
| 4.M2 | Code (steg 4.8–4.13) | A2 grenar + Reverse-flow + Automationer omstrukturerat + Edge Functions + Mail-flöden + Kända fällor 22→30 | **Klar 2026-04-28** | ~4,5 h faktisk |
| 4.M3 | Code (steg 4.14–4.20) | Datakvalitetsstatus + Backfill-historik + Luckor + hur-systemet-funkar.md + master/kopia-synk + commit | **Klar 2026-04-28 + COMMITTAD** | ~2,5 h faktisk |
| 5 — Verifiering & UNIVERSAL-lyft | Code + Chat | Final diff-verifiering, UNIVERSAL-lyft till hub, arkivering av arbetsdokument | **Startar nu** | 30 min |

### Fas 0 — Inventering ✅

**Status:** Klar 2026-04-27. Manifest levererat: `~/Repon/miranon-media-admin/docs/research/datamodell-research/00-file-manifest.md`.

**Resultat:**
- 9 sessionsfiler hittade (3 fler än jag hade i kartan från projektkunskapen)
- 16 backfill-filer (varav 2 verifieringsfiler från 24 april var nya för mig)
- 10 Edge Functions, 1 436 rader totalt
- `schema_reference.md` bekräftat stale för april-fält (löser Q1)
- Airtable MCP svarar (verifierad bas: `app8uGPrVCVOm6LfD`)
- Inga "spökreferenser" — alla refererade filer existerar
- 1 nytt okänt tabell-ID: `tblVE3UKWl1CKrphV` (Q5)

### Fas 1 — Källextraktion

**Mål:** Strukturerad fakta-extraktion ur alla källor enligt kategorierna A–J.

**Status:** Inväntar godkännande av justerad prompt.

**Output:** `~/Repon/miranon-media-admin/docs/research/datamodell-research/01-extraction.md`

**Justeringar efter manifest:**
- `miranon_automations_COMPLETE.json` läses via jq/grep — inte i sin helhet (B4)
- Transcripts används bara för punktverifiering (B5)
- Tre nya sessionsfiler ingår (16 april, 26 april fortsättning, 27 april)
- Två nya backfill-verifieringsfiler ingår (24 april + bilaga)
- Q5 (`tblVE3UKWl1CKrphV`) verifieras tidigt via MCP

### Fas 2 — Live-state-verifiering

**Mål:** Hämta basens faktiska tillstånd via MCP. Bekräfta Q2 (har basen ändrats sedan 26 april).

**Status:** Ej påbörjad.

**Output:** `~/Repon/miranon-media-admin/docs/research/datamodell-research/02-live-state.md`

### Fas 3 — Gapanalys

**Mål:** Sektion-för-sektion-jämförelse: vad saknas, vad är fel, vad är inaktuellt.

**Status:** Ej påbörjad.

**Output:** `~/Repon/miranon-media-admin/docs/research/datamodell-research/03-gap-analysis.md`

### Fas 4 — Skriv

**Mål:** Uppdaterade dokument i miranon-media-admin/docs/.

**Status:** Ej påbörjad.

**Utgångspunkt:** Psionautics-versionerna (master per 27 april), inte miranon-media-admin-kopiorna.

**Output:** `data-model.md` (ny version) + `hur-systemet-funkar.md` (ny version) + arkivering av `schema_reference.md` med pekare.

### Fas 5 — Verifiering & synk

**Mål:** Diff mot psionautics-kopior, synkronisering där det ska, lyft av `[UNIVERSAL]`-lärdomar till hubben.

**Status:** Ej påbörjad.

---

## 9. Logg

Kronologisk anteckning av vad som händer.

| Datum & tid | Händelse |
|---|---|
| 2026-04-27 | Projektet initierat. Plan i 6 faser fastställd. Beslut B1, B2, B3 tagna. |
| 2026-04-27 | Fas 0-prompt körd i Code. Inväntar manifest. |
| 2026-04-27 | Fas 0 klar. Manifest levererat (12 sidor / 326 rader). Tre nya sessionsfiler upptäckta. Q1 löst → B2 uppdaterat. B3 justerat. B4 + B5 tillagda. Q5–Q8 öppnade. Estimat Fas 1 uppjusterat: 2 h → 3,5–4 h. |
| 2026-04-27 | Fas 1-prompt levererad. Stegen 1.1–1.8 specificerade. |
| 2026-04-28 | **Checkpoint 1 godkänd.** `02-live-state.md` levererad (726 r). 18 tabeller, ~290 fält katalogiserade. Q5 löst (tblVE3UKWl1CKrphV = Eventplanering). Q2 delvis löst. 5 datamodell-skulder identifierade i live-state. 6 datakvalitetsfynd tillagda. Q9 + Q10 öppnade. Beslut B6 (Fas 2 ihopslagen) + B7 (granskningspunkter G1-G4 fixas i 1.4-1.6) tagna. Code fortsätter mot 1.4. |
| 2026-04-28 | **Checkpoint 2 godkänd med gating.** `01-extraction.md` levererad (964 r). G1-G4 alla lösta. G1-fyndet är värdefullt: RECORD_ID()-bug i Deltaganden (D.1). Q2 helt löst (§G). Q3 fortsatt hypotes (O1). Q6, Q7, Q8 lösta. 9 nya datakvalitetsfällor (D.1-D.9). 13 odokumenterade fält/options identifierade. B8 (Fas 3 startar) + B9 (Fas 4 låst tills H1) tagna. **H1 är gating**: Marcus verifierar automations-versioner i Airtable UI. Q11 (gating), Q12, Q13 öppnade. |
| 2026-04-28 | **H1 löst — green light.** Alla 11 automationer senast ändrade ≤ 2026-01-11. JSON-exporten 2026-03-16 är aktuell. **Fas 4 upplåst.** Bonus-fynd: Marcus' UI-gruppering av automationer i 3 kategorier (Q14) — påverkar Fas 3-design. |
| 2026-04-28 | **Fas 3 klar.** `03-gap-analysis.md` levererad (~600 r). 5 övergripande designbeslut (D1-D5). 14 sektioner i data-model.md analyserade. 14 sektioner i hur-systemet-funkar.md analyserade. 2 nya stora sektioner föreslagna (Mail-flöden, Reverse-flow-scenarier). 8 nya kända fällor (#23-30). 4 nya luckor (#8-11). Implementationsordning för Fas 4 i 19 steg, ~9 h fokuserat. |
| 2026-04-28 | **Fas 4 Milstolpe 1 godkänd.** data-model.md utökad 642 → 835 r (+30%). Schema cheat sheet + 4 Status-värdes-sektioner + Fält tillagda i april + DAG utökad med RIM 3 + datakvalitet uppdaterad till live-MCP. Filtervergens-pedagogiken (Genomfört event vs RIM-räknare) tydligt förklarad. fldRfc4i7HHfc1dFU verifierad existerar i basen. Aktuell distribution: 1500 Deltaganden, 67.5% Närvarande post-backfill. 4 hypoteser markerade. 3 nya öppna frågor (O9-O11). En anmärkning: §Datakvalitetsstatus (gammal) och §Aktuell datakvalitet (ny) skapar temporär inkonsistens — löses i M2 steg 4.14. |
| 2026-04-28 | **Fas 4 Milstolpe 2 godkänd.** data-model.md utökad 835 → 1 282 r (+54%). A2:s 4 grenar dokumenterad med "Sätter Anmälan.Person?"-kolumn. 4 Reverse-flow-scenarier (F.1-F.4). Automationssekvenser omstrukturerade i 3 grupper enligt Marcus' UI-modell. A6 trigger verifierad från JSON istället för hypotes-flaggad (workflow_id wfl0filPx4wyAcaQ8, Anmäld beläggning = 100%). 7 Edge Functions detaljkontrakt + send-email subdokumentation. Mail-flöden ny sektion (5 mallar + 3 Resend-fällor + mail-prickar med hex). Kända fällor 22→30 — 8 nya alla med påverkan + åtgärd. Live-stickprov i fälla 21. 4 nya öppna frågor (O12-O15). |
| 2026-04-28 | **Fas 4 Milstolpe 3 godkänd. PROJEKT KOMPLETT.** data-model.md slutligt 1 334 r (+108% från ursprung 642 r). hur-systemet-funkar.md V3 (282 r). §Datakvalitetsstatus omdöpt till historik (M1+M2-inkonsistensen löst). §Backfill — historik omstrukturerad med Resultat + Lärdomar. Luckor 7 → 11. O11 löst med MCP-verifiering (MK 218 Deltaganden, inte 174). Synk till psionautics-kopior gjord (header skiljer 5 r). 12 hypoteser kvar med verifieringsplan, 0 TODO-rader, 0 nya öppna frågor (O16+). Alla 5 §7-tester passerar. Inväntar Marcus' green light för commit. |
| 2026-04-28 | **COMMIT GJORD.** Båda repon har commit "docs: datamodell-110 fas 4 (M1+M2+M3 sammanslaget)". Datamodellen är nu auktoritativt dokumenterad. Fas 5 (UNIVERSAL-lyft + arkivering) startar. |

---

## 10. Output-artefakter

Slutliga leveranser. Uppdateras allt eftersom de blir klara.

| Fil | Plats | Status |
|---|---|---|
| `00-file-manifest.md` | miranon-media-admin/docs/research/datamodell-research/ | **Klar 2026-04-27** |
| `02-live-state.md` | miranon-media-admin/docs/research/datamodell-research/ | **Klar 2026-04-28** (726 rader) |
| `01-extraction.md` | miranon-media-admin/docs/research/datamodell-research/ | **Klar 2026-04-28** (964 rader) |
| `03-gap-analysis.md` | miranon-media-admin/docs/research/datamodell-research/ | **Klar 2026-04-28** (~600 rader) |
| `03-gap-analysis.md` | miranon-media-admin/docs/research/datamodell-research/ | Ej påbörjad |
| `data-model.md` (M1) | miranon-media-admin/docs/ | **Klar 2026-04-28** (835 r, +30%) — väntar på commit efter M3 |
| `data-model.md` (M3 final) | miranon-media-admin/docs/ | **Klar 2026-04-28** (1 334 r, +108% från ursprung) — inväntar commit |
| `hur-systemet-funkar.md` (M3 final) | miranon-media-admin/docs/ | **Klar 2026-04-28** (282 r, V3) — inväntar commit |
| `data-model.md` synk | psionautics/docs/ | **Klar 2026-04-28** (1 335 r, header skiljer 5 r) |
| `hur-systemet-funkar.md` synk | psionautics/docs/ | **Klar 2026-04-28** (284 r, header skiljer 2 r) |
| Eventuella `[UNIVERSAL]`-lärdomar | marcus-system/tasks/lessons.md | Hanteras i Fas 5 |

---

## 11. Lärdomar (under arbetet)

Insikter och mönster vi upptäcker under projektets gång. Universella lärdomar markeras `[UNIVERSAL]` och lyfts till `marcus-system/tasks/lessons.md` vid Fas 5.

### Generella lärdomar

- **2026-04-27 [UNIVERSAL]** Projektkunskapssökning är samplad, inte komplett. När Chat sökt efter sessionsfiler i projektkunskapen returnerades 7 av 9 sessionsfiler. Två filer plus två backfill-verifieringsfiler från 24 april var inte synliga via search. **Konsekvens:** Innan vi gör fakta-påståenden om "vad som finns i projektet" måste Code göra explicit `ls`/`find` — Chat kan inte stänga frågan via search alone.

- **2026-04-27 [psionautics/miranon-media-admin]** Master-fil-hierarki: psionautics-versionerna av `data-model.md` och `hur-systemet-funkar.md` är master fram till och med MK-eventet (1–3 maj 2026). miranon-media-admin-kopiorna släpar 8 dagar.

- **2026-04-28 [UNIVERSAL]** Live-state vinner alltid över dokumenterad state — och den är ofta överraskande på sätt som ingen sessionslogg fångar. 02-live-state.md hittade 6 datakvalitetsfynd och 5 datamodell-skulder som ingen tidigare dokumentation berört. **Konsekvens:** Innan vi skriver något i den nya `data-model.md` måste vi ha en aktuell live-state som referens. Sessionsloggar är historik, inte sanning om nuet.

### Datamodell-skulder upptäckta i Checkpoint 1 (för dokumentation i Fas 4 + ev. åtgärd i datamodell-research-projektet)

| ID | Skuld | Plats |
|---|---|---|
| DS1 | "Är aktiv (1/0)" på Anmälningar exkluderar bara Avbokad/Ombokad — räknar Inställt som aktiv. | fld4j7PeckDViTdIB |
| DS2 | "Återkommande?" på Personer kräver båda (har gått förut + har kommande) — missar "har gått förut, inget kommande" | fld5npMbl3PaSlm4B |
| DS3 | "Erfarenhetsbadge" på Personer mappar nivå "Genomfört alla" som föregående formel aldrig returnerar | fld04qqDQLgbJbBef |
| DS4 | "Totala deltaganden (gammal)" inkluderar inte RIM 3 | fldBP7xdEmpXDwUpz |
| DS5 | "Antal genomförda event (gammal)" markerad för borttagning efter MK 2026-05-03 | flddymQaYJGVCInzq |
| DS6 *(NY i CP2)* | "Anmälan (ID)" och "Event (ID)" på Deltaganden — `RECORD_ID(Anmälan)` returnerar Deltagandets eget ID, inte länkat record's ID. RECORD_ID() accepterar inga argument. Dödar fält. | fldkTS2S8IDTsHibj, fld1PV4JDU0xkFrQ2 |

### Datakvalitetsfynd upptäckta i Checkpoint 1+2

| ID | Fynd | Plats | CP |
|---|---|---|---|
| DQ1 | "Vill anmäla sig till" har case-dubletter | Anmälningar.fld6RC3r0R9tuKgdF | 1 |
| DQ2 | "Manuella flagga" har choices=[] tom | Personer.fldNtwQt6tOCIdf4f | 1 |
| DQ3 | "Systemkälla" har choices=[] tom | Touchpoints.fldSXO9yRrxVceBkp | 1 |
| DQ4 | "Källa (formulärkälla)" har SHA256-hashar som options | Hämtade erbjudanden.fldF9SgJS1Zv5kmtr | 1 |
| DQ5 | "E-post" på Personer är multilineText (typ-skuld) | Personer.fldcd5HnYooVZY4Ts | 1 |
| DQ6 | 2 namnlösa Personer ("Ej tillgängligt") från lead-process | fldnYys0Ac3UGOdpe | 1 |
| DQ7 *(NY i CP2)* | RECORD_ID()-bug — döda formelfält | fldkTS2S8IDTsHibj, fld1PV4JDU0xkFrQ2 | 2 |
| DQ8 *(NY i CP2)* | Mail-skick → PATCH-misslyckande visas inte i UI (bara console.error) | send-email Edge Function | 2 |
| DQ9 *(NY i CP2)* | Väntelista→Anmälningar-flytt: om steg 3 (PATCH `Flyttad till anmälan = true`) misslyckas → dubblett. Felhantering oklar. | UI-flöde | 2 |

### Lärdomar från Checkpoint 2

- **2026-04-28 [UNIVERSAL]** Empirisk MCP-jämförelse är mer värdefull än formula-spec-läsning. RECORD_ID()-bugen blev tydlig genom att Code läste **både** länkfält (multipleRecordLinks) och formel-output sida vid sida i samma record. Ingen formula-spec-läsning hade gett samma insikt — Airtable rapporterar formeln som `isValid: true`. Lektion: när du tvivlar på vad ett fält faktiskt visar, läs det parallellt med dess "sanning"-källa.

- **2026-04-28 [psionautics]** Hela B-extraktionen bygger på en JSON-export från 2026-03-16. Code markerade korrekt som hypotes att inget ändrats sedan dess. Lektion för framtida automations-arbete: dokumentera **datum för senast uppdaterad export** + **plan för verifiering** vid varje gång exporten används som källa.

---

*Slut på dokument. Detta dokument lever och uppdateras kontinuerligt under hela projektets gång.*
