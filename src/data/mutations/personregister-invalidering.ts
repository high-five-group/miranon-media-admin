import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

/**
 * INVALIDERINGEN AV PERSONREGISTRET (TASK-286.4, ADR-123 beslut 6).
 *
 * `PersonsList` läser HELA registret EN gång (`queryKeys.persons.register`)
 * och söker/sorterar/paginerar i minnet på den laddade arrayen. Utan en
 * uttrycklig invalidering per skrivväg byts dagens irritation (skelett vid
 * varje tecken) mot ett tystare och värre fel — ADR-123 beslut 6, ordagrant:
 * *"listan visar aldrig nya personer"*. Därför är ordningen i kortet
 * tvingande: invalideringen byggs och bevisas FÖRST, `staleTime` höjs sedan.
 *
 * ── VARFÖR ROT-NYCKELN (`persons.all`), INTE `persons.register` ENSAM ──
 *
 * `persons.all` (`['persons']`) är prefixet `register`, `detail` och `notes`
 * delar; `invalidateQueries` prefix-matchar som default (`exact: false`), så
 * ETT anrop träffar alla tre. Det är MEDVETET bredare än AC:ns ord
 * "registernyckeln", av samma skäl som `activityLog.all` och
 * `attachments.all` redan är breda i `queries/keys.ts`: VILKEN av personens
 * grenar en Airtable-formel-/rollup-ändring råkar slå igenom i vet bara
 * servern, och att gissa det klient-side vore fel. Nyckeln behölls
 * uttryckligen av TASK-286.3 för just denna användning (se dess docblock i
 * `queries/keys.ts`).
 *
 * Kostnaden är nära noll: `invalidateQueries` refetchar bara AKTIVA
 * (monterade) frågor. Samtliga skrivvägar nedan bor på ytor där
 * `PersonsList` per konstruktion är omonterad (eventsidan, persondetaljen),
 * så registret markeras stale och hämtas om först vid nästa besök.
 *
 * ── SVEPETS TRÄFFYTA (AC #1) ──
 *
 * Svepet gick över hela skrivytan, inte bara `src/data/mutations/`:
 * operations-allowlisten (`supabase/functions/_shared/field-allowlists.ts`,
 * den auktoritativa kartan över VILKEN tabell och VILKA fält varje operation
 * får skriva), adapter-kontraktets skrivmetoder och samtliga
 * `useMutation`-anrop under `src/`.
 *
 * Registrets synliga yta, mätt mot `get-persons/index.ts`:
 *   · MEDLEMSKAP: `BAS_FILTER = '{Antal anmälningar (totalt)} > 0'` (rollup
 *     över Anmälningar) — en person ENTRAR registret när hon får sin första
 *     anmälan.
 *   · RENDERAT av listan: `namn`, `email`/`telefon`, `senasteInteraktion`,
 *     `dagarSedanSenaste`, `harAktivAnmalan`.
 *   · SÖKBART: `namn`, `email`, `telefon`, `ort` (rollup över Anmälningar).
 *
 * TRÄFFAR (invaliderar — alla anropar denna funktion i `onSuccess`):
 *   1. `useCreateRegistration`   create-registration → Anmälningar (CREATE).
 *      Medlemskapet självt, plus `harAktivAnmalan`, `senasteInteraktion`,
 *      `ort`. Se A2-noten nedan.
 *   2. `useUpdatePersonNote`     update-person-note → Personer.`Anteckningar`
 *      — ett fält register-payloaden bär (`mapPerson`).
 *   3. `useUpdatePersonFlag`     update-person-flag → Personer.`Flagga`.
 *      Den enda ANDRA skrivningen mot Personer-tabellen. Fältet ligger i dag
 *      UTANFÖR `mapPerson` (registret bär `manuellFlagga` ur det döda
 *      `Manuella flagga`), så invalideringen är i dag utan synlig effekt —
 *      den finns för att AC #1 säger "alla person-ändrande skrivvägar", och
 *      för att flaggan är på väg mot listan (S103, Marcus: *"som sedan blir
 *      en flaggikon på personen då möjligtvis"*). Kostnaden är noll.
 *   4. `useSetAttendanceStatus`  create-attendance / set-attendance-status →
 *      Deltaganden. Driver `antalDeltaganden` och deltagandegrenen i
 *      `Senaste interaktion (text)`/`(datum)` — RENDERADE fält.
 *   5. `useRelinkRegistration`   relink-registration → Anmälningar.`Event`/
 *      `EventKey`. Byter vilket event anmälan hänger på och kan därmed
 *      flippa `Har en aktiv anmälan?` (RENDERAT) och `ort` (SÖKBART).
 *
 * SVEPTA MEN UTANFÖR (rör ingen registeryta — bokförda så de inte behöver
 * svepas om):
 *   · `registrationConfirmation` sätter Anmälningar.`Status` till
 *     'Bekräftad (mail skickat)'. `Är aktiv (1/0)` är
 *     `IF({Status}="Avbokad/Ombokad", 0, 1)` (data-model.md §Kända fällor 27)
 *     — bekräftelsen flippar den inte, och inget annat registerfält beror på
 *     `Status`.
 *   · `registrationPayments` (Anmälningsavgift/Slutbetalning/noteringar),
 *     `registrationLodging` (`Bor över`), `receipts` (Kvitton-tabellen),
 *     `actionEmail`/`svepSend` (datumstämplar: `Deltagarinfo skickad`,
 *     `Påminnelse … skickad`). Inget av fälten når `mapPerson`.
 *   · `useCreatePersonNote` skriver den SEPARATA `Anteckningar`-TABELLEN
 *     (PersonNote), inte Personer-radens `Anteckningar`-fält.
 *   · `useCreateEvent`/`useUpdateEvent`/`useCreateEventNote`, bilage- och
 *     dokumentvägarna, `segment.ts`, `recordActivity` — ingen personyta.
 *   · Touchpoints-grenen i `Senaste interaktion` är oåtkomlig härifrån:
 *     appen LÄSER Touchpoints men skriver dem aldrig (svept över
 *     `supabase/functions/`), de skapas av Airtable-automationerna.
 *
 * ── KÄND KANT, INTE LÖST HÄR: A2:s latens ──
 *
 * `create-registration` sätter MEDVETET INTE Person-länken — den delegeras
 * till automation A2 (`field-allowlists.ts` § create-registration;
 * data-model.md rad 285/388). A2 söker/skapar Personen och länkar anmälan
 * FÖRST några sekunder senare (mätt spann 3,6–6,7 s, data-model.md § A2;
 * A1+A2+A3 inom 22 s, 2026-04-27). Registrets rollup
 * (`Antal anmälningar (totalt)`) fylls därmed EFTER att denna invalidering
 * körts. Invalideringen kan alltså inte i sig göra en helt ny person synlig
 * i samma ögonblick — den markerar registret stale så att nästa besök
 * hämtar om, vilket i praktiken alltid infaller efter A2. Kanten bokförs
 * här öppet i stället för att lappas med en fördröjning eller en
 * omhämtningsslinga: det vore ett arkitekturval, inte en implementation av
 * detta kort.
 */
export function invalideraPersonregistret(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.persons.all });
}
