import type { Registration } from '@/domain/models/Registration';
import type { ActionSkipReason, SendActionEmailResult } from '@/domain/schemas';

/**
 * [TASK-241.3] Åtgärdsutskickens VERKLIGA-utfall-mappning — extraherad
 * VERBATIM ur `AtgardsSida.tsx` (oförändrad logik), samma "ren flytt"-mönster
 * som `atgardsmallar.ts` (TASK-241.2 § docblock): sändytans nya sändväg
 * (`src/data/mutations/svepSend.ts`, AC #2) behöver EXAKT samma
 * server-svar-till-svensk-text-mappning som `GranskningsSida.skicka()`
 * redan bär — en andra kopia av `SKAL_*`-konstanterna hade varit precis den
 * kopierings-drift `~/.claude/CLAUDE.md` § Instruktioner varnar för.
 *
 * REN FLYTT, INGEN BETEENDEÄNDRING: `AtgardsSida.tsx` importerar nu allt
 * härifrån i stället för att definiera det lokalt (samma exporterade namn,
 * samma implementation, samma docblock-motiv som innan flytten).
 */

/* ================== VERKLIGT SERVER-UTFALL → UI-FORM ==================
 * DE FYRA KLASSERNA ÄR SERVERNS, INTE VÅRA (`ADR-067` D3, ORDLISTA §
 * Delutfall): `sent` alla gick fram · `partial` delutfallet · `failed` ingen
 * gick fram · `skipped` ingen fanns kvar efter serverns filter. Sedan
 * TASK-147.3 (alla fyra åtgärdstyper skickar verkligt) är servern den ENDA
 * källan till klassen — se `verkligtUtfallTillUtfall` nedan.
 * ================================================================== */
const SKAL_INGEN_EPOST = 'Saknar e-postadress';

export type Utfall = {
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  lyckade: Registration[];
  fallna: { reg: Registration; skal: string }[];
};

/** Svenska skäl för serverns skip-koder (`ActionSkipReason`) — samma tre koder
    `_shared/confirm-registrations.ts`s golv-lista redan bär, se `SendActionEmail.
    schema.ts`s docblock för varför enumen ändå är EGEN och inte återanvänd. */
const SKAL_REDAN_BEKRAFTAD = 'Redan bekräftad';
const SKAL_INAKTIV = 'Anmälan är inte längre aktiv';

export function skalForSkip(reason: ActionSkipReason): string {
  switch (reason) {
    case 'no_email':
      return SKAL_INGEN_EPOST;
    case 'already_confirmed':
      return SKAL_REDAN_BEKRAFTAD;
    case 'inactive':
      return SKAL_INAKTIV;
    default:
      // Uttömmande switch — en framtida ActionSkipReason-utökning fäller
      // detta i typecheck (never-tilldelningen), inte tyst i runtime.
      return reason;
  }
}

/**
 * [TASK-147.2/147.3] VERKLIGT utfall → samma `Utfall`-form den nu rivna
 * `simuleraUtfall` en gång byggde — resultatlägets rendering (`UtfallsKort`,
 * `MessageBox`-sammanfattningen) är DÄRMED OFÖRÄNDRAD sedan prototyp-eran,
 * bara källan bytt (server i stället för minne).
 *
 * Servern svarar med registration-ID:n (`completed`/`skipped`/`failed`), inte
 * `Registration`-objekt (SCOPE-KÄRNAN: mottagaren löses server-side och
 * kommer aldrig tillbaka till klienten som andra fält än ID:t). `byId` slår
 * upp mot urvalet SOM SKICKADES — ett ID servern nämner men som saknas i
 * kartan (borde vara omöjligt: EF:en validerar `registrationId` mot exakt de
 * ID:n klienten skickade) filtreras tyst bort i stället för att krascha
 * rendering — samma försiktighet som `verkligtUtfallTillUtfall`s anropare
 * redan visar mot serverdata den inte kan garantera formen på.
 *
 * PER-GRUPP ÅTERANVÄNDNING (TASK-241.3): sändytans svep anropar denna
 * funktion EN gång per event-grupp (ett `SendActionEmailResult` per anrop,
 * ADR-114 beslut 3) — samma signatur, ingen ändring behövdes för att bära
 * det cross-event-fallet, eftersom `result`/`mottagare` redan är
 * grupp-scopade av anroparen.
 */
export function verkligtUtfallTillUtfall(
  result: SendActionEmailResult,
  mottagare: Registration[],
): Utfall {
  const byId = new Map(mottagare.map((r) => [r.id, r] as const));
  const lyckade = result.completed
    .map((id) => byId.get(id))
    .filter((r): r is Registration => r != null);
  const fallna: { reg: Registration; skal: string }[] = [
    ...result.skipped.flatMap(({ registrationId, reason }) => {
      const reg = byId.get(registrationId);
      return reg ? [{ reg, skal: skalForSkip(reason) }] : [];
    }),
    ...result.failed.flatMap(({ registrationId, reason }) => {
      const reg = byId.get(registrationId);
      return reg ? [{ reg, skal: reason }] : [];
    }),
  ];
  return { status: result.status, lyckade, fallna };
}
