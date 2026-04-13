# Feature Spec: Aktivitetslogg

*Skapad: 2026-04-05*
*Status: Planerad*
*Prioritet: Hög (förtroende-byggande feature)*

---

## Varför

Lottas största rädsla är att tappa bort information. Idag lever mycket i hennes minne, på papper och i lösa anteckningar. När appen tar över de uppgifterna behöver den bevisa att den minns bättre än Lotta själv.

Aktivitetsloggen ger Lotta ett svar på frågan: **"Vad har jag gjort?"** — oavsett om det var igår, förra veckan eller förra månaden.

### Effekt på Lottas rädslor

| Rädsla | Hur loggen hjälper |
|--------|-------------------|
| Tappa bort info | "Allt finns här — jag kan alltid gå tillbaka och kolla" |
| Inte förstå | Loggen är skriven på hennes språk, inte systemets |
| Tappa kontroll | Hon ser exakt vad som hänt och när |
| Bli krångligare | Loggen kräver inget av henne — den fylls på automatiskt |

---

## Vad som loggas

### Princip: Allt som förändrar data. Inget som bara visar data.

**Loggas (mutation = relevant):**

| Kategori | Händelser |
|----------|-----------|
| Betalning | Markera som betald, ångra betalning, registrera delbetalning |
| Anmälan | Ny anmälan (manuell), ändra status, flytta från väntelista, avboka |
| Närvaro | Registrera närvaro, ångra närvaro |
| Person | Skapa ny person, redigera kontaktuppgifter, slå samman dubbletter |
| Event | Skapa event, redigera eventdetaljer, ändra max-platser |
| Mail | Skicka bekräftelse, skicka påminnelse, skicka manuellt mail |
| Lead | Skapa lead, ändra lead-status, konvertera lead till person |

**Loggas INTE (navigation/visning = brus):**

Öppna en sida, sortera en tabell, expandera en meny, filtrera en lista, ändra sidbredd, söka utan att agera på resultatet.

---

## Domänmodell

```typescript
interface ActivityEntry {
  id: string
  timestamp: string              // ISO 8601
  actor: string                  // Användarnamn ("Lotta", "Roger")
  category: ActivityCategory
  action: ActivityAction
  summary: string                // Mänskligt läsbar: "Markerade Anna Lindgren som betald"
  context: ActivityContext
}

type ActivityCategory =
  | 'betalning'
  | 'anmälan'
  | 'närvaro'
  | 'person'
  | 'event'
  | 'mail'
  | 'lead'

type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'sent'
  | 'status_changed'

interface ActivityContext {
  // Vem/vad handlade det om?
  personName?: string            // "Anna Lindgren"
  personId?: string

  // Vilket event?
  eventName?: string             // "Medveten Kontakt, 1–3 maj"
  eventId?: string

  // Vad ändrades?
  field?: string                 // "betalningsstatus"
  previousValue?: string         // "Ej betald"
  newValue?: string              // "Betald"

  // Eventuellt belopp
  amount?: number                // 450
  currency?: string              // "SEK"
}
```

### Exempel på loggposter

| Tid | Sammanfattning |
|-----|---------------|
| 14:22 | Lotta markerade **Anna Lindgren** som betald för **Medveten Kontakt** (450 kr) |
| 14:18 | Lotta registrerade närvaro för **Erik Holm** på **Medveten Kontakt, dag 1** |
| 13:45 | Lotta skickade bekräftelsemejl till **Sara Björk** för **Medveten Kontakt** |
| 11:30 | Lotta flyttade **Johan Dahl** från väntelista till anmäld på **Medveten Kontakt** |
| 09:15 | Lotta skapade ny person: **Maria Svensson** (maria@example.com) |

---

## Hur det byggs — arkitektur

### Adapter-integration

Loggen bor i DataSourceAdapter. Varje mutation-metod anropar en intern `logActivity()` efter lyckad operation. Konsumerande kod behöver inte tänka på loggning — det sker automatiskt.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   UI-lager   │ ──→ │ DataSourceAdapter │ ──→ │  Airtable   │
│  (klick)     │     │  markAsPaid()     │     │  Betalning  │
└─────────────┘     │  → uppdatera rad  │     └─────────────┘
                    │  → logActivity()  │     ┌─────────────┐
                    │                    │ ──→ │  Airtable   │
                    └──────────────────┘     │  Aktivitets- │
                                             │  logg        │
                                             └─────────────┘
