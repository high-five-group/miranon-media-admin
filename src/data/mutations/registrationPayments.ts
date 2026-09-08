/**
 * Betalnings-identiteten och dess läsbara etikett (facit-språket — även
 * mailto-ämnesraden).
 *
 * [RIVET, TASK-435, 2026-09-08] Arbetsytans TVÅ MUTATIONER som stod här
 * (`useSetPaymentStatus`/`useUpdatePaymentNote`, task-18.8, ADR-016
 * fem-komponents-mönster, `TAKTVAKT_SCOPE` m.m.) är rivna tillsammans med
 * Åtgärds-sidans betalningsblock (`BetalningsSkrivYta`,
 * `src/components/events/atgarder/AtgardsSida.tsx`) — deras enda anropare.
 * Betalningar hanteras numera uteslutande på betalningssidan (inkorg +
 * bekräftelsesteg, PRD `TASK-402`); noteringar skrivs i
 * registreringsformuläret (`RegistreraForm.tsx` § NOTERINGSFÄLTET). Se
 * `docs/decisions/ADR-128-*.md` § Updates 2026-09-08 för hela historien.
 * Historiken finns kvar i versionshanteringen.
 *
 * RIVEN SEDAN TIDIGARE (TASK-201.18, Marcus-mandat 2026-08-14): en tredje
 * mutation, `useLogPaymentReminder` (log-payment-reminder), skrev de två
 * ADDITIVA per-betalnings-tidsstämpelfälten från ett mailto-klick.
 * Konsumenten (Betalningar.tsx) revs redan i TASK-145.6 — mailto-eran är
 * över. Fälten den skrev (`paminnelseAnmalningsavgiftSkickad`/
 * `paminnelseSlutbetalningSkickad`) LÄSES fortfarande på flera ställen
 * (historiskt värde) och är orörda.
 */

/** Betalnings-identiteten i arbetsytan: anmälningsavgiften eller slutbetalningen. */
export type Betalning = 'avgift' | 'slut';

/** Läsbar etikett per betalning (facit-språket — även mailto-ämnesraden). */
export const BETALNING_LABEL: Record<Betalning, string> = {
  avgift: 'Anmälningsavgift',
  slut: 'Slutbetalning',
};
