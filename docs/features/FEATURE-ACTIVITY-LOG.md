# Feature Spec: Aktivitetslogg

*Skapad: 2026-04-05*
*Status: **Levererad — live i prod sedan 2026-08-13 ~18:30*** (Fas 6.5, PRD
[`task-201`](../../backlog/tasks/task-201%20-%20PRD-Aktivitetslogg-Fas-6.5-xAPI.md),
sessionsdok `tasks/sessions/archive/2026-08/2026-08-11-session-105.md` § Del 8 + Paushistorik).
QA (`task-201.10`) + fas-stängning återstår — se `docs/byggplan.md` § Fas 6.5.
*Prioritet: Hög (förtroende-byggande feature)*

> **Rättad 2026-08-14** (docs-drift-rättelse, `docs/byggplan.md` v1.16). Detta
> dokument stod orört sedan 2026-04-05 (`fas 1: domäntransplant`) trots att
> byggplanens § Fas 6.5 pekade hit ("uppdateras i Fas 6.5 efter ADR-beslut")
> och PRD `task-201` antecknade samma korsreferens. Innehållet nedan är
> omskrivet mot FAKTISKT byggd kod (ADR-100 — koden äger beteendet), inte mot
> minnet av planen. Ursprungsplanens Airtable-modell, domänmodell och
> ikon-idé är **superseded** och markerade öppet där de förekom, inte tyst
> raderade.

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

### Princip: Allt som förändrar data. Inget som bara visar data

**Loggas (mutation = relevant) — de NIO kategorierna som faktiskt är byggda**
(`src/data/activityLog/activityTypes.ts` § `ACTIVITY_OBJECT_TYPES`; ordningen
speglar PRD `task-201` användarberättelse 9 ordagrant):

| Kategori | Exempel-verb (svensk visningstext, `sv-SE`) |
|----------|-------------------|
| Betalning | "markerade betalning", "avmarkerade betalning", "uppdaterade noteringen för anmälningsavgiften/slutbetalningen", "antecknade påminnelse om …" |
| Bekräftelse | "bekräftade anmälan" |
| Anmälan | "skapade anmälan" (inkluderar "lade till person" tills person-skapande får egen mutation) |
| Boende | "markerade bor över", "avmarkerade bor över" |
| Mail | "skickade bekräftelsemail", "skickade betalningspåminnelse", "skickade deltagarinformation", "skickade mail", "skickade testmail till sig själv" |
| Kvitto | "skickade kvitto" |
| Eventändring | "uppdaterade eventet" |
| Flagga | "uppdaterade flagga" |
| Anteckning | "antecknade", "uppdaterade anteckning" — se § Integritet nedan |

**Byggs i `TASK-201.15` (skiva under `task-201`, ej landad vid detta dokuments
skrivtillfälle — lova inte det som redan klart):** tre komponent-lokala
skrivvägar upptäcktes ligga UTANFÖR mutationskatalogen och loggar därför
ännu inte — `CreateEventForm.tsx` (skapa event), `SegmentMailCompose.tsx`
(segment-mail) och `SegmentBuilder.tsx` (spara segment). Rotorsaken är
hemvisten (komponent-lokala `useMutation`-anrop är osynliga för den
mekaniska "varje exporterad mutationshook loggar"-invarianten,
`TASK-201.13`) — fixen är extraktion till katalogen + en grind som gör att
klassen inte kan återuppstå.

**Loggas INTE (navigation/visning = brus):** öppna en sida, sortera en
tabell, expandera en meny, filtrera en lista, ändra sidbredd, söka utan att
agera på resultatet.

### Integritet — anteckningar loggar ATT, aldrig innehåll

En anteckningspost visar att Lotta antecknade något (`ANTECKNADE_VERB`/
`UPPDATERADE_ANTECKNING_VERB`) — texten hon skrev finns aldrig i
statementet. Samma disciplin gäller betalningsnoteringens fritext. Detta är
STRUKTURELLT, inte en konvention: verb-funktionerna i `activityTypes.ts` tar
aldrig emot anteckningstexten som parameter, så det finns ingen
anropsplats att läcka innehåll från. Payload-nivå-bevis:
`tests/api/activity-log-luckor-statements.test.ts` § INTEGRITETSVAKTEN
(injicerad läcka fäller testet).