```

### Airtable-tabell: "Aktivitetslogg"

| Fält | Typ | Exempel |
|------|-----|---------|
| Tidpunkt | DateTime | 2026-04-03T14:22:00 |
| Aktör | Single line text | Lotta |
| Kategori | Single select | betalning |
| Händelse | Single line text | Markerade som betald |
| Sammanfattning | Long text | Markerade Anna Lindgren som betald för Medveten Kontakt (450 kr) |
| Person | Link to Personer | rec_anna_lindgren |
| Event | Link to Event | rec_medveten_kontakt |
| Fält | Single line text | betalningsstatus |
| Tidigare värde | Single line text | Ej betald |
| Nytt värde | Single line text | Betald |
| Belopp | Number | 450 |

### Framtida Supabase-version

Samma modell, men som `activity_log`-tabell med foreign keys till `persons` och `events`. Row Level Security baserat på organisation. Inga ändringar i adapter-interfacet.

---

## Hur Lotta ser det — UI

### Placering

Egen vy i menyn under **Vardagsgruppen**: "Historik" (med Clock-ikon).

### Layout

**Tidsgrupperad lista** — poster grupperade under datumrubriker ("Idag", "Igår", "3 april 2026").

Varje post visar:
- Klockslag (14:22)
- Kategori-ikon (kreditkort för betalning, brevikon för mail, etc.)
- Sammanfattning i naturligt språk
- Klickbar person/event-länk (navigerar till detalj)

### Filtrering

Enkel filterrad ovanför listan:
- **Kategori** — dropdown: Alla, Betalning, Anmälan, Närvaro, Person, Mail
- **Event** — dropdown med aktiva event
- **Tidsperiod** — Idag, Senaste 7 dagarna, Senaste 30 dagarna, Allt

Inga avancerade sökfunktioner. Lotta ska kunna svara på "vad gjorde jag igår?" med max ett klick.

### Tom-state

Första gången Lotta öppnar historiken (innan det finns poster):

> "Här kommer du snart se allt du gör i appen — betalningar, anmälningar, mail och mer. Allt sparas automatiskt så du aldrig behöver undra vad som hände."

### Skeleton

Tre fade-in-rader med animate-pulse medan data laddas.

---

## Sammanfattnings-generator

Adapter-metoden `logActivity()` bygger sammanfattningen automatiskt utifrån kategori + kontext. Lotta ser aldrig tekniska termer.

```
Mönster per kategori:

betalning + created:
  "Markerade {personName} som betald för {eventName} ({amount} kr)"

betalning + status_changed (ångra):
  "Ångrade betalning för {personName} på {eventName}"

anmälan + created:
  "Registrerade {personName} till {eventName}"

anmälan + status_changed:
  "Ändrade status för {personName} på {eventName}: {previousValue} → {newValue}"

närvaro + created:
  "Registrerade närvaro för {personName} på {eventName}"

person + created:
  "Skapade ny person: {personName}"

person + updated:
  "Uppdaterade {field} för {personName}: {previousValue} → {newValue}"

mail + sent:
  "Skickade {field} till {personName} för {eventName}"
```

---

## Var i fasplanen

Aktivitetsloggen behöver fungerade mutations i adaptern. Den passar bäst **efter Fas 6 (Dashboard)** och **före Fas 7 (Konsolidering)** — eller som en egen fas mellan dem.

| Beroende | Fas |
|----------|-----|
| DataSourceAdapter med mutations | Fas 6+ (idag har adaptern 15 metoder, mestadels read) |
| Airtable-tabell skapad | Kan göras när som helst |
| UI-primitiver (lista, filter, skeleton) | Fas 3–4 |
| Routing | Fas 2 |

**Rekommendation:** Lägg in som **Fas 6.5** — en kort fas (1–2 sessioner) efter att Dashboard fungerar med live-data och mutations finns.

### Estimat

| Del | Sessioner |
|-----|-----------|
| Airtable-tabell + adapter-metoder (logActivity, fetchActivityLog) | 0.5 |
| UI-vy (lista, filtrering, skeleton, tom-state) | 1 |
| Integration i befintliga mutations | 0.5 |
| **Totalt** | **2 sessioner** |

---

## Öppna frågor

1. **Ska automatiska händelser loggas?** T.ex. "Systemet skickade automatisk påminnelse till 12 deltagare" (från Airtable-automationer). Kräver att automationerna skriver till loggtabellen — möjligt men mer komplext.

2. **Hur länge sparas loggen?** Förslag: allt sparas. Ingen radering. Lotta ska kunna gå tillbaka hur långt som helst.

3. **Ska Roger och Lotta se varandras logg?** Förslag: ja, all aktivitet synlig för båda. Aktör-fältet visar vem som gjorde vad.

---

*Detta dokument placeras i `docs/features/FEATURE-ACTIVITY-LOG.md` i React-repot vid Fas 0.*
