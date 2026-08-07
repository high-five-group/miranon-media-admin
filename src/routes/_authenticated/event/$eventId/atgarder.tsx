import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { AtgardsSida } from '@/components/events/atgarder/AtgardsSida';

export const Route = createFileRoute('/_authenticated/event/$eventId/atgarder')({
  staticData: { title: 'Åtgärder' },
  component: AtgarderPage,
});

/**
 * [PROTOTYPE] [S100] Åtgärds-sidan MED event — konvergens-prototyp, variant `a`.
 *
 * HEMVISTEN ÄR ETT MEDVETET AVSTEG från prototype-skillens underform B
 * (`/dev`-familjen), öppet bokfört: UI.md:s egen motivering för att föredra
 * underform A är att prototypen ska "ta spjärn mot resten av appen — riktig
 * header, riktig sidebar, riktig data, riktig täthet". `/dev`-routerna ligger
 * UTANFÖR `_authenticated` och saknar därmed AppShell, TabBar och
 * router-context-DI:n — precis det vakuum UI.md varnar för. Åtgärds-sidan
 * saknar en befintlig sida att bäddas in i (rimlighetskontrollen är gjord:
 * den är per definition en egen yta, och underlaget § 9 föreskriver "egna
 * filer och egen route"), så den byggs på sin RIKTIGA route under
 * `_authenticated` med DEV-grindad växlare.
 *
 * Routen är prototyp under hela passet. Det skarpa bygget skrivs OM genom
 * spec-ledet (throwaway-kontraktets klausul iv) — denna kod befordras aldrig.
 *
 * TVÅ TILLSTÅND, INTE TVÅ SIDOR: syskonet `/atgarder` renderar SAMMA komponent
 * i tomt läge. Formen är ärvd verbatim ur manuell anmälan-sidan (task-18.18,
 * S83 pass 4-facit; Linear `linear.app/new` + `/team/LIN/new`, Rails
 * `/parent/:id/children/new`).
 */
const PROTO_VARIANTS = [{ key: 'a', label: 'A — Hubben', steg: 1, stegLabel: 'Konvergens' }];

function AtgarderPage() {
  const { eventId } = Route.useParams();
  return (
    <>
      <AtgardsSida eventId={eventId} />
      {import.meta.env.DEV ? <PrototypeSwitcher variants={PROTO_VARIANTS} /> : null}
    </>
  );
}
