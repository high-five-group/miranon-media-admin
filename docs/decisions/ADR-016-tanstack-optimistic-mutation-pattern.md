
# ADR-016: TanStack `useMutation` optimistic-mönster med operations-baserat API

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, implementeras som mall i Fas 5.5)
- **Fas:** 5.5 (Vertikal write-slice)

> **Korrigering (ADR-049, 2026-06-13):** kodexemplets fält-nivå är inaktuell — Fas 5.5:s write-slice skriver `Anmälningsavgift` (operationKey `mark-registration-fee-paid`, värde `'Mottagen'`), INTE `Status`. `Status` (`RegistrationStatus`) saknar betald-värde, så `fields: { Status: ... }`-exemplet var pre-Fas-2.5-drift. Mönstret (fem-komponents optimistic + operations-API) STÅR; endast fält-exemplet rättas. Se [ADR-049](ADR-049-fas-5-5-betalfalt-val.md). Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

Per Fas A M4 är klient → server-API:et **operations-baserat**: klienten skickar `{operationKey, recordId, fields}` (inte `{tableId, ...}`). Server äger operations-registret + fält-allowlist per operation. Källa: `SECURITY-SPEC.md §6.1`, `STATE-STRATEGY.md §8`.

För mutation-flödet i React-bygget krävs ett etablerat mönster för:

1. **Optimistic UI** — status-flip omedelbart vid klick (Lotta väntar aldrig på nätverk)
2. **Rollback vid fel** — när server returnerar 4xx/5xx eller mutation tims out
3. **Cache-invalidering** — TanStack Query måste veta vilka queries som påverkas
4. **Idempotency-stöd** — vissa mutationer (t.ex. createRegistration, ADR-014) kräver client-genererad nyckel
5. **`ARIA-live`-annonsering** — status-flip måste annonseras till skärmläsare
6. **requestId-propagering** — fel-toast visar requestId från Fas A M7

Per A2-beslutet (P1-sessionsdok Del 4): Fas 5.5 etablerar mönstret genom en minimal vertikal slice ("markera anmälan som betald" via befintlig `update-record` EF). Sliceen blir mall för Fas 6:s mutationer (sub-faserna 6a, 6b, 6c, 6e).

Conversion-plan beskrev mutation-mönster med direct-method-anrop (`dataSource.updatePaymentStatus(id, 'paid')`). Detta är pre-Fas-A-arkitektur. Operations-baserat API kräver *omformulerat* mönster.

## Beslut

Etablera **TanStack-optimistic-mönster med operations-baserat API** som referensmall för alla mutationer i Fas 6+. Mönstret består av fem komponenter:

### 1. Mutation-funktion (`mutationFn`)

```ts
mutationFn: async (input: MarkPaidInput) => {
  return dataSource.executeOperation({
    operationKey: 'mark-registration-paid',
    recordId: input.registrationId,
    fields: { Status: 'Bekräftad (mail skickat)' },  // Airtable-shape; target-shape post-Fas E
  });
}
```

Klienten skickar **aldrig** `tableId` eller `airtableFieldName` direkt. Operations-nyckeln är hela kontraktet — server-side allowlist avgör tillåtna fält.

> **Erratum (2026-06-13, ADR-049):** Fält-exemplet ovan (`operationKey: 'mark-registration-paid'`, `fields: { Status: ... }`) är **superseder av [ADR-049](ADR-049-fas-5-5-betalfalt-val.md)**. Fas 5.5:s faktiska write-slice registrerar `operationKey: 'mark-registration-fee-paid'` som skriver fältet **`Anmälningsavgift`** (värde `'Mottagen'`), inte `Status` — `Status` (`RegistrationStatus`) saknar ett betald-värde, så `Status`-exemplet var pre-Fas-2.5-drift. Mönstret (fem-komponents optimistic + operations-API) står kvar; endast fält-exemplet rättas. Historisk text bevarad (öppen rättelse, ej tyst patch).

### 2. `onMutate` — optimistic update + rollback-context

```ts
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: ['registrations', input.eventId] });
  const previous = queryClient.getQueryData(['registrations', input.eventId]);
  queryClient.setQueryData(['registrations', input.eventId], (old) =>
    old.map(r => r.id === input.registrationId ? { ...r, status: 'paid' } : r)
  );
  return { previous };  // Context för rollback
}
```