---

## Domänmodell — strikt xAPI, inte den ursprungliga `ActivityEntry`

> **SUPERSEDED.** Ursprungsplanens `interface ActivityEntry` +
> `ActivityCategory`/`ActivityAction`-enumen nedan **byggdes aldrig**. Den
> faktiska formen är ett xAPI 1.0.3-konformt statement — striktare, och
> förberedd för framtida Passionslyftet-konsumtion (Open Badges/adaptiv
> lärning, PRD användarberättelse #15). Den gamla modellen bevaras i denna
> ruta som historisk referens, inte som gällande kontrakt.
>
> ```typescript
> interface ActivityEntry {
>   id: string
>   timestamp: string
>   actor: string
>   category: ActivityCategory
>   action: ActivityAction
>   summary: string
>   context: ActivityContext
> }
> ```

**Faktisk form** (`src/domain/schemas/ActivityStatement.schema.ts`, Zod-validerad
runtime — ett ogiltigt statement når aldrig `activity_log`):

```typescript
// Förenklad — se schemafilen för Language Map, Agent-account-formen m.m.
interface ActivityStatement {
  id: string;               // UUID, genererat av oss (vi ÄR producenten, ingen LRS fyller i det)
  actor: {
    objectType: 'Agent';
    name: string;            // "Lotta" / "Roger" / "Marcus" — svenskt visningsnamn
    account: { homePage: string; name: string }; // Supabase auth-UUID, INTE mailto (dataminimering)
  };
  verb: { id: string; display: Record<string, string> };       // IRI + { 'sv-SE': '…' }
  object: {
    objectType: 'Activity';
    id: string;              // IRI för den SPECIFIKA entiteten (t.ex. en anmälan)
    definition: { name: Record<string, string>; type: string }; // svenskt namn + kategori-IRI
  };
  context: {
    extensions: {
      // ADR-111: requestId ÄR korrelations-ID:t, inget separat trace_id
      'https://admin.miranon.dev/xapi/extensions/requestId': string; // obligatorisk
      'https://admin.miranon.dev/xapi/extensions/eventId'?: string;  // valfri, navigeringsmål
      'https://admin.miranon.dev/xapi/extensions/personId'?: string; // valfri, navigeringsmål (TASK-201.12)
    };
  };
  timestamp: string; // ISO 8601 med offset
}
```

**Vad som medvetet INTE modellerats:** `result` (ingen scoring — adaptiv
lärning är Passionslyftets jobb), `stored`/`authority` (satta av en LRS; vi
är inte en fullständig LRS), `attachments`, samt flera spec-optionella
`context`-fält (`registration`/`instructor`/`team`/`contextActivities`/
`platform`/`language`/`statement`) — ingen spekulativ modellering av fält
utan faktisk konsument (schemafilens eget filhuvud).

### Exempel på loggposter (Lottas vy — sammanfattningsformen)

| Tid | Rad (aktör + händelse + objekt) |
|-----|---------------|
| nyss | **Lotta** markerade betalning · Anna Andersson (Fjärrskådning 2) |
| för 4 min sedan | **Lotta** registrerade närvaro¹ · Erik Holm, Medveten Kontakt |
| för 22 min sedan | **Roger** skickade bekräftelsemail · Sara Björk, Medveten Kontakt |
| 09:15 | **Lotta** antecknade · Maria Svensson |

¹ Illustrativt — "registrerade närvaro" ingick i ursprungsplanens kategorilista men har ingen egen mutation i dag och loggas därför inte ännu; se § Vad som loggas för den faktiska, byggda listan.

---

## Hur det byggs — arkitektur (faktisk, inte ursprungsplanens)

### Lagring: Supabase `activity_log`, INTE Airtable

> **SUPERSEDED.** Ursprungsplanens Airtable-tabell "Aktivitetslogg" med fält
> Tidpunkt/Aktör/Kategori/Händelse/Sammanfattning/Person/Event/… **byggdes
> aldrig**. Beslutet föll på Supabase direkt — se
> [ADR-110](../decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md).

Tabellen `activity_log` (Postgres, migration
`supabase/migrations/20260811211759_create_activity_log.sql`) finns i BÅDA
miljöerna (staging + prod). Den bär både det HELA xAPI-statementet (`jsonb`,
LRS-fidelity för en framtida Passionslyftet-konsument) och dekomponerade,
indexerade kolumner för de faktiskt scopade läsvägarna (`actor_name`,
`verb_id`/`verb_display`, `object_id`/`object_type`/`object_name`,
`request_id`, `occurred_at`, …).

**Skälen, mätta (ADR-110):**

1. **Append-only-volymen mot Airtables radtak.** ~11 mutationstyper ×
   daglig användning ⇒ uppskattat 20 000–70 000 loggrader/år — en evigt
   växande, aldrig raderad logg är en strukturell risk mot BEFINTLIG data i
   samma Airtable-bas, inte bara mot loggen själv.
2. **Enklare skrivväg.** En Postgres-`insert` i EF:ns efterspel i stället för
   ett Airtable-API-anrop (delat rate-limit 5 anrop/sekund per bas) i
   varenda mutations write-path.
3. **Migrationsmotivet.** En framtida Fas E-migration till Supabase behöver
   inte "återmigrera" en Airtable-tabell som redan var en tillfällig
   omväg.

Ingen ändring i övriga Airtable-basen krävs eller görs — `docs/byggplan.md`
§ Milstolpe Airtable-bas-maximering tillför noll interaktioner från Fas 6.5
(amenderat v1.15).

### Skrivvägen: `recordActivity` → `log-activity`-EF → `activity_log`

```text
┌─────────────┐   onSuccess    ┌───────────────────┐   POST     ┌──────────────┐
│  Mutation-   │ ─────────────→│  recordActivity()  │ ──────────→│ log-activity │
│  hooken      │  (fire-and-   │  bygger + Zod-      │  (service   │  Edge Func   │
│  (t.ex.      │   forget)     │  validerar statement│   role)     │  → insert    │
│  markera-    │                └───────────────────┘             └──────┬───────┘
│  betald)     │                                                          │
└─────────────┘                                                          ▼
                                                                   activity_log (Postgres)
```

**Fire-and-forget är kontraktet, inte en optimering** (`recordActivity.ts`
filhuvud): en fallerad loggning får ALDRIG fälla Lottas faktiska mutation —
varje fel fångas och loggas till konsolen, `recordActivity` kastar aldrig.
Anropas alltid från en mutations `onSuccess`, aldrig från `mutationFn`.
`queryClient` är en OBLIGATORISK DI-parameter (`TASK-210`) — den invaliderar
hem-spaltens cache direkt efter en lyckad loggning, så Lotta ser sin egen
handling utan att vänta ut appens globala 5-minuters `staleTime`.

Write sker ENDAST via `service_role` i EF:en `log-activity` — RLS är
deny-all för `anon`/`authenticated` (bevisat i
`tests/api/activity-log-rls.staging.test.ts`: 401 på både läsning och
skrivning direkt mot tabellen).

### Läsvägen: `get-activity-log`-EF, cursor-paginerad

Ny EF under EF-ribban (SECURITY-SPEC §6.10): keyset-cursor
(`occurred_at`+`id`, samma codec-mönster som `get-persons`), filter på
`category` (object-type-IRI), `eventId` och `from` (ISO-tidsstämpel).
Klientsidan konsumerar den via `useActivityLogHistory`/`useLatestActivity`
(`src/data/queries/useActivityLog.ts`) genom adaptern
(`fetchActivityLog`) — samma åtkomstprecedens som `PersonsList`/`MailLog`.

### Korrelation: `requestId`, inget `trace_id`

[ADR-111](../decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md):
`requestId` (Fas A M7:s etablerade klient→EF→server-mönster) är
aktivitetsloggens ENDA korrelations-ID, buret i
`context.extensions` under en dedikerad IRI. Inget separat `trace_id`
införs — mätt grund: varje användaråtgärd i dag är exakt EN mutation → EN
EF-anrop, så ett andra ID vore en redundant kolumn.

---

## Hur Lotta ser det — UI (faktiskt byggd form)

### Två ytor, inte en menyflik

> **SUPERSEDED.** Ursprungsplanens "egen vy i menyn under Vardagsgruppen:
> 'Historik' (med Clock-ikon)" blev två samverkande ytor i stället för en
> fristående menyflik — facit-styrt (nedan), inte en fri UI-design.

**1. Hem-spaltens "Senaste aktivitet"** (`src/components/hem/
SenasteAktivitet.tsx`, `TASK-201.7`) — synlig ENDAST på ≥xl (bredare
skärmar); mobil/platta ser den aldrig, per facit-prototypens eget villkor.
Fyra rader, bottenlinjerad med anmälningskortet, avslutas med länken "Se all
aktivitetshistorik ›".

**Facit-styrd, inte fritt designad** —
[ADR-102](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
B1/B5: prototypens låsta K10-form är den auktoritativa specen, inte denna
dok eller en AC-text. Manifest:
`tasks/sessions/archive/bilagor/s55-hem-konvergens/facit.json` (arkiverat
2026-08-16, superseded av `s102-hem-konvergens` vid Morgonkoll-promoveringen
TASK-243.1; godkännandet nedan är historik), godkänt av Marcus
**2026-08-13** ("Hem-spalten godkänd mot k10-facit 2026-08-13"), med ETT
bokfört undantag: separatorn i raderna är mittpunkt `·`, inte facit-bildens
långa tankstreck (Marcus-order 2026-08-12 — långa bindestreck är förbjudna i
användarsynlig text, undantaget accepterat i förväg).

**2. Fulla aktivitetshistoriken** (`/mer/aktivitetshistorik`,
`src/components/aktivitetshistorik/AktivitetsHistorik.tsx`, `TASK-201.6` +
filterraden `TASK-201.8`) — global, cursor-paginerad, tidsgrupperad
("Idag"/"Igår"/långdatum) lista med **filterrad** ovanför: kategori (Select,
de nio kategorierna), event (Select) och tidsperiod (ToggleButtonGroup:
Idag/7 dagar/30 dagar/Allt) — filtren är URL-state (`?kategori`/`?event`/
`?tidsperiod`) och server-side (via `get-activity-log`-EF:ens egna
parametrar, inte ett klient-array-filter). Nås via **Mer** på mobil/platta
(`NavCard` i `/mer/`-indexet) och via hem-spaltens länk på desktop.

### Ikoner: superseded av facit

> **SUPERSEDED.** Ursprungsplanens "Kategori-ikon (kreditkort för betalning,
> brevikon för mail, etc.)" per rad **byggdes inte** och byggs inte.
> Facit-bilden bär inga ikoner i historikraderna, och ADR-102 B1
> ("prototypen ÄR facit … vid motsägelse mellan prototyp och kravtext
> vinner prototypen, och kravtexten är buggen") avgör frågan: FEATURE-dokens
> gamla ikonidé viker för facit. Raderna bär i stället aktör + händelse +
> objekt i löpande text (se § Sammanfattnings-form nedan).

### Navigering

En rad med känt `eventId` eller `personId` (buret i statementets
`context.extensions`) är klickbar och leder till eventet respektive
personen (PRD användarberättelse 8). Saknas extensionen renderas raden
olänkad, ärligt — ingen gissning via namnmatchning.

### Filtrering (den byggda formen)

Kategori (nio värden, se § Vad som loggas), event (dropdown över befintliga
event) och tidsperiod (Idag / 7 dagar / 30 dagar / Allt). Ingen fritextsökning
— Lotta ska kunna svara på "vad gjorde jag igår?" med max ett klick, precis
som ursprungsplanens intention, fast realiserad som URL-bara filter i
stället för en fri sökruta.

### Tomlägen

Två skilda tomlägen, inte ett: **första gången** (ingen aktivitet alls) —
"Ingen aktivitet ännu. Här kommer du snart se allt du gör i appen:
betalningar, bekräftelser, mail och mer. Allt sparas automatiskt, så du
aldrig behöver undra vad som hände." — och **filtrerat nollresultat** —
"Inga träffar med det filtret" + en "Rensa filter"-knapp. Samma
Lotta-vänliga ton som ursprungsplanen efterfrågade, uppdelad efter faktiskt
orsak i stället för en generisk text.

### Laddläge

Lugnt laddläge (DESIGN-SYSTEM-SPEC §15) — skeleton-block i radernas
slutgeometri, inget "Laddar…", ingen spinner. Samma princip som
ursprungsplanens "tre fade-in-rader", fast app-standardformen i stället för
en feature-specifik variant.

---

## Sammanfattnings-form — löpande text, inte en generator-tabell

> **SUPERSEDED.** Ursprungsplanens `logActivity()`-mönstertabell per
> kategori+action beskrev ett adapter-internt sammanfattnings-mönster som
> aldrig byggdes i den formen. Den faktiska raden är **aktör (medium) +
> händelsens `sv-SE`-displaytext + mittpunkt + objektets `sv-SE`-namn**,
> renderad direkt från statementets `verb.display`/`object.definition.name`
> (`AktivitetsRad`-komponenten) — ingen separat sträng-genererande funktion,
> statementet BÄR redan den färdiga svenska texten från skrivvägen
> (`activityTypes.ts`s verb-konstanter).

---

## Var i fasplanen

Byggd som **Fas 6.5** (`docs/byggplan.md` § Fas 6.5), efter Fas 6
(Hem/Event/Personer/Mer) — samma placering ursprungsplanen förutspådde.
Status: **🟡 PÅGÅR** — live i prod sedan 2026-08-13 ~18:30, QA
(`task-201.10`) och fas-stängning återstår; ✅ KLAR sätts vid fas-avslutets
`phase-end-verify`, inte i detta dokument.

Sjutton skivor under PRD `task-201` (grunden, tracer bullet, instrumentering,
läsväg, kärnvy, hem-spalten, filterrad, prod-driftsättning, QA, personId-
extensionen, luckskivorna, samt de två som byggs vidare: `TASK-201.15`
skrivvägs-extraktionen och `TASK-201.16` e2e-skarven) — se PRD-kortet för
fullständig lista och status.

---

## Öppna frågor — svarade, uppdaterat mot ursprungsplanens tre

1. **Ska automatiska händelser (Airtable-automationer) loggas?** Fortsatt
   ÖPPEN — utanför `task-201`s omfattning (ingen skrivväg från automationer
   in i `activity_log` finns eller är planerad).
2. **Hur länge sparas loggen?** BESLUTAD: allt sparas, ingen radering —
   PRD `task-201` § Utanför omfattningen bekräftar ursprungsplanens förslag.
   Ingen retroaktiv backfill: loggen börjar vid driftsättning
   (2026-08-13), händelser innan dess har ingen källa.
3. **Ska Roger och Lotta se varandras logg?** BESLUTAD: ja — PRD
   användarberättelse 12 ("Som Roger vill jag se samma historik som
   Lotta"). All aktivitet synlig för båda; aktör-fältet visar vem som
   gjorde vad.

---

*Detta dokument placerades ursprungligen i `docs/features/FEATURE-ACTIVITY-LOG.md` vid Fas 0 (2026-04-05) och uppdaterades till byggd form 2026-08-14 (docs-drift-rättelse, `docs/byggplan.md` v1.16).*
