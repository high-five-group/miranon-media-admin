import { createFileRoute } from '@tanstack/react-router';
import { AtgardsSida } from '@/components/events/atgarder/AtgardsSida';

export const Route = createFileRoute('/_authenticated/event/$eventId/atgarder')({
  staticData: { title: 'Åtgärder' },
  component: AtgarderPage,
});

/**
 * Åtgärds-sidan MED event. PRODUKTIONSKOD sedan TASK-171.5 (ADR-103 B2 steg
 * 4) — Marcus godkännande (2026-08-09, tasks/sessions/bilagor/
 * s93-atgardssida-promovering/facit.json, citat "Ser bra ut, godkänner") gör
 * varv 4-formen den enda och permanenta, inte en konvergens-variant under
 * bedömning.
 *
 * HEMVISTEN VAR ETT MEDVETET AVSTEG från prototype-skillens underform B
 * (`/dev`-familjen), öppet bokfört: UI.md:s egen motivering för att föredra
 * underform A är att prototypen ska "ta spjärn mot resten av appen — riktig
 * header, riktig sidebar, riktig data, riktig täthet". `/dev`-routerna ligger
 * UTANFÖR `_authenticated` och saknar därmed AppShell, TabBar och
 * router-context-DI:n — precis det vakuum UI.md varnar för. Åtgärds-sidan
 * saknade en befintlig sida att bäddas in i (rimlighetskontrollen gjordes:
 * den är per definition en egen yta, och underlaget § 9 föreskriver "egna
 * filer och egen route"), så den byggdes på sin RIKTIGA route under
 * `_authenticated` — nu utan DEV-grindad växlare (se rivnings-noten nedan).
 *
 * TVÅ TILLSTÅND, INTE TVÅ SIDOR: syskonet `/atgarder` renderar SAMMA komponent
 * i tomt läge. Formen är ärvd verbatim ur manuell anmälan-sidan (task-18.18,
 * S83 pass 4-facit; Linear `linear.app/new` + `/team/LIN/new`, Rails
 * `/parent/:id/children/new`).
 *
 * [RIVEN, TASK-171.5, ADR-103 B2 steg 4] `PrototypeSwitcher`-monteringen +
 * `PROTO_VARIANTS` (en enda post, `key: 'a'`) rivna efter Marcus
 * godkännande — ingen kod läste `variantParam` (171.1/171.2:s mätta
 * divergens), så borttagningen är ren byggställning, ingen formändring.
 */
function AtgarderPage() {
  const { eventId } = Route.useParams();
  return <AtgardsSida eventId={eventId} />;
}