### 3. `onError` — rollback + toast

```ts
onError: (err, input, context) => {
  if (context?.previous) {
    queryClient.setQueryData(['registrations', input.eventId], context.previous);
  }
  toast.error(`Fel: ${err.message} (requestId: ${err.requestId})`);
}
```

`requestId` propageras från server (Fas A M7) genom `executeOperation`-wrappern → exception → toast.

### 4. `onSettled` — cache-invalidering

```ts
onSettled: (_data, _err, input) => {
  queryClient.invalidateQueries({ queryKey: ['registrations', input.eventId] });
}
```

Invalidering körs alltid (success eller error) — säkerställer att UI synkar mot server-truth även om optimistic update gissade fel.

### 5. `ARIA-live` + komponent-API

```tsx
<MarkPaidButton 
  registrationId={r.id}
  onStatusChange={(newStatus) => announce(`Anmälan markerad som ${newStatus}`)}
/>
```

`announce`-helper är React Aria `useAnnouncer`-baserad (per Fas 3.5 mönsterbibliotek).

### Idempotency-stöd

För mutationer som kräver idempotency (per ADR-014 createRegistration):

```ts
const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

mutationFn: (input) => dataSource.executeOperation({
  operationKey: 'create-registration',
  fields: input,
  headers: { 'Idempotency-Key': idempotencyKey },
})
```

`mutationKey: ['create-registration', idempotencyKey]` — TanStack återanvänder samma key vid retry.

## Alternativ som övervägdes

**Alt 1 — Direct-method på adapter (`dataSource.markPaid(id)`).** Avvisat: bryter operations-baserat API från Fas A M4. Adapter-metoder skulle behöva expandera per use-case → adapter-debt återintroduceras.

**Alt 2 — Pessimistisk UI (vänta på server-svar innan flip).** Avvisat: Lotta-användning på 4G ger 200-500ms latency. Pessimistisk UI = 200-500ms paus per klick. Operativt smärtsamt.

**Alt 3 — Optimistic UI utan rollback-context (refetch on error).** Avvisat: refetch är 200-500ms ny latency vid fel. Användaren ser status flippa, sedan flippa tillbaka — disorienterande. Rollback med saved context är < 16ms.

**Alt 4 — useMutation med `onSuccess` istället för `onMutate`.** Avvisat: `onSuccess` körs *efter* server-respons → inget optimistic. `onMutate` är rätt hook för optimistic.

## Konsekvenser

**Positiva:**

- Mall för Fas 6:s ~6-10 mutationer (markPaid, markAttended, createRegistration, addNote, sendReminder, etc.) — varje mutation är 30-50 rader kod istället för att återuppfinna mönstret.
- Operations-baserat API kvarhålls genomgående — ingen smyg-implementering av direct-method.
- requestId-propagering fungerar automatiskt — ingen mutation kan glömma att visa requestId vid fel.
- `ARIA-live`-annonsering är en del av mallen — a11y inbyggt, inte adderat.

**Negativa:**

- Boilerplate per mutation (5 komponenter) — alternativet är custom hook (`useOperationMutation`) som wrappar mallen. Mitigation: Fas 5.5 bedömer om wrapper-hook är värd extra abstraktionslag eller om explicit mall är pedagogiskt bättre. Beslut tas vid Fas 5.5-implementation, dokumenteras i sessionsdok.
- Optimistic UI-state kan diverga från server vid komplexa cascades. Mitigation: `onSettled`-invalidering korrigerar inom 1 cycle.
- Cache-key-konvention måste vara konsekvent mellan reads och writes. Mitigation: dokumenteras som "[GA]"-bullet i Fas 5.5 + verifierat per-vy i Fas 6.

**Verifiering (Fas 5.5 DoD):**

- 11-punkts-DoD avbockad (per byggplan.md Fas 5.5)
- 3 Playwright-tester gröna (2 deny + 1 allow per Fas A aktiveringsguide)
- Mönstret dokumenterat i sessionsdok som "mall för Fas 6"
- Code-prompt-mall för Fas 6:s mutationer skriven (Fas 5.5 K-N)
