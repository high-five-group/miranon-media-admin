# ADR-014: `create-registration` Edge Function måste vara idempotent

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, implementeras i Fas 6c)
- **Fas:** 6c (Registrations + Väntelista)

## Kontext

`docs/reference/data-model.md §F.4` dokumenterar en känd dubblettbug: när användaren klickar "Lägg till anmälan" och nätverket är långsamt eller request:en time:ar ut innan svar, kan ett andra klick resultera i två Registration-records för samma person+event-kombination. I Vue-versionen (miranon-media-os) löstes detta tyst med en client-side debounce + en post-create unique-constraint-check.

I React-bygget med operations-baserat API + TanStack `useMutation` + optimistic UI är problemet annorlunda:
- TanStack retryMutationsByDefault är `false`, men nätverkstimeout + manuell retry är fortfarande möjligt
- Optimistic UI flippar status omedelbart → användaren tror "klart", klickar igen om hen tappar tron
- Mobil-användning (Lotta i mötet med 4G/spotty Wi-Fi) ökar incidensraten

Per A5-klassningen (P1-sessionsdok Del 3): `createRegistration` deployas i Fas 6c. Idempotency-strategin måste vara på plats *vid deploy*, inte som efter-fix. Fas A:s INVARIANT-mönster (M5) säger att server-side runtime-assertions ska fast-fail vid kontraktsbrott — dubblett är kontraktsbrott.

## Beslut

`create-registration` Edge Function implementeras med **idempotency-nyckel-strategi** baserad på client-genererad UUIDv7 (eller equivalent monotont stigande UUID):

**Klient-side:**
- `useCreateRegistration` mutation genererar `idempotencyKey: crypto.randomUUID()` *före* mutation skickas
- Nyckeln passeras i request-body (eller header `Idempotency-Key`)
- Vid retry återanvänds samma nyckel — TanStack `mutationKey: ['create-registration', idempotencyKey]`

**Server-side (`create-registration` EF):**
- INVARIANT-check: `idempotencyKey` är obligatorisk, returnerar 400 om saknas
- Lookup mot Airtable (eller cache-tabell post-Fas E): finns nyckeln redan?
  - **Ja** → returnera tidigare Registration-record (200, inte 201)
  - **Nej** → skapa Registration + lagra nyckeln med 24-timmars TTL
- Vid race condition (två requests samtidigt med samma nyckel): Airtable unique-constraint på nyckeln fångar duplikatet, andra requesten returnerar tidigare record

**Lagring av idempotency-nycklar (Airtable-fas):**
- Egen `Idempotency Keys`-tabell i Airtable-basen (skapas i Fas B Airtable-hardening eller Fas 6c Code-prompt — båda alternativen acceptabla)
- Schema: `key` (unique), `target_record_id`, `created_at`, `ttl_expires_at`
- Cleanup: dygnsvis cron som tar bort `ttl_expires_at < NOW()` (Fas 7 deploy-pipeline)

**Lagring post-Fas E (Supabase-target):**
- `idempotency_keys`-tabell med `UNIQUE INDEX ON (key)` + `pg_cron`-baserad cleanup
- ADR uppdateras post-Fas E (eller ny ADR superseding denna)

## Alternativ som övervägdes

**Alt 1 — Server-side dedup baserat på `(person_id, event_id)` istället för idempotency-nyckel.** Avvisat: vissa kombinationer av person+event ska tillåta flera registrations (waitlist-konvertering, ångrad → ny registrering). Composite-key som dedup-bas blockerar legitima fall.

**Alt 2 — Client-side debounce (Vue-versionens lösning).** Avvisat: debounce löser bara dubbel-klick, inte nätverkstimeout + retry. Lotta-användning på 4G ger båda symptomen.

**Alt 3 — TanStack `mutationKey` ensam, ingen server-side dedup.** Avvisat: TanStack-cache rensas vid sidladdning. Användaren kan ladda om sidan mellan första och andra klicket → klient-cache hjälper inte. Dessutom: optimistic UI rollback efter dubblett-skapande är komplext. Server-side INVARIANT-fast-fail är robustare.

**Alt 4 — Defer:a idempotency till Fas E (Postgres-baserad).** Avvisat: dubblett-buggen är aktiv idag i Airtable-versionen. Fas 6c utan idempotency reproducerar Vue-buggen i React. Defer:ar en fix som krävs nu.

## Konsekvenser

**Positiva:**
- Dubblett-buggen från `data-model.md §F.4` löses i Fas 6c när create-registration EF deployas — inte tyst i klient-debounce.
- Mönster-etablerande för andra mutationer som riskerar dubbletter (close to none idag, men `createPerson`-tillägg i Fas 6a kan behöva samma behandling).
- INVARIANT-check ger fast-fail-loggning av missande idempotency-keys → catch tidiga klient-buggar.

**Negativa:**
- Extra Airtable-tabell med cleanup-cron att underhålla. Mitigation: tabellen är simpel (4 fält) + cleanup är en cron-funktion. Fas 7 deploy-pipeline tar hand om den.
- 24-timmars TTL kan vara fel siffra för långa Lotta-arbetspass. Mitigation: TTL är konfigurerbar per environment, kan justeras post-deploy om empirisk data visar att 24h är för kort.
- Klient måste komma ihåg idempotency-nyckel mellan retries → kräver lokal lagring eller TanStack `mutationKey`-bas. Fas 5.5:s mutation-mall (ADR-016) dokumenterar mönstret så Fas 6c följer mall, inte återuppfinner.

**Verifiering:**
- `tests/api/createRegistration.spec.ts` har 3 scenarier:
  1. Lyckad första request → 201 + Registration-record
  2. Identisk request med samma idempotencyKey → 200 + samma Registration-record (inte 201, inte ny)
  3. Race-test (två parallella requests, samma nyckel) → en får 201, andra får 200 + samma record
- DoD-punkt i Fas 6c: "createRegistration är idempotent — verifierat med tre scenarier ovan, alla gröna."
